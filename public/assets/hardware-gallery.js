// Real P3 engineering renders. Links still open each image without JavaScript.
const gallery = document.querySelector('[data-hardware-gallery]');
if (gallery) {
  const image = gallery.querySelector('#hardware-image');
  const detail = gallery.querySelector('#hardware-detail');
  const links = [...gallery.querySelectorAll('[data-hardware-view]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let request = 0;
  gallery.addEventListener('click', async (event) => {
    const link = event.target.closest('[data-hardware-view]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const current = ++request;
    if (link.getAttribute('aria-current') === 'true') {
      gallery.removeAttribute('aria-busy');
      detail.textContent = link.dataset.caption;
      return;
    }
    gallery.setAttribute('aria-busy', 'true');
    try {
      const next = new Image();
      next.src = link.href;
      await next.decode();
      if (current !== request) return;
      image.src = next.src;
      image.alt = link.dataset.alt;
      detail.textContent = link.dataset.caption;
      for (const item of links) {
        if (item === link) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      }
      image.getAnimations().forEach((animation) => animation.cancel());
      if (!reducedMotion.matches) image.animate([{ opacity: 0.65 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    } catch {
      if (current === request) detail.textContent = '图片暂时未能加载，请再次选择视角。';
    } finally {
      if (current === request) gallery.removeAttribute('aria-busy');
    }
  });
}
