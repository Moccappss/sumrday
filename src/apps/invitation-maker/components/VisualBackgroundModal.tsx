import React from 'react';
import { 
  X, Palette, Image as ImageIcon, Sliders, Sparkles, Check, Upload, RefreshCw
} from 'lucide-react';
import { 
  InvitationData, BACKGROUND_GRADIENTS, BACKGROUND_PATTERNS, FRAME_PRESETS 
} from '../invitationData';

interface VisualBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvitationData;
  onSave: (updated: InvitationData) => void;
  ImageUploadField: React.ComponentType<{
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }>;
}

export const VisualBackgroundModal: React.FC<VisualBackgroundModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  ImageUploadField
}) => {
  if (!isOpen) return null;

  const bgType = data.backgroundType || 'theme';

  const SOLID_PALETTES = [
    { name: 'Obsidian Night', color: '#09090e' },
    { name: 'Deep Navy', color: '#070f1e' },
    { name: 'Emerald Velvet', color: '#081711' },
    { name: 'Burgundy Rose', color: '#1a0910' },
    { name: 'Warm Charcoal', color: '#131317' },
    { name: 'Royal Plum', color: '#170b20' },
    { name: 'Clean Ivory Dark', color: '#161412' },
    { name: 'Pure Onyx', color: '#000000' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          background: 'var(--cms-card-bg, #111116)',
          border: '1.5px solid var(--glass-border, rgba(255,255,255,0.14))',
          borderRadius: 24,
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 24px rgba(236,72,153,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 22px',
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.1))'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text, #fff)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Palette size={18} color="var(--cms-accent, #ec4899)" /> Desain Background & Corak
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
              Pilih warna solid, gradasi mewah, foto latar belakang, corak tekstur, atau bingkai overlay.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cms-text, #fff)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          {/* Tipe Background Tab Switcher */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              Tipe Background Utama
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { id: 'theme', label: 'Tema Bawaan' },
                { id: 'color', label: 'Warna Solid' },
                { id: 'gradient', label: 'Gradasi Mewah' },
                { id: 'image', label: 'Foto / Gambar' }
              ].map(t => {
                const isSel = bgType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSave({ ...data, backgroundType: t.id as any })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 12,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: isSel ? '2px solid var(--cms-accent, #ec4899)' : '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                      background: isSel ? 'rgba(236,72,153,0.15)' : 'var(--cms-bg, #0a0a0f)',
                      color: isSel ? 'var(--cms-accent, #ec4899)' : 'var(--cms-text-muted, #94a3b8)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. Warna Solid Controls */}
          {bgType === 'color' && (
            <div style={{ background: 'var(--cms-bg, #0a0a0f)', padding: 16, borderRadius: 16, border: '1px solid var(--glass-border, rgba(255,255,255,0.1))' }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #fff)', display: 'block', marginBottom: 10 }}>
                Pilih Warna Solid
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {SOLID_PALETTES.map(p => {
                  const isSel = data.customBackgroundColor === p.color;
                  return (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => onSave({ ...data, customBackgroundColor: p.color })}
                      style={{
                        padding: '8px',
                        borderRadius: 10,
                        background: p.color,
                        border: isSel ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.15)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: isSel ? '0 0 12px rgba(236,72,153,0.5)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, textShadow: '0 1px 3px #000' }}>{p.name}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={data.customBackgroundColor || '#0a0a14'}
                  onChange={e => onSave({ ...data, customBackgroundColor: e.target.value })}
                  style={{ width: 44, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={data.customBackgroundColor || '#0a0a14'}
                  onChange={e => onSave({ ...data, customBackgroundColor: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--cms-text, #fff)',
                    fontSize: 12.5,
                    outline: 'none'
                  }}
                  placeholder="#0a0a14"
                />
              </div>
            </div>
          )}

          {/* 2. Gradasi Mewah Controls */}
          {bgType === 'gradient' && (
            <div style={{ background: 'var(--cms-bg, #0a0a0f)', padding: 16, borderRadius: 16, border: '1px solid var(--glass-border, rgba(255,255,255,0.1))' }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #fff)', display: 'block', marginBottom: 10 }}>
                Pilihan Palet Gradasi Estetis
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {BACKGROUND_GRADIENTS.map(g => {
                  const isSel = (data.customBackgroundGradient || BACKGROUND_GRADIENTS[0].gradient) === g.gradient;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => onSave({ ...data, customBackgroundGradient: g.gradient })}
                      style={{
                        padding: '16px 12px',
                        borderRadius: 14,
                        background: g.gradient,
                        border: isSel ? '2px solid var(--cms-accent, #ec4899)' : '1px solid rgba(255,255,255,0.14)',
                        boxShadow: isSel ? '0 0 16px rgba(236,72,153,0.45)' : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative'
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                        {g.name}
                      </div>
                      {isSel && (
                        <span style={{ position: 'absolute', top: 8, right: 8, color: '#ec4899' }}>
                          <Check size={16} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Foto / Gambar Kustom Controls */}
          {bgType === 'image' && (
            <div style={{ background: 'var(--cms-bg, #0a0a0f)', padding: 16, borderRadius: 16, border: '1px solid var(--glass-border, rgba(255,255,255,0.1))', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ImageUploadField
                label="Unggah Foto Background Undangan"
                value={data.customBackgroundImage || ''}
                onChange={val => onSave({ ...data, customBackgroundImage: val })}
                placeholder="Upload gambar atau masukkan URL foto..."
              />

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #94a3b8)', alignSelf: 'center', marginRight: 4 }}>Preset Foto Cepat:</span>
                {[
                  { label: 'Royal Garden', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80' },
                  { label: 'Elegance Rose', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80' },
                  { label: 'Night Star', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80' }
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onSave({ ...data, customBackgroundImage: p.url })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                      color: 'var(--cms-text, #fff)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Corak / Pattern Tekstur */}
          <div style={{ background: 'var(--cms-bg, #0a0a0f)', padding: 16, borderRadius: 16, border: '1px solid var(--glass-border, rgba(255,255,255,0.1))' }}>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #fff)', display: 'block', marginBottom: 10 }}>
              Corak & Tekstur Latar Belakang (Pattern Overlay)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {BACKGROUND_PATTERNS.map(pat => {
                const isSel = (data.backgroundPattern || 'none') === pat.id;
                return (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => onSave({ ...data, backgroundPattern: pat.id as any })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: isSel ? '2px solid var(--cms-accent, #ec4899)' : '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                      background: isSel ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSel ? 'var(--cms-accent, #ec4899)' : 'var(--cms-text-muted, #94a3b8)'
                    }}
                  >
                    {pat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Lapisan Frame Overlay PNG */}
          <div style={{ background: 'var(--cms-bg, #0a0a0f)', padding: 16, borderRadius: 16, border: '1px solid var(--glass-border, rgba(255,255,255,0.1))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <strong style={{ fontSize: 12, color: 'var(--cms-text, #fff)', display: 'block' }}>Lapisan Frame Transparan (Border Overlay)</strong>
                <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #94a3b8)' }}>Bingkai hiasan emas/estetik di sekeliling canvas</span>
              </div>
              <input
                type="checkbox"
                checked={data.frameOverlay?.enabled || false}
                onChange={e => onSave({
                  ...data,
                  frameOverlay: {
                    enabled: e.target.checked,
                    preset: data.frameOverlay?.preset || 'gold_floral',
                    opacity: data.frameOverlay?.opacity ?? 0.85,
                    url: data.frameOverlay?.url || ''
                  }
                })}
                style={{ width: 18, height: 18, accentColor: 'var(--cms-accent, #ec4899)', cursor: 'pointer' }}
              />
            </div>

            {data.frameOverlay?.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'gold_floral', label: 'Gold Floral' },
                    { id: 'vintage_arch', label: 'Vintage Arch' },
                    { id: 'luxury_corners', label: 'Luxury Corners' },
                    { id: 'minimalist_border', label: 'Minimalist' },
                    { id: 'custom', label: 'Upload PNG' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSave({
                        ...data,
                        frameOverlay: { ...data.frameOverlay!, preset: f.id as any }
                      })}
                      style={{
                        padding: '6px 4px',
                        borderRadius: 8,
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: data.frameOverlay?.preset === f.id ? '1.5px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                        background: data.frameOverlay?.preset === f.id ? 'rgba(236,72,153,0.18)' : 'rgba(255,255,255,0.03)',
                        color: 'var(--cms-text, #fff)'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                  <span>Tingkat Ketebalan Bingkai</span>
                  <span>{Math.round((data.frameOverlay?.opacity ?? 0.85) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={data.frameOverlay?.opacity ?? 0.85}
                  onChange={e => onSave({
                    ...data,
                    frameOverlay: { ...data.frameOverlay!, opacity: parseFloat(e.target.value) }
                  })}
                  style={{ width: '100%', accentColor: 'var(--cms-accent, #ec4899)', cursor: 'pointer' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: 12,
              background: 'var(--cms-accent, #ec4899)',
              color: '#fff',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(236,72,153,0.4)'
            }}
          >
            Selesai & Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
