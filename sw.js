// Café Kon-Tiki service worker: keeps the app usable with no connection.
// Strategy: answer from the cache at once, refresh the cache in the background when online.
// An updated version therefore shows up on the second launch after it was published.
const CACHE = 'cafe-kontiki-shell-v2';
const SHELL = ['./', './index.html', './menu.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './logo.jpg'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  ev.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req).then(res => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      });
      if (cached) { fresh.catch(() => {}); return cached; }
      return fresh;
    })
  );
});
