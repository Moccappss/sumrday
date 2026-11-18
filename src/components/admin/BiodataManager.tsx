import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, Mail, MapPin, Briefcase, Camera, Image as ImageIcon, 
  Save, Sparkles, Fingerprint, Info, CheckCircle2, Phone, 
  Link as LinkIcon, Building, CalendarDays, Code, Plus, Trash2, 
  GraduationCap, Award, Users, Medal, ChevronUp, ChevronDown, Check, Loader2, Globe, Upload
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import MediaGalleryModal from './MediaGalleryModal';
import { syncUnifiedStudioData } from '../../utils/unifiedDataSync';

const DEFAULT_BIODATA = {
  fullName: 'sumr.day',
  nickName: 'sumr',
  email: 'hi.sumrday@gmail.com',
  location: 'Indonesia / Remote Worldwide',
  role: 'Creative Digital Studio • Warm Tech & Skena-Aesthetic',
  company: 'sumr.day',
  phone: '+62 812 3456 7890',
  website: 'https://sumrday.web.app',
  experienceYears: '5',
  bio: 'Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic. A little sunshine for your screen.',
  fullBio: 'Kami adalah sumr.day — Creative Digital Studio yang memadukan teknologi modern dengan estetika visual segar khas anak muda. A little sunshine for your screen.',
  avatarUrl: '',
  coverUrl: '',
  socialLinks: {
    github: 'https://github.com/sumrday',
    linkedin: 'https://linkedin.com/company/sumrday',
    instagram: 'https://instagram.com/sumrday.studio'
  },
  skills: ['React.js', 'TypeScript', 'TailwindCSS', 'Firebase', 'UI/UX Design', 'Next.js'],
  languages: ['Indonesia (Native)', 'English (Professional)'],
  education: [
    { institution: 'Universitas Indonesia', degree: 'S1 Ilmu Komputer', startYear: '2016', endYear: '2020', description: 'Fokus pada Software Engineering dan Rekayasa Perangkat Lunak.' }
  ],
  experiences: [
    { company: 'sumr.day', role: 'Creative Director & Lead Interaction Designer', startYear: '2024', endYear: 'Sekarang', description: 'Memimpin visi kreatif Warm Tech dan interaksi digital studio.' }
  ],
  organizations: [
    { name: 'Komunitas Pengembang Kreatif', role: 'Ketua / Mentor', startYear: '2021', endYear: 'Sekarang', description: 'Mengadakan workshop UI/UX dan pemrograman.' }
  ],
  certifications: [
    { name: 'Google Certified Cloud Engineer', issuer: 'Google', year: '2023', credentialUrl: '' }
  ]
};

