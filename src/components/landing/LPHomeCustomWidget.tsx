import React, { useState } from 'react';
import {
  Sparkles, Upload, Plus, Trash2, Copy, ArrowUpRight, RefreshCw,
  Image as ImageIcon, Video as VideoIcon, Type, MessageSquare, Minus,
  Tag, AlertCircle, Link2, AlignLeft, AlignCenter, CheckCircle2, HelpCircle, BarChart3, Quote as QuoteIcon, ChevronDown
} from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';

export type HomeWidgetType =
  | 'text'
  | 'callout'
  | 'image'
  | 'video'
  | 'cta'
  | 'spacer'
  | 'sticker'
  | 'quote'
  | 'stats'
  | 'faq'
  | 'checklist'
  | 'gallery'
  | 'embed'
  | 'promo';

export type StickerMaskType =
  | 'none'
  | 'circle'
  | 'squircle'
  | 'rounded'
  | 'heart'
  | 'star'
  | 'badge'
  | 'shield'
  | 'hexagon';

export type StickerAnimType = 'none' | 'float' | 'bounce' | 'swing' | 'pop' | 'pulse' | 'spin';

export interface HomeStickerItem {
  id: string;
  label: string;
  imageUrl: string;
  mask: StickerMaskType;
  animation: StickerAnimType;
  width: number;
  rotation: number;
  linkUrl?: string;
}

export interface HomeCustomWidgetData {
  id: string;
  type: HomeWidgetType;
  title?: string;
  subtitle?: string;
  body?: string;
  badge?: string;
  align?: 'left' | 'center';
  boxed?: boolean;
  tone?: 'accent' | 'info' | 'success' | 'warning';
  emoji?: string;
  imageUrl?: string;
  videoUrl?: string;
  aspectRatio?: 'auto' | '16/9' | '21/9' | '4/3' | '1/1';
  buttonText?: string;
  buttonUrl?: string;
  spacerHeight?: number;
  showDivider?: boolean;
  stickers?: HomeStickerItem[];
  items?: any[];
}

const makeSvgDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Contoh Stiker Siap Pakai (diambil dari pola mask, animasi & gaya visual LP Image) */
export const LP_IMAGE_STICKER_SAMPLES: Omit<HomeStickerItem, 'id'>[] = [
  {
    label: 'Studio Badge',
    mask: 'badge',
    animation: 'float',
    width: 112,
    rotation: -4,
    imageUrl: makeSvgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#ea580c"/></linearGradient></defs><rect width="200" height="200" fill="url(#g1)"/><text x="100" y="92" text-anchor="middle" fill="#fff" font-family="Outfit,sans-serif" font-weight="900" font-size="24">NEW</text><text x="100" y="122" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-weight="700" font-size="14">COLLECTION</text></svg>`
    ),
  },
  {
    label: 'Sparkle Star',
    mask: 'star',
    animation: 'pulse',
    width: 110,
    rotation: 6,
    imageUrl: makeSvgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#ec4899"/></linearGradient></defs><rect width="200" height="200" fill="url(#g2)"/><text x="100" y="112" text-anchor="middle" fill="#fff" font-family="Outfit,sans-serif" font-weight="900" font-size="22">TOP PICK</text></svg>`
    ),
  },
  {
    label: 'Stamp Lingkaran',
    mask: 'circle',
    animation: 'spin',
    width: 108,
    rotation: 0,
    imageUrl: makeSvgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0ea5e9"/><stop offset="100%" stop-color="#10b981"/></linearGradient></defs><rect width="200" height="200" fill="url(#g3)"/><circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="5" stroke-dasharray="10 8"/><text x="100" y="96" text-anchor="middle" fill="#fff" font-family="Outfit,sans-serif" font-weight="900" font-size="20">VERIFIED</text><text x="100" y="120" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-weight="700" font-size="13">STUDIO 2026</text></svg>`
    ),
  },
  {
    label: 'Squircle Tag',
    mask: 'squircle',
    animation: 'swing',
    width: 110,
    rotation: -3,
    imageUrl: makeSvgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><rect width="200" height="200" fill="url(#g4)"/><text x="100" y="95" text-anchor="middle" fill="#fff" font-family="Outfit,sans-serif" font-weight="900" font-size="22">OPEN</text><text x="100" y="122" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-weight="700" font-size="14">ORDER NOW</text></svg>`
    ),
  },
  {
    label: 'Favorit Hati',
    mask: 'heart',
    animation: 'bounce',
    width: 108,
    rotation: 4,
    imageUrl: makeSvgDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f43f5e"/><stop offset="100%" stop-color="#fb7185"/></linearGradient></defs><rect width="200" height="200" fill="url(#g5)"/><text x="100" y="106" text-anchor="middle" fill="#fff" font-family="Outfit,sans-serif" font-weight="900" font-size="20">BEST</text></svg>`
    ),
  },
];

