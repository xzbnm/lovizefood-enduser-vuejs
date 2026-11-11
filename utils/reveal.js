// v-reveal: an element fades and rises into place the first time it scrolls
// into view. Elements that arrive together (the first screen) are staggered.
//
// It does nothing without IntersectionObserver or when reduced motion is on,
// so the content is always shown in those cases.

import { reducedMotion } from './motion';

const MAX_STAGGER_STEPS = 6;
const STEP_MS = 55;

let observer = null;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver((entries) => {
    let step = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.setProperty('--reveal-delay', `${Math.min(step++, MAX_STAGGER_STEPS) * STEP_MS}ms`);
      el.classList.add('reveal--in');
      observer.unobserve(el);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  return observer;
}

export default {
  inserted(el) {
    if (typeof IntersectionObserver === 'undefined' || reducedMotion()) return;
    el.classList.add('reveal');
    getObserver().observe(el);
  },
  unbind(el) {
    if (observer) observer.unobserve(el);
  },
};
