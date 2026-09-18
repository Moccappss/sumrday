import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, Tag, Share2, MessageCircle, ArrowUp, Clock, Copy, BookOpen, Check, Sparkles, ArrowUpRight } from 'lucide-react';
import { storage } from '../utils/storage';
import SEOHelmet from '../components/SEOHelmet';
import type { BlogPostType } from './Blog';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { safeHtml } from '../utils/security';
import { haptic } from '../utils/haptics';

/* ── Loading Skeleton ─────────────────────────────────────────────── */
const PostSkeleton = () => (
  <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
    <style>{`
      @keyframes sk-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .sk {
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        animation: sk-shimmer 2.6s ease-in-out infinite;
        border-radius: 10px;
      }
    `}</style>
    <div style={{ maxWidth: 780, margin: '0 auto', paddingTop: 60, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div className="sk" style={{ height: 26, width: 100, borderRadius: 100 }} />
      <div className="sk" style={{ height: 44, width: '88%' }} />
      <div className="sk" style={{ height: 44, width: '72%' }} />
      <div className="sk" style={{ height: 20, width: 220 }} />
      <div className="sk" style={{ height: 380, width: '100%', borderRadius: 24, marginTop: 12 }} />
      <div className="sk" style={{ height: 18, width: '100%' }} />
      <div className="sk" style={{ height: 18, width: '95%' }} />
      <div className="sk" style={{ height: 18, width: '85%' }} />
    </div>
  </div>
);

/* ── SVG Icons ── */
const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const LinkedinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const getReadingTime = (content?: string) => {
  if (!content) return 1;
  const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
};

/* ── Main BlogPost Component ── */
const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  
  const { data } = useLandingData();
  const { showToast } = useToast();
  const accentColor = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || data?.theme?.accentColor || '#7c3aed';

  // Unified website theme hook
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);

  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollReveal(scrollRef, [post, relatedPosts]);

  // Force body/html/root scrollable (overrides global CMS fixed-body CSS)
  useLandingBodyFix();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalScroll = target.scrollTop;
    const windowHeight = target.scrollHeight - target.clientHeight;
    const scroll = windowHeight > 0 ? totalScroll / windowHeight : 0;
    setScrollProgress(scroll);
    setShowBackToTop(totalScroll > 500);
    window.dispatchEvent(new CustomEvent('page-scroll', { detail: { scrollTop: totalScroll } }));
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
      try {
        const savedPosts = await storage.getItem('porto_blog_posts', []);
        const arr = Array.isArray(savedPosts) ? savedPosts : [];
        const found = arr.find((p: BlogPostType) => p.slug === id || p.id === id);
        if (found) {
          found.views = (found.views || 0) + 1;
          const updatedPosts = arr.map((p: BlogPostType) => (p.id === found.id ? found : p));
          await storage.setItem('porto_blog_posts', updatedPosts);
          setPost(found);

          const isPublished = (p: BlogPostType) => p.status === 'Published' || p.status === 'Terbit' || !p.status || arr.length <= 4;
          const otherPosts = arr.filter((p: BlogPostType) => p.id !== found.id && isPublished(p));
          const related = [...otherPosts]
            .sort((a: BlogPostType, b: BlogPostType) => {
              const sameCat = (b.category === found.category ? 1 : 0) - (a.category === found.category ? 1 : 0);
              if (sameCat !== 0) return sameCat;
              return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
            })
            .slice(0, 3);
          setRelatedPosts(related);
        } else {
          setPost(null);
        }
      } catch (err) {
        console.error('Failed to load post', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title;
    if (platform === 'native' && navigator.share) {
      navigator.share({ title, url }).catch(console.error);
      return;
    }
    let shareUrl = '';
    switch (platform) {
      case 'wa': shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent((title || '') + ' ' + url)}`; break;
      case 'tw': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title || '')}&url=${encodeURIComponent(url)}`; break;
      case 'fb': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
      case 'in': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`; break;
      default:
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          showToast('Tautan Disalin!', 'Link artikel berhasil disalin ke clipboard.', 'success');
        }
        return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (isLoading) return <PostSkeleton />;

  const textColor  = isDark ? '#f1f5f9' : '#0f172a';
  const subText    = isDark ? '#94a3b8' : '#64748b';
  const border     = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const cardBg     = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const pageBg     = isDark ? '#08080f' : '#f8fafc';

  if (!post || (post.status !== 'Published' && post.status !== 'Terbit' && post.status)) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: pageBg, gap: 20, padding: 24, textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `${accentColor}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={32} style={{ color: accentColor, opacity: 0.5 }} />
        </div>
        <h2 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: textColor }}>
          Artikel Tidak Ditemukan
        </h2>
        <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 14, color: subText }}>
          Artikel ini mungkin sudah dihapus atau belum dipublikasikan.
        </p>
        <button
          onClick={() => navigate('/blog')}
          style={{
            padding: '11px 28px', borderRadius: 100, border: 'none',
            background: accentColor, color: '#fff',
            fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: `0 4px 14px ${accentColor}35`,
          }}
        >
          ← Kembali ke Blog
        </button>
      </div>
    );
  }

  const readingTime = getReadingTime(post.content);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: pageBg, color: textColor,
        overflowX: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
        scrollBehavior: 'smooth',
      }}
    >
      <SEOHelmet
        title={(post as any).metaTitle || `${post.title} - Blog`}
        description={(post as any).metaDescription || post.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}
        image={post.thumbnail}
      />

      {/* ── Reading Progress Bar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, zIndex: 99999, height: 3,
        width: `${scrollProgress * 100}%`,
        background: `linear-gradient(90deg, ${accentColor}, #38bdf8)`,
        boxShadow: `0 0 12px ${accentColor}80`,
        transition: 'width 0.08s ease-out',
        pointerEvents: 'none',
      }} />

      {/* ── Top Navbar ── */}
      <LPNavbar
        items={(data?.navbar?.items || []) as any}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        isDark={isDark}
        accentColor={accentColor}
      />

      {/* ── Hero ── */}
      <div className="post-animate" style={{
        maxWidth: 860, margin: '0 auto',
        padding: isMobile ? '110px 20px 0' : '130px 24px 0',
        textAlign: 'center', position: 'relative', zIndex: 2,
      }}>
        
        {/* Back Button */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/blog')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 100, border: `1px solid ${border}`,
              background: cardBg,
              color: subText, fontFamily: "'Outfit',sans-serif",
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = textColor; e.currentTarget.style.borderColor = accentColor; }}
            onMouseLeave={e => { e.currentTarget.style.color = subText; e.currentTarget.style.borderColor = border; }}
          >
            <ArrowLeft size={16} /> Kembali ke Blog
          </button>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          <span style={{
            padding: '4px 14px', borderRadius: 100,
            background: `${accentColor}15`, color: accentColor,
            fontSize: 12, fontFamily: "'Inter',sans-serif", fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {post.category}
          </span>
          {post.tags && post.tags.split(',').map((tag, idx) => {
            if (!tag.trim()) return null;
            return (
              <span key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 12px', borderRadius: 100,
                color: subText,
                fontSize: 12, fontFamily: "'Inter',sans-serif", fontWeight: 500,
              }}>
                <Tag size={12} style={{ opacity: 0.6 }} /> {tag.trim()}
              </span>
            );
          })}
        </div>

        {/* Title */}
        <h1 style={{
          margin: '0 auto 28px', maxWidth: 800,
          fontFamily: "'Outfit',sans-serif",
          fontSize: isMobile ? 32 : 'clamp(36px, 4.5vw, 56px)',
          fontWeight: 800, lineHeight: 1.15,
          color: textColor, letterSpacing: '-0.03em',
        }}>
          {post.title}
        </h1>

        {/* Meta bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          flexWrap: 'wrap', marginBottom: 48,
        }}>
          {[
            { icon: <Calendar size={15} style={{ color: subText }} />, label: post.date },
            { icon: <Clock size={15} style={{ color: subText }} />, label: `${readingTime} menit baca` },
            { icon: <Eye size={15} style={{ color: subText }} />, label: `${post.views || 0} views` },
          ].map((item, idx, arr) => (
            <React.Fragment key={idx}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 500,
                color: subText, fontFamily: "'Inter',sans-serif",
              }}>
                {item.icon} {item.label}
              </span>
              {idx < arr.length - 1 && (
                <span style={{ color: border, fontSize: 18, lineHeight: 1 }}>·</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Centered Thumbnail */}
        {post.thumbnail && (
          <div style={{
            width: '100%', borderRadius: isMobile ? 20 : 32, overflow: 'hidden',
            boxShadow: '0 24px 50px rgba(0,0,0,0.12)',
            border: `1px solid ${border}`,
            background: cardBg,
            marginBottom: isMobile ? 40 : 64,
          }}>
            <img
              src={post.thumbnail} alt={post.title}
              style={{ width: '100%', height: 'auto', maxHeight: 540, objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
      </div>

      {/* ── Article Body ── */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '0 20px 80px' : '0 24px 100px' }}>
        <div
          className="blog-body"
          style={{ fontSize: isMobile ? 16 : 17, lineHeight: 1.9 }}
          dangerouslySetInnerHTML={{ __html: safeHtml(post.content) }}
        />

        {/* ── Share Section ── */}
        <div style={{
          marginTop: 80, paddingTop: 40,
          borderTop: `1px solid ${border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <h4 style={{
            fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800,
            color: textColor, letterSpacing: '-0.02em', margin: 0
          }}>
            Bagikan Artikel Ini
          </h4>
          
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'WhatsApp', color: '#25D366', onClick: () => { haptic.light(); handleShare('wa'); }, icon: <MessageCircle size={17} /> },
              { label: 'Twitter', color: '#1DA1F2', onClick: () => { haptic.light(); handleShare('tw'); }, icon: <TwitterIcon size={17} /> },
              { label: 'Facebook', color: '#1877F2', onClick: () => { haptic.light(); handleShare('fb'); }, icon: <FacebookIcon size={17} /> },
              { label: 'LinkedIn', color: '#0A66C2', onClick: () => { haptic.light(); handleShare('in'); }, icon: <LinkedinIcon size={17} /> },
              { label: 'Salin Link', color: accentColor, onClick: () => { haptic.medium(); handleShare('copy'); }, icon: <Copy size={17} /> },
            ].map(({ label, color, onClick, icon }) => (
              <button
                key={label}
                onClick={onClick}
                title={label}
                className="spring-click"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 100, border: `1px solid ${border}`,
                  background: cardBg,
                  color: label === 'Salin Link' ? textColor : color, 
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = color;
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = cardBg;
                  e.currentTarget.style.color = label === 'Salin Link' ? textColor : color;
                  e.currentTarget.style.borderColor = border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Related Posts / Saran Blog Lainnya ── */}
      {relatedPosts.length > 0 && (
        <div style={{
          background: isDark ? 'linear-gradient(to bottom, #08080f, #0d0d1a)' : 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
          padding: isMobile ? '50px 20px 70px' : '70px 24px 90px',
          borderTop: `1px solid ${border}`
        }}>
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 100, background: `${accentColor}15`, color: accentColor, fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                <Sparkles size={14} /> Rekomendasi Bacaan
              </div>
              <h3 style={{
                margin: '0 0 8px', fontFamily: "'Outfit',sans-serif", fontSize: isMobile ? 22 : 28,
                fontWeight: 900, color: textColor, letterSpacing: '-0.5px'
              }}>
                Saran Artikel & Blog Lainnya
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: subText, fontFamily: "'Inter', sans-serif" }}>
                Jelajahi wawasan, ide, dan tips menarik lainnya seputar dunia kreatif & digital
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 22,
            }}>
              {relatedPosts.map(rel => (
                <div
                  key={rel.id}
                  className="related-card"
                  onClick={() => {
                    navigate(`/blog/${rel.slug || rel.id}`);
                    if (scrollRef.current) scrollRef.current.scrollTo(0, 0);
                  }}
                  style={{
                    background: cardBg, border: `1px solid ${border}`,
                    borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.03)',
                    display: 'flex', flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.borderColor = accentColor;
                    e.currentTarget.style.boxShadow = isDark ? '0 20px 40px rgba(0,0,0,0.45)' : '0 20px 40px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = border;
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.03)';
                  }}
                >
                  {rel.thumbnail ? (
                    <div style={{ width: '100%', height: 190, overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={rel.thumbnail} alt={rel.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {rel.category && (
                        <span style={{
                          position: 'absolute', top: 12, left: 12,
                          padding: '4px 11px',
                          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                          color: '#ffffff',
                          borderRadius: 100, fontSize: 10.5, fontFamily: "'Outfit',sans-serif",
                          fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          {rel.category}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '100%', height: 190,
                      background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <BookOpen size={36} style={{ color: accentColor, opacity: 0.5 }} />
                      {rel.category && (
                        <span style={{
                          position: 'absolute', top: 12, left: 12,
                          padding: '4px 11px',
                          background: `${accentColor}20`,
                          color: accentColor,
                          borderRadius: 100, fontSize: 10.5, fontFamily: "'Outfit',sans-serif",
                          fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          {rel.category}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{
                        margin: '0 0 10px', fontFamily: "'Outfit',sans-serif", fontWeight: 800,
                        fontSize: 16.5, lineHeight: 1.45, color: textColor,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as any, overflow: 'hidden'
                      }}>
                        {rel.title}
                      </h4>
                      {rel.excerpt && (
                        <p style={{
                          margin: '0 0 16px', fontSize: 13, color: subText,
                          lineHeight: 1.6, fontFamily: "'Inter', sans-serif",
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as any, overflow: 'hidden'
                        }}>
                          {rel.excerpt}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${border}`, marginTop: 'auto' }}>
                      <div style={{ display: 'flex', gap: 12, color: subText, fontSize: 11.5, fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {rel.date}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {rel.views || 0}</span>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 800, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                        Baca <ArrowUpRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Back to Top ── */}
      {showBackToTop && (
        <button
          onClick={() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 200,
            width: 46, height: 46, borderRadius: '50%', border: 'none',
            background: accentColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: `0 8px 28px ${accentColor}50`,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
        >
          <ArrowUp size={20} />
        </button>
      )}

      <LPFooter isDark={isDark} accentColor={accentColor} data={data.footer} />
    </div>
  );
};

export default BlogPost;
