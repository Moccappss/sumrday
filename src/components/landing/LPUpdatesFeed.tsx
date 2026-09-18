import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MessageSquare, Heart, Share2, Calendar, Tag, ArrowUpRight, ArrowRight,
  CheckCircle2, Pin, Eye, ChevronDown, ChevronUp, Image as ImageIcon,
  ExternalLink, Sparkles, MessageCircle, X, Maximize2, Search,
  Bookmark, BookmarkCheck, Flame, Clock, Filter, SlidersHorizontal,
  Check, Layers, Award
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { SocialUpdate, DEFAULT_SOCIAL_UPDATES, UpdateSticker } from '../../types/socialUpdates';
import UpdateStickerRenderer from './UpdateStickerRenderer';

interface LPUpdatesFeedProps {
  isDark?: boolean;
  accentColor?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  maxPosts?: number;
  showSocialStats?: boolean;
  onEditSection?: () => void;
  isEditableInVisualWeb?: boolean;
  onUpdateBadge?: (val: string) => void;
  onUpdateTitle?: (val: string) => void;
  onUpdateSubtitle?: (val: string) => void;
  showOnlyPinnedOrSingle?: boolean;
  showSeeMore?: boolean;
  seeMoreUrl?: string;
  seeMoreLabel?: string;
  hideBorderTop?: boolean;
  customBg?: string;
}

export interface ClubReactionItem {
  id: string;
  emoji: string;
  label: string;
}

export const CLUB_REACTIONS: ClubReactionItem[] = [
  { id: 'sun', emoji: '☀️', label: 'Hangat' },
  { id: 'coffee', emoji: '☕', label: 'Chill' },
  { id: 'spark', emoji: '💡', label: 'Inspiratif' },
  { id: 'lofi', emoji: '🎧', label: 'Lo-Fi' },
  { id: 'skena', emoji: '🔥', label: 'Skena' }
];

