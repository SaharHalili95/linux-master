/* global t */
window.courseReady = false;
window.courseLoadFailed = false;
document.documentElement.classList.add('learn-ready');
addEventListener('error', event => {
  const script = event.target instanceof HTMLScriptElement ? event.target : null;
  if (script?.hasAttribute('data-course') || [...document.querySelectorAll('script[data-course]')].some(s => s.src === event.filename)) {
    window.courseLoadFailed = true;
    const message = document.getElementById('toast'); message.textContent = t('triviaFailed'); message.classList.add('show');
  }
}, true);
