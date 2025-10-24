const CACHE_NAME = 'fixbuddy-pwa-v1';
const PRECACHE_URLS = [
  '/',
  '/UserDashboard/view-my-tickets.html',
  '/UserDashboard/JS/view-my-tickets.js',
  '/UserDashboard/CSS STYLING/STYLING-UNIVERSAL.css',
  '/backend/offline-tickets.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
      // Cache same-origin responses
      if (resp && resp.status === 200 && resp.type === 'basic'){
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
      }
      return resp;
    }).catch(()=> caches.match('/backend/offline-tickets.json')))
  );
});
