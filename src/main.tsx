import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import { initDynamicPwa } from './utils/pwaRegistrar';
import { initHardwareAdaptiveEngine } from './utils/hardwareAdaptiveEngine';
import { initSmartUiUxEngine } from './utils/intelligentUiUxEngine';
import { crashProofEngine } from './utils/crashProofZeroDowntimeEngine';
import './index.css';
import App from './App';

// Inisialisasi PWA Scope terisolasi (/admin vs /client) & Proteksi Crash
initDynamicPwa();
initHardwareAdaptiveEngine();
crashProofEngine.init();
initSmartUiUxEngine();

// Deferred Autonomous Background Engines (Mengurangi TBT & mempercepat First Paint DOM)
const runDeferredEngines = () => {
  import('./utils/predictiveIntentEngine').then((m) => m.initPredictiveIntentEngine()).catch(() => {});
  import('./utils/smartMediaOptimizer').then((m) => m.initSmartMediaSelfHealing()).catch(() => {});
  import('./utils/solarCircadianEngine').then((m) => m.initSolarCircadianEngine()).catch(() => {});
  import('./utils/smartExitIntentRecovery').then((m) => m.initSmartExitIntentEngine()).catch(() => {});
  import('./utils/intelligentStorageEngine').then((m) => m.initIntelligentStorageEngine()).catch(() => {});
};

if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runDeferredEngines, { timeout: 1200 });
  } else {
    setTimeout(runDeferredEngines, 120);
  }
}

// Auto-recovery penanganan chunk mismatch setelah deployment baru (dengan anti-loop protection)
if (typeof window !== 'undefined') {
  const canReloadWithCooldown = (lockKey: string): boolean => {
    try {
      const lastReload = Number(sessionStorage.getItem(lockKey) || 0);
      const now = Date.now();
      if (now - lastReload > 10000) {
        sessionStorage.setItem(lockKey, String(now));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  window.addEventListener('vite:preloadError', (event) => {
    // Beri jeda minimal 10 detik agar tidak terjadi loop refresh tak terhingga
    if (canReloadWithCooldown('vite_preload_reload_lock')) {
      console.warn('[Vite Preload Error] Modul versi baru terdeteksi, memuat ulang halaman...');
      window.location.reload();
    } else {
      console.warn('[Vite Preload Error] Loop terdeteksi dicegah, menolak reload berulang:', event);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || '';
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      event?.reason?.name === 'ChunkLoadError'
    ) {
      if (canReloadWithCooldown('chunk_reload_lock')) {
        console.warn('[Chunk Load Error] Memuat ulang halaman untuk mengambil versi bundle terbaru...');
        window.location.reload();
      } else {
        console.warn('[Chunk Load Error] Loop terdeteksi dicegah.');
      }
    }
  });
}

// Optimize TanStack Query caching for snappy performance and zero redundant requests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
      gcTime: 30 * 60 * 1000,   // 30 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Automatic Service Worker registration for PWA offline capabilities
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('porto_pwa_update_ready', {
        detail: { updateSW }
      }));
    },
    onOfflineReady() {
      console.log('[PWA] App is ready for offline use.');
      window.dispatchEvent(new CustomEvent('porto_pwa_offline_ready'));
    },
    onRegistered(registration) {
      console.log('[PWA] Service Worker registered successfully:', registration?.scope);
    },
    onRegisterError(error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
