import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../utils/storage';
import {
  Plus, Search, Star, Trash2, Edit3, Image as ImageIcon, Video,
  Tag, Folder, ExternalLink, Sparkles, Filter, Check, Eye, X
} from 'lucide-react';
import CustomProjectModal from './CustomProjectModal';
import { useContextMenu } from './ContextMenuProvider';

interface PortfolioManagerProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({ notify, confirm }) => {
  const { openContextMenu } = useContextMenu();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [websiteData, setWebsiteData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');

  // Interconnection: Agency Projects to Portfolio
  const [availableAgencyProjects, setAvailableAgencyProjects] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSearch, setImportSearch] = useState('');

  // Load data
  const loadData = async () => {
    try {
      const [savedProjects, savedWebsite, savedAgencyProjects] = await Promise.all([
        storage.getItem('porto_portfolio', []),
        storage.getItem('porto_main_website', {}),
        storage.getItem('porto_projects', []),
      ]);
      setProjects(Array.isArray(savedProjects) ? savedProjects : []);
      setWebsiteData(savedWebsite || {});
      setAvailableAgencyProjects(Array.isArray(savedAgencyProjects) ? savedAgencyProjects : []);
    } catch (err) {
      console.error('Failed to load portfolio items:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard accessibility: Escape dismisses open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showImportModal) setShowImportModal(false);
        else if (showModal) setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImportModal, showModal]);

  // Helpers
  const featuredIds: string[] = websiteData.featuredProjects || [];
  const featuredLabels: string[] = websiteData.featuredLabels || [];
  const projectCategories: string[] = websiteData.projectCategories || [];

  const updateWebsiteData = async (patch: any) => {
    const updated = { ...websiteData, ...patch };
    setWebsiteData(updated);
    await storage.setItem('porto_main_website', updated);
  };

  const toggleFeatured = async (id: string) => {
    const current = new Set(featuredIds);
    if (current.has(id)) {
      current.delete(id);
      notify?.('Dihapus dari karya pilihan utama');
    } else {
      current.add(id);
      notify?.('⭐ Ditandai sebagai karya pilihan utama');
    }
    const updatedFeatured = Array.from(current);
    await updateWebsiteData({ featuredProjects: updatedFeatured });
  };

  const handleDeleteProject = (id: string, title: string) => {
    const doDelete = async () => {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      await storage.setItem('porto_portfolio', updated);
      // Remove from featured if exists
      if (featuredIds.includes(id)) {
        await updateWebsiteData({ featuredProjects: featuredIds.filter((fId) => fId !== id) });
      }
      notify?.(`🗑️ Karya "${title || 'Tanpa Judul'}" berhasil dihapus`);
    };

    if (confirm) {
      confirm({
        title: 'Hapus Karya',
        message: `Apakah Anda yakin ingin menghapus karya "${title || 'Tanpa Judul'}" dari portofolio?`,
        onConfirm: doDelete,
        isDestructive: true,
      });
    } else {
      doDelete();
    }
  };

  const toggleSelectProject = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProjects.map(p => p.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const doBulkDelete = async () => {
      const updated = projects.filter(p => !selectedIds.includes(p.id));
      setProjects(updated);
      await storage.setItem('porto_portfolio', updated);
      
      const newFeatured = featuredIds.filter(fId => !selectedIds.includes(fId));
      if (newFeatured.length !== featuredIds.length) {
        await updateWebsiteData({ featuredProjects: newFeatured });
      }
      setSelectedIds([]);
      notify?.(`🗑️ Berhasil menghapus ${count} karya pilihan.`);
    };

    if (confirm) {
      confirm({
        title: 'Hapus Karya Terpilih',
        message: `Apakah Anda yakin ingin menghapus ${count} karya yang ditandai secara permanen?`,
        onConfirm: doBulkDelete,
        isDestructive: true,
      });
    } else {
      doBulkDelete();
    }
  };

  const handleImportProject = (agencyProj: any) => {
    let cover = agencyProj.coverImage || agencyProj.image || agencyProj.thumbnail || '';
    if (!cover && agencyProj.notes) {
      const match = agencyProj.notes.match(/!\[.*?\]\((.*?)\)/);
      if (match) cover = match[1];
    }
    
    const newPortoItem = {
      id: `porto-${Date.now()}`,
      title: agencyProj.title || 'Proyek Tanpa Judul',
      description: agencyProj.description || agencyProj.notes || '',
      category: agencyProj.category || projectCategories[0] || 'Design',
      client: agencyProj.client || agencyProj.customer || '',
      year: agencyProj.date ? new Date(agencyProj.date).getFullYear().toString() : new Date().getFullYear().toString(),
      image: cover,
      gallery: cover ? [cover] : [],
      tags: agencyProj.tags || [],
      externalUrl: agencyProj.externalUrl || agencyProj.link || '',
      sourceProjectId: agencyProj.id,
    };

    setEditingProject(newPortoItem);
    setShowImportModal(false);
    setShowModal(true);
    notify?.(`✨ Data proyek "${agencyProj.title}" berhasil diimpor! Silakan sesuaikan dan simpan.`, 'info');
  };

  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e, {
      title: 'Portofolio & Karya',
      subtitle: `${filteredProjects.length} karya terdaftar`,
      items: [
        {
          label: 'Tambah Karya Baru',
          icon: <Plus size={15} color="#10b981" />,
          action: () => {
            setEditingProject(null);
            setShowModal(true);
          }
        },
        {
          label: selectedIds.length > 0 ? 'Batalkan Semua Pilihan' : 'Mode Pilih: Tandai Semua Karya',
          icon: <Check size={15} color="#6366f1" />,
          action: selectedIds.length > 0 ? () => setSelectedIds([]) : handleSelectAll
        },
        ...(selectedIds.length > 0 ? [
          {
            label: `Hapus ${selectedIds.length} Karya Ditandai`,
            icon: <Trash2 size={15} color="#ef4444" />,
            danger: true,
            action: handleBulkDelete
          }
        ] : []),
        { separator: true, label: '' },
        {
          label: onlyFeatured ? 'Tampilkan Semua Karya' : 'Filter: Hanya Karya Unggulan',
          icon: <Star size={15} color="#f59e0b" />,
          action: () => setOnlyFeatured(!onlyFeatured)
        },
        {
          label: 'Buka Halaman Portofolio Publik',
          icon: <ExternalLink size={15} color="#38bdf8" />,
          action: () => window.open('/portfolio', '_blank')
        }
      ]
    });
  };

  const handleCardContextMenu = (e: React.MouseEvent, p: any) => {
    e.preventDefault();
    e.stopPropagation();
    const isFeatured = featuredIds.includes(p.id);
    const isSelected = selectedIds.includes(p.id);
    openContextMenu(e, {
      title: p.title || p.name || 'Karya Portofolio',
      subtitle: p.category || 'Tanpa Kategori',
      items: [
        {
          label: 'Edit Detail Karya',
          icon: <Edit3 size={15} color="#6366f1" />,
          action: () => {
            setEditingProject(p);
            setShowModal(true);
          }
        },
        {
          label: isSelected ? 'Hilangkan Tanda' : 'Tandai / Mode Pilih',
          icon: <Check size={15} color="#10b981" />,
          action: () => toggleSelectProject(p.id)
        },
        ...(selectedIds.length > 0 ? [
          {
            label: 'Batalkan Semua Pilihan',
            icon: <X size={15} color="#94a3b8" />,
            action: () => setSelectedIds([])
          }
        ] : []),
        {
          label: isFeatured ? 'Hapus dari Pilihan Utama' : 'Jadikan Pilihan Utama',
          icon: <Star size={15} color="#f59e0b" />,
          action: () => toggleFeatured(p.id)
        },
        { separator: true, label: '' },
        {
          label: 'Hapus Karya Ini',
          icon: <Trash2 size={15} color="#ef4444" />,
          danger: true,
          action: () => handleDeleteProject(p.id, p.title || p.name)
        }
      ]
    });
  };

  // Clean category validator to filter out keyboard smash / junk test categories
  const isValidCategory = (cat: string): boolean => {
    if (!cat || typeof cat !== 'string') return false;
    const trimmed = cat.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return false;
    // Discard strings with 5+ consecutive consonants like 'adsgsdrhg'
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(trimmed)) return false;
    return true;
  };

  // Categories list
  const allCategories = useMemo(() => {
    const set = new Set<string>(['Semua']);
    projectCategories.forEach((c) => {
      if (isValidCategory(c)) set.add(c.trim());
    });
    projects.forEach((p) => {
      if (p.category && isValidCategory(p.category)) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [projects, projectCategories]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const title = (p.title || p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const client = (p.client || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || title.includes(q) || cat.includes(q) || desc.includes(q) || client.includes(q);
      const matchesCat = selectedCategory === 'Semua' || (p.category || 'Lainnya') === selectedCategory;
      const matchesFeatured = !onlyFeatured || featuredIds.includes(p.id);

      return matchesSearch && matchesCat && matchesFeatured;
    });
  }, [projects, searchQuery, selectedCategory, onlyFeatured, featuredIds]);

  const getCoverImage = (p: any) => {
    if (p.coverImage) return p.coverImage;
    if (p.cover) return p.cover;
    if (p.thumbnail) return p.thumbnail;
    if (p.images && p.images.length > 0) return p.images[0];
    if (p.gallery && p.gallery.length > 0) return p.gallery[0];
    return null;
  };

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      onContextMenu={handleContainerContextMenu}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--cms-bg, #0b1120)',
        color: 'var(--cms-text, #f8fafc)',
        overflowY: 'auto',
        padding: isMobile ? '16px 16px 90px' : '24px 24px 80px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Header Title & Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 16,
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245,158,11,0.3)',
                boxShadow: '0 4px 14px rgba(245,158,11,0.15)'
              }}>
                <Star size={20} fill="#f59e0b" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, color: 'var(--cms-text, #f8fafc)' }}>
                  Showcase Karya
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                  Pusat kurasi proyek, karya visual & showcase utama di website publik ({projects.length} Karya)
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              aria-label="Impor karya dari Proyek Selesai"
              onClick={() => setShowImportModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 100,
                border: '1.5px solid var(--glass-border, rgba(255,255,255,0.12))',
                background: 'var(--cms-card-bg, rgba(30,41,59,0.5))',
                color: 'var(--cms-text, #f8fafc)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Folder size={15} color="var(--cms-accent, #6366f1)" />
              <span>Impor</span>
            </button>
            <button
              type="button"
              aria-label="Tambah Karya Baru"
              onClick={() => {
                setEditingProject(null);
                setShowModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 100,
                border: 'none',
                background: 'var(--cms-accent, #6366f1)',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Plus size={16} />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: 'var(--cms-card-bg, rgba(30,41,59,0.5))',
          border: '1.5px solid var(--glass-border, rgba(255,255,255,0.08))',
          borderRadius: 18,
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{
              flex: 1,
              minWidth: 240,
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--cms-text-muted, #94a3b8)' }} />
              <input
                type="text"
                placeholder="Cari judul karya, klien, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 100,
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                  background: 'var(--cms-input-bg, rgba(15,23,42,0.6))',
                  color: 'var(--cms-text, #f8fafc)',
                  padding: '0 16px 0 38px',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Filter Featured Only */}
            <button
              onClick={() => setOnlyFeatured(!onlyFeatured)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 40,
                padding: '0 16px',
                borderRadius: 100,
                border: `1.5px solid ${onlyFeatured ? '#f59e0b' : 'var(--glass-border, rgba(255,255,255,0.1))'}`,
                background: onlyFeatured ? 'rgba(245,158,11,0.15)' : 'var(--cms-input-bg, rgba(15,23,42,0.6))',
                color: onlyFeatured ? '#f59e0b' : 'var(--cms-text-muted, #94a3b8)',
                fontSize: 12.5,
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Star size={14} fill={onlyFeatured ? '#f59e0b' : 'none'} />
              <span>Pilihan Utama ({featuredIds.length})</span>
            </button>
          </div>

          {/* Category Badges Horizontal List */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {allCategories.map((cat) => {
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    border: `1px solid ${isSel ? 'var(--cms-accent, #6366f1)' : 'var(--glass-border, rgba(255,255,255,0.08))'}`,
                    background: isSel ? 'var(--cms-accent, #6366f1)' : 'var(--cms-input-bg, rgba(15,23,42,0.4))',
                    color: isSel ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk Action Bar when items are marked */}
        {selectedIds.length > 0 && (
          <div style={{
            padding: '12px 18px',
            borderRadius: 16,
            background: 'var(--cms-card-bg, #1e293b)',
            border: '1.5px solid var(--cms-accent, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'cmsFadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                padding: '4px 10px',
                borderRadius: 8,
                background: 'rgba(99,102,241,0.2)',
                color: 'var(--cms-accent, #6366f1)',
                fontSize: 13,
                fontWeight: 900
              }}>
                {selectedIds.length} Karya Ditandai
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                  background: 'transparent',
                  color: 'var(--cms-text, #f8fafc)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {selectedIds.length === filteredProjects.length ? 'Batal' : 'Semua'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={handleBulkDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)'
                }}
              >
                <Trash2 size={15} />
                Hapus ({selectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                  background: 'transparent',
                  color: 'var(--cms-text-muted, #94a3b8)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Portfolio Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            border: '2px dashed var(--glass-border, rgba(255,255,255,0.12))',
            borderRadius: 20,
            background: 'var(--cms-card-bg, #1e293b)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted, #94a3b8)' }}>
              <ImageIcon size={26} opacity={0.5} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: 'var(--cms-text, #f8fafc)' }}>
                {projects.length === 0 ? 'Belum Ada Karya Terdaftar' : 'Tidak Ada Karya yang Cocok'}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--cms-text-muted, #94a3b8)' }}>
                {projects.length === 0
                  ? 'Mulai tambahkan proyek desain, branding, atau studi kasus pertama Anda.'
                  : 'Coba ubah kata kunci pencarian atau filter kategori di atas.'}
              </p>
            </div>
            {projects.length === 0 && (
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowModal(true);
                }}
                style={{
                  marginTop: 6,
                  padding: '8px 18px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--cms-accent, #6366f1)',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Plus size={15} /> Tambah
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16
          }}>
            {filteredProjects.map((p) => {
              const isFeatured = featuredIds.includes(p.id);
              const isSelected = selectedIds.includes(p.id);
              const cover = getCoverImage(p);
              const title = p.title || p.name || 'Tanpa Judul';

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setEditingProject(p);
                    setShowModal(true);
                  }}
                  onContextMenu={(e) => handleCardContextMenu(e, p)}
                  style={{
                    background: 'var(--cms-card-bg, #1e293b)',
                    border: `1.5px solid ${isSelected ? 'var(--cms-accent, #6366f1)' : isFeatured ? '#f59e0b' : 'var(--glass-border, rgba(255,255,255,0.1))'}`,
                    borderRadius: 18,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 8px 24px rgba(99,102,241,0.25)' : isFeatured ? '0 8px 24px rgba(245,158,11,0.2)' : '0 4px 14px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  {/* Media Preview Aspect 4:3 */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '4/3',
                    background: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {/* Multi-Select Checkbox Badge (Hanya tampil saat mode pilih aktif) */}
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectProject(p.id);
                        }}
                        title={isSelected ? 'Batalkan pilihan karya' : 'Tandai karya ini'}
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: isSelected ? 'var(--cms-accent, #6366f1)' : 'rgba(15,23,42,0.85)',
                          border: isSelected ? '2px solid #ffffff' : '1.5px solid rgba(255,255,255,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected ? (
                          <Check size={16} color="#ffffff" strokeWidth={3} />
                        ) : (
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.4)' }} />
                        )}
                      </button>
                    )}
                    {cover ? (
                      <img
                        src={cover}
                        alt={title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : p.mediaType === 'video' && p.videoUrl ? (
                      <video
                        src={p.videoUrl}
                        preload="metadata"
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--cms-text-muted, #64748b)' }}>
                        <ImageIcon size={32} opacity={0.4} />
                        <span style={{ fontSize: 11, fontWeight: 700 }}>No Cover</span>
                      </div>
                    )}

                    {/* Featured Star Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeatured(p.id);
                      }}
                      title={isFeatured ? 'Hapus dari Pilihan Utama' : 'Jadikan Pilihan Utama'}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isFeatured ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(6px)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <Star size={15} color="#ffffff" fill={isFeatured ? '#ffffff' : 'none'} />
                    </button>

                    {/* Category Tag Badge */}
                    {p.category && (
                      <div style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        padding: '3px 10px',
                        borderRadius: 100,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#ffffff'
                      }}>
                        {p.category}
                      </div>
                    )}
                  </div>

                  {/* Info Content */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <h4 style={{
                        margin: 0,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 14.5,
                        fontWeight: 800,
                        color: 'var(--cms-text, #f8fafc)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {title}
                      </h4>
                    </div>

                    {p.description && (
                      <p style={{
                        margin: 0,
                        fontSize: 12,
                        color: 'var(--cms-text-muted, #94a3b8)',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {p.description}
                      </p>
                    )}

                    {/* Bottom Actions Toolbar */}
                    <div style={{
                      marginTop: 'auto',
                      paddingTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.06))'
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #64748b)', fontWeight: 600 }}>
                        {p.client ? `Klien: ${p.client}` : p.year || 'Showcase'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(p);
                            setShowModal(true);
                          }}
                          title="Edit Karya"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                            background: 'var(--cms-input-bg, rgba(255,255,255,0.04))',
                            color: 'var(--cms-text, #f8fafc)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(p.id, title);
                          }}
                          title="Hapus Karya"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: '1px solid rgba(239,68,68,0.2)',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── MODAL: CUSTOM PROJECT CREATOR & EDITOR ── */}
      {showModal && (
        <CustomProjectModal
          initialData={editingProject}
          availableLabels={featuredLabels}
          availableCategories={projectCategories}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          onDelete={async (id) => {
            const updated = projects.filter((p) => p.id !== id);
            await storage.setItem('porto_portfolio', updated);
            setProjects(updated);
            setShowModal(false);
            setEditingProject(null);
            notify?.('✅ Karya berhasil dihapus');
          }}
          onSave={async () => {
            const updated = await storage.getItem('porto_portfolio', []);
            setProjects(Array.isArray(updated) ? updated : []);
            setShowModal(false);
            setEditingProject(null);
            notify?.('✅ Karya berhasil disimpan!');
          }}
          notify={(msg, type) => notify?.(msg, type as any)}
        />
      )}

      {/* ── MODAL: IMPORT DARI PROYEK AGENSI ── */}
      {showImportModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-project-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'cmsFadeIn 0.2s ease',
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '85vh',
              background: 'var(--cms-card-bg, #13141f)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              borderRadius: 24,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              animation: 'cmsPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(99, 102, 241, 0.15)', color: 'var(--cms-accent, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Folder size={20} />
                </div>
                <div>
                  <h3 id="import-project-modal-title" style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text)' }}>
                    Impor Karya dari Proyek Agensi
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                    Pilih proyek untuk di-showcase ke portofolio publik tanpa input ulang
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup modal impor"
                onClick={() => setShowImportModal(false)}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--cms-input-bg, rgba(255,255,255,0.06))', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Project search */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }} />
              <input
                type="text"
                placeholder="Cari judul proyek, klien, atau kategori..."
                value={importSearch}
                onChange={(e) => setImportSearch(e.target.value)}
                className="cms-input"
                style={{ width: '100%', paddingLeft: 38, height: 42, borderRadius: 100, fontSize: 13 }}
                autoFocus
              />
            </div>

            {/* List of projects */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4, maxHeight: 380 }}>
              {availableAgencyProjects
                .filter((ap) => {
                  const q = importSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (ap.title || '').toLowerCase().includes(q) ||
                         (ap.client || '').toLowerCase().includes(q) ||
                         (ap.category || '').toLowerCase().includes(q);
                })
                .map((ap) => {
                  const isDone = ap.status === 'done' || ap.status === 'selesai';
                  return (
                    <div
                      key={ap.id}
                      onClick={() => handleImportProject(ap)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                        borderRadius: 16,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cms-accent, #6366f1)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.08))'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#0f172a', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {ap.coverImage || ap.image ? (
                            <img src={ap.coverImage || ap.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Folder size={20} style={{ opacity: 0.3 }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cms-text)' }}>{ap.title || 'Proyek Tanpa Judul'}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            {ap.client && <span>Klien: {ap.client}</span>}
                            {ap.category && <span>· {ap.category}</span>}
                            {ap.date && <span>· {new Date(ap.date).toLocaleDateString('id-ID')}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 100,
                          background: isDone ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                          color: isDone ? '#10b981' : 'var(--cms-accent, #6366f1)',
                        }}>
                          {ap.status ? ap.status.toUpperCase() : 'PROYEK'}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-accent)' }}>Impor →</span>
                      </div>
                    </div>
                  );
                })}
              {availableAgencyProjects.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                  Belum ada data proyek di modul Projects. Buat proyek terlebih dahulu untuk diimpor.
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--cms-text-muted)', opacity: 0.7, marginTop: 12 }}>
              Tekan Esc untuk menutup modal
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioManager;
