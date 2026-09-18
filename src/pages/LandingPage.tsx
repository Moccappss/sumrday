import React, { useState, useEffect, useRef } from 'react';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPHero from '../components/landing/LPHero';
import LPPortfolio from '../components/landing/LPPortfolio';
import LPAbout from '../components/landing/LPAbout';
import LPProcess from '../components/landing/LPProcess';
import LPTestimonials from '../components/landing/LPTestimonials';
import LPBlogPreview from '../components/landing/LPBlogPreview';
import LPUpdatesFeed from '../components/landing/LPUpdatesFeed';
import LPFooter from '../components/landing/LPFooter';
import SEOHelmet from '../components/SEOHelmet';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { haptic } from '../utils/haptics';

const LandingPage: React.FC = () => {
  const { data, projects, isLoading } = useLandingData();
  const containerRef = useRef<HTMLDivElement>(null);

  // Activate hardware-accelerated scroll reveal animation
  useScrollReveal(containerRef, [projects, data]);

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
    const handleAccent = (e: any) => {
      if (e?.detail?.color) setAccentColor(e.detail.color);
    };
    window.addEventListener('porto_accent_color_changed', handleAccent);
    return () => window.removeEventListener('porto_accent_color_changed', handleAccent);
  }, []);

  const navItems = [
    ...(data?.navbar?.items || [] as any),
    ...(data?.shopSettings?.enabled ? [{ id: 'nav-katalog', type: 'link', label: 'Katalog', url: '/katalog' }] : [])
  ];

  return (
    <>
      <SEOHelmet
        title={data?.seo?.metaTitle || 'sumr.day | Creative Digital Studio'}
        description={data?.seo?.metaDescription || 'A little sunshine for your screen ☀️ Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic.'}
        image={data?.seo?.ogImage || ''}
      />

      {/* Floating Top Navbar (Isolated from page content) */}
      <LPNavbar
        items={navItems}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
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
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? '#08080f' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#0f172a',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: `2.5px solid ${accentColor}25`,
              borderTopColor: accentColor,
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              opacity: 0.65,
            }}
          >
            Memuat Studio...
          </span>
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
            background: isDark ? '#08080f' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#0f172a',
            transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
        <main style={{ flex: 1, width: '100%' }}>
        <LPHero data={data?.hero || {} as any} isDark={isDark} accentColor={accentColor} />
        <LPPortfolio
          projects={projects || []}
          landingFeaturedLabel={data?.landingFeaturedLabel || ''}
          isDark={isDark}
          accentColor={accentColor}
          localization={data?.localization}
        />
        <LPAbout
          bio={data?.profile?.bio || ''}
          image={data?.profile?.image}
          skills={data?.profile?.skills || []}
          isDark={isDark}
          accentColor={accentColor}
          localization={data?.localization}
        />
        <LPProcess
          process={data?.process || []}
          isDark={isDark}
          accentColor={accentColor}
          localization={data?.localization}
        />
        <LPTestimonials
          testimonials={data?.testimonials || []}
          isDark={isDark}
          accentColor={accentColor}
          localization={data?.localization}
        />
        {data?.updatesFeed?.enabled !== false && (
          <LPUpdatesFeed
            isDark={isDark}
            accentColor={accentColor}
            badge={data?.updatesFeed?.badge}
            title={data?.updatesFeed?.title}
            subtitle={data?.updatesFeed?.subtitle}
            maxPosts={1}
            showOnlyPinnedOrSingle={true}
            seeMoreUrl="/updates"
            seeMoreLabel="Selengkapnya"
            showSocialStats={data?.updatesFeed?.showSocialStats !== false}
          />
        )}
        <LPBlogPreview
          isDark={isDark}
          accentColor={accentColor}
          title={data?.blogPreview?.title || 'Artikel & Wawasan'}
          subtitle={data?.blogPreview?.subtitle || 'Insight, tutorial, dan cerita dari balik layar desain.'}
          maxPosts={data?.blogPreview?.maxPosts || 3}
          ctaLabel={data?.blogPreview?.ctaLabel || 'Lihat Semua Artikel'}
        />
      </main>

      <LPFooter 
        isDark={isDark} 
        accentColor={accentColor} 
        data={data?.footer} 
        localization={data?.localization} 
      />
    </div>
    )}
    </>
  );
};

export default LandingPage;
