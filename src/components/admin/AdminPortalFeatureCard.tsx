import React, { useState, useEffect } from 'react';
import { LucideIcon, Link2, ArrowUpRight, Sparkles } from 'lucide-react';

export interface AdminFeaturePalette {
  name: string;
  accent: string;
  gradient: string;
  wave1: string;
  wave2: string;
  wave3: string;
  wave4: string;
  fluteDark: string;
  fluteLight: string;
  shadow: string;
}

export const ADMIN_FEATURE_PALETTES: AdminFeaturePalette[] = [
  // 01: Coral Terracotta (Signature Xebrix Warm Orange)
  {
    name: 'coral',
    accent: '#f97316',
    gradient: 'linear-gradient(135deg, #9a3412 0%, #ea580c 50%, #fb923c 100%)',
    wave1: '#7c2d12',
    wave2: '#dc2626',
    wave3: '#f97316',
    wave4: '#fb923c',
    fluteDark: '#141526',
    fluteLight: '#fed7aa',
    shadow: 'rgba(67, 20, 7, 0.45)',
  },
  // 02: Ocean Azure
  {
    name: 'ocean',
    accent: '#38bdf8',
    gradient: 'linear-gradient(135deg, #075985 0%, #0284c7 50%, #38bdf8 100%)',
    wave1: '#0c4a6e',
    wave2: '#0369a1',
    wave3: '#0ea5e9',
    wave4: '#38bdf8',
    fluteDark: '#111629',
    fluteLight: '#bae6fd',
    shadow: 'rgba(8, 47, 73, 0.45)',
  },
  // 03: Royal Violet
  {
    name: 'violet',
    accent: '#a78bfa',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)',
    wave1: '#3b0764',
    wave2: '#6d28d9',
    wave3: '#8b5cf6',
    wave4: '#a78bfa',
    fluteDark: '#151229',
    fluteLight: '#ddd6fe',
    shadow: 'rgba(46, 16, 101, 0.45)',
  },
  // 04: Emerald Mint
  {
    name: 'emerald',
    accent: '#34d399',
    gradient: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)',
    wave1: '#064e3b',
    wave2: '#047857',
    wave3: '#10b981',
    wave4: '#34d399',
    fluteDark: '#0f1c1e',
    fluteLight: '#a7f3d0',
    shadow: 'rgba(2, 44, 34, 0.45)',
  },
  // 05: Amber Gold
  {
    name: 'amber',
    accent: '#fbbf24',
    gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #fbbf24 100%)',
    wave1: '#78350f',
    wave2: '#b45309',
    wave3: '#f59e0b',
    wave4: '#fbbf24',
    fluteDark: '#1a1512',
    fluteLight: '#fde68a',
    shadow: 'rgba(69, 26, 3, 0.45)',
  },
  // 06: Crimson Rose
  {
    name: 'rose',
    accent: '#fb7185',
    gradient: 'linear-gradient(135deg, #9f1239 0%, #e11d48 50%, #fb7185 100%)',
    wave1: '#881337',
    wave2: '#be123c',
    wave3: '#f43f5e',
    wave4: '#fb7185',
    fluteDark: '#1c1121',
    fluteLight: '#fecdd3',
    shadow: 'rgba(76, 5, 25, 0.45)',
  },
  // 07: Electric Indigo
  {
    name: 'indigo',
    accent: '#818cf8',
    gradient: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #818cf8 100%)',
    wave1: '#1e1b4b',
    wave2: '#4338ca',
    wave3: '#6366f1',
    wave4: '#818cf8',
    fluteDark: '#111329',
    fluteLight: '#c7d2fe',
    shadow: 'rgba(30, 27, 75, 0.45)',
  },
  // 08: Teal Lagoon
  {
    name: 'teal',
    accent: '#2dd4bf',
    gradient: 'linear-gradient(135deg, #115e59 0%, #0d9488 50%, #2dd4bf 100%)',
    wave1: '#134e4a',
    wave2: '#0f766e',
    wave3: '#14b8a6',
    wave4: '#2dd4bf',
    fluteDark: '#0f1b21',
    fluteLight: '#99f6e4',
    shadow: 'rgba(4, 47, 46, 0.45)',
  },
  // 09: Fuchsia Berry
  {
    name: 'fuchsia',
    accent: '#e879f9',
    gradient: 'linear-gradient(135deg, #701a75 0%, #c026d3 50%, #e879f9 100%)',
    wave1: '#4a044e',
    wave2: '#a21caf',
    wave3: '#d946ef',
    wave4: '#e879f9',
    fluteDark: '#1b1126',
    fluteLight: '#f5d0fe',
    shadow: 'rgba(74, 4, 78, 0.45)',
  },
];

