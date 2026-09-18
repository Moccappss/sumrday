import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, Check, Copy, Sparkles } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { googleSync } from '../../utils/googleSync';
import { storage } from '../../utils/storage';
import MediaGalleryModal from '../admin/MediaGalleryModal';

export interface MediaPickerFieldProps {
  label?: string;
  value?: string | null;
  onChange: (url: string) => void;
  aspectRatio?: '16/9' | '1/1' | '4/3' | '3/4' | 'auto';
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  allowDelete?: boolean;
  folderCategory?: string;
  storageTarget?: 'cloudinary' | 'drive' | 'auto';
}

export const MediaPickerField: React.FC<MediaPickerFieldProps> = ({
  label,
  value,
  onChange,
  aspectRatio = '16/9',
  placeholder = 'Unggah gambar atau pilih dari galeri',
  helperText,
  disabled = false,
  allowDelete = true,
  folderCategory = 'Media_Uploads',
  storageTarget = 'auto'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      let uploadedUrl = '';
      
      // Determine storage target
      if (storageTarget === 'drive') {
        uploadedUrl = await googleSync.uploadFileToDrive(file, null, folderCategory);
      } else {
        // Default to Cloudinary (with fallback to storage / data uri)
        const res = await uploadToCloudinary(file);
        uploadedUrl = res.url;
      }

      if (uploadedUrl) {
        onChange(uploadedUrl);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Gagal mengunggah gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 12, fontWeight: 750, color: 'var(--cms-text, #f1f5f9)' }}>
            {label}
          </label>
          {value && (
            <button
              type="button"
              onClick={handleCopyUrl}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--cms-text-muted, #94a3b8)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 6px',
                borderRadius: 4
              }}
              title="Salin URL gambar"
            >
              {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
              <span>{copied ? 'Tersalin' : 'Salin URL'}</span>
            </button>
          )}
        </div>
      )}

      {/* Preview Card or Upload Placeholder */}
      {value ? (
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspectRatio === 'auto' ? undefined : aspectRatio,
          minHeight: aspectRatio === 'auto' ? 120 : undefined,
          maxHeight: 220,
          borderRadius: 14,
          overflow: 'hidden',
          border: '1.5px solid var(--glass-border, rgba(255,255,255,0.1))',
          background: 'var(--cms-switcher-bg, rgba(0,0,0,0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--cms-shadow-sm, 0 4px 12px rgba(0,0,0,0.15))'
        }}>
          <img
            src={value}
            alt="Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Broken image fallback
              (e.target as HTMLElement).style.display = 'none';
            }}
          />

          {/* Action Overlay Buttons */}
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 6,
            zIndex: 10
          }}>
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 750,
                cursor: 'pointer'
              }}
              title="Pilih gambar lain dari galeri"
            >
              <ImageIcon size={12} />
              <span>Galeri</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 8,
                background: 'var(--cms-accent, #7c3aed)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 750,
                cursor: isUploading ? 'wait' : 'pointer'
              }}
              title="Ganti gambar dengan upload file baru"
            >
              {isUploading ? <Loader2 size={12} className="cms-spin" /> : <Upload size={12} />}
              <span>Ganti</span>
            </button>

            {allowDelete && (
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Hapus gambar"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload Zone with Dual Actions (Upload & Gallery) */
        <div
          style={{
            width: '100%',
            padding: '18px 14px',
            borderRadius: 14,
            border: '2px dashed var(--glass-border, rgba(255,255,255,0.15))',
            background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12)',
            color: 'var(--cms-accent, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ImageIcon size={20} />
          </div>

          <div style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', fontWeight: 600 }}>
            {placeholder}
          </div>

          {/* Dual Action Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              style={{
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                background: 'var(--cms-accent, #7c3aed)',
                border: 'none',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: isUploading ? 'wait' : 'pointer',
                boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)'
              }}
            >
              {isUploading ? <Loader2 size={13} className="cms-spin" /> : <Upload size={13} />}
              <span>{isUploading ? 'Mengunggah...' : 'Unggah Berkas'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              disabled={disabled}
              style={{
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                color: 'var(--cms-text, #f1f5f9)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <ImageIcon size={13} />
              <span>Buka Galeri</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
          e.target.value = '';
        }}
      />

      {helperText && (
        <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
          {helperText}
        </div>
      )}

      {errorMsg && (
        <div style={{ fontSize: 11.5, color: '#ef4444', fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Unified Media Gallery Modal */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setIsGalleryOpen(false);
        }}
      />
    </div>
  );
};

export default MediaPickerField;
