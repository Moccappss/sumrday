
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Pipette, X, Palette, Sliders, Check, Sparkles, Sun, ShieldCheck } from 'lucide-react';
import { generateAnalogousPalette, getWcagContrast, getContrastRating, CURATED_STUDIO_PALETTES } from '../../utils/theme';
import { getSolarAtmosphere } from '../../utils/solarCircadianEngine';

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
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [hsv, setHsv] = useState({ h: 260, s: 80, v: 93 });
  const [draftColor, setDraftColor] = useState(() => resolveHex(value));
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const nativeColorRef = useRef<HTMLInputElement>(null);

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
      let topPos = rect.bottom + 8;
      if (topPos + 420 > window.innerHeight) {
        topPos = Math.max(10, rect.top - 420);
      }
      const pickerWidth = Math.min(440, window.innerWidth * 0.9);
      setCoords({
        top: topPos,
        left: Math.max(10, Math.min(window.innerWidth - pickerWidth - 10, rect.left - 40))
      });
      setDraftColor(value || 'var(--cms-accent, #7c3aed)');
      setHsv(hexToHsv(value || 'var(--cms-accent, #7c3aed)'));
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClose = (e: any) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      handleCancel();
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClose);
    }
    return () => {
      document.removeEventListener('mousedown', handleClose);
    };
  }, [isOpen, handleCancel]);

  const updateHsv = (k, v) => {
    const next = { ...hsv, [k]: v };
    setHsv(next);
    setDraftColor(hsvToHex(next.h, next.s, next.v));
  };

  const handleEyedropper = async () => {
    if (typeof window !== 'undefined' && (window as any).EyeDropper) {
      try {
        const dropper = new (window as any).EyeDropper();
        const result = await dropper.open();
        const hex = result.sRGBHex.toUpperCase();
        setDraftColor(hex);
        setHsv(hexToHsv(hex));
      } catch (e) {
        console.log('Eyedropper cancelled or failed', e);
      }
    } else if (nativeColorRef.current) {
      nativeColorRef.current.click();
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
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid rgba(0,0,0,0.18);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
          margin-top: -1px;
        }
        input[type="range"].cms-color-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid rgba(0,0,0,0.18);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
        }
      `}</style>

      {/* ── HEADER & TAB SWITCHER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          display: 'inline-flex',
          background: 'var(--cms-switcher-bg, rgba(0,0,0,0.06))',
          padding: 3,
          borderRadius: 10,
          gap: 2
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'presets' ? 'var(--cms-card-bg, #ffffff)' : 'transparent',
              color: activeTab === 'presets' ? 'var(--cms-text, #0f172a)' : 'var(--cms-text-muted, #64748b)',
              boxShadow: activeTab === 'presets' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Palette size={13} color={activeTab === 'presets' ? 'var(--cms-accent, #7c3aed)' : undefined} />
            <span>Palet Studio</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'custom' ? 'var(--cms-card-bg, #ffffff)' : 'transparent',
              color: activeTab === 'custom' ? 'var(--cms-text, #0f172a)' : 'var(--cms-text-muted, #64748b)',
              boxShadow: activeTab === 'custom' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sliders size={13} color={activeTab === 'custom' ? 'var(--cms-accent, #7c3aed)' : undefined} />
            <span>Slider Kustom</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button 
            type="button"
            onClick={handleEyedropper}
            title="Penetes Warna"
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Pipette size={13} />
          </button>
          <input
            ref={nativeColorRef}
            type="color"
            value={draftColor.startsWith('#') && draftColor.length === 7 ? draftColor : '#7C3AED'}
            onChange={(e) => {
              const hex = e.target.value.toUpperCase();
              setDraftColor(hex);
              setHsv(hexToHsv(hex));
            }}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
            aria-hidden="true"
            tabIndex={-1}
          />
          <button 
            type="button"
            onClick={handleCancel}
            title="Tutup"
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── TAB 1: PALET STUDIO ── */}
      {activeTab === 'presets' && (
        <>
          {/* Smart Solar Circadian Accent Trigger */}
          {(() => {
            const atmo = getSolarAtmosphere();
            const isCurrentCircadian = draftColor.toUpperCase() === atmo.suggestedAccentColor.toUpperCase();
            return (
              <div
                onClick={() => {
                  setDraftColor(atmo.suggestedAccentColor);
                  setHsv(hexToHsv(atmo.suggestedAccentColor));
                }}
                title="Klik untuk menyinkronkan dengan ritme sirkadian matahari"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 11px',
                  borderRadius: 10,
                  border: isCurrentCircadian ? `1.5px solid ${atmo.suggestedAccentColor}` : '1px solid var(--glass-border)',
                  background: isCurrentCircadian ? 'rgba(var(--cms-accent-rgb, 217, 86, 41), 0.1)' : 'var(--cms-input-bg)',
                  cursor: 'pointer',
                  marginBottom: 11,
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 15 }}>{atmo.sunIcon}</span>
                  <div>
                    <div style={{ fontSize: 9.5, color: 'var(--cms-text-muted)', fontWeight: 750, letterSpacing: '0.03em' }}>RITME SIRKADIAN MATAHARI</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)' }}>{atmo.phaseLabel} ({atmo.greeting})</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--cms-card-bg)', padding: '3px 8px', borderRadius: 9999, border: '1px solid var(--glass-border)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: atmo.suggestedAccentColor }} />
                  <span style={{ fontSize: 10.5, fontFamily: 'monospace', fontWeight: 800, color: atmo.suggestedAccentColor }}>{atmo.suggestedAccentColor}</span>
                </div>
              </div>
            );
          })()}

          {/* 8 Curated Studio Palettes */}
          <div style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text-muted)', letterSpacing: '0.04em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={11} color="var(--cms-accent)" /> 8 VIBES TERKURASI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
              {CURATED_STUDIO_PALETTES.map((item) => {
                const isSel = draftColor.toUpperCase() === item.hex.toUpperCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDraftColor(item.hex);
                      setHsv(hexToHsv(item.hex));
                    }}
                    title={`${item.name} • ${item.desc}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 7px',
                      borderRadius: 8,
                      border: isSel ? `1.5px solid ${item.hex}` : '1px solid var(--glass-border)',
                      background: isSel ? 'rgba(var(--cms-accent-rgb, 217, 86, 41), 0.12)' : 'var(--cms-card-bg)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.hex, flexShrink: 0, boxShadow: isSel ? `0 0 6px ${item.hex}` : 'none' }} />
                    <span style={{ fontSize: 9.5, fontWeight: isSel ? 850 : 650, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 16 Essential Swatches */}
          <div style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text-muted)', letterSpacing: '0.04em', marginBottom: 6 }}>
              WARNA DASAR ESENSIAL
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
              {PRESET_COLORS.slice(0, 16).map((c, i) => {
                const isSelected = draftColor.toUpperCase() === c.toUpperCase();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setDraftColor(c);
                      setHsv(hexToHsv(c));
                    }}
                    title={c}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 7,
                      background: c,
                      border: isSelected ? '2.5px solid #ffffff' : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? `0 0 0 2px var(--cms-accent, #7c3aed), 0 2px 6px rgba(0,0,0,0.3)` : 'inset 0 1px 2px rgba(0,0,0,0.1)',
                      padding: 0,
                      transition: 'transform 0.15s ease'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Live Analogous Harmony Bar */}
          {(() => {
            try {
              const hex = resolveHex(draftColor);
              const pal = generateAnalogousPalette(hex);
              return (
                <div style={{ marginBottom: 12, padding: '7px 9px', borderRadius: 10, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={10} color="var(--cms-accent, #7c3aed)" /> Harmoni Analogus Dinamis
                    </span>
                    <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Klik untuk Pilih Turunan</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, height: 22 }}>
                    <button
                      type="button"
                      onClick={() => { setDraftColor(pal.analogousCool); setHsv(hexToHsv(pal.analogousCool)); }}
                      style={{ borderRadius: 6, background: pal.analogousCool, border: 'none', cursor: 'pointer' }}
                      title={`Sejuk: ${pal.analogousCool}`}
                    />
                    <button
                      type="button"
                      onClick={() => { setDraftColor(pal.primary); setHsv(hexToHsv(pal.primary)); }}
                      style={{ borderRadius: 6, background: pal.primary, border: '2px solid #ffffff', cursor: 'pointer', boxShadow: '0 0 4px rgba(0,0,0,0.3)' }}
                      title={`Primer: ${pal.primary}`}
                    />
                    <button
                      type="button"
                      onClick={() => { setDraftColor(pal.analogousWarm); setHsv(hexToHsv(pal.analogousWarm)); }}
                      style={{ borderRadius: 6, background: pal.analogousWarm, border: 'none', cursor: 'pointer' }}
                      title={`Hangat: ${pal.analogousWarm}`}
                    />
                    <button
                      type="button"
                      onClick={() => { setDraftColor(pal.analogousPop); setHsv(hexToHsv(pal.analogousPop)); }}
                      style={{ borderRadius: 6, background: pal.analogousPop, border: 'none', cursor: 'pointer' }}
                      title={`Pop Kontras: ${pal.analogousPop}`}
                    />
                    <button
                      type="button"
                      onClick={() => { setDraftColor(pal.analogousDeep); setHsv(hexToHsv(pal.analogousDeep)); }}
                      style={{ borderRadius: 6, background: `linear-gradient(135deg, ${pal.analogousCool} 0%, ${pal.primary} 50%, ${pal.analogousWarm} 100%)`, border: 'none', cursor: 'pointer' }}
                      title="Gradasi Harmonis"
                    />
                  </div>
                </div>
              );
            } catch {
              return null;
            }
          })()}
        </>
      )}

      {/* ── TAB 2: SLIDER KUSTOM ── */}
      {activeTab === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 14, padding: '4px 0' }}>
          {/* HUE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>
              <span>Spektrum Warna (Hue)</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--cms-text-muted)' }}>{hsv.h}°</span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 16, borderRadius: 8, background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
              <input 
                type="range" min="0" max="360" value={hsv.h} 
                onChange={e => updateHsv('h', parseInt(e.target.value))}
                className="cms-color-slider"
              />
            </div>
          </div>

          {/* SATURATION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>
              <span>Kepekatan (Saturation)</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--cms-text-muted)' }}>{hsv.s}%</span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 16, borderRadius: 8, background: `linear-gradient(to right, #fff, ${hsvToHex(hsv.h, 100, 100)})`, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
              <input 
                type="range" min="0" max="100" value={hsv.s} 
                onChange={e => updateHsv('s', parseInt(e.target.value))}
                className="cms-color-slider"
              />
            </div>
          </div>

          {/* BRIGHTNESS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>
              <span>Kecerahan (Lightness)</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--cms-text-muted)' }}>{hsv.v}%</span>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 16, borderRadius: 8, background: 'linear-gradient(to right, #000, #fff)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
              <input 
                type="range" min="0" max="100" value={hsv.v} 
                onChange={e => updateHsv('v', parseInt(e.target.value))}
                className="cms-color-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── PERSISTENT FOOTER: WCAG READABILITY GUARD ── */}
      {(() => {
        try {
          const hex = resolveHex(draftColor);
          const ratioWhite = getWcagContrast(hex, '#ffffff');
          const ratioDark = getWcagContrast(hex, '#0f172a');
          const activeRatio = Math.max(ratioWhite, ratioDark);
          const rating = getContrastRating(activeRatio);
          return (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 10px',
              borderRadius: 8,
              background: rating.badgeBg,
              marginBottom: 10,
              fontSize: 10,
              fontWeight: 700,
              color: rating.textColor,
              border: `1px solid ${rating.textColor}33`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck size={12} />
                <span>{rating.label}</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                Rasio {activeRatio}:1
              </span>
            </div>
          );
        } catch {
          return null;
        }
      })()}

      {/* ── PERSISTENT FOOTER: OUTPUT & ACTION BAR ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Preview Warna */}
        <div style={{ 
          width: 36, height: 36, borderRadius: 9, background: draftColor, 
          border: '1.5px solid var(--glass-border)', flexShrink: 0,
          boxShadow: `0 2px 8px ${draftColor}40`
        }} />
        
        {/* Input HEX */}
        <div style={{ 
          flex: 1, height: 36, background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)', 
          borderRadius: 9, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)' }}>#</span>
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
              width: '100%', border: 'none', background: 'transparent', fontSize: 12, 
              fontWeight: 800, color: 'var(--cms-text)', outline: 'none', textTransform: 'uppercase'
            }}
          />
        </div>

        {/* Tombol Terapkan */}
        <button 
          onClick={applyColor}
          style={{ 
            height: 36, padding: '0 14px', borderRadius: 9, background: 'var(--cms-accent, #7c3aed)', 
            color: '#fff', border: 'none', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 3px 10px rgba(var(--cms-accent-rgb, 124,58,237), 0.35)',
            whiteSpace: 'nowrap', flexShrink: 0
          }}
        >
          <Check size={13} strokeWidth={2.5} />
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
              position: 'fixed', top: coords.top, left: coords.left, width: '90vw', maxWidth: 410,
              background: 'var(--cms-panel-bg)', backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 24, border: '1px solid var(--glass-border)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
              padding: 18, zIndex: 10000000, animation: 'cmsPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
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
            position: 'fixed', top: coords.top, left: coords.left, width: '90vw', maxWidth: 410,
            background: 'var(--cms-panel-bg)', backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 24, border: '1px solid var(--glass-border)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            padding: 18, zIndex: 10000000, animation: 'cmsPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
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
