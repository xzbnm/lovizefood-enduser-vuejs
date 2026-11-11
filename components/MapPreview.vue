<template>
  <!--
    Read-only thumbnail of the spot the customer picked: the map centred on it,
    with a pin and an "edit position" button. Taps and drags do nothing here;
    the full-screen picker opens through the button.
  -->
  <div class="map-preview">
    <div ref="mapEl" class="map-preview__map" role="img" aria-label="موقعیت انتخاب‌شده روی نقشه"></div>
    <div v-if="loadError" class="map-preview__error">نقشه بارگذاری نشد، اما موقعیت شما ثبت شده است.</div>
    <button type="button" class="map-preview__edit" @click="$emit('edit')">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
      <span>ویرایش موقعیت</span>
    </button>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { addBasemap } from '~/utils/basemap';

const PIN = `<svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path d="M16 41S3 27.5 3 15.5a13 13 0 0 1 26 0C29 27.5 16 41 16 41z" fill="#8a1318" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15.5" r="5" fill="#fff"/></svg>`;

export default {
  name: 'MapPreview',
  props: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  data() {
    return { loadError: false };
  },
  watch: {
    lat() { this.place(); },
    lng() { this.place(); },
  },
  mounted() {
    try {
      this.map = L.map(this.$refs.mapEl, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
      }).setView([this.lat, this.lng], 16);
      addBasemap(L, this.map);
      this.marker = L.marker([this.lat, this.lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: 'map-preview__pin', html: PIN, iconSize: [32, 42], iconAnchor: [16, 41] }),
      }).addTo(this.map);
      setTimeout(() => this.map && this.map.invalidateSize(), 150);
    } catch (e) {
      this.loadError = true;
    }
  },
  beforeDestroy() {
    if (this.map) this.map.remove();
    this.map = null;
  },
  methods: {
    place() {
      if (!this.map) return;
      this.map.setView([this.lat, this.lng], 16, { animate: false });
      if (this.marker) this.marker.setLatLng([this.lat, this.lng]);
    },
  },
};
</script>

<style scoped>
.map-preview {
  position: relative;
  overflow: hidden;
  height: 170px;
  border: 1px solid var(--lz-border-strong);
  border-radius: 16px;
  background: var(--lz-surface-soft);
}

.map-preview__map {
  position: absolute;
  inset: 0;
  pointer-events: none; /* looking only: edits go through the button */
  background: var(--lz-surface-soft);
}

.map-preview__error {
  position: absolute;
  inset: 0 0 auto;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--lz-ink-muted);
  text-align: center;
}

.map-preview__edit {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 800;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0 1rem;
  border: 0;
  border-radius: 22px;
  background: var(--lz-accent);
  color: #fff;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
  cursor: pointer;
}

.map-preview__edit:active { transform: scale(0.95); }
.map-preview__edit:focus-visible { outline: 2px solid var(--lz-saffron); outline-offset: 2px; }

:deep(.map-preview__pin) { background: transparent; border: 0; filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.35)); }
</style>
