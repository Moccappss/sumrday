import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, Upload, Plus, Trash2, Bold, Heading1, Heading2, List,
  Image as ImageIcon, CheckCircle2, Loader2, Wrench, Box,
  Video, Play, BookOpen, Monitor, Smartphone
} from 'lucide-react';
import GlassSelect from './GlassSelect';
import Model3DViewer from '../common/Model3DViewer';
import PdfFlipbookViewer from '../common/PdfFlipbookViewer';
import { uploadToCloudinary, getCloudinaryPdfPageUrl } from '../../utils/cloudinary';
import { storage } from '../../utils/storage';
import { notifyPortfolio } from '../../utils/notifications';
import { POPULAR_SOFTWARE_LIST } from '../../utils/softwareEmblems';
import SoftwareBadge from '../common/SoftwareBadge';
import { useNativeBackHandler } from '../../utils/nativeNavigation';
import MediaGalleryModal from './MediaGalleryModal';

interface CustomProjectModalProps {
  initialData?: any;
  availableLabels?: string[];
  availableCategories?: string[];
  onClose: () => void;
  onSave: (project: any) => void;
  onDelete?: (id: string) => void;
  notify: (msg: string, type?: string) => void;
}

// ── Native WYSIWYG Editor ──
const NativeWysiwygEditor: React.FC<{ value: string; onChange: (val: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const btnStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    background: 'var(--cms-switcher-bg)',
    border: 'none',
    borderRadius: 7,
    color: 'var(--cms-text)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ border: '1.5px solid var(--glass-border)', borderRadius: 12, overflow: 'hidden', background: 'var(--cms-input-bg, var(--cms-card-bg))' }}>
      <div style={{ display: 'flex', gap: 5, padding: '5px 8px', borderBottom: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)' }}>
        <button type="button" onClick={() => execCmd('bold')} style={btnStyle} title="Tebal"><Bold size={13} /></button>
        <button type="button" onClick={() => execCmd('formatBlock', 'H3')} style={btnStyle} title="Judul 1"><Heading1 size={13} /></button>
        <button type="button" onClick={() => execCmd('formatBlock', 'H4')} style={btnStyle} title="Judul 2"><Heading2 size={13} /></button>
        <button type="button" onClick={() => execCmd('insertUnorderedList')} style={btnStyle} title="Daftar"><List size={13} /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{
          minHeight: 110,
          maxHeight: 180,
          padding: 12,
          outline: 'none',
          color: 'var(--cms-text)',
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          lineHeight: 1.55,
          overflowY: 'auto'
        }}
        placeholder={placeholder}
      />
    </div>
  );
};

const MEDIA_MODES = [
  { id: 'image', label: 'Gambar', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'youtube', label: 'YouTube', icon: Play },
  { id: '3d', label: '3D', icon: Box },
  { id: 'flipbook', label: 'Flipbook', icon: BookOpen },
] as const;

const parseYoutubeEmbed = (rawUrl: string): string => {
  const raw = (rawUrl || '').trim();
  if (!raw) return '';
  try {
    const match = raw.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?/\s]{11})/i);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }
    if (raw.length === 11) {
      return `https://www.youtube.com/embed/${raw}?rel=0&modestbranding=1`;
    }
  } catch {}
  return '';
};

