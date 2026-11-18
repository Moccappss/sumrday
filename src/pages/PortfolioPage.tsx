import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight,
  Search,
  Sparkles,
  FolderGit2,
  LayoutGrid,
  Columns,
  Layers,
  Image as ImageIcon,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  MessageCircle,
  Calendar,
  Building2,
  RotateCcw,
  SlidersHorizontal,
  Box,
  BookOpen
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getCloudinaryPdfPageUrl } from '../utils/cloudinary';
import { useLandingData } from '../components/landing/useLandingData';
import LPProjectModal from '../components/landing/LPProjectModal';
import LPNavbar from '../components/landing/LPNavbar';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import LPFooter from '../components/landing/LPFooter';
import SEOHelmet from '../components/SEOHelmet';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import PageHeroHeader from '../components/common/PageHeroHeader';
import { haptic } from '../utils/haptics';

type ViewMode = 'grid' | 'masonry' | 'compact';
type SortOption = 'newest' | 'featured' | 'az';

const PortfolioPage: React.FC = () => {
  const { data, projects, isLoading } = useLandingData();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [selectedYear, setSelectedYear] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('porto_gallery_view_mode') as ViewMode;
      if (saved === 'grid' || saved === 'masonry' || saved === 'compact') return saved;
    }
    return 'grid';
  });

  // Lightbox state for high-impact in-page photo exploration
  const [lightboxState, setLightboxState] = useState<{
    project: any;
    imageIndex: number;
    zoomLevel: number;
  } | null>(null);

  // Synchronize URL deep-link /portfolio/:id or /karya/:id with selected project
  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const pathParts = location.pathname.split('/').filter(Boolean);
    const searchParams = new URLSearchParams(location.search);
    let targetId = params.id || searchParams.get('project') || searchParams.get('id');
    if (!targetId && pathParts.length >= 2 && (pathParts[0] === 'portofolio' || pathParts[0] === 'portfolio' || pathParts[0] === 'karya')) {
      targetId = pathParts[1];
    }

    if (targetId) {
      const decodedId = decodeURIComponent(targetId);
      const lowerId = decodedId.toLowerCase();
      const found = projects.find((p: any) =>
        String(p.id) === decodedId ||
        String(p.id).toLowerCase() === lowerId ||
        (p.slug && String(p.slug).toLowerCase() === lowerId) ||
        (p.name && p.name.toLowerCase().replace(/\s+/g, '-') === lowerId) ||
        (p.title && p.title.toLowerCase().replace(/\s+/g, '-') === lowerId)
      );
      if (found) {
        setSelectedProject(found);
      }
    } else {
      setSelectedProject(null);
    }
  }, [location.pathname, location.search, params.id, projects]);

  useScrollReveal(containerRef, [projects, activeCategory, searchQuery, viewMode, selectedYear, sortBy]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSetViewMode = (mode: ViewMode) => {
    haptic.selection();
    setViewMode(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('porto_gallery_view_mode', mode);
    }
  };

  // Unified website theme hook
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);

  const [accentColor, setAccentColor] = useState<string>(() =>
    (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) ||
    data?.theme?.accentColor || '#64748b'
  );

  useEffect(() => {
    if (data?.theme?.accentColor) {
      setAccentColor(data.theme.accentColor);
    }
  }, [data?.theme?.accentColor]);

  useEffect(() => {
    const handleAccent = (e: any) => {
      if (e?.detail?.color) setAccentColor(e.detail.color);
    };
    window.addEventListener('porto_accent_color_changed', handleAccent);
    return () => window.removeEventListener('porto_accent_color_changed', handleAccent);
  }, []);

  // Force body/html/root scrollable
  useLandingBodyFix();

  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#181b26' : '#f1f3f7';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';

  // Contact WA target for consultation
  const waTarget = useMemo(() => {
    const fromMethods = data?.contactMethods?.find((m: any) => m.id === 'whatsapp')?.value;
    const raw = fromMethods || data?.footer?.phone || data?.hero?.ctaWhatsapp || '6281234567890';
    return raw.replace(/[^0-9]/g, '');
  }, [data]);

  // Extract all media items for a given project
  const getAllProjectMedia = useCallback((p: any): string[] => {
    if (!p) return [];
    const list: string[] = [];
    if (p.coverImage && typeof p.coverImage === 'string') list.push(p.coverImage);
    if (Array.isArray(p.images)) {
      p.images.forEach((img: any) => {
        if (typeof img === 'string' && img && !list.includes(img)) list.push(img);
      });
    }
    if (Array.isArray(p.attachments)) {
      p.attachments.forEach((att: any) => {
        if (att && att.url && typeof att.url === 'string' && (!att.type || att.type.startsWith('image/')) && !list.includes(att.url)) {
          list.push(att.url);
        }
      });
    }
    if (list.length === 0 && p.mediaType === 'youtube' && p.youtubeUrl) {
      const m = p.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
      if (m && m[1]) list.push(`https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`);
    }
    if (list.length === 0 && (p.mediaType === 'flipbook' || p.pdfUrl) && p.pdfUrl) {
      const pdfPage = getCloudinaryPdfPageUrl(p.pdfUrl, 1, 800);
      if (pdfPage) list.push(pdfPage);
    }
    return list;
  }, []);

  const getProjectCover = useCallback((p: any): string | null => {
    const media = getAllProjectMedia(p);
    return media.length > 0 ? media[0] : null;
  }, [getAllProjectMedia]);

  const categories = useMemo(() => {
    const fromProjects = Array.isArray(projects) ? projects.map((p) => p.category).filter(Boolean) : [];
    const fromConfig = Array.isArray(data?.projectCategories) ? data.projectCategories : [];
    const set = Array.from(new Set([...fromConfig, ...fromProjects])).filter(Boolean);
    return ['Semua', ...set];
  }, [data?.projectCategories, projects]);

  const availableYears = useMemo(() => {
    if (!Array.isArray(projects)) return ['Semua'];
    const years = projects
      .map((p: any) => p.year ? String(p.year).trim() : null)
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
    return ['Semua', ...unique];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const list = Array.isArray(projects) ? [...projects] : [];
    const q = searchQuery.trim().toLowerCase();

    // 1. Filter
    const filtered = list.filter((p: any) => {
      // Category filter
      const matchCat = activeCategory === 'Semua' || (p.category || '').toLowerCase() === activeCategory.toLowerCase();
      if (!matchCat) return false;

      // Year filter
      if (selectedYear !== 'Semua') {
        const pYear = p.year ? String(p.year).trim() : '';
        if (pYear !== selectedYear) return false;
      }

      // Search query
      if (!q) return true;
      const matchTitle = (p.name || p.title || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const clientStr = (p.client || '').toLowerCase();
      const tagsStr = Array.isArray(p.tags) ? p.tags.join(' ') : (typeof p.tags === 'string' ? p.tags : '');
      const matchTag = tagsStr.toLowerCase().includes(q);
      return matchTitle || matchDesc || clientStr.includes(q) || matchTag;
    });

    // 2. Sort
    filtered.sort((a: any, b: any) => {
      if (sortBy === 'featured') {
        const aFeat = a.featuredLabel ? 1 : 0;
        const bFeat = b.featuredLabel ? 1 : 0;
        if (bFeat !== aFeat) return bFeat - aFeat;
      }
      if (sortBy === 'az') {
        const aTitle = (a.name || a.title || '').toLowerCase();
        const bTitle = (b.name || b.title || '').toLowerCase();
        return aTitle.localeCompare(bTitle);
      }
      // 'newest' default
      const aYear = parseInt(String(a.year || '0'), 10) || 0;
      const bYear = parseInt(String(b.year || '0'), 10) || 0;
      return bYear - aYear;
    });

    return filtered;
  }, [projects, activeCategory, selectedYear, sortBy, searchQuery]);

  // Keyboard navigation & body scroll lock for Lightbox
  useEffect(() => {
    if (!lightboxState) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxState(null);
      } else if (e.key === 'ArrowRight') {
        handleLightboxNext();
      } else if (e.key === 'ArrowLeft') {
        handleLightboxPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxState]);

  const handleOpenLightbox = (project: any, e?: React.MouseEvent, initialIndex = 0) => {
    if (e) e.stopPropagation();
    haptic.selection();
    setLightboxState({
      project,
      imageIndex: initialIndex,
      zoomLevel: 1,
    });
  };

  const handleLightboxNext = () => {
    if (!lightboxState) return;
    const media = getAllProjectMedia(lightboxState.project);
    if (media.length <= 1) return;
    haptic.light();
    setLightboxState((prev) => prev ? ({
      ...prev,
      imageIndex: (prev.imageIndex + 1) % media.length,
      zoomLevel: 1
    }) : null);
  };

  const handleLightboxPrev = () => {
    if (!lightboxState) return;
    const media = getAllProjectMedia(lightboxState.project);
    if (media.length <= 1) return;
    haptic.light();
    setLightboxState((prev) => prev ? ({
      ...prev,
      imageIndex: (prev.imageIndex - 1 + media.length) % media.length,
      zoomLevel: 1
    }) : null);
  };

  const handleToggleZoom = () => {
    haptic.selection();
    setLightboxState((prev) => {
      if (!prev) return null;
      const nextZoom = prev.zoomLevel === 1 ? 1.6 : prev.zoomLevel === 1.6 ? 2.2 : 1;
      return { ...prev, zoomLevel: nextZoom };
    });
  };

  const handleQuickWhatsAppInquiry = (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.medium();
    const projName = project.name || project.title || 'Proyek Desain';
    const text = encodeURIComponent(
      `Halo! Saya melihat portofolio Anda untuk proyek "${projName}" di website.\n\nBisakah kita berdiskusi atau konsultasi untuk konsep serupa? Terima kasih!`
    );
    window.open(`https://wa.me/${waTarget}?text=${text}`, '_blank');
  };

  const handleResetFilters = () => {
    haptic.selection();
    setActiveCategory('Semua');
    setSelectedYear('Semua');
    setSearchQuery('');
    setSortBy('newest');
  };

  if (isLoading) return <div style={{ minHeight: '100vh', background: isDark ? '#06070a' : '#eef2f6' }} />;

  return (
    <>
      <SEOHelmet
        title={`Portfolio & Galeri Karya - ${data.hero?.headline || 'Studio Desain & Kreatif'}`}
        description="Eksplorasi karya visual, portofolio desain, identitas branding, serta studi kasus digital interaktif."
      />

      {/* Floating Top Navbar */}
      <LPNavbar
        items={(data?.navbar?.items || []) as any}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        isDark={isDark}
        accentColor={accentColor}
      />

      <div
        ref={containerRef}
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? '#06070a' : '#eef2f6',
          color: textColor,
          transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <main style={{ flex: 1, padding: isMobile ? '90px 16px 60px' : '112px clamp(16px, 3.5vw, 24px) 80px', maxWidth: 1240, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

          {/* Page Hero Header */}
          <PageHeroHeader
            isDark={isDark}
            bgPattern={(data?.pagesHeader as any)?.portfolio?.bgPattern || 'grid'}
            badgeIcon={<Sparkles size={14} />}
            badgeText={data?.pagesHeader?.portfolio?.badge || 'Koleksi Portofolio & Display Karya'}
            title={data?.pagesHeader?.portfolio?.title || 'Galeri Karya & Studi Kasus'}
            highlightText={data?.pagesHeader?.portfolio?.highlight || 'Studi Kasus'}
            description={data?.pagesHeader?.portfolio?.description || 'Eksplorasi kurasi karya desain grafis, antarmuka visual, identitas brand, serta studi kasus proyek unggulan.'}
            accentColor={accentColor}
            textColor={textColor}
            subTextColor={subTextColor}
            stats={[
              { icon: <FolderGit2 size={15} />, value: Array.isArray(projects) ? projects.length : 0, label: 'Total Proyek' },
              { icon: <Sparkles size={15} />, value: Math.max(1, categories.length - 1), label: 'Kategori' },
              { icon: <ArrowUpRight size={15} />, value: filteredProjects.length, label: 'Ditampilkan' }
            ]}
          >
            {/* Quick in-page search input */}
            <div style={{
              position: 'relative',
              maxWidth: 460,
              margin: '0 auto'
            }}>
              <Search size={16} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama karya, klien, topik, atau software..."
                style={{
                  width: '100%',
                  padding: '13px 40px 13px 46px',
                  borderRadius: 100,
                  border: `1.5px solid ${cardBorder}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: textColor,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  boxShadow: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = cardBorder;
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: subTextColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                  }}
                  title="Hapus pencarian"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </PageHeroHeader>

          {/* Controls Bar: Category Chips, Year, Sort, and View Mode Switcher */}
          <div style={{
            background: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(248, 250, 252, 0.85)',
            border: `1px solid ${cardBorder}`,
            borderRadius: 20,
            padding: isMobile ? '14px 14px' : '16px 20px',
            marginBottom: 32,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 12 : 16,
          }}>
            {/* Top Row: Categories (Strict Single-Line Horizontal Scroll) */}
            <div
              className="chip-scroll"
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                gap: 8,
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: '2px 2px 4px 2px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                const count = cat === 'Semua'
                  ? (Array.isArray(projects) ? projects.length : 0)
                  : (Array.isArray(projects) ? projects.filter((p: any) => (p.category || '').toLowerCase() === cat.toLowerCase()).length : 0);

                return (
                  <button
                    key={cat}
                    type="button"
                    className="cms-pill-filter"
                    onClick={() => {
                      haptic.selection();
                      setActiveCategory(cat);
                    }}
                    style={{
                      flexShrink: 0,
                      height: 36,
                      minHeight: 36,
                      maxHeight: 36,
                      padding: '0 14px',
                      borderRadius: 9999,
                      border: `1.5px solid ${isActive ? accentColor : cardBorder}`,
                      background: isActive ? accentColor : isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                      color: isActive ? '#ffffff' : subTextColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isActive ? `0 4px 12px ${accentColor}38` : 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', lineHeight: 1 }}>{cat}</span>
                    <span style={{
                      fontSize: 11,
                      lineHeight: 1,
                      height: 20,
                      minWidth: 20,
                      padding: '0 6px',
                      borderRadius: 9999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isActive ? 0.95 : 0.7,
                      background: isActive ? 'rgba(0,0,0,0.22)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row: Year, Sort, Display Status, and View Mode Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              gap: isMobile ? 8 : 12,
              borderTop: `1px solid ${cardBorder}`,
              paddingTop: isMobile ? 12 : 14,
            }}>
              {/* Left Side: Filter by Year & Sort Dropdown */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 10,
                flexWrap: 'nowrap',
                minWidth: 0,
                flex: isMobile ? '1 1 auto' : '0 1 auto',
                overflowX: isMobile ? 'auto' : 'visible',
                scrollbarWidth: 'none',
              }}>
                {availableYears.length > 2 && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 9999,
                    border: `1px solid ${cardBorder}`,
                    background: isDark ? 'rgba(30, 41, 59, 0.75)' : '#ffffff',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}>
                    <Calendar size={13} style={{ color: subTextColor, flexShrink: 0 }} />
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        haptic.selection();
                        setSelectedYear(e.target.value);
                      }}
                      className="clean-input"
                      style={{
                        padding: '0 2px',
                        border: 'none',
                        background: 'transparent',
                        color: textColor,
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        height: '100%',
                      }}
                    >
                      <option value="Semua" style={{ background: isDark ? '#0f172a' : '#ffffff', color: textColor }}>Semua Tahun</option>
                      {availableYears.filter((y) => y !== 'Semua').map((yr) => (
                        <option key={yr} value={yr} style={{ background: isDark ? '#0f172a' : '#ffffff', color: textColor }}>Tahun {yr}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 9999,
                  border: `1px solid ${cardBorder}`,
                  background: isDark ? 'rgba(30, 41, 59, 0.75)' : '#ffffff',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}>
                  <SlidersHorizontal size={13} style={{ color: subTextColor, flexShrink: 0 }} />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      haptic.selection();
                      setSortBy(e.target.value as SortOption);
                    }}
                    className="clean-input"
                    style={{
                      padding: '0 2px',
                      border: 'none',
                      background: 'transparent',
                      color: textColor,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12.5,
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                      height: '100%',
                    }}
                  >
                    <option value="newest" style={{ background: isDark ? '#0f172a' : '#ffffff', color: textColor }}>Urut: Terbaru</option>
                    <option value="featured" style={{ background: isDark ? '#0f172a' : '#ffffff', color: textColor }}>Urut: Pilihan</option>
                    <option value="az" style={{ background: isDark ? '#0f172a' : '#ffffff', color: textColor }}>Urut: A-Z</option>
                  </select>
                </div>

                {(activeCategory !== 'Semua' || selectedYear !== 'Semua' || searchQuery || sortBy !== 'newest') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      height: 36,
                      padding: isMobile ? '0 10px' : '0 12px',
                      borderRadius: 9999,
                      border: 'none',
                      background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                    title="Reset Filter"
                  >
                    <RotateCcw size={12} />
                    {!isMobile && <span style={{ whiteSpace: 'nowrap' }}>Reset Filter</span>}
                  </button>
                )}
              </div>

              {/* Right Side: View Mode Switcher & Counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: subTextColor,
                  fontWeight: 500,
                  display: isMobile ? 'none' : 'inline',
                  whiteSpace: 'nowrap',
                }}>
                  Menampilkan <strong style={{ color: textColor }}>{filteredProjects.length}</strong> karya
                </span>

                {/* View Mode Buttons */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 36,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  padding: 3,
                  borderRadius: 9999,
                  border: `1px solid ${cardBorder}`,
                  boxSizing: 'border-box',
                  gap: 2,
                  flexShrink: 0,
                }}>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('grid')}
                    title="Tampilan Grid Standar"
                    style={{
                      height: 28,
                      minWidth: isMobile ? 32 : undefined,
                      padding: isMobile ? '0 8px' : '0 10px',
                      borderRadius: 9999,
                      border: 'none',
                      background: viewMode === 'grid' ? accentColor : 'transparent',
                      color: viewMode === 'grid' ? '#ffffff' : subTextColor,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <LayoutGrid size={14} />
                    <span style={{ display: isMobile ? 'none' : 'inline', whiteSpace: 'nowrap' }}>Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetViewMode('masonry')}
                    title="Tampilan Masonry Editorial"
                    style={{
                      height: 28,
                      minWidth: isMobile ? 32 : undefined,
                      padding: isMobile ? '0 8px' : '0 10px',
                      borderRadius: 9999,
                      border: 'none',
                      background: viewMode === 'masonry' ? accentColor : 'transparent',
                      color: viewMode === 'masonry' ? '#ffffff' : subTextColor,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Columns size={14} />
                    <span style={{ display: isMobile ? 'none' : 'inline', whiteSpace: 'nowrap' }}>Editorial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetViewMode('compact')}
                    title="Tampilan List Ramping"
                    style={{
                      height: 28,
                      minWidth: isMobile ? 32 : undefined,
                      padding: isMobile ? '0 8px' : '0 10px',
                      borderRadius: 9999,
                      border: 'none',
                      background: viewMode === 'compact' ? accentColor : 'transparent',
                      color: viewMode === 'compact' ? '#ffffff' : subTextColor,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Layers size={14} />
                    <span style={{ display: isMobile ? 'none' : 'inline', whiteSpace: 'nowrap' }}>Ramping</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 ? (
            <div style={{
              padding: '70px 24px',
              textAlign: 'center',
              background: cardBg,
              borderRadius: 24,
              border: `1px solid ${cardBorder}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `${accentColor}18`,
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FolderGit2 size={30} />
              </div>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: textColor }}>
                Belum Ada Karya yang Cocok
              </h3>
              <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor, maxWidth: 420, lineHeight: 1.5 }}>
                {searchQuery
                  ? `Tidak ada karya ditemukan dengan kata kunci "${searchQuery}". Coba gunakan istilah umum atau reset filter.`
                  : `Kategori "${activeCategory}" belum memiliki karya untuk tahun yang dipilih.`}
              </p>
              <button
                onClick={handleResetFilters}
                style={{
                  marginTop: 6,
                  padding: '10px 22px',
                  borderRadius: 100,
                  border: `1.5px solid ${accentColor}`,
                  background: accentColor,
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: 'none',
                }}
              >
                <RotateCcw size={14} />
                <span>Tampilkan Semua Karya</span>
              </button>
            </div>
          ) : (
            /* Render Based on View Mode */
            <>
              {/* 1. MASONRY VIEW MODE */}
              {viewMode === 'masonry' && (
                <div style={{
                  columnCount: isMobile ? 1 : 3,
                  columnGap: 24,
                }}>
                  {filteredProjects.map((project: any, idx: number) => {
                    const cover = getProjectCover(project);
                    const mediaList = getAllProjectMedia(project);
                    const hasVideo = project.mediaType === 'youtube' || project.mediaType === 'video' || Boolean(project.youtubeUrl) || Boolean(project.videoUrl);
                    const is3D = project.mediaType === '3d' || Boolean(project.model3dUrl);
                    const isFlipbook = project.mediaType === 'flipbook' || Boolean(project.pdfUrl);

                    return (
                      <div
                        key={project.id || idx}
                        data-reveal="true"
                        style={{
                          breakInside: 'avoid',
                          marginBottom: 24,
                          background: cardBg,
                          borderRadius: 22,
                          padding: 12,
                          overflow: 'hidden',
                          border: `1px solid ${cardBorder}`,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: 'none',
                          transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        data-card-3d="true"
                        onClick={() => {
                          haptic.selection();
                          setSelectedProject(project);
                          navigate(`/portofolio/${project.id}`);
                        }}
                      >
                        {/* Media Cover with Natural Aspect */}
                        <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', background: isDark ? '#0f172a' : '#f1f5f9' }}>
                          {cover ? (
                            <img
                              src={cover}
                              alt={project.name || project.title}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor, fontSize: 13 }}>
                              Tanpa Foto
                            </div>
                          )}

                          {/* Top Badges */}
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            right: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            pointerEvents: 'none',
                          }}>
                            {project.category ? (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 100,
                                background: 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(8px)',
                                color: '#ffffff',
                                fontSize: 11,
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                border: '1px solid rgba(255,255,255,0.15)',
                              }}>
                                {project.category}
                              </span>
                            ) : <span />}

                            {/* Media Count, Flipbook, 3D or Video Badge */}
                            <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto', alignItems: 'center' }}>
                              {isFlipbook && (
                                <span style={{
                                  padding: '4px 9px',
                                  borderRadius: 100,
                                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                  color: '#ffffff',
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: '0 2px 8px rgba(14,165,233,0.4)'
                                }}>
                                  <BookOpen size={11} /> Flipbook
                                </span>
                              )}
                              {is3D && (
                                <span style={{
                                  padding: '4px 9px',
                                  borderRadius: 100,
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  color: '#ffffff',
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: 'none'
                                }}>
                                  <Box size={11} /> 3D
                                </span>
                              )}
                              {hasVideo && (
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: 100,
                                  background: 'rgba(239, 68, 68, 0.85)',
                                  color: '#ffffff',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}>
                                  Video
                                </span>
                              )}
                              {mediaList.length > 1 && (
                                <button
                                  onClick={(e) => handleOpenLightbox(project, e, 0)}
                                  title="Buka Galeri Foto"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 100,
                                    background: 'rgba(0,0,0,0.75)',
                                    backdropFilter: 'blur(8px)',
                                    color: '#ffffff',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <ImageIcon size={11} />
                                  <span>{mediaList.length}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              {project.client && (
                                <span style={{ fontSize: 11.5, color: accentColor, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <Building2 size={12} /> {project.client}
                                </span>
                              )}
                              {project.year && (
                                <span style={{ fontSize: 11.5, color: subTextColor, fontWeight: 600 }}>
                                  • {project.year}
                                </span>
                              )}
                            </div>

                            <h3 style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 18,
                              fontWeight: 800,
                              color: textColor,
                              margin: 0,
                              lineHeight: 1.3,
                            }}>
                              {project.name || project.title || 'Untitled Project'}
                            </h3>
                          </div>

                          {project.description && (
                            <p style={{
                              margin: 0,
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 13,
                              color: subTextColor,
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {project.description}
                            </p>
                          )}

                          {/* Quick Actions Row */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: 10,
                            borderTop: `1px solid ${cardBorder}`,
                            marginTop: 4,
                          }}>
                            <span style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: accentColor,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              Studi Kasus <ArrowUpRight size={13} />
                            </span>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={(e) => handleOpenLightbox(project, e, 0)}
                                title="Perbesar / Lightbox Foto"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  border: `1px solid ${cardBorder}`,
                                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                  color: textColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Maximize2 size={13} />
                              </button>
                              <button
                                onClick={(e) => handleQuickWhatsAppInquiry(project, e)}
                                title="Tanya Proyek Ini via WA"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  border: 'none',
                                  background: '#25D36622',
                                  color: '#25D366',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <MessageCircle size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. COMPACT LIST VIEW MODE */}
              {viewMode === 'compact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {filteredProjects.map((project: any, idx: number) => {
                    const cover = getProjectCover(project);
                    const mediaList = getAllProjectMedia(project);

                    return (
                      <div
                        key={project.id || idx}
                        data-reveal="true"
                        onClick={() => {
                          haptic.selection();
                          setSelectedProject(project);
                          navigate(`/portofolio/${project.id}`);
                        }}
                        style={{
                          background: cardBg,
                          borderRadius: 18,
                          border: `1px solid ${cardBorder}`,
                          padding: isMobile ? '12px' : '14px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `${accentColor}50`;
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = cardBorder;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{
                          width: isMobile ? 64 : 84,
                          height: isMobile ? 64 : 64,
                          borderRadius: 12,
                          overflow: 'hidden',
                          background: isDark ? '#0f172a' : '#f1f5f9',
                          flexShrink: 0,
                          position: 'relative',
                        }}>
                          {cover ? (
                            <img
                              src={cover}
                              alt={project.name || project.title}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor, fontSize: 10 }}>
                              No Img
                            </div>
                          )}
                          {mediaList.length > 1 && (
                            <div style={{
                              position: 'absolute',
                              bottom: 3,
                              right: 3,
                              background: 'rgba(0,0,0,0.7)',
                              color: '#ffffff',
                              fontSize: 9,
                              fontWeight: 700,
                              borderRadius: 4,
                              padding: '1px 3px',
                            }}>
                              +{mediaList.length - 1}
                            </div>
                          )}
                        </div>

                        {/* Title and metadata */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            {project.category && (
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: accentColor,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}>
                                {project.category}
                              </span>
                            )}
                            {project.client && (
                              <span style={{ fontSize: 11.5, color: subTextColor }}>
                                • {project.client}
                              </span>
                            )}
                            {project.year && (
                              <span style={{ fontSize: 11.5, color: subTextColor }}>
                                ({project.year})
                              </span>
                            )}
                          </div>

                          <h3 style={{
                            margin: 0,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: isMobile ? 15 : 17,
                            fontWeight: 800,
                            color: textColor,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {project.name || project.title || 'Untitled Project'}
                          </h3>

                          {project.description && !isMobile && (
                            <p style={{
                              margin: '4px 0 0',
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 12.5,
                              color: subTextColor,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {project.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={(e) => handleOpenLightbox(project, e, 0)}
                            title="Preview Galeri Foto"
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: `1px solid ${cardBorder}`,
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                              color: textColor,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: isMobile ? 'none' : 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <ImageIcon size={13} />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={(e) => handleQuickWhatsAppInquiry(project, e)}
                            title="Tanya via WhatsApp"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              border: 'none',
                              background: '#25D36618',
                              color: '#25D366',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <MessageCircle size={16} />
                          </button>

                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: `${accentColor}18`,
                            color: accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <ArrowUpRight size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. GRID VIEW MODE (Default & Feature-Packed) */}
              {viewMode === 'grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: 28 }}>
                  {filteredProjects.map((project: any, idx: number) => {
                    const cover = getProjectCover(project);
                    const mediaList = getAllProjectMedia(project);
                    const hasVideo = project.mediaType === 'youtube' || project.mediaType === 'video' || Boolean(project.youtubeUrl) || Boolean(project.videoUrl);
                    const is3D = project.mediaType === '3d' || Boolean(project.model3dUrl);
                    const isFlipbook = project.mediaType === 'flipbook' || Boolean(project.pdfUrl);

                    return (
                      <div
                        key={project.id || idx}
                        data-reveal="true"
                        className={`reveal-delay-${(idx % 4) + 1}`}
                        onClick={() => {
                          haptic.selection();
                          setSelectedProject(project);
                          navigate(`/portofolio/${project.id}`);
                        }}
                        data-card-3d="true"
                        style={{
                          background: cardBg,
                          borderRadius: 22,
                          padding: 12,
                          overflow: 'hidden',
                          border: `1px solid ${cardBorder}`,
                          cursor: 'pointer',
                          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: 'none',
                        }}
                      >
                        {/* Aspect Ratio Box */}
                        <div style={{ width: '100%', aspectRatio: '16/10', borderRadius: 16, backgroundColor: isDark ? '#0f172a' : '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                          {cover ? (
                            <img
                              className="project-cover-img"
                              src={cover}
                              alt={project.name || project.title}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                              }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor, fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                              Pratinjau Proyek
                            </div>
                          )}

                          {/* Top Badges */}
                          <div style={{
                            position: 'absolute',
                            top: 14,
                            left: 14,
                            right: 14,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            {project.category ? (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 100,
                                background: 'rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(8px)',
                                color: '#ffffff',
                                fontSize: 11,
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                border: '1px solid rgba(255,255,255,0.15)',
                              }}>
                                {project.category}
                              </span>
                            ) : <span />}

                            {/* Media indicators (Photo count / Flipbook / 3D / Video) */}
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {isFlipbook && (
                                <span style={{
                                  padding: '4px 9px',
                                  borderRadius: 100,
                                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                  color: '#ffffff',
                                  fontSize: 10.5,
                                  fontFamily: "'Outfit', sans-serif",
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: '0 2px 8px rgba(14,165,233,0.4)'
                                }}>
                                  <BookOpen size={11} /> Flipbook
                                </span>
                              )}
                              {is3D && (
                                <span style={{
                                  padding: '4px 9px',
                                  borderRadius: 100,
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  color: '#ffffff',
                                  fontSize: 10.5,
                                  fontFamily: "'Outfit', sans-serif",
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: 'none'
                                }}>
                                  <Box size={11} /> 3D
                                </span>
                              )}
                              {hasVideo && (
                                <span style={{
                                  padding: '4px 9px',
                                  borderRadius: 100,
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#ffffff',
                                  fontSize: 10.5,
                                  fontFamily: "'Outfit', sans-serif",
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                }}>
                                  Video
                                </span>
                              )}

                              {mediaList.length > 1 && (
                                <button
                                  onClick={(e) => handleOpenLightbox(project, e, 0)}
                                  title="Klik untuk melihat semua foto di Lightbox"
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 100,
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(8px)',
                                    color: '#ffffff',
                                    fontSize: 11,
                                    fontFamily: "'Outfit', sans-serif",
                                    fontWeight: 700,
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = accentColor)}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
                                >
                                  <ImageIcon size={12} />
                                  <span>{mediaList.length} Foto</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick Lightbox Action Overlay Button at bottom-right of image */}
                          <button
                            onClick={(e) => handleOpenLightbox(project, e, 0)}
                            title="Preview Cepat Foto"
                            style={{
                              position: 'absolute',
                              bottom: 12,
                              right: 12,
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: 'rgba(0,0,0,0.65)',
                              backdropFilter: 'blur(6px)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'transform 0.2s, background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.background = accentColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.background = 'rgba(0,0,0,0.65)';
                            }}
                          >
                            <Maximize2 size={14} />
                          </button>
                        </div>

                        {/* Content Body */}
                        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
                          <div>
                            {/* Client & Year Tag */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              {project.client && (
                                <span style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: accentColor,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}>
                                  <Building2 size={13} />
                                  <span>{project.client}</span>
                                </span>
                              )}
                              {project.year && (
                                <span style={{ fontSize: 12, color: subTextColor, fontWeight: 500 }}>
                                  • {project.year}
                                </span>
                              )}
                            </div>

                            <h3 style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 20,
                              fontWeight: 800,
                              color: textColor,
                              margin: '0 0 6px',
                              letterSpacing: '-0.4px',
                              lineHeight: 1.3,
                            }}>
                              {project.name || project.title || 'Untitled Project'}
                            </h3>

                            <p style={{
                              margin: 0,
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 13.5,
                              color: subTextColor,
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {project.description || 'Klik untuk mempelajari konsep dan studi kasus desain.'}
                            </p>
                          </div>

                          {/* Footer Action Row */}
                          <div style={{
                            marginTop: 'auto',
                            paddingTop: 14,
                            borderTop: `1px solid ${cardBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}>
                            <div style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 13,
                              fontWeight: 700,
                              color: accentColor,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}>
                              <span>Lihat Studi Kasus</span>
                              <ArrowUpRight size={14} />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={(e) => handleQuickWhatsAppInquiry(project, e)}
                                title="Konsultasi Konsep Serupa via WhatsApp"
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: 100,
                                  border: 'none',
                                  background: '#25D36618',
                                  color: '#25D366',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  fontFamily: "'Outfit', sans-serif",
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  transition: 'background 0.2s, transform 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#25D36630';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#25D36618';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <MessageCircle size={13} />
                                <span>Tanya WA</span>
                              </button>

                              <div style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: `${accentColor}18`,
                                color: accentColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <ArrowUpRight size={16} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

        <LPFooter isDark={isDark} accentColor={accentColor} data={data.footer} />

        {/* ============================================================== */}
        {/* INTERACTIVE FULLSCREEN LIGHTBOX MODAL                         */}
        {/* ============================================================== */}
        {lightboxState && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999999,
              background: 'rgba(4, 4, 8, 0.94)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={() => setLightboxState(null)}
          >
            {/* Top Toolbar */}
            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 16,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  {lightboxState.project.name || lightboxState.project.title || 'Galeri Proyek'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
                  Foto {lightboxState.imageIndex + 1} dari {getAllProjectMedia(lightboxState.project).length}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Zoom Toggle */}
                <button
                  onClick={handleToggleZoom}
                  title="Perbesar / Perkecil Foto"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 100,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: lightboxState.zoomLevel > 1 ? accentColor : 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {lightboxState.zoomLevel > 1 ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
                  <span>{lightboxState.zoomLevel}x</span>
                </button>

                {/* WhatsApp Consultation */}
                <button
                  onClick={() => handleQuickWhatsAppInquiry(lightboxState.project)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 100,
                    border: 'none',
                    background: '#25D366',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  <MessageCircle size={14} />
                  <span>Tanya WA</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setLightboxState(null)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Tutup (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Central Stage: Large Image Preview */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: '20px',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setLightboxState(null);
              }}
            >
              {/* Prev Button */}
              {getAllProjectMedia(lightboxState.project).length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLightboxPrev();
                  }}
                  style={{
                    position: 'absolute',
                    left: 24,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(-50%) scale(1)')}
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Main Image */}
              {(() => {
                const mediaList = getAllProjectMedia(lightboxState.project);
                const activeMedia = mediaList[lightboxState.imageIndex] || getProjectCover(lightboxState.project);
                if (!activeMedia) return null;

                return (
                  <img
                    src={activeMedia}
                    alt={lightboxState.project.name || 'Preview'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleZoom();
                    }}
                    style={{
                      maxWidth: lightboxState.zoomLevel === 1 ? '90vw' : 'none',
                      maxHeight: lightboxState.zoomLevel === 1 ? '75vh' : 'none',
                      width: lightboxState.zoomLevel > 1 ? `${lightboxState.zoomLevel * 80}%` : 'auto',
                      objectFit: 'contain',
                      borderRadius: 16,
                      boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: lightboxState.zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
                    }}
                  />
                );
              })()}

              {/* Next Button */}
              {getAllProjectMedia(lightboxState.project).length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLightboxNext();
                  }}
                  style={{
                    position: 'absolute',
                    right: 24,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(-50%) scale(1)')}
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Bottom Filmstrip Thumbnails */}
            {getAllProjectMedia(lightboxState.project).length > 1 && (
              <div
                style={{
                  padding: '12px 20px',
                  background: 'rgba(0,0,0,0.7)',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 10,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {getAllProjectMedia(lightboxState.project).map((thumb, tIdx) => {
                  const isActive = tIdx === lightboxState.imageIndex;
                  return (
                    <button
                      key={tIdx}
                      onClick={() => {
                        haptic.selection();
                        setLightboxState((prev) => prev ? ({ ...prev, imageIndex: tIdx, zoomLevel: 1 }) : null);
                      }}
                      style={{
                        width: 56,
                        height: 42,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: `2px solid ${isActive ? accentColor : 'transparent'}`,
                        opacity: isActive ? 1 : 0.5,
                        background: '#000000',
                        cursor: 'pointer',
                        padding: 0,
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}

        {/* Project Case Study Detail Modal */}
        {selectedProject && (
          <LPProjectModal
            project={selectedProject}
            allProjects={projects}
            onSelectProject={(proj) => {
              setSelectedProject(proj);
              navigate(`/portofolio/${proj.id}`);
            }}
            onClose={() => {
              setSelectedProject(null);
              navigate('/portofolio');
            }}
            isDark={isDark}
            accentColor={accentColor}
          />
        )}
      </div>
    </>
  );
};

export default PortfolioPage;
