import React, { useState } from 'react';
import { 
  Palette, Box, MousePointerClick, Sliders, Type, Check, 
  Zap, Share2, ChevronDown, ChevronUp, FileCode, Sparkles
} from 'lucide-react';
import InfoTooltip from './InfoTooltip';

interface DesignSystemSpecProps {
  accentColor?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export default function DesignSystemSpecSection({
  accentColor = 'var(--cms-accent, #7c3aed)',
  isCollapsible = true,
  defaultExpanded = false
}: DesignSystemSpecProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="cms-card" style={{ 
      borderRadius: 'var(--cms-radius-2xl, 24px)', 
      border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
      background: 'var(--cms-card-bg, rgba(20,24,35,0.4))',
      overflow: 'hidden',
      transition: 'all 0.25s ease'
    }}>
      {/* ── HEADER ACCORDION / TOGGLE ── */}
      <div 
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isCollapsible ? 'pointer' : 'default',
          userSelect: 'none',
          gap: 16,
          background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
          borderBottom: isExpanded ? '1px solid var(--glass-border, rgba(255,255,255,0.08))' : 'none',
          transition: 'background 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{ 
            width: 42, 
            height: 42, 
            borderRadius: 'var(--cms-radius-md, 12px)', 
            background: 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(56,189,248,0.22))', 
            color: accentColor, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Palette size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text, #f8fafc)', letterSpacing: '-0.01em' }}>
              Design System
            </div>
            <span onClick={(e) => e.stopPropagation()}>
              <InfoTooltip content="Standarisasi UI & UX Design System (V1.2 Living Spec): acuan token visual, hierarki radius, dimensi pills, form controls, dan skala tipografi." />
            </span>
          </div>
        </div>

        {isCollapsible && (
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: isExpanded ? 'var(--cms-accent-soft, rgba(124,58,237,0.15))' : 'var(--cms-input-bg, rgba(255,255,255,0.06))',
            color: isExpanded ? accentColor : 'var(--cms-text-muted, #94a3b8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid var(--glass-border, rgba(255,255,255,0.08))'
          }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>

      {/* ── EXPANDED SPEC CONTENT ── */}
      {(!isCollapsible || isExpanded) && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Token References Bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: 10, 
            padding: '10px 14px', 
            borderRadius: 'var(--cms-radius-md, 12px)',
            background: 'var(--cms-input-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.06))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--cms-text-muted, #94a3b8)', fontWeight: 600 }}>
              <FileCode size={14} color={accentColor} />
              <span>Sumber Token Global:</span>
              <code style={{ color: accentColor, fontWeight: 700 }}>src/styles/tokens.css</code>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--cms-text-muted, #94a3b8)', fontWeight: 600 }}>
              <Sparkles size={14} color="#10b981" />
              <span>Dokumentasi Arsitektur:</span>
              <code style={{ color: '#10b981', fontWeight: 700 }}>DESIGN_SYSTEM.md</code>
            </div>
          </div>

