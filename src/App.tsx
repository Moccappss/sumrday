import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import LiveChatWidget from './components/chat/LiveChatWidget';
import PremiumPreloader from './components/admin/PremiumPreloader';
import { DialogProvider } from './components/admin/DialogProvider';
import { ContextMenuProvider } from './components/admin/ContextMenuProvider';
import { ToastProvider } from './context/ToastContext';
import { ClientAuthProvider } from './context/ClientAuthContext';
import { ClientAuthModal } from './components/client/ClientAuthModal';
import { ClientProfileModal } from './components/client/ClientProfileModal';
import { ClientOrdersModal } from './components/client/ClientOrdersModal';
import SEOHelmet from './components/SEOHelmet';
import { storage } from './utils/storage';
import { applyAccentColor } from './utils/theme';
import { useAppStore } from './store';
import { applyGlobalThemeSettings, useSystemTheme, type AppSettings, type PageSettings } from './hooks/useAppTheme';
import ProtectedPageWrapper from './components/public/ProtectedPageWrapper';
import ScrollToTop from './components/common/ScrollToTop';
import PwaUpdateNotification from './components/admin/PwaUpdateNotification';
import './index.css';


// Lazy loaded pages & components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const Home = lazy(() => import('./pages/Home'));
const Portofolio = lazy(() => import('./pages/Portofolio'));
const Biodata = lazy(() => import('./pages/Biodata'));
const LinksPage = lazy(() => import('./pages/LinksPage'));
const Katalog = lazy(() => import('./pages/Katalog'));
const ClientLoginPage = lazy(() => import('./pages/ClientLoginPage'));
const ClientAccountPage = lazy(() => import('./pages/ClientAccountPage'));

