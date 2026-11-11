<template>
  <!-- Only shown when the customer actually has something to use: a personal
       code issued to them, or a shop-wide campaign. An empty section would be
       a dead row on the menu. -->
  <section v-if="offers.length" class="offers">
    <h2 class="offers__title">تخفیف‌ها و کوپن‌ها</h2>

    <div v-drag-scroll class="offers__list">
      <!-- Ticket-style card: the amount on top, title and time left, a
           perforated divider with side notches, then the details link. -->
      <button
        v-for="offer in offers"
        :key="offer.id"
        type="button"
        class="offer-card"
        :class="offer.personal ? 'offer-card--personal' : 'offer-card--public'"
        @click="open(offer)"
      >
        <span class="offer-card__top">
          <span class="offer-card__pill">{{ offer.pill }}</span>
          <span class="offer-card__title">{{ offer.title }}</span>
          <span class="offer-card__hint">{{ offer.hint }}</span>
        </span>
        <span class="offer-card__divider" aria-hidden="true"></span>
        <span class="offer-card__more">
          جزئیات
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
    </div>

    <!-- Bottom sheet, matching the rest of the app's sheets. -->
    <transition name="offer-sheet">
      <div v-if="selected" class="offer-sheet" @click.self="close">
        <div class="offer-sheet__panel" role="dialog" :aria-label="selected.title">
          <div class="offer-sheet__grip" aria-hidden="true"></div>

          <header class="offer-sheet__header">
            <button type="button" class="offer-sheet__close" aria-label="بستن" @click="close">✕</button>
            <h3 class="offer-sheet__title">{{ selected.title }}</h3>
          </header>

          <p v-if="selected.scope" class="offer-sheet__scope">{{ selected.scope }}</p>

          <div class="offer-sheet__highlight">
            <span class="offer-sheet__highlight-icon" aria-hidden="true">{{ selected.personal ? '🎁' : '٪' }}</span>
            <span>
              <strong>{{ selected.headline }}</strong>
              <small v-if="selected.sub">{{ selected.sub }}</small>
            </span>
          </div>

          <p v-if="selected.code" class="offer-sheet__code">
            کد:
            <span class="offer-sheet__code-value" @click="copy(selected.code)">{{ selected.code }}</span>
            <small v-if="copied === selected.code">کپی شد</small>
          </p>

          <p class="offer-sheet__note">
            کوپن‌ها در صفحه «سبد خرید» قابل انتخاب هستند؛ در هر سفارش امکان انتخاب یک کوپن وجود دارد.
          </p>

          <button type="button" class="offer-sheet__ok" @click="close">متوجه شدم</button>
        </div>
      </div>
    </transition>
  </section>
</template>

<script>
import dragScroll from '../../../utils/dragScroll';

