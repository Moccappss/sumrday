import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Check, AlertCircle, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  toast: (title: string, message?: string, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Helper to condense verbose text into strictly 1-3 words
 */
const condenseToShortTitle = (rawTitle: string, rawMessage?: string): { shortTitle: string; fullDetail: string; hasExtra: boolean } => {
  const combined = (rawTitle || '').trim();
  const detail = (rawMessage || '').trim();

  // Strip emojis from the beginning
  const clean = combined.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}✅❌🗑️🔄✨📋↩️↪️📸⚠️💬🎉🚀]+\s*/u, '').trim();
  const lower = clean.toLowerCase();

  let shortTitle = '';

  if (lower.includes('tersimpan aman ke cloud') || lower.includes('tersimpan ke cloud')) {
    shortTitle = 'Tersimpan Aman';
  } else if (lower.includes('tersimpan') || lower.includes('berhasil disimpan') || lower.includes('disimpan')) {
    shortTitle = 'Tersimpan';
  } else if (lower.includes('diperbarui') || lower.includes('berhasil diperbarui')) {
    shortTitle = 'Telah Diperbarui';
  } else if (lower.includes('disalin') || lower.includes('berhasil disalin')) {
    shortTitle = 'Berhasil Disalin';
  } else if (lower.includes('dihapus') || lower.includes('berhasil dihapus')) {
    shortTitle = 'Berhasil Dihapus';
  } else if (lower.includes('gagal')) {
    shortTitle = 'Gagal';
  } else if (lower.includes('keranjang')) {
    shortTitle = 'Masuk Keranjang';
  } else if (lower.includes('favorit')) {
    shortTitle = lower.includes('hapus') ? 'Dihapus Favorit' : 'Ditambah Favorit';
  } else if (lower.includes('pesanan')) {
    shortTitle = 'Pesanan Berhasil';
  } else {
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length <= 3) {
      shortTitle = clean;
    } else {
      shortTitle = words.slice(0, 3).join(' ');
    }
  }

  const titleWords = shortTitle.split(/\s+/).filter(Boolean);
  if (titleWords.length > 3) {
    shortTitle = titleWords.slice(0, 3).join(' ');
  }

  const fullDetail = detail ? `${clean}${clean !== detail ? ' — ' + detail : ''}` : clean;
  const hasExtra = fullDetail.length > shortTitle.length + 3;

  return { shortTitle, fullDetail, hasExtra };
};

