const CACHE_NAME = 'fixbuddy-cache-v1';
const urlsToCache = [
  '/',
  '/Main Dashboard/UserLoginPage.html',
  '/UserDashboard/UserDashboard.html',
  '/UserDashboard/submitticket.html',
  '/Main Dashboard/CSS STYLING/STYLING-UNIVERSAL.css',
  '/UserDashboard/CSS STYLING/STYLING-UNIVERSAL.css',
  // Add more HTML, JS, CSS, images as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
