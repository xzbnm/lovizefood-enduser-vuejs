<template>
  <!--
    Bottom sheet listing every category with how many items it holds, so a long
    menu can be jumped through without scrolling the strip. Picking one closes
    the sheet and hands the id back for scrolling.
  -->
  <transition name="menu-sheet">
    <div v-if="visible" class="menu-sheet" @click.self="close">
      <div class="menu-sheet__panel" role="dialog" aria-label="فهرست منو">
        <div class="menu-sheet__grip" aria-hidden="true"></div>

        <header class="menu-sheet__header">
          <button type="button" class="menu-sheet__close" aria-label="بستن" @click="close">✕</button>
          <h2 class="menu-sheet__title">منو</h2>
        </header>

        <ul class="menu-sheet__list">
          <li v-for="cat in categories" :key="cat.id">
            <button type="button" class="menu-sheet__item" @click="pick(cat.id)">
              <span class="menu-sheet__count">{{ toFa(cat.count) }}</span>
              <span class="menu-sheet__name">{{ cat.text }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'MenuSheet',
  props: {
    visible: { type: Boolean, default: false },
    // [{ id, text, count }]
    categories: { type: Array, default: () => [] },
  },
  watch: {
    visible(open) {
      // Stop the page behind the sheet from scrolling with the sheet open.
      if (typeof document === 'undefined') return;
      document.body.style.overflow = open ? 'hidden' : '';
    },
  },
  beforeDestroy() {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  },
  methods: {
    close() {
      this.$emit('update:visible', false);
    },
    pick(id) {
      // Close first: the open sheet locks body scrolling, so emitting select
      // while it is still up makes the parent's scrollTo land short.
      this.close();
      this.$nextTick(() => {
        // One more frame so the overflow lock is actually lifted.
        requestAnimationFrame(() => this.$emit('select', id));
      });
    },
    toFa(n) {
      return Number(n || 0).toLocaleString('fa-IR');
    },
  },
};
</script>

<style scoped>
.menu-sheet {
  position: fixed;
  inset: 0;
  z-index: 1035; /* below bootstrap-vue's modal layer (1040/1050) */
  background: var(--lz-modal-backdrop);
  display: flex;
  align-items: flex-end;
}

.menu-sheet__panel {
  width: 100%;
  max-height: 78vh;
  overflow-y: auto;
  background: var(--lz-surface-raised);
  border: 1px solid var(--lz-sheet-border);
  border-bottom: 0;
  box-shadow: var(--lz-shadow-sheet);
  border-radius: 24px 24px 0 0;
  padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
}

.menu-sheet__grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--laviz-border);
  margin: 4px auto 8px;
}

.menu-sheet__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0 8px;
  flex-direction: row-reverse;
  justify-content: space-between;
}

.menu-sheet__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 28px;
  margin: 0;
  color: var(--laviz-text);
}

.menu-sheet__close {
  border: 0;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  color: var(--laviz-text);
  cursor: pointer;
  padding: 4px;
}

.menu-sheet__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-sheet__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row-reverse;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 14px 0;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  color: var(--laviz-text);
  cursor: pointer;
  border-bottom: 1px solid var(--laviz-border-light, #f6f6f6);
}

.menu-sheet__list li:last-child .menu-sheet__item {
  border-bottom: 0;
}

.menu-sheet__count {
  font-size: 14px;
  font-weight: 400;
  color: var(--laviz-muted);
}

.menu-sheet-enter-active,
.menu-sheet-leave-active {
  transition: opacity 0.2s ease;
}

.menu-sheet-enter-active .menu-sheet__panel,
.menu-sheet-leave-active .menu-sheet__panel {
  transition: transform 0.25s ease;
}

.menu-sheet-enter,
.menu-sheet-leave-to {
  opacity: 0;
}

.menu-sheet-enter .menu-sheet__panel,
.menu-sheet-leave-to .menu-sheet__panel {
  transform: translateY(100%);
}
</style>
