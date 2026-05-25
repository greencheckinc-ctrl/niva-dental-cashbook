// Niva Dental – Service Worker v1
const CACHE = 'niva-dental-v1';
const ASSETS = [
  '/niva-dental-cashbook/',
  '/niva-dental-cashbook/index.html'
];

// Install — cache app shell
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', function(e){
  // Skip non-GET and external requests
  if(e.request.method !== 'GET') return;
  if(!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response){
        // Cache fresh copy
        var copy = response.clone();
        caches.open(CACHE).then(function(cache){
          cache.put(e.request, copy);
        });
        return response;
      })
      .catch(function(){
        // Offline fallback from cache
        return caches.match(e.request).then(function(cached){
          return cached || caches.match('/niva-dental-cashbook/index.html');
        });
      })
  );
});
