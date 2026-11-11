<template>
  <div class="product-card" :class="{ 'product-card--out': isOutOfStock }">
    <!-- Left column: picture on top, the add control directly beneath it. -->
    <div class="product-card__side">
      <div
        class="product-card__media"
        :class="{ 'product-card__media--zoomable': hasPhoto, 'product-card__media--empty': !showImage }"
        @click="showImageDetailsModal"
      >
        <!-- A product without a picture leaves the slot empty: no placeholder. -->
        <img v-if="showImage" class="product-card__img" :src="image" alt="" @error="imageFailed = true" />
        <!-- A small, faint cue that the photo can be opened. -->
        <span v-if="hasPhoto" class="product-card__zoom" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
          </svg>
        </span>
        <span v-if="isSpecial" class="product-card__badge">غذای روز</span>
      </div>

      <div class="product-card__actions">
        <!-- Chef's-daily foods for a future day are shown as a preview only. -->
        <span v-if="locked" class="product-card__locked-label">{{ lockedLabel }}</span>
        <template v-else-if="!isOutOfStock">
          <button
            v-if="!count"
            type="button"
            class="product-card__add"
            @click="$emit('increase')"
          >
            <span class="product-card__add-plus" aria-hidden="true">+</span> افزودن
          </button>
          <div v-else class="product-card__stepper">
            <button type="button" class="product-card__stepper-btn" @click="$emit('decrease')" aria-label="کم کردن">−</button>
            <span :key="count" class="product-card__count">{{ count }}</span>
            <button type="button" class="product-card__stepper-btn" @click="$emit('increase')" aria-label="افزودن">+</button>
          </div>
          <!-- The unit (پرس / عدد) sat under the add button and only added
               noise; the stepper count already reads as a quantity. The prop
               stays because the cart still labels its lines with it. -->
        </template>
        <span v-else class="product-card__out-label">اتمام موجودی امروز</span>
      </div>
    </div>

    <div class="product-card__body">
      <h3 class="product-card__name">{{ name }}</h3>
      <span v-if="showRating && ratingCount" class="product-card__rating">
        <span class="product-card__rating-star" aria-hidden="true">★</span>
        {{ ratingAverage }}
        <small>({{ ratingCount }})</small>
      </span>
      <p v-if="isSpecial && specialDaysText" class="product-card__special">{{ specialDaysText }}</p>
      <p v-if="description" class="product-card__desc">{{ description }}</p>
      <div class="product-card__price">
        <template v-if="discount_percent">
          <span class="product-card__discount-tag">٪{{ discount_percent }}</span>
          <span class="product-card__price-old">{{ formatNum(price) }}</span>
          <span class="product-card__price-now">{{ formatNum(price - (price / 100) * discount_percent) }}</span>
          <span class="product-card__currency">تومان</span>
        </template>
        <template v-else>
          <span class="product-card__price-now">{{ formatNum(price) }}</span>
          <span class="product-card__currency">تومان</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductItem',
  emits: ['decrease', 'increase', 'imageClick'],
  props: {
    discount_percent: undefined,
    name: undefined,
    description: String,
    price: undefined,
    count: undefined,
    isOutOfStock: { type: Boolean, default: true },
    unit_name: undefined,
    image: String,
    // The large photo, when the product has one; a product without a photo leaves the slot empty and does not open.
    fullImage: { type: String, default: '' },
    hasPhoto: { type: Boolean, default: false },
    isSpecial: { type: Boolean, default: false },
    specialDaysText: { type: String, default: '' },
    ratingAverage: { type: [Number, String], default: 0 },
    ratingCount: { type: [Number, String], default: 0 },
    showRating: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    lockedLabel: { type: String, default: 'فقط در روز خودش' },
  },
  data() {
    return { imageFailed: false };
  },
  watch: {
    image() { this.imageFailed = false; },
  },
  methods: {
    showImageDetailsModal() {
      if (!this.hasPhoto) return;
      // The viewer also shows the product's name and full description.
      this.$emit('imageClick', {
        src: this.fullImage || this.image,
        name: this.name,
        description: this.description,
      });
    },
    formatNum(val) {
      return val?.toLocaleString();
    },
  },
  computed: {
    // A missing or unreadable file also leaves the slot empty.
    showImage() {
      return !!this.image && !this.imageFailed;
    },
  },
};
</script>

<style scoped>
/* Metrics read from the reference menu row (values are exact, not eyeballed):
   image 104x104, title 16/600/28, description 14/400/24 at 60% ink,
   price 16/600/28 with a 12/600/20 currency suffix, and a 32px-tall add
   control on the accent wash with accent text at radius 6. */
.product-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  /* Transparent: the row behind it (plain or tinted) shows through. */
  background: transparent;
  border-bottom: 1px solid var(--laviz-border-light, #f6f6f6);
}

.product-card--out { opacity: 0.55; }

