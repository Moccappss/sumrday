import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, FileText, Calendar, Eye, Clock, TrendingUp, Sparkles, 
  ArrowRight, BookOpen, Layers, Filter, Compass, Tag, Share2, 
  Bookmark, CheckCircle2, RotateCcw, ChevronRight
} from 'lucide-react';
import { storage } from '../utils/storage';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import PageHeroHeader from '../components/common/PageHeroHeader';

export interface BlogPostType {
  id: string;
  slug?: string;
  title: string;
  content: string;
  category: string;
  date: string;
  thumbnail?: string;
  status: string;
  views?: number;
  tags?: string;
  metaTitle?: string;
  metaDescription?: string;
  readTime?: number;
}

const getReadingTime = (content?: string, readTime?: number) => {
  if (readTime && readTime > 0) return readTime;
  if (!content) return 2;
  const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
};

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
};

/* ── Skeleton Loading ── */
const SkeletonCard: React.FC<{ featured?: boolean }> = ({ featured = false }) => (
  <div style={{
    background: 'var(--blog-card-bg)',
    border: '1px solid var(--blog-border)',
    borderRadius: featured ? 24 : 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: featured ? 'row' as const : 'column' as const,
  }}>
    <style>{`
      @keyframes blog-sk {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .blog-sk-el {
        background: linear-gradient(90deg, var(--blog-sk1) 25%, var(--blog-sk2) 50%, var(--blog-sk1) 75%);
        background-size: 200% 100%;
        animation: blog-sk 2.6s ease-in-out infinite;
        border-radius: 8px;
      }
    `}</style>
    <div className="blog-sk-el" style={{ flexShrink: 0, width: featured ? '45%' : '100%', height: featured ? 'auto' : 210, minHeight: featured ? 280 : undefined }} />
    <div style={{ padding: featured ? '36px 32px' : '24px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="blog-sk-el" style={{ height: 16, width: '28%' }} />
      <div className="blog-sk-el" style={{ height: 26, width: '90%' }} />
      <div className="blog-sk-el" style={{ height: 14, width: '100%' }} />
      <div className="blog-sk-el" style={{ height: 14, width: '75%' }} />
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: 14 }}>
        <div className="blog-sk-el" style={{ height: 14, width: '35%' }} />
        <div className="blog-sk-el" style={{ height: 14, width: '20%' }} />
      </div>
    </div>
  </div>
);

/* ── Fallback Abstract Gradient Cover ── */
const AbstractCover: React.FC<{ category?: string; title?: string; size?: 'lg' | 'md' }> = ({ category = 'Artikel', title = '', size = 'md' }) => {
  const isLarge = size === 'lg';
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: isLarge ? 280 : 200,
      background: 'var(--blog-img-placeholder)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isLarge ? 32 : 20,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        width: isLarge ? 220 : 140,
        height: isLarge ? 220 : 140,
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--blog-accent-25) 0%, transparent 70%)',
        filter: 'blur(20px)',
        top: '10%',
        right: '10%',
        pointerEvents: 'none'
      }} />
      <div style={{
        width: isLarge ? 64 : 48,
        height: isLarge ? 64 : 48,
        borderRadius: isLarge ? 20 : 16,
        background: 'var(--blog-card-bg)',
        border: '1px solid var(--blog-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px var(--blog-shadow)',
        marginBottom: 12,
        position: 'relative',
        zIndex: 2
      }}>
        <BookOpen size={isLarge ? 30 : 22} style={{ color: 'var(--blog-accent)' }} />
      </div>
      <span style={{
        fontSize: isLarge ? 12 : 11,
        fontWeight: 800,
        color: 'var(--blog-accent)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        zIndex: 2
      }}>
        {category}
      </span>
      {isLarge && title && (
        <span style={{
          marginTop: 6,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--blog-text-muted)',
          maxWidth: '80%',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          zIndex: 2
        }}>
          {title}
        </span>
      )}
    </div>
  );
};

