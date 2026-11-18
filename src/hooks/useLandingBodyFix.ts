import { useEffect } from 'react';

/**
 * useLandingBodyFix
 *
 * Ensures html/body/#root is smoothly scrollable on landing/client pages,
 * while hiding the browser's native/chunky right-edge scrollbars so ONLY
 * the sleek floating scroll radar pill acts as the page navigation.
 *
 * Smooth mouse wheel, touch scroll, and keyboard navigation remain fully intact.
 */
export function useLandingBodyFix() {
  useEffect(() => {
    const styleId = 'lp-body-scroll-fix';
    const isClientRoute = typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin');

    if (isClientRoute) {
      let style = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      
      style.textContent = `
        html, body {
          position: static !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh !important;
          max-height: none !important;
          display: block !important;
          touch-action: pan-y !important;
          -webkit-overflow-scrolling: touch !important;
          scroll-behavior: smooth !important;
          /* Sembunyikan scrollbar bawaan browser (Firefox & IE) */
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        #root {
          display: block !important;
          overflow: visible !important;
          height: auto !important;
          min-height: 100vh !important;
          touch-action: pan-y !important;
        }

        /* ── SEMBUNYIKAN SCROLLBAR BAWAAN BROWSER (CHROME, SAFARI, EDGE) ── */
        /* Menghilangkan scrollbar ganda/dobel sehingga hanya pill radar melayang yang tampil */
        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        #root::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
      `;
    } else {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    }

    return () => {
      // Only remove if navigating to admin routes to prevent stylesheet thrashing between client pages
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        const el = document.getElementById(styleId);
        if (el) el.remove();
      }
    };
  }, []);
}

