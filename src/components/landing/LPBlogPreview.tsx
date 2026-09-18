import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, FileText, Calendar, Clock, TrendingUp, Rss } from 'lucide-react';
import { storage } from '../../utils/storage';

interface BlogPost {
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
}

interface LPBlogPreviewProps {
  isDark: boolean;
  accentColor: string;
  title?: string;
  subtitle?: string;
  maxPosts?: number;
  ctaLabel?: string;
}

const getReadingTime = (content?: string) => {
  if (!content) return 1;
  const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
};

const cleanExcerpt = (rawHtml?: string) => {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

/* ── Animated Card ── */
const BlogCard: React.FC<{
  post: BlogPost;
  isDark: boolean;
  accentColor: string;
  delayIndex?: number;
  featured?: boolean;
}> = ({ post, isDark, accentColor, delayIndex = 1, featured = false }) => {
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(20, 20, 32, 0.75)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleClick = () => {
    window.location.href = `/blog/${post.slug || post.id}`;
  };

  const readingTime = getReadingTime(post.content);
  const excerpt = cleanExcerpt(post.content);
  const displayDate = formatDisplayDate(post.date);

  if (featured) {
    return (
      <div
        data-reveal="true"
        onClick={handleClick}
        className="lp-blog-card lp-blog-featured-card reveal-delay-1"
        style={{
          display: 'flex',
          background: cardBg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${cardBorder}`,
          borderRadius: 22,
          overflow: 'hidden',
          cursor: 'pointer',
          opacity: 0,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(0,0,0,0.06)',
          width: '100%',
          boxSizing: 'border-box'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = isDark
            ? `0 20px 40px -10px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}40`
            : `0 20px 40px -10px rgba(0,0,0,0.12), 0 0 0 1px ${accentColor}40`;
          e.currentTarget.style.borderColor = `${accentColor}50`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(0,0,0,0.06)';
          e.currentTarget.style.borderColor = cardBorder;
        }}
      >
        {/* Image Container */}
        <div className="lp-blog-featured-media" style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {post.thumbnail ? (
            <>
              <img
                src={post.thumbnail}
                alt={post.title}
                className="lp-blog-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
            </>
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 180,
              background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}06 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={44} style={{ color: accentColor, opacity: 0.3 }} />
            </div>
          )}
          
          {/* Featured Badge */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: accentColor, color: '#fff',
            padding: '4px 10px', borderRadius: 100,
            fontSize: 10, fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            boxShadow: `0 4px 12px ${accentColor}50`,
            display: 'flex', alignItems: 'center', gap: 4,
            zIndex: 2
          }}>
            <span>✦</span> PILIHAN UTAMA
          </div>
        </div>

        {/* Content Body */}
        <div className="lp-blog-featured-body" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 12,
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          <div>
            {/* Meta Row (Category & Reading Time) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 100,
                background: `${accentColor}15`, color: accentColor,
                fontSize: 10.5, fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                border: `1px solid ${accentColor}30`,
              }}>
                {post.category || 'Artikel'}
              </span>
              <span style={{ color: subTextColor, fontSize: 11.5, fontFamily: "'Inter', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {readingTime} menit baca
              </span>
            </div>

            {/* Title */}
            <h3 style={{
              margin: '0 0 8px 0',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(17px, 3.8vw, 22px)',
              lineHeight: 1.3,
              color: textColor,
              letterSpacing: '-0.02em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}>
              {post.title}
            </h3>

            {/* Excerpt */}
            <p style={{
              margin: 0,
              fontFamily: "'Inter', sans-serif",
              fontSize: 13.5,
              color: subTextColor,
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}>
              {excerpt || 'Klik untuk membaca artikel selengkapnya...'}
            </p>
          </div>

          {/* Footer Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: `1px solid ${cardBorder}`,
            marginTop: 4,
            gap: 12
          }}>
            <span style={{ color: subTextColor, fontSize: 11.5, fontFamily: "'Inter', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={12} /> {displayDate}
            </span>
            <span className="lp-blog-action-btn" style={{
              padding: '6px 14px', borderRadius: 100,
              background: accentColor, color: '#fff',
              fontSize: 11.5, fontFamily: "'Outfit', sans-serif", fontWeight: 700,
              boxShadow: `0 3px 10px ${accentColor}30`,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              flexShrink: 0
            }}>
              Baca <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Regular Card
  return (
    <div
      data-reveal="true"
      onClick={handleClick}
      className={`lp-blog-card lp-blog-regular-card reveal-delay-${delayIndex}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: cardBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${cardBorder}`,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: isDark ? '0 6px 20px -6px rgba(0,0,0,0.4)' : '0 6px 20px -6px rgba(0,0,0,0.04)',
        height: '100%',
        boxSizing: 'border-box'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = isDark
          ? `0 16px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px ${accentColor}35`
          : `0 16px 32px -8px rgba(0,0,0,0.10), 0 0 0 1px ${accentColor}35`;
        e.currentTarget.style.borderColor = `${accentColor}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isDark ? '0 6px 20px -6px rgba(0,0,0,0.4)' : '0 6px 20px -6px rgba(0,0,0,0.04)';
        e.currentTarget.style.borderColor = cardBorder;
      }}
    >
      {/* Thumbnail */}
      <div className="lp-blog-regular-media" style={{ width: '100%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {post.thumbnail ? (
          <>
            <img
              src={post.thumbnail} alt={post.title}
              className="lp-blog-img"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.45s ease' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.2))' }} />
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%', minHeight: 140,
            background: `linear-gradient(135deg, ${accentColor}14 0%, ${accentColor}05 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={32} style={{ color: accentColor, opacity: 0.25 }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10, boxSizing: 'border-box' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <span style={{
              padding: '2.5px 8px', borderRadius: 100,
              background: `${accentColor}12`, color: accentColor,
              fontSize: 10, fontFamily: "'Outfit', sans-serif", fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {post.category || 'Artikel'}
            </span>
            <span style={{ color: subTextColor, fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={11} /> {readingTime} min
            </span>
          </div>

          <h4 style={{
            margin: '0 0 6px 0',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 15,
            lineHeight: 1.35,
            color: textColor,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          }}>
            {post.title}
          </h4>

          <p style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: 12.5,
            color: subTextColor,
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          }}>
            {excerpt}
          </p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, borderTop: `1px solid ${cardBorder}`,
          color: subTextColor, fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 600,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} /> {displayDate}
          </span>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: `${accentColor}15`, color: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900,
          }}>→</div>
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton ── */
const BlogSkeleton: React.FC<{ isDark: boolean; featured?: boolean }> = ({ isDark, featured = false }) => {
  const bg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const shimmerBg = isDark
    ? 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)'
    : 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%)';

  const sk = {
    background: shimmerBg,
    backgroundSize: '200% 100%',
    animation: 'lp-sk-shimmer 1.5s ease-in-out infinite',
    borderRadius: 8,
  };

  if (featured) return (
    <div className="lp-blog-featured-card" style={{
      display: 'flex',
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
      border: `1px solid ${bg}`, borderRadius: 22, overflow: 'hidden',
    }}>
      <div className="lp-blog-featured-media" style={{ background: shimmerBg, backgroundSize: '200% 100%', animation: 'lp-sk-shimmer 1.5s ease-in-out infinite' }} />
      <div className="lp-blog-featured-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ ...sk, height: 20, width: '30%' }} />
        <div style={{ ...sk, height: 26, width: '80%' }} />
        <div style={{ ...sk, height: 14, width: '100%' }} />
        <div style={{ ...sk, height: 14, width: '60%' }} />
      </div>
    </div>
  );

  return (
    <div style={{
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
      border: `1px solid ${bg}`, borderRadius: 20, overflow: 'hidden',
    }}>
      <div className="lp-blog-regular-media" style={{ background: shimmerBg, backgroundSize: '200% 100%', animation: 'lp-sk-shimmer 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...sk, height: 16, width: '30%' }} />
        <div style={{ ...sk, height: 20, width: '85%' }} />
        <div style={{ ...sk, height: 13, width: '100%' }} />
      </div>
    </div>
  );
};

/* ── Main LPBlogPreview Component ── */
const LPBlogPreview: React.FC<LPBlogPreviewProps> = ({
  isDark,
  accentColor,
  title = 'Artikel & Wawasan',
  subtitle = 'Insight, tutorial, dan cerita dari balik layar desain.',
  maxPosts = 3,
  ctaLabel = 'Lihat Semua Artikel',
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const sectionBg = isDark ? '#0d0d1a' : '#f8fafc';

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await storage.getItem('porto_blog_posts', []);
        const arr = Array.isArray(raw) ? raw : [];
        const published = (arr as BlogPost[])
          .filter(p => p.status === 'Published' || p.status === 'Terbit')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPosts(published);
      } catch (e) {
        console.error('[LPBlogPreview] load error:', e);
      } finally {
        setTimeout(() => setIsLoading(false), 600);
      }
    };

    load();

    const unsub = storage.listenItem('porto_blog_posts', (data: any) => {
      const arr = Array.isArray(data) ? data : [];
      const published = arr
        .filter((p: BlogPost) => p.status === 'Published' || p.status === 'Terbit')
        .sort((a: BlogPost, b: BlogPost) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(published);
      setIsLoading(false);
    }, []);

    const loadFeatured = async () => {
      const feat = await storage.getItem('porto_blog_featured', null);
      setFeaturedId(feat);
    };
    loadFeatured();

    const unsubFeat = storage.listenItem('porto_blog_featured', (data: any) => {
      setFeaturedId(data);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      if (typeof unsubFeat === 'function') unsubFeat();
    };
  }, []);

  // Don't render if no posts and not loading
  if (!isLoading && posts.length === 0) return null;

  let featuredPost = null;
  let regularPosts = [];

  if (posts.length > 0) {
    if (featuredId) {
      const idx = posts.findIndex(p => p.id === featuredId);
      if (idx !== -1) {
        featuredPost = posts[idx];
        regularPosts = [...posts.slice(0, idx), ...posts.slice(idx + 1)].slice(0, maxPosts - 1);
      } else {
        featuredPost = posts[0];
        regularPosts = posts.slice(1, maxPosts);
      }
    } else {
      featuredPost = posts[0];
      regularPosts = posts.slice(1, maxPosts);
    }
  }

  return (
    <section
      id="blog-preview"
      style={{
        padding: '80px 20px',
        background: sectionBg,
      }}
    >
      <style>{`
        @keyframes lp-sk-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .lp-blog-featured-card {
          flex-direction: row;
        }
        .lp-blog-featured-media {
          width: 44%;
          min-height: 280px;
        }
        .lp-blog-featured-body {
          padding: 30px 32px;
        }
        .lp-blog-regular-media {
          height: 180px;
        }
        .lp-blog-card:hover .lp-blog-img {
          transform: scale(1.05);
        }

        @media (max-width: 860px) {
          .lp-blog-featured-card {
            flex-direction: column !important;
          }
          .lp-blog-featured-media {
            width: 100% !important;
            aspect-ratio: 16 / 9 !important;
            min-height: unset !important;
            max-height: 220px !important;
          }
          .lp-blog-featured-body {
            padding: 18px 18px 20px !important;
          }
        }

        @media (max-width: 640px) {
          #blog-preview {
            padding: 56px 16px !important;
          }
          .lp-blog-header-row {
            margin-bottom: 28px !important;
          }
          .lp-blog-regular-media {
            height: 160px !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Section Header */}
        <div data-reveal="true" className="lp-blog-header-row" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 40,
          flexWrap: 'wrap' as const,
          gap: 16,
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: 14,
              padding: '4px 14px', borderRadius: 100,
              background: `${accentColor}12`, border: `1px solid ${accentColor}25`,
            }}>
              <Rss size={13} style={{ color: accentColor }} />
              <span style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 800,
                color: accentColor, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              }}>
                Blog & Artikel
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 900, color: textColor,
              margin: 0, letterSpacing: '-0.8px', lineHeight: 1.15,
            }}>
              {title}
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 15,
              color: subTextColor, margin: '10px 0 0', lineHeight: 1.7,
            }}>
              {subtitle}
            </p>
          </div>

          <a
            href="/blog"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 100,
              background: 'transparent', color: accentColor,
              border: `1.5px solid ${accentColor}40`,
              fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap' as const,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = accentColor;
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.boxShadow = `0 4px 20px ${accentColor}35`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = accentColor;
              e.currentTarget.style.borderColor = `${accentColor}40`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {ctaLabel} <ArrowRight size={15} />
          </a>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <BlogSkeleton isDark={isDark} featured />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              <BlogSkeleton isDark={isDark} />
              <BlogSkeleton isDark={isDark} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Featured Post */}
            {featuredPost && (
              <BlogCard post={featuredPost} isDark={isDark} accentColor={accentColor} featured delayIndex={1} />
            )}

            {/* Regular Posts Grid */}
            {regularPosts.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <TrendingUp size={15} style={{ color: accentColor }} />
                  <span style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 800,
                    color: subTextColor, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                  }}>
                    Artikel Lainnya
                  </span>
                  <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }} />
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 20,
                }}>
                  {regularPosts.map((post, idx) => (
                    <BlogCard
                      key={post.id}
                      post={post}
                      isDark={isDark}
                      accentColor={accentColor}
                      delayIndex={(idx % 4) + 1}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <a
                href="/blog"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 32px', borderRadius: 100,
                  background: accentColor, color: '#fff',
                  fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: `0 8px 28px ${accentColor}35`,
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '0.88';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Rss size={16} />
                {ctaLabel}
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          #blog-preview {
            padding: 60px 16px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default LPBlogPreview;
