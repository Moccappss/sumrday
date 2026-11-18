import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BookOpen, Share2, Check, ArrowLeft, Sun, Moon, Maximize2, Minimize2, Download, ExternalLink, Loader2
} from 'lucide-react';
import { ClientFlipbook } from '../types/flipbook';
import { getClientFlipbookBySlugOrId, generateFlipbookShareUrl } from '../services/flipbookService';
import { PdfFlipbookViewer } from '../components/common/PdfFlipbookViewer';
import { haptic } from '../utils/haptics';

export const StandaloneFlipbookPage: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [flipbook, setFlipbook] = useState<ClientFlipbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchBook = async () => {
      if (!slugOrId) {
        setLoading(false);
        return;
      }
      try {
        const item = await getClientFlipbookBySlugOrId(slugOrId);
        if (isMounted) {
          if (item) {
            setFlipbook(item);
            if (item.isDark !== undefined) {
              setIsDark(item.isDark);
            }
            document.title = `${item.title} • sumr.day Flipbook`;
          }
        }
      } catch (err) {
        console.error('Failed to load standalone flipbook:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBook();
    return () => {
      isMounted = false;
    };
  }, [slugOrId]);

  const handleCopyLink = () => {
    if (!slugOrId) return;
    const url = generateFlipbookShareUrl(slugOrId);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      haptic.light();
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#D95629', marginBottom: 14 }} />
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.8 }}>Membuka Flipbook...</div>
      </div>
    );
  }

  if (!flipbook) {
    return (
      <div style={{
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: 24,
        textAlign: 'center'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'rgba(217, 86, 41, 0.15)',
          color: '#D95629',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <BookOpen size={32} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', fontFamily: "'Outfit', sans-serif" }}>
          Flipbook Tidak Ditemukan
        </h1>
        <p style={{ fontSize: 14, opacity: 0.65, maxWidth: 440, lineHeight: 1.6, margin: '0 0 24px 0' }}>
          Tautan dokumen mungkin telah kedaluwarsa atau diubah oleh admin studio.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            background: '#D95629',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 13.5,
            fontWeight: 700
          }}
        >
          <ArrowLeft size={16} /> Ke Beranda
        </Link>
      </div>
    );
  }

  const bgGradient = isDark
    ? 'radial-gradient(ellipse at 50% 15%, #172136 0%, #090d16 100%)'
    : 'radial-gradient(ellipse at 50% 15%, #f1f5f9 0%, #e2e8f0 100%)';

  return (
    <main 
      style={{
        width: '100vw',
        height: '100dvh',
        background: bgGradient,
        color: isDark ? '#f8fafc' : '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* ── TOP FLOATING CONTROL BAR (MINIMAL & SLEEK) ── */}
      <header style={{
        position: 'absolute',
        top: 14,
        left: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        pointerEvents: 'none'
      }}>
        {/* Left: Branding & Book Info */}
        <div style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 14px 6px 10px',
          borderRadius: 100,
          background: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--cms-accent, #D95629)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BookOpen size={14} strokeWidth={2.4} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--cms-accent, #D95629)',
              lineHeight: 1
            }}>
              {flipbook.clientName || 'sumr.day Studio'}
            </span>
            <span style={{
              fontSize: 12.5,
              fontWeight: 750,
              fontFamily: "'Outfit', sans-serif",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 'min(360px, 45vw)'
            }}>
              {flipbook.title}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {/* Share Link Pill */}
          <button
            onClick={handleCopyLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 100,
              background: copied ? '#22c55e' : (isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)'),
              color: copied ? '#fff' : 'inherit',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? <Check size={13} strokeWidth={3} /> : <Share2 size={13} />}
            <span>{copied ? 'Tautan Disalin!' : 'Bagikan'}</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDark(prev => !prev)}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
              color: 'inherit',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
              color: 'inherit',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
            }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* ── CENTER: PURE FLIPBOOK VIEWER ── */}
      <div style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 16px 20px',
        boxSizing: 'border-box'
      }}>
        <PdfFlipbookViewer
          title={flipbook.title}
          pdfUrl={flipbook.pdfUrl}
          totalPages={flipbook.totalPages}
          isDark={isDark}
          accentColor={flipbook.accentColor || '#D95629'}
          allowDownload={flipbook.allowDownload}
          defaultViewMode={flipbook.defaultViewMode}
          paperAspectRatio={flipbook.aspectRatio || 0.7071}
          height="calc(100dvh - 120px)"
          showModeSwitch={false}
        />
      </div>
    </main>
  );
};

export default StandaloneFlipbookPage;
