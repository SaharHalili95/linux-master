const CACHE = 'linux-master-v33';
const FILES = ['./index.html', './fonts.css?v=p101', './styles.css?v=p107', './character.css?v=character1', './avatar-options.css?v=1', './gameplay.css?v=2', './loading.css?v=loading3', './shell.js?v=30', './i18n.js?v=p105', './units.js?v=p101', './lessons.js?v=p101', './world.js?v=retina3', './sync.js?v=gameplay3', './world-characters.js?v=1', './character-art.js?v=catalog1', './avatar-options.js?v=2', './game-progress.js?v=2', './story-missions.js?v=1', './coach-model.js?v=6', './coach-bank.js?v=3', './app.js?v=p107', './character.js?v=gameplay3', './course-start.js?v=loading5', './manifest.webmanifest', './icon-180.png?v=30', './icon-192.png', './icon-512.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

// Runs only after install filled the new cache, so an offline learner always has a full copy.
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === location.origin) event.respondWith(networkFirst(event.request));
  else if (FONT_HOSTS.includes(url.hostname)) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  })));
});

// The network first, so a fix reaches the learner at once; the last copy when offline. A new ?v= replaces the older copy of the same file.
async function networkFirst(request) {
  const cache = await caches.open(CACHE), url = new URL(request.url);
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
