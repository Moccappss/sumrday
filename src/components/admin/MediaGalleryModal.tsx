import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Image as ImageIcon, Video, Trash2, CheckCircle2, Sparkles, 
  Wand2, Scissors, ZoomIn, Crop, Copy, Check, CheckSquare, Square,
  Upload, RefreshCw, Search, Globe, Bookmark, ArrowRight, Download, Layers
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { useDialog } from './DialogProvider';
import { useNativeBackHandler } from '../../utils/nativeNavigation';
import { applyCloudinaryAi, uploadToCloudinary, addMediaToGallery, getResponsiveImg, type CloudinaryAiPreset } from '../../utils/cloudinary';
import { 
  getCloudinaryFetchUrl, 
  getClearbitLogoUrl, 
  searchUnsplashCurated, 
  type UnsplashPhoto 
} from '../../utils/mediaIntegrations';
import { soundEffects } from '../../utils/soundEffects';
import {
  renderBannerToCanvas,
  exportCanvasToBlob,
  BANNER_DIMENSIONS,
  BANNER_BG_PRESETS,
  BANNER_PURPOSE_PRESETS,
  type BannerRatio,
  type LogoPosition
} from '../../utils/bannerStudioEngine';

export interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, resourceType?: string) => void;
  initialTab?: 'all' | 'image' | 'video' | 'unsplash' | 'logo-fetch' | 'banner-studio';
}

