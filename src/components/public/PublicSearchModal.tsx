import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  FolderKanban, 
  BookOpen, 
  ShoppingBag, 
  Layers, 
  Compass, 
  ArrowRight, 
  X, 
  Sparkles,
  CornerDownLeft
} from 'lucide-react';
import { storage } from '../../utils/storage';
import type { BlogPostType } from '../../pages/Blog';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'project' | 'blog' | 'product' | 'page';
  url: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge?: string;
}

interface PublicSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export const PublicSearchModal: React.FC<PublicSearchModalProps> = ({
  isOpen,
  onClose,
  accentColor = '#7c3aed',
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'project' | 'blog' | 'product' | 'page'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Native 1-step back navigation
  useNativeBackHandler(isOpen, onClose, 'public_search_modal', 10);

  // Data states
  const [projects, setProjects] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<BlogPostType[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customPages, setCustomPages] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load all searchable content
  useEffect(() => {
    if (!isOpen) return;

    const loadAllContent = async () => {
      try {
        const [projRes, blogRes, prodRes, settingsRes] = await Promise.all([
          storage.getItem('porto_portfolio', []),
          storage.getItem('porto_blog_posts', []),
          storage.getItem('porto_catalog_products', []),
          storage.getItem('porto_settings', {}),
        ]);

        setProjects(Array.isArray(projRes) ? projRes : []);
        setBlogs(Array.isArray(blogRes) ? blogRes.filter((b: BlogPostType) => b.status === 'Published') : []);
        setProducts(Array.isArray(prodRes) ? prodRes.filter((p: any) => p.status !== 'draft') : []);
        
        const pages = settingsRes?.customPages || [];
        setCustomPages(Array.isArray(pages) ? pages.filter((p: any) => p.isPublished) : []);
      } catch (err) {
        console.error('[PublicSearchModal] Failed to load search data', err);
      }
    };

    loadAllContent();
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveFilter('all');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Built-in static pages
  const staticPages: SearchResultItem[] = useMemo(() => [
    {
      id: 'page-home',
      title: 'Home (Beranda)',
      subtitle: 'Halaman utama dan sorotan profil',
      category: 'page',
      url: '/',
      icon: Compass,
      badge: 'Utama',
    },
    {
      id: 'page-portfolio',
      title: 'Portfolio',
      subtitle: 'Galeri semua karya dan studi kasus',
      category: 'page',
      url: '/portfolio',
      icon: FolderKanban,
      badge: 'Karya',
    },
    {
      id: 'page-about',
      title: 'Tentang Saya (About)',
      subtitle: 'Biodata, pengalaman kerja, pendidikan & keahlian',
      category: 'page',
      url: '/about',
      icon: Compass,
      badge: 'Profil',
    },
    {
      id: 'page-blog',
      title: 'Artikel & Blog',
      subtitle: 'Wawasan desain, tips, dan tutorial',
      category: 'page',
      url: '/blog',
      icon: BookOpen,
      badge: 'Bacaan',
    },
    {
      id: 'page-katalog',
      title: 'Katalog & Layanan',
      subtitle: 'Daftar produk digital, jasa & voucher promo',
      category: 'page',
      url: '/katalog',
      icon: ShoppingBag,
      badge: 'Toko',
    },
    {
      id: 'page-links',
      title: 'Biolink / Social Links',
      subtitle: 'Tautan media sosial dan profil cepat',
      category: 'page',
      url: '/links',
      icon: Compass,
      badge: 'Link',
    },
  ], []);

  // Aggregate all items
  const allItems = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [...staticPages];

    // Projects
    projects.forEach((p) => {
      list.push({
        id: `proj-${p.id}`,
        title: p.title || 'Untitled Project',
        subtitle: p.subtitle || p.category || 'Portfolio Project',
        category: 'project',
        url: `/portfolio?item=${p.id}`,
        icon: FolderKanban,
        badge: p.category || 'Project',
      });
    });

    // Blogs
    blogs.forEach((b) => {
      list.push({
        id: `blog-${b.id}`,
        title: b.title,
        subtitle: b.category ? `Kategori: ${b.category} • ${b.date}` : b.date,
        category: 'blog',
        url: `/blog/${b.slug || b.id}`,
        icon: BookOpen,
        badge: b.category || 'Artikel',
      });
    });

    // Products
    products.forEach((prod) => {
      list.push({
        id: `prod-${prod.id}`,
        title: prod.title || prod.name || 'Produk',
        subtitle: prod.price ? `Rp ${Number(prod.price).toLocaleString('id-ID')} • ${prod.category || 'Katalog'}` : (prod.category || 'Produk'),
        category: 'product',
        url: `/katalog?product=${prod.id}`,
        icon: ShoppingBag,
        badge: prod.category || 'Produk',
      });
    });

    // Custom Pages
    customPages.forEach((cp) => {
      list.push({
        id: `cp-${cp.slug}`,
        title: cp.title || cp.slug,
        subtitle: `Halaman khusus: /${cp.slug}`,
        category: 'page',
        url: `/${cp.slug}`,
        icon: Layers,
        badge: 'Halaman',
      });
    });

    return list;
  }, [staticPages, projects, blogs, products, customPages]);

  // Filtered by query & active filter
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchFilter = activeFilter === 'all' || item.category === activeFilter;
      if (!matchFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    });
  }, [allItems, query, activeFilter]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredItems.length - 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex];
          onClose();
          navigate(item.url);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, navigate]);

  // Keep selected item visible in list
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const modalBg = isDark ? '#0f172a' : '#ffffff';
  const modalBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.72)', // Clean dark overlay without blur
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '10vh 16px 20px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          height: 520, // FIXED HEIGHT: Prevents modal jumping/resizing when category changes!
          maxHeight: '80vh',
          background: modalBg,
          borderRadius: 20,
          border: `1px solid ${modalBorder}`,
          boxShadow: isDark
            ? '0 25px 60px -10px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)'
            : '0 25px 60px -10px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'cmsModalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Search Input Bar (Fixed 60px) */}
        <div
          style={{
            height: 60,
            minHeight: 60,
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${modalBorder}`,
            background: modalBg,
          }}
        >
          <Search size={20} style={{ color: accentColor, flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Cari artikel, portfolio, produk katalog, atau halaman..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: textColor,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15,
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: subTextColor,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${modalBorder}`,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              color: subTextColor,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ESC
          </button>
        </div>

        {/* Filter Categories Chips (Fixed 52px height) */}
        <div
          style={{
            height: 52,
            minHeight: 52,
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            borderBottom: `1px solid ${modalBorder}`,
            background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { id: 'all', label: 'Semua' },
            { id: 'project', label: 'Portfolio' },
            { id: 'blog', label: 'Artikel Blog' },
            { id: 'product', label: 'Katalog' },
            { id: 'page', label: 'Halaman' },
          ].map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFilter(f.id as any);
                  setSelectedIndex(0);
                }}
                style={{
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 100,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  fontSize: 13,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  border: active ? '1px solid transparent' : `1px solid ${modalBorder}`,
                  background: active ? accentColor : (isDark ? 'rgba(255,255,255,0.06)' : '#ffffff'),
                  color: active ? '#ffffff' : subTextColor,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.15s, color 0.15s',
                  boxShadow: active ? `0 2px 8px ${accentColor}40` : 'none',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Results List (Flex 1 Auto-Scroll) */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            height: 0,
            overflowY: 'auto',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            scrollbarWidth: 'thin',
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
                color: subTextColor,
                gap: 8,
              }}
            >
              <Sparkles size={28} style={{ opacity: 0.4, color: accentColor }} />
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: textColor }}>
                Tidak ada hasil untuk "{query}"
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                Coba pilih kategori lain atau kata kunci yang berbeda.
              </div>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onClose();
                    navigate(item.url);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    cursor: 'pointer',
                    background: isSelected
                      ? isDark
                        ? `${accentColor}22`
                        : `${accentColor}12`
                      : 'transparent',
                    border: isSelected ? `1px solid ${accentColor}44` : '1px solid transparent',
                    transition: 'background 0.12s, border-color 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isSelected ? accentColor : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: isSelected ? '#ffffff' : accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={17} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 14,
                          fontWeight: 700,
                          color: textColor,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12,
                            color: subTextColor,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {item.badge && (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                          color: subTextColor,
                          fontSize: 11,
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft size={14} style={{ color: accentColor, opacity: 0.8 }} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar (Fixed 44px) */}
        <div
          style={{
            height: 44,
            minHeight: 44,
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: '0 20px',
            borderTop: `1px solid ${modalBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            color: subTextColor,
          }}
        >
          <div style={{ display: 'flex', gap: 14 }}>
            <span><kbd style={{ padding: '2px 5px', borderRadius: 4, background: isDark ? '#1e293b' : '#e2e8f0', fontSize: 10, fontWeight: 700 }}>↑↓</kbd> Navigasi</span>
            <span><kbd style={{ padding: '2px 5px', borderRadius: 4, background: isDark ? '#1e293b' : '#e2e8f0', fontSize: 10, fontWeight: 700 }}>↵</kbd> Buka</span>
          </div>
          <div>{filteredItems.length} hasil ditemukan</div>
        </div>
      </div>
    </div>
  );
};

export default PublicSearchModal;
