<template>
  <transition name="mpm">
    <div v-if="open" class="mpm" role="dialog" aria-modal="true" aria-label="تعیین آدرس روی نقشه">
      <!-- Search sits on top of the map and stays there. -->
      <div class="mpm__top">
        <button type="button" class="mpm__close" aria-label="بستن نقشه" @click="close">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
          </svg>
        </button>
        <div class="mpm__search">
          <input
            v-model="query"
            type="search"
            class="mpm__search-input"
            :placeholder="searchPlaceholder"
            :disabled="!searchEnabled"
            aria-label="جستجوی آدرس"
            autocomplete="off"
            @input="onQueryInput"
            @keydown.enter.prevent="searchNow"
          />
          <ul v-if="results.length" class="mpm__results">
            <li v-for="(item, i) in results" :key="i">
              <button type="button" @click="pick(item)">{{ label(item) }}</button>
            </li>
          </ul>
          <p v-else-if="searched && !searching && query.trim().length > 1" class="mpm__noresult">
            {{ regionOnly ? 'در قائن و اطراف نتیجه‌ای پیدا نشد.' : 'نتیجه‌ای پیدا نشد.' }}
            <button v-if="regionOnly" type="button" class="mpm__link" @click="widenSearch">جستجو در همه جا</button>
          </p>
        </div>
      </div>
      <p v-if="searchEnabled" class="mpm__scope">
        <template v-if="regionOnly">جستجو فقط در قائن و اطراف.
          <button type="button" class="mpm__link" @click="widenSearch">جستجو در همه جا</button>
        </template>
        <template v-else>جستجو در همه جا.
          <button type="button" class="mpm__link" @click="narrowSearch">فقط قائن و اطراف</button>
        </template>
      </p>

      <div ref="mapEl" class="mpm__map" :class="{ 'mpm__map--moving': moving }"></div>

      <!-- The pin never moves; the map slides underneath it. Its tip is the
           exact centre of the map. -->
      <div class="mpm__pin" :class="{ 'mpm__pin--lifted': moving }" aria-hidden="true">
        <svg viewBox="0 0 36 48" width="36" height="48">
          <path d="M18 47C18 47 3 29.5 3 18a15 15 0 0 1 30 0c0 11.5-15 29-15 29z" style="fill: var(--laviz-primary)" stroke="#fff" stroke-width="2" />
          <circle cx="18" cy="18" r="6" fill="#fff" />
        </svg>
        <span class="mpm__pin-dot"></span>
      </div>

      <div class="mpm__fabs">
        <button type="button" class="mpm__fab" aria-label="موقعیت من" title="موقعیت من" @click="useMyLocation">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
        <button type="button" class="mpm__fab" aria-label="نمایش رستوران" title="نمایش رستوران" @click="focusRestaurant">
          <span aria-hidden="true">🏪</span>
        </button>
      </div>

      <div class="mpm__bottom">
        <p class="mpm__address" aria-live="polite">
          <template v-if="resolving">در حال یافتن آدرس...</template>
          <template v-else-if="resolved">{{ resolved }}</template>
          <template v-else>نقشه را حرکت دهید تا پین روی محل دقیق شما قرار بگیرد.</template>
        </p>
        <p v-if="loadError" class="mpm__error">نقشه بارگذاری نشد. اتصال اینترنت را بررسی کنید.</p>
        <button type="button" class="mpm__confirm" @click="confirm">تایید موقعیت</button>
      </div>
    </div>
  </transition>
</template>

<script>
import L from 'leaflet';
import { addBasemap } from '~/utils/basemap';
import 'leaflet/dist/leaflet.css';
import {
  DEFAULT_MAP_CENTER,
  formatSearchLabel,
  mapirReverse,
  mapirSearch,
} from '~/utils/mapir';

// "قائن و حومه": results further than this from the restaurant are hidden by
// default; the customer can widen the search.
const REGION_RADIUS_KM = 30;

