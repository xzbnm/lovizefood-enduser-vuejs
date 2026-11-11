// v-page-drag: with a mouse, pressing and dragging on the page scrolls it, the
// way a finger does on a phone, instead of selecting the text under the
// pointer. Touch screens already scroll by swiping, so only mouse pointers are
// handled.
//
// - A drag longer than a few pixels swallows the click that ends it, so
//   letting go over a button does not also press it.
// - After letting go the page keeps gliding for a moment (not with reduced
//   motion).
// - It scrolls whatever scrolls under the pointer: the page, or the basket,
//   a sheet or a modal when the drag starts inside one.
// - Form fields, the maps and strips that scroll sideways keep their own
//   behaviour.

import { reducedMotion } from './motion';

const THRESHOLD_PX = 5;
const IGNORE = [
  'input', 'textarea', 'select', '[contenteditable]',
  '.drag-scroll', '.leaflet-container', '.mpm', '.b-toast', '.v-no-page-drag',
].join(',');

// The nearest ancestor that can scroll vertically, or null for the page.
function scrollerFor(node) {
  for (let n = node; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) return n;
  }
  return null;
}

export default {
  inserted(el) {
    let down = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0; // px per ms, positive = page moves down
    let glide = 0;
    let scroller = null; // null = the page itself

    const allowed = (e) => e.button === 0 && !e.target.closest(IGNORE);
    const by = (dy) => (scroller ? (scroller.scrollTop += dy) : window.scrollBy(0, dy));

    const stopGlide = () => { if (glide) { cancelAnimationFrame(glide); glide = 0; } };

    const onMove = (e) => {
      if (!down) return;
      if (!moved) {
        if (Math.abs(e.clientY - startY) < THRESHOLD_PX && Math.abs(e.clientX - startX) < THRESHOLD_PX) return;
        moved = true;
        document.documentElement.classList.add('page-dragging');
      }
      const now = performance.now();
      const dy = e.clientY - lastY;
      const dt = Math.max(1, now - lastT);
      velocity = 0.8 * velocity + 0.2 * (-dy / dt);
      by(-dy);
      lastY = e.clientY;
      lastT = now;
    };

    const coast = () => {
      let prev = performance.now();
      const step = (now) => {
        const dt = now - prev;
        prev = now;
        by(velocity * dt);
        velocity *= Math.pow(0.94, dt / 16);
        glide = Math.abs(velocity) > 0.02 ? requestAnimationFrame(step) : 0;
      };
      glide = requestAnimationFrame(step);
    };

    const end = () => {
      if (!down) return;
      down = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      document.documentElement.classList.remove('page-dragging');
      if (moved) {
        // The click that follows belongs to the drag, not to what is under it.
        const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        window.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', swallow, true), 0);
        if (!reducedMotion() && Math.abs(velocity) > 0.1 && performance.now() - lastT < 80) coast();
      }
    };

    el.__pageDrag = {
      onPointerDown(e) {
        stopGlide();
        if (e.pointerType !== 'mouse' || !allowed(e)) return;
        down = true;
        moved = false;
        velocity = 0;
        scroller = scrollerFor(e.target);
        startX = e.clientX;
        startY = lastY = e.clientY;
        lastT = performance.now();
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
      },
      // Pressing the mouse would start a text selection; stop it before it begins.
      onMouseDown(e) { if (allowed(e)) e.preventDefault(); },
      onDragStart(e) { if (!e.target.closest(IGNORE)) e.preventDefault(); },
      onWheel: stopGlide,
    };
    // On the document, not on el: bootstrap-vue moves modals to <body>, outside
    // the page element.
    document.addEventListener('pointerdown', el.__pageDrag.onPointerDown);
    document.addEventListener('mousedown', el.__pageDrag.onMouseDown);
    document.addEventListener('dragstart', el.__pageDrag.onDragStart);
    document.addEventListener('wheel', el.__pageDrag.onWheel, { passive: true });
  },
  unbind(el) {
    const h = el.__pageDrag;
    if (!h) return;
    document.removeEventListener('pointerdown', h.onPointerDown);
    document.removeEventListener('mousedown', h.onMouseDown);
    document.removeEventListener('dragstart', h.onDragStart);
    document.removeEventListener('wheel', h.onWheel);
    document.documentElement.classList.remove('page-dragging');
    delete el.__pageDrag;
  },
};