export const createDefaultHomeWidget = (type: HomeWidgetType, id: string): HomeCustomWidgetData => {
  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        badge: 'BLOK TEKS',
        title: 'Judul Bagian Baru',
        body: 'Klik langsung teks ini untuk mengedit konten layaknya Notion atau Google Sites. Anda dapat menambahkan penjelasan layanan, pengumuman, atau cerita studio Anda di sini.',
        align: 'left',
        boxed: true,
      };
    case 'callout':
      return {
        id,
        type: 'callout',
        emoji: '✨',
        title: 'Info Penting atau Highlight Promo',
        body: 'Bagikan pengumuman singkat, slot proyek terbuka, atau catatan khusus agar langsung terlihat oleh pengunjung Beranda.',
        tone: 'accent',
        buttonText: 'Lihat Detail',
        buttonUrl: '#portfolio',
      };
    case 'image':
      return {
        id,
        type: 'image',
        title: 'Visual Showcase Banner',
        subtitle: 'Unggah gambar atau tempel URL foto pilihan Anda.',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1400&q=80',
        aspectRatio: '16/9',
      };
    case 'video':
      return {
        id,
        type: 'video',
        title: 'Video & Showreel Studio',
        subtitle: 'Tempel link YouTube atau unggah video MP4/WebM.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        badge: 'AKSI CEPAT',
        title: 'Siap Memulai Proyek Bersama Kami?',
        subtitle: 'Konsultasikan kebutuhan desain, branding, atau pengembangan website Anda sekarang.',
        buttonText: 'Hubungi Kami',
        buttonUrl: '#estimator',
      };
    case 'spacer':
      return {
        id,
        type: 'spacer',
        spacerHeight: 40,
        showDivider: true,
      };
    case 'sticker':
      return {
        id,
        type: 'sticker',
        title: 'Stiker & Badge Interaktif',
        subtitle: 'Contoh stiker bergaya LP Image — bebas tambah, ganti mask, animasi, atau unggah gambar stiker sendiri.',
        stickers: LP_IMAGE_STICKER_SAMPLES.slice(0, 3).map((s, idx) => ({
          ...s,
          id: `stk-${Date.now()}-${idx}`,
        })),
      };
    case 'quote':
      return {
        id,
        type: 'quote',
        body: 'Desain bukan sekadar tampilan, tapi bagaimana sesuatu bekerja dan terasa hangat bagi penggunanya.',
        title: 'Creative Principal',
        subtitle: 'sumr.day Studio',
      };
    case 'stats':
      return {
        id,
        type: 'stats',
        title: 'Pencapaian Studio',
        items: [
          { value: '150+', label: 'Proyek Selesai' },
          { value: '99%', label: 'Klien Puas' },
          { value: '24/7', label: 'Dukungan Aktif' },
        ],
      };
    case 'faq':
      return {
        id,
        type: 'faq',
        title: 'Pertanyaan Umum',
        items: [
          { q: 'Berapa lama estimasi pengerjaan?', a: 'Rata-rata 3–7 hari kerja tergantung skala dan fitur proyek.' },
          { q: 'Apakah bisa revisi desain?', a: 'Tentu, setiap paket sudah termasuk sesi revisi terstruktur.' },
        ],
      };
    case 'checklist':
      return {
        id,
        type: 'checklist',
        title: 'Keunggulan Layanan',
        items: [
          { text: 'Desain responsif rapi di desktop & mobile' },
          { text: 'Performa ringan & animasi halus 60fps' },
          { text: 'Konten mudah dikelola kapan saja' },
        ],
      };
    case 'gallery':
      return {
        id,
        type: 'gallery',
        title: 'Galeri Visual',
        items: [
          { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', caption: 'Visual 01' },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', caption: 'Visual 02' },
          { url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80', caption: 'Visual 03' },
        ],
      };
    case 'embed':
      return {
        id,
        type: 'embed',
        title: 'Tautan & Embed',
        subtitle: 'Akses dokumen, jadwal, atau portofolio eksternal kami.',
        buttonText: 'Buka Tautan',
        buttonUrl: 'https://sumr.day',
      };
    case 'promo':
      return {
        id,
        type: 'promo',
        badge: 'PENAWARAN SPESIAL',
        title: 'Diskon 20% Slot Bulan Ini',
        subtitle: 'Booking jadwal produksi sebelum kuota minggu ini penuh.',
        buttonText: 'Klaim Slot',
        buttonUrl: '#estimator',
      };
  }
};

