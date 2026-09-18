import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, Upload, Image as ImageIcon, Video, Music, FileText, 
  Trash2, Copy, Check, ExternalLink, Search, Filter, Plus, Loader2, Sparkles, X, ArrowLeft
} from 'lucide-react';
import { storage } from '../../../utils/storage';
import { uploadToCloudinary, uploadAudioToCloudinary } from '../../../utils/cloudinary';
import type { MediaVaultItem, MediaVaultType } from './stashTypes';

const DEFAULT_VAULT_ITEMS: MediaVaultItem[] = [
  {
    id: 'mv-1',
    name: 'Logo Studio Master (PNG)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    size: 420000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mv-2',
    name: 'Brand Typography & Banner Art',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    size: 890000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mv-3',
    name: 'Showcase Reel 2026',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    size: 1540000,
    createdAt: new Date().toISOString()
  }
];

interface MediaVaultManagerProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  isDarkMode?: boolean;
  onBack?: () => void;
}

export const MediaVaultManager: React.FC<MediaVaultManagerProps> = ({
  notify,
  confirm,
  isDarkMode = true,
  onBack
}) => {
  const [items, setItems] = useState<MediaVaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | MediaVaultType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaVaultItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load vault items
  useEffect(() => {
    const loadItems = async () => {
      try {
        const saved = await storage.getItem('porto_media_vault', null);
        if (Array.isArray(saved) && saved.length > 0) {
          setItems(saved);
        } else {
          setItems(DEFAULT_VAULT_ITEMS);
          await storage.setItem('porto_media_vault', DEFAULT_VAULT_ITEMS);
        }
      } catch (err) {
        setItems(DEFAULT_VAULT_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, []);

  const saveItems = async (updated: MediaVaultItem[]) => {
    setItems(updated);
    try {
      await storage.setItem('porto_media_vault', updated);
      window.dispatchEvent(new CustomEvent('porto_vault_updated'));
    } catch (err) {
      console.error('Failed to save media vault:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploading(true);
    try {
      let type: MediaVaultType = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      let uploadedUrl = '';
      if (type === 'audio') {
        uploadedUrl = await uploadAudioToCloudinary(file);
      } else {
        uploadedUrl = await uploadToCloudinary(file);
      }

      if (!uploadedUrl) {
        throw new Error('Gagal mengunggah berkas');
      }

      const newItem: MediaVaultItem = {
        id: `mv-${Date.now()}`,
        name: file.name,
        url: uploadedUrl,
        type,
        size: file.size,
        createdAt: new Date().toISOString()
      };

      const next = [newItem, ...items];
      await saveItems(next);
      notify?.(`Berkas "${file.name}" berhasil diunggah ke Vault!`, 'success');
    } catch (err: any) {
      notify?.(err?.message || 'Gagal mengunggah berkas', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = (item: MediaVaultItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
    notify?.('Tautan berkas berhasil disalin ke clipboard!', 'success');
  };

  const handleDelete = (item: MediaVaultItem) => {
    const action = () => {
      const next = items.filter(i => i.id !== item.id);
      saveItems(next);
      notify?.(`Berkas "${item.name}" dihapus.`, 'info');
    };

    if (confirm) {
      confirm({
        title: 'Hapus Berkas?',
        message: `Hapus "${item.name}" dari Media Vault?`,
        isDestructive: true,
        onConfirm: action
      });
    } else {
      if (window.confirm(`Hapus "${item.name}" dari Media Vault?`)) action();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredItems = items.filter(item => {
    const matchFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header Banner ── */}
      <div style={{
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
        borderRadius: 22,
        padding: '18px 24px',
        boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Kembali"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                color: 'var(--cms-text, currentColor)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: 'rgba(13, 148, 136, 0.12)',
            color: '#0d9488',
            border: '1px solid rgba(13, 148, 136, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <HardDrive size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
              Vault
            </h2>
          </div>
        </div>

        {/* Upload Action (Icon-only) */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xlsx,.zip"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="Unggah Berkas"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d9488, #059669)',
              color: '#ffffff',
              border: 'none',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            {isUploading ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
          </button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'var(--cms-card-bg, #ffffff)',
        padding: '12px 18px',
        borderRadius: 16,
        border: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
      }}>
        {/* Type Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Semua', icon: Filter },
            { key: 'image', label: 'Foto', icon: ImageIcon },
            { key: 'video', label: 'Video', icon: Video },
            { key: 'audio', label: 'Audio', icon: Music },
            { key: 'document', label: 'Dokumen', icon: FileText }
          ].map(f => {
            const Icon = f.icon;
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 100,
                  border: active ? '1.5px solid #0d9488' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                  background: active ? 'rgba(13, 148, 136, 0.12)' : 'transparent',
                  color: active ? '#0d9488' : 'var(--cms-text-muted)',
                  fontSize: 12.5,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
          padding: '6px 14px',
          borderRadius: 100,
          border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
          width: '100%',
          maxWidth: 180
        }}>
          <Search size={14} color="var(--cms-text-muted)" />
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12.5,
              color: 'var(--cms-text)',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* ── Media Grid ── */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <span>Memuat Media Vault...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: 'var(--cms-card-bg, #ffffff)',
          borderRadius: 20,
          border: '1px dashed var(--cms-border, rgba(255,255,255,0.12))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>Belum Ada Berkas</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--cms-text-muted)' }}>Mulai unggah foto, video, audio, atau dokumen untuk disimpan di Cloud Vault.</p>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16
        }}>
          {filteredItems.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                  borderRadius: 18,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.03))',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                {/* Thumbnail Header */}
                <div 
                  onClick={() => setPreviewItem(item)}
                  style={{
                    width: '100%',
                    height: 140,
                    background: isDarkMode ? '#0f172a' : '#f1f5f9',
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : item.type === 'video' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#0d9488' }}>
                      <Video size={36} />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>Berkas Video</span>
                    </div>
                  ) : item.type === 'audio' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
                      <Music size={36} />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>Berkas Audio</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#6366f1' }}>
                      <FileText size={36} />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>Dokumen</span>
                    </div>
                  )}

                  {/* Type Badge */}
                  <span style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    padding: '3px 8px',
                    borderRadius: 100,
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#ffffff',
                    backdropFilter: 'blur(6px)'
                  }}>
                    {item.type}
                  </span>
                </div>

                {/* Info & Footer Actions */}
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{
                      margin: '0 0 4px',
                      fontSize: 13.5,
                      fontWeight: 750,
                      color: 'var(--cms-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={item.name}>
                      {item.name}
                    </h4>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                      {formatFileSize(item.size)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingTop: 8, borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.06))' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      title={isCopied ? 'Tersalin' : 'Salin URL'}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                        background: isCopied ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-switcher-bg)',
                        color: isCopied ? '#10b981' : 'var(--cms-text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => window.open(item.url, '_blank')}
                      title="Buka Aset"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                        background: 'transparent',
                        color: 'var(--cms-text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <ExternalLink size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Hapus Aset"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setPreviewItem(null)}>
          <div style={{
            maxWidth: 700,
            width: '100%',
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: 20,
            overflow: 'hidden',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>{previewItem.name}</h3>
              <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {previewItem.type === 'image' && (
              <img src={previewItem.url} alt={previewItem.name} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 12 }} />
            )}
            {previewItem.type === 'video' && (
              <video src={previewItem.url} controls style={{ width: '100%', maxHeight: 420, borderRadius: 12 }} />
            )}
            {previewItem.type === 'audio' && (
              <audio src={previewItem.url} controls style={{ width: '100%' }} />
            )}
            {previewItem.type === 'document' && (
              <div style={{ padding: 40, textAlign: 'center', background: 'var(--cms-switcher-bg)', borderRadius: 12 }}>
                <FileText size={48} color="#6366f1" style={{ margin: '0 auto 12px' }} />
                <a href={previewItem.url} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontWeight: 800, textDecoration: 'underline' }}>
                  Unduh Dokumen Berkas
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleCopyUrl(previewItem)}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 100,
                  border: '1px solid var(--cms-border)',
                  background: 'var(--cms-switcher-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 12.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Copy size={14} />
                <span>Salin Tautan</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{
                  height: 38,
                  padding: '0 18px',
                  borderRadius: 100,
                  border: 'none',
                  background: '#0d9488',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaVaultManager;
