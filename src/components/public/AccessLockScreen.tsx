import React, { useState } from 'react';
import { 
  Lock, Unlock, KeyRound, ArrowRight, MessageCircle, Mail, Send, 
  ExternalLink, ShieldAlert, Sparkles, CheckCircle2, Eye, EyeOff, Home, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export interface LockConfig {
  isLocked?: boolean;
  password?: string;
  title?: string;
  message?: string;
  contactChannel?: 'whatsapp' | 'instagram' | 'email' | 'telegram' | 'custom' | string;
  contactTarget?: string;
  contactText?: string;
}

interface AccessLockScreenProps {
  config: LockConfig;
  pageKey?: string;
  pageTitle?: string;
  onUnlocked?: () => void;
  showHomeButton?: boolean;
}

export const isPageUnlocked = (pageKey: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const sessionVal = sessionStorage.getItem(`porto_unlocked_${pageKey}`);
    if (sessionVal === 'true') return true;
    const localVal = localStorage.getItem(`porto_unlocked_${pageKey}`);
    if (localVal === 'true') return true;
  } catch (_) {}
  return false;
};

export const setPageUnlocked = (pageKey: string, remember: boolean = true) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`porto_unlocked_${pageKey}`, 'true');
    if (remember) {
      localStorage.setItem(`porto_unlocked_${pageKey}`, 'true');
    }
  } catch (_) {}
};

export const relockPage = (pageKey: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`porto_unlocked_${pageKey}`);
    localStorage.removeItem(`porto_unlocked_${pageKey}`);
    window.location.reload();
  } catch (_) {}
};

