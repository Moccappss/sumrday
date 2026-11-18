import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers, Package, FileText, Megaphone, Calendar,
  Tag, ArrowUpRight, ArrowRight, ExternalLink, Sparkles,
  Search, Pin, Heart, Share2, MessageSquare, Filter,
  Check, Eye, ChevronDown, ChevronUp, Image as ImageIcon,
  Clock, Award, LayoutGrid, X, Flame, ShieldCheck,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import { SocialUpdate, DEFAULT_SOCIAL_UPDATES, UpdateSticker } from '../../types/socialUpdates';
import UpdateStickerRenderer from './UpdateStickerRenderer';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface LPCompanyUpdatesHubProps {
  isDark?: boolean;
  accentColor?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  showSingleOnly?: boolean;
  seeMoreUrl?: string;
  seeMoreLabel?: string;
  hideHeader?: boolean;
  isEditable?: boolean;
  selectedUpdateId?: string;
  onUpdateBadge?: (val: string) => void;
  onUpdateTitle?: (val: string) => void;
  onUpdateSubtitle?: (val: string) => void;
  onUpdateSelectedUpdateId?: (id: string) => void;
}

export const LPCompanyUpdatesHub: React.FC<LPCompanyUpdatesHubProps> = ({
  isDark = true,
  accentColor = 'var(--theme-accent, #f59e0b)',
  badge = 'JURNAL & PEMBARUAN STUDIO',
  title = 'Rilis Aset Digital, Produk & Artikel Terkini',
  subtitle = 'Pembaruan berkala mencakup aset digital baru, produk terpilih, serta artikel wawasan yang dirilis secara kronologis.',
  showSingleOnly = false,
  seeMoreUrl = '/updates',
  seeMoreLabel = 'Lihat Semua Update & Rilis',
  hideHeader = false,
  isEditable = false,
  selectedUpdateId,
  onUpdateBadge,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateSelectedUpdateId
}) => {
  const themeColor = (accentColor && !accentColor.includes('#2563eb')) ? accentColor : 'var(--theme-accent, #f59e0b)';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCat = searchParams.get('category');

  const [updates, setUpdates] = useState<SocialUpdate[]>(() => {
    const cached = storage.getSync('porto_social_updates', null);
    if (Array.isArray(cached) && cached.length > 0) return cached;
    return DEFAULT_SOCIAL_UPDATES;
  });
  const [currentSelectedUpdateId, setCurrentSelectedUpdateId] = useState<string>(() => {
    if (selectedUpdateId) return selectedUpdateId;
    try {
      return localStorage.getItem('porto_company_update_spotlight_id') || '';
    } catch { }
    return '';
  });

  useEffect(() => {
    if (typeof selectedUpdateId === 'string') {
      setCurrentSelectedUpdateId(selectedUpdateId);
    }
  }, [selectedUpdateId]);

  const [isUpdatePickerOpen, setIsUpdatePickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const handleSelectSpotlightUpdate = (id: string) => {
    setCurrentSelectedUpdateId(id);
    if (onUpdateSelectedUpdateId) {
      onUpdateSelectedUpdateId(id);
    }
    try {
      localStorage.setItem('porto_company_update_spotlight_id', id);
    } catch { }
    setIsUpdatePickerOpen(false);
  };
  const [selectedCategory, setSelectedCategory] = useState<string>(queryCat || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Close year dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };
    if (isYearDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isYearDropdownOpen]);

  const [sortBy, setSortBy] = useState<'date' | 'popular'>('date');
  const [lightboxState, setLightboxState] = useState<{
    mediaUrls: string[];
    currentIndex: number;
    title?: string;
  } | null>(null);

  // Lightbox keyboard controls & body scroll lock
  useEffect(() => {
    if (!lightboxState) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxState(null);
      } else if (e.key === 'ArrowRight' && lightboxState.mediaUrls.length > 1) {
        setLightboxState(prev => prev ? ({
          ...prev,
          currentIndex: (prev.currentIndex + 1) % prev.mediaUrls.length
        }) : null);
      } else if (e.key === 'ArrowLeft' && lightboxState.mediaUrls.length > 1) {
        setLightboxState(prev => prev ? ({
          ...prev,
          currentIndex: (prev.currentIndex - 1 + prev.mediaUrls.length) % prev.mediaUrls.length
        }) : null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxState]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  // ── Progressive Pagination State (6 items per batch for peak scroll performance) ──
  const PAGE_BATCH_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_BATCH_SIZE);

  // Reset pagination whenever filters or search change
  useEffect(() => {
    setVisibleCount(PAGE_BATCH_SIZE);
  }, [selectedCategory, searchQuery, selectedYear, sortBy]);

  useEffect(() => {
    if (queryCat) {
      setSelectedCategory(queryCat);
    }
  }, [queryCat]);

  // ── Load Existing Social Updates from Storage ──
  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const saved = await storage.getItem('porto_social_updates', null);
        const list: SocialUpdate[] = (Array.isArray(saved) && saved.length > 0) ? saved : DEFAULT_SOCIAL_UPDATES;

        // Smart migration: ensure stickers and categories are preserved and parsed properly
        const sanitizedList = list.map(u => {
          const defaultItem = DEFAULT_SOCIAL_UPDATES.find(d => d.id === u.id);
          let stickerObj = u.sticker;
          if (!stickerObj && defaultItem?.sticker) {
            stickerObj = defaultItem.sticker;
          }
          if (typeof stickerObj === 'string') {
            try {
              stickerObj = JSON.parse(stickerObj);
            } catch { }
          }

          // Smart category resolution so all items have clear category and tab counts
          let category = u.category;
          if (!category) {
            const tag = (u.projectTag || '').toLowerCase();
            if (tag.includes('produk') || tag.includes('katalog') || tag.includes('undangan')) category = 'product';
            else if (tag.includes('artikel') || tag.includes('blog') || tag.includes('wawasan')) category = 'article';
            else if (tag.includes('pengumuman') || tag.includes('milestone') || tag.includes('info')) category = 'announcement';
            else category = defaultItem?.category || 'asset';
          }

          return { ...u, category, sticker: stickerObj };
        });

        setUpdates(sanitizedList);

        const initialLikes: Record<string, number> = {};
        sanitizedList.forEach(u => {
          initialLikes[u.id] = u.likesCount || 0;
        });
        setLikesCountMap(initialLikes);

        // Load liked state from localStorage
        const likedMap: Record<string, boolean> = {};
        sanitizedList.forEach(u => {
          try {
            if (localStorage.getItem(`liked_update_${u.id}`) === 'true') {
              likedMap[u.id] = true;
            }
          } catch (e) { }
        });
        setUserLikes(likedMap);
      } catch (err) {
        setUpdates(DEFAULT_SOCIAL_UPDATES);
      }
    };

    loadUpdates();

    const handleRemoteUpdate = async () => {
      try {
        const fresh = await storage.getItem('porto_social_updates', null);
        if (Array.isArray(fresh)) {
          const sanitized = fresh.map(u => {
            const defaultItem = DEFAULT_SOCIAL_UPDATES.find(d => d.id === u.id);
            let s = u.sticker;
            if (typeof s === 'string') {
              try { s = JSON.parse(s); } catch { }
            }
            let category = u.category;
            if (!category) {
              const tag = (u.projectTag || '').toLowerCase();
              if (tag.includes('produk') || tag.includes('katalog') || tag.includes('undangan')) category = 'product';
              else if (tag.includes('artikel') || tag.includes('blog') || tag.includes('wawasan')) category = 'article';
              else if (tag.includes('pengumuman') || tag.includes('milestone') || tag.includes('info')) category = 'announcement';
              else category = defaultItem?.category || 'asset';
            }
            return { ...u, category, sticker: s };
          });
          setUpdates(sanitized);
        }
      } catch (e) { }
    };

    window.addEventListener('porto_updates_updated', handleRemoteUpdate);
    window.addEventListener('porto_social_updates_changed', handleRemoteUpdate);
    return () => {
      window.removeEventListener('porto_updates_updated', handleRemoteUpdate);
      window.removeEventListener('porto_social_updates_changed', handleRemoteUpdate);
    };
  }, []);

  const handleUpdatePostSticker = async (postId: string, newSticker: any) => {
    const updated = updates.map(u => u.id === postId ? { ...u, sticker: newSticker } : u);
    setUpdates(updated);
    try {
      await storage.setItem('porto_social_updates', updated);
      window.dispatchEvent(new CustomEvent('porto_updates_updated', { detail: updated }));
    } catch (e) {
      console.warn('Failed to update sticker in storage:', e);
    }
  };

  // ── Categories definition without emojis, using Lucide icons ──
  const categories = useMemo(() => [
    { id: 'all', label: 'Semua Rilis', icon: LayoutGrid, count: updates.filter(u => u.isPublished !== false).length },
    { id: 'asset', label: 'Aset Digital', icon: Layers, count: updates.filter(u => u.isPublished !== false && u.category === 'asset').length },
    { id: 'product', label: 'Produk Baru', icon: Package, count: updates.filter(u => u.isPublished !== false && u.category === 'product').length },
    { id: 'article', label: 'Artikel & Wawasan', icon: FileText, count: updates.filter(u => u.isPublished !== false && u.category === 'article').length },
    { id: 'announcement', label: 'Pengumuman', icon: Megaphone, count: updates.filter(u => u.isPublished !== false && u.category === 'announcement').length },
  ], [updates]);

  // ── Years available ──
  const years = useMemo(() => {
    const set = new Set<string>();
    updates.forEach(u => {
      const dateStr = u.customDate || u.createdAt;
      if (dateStr) {
        const y = new Date(dateStr).getFullYear().toString();
        if (y && y !== 'NaN') set.add(y);
      }
    });
    return ['all', ...Array.from(set).sort().reverse()];
  }, [updates]);

  // ── Filter & Chronological Sorting ──
  const filteredAndSortedUpdates = useMemo(() => {
    return updates
      .filter(u => {
        if (u.isPublished === false) return false;

        // Category filter
        if (selectedCategory !== 'all') {
          if (u.category) {
            if (u.category !== selectedCategory) return false;
          } else {
            // Fallback matching tag keywords if category not set yet
            const tag = (u.projectTag || '').toLowerCase();
            if (selectedCategory === 'asset' && !tag.includes('aset') && !tag.includes('design') && !tag.includes('ui')) return false;
            if (selectedCategory === 'product' && !tag.includes('katalog') && !tag.includes('produk') && !tag.includes('undangan')) return false;
            if (selectedCategory === 'article' && !tag.includes('artikel') && !tag.includes('wawasan') && !tag.includes('blog')) return false;
            if (selectedCategory === 'announcement' && !tag.includes('pengumuman') && !tag.includes('milestone')) return false;
          }
        }

        // Year filter
        if (selectedYear !== 'all') {
          const dateStr = u.customDate || u.createdAt;
          if (dateStr && new Date(dateStr).getFullYear().toString() !== selectedYear) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (u.title || '').toLowerCase().includes(q);
          const matchContent = (u.content || '').toLowerCase().includes(q);
          const matchTag = (u.projectTag || '').toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned updates always take precedence if both aren't pinned
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortBy === 'popular') {
          const likesA = likesCountMap[a.id] ?? a.likesCount ?? 0;
          const likesB = likesCountMap[b.id] ?? b.likesCount ?? 0;
          return likesB - likesA;
        }

        // Strict chronological sort: by customDate or createdAt (descending)
        const dateA = new Date(a.customDate || a.createdAt).getTime();
        const dateB = new Date(b.customDate || b.createdAt).getTime();
        return dateB - dateA;
      });

    // If spotlight mode and specific update is selected, prioritize it at index 0
    if (showSingleOnly && currentSelectedUpdateId) {
      const chosenIdx = base.findIndex(u => u.id === currentSelectedUpdateId);
      if (chosenIdx > 0) {
        const chosen = base[chosenIdx];
        const rest = base.filter((_, i) => i !== chosenIdx);
        return [chosen, ...rest];
      }
    }

    return base;
  }, [updates, selectedCategory, selectedYear, searchQuery, sortBy, likesCountMap, showSingleOnly, currentSelectedUpdateId]);

  // High performance smooth scroll reveal for dynamically loaded and filtered cards
  useScrollReveal(undefined, [updates, filteredAndSortedUpdates, visibleCount]);

  // ── Interaction: Like ──
  const handleToggleLike = async (postId: string) => {
    const isLiked = !!userLikes[postId];
    const newLiked = !isLiked;
    const currentCount = likesCountMap[postId] ?? 0;
    const newCount = newLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    setUserLikes(prev => ({ ...prev, [postId]: newLiked }));
    setLikesCountMap(prev => ({ ...prev, [postId]: newCount }));

    try {
      if (newLiked) {
        localStorage.setItem(`liked_update_${postId}`, 'true');
      } else {
        localStorage.removeItem(`liked_update_${postId}`);
      }

      // Update storage
      const freshUpdates = await storage.getItem('porto_social_updates', []);
      if (Array.isArray(freshUpdates)) {
        const updated = freshUpdates.map((u: SocialUpdate) => {
          if (u.id === postId) {
            return { ...u, likesCount: newCount };
          }
          return u;
        });
        await storage.setItem('porto_social_updates', updated);
        window.dispatchEvent(new CustomEvent('porto_social_updates_changed', { detail: updated }));
        window.dispatchEvent(new CustomEvent('porto_updates_updated', { detail: updated }));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // ── Interaction: Share ──
  const handleShare = async (u: SocialUpdate) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/updates#${u.id}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: u.title || 'Rilis Baru - sumr.day Studio',
          text: (u.content || '').slice(0, 100),
          url
        });
        return;
      } catch (e) { }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(u.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // ── Helper formatting ──
  const formatDateId = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // ── Category visuals (Clean Lucide Icons, No Emojis) ──
  const getCategoryMeta = (cat?: string) => {
    switch (cat) {
      case 'asset':
        return { label: 'Aset Digital', icon: Layers, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.3)' };
      case 'product':
        return { label: 'Produk Baru', icon: Package, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'article':
        return { label: 'Artikel & Wawasan', icon: FileText, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
      case 'announcement':
        return { label: 'Pengumuman', icon: Megaphone, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' };
      default:
        return { label: 'Update Studio', icon: Sparkles, color: accentColor, bg: `${accentColor}18`, border: `${accentColor}35` };
    }
  };

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <section
      id="updates-hub"
      style={{
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        background: isDark ? '#06070a' : '#eef2f6',
        position: 'relative',
        borderTop: `1px solid ${cardBorder}`,
        scrollMarginTop: 60,
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .lp-update-spotlight-card {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          border-radius: 22px;
          overflow: hidden;
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
        }
        .lp-update-spotlight-media {
          width: 320px;
          min-width: 260px;
          max-width: 340px;
          height: auto;
          min-height: 220px;
          margin: 12px;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
          cursor: pointer;
        }
        .lp-update-spotlight-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          justify-content: space-between;
          padding: 18px 20px 18px 8px;
          box-sizing: border-box;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .lp-update-spotlight-card {
            flex-direction: column !important;
            max-width: 100% !important;
          }
          .lp-update-spotlight-media {
            width: calc(100% - 24px) !important;
            max-width: 100% !important;
            min-width: unset !important;
            height: 180px !important;
            min-height: unset !important;
            margin: 12px 12px 0 12px !important;
          }
          .lp-update-spotlight-body {
            padding: 14px 16px 16px 16px !important;
          }
        }
        @container (max-width: 768px) {
          .lp-update-spotlight-card {
            flex-direction: column !important;
            max-width: 100% !important;
          }
          .lp-update-spotlight-media {
            width: calc(100% - 24px) !important;
            max-width: 100% !important;
            min-width: unset !important;
            height: 200px !important;
            min-height: unset !important;
            margin: 12px 12px 0 12px !important;
          }
          .lp-update-spotlight-body {
            padding: 14px 16px 16px 16px !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>
        {/* ── SECTION HEADER ── */}
        {!hideHeader && (
          <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto clamp(36px, 5vw, 48px)' }}>
            <div
              data-reveal="true"
              className="reveal-delay-1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 16px',
                borderRadius: 100,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
                border: `1px solid ${cardBorder}`,
                marginBottom: 18
              }}
            >
              <Layers size={14} color={accentColor} />
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateBadge?.(e.currentTarget.textContent || badge)}
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  outline: 'none',
                  cursor: isEditable ? 'text' : 'default'
                }}
                title={isEditable ? 'Klik untuk mengedit badge update' : undefined}
              >
                {badge}
              </span>
            </div>

            <h2
              data-reveal={isEditable ? undefined : 'true'}
              className={isEditable ? '' : 'reveal-delay-2'}
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateTitle?.(e.currentTarget.textContent || title)}
              style={{
                margin: '0 0 16px',
                fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: textColor,
                lineHeight: 1.15,
                outline: 'none',
                cursor: isEditable ? 'text' : 'default'
              }}
              title={isEditable ? 'Klik untuk mengedit judul update' : undefined}
            >
              {title}
            </h2>

            <p
              data-reveal={isEditable ? undefined : 'true'}
              className={isEditable ? '' : 'reveal-delay-3'}
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateSubtitle?.(e.currentTarget.textContent || subtitle)}
              style={{
                margin: 0,
                fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
                color: subTextColor,
                lineHeight: 1.7,
                maxWidth: 780,
                marginLeft: 'auto',
                marginRight: 'auto',
                outline: 'none',
                cursor: isEditable ? 'text' : 'default'
              }}
              title={isEditable ? 'Klik untuk mengedit deskripsi update' : undefined}
            >
              {subtitle}
            </p>
          </div>
        )}

        {/* ── UNIFIED SOCIAL MEDIA FEED COLUMN (SPACIOUS & EXPANSIVE 1240PX) ── */}
        <div style={{ width: '100%', margin: '0 auto' }}>
          {/* ── FILTER TABS & CONTROL BAR (CLEAN ICONS, NO EMOJIS) ── */}
          {!showSingleOnly && (
            <div
              data-reveal="true"
              className="reveal-delay-3"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginBottom: 32,
                width: '100%'
              }}
            >
              {/* Category Tabs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 6,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 18px',
                        borderRadius: 12,
                        border: isActive
                          ? `1.5px solid ${accentColor}`
                          : `1px solid ${cardBorder}`,
                        background: isActive
                          ? (isDark ? `${accentColor}25` : `${accentColor}12`)
                          : (isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff'),
                        color: isActive ? (isDark ? '#ffffff' : accentColor) : subTextColor,
                        fontWeight: isActive ? 800 : 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? `0 4px 14px ${accentColor}25` : 'none'
                      }}
                    >
                      <Icon size={15} color={isActive ? accentColor : 'currentColor'} />
                      <span>{cat.label}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 750,
                          padding: '1px 6px',
                          borderRadius: 100,
                          background: isActive ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                          color: isActive ? '#ffffff' : subTextColor
                        }}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search, Year & Sort Filter Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                {/* Search Box */}
                <div
                  style={{
                    position: 'relative',
                    flex: '1 1 240px',
                    minWidth: 200
                  }}
                >
                  <Search
                    size={16}
                    color={subTextColor}
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari rilis, aset, produk, atau artikel..."
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: 12,
                      border: `1px solid ${cardBorder}`,
                      background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                      color: textColor,
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: subTextColor,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Year & Sort Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Year Select - Modern Fully Rounded Custom Dropdown */}
                  {years.length > 2 && (
                    <div ref={yearDropdownRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => {
                          try { haptic.light(); } catch { }
                          setIsYearDropdownOpen(prev => !prev);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          padding: '8px 14px',
                          borderRadius: 14,
                          border: `1.5px solid ${isYearDropdownOpen ? accentColor : cardBorder}`,
                          background: isDark ? 'rgba(30, 41, 59, 0.65)' : '#ffffff',
                          color: textColor,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: isYearDropdownOpen
                            ? `0 4px 16px ${accentColor}25`
                            : (isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.03)'),
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Calendar size={14} color={isYearDropdownOpen ? accentColor : subTextColor} />
                        <span>{selectedYear === 'all' ? 'Semua Tahun' : `Tahun ${selectedYear}`}</span>
                        <ChevronDown
                          size={14}
                          color={subTextColor}
                          style={{
                            transform: isYearDropdownOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                      </button>

                      {/* Floating Rounded Menu Popup */}
                      {isYearDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0,
                            zIndex: 100,
                            minWidth: 165,
                            background: isDark ? '#0f172a' : '#ffffff',
                            border: `1.5px solid ${cardBorder}`,
                            borderRadius: 16,
                            padding: 6,
                            boxShadow: isDark
                              ? '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
                              : '0 16px 40px rgba(15,23,42,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                            backdropFilter: 'blur(16px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            animation: 'cmsFadeIn 0.15s ease'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              try { haptic.selection(); } catch { }
                              setSelectedYear('all');
                              setIsYearDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              padding: '9px 12px',
                              borderRadius: 10,
                              border: 'none',
                              background: selectedYear === 'all' ? (isDark ? `${accentColor}25` : `${accentColor}12`) : 'transparent',
                              color: selectedYear === 'all' ? (isDark ? '#ffffff' : accentColor) : textColor,
                              fontWeight: selectedYear === 'all' ? 800 : 600,
                              fontSize: 12.5,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedYear !== 'all') e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                            }}
                            onMouseLeave={(e) => {
                              if (selectedYear !== 'all') e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <span>Semua Tahun</span>
                            {selectedYear === 'all' && <Check size={14} color={accentColor} />}
                          </button>

                          {years.filter(y => y !== 'all').map(y => {
                            const isSelected = selectedYear === y;
                            return (
                              <button
                                key={y}
                                type="button"
                                onClick={() => {
                                  try { haptic.selection(); } catch { }
                                  setSelectedYear(y);
                                  setIsYearDropdownOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                  padding: '9px 12px',
                                  borderRadius: 10,
                                  border: 'none',
                                  background: isSelected ? (isDark ? `${accentColor}25` : `${accentColor}12`) : 'transparent',
                                  color: isSelected ? (isDark ? '#ffffff' : accentColor) : textColor,
                                  fontWeight: isSelected ? 800 : 600,
                                  fontSize: 12.5,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <span>Tahun {y}</span>
                                {isSelected && <Check size={14} color={accentColor} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sort Switch */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(0,0,0,0.05)',
                      padding: 3,
                      borderRadius: 10,
                      border: `1px solid ${cardBorder}`
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSortBy('date')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: sortBy === 'date' ? accentColor : 'transparent',
                        color: sortBy === 'date' ? '#ffffff' : subTextColor,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Clock size={12} />
                      <span>Terbaru</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSortBy('popular')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: sortBy === 'popular' ? accentColor : 'transparent',
                        color: sortBy === 'popular' ? '#ffffff' : subTextColor,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Flame size={12} />
                      <span>Populer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── UPDATES CHRONOLOGICAL STREAM ── */}
          {filteredAndSortedUpdates.length === 0 ? (
            <div
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 20,
                color: subTextColor
              }}
            >
              <Layers size={36} color={subTextColor} style={{ opacity: 0.5, marginBottom: 12 }} />
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: textColor }}>
                Belum Ada Rilis di Kategori Ini
              </h3>
              <p style={{ margin: 0, fontSize: 13 }}>
                Coba ganti filter kategori atau kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                width: '100%'
              }}
            >
              {/* Visual Editor Spotlight Controls */}
              {showSingleOnly && isEditable && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    margin: '0 auto 16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      try { haptic.light(); } catch { }
                      setPickerSearch('');
                      setIsUpdatePickerOpen(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 100,
                      background: isDark ? '#ffffff' : '#0f1115',
                      color: isDark ? '#0f1115' : '#ffffff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      transition: 'transform 0.16s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <Layers size={13} />
                    <span>Pilih Update Sorotan</span>
                    {currentSelectedUpdateId && (
                      <span style={{ opacity: 0.75, fontSize: 11, fontWeight: 700 }}>(Khusus Dipilih)</span>
                    )}
                  </button>
                  {currentSelectedUpdateId && (
                    <button
                      type="button"
                      onClick={() => handleSelectSpotlightUpdate('')}
                      title="Kembali ke mode otomatis (terbaru / pinned)"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        borderRadius: 100,
                        background: 'transparent',
                        color: subTextColor,
                        border: `1px solid ${cardBorder}`,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <RefreshCw size={11} />
                      <span>Reset ke Otomatis</span>
                    </button>
                  )}
                  <a
                    href="/admin/updates"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Kelola postingan linimasa di /admin/updates"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 13px',
                      borderRadius: 100,
                      background: 'transparent',
                      color: subTextColor,
                      border: `1px solid ${cardBorder}`,
                      fontSize: 11.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.16s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isDark ? '#ffffff' : '#0f1115';
                      e.currentTarget.style.color = isDark ? '#ffffff' : '#0f1115';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = cardBorder;
                      e.currentTarget.style.color = subTextColor;
                    }}
                  >
                    <ArrowUpRight size={12} />
                    <span>Kelola di /admin/updates</span>
                  </a>
                </div>
              )}
              {(() => {
                const displayedUpdates = showSingleOnly ? filteredAndSortedUpdates.slice(0, 1) : filteredAndSortedUpdates.slice(0, visibleCount);
                return displayedUpdates.map((u, idx) => {
                  const catMeta = getCategoryMeta(u.category);
                  const CatIcon = catMeta.icon;
                  const formattedDate = formatDateId(u.customDate || u.createdAt);
                  const isLiked = !!userLikes[u.id];
                  const likesCount = likesCountMap[u.id] ?? u.likesCount ?? 0;

                  // Smart action button fallback with sticker deep link priority
                  const actionUrl = u.projectUrl || (
                    (u.sticker?.type === 'product_card' && (u.sticker as any).productId) ? `/katalog/p/${(u.sticker as any).productId}` :
                      (u.sticker?.type === 'flash_sale' && (u.sticker as any).productId) ? `/katalog/p/${(u.sticker as any).productId}` :
                        (u.sticker?.type === 'portfolio_card' && (u.sticker as any).projectId) ? `/portfolio/${(u.sticker as any).projectId}` :
                          u.category === 'asset' ? '/portfolio' :
                            u.category === 'product' ? '/katalog' :
                              u.category === 'article' ? '/blog' : '#contact'
                  );

                  const actionLabel = u.ctaLabel || (
                    u.sticker?.type === 'flash_sale' ? 'Klaim Flash Sale' :
                      u.sticker?.type === 'product_card' ? 'Buka di Store' :
                        u.sticker?.type === 'portfolio_card' ? 'Lihat Karya' :
                          u.category === 'asset' ? 'Lihat Aset Digital' :
                            u.category === 'product' ? 'Buka di Katalog' :
                              u.category === 'article' ? 'Baca Artikel' : 'Detail Rilis'
                  );

                  const hasMedia = Array.isArray(u.mediaUrls) && u.mediaUrls.length > 0;

                  if (showSingleOnly) {
                    // ── HOMEPAGE COMPACT SPOTLIGHT CARD (Horizontal Bento on Desktop) ──
                    return (
                      <article
                        key={u.id}
                        id={u.id}
                        data-reveal="true"
                        className="lp-update-spotlight-card reveal-delay-1"
                        style={{
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          boxShadow: 'none',
                          position: 'relative',
                          transition: 'border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                          maxWidth: hasMedia ? 880 : 680,
                          margin: '0 auto',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.22)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = cardBorder;
                        }}
                      >
                        {/* Media Left/Top */}
                        {hasMedia && (
                          <div
                            className="lp-update-spotlight-media"
                            style={{ background: isDark ? '#020617' : '#f1f5f9' }}
                            onClick={() => {
                              try { haptic.light(); } catch { }
                              setLightboxState({
                                mediaUrls: u.mediaUrls,
                                currentIndex: 0,
                                title: u.title || 'Pratinjau Media'
                              });
                            }}
                          >
                            <img
                              src={u.mediaUrls[0]}
                              alt={u.title || 'Preview Media'}
                              loading="lazy"
                              decoding="async"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                transition: 'transform 0.3s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            />
                            {u.mediaUrls.length > 1 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: 8,
                                  right: 8,
                                  background: 'rgba(0,0,0,0.65)',
                                  color: '#ffffff',
                                  padding: '2px 7px',
                                  borderRadius: 6,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <ImageIcon size={11} />
                                <span>+{u.mediaUrls.length - 1} Media</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content Right/Bottom */}
                        <div className="lp-update-spotlight-body">
                          <div>
                            {/* Header: Author + Category */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: isDark ? '#ffffff' : '#0f1115',
                                    color: isDark ? '#0f1115' : '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 900,
                                    flexShrink: 0
                                  }}
                                >
                                  S
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: textColor }}>sumr.day</span>
                                    <ShieldCheck size={12} color={accentColor} />
                                    {u.isPinned && (
                                      <span style={{ fontSize: 9, fontWeight: 800, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)', color: textColor, padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase' }}>
                                        Pinned
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: 11, color: subTextColor }}>{formattedDate}</span>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
                                  border: `1px solid ${cardBorder}`,
                                  color: textColor,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase'
                                }}
                              >
                                <CatIcon size={11} style={{ color: accentColor }} />
                                <span>{u.badge || catMeta.label}</span>
                              </div>
                            </div>

                            {/* Title */}
                            {u.title && (
                              <h3
                                style={{
                                  margin: '0 0 6px',
                                  fontSize: 16.5,
                                  fontWeight: 800,
                                  color: textColor,
                                  lineHeight: 1.35,
                                  letterSpacing: '-0.02em',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {u.title}
                              </h3>
                            )}

                            {/* Excerpt */}
                            <p
                              style={{
                                margin: '0 0 10px',
                                fontSize: 13,
                                color: subTextColor,
                                lineHeight: 1.55,
                                display: '-webkit-box',
                                WebkitLineClamp: hasMedia ? 3 : 4,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {u.content}
                            </p>

                            {/* Tag or Price if set */}
                            {(u.projectTag || u.price) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                {u.projectTag && (
                                  <span style={{ fontSize: 10.5, fontWeight: 700, color: subTextColor, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Tag size={10} /> {u.projectTag}
                                  </span>
                                )}
                                {u.price && (
                                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 6 }}>
                                    {u.price}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Row */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              paddingTop: 12,
                              borderTop: `1px solid ${cardBorder}`,
                              marginTop: 'auto',
                              flexWrap: 'wrap'
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (actionUrl.startsWith('#')) {
                                  const el = document.querySelector(actionUrl);
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                } else if (actionUrl.startsWith('/')) {
                                  navigate(actionUrl);
                                } else {
                                  window.open(actionUrl, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 16px',
                                borderRadius: 999,
                                background: isDark ? '#ffffff' : '#0f1115',
                                border: 'none',
                                color: isDark ? '#0f1115' : '#ffffff',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12,
                                fontWeight: 750,
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <span>{actionLabel}</span>
                              <ArrowUpRight size={13} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleToggleLike(u.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '6px 10px',
                                  borderRadius: 8,
                                  border: `1px solid ${isLiked ? '#ef4444' : cardBorder}`,
                                  background: isLiked ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                  color: isLiked ? '#ef4444' : subTextColor,
                                  fontSize: 12,
                                  fontWeight: 750,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Sukai rilis ini"
                              >
                                <Heart size={13} fill={isLiked ? '#ef4444' : 'none'} />
                                <span>{likesCount}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleShare(u)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: `1px solid ${cardBorder}`,
                                  background: 'transparent',
                                  color: copiedId === u.id ? '#10b981' : subTextColor,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Bagikan tautan rilis"
                              >
                                {copiedId === u.id ? <Check size={13} /> : <Share2 size={13} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  // ── FEED / MULTI-CARD MODE (Compact Sleek Article) ──
                  return (
                    <article
                      key={u.id}
                      id={u.id}
                      data-reveal="true"
                      className={`reveal-delay-${(idx % 3) + 1}`}
                      style={{
                        background: cardBg,
                        borderRadius: 24,
                        border: `1px solid ${cardBorder}`,
                        boxShadow: 'none',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        maxWidth: 860,
                        width: '100%',
                        margin: '0 auto',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Social Media Post Header: Author + Verified Badge + Date + Category Pill */}
                      <div
                        className="lp-update-card-header"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '14px 20px',
                          borderBottom: `1px solid ${cardBorder}`,
                          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: isDark ? '#ffffff' : '#0f1115',
                              color: isDark ? '#0f1115' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 900,
                              flexShrink: 0
                            }}
                          >
                            S
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: textColor }}>
                                sumr.day Studio
                              </span>
                              <ShieldCheck size={13} color={accentColor} />
                              {u.isPinned && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
                                    color: textColor,
                                    border: `1px solid ${cardBorder}`,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }}
                                >
                                  Pinned
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: subTextColor }}>
                              <span>@sumrday</span>
                              <span>•</span>
                              <span>{formattedDate}</span>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
                            border: `1px solid ${cardBorder}`,
                            color: textColor,
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase'
                          }}
                        >
                          <CatIcon size={11} style={{ color: accentColor }} />
                          <span>{u.badge || catMeta.label}</span>
                        </div>
                      </div>

                      {/* Media Showcase Preview (If Available - Compact) */}
                      {hasMedia && (
                        <div
                          style={{
                            margin: '12px 16px 0 16px',
                            borderRadius: 18,
                            aspectRatio: '16/9',
                            maxHeight: 280,
                            overflow: 'hidden',
                            position: 'relative',
                            background: isDark ? '#020617' : '#f1f5f9',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            try { haptic.light(); } catch { }
                            setLightboxState({
                              mediaUrls: u.mediaUrls,
                              currentIndex: 0,
                              title: u.title || 'Pratinjau Media'
                            });
                          }}
                        >
                          <img
                            src={u.mediaUrls[0]}
                            alt={u.title || 'Preview Media'}
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              transition: 'transform 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                          />
                          {u.mediaUrls.length > 1 && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                background: 'rgba(0,0,0,0.65)',
                                color: '#ffffff',
                                padding: '2px 7px',
                                borderRadius: 6,
                                fontSize: 10.5,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <ImageIcon size={11} />
                              <span>+{u.mediaUrls.length - 1} Media</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Card Content Body */}
                      <div
                        className="lp-update-card-body"
                        style={{
                          padding: '18px 20px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1
                        }}
                      >
                        {/* Title */}
                        {u.title && (
                          <h3
                            style={{
                              margin: '0 0 10px',
                              fontSize: '1.25rem',
                              fontWeight: 850,
                              color: textColor,
                              lineHeight: 1.3,
                              letterSpacing: '-0.02em'
                            }}
                          >
                            {u.title}
                          </h3>
                        )}

                        {/* Content Excerpt */}
                        <p
                          style={{
                            margin: '0 0 16px',
                            fontSize: '0.95rem',
                            color: subTextColor,
                            lineHeight: 1.65,
                            whiteSpace: 'pre-line',
                            flex: 1
                          }}
                        >
                          {u.content}
                        </p>

                        {/* Interactive Sticker Renderer */}
                        {u.sticker && (
                          <div style={{ marginBottom: 14 }}>
                            <UpdateStickerRenderer
                              sticker={u.sticker}
                              postId={u.id}
                              isDark={isDark}
                              accentColor={accentColor}
                              onUpdateSticker={(newSticker) => handleUpdatePostSticker(u.id, newSticker)}
                            />
                          </div>
                        )}

                        {/* Project Tag Pill & Price (If set) */}
                        {(u.projectTag || u.price) && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 14,
                              flexWrap: 'wrap'
                            }}
                          >
                            {u.projectTag && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  color: subTextColor,
                                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Tag size={10} />
                                {u.projectTag}
                              </span>
                            )}
                            {u.price && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  color: '#10b981',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  padding: '2px 8px',
                                  borderRadius: 6
                                }}
                              >
                                {u.price}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bottom Action Row: Action Button + Social Interactions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            paddingTop: 14,
                            borderTop: `1px solid ${cardBorder}`,
                            marginTop: 'auto',
                            flexWrap: 'wrap'
                          }}
                        >
                          {/* Direct CTA Action Button with Smooth SPA Navigation */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (actionUrl.startsWith('#')) {
                                const el = document.querySelector(actionUrl);
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              } else if (actionUrl.startsWith('/')) {
                                navigate(actionUrl);
                              } else {
                                window.open(actionUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 18px',
                              borderRadius: 999,
                              background: isDark ? '#ffffff' : '#0f1115',
                              border: 'none',
                              color: isDark ? '#0f1115' : '#ffffff',
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 12.5,
                              fontWeight: 750,
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.03)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span>{actionLabel}</span>
                            <ArrowUpRight size={14} />
                          </button>

                          {/* Social Interactions: Like & Share (Clean Icons) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleToggleLike(u.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: `1px solid ${isLiked ? '#ef4444' : cardBorder}`,
                                background: isLiked ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                color: isLiked ? '#ef4444' : subTextColor,
                                fontSize: 12,
                                fontWeight: 750,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Sukai rilis ini"
                            >
                              <Heart size={13} fill={isLiked ? '#ef4444' : 'none'} />
                              <span>{likesCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShare(u)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: `1px solid ${cardBorder}`,
                                background: 'transparent',
                                color: copiedId === u.id ? '#10b981' : subTextColor,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Bagikan tautan rilis"
                            >
                              {copiedId === u.id ? <Check size={14} /> : <Share2 size={13} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                });
              })()}

              {/* ── PROGRESSIVE LOAD MORE CONTROL ── */}
              {!showSingleOnly && visibleCount < filteredAndSortedUpdates.length && (
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                    padding: '22px 20px',
                    borderRadius: 18,
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    textAlign: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: subTextColor, fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span>Menampilkan {Math.min(visibleCount, filteredAndSortedUpdates.length)} dari {filteredAndSortedUpdates.length} rilis</span>
                    <div style={{ width: 120, height: 6, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (Math.min(visibleCount, filteredAndSortedUpdates.length) / filteredAndSortedUpdates.length) * 100)}%`,
                        height: '100%',
                        background: accentColor,
                        borderRadius: 100,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        setVisibleCount(prev => prev + PAGE_BATCH_SIZE);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '11px 24px',
                        borderRadius: 12,
                        border: 'none',
                        background: accentColor,
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <span>Muat 6 Rilis Lagi</span>
                      <ChevronDown size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptic.medium();
                        setVisibleCount(filteredAndSortedUpdates.length);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '11px 18px',
                        borderRadius: 12,
                        border: `1px solid ${cardBorder}`,
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        color: textColor,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <Sparkles size={14} color={accentColor} />
                      <span>Tampilkan Semua ({filteredAndSortedUpdates.length})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SPOTLIGHT EXPLORE CTA (WHEN IN SINGLE MODE ON HOMEPAGE) ── */}
          {showSingleOnly && (
            <div
              data-reveal="true"
              style={{
                marginTop: 36,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 18
              }}
            >
              {/* Quick Category Jump Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  flexWrap: 'wrap'
                }}
              >
                {categories.filter(c => c.id !== 'all' && c.count > 0).map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        try { haptic.light(); } catch { }
                        navigate(`/updates?category=${cat.id}`);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 16px',
                        borderRadius: 100,
                        border: `1px solid ${cardBorder}`,
                        background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                        color: subTextColor,
                        fontSize: 12,
                        fontWeight: 750,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${accentColor}50`;
                        e.currentTarget.style.color = textColor;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = cardBorder;
                        e.currentTarget.style.color = subTextColor;
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <Icon size={12} color={accentColor} />
                      <span>{cat.label} ({cat.count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Main Primary Button to Navigate to /updates */}
              <button
                type="button"
                onClick={() => navigate(seeMoreUrl)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 34px',
                  borderRadius: 14,
                  background: accentColor,
                  color: '#ffffff',
                  border: 'none',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <span>{seeMoreLabel} ({updates.filter(u => u.isPublished !== false).length} Rilis)</span>
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── LIGHTBOX MODAL VIA PORTAL (GUARANTEED VIEWPORT CENTERING) ── */}
      {lightboxState && typeof document !== 'undefined' && createPortal(
        <div
          id="sumr-lightbox-portal"
          onClick={() => setLightboxState(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999999,
            background: 'rgba(5, 7, 15, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            boxSizing: 'border-box',
            touchAction: 'none',
            animation: 'fadeIn 0.18s ease-out forwards'
          }}
        >
          {/* Top Bar inside Lightbox */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 20,
              right: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30,
              pointerEvents: 'none'
            }}
          >
            {/* Title / Counter Badge */}
            <div
              style={{
                pointerEvents: 'auto',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 100,
                padding: '6px 14px',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                maxWidth: 'calc(100% - 60px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
              }}
            >
              <span style={{ color: accentColor }}>●</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lightboxState.title || 'Pratinjau Media'}
              </span>
              {lightboxState.mediaUrls.length > 1 && (
                <span style={{ opacity: 0.65, fontSize: 11, marginLeft: 2 }}>
                  ({lightboxState.currentIndex + 1} / {lightboxState.mediaUrls.length})
                </span>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                try { haptic.light(); } catch { }
                setLightboxState(null);
              }}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: '50%',
                width: 38,
                height: 38,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.transform = 'none';
              }}
              aria-label="Tutup Pratinjau (Esc)"
              title="Tutup (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Center Image Container */}
          <div
            style={{
              position: 'relative',
              maxWidth: 'min(92vw, 1100px)',
              maxHeight: 'min(82vh, 850px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 'auto',
              borderRadius: 16
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button (if multiple images) */}
            {lightboxState.mediaUrls.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try { haptic.light(); } catch { }
                  setLightboxState(prev => prev ? ({
                    ...prev,
                    currentIndex: (prev.currentIndex - 1 + prev.mediaUrls.length) % prev.mediaUrls.length
                  }) : null);
                }}
                style={{
                  position: 'absolute',
                  left: -18,
                  zIndex: 20,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '50%',
                  width: 42,
                  height: 42,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                aria-label="Foto Sebelumnya"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* The Image */}
            <img
              key={lightboxState.mediaUrls[lightboxState.currentIndex]}
              src={lightboxState.mediaUrls[lightboxState.currentIndex]}
              alt={lightboxState.title || 'Pratinjau Media'}
              style={{
                maxWidth: 'min(90vw, 1080px)',
                maxHeight: 'min(80vh, 800px)',
                width: 'auto',
                height: 'auto',
                borderRadius: 14,
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            />

            {/* Next Button (if multiple images) */}
            {lightboxState.mediaUrls.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try { haptic.light(); } catch { }
                  setLightboxState(prev => prev ? ({
                    ...prev,
                    currentIndex: (prev.currentIndex + 1) % prev.mediaUrls.length
                  }) : null);
                }}
                style={{
                  position: 'absolute',
                  right: -18,
                  zIndex: 20,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '50%',
                  width: 42,
                  height: 42,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                aria-label="Foto Selanjutnya"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default LPCompanyUpdatesHub;
