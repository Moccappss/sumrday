import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Image as ImageIcon, Video, Search, Upload, Trash2, Copy, Check,
  Sparkles, ExternalLink, Download, Eye, X, Filter, RefreshCw,
  Calendar, HardDrive, Wand2, Layers, Clock, ShieldCheck, CheckCircle2,
  Maximize2, ZoomIn, ZoomOut, AlertCircle, Plus, FileText, CheckSquare, Square
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { uploadToCloudinary, applyCloudinaryAi, type CloudinaryAiPreset } from '../../utils/cloudinary';
import { googleSync } from '../../utils/googleSync';
import { useDialog } from './DialogProvider';
import { useContextMenu } from './ContextMenuProvider';
import { addNotification } from '../../utils/notifications';

export interface GalleryMediaItem {
  id: string;
  url: string;
  name: string;
  resource_type: 'image' | 'video' | 'raw';
  format?: string;
  bytes?: number;
  createdAt: number | string;
  source?: 'cloudinary' | 'drive' | 'local';
}

interface DateGroup {
  label: string;
  key: string;
  items: GalleryMediaItem[];
  totalBytes: number;
}

export const StorageGalleryTimeline: React.FC = () => {
  const { showConfirm } = useDialog();
  const { bindContextMenu } = useContextMenu();
  const [mediaList, setMediaList] = useState<GalleryMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'drive' | 'cloudinary'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<GalleryMediaItem | null>(null);
  const [activeAiMediaId, setActiveAiMediaId] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and consolidate media across all sources
  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const explicitGallery: GalleryMediaItem[] = (await storage.getItem('porto_media_gallery', [])) || [];

      // Also scan other database collections to discover additional media
      const [stickers, portfolio, catalog, memos, blogs] = await Promise.all([
        storage.getItem('porto_stickers', {}),
        storage.getItem('porto_portfolio', []),
        storage.getItem('porto_catalog', []),
        storage.getItem('porto_memos', []),
        storage.getItem('porto_blogs', [])
      ]);

      const discoveredMap = new Map<string, GalleryMediaItem>();

      // Populate existing explicit gallery items first
      explicitGallery.forEach((item) => {
        if (item && item.url) {
          discoveredMap.set(item.url, {
            ...item,
            resource_type: item.resource_type || (item.url.match(/\.(mp4|webm|mov|ogg)$/i) ? 'video' : 'image'),
            createdAt: item.createdAt || Date.now()
          });
        }
      });

      // Helper to add URL if not exists
      const registerUrl = (url: string, name: string, createdDate?: number | string) => {
        if (!url || typeof url !== 'string' || !url.startsWith('http') || discoveredMap.has(url)) return;
        const isVideo = !!url.match(/\.(mp4|webm|mov|ogg)$/i);
        const isDrive = url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com');
        const isCloudinary = url.includes('res.cloudinary.com');

        discoveredMap.set(url, {
          id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          url,
          name: name || 'Berkas Media',
          resource_type: isVideo ? 'video' : 'image',
          source: isDrive ? 'drive' : isCloudinary ? 'cloudinary' : 'local',
          createdAt: createdDate || Date.now() - Math.floor(Math.random() * 86400000 * 3) // default reasonable fallback
        });
      };

      // Scan stickers
      if (stickers && typeof stickers === 'object') {
        Object.values(stickers).forEach((stkList: any) => {
          if (Array.isArray(stkList)) {
            stkList.forEach((s) => {
              if (s?.imageData) registerUrl(s.imageData, s.name || 'Stiker Visual');
            });
          }
        });
      }

      // Scan portfolio
      if (Array.isArray(portfolio)) {
        portfolio.forEach((p) => {
          if (p?.coverImage) registerUrl(p.coverImage, `${p.title || 'Proyek'} (Cover)`, p.createdAt);
          if (Array.isArray(p?.images)) {
            p.images.forEach((imgUrl: string, idx: number) => registerUrl(imgUrl, `${p.title || 'Proyek'} (Foto ${idx + 1})`, p.createdAt));
          }
        });
      }

      // Scan catalog
      if (Array.isArray(catalog)) {
        catalog.forEach((c) => {
          if (c?.image) registerUrl(c.image, `${c.name || 'Produk'} (Cover)`, c.createdAt);
          if (Array.isArray(c?.gallery)) {
            c.gallery.forEach((imgUrl: string, idx: number) => registerUrl(imgUrl, `${c.name || 'Produk'} (Foto ${idx + 1})`, c.createdAt));
          }
        });
      }

      // Scan memos
      if (Array.isArray(memos)) {
        memos.forEach((m) => {
          if (Array.isArray(m?.attachments)) {
            m.attachments.forEach((att: any) => {
              if (att?.url) registerUrl(att.url, att.name || 'Lampiran Memo', m.createdAt);
            });
          }
        });
      }

      const consolidated = Array.from(discoveredMap.values()).sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });

      setMediaList(consolidated);
    } catch (err) {
      console.error('Failed to load media gallery:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
    const handleUploadedEvent = () => {
      loadMedia();
    };
    window.addEventListener('porto_media_uploaded', handleUploadedEvent);
    return () => window.removeEventListener('porto_media_uploaded', handleUploadedEvent);
  }, [loadMedia]);

  // Upload handler for single or multiple files
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setIsUploading(true);
    let successCount = 0;
    try {
      for (const file of fileArray) {
        const res = await uploadToCloudinary(file);
        if (res && res.url) {
          successCount++;
        }
      }
      await loadMedia();
      addNotification?.('system', 'Upload Sukses', `✅ Berhasil menambahkan ${successCount} berkas ke galeri media!`, { type: 'success' });
    } catch (err: any) {
      console.error('Upload failed:', err);
      addNotification?.('system', 'Gagal Mengunggah', err.message || 'Terjadi kesalahan saat mengunggah', { type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete media item
  const handleDeleteItem = async (e: React.MouseEvent, item: GalleryMediaItem) => {
    e.stopPropagation();
    const confirmed = await showConfirm(`Hapus "${item.name}" dari daftar galeri?`);
    if (!confirmed) return;

    const updated = mediaList.filter((m) => m.id !== item.id && m.url !== item.url);
    setMediaList(updated);
    await storage.setItem('porto_media_gallery', updated);
    if (lightboxItem?.id === item.id) setLightboxItem(null);
    setSelectedIds(prev => prev.filter(id => id !== item.id && id !== item.url));
  };

  // Bulk delete selected media
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await showConfirm(`Yakin ingin menghapus ${selectedIds.length} media yang ditandai dari galeri?`);
    if (!confirmed) return;

    const updated = mediaList.filter((m) => !selectedIds.includes(m.id) && !selectedIds.includes(m.url));
    setMediaList(updated);
    await storage.setItem('porto_media_gallery', updated);
    setSelectedIds([]);
    setIsSelectMode(false);
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredList.map(m => m.id);
    const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    }
  };

  // Copy media direct URL
  const handleCopyUrl = (e: React.MouseEvent, item: GalleryMediaItem) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  // AI transformation on Cloudinary images
  const handleApplyAi = async (e: React.MouseEvent, item: GalleryMediaItem, aiType: CloudinaryAiPreset) => {
    e.stopPropagation();
    const transformedUrl = applyCloudinaryAi(item.url, aiType);
    const newMedia: GalleryMediaItem = {
      ...item,
      id: `media_${Date.now()}_ai_${aiType}`,
      url: transformedUrl,
      name: `${item.name.replace(/\.[^/.]+$/, '')} (AI ${aiType})`,
      createdAt: Date.now(),
      source: 'cloudinary'
    };

    const updatedList = [newMedia, ...mediaList];
    await storage.setItem('porto_media_gallery', updatedList);
    setMediaList(updatedList);
    setActiveAiMediaId(null);
  };

  // Filtered media items
  const filteredList = useMemo(() => {
    return mediaList.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchUrl = item.url?.toLowerCase().includes(q);
        if (!matchName && !matchUrl) return false;
      }

      // Type filter
      if (filterType === 'image') return item.resource_type === 'image';
      if (filterType === 'video') return item.resource_type === 'video';
      if (filterType === 'drive') return item.url.includes('drive.google.com') || item.url.includes('lh3.googleusercontent.com');
      if (filterType === 'cloudinary') return item.url.includes('res.cloudinary.com');

      return true;
    });
  }, [mediaList, searchQuery, filterType]);

  // Group media items chronologically by upload date
  const dateGroups: DateGroup[] = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const groupsMap = new Map<string, { label: string; items: GalleryMediaItem[]; totalBytes: number }>();

    filteredList.forEach((item) => {
      const itemDate = new Date(item.createdAt || Date.now());
      const itemDateStr = itemDate.toDateString();
      let groupKey = '';
      let groupLabel = '';

      if (itemDateStr === todayStr) {
        groupKey = '0_today';
        groupLabel = 'Hari Ini';
      } else if (itemDateStr === yesterdayStr) {
        groupKey = '1_yesterday';
        groupLabel = 'Kemarin';
      } else if (itemDate >= sevenDaysAgo) {
        groupKey = '2_last_7_days';
        groupLabel = '7 Hari Terakhir';
      } else if (itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear) {
        groupKey = '3_this_month';
        groupLabel = 'Bulan Ini';
      } else {
        const monthYear = itemDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        groupKey = `4_${itemDate.getFullYear()}_${itemDate.getMonth()}`;
        groupLabel = `Arsip ${monthYear}`;
      }

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, { label: groupLabel, items: [], totalBytes: 0 });
      }

      const grp = groupsMap.get(groupKey)!;
      grp.items.push(item);
      grp.totalBytes += item.bytes || 0;
    });

    return Array.from(groupsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => ({
        key,
        label: val.label,
        items: val.items,
        totalBytes: val.totalBytes
      }));
  }, [filteredList]);

  // Context Menu builder for each media item
  const getMediaContextMenu = (item: GalleryMediaItem) => ({
    title: item.name || 'Berkas Media',
    subtitle: `${item.resource_type.toUpperCase()} • ${item.url.slice(0, 35)}...`,
    headerBadge: item.source?.toUpperCase() || 'CDN',
    items: [
      {
        label: 'Pratinjau Layar Penuh',
        icon: <Eye size={15} color="var(--cms-accent, #7c3aed)" />,
        action: () => setLightboxItem(item)
      },
      {
        label: 'Salin Tautan (Direct URL)',
        icon: <Copy size={15} color="#10b981" />,
        action: () => {
          if (navigator.clipboard) navigator.clipboard.writeText(item.url);
        }
      },
      {
        label: 'Buka di Tab Baru',
        icon: <ExternalLink size={15} color="#3b82f6" />,
        action: () => window.open(item.url, '_blank')
      },
      ...(item.url.includes('res.cloudinary.com') ? [
        {
          label: 'AI Upscale & Pertajam HD',
          icon: <Sparkles size={15} color="#ec4899" />,
          action: () => handleApplyAi({ stopPropagation: () => {} } as any, item, 'upscale')
        },
        {
          label: 'AI Hapus / Buram Latar',
          icon: <Wand2 size={15} color="#8b5cf6" />,
          action: () => handleApplyAi({ stopPropagation: () => {} } as any, item, 'remove-bg')
        }
      ] : []),
      { separator: true, label: '' },
      {
        label: 'Hapus dari Galeri',
        icon: <Trash2 size={15} color="#ef4444" />,
        danger: true,
        action: () => handleDeleteItem({ stopPropagation: () => {} } as any, item)
      }
    ]
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* ── CONTROL BAR ── */}
      <div className="gallery-control-bar">
        {/* Search Bar */}
        <div className="gallery-search-wrap">
          <Search size={15} style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--cms-text-muted, #94a3b8)',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari media..."
            style={{
              width: '100%',
              height: 38,
              padding: '0 16px 0 38px',
              borderRadius: 10,
              border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
              background: 'var(--cms-input-bg, rgba(0,0,0,0.2))',
              color: 'var(--cms-text, #f1f5f9)',
              fontSize: 12.5,
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--cms-text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="gallery-filters-wrap">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'image', label: 'Foto' },
            { id: 'video', label: 'Video' },
            { id: 'cloudinary', label: 'Cloudinary' },
            { id: 'drive', label: 'Drive' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`gallery-filter-btn ${filterType === f.id ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="gallery-actions-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={loadMedia}
            disabled={isLoading}
            className="gallery-act-btn"
            title="Refresh Galeri"
          >
            <RefreshCw size={13} className={isLoading ? 'cms-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Select Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsSelectMode(prev => !prev);
              if (isSelectMode) setSelectedIds([]);
            }}
            className="gallery-act-btn"
            style={{
              borderColor: isSelectMode ? 'var(--cms-accent, #7c3aed)' : undefined,
              color: isSelectMode ? 'var(--cms-accent, #7c3aed)' : undefined,
              background: isSelectMode ? 'rgba(var(--cms-accent-rgb), 0.12)' : undefined,
              fontWeight: 800
            }}
            title="Tandai banyak data sekaligus untuk dihapus"
          >
            <CheckSquare size={13} />
            <span>{isSelectMode ? 'Mode Pilih Aktif' : 'Tandai Banyak'}</span>
          </button>

          {/* Bulk Delete Button */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="gallery-act-btn"
              style={{
                background: '#ef4444',
                color: '#fff',
                borderColor: '#ef4444',
                fontWeight: 850,
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
              title="Hapus media yang ditandai"
            >
              <Trash2 size={13} />
              <span>Hapus ({selectedIds.length}) Data</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gallery-act-btn upload-btn"
            title="Unggah Media Baru"
          >
            {isUploading ? <RefreshCw size={13} className="cms-spin" /> : <Upload size={13} />}
            <span>{isUploading ? 'Proses...' : 'Upload'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) handleUploadFiles(files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* ── TIMELINE MEDIA LIST (GROUPED BY DATE) ── */}
      {isLoading ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--cms-text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          <RefreshCw size={32} className="cms-spin" color="var(--cms-accent)" />
          <div style={{ fontSize: 14, fontWeight: 700 }}>Memindai & Mengelompokkan Media berdasarkan Tanggal...</div>
        </div>
      ) : dateGroups.length === 0 ? (
        <div style={{
          padding: '80px 20px',
          textAlign: 'center',
          background: 'var(--cms-card-bg)',
          borderRadius: 24,
          border: '2px dashed var(--glass-border)'
        }}>
          <ImageIcon size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: 'var(--cms-text)' }}>
            Belum Ada Media Ditemukan
          </h3>
          <p style={{ margin: '0 0 20px', color: 'var(--cms-text-muted)', fontSize: 13 }}>
            Unggah foto atau video baru untuk mulai mengarsipkan aset visual Anda.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 42,
              padding: '0 22px',
              borderRadius: 12,
              background: 'var(--cms-accent)',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Plus size={16} /> Upload Sekarang
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {dateGroups.map((group) => (
            <section key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Date Group Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 10,
                borderBottom: '1.5px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(var(--cms-accent-rgb), 0.12)',
                    color: 'var(--cms-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar size={16} />
                  </div>
                  <h2 style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 850,
                    color: 'var(--cms-text)',
                    letterSpacing: '-0.02em'
                  }}>
                    {group.label}
                  </h2>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 750,
                  color: 'var(--cms-text-muted)'
                }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 100,
                    background: 'var(--cms-switcher-bg)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    {group.items.length} Berkas
                  </span>
                </div>
              </div>

              {/* Media Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16
              }}>
                {group.items.map((item) => {
                  const isVideo = item.resource_type === 'video';
                  const isCloudinary = item.url.includes('res.cloudinary.com');
                  const isSelected = selectedIds.includes(item.id) || selectedIds.includes(item.url);

                  return (
                    <div
                      key={item.id}
                      {...bindContextMenu(() => getMediaContextMenu(item))}
                      style={{
                        position: 'relative',
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: 'var(--cms-card-bg)',
                        border: isSelected 
                          ? '3px solid #ef4444' 
                          : isSelectMode 
                            ? '2px dashed var(--glass-border)' 
                            : '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s',
                        boxShadow: isSelected ? '0 0 0 2px rgba(239,68,68,0.35), 0 8px 24px rgba(0,0,0,0.2)' : 'var(--cms-shadow-sm)',
                        transform: isSelected ? 'scale(0.97)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.25)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm)';
                        }
                      }}
                      onClick={(e) => {
                        if (isSelectMode) {
                          toggleSelect(item.id, e);
                        } else {
                          setLightboxItem(item);
                        }
                      }}
                    >
                      {/* Top-Left Selection Checkbox Badge */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSelectMode) setIsSelectMode(true);
                          toggleSelect(item.id, e);
                        }}
                        style={{
                          position: 'absolute', top: 8, left: 8, zIndex: 12,
                          background: isSelected ? '#ef4444' : 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(6px)',
                          padding: '3px 8px', borderRadius: 100, color: '#fff',
                          display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800,
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                        title={isSelected ? 'Hapus tanda' : 'Tandai untuk hapus'}
                      >
                        {isSelected ? (
                          <CheckCircle2 size={13} color="#fff" />
                        ) : isSelectMode ? (
                          <Square size={13} color="#fff" />
                        ) : (
                          isVideo ? <Video size={11} /> : <ImageIcon size={11} />
                        )}
                        <span>{isSelected ? 'Ditandai' : item.format?.toUpperCase() || (isVideo ? 'VID' : 'IMG')}</span>
                      </div>
                      {/* Media Thumbnail Container */}
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/10',
                        background: '#0a0a10',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isVideo ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <video
                              src={item.url}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              muted
                              playsInline
                            />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Video size={28} color="#fff" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.name}
                            loading="lazy"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.35s'
                            }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}

                        {/* Top Right Source Badge */}
                        <div style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          pointerEvents: 'none',
                          zIndex: 10
                        }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: item.source === 'drive' ? 'rgba(245,158,11,0.85)' : 'rgba(var(--cms-accent-rgb),0.85)',
                            color: '#fff'
                          }}>
                            {item.source === 'drive' ? 'DRIVE' : 'CDN'}
                          </span>
                        </div>
                      </div>

                      {/* Card Info & Footer */}
                      <div style={{
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        background: 'var(--cms-card-bg)'
                      }}>
                        <div style={{
                          fontSize: 12.5,
                          fontWeight: 750,
                          color: 'var(--cms-text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={item.name}>
                          {item.name}
                        </div>

                        {/* Card Actions */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6
                        }}>
                          {/* Copy URL button */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyUrl(e, item)}
                            style={{
                              flex: 1,
                              height: 28,
                              padding: '0 8px',
                              borderRadius: 8,
                              background: copiedId === item.id ? 'rgba(16,185,129,0.15)' : 'var(--cms-switcher-bg)',
                              border: copiedId === item.id ? '1px solid #10b981' : '1px solid var(--glass-border)',
                              color: copiedId === item.id ? '#10b981' : 'var(--cms-text-muted)',
                              fontSize: 11,
                              fontWeight: 750,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              cursor: 'pointer'
                            }}
                            title="Salin URL Berkas"
                          >
                            {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedId === item.id ? 'Tersalin' : 'Salin URL'}</span>
                          </button>

                          {/* AI Menu button (for Cloudinary images) */}
                          {isCloudinary && !isVideo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAiMediaId(activeAiMediaId === item.id ? null : item.id);
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: activeAiMediaId === item.id ? 'var(--cms-accent)' : 'rgba(var(--cms-accent-rgb), 0.12)',
                                border: 'none',
                                color: activeAiMediaId === item.id ? '#fff' : 'var(--cms-accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="Transformasi AI Cloudinary"
                            >
                              <Wand2 size={13} />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(e, item)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: 'none',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Hapus dari Galeri"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* AI Popover Quick Menu */}
                        {activeAiMediaId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginTop: 6,
                              padding: 8,
                              borderRadius: 10,
                              background: 'var(--cms-switcher-bg)',
                              border: '1px solid var(--glass-border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                          >
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-accent)', textTransform: 'uppercase', marginBottom: 2 }}>
                              ✨ Preset AI Cloudinary
                            </div>
                            {[
                              { type: 'upscale', label: 'HD Upscale & Sharp' },
                              { type: 'remove-bg', label: 'Hapus Latar Belakang' },
                              { type: 'blur-bg', label: 'Blur Background Bokeh' },
                              { type: 'squircle', label: 'Format Squircle' }
                            ].map((preset) => (
                              <button
                                key={preset.type}
                                onClick={(e) => handleApplyAi(e, item, preset.type as CloudinaryAiPreset)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: 'var(--cms-card-bg)',
                                  color: 'var(--cms-text)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <Sparkles size={11} color="var(--cms-accent)" />
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── INTERACTIVE LIGHTBOX VIEWER ── */}
      {lightboxItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onClick={() => setLightboxItem(null)}
        >
          {/* Lightbox Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{lightboxItem.name}</div>
              <span style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.15)',
                fontWeight: 700
              }}>
                {lightboxItem.resource_type.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={(e) => handleCopyUrl(e, lightboxItem)}
                style={{
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 750,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Copy size={14} />
                <span>Salin Link</span>
              </button>

              <button
                onClick={() => window.open(lightboxItem.url, '_blank')}
                style={{
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 10,
                  background: 'var(--cms-accent, #7c3aed)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 750,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={14} />
                <span>Buka Tab Baru</span>
              </button>

              <button
                onClick={() => setLightboxItem(null)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.85)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Tutup (ESC)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lightbox Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 25px 80px rgba(0,0,0,0.8)'
            }}
          >
            {lightboxItem.resource_type === 'video' ? (
              <video
                src={lightboxItem.url}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 16 }}
              />
            ) : (
              <img
                src={lightboxItem.url}
                alt={lightboxItem.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: 16
                }}
              />
            )}
          </div>
        </div>
      )}

      <style>{`
        .gallery-control-bar {
          padding: 14px 18px;
          border-radius: 18px;
          background: var(--cms-card-bg, rgba(255,255,255,0.03));
          border: 1.5px solid var(--glass-border, rgba(255,255,255,0.1));
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: var(--cms-shadow-sm);
        }
        .gallery-search-wrap {
          position: relative;
          flex: 1 1 240px;
          max-width: 380px;
        }
        .gallery-filters-wrap {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        .gallery-filter-btn {
          height: 34px;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 750;
          cursor: pointer;
          border: 1px solid var(--glass-border);
          background: var(--cms-switcher-bg, rgba(255,255,255,0.05));
          color: var(--cms-text-muted, #94a3b8);
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gallery-filter-btn.active {
          background: var(--cms-accent, #7c3aed);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4px 12px rgba(var(--cms-accent-rgb), 0.3);
        }
        .gallery-actions-wrap {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .gallery-act-btn {
          height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
          background: var(--cms-switcher-bg);
          color: var(--cms-text);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .gallery-act-btn.upload-btn {
          background: var(--cms-accent, #7c3aed);
          border: none;
          color: #fff;
          box-shadow: 0 4px 12px rgba(var(--cms-accent-rgb), 0.3);
        }

        @media (max-width: 768px) {
          .gallery-control-bar {
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          .gallery-search-wrap {
            max-width: 100% !important;
            flex: 1 1 100% !important;
          }
          .gallery-filters-wrap {
            width: 100% !important;
            display: flex !important;
            gap: 4px !important;
            overflow-x: auto !important;
            padding-bottom: 2px !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .gallery-filter-btn {
            height: 32px !important;
            padding: 0 10px !important;
            font-size: 11px !important;
            flex-shrink: 0 !important;
          }
          .gallery-actions-wrap {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
          }
          .gallery-act-btn {
            width: 100% !important;
            justify-content: center !important;
            height: 34px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StorageGalleryTimeline;
