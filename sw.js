const CACHE_NAME = 'apna-study-offline-v1';

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action) {
    if (event.data.action === 'cache-file') {
      const urlToCache = event.data.url;
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            const request = new Request(urlToCache, { mode: 'no-cors' });
            return fetch(request)
              .then(response => {
                return cache.put(urlToCache, response);
              })
              .then(() => {
                event.ports[0].postMessage({ success: true });
              })
              .catch(error => {
                console.error('Caching failed:', error);
                event.ports[0].postMessage({ success: false, error: error.message });
              });
          })
      );
    }
    if (event.data.action === 'delete-cache') {
        const urlToDelete = event.data.url;
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                cache.delete(urlToDelete).then(wasDeleted => {
                    console.log(`Cache for ${urlToDelete} deleted: ${wasDeleted}`);
                });
            })
        );
    }
  }
});
