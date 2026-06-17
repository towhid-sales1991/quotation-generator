// Minimal service worker — enables PWA installability.
// Caches the app shell so it loads instantly; live data still comes from Google Sheets over network.

const CACHE_NAME = 'sales-dashboard-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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
  const req = event.request;

  // Only handle GET requests for our own app shell; let everything else
  // (Google Sheets API calls, CDN scripts, fonts) go straight to network.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAppShell = APP_SHELL.some((path) => req.url.endsWith(path.replace('./', '')));

  if (isAppShell) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
  // else: do nothing special, browser handles it normally (network)
});