export default {
  name: 'DiscountSection',
  directives: { dragScroll },
  props: {
    /** Codes issued to this customer, from /profile/active-discount-codes. */
    personalCodes: { type: Array, default: () => [] },
    /** Shop-wide campaigns anyone can use. */
    publicOffers: { type: Array, default: () => [] },
  },
  data() {
    return { selected: null, copied: null };
  },
  computed: {
    offers() {
      const personal = this.personalCodes.map((c) => ({
        id: 'p-' + c.id,
        personal: true,
        pill: this.percentOf(c) ? `${this.fa(this.percentOf(c))}٪ تخفیف` : `تا ${this.fa(c.amount)} تومان`,
        title: c.title || 'کد تخفیف شما',
        hint: this.remaining(c),
        headline: this.percentOf(c)
          ? `${this.fa(this.percentOf(c))}٪ تخفیف`
          : `تا ${this.fa(c.amount)} تومان تخفیف`,
        sub: this.remaining(c),
        scope: 'این کد فقط برای شما صادر شده است',
        code: c.code,
      }));

      const shop = this.publicOffers.map((o) => ({
        id: 'g-' + (o.id || o.code),
        personal: false,
        pill: this.percentOf(o) ? `${this.fa(this.percentOf(o))}٪ تخفیف` : (o.headline || 'تخفیف ویژه'),
        title: o.title || 'تخفیف ویژه',
        hint: o.hint || 'روی سبد خرید اعمال می‌شود',
        headline: o.headline || o.title,
        sub: o.sub || '',
        scope: 'ویژه این سفارش',
        code: o.code || '',
      }));

      return [...personal, ...shop];
    },
  },
  methods: {
    fa(n) {
      return Number(n || 0).toLocaleString('fa-IR');
    },
    // The API names the percentage differently across endpoints; accept the
    // usual spellings and ignore anything that is not a sensible 1-100.
    percentOf(o) {
      const v = Number(o && (o.percent ?? o.discount_percent ?? o.percentage));
      return v > 0 && v <= 100 ? v : 0;
    },
    remaining(c) {
      if (c.remainingDays === null || c.remainingDays === undefined) return 'بدون محدودیت زمانی';
      if (c.remainingDays === 0) return 'امروز آخرین مهلت';
      if (c.remainingDays === 1) return 'یک روز مانده';
      return `${this.fa(c.remainingDays)} روز مانده`;
    },
    open(offer) {
      this.selected = offer;
      if (process.client) document.body.style.overflow = 'hidden';
    },
    close() {
      this.selected = null;
      if (process.client) document.body.style.overflow = '';
    },
    copy(code) {
      const done = () => {
        this.copied = code;
        setTimeout(() => { this.copied = null; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => {});
      } else {
        const el = document.createElement('input');
        el.value = code;
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(el);
      }
    },
  },
  beforeDestroy() {
    if (process.client) document.body.style.overflow = '';
  },
};
</script>

<style scoped>
/* Full-width band, matching the menu sections: edge to edge, with the canvas
   showing only as the gap above and below. */
.offers {
  background: var(--lz-surface);
  padding: var(--lz-space-3) var(--lz-space-4);
  /* Same viewport-relative full bleed as the menu bands. */
  margin-inline: calc(50% - 50vw);
  margin-bottom: var(--lz-space-2);
}

@media (min-width: 768px) {
  .offers {
    margin-inline: 0;
  }
}

.offers__title {
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  letter-spacing: var(--lz-track-lg);
  color: var(--lz-ink);
  margin: 0 0 var(--lz-space-3);
}

.offers__list {
  display: flex;
  gap: var(--lz-space-2);
  overflow-x: auto;
  scrollbar-width: none;
  /* A scroll container clips what spills out of it, card shadows included.
     The padding gives the shadows room; the negative margins give the space
     back, so the layout does not change. The row also runs to the screen
     edges, so cards slide out instead of being cut at the section padding. */
  padding: 8px var(--lz-space-4) 32px;
  margin: -8px calc(-1 * var(--lz-space-4)) -24px;
}

.offers__list::-webkit-scrollbar { display: none; }

.offer-card {
  --offer-edge: var(--lz-border-hairline);
  flex: 0 0 auto;
  width: 170px;
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid var(--offer-edge);
  border-radius: 20px;
  background: var(--lz-surface-raised);
  box-shadow: 0 8px 22px rgba(30, 24, 25, 0.1);
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.offer-card:active { transform: scale(0.97); }
.offer-card:focus-visible { outline: 2px solid var(--lz-accent); outline-offset: 2px; }

.offer-card__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 14px 10px;
}

/* The amount is the hero of the card. */
.offer-card__pill {
  padding: 3px 14px;
  border-radius: 999px;
  /* Crimson in both themes so the white text always reads. */
  background: linear-gradient(135deg, #8a1318, #b02a30);
  color: #fff;
  font-size: var(--lz-text-sm);
  font-weight: 600;
  line-height: 1.8;
  box-shadow: 0 4px 10px rgba(138, 19, 24, 0.28);
}

.offer-card--public .offer-card__pill {
  background: var(--lz-saffron);
  color: var(--lz-saffron-ink);
  box-shadow: 0 4px 10px rgba(240, 179, 35, 0.35);
}

.offer-card__title {
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: var(--lz-text-body);
  font-weight: 600;
  line-height: 1.5;
  color: var(--lz-ink);
}

.offer-card__hint {
  margin-top: -6px;
  font-size: var(--lz-text-caption);
  color: var(--lz-ink-muted);
}

/* Perforated divider with a notch cut into each side, like a ticket. The
   notches take the colour of the band behind the cards. */
.offer-card__divider {
  position: relative;
  display: block;
  height: 16px;
  margin-top: auto;
}

.offer-card__divider::before {
  content: "";
  position: absolute;
  inset-inline: 14px;
  top: 50%;
  border-top: 2px dashed var(--lz-border-strong);
}

.offer-card__divider::after {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline: -1px;
  background:
    radial-gradient(circle at 0 50%, var(--lz-surface) 0 7px, var(--offer-edge) 7px 8px, transparent 8px) left / 50% 100% no-repeat,
    radial-gradient(circle at 100% 50%, var(--lz-surface) 0 7px, var(--offer-edge) 7px 8px, transparent 8px) right / 50% 100% no-repeat;
}

.offer-card__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 14px 12px;
  font-size: var(--lz-text-sm);
  font-weight: 600;
  color: var(--lz-accent-strong);
}

.offer-card--public .offer-card__more { color: var(--lz-ink); }

/* ---- bottom sheet ---- */
.offer-sheet {
  position: fixed;
  inset: 0;
  z-index: 1035;
  background: var(--lz-modal-backdrop);
  display: flex;
  align-items: flex-end;
}

.offer-sheet__panel {
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--lz-surface-raised);
  border: 1px solid var(--lz-sheet-border);
  border-bottom: 0;
  box-shadow: var(--lz-shadow-sheet);
  border-radius: var(--lz-radius-card) var(--lz-radius-card) 0 0;
  padding: var(--lz-space-2) var(--lz-space-4) calc(var(--lz-space-4) + env(safe-area-inset-bottom));
}