const CmsDashboard = lazy(() => import('./pages/admin/CmsDashboard'));
const PageRenderer = lazy(() => import('./components/PageRenderer'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const CustomWebPage = lazy(() => import('./pages/CustomWebPage'));
const GameShowcasePage = lazy(() => import('./pages/GameShowcasePage'));
const ClientGamePlayerPage = lazy(() => import('./pages/ClientGamePlayerPage'));
const GuidelinePage = lazy(() => import('./pages/GuidelinePage'));
const PublicFormPage = lazy(() => import('./pages/PublicFormPage'));
const PublicRateCardPage = lazy(() => import('./pages/PublicRateCardPage'));
const PublicFeedbackPage = lazy(() => import('./pages/PublicFeedbackPage'));
const UpdatesPage = lazy(() => import('./pages/UpdatesPage'));

const isPagePublished = (pageData?: PageSettings) => {
  if (pageData?.isPublished === false) return false;
  if (pageData?.publishAt) {
    const publishDate = new Date(pageData.publishAt);
    if (!isNaN(publishDate.getTime()) && publishDate > new Date()) return false;
  }
  return true;
};

const ComponentWrapper: React.FC<{ Component: React.ComponentType<any>, pageData?: PageSettings, slug: string }> = ({ Component, pageData: initialPageData, slug }) => {
  const isPreview = useMemo(() => new URLSearchParams(window.location.search).get('preview') === 'true', []);
  const [pageData, setPageData] = useState(initialPageData);

  useEffect(() => {
    setPageData(initialPageData);
  }, [initialPageData]);

  useEffect(() => {
    const unsub = storage.listenItem('porto_settings', (s: AppSettings) => {
      if (s && s.customPages) {
        const found = s.customPages.find(p => p.slug === slug);
        if (found) setPageData(found);
      }
    }, {});
    return () => {
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, [slug]);

  const published = isPagePublished(pageData);

  return (
    <>
      <SEOHelmet 
        title={pageData?.metaTitle || pageData?.name || 'sumr.day | Creative Digital Studio'} 
        description={pageData?.metaDescription || ''} 
        image={pageData?.ogImage || ''} 
      />
      <Component isPublished={published || isPreview} />
    </>
  );
};

const PageRendererWrapper: React.FC<{ pageKey: string, pageData?: PageSettings }> = ({ pageKey, pageData: initialPageData }) => {
  const isPreview = useMemo(() => new URLSearchParams(window.location.search).get('preview') === 'true', []);
  const [pageData, setPageData] = useState(initialPageData);

  useEffect(() => {
    setPageData(initialPageData);
  }, [initialPageData]);

  useEffect(() => {
    const unsub = storage.listenItem('porto_settings', (s: AppSettings) => {
      if (s && s.customPages) {
        const found = s.customPages.find(p => p.slug === pageKey);
        if (found) setPageData(found);
      }
    }, {});
    return () => {
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, [pageKey]);

  const published = isPagePublished(pageData);

  if (!published && !isPreview) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[var(--cms-bg)] text-[var(--cms-text-muted)] p-6 text-center gap-4">
      <div className="text-5xl leading-none">🔒</div>
      <h2 className="m-0 text-[var(--cms-text)] text-xl font-bold">Halaman Belum Tersedia</h2>
      <p className="m-0 text-sm leading-relaxed max-w-[280px]">Halaman ini belum dipublikasikan atau sedang di-arsip.</p>
      <button
        onClick={() => window.location.href = '/'}
        className="mt-2 px-6 py-2.5 bg-[var(--cms-accent,#7c3aed)] text-white border-none rounded-full text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
      >
        ← Kembali ke Home
      </button>
    </div>
  );
  return (
    <>
      <SEOHelmet 
        title={pageData?.metaTitle || pageData?.name || pageKey} 
        description={pageData?.metaDescription || ''} 
        image={pageData?.ogImage || ''} 
      />
      <PageRenderer pageKey={pageKey} />
    </>
  );
};

const PublicOverlays: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isExcludedChat = location.pathname.startsWith('/lpimage') || 
                         location.pathname.startsWith('/links') || 
                         location.pathname.startsWith('/link');

  if (isAdmin) return null;

  return (
    <>
      {!isExcludedChat && <LiveChatWidget />}
      <ClientAuthModal />
      <ClientProfileModal />
      <ClientOrdersModal />
    </>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Zustand State
  const { customPages, setCustomPages, shopEnabled, setShopEnabled, setSettings } = useAppStore();
  const [preloaderImage, setPreloaderImage] = useState<string | null>(null);

  useSystemTheme();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p] = await Promise.all([
          storage.getItem('porto_settings', {}),
          storage.getItem('porto_pages', []),
        ]);
        
        // Use porto_pages as source of truth for pages, fallback to settings.customPages (legacy)
        const pagesData = (p && p.length > 0) ? p : (s.customPages || []);
        
        // Store in Zustand
        setCustomPages(pagesData);
        setSettings(s);
        if (s.shopSettings) setShopEnabled(s.shopSettings.enabled || false);

        // Find current page data based on path
        let currentPath = window.location.pathname.replace(/^\/|\/$/g, '');
        if (currentPath.startsWith('lpimage/')) {
          currentPath = currentPath.substring(8); // length of 'lpimage/'
        }
        if (!currentPath || currentPath === 'lpimage') {
          currentPath = 'home';
        }
        const currentPage = pagesData.find((page: PageSettings) => page.slug === currentPath);

        const finalPreloader = currentPage?.preloaderImage || s.preloaderImage || null;
        setPreloaderImage(finalPreloader);

        // Apply settings globally
        applyGlobalThemeSettings(s, currentPage);

      } finally {
        setIsLoading(false);
      }
    };

    // Also subscribe realtime so styles update when admin saves
    const unsub = storage.listenItem('porto_settings', (s: AppSettings) => {
      if (s) {
        setSettings(s);
        let currentPath = window.location.pathname.replace(/^\/|\/$/g, '');
        if (currentPath.startsWith('lpimage/')) {
          currentPath = currentPath.substring(8);
        }
        if (!currentPath || currentPath === 'lpimage') {
          currentPath = 'home';
        }
        const currentPage = s.customPages?.find(page => page.slug === currentPath);
        applyGlobalThemeSettings(s, currentPage);
      }
    }, {});

    // Listen to main website data changes to keep accent color synchronized
    const unsubWeb = storage.listenItem('porto_main_website', (webData: any) => {
      if (webData?.theme?.accentColor) {
        applyAccentColor(webData.theme.accentColor);
      }
    }, null);

    // Eco Battery Saver: Auto-freeze animations when app is hidden or phone screen is turned off
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined') {
        if (document.hidden) {
          document.body.classList.add('app-paused');
        } else {
          document.body.classList.remove('app-paused');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleAccentChange = (e: any) => {
      const color = e?.detail?.color || localStorage.getItem('porto_accent_color');
      if (color) {
        applyAccentColor(color);
      }
    };

    window.addEventListener('porto_accent_color_changed', handleAccentChange);
    window.addEventListener('storage', handleAccentChange);

    load();

    return () => {
      if (unsub && typeof unsub === 'function') unsub();
      if (unsubWeb && typeof unsubWeb === 'function') unsubWeb();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('porto_accent_color_changed', handleAccentChange);
      window.removeEventListener('storage', handleAccentChange);
    };
  }, [setCustomPages, setSettings, setShopEnabled]);

  // Preloader only for public web
  const isAdmin = window.location.pathname.startsWith('/admin');
  const showPreloader = isLoading && !isAdmin;

  return (
    <ToastProvider>
      <ClientAuthProvider>
        <ContextMenuProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={
              <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary, #08080f)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--cms-accent, #7c3aed)', animation: 'spin 0.8s linear infinite' }} />
              </div>
            }>

            <Routes>
              {/* ── Client Login & Register Routes ── */}
              <Route path="/login" element={
                <ErrorBoundary>
                  <ClientLoginPage initialMode="login" />
                </ErrorBoundary>
              } />
              <Route path="/register" element={
                <ErrorBoundary>
                  <ClientLoginPage initialMode="register" />
                </ErrorBoundary>
              } />
              <Route path="/akun" element={
                <ErrorBoundary>
                  <ClientAccountPage />
                </ErrorBoundary>
              } />
              <Route path="/account" element={<Navigate to="/akun" replace />} />
              <Route path="/client/play/:instanceId" element={
                <ErrorBoundary>
                  <ClientGamePlayerPage />
                </ErrorBoundary>
              } />
              <Route path="/play/:instanceId" element={
                <ErrorBoundary>
                  <ClientGamePlayerPage />
                </ErrorBoundary>
              } />
              <Route path="/client" element={
                <ErrorBoundary>
                  <ClientAccountPage />
                </ErrorBoundary>
              } />
              <Route path="/client/*" element={
                <ErrorBoundary>
                  <ClientAccountPage />
                </ErrorBoundary>
              } />

              {/* ── Website Utama Landing Page ── */}
              <Route path="/" element={
                <ErrorBoundary>
                  <ProtectedPageWrapper pageKey="main_site" pageTitle="Beranda">
                    <LandingPage />
                  </ProtectedPageWrapper>
                </ErrorBoundary>
              } />
              <Route path="/landingpage" element={<Navigate to="/" replace />} />
              <Route path="/landingpage/*" element={<Navigate to="/" replace />} />
              <Route path="/landing-page" element={<Navigate to="/" replace />} />
              <Route path="/landing" element={<Navigate to="/" replace />} />
              <Route path="/lp" element={<Navigate to="/" replace />} />
              <Route path="/portfolio" element={
                <ErrorBoundary>
                  <ProtectedPageWrapper pageKey="portfolio" pageTitle="Showcase">
                    <PortfolioPage />
                  </ProtectedPageWrapper>
                </ErrorBoundary>
              } />
              <Route path="/portfolio/:id" element={
                <ErrorBoundary>
                  <ProtectedPageWrapper pageKey="portfolio" pageTitle="Showcase">
                    <PortfolioPage />
                  </ProtectedPageWrapper>
                </ErrorBoundary>
              } />
              <Route path="/karya" element={<Navigate to="/portfolio" replace />} />
              <Route path="/karya/:id" element={
                <ErrorBoundary>
                  <ProtectedPageWrapper pageKey="portfolio" pageTitle="Showcase">
                    <PortfolioPage />
                  </ProtectedPageWrapper>
                </ErrorBoundary>
              } />
              <Route path="/about" element={
                <ErrorBoundary>
                  <ProtectedPageWrapper pageKey="about" pageTitle="Tentang Kami">
                    <AboutPage />
                  </ProtectedPageWrapper>
                </ErrorBoundary>
              } />

              {/* ── Custom Dynamic Pages (Website Studio Custom Pages) ── */}
              <Route path="/p/:slug" element={
                <ErrorBoundary>
                  <ProtectedPageWrapper pageKey="custom_page" pageTitle="Halaman">
                    <CustomWebPage />
                  </ProtectedPageWrapper>
                </ErrorBoundary>
              } />
              <Route path="/page/:slug" element={<Navigate to="/p/:slug" replace />} />

              <Route path="/admin/*" element={
              <ErrorBoundary>
                <DialogProvider>
                  <ContextMenuProvider>
                    <CmsDashboard />
                  </ContextMenuProvider>
                </DialogProvider>
              </ErrorBoundary>
            } />

            {/* ── Blog Routes (clean URLs) ── */}
            <Route path="/blog" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="blog" pageTitle="Creative Spill">
                  <Blog />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            <Route path="/blog/:id" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="blog" pageTitle="Creative Spill">
                  <BlogPost />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            {/* Legacy redirects */}
            <Route path="/lpimage/blog" element={<Navigate to="/blog" replace />} />
            <Route path="/lpimage/blog/:id" element={<Navigate to="/blog/:id" replace />} />

            {/* ── Katalog / Shop ── */}
            <Route path="/katalog/*" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="katalog" pageTitle="Store Drop">
                  <Katalog />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />

            {/* ── Apps & Game Studio Publik (/apps) ── */}
            <Route path="/apps" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="apps" pageTitle="Play Space">
                  <GameShowcasePage />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            <Route path="/apps/*" element={<Navigate to="/apps" replace />} />
            <Route path="/app" element={<Navigate to="/apps" replace />} />
            <Route path="/games" element={<Navigate to="/apps" replace />} />
            <Route path="/games/*" element={<Navigate to="/apps" replace />} />
            <Route path="/game" element={<Navigate to="/apps" replace />} />
            <Route path="/katalog-game" element={<Navigate to="/apps" replace />} />
            <Route path="/katalog-game/*" element={<Navigate to="/apps" replace />} />

            {/* ── Guideline & Peta Website (/guideline) ── */}
            <Route path="/guideline" element={
              <ErrorBoundary>
                <GuidelinePage />
              </ErrorBoundary>
            } />
            <Route path="/panduan" element={<Navigate to="/guideline" replace />} />
            <Route path="/sitemap" element={<Navigate to="/guideline" replace />} />

            {/* ── Updates / Aktivitas Page (/updates) ── */}
            <Route path="/updates" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="updates" pageTitle="Update">
                  <UpdatesPage />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            <Route path="/update" element={<Navigate to="/updates" replace />} />

            {/* ── Bio Link Routes (Multi-Page Link Engine) ── */}
            <Route path="/links" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="links" pageTitle="Link Space">
                  <LinksPage />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            <Route path="/links/:slug" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="links" pageTitle="Link Space">
                  <LinksPage />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            <Route path="/form/:formId" element={
              <ErrorBoundary>
                <PublicFormPage />
              </ErrorBoundary>
            } />

            {/* ── Public Rate Card / Pricing (/pricing, /rate-card) ── */}
            <Route path="/pricing" element={
              <ErrorBoundary>
                <PublicRateCardPage />
              </ErrorBoundary>
            } />
            <Route path="/rate-card" element={<Navigate to="/pricing" replace />} />
            <Route path="/ratecard" element={<Navigate to="/pricing" replace />} />

            {/* ── Public Feedback / Review (/feedback, /review) ── */}
            <Route path="/feedback" element={
              <ErrorBoundary>
                <PublicFeedbackPage />
              </ErrorBoundary>
            } />
            <Route path="/review" element={<Navigate to="/feedback" replace />} />
            <Route path="/testimoni" element={<Navigate to="/feedback" replace />} />

            <Route path="/link" element={<Navigate to="/links" replace />} />
            <Route path="/link/:slug" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="links" pageTitle="Link Space">
                  <LinksPage />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            <Route path="/lpimage/links" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="links" pageTitle="Link Space">
                  <LinksPage />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            <Route path="/lpimage/links/:slug" element={
              <ErrorBoundary>
                <ProtectedPageWrapper pageKey="links" pageTitle="Link Space">
                  <LinksPage />
                </ProtectedPageWrapper>
              </ErrorBoundary>
            } />
            <Route path="/lpimage/link" element={<Navigate to="/links" replace />} />
            <Route path="/lpimage" element={<Navigate to="/lpimage/home" replace />} />
            <Route path="/lpimage/" element={<Navigate to="/lpimage/home" replace />} />
            <Route path="/lpimage/*" element={
              <MainLayout>
                <Routes>
                  <Route index element={<Navigate to="/lpimage/home" replace />} />
                  {['home', 'portofolio', 'biodata'].map(slug => {
                    const pageData = customPages.find(p => p.slug === slug);
                    const Component = slug === 'home' ? Home : slug === 'portofolio' ? Portofolio : Biodata;
                    return (
                      <Route
                        key={slug}
                        path={slug}
                        element={<ComponentWrapper Component={Component} pageData={pageData} slug={slug} />}
                      />
                    );
                  })}
                  {customPages.filter(p => !p.isSystem && !p.isDeleted).map(p => (
                    <Route
                      key={p.slug}
                      path={p.slug}
                      element={<PageRendererWrapper pageKey={p.slug} pageData={p} />}
                    />
                  ))}
                  <Route path="*" element={
                    <div className="flex flex-col items-center justify-center h-screen bg-[var(--cms-bg)] text-[var(--cms-text-muted)] p-6 text-center gap-4">
                      <div className="text-5xl leading-none">🔍</div>
                      <h2 className="m-0 text-[var(--cms-text)] text-xl font-bold">Halaman Tidak Ditemukan</h2>
                      <p className="m-0 text-sm leading-relaxed max-w-[280px]">Halaman ini belum tersedia atau sedang di-arsip.</p>
                      <button
                        onClick={() => window.location.href = '/'}
                        className="mt-2 px-6 py-2.5 bg-[var(--cms-accent,#7c3aed)] text-white border-none rounded-full text-sm font-semibold cursor-pointer hover:opacity-85 transition-opacity"
                      >
                        ← Kembali ke Home
                      </button>
                    </div>
                  } />
                </Routes>
              </MainLayout>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <PwaUpdateNotification />
          <PublicOverlays />
        </Suspense>
      </BrowserRouter>
      </ContextMenuProvider>
      </ClientAuthProvider>
    </ToastProvider>
  );
}

export default App;
