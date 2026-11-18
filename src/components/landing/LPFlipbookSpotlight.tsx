import React, { useEffect, useState } from 'react';
import { BookOpen, Upload, Link2, Sparkles, RefreshCw, FileText, Download, AlertCircle } from 'lucide-react';
import PdfFlipbookViewer from '../common/PdfFlipbookViewer';
import { uploadToCloudinary } from '../../utils/cloudinary';

interface LPFlipbookSpotlightProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  pdfUrl?: string;
  totalPages?: number;
  bookTitle?: string;
  height?: string | number;
  isDark: boolean;
  accentColor?: string;
  isEditable?: boolean;
  defaultViewMode?: 'double' | 'single';
  allowDownload?: boolean;
  paperAspectRatio?: number;
  onUpdateBadge?: (badge: string) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateSubtitle?: (subtitle: string) => void;
  onUpdatePdfUrl?: (url: string) => void;
  onUpdateTotalPages?: (pages: number) => void;
  onUpdateDefaultViewMode?: (mode: 'double' | 'single') => void;
  onUpdateAllowDownload?: (allow: boolean) => void;
}

export const LPFlipbookSpotlight: React.FC<LPFlipbookSpotlightProps> = ({
  badge = 'EDITORIAL & BRAND BOOK',
  title = 'Katalog & Brand Guidelines Interaktif',
  subtitle = 'Buka dan rasakan pengalaman membaca dokumen panduan visual, rate card, dan studi kasus studio layaknya membuka majalah fisik.',
  pdfUrl,
  totalPages = 8,
  bookTitle = 'sumr.day Studio Brand Guide',
  height = '620px',
  isDark,
  accentColor = '#f59e0b',
  isEditable = false,
  defaultViewMode,
  allowDownload = true,
  paperAspectRatio,
  onUpdateBadge,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdatePdfUrl,
  onUpdateTotalPages,
  onUpdateDefaultViewMode,
  onUpdateAllowDownload
}) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState(pdfUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setCustomInputUrl(pdfUrl || '');
  }, [pdfUrl]);

  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Mohon pilih berkas dengan format .pdf');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      // Upload raw PDF to Cloudinary
      const res = await uploadToCloudinary(file, 'raw');
      if (res?.url) {
        onUpdatePdfUrl?.(res.url);
        setCustomInputUrl(res.url);
      } else {
        setUploadError('Gagal mengunggah PDF ke cloud. Periksa konfigurasi Cloudinary atau ukuran berkas.');
      }
    } catch (err: any) {
      console.error('Gagal mengunggah PDF ke Cloudinary:', err);
      setUploadError('Gagal mengunggah PDF: ' + (err?.message || 'Error jaringan'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <section
      id="flipbook-spotlight"
      style={{
        position: 'relative',
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        maxWidth: 1240,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Section Header */}
        <div data-reveal="true" style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 100,
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
            color: accentColor,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 14
          }}>
            <BookOpen size={13} />
            {isEditable ? (
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateBadge?.(e.currentTarget.textContent || badge)}
                style={{ outline: 'none', cursor: 'text' }}
              >
                {badge}
              </span>
            ) : (
              badge
            )}
          </div>

          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 850,
            lineHeight: 1.2,
            color: textColor,
            margin: '0 0 14px'
          }}>
            {isEditable ? (
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateTitle?.(e.currentTarget.textContent || title)}
                style={{ outline: 'none', cursor: 'text' }}
              >
                {title}
              </span>
            ) : (
              title
            )}
          </h2>

          <p style={{
            fontSize: 'clamp(14px, 1.8vw, 16px)',
            lineHeight: 1.6,
            color: subTextColor,
            margin: 0
          }}>
            {isEditable ? (
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onUpdateSubtitle?.(e.currentTarget.textContent || subtitle)}
                style={{ outline: 'none', cursor: 'text' }}
              >
                {subtitle}
              </span>
            ) : (
              subtitle
            )}
          </p>
        </div>

        {/* Top Control Bar in Edit Mode (Floating Minimal Pill) */}
        {isEditable && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 12,
            margin: '0 auto',
            padding: '8px 18px',
            borderRadius: 100,
            background: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} color={accentColor} />
              <span style={{ fontSize: 12, fontWeight: 750, color: textColor }}>
                PDF: <code style={{ fontSize: 11, color: accentColor, background: `${accentColor}15`, padding: '2px 8px', borderRadius: 6 }}>{pdfUrl ? pdfUrl.split('/').pop() : 'Editorial Default Mode'}</code>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 999,
                background: `${accentColor}25`,
                border: `1px solid ${accentColor}50`,
                color: accentColor,
                fontSize: 12,
                fontWeight: 750,
                cursor: isUploading ? 'wait' : 'pointer'
              }}>
                {isUploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>{isUploading ? 'Mengunggah...' : 'Unggah PDF'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: `1px solid ${cardBorder}`,
                  color: textColor,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                <Link2 size={13} />
                <span>{showUrlInput ? 'Tutup URL' : 'Input URL'}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateAllowDownload?.(!allowDownload)}
                title={allowDownload ? "Izin unduh aktif. Klik untuk melarang pengunjung mengunduh berkas" : "Izin unduh nonaktif. Klik untuk mengizinkan pengunjung mengunduh berkas"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: allowDownload ? `${accentColor}25` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  border: `1px solid ${allowDownload ? accentColor + '60' : cardBorder}`,
                  color: allowDownload ? accentColor : subTextColor,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Download size={13} />
                <span>Unduh PDF: {allowDownload ? 'Diizinkan' : 'Dinonaktifkan'}</span>
              </button>
            </div>

            {uploadError && (
              <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: '#ef4444'
              }}>
                <AlertCircle size={13} />
                <span>{uploadError}</span>
              </div>
            )}

            {showUrlInput && (
              <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 4, justifyContent: 'center' }}>
                <input
                  type="text"
                  value={customInputUrl}
                  onChange={(e) => setCustomInputUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../guideline.pdf"
                  style={{
                    width: 320,
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: `1px solid ${accentColor}50`,
                    background: isDark ? '#0a0f1d' : '#ffffff',
                    color: textColor,
                    fontSize: 12,
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdatePdfUrl) onUpdatePdfUrl(customInputUrl.trim());
                    setShowUrlInput(false);
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    background: accentColor,
                    color: '#000',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Terapkan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Direct Floating Physical Flipbook (Tanpa Kotak Kontener Pembungkus) */}
        <div data-reveal="true" className="reveal-delay-1" style={{ width: '100%', position: 'relative' }}>
          <PdfFlipbookViewer
            pdfUrl={pdfUrl}
            totalPages={totalPages}
            title={bookTitle}
            height={height}
            isDark={isDark}
            accentColor={accentColor}
            defaultViewMode={defaultViewMode || 'double'}
            showModeSwitch={isEditable}
            isEditable={isEditable}
            allowDownload={allowDownload}
            paperAspectRatio={paperAspectRatio}
            onViewModeChange={onUpdateDefaultViewMode}
            onTotalPagesDetected={onUpdateTotalPages}
          />
        </div>
      </div>
    </section>
  );
};

export default LPFlipbookSpotlight;