const getMaskClipStyle = (mask: StickerMaskType): React.CSSProperties => {
  switch (mask) {
    case 'circle':
      return { borderRadius: '50%' };
    case 'squircle':
      return { borderRadius: '26%' };
    case 'rounded':
      return { borderRadius: '18px' };
    case 'heart':
      return {
        clipPath:
          'polygon(50% 90%, 15% 58%, 4% 38%, 8% 18%, 25% 10%, 42% 16%, 50% 28%, 58% 16%, 75% 10%, 92% 18%, 96% 38%, 85% 58%)',
      };
    case 'star':
      return {
        clipPath:
          'polygon(50% 2%, 63% 35%, 98% 35%, 70% 57%, 80% 92%, 50% 72%, 20% 92%, 30% 57%, 2% 35%, 37% 35%)',
      };
    case 'badge':
      return {
        clipPath:
          'polygon(50% 0%, 65% 8%, 82% 6%, 90% 22%, 100% 35%, 94% 52%, 100% 68%, 88% 82%, 78% 96%, 60% 94%, 50% 100%, 40% 94%, 22% 96%, 12% 82%, 0% 68%, 6% 52%, 0% 35%, 10% 22%, 18% 6%, 35% 8%)',
      };
    case 'shield':
      return { clipPath: 'polygon(50% 0%, 95% 14%, 88% 62%, 50% 100%, 12% 62%, 5% 14%)' };
    case 'hexagon':
      return { clipPath: 'polygon(25% 4%, 75% 4%, 98% 50%, 75% 96%, 25% 96%, 2% 50%)' };
    default:
      return { borderRadius: 12 };
  }
};

const getYoutubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const reg = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/;
  const match = url.match(reg);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : null;
};

interface LPHomeCustomWidgetProps {
  widget: HomeCustomWidgetData;
  isDark: boolean;
  accentColor?: string;
  isEditable?: boolean;
  onUpdate?: (next: HomeCustomWidgetData) => void;
}

