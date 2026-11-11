<template>
  <!--
    Bottom sheet for "delivery at a chosen time". Times come in 15-minute steps
    and only inside the day's opening windows (several windows when the day has
    separate services). Nothing is applied until the customer confirms.
  -->
  <transition name="time-sheet">
    <div v-if="visible" class="time-sheet" @click.self="close">
      <div class="time-sheet__panel" role="dialog" aria-label="انتخاب ساعت تحویل">
        <div class="time-sheet__grip" aria-hidden="true"></div>

        <header class="time-sheet__header">
          <h2 class="time-sheet__title">ساعت تحویل{{ dayLabel ? ' ' + dayLabel : '' }}</h2>
          <button type="button" class="time-sheet__close" aria-label="بستن" @click="close">✕</button>
        </header>

        <p class="time-sheet__hours">
          ساعت پذیرش سفارش:
          <span v-for="(w, i) in windows" :key="i" class="time-sheet__hours-range">
            {{ fa(w.from) }} تا {{ fa(w.to) }}<template v-if="i < windows.length - 1"> و </template>
          </span>
        </p>

        <div class="time-sheet__body">
          <section v-for="(w, i) in windows" :key="i" class="time-sheet__window">
            <h3 v-if="windows.length > 1" class="time-sheet__window-title">
              {{ fa(w.from) }} تا {{ fa(w.to) }}
            </h3>
            <div class="time-sheet__grid" role="listbox" :aria-label="'ساعت‌های ' + fa(w.from) + ' تا ' + fa(w.to)">
              <button
                v-for="slot in w.slots"
                :key="slot"
                type="button"
                role="option"
                class="time-sheet__slot"
                :class="{ 'time-sheet__slot--active': picked === slot }"
                :aria-selected="picked === slot"
                @click="picked = slot"
              >{{ fa(slot) }}</button>
            </div>
          </section>
          <p v-if="!windows.length" class="time-sheet__empty">برای این روز ساعتی برای انتخاب وجود ندارد.</p>
        </div>

        <button type="button" class="time-sheet__confirm" :disabled="!picked" @click="confirm">
          {{ picked ? 'تایید ساعت ' + fa(picked) : 'یک ساعت انتخاب کنید' }}
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
import { buildWindows } from '../../../utils/deliveryWindows';

export default {
  name: 'DeliveryTimeSheet',
  props: {
    visible: { type: Boolean, default: false },
    // Allowed times for the chosen day, as sent by the API.
    times: { type: Array, default: () => [] },
    // Currently chosen time, if any ("13:45").
    value: { type: String, default: null },
    dayLabel: { type: String, default: '' },
  },
  data() {
    return { picked: null };
  },
  computed: {
    windows() {
      return buildWindows(this.times);
    },
  },
  watch: {
    visible(open) {
      if (open) {
        // Start from the current choice, but only if it is still a valid option.
        const valid = this.windows.some((w) => w.slots.includes(this.value));
        this.picked = valid ? this.value : null;
      }
      if (typeof document !== 'undefined') document.body.style.overflow = open ? 'hidden' : '';
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onKey);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  },
  methods: {
    fa(text) {
      return String(text).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    },
    onKey(e) {
      if (this.visible && e.key === 'Escape') this.close();
    },
    close() {
      this.$emit('update:visible', false);
    },
    confirm() {
      if (!this.picked) return;
      this.$emit('select', this.picked);
      this.close();
    },
  },
};
</script>

<style scoped>
.time-sheet {
  position: fixed;
  inset: 0;
  z-index: 3000; /* above the basket, which is itself a full-screen layer */
  background: var(--lz-modal-backdrop);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.time-sheet__panel {
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--lz-surface-raised);
  border: 1px solid var(--lz-sheet-border);
  border-bottom: 0;
  box-shadow: var(--lz-shadow-sheet);
  border-radius: 24px 24px 0 0;
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom, 0px));
}

.time-sheet__grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--laviz-border);
  margin: 4px auto 8px;
}

.time-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.time-sheet__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--laviz-text);
}

.time-sheet__close {
  border: 0;
  background: transparent;
  width: 44px;
  height: 44px;
  font-size: 1.1rem;
  color: var(--laviz-text);
  cursor: pointer;
}

.time-sheet__hours {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: var(--laviz-muted);
}

.time-sheet__body {
  overflow-y: auto;
  padding: 0.25rem 0 0.75rem;
}

.time-sheet__window + .time-sheet__window {
  margin-top: 1rem;
}

.time-sheet__window-title {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--laviz-text);
}

.time-sheet__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.time-sheet__slot {
  min-height: 44px;
  border: 1px solid var(--lz-border-strong);
  border-radius: var(--laviz-radius-sm);
  background: var(--laviz-surface);
  color: var(--laviz-text);
  font: inherit;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.time-sheet__slot--active {
  border-color: var(--laviz-primary);
  background: var(--laviz-primary-light);
  color: var(--laviz-primary-dark);
  font-weight: 700;
}

.time-sheet__slot:focus-visible,
.time-sheet__confirm:focus-visible,
.time-sheet__close:focus-visible {
  outline: 2px solid var(--laviz-primary);
  outline-offset: 2px;
}

.time-sheet__empty {
  margin: 1rem 0;
  text-align: center;
  color: var(--laviz-muted);
}

.time-sheet__confirm {
  width: 100%;
  min-height: 52px;
  border: 0;
  border-radius: var(--laviz-radius-sm);
  background: var(--laviz-primary);
  color: #fff;
  font: inherit;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
}

.time-sheet__confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.time-sheet-enter-active,
.time-sheet-leave-active {
  transition: opacity 0.2s ease;
}

.time-sheet-enter-active .time-sheet__panel,
.time-sheet-leave-active .time-sheet__panel {
  transition: transform 0.25s ease;
}

.time-sheet-enter,
.time-sheet-leave-to {
  opacity: 0;
}

.time-sheet-enter .time-sheet__panel,
.time-sheet-leave-to .time-sheet__panel {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .time-sheet-enter-active,
  .time-sheet-leave-active,
  .time-sheet-enter-active .time-sheet__panel,
  .time-sheet-leave-active .time-sheet__panel {
    transition: none;
  }
}
</style>
