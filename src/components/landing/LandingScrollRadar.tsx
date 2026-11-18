import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUp, ArrowDown, Compass, Check, ChevronRight, X
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { storage } from '../../utils/storage';
import { ScrollRadarSettings, DEFAULT_SCROLL_RADAR_SETTINGS } from './useLandingData';

export interface LandingSectionInfo {
  id: string;
  label: string;
  shortLabel: string;
}

const DEFAULT_LANDING_SECTIONS: LandingSectionInfo[] = [
  { id: 'hero', label: 'Beranda & Headline', shortLabel: 'Beranda' },
  { id: 'clients', label: 'Mitra & Klien Terpercaya', shortLabel: 'Mitra' },
  { id: 'updates-hub', label: 'Rilis & Aktivitas Terbaru', shortLabel: 'Rilis' },
  { id: 'store-drops', label: 'Store & Drops Produk', shortLabel: 'Store' },
  { id: 'rate-card-spotlight', label: 'Tarif & Paket Layanan', shortLabel: 'Tarif' },
  { id: 'estimator', label: 'Estimator & Kalkulator Biaya', shortLabel: 'Estimator' },
  { id: 'solutions-matrix', label: 'Solusi Digital & Arsitektur', shortLabel: 'Solusi' },
  { id: 'portfolio', label: 'Showcase Karya Terpilih', shortLabel: 'Karya' },
  { id: 'before-after', label: 'Transformasi Sebelum & Sesudah', shortLabel: 'Transformasi' },
  { id: 'model3d', label: 'Spatial 3D Model Explorer', shortLabel: '3D Spasial' },
  { id: 'flipbook-spotlight', label: 'Brand Lookbook & Flipbook', shortLabel: 'Flipbook' },
  { id: 'process', label: 'Alur Kerja Studio', shortLabel: 'Alur Kerja' },
  { id: 'testimonials', label: 'Ulasan & Suara Klien', shortLabel: 'Ulasan' },
  { id: 'blog-preview', label: 'Journal & Catatan Wawasan', shortLabel: 'Journal' },
  { id: 'contact', label: 'Kontak & Konsultasi Studio', shortLabel: 'Kontak' },
];

interface LandingScrollRadarProps {
  isDark?: boolean;
  accentColor?: string;
  customSettings?: Partial<ScrollRadarSettings>;
}

