// ── Niva Dental – Service Worker ──────────────────────────────────────────
// Version: bump this string to force cache refresh
const CACHE_NAME = 'niva-dental-v2';

// Files to cache on install (add your icon paths if hosting separately)
const PRECACHE_URLS = [
  './',
  './index-modified-2.html'
];

// ── Install: pre-cache shell ───────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first, fallback to cache ───────────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (Firebase, API calls, etc.)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a clone of valid responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Final fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./');
          }
        });
      })
  );
});
