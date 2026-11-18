import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Link2, Eye, EyeOff, Box, Layers, Move, Video, Image, Upload, Loader2, Play, Target, Link, Bookmark, Copy, FlipHorizontal, Type, Music, Volume2 } from 'lucide-react';
import GlassSelect from './GlassSelect';
import GlassColorPicker from './GlassColorPicker';
import { uploadToCloudinary, uploadAudioToCloudinary } from '../../utils/cloudinary';
import { storage } from '../../utils/storage';
import { hexToRgba, extractYouTubeId, getOptimizedUrl } from '../renderer/utils';
import MediaGalleryModal from './MediaGalleryModal';
import ActionPopupControl from './ActionPopupControl';
import InfoTooltip from './InfoTooltip';
import DOMPurify from 'dompurify';


const ANIMATIONS = [
  { key:'none',   label:'Tidak Ada' },
  { key:'float',  label:'Mengambang' },
  { key:'bounce', label:'Meloncat' },
  { key:'swing',  label:'Mengayun' },
  { key:'pop',    label:'Pop' },
  { key:'spin',   label:'Berputar' },
  { key:'pulse',  label:'Denyut' },
  { key:'shake',  label:'Goyang' },
  { key:'wobble', label:'Goyang-goyang' },
];
const SHADOWS = [
  { key:'none',  label:'Tidak Ada' },
  { key:'outer', label:'Luar (Glow)' },
  { key:'inner', label:'Dalam (Inner)' },
];
const MASKS = [
  { key:'none',     label:'Bentuk Asli' },
  { key:'circle',   label:'Lingkaran' },
  { key:'squircle', label:'Squircle' },
  { key:'rounded',  label:'Rounded' },
  { key:'heart',    label:'Hati' },
  { key:'star',     label:'Bintang' },
  { key:'badge',    label:'Emblem / Badge' },
  { key:'shield',   label:'Perisai / Shield' },
  { key:'triangle', label:'Segitiga' },
  { key:'hexagon',  label:'Hexagon' },
];
const RATIOS = [
  { key:'16/9',  label:'Horizontal (16:9)' },
  { key:'9/16',  label:'Vertikal (9:16)' },
  { key:'1/1',   label:'Kotak (1:1)' },
  { key:'4/3',   label:'Standar (4:3)' },
];

const S = {
  divider: { height:1, background:'rgba(0,0,0,0.06)', margin:'4px 0 16px' },
};

