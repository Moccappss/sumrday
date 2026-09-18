// Service Worker Khusus Admin Scope (/admin)
const ADMIN_CACHE = 'agenze-admin-v1';
const PRECACHE_ADMIN = [
  '/admin',
  '/manifest-admin.json',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(ADMIN_CACHE).then((cache) => cache.addAll(PRECACHE_ADMIN)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key.startsWith('agenze-admin-') && key !== ADMIN_CACHE).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Hanya tangkap URL admin
  if (url.origin === location.origin && url.pathname.startsWith('/admin')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then((res) => res || caches.match('/admin')))
    );
  }
});
