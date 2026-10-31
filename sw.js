const CACHE = 'linux-master-v28';
const FILES = ['./', './index.html', './styles.css?v=28', './shell.js?v=28', './data/missions.js?v=28', './app.js?v=28', './data/content.js?v=28', './data/content.en.js?v=28', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png?v=28'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // The beta lives under the same scope; caching its pages here would replace the main app's index.html.
  if (new URL(event.request.url).pathname.includes('/prototype/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request.url, { cache: 'no-cache' }).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (FONT_HOSTS.includes(new URL(event.request.url).hostname)) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
