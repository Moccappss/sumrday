import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: any = null;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      timeoutId = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const handleCustomNetwork = (e: Event) => {
      const online = (e as CustomEvent)?.detail?.online;
      if (typeof online === 'boolean') {
        if (online) handleOnline();
        else handleOffline();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('porto_network_status', handleCustomNetwork);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('porto_network_status', handleCustomNetwork);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Don't render anything if connected and not in reconnected flash state
  if (isOnline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 18px',
        borderRadius: 9999,
        background: isOnline ? 'rgba(16, 185, 129, 0.94)' : 'rgba(217, 86, 41, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#ffffff',
        fontFamily: "'Outfit', -apple-system, sans-serif",
        fontSize: 13,
        fontWeight: 700,
        boxShadow: isOnline 
          ? '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.2)' 
          : '0 10px 25px -5px rgba(217, 86, 41, 0.4), 0 8px 10px -6px rgba(217, 86, 41, 0.2)',
        animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
        maxWidth: '92vw',
        boxSizing: 'border-box'
      }}
    >
      {isOnline ? (
        <>
          <CheckCircle2 size={16} strokeWidth={2.5} />
          <span>Kembali Online — Sinkronisasi aktif</span>
        </>
      ) : (
        <>
          <WifiOff size={16} strokeWidth={2.5} />
          <span>Mode Offline — Data tersimpan lokal di perangkat</span>
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