const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialTab = 'all' 
}) => {
  const { showConfirm } = useDialog();
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'unsplash' | 'logo-fetch' | 'banner-studio'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeAiMediaId, setActiveAiMediaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Unsplash state
  const [unsplashQuery, setUnsplashQuery] = useState('minimalist architecture');
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);

  // Clearbit logo state
  const [brandDomainInput, setBrandDomainInput] = useState('');
  const [previewLogoUrl, setPreviewLogoUrl] = useState('');

  // Banner Studio state (Non-AI Direct Engine)
  const [bannerRatio, setBannerRatio] = useState<BannerRatio>('16:9');
  const [bannerHeadline, setBannerHeadline] = useState('Studio Desain & Kreasi');
  const [bannerSubtitle, setBannerSubtitle] = useState('Koleksi visual & identitas digital modern');
  const [bannerBadge, setBannerBadge] = useState('STUDIO SPOTLIGHT');
  const [bannerLogoDomain, setBannerLogoDomain] = useState('google.com');
  const [bannerLogoUrl, setBannerLogoUrl] = useState(
    'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://google.com&size=256'
  );
  const [bannerLogoPosition, setBannerLogoPosition] = useState<LogoPosition>('topLeft');
  const [bannerBgUrl, setBannerBgUrl] = useState(
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80'
  );
  const [bannerOverlayOpacity, setBannerOverlayOpacity] = useState(0.45);
  const [bannerBlur, setBannerBlur] = useState(0);
  const [bannerAccentColor, setBannerAccentColor] = useState('#7c3aed');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useNativeBackHandler(isOpen, onClose, 'media_gallery_modal', 12);

  useEffect(() => {
    if (isOpen) {
      loadGallery();
      setIsSelectMode(false);
      setSelectedIds([]);
      if (initialTab) {
        setFilter(initialTab);
        if (initialTab === 'unsplash') {
          handleSearchUnsplash(unsplashQuery || 'minimalist architecture');
        }
      }
      soundEffects.play('whoosh');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleUploaded = () => loadGallery();
    window.addEventListener('porto_media_uploaded', handleUploaded);
    return () => window.removeEventListener('porto_media_uploaded', handleUploaded);
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    const data = await storage.getItem('porto_media_gallery');
    setMediaList(data || []);
    setLoading(false);
  };

  const handleTabChange = (tab: 'all' | 'image' | 'video' | 'unsplash' | 'logo-fetch' | 'banner-studio') => {
    soundEffects.play('pop');
    setFilter(tab);
    if (tab === 'unsplash' && unsplashResults.length === 0) {
      handleSearchUnsplash('minimalist architecture');
    }
  };

  // Canvas rendering effect for 120 FPS Banner Studio
  useEffect(() => {
    if (filter === 'banner-studio' && canvasRef.current) {
      renderBannerToCanvas(canvasRef.current, {
        ratio: bannerRatio,
        headline: bannerHeadline,
        subtitle: bannerSubtitle,
        badge: bannerBadge,
        logoUrl: bannerLogoUrl,
        logoPosition: bannerLogoPosition,
        bgImageUrl: bannerBgUrl,
        overlayOpacity: bannerOverlayOpacity,
        blur: bannerBlur,
        accentColor: bannerAccentColor
      });
    }
  }, [
    filter, bannerRatio, bannerHeadline, bannerSubtitle,
    bannerBadge, bannerLogoUrl, bannerLogoPosition,
    bannerBgUrl, bannerOverlayOpacity, bannerBlur, bannerAccentColor
  ]);

  const handleFetchBannerLogo = () => {
    if (!bannerLogoDomain.trim()) return;
    soundEffects.play('click');
    const logoUrl = getClearbitLogoUrl(bannerLogoDomain.trim(), 256);
    setBannerLogoUrl(logoUrl);
  };

  const handleDownloadBanner = async () => {
    if (!canvasRef.current) return;
    soundEffects.play('pop');
    const blob = await exportCanvasToBlob(canvasRef.current, 'image/webp', 0.9);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banner_${bannerRatio.replace(':', 'x')}_${Date.now()}.webp`;
    a.click();
    URL.revokeObjectURL(url);
    soundEffects.play('success');
  };

  const handleSaveBannerToGallery = async (): Promise<string | null> => {
    if (!canvasRef.current) return null;
    soundEffects.play('pop');
    const blob = await exportCanvasToBlob(canvasRef.current, 'image/webp', 0.86);
    if (!blob) return null;

    const file = new File([blob], `banner_${bannerRatio.replace(':', 'x')}_${Date.now()}.webp`, { type: 'image/webp' });
    let finalUrl = '';
    try {
      const uploaded = await uploadToCloudinary(file);
      finalUrl = uploaded?.url || canvasRef.current.toDataURL('image/webp', 0.82);
    } catch {
      finalUrl = canvasRef.current.toDataURL('image/webp', 0.82);
    }

    const updatedList = await addMediaToGallery({
      id: `banner_${Date.now()}`,
      url: finalUrl,
      name: bannerHeadline ? `Banner - ${bannerHeadline.slice(0, 30)}` : 'Banner Studio',
      format: 'webp',
      resource_type: 'image',
      createdAt: Date.now()
    });
    setMediaList(updatedList);
    soundEffects.play('success');
    return finalUrl;
  };

  const handleSelectBanner = async () => {
    const url = await handleSaveBannerToGallery();
    if (url) {
      onSelect(url, 'image');
      onClose();
    }
  };

  const handleSearchUnsplash = async (q: string) => {
    setUnsplashLoading(true);
    soundEffects.play('click');
    try {
      const results = await searchUnsplashCurated(q);
      setUnsplashResults(results);
    } catch (err) {
      console.error('Unsplash query failed:', err);
    } finally {
      setUnsplashLoading(false);
    }
  };

  const handleSelectUnsplashPhoto = async (photo: UnsplashPhoto, saveToGallery: boolean = false) => {
    soundEffects.play('pop');
    const cdnUrl = getCloudinaryFetchUrl(photo.url, { quality: 'auto:good' });

    if (saveToGallery) {
      const updatedList = await addMediaToGallery({
        id: `unsplash_${photo.id}_${Date.now()}`,
        url: cdnUrl,
        name: photo.alt || 'Stock Photo',
        format: 'webp',
        resource_type: 'image',
        createdAt: Date.now()
      });
      setMediaList(updatedList);
      soundEffects.play('success');
    }

    onSelect(cdnUrl, 'image');
    onClose();
  };

  const handleFetchBrandLogo = () => {
    if (!brandDomainInput.trim()) return;
    soundEffects.play('click');
    const logoUrl = getClearbitLogoUrl(brandDomainInput.trim(), 256);
    setPreviewLogoUrl(logoUrl);
  };

  const handleSelectBrandLogo = async () => {
    if (!previewLogoUrl) return;
    soundEffects.play('success');
    const cdnLogoUrl = getCloudinaryFetchUrl(previewLogoUrl, { crop: 'fit' });

    const updatedList = await addMediaToGallery({
      id: `logo_${Date.now()}`,
      url: cdnLogoUrl,
      name: `Logo - ${brandDomainInput}`,
      format: 'png',
      resource_type: 'image',
      createdAt: Date.now()
    });
    setMediaList(updatedList);

    onSelect(cdnLogoUrl, 'image');
    onClose();
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setIsUploading(true);
    soundEffects.play('click');
    try {
      let lastResult: any = null;
      for (const file of fileArray) {
        const res = await uploadToCloudinary(file);
        if (res) lastResult = res;
      }
      soundEffects.play('success');
      await loadGallery();
      if (fileArray.length === 1 && lastResult?.url) {
        onSelect(lastResult.url, lastResult.resource_type || 'image');
        onClose();
      }
    } catch (err) {
      soundEffects.play('error');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundEffects.play('click');
    const confirmed = await showConfirm('Hapus media ini?');
    if (!confirmed) return;
    
    const updatedList = mediaList.filter(item => item.id !== id);
    await storage.setItem('porto_media_gallery', updatedList);
    setMediaList(updatedList);
    setSelectedIds(prev => prev.filter(selId => selId !== id));
    soundEffects.play('success');
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    soundEffects.play('click');
    const confirmed = await showConfirm(`Hapus ${selectedIds.length} media?`);
    if (!confirmed) return;

    const updatedList = mediaList.filter(item => !selectedIds.includes(item.id));
    await storage.setItem('porto_media_gallery', updatedList);
    setMediaList(updatedList);
    setSelectedIds([]);
    setIsSelectMode(false);
    soundEffects.play('success');
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEffects.play('pop');
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = () => {
    soundEffects.play('click');
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
    soundEffects.play('sparkle');
    const transformedUrl = applyCloudinaryAi(media.url, aiType);
    
    const newMedia = {
      ...media,
      id: `media_${Date.now()}_ai_${aiType}`,
      url: transformedUrl,
      name: `${media.name || 'image'} (AI)`,
      createdAt: Date.now()
    };

    const updatedList = [newMedia, ...mediaList];
    await storage.setItem('porto_media_gallery', updatedList);
    setMediaList(updatedList);
    setActiveAiMediaId(null);
  };

  const handleCopyUrl = (e: React.MouseEvent, media: any) => {
    e.stopPropagation();
    soundEffects.play('click');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(media.url);
      setCopiedId(media.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  if (!isOpen) return null;

  const filteredMedia = mediaList.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'image') return item.resource_type !== 'video';
    if (filter === 'video') return item.resource_type === 'video';
    return true;
  });

  const visibleIds = filteredMedia.map(m => m.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.82)', padding: 'clamp(8px, 2vw, 16px)'
    }}>
      <style>{`
        .media-gallery-header {
          position: relative;
          min-height: 60px;
          padding: 0 20px;
          border-bottom: 1px solid var(--surface-border-subtle, rgba(255,255,255,0.08));
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-card, #181926);
          gap: 12px;
          flex-shrink: 0;
        }
        .media-gallery-tabs-pill {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          background: var(--surface-canvas, #0A0B0E);
          border-radius: 9999px;
          padding: 3px;
          border: 1px solid var(--surface-border-subtle, rgba(255,255,255,0.08));
          z-index: 10;
          max-width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .media-gallery-tabs-pill::-webkit-scrollbar {
          display: none;
        }
        .media-gallery-banner-split {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .media-gallery-banner-sidebar {
          width: 340px;
          border-right: 1px solid var(--surface-border-subtle, rgba(255,255,255,0.08));
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: var(--surface-card, #181926);
          flex-shrink: 0;
        }
        @media (max-width: 900px) {
          .media-gallery-header {
            flex-wrap: wrap;
            padding: 10px 14px;
            gap: 8px;
          }
          .media-gallery-tabs-pill {
            position: static;
            transform: none;
            order: 3;
            width: 100%;
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          .media-gallery-tabs-pill {
            justify-content: flex-start;
          }
          .media-gallery-banner-split {
            flex-direction: column-reverse;
            overflow-y: auto;
          }
          .media-gallery-banner-sidebar {
            width: 100%;
            border-right: none;
            border-top: 1px solid var(--surface-border-subtle, rgba(255,255,255,0.08));
            overflow-y: visible;
          }
        }
      `}</style>
      <div style={{
        background: 'var(--cms-panel-bg, #121318)',
        width: '100%', maxWidth: 960, height: 'min(88vh, 860px)',
        borderRadius: 24, border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        margin: '0 auto'
      }}>
        {/* Consistent Top Navbar */}
        <div className="media-gallery-header">
          {/* Left: Clean Title with Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--cms-accent, #7c3aed)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <ImageIcon size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-text, #fff)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                Galeri Media
              </span>
              {selectedIds.length > 0 && (
                <span style={{
                  padding: '2px 8px', borderRadius: 9999, background: '#ef4444',
                  color: '#fff', fontSize: 11, fontWeight: 750
                }}>
                  {selectedIds.length}
                </span>
              )}
            </div>
          </div>

          {/* Center: Locked in Center on Desktop, Clean Centered Row on Tablet/Mobile */}
          <div className="media-gallery-tabs-pill">
            {([
              { key: 'all', label: 'Semua' },
              { key: 'image', label: 'Gambar' },
              { key: 'video', label: 'Video' },
              { key: 'unsplash', label: 'Stock' },
              { key: 'logo-fetch', label: 'Logo' },
              { key: 'banner-studio', label: 'Banner' }
            ] as const).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                style={{
                  height: 30, padding: '0 13px', borderRadius: 9999, border: 'none',
                  background: filter === tab.key ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                  color: filter === tab.key ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
                  fontSize: 12, fontWeight: 750, cursor: 'pointer', transition: 'all 0.15s',
                  whiteSpace: 'nowrap', flexShrink: 0
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Actions & Close (All Icon Only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 11 }}>
            {filter !== 'unsplash' && filter !== 'logo-fetch' && filter !== 'banner-studio' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setIsSelectMode(prev => !prev);
                    if (isSelectMode) setSelectedIds([]);
                  }}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: isSelectMode ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                    background: isSelectMode ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    color: isSelectMode ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text, #fff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                  title={isSelectMode ? 'Batalkan pilihan' : 'Tandai banyak'}
                >
                  <CheckSquare size={14} />
                </button>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: 'none', background: '#ef4444',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                    title={`Hapus (${selectedIds.length})`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                {/* Upload Button: ICON ONLY */}
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: 'none', background: '#10b981',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isUploading ? 'wait' : 'pointer'
                  }}
                  title="Unggah file baru"
                >
                  {isUploading ? <RefreshCw size={13} className="cms-spin" /> : <Upload size={14} />}
                </button>
              </>
            )}

            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files?.length) handleUploadFiles(e.target.files);
                e.target.value = '';
              }}
            />

            {/* Standard 32px Circle Close Button */}
            <button
              onClick={() => {
                soundEffects.play('click');
                onClose();
              }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                background: 'transparent', color: 'var(--cms-text, #fff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* TAB: STOCK PHOTOS (UNSPLASH) */}
        {filter === 'unsplash' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Consistent Sub-Toolbar */}
            <div style={{
              minHeight: 52, padding: '8px 16px',
              borderBottom: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap'
            }}>
              {/* Clean Pill Search Bar */}
              <div style={{
                flex: '1 1 200px', maxWidth: 360, height: 36, display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface-canvas, #0A0B0E)', padding: '0 12px',
                borderRadius: 9999, border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))'
              }}>
                <Search size={14} color="var(--cms-text-muted, #94a3b8)" />
                <input
                  type="text"
                  className="no-focus-ring"
                  value={unsplashQuery}
                  onChange={e => setUnsplashQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearchUnsplash(unsplashQuery);
                  }}
                  placeholder="Cari foto..."
                  style={{
                    background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none',
                    color: 'var(--cms-text, #fff)', fontSize: 12.5, width: '100%', fontWeight: 600,
                    padding: 0
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleSearchUnsplash(unsplashQuery)}
                style={{
                  height: 34, padding: '0 14px', borderRadius: 9999,
                  border: 'none', background: 'var(--cms-accent, #7c3aed)',
                  color: '#fff', fontSize: 12, fontWeight: 750, cursor: 'pointer', flexShrink: 0
                }}
              >
                Cari
              </button>

              {/* Minimal Topic Chips (1-2 words) */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: '100%', scrollbarWidth: 'none' }}>
                {['Minimalist', 'Branding', 'Studio', 'Architecture', 'Workspace'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setUnsplashQuery(tag);
                      handleSearchUnsplash(tag);
                    }}
                    style={{
                      height: 28, padding: '0 10px', borderRadius: 9999,
                      background: 'transparent', border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                      color: 'var(--cms-text-muted, #94a3b8)', fontSize: 11.5, fontWeight: 650, cursor: 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
              {unsplashLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--cms-text-muted)', fontSize: 13, fontWeight: 600 }}>
                  <RefreshCw size={15} className="cms-spin" style={{ marginRight: 8 }} /> Memuat...
                </div>
              ) : (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14
                }}>
                  {unsplashResults.map(photo => (
                    <div
                      key={photo.id}
                      style={{
                        borderRadius: 14, overflow: 'hidden',
                        background: 'var(--surface-card, #181926)',
                        border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                        position: 'relative', display: 'flex', flexDirection: 'column'
                      }}
                    >
                      <div
                        onClick={() => handleSelectUnsplashPhoto(photo, false)}
                        style={{ aspectRatio: '4/3', cursor: 'pointer', overflow: 'hidden' }}
                      >
                        <img
                          src={photo.thumbUrl}
                          alt={photo.alt}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{
                        padding: '6px 10px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', fontSize: 11, background: 'var(--surface-panel, #121318)'
                      }}>
                        <span style={{ color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                          {photo.authorName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectUnsplashPhoto(photo, true)}
                          title="Simpan ke galeri"
                          style={{
                            padding: '3px 8px', borderRadius: 9999, border: 'none',
                            background: 'var(--cms-accent, #7c3aed)', color: '#fff',
                            fontSize: 10.5, fontWeight: 750, cursor: 'pointer'
                          }}
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: LOGO FETCHER (CLEARBIT) */}
        {filter === 'logo-fetch' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{
              width: '100%', maxWidth: 440, background: 'var(--surface-card, #181926)',
              borderRadius: 20, padding: 22, border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
              display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'var(--cms-accent, #7c3aed)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto'
              }}>
                <Globe size={18} />
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--cms-text, #fff)' }}>
                  Logo
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
                  Domain website
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="no-focus-ring"
                  value={brandDomainInput}
                  onChange={e => setBrandDomainInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFetchBrandLogo();
                  }}
                  placeholder="Contoh: traveloka.com"
                  style={{
                    flex: 1, height: 38, padding: '0 12px', borderRadius: 10,
                    background: 'var(--surface-canvas, #0A0B0E)',
                    border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                    color: 'var(--cms-text, #fff)', fontSize: 13, outline: 'none', boxShadow: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleFetchBrandLogo}
                  style={{
                    height: 38, padding: '0 16px', borderRadius: 10, border: 'none',
                    background: 'var(--cms-accent, #7c3aed)', color: '#fff',
                    fontSize: 12.5, fontWeight: 750, cursor: 'pointer'
                  }}
                >
                  Tarik
                </button>
              </div>

              {previewLogoUrl && (
                <div style={{
                  padding: 16, background: 'var(--surface-canvas, #0A0B0E)',
                  borderRadius: 12, border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 12,
                    background: '#fff', padding: 10, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <img
                      src={previewLogoUrl}
                      alt="Logo"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = 'true';
                          const clean = brandDomainInput.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
                          target.src = `https://unavatar.io/${clean}`;
                        }
                      }}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectBrandLogo}
                    style={{
                      height: 34, padding: '0 16px', borderRadius: 9999, border: 'none',
                      background: '#10b981', color: '#fff',
                      fontSize: 12, fontWeight: 750, cursor: 'pointer'
                    }}
                  >
                    Gunakan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: BANNER STUDIO (NON-AI DETERMINISTIC VISUAL ENGINE) */}
        {filter === 'banner-studio' && (
          <div className="media-gallery-banner-split">
            {/* Left: Input & Customization Panel */}
            <div className="media-gallery-banner-sidebar">
              {/* Template Presets (Toko, Kategori, Sampul, Landing) */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Template
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 6 }}>
                  {BANNER_PURPOSE_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        soundEffects.play('pop');
                        setBannerRatio(preset.ratio);
                        setBannerBadge(preset.badge);
                        setBannerHeadline(preset.headline);
                        setBannerSubtitle(preset.subtitle);
                        setBannerBgUrl(preset.bgImageUrl);
                        setBannerOverlayOpacity(preset.overlayOpacity);
                        setBannerLogoPosition(preset.logoPosition);
                        setBannerAccentColor(preset.accentColor);
                      }}
                      style={{
                        height: 32, padding: '0 8px', borderRadius: 8,
                        background: bannerBadge === preset.badge ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, #0A0B0E)',
                        border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                        color: bannerBadge === preset.badge ? '#fff' : 'var(--cms-text, #fff)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ratio Selector */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rasio
                </label>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {(['1:1', '9:16', '16:9', '2.4:1'] as BannerRatio[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        soundEffects.play('pop');
                        setBannerRatio(r);
                      }}
                      style={{
                        flex: 1, height: 30, borderRadius: 8, border: 'none',
                        background: bannerRatio === r ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, #0A0B0E)',
                        color: bannerRatio === r ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
                        fontSize: 11.5, fontWeight: 750, cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Judul
                </label>
                <input
                  type="text"
                  className="no-focus-ring"
                  value={bannerHeadline}
                  onChange={e => setBannerHeadline(e.target.value)}
                  placeholder="Judul utama..."
                  style={{
                    width: '100%', height: 36, padding: '0 10px', marginTop: 4, borderRadius: 8,
                    background: 'var(--surface-canvas, #0A0B0E)',
                    border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                    color: 'var(--cms-text, #fff)', fontSize: 12.5, fontWeight: 650, outline: 'none'
                  }}
                />
              </div>

              {/* Subheadline */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Subjudul
                </label>
                <input
                  type="text"
                  className="no-focus-ring"
                  value={bannerSubtitle}
                  onChange={e => setBannerSubtitle(e.target.value)}
                  placeholder="Deskripsi singkat..."
                  style={{
                    width: '100%', height: 36, padding: '0 10px', marginTop: 4, borderRadius: 8,
                    background: 'var(--surface-canvas, #0A0B0E)',
                    border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                    color: 'var(--cms-text, #fff)', fontSize: 12.5, outline: 'none'
                  }}
                />
              </div>

              {/* Badge */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Label
                </label>
                <input
                  type="text"
                  className="no-focus-ring"
                  value={bannerBadge}
                  onChange={e => setBannerBadge(e.target.value)}
                  placeholder="Contoh: NEW RELEASE"
                  style={{
                    width: '100%', height: 36, padding: '0 10px', marginTop: 4, borderRadius: 8,
                    background: 'var(--surface-canvas, #0A0B0E)',
                    border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                    color: 'var(--cms-text, #fff)', fontSize: 12.5, outline: 'none'
                  }}
                />
              </div>

              {/* Logo domain fetcher */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Logo
                </label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    className="no-focus-ring"
                    value={bannerLogoDomain}
                    onChange={e => setBannerLogoDomain(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleFetchBannerLogo();
                    }}
                    placeholder="Domain misal: spotify.com"
                    style={{
                      flex: 1, height: 34, padding: '0 10px', borderRadius: 8,
                      background: 'var(--surface-canvas, #0A0B0E)',
                      border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                      color: 'var(--cms-text, #fff)', fontSize: 12, outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleFetchBannerLogo}
                    style={{
                      height: 34, padding: '0 12px', borderRadius: 8, border: 'none',
                      background: 'var(--cms-accent, #7c3aed)', color: '#fff',
                      fontSize: 11.5, fontWeight: 750, cursor: 'pointer'
                    }}
                  >
                    Tarik
                  </button>
                </div>
                {/* Logo position buttons */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {([
                    { key: 'topLeft', label: 'Kiri' },
                    { key: 'topRight', label: 'Kanan' },
                    { key: 'center', label: 'Tengah' },
                    { key: 'none', label: 'Tutup' }
                  ] as const).map(pos => (
                    <button
                      key={pos.key}
                      type="button"
                      onClick={() => setBannerLogoPosition(pos.key)}
                      style={{
                        flex: 1, height: 26, borderRadius: 6, border: 'none',
                        background: bannerLogoPosition === pos.key ? 'rgba(124,58,237,0.3)' : 'var(--surface-canvas, #0A0B0E)',
                        color: bannerLogoPosition === pos.key ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text-muted, #94a3b8)',
                        fontSize: 10.5, fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Preset Chips */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Latar Belakang
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {BANNER_BG_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        soundEffects.play('pop');
                        setBannerBgUrl(preset.url);
                      }}
                      style={{
                        padding: '4px 10px', borderRadius: 9999,
                        background: bannerBgUrl === preset.url ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, #0A0B0E)',
                        border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                        color: bannerBgUrl === preset.url ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
                        fontSize: 11, fontWeight: 650, cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders: Tint */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted, #94a3b8)' }}>
                  <span>Gelap</span>
                  <span>{Math.round(bannerOverlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.85"
                  step="0.05"
                  value={bannerOverlayOpacity}
                  onChange={e => setBannerOverlayOpacity(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: 4, cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Right: Live Canvas Preview & Action Bar */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 24, background: 'var(--surface-canvas, #0A0B0E)', position: 'relative', overflow: 'hidden'
            }}>
              {/* Canvas viewport container */}
              <div style={{
                flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', padding: 12
              }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                    borderRadius: 14,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                    border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.1))'
                  }}
                />
              </div>

              {/* Bottom Action Bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={handleDownloadBanner}
                  style={{
                    height: 38, padding: '0 16px', borderRadius: 9999,
                    background: 'var(--surface-card, #181926)',
                    border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.1))',
                    color: 'var(--cms-text, #fff)', fontSize: 12, fontWeight: 750, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Download size={14} /> Unduh
                </button>

                <button
                  type="button"
                  onClick={handleSaveBannerToGallery}
                  style={{
                    height: 38, padding: '0 16px', borderRadius: 9999,
                    background: 'var(--cms-accent, #7c3aed)', border: 'none',
                    color: '#fff', fontSize: 12, fontWeight: 750, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Bookmark size={14} /> Simpan
                </button>

                <button
                  type="button"
                  onClick={handleSelectBanner}
                  style={{
                    height: 38, padding: '0 18px', borderRadius: 9999,
                    background: '#10b981', border: 'none',
                    color: '#fff', fontSize: 12, fontWeight: 750, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Check size={14} /> Gunakan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: LOCAL GALLERY */}
        {filter !== 'unsplash' && filter !== 'logo-fetch' && filter !== 'banner-studio' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                Memuat...
              </div>
            ) : filteredMedia.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--cms-text-muted)', gap: 8 }}>
                <ImageIcon size={36} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: 13, fontWeight: 650 }}>Belum ada media</span>
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14
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
                          soundEffects.play('pop');
                          onSelect(media.url, media.resource_type);
                          onClose();
                        }
                      }}
                      style={{
                        aspectRatio: '1/1', background: 'var(--surface-card, #181926)',
                        borderRadius: 14, overflow: 'hidden', position: 'relative',
                        cursor: 'pointer',
                        border: isSelected 
                          ? '2px solid #ef4444' 
                          : '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {media.resource_type === 'video' ? (
                        <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" />
                      ) : (
                        <img src={getResponsiveImg(media.url, 320, 'auto:eco')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={media.name} loading="lazy" decoding="async" />
                      )}
                      
                      {/* Top Left Selection Checkbox */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSelectMode) setIsSelectMode(true);
                          toggleSelect(media.id, e);
                        }}
                        style={{
                          position: 'absolute', top: 6, left: 6,
                          background: isSelected ? '#ef4444' : 'rgba(0,0,0,0.8)',
                          padding: '3px 6px', borderRadius: 9999, color: '#fff',
                          display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 750,
                          zIndex: 7
                        }}
                      >
                        {isSelected ? <CheckCircle2 size={12} /> : (media.resource_type === 'video' ? <Video size={11} /> : <ImageIcon size={11} />)}
                        <span>{isSelected ? 'Pilih' : media.format || (isImage ? 'IMG' : 'VID')}</span>
                      </div>

                      {/* Top Right Actions */}
                      <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4, zIndex: 5 }}>
                        <button 
                          onClick={(e) => handleCopyUrl(e, media)}
                          style={{
                            background: 'rgba(0,0,0,0.8)',
                            border: 'none', width: 24, height: 24, borderRadius: '50%', color: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Salin"
                        >
                          {copiedId === media.id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                        </button>

                        <button 
                          onClick={(e) => handleDelete(e, media.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.9)',
                            border: 'none', width: 24, height: 24, borderRadius: '50%', color: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* Bottom AI Toolbar Button */}
                      {isImage && !isSelectMode && (
                        <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, zIndex: 6 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEffects.play('pop');
                              setActiveAiMediaId(isAiOpen ? null : media.id);
                            }}
                            style={{
                              width: '100%', padding: '4px 6px', borderRadius: 8, border: 'none',
                              background: 'rgba(0,0,0,0.78)',
                              color: '#fff', fontSize: 10.5, fontWeight: 750, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                            }}
                          >
                            <Sparkles size={11} color="var(--cms-accent, #a855f7)" /> Optimasi
                          </button>

                          {/* AI Menu */}
                          {isAiOpen && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0,
                                background: 'var(--surface-card, #181926)',
                                border: '1px solid var(--surface-border-subtle, rgba(255,255,255,0.08))',
                                borderRadius: 10, padding: 4,
                                display: 'flex', flexDirection: 'column', gap: 2,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                zIndex: 10
                              }}
                            >
                              {[
                                { key: 'enhance', label: 'Enhance', icon: Wand2 },
                                { key: 'bg-remove', label: 'Hapus BG', icon: Scissors },
                                { key: 'upscale', label: 'Upscale', icon: ZoomIn },
                                { key: 'smart-crop', label: 'Crop', icon: Crop }
                              ].map(ai => (
                                <button
                                  key={ai.key}
                                  onClick={(e) => handleApplyAi(e, media, ai.key as CloudinaryAiPreset)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                                    background: 'transparent', border: 'none', borderRadius: 6,
                                    color: 'var(--cms-text, #fff)', fontSize: 11, fontWeight: 650, cursor: 'pointer', textAlign: 'left'
                                  }}
                                >
                                  <ai.icon size={11} /> {ai.label}
                                </button>
                              ))}
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
        )}
      </div>
    </div>,
    document.body
  );
};

export default MediaGalleryModal;
