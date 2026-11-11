<template>
  <div class="menu-nav-wrap">
    <!-- Fixed leading actions, matching the reference: the list opens a sheet
         of all categories, the magnifier filters the menu. They stay put while
         the chip strip scrolls beside them. -->
    <button type="button" class="menu-nav__action" aria-label="فهرست منو" @click="$emit('open-sheet')">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M4 6h16M4 12h16M4 18h10" stroke-linecap="round" />
      </svg>
    </button>
    <button type="button" class="menu-nav__action" aria-label="جستجو در منو" @click="$emit('open-search')">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.2-3.2" stroke-linecap="round" />
      </svg>
    </button>

    <nav ref="strip" v-drag-scroll class="menu-nav" aria-label="دسته‌بندی منو">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :ref="'chip-' + cat.id"
        type="button"
        class="menu-nav__chip"
        :class="{ 'menu-nav__chip--active': cat.id === activeId }"
        :aria-current="cat.id === activeId ? 'true' : 'false'"
        @click="$emit('select', cat.id)"
      >
        {{ cat.text }}
      </button>
    </nav>
  </div>
</template>

<script>
import dragScroll from '../../../utils/dragScroll';

export default {
  name: 'MenuCategoryNav',
  directives: { dragScroll },
  props: {
    categories: { type: Array, default: () => [] },
    activeId: { type: String, default: null },
  },
  watch: {
    activeId() {
      this.$nextTick(this.revealActiveChip);
    },
  },
  mounted() {
    this.$nextTick(this.revealActiveChip);
  },
  methods: {
    /**
     * Slides the strip so the active tab is centred.
     *
     * Measured as a delta between two rects and applied with scrollBy, which is
     * relative and therefore direction-agnostic. The previous absolute version
     * assumed LTR: this strip is RTL, where Chrome reports offsetLeft and
     * scrollLeft as negative, so `Math.max(0, ...)` clamped every target to 0
     * and the strip never moved at all.
     */
    revealActiveChip() {
      const holder = this.$refs['chip-' + this.activeId];
      const chip = Array.isArray(holder) ? holder[0] : holder;
      const strip = this.$refs.strip;
      if (!chip || !strip) return;
      // Nothing to reveal before layout has run, and scrollBy on a zero-width
      // box would only fight the smooth animation.
      if (!strip.clientWidth || strip.scrollWidth <= strip.clientWidth) return;

      const stripRect = strip.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      const delta =
        (chipRect.left + chipRect.width / 2) - (stripRect.left + stripRect.width / 2);
      if (Math.abs(delta) < 1) return;

      // scrollIntoView would also scroll the page; move the strip itself only.
      strip.scrollBy({ left: delta, behavior: 'smooth' });
    },
  },
};
</script>

<style scoped>
/* Matches the reference strip: plain text tabs, 14px/600, 24px line box with
   12px side padding, active one darker with a 2px underline — not pills. */
.menu-nav-wrap {
  display: flex;
  align-items: stretch;
  /* No rule under the strip: the active tab's own underline is the divider,
     and a full-width grey line competed with it. */
  background: var(--laviz-surface);
}

.menu-nav__action {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  border: 0;
  background: transparent;
  color: var(--laviz-text);
  cursor: pointer;
}

.menu-nav {
  display: flex;
  gap: 0;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.menu-nav::-webkit-scrollbar {
  display: none;
}

.menu-nav__chip {
  position: relative;
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: var(--laviz-muted);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
  /* 48px tall: the comfortable minimum for a thumb (it was 40px). */
  padding: 12px 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease;
}

.menu-nav__chip::after {
  content: '';
  position: absolute;
  right: 12px;
  left: 12px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--laviz-primary);
  transform: scaleX(0);
  transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.menu-nav__chip--active {
  color: var(--laviz-text);
  font-weight: 700;
}

.menu-nav__chip--active::after {
  transform: scaleX(1);
}

.menu-nav__chip:active {
  opacity: 0.7;
}

/* The strip is scrolled programmatically as the page moves; hiding the native
   behaviour keeps that from stacking with a user's own inertial swipe. */
.menu-nav {
  overscroll-behavior-x: contain;
}
</style>
