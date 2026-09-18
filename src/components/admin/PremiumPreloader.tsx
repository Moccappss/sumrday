import React, { useState, useEffect } from 'react';

/**
 * PremiumPreloader — Minimal theme-aware overlay.
 * - Light mode: 10% white overlay
 * - Dark mode:  10% dark overlay
 * - Small spinner only, no text, no glow
 * - Smooth fade in/out
 */
const PremiumPreloader = ({ visible = true, image = null }) => {
  const [opacity, setOpacity] = useState(0);
  const [display, setDisplay] = useState(visible);

  useEffect(() => {
    if (visible) {
      setDisplay(true);
      // Small delay so browser paints before we fade in
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setOpacity(1));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setOpacity(0);
      const t = setTimeout(() => setDisplay(false), 500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!display) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--cms-preloader-bg, rgba(255,255,255,0.10))',
        backdropFilter: 'blur(1px)',
        WebkitBackdropFilter: 'blur(1px)',
        zIndex: 9999999,
        opacity,
        transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: opacity === 0 ? 'none' : 'all',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 36px spinner — no text, no glow */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '2.5px solid var(--cms-preloader-track, rgba(0,0,0,0.10))',
          borderTopColor: 'var(--cms-accent, #7c3aed)',
          borderRightColor: 'transparent',
          animation: 'pp-spin 0.85s linear infinite',
          flexShrink: 0,
        }}
      />

      <style>{`
        @keyframes pp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PremiumPreloader;