const ToastPill: React.FC<{ item: ToastItem; onRemove: () => void }> = ({ item, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);
  const { shortTitle, fullDetail, hasExtra } = condenseToShortTitle(item.title, item.message);

  // 1. Auto-hide when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        onRemove();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside, true);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [onRemove]);

  // 2. Auto-hide timer: pause when expanded so user can read
  useEffect(() => {
    if (isExpanded) return;

    const duration = item.duration || 3200;
    const timer = setTimeout(() => {
      onRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [isExpanded, item.duration, onRemove]);

  let icon = <Check size={14} strokeWidth={2.6} style={{ color: '#10b981' }} />;
  let iconBg = 'rgba(16, 185, 129, 0.16)';
  if (item.type === 'error') {
    icon = <AlertCircle size={14} strokeWidth={2.4} style={{ color: '#ef4444' }} />;
    iconBg = 'rgba(239, 68, 68, 0.16)';
  } else if (item.type === 'warning') {
    icon = <AlertTriangle size={14} strokeWidth={2.4} style={{ color: '#f59e0b' }} />;
    iconBg = 'rgba(245, 158, 11, 0.16)';
  } else if (item.type === 'info') {
    icon = <Info size={14} strokeWidth={2.4} style={{ color: '#3b82f6' }} />;
    iconBg = 'rgba(59, 130, 246, 0.16)';
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasExtra) {
      setIsExpanded(prev => !prev);
    } else {
      onRemove();
    }
  };

  return (
    <div
      ref={pillRef}
      onClick={handleClick}
      style={{
        pointerEvents: 'auto',
        cursor: 'pointer',
        background: 'var(--cms-card-bg, rgba(13, 15, 20, 0.95))',
        color: 'var(--cms-text, #ffffff)',
        backdropFilter: 'blur(24px) saturate(190%)',
        WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
        borderRadius: isExpanded ? 18 : 100,
        padding: isExpanded ? '12px 18px' : '7px 16px',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.16)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'dynamicIslandPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        maxWidth: isExpanded ? 380 : '90vw',
        width: isExpanded ? 340 : 'auto',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBg,
            flexShrink: 0
          }}>
            {icon}
          </div>

          <span style={{
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--cms-text, #ffffff)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {shortTitle}
          </span>
        </div>

        {hasExtra && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              color: 'var(--cms-text-muted, #94a3b8)',
              flexShrink: 0,
              padding: '2px 8px',
              borderRadius: 100,
              background: 'rgba(255, 255, 255, 0.06)',
              fontSize: 11,
              fontWeight: 700
            }}
            title={isExpanded ? 'Tutup detail' : 'Klik untuk melihat detail'}
          >
            {isExpanded ? (
              <>
                <span>Tutup</span>
                <ChevronUp size={12} strokeWidth={2.4} />
              </>
            ) : (
              <>
                <span>Detail</span>
                <ChevronDown size={12} strokeWidth={2.4} />
              </>
            )}
          </div>
        )}
      </div>

      {isExpanded && hasExtra && (
        <div 
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            animation: 'simpleFadeIn 0.18s ease-out'
          }}
        >
          <p style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 500,
            lineHeight: 1.55,
            color: 'var(--cms-text, #e2e8f0)',
            wordBreak: 'break-word',
            fontFamily: "'Inter', sans-serif"
          }}>
            {fullDetail}
          </p>

          <div style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: 'var(--cms-text-muted, #94a3b8)',
            marginTop: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Klik lagi untuk menutup</span>
            <span 
              onClick={(e) => { e.stopPropagation(); onRemove(); }} 
              style={{ 
                textDecoration: 'underline', 
                cursor: 'pointer',
                color: 'var(--cms-accent, #a78bfa)'
              }}
            >
              Tutup Notifikasi
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'success', duration = 3200) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    // Light haptic feedback if available
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(type === 'error' ? [40, 60, 40] : 25);
      }
    } catch (_) {}

    setToasts((prev) => [...prev.slice(-1), { id, title, message, type, duration }]);
  }, []);

  useEffect(() => {
    const handleToastEvent = (e: any) => {
      if (e.detail?.title) {
        showToast(e.detail.title, e.detail.message, e.detail.type || 'success', e.detail.duration || 3200);
      }
    };
    window.addEventListener('porto_show_toast', handleToastEvent);
    return () => window.removeEventListener('porto_show_toast', handleToastEvent);
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    toast: showToast,
    success: (title, message) => showToast(title, message, 'success'),
    error: (title, message) => showToast(title, message, 'error', 4000),
    info: (title, message) => showToast(title, message, 'info'),
    warning: (title, message) => showToast(title, message, 'warning', 3500),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Floating Dynamic Island Toast Container (Always Centered at Top) */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
          maxWidth: '92vw',
        }}
      >
        {toasts.map((t) => (
          <ToastPill key={t.id} item={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (title: string, message?: string) => console.log(`[Toast] ${title}: ${message}`),
      toast: (title: string, message?: string) => console.log(`[Toast] ${title}: ${message}`),
      success: (title: string, message?: string) => console.log(`[Toast Success] ${title}: ${message}`),
      error: (title: string, message?: string) => console.error(`[Toast Error] ${title}: ${message}`),
      info: (title: string, message?: string) => console.log(`[Toast Info] ${title}: ${message}`),
      warning: (title: string, message?: string) => console.log(`[Toast Warning] ${title}: ${message}`),
    };
  }
  return context;
};
