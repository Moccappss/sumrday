import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

const DialogContext = createContext<any>(null);

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState<any>(null);
  
  const showConfirm = (message, title = "Konfirmasi") => {
    return new Promise((resolve) => {
      setDialog({
        type: 'confirm',
        title,
        message,
        onConfirm: () => { setDialog(null); resolve(true); },
        onCancel: () => { setDialog(null); resolve(false); }
      });
    });
  };

  const showPrompt = (message, defaultValue = "", title = "Input Data") => {
    return new Promise((resolve) => {
      setDialog({
        type: 'prompt',
        title,
        message,
        defaultValue,
        onConfirm: (val) => { setDialog(null); resolve(val); },
        onCancel: () => { setDialog(null); resolve(null); }
      });
    });
  };

  const showAlert = (message, title = "Info") => {
    return new Promise((resolve) => {
      setDialog({
        type: 'alert',
        title,
        message,
        onConfirm: () => { setDialog(null); resolve(true); }
      });
    });
  };

  return (
    <DialogContext.Provider value={{ showConfirm, showPrompt, showAlert }}>
      {children}
      {dialog && <DialogModal dialog={dialog} />}
    </DialogContext.Provider>
  );
};

const DialogModal = ({ dialog }) => {
  const [inputValue, setInputValue] = useState(dialog.defaultValue || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      isMountedRef.current = true;
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useNativeBackHandler(Boolean(dialog), () => {
    if (!isMountedRef.current) return;
    if (dialog.type !== 'alert' && dialog.onCancel) {
      dialog.onCancel();
    } else if (dialog.onConfirm) {
      dialog.onConfirm();
    }
  }, 'sys_dialog_modal', 30);

  // Focus management
  useEffect(() => {
    if (dialog.type === 'prompt' && inputRef.current) {
      inputRef.current.focus();
    } else if (confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [dialog]);

  // Global keyboard shortcuts (Escape & Enter) for fast accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (dialog.type !== 'alert' && dialog.onCancel) {
          dialog.onCancel();
        } else if (dialog.onConfirm) {
          dialog.onConfirm();
        }
      } else if (e.key === 'Enter' && dialog.type !== 'prompt') {
        e.preventDefault();
        e.stopPropagation();
        dialog.onConfirm?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [dialog]);

  return (
    <div 
      className="cms-modal-overlay" 
      role={dialog.type === 'alert' ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      aria-labelledby="dialog-modal-title"
      aria-describedby="dialog-modal-desc"
      style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        animation: 'simpleOverlayFade 0.18s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && isMountedRef.current) {
          if (dialog.type === 'alert') {
            dialog.onConfirm?.();
          } else if (dialog.onCancel) {
            dialog.onCancel();
          }
        }
      }}
    >
      <div 
        style={{ 
          width: 400, 
          maxWidth: '90vw', 
          padding: '28px 24px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16,
          background: 'var(--cms-card-bg)',
          borderRadius: 24, 
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--glass-border)', 
          backdropFilter: 'none', 
          WebkitBackdropFilter: 'none',
          animation: 'simpleCardFade 0.18s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div 
            aria-hidden="true"
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              background: dialog.type === 'confirm' ? 'rgba(var(--cms-accent-rgb), 0.12)' : dialog.type === 'alert' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)', 
              border: '1px solid var(--glass-border)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: dialog.type === 'confirm' ? 'var(--cms-accent)' : dialog.type === 'alert' ? '#f59e0b' : '#10b981', 
              flexShrink: 0 
            }}>
            {dialog.type === 'confirm' ? <HelpCircle size={24} /> : dialog.type === 'alert' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          
          <div>
            <h3 
              id="dialog-modal-title"
              style={{ fontSize: 17, fontWeight: 900, color: 'var(--cms-text)', margin: '0 0 6px', letterSpacing: '-0.01em' }}
            >
              {dialog.title}
            </h3>
            <p 
              id="dialog-modal-desc"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--cms-text-muted)', lineHeight: 1.5, margin: 0 }}
            >
              {dialog.message}
            </p>
          </div>
        </div>

        {dialog.type === 'prompt' && (
          <input
            ref={inputRef}
            type="text"
            className="cms-input"
            aria-label={dialog.title || "Input prompt"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') dialog.onConfirm(inputValue);
              if (e.key === 'Escape') dialog.onCancel();
            }}
            style={{ 
              marginTop: 4, 
              height: 44, 
              borderRadius: 14, 
              padding: '0 16px', 
              fontSize: 13, 
              background: 'var(--cms-input-bg)', 
              border: '1px solid var(--glass-border)',
              outline: 'none',
              width: '100%'
            }}
            autoFocus
          />
        )}

        <div style={{ 
          display: 'flex', 
          gap: 10, 
          marginTop: 6,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%'
        }}>
          {dialog.type !== 'alert' && (
            <button 
              type="button"
              className="cms-dialog-btn"
              aria-label="Batalkan aksi"
              onClick={dialog.onCancel}
              style={{ 
                flex: 1, 
                height: 42,
                maxHeight: 42,
                minHeight: 42, 
                borderRadius: 9999, 
                aspectRatio: 'unset',
                border: '1px solid var(--glass-border)', 
                background: 'var(--cms-input-bg)', 
                color: 'var(--cms-text)', 
                fontWeight: 700, 
                fontSize: 13, 
                cursor: 'pointer', 
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px'
              }}
            >
              Batal
            </button>
          )}
          <button 
            ref={confirmBtnRef}
            type="button"
            className="cms-dialog-btn"
            aria-label={dialog.type === 'alert' ? 'Konfirmasi dialog' : dialog.type === 'prompt' ? 'Simpan input' : 'Lanjutkan aksi'}
            onClick={() => dialog.type === 'prompt' ? dialog.onConfirm(inputValue) : dialog.onConfirm()}
            style={{ 
              flex: dialog.type === 'alert' ? 'none' : 1, 
              width: dialog.type === 'alert' ? 140 : undefined,
              height: 42,
              maxHeight: 42,
              minHeight: 42, 
              borderRadius: 9999, 
              aspectRatio: 'unset',
              border: 'none', 
              background: 'var(--cms-accent)', 
              color: '#fff', 
              fontWeight: 800, 
              fontSize: 13, 
              cursor: 'pointer', 
              transition: 'all 0.15s', 
              boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 24px'
            }}
          >
            {dialog.type === 'alert' ? 'OK' : dialog.type === 'prompt' ? 'Simpan' : 'Ya, Lanjutkan'}
          </button>
        </div>

        {/* Subtle Keyboard Accessibility Hint */}
        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--cms-text-muted)', opacity: 0.7, marginTop: -4 }}>
          {dialog.type === 'alert' ? 'Tekan Enter atau Esc untuk menutup' : 'Esc untuk batal · Enter untuk lanjut'}
        </div>
      </div>
    </div>
  );
};
