const CACHE_NAME = 'apna-study-offline-v1';

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // सिर्फ http या https वाली रिक्वेस्ट को ही हैंडल करें
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // अगर फ़ाइल कैश में (डाउनलोड की हुई) है, तो उसे दिखाओ
      if (cachedResponse) {
        return cachedResponse;
      }
      // अगर कैश में नहीं है, तो इंटरनेट से fetch करो
      return fetch(event.request);
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'cache-file') {
    const urlToCache = event.data.url;
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          // --- यहाँ मुख्य बदलाव किया गया है ---
          // 'no-cors' को हटा दिया गया है ताकि वीडियो सही से डाउनलोड हो सकें
          return fetch(urlToCache) 
            .then(response => {
              if (!response.ok) {
                throw new Error(`Network response was not ok for ${urlToCache}`);
              }
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
  if (event.data && event.data.action === 'delete-cache') {
    const urlToDelete = event.data.url;
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.delete(urlToDelete);
      })
    );
  }
});
