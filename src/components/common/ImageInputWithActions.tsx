import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, RefreshCw, LayoutTemplate, Wand2, Film } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { compressImageForStorage, optimizeMediaUrl } from '../../utils/smartMediaOptimizer';
import { soundEffects } from '../../utils/soundEffects';
import MediaGalleryModal from '../admin/MediaGalleryModal';

export interface ImageInputWithActionsProps {
  value?: string | null;
  onChange: (url: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  accept?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  maxSizeMB?: number;
  showGallery?: boolean;
  showBannerStudio?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const ImageInputWithActions: React.FC<ImageInputWithActionsProps> = ({
  value = '',
  onChange,
  placeholder = 'Tempel URL, drag & drop, atau Ctrl+V gambar...',
  label,
  helperText,
  accept = 'image/*',
  resourceType = 'auto',
  maxSizeMB = 15,
  showGallery = true,
  showBannerStudio = true,
  style,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'all' | 'banner-studio'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewError(false);
    setErrorMsg(null);
  }, [value]);

  const processAndUploadFile = async (file: File) => {
    if (disabled || isUploading) return;
    setErrorMsg(null);

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      soundEffects.play('error');
      setErrorMsg(`Ukuran file maksimal ${maxSizeMB} MB.`);
      return;
    }

    setIsUploading(true);
    soundEffects.play('click');

    try {
      let fileToUpload: File | Blob = file;
      const isRasterImage = file.type.startsWith('image/') && !file.type.includes('svg') && !file.type.includes('gif');
      if (isRasterImage) {
        try {
          const compressed = await compressImageForStorage(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.84,
          });
          if (compressed.compressedBytes < file.size) {
            fileToUpload = new File([compressed.blob], file.name.replace(/\.[^.]+$/, '.webp'), {
              type: compressed.blob.type || 'image/webp',
            });
          }
        } catch {
          // Fallback to original file if client-side compression fails
        }
      }

      const detectedType = resourceType !== 'auto'
        ? resourceType
        : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('image/')
            ? 'image'
            : 'auto';

      const res = await uploadToCloudinary(fileToUpload, detectedType);
      if (res?.url) {
        onChange(res.url);
        soundEffects.play('success');
      } else {
        throw new Error('Gagal mendapatkan URL media.');
      }
    } catch (err: any) {
      soundEffects.play('error');
      setErrorMsg(err?.message || 'Gagal mengunggah media.');
      console.error('Media upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled || isUploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await processAndUploadFile(file);
          return;
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const handleNormalizeUrl = () => {
    if (!value) return;
    const trimmed = value.trim();
    if (trimmed.includes('res.cloudinary.com') || trimmed.includes('drive.google.com/file/d/')) {
      const optimized = optimizeMediaUrl(trimmed);
      if (optimized && optimized !== value) {
        onChange(optimized);
      }
    }
  };

  const isVideoValue = Boolean(value && /\.(mp4|webm|mov)(\?|$)/i.test(value));

  return (
    <div className="cms-media-input-wrap" style={style}>
      {label && <label className="cms-media-input-label">{label}</label>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`cms-media-input-row${isDragging ? ' is-dragging' : ''}`}
      >
        {/* Thumbnail preview badge */}
        {value && !previewError && (
          <div className="cms-media-input-thumb">
            {isVideoValue ? (
              <Film size={15} style={{ color: 'var(--cms-accent, #D95629)' }} />
            ) : (
              <img
                src={value}
                alt="Preview"
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setPreviewError(true)}
              />
            )}
          </div>
        )}

        {/* URL Text Input with Paste & Auto-Optimize */}
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleNormalizeUrl}
          onPaste={handlePaste}
          placeholder={isDragging ? 'Lepaskan file untuk mengunggah...' : placeholder}
          disabled={disabled}
          className="cms-media-input-field"
        />

        {/* Magic Cloudinary Optimizer Button */}
        {value && value.includes('cloudinary.com') && !value.includes('f_auto') && (
          <button
            type="button"
            onClick={() => {
              soundEffects.play('pop');
              onChange(optimizeMediaUrl(value));
              soundEffects.play('success');
            }}
            className="cms-media-icon-btn is-info"
            title="Optimasikan Gambar (WebP & q_auto Otomatis)"
          >
            <Wand2 size={13} />
          </button>
        )}

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              onChange('');
            }}
            className="cms-media-icon-btn is-ghost"
            title="Hapus media"
          >
            <X size={13} />
          </button>
        )}

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="cms-media-icon-btn"
          style={{ cursor: isUploading ? 'wait' : undefined }}
          title="Unggah dari perangkat (otomatis dikompresi)"
        >
          {isUploading ? <RefreshCw size={14} className="cms-spin" /> : <Upload size={14} />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={handleUpload}
        />

        {/* Gallery & Stock Button */}
        {showGallery && (
          <button
            type="button"
            onClick={() => {
              soundEffects.play('pop');
              setGalleryTab('all');
              setIsGalleryOpen(true);
            }}
            disabled={disabled}
            className="cms-media-icon-btn is-primary"
            title="Buka galeri & stock foto"
          >
            <ImageIcon size={14} />
          </button>
        )}

        {/* Banner Studio Generator Button */}
        {showBannerStudio && (
          <button
            type="button"
            onClick={() => {
              soundEffects.play('pop');
              setGalleryTab('banner-studio');
              setIsGalleryOpen(true);
            }}
            disabled={disabled}
            className="cms-media-icon-btn is-accent"
            title="Buat banner & poster otomatis"
          >
            <LayoutTemplate size={14} />
          </button>
        )}
      </div>

      {errorMsg && (
        <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>
          {errorMsg}
        </span>
      )}
      {!errorMsg && helperText && (
        <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)' }}>
          {helperText}
        </span>
      )}

      {/* Reusable Gallery Modal */}
      {isGalleryOpen && (
        <MediaGalleryModal
          isOpen={isGalleryOpen}
          initialTab={galleryTab}
          onClose={() => setIsGalleryOpen(false)}
          onSelect={(url) => {
            onChange(url);
            setIsGalleryOpen(false);
          }}
        />
      )}
    </div>
  );
};
