import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, ArrowRight, Sparkles, Eye, EyeOff, Shield } from 'lucide-react';
import { useClientAuth } from '../../context/ClientAuthContext';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { haptic } from '../../utils/haptics';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

export const ClientAuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register, isLoading } = useClientAuth();
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

  const bgModal = isDark ? '#13141f' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'transparent',
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
            ? '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px var(--cms-accent-soft, rgba(100,116,139,0.2))'
            : '0 24px 60px rgba(0,0,0,0.12)',
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
              background: 'var(--cms-accent, #64748b)',
              color: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: isLoading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--cms-accent-shadow, 0 8px 20px rgba(0,0,0,0.25))',
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