.product-card__side {
  order: 2;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.product-card__media {
  flex: 0 0 auto;
  position: relative;
  width: 104px;
  height: 104px;
  border-radius: var(--laviz-radius);
  overflow: hidden;
  cursor: pointer;
}

.product-card__img {
  width: 104px;
  height: 104px;
  object-fit: cover;
  background: var(--laviz-surface-light, #f6f6f6);
  display: block;
}

.product-card__badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  color: var(--lz-saffron-ink);
  background: var(--lz-saffron);
  border-radius: 999px;
  padding: 4px 8px;
}

.product-card__body {
  order: 1;
  flex: 1 1 auto;
  min-width: 0;
}

.product-card__name {
  font-size: 16px;
  font-weight: 600;
  line-height: 28px;
  color: var(--laviz-text);
  margin: 0 0 2px;
}

.product-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: var(--laviz-text);
  margin-bottom: 2px;
}

.product-card__rating-star { color: var(--lz-star); font-size: 13px; }
.product-card__rating small { color: var(--laviz-muted); font-weight: 400; }

.product-card__special {
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--laviz-primary);
  margin: 0 0 2px;
}

.product-card__desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  color: var(--laviz-muted);
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.product-card__price-old {
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  color: var(--laviz-muted);
  text-decoration: line-through;
}

.product-card__price-now {
  font-size: 16px;
  font-weight: 600;
  line-height: 28px;
  color: var(--laviz-text);
}

.product-card__currency {
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  color: var(--laviz-text);
}

.product-card__discount-tag {
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  color: var(--lz-saffron-ink);
  background: var(--lz-saffron);
  border-radius: 999px;
  padding: 4px 7px;
}

.product-card__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.product-card__add {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  min-width: 104px;
  height: 32px;
  padding: 4px 12px;
  border: 0;
  border-radius: 6px;
  background: var(--laviz-add-bg);
  color: var(--laviz-add-ink);
  font-family: inherit;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
}

.product-card__stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-width: 104px;
  height: 40px;
  padding: 0;
  background: var(--laviz-add-bg);
  color: var(--laviz-add-ink);
  border-radius: 6px;
}

.product-card__stepper-btn {
  flex: 1 1 0;
  height: 100%;
  min-width: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.product-card__count {
  min-width: 14px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: inherit;
}

.product-card__add-plus {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
}

.product-card__unit {
  font-size: 12px;
  line-height: 20px;
  color: var(--laviz-faint, #a6a8b0);
}

.product-card__out-label,
.product-card__locked-label {
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  border-radius: 6px;
  padding: 4px 12px;
  white-space: nowrap;
}

.product-card__out-label {
  color: var(--laviz-danger);
  background: var(--lz-danger-wash);
  /* "اتمام موجودی امروز" is wider than the picture column: fit it, two lines if needed. */
  box-sizing: border-box;
  max-width: 104px;
  padding: 4px 8px;
  white-space: normal;
  text-align: center;
  line-height: 18px;
}
.product-card__locked-label { color: var(--laviz-muted); background: var(--laviz-surface-soft, #eeeef0); }

@media (max-width: 360px) {
  .product-card__media,
  .product-card__img { width: 88px; height: 88px; }
}

/* Motion: the stepper pops in when the first unit is added, the number bumps
   on every change, and the controls give a little under the finger. */
.product-card__stepper {
  animation: stepper-in 0.26s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
}

.product-card__count {
  display: inline-block;
  animation: count-bump 0.32s ease;
}

.product-card__add,
.product-card__stepper-btn {
  transition: transform 0.12s ease;
}

/* The add button is the same 40px-tall touch target as the stepper. */
.product-card__add {
  height: 40px;
}

.product-card__add:active,
.product-card__stepper-btn:active {
  transform: scale(0.92);
}

@keyframes stepper-in {
  from { opacity: 0; transform: scale(0.7); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes count-bump {
  0% { transform: scale(1); }
  40% { transform: scale(1.4); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .product-card__stepper,
  .product-card__count { animation: none; }
}

/* The photo reads as tappable: a soft shadow, a faint magnifier in the corner,
   and it gives a little under the finger. */
.product-card__media {
  box-shadow: 0 6px 16px rgba(30, 24, 25, 0.26), 0 0 0 1px rgba(30, 24, 25, 0.06);
}

.product-card__media--zoomable {
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}

.product-card__media--zoomable:active {
  transform: scale(0.96);
  box-shadow: 0 2px 6px rgba(30, 24, 25, 0.28), 0 0 0 1px rgba(30, 24, 25, 0.06);
}

.product-card__zoom {
  position: absolute;
  left: 6px;
  bottom: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(30, 24, 25, 0.42);
  opacity: 0.8;
  pointer-events: none;
}

/* No picture: the slot keeps its size so the card lines up, but shows nothing. */
.product-card__media.product-card__media--empty {
  box-shadow: none;
  background: transparent;
  cursor: default;
}
</style>
