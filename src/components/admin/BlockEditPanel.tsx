import React, { useRef, useState } from 'react';
import { Upload, Link, Trash2, ChevronUp, ChevronDown, ImageIcon, Play, Bookmark, Plus, X, FolderOpen, Info, Loader2, Music, Volume2, Volume1, Monitor, Fingerprint, Sparkles } from 'lucide-react';
import { generateFileName } from '../../utils/fileNaming';
import { uploadToCloudinary, uploadAudioToCloudinary } from '../../utils/cloudinary';
import { storage } from '../../utils/storage';
import GlassSelect from './GlassSelect';
import GlassColorPicker from './GlassColorPicker';
import AiMagicButton from './AiMagicButton';
import MediaGalleryModal from './MediaGalleryModal';
import InfoTooltip from './InfoTooltip';
import ActionPopupControl from './ActionPopupControl';
import { extractYouTubeId, getOptimizedUrl } from '../renderer/utils';

/* ── Dark panel style matching the left sidebar ── */
const S = {
  panel: {
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', flex: 1,
    height: '100%',
  },
  body: {
    padding: '0 24px 24px', overflowY: 'auto',
    flex: 1, minHeight: 0,
    scrollbarWidth: 'none',
  },
  field: { marginBottom: 16 },
  tab: (active) => ({
    flex: 1, padding: '9px 0', border: 'none', borderRadius: 9999, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 600 : 500,
    background: active ? 'var(--cms-switcher-item-bg)' : 'transparent',
    color: active ? 'var(--cms-text)' : 'var(--cms-text-muted)',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
  }),
  divider: {
    height: 1, background: 'var(--glass-border)', margin: '4px 0 16px',
  },
  iconBtn: (danger) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: danger ? 'rgba(239,68,68,0.1)' : 'var(--cms-switcher-bg)',
    color: danger ? '#ef4444' : 'var(--cms-text)',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),
};

let mkCounter = Date.now();
const newMkId = () => `mk-${++mkCounter}`;

