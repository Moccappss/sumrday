import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLandingData, setGlobalSiteMode, getEffectiveCompanySections, getEffectivePersonalSections } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPHero from '../components/landing/LPHero';
import LPCompanyHero from '../components/landing/LPCompanyHero';
import SEOHelmet from '../components/SEOHelmet';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { storage } from '../utils/storage';
import { SocialUpdate, DEFAULT_SOCIAL_UPDATES } from '../types/socialUpdates';
import { Building2, User, Sparkles, MessageCircle, ShoppingCart, FolderGit2, ShoppingBag } from 'lucide-react';
import { haptic } from '../utils/haptics';

// Below-the-fold lazy-loaded components for optimal initial paint & Core Web Vitals
const LPPortfolio = lazy(() => import('../components/landing/LPPortfolio'));
const LPClientMarquee = lazy(() => import('../components/landing/LPClientMarquee'));
const LPFooter = lazy(() => import('../components/landing/LPFooter'));
const LPAbout = lazy(() => import('../components/landing/LPAbout'));
const LPProcess = lazy(() => import('../components/landing/LPProcess'));
const LPTestimonials = lazy(() => import('../components/landing/LPTestimonials'));
const LPBlogPreview = lazy(() => import('../components/landing/LPBlogPreview'));
const LPUpdatesFeed = lazy(() => import('../components/landing/LPUpdatesFeed'));
const LPCompanyUpdatesHub = lazy(() => import('../components/landing/LPCompanyUpdatesHub'));
const LPStoreSpotlight = lazy(() => import('../components/landing/LPStoreSpotlight'));
const LPRateCardSpotlight = lazy(() => import('../components/landing/LPRateCardSpotlight'));
const LPCompanySolutions = lazy(() => import('../components/landing/LPCompanySolutions'));
const DesignProjectEstimator = lazy(() => import('../components/landing/DesignProjectEstimator'));
const LPModel3DSpotlight = lazy(() => import('../components/landing/LPModel3DSpotlight'));
const LPFlipbookSpotlight = lazy(() => import('../components/landing/LPFlipbookSpotlight'));
const LPBeforeAfterSpotlight = lazy(() => import('../components/landing/LPBeforeAfterSpotlight'));
const LPHomeCustomWidget = lazy(() => import('../components/landing/LPHomeCustomWidget'));
const LPFloatingStickersOverlay = lazy(() =>
  import('../components/landing/LPFloatingStickers').then((m) => ({
    default: m.LPFloatingStickersOverlay,
  }))
);
const LandingScrollRadar = lazy(() => import('../components/landing/LandingScrollRadar'));
const StudioInquiryModal = lazy(() => import('../components/common/StudioInquiryModal'));
const LPFaqSection = lazy(() => import('../components/landing/LPFaqSection'));

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, projects, isLoading } = useLandingData();
  const containerRef = useRef<HTMLDivElement>(null);
  const [latestUpdate, setLatestUpdate] = useState<SocialUpdate | null>(null);
  const [showMobileDock, setShowMobileDock] = useState(false);
  const [dockCartCount, setDockCartCount] = useState(0);
  const [studioPhone, setStudioPhone] = useState('081234567890');

  // Activate hardware-accelerated scroll reveal animation
  useScrollReveal(containerRef, [projects, data, isLoading]);

  // Force body/html/root scrollable (overrides global CMS fixed-body CSS)
  useLandingBodyFix();

  // Unified website theme hook
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);

  const [accentColor, setAccentColor] = useState<string>(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || data?.theme?.accentColor || '#64748b');

  useEffect(() => {
    if (data?.theme?.accentColor) {
      setAccentColor(data.theme.accentColor);
    }
  }, [data?.theme?.accentColor]);

  useEffect(() => {
    if (accentColor && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-accent', accentColor);
    }
  }, [accentColor]);

  useEffect(() => {
    const handleAccent = (e: any) => {
      if (e?.detail?.color) setAccentColor(e.detail.color);
    };
    window.addEventListener('porto_accent_color_changed', handleAccent);
    return () => window.removeEventListener('porto_accent_color_changed', handleAccent);
  }, []);

  // Fetch latest update for company hero announcement ticker
  useEffect(() => {
    const loadLatest = async () => {
      try {
        const list = await storage.getItem('porto_social_updates', DEFAULT_SOCIAL_UPDATES);
        if (Array.isArray(list) && list.length > 0) {
          const sorted = [...list]
            .filter(u => u.isPublished !== false)
            .sort((a, b) => new Date(b.customDate || b.createdAt).getTime() - new Date(a.customDate || a.createdAt).getTime());
          setLatestUpdate(sorted[0] || null);
        }
      } catch (e) { }
    };
    loadLatest();
    window.addEventListener('porto_updates_updated', loadLatest);
    return () => window.removeEventListener('porto_updates_updated', loadLatest);
  }, []);

  // Reactive site mode listener
  const [siteModeOverride, setSiteModeOverride] = useState<string | null>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('porto_site_mode') : null;
  });

  useEffect(() => {
    const handleMode = (e: any) => {
      if (e?.detail?.mode) setSiteModeOverride(e.detail.mode);
    };
    window.addEventListener('porto_sitemode_changed', handleMode);

    const unsubStorage = storage.listenItem('porto_main_website', (d: any) => {
      if (d?.siteMode) setSiteModeOverride(d.siteMode);
    });

    return () => {
      window.removeEventListener('porto_sitemode_changed', handleMode);
      if (typeof unsubStorage === 'function') unsubStorage();
    };
  }, []);

  // Sync studio phone for consultation
  useEffect(() => {
    storage.getItem<any>('porto_business_profile', null).then(prof => {
      if (prof?.whatsapp) setStudioPhone(prof.whatsapp);
      else if (data?.profile?.phone) setStudioPhone(data.profile.phone);
    }).catch(() => {
      if (data?.profile?.phone) setStudioPhone(data.profile.phone);
    });
  }, [data?.profile?.phone]);

  // Sync live cart count
  useEffect(() => {
    const updateCart = () => {
      try {
        const raw = localStorage.getItem('porto_client_cart');
        const items = raw ? JSON.parse(raw) : [];
        const count = items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);
        setDockCartCount(count);
      } catch {
        setDockCartCount(0);
      }
    };
    updateCart();
    window.addEventListener('storage', updateCart);
    window.addEventListener('porto_cart_updated', updateCart);
    return () => {
      window.removeEventListener('storage', updateCart);
      window.removeEventListener('porto_cart_updated', updateCart);
    };
  }, []);

  // Scroll trigger for mobile quick dock
  useEffect(() => {
    const handleScroll = () => {
      const top = window.pageYOffset || document.documentElement.scrollTop || 0;
      setShowMobileDock(top > 260);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentMode = siteModeOverride || data?.siteMode || data?.aboutSettings?.mode || 'company';
  const isCompanyMode = currentMode === 'company';

  const navItems = [
    ...(data?.navbar?.items || [] as any),
    ...(data?.shopSettings?.enabled ? [{ id: 'nav-katalog', type: 'link', label: 'Katalog', url: '/katalog' }] : [])
  ];

  return (
    <>
      <SEOHelmet
        title={data?.seo?.metaTitle || (isCompanyMode
          ? `${data?.companyHero?.headline || 'sumr.day'} | Creative Digital & Enterprise Systems`
          : 'sumr.day | Creative Digital Studio')}
        description={data?.seo?.metaDescription || 'Solusi digital modern, rilis aset digital terkurasi, produk interaktif, dan wawasan industri.'}
        image={data?.seo?.ogImage || ''}
      />

      {/* Floating Top Navbar (Isolated from page content) */}
      <LPNavbar
        items={navItems}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        logoImage={data?.navbar?.logoImage}
        isDark={isDark}
        accentColor={accentColor}
      />

      {isLoading ? (
        <div
          className="client-landing-root"
          style={{
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: isDark ? '#06070a' : '#eef2f6',
          }}
        >
          {/* Hero skeleton */}
          <div style={{
            paddingTop: 120,
            paddingBottom: 60,
            paddingLeft: 24,
            paddingRight: 24,
            maxWidth: 900,
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            <div style={{ width: 160, height: 24, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', animation: 'pulse 1.6s ease-in-out infinite' }} />
            <div style={{ width: '70%', height: 52, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)', animation: 'pulse 1.6s ease-in-out infinite' }} />
            <div style={{ width: '55%', height: 28, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', animation: 'pulse 1.6s ease-in-out infinite' }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ width: 160, height: 44, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', animation: 'pulse 1.6s ease-in-out infinite' }} />
              <div style={{ width: 140, height: 44, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', animation: 'pulse 1.6s ease-in-out infinite' }} />
            </div>
          </div>
          {/* Marquee skeleton */}
          <div style={{ height: 70, width: '100%', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 32px', overflow: 'hidden' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ flexShrink: 0, width: 140, height: 38, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', animation: 'pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
          {/* Cards skeleton */}
          <div style={{ padding: '40px 24px', display: 'flex', gap: 20, flexWrap: 'wrap', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: '1 1 280px', height: 200, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', animation: 'pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="client-landing-root"
          style={{
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: isDark ? '#06070a' : '#eef2f6',
            color: isDark ? '#ffffff' : '#0f172a',
            transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <main style={{ flex: 1, width: '100%' }}>
            {isCompanyMode ? (
              /* ════════ MODE PERUSAHAAN / USAHA (PROFESIONAL & FOKUS UPDATES) ════════ */
              <>
                {getEffectiveCompanySections(data?.companySections, data?.deletedCompanySections)
                  .filter(sec => sec.enabled !== false)
                  .map(sec => {
                    switch (sec.id) {
                      case 'hero':
                        return (
                          <LPCompanyHero
                            key="company-hero"
                            data={data}
                            latestUpdate={latestUpdate}
                            isDark={isDark}
                            accentColor={accentColor}
                          />
                        );
                      case 'clients':
                        return (
                          <Suspense key="company-clients" fallback={null}>
                            <LPClientMarquee
                              clients={data?.aboutSettings?.company?.clients}
                              isDark={isDark}
                              accentColor={accentColor}
                              badge={data?.aboutSettings?.company?.marqueeBadge}
                              title={data?.aboutSettings?.company?.marqueeTitle}
                              metric1={data?.aboutSettings?.company?.marqueeMetric1}
                              metric2={data?.aboutSettings?.company?.marqueeMetric2}
                            />
                          </Suspense>
                        );
                      case 'updates':
                        return (
                          <LPCompanyUpdatesHub
                            key="company-updates"
                            isDark={isDark}
                            accentColor={accentColor}
                            badge={data?.companyUpdates?.badge || 'RILIS & UPDATE TERBARU'}
                            title={data?.companyUpdates?.title || 'Sorotan Rilis & Aktivitas Studio'}
                            subtitle={data?.companyUpdates?.subtitle || 'Pembaruan terpilih seputar rilis aset baru, produk digital, dan wawasan terkini dari studio.'}
                            showSingleOnly={true}
                            seeMoreUrl="/updates"
                            seeMoreLabel="Lihat Semua Update & Rilis"
                            selectedUpdateId={data?.companyUpdates?.selectedUpdateId}
                          />
                        );
                      case 'store':
                        return (
                          <LPStoreSpotlight
                            key="company-store"
                            isDark={isDark}
                            accentColor={accentColor}
                            shopSettings={data?.shopSettings}
                            badge={data?.storeSpotlight?.badge}
                            title={data?.storeSpotlight?.title}
                            subtitle={data?.storeSpotlight?.subtitle}
                            maxItems={data?.storeSpotlight?.maxItems}
                            selectedProductIds={data?.storeSpotlight?.selectedProductIds}
                          />
                        );
                      case 'ratecard':
                        return (
                          <LPRateCardSpotlight
                            key="company-ratecard"
                            isDark={isDark}
                            accentColor={accentColor}
                            badge={data?.rateCardSpotlight?.badge}
                            title={data?.rateCardSpotlight?.title}
                            subtitle={data?.rateCardSpotlight?.subtitle}
                          />
                        );
                      case 'estimator':
                        return (
                          <div key="company-estimator" id="estimator" style={{ width: '100%', scrollMarginTop: 80, padding: '0 clamp(16px, 3.5vw, 24px)', boxSizing: 'border-box' }}>
                            <DesignProjectEstimator
                              isDark={isDark}
                              accentColor={accentColor}
                              studioName={data?.companyHero?.headline || data?.navbar?.logoText || 'sumr.day Studio'}
                              studioPhone={data?.profile?.phone || '081234567890'}
                            />
                          </div>
                        );
                      case 'solutions':
                        return (
                          <LPCompanySolutions
                            key="company-solutions"
                            isDark={isDark}
                            accentColor={accentColor}
                            badge={data?.companySolutions?.badge}
                            title={data?.companySolutions?.title}
                            subtitle={data?.companySolutions?.subtitle}
                          />
                        );
                      case 'portfolio':
                        return (
                          <Suspense key="company-portfolio" fallback={null}>
                            <LPPortfolio
                              projects={projects || []}
                              landingFeaturedLabel={data?.landingFeaturedLabel || 'Karya & Proyek Terpilih'}
                              isDark={isDark}
                              accentColor={accentColor}
                              localization={data?.localization}
                            />
                          </Suspense>
                        );
                      case 'beforeafter':
                        return (
                          <LPBeforeAfterSpotlight
                            key="company-beforeafter"
                            isDark={isDark}
                            accentColor={accentColor}
                            title={data?.beforeAfterSettings?.title}
                            subtitle={data?.beforeAfterSettings?.subtitle}
                            presets={data?.beforeAfterSettings?.presets}
                          />
                        );
                      case 'model3d':
                        return (
                          <LPModel3DSpotlight
                            key="company-model3d"
                            isDark={isDark}
                            accentColor={accentColor}
                            badge={data?.model3dSettings?.badge}
                            title={data?.model3dSettings?.title}
                            subtitle={data?.model3dSettings?.subtitle}
                            modelUrl={data?.model3dSettings?.modelUrl}
                            height={data?.model3dSettings?.height}
                            autoRotate={data?.model3dSettings?.autoRotate}
                          />
                        );
                      case 'flipbook':
                        return (
                          <LPFlipbookSpotlight
                            key="company-flipbook"
                            isDark={isDark}
                            accentColor={accentColor}
                            badge={data?.flipbookSettings?.badge}
                            title={data?.flipbookSettings?.title}
                            subtitle={data?.flipbookSettings?.subtitle}
                            pdfUrl={data?.flipbookSettings?.pdfUrl}
                            totalPages={data?.flipbookSettings?.totalPages}
                            bookTitle={data?.flipbookSettings?.bookTitle}
                            height={data?.flipbookSettings?.height}
                            defaultViewMode={data?.flipbookSettings?.defaultViewMode}
                            allowDownload={data?.flipbookSettings?.allowDownload ?? true}
                          />
                        );
                      case 'process':
                        return (
                          <LPProcess
                            key="company-process"
                            process={data?.process || []}
                            isDark={isDark}
                            accentColor={accentColor}
                            localization={data?.localization}
                          />
                        );
                      case 'testimonials':
                        return (
                          <LPTestimonials
                            key="company-testimonials"
                            testimonials={data?.testimonials || []}
                            isDark={isDark}
                            accentColor={accentColor}
                            localization={data?.localization}
                          />
                        );
                      case 'blog':
                        return (
                          <LPBlogPreview
                            key="company-blog"
                            isDark={isDark}
                            accentColor={accentColor}
                            title={data?.blogPreview?.title || 'Artikel & Wawasan Industri'}
                            subtitle={data?.blogPreview?.subtitle || 'Studi kasus, analisis arsitektur web, dan catatan teknis terkini.'}
                            maxPosts={data?.blogPreview?.maxPosts || 3}
                            ctaLabel={data?.blogPreview?.ctaLabel || 'Lihat Semua Artikel'}
                          />
                        );
                      case 'faq':
                        return (
                          <Suspense key="company-faq" fallback={null}>
                            <LPFaqSection isDark={isDark} accentColor={accentColor} />
                          </Suspense>
                        );
                      default: {
                        const customWidget = data?.homeWidgets?.[sec.id];
                        if (customWidget) {
                          return (
                            <LPHomeCustomWidget
                              key={sec.id}
                              widget={customWidget}
                              isDark={isDark}
                              accentColor={accentColor}
                            />
                          );
                        }
                        return null;
                      }
                    }
                  })}
              </>
            ) : (
              /* ════════ MODE PRIBADI (CREATOR & PERSONAL PORTFOLIO) ════════ */
              <>
                {getEffectivePersonalSections(data?.personalSections, data?.deletedPersonalSections)
                  .filter(sec => sec.enabled !== false)
                  .map(sec => {
                    switch (sec.id) {
                      case 'hero':
                        return (
                          <LPHero
                            key="personal-hero"
                            data={data?.hero || {} as any}
                            isDark={isDark}
                            accentColor={accentColor}
                          />
                        );
                      case 'store':
                        return (
                          <LPStoreSpotlight
                            key="personal-store"
                            isDark={isDark}
                            accentColor={accentColor}
                            shopSettings={data?.shopSettings}
                            badge={data?.storeSpotlight?.badge}
                            title={data?.storeSpotlight?.title}
                            subtitle={data?.storeSpotlight?.subtitle}
                            maxItems={data?.storeSpotlight?.maxItems}
                            selectedProductIds={data?.storeSpotlight?.selectedProductIds}
                          />
                        );
                      case 'ratecard':
                        return (
                          <LPRateCardSpotlight
                            key="personal-ratecard"
                            isDark={isDark}
                            accentColor={accentColor}
                            badge={data?.rateCardSpotlight?.badge}
                            title={data?.rateCardSpotlight?.title}
                            subtitle={data?.rateCardSpotlight?.subtitle}
                          />
                        );
                      case 'estimator':
                        return (
                          <div key="personal-estimator" id="estimator" style={{ width: '100%', scrollMarginTop: 80, padding: '0 clamp(16px, 3.5vw, 24px)', boxSizing: 'border-box' }}>
                            <DesignProjectEstimator
                              isDark={isDark}
                              accentColor={accentColor}
                              studioName={data?.navbar?.logoText || 'sumr.day Studio'}
                              studioPhone={data?.profile?.phone || '081234567890'}
                            />
                          </div>
                        );
                      case 'portfolio':
                        return (
                          <Suspense key="personal-portfolio" fallback={null}>
                            <LPPortfolio
                              projects={projects || []}
                              landingFeaturedLabel={data?.landingFeaturedLabel || ''}
                              isDark={isDark}
                              accentColor={accentColor}
                              localization={data?.localization}
                            />
                          </Suspense>
                        );
                      case 'beforeafter':
                        return (
                          <LPBeforeAfterSpotlight
                            key="personal-beforeafter"
                            isDark={isDark}
                            accentColor={accentColor}
                            title={data?.beforeAfterSettings?.title}
                            subtitle={data?.beforeAfterSettings?.subtitle}
                            presets={data?.beforeAfterSettings?.presets}
                          />
                        );
                      case 'model3d':
                        return (
                          <LPModel3DSpotlight
                            key="personal-model3d"
                            isDark={isDark}
                            accentColor={accentColor}
                            badge={data?.model3dSettings?.badge}
                            title={data?.model3dSettings?.title}
                            subtitle={data?.model3dSettings?.subtitle}
                            modelUrl={data?.model3dSettings?.modelUrl}
                            height={data?.model3dSettings?.height}
                            autoRotate={data?.model3dSettings?.autoRotate}
                          />
                        );
                      case 'flipbook':
                        return (
                          <LPFlipbookSpotlight
                            key="personal-flipbook"
                            isDark={isDark}
                            accentColor={accentColor}
                            badge={data?.flipbookSettings?.badge}
                            title={data?.flipbookSettings?.title}
                            subtitle={data?.flipbookSettings?.subtitle}
                            pdfUrl={data?.flipbookSettings?.pdfUrl}
                            totalPages={data?.flipbookSettings?.totalPages}
                            bookTitle={data?.flipbookSettings?.bookTitle}
                            height={data?.flipbookSettings?.height}
                            defaultViewMode={data?.flipbookSettings?.defaultViewMode}
                            allowDownload={data?.flipbookSettings?.allowDownload ?? true}
                          />
                        );
                      case 'about':
                        return (
                          <LPAbout
                            key="personal-about"
                            bio={data?.profile?.bio || ''}
                            image={data?.profile?.image}
                            skills={data?.profile?.skills || []}
                            isDark={isDark}
                            accentColor={accentColor}
                            localization={data?.localization}
                          />
                        );
                      case 'process':
                        return (
                          <LPProcess
                            key="personal-process"
                            process={data?.process || []}
                            isDark={isDark}
                            accentColor={accentColor}
                            localization={data?.localization}
                          />
                        );
                      case 'testimonials':
                        return (
                          <LPTestimonials
                            key="personal-testimonials"
                            testimonials={data?.testimonials || []}
                            isDark={isDark}
                            accentColor={accentColor}
                            localization={data?.localization}
                          />
                        );
                      case 'blog':
                        return (
                          <LPBlogPreview
                            key="personal-blog"
                            isDark={isDark}
                            accentColor={accentColor}
                            title={data?.blogPreview?.title || 'Artikel & Wawasan'}
                            subtitle={data?.blogPreview?.subtitle || 'Insight, tutorial, dan cerita dari balik layar desain.'}
                            maxPosts={data?.blogPreview?.maxPosts || 3}
                            ctaLabel={data?.blogPreview?.ctaLabel || 'Lihat Semua Artikel'}
                          />
                        );
                      case 'faq':
                        return (
                          <Suspense key="personal-faq" fallback={null}>
                            <LPFaqSection isDark={isDark} accentColor={accentColor} />
                          </Suspense>
                        );
                      default: {
                        const customWidget = data?.homeWidgets?.[sec.id];
                        if (customWidget) {
                          return (
                            <LPHomeCustomWidget
                              key={sec.id}
                              widget={customWidget}
                              isDark={isDark}
                              accentColor={accentColor}
                            />
                          );
                        }
                        return null;
                      }
                    }
                  })}
              </>
            )}
          </main>

          {(data?.footer as any)?.enabled !== false && (
            <Suspense fallback={null}>
              <LPFooter
                isDark={isDark}
                accentColor={accentColor}
                data={data?.footer}
                localization={data?.localization}
              />
            </Suspense>
          )}

          {/* Luxury Custom Scroll Radar & Nav Pill with Top/Bottom Circle Buttons */}
          <Suspense fallback={null}>
            <LandingScrollRadar isDark={isDark} accentColor={accentColor} customSettings={data?.scrollRadar} />
          </Suspense>

          {/* Global Studio Creative Inquiry & Brief Modal */}
          <Suspense fallback={null}>
            <StudioInquiryModal isDark={isDark} accentColor={accentColor} />
          </Suspense>

          {/* Floating / Sticky Overlay Stickers (LP Image Style) */}
          <Suspense fallback={null}>
            <LPFloatingStickersOverlay stickers={(data as any)?.floatingStickers} />
          </Suspense>

        </div>
      )}
    </>
  );
};

export default LandingPage;
