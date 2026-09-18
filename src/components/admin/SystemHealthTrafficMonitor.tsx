import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Activity, CheckCircle2, AlertTriangle, HardDrive, Sparkles, Cloud, Database, RefreshCw, X, Zap } from 'lucide-react';
import { AI_CONFIG, CLOUDINARY_CONFIG, GOOGLE_CONFIG } from '../../config/AppConfig';
import { db } from '../../firebase';

interface StorageStats {
  usedKb: number;
  totalKb: number;
  percent: number;
  idbUsedMb?: number;
}

export const SystemHealthPanel: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [storageStats, setStorageStats] = useState<StorageStats>({ usedKb: 0, totalKb: 5120, percent: 0 });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const calculateStorage = () => {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += key.length + val.length;
        }
      }
      const usedKb = Math.round(totalBytes / 1024);
      const totalKb = 5120;
      const percent = Math.min(100, Math.round((usedKb / totalKb) * 100));

      if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          if (estimate.usage) {
            const idbMb = Math.round((estimate.usage / (1024 * 1024)) * 10) / 10;
            setStorageStats(prev => ({ ...prev, idbUsedMb: idbMb }));
          }
        }).catch(() => {});
      }

      setStorageStats({ usedKb, totalKb, percent });
    } catch (e) {
      console.warn('Storage calculation error:', e);
    }
  };

  useEffect(() => {
    calculateStorage();
    const interval = setInterval(calculateStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const services = useMemo(() => {
    const firebaseOk = Boolean(db && isOnline);
    const geminiOk = Boolean(AI_CONFIG.geminiApiKey);
    const cloudinaryOk = Boolean(CLOUDINARY_CONFIG.cloudName && CLOUDINARY_CONFIG.uploadPreset);
    const googleOk = Boolean(GOOGLE_CONFIG.sheetId || GOOGLE_CONFIG.appsScriptUrl);

    return [
      {
        id: 'firebase',
        name: 'Firebase',
        icon: Database,
        status: firebaseOk ? 'ok' : (!isOnline ? 'offline' : 'warn'),
        message: firebaseOk ? 'Aktif' : (!isOnline ? 'Offline' : 'Koneksi')
      },
      {
        id: 'gemini',
        name: 'Gemini AI',
        icon: Sparkles,
        status: geminiOk ? 'ok' : 'warn',
        message: geminiOk ? 'Aktif' : 'Belum diatur'
      },
      {
        id: 'cloudinary',
        name: 'Cloudinary',
        icon: Cloud,
        status: cloudinaryOk ? 'ok' : 'warn',
        message: cloudinaryOk ? 'Aktif' : 'Belum diatur'
      },
      {
        id: 'google',
        name: 'Google Sync',
        icon: HardDrive,
        status: googleOk ? 'ok' : 'warn',
        message: googleOk ? 'Aktif' : 'Belum diatur'
      }
    ];
  }, [isOnline]);

  const allOk = services.every(s => s.status === 'ok') && isOnline;

  const runPingTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const start = performance.now();
      await fetch('/favicon.svg', { cache: 'no-store' });
      const latency = Math.round(performance.now() - start);
      setTestResult(`${latency}ms (Stabil)`);
    } catch (err) {
      setTestResult('Gagal terhubung');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '10px',
      background: 'var(--cms-bg, #f9fafb)',
      borderRadius: 12,
      border: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
      boxSizing: 'border-box'
    }}>
      {/* Services Grid (Compact 2x2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {services.map(svc => {
          const IconComponent = svc.icon;
          const isOk = svc.status === 'ok';
          return (
            <div
              key={svc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: 8,
                background: isOk ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                border: `1px solid ${isOk ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div style={{ color: isOk ? '#10b981' : '#f59e0b', flexShrink: 0 }}>
                  <IconComponent size={13} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {svc.name}
                  </div>
                  <div style={{ fontSize: 9, color: isOk ? '#10b981' : '#d97706', fontWeight: 600 }}>
                    {svc.message}
                  </div>
                </div>
              </div>
              <div>
                {isOk ? (
                  <CheckCircle2 size={12} color="#10b981" />
                ) : (
                  <AlertTriangle size={12} color="#f59e0b" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Storage Cache Progress */}
      <div style={{
        padding: '8px 10px',
        borderRadius: 8,
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1px solid var(--cms-border, rgba(0,0,0,0.08))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 10.5, fontWeight: 750, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <HardDrive size={12} color="#3b82f6" />
            <span>Cache Lokal</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: storageStats.percent > 80 ? '#ef4444' : 'var(--cms-text-muted)' }}>
            {storageStats.percent}% ({storageStats.usedKb} KB)
          </div>
        </div>
        <div style={{ width: '100%', height: 4, background: 'var(--cms-switcher-bg, rgba(0,0,0,0.06))', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${storageStats.percent}%`,
              height: '100%',
              background: storageStats.percent > 80 ? '#ef4444' : '#10b981',
              borderRadius: 2,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        {storageStats.idbUsedMb !== undefined && (
          <div style={{ fontSize: 9, color: 'var(--cms-text-muted)', marginTop: 4 }}>
            IndexedDB: ~{storageStats.idbUsedMb} MB tersimpan
          </div>
        )}
      </div>

      {/* Latency Ping Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 2 }}>
        <button
          type="button"
          onClick={runPingTest}
          disabled={isTesting}
          className="cms-btn"
          style={{
            height: 28,
            padding: '0 10px',
            borderRadius: 6,
            border: '1px solid rgba(59,130,246,0.3)',
            background: 'rgba(59,130,246,0.1)',
            color: '#3b82f6',
            fontSize: 10.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
          title="Uji Respon Jaringan"
        >
          <RefreshCw size={11} className={isTesting ? 'cms-spin' : ''} />
          <span>{isTesting ? 'Menguji...' : 'Uji'}</span>
        </button>

        <div style={{ fontSize: 10, fontWeight: 700, color: testResult ? '#10b981' : 'var(--cms-text-muted)' }}>
          {testResult || (allOk ? 'Sistem normal' : 'Periksa koneksi')}
        </div>
      </div>
    </div>
  );
};

export const SystemHealthTrafficMonitor: React.FC<{ isExpanded?: boolean }> = ({ isExpanded = true }) => {
  return null;
};

export default SystemHealthTrafficMonitor;
