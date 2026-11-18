import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { storage } from '../../utils/storage';
import {
  type CustomCursorConfig,
  DEFAULT_CUSTOM_CURSOR_CONFIG,
  resolveCustomCursorConfig,
} from '../../utils/customCursorConfig';

type CursorMode = 'default' | 'pointer' | 'text' | 'disabled' | 'zoom' | 'hidden';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], select, label[for], summary, .lp-nav-link, .lp-btn, [data-cursor="pointer"]';
const TEXT_SELECTOR =
  'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]';
const DISABLED_SELECTOR = '[disabled], [aria-disabled="true"]';
const ZOOM_SELECTOR = '[data-cursor="zoom"], .cursor-zoom-in';
const NATIVE_PASSTHROUGH_SELECTOR = 'iframe, canvas';

interface TrailPoint {
  x: number;
  y: number;
}

const parseHexRgb = (hexOrCss: string): [number, number, number] => {
  const hex = (hexOrCss || '').trim();
  if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
    const full =
      hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
    const r = parseInt(full.slice(1, 3), 16);
    const g = parseInt(full.slice(3, 5), 16);
    const b = parseInt(full.slice(5, 7), 16);
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return [r, g, b];
    }
  }
  return [59, 130, 246];
};

const lerpRgba = (
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
  alpha: number
): string => {
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * k);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * k);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * k);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
};

const deduplicatePoints = (pts: TrailPoint[], minDist: number): TrailPoint[] => {
  if (pts.length <= 2) return pts;
  const out: TrailPoint[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = out[out.length - 1];
    if (Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y) >= minDist) {
      out.push(pts[i]);
    }
  }
  const last = pts[pts.length - 1];
  const prev = out[out.length - 1];
  if (Math.hypot(last.x - prev.x, last.y - prev.y) >= 0.25) {
    out.push(last);
  }
  return out;
};