export const LandingScrollRadar: React.FC<LandingScrollRadarProps> = ({
  isDark = true,
  accentColor = '#D95629',
  customSettings
}) => {
  // ── Live Settings (Admin Configurable) ──────────────────────────────────────
  const [settings, setSettings] = useState<ScrollRadarSettings>(() => {
    try {
      const stored = storage.getItem<any>('porto_main_website', null);
      if (stored?.scrollRadar) {
        return { ...DEFAULT_SCROLL_RADAR_SETTINGS, ...stored.scrollRadar, ...customSettings };
      }
    } catch { }
    return { ...DEFAULT_SCROLL_RADAR_SETTINGS, ...customSettings };
  });

  // Listen to live updates from Admin WebsiteManager
  useEffect(() => {
    const handleWebsiteUpdate = (e: any) => {
      try {
        const payload = e?.detail || storage.getItem<any>('porto_main_website', null);
        if (payload?.scrollRadar) {
          setSettings(prev => ({ ...prev, ...payload.scrollRadar }));
        }
      } catch { }
    };

    window.addEventListener('porto_website_updated', handleWebsiteUpdate);
    return () => window.removeEventListener('porto_website_updated', handleWebsiteUpdate);
  }, []);

  useEffect(() => {
    if (customSettings) {
      setSettings(prev => ({ ...prev, ...customSettings }));
    }
  }, [customSettings]);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeSectionId, setActiveSectionId] = useState<string>('hero');
  const [activeSectionLabel, setActiveSectionLabel] = useState<string>('Beranda');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 860);
  const [mounted, setMounted] = useState<boolean>(false);

  // Direct DOM Refs for 0ms Zero-Latency Hardware-Accelerated Sync
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastTapRef = useRef<number>(0);
  const scrollHideTimerRef = useRef<number | null>(null);
  const lastScrollYRef = useRef<number>(-1);
  const isInitialMountScrollRef = useRef<boolean>(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamically filter sections that exist in the DOM
  const [availableSections, setAvailableSections] = useState<LandingSectionInfo[]>(DEFAULT_LANDING_SECTIONS);

  const checkAvailableSections = useCallback(() => {
    if (typeof document === 'undefined') return;
    const found = DEFAULT_LANDING_SECTIONS.filter(sec => {
      if (sec.id === 'hero') return true;
      return Boolean(document.getElementById(sec.id));
    });
    if (found.length > 0) {
      setAvailableSections(found);
    }
  }, []);

  useEffect(() => {
    checkAvailableSections();
    const timer = setTimeout(checkAvailableSections, 1500);
    return () => clearTimeout(timer);
  }, [checkAvailableSections]);

  const isRight = (settings.position || 'right') === 'right';
  const pillWidth = isMobile ? 18 : 22;
  const innerTrackWidth = isMobile ? 5.5 : 6.5;
  const thumbWidth = isMobile ? 11 : 13;
  const thumbHeight = isMobile ? 26 : 32;

  // ── 0ms LATENCY DIRECT DOM HARDWARE-ACCELERATED SCROLL SYNC ──
  useEffect(() => {
    let ticking = false;

    const syncDOM = (progress: number) => {
      if (fillRef.current) {
        fillRef.current.style.height = `${progress}%`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.top = `clamp(0px, calc(${progress}% - ${thumbHeight / 2}px), calc(100% - ${thumbHeight}px))`;
      }
      if (labelRef.current) {
        labelRef.current.style.top = `clamp(20px, ${progress}%, calc(100% - 20px))`;
      }
    };

    const handleScroll = () => {
      const docEl = document.documentElement;
      const scrollTop = window.scrollY || docEl.scrollTop || 0;
      const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
      const progress = scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0;

      // Trigger auto-show on active scroll & auto-hide after 1.2s of inactivity
      if (isInitialMountScrollRef.current) {
        isInitialMountScrollRef.current = false;
        lastScrollYRef.current = scrollTop;
      } else if (Math.abs(scrollTop - lastScrollYRef.current) > 1) {
        lastScrollYRef.current = scrollTop;
        setIsScrolling(true);
        docEl.classList.add('is-user-scrolling');
        if (scrollHideTimerRef.current !== null) {
          window.clearTimeout(scrollHideTimerRef.current);
        }
        scrollHideTimerRef.current = window.setTimeout(() => {
          setIsScrolling(false);
          docEl.classList.remove('is-user-scrolling');
          scrollHideTimerRef.current = null;
        }, 1200);
      }

      // 1. Instant 0ms direct style update (Zero delay!)
      if (!isDraggingRef.current) {
        syncDOM(progress);
      }

      // 2. Throttled state update for section detection and labels
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollProgress(progress);

          // Find current visible section
          const viewportMiddle = window.innerHeight * 0.38;
          let currentId = 'hero';
          let currentLabel = 'Beranda';

          for (const sec of availableSections) {
            const el = document.getElementById(sec.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= viewportMiddle && rect.bottom >= 60) {
                currentId = sec.id;
                currentLabel = sec.label;
              }
            }
          }

          // At bottom of page, anchor to final section
          if (progress >= 96 && availableSections.length > 0) {
            const lastSec = availableSections[availableSections.length - 1];
            currentId = lastSec.id;
            currentLabel = lastSec.label;
          }

          setActiveSectionId(currentId);
          setActiveSectionLabel(currentLabel);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollHideTimerRef.current !== null) {
        window.clearTimeout(scrollHideTimerRef.current);
      }
      document.documentElement.classList.remove('is-user-scrolling');
    };
  }, [availableSections, thumbHeight]);

  const scrollToTop = () => {
    try { haptic.light(); } catch { }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    try { haptic.light(); } catch { }
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const scrollToSection = (id: string) => {
    try { haptic.medium(); } catch { }
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) {
        const navHeight = 74;
        const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
    setIsDrawerOpen(false);
  };

  // ── DRAGGABLE SCROLL INDICATOR SCRUBBER (INSTANT ZERO-DELAY DRAG) ──
  const calculateScrollFromClientY = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const trackHeight = rect.height;
    if (trackHeight <= 0) return;

    const offsetY = clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, offsetY / trackHeight));
    const docEl = document.documentElement;
    const maxScroll = docEl.scrollHeight - docEl.clientHeight;

    window.scrollTo({
      top: ratio * maxScroll,
      behavior: 'auto' // Instant scrub response while dragging
    });

    const progress = ratio * 100;
    setScrollProgress(progress);
    if (fillRef.current) fillRef.current.style.height = `${progress}%`;
    if (thumbRef.current) thumbRef.current.style.top = `clamp(0px, calc(${progress}% - ${thumbHeight / 2}px), calc(100% - ${thumbHeight}px))`;
    if (labelRef.current) labelRef.current.style.top = `clamp(20px, ${progress}%, calc(100% - 20px))`;
  }, [thumbHeight]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Check double-tap/click to open jump list
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      lastTapRef.current = 0;
      try { haptic.medium(); } catch { }
      setIsDrawerOpen(prev => !prev);
      return;
    }
    lastTapRef.current = now;

    try { haptic.selection(); } catch { }
    isDraggingRef.current = true;
    setIsDragging(true);

    calculateScrollFromClientY(e.clientY);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      calculateScrollFromClientY(moveEvent.clientY);
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      setIsScrolling(true);
      if (scrollHideTimerRef.current !== null) {
        window.clearTimeout(scrollHideTimerRef.current);
      }
      scrollHideTimerRef.current = window.setTimeout(() => {
        setIsScrolling(false);
        document.documentElement.classList.remove('is-user-scrolling');
        scrollHideTimerRef.current = null;
      }, 1200);
      try { haptic.light(); } catch { }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // If disabled via Admin Website Settings, or on mobile viewport (< 860px), or not mounted, do not render
  if (settings.enabled === false || !mounted || typeof document === 'undefined' || isMobile) {
    return null;
  }

  const isAtTop = scrollProgress < 2;
  const isAtBottom = scrollProgress > 98;
  const isRadarVisible = !isMobile || isScrolling || isDragging || isDrawerOpen || isHovered;

  // Visual Theme Tokens (Bento 2.0 Solid Minimalist)
  const containerBg = isDark ? 'rgba(21, 24, 36, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  const portalContent = (
    <>
      {/* ── UNIFIED MINIMALIST SCROLLBAR PILL (PORTALED TO BODY: 100% FIXED & STAYS IN PLACE, AUTO-HIDE ON MOBILE) ── */}
      <aside
        id="landing-scroll-radar"
        aria-label="Navigasi Halaman dan Radar Scroll"
        aria-hidden={!isRadarVisible}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          try { haptic.medium(); } catch { }
          setIsDrawerOpen(prev => !prev);
        }}
        title="Geser indikator untuk scroll • Klik 2x untuk daftar bab"
        style={{
          position: 'fixed',
          [isRight ? 'right' : 'left']: isMobile ? 8 : 16,
          top: '50%',
          transform: isRadarVisible
            ? 'translate3d(0, -50%, 0)'
            : (isRight ? 'translate3d(16px, -50%, 0)' : 'translate3d(-16px, -50%, 0)'),
          opacity: isRadarVisible ? 1 : 0,
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: pillWidth,
          height: isMobile ? 'clamp(280px, 64vh, 480px)' : 'clamp(360px, 70vh, 760px)',
          borderRadius: 9999,
          padding: '6px 0',
          background: containerBg,
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: `1px solid ${isHovered || isDragging || isDrawerOpen ? `${accentColor}55` : glassBorder}`,
          boxShadow: isHovered || isDragging
            ? '0 12px 32px rgba(0,0,0,0.32)'
            : '0 6px 20px rgba(0,0,0,0.16)',
          pointerEvents: isRadarVisible ? 'auto' : 'none',
          transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none', // Fluid drag gestures on touch
          boxSizing: 'border-box'
        }}
      >
        {/* ── 1. PANAH ATAS (MINIMALIS TANPA LINGKARAN) ── */}
        <button
          type="button"
          onClick={scrollToTop}
          disabled={isAtTop}
          title={isAtTop ? 'Sudah di paling atas' : 'Kembali ke Paling Atas (0%)'}
          aria-label="Kembali ke Paling Atas"
          style={{
            width: pillWidth,
            height: isMobile ? 20 : 24,
            borderRadius: 9999,
            border: 'none',
            background: 'transparent',
            color: isAtTop ? (isDark ? '#475569' : '#cbd5e1') : textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isAtTop ? 'default' : 'pointer',
            opacity: isAtTop ? 0.35 : 0.85,
            transition: 'color 0.15s ease, opacity 0.15s ease',
            padding: 0,
            flexShrink: 0
          }}
          onMouseEnter={(e) => { if (!isAtTop) e.currentTarget.style.color = accentColor; }}
          onMouseLeave={(e) => { if (!isAtTop) e.currentTarget.style.color = textColor; }}
        >
          <ArrowUp size={isMobile ? 12 : 14} strokeWidth={2.4} />
        </button>

        {/* ── 2. DRAGGABLE INNER TRACK (TEBAL, SOLID & SMOOTH DENGAN FITUR DOUBLE-CLICK) ── */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            try { haptic.medium(); } catch { }
            setIsDrawerOpen(prev => !prev);
          }}
          title="Tarik untuk scroll • Klik 2x untuk membuka daftar bab"
          style={{
            flex: 1,
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'pointer',
            padding: '3px 0',
            boxSizing: 'border-box'
          }}
        >
          {/* Substantial Guide Spine Track (Tebal, Solid Minimalis) */}
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: innerTrackWidth,
            borderRadius: 9999,
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
            pointerEvents: 'none'
          }}>
            {/* Trailing Progress Fill (SOLID THEME ACCENT COLOR - ZERO DELAY) */}
            <div
              ref={fillRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${scrollProgress}%`,
                background: accentColor,
                borderRadius: 9999,
                opacity: 0.95,
                transition: isDragging
                  ? 'none'
                  : 'height 0.12s cubic-bezier(0.16, 1, 0.3, 1)', // Silky soft physics glide
                willChange: 'height'
              }}
            />
          </div>

          {/* Draggable Minimalist Scrubber Thumb (SOLID THEME ACCENT COLOR - ZERO DELAY) */}
          <div
            ref={thumbRef}
            style={{
              position: 'absolute',
              top: `clamp(0px, calc(${scrollProgress}% - ${thumbHeight / 2}px), calc(100% - ${thumbHeight}px))`,
              width: thumbWidth,
              height: thumbHeight,
              borderRadius: 9999,
              background: accentColor, // PURE SOLID THEME ACCENT COLOR, NO GRADIENT
              border: isDark ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: isDragging
                ? `0 2px 10px ${accentColor}70, 0 2px 6px rgba(0,0,0,0.3)`
                : `0 2px 8px rgba(0,0,0,0.22)`,
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging
                ? 'none'
                : 'top 0.12s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s ease', // Silky soft glide
              transform: isDragging ? 'scale(1.12)' : 'scale(1)',
              willChange: 'top, transform',
              zIndex: 3
            }}
          />
        </div>

        {/* ── 3. PANAH BAWAH (MINIMALIS TANPA LINGKARAN) ── */}
        <button
          type="button"
          onClick={scrollToBottom}
          disabled={isAtBottom}
          title={isAtBottom ? 'Sudah di paling bawah' : 'Langsung ke Paling Bawah (100%)'}
          aria-label="Langsung ke Paling Bawah"
          style={{
            width: pillWidth,
            height: isMobile ? 20 : 24,
            borderRadius: 9999,
            border: 'none',
            background: 'transparent',
            color: isAtBottom ? (isDark ? '#475569' : '#cbd5e1') : textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isAtBottom ? 'default' : 'pointer',
            opacity: isAtBottom ? 0.35 : 0.85,
            transition: 'color 0.15s ease, opacity 0.15s ease',
            padding: 0,
            flexShrink: 0
          }}
          onMouseEnter={(e) => { if (!isAtBottom) e.currentTarget.style.color = accentColor; }}
          onMouseLeave={(e) => { if (!isAtBottom) e.currentTarget.style.color = textColor; }}
        >
          <ArrowDown size={isMobile ? 12 : 14} strokeWidth={2.4} />
        </button>

        {/* ── 4. SINGLE-LINE HORIZONTAL SECTION LABEL (KLIK UNTUK JUMP LIST) ── */}
        {settings.showSectionLabel && !isDrawerOpen && (isHovered || isDragging || (isMobile && isScrolling)) && (
          <div
            ref={labelRef}
            onClick={() => {
              try { haptic.medium(); } catch { }
              setIsDrawerOpen(prev => !prev);
            }}
            title="Klik untuk membuka daftar bab halaman"
            style={{
              position: 'absolute',
              [isRight ? 'right' : 'left']: '100%',
              [isRight ? 'marginRight' : 'marginLeft']: 10,
              top: `clamp(20px, ${scrollProgress}%, calc(100% - 20px))`,
              transform: 'translateY(-50%)',
              padding: '4px 10px',
              borderRadius: 9999,
              background: containerBg,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${accentColor}35`,
              boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: isDragging ? 'none' : 'top 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
              animation: isRight
                ? 'radarPillSlideRight 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                : 'radarPillSlideLeft 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <div style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: accentColor,
              flexShrink: 0
            }} />
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: textColor,
              fontFamily: "'Outfit', sans-serif",
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
              lineHeight: 1
            }}>
              {activeSectionLabel}
            </span>
          </div>
        )}
      </aside>

      {/* ── EXPANDABLE QUICK SECTION TABLE OF CONTENTS DRAWER ── */}
      {isDrawerOpen && (
        <>
          {/* Backdrop Dismiss */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 999998,
              animation: 'radarFadeIn 0.2s ease'
            }}
          />

          <div
            style={{
              position: 'fixed',
              [isRight ? 'right' : 'left']: isMobile ? 10 : 54,
              top: '50%',
              transform: 'translateY(-50%)',
              width: isMobile ? 'calc(100vw - 20px)' : 310,
              maxWidth: 340,
              maxHeight: '82vh',
              background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 22,
              border: `1.5px solid ${accentColor}40`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.45), 0 0 30px rgba(217, 86, 41, 0.2)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'radarDrawerPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${glassBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Compass size={16} style={{ color: accentColor }} />
                <span style={{
                  fontSize: 13.5,
                  fontWeight: 850,
                  fontFamily: "'Outfit', sans-serif",
                  color: textColor
                }}>
                  Peta Bab & Navigasi
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: 'none',
                  color: subTextColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* List of Sections with Jump Links */}
            <div style={{
              padding: '8px 10px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              {availableSections.map((sec, idx) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: isActive
                        ? (isDark ? `${accentColor}25` : `${accentColor}18`)
                        : 'transparent',
                      border: isActive ? `1px solid ${accentColor}50` : '1px solid transparent',
                      color: isActive ? accentColor : textColor,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        opacity: isActive ? 1 : 0.45,
                        width: 16,
                        color: isActive ? accentColor : subTextColor
                      }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontSize: 12.5,
                        fontWeight: isActive ? 800 : 600,
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}>
                        {sec.label}
                      </span>
                    </div>

                    {isActive ? (
                      <Check size={13} style={{ color: accentColor }} />
                    ) : (
                      <ChevronRight size={12} style={{ color: subTextColor, opacity: 0.4 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div style={{
              padding: '10px 18px',
              background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
              borderTop: `1px solid ${glassBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: subTextColor
            }}>
              <span>Navigasi Bab</span>
              <span>{availableSections.length} Bagian</span>
            </div>
          </div>
        </>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes radarPillSlideRight {
          from { opacity: 0; transform: translate(10px, -50%); }
          to { opacity: 1; transform: translate(0, -50%); }
        }
        @keyframes radarPillSlideLeft {
          from { opacity: 0; transform: translate(-10px, -50%); }
          to { opacity: 1; transform: translate(0, -50%); }
        }
        @keyframes radarFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes radarDrawerPop {
          from { opacity: 0; transform: scale(0.93) translateY(-48%); }
          to { opacity: 1; transform: scale(1) translateY(-50%); }
        }
      `}</style>
    </>
  );

  return createPortal(portalContent, document.body);
};

export default LandingScrollRadar;
