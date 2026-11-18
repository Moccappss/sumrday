// Service Worker Migrasi Pembersih: Menyerahkan kontrol penuh ke /sw.js (VitePWA)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((k) => k.startsWith('sumrday-admin-')).map((k) => caches.delete(k))
        );
      });
    })
  );
});
