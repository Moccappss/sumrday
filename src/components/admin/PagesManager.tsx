import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Trash2, Layout, Type, Link as LinkIcon, ChevronRight, Eye, EyeOff, 
  Upload, Globe, Lock, ShieldCheck, X, Edit3, Settings2, Sparkles, FileText, 
  CheckCircle2, AlertCircle, Copy, Navigation, Smartphone, RotateCcw, Save,
  ChevronDown, PanelBottomClose, PanelBottom, Layers
} from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import { useContextMenu } from './ContextMenuProvider';
import { getUpdatedPages, clearPageUpdateDot } from '../../utils/multiUserSync';
import { storage } from '../../utils/storage';

// Ukuran SVG yang direkomendasikan untuk ikon navbar:
// • Desain pada canvas 28×28px (viewBox="0 0 28 28")
// • Garis (stroke) minimal 2px untuk keterbacaan
// • Gunakan currentColor agar mengikuti warna aktif/tidak aktif navbar
// • Simpan sebagai .svg (plain SVG, tanpa width/height absolut pada root)

const SYSTEM_PAGES = [
  { id: 'sys-home', name: 'Home', slug: 'home', isSystem: true, color: 'var(--cms-accent, #7c3aed)' },
  { id: 'sys-porto', name: 'Portofolio', slug: 'portofolio', isSystem: true, color: '#3b82f6' },
  { id: 'sys-bio', name: 'Biodata', slug: 'biodata', isSystem: true, color: '#ec4899' },
];

