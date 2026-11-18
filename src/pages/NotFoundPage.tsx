import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Home, Compass, Sun, Moon } from 'lucide-react';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import SEOHelmet from '../components/SEOHelmet';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useWebsiteTheme();

  const bgPage = isDark ? '#07080e' : '#f8fafc';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: bgPage,
        boxSizing: 'border-box',
        color: textPrimary
      }}
    >
      <SEOHelmet
        title="404 — Halaman Tidak Ditemukan | sumr.day"
        description="Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan."
        noindex={true}
      />

      {/* Top Header */}
      <header
        style={{
          height: 68,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${cardBorder}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: textPrimary
          }}
        >
          <img
            src="/logo.png"
            alt="sumr.day"
            style={{ width: 28, height: 28, objectFit: 'contain' }}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.5px'
            }}
          >
            sumr.day
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `1px solid ${cardBorder}`,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#fbbf24' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDark ? (
              <span key="sun-nf" className="theme-icon-animated"><Sun size={16} /></span>
            ) : (
              <span key="moon-nf" className="theme-icon-animated"><Moon size={16} /></span>
            )}
          </button>

          <Link
            to="/"
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              background: 'var(--cms-accent, #D95629)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 750,
              textDecoration: 'none',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            Beranda
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            padding: '48px 32px',
            borderRadius: 24,
            background: cardBg,
            border: `1.5px solid ${cardBorder}`,
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.06)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {/* Visual Compass Icon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: isDark ? 'rgba(217, 86, 41, 0.15)' : 'rgba(217, 86, 41, 0.1)',
              color: 'var(--cms-accent, #D95629)',
              marginBottom: 20,
              border: `1px solid rgba(217, 86, 41, 0.3)`
            }}
          >
            <Compass size={40} strokeWidth={1.8} />
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              fontFamily: "'Outfit', sans-serif",
              lineHeight: 1,
              color: textPrimary,
              letterSpacing: '-2px',
              marginBottom: 12
            }}
          >
            404
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              color: textPrimary,
              margin: '0 0 12px'
            }}
          >
            Halaman Tidak Ditemukan
          </h1>

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: textMuted,
              fontFamily: "'Inter', sans-serif",
              margin: '0 auto 32px',
              maxWidth: 380
            }}
          >
            Tautan yang Anda tuju mungkin sudah kedaluwarsa, dipindahkan, atau alamat URL yang dimasukkan kurang tepat.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center'
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                maxWidth: 320,
                padding: '12px 20px',
                borderRadius: 14,
                border: 'none',
                background: 'var(--cms-accent, #D95629)',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(217, 86, 41, 0.35)',
                transition: 'transform 0.15s ease'
              }}
            >
              <Home size={16} />
              <span>Kembali ke Beranda</span>
            </button>

            <Link
              to="/katalog"
              style={{
                width: '100%',
                maxWidth: 320,
                padding: '12px 20px',
                borderRadius: 14,
                border: `1.5px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                color: textPrimary,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxSizing: 'border-box'
              }}
            >
              <Store size={16} />
              <span>Jelajahi Katalog Produk</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer
        style={{
          padding: '24px',
          textAlign: 'center',
          fontSize: 12,
          color: textMuted,
          fontFamily: "'Inter', sans-serif",
          borderTop: `1px solid ${cardBorder}`
        }}
      >
        © {new Date().getFullYear()} sumr.day — Creative Digital Studio. All rights reserved.
      </footer>
    </div>
  );
};

export default NotFoundPage;
