// v-drag-scroll: lets a horizontally scrolling strip be dragged with the mouse.
//
// Touch screens already scroll such strips by swiping; this adds the same for
// a mouse, which matters now that the scrollbars are hidden. The formula
// `start - delta` is correct in both LTR and RTL, so no direction handling.
//
// A drag longer than a few pixels swallows the click that ends it, so letting
// go over a chip does not also select it.

const THRESHOLD_PX = 5;

export default {
  inserted(el) {
    el.classList.add('drag-scroll');
    let startX = 0;
    let startScroll = 0;
    let down = false;
    let moved = false;

    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < THRESHOLD_PX) return;
      if (!moved) {
        moved = true;
        el.classList.add('drag-scroll--dragging');
      }
      el.scrollLeft = startScroll - dx;
    };

    const end = () => {
      if (!down) return;
      down = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      el.classList.remove('drag-scroll--dragging');
      if (moved) {
        // The click that follows pointerup belongs to the drag, not the chip.
        const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        el.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', swallow, true), 0);
      }
    };

    el.__dragScroll = {
      onDown(e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true;
        moved = false;
        startX = e.clientX;
        startScroll = el.scrollLeft;
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
      },
      onDragStart(e) { e.preventDefault(); }, // stop native image/link dragging
    };
    el.addEventListener('pointerdown', el.__dragScroll.onDown);
    el.addEventListener('dragstart', el.__dragScroll.onDragStart);
  },
  unbind(el) {
    if (!el.__dragScroll) return;
    el.removeEventListener('pointerdown', el.__dragScroll.onDown);
    el.removeEventListener('dragstart', el.__dragScroll.onDragStart);
    delete el.__dragScroll;
  },
};
