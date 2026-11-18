import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight, Upload, Link2, RefreshCw, AlertCircle } from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { SoundEffectEngine } from '../../utils/soundEffects';
import { uploadToCloudinary } from '../../utils/cloudinary';

// Reuse sound effect engine
const soundEngine = new SoundEffectEngine();

export interface BeforeAfterPreset {
  id: string;
  category: string;
  title: string;
  description: string;
  client: string;
  beforeLabel: string;
  afterLabel: string;
  beforeImage: string;
  afterImage: string;
  stats?: { label: string; value: string }[];
}

const DEFAULT_PRESETS: BeforeAfterPreset[] = [
  {
    id: 'case-uiux',
    category: 'UI/UX Redesign',
    title: 'Transformasi Visual & Sistem Antarmuka Platform SaaS',
    description: 'Dari struktur wireframe monokrom yang rumit menjadi antarmuka modern dengan hierarki visual terarah, kontras WCAG AAA, dan micro-interaction yang presisi.',
    client: 'FinFlow Enterprise',
    beforeLabel: 'Wireframe / UI Lama',
    afterLabel: 'Hasil Redesign Final',
    beforeImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
    stats: [
      { label: 'Konversi Klik', value: '+42%' },
      { label: 'Lighthouse Score', value: '98/100' },
      { label: 'Waktu Alur Kerja', value: '2.5x Cepat' }
    ]
  },
  {
    id: 'case-brand',
    category: 'Brand Identity',
    title: 'Evolusi Identitas Brand: Dari Sketsa ke Sistem Vektor',
    description: 'Proses metamorfosis ide sketsa tangan kasar menjadi sistem identitas geometris yang fleksibel, konsisten di berbagai media cetak maupun aset digital.',
    client: 'Kopi Kolektif & Roastery',
    beforeLabel: 'Sketsa Manual & Grid',
    afterLabel: 'Identitas Visual Final',
    beforeImage: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&q=80',
    stats: [
      { label: 'Varian Logo', value: '12 Format' },
      { label: 'Brand Recognition', value: '+68%' },
      { label: 'Penerapan Media', value: '100% Vektor' }
    ]
  },
  {
    id: 'case-packaging',
    category: '3D & Packaging',
    title: 'Eksplorasi Kemasan Ramah Lingkungan & Visualisasi Fotorealistis',
    description: 'Penerapan die-cut kemasan dan pemilihan material biodegradable yang diwujudkan dalam visualisasi 3D realistis sebelum tahap produksi massal.',
    client: 'Botanica Organics',
    beforeLabel: 'Pola Datar / Die-cut',
    afterLabel: 'Render 3D Fotorealistis',
    beforeImage: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1608248597359-54848312e75e?w=1200&q=80',
    stats: [
      { label: 'Efisiensi Bahan', value: '-18% Limbah' },
      { label: 'Persetujuan Klien', value: '1x Putaran' },
      { label: 'Akurasi Warna', value: 'Pantone Match' }
    ]
  }
];

interface LPBeforeAfterSpotlightProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  isDark: boolean;
  accentColor?: string;
  presets?: BeforeAfterPreset[];
  isEditable?: boolean;
  onUpdatePresets?: (presets: BeforeAfterPreset[]) => void;
  onUpdateTitle?: (val: string) => void;
  onUpdateSubtitle?: (val: string) => void;
}

