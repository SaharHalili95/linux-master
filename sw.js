const CACHE = 'linux-master-v29';
const FILES = ['./', './index.html', './styles.css?v=29', './shell.js?v=29', './data/missions.js?v=29', './app.js?v=29', './data/content.js?v=29', './data/content.en.js?v=29', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png?v=29'];
const LEARN = 'linux-master-learn';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && key !== LEARN).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).pathname.includes('/prototype/')) return event.respondWith(learnMode(event.request));
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

// Learn mode: the network first, so a fix reaches the learner at once; the last copy when offline. It has its own
// cache so its index.html never replaces the main app's. A new ?v= replaces the older copy of the same file.
async function learnMode(request) {
  const cache = await caches.open(LEARN), url = new URL(request.url);
  const page = /\/(index\.html)?$/.test(url.pathname), key = page ? url.origin + url.pathname.replace(/\/(index\.html)?$/, '/index.html') : request.url;
  try {
    const response = await (page ? fetch(request.url, { cache: 'no-cache' }) : fetch(request));
    if (response.ok) {
      for (const old of await cache.keys()) if (old.url !== key && new URL(old.url).pathname === new URL(key).pathname) cache.delete(old);
      await cache.put(key, response.clone());
    }
    return response;
  } catch (error) {
    return (await cache.match(key)) || Promise.reject(error);
  }
}
