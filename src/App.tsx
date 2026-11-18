import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { triggerNativeBack } from './utils/nativeNavigation';
import ErrorBoundary from './components/ErrorBoundary';
import { ContextMenuProvider } from './components/admin/ContextMenuProvider';
import { ToastProvider } from './context/ToastContext';
import { ClientAuthProvider, useClientAuth } from './context/ClientAuthContext';
import SEOHelmet from './components/SEOHelmet';
import { storage } from './utils/storage';
import { applyAccentColor } from './utils/theme';
import { useAppStore } from './store';
import { applyGlobalThemeSettings, useSystemTheme, type AppSettings, type PageSettings } from './hooks/useAppTheme';
import ProtectedPageWrapper from './components/public/ProtectedPageWrapper';
import ScrollToTop from './components/common/ScrollToTop';
import PersistentPublicNavbar from './components/landing/PersistentPublicNavbar';
import { recordVisitorHit } from './utils/trafficTracker';
import { magicClipboard } from './utils/magicClipboard';
import './index.css';

// Helper: detect dedicated Admin Android / Capacitor app mode
const isAdminAppMode = (): boolean =>
  import.meta.env.VITE_ADMIN_APP === 'true' ||
  (typeof window !== 'undefined' && Capacitor.isNativePlatform());

// Prevent Android hardware/gesture back button from immediately exiting the APK
const AndroidBackHandler: React.FC = () => {
  const [showExitHint, setShowExitHint] = useState(false);
  const lastBackRef = useRef<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => Promise<void>) | undefined;
    let hintTimer: ReturnType<typeof setTimeout> | undefined;

    CapApp.addListener('backButton', ({ canGoBack }) => {
      // 1. Close topmost registered modal / drawer / sub-step first (1-step back)
      if (triggerNativeBack()) {
        return;
      }

      // 2. If inside any admin sub-route, go back 1 step in history (or to /admin dashboard)
      const path = window.location.pathname;
      const isRootAdmin = path === '/admin' || path === '/admin/' || path === '/';
      if (!isRootAdmin) {
        if (canGoBack) {
          window.history.back();
        } else {
          navigate('/admin', { replace: true });
        }
        return;
      }

      // 3. At root /admin: require double-back within 2s to exit
      const now = Date.now();
      if (now - lastBackRef.current < 2000) {
        CapApp.exitApp();
      } else {
        lastBackRef.current = now;
        setShowExitHint(true);
        if (hintTimer) clearTimeout(hintTimer);
        hintTimer = setTimeout(() => setShowExitHint(false), 2000);
      }
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      if (hintTimer) clearTimeout(hintTimer);
      if (removeListener) removeListener();
    };
  }, [navigate]);

  // Battery & CPU saver: pause CSS animations when app is backgrounded or tab hidden
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add('capacitor-native');
    }
    const setPaused = (paused: boolean) => {
      document.documentElement.classList.toggle('app-paused', paused);
    };
    const onVisChange = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisChange);

    let removeAppState: (() => Promise<void>) | undefined;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        setPaused(!isActive);
      }).then((h) => {
        removeAppState = () => h.remove();
      });
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      if (removeAppState) removeAppState();
    };
  }, []);

  if (!showExitHint) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999999,
        background: 'rgba(18, 18, 24, 0.92)',
        color: '#fff',
        padding: '10px 18px',
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.12)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      Tekan kembali sekali lagi untuk keluar
    </div>
  );
};

// Global traffic telemetry tracker on route change
const GlobalTrafficWatcher: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Run asynchronously when browser has finished page transition & layout
    const timer = setTimeout(() => {
      recordVisitorHit(location.pathname, document.title);
    }, 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
};

// Universal Client Body Scroll Lock Guard for PWA / WSA / Standalone mode
const ClientBodyScrollSync: React.FC = () => {
  const location = useLocation();
  const isAdmin = isAdminAppMode() || location.pathname.startsWith('/admin');

  useEffect(() => {
    const styleId = 'lp-body-scroll-fix';
    if (!isAdmin) {
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          html, body {
            position: static !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            height: auto !important;
            min-height: 100vh !important;
            max-height: none !important;
            display: block !important;
            touch-action: pan-y !important;
            -webkit-overflow-scrolling: touch !important;
          }
          #root {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 100vh !important;
            touch-action: pan-y !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    }
  }, [isAdmin, location.pathname]);

  return null;
};

// Cinematic micro ambient light beam disabled for pure flat minimalist aesthetic
const CinematicRouteBeam: React.FC = () => {
  return null;
};