export const LPHomeCustomWidget: React.FC<LPHomeCustomWidgetProps> = ({
  widget,
  isDark,
  accentColor = '#6366f1',
  isEditable = false,
  onUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  const patch = (partial: Partial<HomeCustomWidgetData>) => {
    onUpdate?.({ ...widget, ...partial });
  };

  const handleMediaUpload = async (
    kind: 'image' | 'video',
    e: React.ChangeEvent<HTMLInputElement>,
    stickerId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadToCloudinary(file, kind);
      if (res?.url) {
        if (stickerId) {
          const nextStickers = (widget.stickers || []).map((s) =>
            s.id === stickerId ? { ...s, imageUrl: res.url } : s
          );
          patch({ stickers: nextStickers });
        } else if (kind === 'image') {
          patch({ imageUrl: res.url });
        } else {
          patch({ videoUrl: res.url });
        }
      } else {
        setUploadError('Gagal mengunggah media. Periksa konfigurasi Cloudinary.');
      }
    } catch (err: any) {
      setUploadError('Gagal mengunggah: ' + (err?.message || 'Error jaringan'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const wrapStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 1240,
    margin: '0 auto',
    padding: widget.type === 'spacer' ? '12px clamp(16px, 3.5vw, 24px)' : 'clamp(28px, 4vw, 48px) clamp(16px, 3.5vw, 24px)',
    boxSizing: 'border-box',
  };

  if (widget.type === 'spacer') {
    return (
      <section style={wrapStyle}>
        <div
          style={{
            height: widget.spacerHeight ?? 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {widget.showDivider !== false && (
            <div style={{ width: '100%', height: 1, background: cardBorder }} />
          )}
          {isEditable && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 999,
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                fontSize: 11,
                fontWeight: 700,
                color: subTextColor,
              }}
            >
              <Minus size={12} />
              <span>Tinggi:</span>
              {[24, 48, 80].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => patch({ spacerHeight: h })}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 800,
                    background: widget.spacerHeight === h ? accentColor : 'transparent',
                    color: widget.spacerHeight === h ? '#fff' : textColor,
                  }}
                >
                  {h}px
                </button>
              ))}
              <button
                type="button"
                onClick={() => patch({ showDivider: widget.showDivider === false })}
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: `1px solid ${cardBorder}`,
                  background: 'transparent',
                  color: textColor,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {widget.showDivider !== false ? 'Garis: On' : 'Garis: Off'}
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (widget.type === 'text') {
    const isCenter = widget.align === 'center';
    return (
      <section style={wrapStyle}>
        <div
          data-card-3d={widget.boxed !== false ? 'true' : undefined}
          style={{
            background: widget.boxed !== false ? cardBg : 'transparent',
            border: widget.boxed !== false ? `1px solid ${cardBorder}` : 'none',
            borderRadius: 22,
            padding: widget.boxed !== false ? 'clamp(24px, 4vw, 40px)' : '8px 0',
            textAlign: isCenter ? 'center' : 'left',
            position: 'relative',
          }}
        >
          {isEditable && (
            <div style={{ display: 'flex', gap: 6, justifyContent: isCenter ? 'center' : 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => patch({ align: 'left' })}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: `1px solid ${cardBorder}`, cursor: 'pointer',
                  background: !isCenter ? `${accentColor}20` : 'transparent', color: !isCenter ? accentColor : subTextColor,
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                }}
              >
                <AlignLeft size={12} /> Kiri
              </button>
              <button
                type="button"
                onClick={() => patch({ align: 'center' })}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: `1px solid ${cardBorder}`, cursor: 'pointer',
                  background: isCenter ? `${accentColor}20` : 'transparent', color: isCenter ? accentColor : subTextColor,
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                }}
              >
                <AlignCenter size={12} /> Tengah
              </button>
              <button
                type="button"
                onClick={() => patch({ boxed: widget.boxed === false })}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: `1px solid ${cardBorder}`, cursor: 'pointer',
                  background: 'transparent', color: textColor, fontSize: 11, fontWeight: 700,
                }}
              >
                {widget.boxed !== false ? 'Kartu: Ya' : 'Kartu: Transparan'}
              </button>
            </div>
          )}

          {(widget.badge || isEditable) && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 999,
                background: `${accentColor}18`,
                color: accentColor,
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: '0.06em',
                marginBottom: 12,
              }}
            >
              <Type size={12} />
              {isEditable ? (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => patch({ badge: e.currentTarget.textContent || '' })}
                  style={{ outline: 'none', cursor: 'text' }}
                >
                  {widget.badge || 'BADGE'}
                </span>
              ) : (
                <span>{widget.badge}</span>
              )}
            </div>
          )}

          <h2
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(22px, 3vw, 34px)',
              fontWeight: 850,
              color: textColor,
              margin: '0 0 12px',
              outline: 'none',
              cursor: isEditable ? 'text' : 'default',
            }}
          >
            {widget.title}
          </h2>

          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => isEditable && patch({ body: e.currentTarget.textContent || '' })}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              lineHeight: 1.7,
              color: subTextColor,
              margin: isCenter ? '0 auto' : 0,
              maxWidth: 780,
              whiteSpace: 'pre-wrap',
              outline: 'none',
              cursor: isEditable ? 'text' : 'default',
            }}
          >
            {widget.body}
          </p>
        </div>
      </section>
    );
  }

  if (widget.type === 'callout') {
    const toneColor =
      widget.tone === 'success'
        ? '#10b981'
        : widget.tone === 'warning'
        ? '#f59e0b'
        : widget.tone === 'info'
        ? '#38bdf8'
        : accentColor;
    return (
      <section style={wrapStyle}>
        <div
          data-card-3d="true"
          style={{
            background: isDark ? `${toneColor}12` : `${toneColor}0d`,
            border: `1.5px solid ${toneColor}38`,
            borderRadius: 20,
            padding: 'clamp(20px, 3vw, 28px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 18,
            flexWrap: 'wrap',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: '1 1 320px' }}>
            <div
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => isEditable && patch({ emoji: e.currentTarget.textContent || '✨' })}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: `${toneColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
                outline: 'none',
                cursor: isEditable ? 'text' : 'default',
              }}
            >
              {widget.emoji || '✨'}
            </div>
            <div style={{ flex: 1 }}>
              <h3
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 19,
                  fontWeight: 800,
                  color: textColor,
                  margin: '0 0 6px',
                  outline: 'none',
                }}
              >
                {widget.title}
              </h3>
              <p
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => isEditable && patch({ body: e.currentTarget.textContent || '' })}
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: subTextColor,
                  margin: 0,
                  outline: 'none',
                }}
              >
                {widget.body}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {(widget.buttonText || isEditable) && (
              <a
                href={isEditable ? undefined : widget.buttonUrl || '#'}
                onClick={(e) => isEditable && e.preventDefault()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 999,
                  background: toneColor,
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <span
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => isEditable && patch({ buttonText: e.currentTarget.textContent || '' })}
                  style={{ outline: 'none' }}
                >
                  {widget.buttonText || 'Tombol'}
                </span>
                <ArrowUpRight size={14} />
              </a>
            )}
            {isEditable && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={widget.buttonUrl || ''}
                  onChange={(e) => patch({ buttonUrl: e.target.value })}
                  placeholder="Link URL tombol..."
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    color: textColor,
                    fontSize: 11,
                    width: 150,
                  }}
                />
                {(['accent', 'info', 'success', 'warning'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => patch({ tone: t })}
                    style={{
                      padding: '3px 7px',
                      borderRadius: 6,
                      border: `1px solid ${widget.tone === t ? toneColor : cardBorder}`,
                      background: 'transparent',
                      color: textColor,
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (widget.type === 'image') {
    return (
      <section style={wrapStyle}>
        <div
          data-card-3d="true"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 22,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {isEditable && (
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: `${accentColor}20`, color: accentColor, fontSize: 12, fontWeight: 750, cursor: isUploading ? 'wait' : 'pointer' }}>
                {isUploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>{isUploading ? 'Mengunggah...' : 'Unggah Gambar'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleMediaUpload('image', e)} style={{ display: 'none' }} disabled={isUploading} />
              </label>
              <input
                type="text"
                value={widget.imageUrl || ''}
                onChange={(e) => patch({ imageUrl: e.target.value })}
                placeholder="Atau tempel URL gambar..."
                style={{ flex: '1 1 220px', padding: '6px 10px', borderRadius: 8, border: `1px solid ${cardBorder}`, background: isDark ? '#0a0f1d' : '#fff', color: textColor, fontSize: 12 }}
              />
              {(['16/9', '21/9', '4/3', 'auto'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => patch({ aspectRatio: r })}
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: `1px solid ${cardBorder}`, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    background: widget.aspectRatio === r ? accentColor : 'transparent', color: widget.aspectRatio === r ? '#fff' : textColor,
                  }}
                >
                  {r}
                </button>
              ))}
              {uploadError && <span style={{ color: '#ef4444', fontSize: 11.5, fontWeight: 700 }}>{uploadError}</span>}
            </div>
          )}

          {widget.imageUrl && (
            <div style={{ width: '100%', aspectRatio: widget.aspectRatio && widget.aspectRatio !== 'auto' ? widget.aspectRatio : undefined, maxHeight: 620, overflow: 'hidden' }}>
              <img
                src={widget.imageUrl}
                alt={widget.title || 'Banner'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {(widget.title || widget.subtitle || isEditable) && (
            <div style={{ padding: '16px 22px' }}>
              <h3
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: textColor, margin: '0 0 4px', outline: 'none' }}
              >
                {widget.title}
              </h3>
              <p
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => isEditable && patch({ subtitle: e.currentTarget.textContent || '' })}
                style={{ fontSize: 13.5, color: subTextColor, margin: 0, outline: 'none' }}
              >
                {widget.subtitle}
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (widget.type === 'video') {
    const ytEmbed = getYoutubeEmbedUrl(widget.videoUrl || '');
    return (
      <section style={wrapStyle}>
        <div
          data-card-3d="true"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 22,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {isEditable && (
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: `${accentColor}20`, color: accentColor, fontSize: 12, fontWeight: 750, cursor: isUploading ? 'wait' : 'pointer' }}>
                {isUploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>{isUploading ? 'Mengunggah...' : 'Unggah Video'}</span>
                <input type="file" accept="video/*" onChange={(e) => handleMediaUpload('video', e)} style={{ display: 'none' }} disabled={isUploading} />
              </label>
              <input
                type="text"
                value={widget.videoUrl || ''}
                onChange={(e) => patch({ videoUrl: e.target.value })}
                placeholder="Tempel link YouTube atau URL MP4..."
                style={{ flex: '1 1 240px', padding: '6px 10px', borderRadius: 8, border: `1px solid ${cardBorder}`, background: isDark ? '#0a0f1d' : '#fff', color: textColor, fontSize: 12 }}
              />
              {uploadError && <span style={{ color: '#ef4444', fontSize: 11.5, fontWeight: 700 }}>{uploadError}</span>}
            </div>
          )}

          <div style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}>
            {ytEmbed ? (
              <iframe
                src={ytEmbed}
                title={widget.title || 'Video'}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : widget.videoUrl ? (
              <video src={widget.videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>

          {(widget.title || widget.subtitle || isEditable) && (
            <div style={{ padding: '16px 22px' }}>
              <h3
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: textColor, margin: '0 0 4px', outline: 'none' }}
              >
                {widget.title}
              </h3>
              <p
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => isEditable && patch({ subtitle: e.currentTarget.textContent || '' })}
                style={{ fontSize: 13.5, color: subTextColor, margin: 0, outline: 'none' }}
              >
                {widget.subtitle}
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (widget.type === 'quote') {
    return (
      <section style={wrapStyle}>
        <div
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderLeft: `4px solid ${accentColor}`,
            borderRadius: 22,
            padding: 'clamp(22px, 4vw, 36px)',
          }}
        >
          <QuoteIcon size={24} color={accentColor} style={{ marginBottom: 10, opacity: 0.85 }} />
          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => isEditable && patch({ body: e.currentTarget.textContent || '' })}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(17px, 2.2vw, 22px)',
              fontWeight: 750,
              lineHeight: 1.5,
              color: textColor,
              margin: '0 0 14px',
              outline: 'none',
            }}
          >
            “{widget.body}”
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
              style={{ fontSize: 13.5, fontWeight: 850, color: accentColor, outline: 'none' }}
            >
              {widget.title}
            </span>
            <span style={{ color: subTextColor, fontSize: 12 }}>•</span>
            <span
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => isEditable && patch({ subtitle: e.currentTarget.textContent || '' })}
              style={{ fontSize: 12.5, color: subTextColor, outline: 'none' }}
            >
              {widget.subtitle}
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (widget.type === 'stats') {
    const statItems = widget.items || [];
    return (
      <section style={wrapStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {statItems.map((st: any, i: number) => (
            <div
              key={i}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 20,
                padding: '20px 18px',
                textAlign: 'center',
              }}
            >
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (!isEditable) return;
                  const next = statItems.map((x: any, k: number) => (k === i ? { ...x, value: e.currentTarget.textContent || '' } : x));
                  patch({ items: next });
                }}
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 900, color: accentColor, outline: 'none' }}
              >
                {st.value}
              </div>
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (!isEditable) return;
                  const next = statItems.map((x: any, k: number) => (k === i ? { ...x, label: e.currentTarget.textContent || '' } : x));
                  patch({ items: next });
                }}
                style={{ fontSize: 12.5, fontWeight: 700, color: subTextColor, marginTop: 4, outline: 'none' }}
              >
                {st.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (widget.type === 'faq') {
    const faqs = widget.items || [];
    return (
      <section style={wrapStyle}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 22, padding: 'clamp(18px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <HelpCircle size={18} color={accentColor} />
            <h3
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
              style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 850, color: textColor, margin: 0, outline: 'none' }}
            >
              {widget.title || 'FAQ'}
            </h3>
          </div>
          {faqs.map((fq: any, i: number) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 14, border: `1px solid ${cardBorder}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)' }}>
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (!isEditable) return;
                  patch({ items: faqs.map((x: any, k: number) => (k === i ? { ...x, q: e.currentTarget.textContent || '' } : x)) });
                }}
                style={{ fontSize: 13.5, fontWeight: 800, color: textColor, marginBottom: 4, outline: 'none' }}
              >
                {fq.q}
              </div>
              <div
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (!isEditable) return;
                  patch({ items: faqs.map((x: any, k: number) => (k === i ? { ...x, a: e.currentTarget.textContent || '' } : x)) });
                }}
                style={{ fontSize: 12.5, color: subTextColor, lineHeight: 1.55, outline: 'none' }}
              >
                {fq.a}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (widget.type === 'checklist') {
    const list = widget.items || [];
    return (
      <section style={wrapStyle}>
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 22, padding: 'clamp(18px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
            style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 850, color: textColor, margin: '0 0 4px', outline: 'none' }}
          >
            {widget.title || 'Checklist'}
          </h3>
          {list.map((it: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={17} color={accentColor} style={{ flexShrink: 0 }} />
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => {
                  if (!isEditable) return;
                  patch({ items: list.map((x: any, k: number) => (k === i ? { ...x, text: e.currentTarget.textContent || '' } : x)) });
                }}
                style={{ fontSize: 14, color: textColor, fontWeight: 600, outline: 'none' }}
              >
                {it.text}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (widget.type === 'gallery') {
    const imgs = widget.items || [];
    return (
      <section style={wrapStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {imgs.map((img: any, i: number) => (
            <div key={i} style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${cardBorder}`, background: cardBg }}>
              <img src={img.url} alt={img.caption || ''} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              {img.caption && (
                <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: subTextColor }}>{img.caption}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (widget.type === 'embed' || widget.type === 'promo') {
    const isPromo = widget.type === 'promo';
    return (
      <section style={wrapStyle}>
        <div
          style={{
            background: isPromo ? `linear-gradient(135deg, ${accentColor}1f 0%, ${cardBg} 100%)` : cardBg,
            border: `1.5px solid ${isPromo ? `${accentColor}45` : cardBorder}`,
            borderRadius: 22,
            padding: 'clamp(20px, 4vw, 32px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 200, flex: 1 }}>
            {widget.badge && (
              <span style={{ fontSize: 10.5, fontWeight: 900, color: accentColor, letterSpacing: '0.08em' }}>{widget.badge}</span>
            )}
            <h3
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
              style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 850, color: textColor, margin: 0, outline: 'none' }}
            >
              {widget.title}
            </h3>
            {widget.subtitle && (
              <p
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => isEditable && patch({ subtitle: e.currentTarget.textContent || '' })}
                style={{ fontSize: 13.5, color: subTextColor, margin: 0, outline: 'none' }}
              >
                {widget.subtitle}
              </p>
            )}
          </div>
          <a
            href={isEditable ? undefined : widget.buttonUrl || '#'}
            onClick={(e) => isEditable && e.preventDefault()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 999,
              background: accentColor,
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{widget.buttonText || 'Buka'}</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
    );
  }

  if (widget.type === 'cta') {
    return (
      <section style={wrapStyle}>
        <div
          data-card-3d="true"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 24,
            padding: 'clamp(28px, 5vw, 52px) clamp(20px, 4vw, 40px)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            position: 'relative',
          }}
        >
          <span
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => isEditable && patch({ badge: e.currentTarget.textContent || '' })}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              background: `${accentColor}18`,
              color: accentColor,
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.07em',
              outline: 'none',
            }}
          >
            {widget.badge || 'CTA'}
          </span>

          <h2
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(24px, 3.4vw, 38px)',
              fontWeight: 850,
              color: textColor,
              margin: 0,
              maxWidth: 720,
              outline: 'none',
            }}
          >
            {widget.title}
          </h2>

          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => isEditable && patch({ subtitle: e.currentTarget.textContent || '' })}
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: subTextColor,
              margin: 0,
              maxWidth: 620,
              outline: 'none',
            }}
          >
            {widget.subtitle}
          </p>

          <a
            href={isEditable ? undefined : widget.buttonUrl || '#'}
            onClick={(e) => isEditable && e.preventDefault()}
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 999,
              background: accentColor,
              color: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            <span
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => isEditable && patch({ buttonText: e.currentTarget.textContent || '' })}
              style={{ outline: 'none' }}
            >
              {widget.buttonText || 'Mulai Sekarang'}
            </span>
            <ArrowUpRight size={16} />
          </a>

          {isEditable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Link2 size={13} color={subTextColor} />
              <input
                type="text"
                value={widget.buttonUrl || ''}
                onChange={(e) => patch({ buttonUrl: e.target.value })}
                placeholder="URL tujuan (contoh: /katalog atau #estimator)"
                style={{
                  padding: '5px 10px',
                  borderRadius: 8,
                  border: `1px solid ${cardBorder}`,
                  background: isDark ? '#0a0f1d' : '#fff',
                  color: textColor,
                  fontSize: 12,
                  width: 260,
                }}
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  // STICKER SHOWCASE WIDGET (Sampled from LP Image)
  const stickers = widget.stickers || [];
  const selectedSticker = stickers.find((s) => s.id === selectedStickerId) || stickers[0] || null;

  return (
    <section style={wrapStyle}>
      <style>{`
        @keyframes homeStkFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes homeStkBounce { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-10px) scale(1.04); } }
        @keyframes homeStkSwing { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
        @keyframes homeStkPop { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
        @keyframes homeStkPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.92; } }
        @keyframes homeStkSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div
        data-card-3d="true"
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 24,
          padding: 'clamp(24px, 4vw, 38px)',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h3
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => isEditable && patch({ title: e.currentTarget.textContent || '' })}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(20px, 2.8vw, 28px)',
              fontWeight: 850,
              color: textColor,
              margin: '0 0 6px',
              outline: 'none',
            }}
          >
            {widget.title || 'Stiker & Badge Interaktif'}
          </h3>
          {(widget.subtitle || isEditable) && (
            <p
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => isEditable && patch({ subtitle: e.currentTarget.textContent || '' })}
              style={{ fontSize: 13.5, color: subTextColor, margin: 0, outline: 'none' }}
            >
              {widget.subtitle}
            </p>
          )}
        </div>

        {/* Sticker Display Grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(18px, 3vw, 34px)',
            padding: '10px 0',
          }}
        >
          {stickers.map((stk) => {
            const animName =
              stk.animation === 'float'
                ? 'homeStkFloat 3.4s ease-in-out infinite'
                : stk.animation === 'bounce'
                ? 'homeStkBounce 2.6s ease-in-out infinite'
                : stk.animation === 'swing'
                ? 'homeStkSwing 3.2s ease-in-out infinite'
                : stk.animation === 'pop'
                ? 'homeStkPop 2.4s ease-in-out infinite'
                : stk.animation === 'pulse'
                ? 'homeStkPulse 2.8s ease-in-out infinite'
                : stk.animation === 'spin'
                ? 'homeStkSpin 14s linear infinite'
                : undefined;

            const isSelected = isEditable && selectedSticker?.id === stk.id;
            const inner = (
              <div
                onClick={() => isEditable && setSelectedStickerId(stk.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: isEditable || stk.linkUrl ? 'pointer' : 'default',
                  padding: 8,
                  borderRadius: 16,
                  outline: isSelected ? `2px solid ${accentColor}` : 'none',
                  background: isSelected ? `${accentColor}12` : 'transparent',
                }}
              >
                <div style={{ transform: `rotate(${stk.rotation || 0}deg)` }}>
                  <div
                    style={{
                      width: stk.width || 110,
                      height: stk.width || 110,
                      overflow: 'hidden',
                      animation: animName,
                      ...getMaskClipStyle(stk.mask),
                    }}
                  >
                    <img
                      src={stk.imageUrl}
                      alt={stk.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </div>
                {stk.label && (
                  <span style={{ fontSize: 12, fontWeight: 750, color: subTextColor }}>{stk.label}</span>
                )}
              </div>
            );

            if (!isEditable && stk.linkUrl) {
              return (
                <a key={stk.id} href={stk.linkUrl} style={{ textDecoration: 'none' }}>
                  {inner}
                </a>
              );
            }
            return <React.Fragment key={stk.id}>{inner}</React.Fragment>;
          })}
        </div>

        {/* Editable Controls for LP Image Sample Stickers */}
        {isEditable && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: `1px dashed ${cardBorder}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: textColor, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Tag size={13} color={accentColor} /> Tambah Contoh Stiker LP Image:
              </span>
              {LP_IMAGE_STICKER_SAMPLES.map((sample, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    const created: HomeStickerItem = {
                      ...sample,
                      id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    };
                    patch({ stickers: [...stickers, created] });
                    setSelectedStickerId(created.id);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${cardBorder}`,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: textColor,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={11} />
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>

            {selectedSticker && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(15,23,42,0.03)',
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  value={selectedSticker.label}
                  onChange={(e) =>
                    patch({
                      stickers: stickers.map((s) =>
                        s.id === selectedSticker.id ? { ...s, label: e.target.value } : s
                      ),
                    })
                  }
                  placeholder="Label stiker"
                  style={{
                    padding: '5px 9px',
                    borderRadius: 8,
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    color: textColor,
                    fontSize: 12,
                    width: 130,
                  }}
                />

                <select
                  value={selectedSticker.mask}
                  onChange={(e) =>
                    patch({
                      stickers: stickers.map((s) =>
                        s.id === selectedSticker.id ? { ...s, mask: e.target.value as StickerMaskType } : s
                      ),
                    })
                  }
                  style={{
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    color: textColor,
                    fontSize: 12,
                  }}
                >
                  {(['none', 'circle', 'squircle', 'rounded', 'heart', 'star', 'badge', 'shield', 'hexagon'] as StickerMaskType[]).map((m) => (
                    <option key={m} value={m}>Mask: {m}</option>
                  ))}
                </select>

                <select
                  value={selectedSticker.animation}
                  onChange={(e) =>
                    patch({
                      stickers: stickers.map((s) =>
                        s.id === selectedSticker.id ? { ...s, animation: e.target.value as StickerAnimType } : s
                      ),
                    })
                  }
                  style={{
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    color: textColor,
                    fontSize: 12,
                  }}
                >
                  {(['none', 'float', 'bounce', 'swing', 'pop', 'pulse', 'spin'] as StickerAnimType[]).map((a) => (
                    <option key={a} value={a}>Anim: {a}</option>
                  ))}
                </select>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: subTextColor }}>
                  Ukuran
                  <input
                    type="range"
                    min={64}
                    max={200}
                    value={selectedSticker.width || 110}
                    onChange={(e) =>
                      patch({
                        stickers: stickers.map((s) =>
                          s.id === selectedSticker.id ? { ...s, width: Number(e.target.value) } : s
                        ),
                      })
                    }
                  />
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: `${accentColor}20`, color: accentColor, fontSize: 11.5, fontWeight: 750, cursor: 'pointer' }}>
                  <Upload size={12} />
                  <span>Ganti Gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMediaUpload('image', e, selectedSticker.id)}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const remaining = stickers.filter((s) => s.id !== selectedSticker.id);
                    patch({ stickers: remaining });
                    setSelectedStickerId(remaining[0]?.id || null);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.35)',
                    background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    fontSize: 11.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} /> Hapus Stiker
                </button>
              </div>
            )}

            {uploadError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ef4444', fontWeight: 700 }}>
                <AlertCircle size={13} />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default LPHomeCustomWidget;