const AccessLockScreen: React.FC<AccessLockScreenProps> = ({
  config,
  pageKey = 'default',
  pageTitle = 'Halaman',
  onUnlocked,
  showHomeButton = true
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorShake, setErrorShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const expectedPassword = (config.password || '').trim();
  const displayTitle = config.title || `Akses Terbatas: ${pageTitle}`;
  const displayMessage = config.message || 'Website ini dilindungi oleh kata sandi. Masukkan kode sandi atau hubungi pemilik untuk meminta akses.';

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('Silakan masukkan kata sandi / PIN akses');
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }

    if (passwordInput.trim() === expectedPassword) {
      setIsSuccess(true);
      setErrorMessage('');
      setPageUnlocked(pageKey, rememberDevice);
      setTimeout(() => {
        if (onUnlocked) onUnlocked();
        else window.location.reload();
      }, 600);
    } else {
      setErrorMessage('Kata sandi yang Anda masukkan tidak sesuai.');
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
    }
  };

  // Build Request Access URL
  const channel = config.contactChannel || 'whatsapp';
  const target = (config.contactTarget || '').trim();
  const defaultText = config.contactText || `Halo, saya ingin meminta kata sandi akses untuk halaman: ${pageTitle} (${typeof window !== 'undefined' ? window.location.href : ''})`;
  
  let contactUrl = '#';
  let contactLabel = 'Minta Akses via WhatsApp';
  let ContactIcon = MessageCircle;
  let channelColor = '#25D366';

  if (channel === 'whatsapp') {
    const cleanPhone = target.replace(/[^0-9]/g, '') || '6281234567890';
    contactUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultText)}`;
    contactLabel = 'Minta Akses via WhatsApp';
    ContactIcon = MessageCircle;
    channelColor = '#25D366';
  } else if (channel === 'email') {
    const email = target || 'hello@example.com';
    contactUrl = `mailto:${email}?subject=${encodeURIComponent(`Permintaan Akses: ${pageTitle}`)}&body=${encodeURIComponent(defaultText)}`;
    contactLabel = 'Minta Akses via Email';
    ContactIcon = Mail;
    channelColor = '#8b5cf6';
  } else if (channel === 'instagram') {
    const igUsername = target.replace('@', '') || 'instagram';
    contactUrl = `https://instagram.com/${igUsername}`;
    contactLabel = 'Minta Akses via Instagram';
    ContactIcon = InstagramIcon;
    channelColor = '#E1306C';
  } else if (channel === 'telegram') {
    const tgUsername = target.replace('@', '') || 'telegram';
    contactUrl = `https://t.me/${tgUsername}`;
    contactLabel = 'Minta Akses via Telegram';
    ContactIcon = Send;
    channelColor = '#229ED9';
  } else {
    contactUrl = target.startsWith('http') ? target : `https://${target || window.location.host}`;
    contactLabel = 'Minta Akses ke Pemilik';
    ContactIcon = ExternalLink;
    channelColor = 'var(--cms-accent, #6366f1)';
  }

  return (
    <div
      className="access-lock-screen-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 18px',
        boxSizing: 'border-box',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        overflow: 'visible',
      }}
    >
      {/* Background Ambient Spotlight Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(750px, 90vw)',
          height: 'min(750px, 90vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.12) 35%, rgba(6, 182, 212, 0.05) 55%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Lock Card */}
      <div
        className={`access-lock-card ${errorShake ? 'shake-anim' : ''}`}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 460,
          borderRadius: 32,
          background: 'var(--cms-card-bg, rgba(15, 23, 42, 0.75))',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid var(--cms-card-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45), 0 0 40px rgba(99, 102, 241, 0.12)',
          padding: '44px 34px 36px',
          textAlign: 'center',
          boxSizing: 'border-box',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Animated Floating Lock Pod */}
        <div
          style={{
            position: 'relative',
            width: 78,
            height: 78,
            borderRadius: 26,
            background: isSuccess
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: isSuccess
              ? '0 12px 30px rgba(16, 185, 129, 0.5)'
              : '0 14px 35px rgba(99, 102, 241, 0.45)',
            transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {isSuccess ? (
            <CheckCircle2 size={38} strokeWidth={2.4} style={{ animation: 'cmsPopIn 0.3s ease' }} />
          ) : (
            <Lock size={34} strokeWidth={2.2} />
          )}

          {/* Glowing Orbital Ring */}
          <div
            style={{
              position: 'absolute',
              inset: -7,
              borderRadius: 33,
              border: '2px dashed rgba(99, 102, 241, 0.45)',
              opacity: 0.8,
              animation: 'spinSlow 14s linear infinite'
            }}
          />
        </div>

        {/* Security Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 100,
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#818cf8',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          <ShieldCheck size={13} />
          <span>PROSES TERENKRIPSI</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(21px, 4vw, 25px)',
            fontWeight: 900,
            letterSpacing: '-0.025em',
            margin: '0 0 10px',
            color: 'var(--cms-text, #ffffff)',
            lineHeight: 1.25,
          }}
        >
          {displayTitle}
        </h1>

        {/* Message */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13.5,
            color: 'var(--cms-text-muted, rgba(255, 255, 255, 0.65))',
            lineHeight: 1.6,
            margin: '0 0 28px',
            fontWeight: 450,
          }}
        >
          {displayMessage}
        </p>

        {/* Password Form */}
        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Masukkan Kata Sandi / PIN..."
              disabled={isSuccess}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 16,
                background: 'var(--cms-input-bg, rgba(255, 255, 255, 0.06))',
                border: errorMessage
                  ? '1.5px solid #ef4444'
                  : '1.5px solid var(--cms-input-border, rgba(255, 255, 255, 0.12))',
                color: 'var(--cms-text, #ffffff)',
                padding: '0 48px 0 18px',
                fontFamily: "'Inter', sans-serif",
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: showPassword ? '0.02em' : '0.12em',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.25s ease',
                boxShadow: errorMessage
                  ? '0 0 20px rgba(239, 68, 68, 0.25)'
                  : 'none',
              }}
              onFocus={(e) => {
                if (!errorMessage) e.target.style.borderColor = '#818cf8';
              }}
              onBlur={(e) => {
                if (!errorMessage) e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--cms-text-muted, rgba(255, 255, 255, 0.5))',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              title={showPassword ? 'Sembunyikan Sandi' : 'Lihat Sandi'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error Feedback */}
          {errorMessage && (
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                animation: 'cmsFadeIn 0.2s ease',
              }}
            >
              <ShieldAlert size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Remember Device Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--cms-text-muted, rgba(255, 255, 255, 0.65))',
              cursor: 'pointer',
              userSelect: 'none',
              margin: '2px 0 6px',
            }}
          >
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: '#6366f1',
                cursor: 'pointer',
              }}
            />
            <span>Ingat akses di perangkat ini</span>
          </label>

          {/* Unlock Submit Button */}
          <button
            type="submit"
            disabled={isSuccess}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 100,
              border: 'none',
              background: isSuccess
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14.5,
              fontWeight: 800,
              cursor: isSuccess ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: isSuccess
                ? '0 8px 24px rgba(16, 185, 129, 0.45)'
                : '0 8px 24px rgba(99, 102, 241, 0.45)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSuccess) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isSuccess ? (
              <>
                <Unlock size={18} /> Akses Terbuka...
              </>
            ) : (
              <>
                <KeyRound size={18} /> Buka Akses Halaman <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '26px 0 20px',
            color: 'var(--cms-text-muted, rgba(255, 255, 255, 0.35))',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
          <span>Atau Minta Akses</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* Request Access Button via WhatsApp/Email/IG */}
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            height: 48,
            borderRadius: 100,
            background: `${channelColor}16`,
            color: channelColor,
            border: `1.5px solid ${channelColor}40`,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13.5,
            fontWeight: 800,
            textDecoration: 'none',
            transition: 'all 0.25s ease',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${channelColor}25`;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${channelColor}16`;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ContactIcon size={18} />
          <span>{contactLabel}</span>
        </a>

        {/* Optional Back to Home Button */}
        {showHomeButton && typeof window !== 'undefined' && window.location.pathname !== '/' && (
          <div style={{ marginTop: 22 }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--cms-text-muted, rgba(255, 255, 255, 0.55))',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)'}
            >
              <Home size={14} /> Kembali ke Beranda Utama
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cmsPopIn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cmsFadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .shake-anim {
          animation: lockShake 0.4s ease-in-out;
        }
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }

        /* Mobile full-height experience while preserving top navbar visibility */
        @media (max-width: 640px) {
          .access-lock-screen-wrapper {
            padding: 16px 12px calc(32px + env(safe-area-inset-bottom, 16px)) !important;
            align-items: center !important;
          }
          .access-lock-card {
            padding: 32px 20px 28px !important;
            border-radius: 26px !important;
            max-width: 100% !important;
            box-shadow: 0 16px 40px rgba(0,0,0,0.5) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AccessLockScreen;
