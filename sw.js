/* =========================================================================
   SERVICE WORKER (sw.js) - SMART OFFLINE CACHING & PWA FEATURES
   =========================================================================
   This file runs in the browser's service worker thread and handles:
   - Offline caching with intelligent strategies
   - Background synchronization
   - Network timeout handling
   - Cache versioning and cleanup
========================================================================= */

// =========================================================================
// CACHE CONFIGURATION
// =========================================================================
// CACHE VERSIONING - Auto-invalidate old caches when you update assets
// Increment this version number to automatically clear and rebuild cache
const CACHE_VERSION = 'v3';
const CACHE_NAME = `fixbuddy-pwa-${CACHE_VERSION}`;

// NETWORK TIMEOUT - Prevent hanging on slow/dead connections (milliseconds)
const NETWORK_TIMEOUT = 5000; // 5 seconds

// CRITICAL ASSETS TO PRECACHE - Loaded on service worker install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/CSS-STYLING-UNIVERSAL/STYLING-UNIVERSAL.css',
  '/UserDashboard/view-my-tickets.html',
  '/UserDashboard/submitticket.html',
  '/UserDashboard/MyTickets.html'
];

// =========================================================================
// SW INSTALL EVENT - Download and cache critical assets on first load
// =========================================================================
self.addEventListener('install', event => {
  // Activate this SW immediately without waiting for all pages to close
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Precaching critical assets...');
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// =========================================================================
// SW ACTIVATE EVENT - Clean up old cache versions & take control of pages
// =========================================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Delete any cache that doesn't match current version
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache -', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients (pages) to use this new SW version
      self.clients.claim();
      console.log('Service Worker: Activated and claimed all pages');
    })
  );
});

// =========================================================================
// HELPER FUNCTION - Fetch with timeout to prevent hanging
// =========================================================================
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

// =========================================================================
// SW FETCH EVENT - Handle all network requests intelligently
// =========================================================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // LEGACY PATH REDIRECT - Handle old incorrect CSS path from stale cache
  // (in case old pages were cached before the fix)
  if (url.pathname.includes('/Main%20Dashboard/css-styling/')) {
    console.warn('Service Worker: Redirecting legacy path to correct stylesheet');
    event.respondWith(fetch('/CSS-STYLING-UNIVERSAL/STYLING-UNIVERSAL.css'));
    return;
  }

  // Only handle GET requests (ignore POST, PUT, DELETE, etc)
  if (event.request.method !== 'GET') return;

  // ====================================================================
  // STRATEGY 1: STALE-WHILE-REVALIDATE for HTML pages (navigate mode)
  // Serve instantly from cache, update in background
  // ====================================================================
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetchWithTimeout(event.request, NETWORK_TIMEOUT)
          .then(resp => {
            if (resp && resp.status === 200 && resp.type === 'basic') {
              const copy = resp.clone();
              caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
            }
            return resp;
          })
          .catch(err => {
            console.warn('Service Worker: Network error, using cache:', err);
            return cached || caches.match('/offline.html');
          });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ====================================================================
  // STRATEGY 2: NETWORK-FIRST for stylesheets
  // Always try network first to avoid stale CSS, fallback to cache
  // ====================================================================
  if (url.pathname.endsWith('STYLING-UNIVERSAL.css')) {
    event.respondWith(
      fetchWithTimeout(event.request, NETWORK_TIMEOUT)
        .then(resp => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          }
          return resp;
        })
        .catch(err => {
          console.warn('Service Worker: Stylesheet network failed, using cache:', err);
          return caches.match(event.request);
        })
    );
    return;
  }

  // ====================================================================
  // STRATEGY 3: CACHE-FIRST for other assets
  // Use cache if available, fallback to network with timeout
  // ====================================================================
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached; // Return from cache immediately if available
      
      return fetchWithTimeout(event.request, NETWORK_TIMEOUT)
        .then(resp => {
          // Cache successful responses
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          }
          return resp;
        })
        .catch(err => {
          console.warn('Service Worker: Request failed, returning offline fallback:', err);
          // Return offline fallback for failed requests
          return caches.match('/backend/offline-tickets.json');
        })
    })
  );
});

// =========================================================================
// SW MESSAGE HANDLER - Allow pages to communicate with service worker
// =========================================================================
self.addEventListener('message', event => {
  // SKIP_WAITING message - Install waiting SW immediately
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received SKIP_WAITING command');
    self.skipWaiting();
  }
  
  // CLEAR_CACHE message - Remove all cached data on demand
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Service Worker: Clearing all cached data');
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true, message: 'Cache cleared' });
    });
  }
});

// =========================================================================
// SW BACKGROUND SYNC EVENT - Sync pending tickets when user comes online
// NOTE: This requires your app to register sync via:
// navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-tickets'))
// and requires a backend endpoint at POST /api/sync-pending-tickets
// =========================================================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tickets') {
    console.log('Service Worker: Background sync triggered for tickets');
    event.waitUntil(
      // Only attempt sync if endpoint exists, otherwise just log
      fetch('/api/sync-pending-tickets', { method: 'POST' })
        .then(resp => {
          if (resp.ok) return resp.json();
          throw new Error('Sync endpoint not available');
        })
        .then(data => {
          console.log('Service Worker: Tickets synced:', data);
        })
        .catch(err => {
          console.log('Service Worker: Sync skipped (endpoint unavailable):', err.message);
        })
    );
  }
});
