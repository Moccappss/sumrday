import React, { useEffect, useState } from 'react';
import { Box, Sparkles, Upload, Link2, RefreshCw, AlertCircle } from 'lucide-react';
import Model3DViewer from '../common/Model3DViewer';
import { uploadToCloudinary } from '../../utils/cloudinary';

interface LPModel3DSpotlightProps {
  isDark?: boolean;
  accentColor?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  modelUrl?: string;
  height?: string;
  autoRotate?: boolean;
  isEditable?: boolean;
  onUpdateBadge?: (val: string) => void;
  onUpdateTitle?: (val: string) => void;
  onUpdateSubtitle?: (val: string) => void;
  onUpdateModelUrl?: (val: string) => void;
  onUpdateHeight?: (val: string) => void;
}

export const LPModel3DSpotlight: React.FC<LPModel3DSpotlightProps> = ({
  isDark = true,
  accentColor = '#f59e0b',
  badge = 'SPATIAL & 3D SHOWCASE',
  title = 'Eksplorasi Desain 3D Interaktif',
  subtitle = 'Putar secara bebas 360°, amati pencahayaan material fotorealistik, dan rasakan kedalaman objek nyata langsung di browser Anda.',
  modelUrl = '/models/armchair.glb',
  height = '520px',
  autoRotate = true,
  isEditable = false,
  onUpdateBadge,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateModelUrl,
  onUpdateHeight
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [customInputUrl, setCustomInputUrl] = useState(modelUrl || '');
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    setCustomInputUrl(modelUrl || '');
  }, [modelUrl]);

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
      setUploadError('Format berkas harus .glb atau .gltf.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadToCloudinary(file, 'raw');
      if (res?.url) {
        onUpdateModelUrl?.(res.url);
        setCustomInputUrl(res.url);
      } else {
        setUploadError('Gagal mengunggah model 3D ke cloud. Periksa konfigurasi Cloudinary atau ukuran berkas.');
      }
    } catch (err: any) {
      setUploadError('Gagal mengunggah model 3D: ' + (err?.message || 'Error jaringan'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <section
      id="model3d"
      style={{
        position: 'relative',
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        background: isDark ? '#06070a' : '#eef2f6',
        borderBottom: `1px solid ${cardBorder}`,
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Header Section */}
        <div data-reveal="true" style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 36px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 14px',
            borderRadius: 100,
            background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
            border: `1px solid ${cardBorder}`,
            color: isDark ? '#ffffff' : '#0f172a',
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: '0.08em',
            marginBottom: 16
          }}>
            <Box size={13} />
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
              <span>{badge}</span>
            )}
          </div>

          {/* Title */}
          <h2 style={{
            margin: '0 0 14px',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 850,
            color: textColor,
            letterSpacing: '-0.025em',
            lineHeight: 1.18
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

          {/* Subtitle */}
          <p style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(14px, 1.8vw, 16px)',
            color: subTextColor,
            lineHeight: 1.6
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

        {/* 3D Showcase Container Card */}
        <div
          data-reveal="true"
          className="reveal-delay-1"
          style={{
            position: 'relative',
            borderRadius: 24,
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: 'none',
            overflow: 'hidden'
          }}>

          {/* Top Control Bar in Edit Mode */}
          {isEditable && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 18px',
              borderBottom: `1px solid ${cardBorder}`,
              background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
              flexWrap: 'wrap',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Box size={14} color={accentColor} />
                <span style={{ fontSize: 12, fontWeight: 750, color: textColor }}>
                  Model URL: <code style={{ fontSize: 11, color: subTextColor, background: `${accentColor}10`, padding: '2px 6px', borderRadius: 4 }}>{modelUrl ? modelUrl.split('/').pop() : 'Belum dipilih'}</code>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Cloud Upload Button */}
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 8,
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                  color: accentColor,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: isUploading ? 'wait' : 'pointer'
                }}>
                  {isUploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                  <span>{isUploading ? 'Mengunggah...' : 'Unggah File .glb'}</span>
                  <input
                    type="file"
                    accept=".glb,.gltf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={isUploading}
                  />
                </label>

                {/* Ganti URL Manual */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${cardBorder}`,
                    color: textColor,
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  <Link2 size={13} />
                  <span>{showUrlInput ? 'Tutup URL' : 'Input URL / Path'}</span>
                </button>
              </div>

              {uploadError && (
                <div style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ef4444'
                }}>
                  <AlertCircle size={13} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Collapsible Input URL */}
              {showUrlInput && (
                <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 6 }}>
                  <input
                    type="text"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="Contoh: /models/kursi.glb atau https://...glb"
                    style={{
                      flex: 1,
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
                      if (onUpdateModelUrl) onUpdateModelUrl(customInputUrl.trim());
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

          {/* 3D Model Canvas Viewer */}
          <div style={{ width: '100%', height, position: 'relative' }}>
            <Model3DViewer
              src={modelUrl}
              autoRotate={autoRotate}
              cameraControls={true}
              height={height}
              accentColor={accentColor}
              isDark={isDark}
              allowLocalUpload={Boolean(isEditable)}
            />
          </div>

        </div>

      </div>
    </section>
  );
};

export default LPModel3DSpotlight;