const CustomProjectModal: React.FC<CustomProjectModalProps> = ({
  initialData,
  availableLabels = [],
  availableCategories = [],
  onClose,
  onSave,
  onDelete,
  notify
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [customToolInput, setCustomToolInput] = useState('');
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'cover' | 'gallery' | 'video' | 'flipbook'>('cover');
  const [localPdfBlobUrl, setLocalPdfBlobUrl] = useState<string>('');
  const pdfBlobRef = useRef<string | null>(null);

  // Native 1-step back navigation
  useNativeBackHandler(true, onClose, 'custom_project_modal', 12);

  useEffect(() => {
    return () => {
      if (pdfBlobRef.current) {
        URL.revokeObjectURL(pdfBlobRef.current);
        pdfBlobRef.current = null;
      }
    };
  }, []);

  const resolvedInitialMediaType =
    initialData?.mediaType ||
    (initialData?.pdfUrl ? 'flipbook' : initialData?.model3dUrl ? '3d' : initialData?.youtubeUrl ? 'youtube' : initialData?.videoUrl ? 'video' : 'image');

  const [formData, setFormData] = useState({
    name: initialData?.name || initialData?.title || '',
    category: initialData?.category || '',
    featuredLabel: initialData?.featuredLabel || '',
    client: initialData?.client || '',
    year: initialData?.year || new Date().getFullYear().toString(),
    coverImage: initialData?.coverImage || initialData?.image || '',
    description: initialData?.description || '',
    images: (initialData?.images || initialData?.gallery || []) as string[],
    tools: (initialData?.tools || initialData?.software || []) as string[],
    mediaType: resolvedInitialMediaType,
    youtubeUrl: initialData?.youtubeUrl || '',
    videoUrl: initialData?.videoUrl || '',
    videoOrientation: initialData?.videoOrientation || 'landscape',
    model3dUrl: initialData?.model3dUrl || '',
    pdfUrl: initialData?.pdfUrl || '',
    pdfTotalPages: initialData?.pdfTotalPages || 8
  });

  const extractUrl = (res: any): string => {
    if (!res) return '';
    return typeof res === 'string' ? res : (res.url || '');
  };

  const handleSelectFromGallery = (url: string) => {
    if (galleryTarget === 'cover') {
      setFormData(prev => ({ ...prev, coverImage: url }));
      notify('✅ Sampul dipilih');
    } else if (galleryTarget === 'gallery') {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      notify('✅ Ditambahkan ke galeri');
    } else if (galleryTarget === 'video') {
      setFormData(prev => ({ ...prev, videoUrl: url }));
      notify('✅ Video dipilih');
    } else if (galleryTarget === 'flipbook') {
      const coverCandidate = getCloudinaryPdfPageUrl(url, 1, { width: 1000 });
      setFormData(prev => ({
        ...prev,
        pdfUrl: url,
        coverImage: prev.coverImage || coverCandidate || prev.coverImage
      }));
      notify('✅ Flipbook dipilih');
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      notify('Judul wajib diisi', 'error');
      return;
    }

    try {
      const existing = await storage.getItem<any[]>('porto_portfolio', []);
      let savedProject;
      const isNew = !initialData?.id;
      if (initialData?.id) {
        savedProject = { ...initialData, ...formData, updatedAt: Date.now() };
        const updated = (existing || []).map((p: any) => p.id === initialData.id ? savedProject : p);
        await storage.setItem('porto_portfolio', updated);
      } else {
        savedProject = {
          id: `prj_${Date.now()}`,
          ...formData,
          createdAt: Date.now()
        };
        await storage.setItem('porto_portfolio', [savedProject, ...(existing || [])]);
      }

      onSave(savedProject);
      notifyPortfolio(formData.name, isNew ? 'dibuat' : 'disimpan');
      notify(`✅ Karya ${initialData?.id ? 'diperbarui' : 'ditambahkan'}`);
      onClose();
    } catch (err) {
      console.error(err);
      notify('Gagal menyimpan karya', 'error');
    }
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadToCloudinary(file);
      const url = extractUrl(res);
      if (url) {
        setFormData(prev => ({ ...prev, coverImage: url }));
        notify('✅ Sampul diunggah');
      }
    } catch {
      notify('Gagal unggah sampul', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const results = await Promise.all(files.map(f => uploadToCloudinary(f)));
      const urls = results.map(extractUrl).filter(Boolean);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls],
        coverImage: prev.coverImage || urls[0] || ''
      }));
      notify(`✅ ${urls.length} gambar diunggah`);
    } catch {
      notify('Gagal unggah galeri', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const youtubeEmbedUrl = useMemo(() => parseYoutubeEmbed(formData.youtubeUrl), [formData.youtubeUrl]);
  const activeImagePreview = formData.coverImage || formData.images[0] || '';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    padding: '0 12px',
    background: 'var(--cms-input-bg, var(--cms-card-bg))',
    border: '1.5px solid var(--glass-border)',
    borderRadius: 10,
    color: 'var(--cms-text)',
    fontFamily: "'Inter', sans-serif",
    fontSize: 12.5,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: '1.5px solid var(--glass-border)',
    background: 'var(--cms-card-bg)',
    color: 'var(--cms-text)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 12,
    fontWeight: 800,
    color: 'var(--cms-text)',
    marginBottom: 5,
    letterSpacing: '0.01em'
  };

  const renderOrientationToggle = () => (
    <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 10, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', flexShrink: 0, height: 36, boxSizing: 'border-box', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setFormData(prev => ({ ...prev, videoOrientation: 'landscape' }))}
        title="Horizontal (16:9)"
        style={{
          width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
          background: formData.videoOrientation !== 'portrait' ? 'var(--cms-accent)' : 'transparent',
          color: formData.videoOrientation !== 'portrait' ? '#fff' : 'var(--cms-text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <Monitor size={13} />
      </button>
      <button
        type="button"
        onClick={() => setFormData(prev => ({ ...prev, videoOrientation: 'portrait' }))}
        title="Vertikal (9:16)"
        style={{
          width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
          background: formData.videoOrientation === 'portrait' ? 'var(--cms-accent)' : 'transparent',
          color: formData.videoOrientation === 'portrait' ? '#fff' : 'var(--cms-text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <Smartphone size={13} />
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        .cpm-overlay {
          position: fixed; inset: 0; z-index: 2147483640; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(4, 4, 8, 0.78); animation: cmsFadeIn 0.18s ease both;
        }
        .cpm-modal {
          width: 960px; max-width: calc(100vw - 32px); height: 86vh; min-height: 640px; max-height: 820px; background: var(--cms-card-bg, #181924); border-radius: 20px; border: 1.5px solid var(--glass-border); display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.45); overflow: hidden;
        }
        .cpm-header {
          display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid var(--glass-border); flex-shrink: 0;
        }
        .cpm-body {
          flex: 1; min-height: 0; overflow: hidden; display: flex;
        }
        .cpm-main {
          flex: 1; padding: 16px 20px; border-right: 1px solid var(--glass-border); min-width: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;
        }
        .cpm-sidebar {
          width: 280px; padding: 16px 18px; background: var(--cms-card-bg); flex-shrink: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
        }
        .cpm-footer {
          padding: 10px 20px; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; gap: 10px; background: var(--cms-card-bg); flex-shrink: 0; align-items: center;
        }
        .cpm-footer-left, .cpm-footer-right {
          display: flex; gap: 8px; align-items: center;
        }
        @media (max-width: 768px) {
          .cpm-overlay { padding: 0; }
          .cpm-modal { width: 100vw; max-width: 100vw; height: 100vh; max-height: 100vh; min-height: 100vh; border-radius: 0; border: none; }
          .cpm-body { flex-direction: column; overflow-y: auto; }
          .cpm-main { border-right: none; padding: 14px; overflow-y: visible; }
          .cpm-sidebar { width: 100%; padding: 14px; border-top: 1px solid var(--glass-border); overflow-y: visible; }
          .cpm-footer { padding: 12px 14px 86px; }
        }
      `}</style>
      <div className="cpm-overlay" onClick={onClose}>
        <div className="cpm-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="cpm-header">
            <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 850, color: 'var(--cms-text)' }}>
              {initialData?.id ? 'Edit Karya' : 'Tambah Karya'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              title="Tutup"
              style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--cms-input-bg)', border: 'none', color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="cpm-body">

            {/* Main Content Area */}
            <div className="cpm-main">
              {/* Judul */}
              <div>
                <label style={labelStyle}>Judul</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={inputStyle}
                  placeholder="Judul karya..."
                />
              </div>

              {/* Media Mode Switch (Icon + 1-Word Label) + Unified Fixed-Height Large Preview Stage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Media</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 4,
                    padding: 4,
                    borderRadius: 12,
                    background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                    border: '1.5px solid var(--glass-border)'
                  }}>
                    {MEDIA_MODES.map((m) => {
                      const Icon = m.icon;
                      const isActive = formData.mediaType === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, mediaType: m.id }))}
                          title={m.label}
                          style={{
                            height: 32,
                            borderRadius: 8,
                            border: 'none',
                            background: isActive ? 'var(--cms-accent, #6366f1)' : 'transparent',
                            color: isActive ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 12,
                            fontWeight: isActive ? 800 : 650,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            transition: 'background 0.15s ease, color 0.15s ease',
                            boxShadow: 'none',
                            padding: '0 6px',
                            minWidth: 0
                          }}
                        >
                          <Icon size={14} strokeWidth={2.3} style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── UNIFIED FIXED-HEIGHT MEDIA STAGE (414px across ALL 5 modes -> ZERO HEIGHT JUMP!) ── */}
                <div style={{
                  padding: 12,
                  background: 'var(--cms-switcher-bg)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  height: 414,
                  minHeight: 414,
                  maxHeight: 414,
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  {/* 1. MODE: GAMBAR */}
                  {formData.mediaType === 'image' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, flexShrink: 0 }}>
                        <label
                          title="Upload Gambar"
                          style={{
                            ...iconBtnStyle,
                            borderColor: 'var(--cms-accent-border)',
                            color: 'var(--cms-accent)',
                            background: 'var(--cms-accent-soft)',
                            cursor: isUploading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isUploading ? <Loader2 size={15} className="cms-spin" /> : <Upload size={15} />}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadCover} disabled={isUploading} />
                        </label>
                        <button
                          type="button"
                          onClick={() => { setGalleryTarget('cover'); setShowGalleryModal(true); }}
                          style={iconBtnStyle}
                          title="Galeri Media"
                        >
                          <ImageIcon size={15} />
                        </button>
                        <input
                          type="text"
                          value={formData.coverImage}
                          onChange={e => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder="URL Gambar Utama..."
                        />
                        {formData.coverImage && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                            style={{ ...iconBtnStyle, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }}
                            title="Hapus Gambar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div style={{
                        flex: 1,
                        height: 344,
                        minHeight: 344,
                        maxHeight: 344,
                        borderRadius: 12,
                        background: 'radial-gradient(circle at 50% 35%, #181d28 0%, #0d111a 75%, #080a0f 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        {activeImagePreview ? (
                          <img
                            src={activeImagePreview}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                          />
                        ) : (
                          <label
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--cms-text-muted)' }}
                            title="Klik untuk Upload Gambar"
                          >
                            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent)' }}>
                              <Upload size={22} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Upload Gambar</span>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadCover} disabled={isUploading} />
                          </label>
                        )}
                      </div>
                    </>
                  )}

                  {/* 2. MODE: VIDEO */}
                  {formData.mediaType === 'video' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, flexShrink: 0 }}>
                        <label
                          title="Upload Video (MP4/WebM)"
                          style={{
                            ...iconBtnStyle,
                            borderColor: 'var(--cms-accent-border)',
                            color: 'var(--cms-accent)',
                            background: 'var(--cms-accent-soft)',
                            cursor: isUploading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isUploading ? <Loader2 size={15} className="cms-spin" /> : <Upload size={15} />}
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            style={{ display: 'none' }}
                            disabled={isUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploading(true);
                              try {
                                const res = await uploadToCloudinary(file, 'video');
                                const url = extractUrl(res);
                                if (url) {
                                  setFormData(prev => ({ ...prev, videoUrl: url }));
                                  notify('✅ Video diunggah');
                                }
                              } catch {
                                notify('Gagal unggah video', 'error');
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => { setGalleryTarget('video'); setShowGalleryModal(true); }}
                          style={iconBtnStyle}
                          title="Galeri Media"
                        >
                          <ImageIcon size={15} />
                        </button>
                        <input
                          type="text"
                          value={formData.videoUrl}
                          onChange={e => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder="URL Video MP4/WebM..."
                        />
                        {renderOrientationToggle()}
                      </div>

                      <div style={{
                        flex: 1,
                        height: 344,
                        minHeight: 344,
                        maxHeight: 344,
                        borderRadius: 12,
                        background: 'radial-gradient(circle at 50% 35%, #181d28 0%, #0d111a 75%, #080a0f 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {formData.videoUrl ? (
                          <video
                            src={formData.videoUrl}
                            controls
                            playsInline
                            style={{
                              width: formData.videoOrientation === 'portrait' ? 'auto' : '100%',
                              height: '100%',
                              aspectRatio: formData.videoOrientation === 'portrait' ? '9/16' : undefined,
                              objectFit: 'contain',
                              background: '#000'
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--cms-text-muted)' }}>
                            <Video size={28} opacity={0.45} />
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Preview Video</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* 3. MODE: YOUTUBE */}
                  {formData.mediaType === 'youtube' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, flexShrink: 0 }}>
                        <input
                          type="text"
                          value={formData.youtubeUrl}
                          onChange={e => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {renderOrientationToggle()}
                      </div>

                      <div style={{
                        flex: 1,
                        height: 344,
                        minHeight: 344,
                        maxHeight: 344,
                        borderRadius: 12,
                        background: 'radial-gradient(circle at 50% 35%, #181d28 0%, #0d111a 75%, #080a0f 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {youtubeEmbedUrl ? (
                          <iframe
                            src={youtubeEmbedUrl}
                            title={formData.name || 'YouTube'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                              width: formData.videoOrientation === 'portrait' ? 'auto' : '100%',
                              height: '100%',
                              aspectRatio: formData.videoOrientation === 'portrait' ? '9/16' : undefined,
                              border: 'none',
                              display: 'block'
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--cms-text-muted)' }}>
                            <Play size={28} opacity={0.45} />
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Preview YouTube</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* 4. MODE: 3D */}
                  {formData.mediaType === '3d' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, flexShrink: 0 }}>
                        <label
                          title="Upload File .glb / .gltf"
                          style={{
                            ...iconBtnStyle,
                            borderColor: 'var(--cms-accent-border)',
                            color: 'var(--cms-accent)',
                            background: 'var(--cms-accent-soft)',
                            cursor: isUploading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isUploading ? <Loader2 size={15} className="cms-spin" /> : <Upload size={15} />}
                          <input
                            type="file"
                            accept=".glb,.gltf"
                            style={{ display: 'none' }}
                            disabled={isUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploading(true);
                              try {
                                notify('⏳ Mengunggah 3D...');
                                const res = await uploadToCloudinary(file, 'raw');
                                const url = extractUrl(res);
                                if (url) {
                                  setFormData(prev => ({ ...prev, model3dUrl: url }));
                                  notify('✅ Model 3D terunggah');
                                }
                              } catch {
                                notify('Gagal unggah 3D', 'error');
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={formData.model3dUrl}
                          onChange={e => setFormData(prev => ({ ...prev, model3dUrl: e.target.value }))}
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder="URL .glb atau /models/nama.glb"
                        />
                      </div>

                      <Model3DViewer
                        src={formData.model3dUrl}
                        height={344}
                        title={formData.name || '3D'}
                        allowLocalUpload={true}
                      />
                    </>
                  )}

                  {/* 5. MODE: FLIPBOOK */}
                  {formData.mediaType === 'flipbook' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, flexShrink: 0 }}>
                        <label
                          title="Upload PDF Flipbook"
                          style={{
                            ...iconBtnStyle,
                            borderColor: 'var(--cms-accent-border)',
                            color: 'var(--cms-accent)',
                            background: 'var(--cms-accent-soft)',
                            cursor: isUploading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isUploading ? <Loader2 size={15} className="cms-spin" /> : <Upload size={15} />}
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            style={{ display: 'none' }}
                            disabled={isUploading}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              // Create instant local blob URL so PDF.js renders immediately
                              if (pdfBlobRef.current) {
                                URL.revokeObjectURL(pdfBlobRef.current);
                              }
                              const blobUrl = URL.createObjectURL(file);
                              pdfBlobRef.current = blobUrl;
                              setLocalPdfBlobUrl(blobUrl);

                              setIsUploading(true);
                              try {
                                notify('⏳ Mengunggah PDF...');
                                const res = await uploadToCloudinary(file, 'auto');
                                const url = extractUrl(res);
                                if (url) {
                                  const detectedPages = (res && typeof res === 'object' && res.pages) ? res.pages : undefined;
                                  const firstPageCover = getCloudinaryPdfPageUrl(url, 1, { width: 1000 });
                                  setFormData(prev => ({
                                    ...prev,
                                    pdfUrl: url,
                                    pdfTotalPages: detectedPages || prev.pdfTotalPages || 8,
                                    coverImage: prev.coverImage || firstPageCover || prev.coverImage
                                  }));
                                  notify('✅ PDF Flipbook terunggah');
                                }
                              } catch {
                                notify('Gagal unggah PDF', 'error');
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => { setGalleryTarget('flipbook'); setShowGalleryModal(true); }}
                          style={iconBtnStyle}
                          title="Galeri Media"
                        >
                          <ImageIcon size={15} />
                        </button>
                        <input
                          type="text"
                          value={formData.pdfUrl}
                          onChange={e => {
                            setLocalPdfBlobUrl('');
                            setFormData(prev => ({ ...prev, pdfUrl: e.target.value }));
                          }}
                          style={{ ...inputStyle, flex: 1 }}
                          placeholder="URL PDF / Flipbook..."
                        />
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={formData.pdfTotalPages}
                          onChange={e => setFormData(prev => ({ ...prev, pdfTotalPages: Math.max(1, Number(e.target.value) || 1) }))}
                          style={{ ...inputStyle, width: 58, textAlign: 'center', padding: '0 6px' }}
                          title="Jumlah Halaman"
                          placeholder="Hal"
                        />
                      </div>

                      <div style={{
                        flex: 1,
                        height: 344,
                        minHeight: 344,
                        maxHeight: 344,
                        borderRadius: 12,
                        background: 'radial-gradient(circle at 50% 35%, #181d28 0%, #0d111a 75%, #080a0f 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <PdfFlipbookViewer
                          pdfUrl={localPdfBlobUrl || formData.pdfUrl}
                          totalPages={Number(formData.pdfTotalPages) || 8}
                          title={formData.name || 'Flipbook'}
                          height={344}
                          allowDownload={true}
                          showModeSwitch={true}
                          onTotalPagesDetected={(num) => {
                            setFormData(prev => (prev.pdfTotalPages === num ? prev : { ...prev, pdfTotalPages: num }));
                          }}
                          onFirstPageRendered={(dataUrl) => {
                            setFormData(prev => (prev.coverImage ? prev : { ...prev, coverImage: dataUrl }));
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── GALERI (Icon-Only Header Actions) ── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Galeri ({formData.images.length})</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label
                      style={{ ...iconBtnStyle, width: 30, height: 30, borderRadius: 8 }}
                      title="Upload Galeri"
                    >
                      <Upload size={13} />
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={uploadGallery} disabled={isUploading} />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setGalleryTarget('gallery'); setShowGalleryModal(true); }}
                      style={{ ...iconBtnStyle, width: 30, height: 30, borderRadius: 8, background: 'var(--cms-accent-soft)', borderColor: 'var(--cms-accent-border)', color: 'var(--cms-accent)' }}
                      title="Galeri Media"
                    >
                      <ImageIcon size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {formData.images.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 64, height: 64, borderRadius: 9, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        title="Hapus"
                        style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: 5, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                  <label
                    title="Tambah Gambar"
                    style={{ width: 64, height: 64, borderRadius: 9, background: 'var(--cms-switcher-bg)', border: '1.5px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--cms-text-muted)' }}
                  >
                    <Plus size={18} />
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={uploadGallery} disabled={isUploading} />
                  </label>
                </div>
              </div>

              {/* ── DESKRIPSI ── */}
              <div>
                <label style={labelStyle}>Deskripsi</label>
                <NativeWysiwygEditor
                  value={formData.description}
                  onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                />
              </div>

            </div>

            {/* Right Sidebar (Atribut & Sampul) */}
            <div className="cpm-sidebar">
              {/* Sampul (Always consistent in Sidebar) */}
              <div>
                <label style={labelStyle}>Sampul</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 72, height: 50, borderRadius: 9, background: 'var(--cms-switcher-bg)', border: '1.5px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {formData.coverImage ? (
                      <img src={formData.coverImage} alt="Sampul" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={16} color="var(--cms-text-muted)" opacity={0.5} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <label style={iconBtnStyle} title="Upload Sampul">
                      {isUploading ? <Loader2 size={15} className="cms-spin" /> : <Upload size={15} />}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadCover} disabled={isUploading} />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setGalleryTarget('cover'); setShowGalleryModal(true); }}
                      style={{ ...iconBtnStyle, background: 'var(--cms-accent-soft)', borderColor: 'var(--cms-accent-border)', color: 'var(--cms-accent)' }}
                      title="Galeri Media"
                    >
                      <ImageIcon size={15} />
                    </button>
                    {formData.coverImage && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                        style={{ ...iconBtnStyle, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }}
                        title="Hapus Sampul"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Kategori</label>
                <GlassSelect
                  value={formData.category}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  options={[{ value: '', label: 'Pilih...' }, ...availableCategories.map(cat => ({ value: cat, label: cat }))]}
                  style={inputStyle}
                  placeholder="Pilih..."
                />
              </div>

              <div>
                <label style={labelStyle}>Label</label>
                <GlassSelect
                  value={formData.featuredLabel}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, featuredLabel: e.target.value }))}
                  options={[{ value: '', label: '-- Tidak ada --' }, ...availableLabels.map(label => ({ value: label, label: label }))]}
                  style={inputStyle}
                  placeholder="-- Tidak ada --"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 84px', gap: 8 }}>
                <div>
                  <label style={labelStyle}>Klien</label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={e => setFormData(prev => ({ ...prev, client: e.target.value }))}
                    style={inputStyle}
                    placeholder="Klien..."
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tahun</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    style={{ ...inputStyle, textAlign: 'center', padding: '0 6px' }}
                    placeholder="2026"
                  />
                </div>
              </div>

              {/* Tools */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Wrench size={13} color="var(--cms-accent)" /> Tools ({formData.tools.length})
                  </label>
                  {formData.tools.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tools: [] }))}
                      title="Reset Tools"
                      style={{
                        width: 24,
                        height: 24,
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: 'none',
                        color: '#ef4444',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Active Selected Tools */}
                {formData.tools.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {formData.tools.map((t) => (
                      <SoftwareBadge
                        key={t}
                        name={t}
                        size="sm"
                        isDark={false}
                        onRemove={() => setFormData(prev => ({ ...prev, tools: prev.tools.filter(x => x !== t) }))}
                      />
                    ))}
                  </div>
                )}

                {/* Quick Add Popular Software Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 120, overflowY: 'auto', padding: 6, background: 'var(--cms-input-bg)', borderRadius: 10, border: '1.5px solid var(--glass-border)', marginBottom: 6 }}>
                  {POPULAR_SOFTWARE_LIST.map((sw) => {
                    const isSelected = formData.tools.includes(sw.name) || formData.tools.includes(sw.id);
                    return (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData(prev => ({ ...prev, tools: prev.tools.filter(x => x !== sw.name && x !== sw.id) }));
                          } else {
                            setFormData(prev => ({ ...prev, tools: [...prev.tools, sw.name] }));
                          }
                        }}
                        style={{
                          padding: '3px 9px',
                          borderRadius: 100,
                          border: `1.5px solid ${isSelected ? sw.color : 'var(--glass-border)'}`,
                          background: isSelected ? `${sw.color}20` : 'var(--cms-card-bg)',
                          color: isSelected ? sw.color : 'var(--cms-text)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}{sw.name}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Tool Input */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={customToolInput}
                    onChange={(e) => setCustomToolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = customToolInput.trim();
                        if (val && !formData.tools.includes(val)) {
                          setFormData(prev => ({ ...prev, tools: [...prev.tools, val] }));
                          setCustomToolInput('');
                        }
                      }
                    }}
                    placeholder="Tambah tool..."
                    style={{ ...inputStyle, height: 34, fontSize: 12 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customToolInput.trim();
                      if (val && !formData.tools.includes(val)) {
                        setFormData(prev => ({ ...prev, tools: [...prev.tools, val] }));
                        setCustomToolInput('');
                      }
                    }}
                    title="Tambah Tool"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: 'var(--cms-accent)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer (Icon-Focused & Compact) */}
          <div className="cpm-footer">
            <div className="cpm-footer-left">
              {initialData?.id && onDelete && (
                <button
                  type="button"
                  onClick={() => { if (confirm('Hapus karya ini?')) onDelete(initialData.id); }}
                  title="Hapus Karya"
                  style={{ ...iconBtnStyle, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.22)' }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="cpm-footer-right">
              <button
                type="button"
                onClick={onClose}
                title="Batal"
                style={iconBtnStyle}
              >
                <X size={15} />
              </button>
              <button
                type="button"
                className="cpm-btn-save"
                onClick={handleSave}
                disabled={isUploading}
                style={{
                  height: 36,
                  padding: '0 18px',
                  borderRadius: 10,
                  background: 'var(--cms-accent)',
                  color: '#fff',
                  border: 'none',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontWeight: 750,
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isUploading ? 0.7 : 1,
                  boxShadow: 'none'
                }}
              >
                {isUploading ? <Loader2 size={15} className="cms-spin" /> : <CheckCircle2 size={15} />}
                <span>Simpan</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <MediaGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onSelect={(url) => handleSelectFromGallery(url)}
      />
    </>
  );
};

export default CustomProjectModal;
