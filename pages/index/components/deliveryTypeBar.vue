<template>
  <div class="delivery-bar">
    <!-- Segmented control: courier vs. pickup, mirroring the reference. -->
    <div v-if="showSwitch" class="delivery-bar__switch" role="radiogroup" aria-label="نحوه دریافت سفارش">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="delivery-bar__option"
        :class="{ 'delivery-bar__option--active': value === opt.value }"
        role="radio"
        :aria-checked="value === opt.value"
        @click="$emit('input', opt.value)"
      >
        <span v-if="value === opt.value" class="delivery-bar__check" aria-hidden="true">✓</span>
        {{ opt.text }}
      </button>
    </div>

    <!-- Info chips: only the ones that actually apply to the chosen method. -->
    <div class="delivery-bar__chips">
      <span v-if="etaLabel" class="delivery-bar__chip">
        <span class="delivery-bar__chip-icon" aria-hidden="true">🕒</span>
        {{ etaLabel }}
      </span>
      <span v-if="showSwitch && value === 'sendToMe'" class="delivery-bar__chip">
        <span class="delivery-bar__chip-icon" aria-hidden="true">🛵</span>
        {{ shippingText }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeliveryTypeBar',
  props: {
    value: { type: String, default: 'sendToMe' },
    options: { type: Array, default: () => [] },
    // The same choice is offered again inside the basket, so the first page can hide it.
    showSwitch: { type: Boolean, default: true },
    shippingCost: { type: [Number, String], default: 0 },
    // Minutes; 0/null hides the chip rather than promising a made-up time.
    etaMinutes: { type: [Number, String], default: 0 },
    // Wording comes from settings so the shop can reword the chips; {value}
    // marks where the number goes.
    deliveryEtaLabel: { type: String, default: 'تحویل فوری تا {value} دقیقه' },
    pickupEtaLabel: { type: String, default: 'آماده‌سازی تا {value} دقیقه' },
    shippingChipLabel: { type: String, default: 'ارسال: {value}' },
  },
  methods: {
    /** Substitutes {value} in a label template. A template without the
     *  placeholder is still shown, just without the number appended. */
    fill(tpl, value) {
      return String(tpl || '').replace('{value}', value);
    },
  },
  computed: {
    shippingLabel() {
      const n = Number(this.shippingCost) || 0;
      return n > 0 ? `${n.toLocaleString('fa-IR')} تومان` : 'رایگان';
    },
    etaLabel() {
      const m = Number(this.etaMinutes) || 0;
      if (!m) return '';
      const tpl = this.value === 'sendToMe' ? this.deliveryEtaLabel : this.pickupEtaLabel;
      return this.fill(tpl, m.toLocaleString('fa-IR'));
    },
    shippingText() {
      return this.fill(this.shippingChipLabel, this.shippingLabel);
    },
  },
};
</script>

<style scoped>
.delivery-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0 10px;
}

.delivery-bar__switch {
  display: flex;
  width: 100%;
  gap: 8px;
}

.delivery-bar__option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--laviz-border);
  border-radius: 8px;
  background: var(--laviz-surface);
  color: var(--laviz-muted);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.delivery-bar__option--active {
  border-color: var(--laviz-primary);
  color: var(--laviz-primary);
  background: var(--laviz-primary-light);
}

.delivery-bar__check {
  font-size: 13px;
  line-height: 1;
}

.delivery-bar__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.delivery-bar__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--laviz-border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--laviz-text);
  white-space: nowrap;
}

.delivery-bar__chip-icon {
  font-size: 12px;
  line-height: 1;
}
</style>
