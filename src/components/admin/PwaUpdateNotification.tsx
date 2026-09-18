import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export const PwaUpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleWaitingWorker = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }
    };

    // Check existing registration
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        handleWaitingWorker(reg);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });
      }
    });

    // Listen to controller change (once new SW activates, reload)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleApplyUpdate = () => {
    setIsReloading(true);
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 16,
        right: 18,
        zIndex: 99999,
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(79, 70, 229, 0.95))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: '0 16px 36px -6px rgba(37, 99, 235, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 380,
        fontSize: 12,
        animation: 'slideInDown 0.35s ease'
      }}
    >
      <div 
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Sparkles size={16} color="#ffffff" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1.2 }}>Pembaruan Siap!</div>
        <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>Fitur baru terdeteksi. Muat ulang untuk sinkronisasi.</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleApplyUpdate}
          disabled={isReloading}
          style={{
            background: '#ffffff',
            color: '#1d4ed8',
            border: 'none',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          <RefreshCw size={12} className={isReloading ? 'animate-spin' : ''} />
          {isReloading ? 'Memuat...' : 'Muat Ulang'}
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Tutup"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default PwaUpdateNotification;
