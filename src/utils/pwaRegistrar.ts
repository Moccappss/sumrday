/**
 * PWA Registrar Dinamis & Terisolasi
 * Menentukan manifest dan service worker terpisah sesuai rute:
 * - /admin/* -> manifest-admin.json & sw-admin.js (scope: /admin/)
 * - /client/* -> manifest-client.json & sw-client.js (scope: /client/)
 */

export const initDynamicPwa = () => {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname;
  let manifestUrl = '/manifest.json';
  let swScript: { url: string; scope: string } | null = null;

  if (path.startsWith('/admin')) {
    manifestUrl = '/manifest-admin.json';
    swScript = { url: '/sw-admin.js', scope: '/admin/' };
  } else if (path.startsWith('/client')) {
    manifestUrl = '/manifest-client.json';
    swScript = { url: '/sw-client.js', scope: '/client/' };
  }

  // 1. Update manifest link secara dinamis
  try {
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;
  } catch (e) {
    console.warn('[PWA] Gagal menyematkan manifest link:', e);
  }

  // 2. Registrasi Service Worker scope terisolasi
  if ('serviceWorker' in navigator && swScript) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(swScript!.url, { scope: swScript!.scope })
        .then((reg) => {
          console.log(`[PWA Isolated] Registered ${swScript!.url} on scope:`, reg.scope);
        })
        .catch((err) => {
          console.warn(`[PWA Isolated] Failed to register ${swScript!.url}:`, err);
        });
    });
  }
};

