self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear all caches unconditionally to prevent update issues
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Force network-first approach to ensure updates always work
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