const BiodataManager = ({ notify }) => {
  const [data, setData] = useState(DEFAULT_BIODATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploading, setIsUploading] = useState({ avatar: false, cover: false });
  const [showGallery, setShowGallery] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'avatar' | 'cover'>('avatar');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dataRef = useRef(data);
  dataRef.current = data;

  // 1. Initial Load & Listen for Real-Time Changes from Firebase
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // First check dedicated 'porto_biodata' key
        let bio = await storage.getItem('porto_biodata', null);
        if (!bio) {
          // Fallback check in 'porto_settings.biodata'
          const s = await storage.getItem('porto_settings', {});
          if (s && s.biodata) {
            bio = s.biodata;
          }
        }

        if (isMounted && bio && typeof bio === 'object') {
          setData(prev => ({
            ...prev,
            ...bio,
            socialLinks: { ...(prev.socialLinks || {}), ...(bio.socialLinks || {}) },
            skills: Array.isArray(bio.skills) ? bio.skills : prev.skills,
            languages: Array.isArray(bio.languages) ? bio.languages : prev.languages,
            education: Array.isArray(bio.education) ? bio.education : prev.education,
            experiences: Array.isArray(bio.experiences) ? bio.experiences : prev.experiences,
            organizations: Array.isArray(bio.organizations) ? bio.organizations : prev.organizations,
            certifications: Array.isArray(bio.certifications) ? bio.certifications : prev.certifications,
          }));
        }
        if (isMounted) setIsLoaded(true);
      } catch (err) {
        console.error('[BiodataManager] Failed to load biodata:', err);
        if (isMounted) setIsLoaded(true);
      }
    };

    loadData();

    // Attach real-time listener
    const unsub = storage.listenItem('porto_biodata', (newBio) => {
      if (isMounted && newBio && typeof newBio === 'object' && !hasChanges) {
        setData(prev => ({ ...prev, ...newBio }));
      }
    });

    const handleExternalSave = () => {
      handleSave();
    };
    window.addEventListener('cms_biodata_save', handleExternalSave);
    window.addEventListener('cms_settings_save', handleExternalSave);

    return () => {
      isMounted = false;
      if (typeof unsub === 'function') unsub();
      window.removeEventListener('cms_biodata_save', handleExternalSave);
      window.removeEventListener('cms_settings_save', handleExternalSave);
      // Flush any pending debounced writes on exit
      storage.flushDebounced('porto_biodata');
    };
  }, []);

  // Update field and trigger 5s debounced autosave
  const updateField = useCallback((field, value) => {
    setData(prev => {
      const updated = { ...prev, [field]: value };
      setHasChanges(true);
      // Auto-save with 5-second debounce (User preference to avoid token waste)
      storage.debouncedSetItem('porto_biodata', updated, 5000);
      return updated;
    });
  }, []);

  const updateSocial = useCallback((platform, value) => {
    setData(prev => {
      const updated = {
        ...prev,
        socialLinks: { ...(prev.socialLinks || {}), [platform]: value }
      };
      setHasChanges(true);
      storage.debouncedSetItem('porto_biodata', updated, 5000);
      return updated;
    });
  }, []);

  // 2. Manual Immediate Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await storage.flushDebounced('porto_biodata');
      await storage.setItem('porto_biodata', dataRef.current, true);
      
      // Also update porto_settings.biodata to keep full compatibility
      const s = await storage.getItem('porto_settings', {});
      if (s && typeof s === 'object') {
        await storage.setItem('porto_settings', { ...s, biodata: dataRef.current }, true);
      }

      // Sync across all databases and modules
      const syncRes = await syncUnifiedStudioData({
        brandName: dataRef.current.fullName || dataRef.current.company,
        whatsapp: dataRef.current.phone,
        email: dataRef.current.email,
        address: dataRef.current.location,
        websiteUrl: dataRef.current.website,
        tagline: dataRef.current.bio,
        description: dataRef.current.fullBio,
        socials: dataRef.current.socialLinks
      }, 'Identitas & Biodata');

      setHasChanges(false);
      window.dispatchEvent(new Event('porto_saved'));
      window.dispatchEvent(new CustomEvent('porto_biodata_updated', { detail: dataRef.current }));
      if (notify) {
        if (syncRes && syncRes.notificationText) {
          notify(syncRes.notificationText, 'success');
        } else {
          notify('✅ Data Identitas berhasil disimpan & tersinkron ke semua modul', 'success');
        }
      }
    } catch (err) {
      console.error('[BiodataManager] Save error:', err);
      if (notify) notify('❌ Gagal menyimpan biodata: ' + (err.message || ''), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArrayChange = (field, index, key, value) => {
    const newArr = [...(data[field] || [])];
    if (key) {
      newArr[index] = { ...newArr[index], [key]: value };
    } else {
      newArr[index] = value;
    }
    setData(prev => {
      const updated = { ...prev, [field]: newArr };
      setHasChanges(true);
      storage.debouncedSetItem('porto_biodata', updated, 5000);
      return updated;
    });
  };

  const handleAddArrayItem = (field, initialItem) => {
    setData(prev => {
      const updated = { ...prev, [field]: [...(prev[field] || []), initialItem] };
      setHasChanges(true);
      storage.debouncedSetItem('porto_biodata', updated, 5000);
      return updated;
    });
  };

  const handleMoveArrayItem = (field, index, direction) => {
    const newArr = [...(data[field] || [])];
    if (direction === -1 && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    } else if (direction === 1 && index < newArr.length - 1) {
      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    }
    setData(prev => {
      const updated = { ...prev, [field]: newArr };
      setHasChanges(true);
      storage.debouncedSetItem('porto_biodata', updated, 5000);
      return updated;
    });
  };

  const handleRemoveArrayItem = (field, index) => {
    setData(prev => {
      const updated = { ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) };
      setHasChanges(true);
      storage.debouncedSetItem('porto_biodata', updated, 5000);
      return updated;
    });
  };

  const handleUpload = async (type, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await uploadToCloudinary(file, 'image');
      if (res && res.url) {
        updateField(type === 'avatar' ? 'avatarUrl' : 'coverUrl', res.url);
        if (notify) notify(`📸 ${type === 'avatar' ? 'Foto profil' : 'Sampul'} berhasil diunggah`);
      }
    } catch (err) {
      if (notify) notify('❌ Gagal mengunggah gambar', 'error');
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: isMobile ? '16px 16px 90px' : '24px 24px 80px',
      boxSizing: 'border-box',
      animation: 'cmsSlideIn 0.3s ease'
    }}>
      <div className="biodata-main-container" style={{
        maxWidth: 1160,
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}>

        {/* ── 1. MEDIA & PROFIL UTAMA ── */}
        <div className="cms-card premium-glass" style={{ padding: '28px', borderRadius: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={14} /> Foto Profil & Banner Sampul
          </div>

          <div className="biodata-media-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center', marginBottom: 28 }}>
            {/* Avatar Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div 
                onClick={() => document.getElementById('avatar-upload')?.click()}
                style={{ 
                  width: 104, height: 104, borderRadius: '50%', 
                  border: '3px solid var(--cms-accent)', padding: 4, position: 'relative',
                  cursor: 'pointer', transition: 'all 0.3s ease', background: 'var(--cms-card-bg)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }}
                title="Klik untuk ganti Foto Profil"
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {data.avatarUrl ? (
                    <img src={data.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Camera size={32} color="var(--cms-text-muted)" opacity={0.4} />
                  )}
                </div>
                <div style={{ position: 'absolute', bottom: 2, right: 2, background: 'var(--cms-accent)', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', border: '2px solid var(--cms-card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  <Camera size={14} />
                </div>
                {isUploading.avatar && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setGalleryTarget('avatar'); setShowGallery(true); }}
                style={{
                  padding: '4px 10px', borderRadius: 100, border: '1px solid var(--cms-accent-border)',
                  background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <ImageIcon size={11} /> Galeri
              </button>
            </div>

            {/* Cover Banner Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div 
                onClick={() => document.getElementById('cover-upload')?.click()}
                style={{ 
                  height: 104, borderRadius: 20, overflow: 'hidden',
                  background: 'var(--cms-switcher-bg)', cursor: 'pointer', position: 'relative',
                  border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Klik untuk ganti Banner Sampul"
              >
                {data.coverUrl ? (
                  <img src={data.coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cms-text-muted)', fontSize: 13, fontWeight: 600 }}>
                    <Camera size={18} /> Klik untuk Upload Banner
                  </div>
                )}
                {isUploading.cover && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  style={{
                    padding: '5px 10px', borderRadius: 8, border: '1px solid var(--glass-border)',
                    background: 'var(--cms-card-bg)', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                  }}
                  title="Upload Sampul Baru"
                >
                  <Upload size={12} /> <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setGalleryTarget('cover'); setShowGallery(true); }}
                  style={{
                    padding: '5px 10px', borderRadius: 8, border: '1px solid var(--cms-accent-border)',
                    background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', fontSize: 11.5, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                  }}
                  title="Pilih dari Galeri"
                >
                  <ImageIcon size={12} /> <span>Galeri</span>
                </button>
              </div>
            </div>
            <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload('avatar', e)} />
            <input id="cover-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload('cover', e)} />
          </div>

          {/* Form Fields Grid */}
          <div className="biodata-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            <div className="cms-field-group">
              <label className="cms-label">NAMA LENGKAP</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: 15, opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
                <input className="cms-input cms-input-icon-pad" style={{ paddingLeft: 44, height: 46, fontSize: 13, borderRadius: 14 }} value={data.fullName || ''} onChange={e => updateField('fullName', e.target.value)} placeholder="Contoh: sumr.day" />
              </div>
            </div>

            <div className="cms-field-group">
              <label className="cms-label">PANGGILAN / NICKNAME</label>
              <input className="cms-input" style={{ height: 46, fontSize: 13, borderRadius: 14 }} value={data.nickName || ''} onChange={e => updateField('nickName', e.target.value)} placeholder="Contoh: sumr" />
            </div>

            <div className="cms-field-group">
              <label className="cms-label">EMAIL KONTAK</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 15, opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
                <input className="cms-input cms-input-icon-pad" style={{ paddingLeft: 44, height: 46, fontSize: 13, borderRadius: 14 }} value={data.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="email@domain.com" />
              </div>
            </div>

            <div className="cms-field-group">
              <label className="cms-label">LOKASI / DOMISILI</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: 14, top: 15, opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
                <input className="cms-input cms-input-icon-pad" style={{ paddingLeft: 44, height: 46, fontSize: 13, borderRadius: 14 }} value={data.location || ''} onChange={e => updateField('location', e.target.value)} placeholder="Jakarta, Indonesia" />
              </div>
            </div>

            <div className="cms-field-group">
              <label className="cms-label">ROLE / PROFESI UTAMA</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: 14, top: 15, opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
                <input className="cms-input cms-input-icon-pad" style={{ paddingLeft: 44, height: 46, fontSize: 13, borderRadius: 14 }} value={data.role || ''} onChange={e => updateField('role', e.target.value)} placeholder="Creative Director & Developer" />
              </div>
            </div>

            <div className="cms-field-group">
              <label className="cms-label">PERUSAHAAN / STUDIO</label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: 14, top: 15, opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
                <input className="cms-input cms-input-icon-pad" style={{ paddingLeft: 44, height: 46, fontSize: 13, borderRadius: 14 }} value={data.company || ''} onChange={e => updateField('company', e.target.value)} placeholder="Nama Perusahaan" />
              </div>
            </div>

            <div className="cms-field-group">
              <label className="cms-label">NOMOR TELEPON / WA</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: 15, opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
                <input className="cms-input cms-input-icon-pad" style={{ paddingLeft: 44, height: 46, fontSize: 13, borderRadius: 14 }} value={data.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+62 812 3456 7890" />
              </div>
            </div>

            <div className="cms-field-group">
              <label className="cms-label">WEBSITE UTAMA</label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: 14, top: 15, opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
                <input className="cms-input cms-input-icon-pad" style={{ paddingLeft: 44, height: 46, fontSize: 13, borderRadius: 14 }} value={data.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="https://domainanda.com" />
              </div>
            </div>

            <div className="cms-field-group">
              <label className="cms-label">PENGALAMAN (TAHUN)</label>
              <div style={{ position: 'relative' }}>
                <CalendarDays size={16} style={{ position: 'absolute', left: 14, top: 15, opacity: 0.5, pointerEvents: 'none', color: 'var(--cms-text)' }} />
                <input type="number" className="cms-input cms-input-icon-pad" style={{ paddingLeft: 44, height: 46, fontSize: 13, borderRadius: 14 }} value={data.experienceYears || ''} onChange={e => updateField('experienceYears', e.target.value)} placeholder="5" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
            <div className="cms-field-group">
              <label className="cms-label">BIO SINGKAT (Tagline)</label>
              <textarea 
                className="cms-input" 
                style={{ minHeight: 90, padding: '14px', lineHeight: 1.6, fontSize: 13, borderRadius: 16 }} 
                value={data.bio || ''} 
                onChange={e => updateField('bio', e.target.value)} 
                placeholder="Ringkasan singkat tentang keahlian Anda..."
              />
            </div>

            <div className="cms-field-group">
              <label className="cms-label">BIO LENGKAP (Cerita & Profil Mendalam)</label>
              <textarea 
                className="cms-input" 
                style={{ minHeight: 160, padding: '14px', lineHeight: 1.6, fontSize: 13, borderRadius: 16 }} 
                value={data.fullBio || ''} 
                onChange={e => updateField('fullBio', e.target.value)} 
                placeholder="Ceritakan pengalaman, filosofi kerja, dan visi Anda..."
              />
            </div>
          </div>
        </div>

        {/* ── 2. TAUTAN SOSIAL MEDIA ── */}
        <div className="cms-card premium-glass" style={{ padding: '28px', borderRadius: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LinkIcon size={14} /> Tautan Sosial Media
          </div>

          <div className="biodata-fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            <div className="cms-field-group">
              <label className="cms-label">LINKEDIN URL</label>
              <input className="cms-input" style={{ height: 46, fontSize: 13, borderRadius: 14 }} value={data.socialLinks?.linkedin || ''} onChange={e => updateSocial('linkedin', e.target.value)} placeholder="https://linkedin.com/in/username" />
            </div>

            <div className="cms-field-group">
              <label className="cms-label">GITHUB URL</label>
              <input className="cms-input" style={{ height: 46, fontSize: 13, borderRadius: 14 }} value={data.socialLinks?.github || ''} onChange={e => updateSocial('github', e.target.value)} placeholder="https://github.com/username" />
            </div>

            <div className="cms-field-group">
              <label className="cms-label">INSTAGRAM URL</label>
              <input className="cms-input" style={{ height: 46, fontSize: 13, borderRadius: 14 }} value={data.socialLinks?.instagram || ''} onChange={e => updateSocial('instagram', e.target.value)} placeholder="https://instagram.com/username" />
            </div>
          </div>
        </div>

        {/* ── 3. SKILLS & LANGUAGES ── */}
        <div className="cms-card premium-glass" style={{ padding: '28px', borderRadius: 28 }}>
          {/* Skills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code size={14} /> Keahlian & Teknologi (Skills)
            </div>
            <button 
              onClick={() => handleAddArrayItem('skills', '')} 
              title="Tambah Keahlian"
              aria-label="Tambah Keahlian"
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--cms-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)' }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {(data.skills || []).map((skill, index) => (
              <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input className="cms-input" style={{ flex: 1, height: 44, fontSize: 13, borderRadius: 14 }} value={skill} onChange={e => handleArrayChange('skills', index, null, e.target.value)} placeholder="Contoh: React.js, UI/UX, Cloud Architecture" />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleMoveArrayItem('skills', index, -1)} disabled={index === 0} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', cursor: index === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.3 : 1 }}><ChevronUp size={16} /></button>
                  <button onClick={() => handleMoveArrayItem('skills', index, 1)} disabled={index === (data.skills?.length || 0) - 1} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', cursor: index === (data.skills?.length || 0) - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === (data.skills?.length || 0) - 1 ? 0.3 : 1 }}><ChevronDown size={16} /></button>
                  <button onClick={() => handleRemoveArrayItem('skills', index)} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Languages */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={14} /> Bahasa (Languages)
            </div>
            <button 
              onClick={() => handleAddArrayItem('languages', '')} 
              title="Tambah Bahasa"
              aria-label="Tambah Bahasa"
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--cms-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)' }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(data.languages || []).map((lang, index) => (
              <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input className="cms-input" style={{ flex: 1, height: 44, fontSize: 13, borderRadius: 14 }} value={lang} onChange={e => handleArrayChange('languages', index, null, e.target.value)} placeholder="Contoh: Indonesia (Native), English (Fluent)" />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleMoveArrayItem('languages', index, -1)} disabled={index === 0} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', cursor: index === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.3 : 1 }}><ChevronUp size={16} /></button>
                  <button onClick={() => handleMoveArrayItem('languages', index, 1)} disabled={index === (data.languages?.length || 0) - 1} style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', cursor: index === (data.languages?.length || 0) - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === (data.languages?.length || 0) - 1 ? 0.3 : 1 }}><ChevronDown size={16} /></button>
                  <button onClick={() => handleRemoveArrayItem('languages', index)} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. PENGALAMAN KERJA ── */}
        <div className="cms-card premium-glass" style={{ padding: '28px', borderRadius: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={14} /> Riwayat Pengalaman Kerja
            </div>
            <button 
              onClick={() => handleAddArrayItem('experiences', { company: '', role: '', startYear: '', endYear: '', description: '' })} 
              title="Tambah Pengalaman"
              aria-label="Tambah Pengalaman"
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--cms-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)' }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(data.experiences || []).map((exp, index) => (
              <div key={index} style={{ padding: 20, borderRadius: 20, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Briefcase size={15} color="var(--cms-accent)" /> Pengalaman {index + 1}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleMoveArrayItem('experiences', index, -1)} disabled={index === 0} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', cursor: index === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronUp size={16} /></button>
                    <button onClick={() => handleMoveArrayItem('experiences', index, 1)} disabled={index === (data.experiences?.length || 0) - 1} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', cursor: index === (data.experiences?.length || 0) - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={16} /></button>
                    <button onClick={() => handleRemoveArrayItem('experiences', index)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="biodata-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="cms-label" style={{ fontSize: 10 }}>PERUSAHAAN</label>
                    <input className="cms-input" style={{ height: 42, fontSize: 13, borderRadius: 12 }} value={exp.company || ''} onChange={e => handleArrayChange('experiences', index, 'company', e.target.value)} placeholder="Nama Perusahaan" />
                  </div>
                  <div>
                    <label className="cms-label" style={{ fontSize: 10 }}>POSISI / ROLE</label>
                    <input className="cms-input" style={{ height: 42, fontSize: 13, borderRadius: 12 }} value={exp.role || ''} onChange={e => handleArrayChange('experiences', index, 'role', e.target.value)} placeholder="Posisi" />
                  </div>
                </div>

                <div className="biodata-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="cms-label" style={{ fontSize: 10 }}>TAHUN MULAI</label>
                    <input className="cms-input" style={{ height: 42, fontSize: 13, borderRadius: 12 }} value={exp.startYear || ''} onChange={e => handleArrayChange('experiences', index, 'startYear', e.target.value)} placeholder="2021" />
                  </div>
                  <div>
                    <label className="cms-label" style={{ fontSize: 10 }}>TAHUN SELESAI</label>
                    <input className="cms-input" style={{ height: 42, fontSize: 13, borderRadius: 12 }} value={exp.endYear || ''} onChange={e => handleArrayChange('experiences', index, 'endYear', e.target.value)} placeholder="Sekarang" />
                  </div>
                </div>

                <div>
                  <label className="cms-label" style={{ fontSize: 10 }}>DESKRIPSI TUGAS</label>
                  <textarea className="cms-input" style={{ minHeight: 70, padding: 10, fontSize: 13, borderRadius: 12 }} value={exp.description || ''} onChange={e => handleArrayChange('experiences', index, 'description', e.target.value)} placeholder="Pencapaian dan tanggung jawab..." />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. PENDIDIKAN & SERTIFIKASI ── */}
        <div className="cms-card premium-glass" style={{ padding: '28px', borderRadius: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={14} /> Riwayat Pendidikan
            </div>
            <button 
              onClick={() => handleAddArrayItem('education', { institution: '', degree: '', startYear: '', endYear: '', description: '' })} 
              title="Tambah Pendidikan"
              aria-label="Tambah Pendidikan"
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--cms-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)' }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(data.education || []).map((edu, index) => (
              <div key={index} style={{ padding: 20, borderRadius: 20, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GraduationCap size={15} color="#3b82f6" /> Pendidikan {index + 1}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleMoveArrayItem('education', index, -1)} disabled={index === 0} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', cursor: index === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.3 : 1 }}><ChevronUp size={16} /></button>
                    <button onClick={() => handleMoveArrayItem('education', index, 1)} disabled={index === (data.education?.length || 0) - 1} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', cursor: index === (data.education?.length || 0) - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === (data.education?.length || 0) - 1 ? 0.3 : 1 }}><ChevronDown size={16} /></button>
                    <button onClick={() => handleRemoveArrayItem('education', index)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="biodata-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="cms-label" style={{ fontSize: 10 }}>INSTITUSI / KAMPUS</label>
                    <input className="cms-input" style={{ height: 42, fontSize: 13, borderRadius: 12 }} value={edu.institution || ''} onChange={e => handleArrayChange('education', index, 'institution', e.target.value)} placeholder="Universitas / Sekolah" />
                  </div>
                  <div>
                    <label className="cms-label" style={{ fontSize: 10 }}>GELAR / JURUSAN</label>
                    <input className="cms-input" style={{ height: 42, fontSize: 13, borderRadius: 12 }} value={edu.degree || ''} onChange={e => handleArrayChange('education', index, 'degree', e.target.value)} placeholder="S1 Teknik Informatika" />
                  </div>
                </div>

                <div className="biodata-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="cms-label" style={{ fontSize: 10 }}>TAHUN MULAI</label>
                    <input className="cms-input" style={{ height: 42, fontSize: 13, borderRadius: 12 }} value={edu.startYear || ''} onChange={e => handleArrayChange('education', index, 'startYear', e.target.value)} placeholder="2016" />
                  </div>
                  <div>
                    <label className="cms-label" style={{ fontSize: 10 }}>TAHUN LULUS</label>
                    <input className="cms-input" style={{ height: 42, fontSize: 13, borderRadius: 12 }} value={edu.endYear || ''} onChange={e => handleArrayChange('education', index, 'endYear', e.target.value)} placeholder="2020" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── STICKY FLOATING MOBILE SAVE BUTTON ── */}
      <div className="biodata-mobile-save-bar" style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 999,
        display: 'none',
        animation: 'cmsSlideUp 0.3s ease'
      }}>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="cms-btn cms-btn-primary" 
          style={{ 
            width: '100%', 
            height: 50, 
            borderRadius: 16, 
            fontSize: 14, 
            fontWeight: 900, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 10, 
            boxShadow: '0 8px 30px rgba(var(--cms-accent-rgb), 0.5)' 
          }}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isSaving ? 'Menyimpan ke Cloud...' : 'Simpan Semua Data Identitas'}</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .biodata-media-grid {
            grid-template-columns: 1fr !important;
            justify-items: center;
          }
          .biodata-fields-grid {
            grid-template-columns: 1fr !important;
          }
          .biodata-mobile-save-bar {
            display: block !important;
          }
        }
      `}</style>

      <MediaGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={(url) => {
          updateField(galleryTarget === 'avatar' ? 'avatarUrl' : 'coverUrl', url);
          if (notify) notify(`📸 ${galleryTarget === 'avatar' ? 'Foto profil' : 'Sampul'} dipilih dari galeri!`);
        }}
      />
    </div>
  );
};

export default BiodataManager;
