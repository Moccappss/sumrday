import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Sparkles, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useClientAuth } from '../context/ClientAuthContext';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingData } from '../components/landing/useLandingData';
import SEOHelmet from '../components/SEOHelmet';
import { haptic } from '../utils/haptics';

export const ClientLoginPage: React.FC<{ initialMode?: 'login' | 'register' }> = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useLandingData();
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const { client, login, loginWithGoogle, register, isLoading } = useClientAuth();

  const isRegisterRoute = location.pathname === '/register' || initialMode === 'register';
  const [mode, setMode] = useState<'login' | 'register'>(isRegisterRoute ? 'register' : 'login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Sync mode with route changes
  useEffect(() => {
    setMode(location.pathname === '/register' ? 'register' : 'login');
    setError('');
  }, [location.pathname]);

  // If already logged in, redirect to home or back
  useEffect(() => {
    if (client) {
      navigate('/', { replace: true });
    }
  }, [client, navigate]);

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
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk.');
    }
  };

  const bgPage = isDark ? '#06070a' : '#eef2f6';
  const bgCard = isDark ? '#151824' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';
  const accentColor = data?.theme?.accentColor || '#7c3aed';

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgPage,
        color: textPrimary,
        padding: '24px 16px',
        position: 'relative',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
    >
      <SEOHelmet
        title={mode === 'login' ? 'Masuk ke sumr.day Client Hub' : 'Daftar Akun Baru - sumr.day'}
        description="Masuk ke Client Hub sumr.day untuk memantau progres undangan web, landing page, dan aset visualmu dengan santai."
      />

      {/* Top Navigation Back */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 100,
            border: `1px solid ${borderCol}`,
            background: isDark ? '#151824' : '#ffffff',
            color: textPrimary,
            textDecoration: 'none',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            transition: 'transform 0.2s',
          }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: bgCard,
          borderRadius: 24,
          border: `1px solid ${borderCol}`,
          padding: '36px 30px',
          boxShadow: isDark
            ? '0 24px 64px rgba(0, 0, 0, 0.8)'
            : '0 24px 64px rgba(15, 23, 42, 0.12)',
          position: 'relative',
          zIndex: 1,
          animation: 'cmsPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`,
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: `0 8px 24px ${accentColor}40`,
            }}
          >
            <Sparkles size={26} />
          </div>
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 24,
              fontWeight: 800,
              color: textPrimary,
              margin: '0 0 8px',
            }}
          >
            {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Pelanggan'}
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: textMuted,
              margin: 0,
            }}
          >
            {mode === 'login'
              ? 'Masuk untuk mengakses pesanan & obrolan Anda'
              : 'Daftar cepat untuk pemesanan instan & identitas chat'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: inputBg,
            borderRadius: 16,
            padding: 4,
            marginBottom: 24,
            border: `1px solid ${borderCol}`,
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 12,
              border: 'none',
              background: mode === 'login' ? accentColor : 'transparent',
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
              padding: '10px',
              borderRadius: 12,
              border: 'none',
              background: mode === 'register' ? accentColor : 'transparent',
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

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              borderRadius: 14,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 18,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Nama Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap Anda"
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
              </div>

              {/* Phone (Wajib) */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Nomor WhatsApp / HP (Wajib)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
                  <input
                    type="tel"
                    required
                    placeholder="Cth: 08123456789"
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
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
              Alamat Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
              <input
                type="email"
                required
                placeholder="nama@email.com"
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
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
              Kata Sandi
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
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
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
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
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 100,
              border: 'none',
              background: accentColor,
              color: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15,
              fontWeight: 800,
              cursor: isLoading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: `0 8px 24px ${accentColor}45`,
              marginTop: 8,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 14px', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: borderCol }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>atau</span>
          <div style={{ flex: 1, height: 1, background: borderCol }} />
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={async () => {
            setError('');
            haptic.light();
            try {
              const res = await loginWithGoogle();
              if (res) navigate('/');
            } catch (err: any) {
              setError(err.message || 'Gagal masuk dengan Google.');
            }
          }}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 100,
            border: `1px solid ${borderCol}`,
            background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
            color: textPrimary,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13.5,
            fontWeight: 800,
            cursor: isLoading ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Masuk Google</span>
        </button>

        {/* Admin Login Notice Footer */}
        <div style={{ marginTop: 24, textAlign: 'center', borderTop: `1px solid ${borderCol}`, paddingTop: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: textMuted, fontFamily: "'Inter', sans-serif" }}>
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: accentColor,
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                fontSize: 13,
              }}
            >
              {mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
          <div style={{ marginTop: 14 }}>
            <a
              href="/admin/login"
              style={{
                fontSize: 11,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: textMuted,
                textDecoration: 'none',
                opacity: 0.7,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              <ShieldCheck size={13} />
              <span>Masuk sebagai Pengelola / Admin Website</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLoginPage;
