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
  const { client, login, register, isLoading } = useClientAuth();

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

  const bgPage = isDark 
    ? 'radial-gradient(ellipse at 50% 0%, #171936 0%, #0b0c16 60%, #06070a 100%)' 
    : 'radial-gradient(ellipse at 50% 0%, #eef2ff 0%, #f8fafc 60%, #f1f5f9 100%)';
  const bgCard = isDark ? '#13141f' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
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
        title={mode === 'login' ? 'Masuk ke sumr.day Client Hub ☀️' : 'Daftar Akun Baru — sumr.day'}
        description="Masuk ke Client Hub sumr.day untuk memantau progres undangan web, landing page, dan aset visualmu dengan santai."
      />

      {/* Background Accent Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
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
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
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
          borderRadius: 28,
          border: `1px solid ${borderCol}`,
          padding: '36px 30px',
          boxShadow: isDark
            ? '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.2)'
            : '0 24px 64px rgba(0,0,0,0.08)',
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
