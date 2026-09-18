import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, Smartphone, Tablet, Sun, Moon, Maximize2, Minimize2, 
  RotateCcw, Eye, ZoomIn, ZoomOut, Sparkles, ExternalLink, RefreshCw
} from 'lucide-react';
import LPNavbar from '../landing/LPNavbar';
import LPHero from '../landing/LPHero';
import LPAbout from '../landing/LPAbout';
import LPPortfolio from '../landing/LPPortfolio';
import LPProcess from '../landing/LPProcess';
import LPTestimonials from '../landing/LPTestimonials';
import LPFooter from '../landing/LPFooter';
import type { MainWebsiteData } from '../landing/useLandingData';

interface WebsiteLivePreviewPaneProps {
  data: MainWebsiteData;
  projects?: any[];
  activeTab?: string;
  isDarkTheme?: boolean;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'auto' | 'full';

export const WebsiteLivePreviewPane: React.FC<WebsiteLivePreviewPaneProps> = ({
  data,
  projects = [],
  activeTab = 'overview',
  isDarkTheme = true
}) => {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [previewDark, setPreviewDark] = useState<boolean>(isDarkTheme);
  const [scale, setScale] = useState<number>(1);
  const [autoFit, setAutoFit] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync default mode with website theme if set
  useEffect(() => {
    if (data?.theme?.defaultMode) {
      setPreviewDark(data.theme.defaultMode === 'dark');
    }
  }, [data?.theme?.defaultMode]);

  // Auto-scroll to relevant section based on active admin tab
  useEffect(() => {
    if (viewMode !== 'auto' || !scrollRef.current) return;

    const timer = setTimeout(() => {
      if (!scrollRef.current) return;
      let targetEl: HTMLElement | null = null;

      if (activeTab === 'hero_profile') {
        targetEl = scrollRef.current.querySelector('#hero');
      } else if (activeTab === 'portfolio') {
        targetEl = scrollRef.current.querySelector('#portfolio');
      } else if (activeTab === 'overview') {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [activeTab, viewMode]);

  // Calculate auto-fit scale
  useEffect(() => {
    if (!autoFit || !containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32;
      const targetWidth = device === 'desktop' ? 1200 : device === 'tablet' ? 768 : 390;

      if (containerWidth < targetWidth) {
        const calculatedScale = Math.max(0.45, Math.min(1, containerWidth / targetWidth));
        setScale(calculatedScale);
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [device, autoFit]);

  const accentColor = data?.theme?.accentColor || '#6366f1';
  const targetWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: previewDark ? '#06070d' : '#f1f5f9',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        borderLeft: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
      }}
    >
      {/* ── Top Toolbar Bar ── */}
      <div
        style={{
          height: 48,
          minHeight: 48,
          padding: '0 14px',
          background: previewDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${previewDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Left: Indicator & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 100,
            background: `${accentColor}18`,
            color: accentColor,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span>LIVE PREVIEW</span>
          </div>
        </div>

        {/* Center: Device Switchers */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: previewDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.05)',
          padding: '3px',
          borderRadius: 100,
          border: `1px solid ${previewDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <button
            onClick={() => { setDevice('desktop'); setAutoFit(true); }}
            title="Tampilan Desktop (100%)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 28,
              borderRadius: 100,
              border: 'none',
              background: device === 'desktop' ? accentColor : 'transparent',
              color: device === 'desktop' ? '#fff' : (previewDark ? '#94a3b8' : '#64748b'),
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Monitor size={15} />
          </button>
          <button
            onClick={() => { setDevice('tablet'); setAutoFit(true); }}
            title="Tampilan Tablet (768px)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 28,
              borderRadius: 100,
              border: 'none',
              background: device === 'tablet' ? accentColor : 'transparent',
              color: device === 'tablet' ? '#fff' : (previewDark ? '#94a3b8' : '#64748b'),
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Tablet size={15} />
          </button>
          <button
            onClick={() => { setDevice('mobile'); setAutoFit(true); }}
            title="Tampilan Ponsel (390px)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 28,
              borderRadius: 100,
              border: 'none',
              background: device === 'mobile' ? accentColor : 'transparent',
              color: device === 'mobile' ? '#fff' : (previewDark ? '#94a3b8' : '#64748b'),
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Smartphone size={15} />
          </button>
        </div>

        {/* Right: Theme Toggle & External Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setPreviewDark(!previewDark)}
            title={previewDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: `1px solid ${previewDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: previewDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: previewDark ? '#f8fafc' : '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {previewDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka Website Publik di Tab Baru"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: `1px solid ${previewDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              background: previewDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: previewDark ? '#f8fafc' : '#0f172a',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* ── Main Canvas Viewport Area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: device === 'desktop' ? 'stretch' : 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: device === 'desktop' ? 0 : '24px 16px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: targetWidth,
            maxWidth: device === 'desktop' ? '100%' : targetWidth,
            height: device === 'desktop' ? '100%' : 'auto',
            maxHeight: device === 'desktop' ? '100%' : '90vh',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s ease',
            borderRadius: device === 'desktop' ? 0 : (device === 'mobile' ? 44 : 28),
            boxShadow: device === 'desktop'
              ? 'none'
              : (previewDark
                ? '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 0 10px #1e293b, 0 0 0 12px rgba(255,255,255,0.1)'
                : '0 25px 60px -15px rgba(0,0,0,0.2), 0 0 0 10px #e2e8f0, 0 0 0 12px rgba(0,0,0,0.05)'),
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: previewDark ? '#08080f' : '#ffffff',
            position: 'relative',
          }}
        >
          {/* Mobile Notch / Dynamic Island Simulator */}
          {device === 'mobile' && (
            <div
              style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                height: 28,
                background: previewDark ? '#08080f' : '#ffffff',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 90, height: 18, borderRadius: 100, background: '#000000', margin: '4px auto 0' }} />
            </div>
          )}

          {/* Website Content Scroll Area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              background: previewDark ? '#08080f' : '#ffffff',
            }}
          >
            {/* Live Navbar */}
            <LPNavbar
              items={data?.navbar?.items || []}
              loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
              isDark={previewDark}
              accentColor={accentColor}
              logoText={data?.navbar?.logoText || data?.hero?.title || 'Agenze'}
            />

            {/* Live Hero */}
            <LPHero
              data={data.hero}
              isDark={previewDark}
              accentColor={accentColor}
              localization={data.localization}
            />

            {/* Live About / Services */}
            <LPAbout
              data={data.about}
              isDark={previewDark}
              accentColor={accentColor}
              localization={data.localization}
            />

            {/* Live Portfolio */}
            <LPPortfolio
              projects={projects}
              landingFeaturedLabel={data.portfolio?.landingFeaturedLabel || ''}
              isDark={previewDark}
              accentColor={accentColor}
              localization={data.localization}
            />

            {/* Live Process */}
            <LPProcess
              data={data.process}
              isDark={previewDark}
              accentColor={accentColor}
              localization={data.localization}
            />

            {/* Live Testimonials */}
            <LPTestimonials
              data={data.testimonials}
              isDark={previewDark}
              accentColor={accentColor}
              localization={data.localization}
            />

            {/* Live Footer */}
            <LPFooter
              data={data.footer}
              isDark={previewDark}
              accentColor={accentColor}
              localization={data.localization}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteLivePreviewPane;
