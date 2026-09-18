import React, { useRef } from 'react';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import LPUpdatesFeed from '../components/landing/LPUpdatesFeed';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import SEOHelmet from '../components/SEOHelmet';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useScrollReveal } from '../hooks/useScrollReveal';

const UpdatesPage: React.FC = () => {
  const { data } = useLandingData();
  const containerRef = useRef<HTMLDivElement>(null);

  useScrollReveal(containerRef);
  useLandingBodyFix();

  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const accentColor = data?.theme?.accentColor || '#f59e0b';
  const studioName = data?.navbar?.logoText || data?.hero?.headline || 'sumr.day';

  const badge = data?.updatesFeed?.badge || 'UTAS & CERITA HANGAT';
  const title = data?.updatesFeed?.title || 'Jurnal Kreatif & Update Proyek';
  const subtitle = data?.updatesFeed?.subtitle || 'Catatan progres, kilas balik karya, dan cerita seru dari balik layar sumr.day ☀️';

  const bgPage = isDark ? '#080811' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100dvh',
        background: bgPage,
        color: textPrimary,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        overflowX: 'hidden'
      }}
    >
      <SEOHelmet
        title={`Jurnal & Cerita Hangat — ${studioName}`}
        description={subtitle}
        canonicalUrl="/updates"
      />

      {/* Top Navbar */}
      <LPNavbar
        items={data?.navbar?.items || []}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText || data?.hero?.headline || 'sumr.day'}
        accentColor={accentColor}
        isDark={isDark}
      />

      <main style={{ flex: 1, width: '100%', position: 'relative', zIndex: 1, paddingTop: 72 }}>
        {/* ── COMPLETE UPDATES FEED SECTION ── */}
        <LPUpdatesFeed
          isDark={isDark}
          accentColor={accentColor}
          badge={badge}
          title={title}
          subtitle={subtitle}
          maxPosts={100}
          showOnlyPinnedOrSingle={false}
          showSeeMore={false}
          showSocialStats={data?.updatesFeed?.showSocialStats !== false}
          hideBorderTop={true}
          customBg="transparent"
        />
      </main>

      {/* Footer */}
      <LPFooter
        data={data?.footer}
        accentColor={accentColor}
        isDark={isDark}
      />
    </div>
  );
};

export default UpdatesPage;
