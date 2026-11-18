import React, { useState, useRef } from 'react';
import { 
  Paperclip, Upload, Download, Trash2, ExternalLink, 
  FileText, Image as ImageIcon, Film, Music, Archive, 
  FileCode, FileCheck, Loader2, HardDrive
} from 'lucide-react';
import { googleSync } from '../../utils/googleSync';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { storage } from '../../utils/storage';

export interface DriveAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  downloadUrl?: string;
  driveId?: string;
  uploadedAt: string;
  storageProvider?: 'google_drive' | 'cloudinary' | 'local';
}

interface DriveAttachmentPickerProps {
  attachments?: DriveAttachment[];
  onChange: (attachments: DriveAttachment[]) => void;
  folderCategory?: string;
  maxFiles?: number;
  readOnly?: boolean;
  notify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onInsertToNote?: (attachment: DriveAttachment) => void;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(type: string, name: string) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return <ImageIcon size={15} color="#3b82f6" />;
  }
  if (type.includes('pdf') || ext === 'pdf') {
    return <FileText size={15} color="#ef4444" />;
  }
  if (type.startsWith('video/') || ['mp4', 'mkv', 'mov', 'webm'].includes(ext)) {
    return <Film size={15} color="#8b5cf6" />;
  }
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return <Music size={15} color="#10b981" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <Archive size={15} color="#f59e0b" />;
  }
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'py'].includes(ext)) {
    return <FileCode size={15} color="#06b6d4" />;
  }
  return <FileCheck size={15} color="var(--cms-text-muted)" />;
}

