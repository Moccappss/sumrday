import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Image as ImageIcon, Video, Trash2, CheckCircle2, Sparkles, 
  Wand2, Scissors, ZoomIn, Crop, Copy, Check, CheckSquare, Square,
  Upload, RefreshCw
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { useDialog } from './DialogProvider';
import { useNativeBackHandler } from '../../utils/nativeNavigation';
import { applyCloudinaryAi, uploadToCloudinary, type CloudinaryAiPreset } from '../../utils/cloudinary';

export interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, resourceType?: string) => void;
}

const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { showConfirm } = useDialog();
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [filter, setFilter] = useState('all'); // all, image, video
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeAiMediaId, setActiveAiMediaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Native 1-step back navigation
  useNativeBackHandler(isOpen, onClose, 'media_gallery_modal', 12);

  useEffect(() => {
    if (isOpen) {
      loadGallery();
      setIsSelectMode(false);
      setSelectedIds([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUploaded = () => {
      loadGallery();
    };
    window.addEventListener('porto_media_uploaded', handleUploaded);
    return () => window.removeEventListener('porto_media_uploaded', handleUploaded);
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    const data = await storage.getItem('porto_media_gallery');
    setMediaList(data || []);
    setLoading(false);
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setIsUploading(true);
    try {
      let lastResult: any = null;
      for (const file of fileArray) {
        const res = await uploadToCloudinary(file);
        if (res) lastResult = res;
      }
      await loadGallery();
      if (fileArray.length === 1 && lastResult && lastResult.url) {
        onSelect(lastResult.url, lastResult.resource_type || 'image');
        onClose();
      }
    } catch (err) {
      console.error('Upload to gallery modal error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await showConfirm('Hapus media ini dari riwayat galeri?');
    if (!confirmed) return;
    
    const updatedList = mediaList.filter(item => item.id !== id);
    await storage.setItem('porto_media_gallery', updatedList);
    setMediaList(updatedList);
    setSelectedIds(prev => prev.filter(selId => selId !== id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await showConfirm(`Yakin ingin menghapus ${selectedIds.length} media yang ditandai dari galeri?`);
    if (!confirmed) return;

    const updatedList = mediaList.filter(item => !selectedIds.includes(item.id));
    await storage.setItem('porto_media_gallery', updatedList);
    setMediaList(updatedList);
    setSelectedIds([]);
    setIsSelectMode(false);
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(item => item !== id);
        if (next.length === 0 && isSelectMode) {
          // keep select mode or keep open
        }
        return next;
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredMedia.map(m => m.id);
    const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    }
  };

  const handleApplyAi = async (e: React.MouseEvent, media: any, aiType: CloudinaryAiPreset) => {
    e.stopPropagation();
    const transformedUrl = applyCloudinaryAi(media.url, aiType);
    
    // Create new transformed entry in gallery
    const newMedia = {
      ...media,
      id: `media_${Date.now()}_ai_${aiType}`,
      url: transformedUrl,
      name: `${media.name || 'image'} (AI ${aiType})`,
      createdAt: Date.now()
    };

    const updatedList = [newMedia, ...mediaList];
    await storage.setItem('porto_media_gallery', updatedList);
    setMediaList(updatedList);
    setActiveAiMediaId(null);
  };

  const handleCopyUrl = (e: React.MouseEvent, media: any) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(media.url);
      setCopiedId(media.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  if (!isOpen) return null;

  const filteredMedia = mediaList.filter(item => {
    if (filter === 'all') return true;
    return item.resource_type === filter;
  });

  const visibleIds = filteredMedia.map(m => m.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: 20
    }}>
      <div style={{
        background: 'var(--cms-panel-bg, #1a1b1e)',
        width: '100%', maxWidth: 920, height: '84vh',
        borderRadius: 24, border: '1px solid var(--glass-border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--cms-switcher-bg)', flexWrap: 'wrap', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #ec4899)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
            }}>
              <ImageIcon size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>Galeri Media Cloud</h2>
                {selectedIds.length > 0 && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 100, background: '#ef4444',
                    color: '#fff', fontSize: 11, fontWeight: 800
                  }}>
                    {selectedIds.length} ditandai
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600 }}>Tandai & hapus banyak data sekaligus, atau pilih untuk dipakai</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', background: 'var(--cms-panel-bg)', borderRadius: 100, padding: 3, border: '1px solid var(--glass-border)' }}>
              {['all', 'image', 'video'].map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 12px', borderRadius: 100, border: 'none',
                    background: filter === f ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                    color: filter === f ? '#fff' : 'var(--cms-text)',
                    fontSize: 11.5, fontWeight: 750, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {f === 'all' ? 'Semua' : f === 'image' ? 'Gambar' : 'Video'}
                </button>
              ))}
            </div>

            {/* Select Mode Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsSelectMode(prev => !prev);
                if (isSelectMode) setSelectedIds([]);
              }}
              style={{
                height: 32, padding: '0 12px', borderRadius: 100,
                border: isSelectMode ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--glass-border)',
                background: isSelectMode ? 'rgba(124, 58, 237, 0.15)' : 'var(--cms-card-bg)',
                color: isSelectMode ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text)',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <CheckSquare size={14} />
              <span>{isSelectMode ? 'Mode Pilih Aktif' : 'Tandai Banyak'}</span>
            </button>

            {/* Bulk Delete Button */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                style={{
                  height: 32, padding: '0 14px', borderRadius: 100,
                  border: 'none', background: '#ef4444',
                  color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11.5, fontWeight: 850, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  animation: 'cmsModalPop 0.2s ease-out'
                }}
              >
                <Trash2 size={14} />
                <span>Hapus ({selectedIds.length}) Data</span>
              </button>
            )}

            {/* Upload New Media Button */}
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading}
              style={{
                height: 32, padding: '0 13px', borderRadius: 100,
                border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 11.5, fontWeight: 800, cursor: isUploading ? 'wait' : 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s'
              }}
              title="Unggah gambar atau video baru dari perangkat"
            >
              {isUploading ? <RefreshCw size={13} className="cms-spin" /> : <Upload size={13} />}
              <span>{isUploading ? 'Mengunggah...' : 'Unggah Baru'}</span>
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUploadFiles(e.target.files);
                }
                e.target.value = '';
              }}
            />

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'var(--cms-card-bg)', color: 'var(--cms-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Selection Sub-bar (visible when select mode is active) */}
        {isSelectMode && (
          <div style={{
            padding: '8px 22px', background: 'rgba(124, 58, 237, 0.08)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 12, fontWeight: 750, color: 'var(--cms-text)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                style={{
                  background: 'none', border: 'none', color: 'var(--cms-accent, #7c3aed)',
                  cursor: 'pointer', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, padding: 0
                }}
              >
                {isAllSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                <span>{isAllSelected ? 'Batalkan Semua' : 'Tandai Semua di Halaman'}</span>
              </button>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ color: 'var(--cms-text-muted)' }}>Klik kartu gambar untuk menandai</span>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
              {selectedIds.length} dari {filteredMedia.length} dipilih
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--cms-text-muted)', fontSize: 13, fontWeight: 600 }}>
              Memuat galeri media...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', height: '100%', color: 'var(--cms-text-muted)', gap: 12 }}>
              <ImageIcon size={48} style={{ opacity: 0.35, display: 'block', margin: '0 auto' }} />
              <div style={{ fontSize: 14, fontWeight: 750 }}>Belum ada media di galeri Cloud.</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Unggah gambar melalui tombol di bawah atau modul admin mana pun.</div>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  marginTop: 6,
                  padding: '9px 18px', borderRadius: 100, border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                {isUploading ? <RefreshCw size={14} className="cms-spin" /> : <Upload size={14} />}
                <span>{isUploading ? 'Sedang Mengunggah...' : 'Unggah Gambar Sekarang'}</span>
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16
            }}>
              {filteredMedia.map(media => {
                const isImage = media.resource_type !== 'video';
                const isAiOpen = activeAiMediaId === media.id;
                const isSelected = selectedIds.includes(media.id);

                return (
                  <div 
                    key={media.id}
                    onClick={(e) => {
                      if (isSelectMode) {
                        toggleSelect(media.id, e);
                      } else {
                        onSelect(media.url, media.resource_type);
                        onClose();
                      }
                    }}
                    style={{
                      aspectRatio: '1/1', background: 'var(--cms-switcher-bg)',
                      borderRadius: 16, overflow: 'hidden', position: 'relative',
                      cursor: 'pointer',
                      border: isSelected 
                        ? '3px solid #ef4444' 
                        : isSelectMode 
                          ? '2px dashed var(--glass-border)' 
                          : '2px solid transparent',
                      boxShadow: isSelected ? '0 0 0 2px rgba(239,68,68,0.35), 0 8px 24px rgba(0,0,0,0.2)' : '0 4px 14px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isSelected ? 'scale(0.97)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--cms-accent, #7c3aed)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = isSelectMode ? 'var(--glass-border)' : 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {media.resource_type === 'video' ? (
                      <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : (
                      <img src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={media.name} loading="lazy" />
                    )}
                    
                    {/* Top Left Selection Checkbox */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelectMode) setIsSelectMode(true);
                        toggleSelect(media.id, e);
                      }}
                      style={{
                        position: 'absolute', top: 8, left: 8,
                        background: isSelected ? '#ef4444' : 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(6px)',
                        padding: '4px 7px', borderRadius: 100, color: '#fff',
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800,
                        zIndex: 7, cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      title={isSelected ? 'Hapus tanda' : 'Tandai untuk hapus'}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={13} color="#fff" />
                      ) : isSelectMode ? (
                        <Square size={13} color="#fff" />
                      ) : (
                        media.resource_type === 'video' ? <Video size={11} /> : <ImageIcon size={11} />
                      )}
                      <span>{isSelected ? 'Ditandai' : media.format || (isImage ? 'IMG' : 'VID')}</span>
                    </div>

                    {/* Top Right Actions (Copy URL & Delete) */}
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 5 }}>
                      {/* Copy URL button */}
                      <button 
                        onClick={(e) => handleCopyUrl(e, media)}
                        style={{
                          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                          border: 'none', width: 26, height: 26, borderRadius: '50%', color: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Salin URL CDN"
                      >
                        {copiedId === media.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>

                      {/* Single Delete button */}
                      <button 
                        onClick={(e) => handleDelete(e, media.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.85)', backdropFilter: 'blur(6px)',
                          border: 'none', width: 26, height: 26, borderRadius: '50%', color: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Hapus dari Galeri"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Bottom AI Toolbar Button (Images only - when not in selection mode) */}
                    {isImage && !isSelectMode && (
                      <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 6 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAiMediaId(isAiOpen ? null : media.id);
                          }}
                          style={{
                            width: '100%', padding: '5px 8px', borderRadius: 8, border: 'none',
                            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                            color: '#fff', fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                        >
                          <Sparkles size={11} color="var(--cms-accent, #a855f7)" /> Optimasi AI
                        </button>

                        {/* AI Popover Menu */}
                        {isAiOpen && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                              background: 'var(--cms-panel-bg, #1a1b1e)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 12, padding: 6,
                              display: 'flex', flexDirection: 'column', gap: 3,
                              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                              zIndex: 10,
                              animation: 'cmsPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                          >
                            <button
                              onClick={(e) => handleApplyAi(e, media, 'enhance')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                                background: 'transparent', border: 'none', borderRadius: 6,
                                color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cms-accent-soft)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Wand2 size={12} color="var(--cms-accent)" /> AI Auto-Enhance
                            </button>

                            <button
                              onClick={(e) => handleApplyAi(e, media, 'bg-remove')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                                background: 'transparent', border: 'none', borderRadius: 6,
                                color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cms-accent-soft)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Scissors size={12} color="#ec4899" /> AI Hapus Background
                            </button>

                            <button
                              onClick={(e) => handleApplyAi(e, media, 'upscale')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                                background: 'transparent', border: 'none', borderRadius: 6,
                                color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cms-accent-soft)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <ZoomIn size={12} color="#38bdf8" /> AI Upscale HD
                            </button>

                            <button
                              onClick={(e) => handleApplyAi(e, media, 'smart-crop')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                                background: 'transparent', border: 'none', borderRadius: 6,
                                color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cms-accent-soft)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Crop size={12} color="#10b981" /> AI Smart Center Crop
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MediaGalleryModal;
