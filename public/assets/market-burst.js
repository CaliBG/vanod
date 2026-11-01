/**
 * One burst per document lifetime, triggered by the first downward pass.
 * No storage: reload re-arms it; reverse scroll and bfcache never replay it.
 * Only transform/opacity animate, so the page's scroll geometry stays fixed.
 */
const section = document.querySelector('[data-market-burst]');

if (section instanceof HTMLElement) {
  const heading = section.querySelector('h2');
  const coins = [...section.querySelectorAll('.burst-coin')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let played = false;
  let frame = 0;
  let previousY = window.scrollY;
  let animations = [];

  function stopWatching() {
    window.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function settle() {
    played = true;
    section.dataset.burstState = 'complete';
    stopWatching();
    animations.forEach(animation => animation.cancel());
    animations = [];
  }

  function burst() {
    if (played) return;
    played = true;
    stopWatching();
    section.dataset.burstState = 'playing';
    const title = heading.getBoundingClientRect();
    const originX = title.left + title.width / 2;
    const originY = title.top + title.height / 2;

    coins.forEach((coin, index) => {
      if (!(coin instanceof HTMLElement) || !coin.offsetWidth) return;
      // Offset metrics are unaffected by the final rotation in CSS.
      const stage = coin.offsetParent.getBoundingClientRect();
      const dx = originX - stage.left - coin.offsetLeft;
      const dy = originY - stage.top - coin.offsetTop;
      const tilt = parseFloat(getComputedStyle(coin).getPropertyValue('--tilt')) || 0;
      const direction = dx > 0 ? -1 : 1;
      const transform = (distance, scale, angle) =>
        `translate(calc(-50% + ${dx * distance}px), calc(-50% + ${dy * distance}px)) scale(${scale}) rotate(${angle}deg)`;
      animations.push(coin.animate([
        { transform: transform(1, .22, tilt - direction * 45), opacity: 0, offset: 0, easing: 'cubic-bezier(.16,.7,.25,1)' },
        { transform: transform(.82, .46, tilt - direction * 28), opacity: 1, offset: .12, easing: 'cubic-bezier(.18,.65,.2,1)' },
        { transform: transform(-.045, 1.035, tilt + direction * 5), opacity: 1, offset: .72, easing: 'cubic-bezier(.4,0,.35,1)' },
        { transform: transform(.008, .995, tilt - direction * 1.2), opacity: 1, offset: .89, easing: 'ease-out' },
        { transform: transform(0, 1, tilt), opacity: 1, offset: 1 },
      ], {
        duration: 1100 + (index % 3) * 70,
        delay: (index % 6) * 22,
        fill: 'both',
      }));
    });
    Promise.all(animations.map(animation => animation.finished)).then(settle).catch(() => {});
  }

  function inspect(downward) {
    if (played) return;
    const bounds = heading.getBoundingClientRect();
    // A deep link / restored scroll below this section should show the final
    // composition, rather than firing an unseen animation on the way back up.
    if (bounds.bottom <= 0) settle();
    else if (downward && bounds.top < window.innerHeight * .72) burst();
  }

  function onScroll() {
    if (frame || played) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const nextY = Math.max(0, window.scrollY);
      const downward = nextY > previousY;
      previousY = nextY;
      inspect(downward);
    });
  }

  if (!heading || reduced.matches || !Element.prototype.animate) {
    settle();
  } else {
    section.dataset.burstState = 'ready';
    window.addEventListener('scroll', onScroll, { passive: true });
    inspect(false);
  }
  // Resizing or backgrounding finishes an in-flight burst, preserving its
  // one-shot state while CSS takes care of the new responsive positions.
  window.addEventListener('resize', () => {
    if (section.dataset.burstState === 'playing') settle();
  }, { passive: true });
  window.addEventListener('pagehide', () => {
    if (section.dataset.burstState === 'playing') settle();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && section.dataset.burstState === 'playing') settle();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) settle(); });
}
