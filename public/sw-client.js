// Service Worker Khusus Client & Game Launcher Scope (/client)
const CLIENT_CACHE = 'agenze-client-launcher-v1';
const PRECACHE_CLIENT = [
  '/client',
  '/manifest-client.json',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CLIENT_CACHE).then((cache) => cache.addAll(PRECACHE_CLIENT)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key.startsWith('agenze-client-') && key !== CLIENT_CACHE).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Tangkap request di scope klien
  if (url.origin === location.origin && url.pathname.startsWith('/client')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const copy = networkResponse.clone();
            caches.open(CLIENT_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        }).catch(() => caches.match('/client'));
      })
    );
  }
});
