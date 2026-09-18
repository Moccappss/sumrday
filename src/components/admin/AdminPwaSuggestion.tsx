import React from 'react';

/**
 * Direct PWA Native Installer - No Modals
 * Triggers the browser's native installation prompt immediately.
 */
export const triggerPwaInstall = async (): Promise<{ success: boolean; outcome?: string; message?: string }> => {
  if (typeof window === 'undefined') return { success: false, message: 'Window not defined' };

  // 1. Check if already standalone
  const isStandalone = (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  if (isStandalone) {
    return { success: true, outcome: 'already_installed', message: 'Aplikasi Agenze CMS sudah terpasang di perangkat ini.' };
  }

  // 2. Direct browser beforeinstallprompt
  const p = (window as any).__pwaInstallPrompt;
  if (p && typeof p.prompt === 'function') {
    try {
      await p.prompt();
      const choice = await p.userChoice;
      if (choice?.outcome === 'accepted') {
        (window as any).__pwaInstallPrompt = null;
        return { success: true, outcome: 'accepted' };
      }
      return { success: false, outcome: 'dismissed' };
    } catch (err: any) {
      console.warn('[PWA] Direct prompt error:', err);
    }
  }

  // 3. Fallback: If browser already has native install button on address bar / menu
  return { 
    success: false, 
    outcome: 'browser_native',
    message: 'Silakan gunakan tombol install pada bilah URL browser atau menu "Tambahkan ke Layar Utama".'
  };
};

export const AdminPwaSuggestion: React.FC = () => null;

export default AdminPwaSuggestion;
