import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Globe, FolderKanban, MessageSquare, Settings, UserCircle, 
  Smartphone, Monitor, Command, ArrowRight, Activity, Database, X, 
  ShoppingBag, FileText, Workflow, LayoutGrid, Plus, ExternalLink, 
  Lock, Palette, Download, Sparkles, Zap, ShieldCheck, Sun, Moon, Link as LinkIcon, Eye
} from 'lucide-react';
import { storage } from '../../utils/storage';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  pages?: any[];
  projects?: any[];
  onNavigate: (page: string) => void;
  onToggleTheme?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  pages = [], 
  projects = [], 
  onNavigate,
  onToggleTheme
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const items = [
    // ── AKSI CEPAT (QUICK ACTIONS) ──
    {
      id: 'act-new-project',
      label: 'Buat Proyek Baru (Kanban)',
      desc: 'Tambahkan kartu pekerjaan atau portofolio baru',
      icon: Plus,
      category: 'Aksi Cepat',
      badge: 'Proyek',
      action: () => {
        onNavigate('projects');
        setTimeout(() => window.dispatchEvent(new Event('porto_open_new_project')), 200);
      }
    },
    {
      id: 'act-new-product',
      label: 'Tambah Produk / Jasa Katalog',
      desc: 'Listing item baru di toko online dan katalog',
      icon: ShoppingBag,
      category: 'Aksi Cepat',
      badge: 'Katalog',
      action: () => {
        onNavigate('catalog');
        setTimeout(() => window.dispatchEvent(new Event('porto_open_new_product')), 200);
      }
    },
    {
      id: 'act-new-blog',
      label: 'Tulis Artikel Blog Baru',
      desc: 'Buat postingan blog dan panduan terkini',
      icon: FileText,
      category: 'Aksi Cepat',
      badge: 'Blog',
      action: () => {
        onNavigate('blog');
        setTimeout(() => window.dispatchEvent(new Event('porto_open_new_blog')), 200);
      }
    },
    {
      id: 'act-new-memo',
      label: 'Tulis Catatan / Ide Cepat (Memo)',
      desc: 'Simpan ide, task singkat, atau catatan kolaboratif',
      icon: Sparkles,
      category: 'Aksi Cepat',
      badge: 'Memo',
      action: () => {
        onNavigate('memo');
        setTimeout(() => window.dispatchEvent(new Event('porto_open_new_memo')), 200);
      }
    },
    {
      id: 'act-live-website-modal',
      label: 'Pratinjau Live Website (In-App Multi-Device)',
      desc: 'Buka pratinjau interaktif mode Ponsel, Tablet, dan Desktop',
      icon: Eye,
      category: 'Aksi Cepat',
      badge: 'Live Preview',
      action: () => window.dispatchEvent(new CustomEvent('cms_open_client_preview', { detail: { page: 'home' } }))
    },
    {
      id: 'act-live-website',
      label: 'Buka Website Klien Publik (Tab Baru)',
      desc: 'Buka link website langsung di tab browser terpisah',
      icon: ExternalLink,
      category: 'Aksi Cepat',
      badge: 'Browser',
      action: () => window.open('/', '_blank')
    },
    {
      id: 'act-live-biolinks',
      label: 'Buka Bio Links Publik',
      desc: 'Halaman tautan bio resmi (Instagram/TikTok link)',
      icon: LinkIcon,
      category: 'Aksi Cepat',
      badge: 'Preview',
      action: () => window.open('/links', '_blank')
    },

    // ── MODUL UTAMA (NAVIGATION) ──
    { id: 'nav-overview', label: 'Ringkasan Dashboard (Overview)', desc: 'Statistik, grafik pengunjung, dan quick metrics', icon: Globe, category: 'Modul Utama', action: () => onNavigate('overview') },
    { id: 'nav-projects', label: 'Manajemen Proyek & Portofolio', desc: 'Papan Kanban, milestone, timeline, dan tugas tim', icon: FolderKanban, category: 'Modul Utama', action: () => onNavigate('projects') },
    { id: 'nav-whiteboard', label: 'Papan Tulis Visual (Whiteboard)', desc: 'Kanvas coretan kolaboratif & diagram interaktif', icon: Workflow, category: 'Modul Utama', action: () => onNavigate('whiteboard') },
    { id: 'nav-memo', label: 'Catatan & Memo Ide', desc: 'Sticky notes, checklist, dan papan ide', icon: FileText, category: 'Modul Utama', action: () => onNavigate('memo') },
    { id: 'nav-catalog', label: 'Katalog & Toko Online', desc: 'Produk fisik/digital, harga promo, dan varian', icon: ShoppingBag, category: 'Modul Utama', action: () => onNavigate('catalog') },
    { id: 'nav-blog', label: 'Blog & Artikel Publikasi', desc: 'Manajemen artikel, tags, dan konten SEO', icon: FileText, category: 'Modul Utama', action: () => onNavigate('blog') },
    { id: 'nav-transactions', label: 'Transaksi & Pembuatan Quotation', desc: 'Penawaran harga, tagihan invoice, dan bukti transfer', icon: FileText, category: 'Modul Utama', action: () => onNavigate('transactions') },
    { id: 'nav-website', label: 'Pengaturan Konten Website Klien', desc: 'Hero banner, teks bio, menu navigasi, dan CTA', icon: Globe, category: 'Modul Utama', action: () => onNavigate('website') },
    { id: 'nav-users', label: 'Manajemen Pengguna & Akun', desc: 'Daftar klien terdaftar, hak akses admin, dan peran', icon: UserCircle, category: 'Modul Utama', action: () => onNavigate('users') },
    { id: 'nav-activity', label: 'Log Aktivitas & Audit Trail', desc: 'Catatan jejak sistem dan histori perubahan tim', icon: Activity, category: 'Modul Utama', action: () => onNavigate('activity') },
    { id: 'nav-storage', label: 'Penyimpanan & Monitor Media', desc: 'Kapasitas Cloudinary, cache gambar, dan pemakaian kuota', icon: Database, category: 'Modul Utama', action: () => onNavigate('storage') },
    { id: 'nav-chat', label: 'Live Chat & Pesan WhatsApp', desc: 'Percakapan langsung dari pengunjung website', icon: MessageSquare, category: 'Modul Utama', action: () => onNavigate('chat') },
    { id: 'nav-settings', label: 'Pengaturan Sistem, Tema & Gembok Akses', desc: 'Tema glassmorphism, warna aksen, kata sandi proteksi', icon: Settings, category: 'Modul Utama', action: () => onNavigate('settings') },

    // ── HALAMAN VISUAL (LP IMAGE) ──
    { id: 'page-home', label: 'Edit Halaman: LP Image Home', desc: 'Landing page visual utama dengan sticker & frame', icon: Globe, category: 'Halaman Visual', action: () => onNavigate('home') },
    { id: 'page-porto', label: 'Edit Halaman: LP Image Portofolio', desc: 'Galeri portofolio visual interaktif', icon: Globe, category: 'Halaman Visual', action: () => onNavigate('portofolio') },
    { id: 'page-bio', label: 'Edit Halaman: LP Image Biodata', desc: 'Profil diri visual, pendidikan, dan pengalaman', icon: Globe, category: 'Halaman Visual', action: () => onNavigate('biodata') },
    
    ...(pages || []).filter(p => !p.isSystem && !p.isDeleted).map(p => ({
      id: `custom-page-${p.slug}`,
      label: `Edit Halaman: ${p.name || p.slug}`,
      desc: `Halaman kustom (/lpimage/${p.slug})`,
      icon: Globe,
      category: 'Halaman Kustom',
      action: () => onNavigate(p.slug)
    })),

    // ── PROYEK AKTIF ──
    ...(projects || []).slice(0, 6).map(p => ({
      id: `proj-${p.id}`,
      label: `Buka Proyek: ${p.title || 'Untitled'}`,
      desc: `Status: ${p.status || 'todo'} • Progress: ${p.progress || 0}%`,
      icon: FolderKanban,
      category: 'Proyek Aktif',
      action: () => {
        onNavigate('projects');
        setTimeout(() => window.dispatchEvent(new CustomEvent('porto_open_project', { detail: p.id })), 150);
      }
    }))
  ];

  const q = query.toLowerCase().trim();
  const filteredItems = items.filter(item => 
    !q ||
    item.label.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    (item.desc && item.desc.toLowerCase().includes(q))
  ).slice(0, 10);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="command-palette-overlay"
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0, 0, 0, 0.65)', 
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999, 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'center', 
        padding: 'max(40px, 8vh) 16px 40px',
        animation: 'cmsFadeIn 0.2s ease-out',
        cursor: 'pointer'
      }}
    >
      <div 
        className="command-palette-card"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: '100%', 
          maxWidth: 620, 
          background: 'var(--cms-card-bg, #181926)', 
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderRadius: 24, 
          border: '1.5px solid var(--glass-border, rgba(255, 255, 255, 0.12))', 
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)', 
          overflow: 'hidden', 
          animation: 'cmsModalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'default',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(580px, 80vh)'
        }}
      >
        {/* Search Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '14px 18px', 
          borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))', 
          gap: 10,
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))',
            color: 'var(--cms-accent, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Search size={16} strokeWidth={2.5} />
          </div>
          <input 
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query.trim() && filteredItems.length === 0) {
                // Auto Search via Google on direct Enter if no internal items match
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank');
                onClose();
              }
            }}
            placeholder="Ketik untuk cari modul, aksi kilat, atau cari web..."
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              fontSize: 14, 
              fontWeight: 700, 
              color: 'var(--cms-text, #fff)', 
              outline: 'none',
              fontFamily: "'Outfit', sans-serif"
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '2px 7px', borderRadius: 6,
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              color: 'var(--cms-text-muted, #94a3b8)',
              fontSize: 10, fontWeight: 800
            }}>
              Ctrl+K
            </span>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: 'var(--cms-text-muted, #94a3b8)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Tutup (ESC)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Web Browser & AI Toolbar Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
          borderBottom: '1px solid var(--glass-border)',
          flexWrap: 'wrap'
        }}>
          {/* Direct Google Browser Search Pill */}
          <div
            onClick={() => {
              if (query.trim()) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(query.trim())}`, '_blank');
                onClose();
              } else {
                window.open('https://www.google.com', '_blank');
              }
            }}
            style={{
              flex: 1,
              minWidth: 160,
              height: 32,
              borderRadius: 100,
              background: 'var(--cms-card-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px 0 10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>🌐</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text-muted)' }}>
                {query.trim() ? `Cari "${query.slice(0, 18)}..." di Web` : 'Cari di Google / Web...'}
              </span>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--cms-accent, #3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={11} />
            </div>
          </div>

          {/* Tanya AI Assistant Pill */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('porto_open_ai_assistant', { detail: { query: query.trim() } }));
              onClose();
            }}
            style={{
              height: 32,
              padding: '0 12px',
              borderRadius: 100,
              background: 'linear-gradient(135deg, #f97316, #ec4899)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11.5,
              fontWeight: 850,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(249, 115, 22, 0.3)',
              flexShrink: 0
            }}
          >
            <Sparkles size={13} />
            <span>Tanya AI</span>
          </button>
        </div>

        {/* Search Results List */}
        <div style={{ padding: '6px 8px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 3, scrollbarWidth: 'thin' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--cms-text-muted)' }}>
              <Search size={28} style={{ opacity: 0.25, margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Tekan Enter untuk mencari "{query}" di Web</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Atau klik tombol "Cari di Web" di atas untuk buka tab browser baru.</div>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              const IconComp = item.icon || Globe;

              return (
                <div 
                  key={item.id}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => { item.action(); onClose(); }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    padding: '8px 12px', 
                    borderRadius: 12, 
                    cursor: 'pointer',
                    background: isSelected ? 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))' : 'transparent',
                    border: `1.5px solid ${isSelected ? 'var(--cms-accent, #7c3aed)' : 'transparent'}`,
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ 
                    width: 30, 
                    height: 30, 
                    borderRadius: 8, 
                    background: isSelected ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.06))', 
                    color: isSelected ? '#ffffff' : 'var(--cms-accent, #7c3aed)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.12s'
                  }}>
                    <IconComp size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ 
                        fontSize: 12.5, 
                        fontWeight: 800, 
                        color: 'var(--cms-text)',
                        fontFamily: "'Outfit', sans-serif",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 900,
                          padding: '1px 5px', borderRadius: 5,
                          background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))',
                          color: 'var(--cms-accent, #7c3aed)'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: 9.5, fontWeight: 750, 
                    color: 'var(--cms-text-muted)', 
                    padding: '2px 7px', borderRadius: 6,
                    background: isSelected ? 'rgba(255,255,255,0.1)' : 'var(--cms-switcher-bg)',
                    flexShrink: 0
                  }}>
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div style={{ 
          padding: '10px 18px', 
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))', 
          borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.08))', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--cms-text-muted)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span><kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>↑↓</kbd> Navigasi</span>
            <span><kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>↵</kbd> Pilih</span>
            <span><kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>ESC</kbd> Tutup</span>
          </div>
          <div style={{ color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
            <Zap size={12} /> Antigravity CMS Powerhouse
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
