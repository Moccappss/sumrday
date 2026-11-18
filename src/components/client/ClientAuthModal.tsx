import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, ArrowRight, Sparkles, Eye, EyeOff, Shield } from 'lucide-react';
import { useClientAuth } from '../../context/ClientAuthContext';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { haptic } from '../../utils/haptics';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

export const ClientAuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, loginWithGoogle, register, isLoading } = useClientAuth();
  const { isDark } = useWebsiteTheme();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Native 1-step back navigation
  useNativeBackHandler(isAuthModalOpen, closeAuthModal, 'client_auth_modal', 10);

  // Sync mode when modal opens
  React.useEffect(() => {
    setMode(authModalMode);
    setError('');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    haptic.light();

    if (!email.trim() || !password.trim()) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Nama lengkap wajib diisi.');
        return;
      }
      if (!phone.trim()) {
        setError('Nomor WhatsApp wajib diisi untuk verifikasi & pemesanan.');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ name, email, phone, password });
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const bgModal = isDark ? '#151824' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'cmsFadeIn 0.25s ease',
      }}
      onClick={closeAuthModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: bgModal,
          borderRadius: 24,
          border: `1px solid ${borderCol}`,
          padding: '32px 28px',
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.8)'
            : '0 24px 60px rgba(15, 23, 42, 0.14)',
          position: 'relative',
          animation: 'cmsPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            color: textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'var(--cms-accent-soft, rgba(100,116,139,0.15))',
              color: 'var(--cms-accent, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Sparkles size={22} />
          </div>
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 20,
              fontWeight: 800,
              color: textPrimary,
              margin: '0 0 6px',
            }}
          >
            {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Pelanggan'}
          </h3>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: textMuted,
              margin: 0,
            }}
          >
            {mode === 'login'
              ? 'Masuk untuk mengelola pesanan & percakapan'
              : 'Daftar untuk akses pemesanan instan & riwayat chat'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 10,
              border: 'none',
              background: mode === 'login' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : textMuted,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 10,
              border: 'none',
              background: mode === 'register' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : textMuted,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Daftar Akun
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 16,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <>
              {/* Name */}
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: 14,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    color: textPrimary,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Phone (Wajib) */}
              <div style={{ position: 'relative' }}>
                <Phone size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
                <input
                  type="tel"
                  required
                  placeholder="No. WhatsApp / HP (Wajib)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: 14,
                    border: `1px solid ${borderCol}`,
                    background: inputBg,
                    color: textPrimary,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </>
          )}

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
            <input
              type="email"
              required
              placeholder="Alamat Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: 14,
                border: `1px solid ${borderCol}`,
                background: inputBg,
                color: textPrimary,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 46px 12px 42px',
                borderRadius: 14,
                border: `1px solid ${borderCol}`,
                background: inputBg,
                color: textPrimary,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                borderRadius: 8,
                zIndex: 5,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 100,
              border: 'none',
              background: 'var(--cms-accent, #2563eb)',
              color: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: isLoading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'none',
              marginTop: 6,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk Sekarang' : 'Buat Akun Saya'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 10px', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: borderCol }} />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>atau</span>
          <div style={{ flex: 1, height: 1, background: borderCol }} />
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={async () => {
            setError('');
            try {
              await loginWithGoogle();
            } catch (err: any) {
              setError(err.message || 'Gagal masuk dengan Google.');
            }
          }}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: 100,
            border: `1px solid ${borderCol}`,
            background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
            color: textPrimary,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 800,
            cursor: isLoading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Masuk Google</span>
        </button>

        {/* Footer info: Distinct Admin Portal Notice */}
        <div style={{ marginTop: 20, textAlign: 'center', borderTop: `1px solid ${borderCol}`, paddingTop: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: textMuted, fontFamily: "'Inter', sans-serif" }}>
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--cms-accent, #64748b)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
              }}
            >
              {mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
          <div style={{ marginTop: 10 }}>
            <a
              href="/admin/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                color: textMuted,
                textDecoration: 'none',
                opacity: 0.7,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              <Shield size={12} />
              <span>Jalur Khusus Pengelola / Admin</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAuthModal;
