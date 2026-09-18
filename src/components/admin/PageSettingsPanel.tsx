import React, { useRef, useState } from 'react';
import { Layout, Globe, Lock, Eye, EyeOff, Trash2, Upload, Type, Link as LinkIcon, Settings2, Sparkles, MonitorOff, RotateCcw, Loader2, Image as ImageIcon, Monitor, Smartphone, FolderOpen } from 'lucide-react';
import AiMagicButton from './AiMagicButton';
import GlassColorPicker from './GlassColorPicker';
import { uploadToCloudinary } from '../../utils/cloudinary';
import InfoTooltip from './InfoTooltip';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import MediaGalleryModal from './MediaGalleryModal';

const PageSettingsPanel = ({ page, globalSettings, onUpdate, onRemove, onReset, notify, isSystem, cmsMode, currentFrames = {}, onUpdateFrames }) => {
  const fileRef = useRef(null);
  const [isUploading, setIsUploading] = useState({ top: false, bottom: false });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'topFrame' | 'bottomFrame' | 'preloader' | 'ogImage' | null>(null);

  // Active theme & navbar fallbacks (page setting with global fallback so settings stay solid and persistent)
  const currentBtnStyle = page?.buttonStyle || globalSettings?.buttonStyle || 'filled';
  const currentHover = page?.hoverEffect || globalSettings?.hoverEffect || 'lift';
  const currentMaxIcons = page?.navMaxIcons || globalSettings?.navMaxIcons || 5;
  const currentNavSize = page?.navSize || globalSettings?.navSize || 'normal';
  const currentNavStyle = page?.navStyle || globalSettings?.navStyle || 'dock';
  const currentNavBgMode = page?.navBgMode || globalSettings?.navBgMode || 'glass';
  const currentNavAutoHide = page?.navAutoHide !== undefined ? page.navAutoHide : (globalSettings?.navAutoHide ?? false);
  const currentGlassBlur = page?.glassBlur ?? globalSettings?.glassBlur ?? 20;
  const currentGlassOpacity = page?.glassOpacity ?? globalSettings?.glassOpacity ?? 0.25;

  const handleFrameUpload = async (file, type) => {
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

  if (!page) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Settings2 size={24} color="#ccc" />
        </div>
        <p style={{ fontSize: 13, fontWeight: 600 }}>Pilih halaman untuk mengelola setelan</p>
      </div>
    );
  }

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpdate({ iconSvg: ev.target.result });
    reader.readAsText(file);
  };

  return (
    <div className="cms-panel-container">
      {/* Header */}
      <div className="sidebar-pill-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 26, height: 26, borderRadius: 7, background: 'var(--cms-text)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings2 size={13} color="var(--cms-bg, #fff)" />
          </div>
          <span className="sidebar-title">Setelan</span>
        </div>
      </div>

      <div className="sidebar-pill-scroll">
        {/* Page Identity Section */}
        <div className="cms-field-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div 
              onClick={() => !isSystem && fileRef.current?.click()}
              style={{ 
                width: 52, height: 52, borderRadius: 14, background: 'var(--cms-card-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isSystem ? 'default' : 'pointer', overflow: 'hidden',
                border: '1px solid var(--glass-border)',
                flexShrink: 0
              }}
            >
              {page.iconSvg ? (
                <div style={{ width: 32, height: 32 }} dangerouslySetInnerHTML={{ __html: page.iconSvg }} />
              ) : (
                <Layout size={24} color="var(--cms-accent, #7c3aed)" />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cms-text)', letterSpacing: '-0.018em' }}>{page.name}</div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.6, marginTop: 1 }}>{isSystem ? 'Sistem' : 'Custom'} Page</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".svg" style={{ display: 'none' }} onChange={handleIconUpload} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <label className="cms-label" style={{ margin: 0 }}>Nama</label>
            <InfoTooltip content="Nama internal halaman yang muncul di sidebar Admin." />
          </div>
          <input 
            className="cms-input"
            type="text" 
            value={page.name}
            disabled={isSystem}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Contoh: My Gallery"
          />
        </div>

        {!isSystem && (
          <div className="cms-field-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <label className="cms-label" style={{ margin: 0 }}>Path</label>
              <InfoTooltip content="Alamat link unik untuk halaman ini (misal: /tentang-kami). Gunakan huruf kecil & strip." />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#ccc', fontWeight: 700 }}>/</span>
              <input 
                className="cms-input"
                style={{ paddingLeft: 28 }}
                type="text" 
                value={page.slug}
                onChange={(e) => onUpdate({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="slug-halaman"
              />
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0 12px' }} />

        <div className="cms-field-group">
          <label className="cms-label">Visibilitas</label>
          
          <div className="cms-toggle-row">
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cms-text)', display: 'flex', alignItems: 'center' }}>
                Publikasikan
                <InfoTooltip content="Dapat diakses secara publik oleh pengunjung." />
              </div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={!!page.isPublished}
              className="cms-switch"
              onClick={() => onUpdate({ isPublished: !page.isPublished })}
            >
              <div className="cms-switch-knob" />
            </button>
          </div>

          <div className="cms-toggle-row">
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cms-text)', display: 'flex', alignItems: 'center' }}>
                Navigasi
                <InfoTooltip content="Muncul di navigasi utama website." />
              </div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={!!page.showInNav}
              className="cms-switch"
              onClick={() => onUpdate({ showInNav: !page.showInNav })}
            >
              <div className="cms-switch-knob" />
            </button>
          </div>

          <div className="cms-toggle-row">
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cms-text)', display: 'flex', alignItems: 'center' }}>
                Fullscreen
                <InfoTooltip content="Sembunyikan navbar & footer pada halaman ini untuk mode satu halaman penuh." />
              </div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={!!page.hideNavbars}
              className="cms-switch"
              onClick={() => onUpdate({ hideNavbars: !page.hideNavbars })}
            >
              <div className="cms-switch-knob" />
            </button>
          </div>
          <div className="cms-toggle-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cms-text)', display: 'flex', alignItems: 'center' }}>
              Jadwal
              <InfoTooltip content="Atur tanggal dan waktu spesifik kapan halaman ini akan mulai bisa diakses oleh publik." />
            </div>
            <DatePicker 
              selected={page.publishAt ? new Date(page.publishAt) : null}
              onChange={(date) => onUpdate({ publishAt: date ? date.toISOString() : null })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              placeholderText="Pilih tanggal & waktu"
              className="cms-input cms-glass-datepicker"
              calendarClassName="cms-glass-calendar"
              wrapperClassName="cms-datepicker-wrapper"
              popperClassName="cms-datepicker-popper"
              popperPlacement="bottom-start"
              portalId="root"
            />
            {page.publishAt && (
              <button 
                onClick={() => onUpdate({ publishAt: null })}
                title="Reset"
                style={{ fontSize: 11, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Gembok Akses & Proteksi Sandi ── */}
        <div style={{ height: 1, background: 'var(--glass-border)', margin: '16px 0' }} />

        <div className="cms-field-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <Lock size={13} color="var(--cms-accent, #7c3aed)" /> 
              Gembok
              <InfoTooltip content="Kunci halaman ini dengan kata sandi sehingga hanya pengunjung yang memiliki izin/kode akses yang dapat membukanya." />
            </label>
            <span style={{
              fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
              background: page.isLocked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: page.isLocked ? '#ef4444' : '#10b981'
            }}>
              {page.isLocked ? '🔒 TERKUNCI' : '🌐 PUBLIK'}
            </span>
          </div>

          <div className="cms-toggle-row">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cms-text)' }}>
                Proteksi
              </div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                Wajibkan kata sandi untuk melihat halaman ini
              </div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={!!page.isLocked}
              className={`cms-switch ${page.isLocked ? 'is-danger' : ''}`}
              onClick={() => onUpdate({ 
                isLocked: !page.isLocked,
                lockPassword: page.lockPassword || '123456',
                lockTitle: page.lockTitle || `Akses Terbatas: ${page.name || 'Halaman'}`,
                lockMessage: page.lockMessage || 'Halaman ini bersifat privat. Silakan masukkan kata sandi atau minta akses melalui kontak kami.',
                lockContactChannel: page.lockContactChannel || 'whatsapp',
                lockContactTarget: page.lockContactTarget || '',
                lockContactText: page.lockContactText || `Halo, saya ingin meminta kata sandi akses untuk halaman: ${page.name || 'Halaman'}`
              })}
            >
              <div className="cms-switch-knob" />
            </button>
          </div>

          {page.isLocked && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12,
              padding: 14, borderRadius: 16, background: 'var(--cms-input-bg)',
              border: '1px solid var(--glass-border)', animation: 'cmsFadeIn 0.3s ease'
            }}>
              {/* Password Field */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Sandi</label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
                      onUpdate({ lockPassword: randomPin });
                      notify?.(`✨ PIN Baru Dihasilkan: ${randomPin}`);
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent, #7c3aed)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <Sparkles size={11} /> Acak
                  </button>
                </div>
                <input
                  type="text"
                  className="cms-input"
                  style={{ height: 38, borderRadius: 10, fontSize: 13, fontWeight: 800, width: '100%', letterSpacing: '0.05em' }}
                  value={page.lockPassword || ''}
                  placeholder="Contoh: secret2026 atau 123456"
                  onChange={e => onUpdate({ lockPassword: e.target.value })}
                />
              </div>

              {/* Lock Screen Title */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Judul</label>
                <input
                  type="text"
                  className="cms-input"
                  style={{ height: 38, borderRadius: 10, fontSize: 12.5, width: '100%' }}
                  value={page.lockTitle || ''}
                  placeholder="Misal: Akses Terbatas: Portofolio Eksklusif"
                  onChange={e => onUpdate({ lockTitle: e.target.value })}
                />
              </div>

              {/* Lock Screen Description Message */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Pesan</label>
                <textarea
                  className="cms-input"
                  style={{ minHeight: 60, borderRadius: 10, fontSize: 12, width: '100%', padding: 8 }}
                  value={page.lockMessage || ''}
                  placeholder="Tulis pesan petunjuk bagi pengunjung yang ingin membuka..."
                  onChange={e => onUpdate({ lockMessage: e.target.value })}
                />
              </div>

              {/* Contact Channel Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Saluran</label>
                <div style={{ display: 'flex', gap: 4, background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                  {[
                    { label: 'WhatsApp', val: 'whatsapp' },
                    { label: 'Email', val: 'email' },
                    { label: 'Instagram', val: 'instagram' },
                    { label: 'Telegram', val: 'telegram' },
                  ].map(ch => (
                    <button
                      key={ch.val}
                      type="button"
                      onClick={() => onUpdate({ lockContactChannel: ch.val })}
                      style={{
                        flex: 1, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: (page.lockContactChannel || 'whatsapp') === ch.val ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                        color: (page.lockContactChannel || 'whatsapp') === ch.val ? '#fff' : 'var(--cms-text-muted)',
                        fontSize: 11, fontWeight: 700, transition: 'all 0.2s'
                      }}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Target */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                  Target
                </label>
                <input
                  type="text"
                  className="cms-input"
                  style={{ height: 38, borderRadius: 10, fontSize: 12.5, width: '100%' }}
                  value={page.lockContactTarget || ''}
                  placeholder={page.lockContactChannel === 'email' ? 'admin@contoh.com' : page.lockContactChannel === 'instagram' ? 'username_ig' : '081234567890'}
                  onChange={e => onUpdate({ lockContactTarget: e.target.value })}
                />
              </div>

              {/* Custom Request Text */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Template</label>
                <textarea
                  className="cms-input"
                  style={{ minHeight: 50, borderRadius: 10, fontSize: 11.5, width: '100%', padding: 8 }}
                  value={page.lockContactText || ''}
                  placeholder="Halo, saya ingin meminta kata sandi akses..."
                  onChange={e => onUpdate({ lockContactText: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0 12px' }} />

        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} color="#f59e0b" /> 
            Preloader
            <InfoTooltip content="Logo atau visual yang muncul secara dinamis saat halaman sedang memuat konten." />
          </label>
          <div style={{ background: 'var(--cms-switcher-bg)', padding: '16px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div 
                onClick={() => document.getElementById('preloader-upload-input').click()}
                style={{ 
                  width: 64, height: 64, borderRadius: 16, border: '1.5px dashed #cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                  background: '#fff'
                }}
              >
                {page.preloaderImage ? <img src={page.preloaderImage} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> 
                : <Upload size={20} color="#94a3b8" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{page.preloaderImage ? 'Aktif' : 'Unggah'}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => { setGalleryTarget('preloader'); setIsGalleryOpen(true); }}
                    title="Galeri"
                    style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <FolderOpen size={13} />
                  </button>
                  {page.preloaderImage && (
                    <>
                      <span style={{ opacity: 0.3 }}>•</span>
                      <button 
                        onClick={() => onUpdate({ preloaderImage: null })}
                        title="Hapus"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input 
                id="preloader-upload-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const res = await uploadToCloudinary(file);
                    onUpdate({ preloaderImage: res.url });
                    notify?.('✅ Preloader berhasil diperbarui');

                  } catch (err) {
                    notify?.('❌ Gagal mengunggah preloader', 'error');
                  }
                }} 
              />
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* Title Tag Section */}
        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Type size={12} color="#3b82f6" /> 
            Title
            <InfoTooltip content="Judul yang tampil di tab browser saat halaman ini dibuka. Kosongkan untuk memakai judul global." />
          </label>
          <input 
            className="cms-input"
            type="text" 
            placeholder={`${page.name} | My Portfolio`}
            value={page.pageTitle || ''} 
            onChange={e => onUpdate({ pageTitle: e.target.value })}
          />
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* SEO Section */}
        <div className="cms-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <Globe size={12} color="var(--cms-accent, #7c3aed)" /> 
              SEO-Title
              <InfoTooltip content="Judul yang akan diindeks oleh Google. Biasanya singkat dan mengandung kata kunci utama." />
            </label>
            <AiMagicButton 
              label="AI"
              prompt={`Berikan 1 SEO Title yang menarik (maks 60 karakter) untuk halaman ${page.name}. Hanya berikan teks judulnya saja tanpa tanda kutip.`}
              onSuggest={(text) => onUpdate({ metaTitle: text, seoTitle: text })}
            />
          </div>
          <input 
            className="cms-input"
            type="text" 
            placeholder="Judul halaman di Google..."
            value={page.metaTitle || page.seoTitle || ''} 
            onChange={e => onUpdate({ metaTitle: e.target.value, seoTitle: e.target.value })}
          />
        </div>

        <div className="cms-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              SEO-Deskripsi
              <InfoTooltip content="Deskripsi singkat yang tampil di bawah judul pencarian Google. Usahakan di bawah 160 karakter." />
            </label>
            <AiMagicButton 
              label="AI"
              prompt={`Berikan 1 paragraf SEO Meta Description yang menarik (maks 155 karakter) untuk halaman ${page.name}. Fokus pada ajakan bertindak (Call to Action). Hanya berikan teksnya saja.`}
              onSuggest={(text) => onUpdate({ metaDescription: text, seoDesc: text })}
            />
          </div>
          <textarea 
            className="cms-input"
            rows={3}
            placeholder="Deskripsi singkat untuk SEO..."
            style={{ resize: 'none', height: 'auto', paddingTop: 14 }}
            value={page.metaDescription || page.seoDesc || ''} 
            onChange={e => onUpdate({ metaDescription: e.target.value, seoDesc: e.target.value })}
          />
        </div>

        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <ImageIcon size={12} color="#10b981" /> 
            Social-Image
            <InfoTooltip content="Gambar yang muncul saat link halaman ini dibagikan di WhatsApp, Twitter, Facebook, dll." />
          </label>
          <div style={{ background: 'var(--cms-switcher-bg)', padding: '16px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div 
                onClick={() => document.getElementById('og-image-upload-input').click()}
                style={{ 
                  width: 64, height: 64, borderRadius: 16, border: '1.5px dashed #cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                  background: '#fff'
                }}
              >
                {page.ogImage ? <img src={page.ogImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                : <Upload size={20} color="#94a3b8" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{page.ogImage ? 'Aktif' : 'Unggah'}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => { setGalleryTarget('ogImage'); setIsGalleryOpen(true); }}
                    title="Galeri"
                    style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <FolderOpen size={13} />
                  </button>
                  {page.ogImage && (
                    <>
                      <span style={{ opacity: 0.3 }}>•</span>
                      <button 
                        onClick={() => onUpdate({ ogImage: null })}
                        title="Hapus"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input 
                id="og-image-upload-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const res = await uploadToCloudinary(file);
                    onUpdate({ ogImage: res.url });
                    notify?.('✅ OG Image berhasil diperbarui');

                  } catch (err) {
                    notify?.('❌ Gagal mengunggah OG Image', 'error');
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Live Social Media Preview */}
        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Eye size={12} color="#6366f1" /> 
            Preview
          </label>
          <div style={{ 
            border: '1px solid var(--glass-border)', borderRadius: 16, overflow: 'hidden', 
            background: 'var(--cms-card-bg)', fontFamily: 'sans-serif'
          }}>
            <div style={{ width: '100%', height: 160, background: '#e2e8f0', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {page.ogImage ? (
                <img src={page.ogImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon size={32} color="#94a3b8" />
              )}
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--cms-switcher-bg)' }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                agenze.app • {page.slug || 'home'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {page.metaTitle || page.seoTitle || page.name || 'Untitled Page'}
              </div>
              <div style={{ fontSize: 13, color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {page.metaDescription || page.seoDesc || 'Deskripsi halaman ini akan muncul di sini saat dibagikan.'}
              </div>
            </div>
          </div>
        </div>



        {/* ── Gaya Halaman (Visual) ── */}
        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} color="#f59e0b" />
            Gaya
            <InfoTooltip content="Atur tampilan visual halaman seperti sudut gambar, jarak, dan bayangan — tanpa perlu kode apapun." />
          </label>

          <div className="cms-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Desktop Aspect Ratio */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="cms-label" style={{ margin: 0, fontWeight: 850 }}>Rasio</label>
                <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)' }}>
                  {page.desktopRatio || '9/16'}
                </span>
              </div>
              <div style={{ display: 'flex', background: 'var(--cms-switcher-bg)', padding: 4, borderRadius: 12, border: '1px solid var(--glass-border)', gap: 4 }}>
                {['1/1', '4/5', '9/16', 'Full'].map(r => {
                  const isActive = (page.desktopRatio || '9/16') === r;
                  return (
                    <button 
                      key={r} 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onUpdate({ desktopRatio: r });
                      }} 
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: isActive ? 'var(--cms-accent, #6366f1)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--cms-text-muted)',
                        fontSize: 12.5,
                        fontWeight: 900,
                        boxShadow: isActive ? '0 2px 8px rgba(var(--cms-accent-rgb), 0.3)' : 'none',
                        transition: 'all 0.15s ease',
                        userSelect: 'none'
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                Pilih proporsi layar tampilan website saat diakses pengunjung di PC / Laptop desktop.
              </div>
            </div>

            {/* Corner Radius */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="cms-label" style={{ margin: 0 }}>Sudut</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>
                  {page.styleBlockRadius ?? 0}px
                </span>
              </div>
              <input
                type="range" min="0" max="48" step="2"
                value={page.styleBlockRadius ?? 0}
                onChange={e => onUpdate({ styleBlockRadius: parseInt(e.target.value) })}
                className="cms-slider" style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                <span>Kotak</span><span>Bulat</span>
              </div>
            </div>

            {/* Block Gap */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="cms-label" style={{ margin: 0 }}>Jarak</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>
                  {page.styleBlockGap ?? 0}px
                </span>
              </div>
              <input
                type="range" min="0" max="40" step="2"
                value={page.styleBlockGap ?? 0}
                onChange={e => onUpdate({ styleBlockGap: parseInt(e.target.value) })}
                className="cms-slider" style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                <span>Rapat</span><span>Renggang</span>
              </div>
            </div>

            {/* Block Shadow */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="cms-label" style={{ margin: 0 }}>Bayangan</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>
                  {page.styleBlockShadow ?? 0}px
                </span>
              </div>
              <input
                type="range" min="0" max="40" step="4"
                value={page.styleBlockShadow ?? 0}
                onChange={e => onUpdate({ styleBlockShadow: parseInt(e.target.value) })}
                className="cms-slider" style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                <span>Tidak Ada</span><span>Kuat</span>
              </div>
            </div>

            {/* Page Background Color */}
            <div>
              <GlassColorPicker
                label="Latar"
                value={page.styleBgColor || '#ffffff'}
                onChange={(val) => onUpdate({ styleBgColor: val })}
              />
              {page.styleBgColor && (
                <button
                  onClick={() => onUpdate({ styleBgColor: '' })}
                  title="Reset"
                  style={{ background: 'none', border: 'none', color: '#ef4444', padding: 0, marginTop: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>

            {/* Page Padding */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="cms-label" style={{ margin: 0 }}>Padding</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>
                  {page.stylePagePadding ?? 0}px
                </span>
              </div>
              <input
                type="range" min="0" max="32" step="4"
                value={page.stylePagePadding ?? 0}
                onChange={e => onUpdate({ stylePagePadding: parseInt(e.target.value) })}
                className="cms-slider" style={{ width: '100%' }}
              />
            </div>

            {/* ── Komponen Visual & Efek Kaca (Glass) ── */}
            <div style={{ height: 1, background: 'var(--glass-border)', margin: '16px 0 12px' }} />
            <div>
              <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Sparkles size={12} color="#f43f5e" />
                Efek
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Animasi Scroll (Spill Satu-Satu) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)' }}>Animasi Scroll</div>
                    <span style={{ fontSize: 10, color: 'var(--cms-accent)', fontWeight: 800 }}>
                      {page.scrollAnimation && page.scrollAnimation !== 'none' ? 'Aktif' : 'Off'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--glass-border)', gap: 2, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Off', val: 'none' },
                      { label: 'Fade Up', val: 'fade-up' },
                      { label: 'Fade In', val: 'fade' },
                      { label: 'Zoom In', val: 'scale' },
                      { label: 'Blur In', val: 'blur' },
                      { label: 'Slide Kiri', val: 'slide-left' },
                      { label: 'Slide Kanan', val: 'slide-right' },
                    ].map(s => (
                      <button 
                        key={s.val} 
                        type="button"
                        onClick={() => onUpdate({ scrollAnimation: s.val })} 
                        style={{ 
                          height: 28, 
                          padding: '0 10px', 
                          borderRadius: 7, 
                          border: 'none', 
                          cursor: 'pointer', 
                          background: (page.scrollAnimation || 'none') === s.val ? 'var(--cms-accent)' : 'transparent', 
                          color: (page.scrollAnimation || 'none') === s.val ? '#fff' : 'var(--cms-text-muted)', 
                          fontSize: 11, 
                          fontWeight: 700, 
                          transition: 'all 0.2s',
                          flexGrow: 1
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                    Blok gambar akan muncul bertahap satu per satu (spill) saat pengunjung menggulir halaman.
                  </div>

                  {/* Delay / Jeda Spill Animasi */}
                  {page.scrollAnimation && page.scrollAnimation !== 'none' && (
                    <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--cms-switcher-bg)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)' }}>Jeda Spill Antar Blok</div>
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 800, 
                          padding: '2px 8px', 
                          borderRadius: 6, 
                          background: 'rgba(124, 58, 237, 0.12)', 
                          color: 'var(--cms-accent)' 
                        }}>
                          {page.scrollAnimationDelay ?? 120} ms
                        </span>
                      </div>

                      {/* Range Slider */}
                      <input
                        type="range"
                        min={0}
                        max={500}
                        step={20}
                        value={page.scrollAnimationDelay ?? 120}
                        onChange={(e) => onUpdate({ scrollAnimationDelay: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          height: 6,
                          accentColor: 'var(--cms-accent, #7c3aed)',
                          cursor: 'pointer',
                          display: 'block',
                          marginBottom: 10,
                        }}
                      />

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {[
                          { label: '0ms (Serempak)', val: 0 },
                          { label: '60ms (Cepat)', val: 60 },
                          { label: '120ms (Normal)', val: 120 },
                          { label: '200ms (Santai)', val: 200 },
                          { label: '350ms (Lambat)', val: 350 },
                        ].map((preset) => {
                          const isSelected = (page.scrollAnimationDelay ?? 120) === preset.val;
                          return (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => onUpdate({ scrollAnimationDelay: preset.val })}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: isSelected ? '1px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                                background: isSelected ? 'var(--cms-accent)' : 'var(--cms-card-bg, #fff)',
                                color: isSelected ? '#fff' : 'var(--cms-text-muted)',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                flex: '1 1 auto',
                                textAlign: 'center',
                              }}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 8, lineHeight: 1.35 }}>
                        {(page.scrollAnimationDelay ?? 120) === 0
                          ? 'Semua blok yang masuk layar akan muncul serempak tanpa jeda waktu.'
                          : `Setiap blok berikutnya tertunda ${page.scrollAnimationDelay ?? 120}ms sehingga animasi mengalir bertingkat.`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Gaya Tombol */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)', marginBottom: 6 }}>Tombol</div>
                  <div style={{ display: 'flex', background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--glass-border)', gap: 2 }}>
                    {[
                      { label: 'Filled', val: 'filled' },
                      { label: 'Outline', val: 'outline' },
                      { label: 'Soft', val: 'soft' },
                      { label: 'Pill', val: 'pill' },
                      { label: 'Sharp', val: 'sharp' },
                    ].map(s => (
                      <button 
                        key={s.val} 
                        type="button"
                        onClick={() => onUpdate({ buttonStyle: s.val })} 
                        style={{ 
                          flex: 1, 
                          minWidth: 0,
                          height: 28, 
                          padding: '0 2px', 
                          borderRadius: 7, 
                          border: 'none', 
                          cursor: 'pointer', 
                          background: currentBtnStyle === s.val ? 'var(--cms-accent)' : 'transparent', 
                          color: currentBtnStyle === s.val ? '#fff' : 'var(--cms-text-muted)', 
                          fontSize: 11, 
                          fontWeight: 700, 
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          boxShadow: currentBtnStyle === s.val ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Efek Hover Interaksi */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)', marginBottom: 6 }}>Hover</div>
                  <div style={{ display: 'flex', background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--glass-border)', gap: 2 }}>
                    {[
                      { label: 'Lift Up', val: 'lift' },
                      { label: 'Glow', val: 'glow' },
                      { label: 'Scale', val: 'scale' },
                      { label: 'None', val: 'none' },
                    ].map(s => (
                      <button 
                        key={s.val} 
                        type="button"
                        onClick={() => onUpdate({ hoverEffect: s.val })} 
                        style={{ 
                          flex: 1, 
                          minWidth: 0,
                          height: 28, 
                          padding: '0 4px', 
                          borderRadius: 7, 
                          border: 'none', 
                          cursor: 'pointer', 
                          background: currentHover === s.val ? 'var(--cms-accent)' : 'transparent', 
                          color: currentHover === s.val ? '#fff' : 'var(--cms-text-muted)', 
                          fontSize: 11, 
                          fontWeight: 700, 
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          boxShadow: currentHover === s.val ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jumlah Ikon Maksimal Navbar Bawah */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)' }}>Maks-Ikon</div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent)' }}>{currentMaxIcons} Ikon</span>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--glass-border)', gap: 2 }}>
                    {[3, 4, 5, 6, 7, 8].map(n => (
                      <button 
                        key={n} 
                        type="button"
                        onClick={() => onUpdate({ navMaxIcons: n })} 
                        style={{ 
                          flex: 1, 
                          minWidth: 0,
                          height: 28, 
                          borderRadius: 7, 
                          border: 'none', 
                          cursor: 'pointer', 
                          background: currentMaxIcons === n ? 'var(--cms-accent)' : 'transparent', 
                          color: currentMaxIcons === n ? '#fff' : 'var(--cms-text-muted)', 
                          fontSize: 11.5, 
                          fontWeight: 800, 
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          boxShadow: currentMaxIcons === n ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ukuran Navbar Bawah */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)', marginBottom: 6 }}>Ukuran</div>
                  <div style={{ display: 'flex', background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--glass-border)', gap: 2 }}>
                    {[
                      { label: 'Kecil', val: 'compact' },
                      { label: 'Standar', val: 'normal' },
                      { label: 'Besar', val: 'large' },
                    ].map(s => (
                      <button 
                        key={s.val} 
                        type="button"
                        onClick={() => onUpdate({ navSize: s.val })} 
                        style={{ 
                          flex: 1, 
                          minWidth: 0,
                          height: 28, 
                          padding: '0 4px', 
                          borderRadius: 7, 
                          border: 'none', 
                          cursor: 'pointer', 
                          background: currentNavSize === s.val ? 'var(--cms-accent)' : 'transparent', 
                          color: currentNavSize === s.val ? '#fff' : 'var(--cms-text-muted)', 
                          fontSize: 11, 
                          fontWeight: 700, 
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          boxShadow: currentNavSize === s.val ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gaya Tampilan Navbar Bawah */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)', marginBottom: 6 }}>Gaya-Nav</div>
                  <div style={{ display: 'flex', background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--glass-border)', gap: 2 }}>
                    {[
                      { label: 'Dock', val: 'dock' },
                      { label: 'Flat', val: 'flat' },
                      { label: 'Card', val: 'card' },
                    ].map(s => (
                      <button 
                        key={s.val} 
                        type="button"
                        onClick={() => onUpdate({ navStyle: s.val })} 
                        style={{ 
                          flex: 1, 
                          minWidth: 0,
                          height: 28, 
                          padding: '0 4px', 
                          borderRadius: 7, 
                          border: 'none', 
                          cursor: 'pointer', 
                          background: currentNavStyle === s.val ? 'var(--cms-accent)' : 'transparent', 
                          color: currentNavStyle === s.val ? '#fff' : 'var(--cms-text-muted)', 
                          fontSize: 11, 
                          fontWeight: 700, 
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          boxShadow: currentNavStyle === s.val ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Background Navbar */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)', marginBottom: 6 }}>Latar-Nav</div>
                  <div style={{ display: 'flex', background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 10, border: '1px solid var(--glass-border)', gap: 2 }}>
                    {[
                      { label: 'Kaca', val: 'glass' },
                      { label: 'Solid', val: 'solid' },
                    ].map(s => (
                      <button 
                        key={s.val} 
                        type="button"
                        onClick={() => onUpdate({ navBgMode: s.val })} 
                        style={{ 
                          flex: 1, 
                          minWidth: 0,
                          height: 28, 
                          padding: '0 8px', 
                          borderRadius: 7, 
                          border: 'none', 
                          cursor: 'pointer', 
                          background: currentNavBgMode === s.val ? 'var(--cms-accent)' : 'transparent', 
                          color: currentNavBgMode === s.val ? '#fff' : 'var(--cms-text-muted)', 
                          fontSize: 11, 
                          fontWeight: 700, 
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          boxShadow: currentNavBgMode === s.val ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-Hide Saat Scroll */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)' }}>Auto-Hide</div>
                    <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', lineHeight: 1.35 }}>Navbar turun saat scroll ke bawah dan muncul saat scroll ke atas.</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(currentNavAutoHide)}
                    className="cms-switch"
                    onClick={() => onUpdate({ navAutoHide: !currentNavAutoHide })}
                  >
                    <div className="cms-switch-knob" />
                  </button>
                </div>

                {/* Intensitas Blur Kaca */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)' }}>Blur</span>
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 800, 
                      padding: '2px 8px', 
                      borderRadius: 6, 
                      background: 'rgba(124, 58, 237, 0.12)', 
                      color: 'var(--cms-accent)' 
                    }}>
                      {currentGlassBlur}px
                    </span>
                  </div>
                  <input 
                    type="range" min="0" max="40" 
                    value={currentGlassBlur} 
                    onChange={e => onUpdate({ glassBlur: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      height: 6,
                      accentColor: 'var(--cms-accent, #7c3aed)',
                      cursor: 'pointer',
                      display: 'block',
                      margin: '4px 0',
                    }}
                  />
                </div>

                {/* Opasitas Kaca Panel */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cms-text)' }}>Opasitas</span>
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 800, 
                      padding: '2px 8px', 
                      borderRadius: 6, 
                      background: 'rgba(124, 58, 237, 0.12)', 
                      color: 'var(--cms-accent)' 
                    }}>
                      {Math.round(currentGlassOpacity * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" min="5" max="95" step="5"
                    value={Math.round(currentGlassOpacity * 100)} 
                    onChange={e => onUpdate({ glassOpacity: Number(e.target.value) / 100 })}
                    style={{
                      width: '100%',
                      height: 6,
                      accentColor: 'var(--cms-accent, #7c3aed)',
                      cursor: 'pointer',
                      display: 'block',
                      margin: '4px 0',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />


        {/* Frames Section */}
        <div className="cms-field-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 7, margin: 0, fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: '0.02em' }}>
              <ImageIcon size={14} color="var(--cms-accent, #7c3aed)" strokeWidth={2.4} /> 
              <span>BINGKAI HALAMAN</span>
              <InfoTooltip content="Lapisan grafis atas & bawah yang menutup di depan stiker / konten website." />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, color: page.useFrame !== false ? '#10b981' : 'var(--cms-text-muted, #64748b)', fontWeight: 750 }}>
                {page.useFrame !== false ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={page.useFrame !== false}
                className={`cms-switch ${page.useFrame !== false ? 'active' : ''}`}
                onClick={() => onUpdate({ useFrame: page.useFrame === false })}
                aria-label="Toggle Bingkai"
                style={{
                  background: page.useFrame !== false ? '#10b981' : 'var(--cms-border, #cbd5e1)',
                  border: `1.5px solid ${page.useFrame !== false ? '#059669' : '#94a3b8'}`,
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div 
                  className="cms-switch-knob" 
                  style={{
                    transform: page.useFrame !== false ? 'translateY(-50%) translateX(20px)' : 'translateY(-50%) translateX(0)',
                    background: '#ffffff',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)'
                  }}
                />
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: page.useFrame !== false ? 1 : 0.45, transition: 'opacity 0.2s ease', pointerEvents: page.useFrame !== false ? 'auto' : 'none' }}>
            {/* Top Frame */}
            <div style={{ background: 'var(--cms-card-bg, #ffffff)', padding: '16px', borderRadius: 16, border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-secondary, #334155)', letterSpacing: '0.05em', marginBottom: 12 }}>ATAS</div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div 
                  onClick={() => document.getElementById('ps-top-frame-input').click()}
                  style={{ 
                    width: 88, height: 72, borderRadius: 12, 
                    border: currentFrames.topFrame ? '1.5px solid var(--cms-border, #cbd5e1)' : '2px dashed var(--cms-accent, #7c3aed)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', overflow: 'hidden',
                    background: currentFrames.topFrame ? '#fff' : 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.06)',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {currentFrames.topFrame ? (
                    <img src={currentFrames.topFrame} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Frame Atas" /> 
                  ) : isUploading.top ? (
                    <Loader2 size={18} className="animate-spin" color="var(--cms-accent, #7c3aed)" /> 
                  ) : (
                    <>
                      <Upload size={18} color="var(--cms-accent, #7c3aed)" strokeWidth={2.4} />
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>Pilih Foto</span>
                    </>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input 
                    className="cms-input" 
                    style={{ 
                      height: 36, fontSize: 12, fontWeight: 600, 
                      background: 'var(--cms-input-bg, #f8fafc)',
                      border: '1.5px solid var(--cms-border, #94a3b8)',
                      borderRadius: 10,
                      color: 'var(--cms-text, #0f172a)',
                      padding: '0 12px',
                      marginBottom: 8, 
                      boxSizing: 'border-box' 
                    }} 
                    placeholder="Link tujuan (https://...)" 
                    value={currentFrames.topLink || ''} 
                    onChange={e => onUpdateFrames({ topLink: e.target.value })} 
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => { setGalleryTarget('topFrame'); setIsGalleryOpen(true); }} 
                      className="cms-btn" 
                      title="Pilih dari Galeri Media" 
                      style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6, 
                        padding: '6px 12px', borderRadius: 8, 
                        border: '1.5px solid var(--cms-border, #cbd5e1)', 
                        background: 'var(--cms-switcher-bg, #f1f5f9)', 
                        color: 'var(--cms-text, #0f172a)', 
                        fontSize: 11, fontWeight: 750, cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      <FolderOpen size={13} color="var(--cms-accent, #7c3aed)" strokeWidth={2.2} />
                      <span>Buka Galeri</span>
                    </button>
                    {currentFrames.topFrame && (
                      <button 
                        type="button" 
                        onClick={() => onUpdateFrames({ topFrame: null, topLink: '' })} 
                        className="cms-btn" 
                        title="Hapus Bingkai" 
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: 5, 
                          padding: '6px 10px', borderRadius: 8, 
                          border: '1.5px solid rgba(239, 68, 68, 0.35)', 
                          background: 'rgba(239, 68, 68, 0.08)', 
                          color: '#ef4444', 
                          fontSize: 11, fontWeight: 750, cursor: 'pointer' 
                        }}
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
                <input id="ps-top-frame-input" type="file" style={{ display: 'none' }} onChange={e => handleFrameUpload(e.target.files[0], 'top')} />
              </div>
            </div>

            {/* Bottom Frame */}
            <div style={{ background: 'var(--cms-card-bg, #ffffff)', padding: '16px', borderRadius: 16, border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-secondary, #334155)', letterSpacing: '0.05em', marginBottom: 12 }}>BAWAH</div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div 
                  onClick={() => document.getElementById('ps-bottom-frame-input').click()}
                  style={{ 
                    width: 88, height: 72, borderRadius: 12, 
                    border: currentFrames.bottomFrame ? '1.5px solid var(--cms-border, #cbd5e1)' : '2px dashed var(--cms-accent, #7c3aed)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', overflow: 'hidden',
                    background: currentFrames.bottomFrame ? '#fff' : 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.06)',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {currentFrames.bottomFrame ? (
                    <img src={currentFrames.bottomFrame} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Frame Bawah" /> 
                  ) : isUploading.bottom ? (
                    <Loader2 size={18} className="animate-spin" color="var(--cms-accent, #7c3aed)" /> 
                  ) : (
                    <>
                      <Upload size={18} color="var(--cms-accent, #7c3aed)" strokeWidth={2.4} />
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>Pilih Foto</span>
                    </>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input 
                    className="cms-input" 
                    style={{ 
                      height: 36, fontSize: 12, fontWeight: 600, 
                      background: 'var(--cms-input-bg, #f8fafc)',
                      border: '1.5px solid var(--cms-border, #94a3b8)',
                      borderRadius: 10,
                      color: 'var(--cms-text, #0f172a)',
                      padding: '0 12px',
                      marginBottom: 8, 
                      boxSizing: 'border-box' 
                    }} 
                    placeholder="Link tujuan (https://...)" 
                    value={currentFrames.bottomLink || ''} 
                    onChange={e => onUpdateFrames({ bottomLink: e.target.value })} 
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => { setGalleryTarget('bottomFrame'); setIsGalleryOpen(true); }} 
                      className="cms-btn" 
                      title="Pilih dari Galeri Media" 
                      style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6, 
                        padding: '6px 12px', borderRadius: 8, 
                        border: '1.5px solid var(--cms-border, #cbd5e1)', 
                        background: 'var(--cms-switcher-bg, #f1f5f9)', 
                        color: 'var(--cms-text, #0f172a)', 
                        fontSize: 11, fontWeight: 750, cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      <FolderOpen size={13} color="var(--cms-accent, #7c3aed)" strokeWidth={2.2} />
                      <span>Buka Galeri</span>
                    </button>
                    {currentFrames.bottomFrame && (
                      <button 
                        type="button" 
                        onClick={() => onUpdateFrames({ bottomFrame: null, bottomLink: '' })} 
                        className="cms-btn" 
                        title="Hapus Bingkai" 
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: 5, 
                          padding: '6px 10px', borderRadius: 8, 
                          border: '1.5px solid rgba(239, 68, 68, 0.35)', 
                          background: 'rgba(239, 68, 68, 0.08)', 
                          color: '#ef4444', 
                          fontSize: 11, fontWeight: 750, cursor: 'pointer' 
                        }}
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
                <input id="ps-bottom-frame-input" type="file" style={{ display: 'none' }} onChange={e => handleFrameUpload(e.target.files[0], 'bottom')} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* Actions moved to sticky right sidebar */}
      </div>

      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => {
          if (galleryTarget === 'topFrame') {
            onUpdateFrames({ topFrame: url });
            notify?.('✅ Bingkai atas dipilih dari galeri');
          } else if (galleryTarget === 'bottomFrame') {
            onUpdateFrames({ bottomFrame: url });
            notify?.('✅ Bingkai bawah dipilih dari galeri');
          } else if (galleryTarget === 'preloader') {
            onUpdate({ preloaderImage: url });
            notify?.('✅ Preloader dipilih dari galeri');
          } else if (galleryTarget === 'ogImage') {
            onUpdate({ ogImage: url });
            notify?.('✅ Gambar sosial dipilih dari galeri');
          }
          setIsGalleryOpen(false);
          setGalleryTarget(null);
        }}
      />
    </div>
  );
};

/* Sub-components - Styled for Glassmorphism */
const GLabel = ({ icon, children }) => (
  <div className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    {icon} {children}
  </div>
);

const GInput = ({ label, value, onChange, placeholder, prefix, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', paddingLeft: 2 }}>{label}</div>
    <div style={{ position: 'relative' }}>
      {prefix && <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#ccc', fontWeight: 700 }}>{prefix}</span>}
      <input 
        type="text" 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
        disabled={disabled}
        className="cms-input"
        style={{ 
          paddingLeft: prefix ? 30 : 16,
          background: disabled ? 'rgba(0,0,0,0.02)' : '#fff',
          color: disabled ? '#aaa' : '#000'
        }}
      />
    </div>
  </div>
);

const ToggleButton = ({ active, onClick, activeLabel, inactiveLabel, activeIcon, inactiveIcon, activeColor }) => (
  <button 
    onClick={onClick}
    className="cms-btn"
    style={{ 
      flex: 1, height: 38, fontSize: 10,
      background: active ? activeColor : 'var(--cms-switcher-bg)', 
      color: active ? '#fff' : 'var(--cms-text-muted)',
      boxShadow: active ? `0 8px 16px ${activeColor}33` : 'none',
      border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}
  >
    {active ? activeIcon : inactiveIcon}
    {active ? activeLabel : inactiveLabel}
  </button>
);

export default PageSettingsPanel;
