import React, { useState } from 'react';
import { Layout, Link, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import InfoTooltip from './InfoTooltip';
import MediaGalleryModal from './MediaGalleryModal';

const FrameEditPanel = ({ currentFrames = {}, onUpdateFrames, notify }) => {
  const [isUploading, setIsUploading] = useState({ top: false, bottom: false });
  const [showGallery, setShowGallery] = useState(false);
  const [galleryType, setGalleryType] = useState<'top' | 'bottom'>('top');

  const handleUpload = async (file, type) => {
    if (!file) return;
    setIsUploading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await uploadToCloudinary(file);
      onUpdateFrames({ [`${type}Frame`]: res.url });
      notify?.('✅ Frame berhasil diunggah');

    } catch (err) {
      notify?.('❌ Gagal mengunggah frame', 'error');
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSelectGallery = (url) => {
    onUpdateFrames({ [`${galleryType}Frame`]: url });
    notify?.(`✅ Frame ${galleryType === 'top' ? 'atas' : 'bawah'} dipilih dari galeri!`);
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="cms-card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="cms-icon-box" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cms-accent-soft)' }}>
            <Layout size={20} color="var(--cms-accent)" />
          </div>
          <div>
            <div className="cms-header-1" style={{ fontSize: 18, display: 'flex', alignItems: 'center' }}>
              Bingkai
              <InfoTooltip content="Atur overlay visual atas dan bawah secara global yang akan muncul di atas stiker dan konten website." />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Top Frame */}
          <div>
            <div className="cms-label" style={{ display: 'flex', alignItems: 'center' }}>
              ATAS
              <InfoTooltip content="Gambar overlay di bagian atas layar. Disarankan file PNG transparan." />
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div 
                onClick={() => document.getElementById('frame-top-input').click()}
                className="cms-card"
                style={{ 
                  width: 140, height: 100, padding: 0, 
                  border: '1.5px dashed var(--cms-accent-border, rgba(124, 58, 237, 0.35))',
                  background: 'var(--cms-input-bg, rgba(255, 255, 255, 0.03))',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer',
                  borderRadius: 14, gap: 6, transition: 'border-color 0.15s ease'
                }}
              >
                {currentFrames.topFrame ? (
                  <img src={currentFrames.topFrame} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Top" />
                ) : isUploading.top ? (
                  <Loader2 size={22} className="animate-spin" color="var(--cms-accent)" /> 
                ) : (
                  <>
                    <Upload size={20} color="var(--cms-accent)" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Pilih Gambar</span>
                  </>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => document.getElementById('frame-top-input').click()}
                    className="cms-btn"
                    title="Upload"
                    style={{ width: 34, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}
                  >
                    <Upload size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGalleryType('top'); setShowGallery(true); }}
                    className="cms-btn"
                    title="Galeri"
                    style={{ width: 34, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1px solid var(--cms-accent-border)' }}
                  >
                    <ImageIcon size={14} />
                  </button>
                </div>
                <div>
                  <div className="cms-label" style={{ fontSize: 10 }}>LINK</div>
                  <div style={{ position: 'relative' }}>
                    <Link size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-accent)' }} />
                    <input 
                      className="cms-input" 
                      style={{ paddingLeft: 32, height: 36, fontSize: 12 }} 
                      placeholder="https://..." 
                      value={currentFrames.topLink || ''} 
                      onChange={e => onUpdateFrames({ topLink: e.target.value })}
                    />
                  </div>
                </div>
                {currentFrames.topFrame && (
                  <button onClick={() => onUpdateFrames({ topFrame: null, topLink: '' })} className="cms-btn cms-btn-ghost" title="Hapus" style={{ color: '#ef4444', width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input id="frame-top-input" type="file" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0], 'top')} />
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--glass-border)', opacity: 0.5 }} />

          {/* Bottom Frame */}
          <div>
            <div className="cms-label" style={{ display: 'flex', alignItems: 'center' }}>
              BAWAH
              <InfoTooltip content="Gambar overlay di bagian bawah layar. Disarankan file PNG transparan." />
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div 
                onClick={() => document.getElementById('frame-bottom-input').click()}
                className="cms-card"
                style={{ 
                  width: 140, height: 100, padding: 0, 
                  border: '1.5px dashed var(--cms-accent-border, rgba(124, 58, 237, 0.35))',
                  background: 'var(--cms-input-bg, rgba(255, 255, 255, 0.03))',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer',
                  borderRadius: 14, gap: 6, transition: 'border-color 0.15s ease'
                }}
              >
                {currentFrames.bottomFrame ? (
                  <img src={currentFrames.bottomFrame} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Bottom" />
                ) : isUploading.bottom ? (
                  <Loader2 size={22} className="animate-spin" color="var(--cms-accent)" /> 
                ) : (
                  <>
                    <Upload size={20} color="var(--cms-accent)" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Pilih Gambar</span>
                  </>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => document.getElementById('frame-bottom-input').click()}
                    className="cms-btn"
                    title="Upload"
                    style={{ width: 34, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}
                  >
                    <Upload size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGalleryType('bottom'); setShowGallery(true); }}
                    className="cms-btn"
                    title="Galeri"
                    style={{ width: 34, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1px solid var(--cms-accent-border)' }}
                  >
                    <ImageIcon size={14} />
                  </button>
                </div>
                <div>
                  <div className="cms-label" style={{ fontSize: 10 }}>LINK</div>
                  <div style={{ position: 'relative' }}>
                    <Link size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-accent)' }} />
                    <input 
                      className="cms-input" 
                      style={{ paddingLeft: 32, height: 36, fontSize: 12 }} 
                      placeholder="https://..." 
                      value={currentFrames.bottomLink || ''} 
                      onChange={e => onUpdateFrames({ bottomLink: e.target.value })}
                    />
                  </div>
                </div>
                {currentFrames.bottomFrame && (
                  <button onClick={() => onUpdateFrames({ bottomFrame: null, bottomLink: '' })} className="cms-btn cms-btn-ghost" title="Hapus" style={{ color: '#ef4444', width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input id="frame-bottom-input" type="file" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0], 'bottom')} />
            </div>
          </div>
        </div>
      </div>

      <MediaGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={(url) => handleSelectGallery(url)}
      />
    </div>
  );
};

export default FrameEditPanel;