export const LPBeforeAfterSpotlight: React.FC<LPBeforeAfterSpotlightProps> = ({
  badge = 'TRANSFORMASI VISUAL INTERAKTIF',
  title = 'Sebelum & Sesudah: Bukti Nyata Kualitas Desain',
  subtitle = 'Geser handle di tengah gambar untuk melihat perbandingan langsung antara konsep awal / rancangan lama dengan hasil karya desain akhir.',
  isDark,
  accentColor = '#6366f1',
  presets = DEFAULT_PRESETS,
  isEditable = false,
  onUpdatePresets,
  onUpdateTitle,
  onUpdateSubtitle,
}) => {
  const safePresets = presets && presets.length > 0 ? presets : DEFAULT_PRESETS;
  const [activeIdx, setActiveIdx] = useState(0);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingSide, setUploadingSide] = useState<'before' | 'after' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInputs, setShowUrlInputs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clipLayerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ left: number; width: number } | null>(null);
  const sliderPosRef = useRef<number>(50);
  const rafRef = useRef<number>(0);

  const clampedIdx = Math.min(activeIdx, safePresets.length - 1);
  const activeCase = safePresets[clampedIdx] || safePresets[0];

  const updateActiveCase = (patch: Partial<BeforeAfterPreset>) => {
    const next = safePresets.map((item, idx) => (idx === clampedIdx ? { ...item, ...patch } : item));
    onUpdatePresets?.(next);
  };

  const handleImageUpload = async (side: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Mohon pilih berkas gambar (PNG, JPG, WebP).');
      e.target.value = '';
      return;
    }

    setUploadingSide(side);
    setUploadError(null);
    try {
      const res = await uploadToCloudinary(file, 'image');
      if (res?.url) {
        updateActiveCase(side === 'before' ? { beforeImage: res.url } : { afterImage: res.url });
      } else {
        setUploadError('Gagal mengunggah gambar ke cloud. Periksa konfigurasi Cloudinary.');
      }
    } catch (err: any) {
      setUploadError('Gagal mengunggah gambar: ' + (err?.message || 'Error jaringan'));
    } finally {
      setUploadingSide(null);
      e.target.value = '';
    }
  };

  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  // Calculate sub-pixel position and apply via RAF + direct DOM refs for 120fps silky drag
  const applySliderDom = useCallback((percent: number) => {
    sliderPosRef.current = percent;
    const clip = `inset(0 ${(100 - percent).toFixed(3)}% 0 0)`;
    if (clipLayerRef.current) {
      clipLayerRef.current.style.clipPath = clip;
      (clipLayerRef.current.style as any).webkitClipPath = clip;
    }
    if (dividerRef.current) {
      dividerRef.current.style.left = `${percent.toFixed(3)}%`;
    }
  }, []);

  const updatePosition = useCallback((clientX: number) => {
    if (!rectRef.current && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      rectRef.current = { left: r.left, width: r.width };
    }
    if (!rectRef.current) return;
    const { left, width } = rectRef.current;
    if (width <= 0) return;
    const x = clientX - left;
    const clampedX = Math.max(0, Math.min(x, width));
    const percent = (clampedX / width) * 100;
    sliderPosRef.current = percent;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        applySliderDom(sliderPosRef.current);
      });
    }
  }, [applySliderDom]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      rectRef.current = { left: r.left, width: r.width };
    }
    setIsDragging(true);
    haptic.selection();
    soundEngine.play('click');
    updatePosition(e.clientX);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      rectRef.current = null;
      setSliderPos(sliderPosRef.current);
      haptic.light();
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const switchPreset = (idx: number) => {
    haptic.selection();
    soundEngine.play('pop');
    setActiveIdx(idx);
    setSliderPos(50);
    applySliderDom(50);
  };

  return (
    <section
      id="before-after"
      data-reveal="true"
      style={{
        width: '100%',
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        maxWidth: 1240,
        margin: '0 auto',
        boxSizing: 'border-box',
        scrollMarginTop: 80,
      }}
    >
      {/* ── Minimalist Header (Title & Description only) ── */}
      <div
        style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 740 }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(22px, 3.2vw, 32px)',
              fontWeight: 850,
              color: textColor,
              lineHeight: 1.25,
              letterSpacing: '-0.025em',
              margin: '0 0 8px 0',
            }}
          >
            {activeCase.title || title}
          </h2>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              color: subTextColor,
              margin: 0,
            }}
          >
            {activeCase.description || subtitle}
          </p>
        </div>

        {/* Discreet switcher if multiple cases */}
        {safePresets.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {safePresets.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => switchPreset(idx)}
                  style={{
                    width: idx === clampedIdx ? 18 : 6,
                    height: 6,
                    borderRadius: 999,
                    background: idx === clampedIdx ? accentColor : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title={`Kasus ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => switchPreset((clampedIdx - 1 + safePresets.length) % safePresets.length)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: `1px solid ${cardBorder}`,
                background: cardBg,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Sebelumnya"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => switchPreset((clampedIdx + 1) % safePresets.length)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: `1px solid ${cardBorder}`,
                background: cardBg,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Berikutnya"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {isEditable && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 16,
            background: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.94)',
            border: `1px solid ${cardBorder}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: textColor }}>
              Edit Before &amp; After (Kasus {clampedIdx + 1})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}45`,
                  color: accentColor,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: uploadingSide === 'before' ? 'wait' : 'pointer',
                }}
              >
                {uploadingSide === 'before' ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>{uploadingSide === 'before' ? 'Mengunggah...' : 'Unggah Before'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload('before', e)}
                  style={{ display: 'none' }}
                  disabled={uploadingSide !== null}
                />
              </label>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10b981',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: uploadingSide === 'after' ? 'wait' : 'pointer',
                }}
              >
                {uploadingSide === 'after' ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>{uploadingSide === 'after' ? 'Mengunggah...' : 'Unggah After'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload('after', e)}
                  style={{ display: 'none' }}
                  disabled={uploadingSide !== null}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowUrlInputs((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${cardBorder}`,
                  color: textColor,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                <Link2 size={13} />
                <span>{showUrlInputs ? 'Tutup URL' : 'Input URL'}</span>
              </button>
            </div>
          </div>

          {uploadError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
              <AlertCircle size={13} />
              <span>{uploadError}</span>
            </div>
          )}

          {showUrlInputs && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              <input
                type="text"
                value={activeCase.beforeImage || ''}
                onChange={(e) => updateActiveCase({ beforeImage: e.target.value })}
                placeholder="URL Gambar Before..."
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: `1px solid ${cardBorder}`,
                  background: isDark ? '#0a0f1d' : '#ffffff',
                  color: textColor,
                  fontSize: 12,
                }}
              />
              <input
                type="text"
                value={activeCase.afterImage || ''}
                onChange={(e) => updateActiveCase({ afterImage: e.target.value })}
                placeholder="URL Gambar After..."
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: `1px solid ${cardBorder}`,
                  background: isDark ? '#0a0f1d' : '#ffffff',
                  color: textColor,
                  fontSize: 12,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Main Clean Draggable Slider Container ── */}
      <div
        data-card-3d="true"
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 22,
          padding: 8,
          boxShadow: 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            maxHeight: 560,
            borderRadius: 16,
            overflow: 'hidden',
            userSelect: 'none',
            touchAction: 'none',
            cursor: isDragging ? 'ew-resize' : 'col-resize',
            background: isDark ? '#0c0d12' : '#e2e8f0',
          }}
        >
          {/* AFTER IMAGE (Bottom Layer) */}
          <img
            src={activeCase.afterImage}
            alt="Hasil Desain"
            draggable={false}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
            }}
          />

          {/* BEFORE IMAGE (Top Layer - Clipped) */}
          <div
            ref={clipLayerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
              pointerEvents: 'none',
              willChange: isDragging ? 'clip-path' : 'auto',
            }}
          >
            <img
              src={activeCase.beforeImage}
              alt="Konsep Awal"
              draggable={false}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          {/* DIVIDER VERTICAL LINE & MINIMAL DRAG KNOB */}
          <div
            ref={dividerRef}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${sliderPos}%`,
              transform: 'translateX(-50%)',
              width: 2,
              background: '#ffffff',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Round Drag Button Knob */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#ffffff',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
            >
              <ArrowLeftRight size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LPBeforeAfterSpotlight;

