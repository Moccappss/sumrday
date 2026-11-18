import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertCircle, Info, X, ShieldAlert, Sparkles, Cloud, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Helper to condense verbose messages into strictly 1-3 words
 * while retaining the full text for expandable details.
 */
const parseNotificationContent = (rawMsg: any): { title: string; detail: string; hasExtra: boolean } => {
  if (!rawMsg) return { title: '', detail: '', hasExtra: false };

  // Safe string coercion
  let str = '';
  if (typeof rawMsg === 'string') {
    str = rawMsg;
  } else if (rawMsg instanceof Error) {
    str = rawMsg.message || 'Terjadi Kendala';
  } else if (typeof rawMsg === 'object') {
    str = rawMsg.message || rawMsg.error || rawMsg.title || rawMsg.text || '';
    if (!str) {
      try {
        str = JSON.stringify(rawMsg);
      } catch {
        str = 'Pemberitahuan';
      }
    }
  } else {
    str = String(rawMsg);
  }

  if (!str) return { title: '', detail: '', hasExtra: false };

  // Strip emojis from the beginning
  const clean = str.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}✅❌🗑️🔄✨📋↩️↪️📸⚠️💬🎉🚀]+\s*/u, '').trim();
  const lower = clean.toLowerCase();

  let title = '';

  if (lower.includes('tersimpan aman ke cloud') || lower.includes('tersimpan ke cloud')) {
    title = 'Tersimpan Aman';
  } else if (lower.includes('biodata') && (lower.includes('simpan') || lower.includes('update') || lower.includes('perbarui'))) {
    title = 'Biodata Tersimpan';
  } else if ((lower.includes('halaman') || lower.includes('urutan')) && lower.includes('simpan')) {
    title = 'Urutan Disimpan';
  } else if (lower.includes('stiker') && lower.includes('simpan')) {
    title = 'Stiker Tersimpan';
  } else if (lower.includes('tersimpan') || lower.includes('berhasil disimpan') || lower.includes('data berhasil disimpan')) {
    title = 'Data Tersimpan';
  } else if (lower.includes('diperbarui') || lower.includes('berhasil diperbarui')) {
    title = 'Telah Diperbarui';
  } else if (lower.includes('tersinkron') || lower.includes('sinkronisasi berhasil') || lower.includes('berhasil disinkronkan')) {
    title = 'Tersinkron';
  } else if (lower.includes('disalin') || lower.includes('berhasil disalin') || lower.includes('disalin ke clipboard')) {
    title = 'Berhasil Disalin';
  } else if (lower.includes('terhapus') || lower.includes('berhasil dihapus') || lower.includes('dihapus permanen')) {
    title = 'Berhasil Dihapus';
  } else if (lower.includes('diduplikasi') || lower.includes('berhasil diduplikasi')) {
    title = 'Diduplikasi';
  } else if (lower.includes('diunggah') || lower.includes('berhasil diunggah') || lower.includes('upload berhasil')) {
    title = 'Berhasil Diunggah';
  } else if (lower.includes('gagal') || lower.includes('error')) {
    if (lower.includes('simpan')) title = 'Gagal Menyimpan';
    else if (lower.includes('upload') || lower.includes('unggah')) title = 'Gagal Unggah';
    else if (lower.includes('sinkron')) title = 'Gagal Sinkron';
    else title = 'Terjadi Kendala';
  } else if (lower.includes('dibatalkan') || lower.includes('batal')) {
    title = 'Dibatalkan';
  } else if (lower.includes('diulang')) {
    title = 'Diulang';
  } else if (lower.includes('ditambahkan') || lower.includes('berhasil ditambahkan')) {
    title = 'Ditambahkan';
  } else {
    // If text already has 1-3 words, use directly
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length <= 3) {
      title = clean;
    } else {
      // Otherwise take first 2-3 words (maximum 3 words)
      title = words.slice(0, Math.min(3, words.length)).join(' ');
    }
  }

  // Ensure title is strictly at most 3 words
  const titleWords = title.split(/\s+/).filter(Boolean);
  if (titleWords.length > 3) {
    title = titleWords.slice(0, 3).join(' ');
  }

  // Has extra details if original message is longer than title
  const hasExtra = clean.length > title.length + 3;

  return { title, detail: clean, hasExtra };
};

