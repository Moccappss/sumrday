import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, Suspense, lazy, startTransition as reactStartTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import LoginGateway    from '../../components/admin/LoginGateway';
import ToolkitSidebar  from '../../components/admin/ToolkitSidebar';
import Toolbox from '../../components/admin/Toolbox';
import Notification    from '../../components/admin/Notification';
import { ExternalLink, Palette, LayoutGrid, Target, Layers, Eye, EyeOff, Settings2, Image, Monitor, Smartphone, Save, Loader2, Trash2, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Search, ArrowLeft, Bell, LogOut, Cloud, ShieldCheck, House, FileText, Plus, MessageSquare, ShieldAlert, AlignRight, Menu, QrCode, Link2, Edit3, Clock, X, Database, Globe2, FolderKanban, Star, Store, Gamepad2, Compass } from 'lucide-react';

import { subscribeToNotifications, notifySave, notifySettings, notifyError, notifyChat, requestNotificationPermission } from '../../utils/notifications';
import { storage } from '../../utils/storage';
import CommandPalette from '../../components/admin/CommandPalette';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { migrateExistingData } from '../../utils/fileNaming';
import NotificationCenter from '../../components/admin/NotificationCenter';
import AdminPwaSuggestion from '../../components/admin/AdminPwaSuggestion';
import PremiumPreloader from '../../components/admin/PremiumPreloader';

// Lazy loaded CMS panels & preview
const DashboardOverview = lazy(() => import('../../components/admin/DashboardOverview'));
const SettingsPanel = lazy(() => import('../../components/admin/SettingsPanel'));
const ChatManager = lazy(() => import('../../components/admin/ChatManager'));
const LivePreview = lazy(() => import('../../components/admin/LivePreview'));
const BlockEditPanel = lazy(() => import('../../components/admin/BlockEditPanel'));
const StickerEditPanel = lazy(() => import('../../components/admin/StickerEditPanel'));
const PageSettingsPanel = lazy(() => import('../../components/admin/PageSettingsPanel'));
const FrameEditPanel = lazy(() => import('../../components/admin/FrameEditPanel'));

// Lazy loaded CMS modules
const ProjectsModule = lazy(() => import('../../components/admin/ProjectsModule'));
const DatabasePortal = lazy(() => import('../../components/admin/DatabasePortal'));
const PortfolioManager = lazy(() => import('../../components/admin/PortfolioManager'));
const WhiteboardModule = lazy(() => import('../../components/admin/WhiteboardModule'));
const ActivityManager = lazy(() => import('../../components/admin/ActivityManager'));
const StorageMonitor = lazy(() => import('../../components/admin/StorageMonitor'));
const UserManager = lazy(() => import('../../components/admin/UserManager'));
const TransactionManager = lazy(() => import('../../components/admin/TransactionManager'));
const BlogManager = lazy(() => import('../../components/admin/BlogManager'));
const CatalogManager = lazy(() => import('../../components/admin/CatalogManager'));
const MemoManager = lazy(() => import('../../components/admin/MemoManager'));
const LinksStudio = lazy(() => import('../../components/admin/LinksStudio'));
const QrStudio = lazy(() => import('../../components/admin/QrStudio'));
const BroadcastStudio = lazy(() => import('../../components/admin/BroadcastStudio'));
const VisualWebEditor = lazy(() => import('../../components/admin/VisualWebEditor'));
const GameManagementTab = lazy(() => import('./GameManagementTab'));
const GuidelinePage = lazy(() => import('../GuidelinePage'));
const AiAssistant = lazy(() => import('../../components/admin/AiAssistant'));
const GlobalSearchCenter = lazy(() => import('../../components/admin/GlobalSearchCenter'));
const GoogleSyncModal = lazy(() => import('../../components/admin/GoogleSyncModal'));
const ClientWebsitePreviewModal = lazy(() => import('../../components/admin/ClientWebsitePreviewModal'));
import { applyAccentColor } from '../../utils/theme';
import { useNativeBackHandler, triggerNativeBack } from '../../utils/nativeNavigation';

// Idle background prefetch of CMS modules on desktop only (disabled on mobile to prevent CPU spikes & overheating)
const preloadCmsModules = () => {
  if (typeof window === 'undefined') return;
  // NEVER eager-prefetch heavy modules on mobile to save CPU, battery & keep device cool
  if (window.innerWidth <= 768 || (typeof navigator !== 'undefined' && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1 && window.innerWidth <= 1024)) {
    return;
  }
  const preloader = () => {
    import('../../components/admin/DashboardOverview').catch(() => {});
    import('../../components/admin/SettingsPanel').catch(() => {});
    import('../../components/admin/ProjectsModule').catch(() => {});
    import('../../components/admin/VisualWebEditor').catch(() => {});
    import('../../components/admin/BlogManager').catch(() => {});
    import('../../components/admin/MemoManager').catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloader, { timeout: 3000 });
  } else {
    setTimeout(preloader, 1500);
  }
};

const SYSTEM_PAGES = [
  { id: 'sys-home', name: 'Home', slug: 'home', isSystem: true },
  { id: 'sys-porto', name: 'Portofolio', slug: 'portofolio', isSystem: true },
  { id: 'sys-bio', name: 'Biodata', slug: 'biodata', isSystem: true },
];

const INITIAL_PAGES    = { home: [], portofolio: [], biodata: [] };
const INITIAL_SETTINGS = { customPages: [], desktopRatio: '1/1' };
const INITIAL_STICKERS = { home: [], portofolio: [], biodata: [] };
const INITIAL_FRAMES   = { home: {}, portofolio: {}, biodata: {} };