.offer-sheet__grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--lz-border);
  margin: var(--lz-space-1) auto var(--lz-space-2);
}

.offer-sheet__header {
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  justify-content: space-between;
  gap: var(--lz-space-3);
}

.offer-sheet__title {
  margin: 0;
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink);
}

.offer-sheet__close {
  border: 0;
  background: transparent;
  font-size: 18px;
  color: var(--lz-ink);
  cursor: pointer;
  padding: var(--lz-space-1);
}

.offer-sheet__scope {
  margin: var(--lz-space-3) 0 var(--lz-space-2);
  padding: var(--lz-space-3);
  border: 1px solid var(--lz-border-hairline);
  border-radius: var(--lz-radius-control);
  font-size: var(--lz-text-body);
  color: var(--lz-ink-muted);
}

.offer-sheet__highlight {
  display: flex;
  align-items: center;
  gap: var(--lz-space-3);
  padding: var(--lz-space-3);
  border-radius: var(--lz-radius-control);
  background: var(--lz-success-wash);
}

.offer-sheet__highlight-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--lz-surface);
  font-size: var(--lz-text-body);
}

.offer-sheet__highlight strong {
  display: block;
  font-size: var(--lz-text-lg);
  color: var(--lz-ink);
}

.offer-sheet__highlight small {
  display: block;
  font-size: var(--lz-text-sm);
  color: var(--lz-ink-muted);
}

.offer-sheet__code {
  margin: var(--lz-space-3) 0 0;
  font-size: var(--lz-text-body);
  color: var(--lz-ink-muted);
}

.offer-sheet__code-value {
  font-weight: var(--lz-weight-semibold);
  letter-spacing: 1px;
  color: var(--lz-accent);
  cursor: pointer;
  margin: 0 var(--lz-space-1);
}

.offer-sheet__code small { color: var(--lz-success); margin-right: var(--lz-space-2); }

.offer-sheet__note {
  margin: var(--lz-space-3) 0 var(--lz-space-4);
  padding: var(--lz-space-3);
  border-radius: var(--lz-radius-control);
  background: var(--lz-surface-light);
  font-size: var(--lz-text-sm);
  line-height: var(--lz-leading-body);
  color: var(--lz-ink-muted);
}

.offer-sheet__ok {
  width: 100%;
  border: 1px solid var(--lz-border);
  border-radius: var(--lz-radius-chip);
  background: var(--lz-surface);
  padding: var(--lz-space-3);
  font-family: inherit;
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink);
  cursor: pointer;
}

.offer-sheet-enter-active,
.offer-sheet-leave-active { transition: opacity 0.2s ease; }

.offer-sheet-enter-active .offer-sheet__panel,
.offer-sheet-leave-active .offer-sheet__panel { transition: transform 0.25s ease; }

.offer-sheet-enter,
.offer-sheet-leave-to { opacity: 0; }

.offer-sheet-enter .offer-sheet__panel,
.offer-sheet-leave-to .offer-sheet__panel { transform: translateY(100%); }
</style>