const DEFAULT_ICON_SVGS = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  portofolio: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
  biodata: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`,
};

const PagesManager = ({ customPages = [], onUpdatePages, onEditPage, confirm, notify, selectedPageSlug, onSelectPage }) => {
  const { bindContextMenu } = useContextMenu();
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showPopupTrash, setShowPopupTrash] = useState(false);
  const [editingPage, setEditingPage] = useState(null); // { slug, name, newName, newSlug }
  const [updatedPages, setUpdatedPages] = useState(getUpdatedPages);
  const [popups, setPopups] = useState<Array<{ id: string; title: string; isDeleted?: boolean }>>([]);
  const [activeTab, setActiveTab] = useState<'pages' | 'popups'>('pages');
  const [newPopupTitle, setNewPopupTitle] = useState('');
  const [isAddingPopup, setIsAddingPopup] = useState(false);
  const iconRefs = useRef({});

  useEffect(() => {
    const unsub = storage.listenItem('porto_settings', (s: any) => {
      if (s?.popups) setPopups(s.popups);
      else setPopups([]);
    }, {});
    return () => { if (unsub) unsub(); };
  }, []);

  useEffect(() => {
    const handleDots = (e) => {
      if (e.detail) setUpdatedPages(e.detail);
      else setUpdatedPages(getUpdatedPages());
    };
    window.addEventListener('porto_page_dots_updated', handleDots);
    return () => window.removeEventListener('porto_page_dots_updated', handleDots);
  }, []);

  const activeCustomPages = customPages.filter(p => !p.isSystem && !p.isDeleted);
  const trashedPages = customPages.filter(p => !p.isSystem && p.isDeleted);
  const activePopups = popups.filter(p => !p.isDeleted);
  const trashedPopups = popups.filter(p => p.isDeleted);

  const allPages = [...SYSTEM_PAGES.map(sp => {
    const existing = customPages.find(p => p.slug === sp.slug);
    return existing ? { ...sp, ...existing } : { ...sp, isPublished: true, showInNav: true };
  }), ...activeCustomPages];

  const addPage = () => {
    const name = newName.trim();
    const rawSlug = newSlug.trim();
    if (!name || !rawSlug) { notify?.('Nama dan Link harus diisi!', 'error'); return; }
    
    const reserved = ['home', 'portofolio', 'biodata', 'settings', 'admin', 'links'];
    const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (reserved.includes(slug) || customPages.some(p => p.slug === slug)) { notify?.('Link sudah digunakan!', 'error'); return; }

    const newPage = { 
      id: `pg-${Date.now()}`, name, slug, isPublished: true, showInNav: true, 
      isSystem: false, iconSvg: null, hideNavbars: false, hideBottomNav: false 
    };
    onUpdatePages([...customPages, newPage]);
    onSelectPage(slug);
    setNewName(''); setNewSlug(''); setIsAdding(false);
    notify?.('Halaman baru berhasil dibuat');
  };

  const addPopup = async () => {
    const title = newPopupTitle.trim() || `Pop-up #${popups.length + 1}`;
    const id = `pop-${Date.now()}`;
    const newPop = { id, title, createdAt: Date.now() };
    const updated = [...popups, newPop];
    setPopups(updated);
    try {
      const current = await storage.getItem('porto_settings', {});
      await storage.setItem('porto_settings', { ...current, popups: updated });
    } catch (e) {
      console.error('Failed saving popup:', e);
    }
    setNewPopupTitle('');
    setIsAddingPopup(false);
    notify?.('Pop-up baru dibuat');
    window.dispatchEvent(new CustomEvent('porto_edit_popup', {
      detail: { popupId: id, id, title }
    }));
  };

  const deletePopupToTrash = (popupId: string) => {
    const updated = popups.map(p => p.id === popupId ? { ...p, isDeleted: true } : p);
    setPopups(updated);
    storage.getItem('porto_settings', {}).then(current => {
      storage.setItem('porto_settings', { ...current, popups: updated });
    });
    notify?.('Pop-up dipindahkan ke sampah');
  };

  const restorePopup = (popupId: string) => {
    const updated = popups.map(p => p.id === popupId ? { ...p, isDeleted: false } : p);
    setPopups(updated);
    storage.getItem('porto_settings', {}).then(current => {
      storage.setItem('porto_settings', { ...current, popups: updated });
    });
    notify?.('Pop-up dipulihkan');
  };

  const permanentDeletePopup = (popupId: string) => {
    confirm?.('Hapus permanen pop-up ini beserta isinya? Semua blok dan stiker di dalamnya akan terhapus.', async () => {
      const updated = popups.filter(p => p.id !== popupId);
      setPopups(updated);
      try {
        const current = await storage.getItem('porto_settings', {});
        await storage.setItem('porto_settings', { ...current, popups: updated });
        const pages = await storage.getItem('porto_pages', {});
        if (pages[popupId]) {
          delete pages[popupId];
          await storage.setItem('porto_pages', pages);
        }
        const stickers = await storage.getItem('porto_stickers', {});
        if (stickers[popupId]) {
          delete stickers[popupId];
          await storage.setItem('porto_stickers', stickers);
        }
      } catch (e) {
        console.error('Failed deleting popup:', e);
      }
      notify?.('Pop-up dihapus permanen');
    });
  };

  const editPopupDesign = (pop: { id: string; title: string }) => {
    window.dispatchEvent(new CustomEvent('porto_edit_popup', {
      detail: { popupId: pop.id, id: pop.id, title: pop.title }
    }));
  };

  const duplicatePage = (page) => {
    const baseName = `${page.name} (Copy)`;
    const baseSlug = `${page.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    while (customPages.some(p => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }
    const newPage = {
      ...page,
      id: `pg-${Date.now()}`,
      name: baseName,
      slug,
      isSystem: false,
      isDeleted: false,
      deletedAt: null,
    };
    onUpdatePages([...customPages, newPage]);
    notify?.('📋 Halaman berhasil diduplikat!');
  };

  const removePage = (slug) => {
    confirm?.(`Pindahkan halaman ini ke Trash?`, () => {
      onUpdatePages(customPages.map(p => p.slug === slug ? { ...p, isDeleted: true, deletedAt: new Date().toISOString() } : p));
      if (selectedPageSlug === slug) onSelectPage('home');
      notify?.('🗑️ Halaman dipindahkan ke Trash');
    });
  };

  const restorePage = (slug) => {
    onUpdatePages(customPages.map(p => p.slug === slug ? { ...p, isDeleted: false, deletedAt: null } : p));
    notify?.('♻️ Halaman berhasil dipulihkan');
  };

  const permanentDelete = (slug) => {
    confirm?.(`Hapus PERMANEN halaman ini? Data yang dihapus tidak bisa dikembalikan.`, () => {
      onUpdatePages(customPages.filter(p => p.slug !== slug));
      notify?.('❌ Halaman dihapus permanen');
    });
  };

  const updatePage = (slug, props) => {
    const isKnown = customPages.some(p => p.slug === slug);
    if (!isKnown) {
      const sys = SYSTEM_PAGES.find(p => p.slug === slug);
      onUpdatePages([...customPages, { ...sys, isPublished: true, showInNav: true, ...props }]);
    } else {
      onUpdatePages(customPages.map(p => p.slug === slug ? { ...p, ...props } : p));
    }
  };

  const saveEditPage = () => {
    if (!editingPage) return;
    const { slug, newName, newSlug } = editingPage;
    const trimName = newName.trim();
    const trimSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!trimName) { notify?.('Nama halaman tidak boleh kosong', 'error'); return; }
    if (!editingPage.isSystem && !trimSlug) { notify?.('Slug tidak boleh kosong', 'error'); return; }
    
    if (!editingPage.isSystem && trimSlug !== slug) {
      const reserved = ['home', 'portofolio', 'biodata', 'settings', 'admin', 'links'];
      if (reserved.includes(trimSlug) || customPages.some(p => p.slug === trimSlug && p.slug !== slug)) {
        notify?.('Slug sudah digunakan!', 'error'); return;
      }
    }

    updatePage(slug, { name: trimName, slug: editingPage.isSystem ? slug : trimSlug });
    setEditingPage(null);
    notify?.('✅ Halaman berhasil diperbarui');
  };

  const handleIconUpload = (slug, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updatePage(slug, { iconSvg: ev.target.result });
      notify?.('✅ Ikon navbar berhasil diperbarui');
    };
    reader.readAsText(file);
    // Reset input
    if (iconRefs.current[slug]) iconRefs.current[slug].value = '';
  };

  const resetIcon = (slug) => {
    updatePage(slug, { iconSvg: null });
    notify?.('🔄 Ikon dikembalikan ke default');
  };

  useEffect(() => {
    const handleAdd = () => {
      setIsAdding(true);
      setTimeout(() => document.getElementById('new-page-name')?.focus(), 150);
    };
    window.addEventListener('porto_add_action', handleAdd);
    return () => window.removeEventListener('porto_add_action', handleAdd);
  }, []);

  const ActionButton = ({ onClick, title, children, danger, style: extraStyle }) => (
    <button
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: '1px solid var(--glass-border)',
        background: danger ? 'rgba(239, 68, 68, 0.1)' : 'var(--cms-switcher-bg)',
        color: danger ? '#ef4444' : 'var(--cms-text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        padding: 0,
        ...extraStyle,
      }}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="pages-manager-root" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* Header Pill with Glassmorphism */}
      <div className="sidebar-pill-header" style={{ flexShrink: 0, padding: '16px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg,var(--cms-accent, #7c3aed),#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb),0.25)',
            transition: 'all 0.3s ease',
            flexShrink: 0
          }}>
            <FileText size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--glass-text)', letterSpacing: '-0.01em' }}>
            Halaman
          </span>
        </div>

        {/* Toolbar Icons: Aktif, Sampah, + (Icon Saja, Gantikan Angka) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'popups') setShowPopupTrash(false);
              else setShowTrash(false);
            }}
            style={{
              width: 30, height: 30, padding: 0, borderRadius: 8,
              border: (activeTab === 'popups' ? !showPopupTrash : !showTrash)
                ? '1px solid var(--cms-accent, #7c3aed)'
                : '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              background: (activeTab === 'popups' ? !showPopupTrash : !showTrash)
                ? 'var(--cms-accent, #7c3aed)'
                : 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
              color: (activeTab === 'popups' ? !showPopupTrash : !showTrash)
                ? '#fff'
                : 'var(--cms-text-muted, #94a3b8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.18s ease'
            }}
            title="Aktif"
            aria-label="Aktif"
          >
            <FileText size={14} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'popups') setShowPopupTrash(true);
              else setShowTrash(true);
            }}
            style={{
              width: 30, height: 30, padding: 0, borderRadius: 8,
              position: 'relative',
              border: (activeTab === 'popups' ? showPopupTrash : showTrash)
                ? '1px solid var(--cms-accent, #7c3aed)'
                : '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              background: (activeTab === 'popups' ? showPopupTrash : showTrash)
                ? 'var(--cms-accent, #7c3aed)'
                : 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
              color: (activeTab === 'popups' ? showPopupTrash : showTrash)
                ? '#fff'
                : 'var(--cms-text-muted, #94a3b8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.18s ease'
            }}
            title="Sampah"
            aria-label="Sampah"
          >
            <Trash2 size={14} />
            {((activeTab === 'popups' ? trashedPopups.length : trashedPages.length) > 0) && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 14, height: 14, borderRadius: 7,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 2px', border: '1.5px solid var(--cms-panel-bg, #13141f)'
              }}>
                {activeTab === 'popups' ? trashedPopups.length : trashedPages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'popups') {
                setShowPopupTrash(false);
                setIsAddingPopup(true);
              } else {
                setShowTrash(false);
                setIsAdding(true);
              }
            }}
            style={{
              width: 30, height: 30, padding: 0, borderRadius: 8,
              background: 'var(--cms-accent, #7c3aed)',
              color: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.18s ease',
              boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb),0.3)'
            }}
            title={activeTab === 'popups' ? 'Tambah Pop-up Baru' : 'Tambah Halaman Baru'}
            aria-label="Tambah Baru"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Top Segment Tab: Halaman vs Pop-up */}
      <div style={{ display: 'flex', gap: 6, padding: '0 12px 10px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          style={{
            flex: 1, height: 32, fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: activeTab === 'pages' ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
            color: activeTab === 'pages' ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
            borderRadius: 8, border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
            cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          <FileText size={13} /> Halaman
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('popups')}
          style={{
            flex: 1, height: 32, fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: activeTab === 'popups' ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
            color: activeTab === 'popups' ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
            borderRadius: 8, border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
            cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          <Layers size={13} /> Pop-up {popups.length > 0 && <span style={{ background: activeTab === 'popups' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 6, fontSize: 10 }}>{popups.length}</span>}
        </button>
      </div>

      {/* Scrollable Container */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 16 }}>
        {activeTab === 'popups' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 12px' }}>
            {isAddingPopup && (
              <div className="cms-card" style={{ padding: 14, border: '1.5px dashed var(--cms-accent, #7c3aed)', borderRadius: 10, animation: 'cmsPopIn 0.2s ease' }}>
                <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 8, color: 'var(--cms-accent, #7c3aed)' }}>
                  JUDUL POP-UP MODAL
                </div>
                <input
                  className="cms-input"
                  placeholder="Contoh: Brosur Promo, Detail Produk..."
                  value={newPopupTitle}
                  onChange={e => setNewPopupTitle(e.target.value)}
                  style={{ width: '100%', marginBottom: 10, fontSize: 12 }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={addPopup}
                    className="cms-btn cms-btn-primary"
                    style={{ flex: 1, height: 32, fontSize: 12, fontWeight: 700 }}
                  >
                    Buat
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingPopup(false)}
                    className="cms-btn"
                    style={{ height: 32, fontSize: 12 }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {!showPopupTrash ? (
              activePopups.length === 0 && !isAddingPopup ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--cms-text-muted, #94a3b8)', fontSize: 12 }}>
                  <div style={{ display: 'inline-flex', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
                    <Layers size={24} color="var(--cms-accent, #7c3aed)" />
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Belum ada Pop-up Aktif</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 14 }}>
                    Klik tombol + di atas untuk membuat pop-up baru.
                  </div>
                </div>
              ) : (
                activePopups.map(pop => (
                  <div
                    key={pop.id}
                    className="cms-card"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      border: selectedPageSlug === pop.id ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                      background: selectedPageSlug === pop.id ? 'rgba(124, 58, 237, 0.08)' : 'var(--cms-card-bg, rgba(255,255,255,0.03))'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <Layers size={15} color="var(--cms-accent, #7c3aed)" />
                        <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pop.title || 'Pop-up Modal'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deletePopupToTrash(pop.id)}
                        className="sidebar-icon-btn sm"
                        title="Hapus ke Sampah"
                        style={{ color: 'var(--cms-text-muted)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => editPopupDesign(pop)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #9333ea)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                      }}
                    >
                      <Layers size={13} /> Desain
                    </button>
                  </div>
                ))
              )
            ) : (
              trashedPopups.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Sampah pop-up kosong.</div>
              ) : (
                trashedPopups.map(pop => (
                  <div 
                    key={pop.id} 
                    className="cms-card"
                    style={{ 
                      padding: '14px', border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
                      borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="cms-icon-box" style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--cms-switcher-bg)' }}>
                        <Trash2 size={15} color="var(--cms-text-muted)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>{pop.title || 'Pop-up Modal'}</div>
                        <div style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>{pop.id}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
                      <button 
                        onClick={() => restorePopup(pop.id)}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Pulihkan
                      </button>
                      <button 
                        onClick={() => permanentDeletePopup(pop.id)}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: 'rgba(244, 63, 94, 0.1)', color: '#e11d48', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </>
      ) : (
      <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 12px', width: '100%', boxSizing: 'border-box' }}>
        {!showTrash ? (
          allPages.map(p => {
          const isSel = selectedPageSlug === p.slug;
          const isEditing = editingPage?.slug === p.slug;
          const isSystemPage = !!p.isSystem;
          
          return (
            <div 
              key={p.id} 
              onClick={() => {
                clearPageUpdateDot(p.slug);
                if (!isEditing) onSelectPage(p.slug);
              }}
              {...bindContextMenu(() => ({
                title: p.name || 'Halaman',
                subtitle: `/lpimage/${p.slug} · ${p.isSystem ? 'Halaman Sistem' : 'Halaman Kustom'}`,
                headerBadge: p.isSystem ? 'SISTEM' : 'KUSTOM',
                items: [
                  {
                    label: 'Pilih & Edit Konten',
                    icon: <Edit3 size={15} color="var(--cms-accent)" />,
                    action: () => { onSelectPage(p.slug); onEditPage?.(p.slug); }
                  },
                  {
                    label: p.isPublished ? 'Sembunyikan dari Publik' : 'Publikasikan Halaman',
                    icon: p.isPublished ? <EyeOff size={15} color="#f59e0b" /> : <Eye size={15} color="#10b981" />,
                    action: () => updatePage(p.slug, { isPublished: !p.isPublished })
                  },
                  {
                    label: p.showInNav !== false ? 'Sembunyikan di Navigasi' : 'Tampilkan di Navigasi',
                    icon: <Navigation size={15} />,
                    action: () => updatePage(p.slug, { showInNav: !(p.showInNav !== false) })
                  },
                  {
                    label: 'Salin Tautan Halaman',
                    icon: <Copy size={15} />,
                    action: () => {
                      navigator.clipboard?.writeText(`${window.location.origin}/lpimage/${p.slug}`);
                      if (notify) notify('Link halaman disalin');
                    }
                  },
                  ...(!p.isSystem ? [
                    { separator: true },
                    {
                      label: 'Pindahkan ke Sampah',
                      icon: <Trash2 size={15} />,
                      danger: true,
                      action: () => removePage(p.slug)
                    }
                  ] : [])
                ]
              }))}
              className={`cms-card ${isSel ? 'active' : ''}`}
              style={{ 
                padding: '12px 14px 10px', cursor: isEditing ? 'default' : 'pointer', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: isSel ? '2px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                background: isSel ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg)',
                transform: isSel ? 'translateY(-1px)' : 'none',
                boxShadow: isSel ? '0 8px 18px rgba(var(--cms-accent-rgb),0.1)' : 'var(--cms-shadow-sm)',
                borderRadius: 14, position: 'relative',
                display: 'flex', flexDirection: 'column', gap: 10,
                width: '100%', boxSizing: 'border-box'
              }}
            >
              {/* Top Row: Icon + Name/Link + Nav Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Navbar Icon — clickable to change */}
                <div style={{ position: 'relative' }}>
                  <div 
                    className="cms-icon-box" 
                    onClick={(e) => { e.stopPropagation(); iconRefs.current[p.slug]?.click(); }}
                    title="Ganti ikon navbar (SVG 28×28px, gunakan currentColor)"
                    style={{ 
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: isSel ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      border: '1px dashed transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    {p.iconSvg ? (
                      <div style={{ width: 20, height: 20, color: isSel ? '#fff' : 'var(--cms-accent)' }} dangerouslySetInnerHTML={{ __html: p.iconSvg }} />
                    ) : DEFAULT_ICON_SVGS[p.slug] ? (
                      <div style={{ width: 20, height: 20, color: isSel ? '#fff' : 'var(--cms-accent)' }} dangerouslySetInnerHTML={{ __html: DEFAULT_ICON_SVGS[p.slug] }} />
                    ) : (
                      <FileText size={18} color={isSel ? '#fff' : (p.color || 'var(--cms-accent)')} />
                    )}
                  </div>
                  <input 
                    ref={el => iconRefs.current[p.slug] = el}
                    type="file" accept=".svg" style={{ display: 'none' }}
                    onChange={e => { e.stopPropagation(); handleIconUpload(p.slug, e); }}
                  />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    // Inline edit form
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <input 
                        className="cms-input" 
                        style={{ height: 30, fontSize: 12, padding: '0 10px', borderRadius: 8 }}
                        value={editingPage.newName} 
                        onChange={e => setEditingPage(prev => ({ ...prev, newName: e.target.value }))}
                        placeholder="Nama halaman"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveEditPage(); if (e.key === 'Escape') setEditingPage(null); }}
                      />
                      {!isSystemPage && (
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 600 }}>/</span>
                          <input 
                            className="cms-input" 
                            style={{ height: 28, fontSize: 11, padding: '0 10px 0 20px', borderRadius: 8 }}
                            value={editingPage.newSlug}
                            onChange={e => setEditingPage(prev => ({ ...prev, newSlug: e.target.value }))}
                            placeholder="slug"
                            onKeyDown={e => { if (e.key === 'Enter') saveEditPage(); if (e.key === 'Escape') setEditingPage(null); }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.02em' }}>{p.name}</div>
                        {p.isSystem && <div style={{ fontSize: 8, fontWeight: 900, background: 'var(--cms-accent)', color: '#fff', padding: '2px 5px', borderRadius: 5, flexShrink: 0 }}>SYSTEM</div>}
                        {updatedPages[p.slug] && (
                          <span className="cms-update-dot" title="Ada pembaruan data dari pengguna lain" style={{ width: 7, height: 7, minWidth: 7, minHeight: 7 }} />
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                        <LinkIcon size={9} opacity={0.6} /> /lpimage/{p.slug}
                        <InfoTooltip content="Klik ikon kotak di sebelah kiri untuk mengganti logo halaman (SVG 28x28px, currentColor)." />
                      </div>
                    </>
                  )}
                </div>

                {/* Quick actions: edit + (for custom) reset icon + duplicate */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  {isEditing ? (
                    <>
                      <ActionButton onClick={saveEditPage} title="Simpan" style={{ background: 'var(--cms-accent)', color: '#fff', border: 'none' }}>
                        <Save size={13} />
                      </ActionButton>
                      <ActionButton onClick={() => setEditingPage(null)} title="Batal">
                        <X size={13} />
                      </ActionButton>
                    </>
                  ) : (
                    <>
                      <ActionButton 
                        onClick={() => setEditingPage({ slug: p.slug, isSystem: p.isSystem, newName: p.name, newSlug: p.slug })} 
                        title="Edit nama & slug"
                      >
                        <Edit3 size={13} />
                      </ActionButton>
                      {/* Reset icon — for system pages */}
                      {p.iconSvg && (
                        <ActionButton onClick={() => resetIcon(p.slug)} title="Reset ikon ke default">
                          <RotateCcw size={13} />
                        </ActionButton>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action row */}
              {!isEditing && (
                <div style={{ 
                  display: 'flex', gap: 6, paddingTop: 8,
                  borderTop: '1px solid var(--glass-border)',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updatePage(p.slug, { isPublished: !p.isPublished }); }}
                    title={p.isPublished ? 'Status: Published (Klik untuk ubah ke Draft)' : 'Status: Draft (Klik untuk Publish)'}
                    style={{ 
                      width: 28, height: 28, borderRadius: 7,
                      background: p.isPublished ? 'rgba(34, 197, 94, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                      color: p.isPublished ? '#16a34a' : '#e11d48',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', padding: 0
                    }}
                  >
                    {p.isPublished ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  </button>

                  {/* Show in top nav toggle */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); updatePage(p.slug, { showInNav: !p.showInNav }); }}
                    style={{ 
                      width: 28, height: 28, borderRadius: 7,
                      background: p.showInNav ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                      color: p.showInNav ? '#2563eb' : '#64748b',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', padding: 0
                    }}
                    title={p.showInNav ? 'Tampil di nav' : 'Tersembunyi dari nav'}
                  >
                    {p.showInNav ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>

                  {/* Hide bottom navbar toggle */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); updatePage(p.slug, { hideBottomNav: !p.hideBottomNav }); }}
                    title={p.hideBottomNav ? 'Navbar bawah tersembunyi' : 'Navbar bawah tampil'}
                    style={{ 
                      width: 28, height: 28, borderRadius: 7,
                      background: p.hideBottomNav ? 'rgba(245, 158, 11, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                      color: p.hideBottomNav ? '#d97706' : '#64748b',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', padding: 0
                    }}
                  >
                    {p.hideBottomNav ? <PanelBottomClose size={13} /> : <PanelBottom size={13} />}
                  </button>

                  {/* Duplicate — custom pages only */}
                  {!p.isSystem && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); duplicatePage(p); }} 
                      style={{ 
                        width: 28, height: 28, borderRadius: 7,
                        background: 'var(--cms-switcher-bg)', color: 'var(--cms-text-muted)',
                        border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0
                      }}
                      title="Duplikat halaman"
                    >
                      <Copy size={13} />
                    </button>
                  )}

                  {/* Delete — custom pages only */}
                  {!p.isSystem && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePage(p.slug); }} 
                      style={{ 
                        width: 28, height: 28, borderRadius: 7,
                        background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0
                      }}
                      title="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
        ) : (
          trashedPages.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Trash kosong.</div>
          ) : (
            trashedPages.map(p => (
              <div 
                key={p.id} 
                className="cms-card"
                style={{ 
                  padding: '16px', border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
                  borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="cms-icon-box" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--cms-switcher-bg)' }}>
                    <Trash2 size={16} color="var(--cms-text-muted)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 600 }}>/{p.slug}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
                  <button 
                    onClick={() => restorePage(p.slug)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Pulihkan
                  </button>
                  <button 
                    onClick={() => permanentDelete(p.slug)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'rgba(244, 63, 94, 0.1)', color: '#e11d48', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {isAdding && (
          <div className="cms-card" style={{ padding: 20, border: '2px dashed var(--cms-accent)', animation: 'cmsPopIn 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> BARU</div>
              <button onClick={() => setIsAdding(false)} className="sidebar-icon-btn sm"><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="cms-label" style={{ fontSize: 9 }}>NAMA</div>
                <input id="new-page-name" className="cms-input" placeholder="e.g. My Project" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <div className="cms-label" style={{ fontSize: 9 }}>LINK</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--cms-text-muted)', fontWeight: 600 }}>/</span>
                  <input className="cms-input" style={{ paddingLeft: 24 }} placeholder="my-project" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
                </div>
              </div>
              <button onClick={addPage} className="cms-btn cms-btn-primary" style={{ height: 40, width: '100%', marginTop: 8 }}>Buat</button>
            </div>
          </div>
        )}
      </div>
      </>
      )}
      </div>
    </div>
  );
};

export default PagesManager;
