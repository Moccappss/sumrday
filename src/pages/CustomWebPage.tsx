import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import SEOHelmet from '../components/SEOHelmet';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import BookingModal from '../components/common/BookingModal';
import { 
  Sparkles, Check, ArrowRight, ChevronDown, HelpCircle, 
  Layers, FileText, ShoppingBag, Shield, Star, ExternalLink,
  ChevronRight, ChevronLeft, Compass, Phone, Calendar, X,
  Maximize2, Image as ImageIcon, Play, Eye, Sliders, ArrowUpRight,
  Quote, Award, CheckCircle2, Video, Download, MessageSquare,
  Copy, CheckCheck, Clock, MapPin, Music, Code2, AlertTriangle, Info, Tag, Send, Mail, Users
} from 'lucide-react';

export interface CustomPageSection {
  id: string;
  type: 
    | 'text' 
    | 'features' 
    | 'pricing' 
    | 'faq' 
    | 'cta' 
    | 'gallery' 
    | 'before_after' 
    | 'cards_grid' 
    | 'stats' 
    | 'testimonials' 
    | 'process' 
    | 'video' 
    | 'button_group'
    | 'contact_form'
    | 'logo_cloud'
    | 'countdown'
    | 'price_menu'
    | 'team_grid'
    | 'code_block'
    | 'audio_player'
    | 'map_location'
    | 'comparison_table'
    | 'file_download'
    | 'alert_box'
    | 'coupon_box';
  title?: string;
  subtitle?: string;
  badge?: string;
  showHeading?: boolean;
  fullCard?: boolean;
  content?: string;
  quote?: string;
  quoteAuthor?: string;
  quoteRole?: string;
  items?: any[];
  plans?: any[];
  faqs?: { question: string; answer: string }[];
  cards?: {
    id: string;
    title: string;
    badge?: string;
    description: string;
    image?: string;
    images?: string[];
    actionType: 'modal' | 'link';
    linkUrl?: string;
    details?: string;
    tags?: string[];
    modalButtonText?: string;
  }[];
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonType?: 'link' | 'consultation' | 'whatsapp';
  buttons?: { label: string; url: string; variant?: 'primary' | 'secondary' | 'outline' | 'whatsapp' | 'call'; target?: string; icon?: string }[];
  images?: { url: string; caption?: string; title?: string; linkUrl?: string }[];
  columns?: number;
  // Contact Form Fields
  contactChannels?: string[];
  contactServices?: string[];
  contactWhatsappNumber?: string;
  contactEmailAddress?: string;
  contactTelegramUsername?: string;
  // Logo Cloud Fields
  logos?: { name: string; imageUrl?: string; linkUrl?: string }[];
  // Countdown Fields
  targetDate?: string;
  countdownPromoText?: string;
  // Price Menu Fields
  menuItems?: { name: string; price: string; desc?: string; badge?: string }[];
  // Team Grid Fields
  teamMembers?: { name: string; role: string; photo?: string; bio?: string; socialUrl?: string }[];
  // Code Block Fields
  codeSnippet?: string;
  codeLanguage?: string;
  // Audio Player Fields
  audioUrl?: string;
  trackTitle?: string;
  trackArtist?: string;
  // Map Location Fields
  mapEmbedUrl?: string;
  mapAddress?: string;
  mapHours?: string;
  // Comparison Table Fields
  comparisonHeaders?: string[];
  comparisonRows?: { feature: string; values: (string | boolean)[] }[];
  // File Download Fields
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  // Alert Box Fields
  alertType?: 'info' | 'success' | 'warning' | 'promo';
  alertMessage?: string;
  // Coupon Box Fields
  couponCode?: string;
  discountText?: string;
  couponExpiry?: string;
}

export interface CustomPageData {
  id: string;
  title: string;
  slug: string;
  badge?: string;
  subtitle?: string;
  bannerImage?: string;
  showInNavbar?: boolean;
  metaDescription?: string;
  navbarPreset?: 'global' | 'minimal' | 'full' | 'ecommerce' | 'custom' | 'hidden';
  customNavItems?: { id: string; label: string; url: string }[];
  sections?: CustomPageSection[];
}