function distanceKm(aLat, aLng, bLat, bLng) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export default {
  name: 'MapPickerModal',
  props: {
    open: { type: Boolean, default: false },
    // Existing selection (when editing); otherwise the map opens on the restaurant.
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    centerLat: { type: Number, default: DEFAULT_MAP_CENTER.lat },
    centerLng: { type: Number, default: DEFAULT_MAP_CENTER.lng },
    restaurantName: { type: String, default: 'رستوران لاویز' },
    restaurantAddress: { type: String, default: '' },
  },
  data() {
    return {
      map: null,
      restaurantMarker: null,
      moving: false,
      loadError: false,
      query: '',
      results: [],
      searched: false,
      searching: false,
      regionOnly: true,
      resolved: '',
      resolving: false,
      searchTimer: null,
      reverseTimer: null,
      reverseSeq: 0,
      prevBodyOverflow: '',
    };
  },
  computed: {
    searchEnabled() {
      return true; // map.ir with a key, otherwise Nominatim
    },
    searchPlaceholder() {
      return this.searchEnabled ? 'جستجوی آدرس، خیابان یا مکان' : 'جستجو در این نسخه فعال نیست';
    },
  },
  watch: {
    open(v) {
      if (v) this.onOpen();
      else this.teardown();
    },
  },
  mounted() {
    if (this.open) this.onOpen();
    window.addEventListener('keydown', this.onKey);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey);
    this.teardown();
  },
  methods: {
    label: formatSearchLabel,
    onKey(e) {
      if (this.open && e.key === 'Escape') this.close();
    },
    onOpen() {
      this.prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.query = '';
      this.results = [];
      this.searched = false;
      this.resolved = '';
      this.loadError = false;
      this.$nextTick(() => this.initMap());
    },
    teardown() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      if (this.reverseTimer) clearTimeout(this.reverseTimer);
      if (this.map) {
        this.map.remove();
        this.map = null;
        this.restaurantMarker = null;
      }
      document.body.style.overflow = this.prevBodyOverflow;
    },
    restaurantPinHtml() {
      return (
        '<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px);">' +
        '<div style="background:#1e1819;color:#fff;font-size:18px;line-height:1;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.35);border:2px solid #fff;">' +
        '<span style="transform:rotate(45deg);">🏪</span></div>' +
        '<div style="margin-top:4px;background:#fff;border:1px solid #f0b323;color:#3a2600;background:#f0b323;font:700 11px Tahoma;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);">رستوران</div>' +
        '</div>'
      );
    },
    initMap() {
      const el = this.$refs.mapEl;
      if (!el || this.map) return;
      try {
        const hasSelection = this.lat != null && this.lng != null;
        const startLat = hasSelection ? this.lat : Number(this.centerLat);
        const startLng = hasSelection ? this.lng : Number(this.centerLng);

        // Zoom 16 shows the restaurant with several surrounding streets.
        this.map = L.map(el, { preferCanvas: true, zoomControl: false, attributionControl: true })
          .setView([startLat, startLng], 16);
        // First visit: slide the map so the restaurant sits above the pin
        // instead of underneath it, and both can be seen.
        if (!hasSelection) this.map.panBy([0, 120], { animate: false });
        addBasemap(L, this.map);

        const icon = L.divIcon({
          className: 'mpm__restaurant-icon',
          html: this.restaurantPinHtml(),
          iconSize: [80, 58],
          iconAnchor: [40, 52],
        });
        this.restaurantMarker = L.marker([Number(this.centerLat), Number(this.centerLng)], {
          icon,
          interactive: false,
          zIndexOffset: 500,
          title: this.restaurantName,
        }).addTo(this.map);

        this.map.on('movestart', () => { this.moving = true; });
        this.map.on('moveend', () => {
          this.moving = false;
          this.scheduleReverse();
        });
        setTimeout(() => { if (this.map) this.map.invalidateSize(); this.scheduleReverse(); }, 200);
      } catch (e) {
        this.loadError = true;
      }
    },
    center() {
      const c = this.map ? this.map.getCenter() : { lat: this.centerLat, lng: this.centerLng };
      return { lat: c.lat, lng: c.lng };
    },
    scheduleReverse() {
      if (!this.searchEnabled) return;
      if (this.reverseTimer) clearTimeout(this.reverseTimer);
      this.resolving = true;
      this.reverseTimer = setTimeout(async () => {
        const seq = ++this.reverseSeq;
        const { lat, lng } = this.center();
        let address = '';
        try { address = (await mapirReverse(lat, lng)) || ''; } catch (e) { /* keep empty */ }
        if (seq !== this.reverseSeq) return; // a newer move superseded this one
        this.resolved = address;
        this.resolving = false;
      }, 450);
    },
    focusRestaurant() {
      if (!this.map) return;
      this.map.setView([Number(this.centerLat), Number(this.centerLng)], 16, { animate: false });
      this.map.panBy([0, 120], { animate: false });
    },
    useMyLocation() {
      if (!navigator.geolocation) {
        this.$bvToast.toast('مرورگر شما موقعیت‌یابی را پشتیبانی نمی‌کند.', { variant: 'warning' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (this.map) this.map.setView([pos.coords.latitude, pos.coords.longitude], 17); },
        () => this.$bvToast.toast('دسترسی به موقعیت شما فعال نیست. نقشه را دستی حرکت دهید.', { variant: 'warning' }),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    },
    onQueryInput() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(this.searchNow, 400);
    },
    async searchNow() {
      const text = this.query.trim();
      if (!this.searchEnabled || text.length < 2) { this.results = []; this.searched = false; return; }
      this.searching = true;
      try {
        // Bias towards the restaurant, then drop anything outside the region.
        let found = await mapirSearch(text, this.centerLat, this.centerLng);
        if (this.regionOnly) {
          found = found.filter((r) => distanceKm(Number(this.centerLat), Number(this.centerLng), r.lat, r.lng) <= REGION_RADIUS_KM);
        }
        this.results = found.slice(0, 8);
      } catch (e) {
        this.results = [];
      }
      this.searched = true;
      this.searching = false;
    },
    widenSearch() { this.regionOnly = false; this.searchNow(); },
    narrowSearch() { this.regionOnly = true; this.searchNow(); },
    pick(item) {
      this.results = [];
      this.query = formatSearchLabel(item);
      if (this.map) this.map.setView([item.lat, item.lng], 17);
    },
    confirm() {
      const { lat, lng } = this.center();
      this.$emit('confirm', { lat, lng, address: this.resolved || '' });
    },
    close() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.mpm {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  background: var(--lz-surface-soft);
}
.mpm-enter-active, .mpm-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.mpm-enter, .mpm-leave-to { opacity: 0; transform: translateY(12px); }
@media (prefers-reduced-motion: reduce) {
  .mpm-enter-active, .mpm-leave-active { transition: none; }
}

.mpm__map { position: absolute; inset: 0; z-index: 0; }

.mpm__top {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 1100;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: calc(0.75rem + env(safe-area-inset-top, 0px)) 0.75rem 0;
}
.mpm__close {
  flex: none;
  width: 48px; height: 48px;
  border: 0; border-radius: 14px;
  background: var(--lz-surface); color: var(--lz-ink);
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.mpm__search { flex: 1; min-width: 0; position: relative; }
.mpm__search-input {
  width: 100%; height: 48px;
  border: 0; border-radius: 14px;
  padding: 0 1rem;
  font: inherit; font-size: 0.95rem;
  background: var(--lz-surface); color: var(--lz-ink);
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.mpm__search-input:disabled { color: var(--lz-ink-muted); }
.mpm__results, .mpm__noresult {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  margin: 0; padding: 0; list-style: none;
  background: var(--lz-surface); border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.22);
  max-height: 42vh; overflow-y: auto;
}
.mpm__results button {
  display: block; width: 100%; text-align: right;
  padding: 0.7rem 1rem; border: 0; background: transparent;
  font: inherit; font-size: 0.9rem; color: var(--lz-ink); cursor: pointer;
  border-bottom: 1px solid var(--lz-border-hairline);
}
.mpm__results li:last-child button { border-bottom: 0; }
.mpm__results button:focus-visible { background: var(--laviz-primary-light); }
.mpm__noresult { padding: 0.8rem 1rem; font-size: 0.88rem; color: var(--lz-ink-muted); }
.mpm__scope {
  position: absolute;
  top: calc(0.75rem + 48px + 6px + env(safe-area-inset-top, 0px));
  left: 0.75rem; right: 0.75rem;
  z-index: 1000;
  margin: 0; font-size: 0.78rem; text-align: right;
  color: var(--lz-ink); text-shadow: 0 0 4px var(--lz-surface), 0 0 4px var(--lz-surface);
  pointer-events: none;
}
.mpm__scope .mpm__link { pointer-events: auto; }
.mpm__link {
  border: 0; background: transparent; padding: 0 0.25rem;
  color: var(--laviz-primary); font: inherit; font-weight: 700; cursor: pointer;
}

/* Pin: tip at the exact centre of the screen-sized map. */
.mpm__pin {
  position: absolute; left: 50%; top: 50%;
  z-index: 1000; pointer-events: none;
  transform: translate(-50%, -100%);
  transition: transform 0.15s ease;
}
.mpm__pin { animation: pin-drop 0.55s cubic-bezier(0.3, 0.9, 0.4, 1.25) 0.25s both; }
@keyframes pin-drop {
  from { opacity: 0; transform: translate(-50%, calc(-100% - 90px)); }
  to { opacity: 1; transform: translate(-50%, -100%); }
}
.mpm__pin--lifted { transform: translate(-50%, calc(-100% - 10px)); }
.mpm__pin svg { display: block; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.35)); }
.mpm__pin-dot {
  position: absolute; left: 50%; bottom: -3px;
  width: 8px; height: 4px; margin-left: -4px;
  border-radius: 50%; background: rgba(0,0,0,0.35);
}
.mpm__pin--lifted .mpm__pin-dot { transform: scale(0.7); opacity: 0.6; }
@media (prefers-reduced-motion: reduce) { .mpm__pin { transition: none; animation: none; } }