/* ── Hero Featured Card ── */
const FeaturedHeroCard: React.FC<{ post: BlogPostType; onClick: () => void }> = ({ post, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      data-card-3d="true"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        background: 'var(--blog-card-bg)',
        border: `1.5px solid ${isHovered ? 'var(--blog-accent-35)' : 'var(--blog-border)'}`,
        borderRadius: 22,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}
    >
      {/* Visual Image / Cover */}
      <div style={{ minHeight: 280, position: 'relative', overflow: 'hidden', background: 'var(--blog-img-placeholder)' }}>
        {post.thumbnail ? (
          <>
            <img
              src={post.thumbnail}
              alt={post.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)' }} />
          </>
        ) : (
          <AbstractCover category={post.category} title={post.title} size="lg" />
        )}

        {/* Featured Badge */}
        <div style={{
          position: 'absolute',
          top: 18,
          left: 18,
          background: 'linear-gradient(135deg, var(--blog-accent), #9333ea)',
          color: '#fff',
          padding: '6px 14px',
          borderRadius: 99,
          fontSize: 11,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          boxShadow: '0 4px 16px var(--blog-accent-40)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Sparkles size={12} /> Pilihan Utama
        </div>
      </div>

      {/* Content Meta & Details */}
      <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: 99,
            background: 'var(--blog-accent-12)',
            color: 'var(--blog-accent)',
            fontSize: 11,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: '1px solid var(--blog-accent-25)'
          }}>
            {post.category || 'Umum'}
          </span>
          <span style={{ color: 'var(--blog-text-muted)', fontSize: 12, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <Clock size={13} /> {getReadingTime(post.content, post.readTime)} min baca
          </span>
        </div>

        <h2 style={{
          margin: 0,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(20px, 2.4vw, 28px)',
          color: isHovered ? 'var(--blog-accent)' : 'var(--blog-text)',
          lineHeight: 1.28,
          letterSpacing: '-0.02em',
          transition: 'color 0.2s ease',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden'
        }}>
          {post.title}
        </h2>

        <p style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: 14.5,
          color: 'var(--blog-text-muted)',
          lineHeight: 1.7,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden'
        }}>
          {stripHtml(post.content)}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid var(--blog-border)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: 16, color: 'var(--blog-text-muted)', fontSize: 12.5, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} /> {post.date}
            </span>
            {typeof post.views === 'number' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {post.views} dilihat
              </span>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 99,
            background: isHovered ? 'var(--blog-accent)' : 'transparent',
            color: isHovered ? '#fff' : 'var(--blog-accent)',
            border: `1.5px solid ${isHovered ? 'var(--blog-accent)' : 'var(--blog-accent-25)'}`,
            fontSize: 12.5,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            transition: 'all 0.25s ease'
          }}>
            Baca Artikel <ArrowRight size={14} style={{ transform: isHovered ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Standard Article Card ── */
const RegularArticleCard: React.FC<{ post: BlogPostType; onClick: () => void; isFeatured?: boolean }> = ({ post, onClick, isFeatured = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      data-card-3d="true"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--blog-card-bg)',
        border: `1px solid ${isHovered ? 'var(--blog-accent-35)' : 'var(--blog-border)'}`,
        borderRadius: 22,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        height: '100%'
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', height: 200, flexShrink: 0, overflow: 'hidden', position: 'relative', background: 'var(--blog-img-placeholder)' }}>
        {post.thumbnail ? (
          <>
            <img
              src={post.thumbnail}
              alt={post.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 60%)' }} />
          </>
        ) : (
          <AbstractCover category={post.category} title={post.title} size="md" />
        )}

        {isFeatured && (
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'var(--blog-accent)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 99,
            fontSize: 10,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            boxShadow: '0 4px 12px var(--blog-accent-40)'
          }}>
            ✦ Pilihan
          </div>
        )}
      </div>

      {/* Body Details */}
      <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: 99,
            background: 'var(--blog-accent-12)',
            color: 'var(--blog-accent)',
            fontSize: 10.5,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {post.category || 'Umum'}
          </span>
          <span style={{ color: 'var(--blog-text-muted)', fontSize: 11.5, fontFamily: "'Inter', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {getReadingTime(post.content, post.readTime)} min
          </span>
        </div>

        <h3 style={{
          margin: 0,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: 17,
          lineHeight: 1.35,
          color: isHovered ? 'var(--blog-accent)' : 'var(--blog-text)',
          transition: 'color 0.2s ease',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden'
        }}>
          {post.title}
        </h3>

        <p style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: 'var(--blog-text-muted)',
          lineHeight: 1.65,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden'
        }}>
          {stripHtml(post.content)}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid var(--blog-border)',
          color: 'var(--blog-text-muted)',
          fontSize: 11.5,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {post.date}</span>
            {typeof post.views === 'number' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {post.views}</span>
            )}
          </div>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isHovered ? 'var(--blog-accent)' : 'var(--blog-accent-10)',
            color: isHovered ? '#fff' : 'var(--blog-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 900,
            transition: 'all 0.2s ease'
          }}>
            →
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Professional Blog Page ── */
export default function Blog() {
  const navigate = useNavigate();
  const { data } = useLandingData();
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollReveal(containerRef);

  const [posts, setPosts] = useState<BlogPostType[]>(() => {
    try {
      const raw = localStorage.getItem('porto_blog_posts');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          return arr.map((item: any) => ({
            id: item.id || `post_${Date.now()}`,
            slug: item.slug || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : item.id),
            title: item.title || 'Tanpa Judul',
            content: item.content || '',
            category: item.category || 'Umum',
            date: item.date || 'Terbaru',
            thumbnail: item.thumbnail || '',
            status: item.status || 'Published',
            views: typeof item.views === 'number' ? item.views : 0,
            tags: item.tags || '',
            metaTitle: item.metaTitle,
            metaDescription: item.metaDescription,
            readTime: item.readTime
          }));
        }
      }
    } catch {}
    return [];
  });
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('porto_blog_posts');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          const dynamicCats = Array.from(new Set(arr.map((p: any) => p.category).filter(Boolean))) as string[];
          return ['All', ...dynamicCats];
        }
      }
    } catch {}
    return ['All'];
  });
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [isLoading, setIsLoading] = useState<boolean>(() => posts.length === 0);
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);

  const accentColor = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || data?.theme?.accentColor || '#7c3aed';

  // Force body/html/root scrollable (overrides global CMS fixed-body CSS)
  useLandingBodyFix();

  // Load posts & listen for updates
  useEffect(() => {
    const loadData = async () => {
      try {
        const rawPosts = await storage.getItem('porto_blog_posts', []);
        const arr = Array.isArray(rawPosts) ? rawPosts : [];
        
        // Take all valid articles created by user
        const allPosts: BlogPostType[] = arr.map((item: any) => ({
          id: item.id || `post_${Date.now()}`,
          slug: item.slug || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : item.id),
          title: item.title || 'Tanpa Judul',
          content: item.content || '',
          category: item.category || 'Umum',
          date: item.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          thumbnail: item.thumbnail || '',
          status: item.status || 'Published',
          views: typeof item.views === 'number' ? item.views : 0,
          tags: item.tags || '',
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          readTime: item.readTime
        }));

        setPosts(allPosts);

        // Extract categories
        const dynamicCats = Array.from(new Set(allPosts.map(p => p.category).filter(Boolean))) as string[];
        setCategories(['All', ...dynamicCats]);

        const rawFeat = await storage.getItem('porto_blog_featured', []);
        setFeaturedIds(Array.isArray(rawFeat) ? rawFeat : (rawFeat ? [rawFeat] : []));
      } catch (err) {
        console.error('[Blog Page] Failed to load articles:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('porto_blog_saved', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('porto_blog_saved', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filter & Search Logic
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Filter category
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Filter search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.title || '').toLowerCase().includes(q) || 
        (p.content || '').toLowerCase().includes(q) || 
        (p.tags || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      result.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }

    return result;
  }, [posts, activeCategory, searchQuery, sortBy]);

  // Separate Featured vs Regular
  const featuredPosts = useMemo(() => {
    return filteredAndSortedPosts.filter(p => featuredIds.includes(p.id));
  }, [filteredAndSortedPosts, featuredIds]);

  const regularPosts = useMemo(() => {
    return filteredAndSortedPosts.filter(p => !featuredIds.includes(p.id));
  }, [filteredAndSortedPosts, featuredIds]);

  // Primary Hero Featured Post
  const primaryFeatured = featuredPosts.length > 0 ? featuredPosts[0] : null;
  const secondaryFeatured = featuredPosts.slice(1);
  const displayRegularPosts = primaryFeatured ? [...secondaryFeatured, ...regularPosts] : filteredAndSortedPosts;

  const totalReadingMinutes = useMemo(() => {
    return posts.reduce((acc, p) => acc + getReadingTime(p.content, p.readTime), 0);
  }, [posts]);

  const cssVars = `
    :root {
      --blog-accent: ${accentColor};
      --blog-accent-rgb: ${accentColor};
      --blog-accent-40: ${accentColor}66;
      --blog-accent-35: ${accentColor}59;
      --blog-accent-25: ${accentColor}40;
      --blog-accent-12: ${accentColor}1f;
      --blog-accent-10: ${accentColor}1a;
      --blog-text: ${isDark ? '#ffffff' : '#0f172a'};
      --blog-text-muted: ${isDark ? '#94a3b8' : '#64748b'};
      --blog-card-bg: ${isDark ? '#151824' : '#ffffff'};
      --blog-border: ${isDark ? 'rgba(255, 255, 255, 0.14)' : '#e5e7eb'};
      --blog-shadow: none;
      --blog-shadow-hover: none;
      --blog-img-placeholder: ${isDark ? '#1c1f2e' : '#f3f4f6'};
      --blog-sk1: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
      --blog-sk2: ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'};
    }
    @media (max-width: 768px) {
      .blog-main-wrap {
        padding: calc(95px + env(safe-area-inset-top, 0px)) 16px 60px !important;
      }
    }
  `;

  return (
    <div
      ref={containerRef}
      onScroll={(e) => {
        const st = (e.target as HTMLDivElement).scrollTop;
        window.dispatchEvent(new CustomEvent('page-scroll', { detail: { scrollTop: st } }));
      }}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: isDark ? '#06070a' : '#eef2f6',
        color: isDark ? '#ffffff' : '#0f172a',
        overflowX: 'hidden',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <style>{cssVars}</style>

      {/* ── Top Navbar ── */}
      <LPNavbar
        items={(data?.navbar?.items || []) as any}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        isDark={isDark}
        accentColor={accentColor}
      />

      {/* ── Main Container ── */}
      <div className="blog-main-wrap" style={{ maxWidth: 1240, margin: '0 auto', padding: '120px clamp(16px, 3.5vw, 24px) 80px', boxSizing: 'border-box' }}>

        {/* ── Hero Header Section ── */}
        <PageHeroHeader
          isDark={isDark}
          bgPattern={(data?.pagesHeader as any)?.blog?.bgPattern || 'grid'}
          badgeIcon={<Compass size={14} />}
          badgeText={data?.pagesHeader?.blog?.badge || 'Jurnal & Publikasi Artikel'}
          title={data?.pagesHeader?.blog?.title || 'Ide, Wawasan & Catatan Eksplorasi'}
          highlightText={data?.pagesHeader?.blog?.highlight || 'Catatan Eksplorasi'}
          description={data?.pagesHeader?.blog?.description || 'Koleksi tulisan mendalam seputar teknologi, panduan praktis, inovasi digital, serta gagasan kreatif terbaru.'}
          accentColor={accentColor}
          stats={[
            { icon: <Layers size={15} />, value: posts.length, label: 'Total Artikel' },
            { icon: <Tag size={15} />, value: Math.max(1, categories.length - 1), label: 'Kategori Topik' },
            { icon: <Clock size={15} />, value: `~${totalReadingMinutes}`, label: 'Menit Total Baca' },
          ]}
        >
          {/* Quick Spotlight Search Input Box */}
          <div style={{
            position: 'relative',
            maxWidth: 460,
            margin: '0 auto'
          }}>
            <Search size={16} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: searchFocused ? accentColor : 'var(--blog-text-muted)' }} />
            <input
              type="text"
              placeholder="Cari berdasarkan judul, kata kunci, topik, atau isi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                padding: '13px 44px 13px 46px',
                borderRadius: 100,
                border: `1.5px solid ${searchFocused ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)')}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: 'var(--blog-text)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: 'none'
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
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  border: 'none',
                  color: 'var(--blog-text-muted)',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Hapus pencarian"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </PageHeroHeader>

        {/* ── Category Filters Bar ── */}
        <div data-reveal="true" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Category Filter Pills & Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              {/* Category Pills */}
              <div className="chip-scroll" style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, overflowX: 'auto', overflowY: 'hidden', padding: '2px 2px 4px 2px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
                {categories.map(cat => {
                  const count = cat === 'All' ? posts.length : posts.filter(p => p.category === cat).length;
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className="cms-pill-filter"
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        flexShrink: 0,
                        height: 36,
                        minHeight: 36,
                        maxHeight: 36,
                        padding: '0 14px',
                        borderRadius: 9999,
                        whiteSpace: 'nowrap',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `1.5px solid ${isActive ? accentColor : 'var(--blog-border)'}`,
                        background: isActive ? accentColor : 'var(--blog-card-bg)',
                        color: isActive ? '#fff' : 'var(--blog-text-muted)',
                        boxShadow: isActive ? `0 4px 12px ${accentColor}35` : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', lineHeight: 1 }}>{cat === 'All' ? '✦ Semua Topik' : cat}</span>
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
                        background: isActive ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                        color: isActive ? '#fff' : 'var(--blog-text-muted)',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sort Switcher */}
              <div style={{ display: 'inline-flex', alignItems: 'center', height: 36, gap: 4, background: 'var(--blog-card-bg)', border: '1px solid var(--blog-border)', borderRadius: 9999, padding: 3, flexShrink: 0, boxSizing: 'border-box' }}>
                <button
                  type="button"
                  onClick={() => setSortBy('latest')}
                  style={{
                    height: 28,
                    padding: '0 12px',
                    borderRadius: 9999,
                    border: 'none',
                    background: sortBy === 'latest' ? 'var(--blog-accent-12)' : 'transparent',
                    color: sortBy === 'latest' ? accentColor : 'var(--blog-text-muted)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Terbaru
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('popular')}
                  style={{
                    height: 28,
                    padding: '0 12px',
                    borderRadius: 9999,
                    border: 'none',
                    background: sortBy === 'popular' ? 'var(--blog-accent-12)' : 'transparent',
                    color: sortBy === 'popular' ? accentColor : 'var(--blog-text-muted)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Populer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content Grid / Feed ── */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <SkeletonCard featured />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          </div>
        ) : filteredAndSortedPosts.length === 0 ? (
          /* Empty / No Search Results State */
          <div data-reveal="true" style={{
            padding: '60px 24px',
            textAlign: 'center',
            background: 'var(--blog-card-bg)',
            borderRadius: 22,
            border: '1.5px dashed var(--blog-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16
          }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'var(--blog-accent-10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor
            }}>
              <Search size={30} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800 }}>
                {searchQuery ? `Tidak ada artikel ditemukan untuk "${searchQuery}"` : 'Belum Ada Artikel yang Tersedia'}
              </h3>
              <p style={{ margin: 0, color: 'var(--blog-text-muted)', fontSize: 14, maxWidth: 440 }}>
                {searchQuery
                  ? 'Coba gunakan kata kunci lain atau pilih kategori topik yang berbeda.'
                  : 'Artikel akan segera hadir. Anda dapat mengelola dan mempublikasikan artikel melalui CMS Admin.'}
              </p>
            </div>
            {(searchQuery || activeCategory !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 20px',
                  borderRadius: 99,
                  border: `1.5px solid ${accentColor}`,
                  background: 'var(--blog-accent-12)',
                  color: accentColor,
                  fontWeight: 800,
                  fontSize: 13,
                  fontFamily: "'Outfit', sans-serif",
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                <RotateCcw size={14} /> Reset Filter & Tampilkan Semua
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

            {/* 1. Primary Highlight Hero Card (if no specific search query or when matched) */}
            {primaryFeatured && (
              <div data-reveal="true">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Sparkles size={16} style={{ color: accentColor }} />
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 900, color: 'var(--blog-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Artikel Unggulan Terpilih
                  </span>
                </div>
                <FeaturedHeroCard
                  post={primaryFeatured}
                  onClick={() => navigate(`/blog/${primaryFeatured.slug || primaryFeatured.id}`)}
                />
              </div>
            )}

            {/* 2. Regular Articles Grid */}
            <div data-reveal="true">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingUp size={16} style={{ color: accentColor }} />
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 900, color: 'var(--blog-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {primaryFeatured ? 'Jelajahi Artikel Lainnya' : 'Semua Publikasi'}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blog-text-muted)' }}>
                  Menampilkan {displayRegularPosts.length} artikel
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 24
              }}>
                {displayRegularPosts.map((post) => (
                  <RegularArticleCard
                    key={post.id}
                    post={post}
                    isFeatured={featuredIds.includes(post.id)}
                    onClick={() => navigate(`/blog/${post.slug || post.id}`)}
                  />
                ))}
              </div>
            </div>

            {/* 3. Bottom Professional Newsletter / Engagement Banner */}
            <div data-reveal="true" style={{
              marginTop: 20,
              padding: '40px 32px',
              borderRadius: 22,
              background: isDark
                ? `linear-gradient(135deg, ${accentColor}18 0%, rgba(255,255,255,0.03) 100%)`
                : `linear-gradient(135deg, ${accentColor}12 0%, #ffffff 100%)`,
              border: `1.5px solid ${accentColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 24,
              boxShadow: 'none'
            }}>
              <div style={{ maxWidth: 540 }}>
                <h3 style={{ margin: '0 0 8px 0', fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: 'var(--blog-text)' }}>
                  Ingin Membaca Portofolio & Proyek Kreatif?
                </h3>
                <p style={{ margin: 0, color: 'var(--blog-text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                  Kunjungi halaman utama untuk melihat karya pilihan, studi kasus desain, serta kontak kolaborasi.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 99,
                  border: 'none',
                  background: `linear-gradient(135deg, ${accentColor}, #9333ea)`,
                  color: '#fff',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: `0 6px 20px ${accentColor}40`,
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Kembali ke Beranda <ChevronRight size={16} />
              </button>
            </div>

          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <LPFooter
        data={data?.footer || {}}
        isDark={isDark}
        accentColor={accentColor}
      />
    </div>
  );
}
