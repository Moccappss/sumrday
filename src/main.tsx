import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import { initDynamicPwa } from './utils/pwaRegistrar';
import './index.css';
import App from './App';

// Inisialisasi PWA Scope terisolasi (/admin vs /client)
initDynamicPwa();

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
