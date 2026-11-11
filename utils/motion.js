// Small motion helpers. Everything here is skipped when the visitor has asked
// the system for reduced motion, and none of it is needed to use the page.

export function reducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The add button is replaced by a stepper the moment it is tapped, so its
// position has to be remembered at the start of the tap.
let lastTapRect = null;
let lastMediaRect = null;

export function trackTaps() {
  if (typeof document === 'undefined') return;
  document.addEventListener('pointerdown', (e) => {
    const button = e.target && e.target.closest ? e.target.closest('button') : null;
    lastTapRect = button ? button.getBoundingClientRect() : null;
    const media = e.target && e.target.closest ? e.target.closest('.product-card__media') : null;
    lastMediaRect = media ? media.getBoundingClientRect() : null;
  }, true);
}

/** A small dot arcs from the tapped add button to the basket bar. */
export function flyToCart() {
  if (reducedMotion() || !lastTapRect || !lastTapRect.width) return;
  const from = lastTapRect;
  const bar = document.querySelector('.continue-bar__action');
  const to = bar
    ? bar.getBoundingClientRect()
    : { left: window.innerWidth / 2 - 20, top: window.innerHeight - 56, width: 40, height: 40 };

  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const dx = to.left + to.width / 2 - startX;
  const dy = to.top + to.height / 2 - startY;

  const dot = document.createElement('span');
  dot.className = 'fly-dot';
  dot.style.left = `${startX - 7}px`;
  dot.style.top = `${startY - 7}px`;
  document.body.appendChild(dot);

  const anim = dot.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(0.85)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.25 },
    ],
    { duration: 640, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  );
  anim.onfinish = () => dot.remove();
  anim.oncancel = () => dot.remove();
}

/** Where the product photo that was just tapped sits, once; used to grow the
 *  enlarged photo out of it. */
export function takeMediaRect() {
  const rect = lastMediaRect;
  lastMediaRect = null;
  return rect;
}
