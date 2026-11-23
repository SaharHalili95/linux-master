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
// The simulator and the full course start downloading only after the first screen has loaded, so they never delay it.
const COURSE_FILES = ['recorded.js?v=p101', 'parts/p1.js?v=p101', 'parts/p2.js?v=p101', 'parts/p3.js?v=p101', 'parts/p4.js?v=p101', 'recorded/p5.js?v=p101', 'recorded/p6.js?v=p101', 'recorded/p7.js?v=p101', 'recorded/p8.js?v=p101', 'recorded/p9.js?v=p101', 'parts/p5.js?v=p101', 'parts/p6.js?v=p101', 'parts/p7.js?v=p101', 'parts/p8.js?v=p101', 'parts/p9.js?v=p101', 'parts/p10.js?v=p101', 'recorded/coverage.js?v=p101', 'parts/p11.js?v=p101', 'recorded/p12.js?v=p101', 'recorded/p13.js?v=p101', 'recorded/p14.js?v=p101', 'recorded/p15.js?v=p101', 'parts/p12.js?v=p101', 'parts/p13.js?v=p101', 'parts/p14.js?v=p101', 'parts/p15.js?v=p101', 'course-ready.js?v=gameplay3'];
function loadCourse() {
  for (const src of ['shell.js?v=30', ...COURSE_FILES]) {
    const script = document.createElement('script');
    script.src = src; script.async = false;
    if (src !== 'shell.js?v=30') script.dataset.course = '';
    document.body.append(script);
  }
}
const afterPaint = () => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
const whenIdle = async () => {
  await document.querySelector('.world-character-art')?.decode().catch(() => {});
  await afterPaint();
  if (window.requestIdleCallback) requestIdleCallback(loadCourse, { timeout: 1000 }); else setTimeout(loadCourse, 200);
};
if (document.readyState === 'complete') whenIdle(); else addEventListener('load', whenIdle, { once: true });