export const LPUpdatesFeed: React.FC<LPUpdatesFeedProps> = ({
  isDark = true,
  accentColor = '#f59e0b',
  badge = 'UTAS & CERITA HANGAT',
  title = 'Jurnal Kreatif & Update Proyek',
  subtitle = 'Catatan progres, kilas balik karya, dan cerita seru dari balik layar sumr.day ☀️',
  maxPosts = 6,
  showSocialStats = true,
  onEditSection,
  isEditableInVisualWeb = false,
  onUpdateBadge,
  onUpdateTitle,
  onUpdateSubtitle,
  showOnlyPinnedOrSingle = false,
  showSeeMore,
  seeMoreUrl = '/updates',
  seeMoreLabel = 'Selengkapnya ✨',
  hideBorderTop = false,
  customBg
}) => {
  const [updates, setUpdates] = useState<SocialUpdate[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState<boolean>(false);
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({});
  const [reactionsMap, setReactionsMap] = useState<Record<string, Record<string, number>>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string | null>>({});
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: string; emoji: string; key: number }>>([]);
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [revealedPostIds, setRevealedPostIds] = useState<Record<string, boolean>>({});

  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('porto_bookmarked_updates');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Load updates and reaction states
  useEffect(() => {
    const loadUpdates = async () => {
      try {
        const [saved, savedReactions] = await Promise.all([
          storage.getItem('porto_social_updates', null),
          storage.getItem('porto_updates_reactions', {})
        ]);
        const list: SocialUpdate[] = (Array.isArray(saved) && saved.length > 0) ? saved : DEFAULT_SOCIAL_UPDATES;
        setUpdates(list);

        // Initialize likes counts
        const initialLikes: Record<string, number> = {};
        list.forEach(u => {
          initialLikes[u.id] = u.likesCount || 0;
        });
        setLikesCountMap(initialLikes);

        // Initialize multi-reactions map
        const initialReactions: Record<string, Record<string, number>> = { ...(savedReactions || {}) };
        list.forEach(u => {
          if (!initialReactions[u.id]) {
            const baseLikes = u.likesCount || 0;
            initialReactions[u.id] = {
              sun: Math.max(1, Math.floor(baseLikes * 0.45)),
              coffee: Math.max(1, Math.floor(baseLikes * 0.25)),
              spark: Math.max(1, Math.floor(baseLikes * 0.15)),
              lofi: Math.max(1, Math.floor(baseLikes * 0.10)),
              skena: Math.max(1, Math.floor(baseLikes * 0.05))
            };
          }
        });
        setReactionsMap(initialReactions);

        // Load user's reaction choices from localStorage
        const savedUserReactions: Record<string, string | null> = {};
        list.forEach(u => {
          try {
            const val = localStorage.getItem(`reaction_update_${u.id}`);
            if (val) savedUserReactions[u.id] = val;
          } catch (e) {}
        });
        setUserReactions(savedUserReactions);
      } catch (err) {
        setUpdates(DEFAULT_SOCIAL_UPDATES);
      }
    };

    loadUpdates();

    const handleRemoteUpdate = async () => {
      try {
        const fresh = await storage.getItem('porto_social_updates', null);
        if (Array.isArray(fresh)) {
          setUpdates(fresh);
        }
      } catch (e) {}
    };

    window.addEventListener('porto_updates_updated', handleRemoteUpdate);
    return () => window.removeEventListener('porto_updates_updated', handleRemoteUpdate);
  }, []);

  // Deep-link anchor scrolling & highlight on mount / hash change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('update-card-target-highlight');
          setTimeout(() => el.classList.remove('update-card-target-highlight'), 3000);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [updates]);

  // High-performance IntersectionObserver for "Spill Satu Persatu saat di scroll"
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      const all: Record<string, boolean> = {};
      updates.forEach(u => { all[u.id] = true; });
      setRevealedPostIds(all);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-post-id');
          if (id) {
            setRevealedPostIds(prev => ({ ...prev, [id]: true }));
            observer.unobserve(entry.target);
          }
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -30px 0px'
    });

    const cards = document.querySelectorAll('.update-card-spill');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [updates, selectedYear, selectedTag, searchQuery, sortBy, showBookmarkedOnly, showOnlyPinnedOrSingle]);

  // Interactive multi-reaction with floating emoji particle animation
  const handleReaction = (postId: string, reactionId: string, emoji: string) => {
    const currentReaction = userReactions[postId];
    const isRemoving = currentReaction === reactionId;
    const nextReaction = isRemoving ? null : reactionId;

    setUserReactions(prev => {
      const next = { ...prev, [postId]: nextReaction };
      try {
        if (nextReaction) {
          localStorage.setItem(`reaction_update_${postId}`, nextReaction);
        } else {
          localStorage.removeItem(`reaction_update_${postId}`);
        }
      } catch (e) {}
      return next;
    });

    setReactionsMap(prev => {
      const postCounts = { ...(prev[postId] || { sun: 0, coffee: 0, spark: 0, lofi: 0, skena: 0 }) };
      if (currentReaction && (postCounts[currentReaction] ?? 0) > 0) {
        postCounts[currentReaction] = Math.max(0, (postCounts[currentReaction] ?? 0) - 1);
      }
      if (!isRemoving) {
        postCounts[reactionId] = (postCounts[reactionId] ?? 0) + 1;
      }
      const updated = { ...prev, [postId]: postCounts };
      try {
        storage.setItem('porto_updates_reactions', updated);
      } catch (e) {}
      return updated;
    });

    if (!isRemoving) {
      const key = Date.now() + Math.random();
      setFloatingParticles(prev => [...prev, { id: postId, emoji, key }]);
      setTimeout(() => {
        setFloatingParticles(prev => prev.filter(p => p.key !== key));
      }, 950);

      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(10);
        }
      } catch (e) {}
    }
  };

  // Toggle Bookmark post
  const handleToggleBookmark = (id: string) => {
    setBookmarkedPosts(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('porto_bookmarked_updates', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Smart share with direct deep link anchor
  const handleShare = (item: SocialUpdate) => {
    const url = `${window.location.origin}/updates#${item.id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: item.projectTag ? `Update: ${item.projectTag}` : 'Update Studi Kasus',
        text: item.content.slice(0, 120) + '...',
        url
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedPostId(item.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPostIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Extract available years with counts
  const availableYears = useMemo(() => {
    const map: Record<string, number> = {};
    updates.forEach(u => {
      if (u.isPublished !== false) {
        const d = new Date(u.customDate || u.createdAt);
        const y = isNaN(d.getFullYear()) ? '2026' : String(d.getFullYear());
        map[y] = (map[y] || 0) + 1;
      }
    });
    return Object.keys(map).sort((a, b) => Number(b) - Number(a)).map(yr => ({
      year: yr,
      count: map[yr]
    }));
  }, [updates]);

  // Extract all unique project tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    updates.forEach(u => {
      if (u.isPublished !== false && u.projectTag) {
        tags.add(u.projectTag.trim());
      }
    });
    return Array.from(tags);
  }, [updates]);

  // Count bookmarked posts
  const bookmarkedCount = useMemo(() => {
    return Object.values(bookmarkedPosts).filter(Boolean).length;
  }, [bookmarkedPosts]);

  // Total reactions across all updates
  const totalReactions = useMemo(() => {
    return updates.reduce((acc, curr) => {
      const counts = reactionsMap[curr.id];
      if (counts) {
        return acc + Object.values(counts).reduce((a, b) => a + b, 0);
      }
      return acc + (likesCountMap[curr.id] ?? curr.likesCount ?? 0);
    }, 0);
  }, [updates, reactionsMap, likesCountMap]);

  // Filter & sort
  const publishedUpdates = useMemo(() => {
    const active = updates.filter(u => u.isPublished !== false);

    // On Beranda (Single/Pinned preview)
    if (showOnlyPinnedOrSingle) {
      if (active.length === 0) return [];
      const pinned = active.find(u => u.isPinned);
      if (pinned) return [pinned];
      const sorted = [...active].sort((a, b) => {
        const dateA = new Date(a.customDate || a.createdAt).getTime();
        const dateB = new Date(b.customDate || b.createdAt).getTime();
        return dateB - dateA;
      });
      return [sorted[0]];
    }

    return active
      .filter(u => {
        // Year filter
        if (selectedYear !== 'all') {
          const d = new Date(u.customDate || u.createdAt);
          const y = isNaN(d.getFullYear()) ? '2026' : String(d.getFullYear());
          if (y !== selectedYear) return false;
        }
        // Tag filter
        if (selectedTag !== 'all') {
          if (u.projectTag !== selectedTag) return false;
        }
        // Bookmark filter
        if (showBookmarkedOnly) {
          if (!bookmarkedPosts[u.id]) return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchContent = u.content.toLowerCase().includes(q);
          const matchTag = u.projectTag?.toLowerCase().includes(q);
          const matchAuthor = u.author?.name.toLowerCase().includes(q);
          if (!matchContent && !matchTag && !matchAuthor) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort order
        if (sortBy === 'popular') {
          const getPostTotal = (p: SocialUpdate) => {
            const counts = reactionsMap[p.id];
            if (counts) {
              return Object.values(counts).reduce((a, b) => a + b, 0);
            }
            return likesCountMap[p.id] ?? p.likesCount ?? 0;
          };
          return getPostTotal(b) - getPostTotal(a);
        }
        // By default: Pinned first, then latest date
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const dateA = new Date(a.customDate || a.createdAt).getTime();
        const dateB = new Date(b.customDate || b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, maxPosts);
  }, [
    updates, selectedYear, selectedTag, searchQuery, sortBy, 
    showBookmarkedOnly, bookmarkedPosts, likesCountMap, maxPosts, 
    showOnlyPinnedOrSingle
  ]);

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return 'Terkini';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Terkini';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      if (diffMs < 0) return formatDateLabel(dateStr);
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 5) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      if (diffHour < 24) return `${diffHour} jam lalu`;
      if (diffDay === 1) return 'Kemarin';
      if (diffDay < 7) return `${diffDay} hari lalu`;
      if (diffDay < 30) return `${Math.floor(diffDay / 7)} minggu lalu`;
      if (diffDay < 365) return `${Math.floor(diffDay / 30)} bln lalu`;
      return `${Math.floor(diffDay / 365)} thn lalu`;
    } catch (e) {
      return formatDateLabel(dateStr);
    }
  };

  const getReadTime = (content: string) => {
    const words = content.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 150));
    return `${mins} mnt baca`;
  };

  const handleUpdatePostSticker = async (postId: string, newSticker: UpdateSticker) => {
    const nextList = updates.map(u => u.id === postId ? { ...u, sticker: newSticker } : u);
    setUpdates(nextList);
    await storage.setItem('porto_social_updates', nextList);
    window.dispatchEvent(new CustomEvent('porto_updates_updated', { detail: nextList }));
  };

  // Color variables based on theme
  const bgCard = isDark ? 'rgba(18, 18, 28, 0.75)' : 'rgba(255, 255, 255, 0.92)';
  const borderCard = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const tagBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';

  // The "Selengkapnya" CTA must ONLY show when explicitly requested or when in single-preview on Beranda
  const shouldShowSeeMore = (showSeeMore !== undefined ? showSeeMore : showOnlyPinnedOrSingle) && publishedUpdates.length > 0;

  return (
    <section
      id="updates"
      style={{
        padding: showOnlyPinnedOrSingle ? '70px 24px' : '60px 24px 100px',
        position: 'relative',
        background: customBg !== undefined ? customBg : (isDark ? '#080811' : '#f8fafc'),
        borderTop: hideBorderTop ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}>
        
        {/* ── SECTION HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: showOnlyPinnedOrSingle ? 36 : 28 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 16px',
            borderRadius: 100,
            background: `${accentColor}18`,
            color: accentColor,
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: '0.06em',
            marginBottom: 14,
            border: `1px solid ${accentColor}33`,
            textTransform: 'uppercase'
          }}>
            <Sparkles size={13} />
            <span
              contentEditable={isEditableInVisualWeb}
              suppressContentEditableWarning
              onBlur={e => onUpdateBadge?.(e.currentTarget.textContent || badge)}
              style={{ outline: 'none' }}
            >
              {badge}
            </span>
          </div>

          {/* Title */}
          <h2
            contentEditable={isEditableInVisualWeb}
            suppressContentEditableWarning
            onBlur={e => onUpdateTitle?.(e.currentTarget.textContent || title)}
            style={{
              margin: '0 0 12px',
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 900,
              color: textPrimary,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.02em',
              outline: 'none'
            }}
          >
            {title}
          </h2>

          {/* Subtitle */}
          <p
            contentEditable={isEditableInVisualWeb}
            suppressContentEditableWarning
            onBlur={e => onUpdateSubtitle?.(e.currentTarget.textContent || subtitle)}
            style={{
              margin: '0 auto',
              maxWidth: 620,
              fontSize: 15,
              lineHeight: 1.6,
              color: textSecondary,
              outline: 'none'
            }}
          >
            {subtitle}
          </p>

          {/* Quick Edit in VisualWeb button */}
          {isEditableInVisualWeb && onEditSection && (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={onEditSection}
                style={{
                  padding: '5px 14px',
                  borderRadius: 100,
                  border: `1px solid ${accentColor}`,
                  background: `${accentColor}15`,
                  color: accentColor,
                  fontSize: 11.5,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                ✏️ Kelola Postingan di Website Studio
              </button>
            </div>
          )}
        </div>

        {/* ── ADVANCED STATS & CONTROLS (ONLY ON FULL UPDATES PAGE) ── */}
        {!showOnlyPinnedOrSingle && (
          <div style={{ marginBottom: 32 }}>
            {/* Top Stat Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 20
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 100,
                background: tagBg,
                border: `1px solid ${borderCard}`,
                fontSize: 12,
                color: textSecondary,
                fontWeight: 700
              }}>
                <MessageSquare size={13} color={accentColor} />
                <span><strong style={{ color: textPrimary }}>{updates.filter(u => u.isPublished !== false).length}</strong> Catatan Update</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 100,
                background: tagBg,
                border: `1px solid ${borderCard}`,
                fontSize: 12,
                color: textSecondary,
                fontWeight: 700
              }}>
                <Sparkles size={13} color={accentColor} />
                <span><strong style={{ color: textPrimary }}>{totalReactions}</strong> Apresiasi Komunitas</span>
              </div>

              {availableYears.length > 0 && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 100,
                  background: tagBg,
                  border: `1px solid ${borderCard}`,
                  fontSize: 12,
                  color: textSecondary,
                  fontWeight: 700
                }}>
                  <Calendar size={13} color="#10b981" />
                  <span>Linimasa <strong style={{ color: textPrimary }}>{availableYears[availableYears.length - 1]?.year} — {availableYears[0]?.year}</strong></span>
                </div>
              )}
            </div>

            {/* Search Bar & Action Controls Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              background: bgCard,
              padding: '10px 14px',
              borderRadius: 20,
              border: `1px solid ${borderCard}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 16px rgba(0,0,0,0.03)',
              marginBottom: 16
            }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
                <Search 
                  size={15} 
                  color={textSecondary} 
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
                />
                <input
                  type="text"
                  placeholder="Cari update, topik, atau kata kunci..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 36px',
                    borderRadius: 100,
                    border: `1px solid ${borderCard}`,
                    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                    color: textPrimary,
                    fontSize: 13,
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = accentColor}
                  onBlur={e => e.currentTarget.style.borderColor = borderCard}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', padding: 2, cursor: 'pointer',
                      color: textSecondary, display: 'flex', alignItems: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sort Toggle & Bookmark Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Sort Mode: Latest vs Popular */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)',
                  borderRadius: 100,
                  padding: 2,
                  border: `1px solid ${borderCard}`
                }}>
                  <button
                    type="button"
                    onClick={() => setSortBy('latest')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 12px',
                      borderRadius: 100,
                      border: 'none',
                      background: sortBy === 'latest' ? accentColor : 'transparent',
                      color: sortBy === 'latest' ? '#ffffff' : textSecondary,
                      fontSize: 11.5,
                      fontWeight: 750,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
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
                      gap: 4,
                      padding: '5px 12px',
                      borderRadius: 100,
                      border: 'none',
                      background: sortBy === 'popular' ? accentColor : 'transparent',
                      color: sortBy === 'popular' ? '#ffffff' : textSecondary,
                      fontSize: 11.5,
                      fontWeight: 750,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Flame size={12} />
                    <span>Terpopuler</span>
                  </button>
                </div>

                {/* Bookmark Toggle Tab */}
                <button
                  type="button"
                  onClick={() => setShowBookmarkedOnly(prev => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 14px',
                    borderRadius: 100,
                    border: showBookmarkedOnly ? `1px solid ${accentColor}` : `1px solid ${borderCard}`,
                    background: showBookmarkedOnly ? `${accentColor}20` : 'transparent',
                    color: showBookmarkedOnly ? accentColor : textSecondary,
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Lihat update yang Anda simpan"
                >
                  <Bookmark size={13} fill={showBookmarkedOnly ? accentColor : 'none'} />
                  <span>Tersimpan {bookmarkedCount > 0 ? `(${bookmarkedCount})` : ''}</span>
                </button>
              </div>
            </div>

            {/* Category / Project Tag Chips */}
            {allTags.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                overflowX: 'auto',
                paddingBottom: 6,
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                marginBottom: 14
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 14px',
                    borderRadius: 100,
                    border: selectedTag === 'all' ? `1px solid ${accentColor}` : `1px solid ${borderCard}`,
                    background: selectedTag === 'all' ? accentColor : bgCard,
                    color: selectedTag === 'all' ? '#ffffff' : textSecondary,
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Semua Topik</span>
                </button>

                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 14px',
                      borderRadius: 100,
                      border: selectedTag === tag ? `1px solid ${accentColor}` : `1px solid ${borderCard}`,
                      background: selectedTag === tag ? accentColor : bgCard,
                      color: selectedTag === tag ? '#ffffff' : textSecondary,
                      fontSize: 12,
                      fontWeight: 750,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Tag size={11} />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Year Timeline Tabs */}
            {availableYears.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedYear('all')}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 100,
                    border: selectedYear === 'all' ? `1px solid ${accentColor}` : `1px solid ${borderCard}`,
                    background: selectedYear === 'all' ? (isDark ? `${accentColor}30` : `${accentColor}18`) : 'transparent',
                    color: selectedYear === 'all' ? accentColor : textSecondary,
                    fontSize: 11.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Semua Tahun
                </button>

                {availableYears.map(yr => (
                  <button
                    key={yr.year}
                    type="button"
                    onClick={() => setSelectedYear(yr.year)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 14px',
                      borderRadius: 100,
                      border: selectedYear === yr.year ? `1px solid ${accentColor}` : `1px solid ${borderCard}`,
                      background: selectedYear === yr.year ? (isDark ? `${accentColor}30` : `${accentColor}18`) : 'transparent',
                      color: selectedYear === yr.year ? accentColor : textSecondary,
                      fontSize: 11.5,
                      fontWeight: 750,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{yr.year}</span>
                    <span style={{
                      fontSize: 10,
                      opacity: 0.7,
                      padding: '1px 5px',
                      borderRadius: 10,
                      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                    }}>
                      {yr.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── UPDATES FEED STREAM ── */}
        {publishedUpdates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '56px 20px',
            background: bgCard,
            borderRadius: 24,
            border: `1px solid ${borderCard}`
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: `${accentColor}18`,
              color: accentColor,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              border: `1px solid ${accentColor}33`,
              fontSize: 24
            }}>
              ☀️
            </div>
            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: textPrimary }}>
              {showBookmarkedOnly 
                ? 'Belum ada update yang disimpan di simpananmu' 
                : searchQuery 
                  ? `Tidak ada cerita yang cocok dengan "${searchQuery}"`
                  : 'Belum ada catatan update pada filter ini'}
            </h4>
            <p style={{ margin: '8px auto 20px', maxWidth: 460, fontSize: 13.5, lineHeight: 1.6, color: textSecondary }}>
              {showBookmarkedOnly 
                ? 'Tap ikon bookmark pada kartu update untuk mengoleksi catatan seru ke daftar bacaan pribadimu.'
                : 'Tetap ikuti linimasa sumr.day club! Cerita segar dan wawasan kreatif berikutnya akan segera hadir di sini ☀️'}
            </p>
            {(searchQuery || selectedTag !== 'all' || selectedYear !== 'all' || showBookmarkedOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag('all');
                  setSelectedYear('all');
                  setShowBookmarkedOnly(false);
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: 100,
                  border: `1px solid ${accentColor}`,
                  background: `${accentColor}18`,
                  color: accentColor,
                  fontSize: 12.5,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {publishedUpdates.map((item, index) => {
              const isExpanded = !!expandedPostIds[item.id];
              const isLong = item.content.length > 280;
              const displayContent = (!isExpanded && isLong) 
                ? item.content.slice(0, 280) + '...' 
                : item.content;
              const isBookmarked = !!bookmarkedPosts[item.id];
              const isBackdated = item.customDate && new Date(item.customDate).getFullYear() < new Date().getFullYear();
              const isRevealed = !!revealedPostIds[item.id];
              const staggerDelay = showOnlyPinnedOrSingle ? 0 : (index % 6) * 110;

              return (
                <article
                  key={item.id}
                  id={item.id}
                  data-post-id={item.id}
                  data-reveal="true"
                  data-reveal-type="fade-up"
                  className={`update-card-spill ${isRevealed ? 'is-revealed' : ''}`}
                  style={{
                    background: bgCard,
                    border: item.isPinned 
                      ? `1.5px solid ${accentColor}66` 
                      : `1px solid ${borderCard}`,
                    borderRadius: 24,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: item.isPinned
                      ? (isDark ? `0 12px 40px -10px ${accentColor}25` : `0 10px 30px -5px ${accentColor}15`)
                      : (isDark ? '0 10px 30px rgba(0,0,0,0.25)' : '0 8px 24px rgba(0,0,0,0.04)'),
                    transitionDelay: `${staggerDelay}ms`,
                    position: 'relative'
                  }}
                >
                  {/* Floating Emoji Particles */}
                  {floatingParticles.filter(h => h.id === item.id).map(h => (
                    <span key={h.key} className="floating-emoji-particle">
                      +1 {h.emoji}
                    </span>
                  ))}

                  {/* Card Header: Author, Verification, Date & Read Time */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={item.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                        alt={item.author?.name || 'Author'}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `2px solid ${accentColor}44`
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 850, fontSize: 15, color: textPrimary, letterSpacing: '-0.01em' }}>
                            {item.author?.name || 'sumr.day'}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 7px',
                            borderRadius: 100,
                            background: `${accentColor}18`,
                            color: accentColor,
                            fontSize: 10.5,
                            fontWeight: 800,
                            border: `1px solid ${accentColor}33`
                          }}>
                            <span>☀️</span>
                            <span>Studio</span>
                          </span>
                          <CheckCircle2 size={15} color={accentColor} fill={`${accentColor}20`} />
                          
                          {item.isPinned && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 9px',
                              borderRadius: 100,
                              background: `${accentColor}20`,
                              color: accentColor,
                              fontSize: 10.5,
                              fontWeight: 800,
                              border: `1px solid ${accentColor}40`
                            }}>
                              <Pin size={10} />
                              Tersemat
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: textSecondary, fontWeight: 500 }}>
                            {item.author?.role || 'Creative Digital Studio • Warm Tech & Skena-Aesthetic'}
                          </span>
                          <span style={{ fontSize: 11, color: textSecondary }}>•</span>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: isBackdated ? '#f59e0b' : textSecondary
                          }}>
                            <Calendar size={11} />
                            <span>{getRelativeTime(item.customDate || item.createdAt)}</span>
                            <span style={{ opacity: 0.6, fontSize: 11 }}>({formatDateLabel(item.customDate || item.createdAt)})</span>
                          </div>
                          <span style={{ fontSize: 11, color: textSecondary }}>•</span>
                          <span style={{ fontSize: 11, color: textSecondary, fontWeight: 650 }}>
                            {getReadTime(item.content)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Project Tag & Bookmark button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.projectTag && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 12px',
                            borderRadius: 100,
                            background: `${accentColor}15`,
                            color: accentColor,
                            fontSize: 11.5,
                            fontWeight: 800,
                            border: `1px solid ${accentColor}30`
                          }}>
                            <Tag size={11} />
                            {item.projectTag}
                          </span>

                          {item.projectUrl && (
                            <a
                              href={item.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: `1px solid ${borderCard}`,
                                background: tagBg,
                                color: textSecondary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                              }}
                              title="Kunjungi link proyek terkait"
                            >
                              <ArrowUpRight size={13} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(item.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          border: `1px solid ${borderCard}`,
                          background: isBookmarked ? `${accentColor}20` : tagBg,
                          color: isBookmarked ? accentColor : textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title={isBookmarked ? "Hapus dari simpanan" : "Simpan update ini"}
                      >
                        <Bookmark size={13} fill={isBookmarked ? accentColor : 'none'} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{
                    fontSize: 14.5,
                    lineHeight: 1.75,
                    color: textPrimary,
                    whiteSpace: 'pre-line',
                    fontFamily: 'inherit'
                  }}>
                    {displayContent}
                    
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          marginLeft: 8,
                          background: 'none',
                          border: 'none',
                          color: accentColor,
                          fontWeight: 750,
                          fontSize: 13,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {isExpanded ? (
                          <><span>Tutup</span><ChevronUp size={13} /></>
                        ) : (
                          <><span>Baca selengkapnya</span><ChevronDown size={13} /></>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Attached Media Grid / Preview */}
                  {item.mediaUrls && item.mediaUrls.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: item.mediaUrls.length === 1 ? '1fr' : (item.mediaUrls.length === 2 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))'),
                      gap: 8,
                      borderRadius: 18,
                      overflow: 'hidden',
                      maxHeight: item.mediaUrls.length === 1 ? 460 : 320
                    }}>
                      {item.mediaUrls.map((url, mIdx) => {
                        const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                        return (
                          <div 
                            key={mIdx} 
                            style={{ 
                              position: 'relative', 
                              width: '100%', 
                              height: '100%', 
                              minHeight: 190, 
                              background: '#000000',
                              cursor: isVideo ? 'default' : 'pointer'
                            }}
                            onClick={() => !isVideo && setLightboxMedia(url)}
                          >
                            {isVideo ? (
                              <video 
                                src={url} 
                                controls 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <>
                                <img 
                                  src={url} 
                                  alt={`Media ${mIdx + 1}`} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                                <div style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  padding: 5,
                                  borderRadius: '50%',
                                  background: 'rgba(0,0,0,0.5)',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  pointerEvents: 'none'
                                }}>
                                  <Maximize2 size={12} />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Interactive Sticker Block (Poling, This or That, Rate Geser, QnA) */}
                  {item.sticker && (
                    <UpdateStickerRenderer
                      postId={item.id}
                      sticker={item.sticker}
                      isDark={isDark}
                      accentColor={accentColor}
                      onUpdateSticker={(newSticker) => handleUpdatePostSticker(item.id, newSticker)}
                    />
                  )}

                  {/* Social Interactions Bottom Bar with Club Reactions */}
                  {showSocialStats && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 14,
                      borderTop: `1px solid ${borderCard}`,
                      marginTop: 4,
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      {/* Club Multi-Reactions Pill Bar */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap'
                      }}>
                        {CLUB_REACTIONS.map(reaction => {
                          const count = reactionsMap[item.id]?.[reaction.id] ?? 0;
                          const isSelected = userReactions[item.id] === reaction.id;

                          return (
                            <button
                              key={reaction.id}
                              type="button"
                              onClick={() => handleReaction(item.id, reaction.id, reaction.emoji)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 12px',
                                borderRadius: 100,
                                border: isSelected 
                                  ? `1.5px solid ${accentColor}` 
                                  : `1px solid ${borderCard}`,
                                background: isSelected 
                                  ? `${accentColor}25` 
                                  : tagBg,
                                color: isSelected ? accentColor : textSecondary,
                                fontSize: 12,
                                fontWeight: isSelected ? 850 : 650,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: isSelected ? `0 2px 10px ${accentColor}30` : 'none',
                                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                              }}
                              onMouseEnter={e => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = `${accentColor}50`;
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = borderCard;
                                  e.currentTarget.style.transform = 'none';
                                }
                              }}
                              title={`Beri apresiasi ${reaction.label} (${reaction.emoji})`}
                            >
                              <span style={{ fontSize: 14, lineHeight: 1 }}>{reaction.emoji}</span>
                              <span style={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Share & Project CTA */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleShare(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 100,
                            border: `1px solid ${borderCard}`,
                            background: tagBg,
                            color: textSecondary,
                            fontSize: 12,
                            fontWeight: 750,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Salin link langsung update ini"
                        >
                          <Share2 size={13} />
                          <span>{copiedPostId === item.id ? 'Tersalin!' : 'Bagikan'}</span>
                        </button>

                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '6px 14px',
                              borderRadius: 100,
                              background: `${accentColor}18`,
                              border: `1px solid ${accentColor}35`,
                              color: accentColor,
                              fontSize: 12,
                              fontWeight: 800,
                              textDecoration: 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>Buka Karya</span>
                            <ArrowUpRight size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* ── SELENGKAPNYA CTA BUTTON (ONLY SHOWN ON BERANDA/SINGLE PREVIEW) ── */}
        {shouldShowSeeMore && (
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <a
              href={seeMoreUrl || '/updates'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 100,
                background: accentColor,
                color: '#ffffff',
                fontSize: 13.5,
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                textDecoration: 'none',
                boxShadow: `0 8px 24px ${accentColor}40`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 12px 28px ${accentColor}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}40`;
              }}
            >
              <span>{seeMoreLabel || 'Selengkapnya'}</span>
              <ArrowRight size={16} />
            </a>
          </div>
        )}

        {/* Footer notification on full /updates page when all posts loaded */}
        {!showOnlyPinnedOrSingle && publishedUpdates.length > 0 && (
          <div style={{
            marginTop: 48,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 100,
              background: tagBg,
              border: `1px solid ${borderCard}`,
              color: textSecondary,
              fontSize: 12.5,
              fontWeight: 650
            }}>
              <Sparkles size={14} color={accentColor} style={{ flexShrink: 0, margin: 0, display: 'inline-block' }} />
              <span style={{ margin: 0 }}>Semua linimasa update telah ditampilkan</span>
            </div>
          </div>
        )}

      </div>

      {/* ── LIGHTBOX MEDIA POPUP ── */}
      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out'
          }}
        >
          <button
            onClick={() => setLightboxMedia(null)}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxMedia}
            alt="Preview Fullscreen"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '90vh',
              borderRadius: 16,
              objectFit: 'contain',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              cursor: 'default'
            }}
          />
        </div>
      )}
    </section>
  );
};

export default LPUpdatesFeed;