export const CustomCursor: React.FC = () => {
  const { isDark } = useWebsiteTheme();
  const [accentColor, setAccentColor] = useState<string>(() => {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || '#3B82F6';
  });
  const [cursorConfig, setCursorConfig] = useState<CustomCursorConfig>(DEFAULT_CUSTOM_CURSOR_CONFIG);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [burstKey, setBurstKey] = useState<number>(0);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(null);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const modeRef = useRef<CursorMode>('default');
  const visibleRef = useRef<boolean>(false);
  const accentRef = useRef<string>(accentColor);
  const configRef = useRef<CustomCursorConfig>(cursorConfig);

  useEffect(() => {
    accentRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => {
    configRef.current = cursorConfig;
  }, [cursorConfig]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await storage.getItem<any>('porto_settings', {});
        if (s?.customCursor) {
          setCursorConfig(resolveCustomCursorConfig(s.customCursor));
        }
      } catch {}
    };
    loadSettings();

    const onCursorUpdated = (e: any) => {
      if (e?.detail?.customCursor) {
        setCursorConfig(resolveCustomCursorConfig(e.detail.customCursor));
      } else {
        loadSettings();
      }
    };

    window.addEventListener('porto_custom_cursor_updated', onCursorUpdated);
    window.addEventListener('porto_settings_updated', loadSettings);
    return () => {
      window.removeEventListener('porto_custom_cursor_updated', onCursorUpdated);
      window.removeEventListener('porto_settings_updated', loadSettings);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(pointer: fine) and (hover: hover)');
    const update = () => setIsSupported(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const onAccent = (e: any) => {
      if (e?.detail?.color) setAccentColor(e.detail.color);
    };
    window.addEventListener('porto_accent_color_changed', onAccent);
    return () => window.removeEventListener('porto_accent_color_changed', onAccent);
  }, []);

  const isCursorActive = isSupported && cursorConfig.enabled !== false;

  useEffect(() => {
    if (!isCursorActive || typeof document === 'undefined') {
      setPortalHost(null);
      return;
    }

    let host = document.getElementById('sumr-custom-cursor-root') as HTMLDivElement | null;
    if (!host) {
      host = document.createElement('div');
      host.id = 'sumr-custom-cursor-root';
    }
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;isolation:isolate;';

    const keepOnTop = () => {
      if (host && document.body && document.body.lastElementChild !== host) {
        document.body.appendChild(host);
      }
    };
    keepOnTop();
    setPortalHost(host);

    const observer = new MutationObserver(() => {
      keepOnTop();
    });
    if (document.body) {
      observer.observe(document.body, { childList: true });
    }

    return () => {
      observer.disconnect();
      if (host && host.parentNode) {
        host.parentNode.removeChild(host);
      }
      setPortalHost(null);
    };
  }, [isCursorActive]);

  useEffect(() => {
    if (!isCursorActive || typeof document === 'undefined') return;

    const styleEl = document.createElement('style');
    styleEl.id = 'sumr-custom-cursor-style';
    styleEl.textContent = `
      html.sumr-custom-cursor-active,
      html.sumr-custom-cursor-active * {
        cursor: none !important;
      }
      html.sumr-custom-cursor-active iframe,
      html.sumr-custom-cursor-active canvas.sumr-native-canvas {
        cursor: auto !important;
      }
      @keyframes sumrCursorBurst {
        0% {
          opacity: 0.9;
          transform: translate(-50%, -50%) scale(0.45);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(1.45);
        }
      }
    `;
    document.head.appendChild(styleEl);
    document.documentElement.classList.add('sumr-custom-cursor-active');

    const injectedShadowStyles = new Map<ShadowRoot, HTMLStyleElement>();
    const ensureShadowCursorHidden = (e: PointerEvent) => {
      if (typeof e.composedPath !== 'function') return;
      const path = e.composedPath();
      for (let i = 0; i < path.length; i++) {
        const node = path[i];
        if (typeof ShadowRoot !== 'undefined' && node instanceof ShadowRoot && !injectedShadowStyles.has(node)) {
          const shadowStyle = document.createElement('style');
          shadowStyle.setAttribute('data-sumr-shadow-cursor', 'true');
          shadowStyle.textContent = ':host, *, *::before, *::after { cursor: none !important; }';
          node.appendChild(shadowStyle);
          injectedShadowStyles.set(node, shadowStyle);
        }
      }
    };

    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;

    const resizeCanvas = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const trail: TrailPoint[] = [];
    let mouseX = -200;
    let mouseY = -200;
    let headX = -200;
    let headY = -200;
    let anchorX = 13;
    let anchorY = 18;
    let lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let rafId = 0;

    const getAnchorOffset = () => {
      const sz = configRef.current.cursorSize || 1;
      if (configRef.current.theme === 'minimal-dot') {
        return { x: 0, y: 0 };
      }
      switch (modeRef.current) {
        case 'pointer':
          return { x: 6 * sz, y: 18 * sz };
        case 'text':
        case 'disabled':
        case 'zoom':
          return { x: 0, y: 8 * sz };
        case 'default':
        default:
          return { x: 13 * sz, y: 18 * sz };
      }
    };

    const subdivideSmooth = (pts: TrailPoint[]): TrailPoint[] => {
      if (pts.length < 2) return pts;
      const out: TrailPoint[] = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        out.push({ x: p0.x * 0.75 + p1.x * 0.25, y: p0.y * 0.75 + p1.y * 0.25 });
        out.push({ x: p0.x * 0.25 + p1.x * 0.75, y: p0.y * 0.25 + p1.y * 0.75 });
      }
      out.push(pts[pts.length - 1]);
      return out;
    };

    const setVisibleSafe = (next: boolean) => {
      if (visibleRef.current !== next) {
        visibleRef.current = next;
        setIsVisible(next);
      }
    };

    const updateMode = (next: CursorMode) => {
      if (modeRef.current !== next) {
        modeRef.current = next;
        setMode(next);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(Math.max((now - lastTime) / 1000, 0.001), 0.05);
      lastTime = now;
      const frameFactor = dt * 60;

      if (canvas && ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        const cfg = configRef.current;

        if (cfg.trailEnabled && visibleRef.current && modeRef.current !== 'hidden') {
          const targetAnchor = getAnchorOffset();
          const anchorFactor = 1 - Math.pow(1 - 0.35, frameFactor);
          anchorX += (targetAnchor.x - anchorX) * anchorFactor;
          anchorY += (targetAnchor.y - anchorY) * anchorFactor;

          const targetX = mouseX + anchorX;
          const targetY = mouseY + anchorY;

          const desiredLen = Math.max(8, Math.min(60, Math.round(cfg.trailLength || 28)));
          const stability = Math.max(0.15, Math.min(0.8, (cfg.trailStability || 36) / 100));
          const headEase = Math.min(0.88, stability + 0.22);

          const headFactor = 1 - Math.pow(1 - headEase, frameFactor);
          const followFactor = 1 - Math.pow(1 - stability, frameFactor);

          headX += (targetX - headX) * headFactor;
          headY += (targetY - headY) * headFactor;

          while (trail.length < desiredLen) {
            const last = trail[trail.length - 1] || { x: headX, y: headY };
            trail.push({ x: last.x, y: last.y });
          }
          if (trail.length > desiredLen) {
            trail.length = desiredLen;
          }

          trail[0].x = headX;
          trail[0].y = headY;
          for (let i = 1; i < trail.length; i++) {
            const prev = trail[i - 1];
            const cur = trail[i];
            cur.x += (prev.x - cur.x) * followFactor;
            cur.y += (prev.y - cur.y) * followFactor;
          }

          let arcLen = 0;
          for (let i = 1; i < trail.length; i++) {
            arcLen += Math.hypot(trail[i].x - trail[i - 1].x, trail[i].y - trail[i - 1].y);
          }

          if (arcLen > 2) {
            const cleanPts = deduplicatePoints(trail, 0.75);
            if (cleanPts.length >= 2) {
              const smoothPts = deduplicatePoints(subdivideSmooth(subdivideSmooth(cleanPts)), 0.45);
              const n = smoothPts.length;
              if (n >= 2) {
                const maxWidth = Math.max(2, cfg.trailWidth || 8);

                const primaryColor =
                  cfg.trailColorMode === 'custom' || cfg.trailColorMode === 'gradient'
                    ? cfg.trailCustomColor || accentRef.current || '#3B82F6'
                    : accentRef.current || '#3B82F6';
                const secondaryColor =
                  cfg.trailColorMode === 'gradient'
                    ? cfg.trailSecondaryColor || '#8B5CF6'
                    : primaryColor;

                const primaryRgb = parseHexRgb(primaryColor);
                const secondaryRgb = parseHexRgb(secondaryColor);

                ctx.save();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalCompositeOperation = 'destination-over';

                const segCount = n - 1;
                for (let i = 0; i < segCount; i++) {
                  const u = segCount > 1 ? i / (segCount - 1) : 0;
                  const t = 1 - u;
                  const segWidth = Math.max(0.6, maxWidth * Math.pow(t, 1.35));
                  const segAlpha = Math.pow(t, 0.78);

                  ctx.beginPath();
                  ctx.moveTo(smoothPts[i].x, smoothPts[i].y);
                  ctx.lineTo(smoothPts[i + 1].x, smoothPts[i + 1].y);
                  ctx.lineWidth = segWidth;
                  ctx.strokeStyle = lerpRgba(primaryRgb, secondaryRgb, Math.min(1, u * 1.15), segAlpha);
                  ctx.stroke();
                }

                if (cfg.trailGlow) {
                  ctx.shadowColor = primaryColor;
                  ctx.shadowBlur = Math.max(0, cfg.trailGlowBlur || 12);
                  ctx.lineWidth = Math.max(1.5, maxWidth * 0.68);
                  ctx.strokeStyle = lerpRgba(primaryRgb, secondaryRgb, 0.35, 0.28);
                  ctx.beginPath();
                  ctx.moveTo(smoothPts[0].x, smoothPts[0].y);
                  const glowLimit = Math.max(2, Math.floor(n * 0.8));
                  for (let i = 1; i < glowLimit; i++) {
                    ctx.lineTo(smoothPts[i].x, smoothPts[i].y);
                  }
                  ctx.stroke();
                }

                ctx.restore();
              }
            }
          }
        } else if (trail.length > 0) {
          trail.length = 0;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        setVisibleSafe(false);
        return;
      }
      if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;

      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!visibleRef.current) {
        const anchor = getAnchorOffset();
        anchorX = anchor.x;
        anchorY = anchor.y;
        headX = mouseX + anchorX;
        headY = mouseY + anchorY;
        trail.length = 0;
        setVisibleSafe(true);
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      const target = e.target as HTMLElement | null;
      if (!target) {
        updateMode('default');
        return;
      }

      ensureShadowCursorHidden(e);

      if (target.closest(NATIVE_PASSTHROUGH_SELECTOR) && !target.closest('[data-sumr-cursor-canvas]')) {
        updateMode('hidden');
      } else if (target.closest(DISABLED_SELECTOR)) {
        updateMode('disabled');
      } else if (target.closest(TEXT_SELECTOR)) {
        updateMode('text');
      } else if (target.closest(ZOOM_SELECTOR)) {
        updateMode('zoom');
      } else if (target.closest(INTERACTIVE_SELECTOR)) {
        updateMode('pointer');
      } else {
        updateMode('default');
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      setIsPressed(true);
      if (configRef.current.clickBurst !== false) {
        setBurstPos({ x: e.clientX, y: e.clientY });
        setBurstKey((k) => k + 1);
      }
    };

    const onPointerUp = () => {
      setIsPressed(false);
    };

    const onMouseLeave = () => {
      setVisibleSafe(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onMouseLeave, { passive: true });
    window.addEventListener('blur', onMouseLeave);
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onMouseLeave);
      window.removeEventListener('blur', onMouseLeave);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.classList.remove('sumr-custom-cursor-active');
      styleEl.remove();
      injectedShadowStyles.forEach((s) => s.remove());
      injectedShadowStyles.clear();
    };
  }, [isCursorActive]);

  if (!isCursorActive || !portalHost || typeof document === 'undefined') return null;

  const isSolidTheme = cursorConfig.theme === 'solid-ink';
  const strokeColor = isSolidTheme
    ? (isDark ? '#0F172A' : '#FFFFFF')
    : (isDark ? '#F8FAFC' : '#111827');
  const fillColor = isSolidTheme
    ? (isDark ? '#F8FAFC' : '#0F172A')
    : (isDark ? '#0F172A' : '#FFFFFF');

  const dropShadow = isDark
    ? 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.58))'
    : 'drop-shadow(0 3px 7px rgba(15, 23, 42, 0.16))';

  const hidden = !isVisible || mode === 'hidden';
  const sizeScale = cursorConfig.cursorSize || 1;
  const burstColor =
    cursorConfig.trailColorMode === 'custom' || cursorConfig.trailColorMode === 'gradient'
      ? cursorConfig.trailCustomColor || accentColor
      : accentColor;

  const getHotspotOffset = () => {
    if (cursorConfig.theme === 'minimal-dot') {
      return 'translate(-7px, -7px)';
    }
    switch (mode) {
      case 'pointer':
        return 'translate(-14px, -6px)';
      case 'text':
      case 'disabled':
      case 'zoom':
        return 'translate(-16px, -16px)';
      case 'default':
      default:
        return 'translate(-4px, -4px)';
    }
  };

  const interactiveScale = isPressed
    ? `scale(${(0.86 * sizeScale).toFixed(2)})`
    : mode === 'pointer'
      ? `scale(${(1.06 * sizeScale).toFixed(2)})`
      : `scale(${sizeScale.toFixed(2)})`;

  return createPortal(
    <>
      {/* Tapered Ribbon Trail Canvas */}
      <canvas
        ref={canvasRef}
        data-sumr-cursor-canvas="true"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2147483645,
        }}
      />

      {/* Click Burst Effect */}
      {cursorConfig.clickBurst !== false && burstPos && burstKey > 0 && (
        <div
          key={burstKey}
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: burstPos.x,
            top: burstPos.y,
            width: 38,
            height: 38,
            pointerEvents: 'none',
            zIndex: 2147483646,
            animation: 'sumrCursorBurst 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <svg width="38" height="38" viewBox="0 0 34 34" fill="none">
            <circle cx="17" cy="17" r="9.5" stroke={burstColor} strokeWidth="1.6" strokeOpacity="0.65" />
            <line x1="17" y1="2.5" x2="17" y2="6" stroke={burstColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="7" y1="7" x2="9.6" y2="9.6" stroke={burstColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="2.5" y1="17" x2="6" y2="17" stroke={burstColor} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Main Vector Cursor (Top-Most) */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 2147483647,
          opacity: hidden ? 0 : 1,
          transition: 'opacity 0.15s ease',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            transform: `${getHotspotOffset()} ${interactiveScale}`,
            transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: dropShadow,
            transformOrigin: '4px 4px',
          }}
        >
          {cursorConfig.theme === 'minimal-dot' ? (
            <div
              style={{
                width: mode === 'pointer' ? 18 : 14,
                height: mode === 'pointer' ? 18 : 14,
                borderRadius: '50%',
                background: burstColor,
                border: `2px solid ${isDark ? '#0F172A' : '#FFFFFF'}`,
                boxShadow: cursorConfig.trailGlow ? `0 0 ${cursorConfig.trailGlowBlur || 12}px ${burstColor}` : 'none',
                transition: 'width 0.18s ease, height 0.18s ease',
              }}
            />
          ) : (
            <>
              {mode === 'default' && (
                <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                  <path
                    d="M5.2 4.2L22.5 11.4C24.1 12.1 24 14.4 22.3 14.9L15.4 17.1L12.7 23.8C12 25.4 9.7 25.3 9.2 23.6L3.9 6.3C3.5 4.9 4.8 3.6 5.2 4.2Z"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSolidTheme ? '2.2' : '2.0'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {mode === 'pointer' && (
                <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M11.2 17.4V7.9C11.2 6.8 12.05 6 13.1 6C14.15 6 15 6.8 15 7.9V13.4V12.2C15 11.2 15.8 10.5 16.8 10.5C17.8 10.5 18.6 11.2 18.6 12.2V14V13C18.6 12 19.4 11.3 20.4 11.3C21.4 11.3 22.2 12 22.2 13V14.8V14.2C22.2 13.3 22.95 12.6 23.9 12.6C24.85 12.6 25.6 13.3 25.6 14.2V19.6C25.6 23.6 22.5 26.8 18.5 26.8H16.2C13.7 26.8 11.6 25.5 10.3 23.4L7.7 19.3C7.1 18.4 7.4 17.2 8.3 16.6C9.2 16 10.4 16.3 11 17.1L11.2 17.4Z"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSolidTheme ? '2.2' : '2.0'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 13.2V15.4M18.6 13.8V15.8M22.2 14.6V16.3"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSolidTheme ? '1.6' : '1.5'}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {mode === 'text' && (
                <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
                  <path
                    d="M9 5H17M9 21H17M13 5V21"
                    stroke={isDark ? '#F8FAFC' : '#111827'}
                    strokeWidth="2.1"
                    strokeLinecap="round"
                  />
                  <circle cx="13" cy="13" r="1.6" fill={burstColor} />
                </svg>
              )}

              {mode === 'zoom' && (
                <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
                  <circle cx="11.5" cy="11.5" r="7" fill={fillColor} stroke={strokeColor} strokeWidth="2.0" />
                  <path d="M16.8 16.8L21.5 21.5" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M11.5 8.8V14.2M8.8 11.5H14.2" stroke={burstColor} strokeWidth="2.1" strokeLinecap="round" />
                </svg>
              )}

              {mode === 'disabled' && (
                <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
                  <circle cx="13" cy="13" r="8.5" fill={fillColor} stroke={strokeColor} strokeWidth="2.0" />
                  <path d="M7.5 7.5L18.5 18.5" stroke={burstColor} strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              )}
            </>
          )}
        </div>
      </div>
    </>,
    portalHost
  );
};

export default CustomCursor;
