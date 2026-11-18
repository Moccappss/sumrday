import React, { useState, useMemo, useRef } from 'react';
import { 
  ShieldCheck, X, Plus, CheckCircle2, Pin, Copy, ExternalLink,
  Upload, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import ProtectedPreviewImage from '../../common/ProtectedPreviewImage';
import { uploadToCloudinary } from '../../../utils/cloudinary';

export interface ProjectProofingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  updateProject: (id: any, data: any) => void;
  notify?: (msg: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

export const ProjectProofingModal: React.FC<ProjectProofingModalProps> = ({
  isOpen,
  onClose,
  project,
  updateProject,
  notify
}) => {
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [proofingWatermarkStyle, setProofingWatermarkStyle] = useState<'grid' | 'center' | 'bottom'>('grid');
  const [proofingWatermarkTheme, setProofingWatermarkTheme] = useState<'frosted' | 'gold' | 'crimson'>('frosted');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !project) return null;

  // Extract multi-slide preview images list
  const imageList: string[] = useMemo(() => {
    if (Array.isArray(project.proofingImages) && project.proofingImages.length > 0) {
      return project.proofingImages;
    }
    const list: string[] = [];
    if (project.coverImage) list.push(project.coverImage);
    if (Array.isArray(project.files)) {
      project.files.forEach((f: any) => {
        if (f?.url && !list.includes(f.url)) list.push(f.url);
      });
    }
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85');
    }
    return list;
  }, [project.proofingImages, project.coverImage, project.files]);

  const currentImg = imageList[activeSlideIndex] || imageList[0];
  const annotations = Array.isArray(project.proofingAnnotations) ? project.proofingAnnotations : [];
  const safeActivity = Array.isArray(project.activity) ? project.activity : [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    notify?.('Mengunggah gambar preview...', 'info');

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let uploadedUrl = '';
        try {
          uploadedUrl = await uploadToCloudinary(file);
        } catch {
          // Fallback to Base64 data URL if offline/upload failed
          uploadedUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        if (uploadedUrl) newUrls.push(uploadedUrl);
      }

      if (newUrls.length > 0) {
        const updatedImages = [...imageList, ...newUrls];
        updateProject(project.id, { 
          proofingImages: updatedImages,
          coverImage: updatedImages[0] 
        });
        setActiveSlideIndex(updatedImages.length - 1);
        notify?.(`✨ Berhasil menambahkan ${newUrls.length} gambar preview!`, 'success');
      }
    } catch (err: any) {
      notify?.('Gagal mengunggah gambar: ' + (err?.message || 'Error'), 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const cleanUrl = urlInput.trim();
    const updatedImages = [...imageList, cleanUrl];
    updateProject(project.id, {
      proofingImages: updatedImages,
      coverImage: updatedImages[0]
    });
    setUrlInput('');
    setShowAddUrlInput(false);
    setActiveSlideIndex(updatedImages.length - 1);
    notify?.('✨ Gambar preview berhasil ditambahkan!', 'success');
  };

  const handleRemoveSlide = (idxToRemove: number) => {
    if (imageList.length <= 1) {
      notify?.('Minimal harus ada 1 gambar preview dalam proyek', 'warning');
      return;
    }
    const updatedImages = imageList.filter((_, i) => i !== idxToRemove);
    updateProject(project.id, {
      proofingImages: updatedImages,
      coverImage: updatedImages[0]
    });
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    notify?.('Slide gambar dihapus', 'info');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'cmsFadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          background: 'var(--cms-card-bg)',
          border: '1.5px solid var(--glass-border)',
          borderRadius: 24,
          boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>
                Pratinjau Watermark & Proofing Klien
              </div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                Aset visual dilindungi watermark anti-inspect untuk proteksi sebelum lunas
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Controls Bar */}
        <div style={{
          padding: '10px 20px',
          background: 'rgba(0,0,0,0.03)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>
            <span>Gaya:</span>
            {(['grid', 'center', 'bottom'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setProofingWatermarkStyle(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 100,
                  border: 'none',
                  background: proofingWatermarkStyle === st ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                  color: proofingWatermarkStyle === st ? '#fff' : 'var(--cms-text)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {st === 'grid' ? 'Diagonal Grid' : st === 'center' ? 'Center Stamp' : 'Bottom Banner'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>
            <span>Tema:</span>
            {(['frosted', 'gold', 'crimson'] as const).map(th => (
              <button
                key={th}
                type="button"
                onClick={() => setProofingWatermarkTheme(th)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 100,
                  border: 'none',
                  background: proofingWatermarkTheme === th ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                  color: proofingWatermarkTheme === th ? '#fff' : 'var(--cms-text)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {th}
              </button>
            ))}
          </div>
        </div>

        {/* Revision Round & Approval Control Bar */}
        <div style={{
          padding: '8px 20px',
          background: 'var(--cms-card-bg)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)' }}>
              Putaran Revisi:
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: 100,
              background: (project.revisionCount || 0) >= (project.maxRevisions || 3) ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: (project.revisionCount || 0) >= (project.maxRevisions || 3) ? '#ef4444' : '#10b981',
              fontSize: 11,
              fontWeight: 900
            }}>
              Ke-{project.revisionCount || 0} / {project.maxRevisions || 3}
            </span>
            {project.proofingApproved && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 100,
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                fontSize: 10.5,
                fontWeight: 800
              }}>
                ✓ Disetujui Klien
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => {
                const nextRev = (project.revisionCount || 0) + 1;
                updateProject(project.id, {
                  revisionCount: nextRev,
                  proofingApproved: false,
                  activity: [
                    { id: Date.now(), time: new Date().toISOString(), message: `Revisi ke-${nextRev} dicatat` },
                    ...safeActivity
                  ]
                });
                notify?.(`📝 Putaran revisi ke-${nextRev} dicatat`, 'info');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                color: 'var(--cms-text)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Tambah hitungan putaran revisi"
            >
              <Plus size={12} />
              <span>Catat Revisi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const nextStatus = !project.proofingApproved;
                updateProject(project.id, {
                  proofingApproved: nextStatus,
                  activity: [
                    { id: Date.now(), time: new Date().toISOString(), message: nextStatus ? 'Desain Disetujui Klien' : 'Persetujuan Desain Dibatalkan' },
                    ...safeActivity
                  ]
                });
                notify?.(nextStatus ? '🎉 Desain ditandai DISETUJUI!' : 'Persetujuan desain dibatalkan', nextStatus ? 'success' : 'info');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: 'none',
                background: project.proofingApproved ? '#10b981' : 'rgba(16, 185, 129, 0.15)',
                color: project.proofingApproved ? '#fff' : '#10b981',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <CheckCircle2 size={12} />
              <span>{project.proofingApproved ? 'Disetujui' : 'Setujui Desain'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAnnotating(prev => !prev)}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: isAnnotating ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                background: isAnnotating ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)',
                color: isAnnotating ? 'var(--cms-accent)' : 'var(--cms-text)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Aktifkan pin catatan di atas kanvas gambar"
            >
              <Pin size={12} />
              <span>{isAnnotating ? 'Mode Pin Aktif' : 'Beri Pin Catatan'}</span>
            </button>
          </div>
        </div>

        {/* Upload & Multi-Slide Carousel Controls Bar */}
        <div style={{
          padding: '10px 20px',
          background: 'rgba(99, 102, 241, 0.05)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              multiple 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--cms-accent)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 750,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb), 0.25)'
              }}
            >
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              <span>{isUploading ? 'Mengunggah...' : '+ Unggah Gambar Preview'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddUrlInput(!showAddUrlInput)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-card-bg)',
                color: 'var(--cms-text)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>+ Link URL</span>
            </button>

            <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600 }}>
              Slide {activeSlideIndex + 1} dari {imageList.length}
            </span>
          </div>

          {imageList.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-card-bg)',
                  color: activeSlideIndex === 0 ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                  cursor: activeSlideIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={activeSlideIndex === imageList.length - 1}
                onClick={() => setActiveSlideIndex(prev => Math.min(imageList.length - 1, prev + 1))}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-card-bg)',
                  color: activeSlideIndex === imageList.length - 1 ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                  cursor: activeSlideIndex === imageList.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {showAddUrlInput && (
          <div style={{ padding: '8px 20px', background: 'var(--cms-input-bg)', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: 8 }}>
            <input 
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Tempel URL gambar (https://...)"
              style={{ flex: 1, height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)', color: 'var(--cms-text)', fontSize: 11.5 }}
            />
            <button
              type="button"
              onClick={handleAddUrl}
              style={{ padding: '0 12px', height: 32, borderRadius: 6, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Tambah
            </button>
          </div>
        )}

        {/* Image Preview Canvas */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.06)',
          minHeight: 280,
          gap: 12
        }}>
          <div
            onClick={(e) => {
              if (!isAnnotating) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
              const noteText = window.prompt('Tulis catatan revisi untuk titik ini:');
              if (noteText && noteText.trim()) {
                const newAnnotation = {
                  id: `pin_${Date.now()}`,
                  slideIndex: activeSlideIndex,
                  x,
                  y,
                  note: noteText.trim(),
                  createdAt: new Date().toISOString()
                };
                const updated = [...annotations, newAnnotation];
                updateProject(project.id, { proofingAnnotations: updated });
                notify?.('📌 Pin catatan berhasil disematkan!', 'success');
              }
            }}
            style={{
              position: 'relative',
              maxWidth: '100%',
              maxHeight: 380,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
              border: '1px solid var(--glass-border)',
              cursor: isAnnotating ? 'crosshair' : 'default'
            }}
          >
            <ProtectedPreviewImage
              src={currentImg}
              alt={project.title || 'Watermark Preview'}
              isPaid={false}
              clientName={project.client || project.clientName || 'KLIEN'}
              watermarkStyle={proofingWatermarkStyle}
              watermarkTheme={proofingWatermarkTheme}
              watermarkText={`DRAFT • ${project.title?.toUpperCase() || 'SUMR.DAY'}`}
              showControls={false}
            />

            {/* Render Pinpoint Markers for active slide */}
            {annotations.filter((p: any) => p.slideIndex === undefined || p.slideIndex === activeSlideIndex).map((pin: any, idx: number) => (
              <div
                key={pin.id || idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPinId(selectedPinId === pin.id ? null : pin.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 900,
                  boxShadow: '0 0 0 3px rgba(255,255,255,0.9), 0 4px 10px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'transform 0.15s ease'
                }}
                title={`Pin #${idx + 1}: ${pin.note}`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Carousel Slide Thumbnails Selector */}
          {imageList.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', overflowX: 'auto', maxWidth: '100%' }}>
              {imageList.map((imgUrl, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: i === activeSlideIndex ? '2px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    opacity: i === activeSlideIndex ? 1 : 0.6,
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setActiveSlideIndex(i)}
                >
                  <img src={imgUrl} alt={`Slide ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {imageList.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveSlide(i); }}
                      style={{
                        position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                        borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                      }}
                      title="Hapus gambar ini"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Active Selected Pin Note Tooltip / Details */}
          {annotations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 500, justifyContent: 'center' }}>
              {annotations.map((pin: any, idx: number) => (
                <div
                  key={pin.id || idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: selectedPinId === pin.id ? 'rgba(239, 68, 68, 0.15)' : 'var(--cms-card-bg)',
                    border: `1px solid ${selectedPinId === pin.id ? '#ef4444' : 'var(--glass-border)'}`,
                    fontSize: 11,
                    color: 'var(--cms-text)'
                  }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {idx + 1}
                  </span>
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pin.note}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = annotations.filter((p: any) => p.id !== pin.id);
                      updateProject(project.id, { proofingAnnotations: filtered });
                      notify?.('Pin dihapus', 'info');
                    }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 0 }}
                    title="Hapus pin ini"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Client Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
            Tautan portal klien dengan tab proofing revisi & persetujuan digital
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const link = `${window.location.origin}/proofing?id=${encodeURIComponent(project.id)}`;
                navigator.clipboard.writeText(link);
                notify?.('🔗 Tautan Proofing Klien disalin ke papan klip!', 'success');
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                color: 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Copy size={13} />
              <span>Salin Link Klien</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const link = `${window.location.origin}/proofing?id=${encodeURIComponent(project.id)}`;
                const clientName = project.client || project.clientName || 'Klien';
                const projectName = project.title || project.name || 'Proyek Desain';
                const message = `Halo ${clientName}, draft preview desain untuk proyek *${projectName}* telah selesai dan siap Anda tinjau!\n\nSilakan klik tautan interaktif berikut untuk melihat desain, menyematkan pin revisi spesifik, atau menyetujui (ACC):\n${link}\n\nTerima kasih! ✨`;
                const phone = project.clientPhone || project.phone || '';
                const cleanPhone = phone.replace(/[^0-9]/g, '');
                const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(waUrl, '_blank');
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: '#25D366',
                color: '#fff',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
              }}
              title="Kirim link peninjauan desain langsung ke WhatsApp klien"
            >
              <span>📱 Kirim via WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const link = `${window.location.origin}/proofing?id=${encodeURIComponent(project.id)}`;
                window.open(link, '_blank', 'noopener,noreferrer');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--cms-accent)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb), 0.3)'
              }}
            >
              <ExternalLink size={13} />
              <span>Buka Kanvas Klien</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectProofingModal;
