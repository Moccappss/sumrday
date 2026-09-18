import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Sparkles, X, Check, ArrowRight } from 'lucide-react';
import { registerSubscriber, isPushSubscribed } from '../../utils/pushBroadcast';
import { haptic } from '../../utils/haptics';

export const PushOptinBell: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOpenPrompt, setIsOpenPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check initial permission status
    const checkSub = isPushSubscribed();
    setIsSubscribed(checkSub);

    const dismissed = localStorage.getItem('porto_push_prompt_dismissed');
    if (dismissed) {
      const diff = Date.now() - parseInt(dismissed, 10);
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }

    const handlePermChange = (e: any) => {
      if (e.detail?.granted) {
        setIsSubscribed(true);
        setIsOpenPrompt(false);
      }
    };
    window.addEventListener('porto_push_permission_changed', handlePermChange);
    return () => window.removeEventListener('porto_push_permission_changed', handlePermChange);
  }, []);

  const handleSubscribe = async () => {
    haptic('medium');
    setIsSubmitting(true);
    const success = await registerSubscriber();
    setIsSubmitting(false);
    if (success) {
      setIsSubscribed(true);
      setIsOpenPrompt(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsOpenPrompt(false);
    localStorage.setItem('porto_push_prompt_dismissed', Date.now().toString());
  };

  // If already subscribed or on admin path, don't show prompt
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return null;
  }

  if (isSubscribed) return null;

  return (
    <>
      {/* Floating Subtle Notification Opt-In Widget */}
      {!isDismissed && !isOpenPrompt && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(var(--sab, 0px) + 80px)',
            left: 20,
            zIndex: 9999,
            animation: 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <button
            onClick={() => { haptic('light'); setIsOpenPrompt(true); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 100,
              background: 'rgba(15, 23, 42, 0.88)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 0 16px rgba(124, 58, 237, 0.3)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(124, 58, 237, 0.6)',
              }}
            >
              <BellRing size={12} color="#fff" />
            </div>
            <span>Notifikasi Promo</span>
          </button>
        </div>
      )}

      {/* Expanded Modal Opt-in Prompt */}
      {isOpenPrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={handleDismiss}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              background: 'var(--cms-card-bg, #0f172a)',
              color: 'var(--cms-text, #ffffff)',
              borderRadius: 28,
              padding: '24px',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
              boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)',
                  }}
                >
                  <BellRing size={22} color="#fff" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                    Aktifkan Notifikasi
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
                    Dapatkan update karya, promo & blog terbaru
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cms-text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                borderRadius: 16,
                padding: '12px 14px',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--cms-text, #e2e8f0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#a855f7" style={{ flexShrink: 0 }} />
                <span><b>Keuntungan:</b> Info flash sale, rilis katalog layanan baru, dan artikel desain terkini langsung di layar Anda tanpa spam.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDismiss}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--cms-text-muted, #94a3b8)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Nanti Saja
              </button>

              <button
                onClick={handleSubscribe}
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(124, 58, 237, 0.4)',
                }}
              >
                {isSubmitting ? 'Mengaktifkan...' : (
                  <>
                    <span>Aktifkan Sekarang</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PushOptinBell;