// ── Interactive Before / After Slider Component ──
const BeforeAfterSlider: React.FC<{
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  accentColor: string;
  isDark: boolean;
}> = ({
  beforeImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
  afterImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  beforeLabel = 'SEBELUM (BEFORE)',
  afterLabel = 'SESUDAH (AFTER)',
  accentColor,
  isDark
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={() => (isDragging.current = true)}
      onMouseUp={() => (isDragging.current = false)}
      onMouseLeave={() => (isDragging.current = false)}
      onMouseMove={(e) => {
        if (isDragging.current) handleMove(e.clientX);
      }}
      onTouchMove={handleTouchMove}
      onClick={(e) => handleMove(e.clientX)}
      style={{
        position: 'relative',
        width: '100%',
        margin: '0 auto',
        height: 'clamp(320px, 48vw, 560px)',
        borderRadius: 20,
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'ew-resize',
        boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`
      }}
    >
      {/* After Image (Full background) */}
      <img
        src={afterImage}
        alt="After"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          padding: '6px 14px',
          borderRadius: 100,
          background: 'rgba(0,0,0,0.75)',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.06em',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none'
        }}
      >
        {afterLabel}
      </span>

      {/* Before Image (Clipped overlay) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${sliderPos}%`,
          overflow: 'hidden',
          borderRight: `3px solid #ffffff`
        }}
      >
        <img
          src={beforeImage}
          alt="Before"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: containerRef.current ? containerRef.current.clientWidth : '100%',
            height: '100%',
            objectFit: 'cover',
            maxWidth: 'none'
          }}
        />
        <span
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            padding: '6px 14px',
            borderRadius: 100,
            background: `${accentColor}ee`,
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.06em',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none'
          }}
        >
          {beforeLabel}
        </span>
      </div>

      {/* Central Handle (Clean minimalist circle with dual vertical grip lines, NO SETTINGS ICON) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderPos}%`,
          transform: 'translate(-50%, -50%)',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: `0 0 0 3px ${accentColor}, 0 6px 20px rgba(0,0,0,0.45)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <div style={{ width: 2.5, height: 14, borderRadius: 2, background: accentColor }} />
        <div style={{ width: 2.5, height: 14, borderRadius: 2, background: accentColor }} />
      </div>
    </div>
  );
};

const CustomWebPage: React.FC<{ pageSlug?: string }> = ({ pageSlug }) => {
  const params = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const slug = pageSlug || params.slug || '';

  const { data, isLoading } = useLandingData();
  const containerRef = useRef<HTMLDivElement>(null);

  useScrollReveal(containerRef, [data, slug]);
  useLandingBodyFix();

  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const [accentColor, setAccentColor] = useState<string>(
    () => (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || data?.theme?.accentColor || '#64748b'
  );

  useEffect(() => {
    if (data?.theme?.accentColor) setAccentColor(data.theme.accentColor);
  }, [data?.theme?.accentColor]);

  // Find page by slug or id
  const customPages: CustomPageData[] = data?.customPages || [];
  const activePage = customPages.find(
    p => p.slug === slug || p.id === slug || p.slug === `/${slug}` || p.slug === `/p/${slug}`
  );

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<string, number | null>>({});

  // Lightbox Carousel State for Gallery
  const [lightboxData, setLightboxData] = useState<{
    images: { url: string; caption?: string; title?: string }[];
    currentIndex: number;
  } | null>(null);

  // Card Detail Modal State
  const [activeCardModal, setActiveCardModal] = useState<any>(null);
  const [cardCarouselIdx, setCardCarouselIdx] = useState(0);

  // Interactive Blocks State
  const [contactChannel, setContactChannel] = useState<'whatsapp' | 'email' | 'telegram'>('whatsapp');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [contactFormFields, setContactFormFields] = useState<Record<string, { name: string; phone: string; service: string; message: string }>>({});

  const toggleFaq = (secId: string, idx: number) => {
    setOpenFaqIndices(prev => ({
      ...prev,
      [secId]: prev[secId] === idx ? null : idx
    }));
  };

  const globalNavItems = [
    ...(data?.navbar?.items || [] as any),
    ...customPages.filter(p => p.showInNavbar && p.slug !== slug).map(p => ({
      id: `nav-${p.id}`,
      type: 'link' as const,
      label: p.title,
      url: `/p/${p.slug.replace(/^\//, '')}`
    })),
    ...(data?.shopSettings?.enabled ? [{ id: 'nav-katalog', type: 'link' as const, label: 'Katalog', url: '/katalog' }] : [])
  ];

  const navbarPreset = activePage?.navbarPreset || 'global';
  let activeNavItems = globalNavItems;

  const customNavbarGroups: any[] = data?.customNavbarGroups || [];
  const selectedGroup = customNavbarGroups.find(g => g.id === navbarPreset);

  if (selectedGroup && selectedGroup.items?.length) {
    activeNavItems = selectedGroup.items.map((item: any, idx: number) => ({
      id: item.id || `group-nav-${idx}`,
      type: (item.children && item.children.length > 0) ? 'dropdown' as const : 'link' as const,
      label: item.label,
      url: item.url,
      children: item.children || []
    }));
  } else if (navbarPreset === 'custom' && activePage?.customNavItems?.length) {
    activeNavItems = activePage.customNavItems.map((item: any, idx: number) => ({
      id: item.id || `custom-nav-${idx}`,
      type: (item.children && item.children.length > 0) ? 'dropdown' as const : 'link' as const,
      label: item.label,
      url: item.url,
      children: item.children || []
    }));
  }

  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#08080f' : '#f8fafc', color: textColor }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${accentColor}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Memuat Halaman...</span>
        </div>
      </div>
    );
  }

  if (!activePage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isDark ? '#05060b' : '#f8fafc', color: textColor }}>
        <LPNavbar items={globalNavItems} isDark={isDark} accentColor={accentColor} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px', textAlign: 'center' }}>
          <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
              <HelpCircle size={32} />
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 900, margin: 0 }}>
              Halaman Tidak Ditemukan
            </h1>
            <p style={{ color: subTextColor, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Halaman dengan alamat <code>/{slug}</code> belum dibuat atau telah dipindahkan.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 28px',
                borderRadius: 100,
                background: accentColor,
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                marginTop: 8,
                boxShadow: `0 8px 24px ${accentColor}40`
              }}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
        <LPFooter data={data} isDark={isDark} accentColor={accentColor} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: isDark ? '#05060b' : '#f8fafc',
        color: textColor,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SEOHelmet
        title={`${activePage.title} — ${data?.seo?.metaTitle || 'sumr.day'}`}
        description={activePage.metaDescription || activePage.subtitle || data?.seo?.metaDescription || ''}
      />

      {navbarPreset !== 'hidden' && (
        <LPNavbar
          items={activeNavItems}
          loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
          logoText={data?.navbar?.logoText}
          isDark={isDark}
          accentColor={accentColor}
        />
      )}

      {/* ── HERO BANNER ── */}
      <section
        style={{
          padding: '140px 24px 60px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {activePage.badge && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                borderRadius: 100,
                background: `${accentColor}18`,
                color: accentColor,
                border: `1px solid ${accentColor}35`,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              <Sparkles size={14} />
              {activePage.badge}
            </span>
          )}

          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              margin: 0,
              color: textColor
            }}
          >
            {activePage.title}
          </h1>

          {activePage.subtitle && (
            <p
              style={{
                fontSize: 'clamp(15px, 2vw, 19px)',
                lineHeight: 1.6,
                color: subTextColor,
                margin: 0,
                maxWidth: 700
              }}
            >
              {activePage.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* ── MODULAR SECTIONS ── */}
      <main style={{ flex: 1, maxWidth: 1240, margin: '0 auto', width: '100%', padding: '0 24px 90px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 64 }}>
        {(activePage.sections || []).map((sec, sIdx) => {
          return (
            <section
              key={sec.id || `sec-${sIdx}`}
              style={{
                borderRadius: 28,
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                padding: sec.fullCard ? 0 : 'clamp(20px, 3.5vw, 40px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Section Header */}
              {sec.showHeading !== false && (sec.title || sec.badge) && (
                <div style={{
                  marginBottom: sec.fullCard ? 20 : 28,
                  padding: sec.fullCard ? 'clamp(20px, 3vw, 32px) clamp(20px, 3vw, 32px) 0' : 0,
                  textAlign: sec.type === 'cta' || sec.type === 'pricing' || sec.type === 'stats' ? 'center' : 'left'
                }}>
                  {sec.badge && (
                    <span style={{ fontSize: 11, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                      {sec.badge}
                    </span>
                  )}
                  {sec.title && (
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, margin: 0, color: textColor }}>
                      {sec.title}
                    </h2>
                  )}
                  {sec.subtitle && (
                    <p style={{ fontSize: 15, color: subTextColor, marginTop: 6, marginBottom: 0, lineHeight: 1.6 }}>
                      {sec.subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* 1. TEXT / PARAGRAPH / ARTICLE & QUOTE BLOCK */}
              {sec.type === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: sec.fullCard && sec.showHeading !== false ? '0 clamp(20px, 3vw, 32px) clamp(20px, 3vw, 32px)' : 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: isDark ? '#cbd5e1' : '#334155',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {sec.content || 'Konten teks halaman...'}
                  </div>

                  {sec.quote && (
                    <div
                      style={{
                        padding: '24px 28px',
                        borderRadius: 20,
                        background: `${accentColor}12`,
                        borderLeft: `4px solid ${accentColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      <Quote size={28} color={accentColor} />
                      <p style={{ fontSize: 17, fontWeight: 700, fontStyle: 'italic', margin: 0, color: textColor, lineHeight: 1.6 }}>
                        "{sec.quote}"
                      </p>
                      {(sec.quoteAuthor || sec.quoteRole) && (
                        <div style={{ fontSize: 13, fontWeight: 800, color: accentColor }}>
                          — {sec.quoteAuthor} {sec.quoteRole ? `(${sec.quoteRole})` : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. GALLERY GRID WITH LIGHTBOX CAROUSEL MODAL & OPTIONAL DIRECT LINK */}
              {sec.type === 'gallery' && (
                <div style={{ padding: sec.fullCard && sec.showHeading !== false ? '0 clamp(20px, 3vw, 32px) clamp(20px, 3vw, 32px)' : 0 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(auto-fill, minmax(${sec.columns === 2 ? '340px' : sec.columns === 4 ? '220px' : '280px'}, 1fr))`,
                      gap: 18
                    }}
                  >
                    {(sec.images || []).map((imgObj: any, imgIdx: number) => {
                      const imgUrl = typeof imgObj === 'string' ? imgObj : imgObj.url;
                      const caption = typeof imgObj === 'object' ? imgObj.caption || imgObj.title : '';
                      const hasLink = typeof imgObj === 'object' && Boolean(imgObj.linkUrl);
                      return (
                        <div
                          key={imgIdx}
                          onClick={() => {
                            if (hasLink && imgObj.linkUrl) {
                              if (imgObj.linkUrl.startsWith('http') || imgObj.linkUrl.startsWith('//')) {
                                window.open(imgObj.linkUrl, '_blank');
                              } else {
                                navigate(imgObj.linkUrl);
                              }
                            } else {
                              setLightboxData({
                                images: (sec.images || []).map((i: any) =>
                                  typeof i === 'string' ? { url: i, caption: '' } : i
                                ),
                                currentIndex: imgIdx
                              });
                            }
                          }}
                          style={{
                            borderRadius: 18,
                            overflow: 'hidden',
                            position: 'relative',
                            aspectRatio: '4 / 3',
                            cursor: 'pointer',
                            background: isDark ? '#1e293b' : '#e2e8f0',
                            border: `1px solid ${cardBorder}`,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={caption || `Gallery ${imgIdx + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)',
                              opacity: caption || hasLink ? 1 : 0,
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'space-between',
                              padding: 14,
                              color: '#fff',
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <span style={{ fontSize: 12.5, fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{caption}</span>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {hasLink ? <ArrowUpRight size={15} /> : <Maximize2 size={14} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. BEFORE / AFTER INTERACTIVE SLIDER BLOCK */}
              {sec.type === 'before_after' && (
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <BeforeAfterSlider
                    beforeImage={sec.beforeImage}
                    afterImage={sec.afterImage}
                    beforeLabel={sec.beforeLabel}
                    afterLabel={sec.afterLabel}
                    accentColor={accentColor}
                    isDark={isDark}
                  />
                </div>
              )}

              {/* 4. CARDS GRID WITH MODAL POPUP DETAIL OR LINK ACTION */}
              {sec.type === 'cards_grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 24 }}>
                  {(sec.cards || []).map((card, cIdx) => (
                    <div
                      key={card.id || cIdx}
                      onClick={() => {
                        if (card.actionType === 'link' && card.linkUrl) {
                          if (card.linkUrl.startsWith('http')) window.open(card.linkUrl, '_blank');
                          else navigate(card.linkUrl);
                        } else {
                          setActiveCardModal(card);
                          setCardCarouselIdx(0);
                        }
                      }}
                      style={{
                        borderRadius: 22,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${cardBorder}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                      }}
                    >
                      {card.image && (
                        <div style={{ width: '100%', height: 180, position: 'relative', overflow: 'hidden' }}>
                          <img src={card.image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {card.badge && (
                            <span style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 100, background: accentColor, color: '#fff', fontSize: 10.5, fontWeight: 900 }}>
                              {card.badge}
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, margin: 0, color: textColor }}>
                          {card.title}
                        </h3>
                        <p style={{ fontSize: 13.5, color: subTextColor, margin: 0, lineHeight: 1.6, flex: 1 }}>
                          {card.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${cardBorder}` }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: accentColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {card.actionType === 'link' ? 'Kunjungi Link' : 'Lihat Detail'}
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 5. STATS COUNTER GRID BLOCK */}
              {sec.type === 'stats' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, textAlign: 'center' }}>
                  {(sec.items || []).map((stat: any, stIdx: number) => (
                    <div
                      key={stIdx}
                      style={{
                        padding: '24px 16px',
                        borderRadius: 20,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(32px, 4vw, 46px)', fontWeight: 900, color: accentColor, lineHeight: 1 }}>
                        {stat.value || '100+'}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 750, color: textColor }}>
                        {stat.label || 'Klien Puas'}
                      </span>
                      {stat.sublabel && (
                        <span style={{ fontSize: 11.5, color: subTextColor }}>{stat.sublabel}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 6. TESTIMONIALS / REVIEW CARDS BLOCK */}
              {sec.type === 'testimonials' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {(sec.items || []).map((tItem: any, tIdx: number) => (
                    <div
                      key={tIdx}
                      style={{
                        padding: 24,
                        borderRadius: 22,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14
                      }}
                    >
                      <div style={{ display: 'flex', gap: 3, color: '#f59e0b' }}>
                        {[...Array(tItem.rating || 5)].map((_, rIdx) => (
                          <Star key={rIdx} size={15} fill="#f59e0b" />
                        ))}
                      </div>
                      <p style={{ fontSize: 14.5, color: isDark ? '#cbd5e1' : '#334155', fontStyle: 'italic', margin: 0, lineHeight: 1.6, flex: 1 }}>
                        "{tItem.quote || tItem.content || 'Pelayanan luar biasa dan hasil desain memuaskan.'}"
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 10, borderTop: `1px solid ${cardBorder}` }}>
                        {tItem.avatar && (
                          <img src={tItem.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        )}
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 850, color: textColor }}>{tItem.name || 'Nama Klien'}</div>
                          <div style={{ fontSize: 12, color: subTextColor }}>{tItem.role || 'CEO / Founder'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 7. STEP-BY-STEP PROCESS TIMELINE BLOCK */}
              {sec.type === 'process' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  {(sec.items || []).map((step: any, sIdx: number) => (
                    <div
                      key={sIdx}
                      style={{
                        padding: 24,
                        borderRadius: 20,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900 }}>
                        {sIdx + 1}
                      </div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 850, margin: 0, color: textColor }}>
                        {step.title || `Tahap ${sIdx + 1}`}
                      </h3>
                      <p style={{ fontSize: 13.5, color: subTextColor, margin: 0, lineHeight: 1.6 }}>
                        {step.desc || step.description || 'Deskripsi proses pengerjaan...'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 8. VIDEO EMBED / MEDIA PLAYER BLOCK */}
              {sec.type === 'video' && (
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: sec.fullCard ? 0 : 20,
                      overflow: 'hidden',
                      aspectRatio: '16 / 9',
                      background: '#000',
                      boxShadow: sec.fullCard ? 'none' : '0 16px 40px rgba(0,0,0,0.25)',
                      border: sec.fullCard ? 'none' : `1px solid ${cardBorder}`
                    }}
                  >
                    {sec.videoUrl?.includes('youtube.com') || sec.videoUrl?.includes('youtu.be') ? (
                      <iframe
                        src={sec.videoUrl.replace('watch?v=', 'embed/')}
                        title="Video Player"
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={sec.videoUrl}
                        poster={sec.videoThumbnail}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 9. BUTTON GROUP / MULTI-ACTION NAVIGATION BLOCK */}
              {sec.type === 'button_group' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', padding: '16px 0' }}>
                  {(sec.buttons || []).map((btn, bIdx) => {
                    const isPrimary = btn.variant === 'primary' || !btn.variant;
                    return (
                      <button
                        key={bIdx}
                        onClick={() => {
                          if (btn.url?.startsWith('http') || btn.url?.startsWith('wa.me')) {
                            window.open(btn.url, '_blank');
                          } else if (btn.url) {
                            navigate(btn.url);
                          }
                        }}
                        style={{
                          padding: '13px 26px',
                          borderRadius: 100,
                          background: isPrimary ? accentColor : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                          color: isPrimary ? '#ffffff' : textColor,
                          border: isPrimary ? 'none' : `1px solid ${cardBorder}`,
                          fontWeight: 800,
                          fontSize: 14,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: isPrimary ? `0 8px 24px ${accentColor}40` : 'none'
                        }}
                      >
                        <span>{btn.label || 'Klik Di Sini'}</span>
                        <ArrowRight size={15} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 10. FEATURES GRID BLOCK */}
              {sec.type === 'features' && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${sec.columns === 2 ? '320px' : '260px'}, 1fr))`, gap: 20 }}>
                  {(sec.items || []).map((item: any, iIdx: number) => (
                    <div
                      key={item.id || iIdx}
                      style={{
                        padding: 24,
                        borderRadius: 20,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${accentColor}18`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={20} />
                      </div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: 0, color: textColor }}>
                        {item.title || `Fitur ${iIdx + 1}`}
                      </h3>
                      <p style={{ fontSize: 14, color: subTextColor, margin: 0, lineHeight: 1.6 }}>
                        {item.desc || item.description || 'Deskripsi rincian fitur atau layanan...'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 11. PRICING TABLE BLOCK */}
              {sec.type === 'pricing' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                  {(sec.plans || []).map((plan: any, pIdx: number) => {
                    const isPopular = plan.isPopular || plan.popular;
                    return (
                      <div
                        key={plan.id || pIdx}
                        style={{
                          padding: 32,
                          borderRadius: 24,
                          background: isPopular ? `${accentColor}10` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                          border: isPopular ? `2px solid ${accentColor}` : `1px solid ${cardBorder}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 20,
                          position: 'relative'
                        }}
                      >
                        {isPopular && (
                          <span
                            style={{
                              position: 'absolute',
                              top: -12,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              padding: '4px 14px',
                              borderRadius: 100,
                              background: accentColor,
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 900,
                              letterSpacing: '0.05em'
                            }}
                          >
                            POPULER
                          </span>
                        )}

                        <div>
                          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, margin: 0, color: textColor }}>
                            {plan.name || 'Paket Standar'}
                          </h3>
                          <p style={{ fontSize: 13, color: subTextColor, marginTop: 4, marginBottom: 0 }}>
                            {plan.desc || 'Solusi tepat untuk kebutuhan Anda'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 32, fontWeight: 900, color: textColor }}>
                            {plan.price || 'Rp 0'}
                          </span>
                          {plan.period && <span style={{ fontSize: 13, color: subTextColor }}>/{plan.period}</span>}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                          {(plan.features || []).map((feat: string, fIdx: number) => (
                            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: isDark ? '#cbd5e1' : '#475569' }}>
                              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Check size={12} strokeWidth={3} />
                              </div>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            if (plan.buttonAction === 'consultation' || !plan.buttonUrl) {
                              setIsBookingOpen(true);
                            } else if (plan.buttonUrl?.startsWith('http') || plan.buttonUrl?.startsWith('wa.me')) {
                              window.open(plan.buttonUrl, '_blank');
                            } else {
                              navigate(plan.buttonUrl);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 20px',
                            borderRadius: 14,
                            background: isPopular ? accentColor : 'transparent',
                            color: isPopular ? '#ffffff' : textColor,
                            border: isPopular ? 'none' : `1.5px solid ${cardBorder}`,
                            fontWeight: 800,
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s'
                          }}
                        >
                          <span>{plan.buttonText || 'Pilih Paket Ini'}</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 12. FAQ ACCORDION BLOCK */}
              {sec.type === 'faq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(sec.faqs || []).map((faq, fIdx) => {
                    const isOpen = openFaqIndices[sec.id] === fIdx;
                    return (
                      <div
                        key={fIdx}
                        style={{
                          borderRadius: 16,
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${cardBorder}`,
                          overflow: 'hidden',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div
                          onClick={() => toggleFaq(sec.id, fIdx)}
                          style={{
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: 15, fontWeight: 800, color: textColor }}>
                            {faq.question}
                          </span>
                          <ChevronDown
                            size={18}
                            style={{
                              color: subTextColor,
                              transform: isOpen ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s'
                            }}
                          />
                        </div>
                        {isOpen && (
                          <div style={{ padding: '0 20px 18px', fontSize: 14, color: subTextColor, lineHeight: 1.6, borderTop: `1px solid ${cardBorder}`, paddingTop: 12 }}>
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 13. CTA BANNER BLOCK */}
              {sec.type === 'cta' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 900, margin: 0, color: textColor }}>
                    {sec.title || 'Siap Memulai Kerjasama?'}
                  </h3>
                  <p style={{ fontSize: 16, color: subTextColor, margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
                    {sec.subtitle || sec.content || 'Hubungi kami sekarang untuk konsultasi gratis dan wujudkan proyek digital terbaik Anda.'}
                  </p>
                  <button
                    onClick={() => {
                      if (sec.buttonType === 'consultation' || !sec.buttonUrl) {
                        setIsBookingOpen(true);
                      } else if (sec.buttonUrl?.startsWith('http')) {
                        window.open(sec.buttonUrl, '_blank');
                      } else {
                        navigate(sec.buttonUrl);
                      }
                    }}
                    style={{
                      padding: '14px 32px',
                      borderRadius: 100,
                      background: accentColor,
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 900,
                      fontSize: 15,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: `0 10px 30px ${accentColor}50`,
                      marginTop: 8
                    }}
                  >
                    <span>{sec.buttonText || 'Jadwalkan Konsultasi'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {/* 14. INTERACTIVE CONTACT & LEAD FORM (WHATSAPP, EMAIL, TELEGRAM) */}
              {sec.type === 'contact_form' && (
                <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Channel Switchers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      KIRIM MELALUI SALURAN:
                    </span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={15} color="#22c55e" />, border: '#22c55e', text: '#22c55e' },
                        { id: 'email', label: 'Email', icon: <Mail size={15} color="#a855f7" />, border: '#a855f7', text: '#a855f7' },
                        { id: 'telegram', label: 'Telegram', icon: <Send size={15} color="#0284c7" />, border: '#0284c7', text: '#0284c7' },
                      ].map((ch) => {
                        const isAct = contactChannel === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setContactChannel(ch.id as any)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: '8px 16px',
                              borderRadius: 100,
                              background: isAct ? (isDark ? 'rgba(255,255,255,0.08)' : '#ffffff') : 'transparent',
                              border: isAct ? `2px solid ${ch.border}` : `1px solid ${cardBorder}`,
                              color: isAct ? ch.text : subTextColor,
                              fontSize: 13,
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: isAct ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                              transition: 'all 0.15s'
                            }}
                          >
                            {ch.icon}
                            <span>{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={contactFormFields[sec.id]?.name || ''}
                      onChange={(e) => setContactFormFields(prev => ({ ...prev, [sec.id]: { ...(prev[sec.id] || { name: '', phone: '', service: '', message: '' }), name: e.target.value } }))}
                      style={{ padding: '13px 16px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                      type="tel"
                      placeholder={contactChannel === 'email' ? 'Alamat Email Anda' : contactChannel === 'telegram' ? 'Username Telegram (@)' : 'Nomor WhatsApp Aktif'}
                      value={contactFormFields[sec.id]?.phone || ''}
                      onChange={(e) => setContactFormFields(prev => ({ ...prev, [sec.id]: { ...(prev[sec.id] || { name: '', phone: '', service: '', message: '' }), phone: e.target.value } }))}
                      style={{ padding: '13px 16px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <select
                    value={contactFormFields[sec.id]?.service || ''}
                    onChange={(e) => setContactFormFields(prev => ({ ...prev, [sec.id]: { ...(prev[sec.id] || { name: '', phone: '', service: '', message: '' }), service: e.target.value } }))}
                    style={{ padding: '13px 16px', borderRadius: 14, background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
                  >
                    <option value="">Pilih Jenis Layanan / Proyek</option>
                    {(sec.contactServices || ['Desain & Pembuatan Website', 'Branding & Identitas Visual', 'Konsultasi Bisnis Digital', 'Lainnya']).map((srv: string, sIdx: number) => (
                      <option key={sIdx} value={srv}>{srv}</option>
                    ))}
                  </select>

                  <textarea
                    placeholder="Ceritakan detail proyek atau kebutuhan Anda..."
                    rows={4}
                    value={contactFormFields[sec.id]?.message || ''}
                    onChange={(e) => setContactFormFields(prev => ({ ...prev, [sec.id]: { ...(prev[sec.id] || { name: '', phone: '', service: '', message: '' }), message: e.target.value } }))}
                    style={{ padding: '14px 16px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                  />

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const f = contactFormFields[sec.id] || { name: '', phone: '', service: '', message: '' };
                      const targetWa = (sec.contactWhatsappNumber || data?.contact?.whatsapp || '').replace(/[^0-9]/g, '');
                      const text = `Halo, saya ${f.name || 'Pengunjung'}.\nLayanan: ${f.service || 'Konsultasi'}\nKontak: ${f.phone || '-'}\nPesan: ${f.message || '-'}`;
                      
                      if (contactChannel === 'whatsapp') {
                        window.open(`https://wa.me/${targetWa || '6281234567890'}?text=${encodeURIComponent(text)}`, '_blank');
                      } else if (contactChannel === 'email') {
                        window.open(`mailto:${sec.contactEmailAddress || data?.contact?.email || 'hi.sumrday@gmail.com'}?subject=Inquiry ${f.service}&body=${encodeURIComponent(text)}`, '_blank');
                      } else {
                        window.open(`https://t.me/${(sec.contactTelegramUsername || 'admin').replace('@', '')}?text=${encodeURIComponent(text)}`, '_blank');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      borderRadius: 14,
                      background: accentColor,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: `0 8px 24px ${accentColor}40`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <MessageSquare size={17} />
                    <span>Kirim via {contactChannel === 'whatsapp' ? 'WhatsApp' : contactChannel === 'email' ? 'Email' : 'Telegram'}</span>
                  </button>
                </div>
              )}

              {/* 15. LOGO CLOUD / PARTNERS BLOCK */}
              {sec.type === 'logo_cloud' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '10px 0' }}>
                  {(sec.logos || [
                    { name: 'Google Partner', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80' },
                    { name: 'Meta Verified', imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=200&q=80' },
                    { name: 'Shopify Plus', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=200&q=80' },
                    { name: 'Stripe Verified', imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=200&q=80' }
                  ]).map((lg: any, lIdx: number) => (
                    <div
                      key={lIdx}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 14,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${cardBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        opacity: 0.85
                      }}
                    >
                      <Sparkles size={16} color={accentColor} />
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: textColor }}>{lg.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 16. COUNTDOWN TIMER BLOCK */}
              {sec.type === 'countdown' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                  {sec.countdownPromoText && (
                    <span style={{ padding: '6px 16px', borderRadius: 100, background: `${accentColor}18`, color: accentColor, fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>
                      {sec.countdownPromoText}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    {[
                      { val: '02', lbl: 'Hari' },
                      { val: '14', lbl: 'Jam' },
                      { val: '45', lbl: 'Menit' },
                      { val: '30', lbl: 'Detik' },
                    ].map((t, tidx) => (
                      <div key={tidx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 18px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${cardBorder}`, minWidth: 64 }}>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 900, color: accentColor }}>{t.val}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: subTextColor }}>{t.lbl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 17. PRICE MENU / RESTO LIST BLOCK */}
              {sec.type === 'price_menu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720, margin: '0 auto', width: '100%' }}>
                  {(sec.menuItems || [
                    { name: 'Aren Creamy Latte', price: 'Rp 28.000', desc: 'Espresso blend arabica dengan gula aren organik dan fresh milk.' },
                    { name: 'Manual Brew V60 Single Origin', price: 'Rp 35.000', desc: 'Biji kopi pilihan Jawa Barat dengan aroma floral & citrus.' },
                    { name: 'Butter Croissant Artisan', price: 'Rp 25.000', desc: 'Pastry renyah berlapis dengan mentega Prancis murni.' }
                  ]).map((item: any, mIdx: number) => (
                    <div key={mIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 10, borderBottom: `1px dashed ${cardBorder}` }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: textColor }}>{item.name}</span>
                        <div style={{ flex: 1, borderBottom: `1px dotted ${subTextColor}40`, margin: '0 8px' }} />
                        <span style={{ fontSize: 15, fontWeight: 900, color: accentColor, whiteSpace: 'nowrap' }}>{item.price}</span>
                      </div>
                      {item.desc && <span style={{ fontSize: 12.5, color: subTextColor, lineHeight: 1.4 }}>{item.desc}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* 18. TEAM GRID BLOCK */}
              {sec.type === 'team_grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                  {(sec.teamMembers || [
                    { name: 'Alex Pratama', role: 'Lead Architect', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: '10+ tahun pengalaman merancang sistem digital modern.' },
                    { name: 'Siti Rahma', role: 'Head of Design', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', bio: 'Spesialis estetika visual & pengalaman antarmuka pengguna.' }
                  ]).map((m: any, mIdx: number) => (
                    <div key={mIdx} style={{ padding: 18, borderRadius: 20, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
                      <img src={m.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} alt={m.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentColor}` }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textColor }}>{m.name}</h4>
                        <span style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>{m.role}</span>
                      </div>
                      {m.bio && <p style={{ margin: 0, fontSize: 12, color: subTextColor, lineHeight: 1.5 }}>{m.bio}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* 19. CODE SNIPPET / TERMINAL BLOCK */}
              {sec.type === 'code_block' && (
                <div style={{ borderRadius: 16, background: '#090d16', border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{sec.codeLanguage || 'bash'}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sec.codeSnippet || 'npm install @sumrday/core');
                        setCopiedCoupon('code');
                        setTimeout(() => setCopiedCoupon(null), 2000);
                      }}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      {copiedCoupon === 'code' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      <span>{copiedCoupon === 'code' ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: 16, color: '#38bdf8', fontSize: 13, fontFamily: 'monospace', overflowX: 'auto' }}>
                    <code>{sec.codeSnippet || 'npm install @sumrday/core\nnpx sumrday deploy --production'}</code>
                  </pre>
                </div>
              )}

              {/* 20. AUDIO PLAYER BLOCK */}
              {sec.type === 'audio_player' && (
                <div style={{ padding: 18, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                    <Music size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: textColor }}>{sec.trackTitle || 'Audio Preview Track'}</div>
                    <div style={{ fontSize: 12, color: subTextColor }}>{sec.trackArtist || 'Studio Official Audio'}</div>
                  </div>
                  <audio controls style={{ height: 36, flex: 1, minWidth: 220 }} src={sec.audioUrl || ''}>
                    Browser Anda tidak mendukung audio.
                  </audio>
                </div>
              )}

              {/* 21. MAP & LOCATION BLOCK */}
              {sec.type === 'map_location' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: accentColor }}>
                      <MapPin size={20} />
                      <span style={{ fontSize: 16, fontWeight: 800 }}>Lokasi & Jam Operasional</span>
                    </div>
                    <p style={{ fontSize: 14, color: textColor, margin: 0, lineHeight: 1.6 }}>
                      {sec.mapAddress || 'Jl. Sudirman No. 88, Grand Studio Tower Lt. 5, Jakarta Selatan'}
                    </p>
                    <div style={{ fontSize: 13, color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={15} />
                      <span>{sec.mapHours || 'Senin - Sabtu: 08.00 - 21.00 WIB'}</span>
                    </div>
                    <button
                      onClick={() => window.open(sec.mapEmbedUrl || 'https://maps.google.com', '_blank')}
                      style={{ padding: '10px 18px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40`, fontWeight: 800, fontSize: 13, cursor: 'pointer', width: 'fit-content', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <ExternalLink size={14} />
                      <span>Buka Google Maps</span>
                    </button>
                  </div>
                  <div style={{ borderRadius: 18, overflow: 'hidden', height: 220, border: `1px solid ${cardBorder}` }}>
                    <iframe
                      title="Lokasi Kami"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613507864!3d-6.194741395493371!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5390917b759%3A0x6b45e67356080477!2sMonumen%20Nasional!5e0!3m2!1sid!2sid!4v1650000000000!5m2!1sid!2sid"
                      style={{ width: '100%', height: '100%', border: 0 }}
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* 22. COMPARISON TABLE BLOCK */}
              {sec.type === 'comparison_table' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${cardBorder}` }}>
                        {(sec.comparisonHeaders || ['Fitur / Kebutuhan', 'Paket Standar', 'Paket Bisnis Pro']).map((h: string, hIdx: number) => (
                          <th key={hIdx} style={{ padding: '12px 14px', fontWeight: 900, color: hIdx === 0 ? textColor : accentColor }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(sec.comparisonRows || [
                        { feature: 'Kustom Domain Pribadi', values: [true, true] },
                        { feature: 'Penyimpanan Media Tak Terbatas', values: [false, true] },
                        { feature: 'Integrasi WhatsApp & CMS', values: [true, true] },
                        { feature: 'Dukungan Prioritas SLA 24/7', values: [false, true] }
                      ]).map((row: any, rIdx: number) => (
                        <tr key={rIdx} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                          <td style={{ padding: '12px 14px', fontWeight: 750, color: textColor }}>{row.feature}</td>
                          {(row.values || []).map((val: any, vIdx: number) => (
                            <td key={vIdx} style={{ padding: '12px 14px' }}>
                              {typeof val === 'boolean' ? (
                                val ? <CheckCircle2 size={18} color="#10b981" /> : <X size={18} color={subTextColor} />
                              ) : (
                                <span style={{ fontWeight: 700, color: textColor }}>{val}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 23. FILE DOWNLOAD CARD BLOCK */}
              {sec.type === 'file_download' && (
                <div style={{ padding: 18, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accentColor}18`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: textColor }}>{sec.fileName || 'Katalog_Layanan_Resmi_2026.pdf'}</div>
                      <div style={{ fontSize: 12, color: subTextColor }}>Format PDF Dokumen • {sec.fileSize || '3.4 MB'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (sec.fileUrl) window.open(sec.fileUrl, '_blank');
                    }}
                    style={{ padding: '10px 20px', borderRadius: 100, background: accentColor, color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={15} />
                    <span>Download File</span>
                  </button>
                </div>
              )}

              {/* 24. ALERT / CALLOUT BOX BLOCK */}
              {sec.type === 'alert_box' && (
                <div style={{ padding: '16px 20px', borderRadius: 16, background: `${accentColor}15`, border: `1px solid ${accentColor}40`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Info size={22} color={accentColor} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: textColor, lineHeight: 1.5 }}>
                    {sec.alertMessage || 'Pemberitahuan: Jadwal konsultasi online tersedia setiap hari kerja pukul 09.00 - 17.00 WIB.'}
                  </div>
                </div>
              )}

              {/* 25. COUPON / VOUCHER CODE BLOCK */}
              {sec.type === 'coupon_box' && (
                <div style={{ padding: 20, borderRadius: 20, background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `2px dashed ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, textAlign: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: accentColor, textTransform: 'uppercase' }}>PROMO SPESIAL</span>
                    <h4 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 900, color: textColor }}>{sec.discountText || 'Diskon 25% Seluruh Layanan Studio'}</h4>
                    <span style={{ fontSize: 12, color: subTextColor }}>Berlaku hingga {sec.couponExpiry || 'Akhir Bulan'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(0,0,0,0.4)' : '#f1f5f9', padding: '6px 12px', borderRadius: 12, border: `1px solid ${cardBorder}` }}>
                    <code style={{ fontSize: 16, fontWeight: 900, color: accentColor, letterSpacing: '0.05em' }}>{sec.couponCode || 'SUMRDAY2026'}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sec.couponCode || 'SUMRDAY2026');
                        setCopiedCoupon(sec.id);
                        setTimeout(() => setCopiedCoupon(null), 2000);
                      }}
                      style={{ padding: '6px 12px', borderRadius: 8, background: accentColor, color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {copiedCoupon === sec.id ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCoupon === sec.id ? 'Tersalin' : 'Salin Kupon'}</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </main>

      <LPFooter data={data} isDark={isDark} accentColor={accentColor} />

      {/* ── LIGHTBOX CAROUSEL MODAL (GALLERY ZOOM & SLIDES) ── */}
      {lightboxData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 60000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box'
          }}
          onClick={() => setLightboxData(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxData(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <X size={22} />
          </button>

          {/* Current image display */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}
          >
            <img
              src={lightboxData.images[lightboxData.currentIndex]?.url}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 16,
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
              }}
            />
            {lightboxData.images[lightboxData.currentIndex]?.caption && (
              <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                {lightboxData.images[lightboxData.currentIndex]?.caption}
              </span>
            )}
          </div>

          {/* Carousel Arrows */}
          {lightboxData.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxData(prev => prev ? {
                    ...prev,
                    currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
                  } : null);
                }}
                style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxData(prev => prev ? {
                    ...prev,
                    currentIndex: (prev.currentIndex + 1) % prev.images.length
                  } : null);
                }}
                style={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── CARD DETAIL POPUP MODAL (WITH IMAGE CAROUSEL & FULL DETAILS) ── */}
      {activeCardModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 60000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box'
          }}
          onClick={() => setActiveCardModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              borderRadius: 28,
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Header / Image Carousel */}
            {(activeCardModal.images?.length > 0 || activeCardModal.image) && (
              <div style={{ position: 'relative', width: '100%', height: 280, background: '#000' }}>
                <img
                  src={
                    activeCardModal.images?.length
                      ? activeCardModal.images[cardCarouselIdx]
                      : activeCardModal.image
                  }
                  alt={activeCardModal.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {activeCardModal.images?.length > 1 && (
                  <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                    {activeCardModal.images.map((_: any, idx: number) => (
                      <span
                        key={idx}
                        onClick={() => setCardCarouselIdx(idx)}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: cardCarouselIdx === idx ? '#ffffff' : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setActiveCardModal(null)}
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Content Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              <div>
                {activeCardModal.badge && (
                  <span style={{ fontSize: 11, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>
                    {activeCardModal.badge}
                  </span>
                )}
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 900, margin: 0, color: textColor }}>
                  {activeCardModal.title}
                </h3>
              </div>

              <p style={{ fontSize: 15, lineHeight: 1.7, color: isDark ? '#cbd5e1' : '#334155', margin: 0 }}>
                {activeCardModal.details || activeCardModal.description}
              </p>

              {activeCardModal.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {activeCardModal.tags.map((t: string, idx: number) => (
                    <span key={idx} style={{ padding: '4px 12px', borderRadius: 100, background: `${accentColor}18`, color: accentColor, fontSize: 12, fontWeight: 800 }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => {
                  setActiveCardModal(null);
                  if (activeCardModal.linkUrl) {
                    if (activeCardModal.linkUrl.startsWith('http')) window.open(activeCardModal.linkUrl, '_blank');
                    else navigate(activeCardModal.linkUrl);
                  } else {
                    setIsBookingOpen(true);
                  }
                }}
                style={{
                  marginTop: 10,
                  padding: '13px 24px',
                  borderRadius: 14,
                  background: accentColor,
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 8px 24px ${accentColor}40`
                }}
              >
                <span>{activeCardModal.linkUrl ? 'Kunjungi Halaman' : 'Konsultasi Sekarang'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          defaultService={activePage.title}
        />
      )}
    </div>
  );
};

export default CustomWebPage;
