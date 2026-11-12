/* global COURSE, inTrack, renderPath, toHere, scrollMoved, openTracks, refreshGameplay, t */
(() => {
  document.documentElement.classList.add('learn-ready');
  if (window.courseLoadFailed) {
    refreshGameplay();
    const message = document.getElementById('toast'); message.textContent = t('triviaFailed'); message.classList.add('show');
    return;
  }
  COURSE.sort((a, b) => a.section - b.section || a.unit - b.unit);
  window.courseReady = true;
  refreshGameplay();
  const path = document.getElementById('path');
  let observer;
  function refresh() {
    if (!document.getElementById('learn').classList.contains('active')) { observer?.disconnect(); return; }
    if (document.getElementById('pop') || ['lesson', 'end', 'streakScreen'].some(id => !document.getElementById(id).hidden)) return false;
    observer?.disconnect();
    if (path.querySelectorAll('.unit-banner').length !== COURSE.filter(u => inTrack(u)).length) {
      const top = scrollY; renderPath(true);
      if (!scrollMoved) toHere('auto'); else scrollTo(0, top);
    }
    if (!document.getElementById('trackSheet').hidden) openTracks();
    return true;
  }
  if (refresh() === false) {
    observer = new MutationObserver(refresh);
    observer.observe(path, { childList: true, subtree: true });
    for (const id of ['lesson', 'end', 'streakScreen']) observer.observe(document.getElementById(id), { attributes: true, attributeFilter: ['hidden'] });
  }
})();