const BlockEditPanel = ({ block, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, activePage, blockIndex, hideHeader }) => {
  const fileRef = useRef(null);
  const coverFileRef = useRef(null);
  const audioFileRef = useRef(null);
  const markerSvgRefs = useRef({});

  const [mediaTab, setMediaTab] = useState(
    block?.mediaType === 'youtube' ? 'youtube' : 
    block?.mediaType === 'solid' ? 'solid' : 
    block?.mediaType === 'spacer' ? 'spacer' : 
    block?.mediaType === 'form' ? 'form' : 
    block?.mediaType === 'biodata' ? 'biodata' : 'file'
  );

  const [ytInput, setYtInput] = useState('');
  const [addingMarker, setAddingMarker] = useState(false);
  const [markerDraft, setMarkerDraft] = useState({ name: '', svgData: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [availableForms, setAvailableForms] = useState([]);
  const [bioLinkPages, setBioLinkPages] = useState<any[]>([]);

  React.useEffect(() => {
    const loadFormsAndLinks = async () => {
      try {
        const [forms, bioPages] = await Promise.all([
          storage.getItem('porto_forms', []),
          storage.getItem('porto_bio_pages', null)
        ]);
        setAvailableForms(forms || []);
        if (bioPages && Array.isArray(bioPages) && bioPages.length > 0) {
          setBioLinkPages(bioPages);
        } else {
          setBioLinkPages([{ id: 'page_main', slug: 'main', title: 'Halaman Utama' }]);
        }
      } catch (err) {
        // fallback
      }
    };
    loadFormsAndLinks();
  }, []);


  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      let mediaType = 'image';
      if (file.type.startsWith('video/')) mediaType = 'video';
      onUpdate(block.id, { url: ev.target.result, name: file.name, mediaType, embedId: null });
    };
    reader.readAsDataURL(file);
  };

  const handleYouTubeApply = () => {
    const id = extractYouTubeId(ytInput);
    if (!id) { alert('URL YouTube tidak valid'); return; }
    onUpdate(block.id, { url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, embedId: id, mediaType: 'youtube', name: `YouTube: ${id}` });
    setYtInput('');
  };

  const addMarker = () => {
    if (!markerDraft.name.trim()) return;
    const markers = [...(block.markers || []), { id: newMkId(), name: markerDraft.name.trim(), svgData: markerDraft.svgData }];
    onUpdate(block.id, { markers });
    setMarkerDraft({ name: '', svgData: '' });
    setAddingMarker(false);
  };

  const removeMarker = (mkId) => {
    onUpdate(block.id, { markers: (block.markers || []).filter(m => m.id !== mkId) });
  };

  const handleMarkerSvg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setMarkerDraft(p => ({ ...p, svgData: ev.target.result }));
    reader.readAsText(file);
  };

  if (!block) return null;

  const isYt = block.mediaType === 'youtube';
  const isVid = block.mediaType === 'video';

  return (
    <div className="cms-panel-container">
      {/* Header with standard controls */}
      <div className="sidebar-pill-header" style={{ padding: '20px 24px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 28, height: 28, borderRadius: 8, background: 'var(--cms-accent, #7c3aed)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb),0.2)'
          }}>
            <ImageIcon size={14} color="#fff" strokeWidth={3} />
          </div>
          <span className="sidebar-title">Blok</span>
        </div>
      </div>

      <div className="sidebar-pill-scroll" style={{ padding: '12px 24px 32px' }}>
        {/* ── Jenis Blok Tabs ── (hidden for biodata) */}
        {block.mediaType !== 'biodata' && (
        <div className="cms-field-group">
          <label className="cms-label">Tipe</label>
          <div style={{ display: 'flex', gap: 6, background: 'var(--cms-switcher-bg)', borderRadius: 100, padding: 4, border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
            {[
              { key: 'file', mediaType: 'image', icon: <Upload size={15} />, label: 'File Gambar/Video' },
              { key: 'youtube', mediaType: 'youtube', icon: <Play size={15} />, label: 'YouTube' },
              { key: 'solid', mediaType: 'solid', icon: <div style={{ width: 15, height: 15, borderRadius: 4, background: 'currentColor' }} />, label: 'Background Solid' },
              { key: 'spacer', mediaType: 'spacer', icon: <div style={{ width: 15, height: 2, background: 'currentColor', borderRadius: 2 }} />, label: 'Pemisah' },
              { key: 'form', mediaType: 'form', icon: <div style={{ width: 15, height: 11, border: '1.5px solid currentColor', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 9, height: 1.5, background: 'currentColor' }}/></div>, label: 'Form Kontak' },
              { key: 'biodata', mediaType: 'biodata', icon: <Fingerprint size={15} />, label: 'Biodata Profil' }
            ].map(m => (
              <button key={m.key}
                onClick={() => { setMediaTab(m.key); onUpdate(block.id, { mediaType: m.mediaType }); }}
                title={m.label}
                style={{
                  flex: 1, minWidth: 40, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', borderRadius: 100, cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: mediaTab === m.key ? 'var(--cms-switcher-item-bg)' : 'transparent',
                  color: mediaTab === m.key ? (m.key === 'youtube' ? '#ef4444' : 'var(--cms-accent, #7c3aed)') : 'var(--cms-switcher-text)',
                  boxShadow: mediaTab === m.key ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                  transform: mediaTab === m.key ? 'scale(1.05)' : 'scale(1)',
                  flexShrink: 0
                }}
              >
                {m.icon}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* ── Visibilitas Blok ── */}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />
        
        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--cms-accent, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Monitor size={10} color="#fff" />
            </div>
            Visibilitas
          </label>
          
          <div className="cms-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Draft / Sembunyikan */}
            <div className="cms-toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cms-text)' }}>Draft</div>
                <InfoTooltip content="Blok ini tidak akan ditampilkan di website publik, namun tetap tersimpan di editor." />
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!block.isHidden}
                className="cms-switch"
                onClick={() => onUpdate(block.id, { isHidden: !block.isHidden })}
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
                aria-checked={!!block.hideOnMobile}
                className="cms-switch"
                onClick={() => onUpdate(block.id, { hideOnMobile: !block.hideOnMobile })}
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
                aria-checked={!!block.hideOnDesktop}
                className="cms-switch"
                onClick={() => onUpdate(block.id, { hideOnDesktop: !block.hideOnDesktop })}
              >
                <div className="cms-switch-knob" />
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {mediaTab === 'biodata' && (
          <div className="cms-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, animation: 'cmsFadeIn 0.3s ease', background: 'rgba(var(--cms-accent-rgb), 0.05)', border: '1px solid rgba(var(--cms-accent-rgb), 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cms-accent, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb),0.3)' }}>
                <Fingerprint size={20} color="#fff" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>Biodata</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--cms-text-muted)' }}>
                  Pilih data apa saja yang ingin ditampilkan di dalam Widget Biodata ini.
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(var(--cms-accent-rgb),0.1)', margin: '8px 0' }} />

            <div>
              <label className="cms-label" style={{ fontSize: 11, marginBottom: 8, color: 'var(--cms-text)' }}>Tampilan</label>
              <GlassSelect
                value={block.biodataConfig?.cvMode || 'auto'}
                onChange={(e) => onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), cvMode: e.target.value } })}
                options={[
                  { label: 'Bisa Diperkecil/Perbesar (Auto)', value: 'auto' },
                  { label: 'Selalu Terbuka / Fix Besar (Expanded)', value: 'always_expanded' },
                  { label: 'Selalu Tertutup (Collapsed)', value: 'always_collapsed' }
                ]}
                style={{ height: 36, fontSize: 12, width: '100%', borderRadius: 8 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <label className="cms-checkbox-label" style={{ fontSize: 13 }}>
                <input type="checkbox" className="cms-checkbox" checked={block.biodataConfig?.showContact !== false} onChange={e => onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), showContact: e.target.checked } })} />
                Kontak
              </label>
              <label className="cms-checkbox-label" style={{ fontSize: 13 }}>
                <input type="checkbox" className="cms-checkbox" checked={block.biodataConfig?.showBio !== false} onChange={e => onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), showBio: e.target.checked } })} />
                Bio
              </label>
              <label className="cms-checkbox-label" style={{ fontSize: 13 }}>
                <input type="checkbox" className="cms-checkbox" checked={block.biodataConfig?.showExperience !== false} onChange={e => onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), showExperience: e.target.checked } })} />
                Pengalaman
              </label>
              <label className="cms-checkbox-label" style={{ fontSize: 13 }}>
                <input type="checkbox" className="cms-checkbox" checked={block.biodataConfig?.showEducation !== false} onChange={e => onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), showEducation: e.target.checked } })} />
                Pendidikan
              </label>
              <label className="cms-checkbox-label" style={{ fontSize: 13 }}>
                <input type="checkbox" className="cms-checkbox" checked={block.biodataConfig?.showSkills !== false} onChange={e => onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), showSkills: e.target.checked } })} />
                Skills
              </label>
              <label className="cms-checkbox-label" style={{ fontSize: 13 }}>
                <input type="checkbox" className="cms-checkbox" checked={block.biodataConfig?.showOrganizations !== false} onChange={e => onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), showOrganizations: e.target.checked } })} />
                Organisasi
              </label>
              <label className="cms-checkbox-label" style={{ fontSize: 13 }}>
                <input type="checkbox" className="cms-checkbox" checked={block.biodataConfig?.showCertifications !== false} onChange={e => onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), showCertifications: e.target.checked } })} />
                Sertifikasi
              </label>
            </div>

            {/* Section ordering */}
            <div style={{ marginTop: 16 }}>
              <label className="cms-label" style={{ fontSize: 11, marginBottom: 8, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Urutan
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(block.biodataConfig?.sectionOrder || ['experience', 'organizations', 'education', 'certifications', 'skills']).map((key: string, idx: number, arr: string[]) => {
                  const labels: Record<string, string> = {
                    experience: '💼 Pengalaman Kerja',
                    organizations: '👥 Pengalaman Organisasi',
                    education: '🎓 Pendidikan',
                    certifications: '🏅 Sertifikasi',
                    skills: '⚡ Skills & Bahasa',
                  };
                  const moveSection = (from: number, to: number) => {
                    const current = [...arr];
                    const [moved] = current.splice(from, 1);
                    current.splice(to, 0, moved);
                    onUpdate(block.id, { biodataConfig: { ...(block.biodataConfig || {}), sectionOrder: current } });
                  };
                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px',
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 10,
                      fontSize: 12, fontWeight: 700, color: 'var(--cms-text)',
                    }}>
                      <span style={{ flex: 1 }}>{labels[key] || key}</span>
                      <button
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, idx - 1)}
                        style={{
                          width: 24, height: 24, borderRadius: 6,
                          border: '1px solid var(--glass-border)',
                          background: 'var(--cms-card-bg)',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          opacity: idx === 0 ? 0.3 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--cms-text)',
                        }}
                      >↑</button>
                      <button
                        disabled={idx === arr.length - 1}
                        onClick={() => moveSection(idx, idx + 1)}
                        style={{
                          width: 24, height: 24, borderRadius: 6,
                          border: '1px solid var(--glass-border)',
                          background: 'var(--cms-card-bg)',
                          cursor: idx === arr.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: idx === arr.length - 1 ? 0.3 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--cms-text)',
                        }}
                      >↓</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {mediaTab === 'solid' && (
          <div className="cms-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, animation: 'cmsFadeIn 0.3s ease' }}>
            <GlassColorPicker 
              label="Warna Background"
              value={block.backgroundColor || 'var(--cms-accent, #7c3aed)'}
              onChange={(val) => onUpdate(block.id, { backgroundColor: val })}
            />

            <div>
              <label className="cms-label">Tinggi: {block.height || 200}px</label>
              <input 
                type="range" 
                min="20" 
                max="800" 
                step="5" 
                value={block.height || 200} 
                onChange={(e) => onUpdate(block.id, { height: parseInt(e.target.value) })}
                className="cms-slider"
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#aaa', fontWeight: 700 }}>
                <span>PENDEK</span>
                <span>TINGGI</span>
              </div>
            </div>
          </div>
        )}


        {mediaTab === 'spacer' && (
          <div className="cms-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, animation: 'cmsFadeIn 0.3s ease' }}>
            <div>
              <label className="cms-label">Tinggi: {block.height || 50}px</label>
              <input 
                type="range" 
                min="10" 
                max="300" 
                step="5" 
                value={block.height || 50} 
                onChange={(e) => onUpdate(block.id, { height: parseInt(e.target.value) })}
                className="cms-slider"
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#aaa', fontWeight: 700 }}>
                <span>PENDEK</span>
                <span>TINGGI</span>
              </div>
            </div>
            <label className="cms-checkbox-label">
              <input type="checkbox" className="cms-checkbox" checked={!!block.showLine} onChange={e => onUpdate(block.id, { showLine: e.target.checked })} />
              Tampilkan Garis Pembatas
            </label>
            {block.showLine && (
              <GlassColorPicker 
                label="Warna Garis"
                value={block.lineColor || 'rgba(0,0,0,0.1)'}
                onChange={(val) => onUpdate(block.id, { lineColor: val })}
              />
            )}
          </div>
        )}

        {mediaTab === 'form' && (
          <div className="cms-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, animation: 'cmsFadeIn 0.3s ease' }}>
            <div className="cms-field-group">
              <label className="cms-label">Email</label>
              <input 
                type="email" 
                className="cms-input"
                placeholder="email@anda.com"
                value={block.formEmail || ''} 
                onChange={(e) => onUpdate(block.id, { formEmail: e.target.value })}
              />
            </div>
            <div className="cms-field-group">
              <label className="cms-label">Tombol</label>
              <input 
                type="text" 
                className="cms-input"
                placeholder="Kirim Pesan"
                value={block.submitText || 'Kirim Pesan'} 
                onChange={(e) => onUpdate(block.id, { submitText: e.target.value })}
              />
            </div>
            <GlassColorPicker 
              label="Warna Tombol Submit"
              value={block.submitColor || 'var(--cms-accent, #7c3aed)'}
              onChange={(val) => onUpdate(block.id, { submitColor: val })}
            />
          </div>
        )}

        {(mediaTab === 'file' || mediaTab === 'youtube') && (
          <>
            {mediaTab === 'file' && (
              <div className="cms-field-group">
                <label className="cms-label">Mode</label>
                <div className="cms-mode-toggle" style={{ margin: 0 }}>
                  <button 
                    className={`cms-mode-btn ${(block.mode || 'single') === 'single' ? 'active' : ''}`} 
                    onClick={() => onUpdate(block.id, { mode: 'single' })}
                  >
                    Tunggal
                  </button>
                  <button 
                    className={`cms-mode-btn ${block.mode === 'multiple' ? 'active' : ''}`} 
                    onClick={() => onUpdate(block.id, { mode: 'multiple', urls: block.urls || [block.url].filter(Boolean) })}
                  >
                    Banyak
                  </button>
                </div>

                {(block.mode || 'single') === 'single' && isVid && (
                  <>
                    <div className="cms-toggle-row" style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>Efek Parallax Scroll</div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={!!block.parallax}
                        className="cms-switch"
                        onClick={() => onUpdate(block.id, { parallax: !block.parallax })}
                      >
                        <div className="cms-switch-knob" />
                      </button>
                    </div>
                    
                    {block.parallax && (
                      <div style={{ marginTop: 12, padding: 12, background: 'var(--cms-switcher-bg)', borderRadius: 12 }}>
                        <div style={{ marginBottom: 12 }}>
                          <label className="cms-label" style={{ fontSize: 11, marginBottom: 8, color: 'var(--cms-text)' }}>Scroll</label>
                          <GlassSelect
                            value={block.parallaxMode || 'inline'}
                            onChange={(e) => onUpdate(block.id, { parallaxMode: e.target.value })}
                            options={[
                              { label: 'Mengalir (Ikut Terscroll)', value: 'inline' },
                              { label: 'Menempel (Sticky)', value: 'sticky' }
                            ]}
                            style={{ height: 36, fontSize: 12, width: '100%', borderRadius: 8 }}
                          />
                        </div>

                        {block.parallaxMode === 'sticky' && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>
                                  Durasi Scroll: {block.parallaxScrollLength || 200}vh
                                </div>
                                <InfoTooltip content="Semakin besar nilainya, semakin panjang scroll yang dibutuhkan untuk memutar video sampai habis." />
                              </div>
                              <button 
                                onClick={() => onUpdate(block.id, { parallaxScrollLength: 200 })}
                                style={{ 
                                  background: 'transparent', border: '1px solid var(--glass-border)', 
                                  borderRadius: 100, padding: '2px 8px', fontSize: 10, 
                                  color: 'var(--cms-text-muted)', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--cms-text)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--cms-text-muted)'}
                              >
                                Reset
                              </button>
                            </div>
                            <input 
                              type="range" 
                              min="100" max="600" step="50"
                              value={block.parallaxScrollLength || 200} 
                              onChange={(e) => onUpdate(block.id, { parallaxScrollLength: parseInt(e.target.value) })}
                              className="cms-slider"
                              style={{ width: '100%' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {block.mode === 'multiple' && (
                  <div className="cms-toggle-row">
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>Slide Otomatis</div>
                    <button 
                      type="button"
                      role="switch"
                      aria-checked={!!block.autoSlide}
                      className="cms-switch"
                      onClick={() => onUpdate(block.id, { autoSlide: !block.autoSlide })}
                    >
                      <div className="cms-switch-knob" />
                    </button>
                  </div>
                )}
              </div>
            )}

        {mediaTab === 'file' ? (
          <div className="cms-field-group">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <button
                  onClick={() => !isUploading && fileRef.current?.click()}
                  className={`cms-btn ${isUploading ? 'cms-btn-ghost' : 'cms-btn-primary'}`}
                  title={block.mode === 'multiple' ? 'Tambah' : (block.url ? 'Ganti' : 'Upload')}
                  style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <button
                  onClick={() => setIsGalleryOpen(true)}
                  className="cms-btn cms-btn-ghost"
                  title="Galeri"
                  style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'var(--cms-switcher-bg)' }}
                  disabled={isUploading}
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>

            {block.mode === 'multiple' && (block.urls || []).length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 8, 
                background: 'rgba(0,0,0,0.03)', 
                padding: 10, 
                borderRadius: 16,
                marginTop: 12,
                border: '1px solid rgba(0,0,0,0.05)'
              }}>
                {(block.urls || []).map((u, i) => (
                  <div key={i} style={{ 
                    position: 'relative', 
                    aspectRatio: '1/1', 
                    borderRadius: 10, 
                    overflow: 'hidden',
                    background: 'var(--cms-card-bg)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}>
                    {u.includes('/video/') || u.match(/\.(mp4|webm|mov)$/i)
                      ? <video src={u} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      : <img src={getOptimizedUrl(u, 400, block)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    }
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newUrls = (block.urls || []).filter((_, idx) => idx !== i);
                        onUpdate(block.id, { 
                          urls: newUrls,
                          url: newUrls[0] || '' 
                        });
                      }}
                      style={{ 
                        position: 'absolute', top: 4, right: 4, 
                        width: 18, height: 18, borderRadius: '50%', 
                        background: 'rgba(239,68,68,0.9)', border: 'none', 
                        color: '#fff', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {block.mode !== 'multiple' && block.url && (
              <div style={{ 
                width: '100%', height: 160, borderRadius: 20, overflow: 'hidden', 
                border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)',
                marginTop: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
              }}>
                {isVid 
                  ? <video src={block.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop playsInline />
                  : <img src={getOptimizedUrl(block.url, 800, block)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                }
              </div>
            )}

            {isVid && block.url && (
              <div className="cms-card" style={{ marginTop: 16, padding: 12, background: 'var(--cms-switcher-bg)', borderRadius: 16, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label className="cms-label" style={{ margin: 0, fontSize: 11 }}>Cover</label>
                    <InfoTooltip content="Pilih gambar cover statis yang akan ditampilkan saat mengekspor dokumen PDF atau sebagai poster awal selama video sedang memuat." />
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => coverFileRef.current?.click()}
                      className="cms-btn cms-btn-ghost"
                      title="Upload Gambar Cover"
                      style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, flexShrink: 0 }}
                    >
                      <Upload size={12} />
                    </button>
                    {block.url?.includes('cloudinary.com') && (
                      <button
                        onClick={() => {
                          const autoPoster = block.url.replace(/\.(mp4|webm|mov|avi|mkv|ogv|3gp)$/i, '.jpg')
                                                      .replace('/video/upload/', '/video/upload/w_800,q_auto,so_0/');
                          onUpdate(block.id, { coverUrl: autoPoster });
                        }}
                        className="cms-btn cms-btn-ghost"
                        title="Ambil Frame Awal Video"
                        style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    )}
                    {block.coverUrl && (
                      <button
                        onClick={() => onUpdate(block.id, { coverUrl: null })}
                        className="card-action-btn danger"
                        title="Hapus Cover"
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, flexShrink: 0, margin: 0 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {block.coverUrl && (
                  <div style={{ width: '100%', height: 100, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <img src={getOptimizedUrl(block.coverUrl, 400, block)} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                  </div>
                )}
                <input 
                  ref={coverFileRef} 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setIsUploading(true);
                    try {
                      const res = await uploadToCloudinary(file, 'image');
                      onUpdate(block.id, { coverUrl: res.url });
                    } catch (err) {
                      alert('Gagal upload cover: ' + err.message);
                    } finally {
                      setIsUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            )}

            <input ref={fileRef} type="file"
              multiple={block.mode === 'multiple'}
              accept="image/*,video/*,image/gif,image/webp"
              style={{ display: 'none' }} 
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                
                setIsUploading(true);
                try {
                  const uploadPromises = files.map(async (file) => {
                    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
                    const newName = generateFileName(activePage, blockIndex, file.name, mediaType);
                    const res = await uploadToCloudinary(file, mediaType);
                    return { url: res.url, name: newName, mediaType };
                  });

                  const results = await Promise.all(uploadPromises);

                  if (block.mode === 'multiple') {
                    const newUrls = [...(block.urls || []), ...results.map(r => r.url)];
                    onUpdate(block.id, { 
                      urls: newUrls, 
                      url: newUrls[0] || '', 
                      mediaType: results[0].mediaType 
                    });
                  } else {
                    const res = results[0];
                    onUpdate(block.id, { 
                      url: res.url, 
                      name: res.name,
                      mediaType: res.mediaType, 
                      embedId: null 
                    });
                  }
                } catch (err) {
                  alert('Gagal upload: ' + err.message);
                } finally {
                  setIsUploading(false);
                  e.target.value = '';
                }
              }} 
            />
            <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 8, textAlign: 'center', fontWeight: 600 }}>
              {(block.mode === 'multiple' ? `${(block.urls || []).length} Media diupload` : 'JPG · PNG · WebP · GIF · MP4')}
            </div>
          </div>
        ) : (
          /* ── YouTube Embed ── */
          <div className="cms-field-group">
            {isYt && block.embedId && (
              <div style={{ marginBottom: 12, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <img src={`https://img.youtube.com/vi/${block.embedId}/mqdefault.jpg`} alt="" style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '8px 12px', fontSize: 11, color: '#fff', fontWeight: 800, background: '#ef4444', textAlign: 'center' }}>
                  ▶ YOUTUBE: {block.embedId}
                </div>
              </div>
            )}
            <input
              className="cms-input"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={ytInput}
              onChange={e => setYtInput(e.target.value)}
            />
            <button
              onClick={handleYouTubeApply}
              className="cms-btn cms-btn-primary"
              title="Terapkan"
              style={{ marginTop: 10, width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ef4444', padding: 0 }}
            >
              <Play size={16} />
            </button>
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* ── Cloudinary Optimization ── */}
        {block.url && (
          <div style={{ padding: 20, background: 'var(--cms-switcher-bg)', borderRadius: 24, marginBottom: 24, border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>Cloudinary Optimization</span>
            </div>
            
            {!block.url.includes('cloudinary') && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '12px 16px', borderRadius: 12, fontSize: 12, marginBottom: 16, border: '1px solid rgba(239,68,68,0.2)' }}>
                <strong>Perhatian:</strong> Gambar ini tidak di-hosting di Cloudinary. Efek tidak akan bekerja.
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 8, color: 'var(--cms-text)' }}>
                  Aspek Rasio
                  <InfoTooltip content="Potong gambar secara otomatis tanpa merusak aslinya." />
                </label>
                <GlassSelect
                  value={block.c_aspect || ''}
                  onChange={(e) => onUpdate(block.id, { c_aspect: e.target.value })}
                  options={[
                    { label: 'Asli (Tanpa Crop)', value: '' },
                    { label: '1:1 (Square)', value: 'ar_1:1,c_fill' },
                    { label: '16:9 (Landscape)', value: 'ar_16:9,c_fill' },
                    { label: '4:3 (Layar Standar)', value: 'ar_4:3,c_fill' },
                    { label: '9:16 (Portrait / Story)', value: 'ar_9:16,c_fill' },
                    { label: '3:4 (Foto Portrait)', value: 'ar_3:4,c_fill' }
                  ]}
                  style={{ height: 42, fontSize: 13, width: '100%', borderRadius: 12 }}
                />
              </div>
              
              <div>
                <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 8, color: 'var(--cms-text)' }}>
                  Fokus Potongan
                  <InfoTooltip content="Tentukan area mana yang menjadi prioritas saat gambar terpotong." />
                </label>
                <GlassSelect
                  value={block.c_gravity || ''}
                  onChange={(e) => onUpdate(block.id, { c_gravity: e.target.value })}
                  options={[
                    { label: 'Auto (AI Deteksi Objek)', value: 'g_auto' },
                    { label: 'Fokus Wajah (Face)', value: 'g_face' },
                    { label: 'Tengah (Center)', value: 'g_center' },
                    { label: 'Atas (Top)', value: 'g_north' },
                    { label: 'Bawah (Bottom)', value: 'g_south' }
                  ]}
                  style={{ height: 42, fontSize: 13, width: '100%', borderRadius: 12 }}
                />
              </div>

              <div>
                <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 8, color: 'var(--cms-text)' }}>
                  Efek Visual
                  <InfoTooltip content="Beri filter atau efek visual pada gambar." />
                </label>
                <GlassSelect
                  value={block.c_effect || ''}
                  onChange={(e) => onUpdate(block.id, { c_effect: e.target.value })}
                  options={[
                    { label: 'Normal (Tidak ada)', value: '' },
                    { label: 'Hitam Putih (Grayscale)', value: 'e_grayscale' },
                    { label: 'Sepia (Klasik)', value: 'e_sepia' },
                    { label: 'Blur Ringan', value: 'e_blur:200' },
                    { label: 'Blur Kuat (Untuk Background)', value: 'e_blur:600' },
                    { label: 'Pixelate', value: 'e_pixelate' },
                    { label: 'Vignette', value: 'e_vignette' },
                    { label: 'Kartun (Cartoonify)', value: 'e_cartoonify' }
                  ]}
                  style={{ height: 42, fontSize: 13, width: '100%', borderRadius: 12 }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* ── Music Section ── */}
        {(mediaTab === 'file' || mediaTab === 'youtube') && (
          <div className="cms-field-group">
            <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Music size={12} color="var(--cms-accent, #7c3aed)" />
              Musik Konten
              <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8', fontSize: 10 }}>(Opsional)</span>
            </label>

            {block.musicUrl ? (
              <div style={{ background: 'var(--cms-switcher-bg)', borderRadius: 16, padding: 14, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Audio Info Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Music size={16} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {block.musicName || 'Audio Terlampir'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 2 }}>Cloudinary ✓</div>
                  </div>
                  <button
                    onClick={() => onUpdate(block.id, { musicUrl: null, musicName: null })}
                    className="card-action-btn danger"
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0, margin: 0 }}
                    title="Hapus Musik"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Toggle: Background Mode */}
                <div className="cms-toggle-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>Mode Background</div>
                    <InfoTooltip content="Musik akan terus berputar saat Anda melakukan scroll ke blok lain (overlap)." />
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!block.musicBackground}
                    className="cms-switch"
                    onClick={() => onUpdate(block.id, { musicBackground: !block.musicBackground })}
                  >
                    <div className="cms-switch-knob" />
                  </button>
                </div>

                {/* Toggle: Loop */}
                <div className="cms-toggle-row">
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>Loop (Ulangi)</div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={block.musicLoop !== false}
                    className="cms-switch"
                    onClick={() => onUpdate(block.id, { musicLoop: !block.musicLoop })}
                  >
                    <div className="cms-switch-knob" />
                  </button>
                </div>

                {/* Volume Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="cms-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Volume2 size={12} /> Volume
                    </label>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>{Math.round((block.musicVolume ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={block.musicVolume ?? 1}
                    onChange={e => onUpdate(block.id, { musicVolume: parseFloat(e.target.value) })}
                    className="cms-slider" style={{ width: '100%' }}
                  />
                </div>

                {/* Replace button */}
                <button
                  onClick={() => !isAudioUploading && audioFileRef.current?.click()}
                  className="cms-btn cms-btn-ghost"
                  title="Ganti Audio"
                  style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  disabled={isAudioUploading}
                >
                  {isAudioUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                </button>
              </div>
            ) : (
              <button
                onClick={() => !isAudioUploading && audioFileRef.current?.click()}
                className={`cms-btn ${isAudioUploading ? 'cms-btn-ghost' : 'cms-btn-ghost'}`}
                title="Upload Audio"
                style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed var(--glass-border)', background: 'transparent', padding: 0 }}
                disabled={isAudioUploading}
              >
                {isAudioUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Music size={16} />
                )}
              </button>
            )}

            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setIsAudioUploading(true);
                try {
                  const res = await uploadAudioToCloudinary(file);
                  onUpdate(block.id, { musicUrl: res.url, musicName: file.name });
                } catch (err) {
                  alert('Gagal upload audio: ' + err.message);
                } finally {
                  setIsAudioUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* ── Alt text ── */}
        <div className="cms-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="cms-label" style={{ margin: 0 }}>Alt</label>
            <AiMagicButton 
              label="AI"
              prompt={`Berikan deskripsi ALT TEXT SEO yang bagus untuk media di halaman ${activePage}. Jika ini gambar, buat deskriptif. Jika video, buat ringkas.`}
              onSuggest={(text) => onUpdate(block.id, { altText: text })}
            />
          </div>
          <input
            className="cms-input"
            type="text"
            placeholder="Tulis deskripsi untuk SEO..."
            value={block.altText || ''}
            onChange={e => onUpdate(block.id, { altText: e.target.value })}
          />
        </div>

          </>
        )}

        {/* ── Link URL / Action ── */}
        <ActionPopupControl
          actionType={block.actionType || 'link'}
          linkUrl={block.linkUrl || ''}
          popupId={block.popupId || ''}
          bioLinkPages={bioLinkPages}
          label="Aksi"
          onChange={(updates) => {
            onUpdate(block.id, updates);
          }}
        />

        {/* ── Animasi Spill Blok ── */}
        <div className="cms-field-group" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="cms-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} color="var(--cms-accent, #7c3aed)" />
              Jeda Animasi Blok
            </label>
            <span style={{ fontSize: 10, color: 'var(--cms-accent)', fontWeight: 700 }}>
              {block.animationDelay !== undefined && block.animationDelay !== null && block.animationDelay !== ''
                ? `${block.animationDelay} ms (Khusus)`
                : 'Otomatis'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { label: 'Otomatis', val: '' },
              { label: '0ms', val: '0' },
              { label: '100ms', val: '100' },
              { label: '200ms', val: '200' },
              { label: '300ms', val: '300' },
              { label: '500ms', val: '500' },
            ].map(opt => {
              const currentVal = block.animationDelay !== undefined && block.animationDelay !== null ? String(block.animationDelay) : '';
              const isSelected = currentVal === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onUpdate(block.id, { animationDelay: opt.val === '' ? null : Number(opt.val) })}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 7,
                    border: isSelected ? '1px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                    background: isSelected ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                    color: isSelected ? '#fff' : 'var(--cms-text-muted)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flex: '1 1 auto',
                    textAlign: 'center'
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 6, lineHeight: 1.35 }}>
            Atur jeda khusus untuk blok ini, atau pilih Otomatis agar mengikuti setelan jeda halaman.
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0 24px' }} />

        {/* ── Markers Section ── */}
        <div className="cms-field-group">
          <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bookmark size={12} color="var(--cms-accent, #7c3aed)" /> Penanda (Anchor Link)
          </label>

          {/* Existing markers */}
          {(block.markers || []).map(mk => (
            <div key={mk.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              {mk.svgData
                ? <div style={{ width: 24, height: 24, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: mk.svgData }} />
                : <Bookmark size={16} color="var(--cms-text-muted)" />
              }
              <span style={{ flex: 1, fontSize: 13, color: 'var(--cms-text)', fontWeight: 600 }}>{mk.name}</span>
              <button onClick={() => removeMarker(mk.id)} className="card-action-btn danger" style={{ width: 28, height: 28 }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Add Marker Form */}
          {addingMarker ? (
            <div style={{ background: 'var(--cms-switcher-bg)', border: '1.5px dashed var(--glass-border)', borderRadius: 20, padding: 16, marginTop: 4 }}>
                <input
                  className="cms-input"
                  style={{ marginBottom: 12, background: 'var(--cms-input-bg)' }}
                  placeholder="Nama penanda..."
                  value={markerDraft.name}
                  onChange={e => setMarkerDraft(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => document.getElementById('marker-svg-upload-field')?.click()}
                    className="cms-btn cms-btn-ghost"
                    title={markerDraft.svgData ? 'Ganti Logo SVG' : 'Upload Logo SVG'}
                    style={{ flex: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    <Upload size={14} />
                  </button>
                <input id="marker-svg-upload-field" type="file" accept=".svg" style={{ display: 'none' }} onChange={handleMarkerSvg} />
                <button onClick={addMarker} className="cms-btn cms-btn-primary" title="Simpan" style={{ flex: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Plus size={15} />
                </button>
                <button onClick={() => { setAddingMarker(false); setMarkerDraft({ name: '', svgData: '' }); }} className="card-action-btn" title="Batal" style={{ width: 36, height: 36, borderRadius: '50%' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingMarker(true)}
              className="cms-btn cms-btn-ghost"
              title="Tambah Marker"
              style={{ marginTop: 4, width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed var(--glass-border)', background: 'transparent', padding: 0 }}
            >
              <Plus size={15} />
            </button>
          )}
        </div>
      </div>

      <MediaGalleryModal 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
        onSelect={(url, resourceType) => {
          if (block.mode === 'multiple') {
            const currentUrls = block.urls || [];
            onUpdate(block.id, { 
              urls: [...currentUrls, url],
              mediaType: resourceType,
              embedId: null 
            });
          } else {
            onUpdate(block.id, { 
              url: url, 
              mediaType: resourceType,
              embedId: null 
            });
          }
        }} 
      />
    </div>
  );
};

export default React.memo(BlockEditPanel);