/* ── Error Boundary ── */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("CMS Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', background: 'var(--cms-bg, #09090d)', color: 'var(--cms-text, #fff)', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
            ⚠️
          </div>
          <h2 style={{ color: 'var(--cms-text, #fff)', fontSize: 20, fontWeight: 900, margin: 0 }}>Terjadi Kendala Tampilan</h2>
          <p style={{ color: 'var(--cms-text-muted, #94a3b8)', maxWidth: 440, fontSize: 13, lineHeight: 1.6, margin: '10px 0 24px' }}>
            Komponen ini mengalami kendala sementara. Data Anda tetap tersimpan dengan aman di database.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }} 
              style={{ padding: '10px 20px', borderRadius: 100, border: '1.5px solid var(--glass-border, rgba(255,255,255,0.15))', background: 'var(--cms-card-bg, #1a1a24)', color: 'var(--cms-text, #fff)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
            >
              Coba Lagi
            </button>
            <button 
              onClick={() => {
                localStorage.setItem('porto_active_page', 'overview');
                window.location.reload();
              }} 
              style={{ padding: '10px 22px', borderRadius: 100, border: 'none', background: 'var(--cms-accent, #3b82f6)', color: '#fff', fontWeight: 850, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px var(--cms-accent-soft, rgba(59,130,246,0.3))' }}
            >
              Muat Ulang Halaman
            </button>
          </div>
          {this.state.error && (
            <pre style={{ marginTop: 28, padding: '12px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: '#f87171', textAlign: 'left', maxWidth: '85vw', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Sub-components ── */
const VisibilityBtn = ({ active, onClick, icon, color }) => {
  const modes = ['hidden', 'low', 'full'];
  const curIdx = modes.indexOf(active || 'full');
  const next = () => onClick(modes[(curIdx + 1) % 3]);

  return (
    <button
      onClick={next}
      title={`Cycle Visibility: ${active}`}
      style={{
        width: 34, height: 34, borderRadius: 8, border: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        background: active === 'hidden' ? 'transparent' : active === 'low' ? 'rgba(0,0,0,0.05)' : color,
        color: active === 'full' ? '#fff' : active === 'low' ? color : '#ccc'
      }}
    >
      {active === 'hidden' ? <EyeOff size={16} /> : icon}
      <div style={{
        position: 'absolute', bottom: 4, width: 3, height: 3, borderRadius: '50%',
        background: active === 'full' ? '#fff' : active === 'low' ? color : 'transparent'
      }} />
    </button>
  );
};

const CmsDashboard = () => {
  const [isAuth, setIsAuth]               = useState(false);
  const [authChecked, setAuthChecked]     = useState(false);
  const [pagesData, setPagesData]         = useState(INITIAL_PAGES);
  const [globalSettings, setGlobalSettings] = useState(INITIAL_SETTINGS);
  const [stickersData, setStickersData]   = useState(INITIAL_STICKERS);
  const [activePage, setActivePage]       = useState(() => {
    if (typeof window !== 'undefined') {
      const raw = window.location.pathname.replace(/^\/admin\/?/, '').replace(/\/+$/, '');
      if (raw.startsWith('lpimage/') || raw === 'lpimage') {
        const sub = raw.replace(/^lpimage\/?/, '');
        return sub || 'home';
      }
      return raw.split('/')[0] || 'dashboard';
    }
    return 'dashboard';
  });
  const [unsavedState, setUnsavedState]   = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [wmTab, setWmTab]                 = useState('overview');
  const [isLoading, setIsLoading]         = useState(false);
  const [cmsMode, setCmsMode]             = useState('content');
  const [contentVisibility, setContentVisibility] = useState('full');
  const [stickerVisibility, setStickerVisibility] = useState('low');
  const [frameVisibility, setFrameVisibility]     = useState('full');
  const [framesData, setFramesData]       = useState({});
  const [previewSize, setPreviewSize]     = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop');
  const [selectedBlockId, setSelectedBlockId]     = useState(null);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [selectedPageSlug, setSelectedPageSlug]   = useState(null);
  const [editingPopup, setEditingPopup]           = useState<{ id: string; title: string; returnPage: string } | null>(null);
  const [notifData, setNotifData] = useState(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cms_dark_mode') !== 'false');
  const [canvases, setCanvases] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [projects, setProjects] = useState([]);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => localStorage.getItem('cms_sidebar_expanded') !== 'false');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isTablet, setIsTablet] = useState(typeof window !== 'undefined' ? (window.innerWidth > 768 && window.innerWidth <= 1280) : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1280);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeSidebar, setActiveSidebar] = useState(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [settingsHasSub, setSettingsHasSub] = useState(false);
  const [linksStudioState, setLinksStudioState] = useState({ studioMode: 'links', mobileViewTab: 'editor' });
  const [memoNavState, setMemoNavState] = useState({ commentCount: 0, hasNote: false });

  useEffect(() => {
    const handleLinksState = (e: any) => {
      if (e?.detail) {
        setLinksStudioState(prev => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('cms_links_state_changed', handleLinksState);
    return () => window.removeEventListener('cms_links_state_changed', handleLinksState);
  }, []);

  useEffect(() => {
    const handleMemoNav = (e: any) => {
      if (e?.detail) setMemoNavState(prev => ({ ...prev, ...e.detail }));
    };
    window.addEventListener('memo_nav_state_changed', handleMemoNav);
    return () => window.removeEventListener('memo_nav_state_changed', handleMemoNav);
  }, []);

  const [isClientPreviewOpen, setIsClientPreviewOpen] = useState(false);
  const [clientPreviewPage, setClientPreviewPage] = useState<'home' | 'portfolio' | 'katalog' | 'blog' | 'about' | 'links'>('home');

  useEffect(() => {
    const handleOpenPreview = (e: any) => {
      if (e?.detail?.page) setClientPreviewPage(e.detail.page);
      setIsClientPreviewOpen(true);
    };
    window.addEventListener('cms_open_client_preview', handleOpenPreview);
    return () => window.removeEventListener('cms_open_client_preview', handleOpenPreview);
  }, []);

  const [recentTabs, setRecentTabs] = useState<Array<{ id: string; label: string; slug: string }>>(() => {
    try {
      const saved = sessionStorage.getItem('porto_session_recent_tabs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [{ id: 'dashboard', label: 'Dashboard', slug: 'dashboard' }];
  });

  const PAGE_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    'visual-editor': 'Website Studio',
    website: 'Website Studio',
    database: 'Master Database',
    portfolio: 'Karya',
    blog: 'Artikel',
    catalog: 'Katalog',
    links: 'Bio Links',
    qr: 'QR Studio',
    notes: 'Catatan',
    whiteboard: 'Papan Kreatif',
    projects: 'Proyek',
    apps: 'Apps Studio',
    'apps-studio': 'Apps Studio',
    'game-management': 'Apps Studio',
    games: 'Apps Studio',
    guideline: 'Panduan & Peta',
    panduan: 'Panduan & Peta',
    transactions: 'Keuangan',
    chat: 'Konsultasi',
    broadcast: 'Broadcast',
    storage: 'Storage',
    users: 'Pengguna',
    settings: 'Pengaturan',
    home: 'Visual: Home',
    portofolio: 'Visual: Portofolio',
    biodata: 'Visual: Biodata'
  };

  useEffect(() => {
    if (!activePage) return;
    const label = PAGE_LABELS[activePage] || (activePage.charAt(0).toUpperCase() + activePage.slice(1));
    setRecentTabs(prev => {
      const filtered = prev.filter(t => t.slug !== activePage);
      const next = [{ id: activePage, label, slug: activePage }, ...filtered].slice(0, 8);
      try {
        sessionStorage.setItem('porto_session_recent_tabs', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, [activePage]);

  useEffect(() => {
    const handleSettingsSub = (e: any) => {
      setSettingsHasSub(!!e.detail?.hasActiveSub);
    };
    window.addEventListener('cms_settings_sub_changed', handleSettingsSub);
    return () => window.removeEventListener('cms_settings_sub_changed', handleSettingsSub);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const hasUnsavedChangesRef = useRef(false);

  useEffect(() => {
    const raw = location.pathname.replace(/^\/admin\/?/, '').replace(/\/+$/, '');
    let p = raw.split('/')[0] || 'dashboard';
    // Normalize legacy game management routes to apps
    if (p === 'games' || p === 'game-management') {
      navigate('/admin/apps', { replace: true });
      p = 'apps';
    }
    if (raw.startsWith('lpimage/') || raw === 'lpimage') {
      const sub = raw.replace(/^lpimage\/?/, '') || 'home';
      const isSystemLp = SYSTEM_PAGES.some(sp => sp.slug === sub);
      const isCustomLp = (globalSettingsRef.current?.customPages || []).some(cp => cp.slug === sub);
      const isLpPage = isSystemLp || isCustomLp || sub.startsWith('page-') || sub === 'home' || sub === 'portofolio' || sub === 'biodata';

      if (!isLpPage && sub !== 'home') {
        // Automatically normalize any non-LP module accidentally routed under lpimage (e.g. /admin/lpimage/broadcast -> /admin/broadcast)
        navigate(`/admin/${sub}`, { replace: true });
        p = sub;
      } else {
        p = sub || 'home';
      }
    }
    setActivePage(p);
  }, [location.pathname, navigate]);

  // ── Native 1-Step Back Handlers (Mobile & Tablet Back Gestures & Buttons) ──
  useNativeBackHandler(isSyncModalOpen, () => setIsSyncModalOpen(false), 'cms_sync_modal', 10);
  useNativeBackHandler(isGlobalSearchOpen, () => setIsGlobalSearchOpen(false), 'cms_global_search', 10);
  useNativeBackHandler(isCommandPaletteOpen, () => setIsCommandPaletteOpen(false), 'cms_cmd_palette', 10);
  useNativeBackHandler(isAiOpen, () => setIsAiOpen(false), 'cms_ai_assistant', 10);
  useNativeBackHandler(Boolean(notifData), () => setNotifData(null), 'cms_confirm_dialog', 20);
  useNativeBackHandler((isMobile || isTablet) && isSidebarExpanded, () => {
    window.dispatchEvent(new Event('cms_sidebar_toggle_request'));
  }, 'cms_sidebar_drawer', 5);
  useNativeBackHandler(Boolean(activeSidebar), () => setActiveSidebar(null), 'cms_floating_sidebar', 4);
  useNativeBackHandler(Boolean(selectedBlockId || selectedStickerId), () => {
    setSelectedBlockId(null);
    setSelectedStickerId(null);
  }, 'cms_block_selection', 3);
  useNativeBackHandler(Boolean(editingPopup), () => {
    if (editingPopup) {
      setSelectedPageSlug(editingPopup.returnPage || null);
      setEditingPopup(null);
      setSelectedBlockId(null);
      setSelectedStickerId(null);
    }
  }, 'cms_editing_popup', 12);

  // Background module prefetch upon mounting
  useEffect(() => {
    preloadCmsModules();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const isTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
      const mobile = width <= 768;
      const tablet = width > 768 && (width <= 1280 || (width <= 1400 && isTouch));
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (!mobile && !tablet) setActiveSidebar(null);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleToggle = (e) => setIsSidebarExpanded(e.detail.isExpanded);
    window.addEventListener('cms_sidebar_toggle', handleToggle);
    return () => {
      window.removeEventListener('cms_sidebar_toggle', handleToggle);
    };
  }, []);

  useEffect(() => {
    const handleOpenSync = () => setIsSyncModalOpen(true);
    window.addEventListener('porto_open_sync_modal', handleOpenSync);
    return () => window.removeEventListener('porto_open_sync_modal', handleOpenSync);
  }, []);

  useEffect(() => {
    const handleAccentChange = (e: any) => {
      const newColor = e?.detail?.color;
      if (newColor) {
        setGlobalSettings(prev => (prev?.accentColor === newColor ? prev : { ...prev, accentColor: newColor }));
      }
    };
    window.addEventListener('porto_accent_color_changed', handleAccentChange);
    return () => window.removeEventListener('porto_accent_color_changed', handleAccentChange);
  }, []);

  // Real-time synchronization for Projects & Schedules across CMS
  useEffect(() => {
    const unsub = storage.listenItem('porto_projects', (data) => {
      if (Array.isArray(data)) setProjects(data);
    });
    storage.getItem('porto_projects', []).then(saved => {
      if (Array.isArray(saved) && saved.length > 0) setProjects(saved);
    }).catch(() => {});
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Unified Ctrl+K is handled in the main keyboard listener below for GlobalSearchCenter

  /* ── Refs ── */
  const activePageRef      = useRef(activePage);
  const pagesDataRef       = useRef(pagesData);
  const globalSettingsRef  = useRef(globalSettings);
  const stickersDataRef    = useRef(stickersData);
  const framesDataRef      = useRef(framesData);
  const prevSelectedRef    = useRef(null);
  const fileInputRef       = useRef(null);
  const historyRef      = useRef([]);
  const historyIdxRef   = useRef(-1);
  const MAX_HISTORY = 15;

  useEffect(() => {
    activePageRef.current = activePage;
    setActiveSidebar(null);
    setSelectedBlockId(null);
    setSelectedStickerId(null);
    setSelectedPageSlug(null);
  }, [activePage]);
  const selectedPageSlugRef = useRef(selectedPageSlug);
  useEffect(() => { selectedPageSlugRef.current = selectedPageSlug; }, [selectedPageSlug]);
  useEffect(() => { pagesDataRef.current      = pagesData; },      [pagesData]);
  useEffect(() => { globalSettingsRef.current = globalSettings; }, [globalSettings]);
  useEffect(() => { stickersDataRef.current   = stickersData; },   [stickersData]);
  useEffect(() => { framesDataRef.current     = framesData; },     [framesData]);

  const notify = useCallback((msg, type = 'success') => setNotifData({ message: msg, type }), []);
  const confirmAction = useCallback((arg1: any, arg2?: any) => {
    if (typeof arg1 === 'object' && arg1 !== null) {
      setNotifData({
        title: arg1.title || 'Konfirmasi Tindakan',
        message: arg1.message || '',
        type: 'confirm',
        isDestructive: arg1.isDestructive,
        onConfirm: arg1.onConfirm
      });
    } else {
      setNotifData({
        title: 'Konfirmasi Tindakan',
        message: arg1,
        type: 'confirm',
        onConfirm: arg2
      });
    }
  }, []);

  useEffect(() => {
    const handleEditPopup = (e: any) => {
      const targetId = e.detail?.popupId || e.detail?.id;
      const targetTitle = e.detail?.title || 'Pop-up Modal';
      if (!targetId) return;
      const prevPage = selectedPageSlug || activePage || 'home';
      setEditingPopup({ id: targetId, title: targetTitle, returnPage: prevPage });
      setSelectedPageSlug(targetId);
      setCmsMode('content');
      setSelectedBlockId(null);
      setSelectedStickerId(null);
      setActiveSidebar(null);
      notify?.(`Mengedit pop-up: ${targetTitle}`);
    };
    window.addEventListener('porto_edit_popup', handleEditPopup);
    return () => window.removeEventListener('porto_edit_popup', handleEditPopup);
  }, [selectedPageSlug, activePage, notify]);

  const handleResetPage = useCallback((slug) => {
    confirmAction(`Bersihkan isi halaman "${slug}"? Semua blok, stiker, dan bingkai akan dihapus secara permanen.`, async () => {
      try {
        setPagesData(prev => ({ ...prev, [slug]: [] }));
        setStickersData(prev => ({ ...prev, [slug]: [] }));
        setFramesData(prev => {
          const newData = { ...prev };
          delete newData[slug];
          return newData;
        });
        setSelectedBlockId(null);
        setSelectedStickerId(null);
        notify('🧹 Halaman dibersihkan');
      } catch (err) {
        console.error('Reset page error:', err);
        notify('Gagal membersihkan halaman', 'error');
      }
    });
  }, [confirmAction, notify]);

  /* ── Theme Effect (Dark Mode & Accent Color) ── */
  useLayoutEffect(() => {
    localStorage.setItem('cms_dark_mode', isDarkMode ? 'true' : 'false');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const themeStr = isDarkMode ? 'dark' : 'light';

    document.documentElement.setAttribute('data-cms-theme', themeStr);
    document.documentElement.setAttribute('data-theme', themeStr);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      if (document.body) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
      }
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#08080c');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      if (document.body) {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
      }
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#f1f5f9');
    }

    // Apply custom accent color dynamically (prioritize active stored color)
    const activeAccent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || globalSettings?.accentColor || '#7c3aed';
    applyAccentColor(activeAccent);

    if (globalSettings?.glassOpacity !== undefined) {
      document.documentElement.style.setProperty('--glass-opacity', String(globalSettings.glassOpacity));
    }
    if (globalSettings?.glassBlur !== undefined) {
      document.documentElement.style.setProperty('--glass-blur', `${globalSettings.glassBlur}px`);
    }

    window.dispatchEvent(new CustomEvent('cms_theme_changed', { detail: { isDark: isDarkMode } }));
    window.dispatchEvent(new CustomEvent('website_theme_changed', { detail: { isDark: isDarkMode } }));
  }, [isDarkMode, globalSettings?.accentColor, globalSettings?.glassOpacity, globalSettings?.glassBlur]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('cms_dark_mode', next ? 'true' : 'false');
      return next;
    });
  }, []);

  useEffect(() => {
    const handleExtToggle = () => handleToggleDarkMode();
    window.addEventListener('cms_toggle_dark_mode', handleExtToggle);
    window.addEventListener('porto_toggle_dark_mode', handleExtToggle);
    return () => {
      window.removeEventListener('cms_toggle_dark_mode', handleExtToggle);
      window.removeEventListener('porto_toggle_dark_mode', handleExtToggle);
    };
  }, [handleToggleDarkMode]);

  const startTransition = (callback) => {
    reactStartTransition(() => {
      callback();
    });
  };

  const handleSwitchPage = useCallback((slug) => {
    if (slug === 'global-search') {
      setIsGlobalSearchOpen(true);
      return;
    }
    // Flush any pending debounced writes across modules immediately upon page switch
    storage.flushDebounced();
    
    // Save any pending changes silently before navigating
    if (hasUnsavedChangesRef.current) {
      performSave(pagesDataRef.current, globalSettingsRef.current, stickersDataRef.current, framesDataRef.current, notify, true, setIsSaving);
      hasUnsavedChangesRef.current = false;
    }
    
    if (slug === 'settings' && activePageRef.current === 'settings') {
      window.dispatchEvent(new Event('porto_reset_settings_menu'));
    }
    startTransition(() => {
      const isSystemLpPage = SYSTEM_PAGES.some(sp => sp.slug === slug);
      const isCustomLpPage = (globalSettingsRef.current?.customPages || []).some(cp => cp.slug === slug);
      const isLpBuilderPage = isSystemLpPage || isCustomLpPage || slug.startsWith('page-') || slug === 'home' || slug === 'biodata';

      if (slug === 'builder' || slug === 'lpimage') {
        navigate('/admin/lpimage/home');
      } else if (slug === 'visual-editor') {
        navigate('/admin/visual-editor');
      } else if (slug === 'portfolio' || slug === 'karya') {
        navigate('/admin/portfolio');
        setTimeout(() => window.dispatchEvent(new CustomEvent('cms_website_change_tab', { detail: { tab: 'portfolio' } })), 50);
      } else if (slug === 'catalog' || slug === 'katalog') {
        navigate('/admin/catalog');
        setTimeout(() => window.dispatchEvent(new CustomEvent('cms_website_change_tab', { detail: { tab: 'catalog' } })), 50);
      } else if (slug === 'blog') {
        navigate('/admin/blog');
        setTimeout(() => window.dispatchEvent(new CustomEvent('cms_website_change_tab', { detail: { tab: 'blog' } })), 50);
      } else if (slug === 'storage') {
        navigate('/admin/settings_storage');
        setTimeout(() => window.dispatchEvent(new CustomEvent('cms_open_settings_category', { detail: { category: 'storage' } })), 50);
      } else if (slug === 'apps' || slug === 'apps-studio' || slug === 'games' || slug === 'game-management') {
        navigate('/admin/apps');
      } else if (slug === 'guideline' || slug === 'panduan') {
        navigate('/admin/guideline');
      } else if (isLpBuilderPage && slug !== 'portofolio') {
        navigate(`/admin/lpimage/${slug}`);
      } else {
        navigate(`/admin/${slug}`);
      }
      setSelectedBlockId(null);
      setSelectedStickerId(null);
    });
  }, [navigate, notify]);

  // 1-step back handler for mobile bottom navbar & native hardware back
  const handleBackStep = useCallback(() => {
    // 1. Any registered modal/popup/lightbox gets priority to close first
    if (triggerNativeBack()) return;

    // 2. Active flyout sidebar (left/right panel)
    if (activeSidebar) {
      setActiveSidebar(null);
      return;
    }

    // 3. Main sidebar expanded on mobile or tablet
    if ((isMobile || isTablet) && isSidebarExpanded) {
      setIsSidebarExpanded(false);
      return;
    }

    // 4. Block, sticker, or page item selection
    if (selectedBlockId || selectedStickerId || selectedPageSlug) {
      setSelectedBlockId(null);
      setSelectedStickerId(null);
      setSelectedPageSlug(null);
      return;
    }

    // 5. Contextual page stepping (1 step back)
    if (activePage?.startsWith('settings_') || activePage === 'settings') {
      handleSwitchPage('dashboard');
    } else if (activePage === 'portfolio' || activePage === 'blog' || activePage === 'catalog') {
      handleSwitchPage('database');
    } else if (activePage !== 'dashboard') {
      handleSwitchPage('dashboard');
    }
  }, [activeSidebar, isMobile, isTablet, isSidebarExpanded, selectedBlockId, selectedStickerId, selectedPageSlug, activePage, handleSwitchPage]);

  // Mobile Hardware / Browser Back Button Hook at CMS root level (priority 5: executes only when no higher priority modal caught it)
  useNativeBackHandler(
    isMobile && (activePage !== 'dashboard' || !!activeSidebar || ((isMobile || isTablet) && isSidebarExpanded) || !!selectedBlockId || !!selectedStickerId || !!selectedPageSlug),
    handleBackStep,
    'cms_dashboard_back',
    5
  );

  const [userData, setUserData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  /* ── Data Fetching Logic ── */
  const unsubsRef = useRef([]);
  const fetchMainData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Bersihkan listener lama jika ada
      unsubsRef.current.forEach(unsub => unsub());
      unsubsRef.current = [];

      // 2. Initial Fetch
      const [p, s, st, f, prj, canv] = await Promise.all([
        storage.getItem('porto_pages', INITIAL_PAGES),
        storage.getItem('porto_settings', INITIAL_SETTINGS),
        storage.getItem('porto_stickers', INITIAL_STICKERS),
        storage.getItem('porto_frames', {}),
        storage.getItem('porto_projects', []),
        storage.getItem('porto_whiteboard_canvases', [])
      ]);
      
      const { updatedPages, changed } = migrateExistingData(p || INITIAL_PAGES);
      if (changed) {
        await storage.setItem('porto_pages', updatedPages);
        setPagesData(updatedPages);
      } else {
        setPagesData(p || INITIAL_PAGES);
      }
      
      setGlobalSettings(s || INITIAL_SETTINGS);
      setStickersData(st || INITIAL_STICKERS);
      setFramesData(f || {});
      setProjects(prj || []);
      setCanvases(canv || []);

      const settings = s || INITIAL_SETTINGS;
      if (settings.glassBlur !== undefined) document.documentElement.style.setProperty('--glass-blur', `${settings.glassBlur}px`);
      if (settings.glassOpacity !== undefined) document.documentElement.style.setProperty('--glass-opacity', settings.glassOpacity);
      
      setDataLoaded(true);
      setIsLoading(false);

      // 3. Attach Real-time Listeners untuk tersambung antar device secara instan
      unsubsRef.current.push(storage.listenItem('porto_pages', (data) => {
        if (data && !hasUnsavedChangesRef.current) setPagesData(data);
      }, INITIAL_PAGES));

      unsubsRef.current.push(storage.listenItem('porto_settings', (data) => {
        if (data && !hasUnsavedChangesRef.current) setGlobalSettings(data);
      }, INITIAL_SETTINGS));

      unsubsRef.current.push(storage.listenItem('porto_stickers', (data) => {
        if (data && !hasUnsavedChangesRef.current) setStickersData(data);
      }, INITIAL_STICKERS));

      unsubsRef.current.push(storage.listenItem('porto_frames', (data) => {
        if (data && !hasUnsavedChangesRef.current) setFramesData(data);
      }, {}));

      unsubsRef.current.push(storage.listenItem('porto_projects', (data) => {
        if (data) setProjects(data);
      }, []));

      unsubsRef.current.push(storage.listenItem('porto_whiteboard_canvases', (data) => {
        if (data) setCanvases(data);
      }, []));

    } catch (err) {
      console.error('[CmsDashboard] Data loading error:', err);
      notify(`Gagal memuat data: ${err.message}`, 'error');
      setIsLoading(false);
    }
  }, [notify]);

  // Handle Impersonation Event
  useEffect(() => {
    const handleImpersonate = async (e) => {
      const { uid, scope, name, role, allowedPages } = e.detail;
      hasUnsavedChangesRef.current = false;
      setPagesData(INITIAL_PAGES);
      setGlobalSettings(INITIAL_SETTINGS);
      setStickersData(INITIAL_STICKERS);
      setFramesData(INITIAL_FRAMES);
      setProjects([]);
      setCanvases([]);
      setImpersonatedUser({ uid, scope, name, role, allowedPages });
      storage.init(uid, scope);
      await fetchMainData();
      handleSwitchPage('dashboard');
      notify(`Memasuki Mode Inspeksi: ${name}`, 'success');
    };
    window.addEventListener('porto_impersonate', handleImpersonate);
    return () => window.removeEventListener('porto_impersonate', handleImpersonate);
  }, [fetchMainData, notify, handleSwitchPage]);

  const exitImpersonation = async () => {
    hasUnsavedChangesRef.current = false;
    setPagesData(INITIAL_PAGES);
    setGlobalSettings(INITIAL_SETTINGS);
    setStickersData(INITIAL_STICKERS);
    setFramesData(INITIAL_FRAMES);
    setProjects([]);
    setCanvases([]);
    setImpersonatedUser(null);
    storage.init(auth.currentUser.uid, userData?.dbScope || 'global');
    await fetchMainData();
    handleSwitchPage('users');
    notify('Kembali ke Dashboard Utama', 'success');
  };

  const fetchMainDataRef = useRef(fetchMainData);
  useEffect(() => { fetchMainDataRef.current = fetchMainData; }, [fetchMainData]);
  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; }, [notify]);
  const handleSwitchPageRef = useRef(handleSwitchPage);
  useEffect(() => { handleSwitchPageRef.current = handleSwitchPage; }, [handleSwitchPage]);
  const impersonatedUserRef = useRef(impersonatedUser);
  useEffect(() => { impersonatedUserRef.current = impersonatedUser; }, [impersonatedUser]);
  const currentAuthUidRef = useRef(null);

  /* ── Auth Listener ── */
  useEffect(() => {
    // Safety fallback: if onAuthStateChanged is delayed, unblock UI within 2s
    const authTimer = setTimeout(() => {
      setAuthChecked(true);
    }, 2000);

    const unsub = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimer);
      setIsAuth(!!user);
      setAuthChecked(true);
      
      if (user) {
        requestNotificationPermission().catch(() => {});
        if (currentAuthUidRef.current === user.uid && !impersonatedUserRef.current) {
          return;
        }
        currentAuthUidRef.current = user.uid;

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let finalData = null;
          if (userDoc.exists()) {
            finalData = { id: user.uid, ...userDoc.data() };
            if (finalData.role !== 'Super Admin') {
              finalData.dbScope = 'private';
            }
          } else {
            finalData = { 
              role: 'Editor', 
              allowedPages: ['dashboard', 'projects'], 
              dbScope: 'private' 
            };
            if (user.email === 'mochamadsaifularif33@gmail.com') {
              finalData.role = 'Super Admin';
              finalData.dbScope = 'global';
              finalData.allowedPages = ['*'];
            }
          }
          console.log(`[CmsDashboard] Active User: ${user.email} | Scope: ${finalData.dbScope || 'global'}`);
          setUserData(finalData);
          
          if (!impersonatedUserRef.current) {
            storage.init(user.uid, finalData.dbScope || 'global');
          }
          
          await fetchMainDataRef.current();
        } catch (err) {
          console.error('[CmsDashboard] Error in auth flow:', err);
          notifyRef.current('Sistem otorisasi bermasalah', 'error');
        }
      } else {
        currentAuthUidRef.current = null;
        setUserData(null);
        setDataLoaded(false);
      }
    });

    const handleSwitchPageEvent = (e) => handleSwitchPageRef.current(e.detail);
    window.addEventListener('porto_switch_page', handleSwitchPageEvent);

    return () => {
      unsub();
      window.removeEventListener('porto_switch_page', handleSwitchPageEvent);
    };
  }, []);

  // Page Access Guard
  useEffect(() => {
    if (userData && activePage && activePage !== 'dashboard') {
      const allowed = userData.allowedPages || [];
      const isSuper = userData.role === 'Super Admin';
      
      const baseSlug = activePage.split('/')[0];
      const settingsSlugs = ['branding', 'seo', 'pwa', 'scripts', 'reset'];
      const isBuilderPage = SYSTEM_PAGES.some(sp => sp.slug === baseSlug) || (globalSettingsRef.current?.customPages || []).some(cp => cp.slug === baseSlug);
      const checkSlug = settingsSlugs.includes(activePage) ? 'settings' : isBuilderPage ? 'pages' : baseSlug;

      if (!isSuper && !allowed.includes(checkSlug)) {
        notify('🚫 Anda tidak memiliki izin akses ke halaman ini', 'error');
        handleSwitchPage('dashboard');
      }
    }
  }, [userData, activePage, handleSwitchPage, notify]);

  // Handle /admin/login Redirect
  useEffect(() => {
    if (isAuth && activePage === 'login') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuth, activePage, navigate]);

  /* ── Data Fetching & Sync ── */
  useEffect(() => {
    const handleStickersReorder = (e) => {
      const newList = e.detail;
      const targetPage = selectedPageSlugRef.current || activePageRef.current;
      setStickersData(prev => ({ ...prev, [targetPage]: newList }));
      storage.setItem('porto_stickers', { ...stickersDataRef.current, [targetPage]: newList });
      window.dispatchEvent(new Event('porto_stickers_updated'));
    };

    const handlePagesReorder = (e) => {
      const { updatedPages } = e.detail;
      setPagesData(updatedPages);
      notify('✅ Urutan halaman disimpan');
    };

    const handleBgSync = (e) => {
      const { key, value } = e.detail;
      if (key === 'porto_pages' && !hasUnsavedChangesRef.current) setPagesData(value);
      else if (key === 'porto_stickers' && !hasUnsavedChangesRef.current) setStickersData(value);
      else if (key === 'porto_frames' && !hasUnsavedChangesRef.current) setFramesData(value);
      else if (key === 'porto_settings' && !hasUnsavedChangesRef.current) {
        setGlobalSettings(prev => ({ ...prev, ...(value || {}) }));
      }
      else if (key === 'porto_biodata' && !hasUnsavedChangesRef.current) {
        setGlobalSettings(prev => ({ ...prev, biodata: value }));
      }
    };

    const handleSettingsUpdated = (e) => {
      if (hasUnsavedChangesRef.current) return;
      const newSettings = e.detail;
      if (newSettings && typeof newSettings === 'object') {
        const actual = newSettings.settings || newSettings;
        setGlobalSettings(prev => ({ ...prev, ...actual }));
      }
    };

    const handleBiodataUpdated = (e) => {
      const newBio = e.detail;
      if (newBio && typeof newBio === 'object') {
        setGlobalSettings(prev => ({ ...prev, biodata: newBio }));
      }
    };

    window.addEventListener('porto_stickers_reordered', handleStickersReorder);
    window.addEventListener('porto_pages_reordered', handlePagesReorder);
    window.addEventListener('porto_bg_synced', handleBgSync);
    window.addEventListener('porto_settings_updated', handleSettingsUpdated);
    window.addEventListener('porto_biodata_updated', handleBiodataUpdated);
    
    return () => {
      window.removeEventListener('porto_stickers_reordered', handleStickersReorder);
      window.removeEventListener('porto_pages_reordered', handlePagesReorder);
      window.removeEventListener('porto_bg_synced', handleBgSync);
      window.removeEventListener('porto_settings_updated', handleSettingsUpdated);
      window.removeEventListener('porto_biodata_updated', handleBiodataUpdated);
    };
  }, [notify]);

  useEffect(() => {
    const unsub = subscribeToNotifications((notifs) => {
      setUnreadNotifs(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, []);

  // Realtime Live Chat / Inquiry incoming message listener for admin notification center
  useEffect(() => {
    if (!db) return;
    let isFirstLoad = true;
    try {
      const q = query(collection(db, 'porto_conversations'), orderBy('lastMessageTime', 'desc'), limit(15));
      const unsub = onSnapshot(q, (snap) => {
        if (isFirstLoad) {
          isFirstLoad = false;
          return;
        }
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            if (data && (data.unread > 0 || data.source === 'client_web' || data.source === 'project_brief')) {
              notifyChat(data.userName || 'Pengunjung', data.lastMessage || '');
            }
          }
        });
      }, () => {});
      return () => unsub();
    } catch (_) {}
  }, []);

  /* ── Derived Data ── */

  const allPagesCombined = useMemo(() => {
    try {
      const customList = globalSettings?.customPages || [];
      const popupsList = (globalSettings?.popups || [])
        .filter((pop: any) => !pop?.isDeleted)
        .map((pop: any) => ({
        id: pop.id,
        name: `[Pop-up] ${pop.title || 'Pop-up Modal'}`,
        slug: pop.id,
        isPopup: true,
        isSystem: false,
        isPublished: true,
        showInNav: false,
        hideNavbars: true,
        desktopRatio: '9/16'
      }));
      const systemMapped = SYSTEM_PAGES.map(sp => {
        const existing = customList.find(p => p?.slug === sp.slug);
        return existing ? { ...sp, ...existing } : { ...sp, isPublished: true, showInNav: true, hideNavbars: false };
      });
      const userCreated = customList.filter(p => p && !p.isSystem);
      return [...systemMapped, ...userCreated, ...popupsList];
    } catch (e) {
      console.error('Metadata memo error:', e);
      return SYSTEM_PAGES;
    }
  }, [globalSettings?.customPages, globalSettings?.popups]);

  const getPageMetadata = useCallback((slug) => {
    return allPagesCombined.find(p => p.slug === slug) || { isPublished: true, showInNav: true, hideNavbars: false };
  }, [allPagesCombined]);

  // Update preview ratio dynamically based on active page
  useEffect(() => {
    const page = getPageMetadata(selectedPageSlug || activePage);
    const ratio = page?.desktopRatio || globalSettings?.desktopRatio || '9/16';
    if (ratio === 'Full') {
      document.documentElement.style.setProperty('--preview-ratio', 'auto');
      document.documentElement.style.setProperty('--preview-width', '100%');
      document.documentElement.style.setProperty('--preview-max-width', '1400px');
    } else {
      document.documentElement.style.setProperty('--preview-ratio', ratio);
      document.documentElement.style.setProperty('--preview-width', 'auto');
      document.documentElement.style.setProperty('--preview-max-width', '96vw');
    }
  }, [activePage, selectedPageSlug, getPageMetadata, globalSettings?.desktopRatio]);

  const isVisualEditor = activePage === 'visual-editor' || activePage === 'website' || (activePage?.startsWith('visual-editor/') ?? false) || (activePage?.startsWith('website/') ?? false);
  const isDatabase = activePage === 'database' || activePage === 'content-database' || (activePage?.startsWith('database/') ?? false) || activePage === 'forms' || activePage === 'form-maker' || activePage === 'biodata' || activePage === 'contacts' || activePage === 'links' || activePage === 'broadcast' || activePage === 'media' || activePage === 'vault' || activePage === 'reviews' || activePage === 'client-voice' || activePage === 'ratecard' || activePage === 'pricing';
  const isPortfolio = activePage === 'portfolio' || activePage === 'karya' || (activePage?.startsWith('portfolio/') ?? false);
  const isSettings = activePage === 'settings' || (activePage?.startsWith('settings_') ?? false) || (activePage?.startsWith('settings/') ?? false);
  const isChat = activePage === 'chat' || (activePage?.startsWith('chat/') ?? false);
  const isCatalog = activePage === 'catalog' || activePage === 'katalog' || (activePage?.startsWith('catalog/') ?? false) || (activePage?.startsWith('katalog/') ?? false);
  const isLinks = activePage === 'links' || (activePage?.startsWith('links/') ?? false);
  const isQr = activePage === 'qr' || (activePage?.startsWith('qr/') ?? false);

  const isNotes = activePage === 'notes' || activePage === 'memo' || activePage === 'whiteboard' || (activePage?.startsWith('notes/') ?? false);
  const isBlog = activePage === 'blog' || (activePage?.startsWith('blog/') ?? false);
  const isProjects = activePage === 'projects' || (activePage?.startsWith('projects/') ?? false);
  const isTransactions = activePage === 'transactions' || (activePage?.startsWith('transactions/') ?? false);
  const isGameManagement = activePage === 'apps' || activePage === 'apps-studio' || activePage === 'game-management' || activePage === 'games' || (activePage?.startsWith('apps/') ?? false) || (activePage?.startsWith('game-management/') ?? false);
  const isGuideline = activePage === 'guideline' || activePage === 'panduan' || (activePage?.startsWith('guideline/') ?? false);
  const isBroadcast = activePage === 'broadcast' || activePage === 'push' || (activePage?.startsWith('broadcast/') ?? false);

  const isFullWidthMode = useMemo(() => {
    const specialPages = ['dashboard', 'activity', 'storage', 'users', 'global-search', 'visual-editor', 'database', 'portfolio', 'blog', 'catalog', 'game-management', 'apps', 'guideline', 'panduan', 'forms', 'form-maker', 'biodata', 'contacts', 'media', 'vault', 'reviews', 'client-voice', 'ratecard', 'pricing'];
    return isVisualEditor || isDatabase || isPortfolio || isSettings || isChat || isCatalog || isLinks || isQr || isNotes || isBlog || isProjects || isTransactions || isGameManagement || isGuideline || isBroadcast || specialPages.includes(activePage);
  }, [activePage, isVisualEditor, isDatabase, isPortfolio, isSettings, isChat, isCatalog, isLinks, isQr, isNotes, isBlog, isProjects, isTransactions, isGameManagement, isGuideline, isBroadcast]);

  const targetPageForContent = selectedPageSlug || activePage;
  const currentBlocks  = useMemo(() => (isFullWidthMode) ? [] : (pagesData?.[targetPageForContent] || []), [isFullWidthMode, targetPageForContent, pagesData]);
  const currentStickers = useMemo(() => (isFullWidthMode) ? [] : (stickersData?.[targetPageForContent] || []), [isFullWidthMode, targetPageForContent, stickersData]);
  const selectedIdx    = useMemo(() => currentBlocks.findIndex(b => b.id === selectedBlockId), [currentBlocks, selectedBlockId]);

  /* ── Handlers ── */

  /* ── Push History (dipanggil setelah debounced auto-save) ── */
  const pushHistory = useCallback((pages, stickers, frames) => {
    const snap = { 
      pagesData: pages, 
      stickersData: stickers, 
      framesData: frames 
    };
    
    // Check if there is an actual change
    if (historyIdxRef.current >= 0) {
      const prev = historyRef.current[historyIdxRef.current];
      if (JSON.stringify(prev) === JSON.stringify(snap)) return; // No real change
    }

    // Potong forward history jika ada
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(snap);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    else historyIdxRef.current = historyRef.current.length - 1;

    // Set unsaved changes flag ONLY if this is a user edit (not the initial load)
    if (historyIdxRef.current > 0) {
      hasUnsavedChangesRef.current = true;
      setUnsavedState(true);
    }
  }, []);

  const canUndo = historyIdxRef.current > 0;
  const canRedo = historyIdxRef.current < historyRef.current.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    const snap = historyRef.current[historyIdxRef.current];
    setPagesData(snap.pagesData);
    setStickersData(snap.stickersData);
    setFramesData(snap.framesData);
    setSelectedBlockId(null);
    setSelectedStickerId(null);
    notify('↩️ Dibatalkan');
  }, [notify]);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    const snap = historyRef.current[historyIdxRef.current];
    setPagesData(snap.pagesData);
    setStickersData(snap.stickersData);
    setFramesData(snap.framesData);
    setSelectedBlockId(null);
    setSelectedStickerId(null);
    notify('↪️ Diulang');
  }, [notify]);

  /* ── Effect: Push History, Flag Unsaved Changes & LOCAL AUTO-SAVE (5s Delay) ── */
  useEffect(() => {
    if (isLoading || !dataLoaded) return;
    const t = setTimeout(() => {
      pushHistory(pagesDataRef.current, stickersDataRef.current, framesData);
      
      // Auto-Save to Local IndexedDB (5s delay to save tokens & prevent premature saves)
      window.dispatchEvent(new Event('porto_save_start'));
      storage.batchSetItems({
        'porto_pages':    pagesDataRef.current,
        'porto_settings': globalSettingsRef.current || globalSettings,
        'porto_stickers': stickersDataRef.current,
        'porto_frames':   framesData
      }, false).then(() => {
        setTimeout(() => window.dispatchEvent(new Event('porto_save_end')), 800);
      }).catch(err => {
        console.error("[Storage] Auto-save local failed:", err);
        window.dispatchEvent(new Event('porto_save_end'));
      });
      
    }, 5000); // 5000ms (5 seconds) as requested to save tokens and let typing finish
    return () => clearTimeout(t);
  }, [globalSettings, framesData, pagesData, stickersData, isLoading, dataLoaded, pushHistory]);

  /* ── Hourly Local Backup ── */
  useEffect(() => {
    if (!dataLoaded) return;
    
    const checkAndBackup = async () => {
      try {
        const lastBackup = await storage.getItem('porto_last_local_backup');
        const now = Date.now();
        // 1 hour = 3600000 ms
        if (!lastBackup || now - lastBackup > 3600000) {
          await storage.setItem('porto_hourly_backup_snapshot', {
            pages: pagesDataRef.current,
            settings: globalSettingsRef.current,
            stickers: stickersDataRef.current,
            frames: framesDataRef.current,
            timestamp: new Date().toISOString()
          });
          await storage.setItem('porto_last_local_backup', now);
          console.log('[CMS] Hourly local backup created in IndexedDB.');
        }
      } catch (err) {
        console.error('[CMS] Hourly backup failed:', err);
      }
    };

    checkAndBackup();
    const interval = setInterval(checkAndBackup, 15 * 60 * 1000); // Check every 15 mins
    return () => clearInterval(interval);
  }, [dataLoaded]);

  /* ── Ctrl+K: Open Global Search (unified, was previously duplicated) ── */

  const handleUpdateBlock = useCallback((id, props) => {
    const targetPage = selectedPageSlug || activePage;
    hasUnsavedChangesRef.current = true;
    setUnsavedState(true);
    setPagesData(prev => ({
      ...prev,
      [targetPage]: (prev[targetPage] || []).map(b => b.id === id ? { ...b, ...props } : b)
    }));
  }, [activePage, selectedPageSlug]);

  const handleRemoveBlock = useCallback((id) => {
    confirmAction('Hapus blok media ini?', () => {
      const targetPage = selectedPageSlug || activePage;
      hasUnsavedChangesRef.current = true;
      setUnsavedState(true);
      setPagesData(prev => ({
        ...prev,
        [targetPage]: (prev[targetPage] || []).filter(b => b.id !== id)
      }));
      if (selectedBlockId === id) setSelectedBlockId(null);
      notify('🗑️ Blok dihapus');
    });
  }, [activePage, selectedPageSlug, selectedBlockId, confirmAction, notify]);

  const handleMoveBlock = useCallback((id, direction) => {
    const targetPage = selectedPageSlug || activePage;
    hasUnsavedChangesRef.current = true;
    setUnsavedState(true);
    setPagesData(prev => {
      const list = [...(prev[targetPage] || [])];
      const idx = list.findIndex(b => b.id === id);
      if (idx === -1) return prev;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= list.length) return prev;
      
      // Swap positions
      [list[idx], list[target]] = [list[target], list[idx]];
      
      // Update the 'order' property for all blocks to match their new array index
      const updatedList = list.map((block, index) => ({ ...block, order: index }));
      
      return { ...prev, [targetPage]: updatedList };
    });
  }, [activePage, selectedPageSlug]);

  const handleUpdateSticker = useCallback((id, props) => {
    const targetPage = selectedPageSlug || activePage;
    hasUnsavedChangesRef.current = true;
    setUnsavedState(true);
    setStickersData(prev => ({
      ...prev,
      [targetPage]: (prev[targetPage] || []).map(s => s.id === id ? { ...s, ...props } : s)
    }));
  }, [activePage, selectedPageSlug]);

  const handleRemoveSticker = useCallback((id) => {
    const targetPage = selectedPageSlug || activePage;
    hasUnsavedChangesRef.current = true;
    setUnsavedState(true);
    setStickersData(prev => ({
      ...prev,
      [targetPage]: (prev[targetPage] || []).filter(s => s.id !== id)
    }));
    setSelectedStickerId(null);
    notify('🗑️ Stiker dihapus');
  }, [activePage, selectedPageSlug, notify]);
  
  const handleDuplicateSticker = useCallback((id) => {
    const targetPage = selectedPageSlug || activePage;
    hasUnsavedChangesRef.current = true;
    setUnsavedState(true);
    setStickersData(prev => {
      const list = prev[targetPage] || [];
      const original = list.find(s => s.id === id);
      if (!original) return prev;
      
      const newSticker = {
        ...original,
        id: `stk_${Date.now()}`,
        x: (original.x ?? 10) + 5,
        y: (original.y ?? 10) + 5
      };
      
      const updatedList = [...list, newSticker];
      setSelectedStickerId(newSticker.id);
      notify('📑 Stiker digandakan');
      return { ...prev, [targetPage]: updatedList };
    });
  }, [activePage, selectedPageSlug, notify]);

  const handleReorderSticker = useCallback((id, direction) => {
    const targetPage = selectedPageSlug || activePage;
    setStickersData(prev => {
      const list = [...(prev[targetPage] || [])];
      const idx = list.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      
      // In the current rendering logic: index 0 is top-most (highest z-index)
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1; 
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      
      [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
      notify(direction === 'up' ? '🔼 Layer dinaikkan' : '🔽 Layer diturunkan');
      return { ...prev, [targetPage]: list };
    });
  }, [activePage, selectedPageSlug, notify]);

  const handleUpdateFrames = useCallback((props) => {
    hasUnsavedChangesRef.current = true;
    setUnsavedState(true);
    const targetPage = selectedPageSlugRef.current || activePageRef.current || 'home';
    setFramesData(prev => {
      const next = {
        ...prev,
        [targetPage]: { ...(prev[targetPage] || {}), ...props }
      };
      framesDataRef.current = next;
      return next;
    });
  }, []);

  const handleAddPage = useCallback(() => {
    const name = `Halaman Baru ${globalSettings.customPages?.length + 1 || ''}`;
    const slug = `page-${Date.now()}`;
    const newPage = {
      id: `pg-${Date.now()}`,
      name, slug,
      isPublished: false,
      showInNav: true,
      isSystem: false,
      iconSvg: null,
      hideNavbars: false
    };
    setGlobalSettings(prev => ({ ...prev, customPages: [...(prev.customPages || []), newPage] }));
    setSelectedPageSlug(slug);
    notify('✨ Halaman baru dibuat!');
  }, [globalSettings.customPages, notify]);

  const handleManualSave = useCallback(async () => {
    const currentGlobal = globalSettingsRef.current || globalSettings;
    const currentPages = pagesDataRef.current || pagesData;
    const currentStickers = stickersDataRef.current || stickersData;
    const currentFrames = framesDataRef.current || framesData;
    await performSave(currentPages, currentGlobal, currentStickers, currentFrames, notify, false, setIsSaving);
    await storage.flushAllPendingWrites().catch(() => {});
    hasUnsavedChangesRef.current = false;
    setUnsavedState(false);
  }, [globalSettings, pagesData, stickersData, framesData, notify]);

  useEffect(() => {
    window.addEventListener('porto_manual_save', handleManualSave);
    return () => window.removeEventListener('porto_manual_save', handleManualSave);
  }, [handleManualSave]);

  useEffect(() => {
    const handleDuplicateBlockEvent = (e) => {
      const blockId = e.detail;
      setPagesData(prev => {
        const list = prev[activePage] || [];
        const idx = list.findIndex(b => b.id === blockId);
        if (idx === -1) return prev;
        const blockToDup = list[idx];
        const newBlock = { ...blockToDup, id: `b_${Date.now()}`, order: list.length };
        const newList = [...list];
        newList.splice(idx + 1, 0, newBlock); // insert after the original
        const reordered = newList.map((b, i) => ({ ...b, order: i }));
        notify('📋 Blok diduplikasi');
        return { ...prev, [activePage]: reordered };
      });
      hasUnsavedChangesRef.current = true;
      setUnsavedState(true);
    };
    window.addEventListener('porto_duplicate_block', handleDuplicateBlockEvent);
    return () => window.removeEventListener('porto_duplicate_block', handleDuplicateBlockEvent);
  }, [activePage, notify]);

  // Listen for local storage edits from any module (Projects, Whiteboard, Shop, etc.)
  useEffect(() => {
    const handleDirty = () => {
      hasUnsavedChangesRef.current = true;
      setUnsavedState(true);
    };
    window.addEventListener('porto_storage_dirty', handleDirty);
    return () => window.removeEventListener('porto_storage_dirty', handleDirty);
  }, []);

  const handleAddClick = () => {
    if (activePage === 'blog') {
      window.dispatchEvent(new Event('porto_add_blog_post'));
    } else if (cmsMode === 'pages') {
      window.dispatchEvent(new Event('porto_add_action'));
    } else if (isSettings) {
      window.dispatchEvent(new Event('porto_add_action'));
    } else if (cmsMode === 'content') {
      const id = `b_${Date.now()}`;
      const targetPage = selectedPageSlug || activePage;
      const newBlock = { id, type: 'image', url: '', order: (pagesData[targetPage] || []).length };
      hasUnsavedChangesRef.current = true;
      setUnsavedState(true);
      setPagesData(prev => ({ ...prev, [targetPage]: [...(prev[targetPage] || []), newBlock] }));
      setSelectedBlockId(id);
    } else if (cmsMode === 'sticker') {
      window.dispatchEvent(new Event('porto_request_sticker_spawn_pos'));
    }
  };

  // Effect: Auto-save on select/unselect removed for manual save optimization

  /* ── Effect: Handle Sticker Spawn ── */
  useEffect(() => {
    const handleSpawn = (e) => {
      const { blockId, y, type } = e.detail;
      const id = `stk_${Date.now()}`;
      const newSticker = { 
        id, blockId, x: 10, y: (typeof y === 'number' ? y : 20), width: 80, rotation: 0, 
        opacity: 1, type: type || 'image', imageData: null 
      };
      if (type === 'button') newSticker.variety = 'button';
      hasUnsavedChangesRef.current = true;
      setUnsavedState(true);
      const targetPage = selectedPageSlug || activePage;
      setStickersData(prev => ({ ...prev, [targetPage]: [...(prev[targetPage] || []), newSticker] }));
      setSelectedStickerId(id);
      notify('✨ Stiker ditambahkan');
    };
    window.addEventListener('porto_sticker_spawn_pos_ready', handleSpawn);
    return () => window.removeEventListener('porto_sticker_spawn_pos_ready', handleSpawn);
  }, [activePage, selectedPageSlug, notify]);

  const handleModeChange = (m) => {
    setCmsMode(m);
    setSelectedBlockId(null);
    setSelectedStickerId(null);
  };

  /* ── Keyboard Shortcuts (unified — includes Ctrl+K, Ctrl+S, Undo/Redo, etc.) ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K → Open Global Search / AI
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setIsGlobalSearchOpen(prev => !prev); return; }

      // Ctrl+S → Save (Global, even inside inputs)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleManualSave(); return; }

      // Ctrl+D → Duplicate Selected Block (Global content editor)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedBlockId && cmsMode === 'content') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('porto_duplicate_block', { detail: selectedBlockId }));
        return;
      }

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      // Z → Toggle Zen Mode (Focus Mode)
      if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsZenMode(prev => {
          const next = !prev;
          notify(next ? '🧘 Zen Mode Aktif (Tekan Z untuk keluar)' : '🧘 Zen Mode Nonaktif');
          return next;
        });
        return;
      }

      // Ctrl+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }

      // Ctrl+Y / Ctrl+Shift+Z → Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); return; }

      // Escape → Deselect
      if (e.key === 'Escape') { setSelectedBlockId(null); setSelectedStickerId(null); return; }

      // Delete/Backspace → Remove selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && cmsMode !== 'pages') {
        if (selectedBlockId && cmsMode === 'content') { handleRemoveBlock(selectedBlockId); return; }
        if (selectedStickerId && cmsMode === 'sticker') { handleRemoveSticker(selectedStickerId); return; }
      }

      // Arrow Up/Down → Move block
      if (selectedBlockId && cmsMode === 'content') {
        if (e.key === 'ArrowUp')   { e.preventDefault(); handleMoveBlock(selectedBlockId, 'up');   return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); handleMoveBlock(selectedBlockId, 'down'); return; }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [selectedBlockId, selectedStickerId, cmsMode, handleUndo, handleRedo, isZenMode]);

  /* ── Guard Renders ── */
  const rootClass = isDarkMode ? 'admin-layout cms-root-dark' : 'admin-layout cms-root-light';

  if (!authChecked) {
    return (
      <div className={rootClass} style={{ width: '100vw', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-bg, #08080f)' }}>
        <div style={{ 
          width: 52, 
          height: 52, 
          borderRadius: 16, 
          background: 'var(--cms-accent, #7c3aed)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#fff', 
          fontSize: 24, 
          boxShadow: '0 8px 32px rgba(var(--cms-accent-rgb, 124,58,237), 0.35)',
          animation: 'cmsPulse 1.8s ease-in-out infinite'
        }}>
          ⚡
        </div>
      </div>
    );
  }
  if (!isAuth) return <LoginGateway onLoginSuccess={() => setIsAuth(true)} />;

  if (userData?.role === 'Pending') {
    return (
      <div className={`${rootClass} cms-dashboard-root`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cms-bg)' }}>
        <div style={{ textAlign: 'center', background: 'var(--cms-card-bg)', padding: 48, borderRadius: 24, border: '1px solid var(--glass-border)', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ShieldCheck size={64} style={{ color: 'var(--cms-accent)', marginBottom: 24, opacity: 0.8, display: 'block', margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, color: 'var(--cms-text)' }}>Menunggu Konfirmasi</h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>Akun Anda telah terdaftar, namun belum memiliki akses admin. Harap tunggu Super Admin untuk memberikan otorisasi akses ke sistem CMS.</p>
          <button 
            onClick={() => signOut(auth)}
            className="cms-btn"
            style={{ width: '100%', height: 48, borderRadius: 12, background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Logout Sementara
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      
      <div 
        data-cms-theme={isDarkMode ? 'dark' : 'light'}
        data-theme={isDarkMode ? 'dark' : 'light'}
        className={`${rootClass} cms-dashboard-root ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} ${isZenMode ? 'zen-active' : ''} ${impersonatedUser ? 'impersonation-active' : ''}`}
      >
        <AdminSidebar
          activePage={activePage}
          onSwitchPage={handleSwitchPage}
          onSignOut={() => setIsAuth(false)}
          pages={globalSettings.customPages || []}
          userData={impersonatedUser || userData}
          globalSettings={globalSettings}
          onToggleAi={() => startTransition(() => setIsGlobalSearchOpen(true))}
          isImpersonating={!!impersonatedUser}
          onExitImpersonation={() => { exitImpersonation(); handleSwitchPage('users'); }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
        <NotificationCenter onSwitchPage={handleSwitchPage} />
        <AdminPwaSuggestion />
        
        <div className="cms-main-container">
          {/* Mobile/Tablet Overlay — tap to close any open sidebar */}
          {(isMobile || isTablet) && activeSidebar && (
            <div 
              className="cms-tablet-overlay"
              onClick={() => setActiveSidebar(null)}
              style={{ position: 'absolute', inset: 0, zIndex: 2300 }}
            />
          )}
          {/* Mobile admin sidebar overlay (Clean, No Dim, No Blur) */}
          {(isMobile || isTablet) && isSidebarExpanded && (
            <div 
              onClick={() => { 
                if (isSidebarExpanded) {
                  window.dispatchEvent(new Event('cms_sidebar_toggle_request'));
                }
              }}
              style={{
                position: 'fixed', inset: 0,
                background: 'transparent', 
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                zIndex: 2147483640
              }}
            />
          )}

          <div className={`cms-layout-trio ${isFullWidthMode ? 'settings-mode' : ''}`}>
          {/* Left Sidebar */}
          {!isFullWidthMode && (
            <div className={`cms-floating-sidebar left-panel ${activeSidebar === 'left' ? 'active' : ''}`}>
              <ToolkitSidebar
                activePage={selectedPageSlug || activePage}
                onSwitchPage={handleSwitchPage}
                cmsMode={cmsMode}
                onModeChange={handleModeChange}
                blocks={cmsMode === 'pages' ? (pagesData?.[selectedPageSlug] || []) : currentBlocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={(id) => { setSelectedBlockId(id); if (id) { setCmsMode('content'); setActiveSidebar('right'); } }}
                stickers={cmsMode === 'pages' ? (stickersData?.[selectedPageSlug] || []) : currentStickers}
                selectedStickerId={selectedStickerId}
                onSelectSticker={(id) => { setSelectedStickerId(id); if (id) setCmsMode('dashboard'); }}
                onUpdateSticker={handleUpdateSticker}
                currentFrames={framesData?.[cmsMode === 'pages' ? selectedPageSlug : activePage] || {}}
                onUpdateFrames={handleUpdateFrames}
                customPages={globalSettings.customPages || []}
                onUpdatePages={(newList) => setGlobalSettings(prev => ({ ...prev, customPages: newList }))}
                onEditPage={(slug) => { handleSwitchPage(slug); setCmsMode('content'); }}
                confirm={confirmAction}
                notify={notify}
                selectedPageSlug={selectedPageSlug}
                onSelectPage={(slug) => { setSelectedPageSlug(slug); }}
                contentVisibility={contentVisibility}
                setContentVisibility={setContentVisibility}
                stickerVisibility={stickerVisibility}
                setStickerVisibility={setStickerVisibility}
                frameVisibility={frameVisibility}
                setFrameVisibility={setFrameVisibility}
                previewSize={previewSize}
                onTogglePreviewSize={() => setPreviewSize(p => p === 'mobile' ? 'desktop' : 'mobile')}
                onAddContent={() => {
                  const id = `b_${Date.now()}`;
                  const newBlock = { id, mediaType: 'image', url: '', order: currentBlocks.length };
                  setPagesData(prev => ({ ...prev, [activePage]: [...(prev[activePage] || []), newBlock] }));
                  setSelectedBlockId(id);
                  setCmsMode('content');
                  setActiveSidebar('right');
                }}
                onAddSticker={() => window.dispatchEvent(new Event('porto_request_sticker_spawn_pos'))}
              />
            </div>
          )}

          {/* Center Canvas — Stable work area to prevent glitches */}
          <div className="cms-work-area" style={{ position: 'relative', overflowX: 'clip', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ flex: 1, minHeight: 0, overflowX: 'clip', overflowY: 'visible', display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={
              <div 
                className="cms-page-loading-veil"
                style={{ 
                  flex: 1, 
                  width: '100%', 
                  height: '100%', 
                  minHeight: '100%',
                  boxSizing: 'border-box'
                }} 
              />
            }>
              <div
                key={activePage + (isSettings ? `_settings_${location.pathname}` : '') + (isVisualEditor ? '_visual' : '')}
                className="cms-page-theme-fade"
                style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
              >
                {activePage === 'dashboard' ? (
                  <DashboardOverview 
                    pagesData={pagesData}
                    stickersData={stickersData}
                    globalSettings={globalSettings}
                    projects={projects}
                    canvases={canvases}
                    onSwitchPage={handleSwitchPage}
                    isMobile={isMobile}
                    isTablet={isTablet}
                  />
                ) : activePage === 'projects' ? (
                  <ProjectsModule 
                    notify={notify}
                    confirm={confirmAction}
                    projects={projects}
                    setProjects={setProjects}
                  />
                ) : isSettings ? (
                  <SettingsPanel 
                    globalSettings={globalSettings} 
                    userData={userData}
                    onUpdateSettings={async (props) => {
                      const newSettings = { ...(globalSettingsRef.current || globalSettings), ...props };
                      globalSettingsRef.current = newSettings;
                      setGlobalSettings(newSettings);

                      const prevAccent = globalSettingsRef.current?.accentColor;
                      const isAccentChanged = Boolean(props.accentColor && props.accentColor !== prevAccent && Object.keys(props).length <= 2);

                      if (props.accentColor) {
                        applyAccentColor(props.accentColor);
                        localStorage.setItem('porto_accent_color', props.accentColor);
                        try {
                          await storage.setItem('porto_settings', newSettings, true);
                          const mainWebsite = await storage.getItem('porto_main_website', null);
                          if (mainWebsite) {
                            await storage.setItem('porto_main_website', {
                              ...mainWebsite,
                              theme: { ...(mainWebsite.theme || {}), accentColor: props.accentColor }
                            }, true);
                          }
                        } catch (err) {
                          console.error('Auto-save accent color failed:', err);
                        }
                        window.dispatchEvent(new CustomEvent('porto_accent_color_changed', { detail: { color: props.accentColor } }));
                        if (isAccentChanged && notify) {
                          notify(`Warna aksen disimpan (${props.accentColor})`);
                        }
                      } else {
                        hasUnsavedChangesRef.current = true;
                        setUnsavedState(true);
                      }
                    }}
                    notify={notify}
                    confirm={confirmAction}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={() => {
                      setIsDarkMode(prev => !prev);
                    }}
                    onUpdateFrames={setFramesData}
                  />
                ) : isChat ? (
                  <ChatManager />
                ) : activePage === 'activity' ? (
                  <ActivityManager onSwitchPage={handleSwitchPage} />
                ) : activePage === 'storage' ? (
                  <StorageMonitor userData={userData} />
                ) : activePage === 'users' ? (
                  <UserManager 
                    notify={notify}
                    confirm={confirmAction}
                  />
                ) : isTransactions ? (
                  <TransactionManager 
                    notify={notify}
                    confirm={confirmAction}
                  />
                ) : isGameManagement ? (
                  <GameManagementTab 
                    notify={notify}
                    confirm={confirmAction}
                    isDarkMode={isDarkMode}
                    onSwitchPage={handleSwitchPage}
                  />
                ) : isGuideline ? (
                  <GuidelinePage 
                    onSwitchPage={handleSwitchPage}
                    isEmbeddedInAdmin={true}
                  />
                ) : isDatabase ? (
                  <DatabasePortal
                    initialSubTab={
                      (activePage === 'forms' || activePage === 'form-maker' || activePage === 'database_forms') ? 'forms' :
                      (activePage === 'biodata' || activePage === 'database_biodata') ? 'biodata' :
                      (activePage === 'contacts' || activePage === 'database_contacts') ? 'contacts' :
                      (activePage === 'links' || activePage === 'database_links') ? 'links' :
                      (activePage === 'broadcast' || activePage === 'database_broadcast' || activePage === 'push') ? 'broadcast' :
                      (activePage === 'media' || activePage === 'vault') ? 'media' :
                      (activePage === 'reviews' || activePage === 'client-voice') ? 'reviews' :
                      (activePage === 'ratecard' || activePage === 'pricing') ? 'ratecard' : 'hub'
                    }
                    notify={notify}
                    confirm={confirmAction}
                    onNavigate={handleSwitchPage}
                    isDarkMode={isDarkMode}
                  />
                ) : isPortfolio ? (
                  <PortfolioManager
                    notify={notify}
                    confirm={confirmAction}
                  />
                ) : isProjects ? (
                  <ProjectsModule
                    notify={notify}
                    projects={projects}
                    setProjects={setProjects}
                  />
                ) : isCatalog ? (
                  <CatalogManager
                    notify={notify}
                    confirm={confirmAction}
                  />
                ) : isVisualEditor ? (
                  <VisualWebEditor
                    notify={notify}
                    confirm={confirmAction}
                  />
                ) : isBlog ? (
                  <BlogManager />
                ) : isNotes ? (
                  <MemoManager
                    notify={notify}
                    confirm={confirmAction}
                  />
                ) : isLinks ? (
                  <LinksStudio
                    notify={notify}
                  />
                ) : isQr ? (
                  <QrStudio
                    notify={notify}
                  />
                ) : activePage === 'booking' || activePage === 'schedule' || activePage === 'calendar' ? (
                  <ProjectsModule
                    notify={notify}
                    projects={projects}
                    setProjects={setProjects}
                    initialViewMode="schedule"
                  />
                ) : activePage === 'broadcast' || activePage === 'push' ? (
                  <BroadcastStudio />
                ) : (
                  <>
                    {editingPopup && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 18px',
                        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.95))',
                        color: '#fff',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                        borderRadius: 12,
                        margin: '10px 16px 0',
                        border: '1px solid rgba(255,255,255,0.25)',
                        animation: 'fadeIn 0.2s ease-out',
                        flexShrink: 0,
                        zIndex: 20
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Layers size={18} color="#fff" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Mengedit Pop-up: {editingPopup.title}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.85 }}>
                              Gunakan tombol oranye (blok) & ungu (stiker) di bawah untuk mendesain isi pop-up ini
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPageSlug(editingPopup.returnPage || null);
                            setEditingPopup(null);
                            setSelectedBlockId(null);
                            setSelectedStickerId(null);
                            notify('Kembali ke halaman utama');
                          }}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#fff',
                            color: '#4f46e5',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        >
                          ← Selesai & Kembali
                        </button>
                      </div>
                    )}
                    <LivePreview
                      key={selectedPageSlug || activePage}
                      globalSettings={globalSettings}
                      page={getPageMetadata(selectedPageSlug || activePage)}
                      blocks={selectedPageSlug ? (pagesData?.[selectedPageSlug] || []) : currentBlocks}
                      selectedBlockId={selectedBlockId}
                      onSelectBlock={(id) => { setSelectedBlockId(id); if (id) { setCmsMode('content'); setActiveSidebar('right'); } }}
                      onRemoveBlock={handleRemoveBlock}
                      onMoveBlock={handleMoveBlock}
                      onUpdateBlock={handleUpdateBlock}
                      cmsMode={cmsMode}
                      stickers={selectedPageSlug ? (stickersData?.[selectedPageSlug] || []) : currentStickers}
                      selectedStickerId={selectedStickerId}
                      onSelectSticker={(id) => { setSelectedStickerId(id); if (id) setCmsMode('dashboard'); }}
                      onUpdateSticker={handleUpdateSticker}
                      onRemoveSticker={handleRemoveSticker}
                      onDuplicateSticker={handleDuplicateSticker}
                      onReorderSticker={handleReorderSticker}
                      onModeChange={setCmsMode}
                      currentFrames={{
                        ...(framesData?.[selectedPageSlug || activePage] || framesData?.home || {}),
                        hideNavbars: getPageMetadata(selectedPageSlug || activePage)?.hideNavbars,
                        useFrame: getPageMetadata(selectedPageSlug || activePage)?.useFrame
                      }}
                      contentVisibility={contentVisibility}
                      stickerVisibility={stickerVisibility}
                      frameVisibility={frameVisibility}
                      previewSize={previewSize}
                      desktopRatio={getPageMetadata(selectedPageSlug || activePage)?.desktopRatio || globalSettings.desktopRatio || (previewSize === 'desktop' ? '16/9' : '9/16')}
                    />
                  </>
                )}
              </div>
            </Suspense>

            {/* Floating Toolbox for Builder (moved inside middle pane for workspace-relative centering) */}
            {!isFullWidthMode && (
              <Toolbox
                isSidebarOpen={isSidebarExpanded || activeSidebar !== null}
                onAddContent={(type = 'image') => {
                  const targetPage = selectedPageSlug || activePage;
                  const id = `b_${Date.now()}`;
                  let newBlock = { id, mediaType: type, url: '', order: (pagesData[targetPage] || []).length };
                  if (type === 'carousel') {
                    newBlock.mediaType = 'image';
                    newBlock.mode = 'multiple';
                    newBlock.urls = [];
                  } else if (type === 'spacer') {
                    newBlock.height = 50;
                  } else if (type === 'form') {
                    newBlock.formEmail = '';
                    newBlock.submitText = 'Kirim Pesan';
                  }
                  hasUnsavedChangesRef.current = true;
                  setUnsavedState(true);
                  setPagesData(prev => ({ ...prev, [targetPage]: [...(prev[targetPage] || []), newBlock] }));
                  setSelectedBlockId(id);
                  setCmsMode('content');
                  setActiveSidebar('right');
                }}
                onAddSticker={(type = 'image') => window.dispatchEvent(new CustomEvent('porto_request_sticker_spawn_pos', { detail: { type } }))}
                previewSize={previewSize}
                onTogglePreviewSize={() => setPreviewSize(p => p === 'mobile' ? 'desktop' : 'mobile')}
                cmsMode={cmsMode}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                selectedBlockId={selectedBlockId}
                selectedStickerId={selectedStickerId}
                onMoveBlock={handleMoveBlock}
                onRemoveBlock={handleRemoveBlock}
                onDuplicateBlock={(id) => window.dispatchEvent(new CustomEvent('porto_duplicate_block', { detail: id }))}
                onRemoveSticker={handleRemoveSticker}
                onDuplicateSticker={handleDuplicateSticker}
                selectedIdx={selectedIdx}
                totalBlocks={currentBlocks.length}
                isSaving={isSaving}
                unsavedState={unsavedState}
                onManualSave={handleManualSave}
                onResetPage={() => handleResetPage(cmsMode === 'pages' ? selectedPageSlug : activePage)}
                onDeletePage={!SYSTEM_PAGES.some(sp => sp.slug === (cmsMode === 'pages' ? selectedPageSlug : activePage)) ? () => {
                  const slug = cmsMode === 'pages' ? selectedPageSlug : activePage;
                  if (!slug) return;
                  confirmAction(`Hapus halaman ini? Semua blok dan stiker di dalamnya akan hilang selamanya.`, () => {
                    setGlobalSettings(prev => ({ ...prev, customPages: (prev.customPages || []).filter(p => p.slug !== slug) }));
                    if (selectedPageSlug === slug) setSelectedPageSlug(null);
                    if (activePage === slug) handleSwitchPage('home');
                    notify('🗑️ Halaman dihapus');
                  });
                } : null}
                activePage={activePage}
              />
            )}
            </div>
          </div>

          {/* Right Sidebar */}
          {!isFullWidthMode && (
            <div className={`cms-floating-sidebar right-panel ${activeSidebar === 'right' ? 'active' : ''}`}>
              <Suspense fallback={<div style={{ padding: 24, textAlign: 'center', opacity: 0.6, fontSize: 11.5 }}>Memuat panel...</div>}>
                {cmsMode === 'frame' ? (
                  <FrameEditPanel 
                    currentFrames={framesData?.[selectedPageSlug || activePage] || {}}
                    onUpdateFrames={handleUpdateFrames}
                    notify={notify}
                  />
                ) : (cmsMode === 'pages' || (!selectedBlockId && !selectedStickerId)) ? (
                  <PageSettingsPanel 
                    page={getPageMetadata(selectedPageSlug || activePage)}
                    globalSettings={globalSettings}
                    isSystem={SYSTEM_PAGES.some(s => s.slug === (selectedPageSlug || activePage))}
                    cmsMode={cmsMode}
                    currentFrames={framesData?.[selectedPageSlug || activePage] || {}}
                    onUpdateFrames={handleUpdateFrames}
                    onUpdate={(props) => {
                      const slug = selectedPageSlug || activePage;
                      if (!slug) return;
                      const isSys = SYSTEM_PAGES.some(sp => sp.slug === slug);
                      setGlobalSettings(prev => {
                        const list = prev.customPages || [];
                        const exists = list.some(p => p.slug === slug);
                        let next;
                        if (exists) {
                          next = { ...prev, customPages: list.map(p => p.slug === slug ? { ...p, ...props } : p) };
                        } else if (isSys) {
                          const sys = SYSTEM_PAGES.find(sp => sp.slug === slug);
                          next = { ...prev, customPages: [...list, { ...sys, isPublished: true, showInNav: true, ...props }] };
                        } else {
                          next = { ...prev, customPages: [...list, { slug, isPublished: true, showInNav: true, ...props }] };
                        }
                        
                        if (props.desktopRatio) {
                          next.desktopRatio = props.desktopRatio;
                          const ratio = props.desktopRatio;
                          if (ratio === 'Full') {
                            document.documentElement.style.setProperty('--preview-ratio', 'auto');
                            document.documentElement.style.setProperty('--preview-width', '100%');
                            document.documentElement.style.setProperty('--preview-max-width', '1400px');
                          } else {
                            document.documentElement.style.setProperty('--preview-ratio', ratio);
                            document.documentElement.style.setProperty('--preview-width', 'auto');
                            document.documentElement.style.setProperty('--preview-max-width', '96vw');
                          }
                        }

                        // Sync button & hover styles
                        if (props.buttonStyle !== undefined) {
                          next.buttonStyle = props.buttonStyle;
                          document.documentElement.setAttribute('data-btn-style', props.buttonStyle);
                        }
                        if (props.hoverEffect !== undefined) {
                          next.hoverEffect = props.hoverEffect;
                          document.documentElement.setAttribute('data-hover-effect', props.hoverEffect);
                        }

                        // Sync navbar & glass settings
                        if (props.navMaxIcons !== undefined) next.navMaxIcons = props.navMaxIcons;
                        if (props.navSize !== undefined) next.navSize = props.navSize;
                        if (props.navStyle !== undefined) next.navStyle = props.navStyle;
                        if (props.navBgMode !== undefined) next.navBgMode = props.navBgMode;
                        if (props.navAutoHide !== undefined) next.navAutoHide = props.navAutoHide;
                        if (props.glassBlur !== undefined) {
                          next.glassBlur = props.glassBlur;
                          document.documentElement.style.setProperty('--glass-blur', `${props.glassBlur}px`);
                        }
                        if (props.glassOpacity !== undefined) {
                          next.glassOpacity = props.glassOpacity;
                          document.documentElement.style.setProperty('--glass-opacity', String(props.glassOpacity));
                        }
                        
                        // Keep ref synchronously aligned
                        globalSettingsRef.current = next;
                        hasUnsavedChangesRef.current = true;
                        setUnsavedState(true);
                        return next;
                      });
                    }}
                    onRemove={(slug) => {
                      confirmAction(`Hapus halaman ini? Semua blok dan stiker di dalamnya akan hilang selamanya.`, () => {
                        setGlobalSettings(prev => ({ ...prev, customPages: (prev.customPages || []).filter(p => p.slug !== slug) }));
                        if (selectedPageSlug === slug) setSelectedPageSlug(null);
                        if (activePage === slug) handleSwitchPage('home');
                        notify('🗑️ Halaman dihapus');
                      });
                    }}
                    onReset={handleResetPage}
                    notify={notify}
                  />
                ) : cmsMode === 'content' ? (
                  <BlockEditPanel
                    block={currentBlocks.find(b => b.id === selectedBlockId)}
                    activePage={activePage}
                    blockIndex={selectedIdx}
                    onUpdate={handleUpdateBlock}
                    onRemove={handleRemoveBlock}
                    onMoveUp={() => handleMoveBlock(selectedBlockId, 'up')}
                    onMoveDown={() => handleMoveBlock(selectedBlockId, 'down')}
                    canMoveUp={selectedIdx > 0}
                    canMoveDown={selectedIdx < currentBlocks.length - 1}
                    hideHeader={true}
                  />
                ) : (
                  <StickerEditPanel
                    sticker={currentStickers.find(s => s.id === selectedStickerId)}
                    onUpdate={handleUpdateSticker}
                    onRemove={handleRemoveSticker}
                    onDuplicate={handleDuplicateSticker}
                  />
                )}
              </Suspense>
            </div>
          )}
        </div>
      </div>


      {/* Floating Island Mobile Bottom Navbar (Always visible on top across all pages including Website Studio & Global Search) */}
      <div className="cms-mobile-navbar" style={{ pointerEvents: 'auto' }}>
        <div 
          className="cms-navbar-inner" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 6, 
            padding: 0,
            width: 'fit-content'
          }}
        >
          {/* ── SPECIAL LAYOUT: PAGE LINK / QR STUDIO (MATCHING GAMBAR 2) ── */}
          {(isLinks || isQr) ? (
            <>
              {/* 1. House (Dashboard) */}
              <button 
                className="cms-mobile-nav-btn"
                onClick={() => handleSwitchPage('dashboard')}
                title="Dashboard Utama"
                style={{ 
                  width: 42, height: 42, borderRadius: '50%', 
                  background: 'var(--cms-card-bg, #ffffff)', 
                  color: 'var(--cms-text, #0f172a)', 
                  border: '1.5px solid var(--cms-border, #cbd5e1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease'
                }}
              >
                <House size={19} strokeWidth={2.4} />
              </button>

              {/* 2. Link / QR Mode Switcher (Icon switches dynamically to QrCode when in QR mode) */}
              <button 
                className="cms-mobile-nav-btn"
                onClick={() => {
                  const nextMode = linksStudioState.studioMode === 'links' ? 'qr' : 'links';
                  window.dispatchEvent(new CustomEvent('cms_links_set_mode', { detail: { mode: nextMode } }));
                }}
                title={linksStudioState.studioMode === 'links' ? 'Beralih ke QR Studio' : 'Beralih ke Bio Links'}
                aria-label={linksStudioState.studioMode === 'links' ? 'QR Studio' : 'Bio Links'}
                style={{ 
                  width: 42, height: 42, borderRadius: '50%', 
                  background: 'var(--cms-card-bg, #ffffff)', 
                  color: '#0284c7', 
                  border: '1.5px solid #0284c7', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease'
                }}
              >
                {linksStudioState.studioMode === 'links' ? <Link2 size={19} strokeWidth={2.4} /> : <QrCode size={19} strokeWidth={2.4} />}
              </button>

              {/* 3. Menu Center (Sidebar Drawer) */}
              <button 
                className="cms-mobile-nav-btn"
                onClick={() => window.dispatchEvent(new Event('cms_sidebar_toggle_request'))}
                title="Menu Navigasi Sidebar"
                style={{ 
                  width: 48, height: 48, borderRadius: '50%', 
                  background: 'var(--cms-accent, #6366f1)', 
                  color: '#ffffff', 
                  border: '2px solid rgba(255,255,255,0.4)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Menu size={22} strokeWidth={2.4} />
              </button>

              {/* 4. Eye / Edit Switcher (Toggle Live Preview vs Editor for QR & Links) */}
              <button 
                className="cms-mobile-nav-btn"
                onClick={() => {
                  const nextView = linksStudioState.mobileViewTab === 'editor' ? 'preview' : 'editor';
                  window.dispatchEvent(new CustomEvent('cms_links_set_view', { detail: { view: nextView } }));
                }}
                title={linksStudioState.mobileViewTab === 'editor' ? 'Lihat Pratinjau' : 'Buka Editor'}
                aria-label={linksStudioState.mobileViewTab === 'editor' ? 'Pratinjau' : 'Editor'}
                style={{ 
                  width: 42, height: 42, borderRadius: '50%', 
                  background: linksStudioState.mobileViewTab === 'preview' ? 'var(--cms-accent, #6366f1)' : 'var(--cms-card-bg, #ffffff)', 
                  color: linksStudioState.mobileViewTab === 'preview' ? '#ffffff' : 'var(--cms-text, #0f172a)', 
                  border: `1.5px solid ${linksStudioState.mobileViewTab === 'preview' ? 'transparent' : 'var(--cms-border, #cbd5e1)'}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: linksStudioState.mobileViewTab === 'preview' ? '0 4px 14px rgba(99,102,241,0.4)' : '0 2px 6px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease'
                }}
              >
                {linksStudioState.mobileViewTab === 'editor' ? <Eye size={19} strokeWidth={2.4} /> : <Edit3 size={19} strokeWidth={2.4} />}
              </button>

              {/* 5. Search (Pencarian Global) */}
              <button 
                className="cms-mobile-nav-btn"
                onClick={() => handleSwitchPage('global-search')}
                title="Pencarian Global"
                style={{ 
                  width: 42, height: 42, borderRadius: '50%', 
                  background: 'var(--cms-card-bg, #ffffff)', 
                  color: 'var(--cms-text, #0f172a)', 
                  border: '1.5px solid var(--cms-border, #cbd5e1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Search size={19} strokeWidth={2.4} />
              </button>
            </>
          ) : (
            <>
              {/* ── FLANK KIRI: Back / Left Sidebar (Toolkit) ── */}
              {activePage !== 'dashboard' && (
                <button 
                  className="cms-mobile-nav-btn"
                  onClick={handleBackStep}
                  title="Kembali (1 Langkah)"
                  style={{ 
                    width: 42, height: 42, borderRadius: '50%', 
                    aspectRatio: '1 / 1', padding: 0,
                    background: 'var(--cms-card-bg, #ffffff)', 
                    color: 'var(--cms-text, #0f172a)', 
                    border: '1.5px solid var(--cms-border, #cbd5e1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ArrowLeft size={19} strokeWidth={2.4} />
                </button>
              )}

              {/* Left Feature Action for LP Image: Direct Toggle Left Toolkit Sidebar */}
              {!isFullWidthMode && (
                <button 
                  className="cms-mobile-nav-btn"
                  onClick={() => setActiveSidebar(prev => prev === 'left' ? null : 'left')}
                  title="Buka Toolkit / Stiker (Sidebar Kiri)"
                  style={{ 
                    width: 42, height: 42, borderRadius: '50%', 
                    background: activeSidebar === 'left' ? 'var(--cms-accent, #6366f1)' : 'var(--cms-card-bg, #ffffff)', 
                    color: activeSidebar === 'left' ? '#ffffff' : 'var(--cms-text, #0f172a)', 
                    border: `1.5px solid ${activeSidebar === 'left' ? 'transparent' : 'var(--cms-border, #cbd5e1)'}`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: activeSidebar === 'left' ? '0 4px 14px rgba(99,102,241,0.4)' : '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Layers size={19} strokeWidth={2.4} />
                </button>
              )}

              {/* ── 3 CORE CENTER BUTTONS ── */}
              {/* 1. HOME / DASHBOARD */}
              <button 
                className="cms-mobile-nav-btn"
                onClick={() => handleSwitchPage('dashboard')}
                title="Dashboard Utama"
                style={{ 
                  width: 42, height: 42, borderRadius: '50%', 
                  background: activePage === 'dashboard' ? 'var(--cms-accent, #6366f1)' : 'var(--cms-card-bg, #ffffff)', 
                  color: activePage === 'dashboard' ? '#ffffff' : 'var(--cms-text, #0f172a)', 
                  border: `1.5px solid ${activePage === 'dashboard' ? 'transparent' : 'var(--cms-border, #cbd5e1)'}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: activePage === 'dashboard' ? '0 4px 14px rgba(99,102,241,0.4)' : '0 2px 6px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease'
                }}
              >
                <House size={19} strokeWidth={2.4} />
              </button>

              {/* 2. MENU CENTER (Utama) */}
              <button 
                className="cms-mobile-nav-btn"
                onClick={() => window.dispatchEvent(new Event('cms_sidebar_toggle_request'))}
                title="Menu Navigasi Sidebar"
                style={{ 
                  width: 48, height: 48, borderRadius: '50%', 
                  background: 'var(--cms-accent, #6366f1)', 
                  color: '#ffffff', 
                  border: '2px solid rgba(255,255,255,0.4)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Menu size={22} strokeWidth={2.4} />
              </button>

              {/* 3. SEARCH */}
              <button 
                className="cms-mobile-nav-btn"
                onClick={() => handleSwitchPage('global-search')}
                title="Pencarian Global"
                style={{ 
                  width: 42, height: 42, borderRadius: '50%', 
                  background: activePage === 'global-search' ? 'var(--cms-accent, #6366f1)' : 'var(--cms-card-bg, #ffffff)', 
                  color: activePage === 'global-search' ? '#ffffff' : 'var(--cms-text, #0f172a)', 
                  border: `1.5px solid ${activePage === 'global-search' ? 'transparent' : 'var(--cms-border, #cbd5e1)'}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: activePage === 'global-search' ? '0 4px 14px rgba(99,102,241,0.4)' : '0 2px 6px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Search size={19} strokeWidth={2.4} />
              </button>

              {/* ── FLANK KANAN: Contextual Feature Switchers ── */}
              {/* A. Website Studio: Lihat Web Publik */}
              {isVisualEditor && (
                <button 
                  className="cms-mobile-nav-btn"
                  onClick={() => window.open('/', '_blank')}
                  title="Buka Website Klien Publik (/)"
                  style={{ 
                    width: 42, height: 42, borderRadius: '50%', 
                    background: 'var(--cms-card-bg, #ffffff)', 
                    color: '#10b981', 
                    border: '1.5px solid #10b981', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ExternalLink size={19} strokeWidth={2.4} />
                </button>
              )}

              {/* B1. LP Image: Direct Toggle Right Sidebar (Page Settings & Properties) */}
              {!isFullWidthMode && (
                <button 
                  className="cms-mobile-nav-btn"
                  onClick={() => setActiveSidebar(prev => prev === 'right' ? null : 'right')}
                  title="Buka Pengaturan Halaman (Sidebar Kanan)"
                  style={{ 
                    width: 42, height: 42, borderRadius: '50%', 
                    background: activeSidebar === 'right' ? 'var(--cms-accent, #6366f1)' : 'var(--cms-card-bg, #ffffff)', 
                    color: activeSidebar === 'right' ? '#ffffff' : 'var(--cms-text, #0f172a)', 
                    border: `1.5px solid ${activeSidebar === 'right' ? 'transparent' : 'var(--cms-border, #cbd5e1)'}`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: activeSidebar === 'right' ? '0 4px 14px rgba(99,102,241,0.4)' : '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Settings2 size={19} strokeWidth={2.4} />
                </button>
              )}

              {/* B2. LP Image: Toggle Preview Mode */}
              {!isFullWidthMode && (
                <button 
                  className="cms-mobile-nav-btn"
                  onClick={() => setPreviewSize(p => p === 'mobile' ? 'desktop' : 'mobile')}
                  title="Beralih Preview Mobile/Desktop"
                  style={{ 
                    width: 42, height: 42, borderRadius: '50%', 
                    background: 'var(--cms-card-bg, #ffffff)', 
                    color: 'var(--cms-text, #0f172a)', 
                    border: '1.5px solid var(--cms-border, #cbd5e1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {previewSize === 'mobile' ? <Monitor size={19} strokeWidth={2.4} /> : <Smartphone size={19} strokeWidth={2.4} />}
                </button>
              )}

              {/* E. Notes: Tambah Catatan */}
              {isNotes && (
                <button 
                  className="cms-mobile-nav-btn"
                  onClick={() => window.dispatchEvent(new Event('cms_global_add'))}
                  title="Tambah Catatan / Memo"
                  style={{ 
                    width: 42, height: 42, borderRadius: '50%', 
                    background: 'var(--cms-card-bg, #ffffff)', 
                    color: '#d97706', 
                    border: '1.5px solid #d97706', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Plus size={19} strokeWidth={2.4} />
                </button>
              )}

              {/* F. Database / Portfolio: Buka Kurasi Karya */}
              {(isDatabase || isBlog || isCatalog) && (
                <button 
                  className="cms-mobile-nav-btn"
                  onClick={() => handleSwitchPage('portfolio')}
                  title="Kurasi Karya"
                  style={{ 
                    width: 42, height: 42, borderRadius: '50%', 
                    background: 'var(--cms-card-bg, #ffffff)', 
                    color: '#d97706', 
                    border: '1.5px solid #d97706', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Star size={19} strokeWidth={2.4} />
                </button>
              )}

              {/* G. Game Management: Buka Katalog Game / Apps */}
              {isGameManagement && (
                <button 
                  className="cms-mobile-nav-btn"
                  onClick={() => window.open('/game', '_blank')}
                  title="Lihat Showcase Game Publik (/game)"
                  style={{ 
                    width: 42, height: 42, borderRadius: '50%', 
                    background: 'var(--cms-card-bg, #ffffff)', 
                    color: 'var(--cms-accent, #7c3aed)', 
                    border: '1.5px solid var(--cms-accent, #7c3aed)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ExternalLink size={19} strokeWidth={2.4} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {notifData && (
        <Notification 
          title={notifData.title}
          message={notifData.message} 
          type={notifData.type} 
          isDestructive={notifData.isDestructive}
          onConfirm={notifData.onConfirm}
          onClose={() => setNotifData(null)} 
        />
      )}

      {/* <NotificationCenter /> — dinonaktifkan */}
      
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        pages={allPagesCombined}
        projects={projects}
        onNavigate={(page) => {
          handleSwitchPage(page);
          storage.logActivity('Navigated', { page });
        }}
      />

        {isAiOpen && (
          <Suspense fallback={null}>
            <AiAssistant 
              isOpen={isAiOpen}
              setIsOpen={setIsAiOpen}
              pagesData={pagesData} 
              projects={projects} 
              canvases={canvases} 
              globalSettings={globalSettings}
              onAction={(type) => {
                if (type === 'projects') navigate('/admin/projects');
                if (type === 'seo') navigate('/admin/apps');
              }}
            />
          </Suspense>
        )}
        {isGlobalSearchOpen && (
          <Suspense fallback={null}>
            <GlobalSearchCenter
              isOpen={isGlobalSearchOpen}
              onClose={() => setIsGlobalSearchOpen(false)}
              pagesData={pagesData}
              stickersData={stickersData}
              globalSettings={globalSettings}
              projects={projects}
              canvases={canvases}
              onSwitchPage={handleSwitchPage}
              userData={userData}
            />
          </Suspense>
        )}
        {isSyncModalOpen && (
          <Suspense fallback={null}>
            <GoogleSyncModal
              isOpen={isSyncModalOpen}
              onClose={() => setIsSyncModalOpen(false)}
              activePage={activePage}
              notify={notify}
              setProjects={setProjects}
              onNavigateSettings={() => handleSwitchPage('settings')}
            />
          </Suspense>
        )}
        {isClientPreviewOpen && (
          <Suspense fallback={null}>
            <ClientWebsitePreviewModal
              isOpen={isClientPreviewOpen}
              onClose={() => setIsClientPreviewOpen(false)}
              initialPage={clientPreviewPage}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

/* ── Save function ── */
async function performSave(pagesData, globalSettings, stickersData, framesData, notify, silent = true, setIsSaving) {
  if (setIsSaving) setIsSaving(true);
  try {
    // Flush any pending debounced items before executing batch save
    await storage.flushDebounced();

    const finalAccent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || globalSettings?.accentColor;
    const settingsToSave = {
      ...(globalSettings || {}),
      ...(finalAccent ? { accentColor: finalAccent } : {})
    };

    // Push the core CMS keys with safe deep merging in storage
    await storage.batchSetItems({
      'porto_pages':    pagesData,
      'porto_settings': settingsToSave,
      'porto_stickers': stickersData,
      'porto_frames':   framesData,
    }, true);

    window.dispatchEvent(new Event('porto_saved'));
    window.dispatchEvent(new Event('porto_stickers_updated'));
    if (notify && !silent) notify('✅ Semua data tersimpan aman ke Cloud');
    
    // Push to Firestore notification log on manual (non-silent) saves
    if (!silent) {
      const totalBlocks = Object.values(pagesData || {}).reduce((sum, arr) => sum + (arr || []).length, 0);
      notifySave(totalBlocks).catch(() => {});
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  } catch (e) {
    console.error('Save failed:', e);
    if (notify) notify('Gagal menyimpan: ' + (e.message || e.name), 'error');
  } finally {
    if (setIsSaving) {
      setTimeout(() => setIsSaving(false), 800);
    }
  }
}

export default CmsDashboard;

