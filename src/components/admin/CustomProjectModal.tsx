import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Bold, Heading1, Heading2, List, Image as ImageIcon, CheckCircle2, Loader2, Wrench } from 'lucide-react';
import GlassSelect from './GlassSelect';
import { uploadToCloudinary } from '../../utils/cloudinary';
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
const NativeWysiwygEditor: React.FC<{ value: string, onChange: (val: string) => void, placeholder?: string }> = ({ value, onChange, placeholder }) => {
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

  const btnStyle = {
    padding: '6px 10px',
    background: 'var(--cms-switcher-bg)',
    border: 'none',
    borderRadius: 6,
    color: 'var(--cms-text)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ border: '1.5px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden', background: 'var(--cms-input-bg, var(--cms-card-bg))' }}>
      <div style={{ display: 'flex', gap: 6, padding: '8px', borderBottom: '1.5px solid var(--glass-border)', background: 'var(--cms-card-bg)' }}>
        <button type="button" onClick={() => execCmd('bold')} style={btnStyle} title="Bold"><Bold size={14} /></button>
        <button type="button" onClick={() => execCmd('formatBlock', 'H3')} style={btnStyle} title="Heading 1"><Heading1 size={14} /></button>
        <button type="button" onClick={() => execCmd('formatBlock', 'H4')} style={btnStyle} title="Heading 2"><Heading2 size={14} /></button>
        <button type="button" onClick={() => execCmd('insertUnorderedList')} style={btnStyle} title="Bullet List"><List size={14} /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{
          minHeight: 200,
          padding: 16,
          outline: 'none',
          color: 'var(--cms-text)',
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          lineHeight: 1.6,
          overflowY: 'auto'
        }}
        placeholder={placeholder}
      />
    </div>
  );
};

