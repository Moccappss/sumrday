import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone, Tablet, Monitor, ExternalLink, RefreshCw, X,
  Copy, Check, Sparkles, Globe, Eye, ShieldCheck, ArrowLeft, ArrowRight
} from 'lucide-react';
import LandingPage from '../../pages/LandingPage';
import PortfolioPage from '../../pages/PortfolioPage';
import Katalog from '../../pages/Katalog';
import Blog from '../../pages/Blog';
import AboutPage from '../../pages/AboutPage';
import LinksPage from '../../pages/LinksPage';
import ClientView from '../../apps/invitation-maker/components/ClientView';
import { getAllInvitations } from '../../apps/invitation-maker/invitationData';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

export interface ClientWebsitePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: 'home' | 'portfolio' | 'katalog' | 'blog' | 'about' | 'links' | 'invitation';
}

class PreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('Client Preview Error Boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 32,
          textAlign: 'center',
          background: '#0a0a12',
          color: '#fff',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16
        }}>
          <div style={{ fontSize: 36 }}>⚠️</div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Pratinjau Mengalami Kendala</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', maxWidth: 400 }}>
            {this.state.error?.message || 'Terjadi kesalahan saat memuat komponen client.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              background: 'var(--cms-accent, #7c3aed)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Muat Ulang Pratinjau
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ClientWebsitePreviewModal: React.FC<ClientWebsitePreviewModalProps> = ({
  isOpen,
  onClose,
  initialPage = 'home'
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [activeClientPage, setActiveClientPage] = useState<'home' | 'portfolio' | 'katalog' | 'blog' | 'about' | 'links' | 'invitation'>(initialPage);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useNativeBackHandler(isOpen, onClose, 'client_website_preview_modal', 15);

  useEffect(() => {
    if (isOpen) {
      setActiveClientPage(initialPage);
    }
  }, [isOpen, initialPage]);

  if (!isOpen) return null;

  const defaultInvSlug = (getAllInvitations()[0]?.slug) || 'arif-nadia';

  const publicUrlMap: Record<string, string> = {
    home: window.location.origin + '/',
    portfolio: window.location.origin + '/portfolio',
    katalog: window.location.origin + '/katalog',
    blog: window.location.origin + '/blog',
    about: window.location.origin + '/about',
    links: window.location.origin + '/links',
    invitation: window.location.origin + `/undangan/${defaultInvSlug}`
  };

  const currentPublicUrl = publicUrlMap[activeClientPage] || window.location.origin;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentPublicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderActivePage = () => {
    switch (activeClientPage) {
      case 'portfolio':
        return <PortfolioPage />;
      case 'katalog':
        return <Katalog />;
      case 'blog':
        return <Blog />;
      case 'about':
        return <AboutPage />;
      case 'links':
        return <LinksPage />;
      case 'invitation':
        return (
          <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
            <ClientView />
          </div>
        );
      case 'home':
      default:
        return <LandingPage />;
    }
  };

  const getContainerStyles = (): React.CSSProperties => {
    if (deviceMode === 'mobile') {
      return {
        width: 390,
        height: '84vh',
        maxHeight: 844,
        borderRadius: 40,
        border: '10px solid #1e1e2d',
        boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        position: 'relative',
        background: '#000'
      };
    }
    if (deviceMode === 'tablet') {
      return {
        width: 768,
        height: '84vh',
        maxHeight: 1024,
        borderRadius: 28,
        border: '12px solid #1e1e2d',
        boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        position: 'relative',
        background: '#000'
      };
    }
    return {
      width: '100%',
      maxWidth: 1400,
      height: '84vh',
      borderRadius: 20,
      border: '1.5px solid var(--glass-border)',
      boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
      overflow: 'hidden',
      position: 'relative',
      background: '#000'
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(5, 5, 12, 0.92)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        overflow: 'hidden'
      }}
    >
      {/* ── TOP CONTROL BAR ── */}
      <header
        style={{
          width: '100%',
          maxWidth: 1400,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 18px',
          borderRadius: 18,
          background: 'rgba(26, 27, 38, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'none',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          zIndex: 20
        }}
      >
        {/* Page Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--cms-accent, #7c3aed)',
            fontWeight: 850,
            fontSize: 13,
            marginRight: 6
          }}>
            <Globe size={16} />
            <span>Pratinjau Live:</span>
          </div>

          {[
            { id: 'home', label: 'Beranda' },
            { id: 'portfolio', label: 'Portofolio' },
            { id: 'katalog', label: 'Katalog' },
            { id: 'blog', label: 'Blog' },
            { id: 'about', label: 'Tentang' },
            { id: 'links', label: 'Biolink' },
            { id: 'invitation', label: 'Undangan' }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActiveClientPage(p.id as any);
                setPreviewKey((k) => k + 1);
              }}
              style={{
                height: 32,
                padding: '0 12px',
                borderRadius: 8,
                border: 'none',
                background: activeClientPage === p.id ? 'var(--cms-accent, #7c3aed)' : 'rgba(255, 255, 255, 0.06)',
                color: activeClientPage === p.id ? '#fff' : '#94a3b8',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Viewport Device Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(0, 0, 0, 0.4)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 8,
              border: 'none',
              background: deviceMode === 'mobile' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: deviceMode === 'mobile' ? '#fff' : '#94a3b8',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
            title="Tampilan Ponsel (Mobile 390px)"
          >
            <Smartphone size={14} /> <span>Ponsel</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 8,
              border: 'none',
              background: deviceMode === 'tablet' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: deviceMode === 'tablet' ? '#fff' : '#94a3b8',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
            title="Tampilan Tablet (768px)"
          >
            <Tablet size={14} /> <span>Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 8,
              border: 'none',
              background: deviceMode === 'desktop' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: deviceMode === 'desktop' ? '#fff' : '#94a3b8',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
            title="Tampilan Desktop Penuh"
          >
            <Monitor size={14} /> <span>Desktop</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPreviewKey((k) => k + 1)}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Muat ulang pratinjau"
          >
            <RefreshCw size={13} />
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 8,
              background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
              color: copied ? '#10b981' : '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Salin Tautan Publik Halaman Ini"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Tersalin' : 'Salin URL'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.open(currentPublicUrl, '_blank')}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 8,
              background: 'var(--cms-accent, #7c3aed)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer'
            }}
            title="Buka di Tab Baru Browser"
          >
            <ExternalLink size={13} />
            <span>Buka Web</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.85)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Tutup Pratinjau (ESC)"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* ── PREVIEW CANVAS STAGE ── */}
      <main
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 0',
          overflow: 'hidden'
        }}
      >
        <div style={getContainerStyles()}>
          {/* Mobile Bezel Speaker / Dynamic Island */}
          {deviceMode === 'mobile' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 24,
                background: '#1e1e2d',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0a0a14', marginRight: 8 }} />
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#0a0a14' }} />
            </div>
          )}

          {/* Render Area */}
          <div
            key={previewKey}
            style={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              background: '#08080f',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <PreviewErrorBoundary>
              {renderActivePage()}
            </PreviewErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientWebsitePreviewModal;
