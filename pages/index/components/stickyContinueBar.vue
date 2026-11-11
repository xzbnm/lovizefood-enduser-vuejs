<template>
  <!--
    Fixed bottom bar, shown as soon as the first food is picked.
    Mirrors the Snappfood basket bar: a running total on one side and a
    full-width primary action on the other.
  -->
  <transition name="continue-bar">
    <div v-if="visible" class="continue-bar">
      <div class="continue-bar__inner">
        <div class="continue-bar__summary">
          <span :key="itemCount" class="continue-bar__count">{{ itemCount }} قلم</span>
          <strong :key="total" class="continue-bar__total">{{ formatNum(total) }} تومان</strong>
        </div>
        <button
          type="button"
          class="continue-bar__action"
          :disabled="disabled"
          @click="$emit('continue')"
        >
          {{ label }}
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'StickyContinueBar',
  props: {
    itemCount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    disabled: { type: Boolean, default: false },
    // Guests are sent through register/login first; the wording says so.
    isLoggedIn: { type: Boolean, default: false },
  },
  computed: {
    visible() {
      return this.itemCount > 0;
    },
    label() {
      // The reference labels this by what it opens, not by auth state; signing
      // in is asked for inside the basket, once the order is actually assembled.
      return `سبد خرید (${this.itemCount.toLocaleString('fa-IR')})`;
    },
  },
  methods: {
    formatNum(val) {
      return Number(val || 0).toLocaleString();
    },
  },
};
</script>

<style scoped>
.continue-bar {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  z-index: 1030;
  background: var(--lz-surface);
  border-top: 1px solid var(--laviz-border-light, #f6f6f6);
  box-shadow: 0 -0.25rem 1rem 0 rgba(0, 0, 0, 0.12);
  padding: 0.6rem 0.9rem calc(0.6rem + env(safe-area-inset-bottom));
}

.continue-bar__inner {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  max-width: 720px;
  margin: 0 auto;
}

.continue-bar__summary {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  white-space: nowrap;
}

.continue-bar__count {
  font-size: 0.72rem;
  color: var(--laviz-muted);
}

.continue-bar__total {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--laviz-text);
}

.continue-bar__action {
  flex: 1;
  border: 0;
  border-radius: var(--laviz-radius);
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  background: var(--laviz-primary);
  cursor: pointer;
  transition: opacity 0.15s;
}

.continue-bar__action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.continue-bar-enter-active,
.continue-bar-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.continue-bar-enter,
.continue-bar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Motion: the bar springs up, the total and count tick when they change, and a
   light sweep crosses the button each time the basket changes. */
.continue-bar-enter-active {
  transition: transform 0.38s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.22s ease;
}

.continue-bar__total,
.continue-bar__count {
  display: inline-block;
  animation: bar-tick 0.34s ease;
}

.continue-bar__action {
  position: relative;
  overflow: hidden;
  transition: opacity 0.15s, transform 0.12s ease;
}

.continue-bar__action:active {
  transform: scale(0.97);
}

.continue-bar__action::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.38) 50%, transparent 70%);
  transform: translateX(120%);
  animation: bar-sheen 0.9s ease 0.15s;
  pointer-events: none;
}

@keyframes bar-tick {
  0% { transform: translateY(5px); opacity: 0.2; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes bar-sheen {
  to { transform: translateX(-120%); }
}

@media (prefers-reduced-motion: reduce) {
  .continue-bar__total,
  .continue-bar__count,
  .continue-bar__action::after { animation: none; }
}
</style>