const CustomProjectModal: React.FC<CustomProjectModalProps> = ({ initialData, availableLabels = [], availableCategories = [], onClose, onSave, onDelete, notify }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [customToolInput, setCustomToolInput] = useState('');
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'cover' | 'gallery' | 'video'>('cover');

  // Native 1-step back navigation
  useNativeBackHandler(true, onClose, 'custom_project_modal', 12);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || initialData?.title || '',
    category: initialData?.category || '',
    featuredLabel: initialData?.featuredLabel || '',
    client: initialData?.client || '',
    year: initialData?.year || new Date().getFullYear().toString(),
    coverImage: initialData?.coverImage || '',
    description: initialData?.description || '',
    images: initialData?.images || ([] as string[]),
    tools: (initialData?.tools || initialData?.software || []) as string[],
    mediaType: initialData?.mediaType || 'image',
    youtubeUrl: initialData?.youtubeUrl || '',
    videoUrl: initialData?.videoUrl || '',
    videoOrientation: initialData?.videoOrientation || 'landscape'
  });

  const handleSelectFromGallery = (url: string) => {
    if (galleryTarget === 'cover') {
      setFormData(prev => ({ ...prev, coverImage: url }));
      notify('✅ Cover dipilih dari galeri!');
    } else if (galleryTarget === 'gallery') {
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      notify('✅ Gambar ditambahkan ke galeri proyek!');
    } else if (galleryTarget === 'video') {
      setFormData(prev => ({ ...prev, videoUrl: url }));
      notify('✅ Video dipilih dari galeri!');
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      notify('Judul proyek wajib diisi', 'error');
      return;
    }
    
    try {
      const existing = await storage.getItem('porto_portfolio', []);
      let savedProject;
      const isNew = !initialData?.id;
      if (initialData?.id) {
        savedProject = { ...initialData, ...formData, updatedAt: Date.now() };
        const updated = existing.map((p: any) => p.id === initialData.id ? savedProject : p);
        await storage.setItem('porto_portfolio', updated);
      } else {
        savedProject = {
          id: `prj_${Date.now()}`,
          ...formData,
          createdAt: Date.now()
        };
        await storage.setItem('porto_portfolio', [savedProject, ...existing]);
      }
      
      onSave(savedProject);
      notifyPortfolio(formData.name, isNew ? 'dibuat' : 'disimpan');
      notify(`✅ Karya custom berhasil ${initialData?.id ? 'diperbarui' : 'ditambahkan'}`);
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
      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, coverImage: url }));
      notify('✅ Cover berhasil diunggah');
    } catch (err) {
      notify('Gagal unggah cover', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadToCloudinary(f)));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      notify(`✅ ${urls.length} gambar berhasil diunggah`);
    } catch (err) {
      notify('Gagal unggah galeri', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 18px',
    background: 'var(--cms-input-bg, var(--cms-card-bg))',
    border: '1.5px solid var(--glass-border)',
    borderRadius: 100,
    color: 'var(--cms-text)',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <>
      <style>{`
        .cpm-overlay {
          position: fixed; inset: 0; z-index: 2147483640; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.72); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); animation: cmsFadeIn 0.2s ease both;
        }
        .cpm-modal {
          width: 100%; max-width: 800px; background: var(--cms-card-bg, #ffffff); border-radius: 24px; border: 1.5px solid var(--glass-border); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); display: flex; flex-direction: column; max-height: 90vh; box-shadow: 0 28px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3); overflow: hidden;
        }
        .cpm-header {
          display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--glass-border); flex-shrink: 0;
        }
        .cpm-body {
          flex: 1; overflow-y: auto; display: flex;
        }
        .cpm-main {
          flex: 1; padding: 24px; border-right: 1px solid var(--glass-border); min-width: 0;
        }
        .cpm-sidebar {
          width: 280px; padding: 24px; background: var(--cms-card-bg); flex-shrink: 0;
        }
        .cpm-footer {
          padding: 16px 24px; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; gap: 12px; background: var(--cms-card-bg); flex-shrink: 0; align-items: center;
        }
        .cpm-footer-left, .cpm-footer-right {
           display: flex; gap: 12px; align-items: center;
        }
        @media (max-width: 768px) {
          .cpm-overlay {
            padding: 0;
          }
          .cpm-modal {
            max-height: 100vh; height: 100vh; border-radius: 0; border: none;
          }
          .cpm-header {
            padding: 16px;
          }
          .cpm-body {
            flex-direction: column;
          }
          .cpm-main {
            border-right: none; padding: 16px;
          }
          .cpm-sidebar {
            width: 100%; padding: 16px; border-top: 1px solid var(--glass-border);
          }
          .cpm-footer {
            padding: 16px; padding-bottom: 90px; flex-direction: row; align-items: center; gap: 8px;
          }
          .cpm-footer-left {
            flex: 0 0 auto;
          }
          .cpm-footer-right {
            flex: 1; justify-content: flex-end;
          }
          .cpm-footer button span {
            display: none;
          }
          .cpm-footer button {
            padding: 12px !important;
            border-radius: 12px !important;
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .cpm-btn-save {
            aspect-ratio: auto !important;
            flex: 1;
          }
          .cpm-btn-save span {
            display: inline !important;
          }
        }
      `}</style>
      <div className="cpm-overlay">
        <div className="cpm-modal">
          
          {/* Header */}
          <div className="cpm-header">
            <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--cms-text)' }}>Tambah Karya Custom</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          {/* Body */}
          <div className="cpm-body">
            
            {/* Main Content Area */}
            <div className="cpm-main">
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Judul Proyek</label>
                <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} placeholder="Contoh: Rebranding Apple" />
              </div>

              {/* Media Type Selection */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Tipe Media Utama</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['image', 'video', 'youtube'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--cms-text)' }}>
                      <input 
                        type="radio" 
                        name="mediaType" 
                        value={type} 
                        checked={formData.mediaType === type} 
                        onChange={(e) => setFormData(prev => ({ ...prev, mediaType: e.target.value }))}
                        style={{ accentColor: 'var(--cms-accent)' }}
                      />
                      {type === 'image' ? 'Gambar' : type === 'video' ? 'Video Upload' : 'YouTube Embed'}
                    </label>
                  ))}
                </div>
              </div>

              {/* YouTube URL */}
              {formData.mediaType === 'youtube' && (
                <div style={{ marginBottom: 24, padding: 16, background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 12 }}>
                  <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>URL Video YouTube</label>
                  <input type="text" value={formData.youtubeUrl} onChange={e => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))} style={inputStyle} placeholder="https://www.youtube.com/watch?v=..." />
                </div>
              )}

              {/* Video Upload */}
              {formData.mediaType === 'video' && (
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--cms-switcher-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 12 }}>
                  <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Unggah Video (MP4/WebM)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 10, color: 'var(--cms-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Upload size={16} /> {isUploading ? 'Mengunggah...' : 'Pilih Video'}
                      <input type="file" accept="video/mp4,video/webm" style={{ display: 'none' }} disabled={isUploading} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        try {
                          const url = await uploadToCloudinary(file);
                          setFormData(prev => ({ ...prev, videoUrl: url }));
                          notify('✅ Video berhasil diunggah');
                        } catch (err) {
                          notify('Gagal unggah video', 'error');
                        } finally {
                          setIsUploading(false);
                        }
                      }} />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setGalleryTarget('video'); setShowGalleryModal(true); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--cms-accent-soft)', border: '1.5px solid var(--cms-accent-border)', borderRadius: 10, color: 'var(--cms-accent)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      title="Pilih dari Galeri Video"
                    >
                      <ImageIcon size={15} /> <span>Galeri</span>
                    </button>
                    {formData.videoUrl && <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Video Terunggah</span>}
                  </div>
                </div>
              )}

              {/* Video Orientation (for both video and youtube) */}
              {(formData.mediaType === 'video' || formData.mediaType === 'youtube') && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Orientasi Video (Tampilan Layar)</label>
                  <GlassSelect 
                    value={formData.videoOrientation}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, videoOrientation: e.target.value }))}
                    options={[
                      { value: 'landscape', label: 'Landscape (Horizontal - YouTube style)' },
                      { value: 'portrait', label: 'Portrait (Vertikal - TikTok/Reels style)' }
                    ]}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Cover Uploader */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Thumbnail / Cover Image</label>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 120, height: 90, borderRadius: 12, background: 'var(--cms-switcher-bg)', border: '1.5px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {formData.coverImage ? <img src={formData.coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} color="var(--cms-text-muted)" opacity={0.5} />}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 10, color: 'var(--cms-text)', fontSize: 12.5, fontWeight: 650, cursor: 'pointer', whiteSpace: 'nowrap' }} title="Unggah Cover Baru">
                      <Upload size={15} /> <span>{isUploading ? '...' : 'Upload'}</span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadCover} disabled={isUploading} />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setGalleryTarget('cover'); setShowGalleryModal(true); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--cms-accent-soft)', border: '1.5px solid var(--cms-accent-border)', borderRadius: 10, color: 'var(--cms-accent)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      title="Pilih dari Galeri Media"
                    >
                      <ImageIcon size={15} /> <span>Galeri</span>
                    </button>
                  </div>
                </div>
                <p style={{ margin: '8px 0 0', fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--cms-text-muted)' }}>
                  Rekomendasi ukuran: 1200x800px, Rasio 3:2.
                </p>
              </div>

              {/* Case Study Editor */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Case Study (Deskripsi Proyek)</label>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--cms-text-muted)', fontFamily: "'Inter', sans-serif" }}>Ceritakan latar belakang, tantangan, dan solusi dari proyek ini.</p>
                <NativeWysiwygEditor value={formData.description} onChange={(val) => setFormData(prev => ({ ...prev, description: val }))} />
              </div>

              {/* Gallery Uploader */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', margin: 0 }}>Galeri Proyek (Multiple Images)</label>
                  <button
                    type="button"
                    onClick={() => { setGalleryTarget('gallery'); setShowGalleryModal(true); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--cms-accent-soft)', border: '1px solid var(--cms-accent-border)', borderRadius: 100, color: 'var(--cms-accent)', fontSize: 12, fontWeight: 750, cursor: 'pointer' }}
                  >
                    <ImageIcon size={13} /> Galeri
                  </button>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--cms-text-muted)', fontFamily: "'Inter', sans-serif" }}>
                  Unggah beberapa gambar pendukung yang akan ditampilkan bersusun ke bawah.<br/>
                  Rekomendasi ukuran: Lebar 1400px (tinggi menyesuaikan, kualitas tinggi).
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  {formData.images.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 100, height: 100, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <label style={{ width: 100, height: 100, borderRadius: 10, background: 'var(--cms-switcher-bg)', border: '1.5px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--cms-text-muted)', fontSize: 12, fontWeight: 600, gap: 8 }}>
                    <Plus size={20} /> Upload
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={uploadGallery} disabled={isUploading} />
                  </label>
                </div>
              </div>

            </div>

            {/* Right Sidebar (Advanced Settings) */}
            <div className="cpm-sidebar">
              <h3 style={{ margin: '0 0 16px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>Pengaturan Lanjutan</h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Kategori</label>
                <GlassSelect 
                  value={formData.category} 
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} 
                  options={[{value: '', label: 'Pilih...'}, ...availableCategories.map(cat => ({ value: cat, label: cat }))]}
                  style={inputStyle}
                  placeholder="Pilih..."
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Label Unggulan</label>
                <GlassSelect 
                  value={formData.featuredLabel} 
                  onChange={e => setFormData(prev => ({ ...prev, featuredLabel: e.target.value }))} 
                  options={[{value: '', label: '-- Tidak ada --'}, ...availableLabels.map(label => ({ value: label, label: label }))]}
                  style={inputStyle}
                  placeholder="-- Tidak ada --"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Klien</label>
                <input type="text" value={formData.client} onChange={e => setFormData(prev => ({ ...prev, client: e.target.value }))} style={inputStyle} placeholder="Contoh: PT Studio Kreatif" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>Tahun Proyek</label>
                <input type="text" value={formData.year} onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))} style={inputStyle} placeholder="2026" />
              </div>

              {/* Software / Tools Emblems */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', margin: 0 }}>
                    <Wrench size={14} color="var(--cms-accent)" /> Software & Tools ({formData.tools.length})
                  </label>
                  {formData.tools.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tools: [] }))}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Trash2 size={11} /> Hapus
                    </button>
                  )}
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 11.5, color: 'var(--cms-text-muted)', fontFamily: "'Inter', sans-serif" }}>
                  Pilih emblem software yang digunakan pada karya ini:
                </p>

                {/* Active Selected Tools */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {formData.tools.map((t) => (
                    <SoftwareBadge
                      key={t}
                      name={t}
                      size="sm"
                      isDark={false}
                      onRemove={() => setFormData(prev => ({ ...prev, tools: prev.tools.filter(x => x !== t) }))}
                    />
                  ))}
                  {formData.tools.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontStyle: 'italic' }}>Belum ada software dipilih</span>
                  )}
                </div>

                {/* Quick Add Popular Software Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 125, overflowY: 'auto', padding: '8px', background: 'var(--cms-input-bg, #f8fafc)', borderRadius: 12, border: '1.5px solid var(--glass-border)', marginBottom: 8 }}>
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
                          padding: '4px 10px',
                          borderRadius: 100,
                          border: `1.5px solid ${isSelected ? sw.color : 'var(--glass-border, #cbd5e1)'}`,
                          background: isSelected ? `${sw.color}22` : 'var(--cms-card-bg, #ffffff)',
                          color: isSelected ? sw.color : 'var(--cms-text, #334155)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s'
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
                    placeholder="Tambah software lain..."
                    style={{ ...inputStyle, padding: '6px 12px', fontSize: 12 }}
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
                    style={{
                      padding: '6px 12px',
                      borderRadius: 100,
                      background: 'var(--cms-accent)',
                      color: '#fff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="cpm-footer">
            <div className="cpm-footer-left">
              {initialData?.id && onDelete && (
                <button onClick={() => { if (confirm('Yakin ingin menghapus karya ini?')) onDelete(initialData.id); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontWeight: 600 }}>
                  <Trash2 size={16} /> <span>Hapus</span>
                </button>
              )}
            </div>
            <div className="cpm-footer-right">
              <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'transparent', color: 'var(--cms-text)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 600 }}>
                <X size={16} /> <span>Batal</span>
              </button>
              <button className="cpm-btn-save" onClick={handleSave} disabled={isUploading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, background: 'var(--cms-accent)', color: '#fff', border: 'none', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isUploading ? 0.7 : 1 }}>
                {isUploading ? <Loader2 size={16} className="cms-spin" /> : <CheckCircle2 size={16} />} <span>Simpan</span>
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