interface NotificationProps {
  title?: string;
  message?: any;
  type?: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  isDestructive?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ 
  title: initialTitle,
  message = '', 
  type = 'success', 
  isDestructive: initialIsDestructive,
  onConfirm, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    const raw = typeof message === 'string' ? message : (message?.message || message?.text || '');
    return Boolean(raw && (raw.includes('\n') || raw.includes('Tersinkron') || raw.includes('tersambung')));
  });
  const notifRef = useRef<HTMLDivElement>(null);

  const isConfirm = type === 'confirm';

  // Normalize when message itself is an options object passed to confirm(...)
  const actualOnConfirm = onConfirm || (typeof message === 'object' && message !== null ? message.onConfirm : undefined);
  const actualIsDestructive = initialIsDestructive || (typeof message === 'object' && message !== null ? message.isDestructive : false);
  const rawModalTitle = initialTitle || (typeof message === 'object' && message !== null ? message.title : undefined);
  const rawModalMessage = (typeof message === 'object' && message !== null)
    ? (message.message || message.text || message.detail || '')
    : (typeof message === 'string' ? message : '');

  const { title: parsedTitle, detail, hasExtra } = parseNotificationContent(rawModalMessage || (typeof message === 'string' ? message : ''));
  const modalHeading = rawModalTitle || (isConfirm ? (actualIsDestructive ? 'Hapus Data?' : 'Konfirmasi') : parsedTitle);
  const modalText = typeof rawModalMessage === 'string' && rawModalMessage ? rawModalMessage : (typeof detail === 'string' && detail ? detail : 'Apakah Anda yakin ingin melanjutkan tindakan ini?');
  const toastTitle = rawModalTitle || parsedTitle || 'Pemberitahuan';

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 220);
  }, [onClose]);

  // 1. Auto-hide when clicking anywhere outside
  useEffect(() => {
    if (isConfirm) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        handleDismiss();
      }
    };

    // Small delay so the action triggering this toast doesn't immediately dismiss it
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside, true);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [isConfirm, handleDismiss]);

  // 2. Visibility & Auto-hide timer
  useEffect(() => {
    if (!message) return;

    // Must be set for BOTH confirm modals and toast notifications
    setIsVisible(true);

    // Confirmation modals should NEVER auto-dismiss
    if (isConfirm) {
      return;
    }

    const duration = isExpanded ? 6500 : 3200;
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, isConfirm, isExpanded, handleDismiss]);

  if (!message) return null;

  const getIcon = () => {
    const raw = detail.toLowerCase();
    const str = typeof message === 'string' ? message : detail;
    if (type === 'success' || str.includes('✅') || raw.includes('tersimpan') || raw.includes('disimpan')) {
      return <Check size={15} strokeWidth={2.6} style={{ color: '#10b981' }} />;
    }
    if (type === 'error' || str.includes('❌') || raw.includes('gagal')) {
      return <AlertCircle size={15} strokeWidth={2.4} style={{ color: '#ef4444' }} />;
    }
    if (str.includes('🗑️') || raw.includes('hapus')) {
      return <Trash2 size={15} strokeWidth={2.4} style={{ color: '#ef4444' }} />;
    }
    if (str.includes('🔄') || raw.includes('sinkron')) {
      return <Cloud size={15} strokeWidth={2.4} style={{ color: 'var(--cms-accent, #7c3aed)' }} />;
    }
    if (isConfirm) {
      return <ShieldAlert size={24} style={{ color: 'var(--cms-accent, #7c3aed)' }} />;
    }
    return <Sparkles size={15} strokeWidth={2.4} style={{ color: 'var(--cms-accent, #7c3aed)' }} />;
  };

  // Keyboard shortcut (Escape to dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          handleDismiss();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, handleDismiss]);

  // ── 1. CONFIRMATION MODAL ──
  if (isConfirm) {
    return createPortal(
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000000,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.18s ease-out',
          padding: 20,
        }}
        onClick={handleDismiss}
      >
        <div 
          style={{
            width: 380,
            maxWidth: '90vw',
            background: 'var(--cms-card-bg, #11131a)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
            borderRadius: 24,
            padding: '28px 24px',
            boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            textAlign: 'center',
            animation: 'simpleCardFade 0.18s ease-out'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(var(--cms-accent-rgb, 124,58,237), 0.12)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          }}>
            {getIcon()}
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text, #ffffff)', margin: '0 0 6px' }}>
              {modalHeading}
            </h3>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.5, margin: 0 }}>
              {modalText}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
            <button 
              type="button"
              onClick={handleDismiss}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 100,
                border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                color: 'var(--cms-text, #ffffff)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsVisible(false);
                onClose?.();
                setTimeout(() => {
                  try {
                    actualOnConfirm?.();
                  } catch (err) {
                    console.error('[Notification] onConfirm error:', err);
                  }
                }, 20);
              }}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 100,
                border: 'none',
                background: actualIsDestructive ? '#ef4444' : 'var(--cms-accent, #7c3aed)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: actualIsDestructive 
                  ? '0 4px 14px rgba(239, 68, 68, 0.35)' 
                  : '0 4px 14px rgba(var(--cms-accent-rgb, 124,58,237), 0.3)'
              }}
            >
              {actualIsDestructive ? 'Hapus' : 'Ya, Lanjutkan'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── 2. MINIMALIST 1-3 WORDS TOAST PILL WITH EXPANDABLE DETAIL ──
  const handlePillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasExtra) {
      setIsExpanded(prev => !prev);
    } else {
      handleDismiss();
    }
  };

  return createPortal(
    <div 
      ref={notifRef}
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: isVisible ? 'translateX(-50%) translateY(0) scale(1)' : 'translateX(-50%) translateY(-10px) scale(0.92)',
        opacity: isVisible ? 1 : 0,
        zIndex: 10000000,
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div 
        onClick={handlePillClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isExpanded ? 18 : 100,
          padding: isExpanded ? '12px 18px' : '7px 16px',
          background: 'var(--cms-card-bg, rgba(13, 15, 20, 0.95))',
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 14px 36px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.16)',
          cursor: 'pointer',
          userSelect: 'none',
          maxWidth: isExpanded ? 380 : '90vw',
          width: isExpanded ? 340 : 'auto',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Top row: Icon + 1-3 Words Title + Detail Toggle Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: type === 'error' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.16)',
              flexShrink: 0
            }}>
              {getIcon()}
            </div>

            <span style={{
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "'Outfit', 'Inter', sans-serif",
              color: 'var(--cms-text, #ffffff)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {toastTitle}
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
                fontWeight: 700,
                letterSpacing: '0.02em',
                transition: 'background 0.15s ease'
              }}
              title={isExpanded ? 'Klik untuk menutup detail' : 'Klik untuk melihat detail'}
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

        {/* Expandable Detail Section */}
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
              fontFamily: "'Inter', sans-serif",
              whiteSpace: 'pre-line'
            }}>
              {detail}
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
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }} 
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
    </div>,
    document.body
  );
};

export default Notification;
