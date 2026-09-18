import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../../utils/storage';
import { Plus, Trash2, Upload, Link as LinkIcon, Image, Loader2, User, Camera, Type, ExternalLink, MoreVertical, Settings2, Copy, QrCode, Eye, Check, Download, X } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useDialog } from './DialogProvider';
import { useContextMenu } from './ContextMenuProvider';

let idCounter = Date.now();
const newId = () => `lnk-${++idCounter}`;
const newGroupId = () => `grp-${++idCounter}`;

const INITIAL_DATA = { profile: { name: '', bio: '', avatarUrl: '', profileCoverUrl: '', pageBgUrl: '', whatsappNumber: '' }, groups: [], links: [] };

// Saran ukuran background tombol: 1200×300px (rasio 4:1), format PNG/WebP, maks ~500KB
const BTN_BG_SIZE_HINT = '1200×300px (rasio 4:1) • PNG/WebP • maks 500KB';

const LinksManager = ({ notify }) => {
  const { showConfirm } = useDialog();
  const { bindContextMenu } = useContextMenu();
  const [data, setData] = useState(INITIAL_DATA);
  const [linkClicks, setLinkClicks] = useState<Record<string, number>>({});
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const avatarRef = useRef(null);
  const profileCoverRef = useRef(null);
  const coverRefs = useRef({});
  const iconRefs = useRef({});
  const btnBgRefs = useRef({});
  const pageBgRef = useRef(null);
  const [isUploading, setIsUploading] = useState({ avatar: false, profileCover: false, pageBg: false, cover: {}, btnBg: {} });
  const [expandedLinks, setExpandedLinks] = useState({});

  const toggleExpanded = (id) => setExpandedLinks(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    storage.getItem('porto_links', INITIAL_DATA).then(d => setData(d || INITIAL_DATA));
    storage.getItem('porto_link_clicks', {}).then(c => setLinkClicks(c || {}));
  }, []);

  useEffect(() => {

    const onAdd = () => addLink();
    window.addEventListener('porto_add_action', onAdd);
    return () => window.removeEventListener('porto_add_action', onAdd);

  }, [data]);

  const save = async (updated) => {
    setData(updated);
    await storage.setItem('porto_links', updated);
    window.dispatchEvent(new Event('porto_saved'));
    if (notify) notify('✅ Perubahan tersimpan');
  };

  const updateProfile = (field, value) => save({ ...data, profile: { ...data.profile, [field]: value } });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploading(p => ({ ...p, avatar: true }));
    try {
      const result = await uploadToCloudinary(file);
      updateProfile('avatarUrl', result.url);

    } catch (err) {
      if (notify) notify('❌ Gagal upload avatar', 'error');
    } finally {
      setIsUploading(p => ({ ...p, avatar: false }));
    }
  };

  const handleProfileCoverUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploading(p => ({ ...p, profileCover: true }));
    try {
      const result = await uploadToCloudinary(file);
      updateProfile('profileCoverUrl', result.url);

    } catch (err) {
      if (notify) notify('❌ Gagal upload sampul', 'error');
    } finally {
      setIsUploading(p => ({ ...p, profileCover: false }));
    }
  };

  const handlePageBgUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploading(p => ({ ...p, pageBg: true }));
    try {
      const result = await uploadToCloudinary(file);
      updateProfile('pageBgUrl', result.url);
      if (notify) notify('✅ Background halaman tersimpan');
    } catch (err) {
      if (notify) notify('❌ Gagal upload background', 'error');
    } finally {
      setIsUploading(p => ({ ...p, pageBg: false }));
    }
  };

  const addGroup = () => {
    save({ ...data, groups: [...(data.groups || []), { id: newGroupId(), name: 'Grup Baru', order: (data.groups || []).length }] });
    if (notify) notify('📁 Grup baru ditambahkan');
  };

  const updateGroup = (id, name) => save({ ...data, groups: (data.groups || []).map(g => g.id === id ? { ...g, name } : g) });

  const removeGroup = async (id, groupName) => {
    const confirmed = await showConfirm('Hapus grup ini beserta semua link di dalamnya?');
    if (confirmed) {
      save({ 
        ...data, 
        groups: (data.groups || []).filter(g => g.id !== id),
        links: data.links.filter(l => l.category !== groupName) // Remove links in this category
      });
      if (notify) notify('🗑️ Grup dan link dihapus');
    }
  };

  const addLink = (category = '') => {
    save({ ...data, links: [...data.links, {
      id: newId(), title: '', subtitle: '', category, url: '',
      iconSvg: '', coverImageUrl: '', btnBgImage: '',
      btnShape: 'rounded', btnBgColor: '',
      order: data.links.length
    }] });
    if (notify) notify('✨ Link baru ditambahkan');
  };

  const removeLink = async (id) => { 
    const confirmed = await showConfirm('Hapus link ini?');
    if (confirmed) {
      save({ ...data, links: data.links.filter(l => l.id !== id) }); 
      if (notify) notify('🗑️ Link dihapus'); 
    }
  };

  const updateLink = (id, field, value) => {
    save({ ...data, links: data.links.map(l => l.id === id ? { ...l, [field]: value } : l) });
  };

  // Move a link up or down within its scope (by re-assigning order values)
  const moveLink = (id: string, direction: 'up' | 'down', scopeLinks: any[]) => {
    const idx = scopeLinks.findIndex(l => l.id === id);
    if (direction === 'up' && idx <= 0) return;
    if (direction === 'down' && idx >= scopeLinks.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    // Swap order values
    const updatedLinks = data.links.map(l => {
      if (l.id === scopeLinks[idx].id) return { ...l, order: scopeLinks[swapIdx].order ?? swapIdx };
      if (l.id === scopeLinks[swapIdx].id) return { ...l, order: scopeLinks[idx].order ?? idx };
      return l;
    });
    save({ ...data, links: updatedLinks });
  };

  const handleIconSvg = async (id, e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => updateLink(id, 'iconSvg', ev.target.result); r.readAsText(file);
  };

  const handleCoverImage = async (id, e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploading(p => ({ ...p, cover: { ...p.cover, [id]: true } }));
    try {
      const result = await uploadToCloudinary(file);
      updateLink(id, 'coverImageUrl', result.url);

    } catch (err) {
      if (notify) notify('❌ Gagal upload cover', 'error');
    } finally {
      setIsUploading(p => ({ ...p, cover: { ...p.cover, [id]: false } }));
    }
  };

  const handleBtnBgImage = async (id, e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploading(p => ({ ...p, btnBg: { ...p.btnBg, [id]: true } }));
    try {
      const result = await uploadToCloudinary(file);
      updateLink(id, 'btnBgImage', result.url);
      if (notify) notify('✅ Background tombol berhasil diperbarui');

    } catch (err) {
      if (notify) notify('❌ Gagal upload background tombol', 'error');
    } finally {
      setIsUploading(p => ({ ...p, btnBg: { ...p.btnBg, [id]: false } }));
      if (btnBgRefs.current[id]) btnBgRefs.current[id].value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'cmsSlideIn 0.4s ease' }}>
      {/* ── Top Bar: Quick Public Link ── */}
      <div className="cms-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Halaman Bio Links Publik</div>
            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600 }}>URL: <span style={{ color: 'var(--cms-accent)', fontWeight: 700 }}>/links</span> atau <span style={{ color: 'var(--cms-accent)', fontWeight: 700 }}>/link</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="cms-btn cms-btn-secondary"
            style={{ height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <QrCode size={13} /> QR Code
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/links`;
              navigator.clipboard.writeText(url);
              if (notify) notify('📋 Tautan /links disalin ke clipboard!');
            }}
            className="cms-btn cms-btn-secondary"
            style={{ height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Copy size={13} /> Salin Link
          </button>
          <a
            href="/links"
            target="_blank"
            rel="noreferrer"
            className="cms-btn cms-btn-primary"
            style={{ height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <ExternalLink size={13} /> Buka Halaman
          </a>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="cms-card" style={{ background: 'var(--cms-card-bg)', padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--cms-shadow-md)' }}>
        {/* Cover zone */}
        <div
          onClick={() => profileCoverRef.current?.click()}
          style={{
            width: '100%', height: 148, cursor: 'pointer',
            position: 'relative', overflow: 'hidden',
            background: data.profile.profileCoverUrl ? 'transparent' : 'var(--cms-accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isUploading.profileCover
            ? <Loader2 className="animate-spin" color="var(--cms-accent)" />
            : data.profile.profileCoverUrl
              ? <img src={data.profile.profileCoverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--cms-accent)', opacity: 0.45 }}>
                  <Camera size={26} />
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em' }}>SAMPUL</span>
                </div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35))' }} />
          {data.profile.profileCoverUrl && (
            <>
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                borderRadius: 8, padding: '4px 10px',
                fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 4
              }}><Camera size={12} /> GANTI</div>
              <button
                onClick={(e) => { e.stopPropagation(); updateProfile('profileCoverUrl', ''); }}
                style={{
                  position: 'absolute', top: 10, left: 10,
                  background: 'rgba(239,68,68,0.75)', backdropFilter: 'blur(8px)',
                  borderRadius: 8, padding: '4px 10px', border: 'none', cursor: 'pointer',
                  fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', gap: 4
                }}><Trash2 size={12} /> HAPUS</button>
            </>
          )}
        </div>
        <input ref={profileCoverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileCoverUpload} />

        {/* Identity zone */}
        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: -36 }} className="links-profile-flex">
            {/* Avatar */}
            <div
              onClick={() => avatarRef.current?.click()}
              style={{
                width: 88, height: 88, borderRadius: 24,
                background: 'var(--cms-card-bg)',
                overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                border: '3px solid var(--cms-card-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--cms-shadow-lg)', zIndex: 10,
                transition: 'transform 0.2s ease',
              }}
            >
              {isUploading.avatar
                ? <Loader2 className="animate-spin" size={22} color="var(--cms-accent)" />
                : data.profile.avatarUrl
                  ? <img src={data.profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={28} color="var(--cms-text-muted)" />
              }
            </div>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />

            {/* Fields */}
            <div style={{ flex: 1, paddingBottom: 4 }} className="links-profile-inputs">
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }} className="links-input-row">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="cms-label" style={{ fontSize: 9, margin: 0 }}>NAMA</div>
                  <input className="cms-input" style={{ height: 40, borderRadius: 12 }} placeholder="Nama / Username" value={data.profile.name} onChange={e => updateProfile('name', e.target.value)} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="cms-label" style={{ fontSize: 9, margin: 0 }}>BIO</div>
                  <input className="cms-input" style={{ height: 40, borderRadius: 12 }} placeholder="Bio singkat..." value={data.profile.bio} onChange={e => updateProfile('bio', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Halaman zone */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div className="cms-label" style={{ fontSize: 9, margin: 0 }}>BACKGROUND</div>
            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', opacity: 0.65, marginTop: 3, lineHeight: 1.4 }}>Latar halaman</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {data.profile.pageBgUrl && (
              <button onClick={() => updateProfile('pageBgUrl', '')} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Hapus</button>
            )}
            <button
              onClick={() => pageBgRef.current?.click()}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: data.profile.pageBgUrl ? 'var(--cms-accent-soft)' : 'var(--cms-switcher-bg)',
                color: data.profile.pageBgUrl ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                border: `1px solid ${data.profile.pageBgUrl ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              {isUploading.pageBg ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {data.profile.pageBgUrl ? 'Ganti' : 'Upload'}
            </button>
            <input ref={pageBgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePageBgUpload} />
          </div>
        </div>
      </div>

      {/* ── Links Section ── */}
      <div>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }} className="links-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="cms-icon-box" style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <ExternalLink size={18} />
            </div>
            <div>
              <div className="cms-label" style={{ margin: 0, fontSize: 9 }}>LINK & GRUP</div>
              <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 600, marginTop: 1 }}>{data.links.length} Link Aktif</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={addGroup} className="cms-btn cms-btn-secondary" style={{ borderRadius: 10, padding: '9px 14px', fontSize: 13 }}>
              <Plus size={15} /> <span className="hide-sm">Grup</span>
            </button>
            <button onClick={() => addLink('')} className="cms-btn cms-btn-primary" style={{ borderRadius: 10, padding: '9px 14px', fontSize: 13 }}>
              <Plus size={15} /> <span className="hide-sm">Link</span>
            </button>
          </div>
        </div>

        {data.links.length === 0 && (data.groups || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--cms-switcher-bg)', borderRadius: 28, border: '2px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon size={40} color="var(--cms-text-muted)" style={{ opacity: 0.3, marginBottom: 16 }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-text-muted)' }}>Belum ada link atau grup yang dibuat</div>
            <p style={{ fontSize: 13, color: 'var(--cms-text-muted)', opacity: 0.7 }}>Klik tombol "Tambah Grup" atau "Tambah Link" untuk memulai.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Generate unified list of groups for rendering */}
            {(() => {
              const allGroups = [...(data.groups || [])];
              const existingGroupNames = allGroups.map(g => g.name);
              const categorizedLinks = data.links.filter(l => l.category);
              const missingGroups = Array.from(new Set(categorizedLinks.map(l => l.category))).filter(c => !existingGroupNames.includes(c));
              
              missingGroups.forEach((c, idx) => {
                allGroups.push({ id: `auto-${idx}`, name: c, order: allGroups.length, auto: true });
              });

              // Sort groups by order
              allGroups.sort((a,b) => (a.order || 0) - (b.order || 0));

              // Color presets for button background
              const COLOR_PRESETS = [
                { label: 'Default', value: '' },
                { label: 'Hitam', value: '#111118' },
                { label: 'Abu', value: '#2a2a3a' },
                { label: 'Putih', value: '#f0f0f5' },
                { label: 'Biru', value: '#2563eb' },
                { label: 'Ungu', value: '#7c3aed' },
                { label: 'Teal', value: '#0d9488' },
                { label: 'Rose', value: '#e11d48' },
                { label: 'Emas', value: '#d97706' },
              ];

              const SHAPES = [
                { key: 'rounded', label: 'Rounded', r: 12 },
                { key: 'pill', label: 'Pill', r: 999 },
                { key: 'square', label: 'Kotak', r: 6 },
              ];

              const renderLink = (lnk, idx: number, scopeLinks: any[]) => {
                const isFirst = idx === 0;
                const isLast = idx === scopeLinks.length - 1;

                return (
                  <div 
                    key={lnk.id} 
                    {...bindContextMenu(() => ({
                      title: lnk.title || 'Tautan',
                      subtitle: lnk.url || 'Belum ada URL tujuan',
                      headerBadge: 'LINK',
                      items: [
                        ...(lnk.url ? [
                          {
                            label: 'Buka Tautan (URL)',
                            icon: <ExternalLink size={15} color="var(--cms-accent)" />,
                            action: () => window.open(lnk.url.startsWith('http') ? lnk.url : `https://${lnk.url}`, '_blank')
                          },
                          {
                            label: 'Salin Tautan',
                            icon: <Copy size={15} />,
                            action: () => {
                              navigator.clipboard?.writeText(lnk.url);
                              if (notify) notify('Link disalin');
                            }
                          }
                        ] : []),
                        {
                          label: 'Setelan & Desain Tombol',
                          icon: <Settings2 size={15} />,
                          action: () => toggleExpanded(lnk.id)
                        },
                        { separator: true },
                        {
                          label: 'Hapus Link',
                          icon: <Trash2 size={15} />,
                          danger: true,
                          action: () => removeLink(lnk.id)
                        }
                      ]
                    }))}
                    style={{
                      background: 'var(--cms-card-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 18,
                      overflow: 'hidden',
                      boxShadow: 'var(--cms-shadow-sm)',
                    }}
                  >

                    {/* ── Zone 1: Cover thumb ── (Moved inside expanded area, see below) */}


                    {/* ── Zone 2: Main fields ── */}
                    <div style={{ padding: '12px 14px 10px' }}>

                      {/* Row A: reorder | icon | title | trash */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>

                        {/* Reorder arrows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                          <button
                            onClick={() => moveLink(lnk.id, 'up', scopeLinks)}
                            disabled={isFirst}
                            title="Ke atas"
                            style={{
                              width: 20, height: 18, borderRadius: 4, border: '1px solid var(--glass-border)',
                              background: 'var(--cms-switcher-bg)', cursor: isFirst ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: isFirst ? 0.25 : 0.8, padding: 0,
                            }}
                          >
                            <svg width="9" height="9" viewBox="0 0 9 9"><path d="M4.5 2L1.5 6.5h6L4.5 2z" fill="currentColor" /></svg>
                          </button>
                          <button
                            onClick={() => moveLink(lnk.id, 'down', scopeLinks)}
                            disabled={isLast}
                            title="Ke bawah"
                            style={{
                              width: 20, height: 18, borderRadius: 4, border: '1px solid var(--glass-border)',
                              background: 'var(--cms-switcher-bg)', cursor: isLast ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: isLast ? 0.25 : 0.8, padding: 0,
                            }}
                          >
                            <svg width="9" height="9" viewBox="0 0 9 9"><path d="M4.5 7L1.5 2.5h6L4.5 7z" fill="currentColor" /></svg>
                          </button>
                        </div>

                        {/* Icon box */}
                        <div
                          onClick={() => iconRefs.current[lnk.id]?.click()}
                          title="Upload ikon SVG"
                          style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: 'var(--cms-switcher-bg)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, cursor: 'pointer',
                          }}
                        >
                          {lnk.iconSvg
                            ? <div style={{ width: 18, height: 18 }} dangerouslySetInnerHTML={{ __html: lnk.iconSvg }} />
                            : <LinkIcon size={14} color="var(--cms-text-muted)" />
                          }
                        </div>
                        <input ref={el => iconRefs.current[lnk.id] = el} type="file" accept=".svg" style={{ display: 'none' }} onChange={e => handleIconSvg(lnk.id, e)} />

                        {/* Title */}
                        <input
                          className="cms-input"
                          style={{ flex: 1, height: 34, padding: '0 11px', fontSize: 13, fontWeight: 600, borderRadius: 9 }}
                          placeholder="Judul link..."
                          value={lnk.title}
                          onChange={e => updateLink(lnk.id, 'title', e.target.value)}
                        />

                        {/* Click Analytics Badge */}
                        {typeof linkClicks[lnk.id] === 'number' && (
                          <span 
                            title={`Total diklik: ${linkClicks[lnk.id]} kali`}
                            style={{
                              fontSize: 10.5, fontWeight: 850,
                              padding: '4px 8px', borderRadius: 8,
                              background: 'rgba(59, 130, 246, 0.12)',
                              color: '#3b82f6',
                              display: 'flex', alignItems: 'center', gap: 4,
                              flexShrink: 0
                            }}
                          >
                            <Eye size={12} /> {linkClicks[lnk.id]}
                          </span>
                        )}

                        {/* Settings Toggle */}
                        <button
                          onClick={() => toggleExpanded(lnk.id)}
                          title="Setelan lanjutan"
                          style={{
                            width: 34, height: 34, borderRadius: 9, border: 'none',
                            background: expandedLinks[lnk.id] ? 'var(--cms-accent-soft)' : 'var(--cms-switcher-bg)', 
                            color: expandedLinks[lnk.id] ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          <Settings2 size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => removeLink(lnk.id)}
                          title="Hapus link"
                          style={{
                            width: 34, height: 34, borderRadius: 9, border: 'none',
                            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Row B: URL */}
                      <input
                        className="cms-input"
                        style={{ width: '100%', height: 32, padding: '0 11px', fontSize: 12, borderRadius: 9, boxSizing: 'border-box' }}
                        placeholder="https://..."
                        value={lnk.url}
                        onChange={e => updateLink(lnk.id, 'url', e.target.value)}
                      />
                    </div>

                    {/* ── Advanced Settings (Collapsible) ── */}
                    {expandedLinks[lnk.id] && (
                      <>
                        {/* ── Zone 1: Cover thumb ── */}
                        <div
                          onClick={() => coverRefs.current[lnk.id]?.click()}
                          style={{
                            width: '100%', height: lnk.coverImageUrl ? 80 : 36,
                            cursor: 'pointer', position: 'relative', overflow: 'hidden',
                            background: lnk.coverImageUrl ? 'transparent' : 'var(--cms-switcher-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderTop: '1px solid var(--glass-border)',
                            transition: 'height 0.2s ease',
                          }}
                        >
                          {isUploading.cover[lnk.id]
                            ? <Loader2 className="animate-spin" size={16} color="var(--cms-accent)" />
                            : lnk.coverImageUrl
                              ? <img src={lnk.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cms-text-muted)', opacity: 0.4 }}>
                                  <Image size={13} />
                                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.07em' }}>COVER KARTU</span>
                                </div>
                          }
                          {lnk.coverImageUrl && (
                            <>
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
                              <div style={{
                                position: 'absolute', top: 6, right: 6,
                                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                                borderRadius: 5, padding: '2px 7px',
                                fontSize: 9, color: '#fff', fontWeight: 800
                              }}>GANTI</div>
                              <button
                                onClick={e => { e.stopPropagation(); updateLink(lnk.id, 'coverImageUrl', ''); }}
                                style={{
                                  position: 'absolute', top: 6, left: 6,
                                  background: 'rgba(239,68,68,0.7)', backdropFilter: 'blur(6px)',
                                  borderRadius: 5, padding: '2px 7px', border: 'none',
                                  fontSize: 9, color: '#fff', fontWeight: 800, cursor: 'pointer'
                                }}>✕ HAPUS</button>
                            </>
                          )}
                        </div>
                        <input ref={el => coverRefs.current[lnk.id] = el} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCoverImage(lnk.id, e)} />

                    {/* ── Zone 3: Style controls ── */}
                    <div style={{
                      padding: '10px 14px',
                      borderTop: '1px solid var(--glass-border)',
                      background: 'var(--cms-switcher-bg)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

                        {/* Shape toggle */}
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {SHAPES.map(s => (
                            <button
                              key={s.key}
                              onClick={() => updateLink(lnk.id, 'btnShape', s.key)}
                              title={s.label}
                              style={{
                                padding: '4px 10px', borderRadius: s.r > 100 ? 999 : s.r > 10 ? 7 : 4,
                                border: `1.5px solid ${ (lnk.btnShape || 'rounded') === s.key ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                                background: (lnk.btnShape || 'rounded') === s.key ? 'var(--cms-accent-soft)' : 'transparent',
                                color: (lnk.btnShape || 'rounded') === s.key ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                                fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >{s.label}</button>
                          ))}
                        </div>

                        {/* Divider */}
                        <div style={{ width: 1, height: 22, background: 'var(--glass-border)', flexShrink: 0 }} />

                        {/* Color swatches */}
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          {COLOR_PRESETS.map(c => (
                            <button
                              key={c.value}
                              onClick={() => updateLink(lnk.id, 'btnBgColor', c.value)}
                              title={c.label}
                              style={{
                                width: c.value ? 20 : 32, height: 20,
                                borderRadius: 5,
                                background: c.value || 'var(--cms-switcher-bg)',
                                border: `2px solid ${ (lnk.btnBgColor || '') === c.value ? 'var(--cms-accent)' : 'rgba(255,255,255,0.12)'}`,
                                cursor: 'pointer', padding: 0,
                                fontSize: c.value ? 0 : 9,
                                color: 'var(--cms-text-muted)',
                                fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >{c.value ? '' : 'DEF'}</button>
                          ))}
                          {/* Custom color picker */}
                          <label title="Warna kustom" style={{ position: 'relative', cursor: 'pointer' }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: 5,
                              background: lnk.btnBgColor && !COLOR_PRESETS.find(c => c.value === lnk.btnBgColor)
                                ? lnk.btnBgColor : 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
                              border: '2px solid rgba(255,255,255,0.2)',
                              cursor: 'pointer',
                            }} />
                            <input
                              type="color"
                              value={lnk.btnBgColor || '#1e1e2e'}
                              onChange={e => updateLink(lnk.id, 'btnBgColor', e.target.value)}
                              style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* ── Zone 4: Advanced (subtitle + btn bg image) ── */}
                    <div style={{ padding: '10px 14px 12px', display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      {/* Subtitle */}
                      <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div className="cms-label" style={{ fontSize: 9, margin: 0 }}>SUBJUDUL</div>
                        <input
                          className="cms-input"
                          style={{ height: 32, padding: '0 10px', fontSize: 12, borderRadius: 9 }}
                          placeholder="Keterangan singkat..."
                          value={lnk.subtitle}
                          onChange={e => updateLink(lnk.id, 'subtitle', e.target.value)}
                        />
                      </div>

                      {/* Btn bg image */}
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div className="cms-label" style={{ fontSize: 9, margin: 0 }}>BG TOMBOL</div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {lnk.btnBgImage && (
                            <button
                              onClick={() => updateLink(lnk.id, 'btnBgImage', '')}
                              style={{ height: 32, padding: '0 9px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                            >✕</button>
                          )}
                          <button
                            onClick={() => btnBgRefs.current[lnk.id]?.click()}
                            style={{
                              height: 32, padding: '0 11px', borderRadius: 8,
                              background: lnk.btnBgImage ? 'var(--cms-accent-soft)' : 'var(--cms-switcher-bg)',
                              color: lnk.btnBgImage ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                              border: `1px solid ${lnk.btnBgImage ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                              fontSize: 10, fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            {isUploading.btnBg?.[lnk.id] ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                            {lnk.btnBgImage ? 'Ganti' : 'Upload'}
                          </button>
                          <input ref={el => btnBgRefs.current[lnk.id] = el} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleBtnBgImage(lnk.id, e)} />
                        </div>
                      </div>

                      {/* Icon clear button */}
                      {lnk.iconSvg && (
                        <button
                          onClick={() => updateLink(lnk.id, 'iconSvg', '')}
                          style={{ height: 32, padding: '0 9px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                        >✕ Ikon</button>
                      )}
                    </div>

                    {/* BG preview strip */}
                    {lnk.btnBgImage && (
                      <div style={{ height: 36, position: 'relative', overflow: 'hidden' }}>
                        <img src={lnk.btnBgImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(0,0,0,0.3),transparent)' }} />
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 800, color: '#fff', opacity: 0.7, letterSpacing: '0.06em' }}>PREVIEW BG</span>
                      </div>
                    )}
                    </>
                    )}
                  </div>
                );
              };

              return (
                <React.Fragment>
                  {allGroups.map(group => {
                    // Get all links matching this group's name, sorted by order
                    const groupLinks = data.links.filter(l => l.category === group.name).sort((a,b) => (a.order||0) - (b.order||0));
                    return (
                      <div key={group.id} style={{
                        background: 'var(--cms-switcher-bg)',
                        borderRadius: 20, padding: 20,
                        border: '1px solid var(--glass-border)'
                      }}>
                        {/* Group header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div className="cms-label" style={{ fontSize: 9, margin: '0 0 4px' }}>NAMA GRUP</div>
                            <input
                              className="cms-input"
                              style={{ height: 38, fontSize: 14, fontWeight: 700, borderRadius: 11 }}
                              value={group.name}
                              onChange={e => {
                                const oldName = group.name;
                                const newName = e.target.value;
                                save({
                                  ...data,
                                  groups: (data.groups || []).map(g => g.id === group.id ? { ...g, name: newName } : g),
                                  links: data.links.map(l => l.category === oldName ? { ...l, category: newName } : l)
                                });
                              }}
                              placeholder="Nama Grup..."
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 8, paddingTop: 18 }}>
                            <button onClick={() => addLink(group.name)} className="cms-btn cms-btn-primary" style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12 }}>
                              <Plus size={13} /> Link
                            </button>
                            <button onClick={() => removeGroup(group.id, group.name)} className="cms-btn cms-btn-secondary" style={{ padding: '8px', borderRadius: 10, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {groupLinks.map((lnk, idx) => renderLink(lnk, idx, groupLinks))}
                        </div>
                        {groupLinks.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.45, fontSize: 13, fontWeight: 600 }}>Grup ini masih kosong.</div>
                        )}
                      </div>
                    );
                  })}

                  {/* Uncategorized Links */}
                  {data.links.filter(l => !l.category).length > 0 && (
                    <div style={{ background: 'var(--cms-switcher-bg)', borderRadius: 20, padding: 20, border: '1px solid var(--glass-border)' }}>
                      <div style={{ marginBottom: 14 }}>
                        <div className="cms-label" style={{ fontSize: 9, margin: '0 0 2px' }}>TANPA GRUP</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Link Tanpa Grup</div>
                        <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 3 }}>Link yang belum dikategorikan.</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(() => {
                          const uncatLinks = data.links.filter(l => !l.category).sort((a,b) => (a.order||0)-(b.order||0));
                          return uncatLinks.map((lnk, idx) => renderLink(lnk, idx, uncatLinks));
                        })()}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })()}
          </div>
        )}
      </div>
      {/* ── QR CODE GENERATOR MODAL ── */}
      {isQrModalOpen && (() => {
        const url = `${window.location.origin}/links`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=000000&bgcolor=ffffff&qzone=2&margin=0`;
        return (
          <div 
            onClick={() => setIsQrModalOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100000,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20, animation: 'cmsFadeIn 0.2s ease-out'
            }}
          >
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 380,
                background: 'var(--cms-card-bg)',
                borderRadius: 24, padding: '24px 22px',
                border: '1.5px solid var(--glass-border)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', gap: 16
              }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>
                  QR Code Halaman Bio Link
                </div>
                <button
                  onClick={() => setIsQrModalOpen(false)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--cms-switcher-bg)',
                    border: 'none', color: 'var(--cms-text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{
                padding: 14, background: '#ffffff',
                borderRadius: 18,
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <img src={qrUrl} alt="QR Code" style={{ width: 190, height: 190, display: 'block', borderRadius: 8 }} />
              </div>

              <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', lineHeight: 1.45 }}>
                Unduh file gambar QR Code untuk dipasang pada banner promosi, kartu nama, atau flyer produk.
              </div>

              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  style={{
                    flex: 1, height: 40, borderRadius: 12,
                    background: copiedLink ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-switcher-bg)',
                    border: `1.5px solid ${copiedLink ? '#10b981' : 'var(--glass-border)'}`,
                    color: copiedLink ? '#10b981' : 'var(--cms-text)',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Tersalin!' : 'Salin URL'}</span>
                </button>

                <a
                  href={qrUrl}
                  download="biolink-qr-code.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, height: 40, borderRadius: 12,
                    background: 'var(--cms-accent)',
                    border: 'none', color: '#fff',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    textDecoration: 'none'
                  }}
                >
                  <Download size={14} />
                  <span>Unduh PNG</span>
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @media (max-width: 500px) {
          .links-profile-flex {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            margin-top: -50px !important;
          }
          .links-profile-inputs {
            width: 100% !important;
            padding-top: 16px !important;
          }
          .links-input-row {
            flex-direction: column !important;
          }
          .hide-sm { display: none !important; }
          .links-section-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .links-section-header button { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default LinksManager;