export const DriveAttachmentPicker: React.FC<DriveAttachmentPickerProps> = ({
  attachments = [],
  onChange,
  folderCategory = 'Attachments',
  maxFiles = 10,
  readOnly = false,
  notify,
  onInsertToNote
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      const msg = `Maksimal ${maxFiles} lampiran berkas diperbolehkan.`;
      if (notify) notify(msg, 'warning');
      else alert(msg);
      return;
    }

    setIsUploading(true);
    const newAttachments = [...attachments];

    try {
      const settings = await storage.getItem('porto_settings', {});
      const hasGoogleScript = Boolean(settings?.googleAppsScriptUrl);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Mengunggah (${i + 1}/${files.length}): ${file.name}`);

        let fileUrl = '';
        let downloadUrl = '';
        let provider: 'google_drive' | 'cloudinary' | 'local' = 'google_drive';

        if (hasGoogleScript) {
          try {
            // Upload to Google Drive via Apps Script Bridge
            const uploadedUrl = await googleSync.uploadFileToDrive(file, null, folderCategory);
            fileUrl = uploadedUrl;
            downloadUrl = uploadedUrl;
            provider = 'google_drive';
          } catch (driveErr) {
            console.warn('[DriveAttachmentPicker] Drive upload failed, falling back to Cloudinary:', driveErr);
            // Fallback to Cloudinary if Google Script is unreachable
            const cdnRes = await uploadToCloudinary(file);
            const cdnUrl = typeof cdnRes === 'string' ? cdnRes : (cdnRes?.url || '');
            fileUrl = cdnUrl;
            downloadUrl = cdnUrl;
            provider = 'cloudinary';
          }
        } else {
          // Upload to Cloudinary if no Google Apps Script configured
          const cdnRes = await uploadToCloudinary(file);
          const cdnUrl = typeof cdnRes === 'string' ? cdnRes : (cdnRes?.url || '');
          fileUrl = cdnUrl;
          downloadUrl = cdnUrl;
          provider = 'cloudinary';
        }

        if (fileUrl) {
          const item: DriveAttachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            url: fileUrl,
            downloadUrl: downloadUrl || fileUrl,
            uploadedAt: new Date().toISOString(),
            storageProvider: provider
          };
          newAttachments.push(item);
        }
      }

      onChange(newAttachments);
      if (notify) notify(`✅ ${files.length} berkas berhasil diunggah ke ${hasGoogleScript ? 'Google Drive' : 'Cloud'}!`);
    } catch (err: any) {
      console.error('[DriveAttachmentPicker] Upload error:', err);
      if (notify) notify('❌ Gagal mengunggah berkas: ' + (err.message || 'Error jaringan'), 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (id: string) => {
    const itemToDelete = attachments.find(a => a.id === id);
    const filtered = attachments.filter(a => a.id !== id);
    onChange(filtered);

    if (itemToDelete && (itemToDelete.storageProvider === 'google_drive' || itemToDelete.url?.includes('google'))) {
      try {
        await googleSync.deleteFileFromDrive(itemToDelete.driveId || itemToDelete.url, notify);
      } catch (e) {
        console.warn('[DriveAttachmentPicker] Auto delete error:', e);
      }
    }
  };

  const handleDownload = (att: DriveAttachment) => {
    const link = document.createElement('a');
    link.href = att.downloadUrl || att.url;
    link.target = '_blank';
    link.download = att.name;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>
          <HardDrive size={14} color="#3b82f6" />
          <span>Lampiran Berkas ({attachments.length}/{maxFiles})</span>
        </div>

        {!readOnly && attachments.length < maxFiles && (
          <div>
            <input 
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="cms-btn cms-btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                fontSize: 11.5,
                fontWeight: 750,
                borderRadius: 8,
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={12} className="cms-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload size={12} />
                  <span>Unggah ke Drive</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Uploading progress banner */}
      {isUploading && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11.5,
          color: '#3b82f6',
          fontWeight: 700
        }}>
          <Loader2 size={14} className="cms-spin" />
          <span>{uploadProgress || 'Menyimpan berkas ke Google Drive...'}</span>
        </div>
      )}

      {/* Attachment List */}
      {attachments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {attachments.map((att) => (
            <div 
              key={att.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 14,
                background: 'var(--cms-card-bg)',
                border: '1.5px solid var(--glass-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                gap: 12,
                transition: 'all 0.2s ease',
                flexWrap: 'wrap'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
              }}
            >
              {/* Left File Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180, flex: 1 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--cms-input-bg)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getFileIcon(att.type, att.name)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div 
                    title={att.name}
                    style={{
                      fontSize: 13,
                      fontWeight: 850,
                      color: 'var(--cms-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.3
                    }}
                  >
                    {att.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{formatFileSize(att.size)}</span>
                    <span>•</span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '1px 6px',
                      borderRadius: 6,
                      background: att.storageProvider === 'google_drive' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: att.storageProvider === 'google_drive' ? '#3b82f6' : '#10b981',
                      fontSize: 10,
                      fontWeight: 800
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                      {att.storageProvider === 'google_drive' ? 'Google Drive' : 'Cloud'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Sisipkan, Unduh, Pratinjau, Hapus */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {onInsertToNote && (
                  <button
                    type="button"
                    onClick={() => onInsertToNote(att)}
                    title="Sisipkan tombol berkas interaktif ke teks catatan"
                    style={{
                      height: 32,
                      padding: '0 12px',
                      borderRadius: 8,
                      background: 'var(--cms-accent, #6366f1)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11.5,
                      fontWeight: 850,
                      boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb), 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(var(--cms-accent-rgb), 0.35)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(var(--cms-accent-rgb), 0.25)';
                    }}
                  >
                    <Paperclip size={13} />
                    <span>Sisipkan</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDownload(att)}
                  title="Unduh Berkas"
                  style={{
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 8,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 750,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                >
                  <Download size={13} />
                  <span>Unduh</span>
                </button>

                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka / Pratinjau di Tab Baru"
                  style={{
                    height: 32,
                    width: 32,
                    borderRadius: 8,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--cms-accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--cms-text-muted)'}
                >
                  <ExternalLink size={14} />
                </a>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(att.id)}
                    title="Hapus Lampiran dari Google Drive"
                    style={{
                      height: 32,
                      width: 32,
                      borderRadius: 8,
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                      e.currentTarget.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '12px',
          borderRadius: 10,
          background: 'var(--cms-input-bg)',
          border: '1px dashed var(--glass-border)',
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--cms-text-muted)'
        }}>
          Belum ada berkas lampiran di Google Drive untuk item ini.
        </div>
      )}
    </div>
  );
};

export default DriveAttachmentPicker;