export interface AdminPortalFeatureCardProps {
  index: number;
  title: string;
  badge: string;
  subtitle: string;
  tagLabel?: string;
  customTag?: string;
  routeKey?: string;
  icon: LucideIcon;
  paletteIndex?: number;
  variant?: 'fluted' | 'wave';
  isMobile?: boolean;
  isDarkMode?: boolean;
  onClick?: () => void;
}

export const AdminPortalFeatureCard: React.FC<AdminPortalFeatureCardProps> = ({
  index,
  title,
  badge,
  subtitle,
  tagLabel = 'mod',
  customTag,
  routeKey,
  icon: IconComp,
  paletteIndex,
  variant = 'wave',
  isMobile = false,
  isDarkMode: isDarkModeProp,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic Dark/Light mode detection with reactive listeners
  const [internalDarkMode, setInternalDarkMode] = useState(() => {
    if (typeof isDarkModeProp === 'boolean') return isDarkModeProp;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cms_dark_mode');
      if (stored !== null) return stored !== 'false';
      return document.documentElement.getAttribute('data-cms-theme') !== 'light' &&
        !document.body.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    if (typeof isDarkModeProp === 'boolean') {
      setInternalDarkMode(isDarkModeProp);
    }
  }, [isDarkModeProp]);

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (typeof e.detail?.isDark === 'boolean') {
        setInternalDarkMode(e.detail.isDark);
      } else {
        const stored = localStorage.getItem('cms_dark_mode');
        setInternalDarkMode(stored !== 'false');
      }
    };
    window.addEventListener('cms_theme_changed', handleThemeChange);
    return () => window.removeEventListener('cms_theme_changed', handleThemeChange);
  }, []);

  const isDarkMode = typeof isDarkModeProp === 'boolean' ? isDarkModeProp : internalDarkMode;

  const palette = ADMIN_FEATURE_PALETTES[(paletteIndex ?? index) % ADMIN_FEATURE_PALETTES.length];
  const waveVariant = index % 4;
  const formattedIndex = String(index + 1).padStart(2, '0');
  const rawSlug = routeKey || title.toLowerCase().replace(/[^a-z0-9-]+/g, '');
  const handleLabel = rawSlug === 'builder' ? 'lpimage' : rawSlug;
  const actualAdminPath =
    rawSlug === 'builder' || rawSlug === 'lpimage'
      ? 'admin/lpimage/home'
      : `admin/${rawSlug}`;

  /* ══════════════════════════════════════════════════════════════════════════
     VARIANT 1: FLUTED RIBBED GRADIENT CARD (Xebrix Style for Tool & Manajemen)
     ══════════════════════════════════════════════════════════════════════════ */
  if (variant === 'fluted') {
    // Gradasi fluted ribbed flip vertikal: Terang di atas (fluteLight) mengalir ke Gelap di bawah (fluteDark)
    const fluteGradient = `linear-gradient(212deg, ${palette.fluteLight} 0%, ${palette.wave4} 28%, ${palette.wave3} 56%, ${palette.wave2} 80%, ${palette.fluteDark} 100%)`;

    return (
      <div
        data-card-3d="true"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isDarkMode ? 'var(--cms-card-bg, #181922)' : 'var(--cms-card-bg, #ffffff)',
          border: `1.5px solid ${isHovered ? palette.accent : isDarkMode ? 'var(--cms-border, rgba(148, 163, 184, 0.16))' : 'rgba(226, 232, 240, 0.9)'}`,
          borderRadius: isMobile ? 20 : 24,
          padding: isMobile ? 7 : 8,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          textAlign: 'left',
          boxSizing: 'border-box',
          boxShadow: isDarkMode
            ? isHovered
              ? '0 18px 36px -10px rgba(0, 0, 0, 0.32)'
              : 'none'
            : isHovered
              ? '0 16px 32px -10px rgba(15, 23, 42, 0.10), 0 4px 12px rgba(15, 23, 42, 0.04)'
              : '0 2px 8px rgba(0, 0, 0, 0.03)',
          transition: 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.45s ease, background-color 0.45s ease, box-shadow 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {/* ── 1. TOP 5-COLUMN FLUTED RIBBED BANNER ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: isMobile ? 116 : 138,
            borderRadius: isMobile ? 14 : 18,
            overflow: 'hidden',
            flexShrink: 0,
            background: palette.wave2,
          }}
        >
          {/* 5 Vertical Fluted Columns (Ribbed Blinds Effect) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              width: '100%',
              height: '100%',
            }}
          >
            {[0, 1, 2, 3, 4].map((colIdx) => (
              <div
                key={colIdx}
                style={{
                  width: '100%',
                  height: '100%',
                  background: fluteGradient,
                  transform: isHovered
                    ? `scaleY(${1.04 + (colIdx % 2) * 0.03}) translateY(${colIdx % 2 === 0 ? -2 : 2}px)`
                    : 'scaleY(1) translateY(0)',
                  transition: `transform 0.42s cubic-bezier(0.16, 1, 0.3, 1) ${colIdx * 20}ms`,
                }}
              />
            ))}
          </div>

          {/* Subtle Editorial Grain Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 0)',
              backgroundSize: '3px 3px',
              opacity: 0.35,
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          />

          {/* Bottom Legibility Scrim (Menjamin Teks & Ikon Selalu Berkontras Tinggi & Terbaca Jernih) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.12) 50%, transparent 85%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* Foreground Profile Cluster Inside Bottom of Banner */}
          <div
            style={{
              position: 'absolute',
              left: isMobile ? 9 : 12,
              right: isMobile ? 9 : 12,
              bottom: isMobile ? 9 : 12,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 9 : 12,
            }}
          >
            {/* Adaptive Squircle Icon Box (Dark Obsidian in Dark Mode, Crisp Ceramic White in Light Mode) */}
            <div
              style={{
                width: isMobile ? 48 : 58,
                height: isMobile ? 48 : 58,
                borderRadius: isMobile ? 13 : 16,
                background: isDarkMode ? '#1c1d24' : '#ffffff',
                border: isDarkMode ? 'none' : '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: isDarkMode
                  ? '0 8px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  : '0 8px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 0 #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <IconComp
                size={isMobile ? 22 : 27}
                strokeWidth={2.3}
                style={{
                  color: isDarkMode ? palette.accent : (palette.wave2 || palette.accent),
                  transform: isHovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0deg)',
                  transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>

            {/* Title + Pill Button + Right Micro-Icons (Bersih, Rapi & Elegan) */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: isMobile ? 4 : 6,
              }}
            >
              {/* Refined Modern Title Typography */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
                    fontSize: isMobile ? 16.5 : 19,
                    fontWeight: 700,
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.18)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.18,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                  }}
                >
                  {title}
                </span>
              </div>

              {/* Pill Button + Right Micro-Icons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobile ? '3px 10px' : '3.5px 12px',
                    borderRadius: 999,
                    background: isDarkMode
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: isDarkMode ? '#ffffff' : '#0f172a',
                    border: isDarkMode
                      ? '1px solid rgba(255, 255, 255, 0.18)'
                      : '1px solid rgba(255, 255, 255, 0.65)',
                    fontSize: isMobile ? 9.5 : 10.5,
                    fontWeight: 650,
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                    boxShadow: isDarkMode
                      ? '0 2px 6px rgba(0, 0, 0, 0.2)'
                      : '0 2px 6px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  {badge}
                </span>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    color: '#ffffff',
                    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35))',
                    opacity: 0.92,
                  }}
                >
                  <Sparkles size={11} strokeWidth={2.4} />
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      lineHeight: 1.1,
                    }}
                  >
                    {formattedIndex}
                  </span>
                  <ArrowUpRight size={12} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. BOTTOM EDITORIAL BODY (Description + Stats + Link) ── */}
        <div
          style={{
            padding: isMobile ? '10px 6px 4px' : '12px 10px 6px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: isMobile ? 6 : 8,
            flex: 1,
          }}
        >
          {/* Description */}
          <div
            style={{
              fontSize: isMobile ? 11.5 : 13,
              fontWeight: 500,
              color: isDarkMode ? 'var(--cms-text, #f8fafc)' : 'var(--cms-text, #1e293b)',
              lineHeight: 1.38,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </div>

          {/* Stats & Link Rows (hidden on mobile to keep cards clean & concise) */}
          {!isMobile && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 11,
                  color: 'var(--cms-text-muted, #64748b)',
                  fontWeight: 500,
                }}
              >
                <span>
                  <strong style={{ color: isDarkMode ? 'var(--cms-text, #f8fafc)' : 'var(--cms-text, #0f172a)', fontWeight: 700 }}>
                    {formattedIndex}
                  </strong>{' '}
                  Modul
                </span>
                <span>
                  <strong style={{ color: isDarkMode ? 'var(--cms-text, #f8fafc)' : 'var(--cms-text, #0f172a)', fontWeight: 700 }}>
                    {badge}
                  </strong>{' '}
                  Aktif
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  paddingTop: 1,
                }}
              >
                <Link2
                  size={12.5}
                  strokeWidth={2.5}
                  style={{
                    color: palette.accent,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: isHovered ? palette.accent : isDarkMode ? 'var(--cms-text, #f8fafc)' : 'var(--cms-text, #0f172a)',
                    transition: 'color 0.2s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  sumr.day/{actualAdminPath}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     VARIANT 2: WAVE RIBBON CARD (Database & Setting Portals)
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      data-card-3d="true"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isDarkMode ? 'var(--cms-card-bg, #181922)' : 'var(--cms-card-bg, #ffffff)',
        border: `1.5px solid ${isHovered ? palette.accent : isDarkMode ? 'var(--cms-border, rgba(148, 163, 184, 0.16))' : 'rgba(226, 232, 240, 0.9)'}`,
        borderRadius: isMobile ? 20 : 24,
        padding: isMobile ? 8 : 10,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        textAlign: 'left',
        boxSizing: 'border-box',
        boxShadow: isDarkMode
          ? isHovered
            ? '0 18px 36px -10px rgba(0, 0, 0, 0.32)'
            : 'none'
          : isHovered
            ? '0 16px 32px -10px rgba(15, 23, 42, 0.10), 0 4px 12px rgba(15, 23, 42, 0.04)'
            : '0 2px 8px rgba(0, 0, 0, 0.03)',
        transition: 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.45s ease, background-color 0.45s ease, box-shadow 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* ── 1. TOP ABSTRACT RIBBON / WAVE GRAPHIC BANNER WRAPPER ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: isMobile ? 92 : 108,
          flexShrink: 0,
        }}
      >
        {/* Inner Clipped Artwork Surface (Bottom-right curved inward so zero edge bleed behind stepped tab) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: isMobile ? '14px 14px 26px 14px' : '16px 16px 30px 16px',
            overflow: 'hidden',
            background: palette.gradient,
          }}
        >
          {/* Smooth Layered Silk Wave SVG Artwork (Zero harsh wire lines) */}
          <svg
            viewBox="0 0 320 140"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'block',
              transform: isHovered ? 'scale(1.07) translateX(3px)' : 'scale(1) translateX(0)',
              transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <defs>
              <linearGradient id={`w1-${index}-${palette.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={palette.wave1} />
                <stop offset="55%" stopColor={palette.wave2} />
                <stop offset="100%" stopColor={palette.wave3} />
              </linearGradient>
              <linearGradient id={`w2-${index}-${palette.name}`} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={palette.wave2} />
                <stop offset="55%" stopColor={palette.wave3} />
                <stop offset="100%" stopColor={palette.wave4} stopOpacity="0.88" />
              </linearGradient>
              <linearGradient id={`w3-${index}-${palette.name}`} x1="10%" y1="100%" x2="95%" y2="15%">
                <stop offset="0%" stopColor={palette.wave1} stopOpacity="0.95" />
                <stop offset="50%" stopColor={palette.wave3} />
                <stop offset="100%" stopColor={palette.wave4} stopOpacity="0.92" />
              </linearGradient>
            </defs>

            {waveVariant === 0 && (
              <>
                <path
                  d="M-20,35 C55,-15 165,12 340,-10 L340,145 L-20,145 Z"
                  fill={`url(#w1-${index}-${palette.name})`}
                  opacity="0.92"
                />
                <path
                  d="M-15,112 C75,38 188,6 340,20 L340,145 L-15,145 Z"
                  fill={palette.shadow}
                  opacity="0.42"
                />
                <path
                  d="M-15,118 C82,44 195,12 340,26 L340,145 L-15,145 Z"
                  fill={`url(#w2-${index}-${palette.name})`}
                />
                <path
                  d="M35,145 C130,74 228,46 340,60 L340,145 Z"
                  fill={`url(#w3-${index}-${palette.name})`}
                />
              </>
            )}

            {waveVariant === 1 && (
              <>
                <path
                  d="M-20,18 C95,62 215,-12 340,28 L340,145 L-20,145 Z"
                  fill={`url(#w1-${index}-${palette.name})`}
                  opacity="0.9"
                />
                <path
                  d="M-20,96 C72,20 202,48 340,10 L340,145 L-20,145 Z"
                  fill={palette.shadow}
                  opacity="0.38"
                />
                <path
                  d="M-20,102 C78,26 208,54 340,16 L340,145 L-20,145 Z"
                  fill={`url(#w2-${index}-${palette.name})`}
                />
                <path
                  d="M10,145 C115,64 235,62 340,44 L340,145 Z"
                  fill={`url(#w3-${index}-${palette.name})`}
                />
              </>
            )}

            {waveVariant === 2 && (
              <>
                <path
                  d="M-20,48 C80,-12 195,32 340,-6 L340,145 L-20,145 Z"
                  fill={`url(#w1-${index}-${palette.name})`}
                  opacity="0.9"
                />
                <path
                  d="M-15,124 C55,32 175,16 340,34 L340,145 L-15,145 Z"
                  fill={palette.shadow}
                  opacity="0.4"
                />
                <path
                  d="M-15,130 C62,38 182,22 340,40 L340,145 L-15,145 Z"
                  fill={`url(#w2-${index}-${palette.name})`}
                />
                <path
                  d="M60,145 C148,78 242,52 340,70 L340,145 Z"
                  fill={`url(#w3-${index}-${palette.name})`}
                />
              </>
            )}

            {waveVariant === 3 && (
              <>
                <path
                  d="M-20,12 C65,48 165,-8 340,18 L340,145 L-20,145 Z"
                  fill={`url(#w1-${index}-${palette.name})`}
                  opacity="0.92"
                />
                <path
                  d="M-20,118 C65,58 165,14 340,28 L340,145 L-20,145 Z"
                  fill={palette.shadow}
                  opacity="0.4"
                />
                <path
                  d="M-20,124 C70,64 172,20 340,34 L340,145 L-20,145 Z"
                  fill={`url(#w2-${index}-${palette.name})`}
                />
                <path
                  d="M25,145 C120,82 220,42 340,58 L340,145 Z"
                  fill={`url(#w3-${index}-${palette.name})`}
                />
              </>
            )}
          </svg>

          {/* Top-Left Translucent Pill Badge */}
          <div
            style={{
              position: 'absolute',
              top: isMobile ? 8 : 10,
              left: isMobile ? 8 : 10,
              zIndex: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: isMobile ? '3px 8px' : '4px 10px',
              borderRadius: 8,
              background: isDarkMode ? 'rgba(15, 23, 42, 0.38)' : 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.24)' : '1px solid rgba(255, 255, 255, 0.75)',
              color: isDarkMode ? '#ffffff' : '#0f172a',
              fontSize: isMobile ? 10 : 10.5,
              fontWeight: 700,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              maxWidth: 'calc(100% - 20px)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <IconComp size={isMobile ? 11 : 12} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <span>{badge}</span>
          </div>
        </div>

        {/* Bottom-Right Stepped Cutout Tab (Rendered OUTSIDE overflow:hidden so zero border bleed) */}
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            zIndex: 4,
            height: isMobile ? 31 : 35,
            minWidth: isMobile ? 88 : 102,
            padding: isMobile ? '5px 8px 0 26px' : '6px 10px 0 30px',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'flex-end',
            gap: 5,
            boxSizing: 'border-box',
          }}
        >
          <svg
            viewBox="0 0 120 36"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: -1,
              display: 'block',
              overflow: 'visible',
            }}
          >
            <path
              d="M-2,37 C12,37 18,0 32,0 L122,0 L122,37 Z"
              style={{ fill: 'var(--cms-card-bg, #ffffff)', transition: 'fill 0.24s ease' }}
            />
          </svg>

          {customTag ? (
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? 12 : 13.5,
                fontWeight: 800,
                color: isHovered ? palette.accent : isDarkMode ? '#cbd5e1' : '#334155',
                letterSpacing: '-0.01em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                transition: 'color 0.24s ease',
              }}
            >
              {customTag}
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: isMobile ? 9.5 : 10.5,
                  fontWeight: 600,
                  color: 'var(--cms-text-muted, #64748b)',
                  letterSpacing: '0.01em',
                }}
              >
                {tagLabel}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: isMobile ? 16 : 19,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: isHovered ? palette.accent : 'var(--cms-text-muted, #64748b)',
                  transition: 'color 0.24s ease',
                }}
              >
                {formattedIndex}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── 2. EDITORIAL BODY: DISTINCTIVE ICON BADGE + BOLD TITLE + SUBTLE CAPTION ── */}
      <div
        style={{
          padding: isMobile ? '10px 6px 4px' : '12px 8px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 10 : 12,
          flex: 1,
        }}
      >
        {/* Crisp Differentiating Feature Icon Badge */}
        <div
          style={{
            width: isMobile ? 36 : 42,
            height: isMobile ? 36 : 42,
            borderRadius: isMobile ? 11 : 13,
            background: isHovered
              ? palette.accent
              : isDarkMode
                ? `${palette.accent}18`
                : `${palette.accent}14`,
            border: `1.5px solid ${isHovered ? palette.accent : isDarkMode ? `${palette.accent}38` : `${palette.accent}2c`}`,
            color: isHovered ? '#ffffff' : isDarkMode ? palette.accent : (palette.wave2 || palette.accent),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transform: isHovered ? 'scale(1.06) rotate(-4deg)' : 'scale(1) rotate(0deg)',
            transition: 'all 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <IconComp size={isMobile ? 18 : 20} strokeWidth={2.3} />
        </div>

        {/* Title & Subtitle Stack */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 3,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
              fontSize: isMobile ? 15.5 : 18,
              fontWeight: 700,
              color: isHovered ? palette.accent : 'var(--cms-text, #0f172a)',
              letterSpacing: '-0.02em',
              lineHeight: 1.18,
              transition: 'color 0.22s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: isMobile ? 10.5 : 11.5,
              fontWeight: 500,
              color: 'var(--cms-text-muted, #64748b)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortalFeatureCard;
