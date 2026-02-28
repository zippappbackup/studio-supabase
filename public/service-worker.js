/* public/service-worker.js - minimal, self-contained for vendordataset snapshot caching */
const CACHE_NAME = 'zipp-json-cache-v1';
const SNAPSHOT_PATH_IDENTIFIER = '/snapshots/vendordataset_';

self.addEventListener('install', (evt) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  try {
    const url = new URL(event.request.url);
    if (url.pathname.includes(SNAPSHOT_PATH_IDENTIFIER) && url.pathname.endsWith('.json')) {
      event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        try {
          const networkResponse = await fetch(event.request, { mode: 'cors' });
          if (networkResponse && networkResponse.ok) {
            // Clone & cache, but ignore caching errors
            cache.put(event.request, networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
        } catch (e) {
          // network failed, will fallback to cache below
        }
        if (cached) return cached;
        // Safe fallback for missing snapshot
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })());
    }
  } catch (e) {
    // On unexpected parse errors, let the browser handle the request normally.
  }
});