const StickerEditPanel = ({ sticker, onUpdate, onRemove, onDuplicate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [bioLinkPages, setBioLinkPages] = useState<any[]>([]);
  const isDark = document.documentElement.getAttribute('data-cms-theme') === 'dark';

  useEffect(() => {
    storage.getItem('porto_bio_pages', []).then(pages => {
      if (pages && Array.isArray(pages) && pages.length > 0) {
        setBioLinkPages(pages);
      } else {
        setBioLinkPages([{ id: 'page_main', slug: 'main', title: 'Halaman Utama' }]);
      }
    });
  }, []);

  if (!sticker) return null; // Prevent crash if sticker is undefined

  const u = (k, v) => onUpdate(sticker.id, { [k]: v });

  const handleFileUpload = async (e, resourceType = 'image') => {
    const file = e.target?.files?.[0] ?? e;
    if (!file) return;

    const allowedImage = ['image/png','image/jpeg','image/jpg','image/gif','image/webp','image/svg+xml'];
    const allowedVideo = ['video/mp4','video/webm','video/quicktime'];
    const allowed = resourceType === 'video' ? allowedVideo : allowedImage;

    if (!allowed.includes(file.type)) {
      setUploadError('Format file tidak didukung.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      if (resourceType === 'image' && file.type === 'image/svg+xml') {
        // SVG: simpan sebagai teks inline
        const reader = new FileReader();
        reader.onload = (ev) => {
          onUpdate(sticker.id, { imageData: ev.target.result, isSvg: true, type: 'image' });
          setIsUploading(false);
        };
        reader.onerror = () => { setUploadError('Gagal membaca SVG.'); setIsUploading(false); };
        reader.readAsText(file);
      } else if (resourceType === 'video') {
        // Video: upload ke Cloudinary
        const result = await uploadToCloudinary(file, 'video');
        onUpdate(sticker.id, { videoUrl: result.url, type: 'video' });
        setIsUploading(false);
      } else {
        // Gambar biasa: upload ke Cloudinary
        const result = await uploadToCloudinary(file, 'image');
        onUpdate(sticker.id, { imageData: result.url, isSvg: false, type: 'image' });
        setIsUploading(false);
      }
    } catch (err) {
      setUploadError('Upload gagal: ' + (err.message || 'Coba lagi'));
      setIsUploading(false);
    }
  };

  return (
    <div className="cms-panel-container">
      {/* Header with Title */}
      <div className="sidebar-pill-header" style={{ padding: '20px 24px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,var(--cms-accent, #7c3aed),#a855f7)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb),0.2)'
          }}>
            <Target size={14} color="#fff" strokeWidth={3} />
          </div>
          <span className="sidebar-title">Stiker</span>
        </div>
      </div>

      <div className="sidebar-pill-scroll" style={{ padding: '12px 24px 32px' }}>
        {/* Type Switcher */}
        <div className="cms-field-group">
          <label className="cms-label">Tipe</label>
          <div style={{ display: 'flex', gap: 6, background: 'var(--cms-switcher-bg)', borderRadius: 100, padding: 4, border: '1px solid var(--glass-border)' }}>
            {[
              { key: 'image', icon: <Image size={15} />, label: 'Gambar' },
              { key: 'video', icon: <Video size={15} />, label: 'Video' },
              { key: 'youtube', icon: <Play size={15} />, label: 'YouTube' },
              { key: 'button', icon: <Box size={15} />, label: 'Tombol' },
              { key: 'text', icon: <Type size={15} />, label: 'Teks' }
            ].map(m => (
              <button key={m.key}
                onClick={() => { u('type', m.key); if(m.key==='button') u('variety', 'button'); }}
                title={m.label}
                style={{
                  flex: 1, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', borderRadius: 100, cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: (sticker.type || 'image') === m.key ? 'var(--cms-switcher-item-bg)' : 'transparent',
                  color: (sticker.type || 'image') === m.key ? (m.key === 'youtube' ? '#ef4444' : 'var(--cms-accent, #7c3aed)') : 'var(--cms-switcher-text)',
                  boxShadow: (sticker.type || 'image') === m.key ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                  transform: (sticker.type || 'image') === m.key ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {m.icon}
              </button>
            ))}
          </div>
        </div>

        {/* ── Visibilitas Stiker ── */}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />
        
        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--cms-accent, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={10} color="#fff" />
            </div>
            Visibilitas
          </label>
          
          <div className="cms-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Draft / Sembunyikan */}
            <div className="cms-toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cms-text)' }}>Draft</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!sticker.isHidden}
                className="cms-switch"
                onClick={() => u('isHidden', !sticker.isHidden)}
              >
                <div className="cms-switch-knob" />
              </button>
            </div>

            {/* Hide on Mobile */}
            <div className="cms-toggle-row">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cms-text)' }}>Mobile</div>
              <button
                type="button"
                role="switch"
                aria-checked={!!sticker.hideOnMobile}
                className="cms-switch"
                onClick={() => u('hideOnMobile', !sticker.hideOnMobile)}
              >
                <div className="cms-switch-knob" />
              </button>
            </div>

            {/* Hide on Desktop */}
            <div className="cms-toggle-row">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cms-text)' }}>Desktop</div>
              <button
                type="button"
                role="switch"
                aria-checked={!!sticker.hideOnDesktop}
                className="cms-switch"
                onClick={() => u('hideOnDesktop', !sticker.hideOnDesktop)}
              >
                <div className="cms-switch-knob" />
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button 
            className="cms-btn cms-btn-ghost" 
            title="Gandakan"
            style={{ flex: 1, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onClick={() => onDuplicate(sticker.id)}
          >
            <Copy size={16} />
          </button>
          <button 
            className="cms-btn cms-btn-ghost" 
            title="Balik Horizontal"
            style={{ flex: 1, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: sticker.flipX ? 'var(--cms-accent, #7c3aed)' : 'inherit', borderColor: sticker.flipX ? 'var(--cms-accent, #7c3aed)' : 'transparent' }}
            onClick={() => u('flipX', !sticker.flipX)}
          >
            <FlipHorizontal size={16} />
          </button>
        </div>

        {/* Preview Area */}
        <div 
          className="cms-card"
          style={{ 
            width:'100%', 
            aspectRatio:'1/1', 
            overflow:'hidden', 
            marginBottom:16, 
            background: isDark ? 'repeating-conic-gradient(#1e1e2d 0% 25%, #252535 0% 50%) 0 0 / 20px 20px' : 'repeating-conic-gradient(#f0f0f0 0% 25%, #fdfdfd 0% 50%) 0 0 / 20px 20px', 
            display:'flex', 
            alignItems:'center', 
            justifyContent:'center', 
            position: 'relative', 
            padding: 0, 
            borderRadius: 24, 
            border: '1px solid var(--glass-border)', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)', 
            containerType: 'inline-size' 
          }}
        >
          {sticker.type === 'video' ? (
            sticker.videoUrl ? (
              <video 
                src={sticker.videoUrl} 
                autoPlay muted loop playsInline 
                style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }}
              />
            ) : (
              <div style={{ color: 'var(--cms-switcher-text)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <Play size={40} style={{ opacity: 0.5 }}/>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginTop: 8, textTransform: 'uppercase' }}>Upload Video</span>
              </div>
            )
          ) : sticker.type === 'youtube' ? (
            sticker.youtubeId ? (
              <div style={{ position:'relative', width:'100%', aspectRatio: sticker.aspectRatio || '16/9' }}>
                <img 
                  src={`https://img.youtube.com/vi/${sticker.youtubeId}/mqdefault.jpg`} 
                  alt="" 
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('hqdefault')) {
                      e.currentTarget.src = `https://img.youtube.com/vi/${sticker.youtubeId}/hqdefault.jpg`;
                    }
                  }}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }} 
                />
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Video size={40} color="#fff" />
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--cms-switcher-text)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <Video size={40} style={{ opacity: 0.5 }}/>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginTop: 8, textTransform: 'uppercase' }}>URL YouTube</span>
              </div>
            )
          ) : sticker.type === 'button' ? (
            <div 
              style={{ 
                width:'70%', 
                padding: '0.8em 1.2em',
                background: sticker.btnBgType === 'image' 
                  ? (sticker.imageData ? `url(${getOptimizedUrl(sticker.imageData, 200)}) center/cover` : 'rgba(0,0,0,0.1)')
                  : hexToRgba(sticker.btnColor || 'var(--cms-accent, #7c3aed)', sticker.btnFillOpacity ?? 1),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center',
                color: sticker.textColor || '#fff',
                fontSize: '14cqw',
                fontWeight: 800,
                lineHeight: 1,
                border: `${sticker.btnBorderWidth ?? 1.5}px solid ${sticker.btnBorderColor || 'rgba(255,255,255,0.2)'}`,
                backdropFilter: (sticker.useGlass !== false) ? `blur(${sticker.btnBlur ?? 12}px)` : 'none',
                WebkitBackdropFilter: (sticker.useGlass !== false) ? `blur(${sticker.btnBlur ?? 12}px)` : 'none',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              {sticker.btnText || 'KLIK DISINI'}
            </div>
          ) : sticker.type === 'text' ? (
            <div style={{
              width: '100%',
              padding: 20,
              background: 'transparent',
              color: sticker.textColor || '#000',
              fontFamily: sticker.fontFamily || 'inherit',
              fontSize: `${sticker.fontSize || 16}px`,
              fontWeight: sticker.fontWeight || 400,
              textAlign: sticker.textAlign || 'left',
              lineHeight: sticker.lineHeight || 1.5,
              textShadow: sticker.textShadow ? `2px 2px 4px rgba(0,0,0,0.5)` : 'none',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {sticker.text || 'Masukkan teks Anda'}
            </div>
          ) : (
            sticker.imageData ? (
              (sticker.isSvg || (typeof sticker.imageData === 'string' && sticker.imageData.trim().startsWith('<svg')))
                ? <div style={{ width:'70%', height:'70%' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sticker.imageData) }}/>
                : <img 
                    src={getOptimizedUrl(sticker.imageData, 400)} 
                    alt="" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      if (sticker.imageData && e.currentTarget.src !== sticker.imageData) {
                        e.currentTarget.src = sticker.imageData;
                      }
                    }}
                    style={{ maxWidth:'85%', maxHeight:'85%', objectFit:'contain' }}
                  />
            ) : (
              <div style={{ color: 'var(--cms-switcher-text)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <Image size={40} style={{ opacity: 0.5 }}/>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginTop: 8, textTransform: 'uppercase' }}>Upload Gambar</span>
              </div>
            )
          )}
        </div>

        {/* Upload Buttons */}
        {(sticker.type || 'image') === 'image' && (
          <div className="cms-field-group">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/png,image/svg+xml,image/gif,image/webp,image/jpeg';
                  input.onchange = (e) => handleFileUpload(e, 'image');
                  input.click();
                }}
                disabled={isUploading}
                className="cms-btn cms-btn-primary"
                title={sticker.imageData ? 'Ganti Gambar' : 'Upload Gambar'}
                style={{ flex: 1, height: 42, opacity: isUploading ? 0.7 : 1, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setShowGalleryModal(true)}
                className="cms-btn"
                title="Galeri"
                style={{ flex: 1, height: 42, borderRadius: 14, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1.5px solid var(--cms-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                <Image size={16} />
              </button>
            </div>
            {uploadError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#ef4444', fontSize: 10, fontWeight: 700 }}>
                {uploadError}
              </div>
            )}
          </div>
        )}

        {sticker.type === 'video' && (
          <div className="cms-field-group">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'video/mp4,video/webm,video/quicktime';
                  input.onchange = (e) => handleFileUpload(e, 'video');
                  input.click();
                }}
                disabled={isUploading}
                className="cms-btn cms-btn-primary"
                title={sticker.videoUrl ? 'Ganti Video' : 'Upload Video'}
                style={{ flex: 1, height: 42, background: 'var(--cms-accent, #7c3aed)', opacity: isUploading ? 0.7 : 1, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setShowGalleryModal(true)}
                className="cms-btn"
                title="Galeri"
                style={{ flex: 1, height: 42, borderRadius: 14, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1.5px solid var(--cms-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                <Video size={16} />
              </button>
            </div>
            {uploadError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#ef4444', fontSize: 10, fontWeight: 700 }}>
                {uploadError}
              </div>
            )}
          </div>
        )}

        {/* YouTube URL Input */}
        {sticker.type === 'youtube' && (
          <div className="cms-field-group">
            <label className="cms-label">YouTube</label>
            <input 
              className="cms-input"
              type="text" 
              placeholder="https://youtube.com/watch?v=..." 
              value={sticker.youtubeUrl || ''} 
              onChange={e => {
                const val = e.target.value;
                const id = extractYouTubeId(val);
                onUpdate(sticker.id, { youtubeUrl: val, youtubeId: id });
              }}
            />
            {sticker.youtubeId && <div style={{ fontSize:11, color:'#16a34a', marginTop:6, fontWeight:700 }}>✓ Terdeteksi ID: {sticker.youtubeId}</div>}
          </div>
        )}

        {sticker.type === 'text' && (
          <div className="cms-card" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 22, background: 'var(--cms-switcher-bg)', borderRadius: 24, marginBottom: 16 }}>
            <div className="cms-field-group">
              <label className="cms-label">Teks</label>
              <textarea 
                className="cms-input"
                value={sticker.text || ''} 
                onChange={e => u('text', e.target.value)} 
                placeholder="Tuliskan teks di sini..."
                style={{ minHeight: 80, resize: 'none', borderRadius: 12 }}
              />
            </div>
            <div className="cms-field-group">
              <label className="cms-label">Font</label>
              <GlassSelect 
                value={sticker.fontFamily || 'inherit'} 
                onChange={e => u('fontFamily', e.target.value)}
                options={[
                  { key: 'inherit', label: 'Bawaan Tema' },
                  { key: "'Inter', sans-serif", label: 'Inter' },
                  { key: "'Outfit', sans-serif", label: 'Outfit' },
                  { key: "'Playfair Display', serif", label: 'Playfair Display' },
                  { key: 'monospace', label: 'Monospace' }
                ]}
              />
            </div>

            <div className="cms-field-group">
              <label className="cms-label">Ketebalan</label>
              <GlassSelect 
                value={sticker.fontWeight || 400} 
                onChange={e => u('fontWeight', Number(e.target.value))}
                options={[
                  { key: 300, label: 'Light' },
                  { key: 400, label: 'Regular' },
                  { key: 600, label: 'Semi Bold' },
                  { key: 700, label: 'Bold' },
                  { key: 900, label: 'Black' }
                ]}
              />
            </div>
            
            <div className="cms-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="cms-label" style={{ marginBottom: 0 }}>Ukuran</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>{sticker.fontSize || 16}px</span>
              </div>
              <input type="range" className="cms-range" min="10" max="120" value={sticker.fontSize || 16} onChange={e => u('fontSize', Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div className="cms-field-group">
              <label className="cms-label">Warna</label>
              <GlassColorPicker value={sticker.textColor || '#000000'} onChange={v => u('textColor', v)} />
            </div>

            <div className="cms-field-group">
              <label className="cms-label">Alignment</label>
              <GlassSelect 
                value={sticker.textAlign || 'left'} 
                onChange={e => u('textAlign', e.target.value)}
                options={[
                  { key: 'left', label: 'Rata Kiri' },
                  { key: 'center', label: 'Rata Tengah' },
                  { key: 'right', label: 'Rata Kanan' },
                  { key: 'justify', label: 'Justify' }
                ]}
              />
            </div>

            <div className="cms-field-group">
              <label className="cms-label">Mode</label>
              <GlassSelect 
                value={sticker.textMode || 'paragraph'} 
                onChange={e => { 
                  const val = e.target.value; 
                  u('textMode', val); 
                  if(val === 'marquee') u('marquee', true); else u('marquee', false); 
                }}
                options={[
                  { key: 'paragraph', label: 'Paragraf Biasa' },
                  { key: 'title', label: 'Judul (Heading)' },
                  { key: 'marquee', label: 'Teks Berjalan (Marquee)' }
                ]}
              />
            </div>
            {sticker.textMode === 'marquee' && (
              <div className="cms-field-group" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <label className="cms-label" style={{ marginBottom: 0 }}>Durasi</label>
                  <InfoTooltip content="Semakin kecil nilainya, semakin cepat teks berjalan." />
                </div>
                <input type="range" className="cms-range" min="3" max="30" value={sticker.marqueeSpeed || 10} onChange={e => u('marqueeSpeed', Number(e.target.value))} />
              </div>
            )}
          </div>
        )}

        {sticker.type === 'button' && (
          <div className="cms-card" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 22, background: 'var(--cms-switcher-bg)', borderRadius: 24 }}>
            {/* Text & Link */}
            <div>
              <label className="cms-label">Teks</label>
              <input 
                className="cms-input" type="text" placeholder="Tulis teks..." 
                value={sticker.btnText || ''} onChange={e => u('btnText', e.target.value)} 
              />
            </div>
            <ActionPopupControl
              actionType={sticker.actionType || 'link'}
              linkUrl={sticker.linkUrl || ''}
              popupId={sticker.popupId || ''}
              bioLinkPages={bioLinkPages}
              label="Aksi"
              onChange={(updates) => {
                onUpdate(sticker.id, updates);
              }}
            />

            <div style={{ height: 1, background: 'var(--glass-border)' }} />
            
            {/* Basic Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="cms-label">Bentuk</label>
                <GlassSelect 
                  value={sticker.btnShape || 'rounded'} 
                  onChange={e => u('btnShape', e.target.value)}
                  options={[
                    { key: 'rounded', label: 'Rounded' },
                    { key: 'pill', label: 'Pill' },
                    { key: 'circle', label: 'Circle' },
                    { key: 'rectangle', label: 'Rectangle' }
                  ]}
                />
              </div>
              <div>
                <label className="cms-label">Background</label>
                <GlassSelect 
                  value={sticker.btnBgType || 'solid'} 
                  onChange={e => u('btnBgType', e.target.value)}
                  options={[
                    { key: 'solid', label: 'Solid' },
                    { key: 'image', label: 'Gambar' }
                  ]}
                />
              </div>
            </div>

            {sticker.btnBgType === 'image' && (
              <div>
                <label className="cms-label">Latar</label>
                <button 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleFileUpload(e, 'image');
                    input.click();
                  }}
                  disabled={isUploading}
                  className="cms-btn cms-btn-ghost"
                  title={sticker.imageData ? 'Ganti Latar' : 'Upload Latar'}
                  style={{ width:'100%', height: 42, borderRadius: 14, background: 'var(--cms-switcher-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                </button>
              </div>
            )}

            {/* Colors — vertical stack agar tidak terpotong */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <GlassColorPicker 
                label="Warna Utama"
                value={sticker.btnColor || 'var(--cms-accent, #7c3aed)'}
                onChange={(val) => u('btnColor', val)}
              />
              <GlassColorPicker 
                label="Warna Teks"
                value={sticker.textColor || '#ffffff'}
                onChange={(val) => u('textColor', val)}
              />
            </div>

            {/* Opacity Fill */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
                <label className="cms-label" style={{ marginBottom: 0 }}>Fill</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>{Math.round((sticker.btnFillOpacity ?? 1) * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={sticker.btnFillOpacity ?? 1} onChange={e => u('btnFillOpacity', +e.target.value)} style={{ width: '100%' }} />
            </div>

            <div style={{ height: 1, background: 'var(--glass-border)' }} />

            {/* Border Settings */}
            <GlassColorPicker 
              label="Warna Garis Tepi (Border)"
              value={sticker.btnBorderColor || 'rgba(255,255,255,0.2)'}
              onChange={(val) => u('btnBorderColor', val)}
            />
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
                <label className="cms-label" style={{ marginBottom: 0 }}>Garis</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>{sticker.btnBorderWidth ?? 1.5}px</span>
              </div>
              <input type="range" min="0" max="10" step="0.5" value={sticker.btnBorderWidth ?? 1.5} onChange={e => u('btnBorderWidth', +e.target.value)} style={{ width: '100%' }} />
            </div>

            {/* Glass Effect */}
            <div style={{ background: 'var(--cms-switcher-bg)', padding: '20px', borderRadius: 24, border: '1px solid var(--glass-border)' }}>
              <div className="cms-toggle-row" style={{ marginBottom: sticker.useGlass !== false ? 14 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--glass-text)' }}>Efek Glass (Blur)</div>
                <button 
                  type="button"
                  role="switch"
                  aria-checked={sticker.useGlass !== false}
                  className="cms-switch"
                  onClick={() => u('useGlass', !(sticker.useGlass !== false))}
                >
                  <div className="cms-switch-knob" />
                </button>
              </div>
              {sticker.useGlass !== false && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
                    <label className="cms-label" style={{ marginBottom: 0, fontSize: 10 }}>Blur</label>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>{sticker.btnBlur ?? 12}px</span>
                  </div>
                  <input type="range" min="0" max="40" value={sticker.btnBlur ?? 12} onChange={e => u('btnBlur', +e.target.value)} style={{ width: '100%' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {(sticker.type === 'youtube' || sticker.type === 'video') && (
          <div className="cms-field-group">
            <label className="cms-label">Rasio</label>
            <GlassSelect 
              value={sticker.aspectRatio || '16/9'} 
              onChange={e => u('aspectRatio', e.target.value)}
              options={RATIOS}
            />
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* Action (Link or Popup) */}
        {sticker.type !== 'button' && (
          <ActionPopupControl
            actionType={sticker.actionType || 'link'}
            linkUrl={sticker.linkUrl || ''}
            popupId={sticker.popupId || ''}
            bioLinkPages={bioLinkPages}
            label="Aksi"
            onChange={(updates) => {
              onUpdate(sticker.id, updates);
            }}
          />
        )}

        {/* Anim */}
        <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:12, marginBottom:20 }}>
          <div className="cms-field-group">
            <label className="cms-label">Animasi</label>
            <GlassSelect 
              value={sticker.animation||'none'} 
              onChange={e=>u('animation',e.target.value)}
              options={ANIMATIONS}
            />
          </div>
          <div className="cms-field-group">
            <label className="cms-label">Opacity</label>
            <GlassSelect 
              value={sticker.opacity??1} 
              onChange={e=>u('opacity',+e.target.value)}
              options={[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(v => ({ key: v, label: `${Math.round(v*100)}%` }))}
            />
          </div>
        </div>

        {/* Transform */}
        <div className="cms-field-group">
          <label className="cms-label">Ukuran</label>
          <div className="cms-card" style={{ display:'flex', flexDirection:'column', gap:16, background: 'var(--cms-switcher-bg)', borderRadius: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Ukuran</span>
                <span style={{ color: 'var(--cms-accent, #7c3aed)' }}>{sticker.width??80}px</span>
              </div>
              <input type="range" min={20} max={320} value={sticker.width??80} onChange={e=>u('width',+e.target.value)} style={{ width:'100%' }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Rotasi</span>
                <span style={{ color: 'var(--cms-accent, #7c3aed)' }}>{sticker.rotation??0}°</span>
              </div>
              <input type="range" min={-180} max={180} value={sticker.rotation??0} onChange={e=>u('rotation',+e.target.value)} style={{ width:'100%' }}/>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* Shapes & Shadows */}
        {sticker.type !== 'button' && (
          <div className="cms-field-group">
            <label className="cms-label">Mask</label>
            <GlassSelect 
              value={sticker.mask||'none'} 
              onChange={e=>u('mask',e.target.value)}
              options={MASKS}
            />
            {(sticker.mask === 'rounded' || sticker.mask === 'squircle') && (
              <div style={{ marginTop:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Kelengkungan Sudut</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>{sticker.maskRadius ?? 2}rem</div>
                </div>
                <input type="range" min={0} max={10} step={0.1} value={sticker.maskRadius ?? 2} onChange={e=>u('maskRadius',+e.target.value)} style={{ width:'100%' }}/>
              </div>
            )}
          </div>
        )}

        <div className="cms-field-group">
          <label className="cms-label">Bayangan</label>
          <GlassSelect 
            value={sticker.shadow||'none'} 
            onChange={e=>u('shadow',e.target.value)}
            options={SHADOWS}
          />
        </div>

        {sticker.shadow && sticker.shadow !== 'none' && (
          <div className="cms-card" style={{ display:'flex', flexDirection:'column', gap:16, background: 'var(--cms-switcher-bg)', marginBottom: 16, borderRadius: 20 }}>
            <div style={{ display:'flex', flexDirection: 'column', gap:12 }}>
              <GlassColorPicker 
                label="Warna Bayangan"
                value={sticker.shadowColor||'#000000'}
                onChange={val=>u('shadowColor',val)}
              />
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label className="cms-label" style={{ marginBottom:0 }}>Blur</label>
                  <span style={{ fontSize:11, fontWeight:800, color:'var(--cms-accent, #7c3aed)' }}>{sticker.shadowBlur??10}px</span>
                </div>
                <input type="range" min={2} max={40} value={sticker.shadowBlur??10} onChange={e=>u('shadowBlur',+e.target.value)} style={{ width:'100%' }}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label className="cms-label" style={{ fontSize: 9 }}>X: {sticker.shadowX ?? 0}px</label>
                <input type="range" min={-20} max={20} value={sticker.shadowX ?? 0} onChange={e=>u('shadowX',+e.target.value)} style={{ width:'100%' }}/>
              </div>
              <div style={{ flex:1 }}>
                <label className="cms-label" style={{ fontSize: 9 }}>Y: {sticker.shadowY ?? 5}px</label>
                <input type="range" min={-20} max={20} value={sticker.shadowY ?? 5} onChange={e=>u('shadowY',+e.target.value)} style={{ width:'100%' }}/>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* ── Musik Stiker ── */}
        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Music size={12} color="var(--cms-accent, #7c3aed)" />
            Musik
            <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8', fontSize: 10 }}>(Overlap)</span>
          </label>

          {sticker.musicUrl ? (
            <div style={{ background: 'var(--cms-switcher-bg)', borderRadius: 16, padding: 14, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Audio Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Music size={16} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sticker.musicName || 'Audio Stiker'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 2 }}>Cloudinary ✓ • Overlap Mode</div>
                </div>
                <button
                  onClick={() => onUpdate(sticker.id, { musicUrl: null, musicName: null })}
                  className="card-action-btn danger"
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0, margin: 0 }}
                  title="Hapus Musik"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Loop Toggle */}
              <div className="cms-toggle-row">
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>Loop</div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sticker.musicLoop !== false}
                  className="cms-switch"
                  onClick={() => onUpdate(sticker.id, { musicLoop: !sticker.musicLoop })}
                >
                  <div className="cms-switch-knob" />
                </button>
              </div>

              {/* Volume */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="cms-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Volume2 size={12} /> Volume
                  </label>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>{Math.round((sticker.musicVolume ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={sticker.musicVolume ?? 1}
                  onChange={e => onUpdate(sticker.id, { musicVolume: parseFloat(e.target.value) })}
                  className="cms-slider" style={{ width: '100%' }}
                />
              </div>

              {/* Replace */}
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac';
                  input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setIsAudioUploading(true);
                    try {
                      const res = await uploadAudioToCloudinary(file);
                      onUpdate(sticker.id, { musicUrl: res.url, musicName: file.name });
                    } catch(err) { alert('Gagal upload: ' + err.message); }
                    finally { setIsAudioUploading(false); }
                  };
                  input.click();
                }}
                disabled={isAudioUploading}
                className="cms-btn cms-btn-ghost"
                title="Ganti Musik"
                style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                {isAudioUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac';
                input.onchange = async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setIsAudioUploading(true);
                  try {
                    const res = await uploadAudioToCloudinary(file);
                    onUpdate(sticker.id, { musicUrl: res.url, musicName: file.name });
                  } catch(err) { alert('Gagal upload: ' + err.message); }
                  finally { setIsAudioUploading(false); }
                };
                input.click();
              }}
              disabled={isAudioUploading}
              className="cms-btn cms-btn-ghost"
              title="Upload Musik"
              style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed var(--glass-border)', background: 'transparent', padding: 0 }}
            >
              {isAudioUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Music size={16} />
              )}
            </button>
          )}
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* Actions moved to sticky right sidebar footer */}
      </div>

      <MediaGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onSelect={(url, resourceType) => {
          if (sticker.type === 'video' || resourceType === 'video') {
            onUpdate(sticker.id, { videoUrl: url, type: 'video' });
          } else {
            onUpdate(sticker.id, { imageData: url, isSvg: false, type: 'image' });
          }
          setShowGalleryModal(false);
        }}
      />
    </div>
  );
};

export default React.memo(StickerEditPanel);
