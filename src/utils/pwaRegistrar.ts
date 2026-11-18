/**
 * PWA Registrar Dinamis
 * Menentukan manifest dan meta tags terpisah sesuai rute:
 * - /admin/* -> manifest-admin.json & tema sumr.day OS
 * - /client/* & rute publik -> manifest-client.json & tema sumr.day
 * 
 * Pengelolaan Service Worker disatukan via VitePWA Workbox (/sw.js)
 * untuk mencegah konflik registrasi ganda dan infinite reload loop.
 */

export const initDynamicPwa = () => {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname;
  const isAdmin = path.startsWith('/admin');
  const manifestUrl = isAdmin ? '/manifest-admin.json' : '/manifest-client.json';
  const appTitle = isAdmin ? 'sumr.day OS' : 'sumr.day';
  const themeColor = isAdmin ? '#050507' : '#09090b';

  // 1. Update manifest link dan meta tags secara dinamis
  try {
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    if (manifestLink.getAttribute('href') !== manifestUrl) {
      manifestLink.href = manifestUrl;
    }

    const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaTitle) metaTitle.setAttribute('content', appTitle);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', themeColor);
  } catch (e) {
    console.warn('[PWA] Gagal menyematkan manifest link:', e);
  }

  // 2. Bersihkan service worker usang / terduplikasi (sw-client.js / sw-admin.js)
  // agar hanya ada SATU Service Worker kanonikal (/sw.js dari VitePWA) yang mengendalikan scope
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
        if (scriptUrl.includes('sw-client.js') || scriptUrl.includes('sw-admin.js')) {
          console.log('[PWA Clean] Menghapus Service Worker usang bentrok:', scriptUrl);
          reg.unregister();
        }
      }
    }).catch(() => {});
  }
};
