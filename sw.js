/* IDEAL Fastener — Quotation Generator service worker
   Just enough to make the page installable as a desktop/PWA app,
   plus opportunistic offline caching so it still opens without internet. */

const CACHE_NAME = 'ifa-quote-v1';
const PRECACHE_URLS = ['./', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // cache each asset individually so one missing file doesn't break install
      return Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // network-first: always prefer the latest deployed files when online,
  // only fall back to the cached copy if the network request fails (offline).
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
