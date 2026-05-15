function resetScrollTargets() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.documentElement.scrollLeft = 0;
  document.body.scrollTop = 0;
  document.body.scrollLeft = 0;

  document.querySelectorAll('.screen-stage, .screen-transition').forEach(element => {
    if (element instanceof HTMLElement) {
      element.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  });
}

export function resetPublicPageScrollToTop() {
  if (typeof window === 'undefined') return;

  resetScrollTargets();
  window.requestAnimationFrame(resetScrollTargets);
}