// Public client routes preloading is autonomously handled by initPredictiveIntentEngine (0ms on intent hover)

// Lazy loaded layout & global overlays
const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const PwaUpdateNotification = lazy(() => import('./components/admin/PwaUpdateNotification'));
const ApkUpdateChecker = lazy(() => import('./components/admin/ApkUpdateChecker'));
const OfflineBanner = lazy(() => import('./components/common/OfflineBanner'));

// Lazy loaded pages & components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const Home = lazy(() => import('./pages/Home'));
const Portofolio = lazy(() => import('./pages/Portofolio'));
const Biodata = lazy(() => import('./pages/Biodata'));
const LinksPage = lazy(() => import('./pages/LinksPage'));
const Katalog = lazy(() => import('./pages/Katalog'));
const CartCheckoutPage = lazy(() => import('./pages/CartCheckoutPage'));
const ClientLoginPage = lazy(() => import('./pages/ClientLoginPage'));
const ClientAccountPage = lazy(() => import('./pages/ClientAccountPage'));
const ClientAssetDropPage = lazy(() => import('./pages/ClientAssetDropPage'));

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
const PublicInvitationPage = lazy(() => import('./pages/PublicInvitationPage'));
const ClientInvitationAdminPage = lazy(() => import('./pages/ClientInvitationAdminPage'));
const PublicNotePreviewPage = lazy(() => import('./pages/PublicNotePreviewPage'));
const PublicProofingPage = lazy(() => import('./pages/PublicProofingPage'));
const StandaloneFlipbookPage = lazy(() => import('./pages/StandaloneFlipbookPage'));

// Lazy loaded public overlay modals & chat
const LiveChatWidget = lazy(() => import('./components/chat/LiveChatWidget'));
const ClientAuthModal = lazy(() => import('./components/client/ClientAuthModal'));
const ClientProfileModal = lazy(() => import('./components/client/ClientProfileModal'));
const ClientOrdersModal = lazy(() => import('./components/client/ClientOrdersModal'));
const ProjectCalculatorModal = lazy(() => import('./components/client/ProjectCalculatorModal'));
const FlashSaleProductModal = lazy(() => import('./components/katalog/FlashSaleProductModal'));
const UniversalMobileDock = lazy(() => import('./components/common/UniversalMobileDock'));
const CustomCursor = lazy(() => import('./components/common/CustomCursor'));

const InvitationAdminRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/admin/invitation/${slug || ''}`} replace />;
};

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
  const isAdmin = isAdminAppMode() || location.pathname.startsWith('/admin');
  const isInvitation = location.pathname.startsWith('/invitation') ||
    location.pathname.startsWith('/undangan');
  const isExcludedChat = location.pathname.startsWith('/lpimage') ||
    location.pathname.startsWith('/links') ||
    location.pathname.startsWith('/link') ||
    location.pathname.startsWith('/proofing') ||
    location.pathname.startsWith('/client/proofing');
  const { isAuthModalOpen, isProfileModalOpen, isOrdersModalOpen } = useClientAuth();

  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 767 : false
  );
  const [mountCalculator, setMountCalculator] = useState(false);
  const [mountFlashSale, setMountFlashSale] = useState(false);
  const [mountChat, setMountChat] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia) {
      const mq = window.matchMedia('(max-width: 767px)');
      const onChange = () => setIsMobileViewport(mq.matches);
      onChange();
      mq.addEventListener?.('change', onChange);
      return () => mq.removeEventListener?.('change', onChange);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isAdmin || isInvitation) return;

    const onCalc = (e: Event) => {
      (window as any).__pendingCalcEvent = e;
      setMountCalculator(true);
    };
    const onFlash = (e: Event) => {
      (window as any).__pendingFlashSaleEvent = e;
      setMountFlashSale(true);
    };
    window.addEventListener('porto_open_calculator', onCalc);
    window.addEventListener('porto_open_concierge', onCalc);
    window.addEventListener('porto_open_flash_sale_modal', onFlash);
    window.addEventListener('porto_open_product_modal', onFlash);

    let idleHandle: any;
    const mountChatIdle = () => setMountChat(true);
    if ('requestIdleCallback' in window) {
      idleHandle = (window as any).requestIdleCallback(mountChatIdle, { timeout: 2000 });
    } else {
      idleHandle = setTimeout(mountChatIdle, 1200);
    }

    return () => {
      window.removeEventListener('porto_open_calculator', onCalc);
      window.removeEventListener('porto_open_concierge', onCalc);
      window.removeEventListener('porto_open_flash_sale_modal', onFlash);
      window.removeEventListener('porto_open_product_modal', onFlash);
      if ('cancelIdleCallback' in window && idleHandle) {
        (window as any).cancelIdleCallback(idleHandle);
      } else if (idleHandle) {
        clearTimeout(idleHandle);
      }
    };
  }, [isAdmin, isInvitation]);

  // If in admin or on standalone invitation page, do not render any public client overlays or chat widgets
  if (isAdmin || isInvitation) return null;

  return (
    <Suspense fallback={null}>
      {!isExcludedChat && mountChat && <LiveChatWidget />}
      {isAuthModalOpen && <ClientAuthModal />}
      {isProfileModalOpen && <ClientProfileModal />}
      {isOrdersModalOpen && <ClientOrdersModal />}
      {mountCalculator && <ProjectCalculatorModal />}
      {mountFlashSale && <FlashSaleProductModal />}
      {isMobileViewport && <UniversalMobileDock />}
    </Suspense>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Zustand State
  const { customPages, setCustomPages, shopEnabled, setShopEnabled, setSettings } = useAppStore();
  const [preloaderImage, setPreloaderImage] = useState<string | null>(null);

  useSystemTheme();

  // Initialize global magic clipboard listener (Ctrl+V anywhere)
  useEffect(() => {
    magicClipboard.init();

    const handlePasted = (e: any) => {
      const item = e.detail;
      if (item?.type === 'image') {
        window.dispatchEvent(new CustomEvent('porto_notify', {
          detail: { message: '📋 Gambar dari Clipboard berhasil diunggah ke Galeri Cloud!' }
        }));
      }
    };
    window.addEventListener('sumr_magic_pasted', handlePasted);

    return () => {
      magicClipboard.destroy();
      window.removeEventListener('sumr_magic_pasted', handlePasted);
    };
  }, []);

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

    // Listen to main website data changes to keep accent color and dynamic branding synchronized
    const unsubWeb = storage.listenItem('porto_main_website', (webData: any) => {
      if (webData?.theme?.accentColor) {
        applyAccentColor(webData.theme.accentColor);
      }
      try {
        const rawSettings = localStorage.getItem('porto_settings');
        const s = rawSettings ? JSON.parse(rawSettings) : {};
        applyGlobalThemeSettings(s, undefined);
      } catch { }
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

    // Capture referral affiliate code from URL (?ref=CODE or ?referral=CODE)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || urlParams.get('referral');
      if (refCode) {
        localStorage.setItem('porto_referral_code', refCode.trim().toUpperCase());
      }
    } catch { }

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
  const adminOnly = isAdminAppMode();
  const isAdmin = adminOnly || window.location.pathname.startsWith('/admin');
  const showPreloader = isLoading && !isAdmin;

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ClientAuthProvider>
          <ContextMenuProvider>
            <BrowserRouter>
              <AndroidBackHandler />
              <ScrollToTop />
              <ClientBodyScrollSync />
              <GlobalTrafficWatcher />
              <CinematicRouteBeam />
              <PersistentPublicNavbar />
              <Suspense fallback={
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    zIndex: 999999,
                    background: 'linear-gradient(90deg, #6366f1, #ec4899, #f59e0b)',
                    backgroundSize: '200% 100%',
                    animation: 'routeTopProgress 1s infinite linear',
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.6)',
                    pointerEvents: 'none'
                  }}
                >
                  <style>{`
                  @keyframes routeTopProgress {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                  }
                `}</style>
                </div>
              }>

                <Routes>
                  {adminOnly ? (
                    <>
                      <Route path="/admin/*" element={
                        <ErrorBoundary>
                          <CmsDashboard />
                        </ErrorBoundary>
                      } />
                      <Route path="*" element={<Navigate to="/admin" replace />} />
                    </>
                  ) : (
                    <>
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
                      {/* ── Public Proofing Canvas Route ── */}
                      <Route path="/proofing" element={
                        <ErrorBoundary>
                          <PublicProofingPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/proofing/:id" element={
                        <ErrorBoundary>
                          <PublicProofingPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/client/proofing" element={
                        <ErrorBoundary>
                          <PublicProofingPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/client/proofing/:id" element={
                        <ErrorBoundary>
                          <PublicProofingPage />
                        </ErrorBoundary>
                      } />

                      <Route path="/akun" element={
                        <ErrorBoundary>
                          <ClientAccountPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/akun/:tab" element={
                        <ErrorBoundary>
                          <ClientAccountPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/account" element={<Navigate to="/akun" replace />} />
                      <Route path="/account/*" element={<Navigate to="/akun" replace />} />
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
                      <Route path="/portofolio" element={
                        <ErrorBoundary>
                          <ProtectedPageWrapper pageKey="portfolio" pageTitle="Portofolio">
                            <PortfolioPage />
                          </ProtectedPageWrapper>
                        </ErrorBoundary>
                      } />
                      <Route path="/portofolio/:id" element={
                        <ErrorBoundary>
                          <ProtectedPageWrapper pageKey="portfolio" pageTitle="Portofolio">
                            <PortfolioPage />
                          </ProtectedPageWrapper>
                        </ErrorBoundary>
                      } />
                      <Route path="/portfolio" element={<Navigate to="/portofolio" replace />} />
                      <Route path="/karya" element={<Navigate to="/portofolio" replace />} />
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
                          <CmsDashboard />
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

                      {/* ── Keranjang & Status Pesanan (/keranjang, /cart) ── */}
                      <Route path="/keranjang" element={
                        <ErrorBoundary>
                          <ProtectedPageWrapper pageKey="keranjang" pageTitle="Keranjang Belanja">
                            <CartCheckoutPage />
                          </ProtectedPageWrapper>
                        </ErrorBoundary>
                      } />
                      <Route path="/cart" element={<Navigate to="/keranjang" replace />} />

                      {/* ── Client Asset Drop-Box & Project Milestone Tracking (/drop/:orderId, /lacak/:orderId) ── */}
                      <Route path="/drop/:orderId" element={
                        <ErrorBoundary>
                          <ClientAssetDropPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/drop" element={
                        <ErrorBoundary>
                          <ClientAssetDropPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/lacak/:orderId" element={
                        <ErrorBoundary>
                          <ClientAssetDropPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/lacak" element={
                        <ErrorBoundary>
                          <ClientAssetDropPage />
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

                      {/* ── Direct Standalone Client Admin Portal (/invitation/:slug/admin, /undangan/:slug/admin) ── */}
                      <Route path="/invitation/:slug/admin" element={
                        <ErrorBoundary>
                          <ClientInvitationAdminPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/undangan/:slug/admin" element={
                        <ErrorBoundary>
                          <ClientInvitationAdminPage />
                        </ErrorBoundary>
                      } />

                      {/* ── Public Undangan Digital (/invitation/:slug, /undangan/:slug) ── */}
                      <Route path="/invitation/:slug" element={
                        <ErrorBoundary>
                          <PublicInvitationPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/undangan/:slug" element={
                        <ErrorBoundary>
                          <PublicInvitationPage />
                        </ErrorBoundary>
                      } />

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

                      {/* ── Standalone Client Flipbook Routes (/flipbook/:slugOrId, /buku/:slugOrId, /f/:slugOrId) ── */}
                      <Route path="/flipbook/:slugOrId" element={
                        <ErrorBoundary>
                          <StandaloneFlipbookPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/flipbook" element={<Navigate to="/" replace />} />
                      <Route path="/buku/:slugOrId" element={
                        <ErrorBoundary>
                          <StandaloneFlipbookPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/buku" element={<Navigate to="/" replace />} />
                      <Route path="/f/:slugOrId" element={
                        <ErrorBoundary>
                          <StandaloneFlipbookPage />
                        </ErrorBoundary>
                      } />

                      {/* ── Client Note & Concept Preview (Read-Only) ── */}
                      <Route path="/preview/note/:id" element={
                        <ErrorBoundary>
                          <PublicNotePreviewPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/note/:id" element={
                        <ErrorBoundary>
                          <PublicNotePreviewPage />
                        </ErrorBoundary>
                      } />

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
                                element={<PageRendererWrapper pageKey={p.slug || ''} pageData={p} />}
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
                      <Route path="*" element={
                        <ErrorBoundary>
                          <NotFoundPage />
                        </ErrorBoundary>
                      } />
                    </>
                  )}
                </Routes>
                <ErrorBoundary inline fallbackTitle="Overlay mengalami kendala tampilan.">
                  <PwaUpdateNotification />
                  {adminOnly && <ApkUpdateChecker />}
                  <OfflineBanner />
                  <PublicOverlays />
                  {!adminOnly && typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches && !window.location.pathname.startsWith('/admin') && (
                    <Suspense fallback={null}>
                      <CustomCursor />
                    </Suspense>
                  )}
                </ErrorBoundary>
              </Suspense>
            </BrowserRouter>
          </ContextMenuProvider>
        </ClientAuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
