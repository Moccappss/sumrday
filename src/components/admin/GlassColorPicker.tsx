
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Pipette, X, Palette, Sliders, Check, Sparkles } from 'lucide-react';
import { generateAnalogousPalette } from '../../utils/theme';

/* ── Helpers ── */
const hexToHsv = (hex) => {
  let r = 0, g = 0, b = 0;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  } else if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    const parts = hex.match(/\d+/g);
    if (parts) {
      r = parts[0] / 255; g = parts[1] / 255; b = parts[2] / 255;
    }
  }

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

const hsvToHex = (h, s, v) => {
  h /= 360; s /= 100; v /= 100;
  let r, g, b;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const PRESET_COLORS = [
  '#7C3AED', '#6366F1', '#9333EA', '#A855F7',
  '#0EA5E9', '#2563EB', '#06B6D4', '#0D9488',
  '#10B981', '#059669', '#84CC16', '#15803D',
  '#EC4899', '#E11D48', '#F43F5E', '#F472B6',
  '#F59E0B', '#EA580C', '#D97706', '#EAB308',
  '#64748B', '#334155', '#71717A', '#000000'
];

const resolveHex = (val) => {
  if (!val || typeof val !== 'string') return '#7C3AED';
  const trimmed = val.trim();
  if (trimmed.startsWith('var')) {
    const match = trimmed.match(/#[0-9a-fA-F]{3,8}/);
    if (match) return match[0].toUpperCase();
    return '#7C3AED';
  }
  if (!trimmed.startsWith('#') && /^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    return ('#' + trimmed).toUpperCase();
  }
  return trimmed.toUpperCase();
};

const GlassColorPicker = ({ label, value, onChange, customTrigger, containerStyle, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [hsv, setHsv] = useState({ h: 260, s: 80, v: 93 });
  const [draftColor, setDraftColor] = useState(() => resolveHex(value));
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    const hexToParse = resolveHex(value);
    setHsv(hexToHsv(hexToParse));
    setDraftColor(hexToParse);
  }, [value]);

  useEffect(() => {
    const hexToParse = resolveHex(value);
    setHsv(hexToHsv(hexToParse));
    setDraftColor(hexToParse);
  }, [value]);

  const toggleOpen = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let topPos = rect.bottom + window.scrollY + 10;
      if (topPos + 350 > window.innerHeight + window.scrollY) {
        topPos = Math.max(10, rect.top + window.scrollY - 360);
      }
      const pickerWidth = Math.min(440, window.innerWidth * 0.9);
      setCoords({
        top: topPos,
        left: Math.max(10, Math.min(window.innerWidth - pickerWidth - 10, rect.left + window.scrollX - 50))
      });
      setDraftColor(value || 'var(--cms-accent, #7c3aed)');
      setHsv(hexToHsv(value || 'var(--cms-accent, #7c3aed)'));
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClose = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && !triggerRef.current.contains(e.target)) {
        handleCancel();
      }
      if (e.type === 'scroll') handleCancel();
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClose);
      window.addEventListener('scroll', handleClose, { capture: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleClose, { capture: true });
    };
  }, [isOpen, handleCancel]);

  const updateHsv = (k, v) => {
    const next = { ...hsv, [k]: v };
    setHsv(next);
    setDraftColor(hsvToHex(next.h, next.s, next.v));
  };

  const handleEyedropper = async () => {
    if (!window.EyeDropper) return;
    const dropper = new window.EyeDropper();
    try {
      const result = await dropper.open();
      const hex = result.sRGBHex.toUpperCase();
      setDraftColor(hex);
      setHsv(hexToHsv(hex));
    } catch (e) {
      console.log('Eyedropper cancelled or failed', e);
    }
  };

  const applyColor = () => {
    onChange(draftColor);
    setIsOpen(false);
  };

  const renderPickerContent = () => (
    <>
      <style>{`
        input[type="range"].cms-color-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100% !important;
          height: 100% !important;
          background: transparent !important;
          outline: none;
          margin: 0 !important;
          position: absolute;
          inset: 0;
        }
        input[type="range"].cms-color-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 100%;
          cursor: pointer;
          background: transparent !important;
          border: none;
        }
        input[type="range"].cms-color-slider::-moz-range-track {
          width: 100%;
          height: 100%;
          cursor: pointer;
          background: transparent !important;
          border: none;
        }
        input[type="range"].cms-color-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid rgba(0,0,0,0.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
          margin-top: -2px; /* Centers thumb vertically */
        }
        input[type="range"].cms-color-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid rgba(0,0,0,0.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Palette size={16} color="var(--cms-accent, #7c3aed)" />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-text)', letterSpacing: '0.05em' }}>COLOR PICKER</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {window.EyeDropper && (
            <button 
              onClick={handleEyedropper}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Pipette size={14} />
            </button>
          )}
          <button 
            onClick={handleCancel}
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {/* HUE */}
        <div style={{ position: 'relative', width: '100%', height: 16, borderRadius: 8, background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
          <input 
            type="range" min="0" max="360" value={hsv.h} 
            onChange={e => updateHsv('h', parseInt(e.target.value))}
            className="cms-color-slider"
          />
        </div>

        {/* SATURATION */}
        <div style={{ position: 'relative', width: '100%', height: 16, borderRadius: 8, background: `linear-gradient(to right, #fff, ${hsvToHex(hsv.h, 100, 100)})`, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
          <input 
            type="range" min="0" max="100" value={hsv.s} 
            onChange={e => updateHsv('s', parseInt(e.target.value))}
            className="cms-color-slider"
          />
        </div>

        {/* BRIGHTNESS */}
        <div style={{ position: 'relative', width: '100%', height: 16, borderRadius: 8, background: 'linear-gradient(to right, #000, #fff)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
          <input 
            type="range" min="0" max="100" value={hsv.v} 
            onChange={e => updateHsv('v', parseInt(e.target.value))}
            className="cms-color-slider"
          />
        </div>
      </div>

      {/* SWATCHES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, marginBottom: 20 }}>
        {PRESET_COLORS.map((c, i) => {
          const isSelected = draftColor.toLowerCase() === c.toLowerCase() || 
                             (c.startsWith('var') && draftColor.toLowerCase() === '#7C3AED');
          return (
            <button
              key={i}
              onClick={() => {
                setDraftColor(c);
                if (!c.startsWith('var')) setHsv(hexToHsv(c));
              }}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: '50%',
                background: c, border: isSelected ? '2px solid var(--cms-accent, #7c3aed)' : '1px solid var(--glass-border)',
                cursor: 'pointer', boxShadow: isSelected ? '0 2px 8px rgba(var(--cms-accent-rgb, 124,58,237), 0.4)' : 'inset 0 1px 2px rgba(0,0,0,0.1)',
                padding: 0
              }}
            />
          );
        })}
      </div>

      {/* LIVE ANALOGOUS HARMONY BAR */}
      {(() => {
        try {
          const hex = resolveHex(draftColor);
          const pal = generateAnalogousPalette(hex);
          return (
            <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={11} color="var(--cms-accent, #7c3aed)" /> Harmoni Analogus Dinamis
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Multi-Hue</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, height: 24 }}>
                <div style={{ borderRadius: 6, background: pal.analogousCool }} title={`Cool Analogous: ${pal.analogousCool}`} />
                <div style={{ borderRadius: 6, background: pal.primary, border: '2px solid #fff' }} title={`Primary Accent: ${pal.primary}`} />
                <div style={{ borderRadius: 6, background: pal.analogousWarm }} title={`Warm Analogous: ${pal.analogousWarm}`} />
                <div style={{ borderRadius: 6, background: pal.analogousPop }} title={`Accent Pop: ${pal.analogousPop}`} />
                <div style={{ borderRadius: 6, background: `linear-gradient(135deg, ${pal.analogousCool} 0%, ${pal.primary} 50%, ${pal.analogousWarm} 100%)` }} title="Analogous Gradient" />
              </div>
            </div>
          );
        } catch {
          return null;
        }
      })()}

      {/* OUTPUT & ACTION */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Preview Warna */}
        <div style={{ 
          width: 40, height: 40, borderRadius: 10, background: draftColor, 
          border: '1px solid var(--glass-border)', flexShrink: 0,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }} />
        
        <div style={{ 
          flex: 1, height: 40, background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)', 
          borderRadius: 10, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-text-muted)' }}>#</span>
          <input 
            type="text" 
            value={(draftColor || 'var(--cms-accent, #7C3AED)').replace('#', '')}
            onChange={(e) => {
              const hex = '#' + e.target.value.toUpperCase();
              setDraftColor(hex);
              if (hex.length === 4 || hex.length === 7) setHsv(hexToHsv(hex));
            }}
            placeholder="HEX"
            className="clean-input"
            style={{ 
              width: '100%', border: 'none', background: 'transparent', fontSize: 13, 
              fontWeight: 800, color: 'var(--cms-text)', outline: 'none', textTransform: 'uppercase'
            }}
          />
        </div>

        <button 
          onClick={applyColor}
          style={{ 
            height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--cms-accent, #7c3aed)', 
            color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb, 124,58,237), 0.3)' 
          }}
        >
          <Check size={14} />
          Terapkan
        </button>
      </div>
    </>
  );

  if (customTrigger) {
    return (
      <div style={{ position: 'relative', display: 'inline-flex' }} ref={triggerRef}>
        <div onClick={(e) => { e.stopPropagation(); toggleOpen(); }} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
          {typeof customTrigger === 'function' ? customTrigger(toggleOpen) : customTrigger}
        </div>
        {isOpen && createPortal(
          <div 
            ref={popoverRef}
            className="glass-dropdown-portal"
            style={{
              position: 'absolute', top: coords.top, left: coords.left, width: '90vw', maxWidth: 440,
              background: 'var(--cms-panel-bg)', backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 32, border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              padding: 24, zIndex: 9999, animation: 'cmsPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              maxHeight: '85vh', overflowY: 'auto'
            }}
          >
            {renderPickerContent()}
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{ marginBottom: 0, width: '100%', minWidth: 0, ...containerStyle }}>
      {label && <label className="cms-label" style={{ color: 'var(--cms-text, #0f172a)', fontWeight: 900, fontSize: 11, letterSpacing: '0.04em', marginBottom: 6, display: 'block' }}>{label}</label>}
      <div 
        ref={triggerRef}
        onClick={toggleOpen}
        className="glass-color-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1.5px solid var(--cms-border, #cbd5e1)',
          borderRadius: 100,
          height: 44,
          padding: '0 16px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          cursor: 'pointer',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ 
          width: 24, height: 24, borderRadius: '50%', background: resolveHex(value),
          border: '2px solid #ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', flexShrink: 0
        }} />
        
        <input 
          type="text" value={resolveHex(value)} 
          onChange={() => {}}
          onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
          placeholder="#HEX"
          readOnly
          className="clean-input"
          style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--cms-text, #0f172a)', fontWeight: 900, fontSize: 13.5, letterSpacing: '0.5px', outline: 'none' }}
        />
        <div className="hex-label" style={{ background: '#f1f5f9', color: '#334155', fontWeight: 900, fontSize: 10, padding: '2px 7px', borderRadius: 6, border: '1px solid #e2e8f0', letterSpacing: '0.05em' }}>HEX</div>
      </div>

      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          className="glass-dropdown-portal"
          style={{
            position: 'absolute', top: coords.top, left: coords.left, width: '90vw', maxWidth: 440,
            background: 'var(--cms-panel-bg)', backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 32, border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            padding: 24, zIndex: 9999, animation: 'cmsPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '85vh', overflowY: 'auto'
          }}
        >
          {renderPickerContent()}
        </div>,
        document.body
      )}
    </div>
  );
};

export default GlassColorPicker;