          {/* Grid Cards Showcase */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
            
            {/* KARTU 1: HIERARKI KELENGKUNGAN (BORDER RADIUS) */}
            <div style={{ 
              background: 'var(--cms-input-bg, rgba(255,255,255,0.02))', 
              border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', 
              borderRadius: 'var(--cms-radius-xl, 20px)', 
              padding: 18, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Box size={16} color={accentColor} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--cms-text, #f8fafc)' }}>
                  Hierarki Kelengkungan (Border Radius)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
                Setiap lapisan memiliki token kelengkungan baku agar harmoni visual tidak saling tumpang tindih:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
                {[
                  { label: 'Modals & Dialog Popups', token: '--cms-radius-2xl', value: '24px', radius: '24px' },
                  { label: 'Kartu Utama & Panel Container', token: '--cms-radius-xl', value: '20px', radius: '20px' },
                  { label: 'Sub-panel & Grid Card', token: '--cms-radius-lg', value: '16px', radius: '16px' },
                  { label: 'List Item & Dropdown Popover', token: '--cms-radius-md', value: '12px', radius: '12px' },
                  { label: 'Form Input & Action Button', token: '--cms-radius-sm', value: '10px', radius: '10px' },
                  { label: 'Micro Tag & Tooltips', token: '--cms-radius-xs', value: '8px', radius: '8px' },
                  { label: 'Filter Pills & Status Badges', token: '--cms-radius-pill', value: '9999px (Pill)', radius: '9999px' }
                ].map((r, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '7px 12px', 
                      borderRadius: r.radius, 
                      border: `1.5px dashed ${accentColor}50`, 
                      background: 'rgba(255,255,255,0.02)' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text, #f8fafc)' }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--cms-text-muted, #94a3b8)', fontFamily: 'monospace' }}>var({r.token})</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: accentColor, background: `${accentColor}18`, padding: '2px 8px', borderRadius: 9999 }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* KARTU 2: STANDAR PILL, BADGING & BUTTON */}
            <div style={{ 
              background: 'var(--cms-input-bg, rgba(255,255,255,0.02))', 
              border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', 
              borderRadius: 'var(--cms-radius-xl, 20px)', 
              padding: 18, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MousePointerClick size={16} color={accentColor} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--cms-text, #f8fafc)' }}>
                  Standarisasi Pill, Badging & Button
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
                Ukuran baku terukur untuk kontrol klik, navigasi tab, dan indikator status:
              </p>

              {/* Filter Pills Demo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase' }}>Filter Pill & Tabs (Tinggi 32px, Pill)</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ 
                    height: 'var(--cms-pill-h-md, 32px)', padding: '0 14px', borderRadius: 'var(--cms-radius-pill, 9999px)', 
                    background: accentColor, color: '#ffffff', fontSize: 12, fontWeight: 800, 
                    display: 'inline-flex', alignItems: 'center', gap: 6 
                  }}>
                    <Check size={13} />
                    <span>Aktif (1-2 kata)</span>
                  </div>
                  <div style={{ 
                    height: 'var(--cms-pill-h-md, 32px)', padding: '0 14px', borderRadius: 'var(--cms-radius-pill, 9999px)', 
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', color: 'var(--cms-text-muted, #94a3b8)', fontSize: 12, fontWeight: 700, 
                    display: 'inline-flex', alignItems: 'center' 
                  }}>
                    <span>Nonaktif</span>
                  </div>
                </div>
              </div>

              {/* Status Badges Demo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase' }}>Status Badges (Tinggi 22px, Font 10.5px)</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ height: 22, padding: '0 8px', borderRadius: 9999, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>
                    SUCCESS
                  </span>
                  <span style={{ height: 22, padding: '0 8px', borderRadius: 9999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>
                    WARNING
                  </span>
                  <span style={{ height: 22, padding: '0 8px', borderRadius: 9999, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>
                    DANGER
                  </span>
                  <span style={{ height: 22, padding: '0 8px', borderRadius: 9999, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>
                    INFO
                  </span>
                </div>
              </div>

              {/* Action Buttons Demo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase' }}>Action Buttons (Tinggi 36px & Icon Circle 32px)</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" style={{ 
                    height: 36, padding: '0 16px', borderRadius: 'var(--cms-radius-pill, 9999px)', 
                    background: accentColor, color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, 
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 
                  }}>
                    <Zap size={14} />
                    <span>Tombol Utama</span>
                  </button>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: 'var(--cms-radius-pill, 9999px)', 
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', display: 'inline-flex', alignItems: 'center', 
                    justifyContent: 'center', color: 'var(--cms-text, #f8fafc)', cursor: 'pointer' 
                  }}>
                    <Share2 size={14} />
                  </div>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: 'var(--cms-radius-sm, 10px)', 
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', display: 'inline-flex', alignItems: 'center', 
                    justifyContent: 'center', color: 'var(--cms-text, #f8fafc)', cursor: 'pointer' 
                  }}>
                    <Sliders size={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* KARTU 3: STANDAR FORM CONTROLS */}
            <div style={{ 
              background: 'var(--cms-input-bg, rgba(255,255,255,0.02))', 
              border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', 
              borderRadius: 'var(--cms-radius-xl, 20px)', 
              padding: 18, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={16} color={accentColor} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--cms-text, #f8fafc)' }}>
                  Standarisasi Form Controls
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
                Kontrol input, select, dan switch dengan tinggi dan radius seragam:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text, #f8fafc)', marginBottom: 4 }}>
                    Input Standar (Tinggi 38px, Radius 10px)
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    value="Nilai form baku: 38px height" 
                    style={{ 
                      width: '100%', height: 'var(--cms-input-h-md, 38px)', padding: '0 12px', 
                      borderRadius: 'var(--cms-radius-sm, 10px)', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', 
                      background: 'rgba(255,255,255,0.03)', color: 'var(--cms-text, #f8fafc)', 
                      fontSize: 12.5, boxSizing: 'border-box' 
                    }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text, #f8fafc)', marginBottom: 4 }}>
                    Input Ringkas / Toolbar (Tinggi 32px, Radius 8px)
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    value="Pencarian cepat / inline: 32px" 
                    style={{ 
                      width: '100%', height: 'var(--cms-input-h-sm, 32px)', padding: '0 10px', 
                      borderRadius: 'var(--cms-radius-xs, 8px)', border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', 
                      background: 'rgba(255,255,255,0.03)', color: 'var(--cms-text, #f8fafc)', 
                      fontSize: 12, boxSizing: 'border-box' 
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border, rgba(255,255,255,0.08))' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text, #f8fafc)' }}>Switch Toggle Standard</span>
                  <div style={{ width: 36, height: 20, borderRadius: 9999, background: accentColor, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 9999, background: '#ffffff', marginLeft: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* KARTU 4: MODULAR TYPOGRAPHY SCALE */}
            <div style={{ 
              background: 'var(--cms-input-bg, rgba(255,255,255,0.02))', 
              border: '1px solid var(--glass-border, rgba(255,255,255,0.08))', 
              borderRadius: 'var(--cms-radius-xl, 20px)', 
              padding: 18, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Type size={16} color={accentColor} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--cms-text, #f8fafc)' }}>
                  Skala Modular Tipografi
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
                Hierarki ukuran teks yang dilarang melompat sembarangan:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { tag: 'Display', size: '24px', weight: '900', token: '--cms-font-display', desc: 'Judul Halaman Utama' },
                  { tag: 'Title XL', size: '20px', weight: '900', token: '--cms-font-title-xl', desc: 'Header Section' },
                  { tag: 'Title LG', size: '17px', weight: '800', token: '--cms-font-title-lg', desc: 'Judul Kartu Utama' },
                  { tag: 'Title MD', size: '15px', weight: '800', token: '--cms-font-title-md', desc: 'Sub-header Modul' },
                  { tag: 'Title SM', size: '13.5px', weight: '700', token: '--cms-font-title-sm', desc: 'Label Form & Header' },
                  { tag: 'Body', size: '13px', weight: '500', token: '--cms-font-body', desc: 'Paragraf (Leading 1.48)' },
                  { tag: 'Body SM', size: '12px', weight: '500', token: '--cms-font-body-sm', desc: 'Keterangan Sekunder' },
                  { tag: 'Caption', size: '11.5px', weight: '600', token: '--cms-font-caption', desc: 'Timestamp & Tag Kategori' },
                  { tag: 'Micro', size: '10.5px', weight: '700', token: '--cms-font-micro', desc: 'Status Badge Uppercase' }
                ].map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.06))', paddingBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: t.size, fontWeight: t.weight as any, color: 'var(--cms-text, #f8fafc)', lineHeight: 1.2 }}>
                        {t.tag}
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #94a3b8)' }}>({t.desc})</span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: accentColor }}>
                      {t.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
