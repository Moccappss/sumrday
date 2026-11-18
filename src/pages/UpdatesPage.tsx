import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import LPCompanyUpdatesHub from '../components/landing/LPCompanyUpdatesHub';
import PageHeroHeader from '../components/common/PageHeroHeader';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import SEOHelmet from '../components/SEOHelmet';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { storage } from '../utils/storage';
import { DEFAULT_SOCIAL_UPDATES } from '../types/socialUpdates';
import { 
  ChevronRight, Sparkles, Layers, Package, FileText, 
  ArrowRight, MessageSquare, ShoppingBag, ShieldCheck,
  Search, Clock, ArrowUpRight
} from 'lucide-react';

const UpdatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useLandingData();
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic counts for Hero Metric Badges
  const [stats, setStats] = useState({
    total: 0,
    assets: 0,
    products: 0,
    articles: 0
  });

  useScrollReveal(undefined, [stats]);
  useLandingBodyFix();

  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const accentColor = data?.theme?.accentColor || (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || 'var(--theme-accent, #f59e0b)';
  const studioName = data?.navbar?.logoText || 'sumr.day';

  useEffect(() => {
    storage.getItem('porto_social_updates', DEFAULT_SOCIAL_UPDATES)
      .then((list: any[]) => {
        if (Array.isArray(list)) {
          const published = list.filter((u) => u.isPublished !== false);
          const resolveCategory = (u: any) => {
            if (u.category) return u.category;
            const tag = (u.projectTag || '').toLowerCase();
            if (tag.includes('produk') || tag.includes('katalog') || tag.includes('undangan')) return 'product';
            if (tag.includes('artikel') || tag.includes('blog') || tag.includes('wawasan')) return 'article';
            if (tag.includes('pengumuman') || tag.includes('milestone') || tag.includes('info')) return 'announcement';
            return 'asset';
          };
          setStats({
            total: published.length,
            assets: published.filter((u) => resolveCategory(u) === 'asset').length,
            products: published.filter((u) => resolveCategory(u) === 'product').length,
            articles: published.filter((u) => resolveCategory(u) === 'article').length,
          });
        }
      })
      .catch(() => {});
  }, []);

  const bgPage = isDark ? '#06070a' : '#eef2f6';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const cardBg = isDark ? '#151824' : '#ffffff';

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
        title={`Pusat Rilis & Updates — ${studioName} Studio`}
        description="Arsip kronologis rilis aset digital, produk baru, template web, dan artikel wawasan terkini dari sumr.day Studio."
        canonicalUrl="/updates"
      />

      {/* Top Navigation */}
      <LPNavbar
        items={data?.navbar?.items || []}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={studioName}
        accentColor={accentColor}
        isDark={isDark}
      />

      <main style={{ flex: 1, width: '100%', position: 'relative', zIndex: 1, paddingTop: 100, paddingLeft: 'clamp(16px, 3.5vw, 24px)', paddingRight: 'clamp(16px, 3.5vw, 24px)', maxWidth: 1240, margin: '0 auto', boxSizing: 'border-box' }}>
        {/* ── UNIFIED HERO POSTER SECTION ── */}
        <PageHeroHeader
          isDark={isDark}
          accentColor={accentColor}
          bgPattern={(data?.pagesHeader as any)?.updates?.bgPattern || 'grid'}
          breadcrumb={[
            { label: 'Beranda', url: '/' },
            { label: 'Pusat Rilis & Updates' }
          ]}
          badgeIcon={<Sparkles size={14} />}
          badgeText={(data?.pagesHeader as any)?.updates?.badge || 'CHRONOLOGICAL FEED & CHANGELOG'}
          title={(data?.pagesHeader as any)?.updates?.title || 'Jurnal Pembaruan, Rilis Aset & Catatan Studio'}
          highlightText={(data?.pagesHeader as any)?.updates?.highlight || 'Catatan Studio'}
          description={(data?.pagesHeader as any)?.updates?.description || `Arsip transparan seluruh peluncuran produk digital baru, template web, studi kasus teknis, dan catatan perkembangan karya dari ${studioName} Studio.`}
          stats={[
            { icon: <Layers size={14} />, value: stats.total, label: 'Total Rilis' },
            { icon: <Sparkles size={14} />, value: stats.assets, label: 'Aset & Desain' },
            { icon: <Package size={14} />, value: stats.products, label: 'Produk Baru' },
            { icon: <Clock size={14} />, value: 'Mingguan', label: 'Siklus Rilis' }
          ]}
        />

        {/* ── FULL INTERACTIVE UPDATES HUB WITH ADVANCED FILTERS ── */}
        <LPCompanyUpdatesHub
          isDark={isDark}
          accentColor={accentColor}
          showSingleOnly={false}
          hideHeader={true}
        />

        {/* ── BOTTOM COLLABORATION CALL TO ACTION BANNER ── */}
        <section
          style={{
            padding: '70px 24px',
            background: cardBg,
            borderTop: `1px solid ${cardBorder}`,
            position: 'relative'
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: `${accentColor}20`,
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={24} />
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: textPrimary
              }}
            >
              Punya Ide Proyek Digital atau Ingin Request Aset Khusus?
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: textSecondary,
                lineHeight: 1.7,
                maxWidth: 680
              }}
            >
              Kami terbuka untuk kolaborasi pembuatan sistem web, undangan digital, aktivasi game brand, maupun perancangan UI/UX kustom.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 8
              }}
            >
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('porto_open_chat', {
                      detail: {
                        service: 'Konsultasi Proyek dari Updates Hub',
                        message: 'Halo sumr.day Studio, saya melihat update terbaru di website dan ingin mendiskusikan rencana proyek kami.',
                      },
                    })
                  );
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 28px',
                  borderRadius: 12,
                  background: accentColor,
                  color: '#ffffff',
                  border: 'none',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 6px 20px ${accentColor}35`
                }}
              >
                <MessageSquare size={16} />
                <span>Konsultasi via Live Chat</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/katalog')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 26px',
                  borderRadius: 12,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${cardBorder}`,
                  color: textPrimary,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                <ShoppingBag size={16} />
                <span>Jelajahi Katalog Produk</span>
              </button>
            </div>
          </div>
        </section>
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