.mpm__fabs {
  position: absolute; z-index: 1000;
  left: 0.75rem; bottom: calc(150px + env(safe-area-inset-bottom, 0px));
  display: flex; flex-direction: column; gap: 0.5rem;
}
.mpm__fab {
  width: 48px; height: 48px; border: 0; border-radius: 50%;
  background: var(--lz-surface); color: var(--lz-ink); font-size: 1.2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.25);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}

.mpm__bottom {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 1100;
  background: var(--lz-surface-raised);
  border-radius: 20px 20px 0 0;
  border-top: 1px solid var(--lz-sheet-border);
  box-shadow: var(--lz-shadow-sheet);
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
}
.mpm__address {
  margin: 0 0 0.75rem; min-height: 2.6em;
  font-size: 0.9rem; line-height: 1.7; color: var(--lz-ink);
}
.mpm__error { margin: 0 0 0.5rem; font-size: 0.85rem; color: var(--lz-danger); }
.mpm__confirm {
  width: 100%; min-height: 52px;
  border: 0; border-radius: 14px;
  background: var(--laviz-primary); color: #fff;
  font: inherit; font-size: 1rem; font-weight: 800; cursor: pointer;
}
button:focus-visible, input:focus-visible { outline: 2px solid var(--laviz-primary); outline-offset: 2px; }
</style>
