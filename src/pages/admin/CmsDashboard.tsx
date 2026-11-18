import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, Suspense, lazy, startTransition as reactStartTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import LoginGateway from '../../components/admin/LoginGateway';
import Notification from '../../components/admin/Notification';
import { ExternalLink, Palette, LayoutDashboard, LayoutGrid, Target, Layers, Eye, EyeOff, Settings2, Image, Monitor, Smartphone, Save, Loader2, Trash2, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Search, ArrowLeft, Bell, LogOut, Cloud, ShieldCheck, House, FileText, Plus, MessageSquare, ShieldAlert, AlignRight, Menu, QrCode, Link2, Edit3, Clock, X, Database, Globe2, FolderKanban, Star, Store, Gamepad2, Compass, Sparkles, History, SlidersHorizontal } from 'lucide-react';

import { subscribeToNotifications, notifySave, notifySettings, notifyError, notifyChat, requestNotificationPermission } from '../../utils/notifications';
import { storage } from '../../utils/storage';
import { DialogProvider } from '../../components/admin/DialogProvider';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { migrateExistingData } from '../../utils/fileNaming';
import AdminPwaSuggestion from '../../components/admin/AdminPwaSuggestion';
import PremiumPreloader from '../../components/admin/PremiumPreloader';
import { adminEventBus } from '../../utils/adminEventBus';
import { useAdminStore } from '../../store/useAdminStore';
import { haptic } from '../../utils/haptics';
import ErrorBoundary from '../../components/ErrorBoundary';

// Lazy loaded CMS panels, overlays & preview
const WaitingApprovalScreen = lazy(() => import('../../components/admin/WaitingApprovalScreen'));
const ToolkitSidebar = lazy(() => import('../../components/admin/ToolkitSidebar'));
const Toolbox = lazy(() => import('../../components/admin/Toolbox'));
const CommandPalette = lazy(() => import('../../components/admin/CommandPalette'));
const NotificationCenter = lazy(() => import('../../components/admin/NotificationCenter'));
const QuickActionDrawer = lazy(() => import('../../components/admin/QuickActionDrawer'));
const DashboardOverview = lazy(() => import('../../components/admin/DashboardOverview'));
const MobileControlPanel = lazy(() => import('../../components/admin/MobileControlPanel'));
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
const ManagementPortal = lazy(() => import('../../components/admin/ManagementPortal'));
const ToolsPortal = lazy(() => import('../../components/admin/ToolsPortal'));
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
const WhatsAppStudio = lazy(() => import('../../components/admin/WhatsAppStudio'));
const VisualWebEditor = lazy(() => import('../../components/admin/VisualWebEditor'));
const GameManagementTab = lazy(() => import('./GameManagementTab'));
const AppsManager = lazy(() => import('../../components/admin/AppsManager'));
const ProofingManager = lazy(() => import('../../components/admin/ProofingManager'));
const GuidelinePage = lazy(() => import('../GuidelinePage'));
const AiAssistant = lazy(() => import('../../components/admin/AiAssistant'));
const AiTemplateStudioModal = lazy(() => import('../../components/admin/AiTemplateStudioModal'));
const GlobalSearchCenter = lazy(() => import('../../components/admin/GlobalSearchCenter'));
const GoogleSyncModal = lazy(() => import('../../components/admin/GoogleSyncModal'));
const ClientWebsitePreviewModal = lazy(() => import('../../components/admin/ClientWebsitePreviewModal'));
const StudioIntelligenceAnalytics = lazy(() => import('../../components/admin/StudioIntelligenceAnalytics'));
const FlipbookStudio = lazy(() => import('../../components/admin/FlipbookStudio'));
const SocialPosterStudio = lazy(() => import('../../components/admin/SocialPosterStudio'));
const ThirdPartyIntegrationsHub = lazy(() => import('../../components/admin/ThirdPartyIntegrationsHub'));
import { applyAccentColor } from '../../utils/theme';
import { useNativeBackHandler, triggerNativeBack } from '../../utils/nativeNavigation';
import type { ContentSnapshotItem } from '../../utils/studioBackup';
import { triggerSmoothThemeTransition } from '../../hooks/useWebsiteTheme';

// Idle background prefetch of CMS modules on desktop only (disabled on mobile to prevent CPU spikes & overheating)
const preloadCmsModules = () => {
  if (typeof window === 'undefined') return;
  // NEVER eager-prefetch heavy modules on mobile to save CPU, battery & keep device cool
  if (window.innerWidth <= 768 || (typeof navigator !== 'undefined' && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1 && window.innerWidth <= 1024)) {
    return;
  }
  const preloader = () => {
    import('../../components/admin/DashboardOverview').catch(() => { });
    import('../../components/admin/SettingsPanel').catch(() => { });
    import('../../components/admin/ProjectsModule').catch(() => { });
    import('../../components/admin/VisualWebEditor').catch(() => { });
    import('../../components/admin/BlogManager').catch(() => { });
    import('../../components/admin/MemoManager').catch(() => { });
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

const INITIAL_PAGES = { home: [], portofolio: [], biodata: [] };
const INITIAL_SETTINGS = { customPages: [], desktopRatio: '1/1' };
const INITIAL_STICKERS = { home: [], portofolio: [], biodata: [] };
const INITIAL_FRAMES = { home: {}, portofolio: {}, biodata: {} };


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

/* ── Robust Permission Guard ── */
export const checkPagePermission = (pageSlug: string, user: any, customPages: any[] = []): boolean => {
  if (!user) return false;
  // Super Admin has unrestricted access to all modules
  if (user.role === 'Super Admin') return true;
  // Dashboard overview is accessible to all logged-in authorized roles
  if (!pageSlug || pageSlug === 'dashboard') return true;

  const baseSlug = pageSlug.split('/')[0];

  // User management and storage monitor are exclusively for Super Admin
  if (baseSlug === 'users' || baseSlug === 'storage') {
    return false;
  }

  // Map module aliases & subroutes to standardized module keys
  const settingsSlugs = ['settings', 'branding', 'seo', 'pwa', 'scripts', 'reset', 'security', 'storage'];
  const isSettings = baseSlug.startsWith('settings_') || settingsSlugs.includes(baseSlug);
  const isBuilder = SYSTEM_PAGES.some(sp => sp.slug === baseSlug) ||
    (customPages || []).some(cp => cp.slug === baseSlug) ||
    baseSlug.startsWith('page-') ||
    baseSlug === 'pages' ||
    baseSlug === 'visual-editor' ||
    baseSlug === 'website' ||
    baseSlug === 'lpimage' ||
    baseSlug === 'home' ||
    baseSlug === 'portofolio';
  const isDatabase = ['database', 'forms', 'form-maker', 'database_forms', 'contacts', 'database_contacts', 'media', 'vault', 'reviews', 'client-voice', 'ratecard', 'pricing'].includes(baseSlug) || baseSlug.startsWith('database_');
  const isApps = ['apps', 'apps-studio', 'game-management', 'games', 'invitation', 'undangan', 'invitation-maker'].includes(baseSlug);
  const isNotes = ['notes', 'memo', 'whiteboard'].includes(baseSlug);
  const isPortfolio = ['portfolio', 'karya'].includes(baseSlug);
  const isCatalog = ['catalog', 'katalog'].includes(baseSlug);
  const isProjects = ['projects', 'booking', 'schedule', 'calendar'].includes(baseSlug);
  const isProofing = ['proofing', 'design-proofing', 'flipbook', 'flipbook-studio', 'management', 'tools', 'tool'].includes(baseSlug);
  const isBroadcast = ['broadcast', 'push', 'database_broadcast'].includes(baseSlug);
  const isGuideline = ['guideline', 'panduan'].includes(baseSlug);

  const checkSlug = isSettings ? 'settings' :
    isBuilder ? 'pages' :
      isDatabase ? 'database' :
        isApps ? 'apps' :
          isNotes ? 'whiteboard' :
            isPortfolio ? 'portfolio' :
              isCatalog ? 'catalog' :
                isProjects ? 'projects' :
                  isProofing ? 'projects' :
                    isBroadcast ? 'broadcast' :
                      isGuideline ? 'guideline' : baseSlug;

  const allowed = user.allowedPages || [];
  return allowed.includes('*') || allowed.includes(checkSlug) || allowed.includes(baseSlug);
};

const CmsDashboardContent = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pagesData, setPagesData] = useState(() => storage.getSync('porto_pages', INITIAL_PAGES));
  const [globalSettings, setGlobalSettings] = useState(() => storage.getSync('porto_settings', INITIAL_SETTINGS));
  const [stickersData, setStickersData] = useState(() => storage.getSync('porto_stickers', INITIAL_STICKERS));
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== 'undefined') {
      const raw = window.location.pathname.replace(/^\/admin\/?/, '').replace(/\/+$/, '');
      if (raw.startsWith('lpimage/') || raw === 'lpimage') {
        const sub = raw.replace(/^lpimage\/?/, '');
        return sub || 'home';
      }
      const first = raw.split('/')[0] || 'dashboard';
      if (first === 'invitation' || first === 'undangan' || first === 'invitation-maker') {
        return 'apps';
      }
      return first;
    }
    return 'dashboard';
  });
  const [unsavedState, setUnsavedState] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [wmTab, setWmTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [cmsMode, setCmsMode] = useState('content');
  const [contentVisibility, setContentVisibility] = useState('full');
  const [stickerVisibility, setStickerVisibility] = useState('low');
  const [frameVisibility, setFrameVisibility] = useState('full');
  const [framesData, setFramesData] = useState(() => storage.getSync('porto_frames', {}));
  const [previewSize, setPreviewSize] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState(null);
  const [editingPopup, setEditingPopup] = useState<{ id: string; title: string; returnPage: string } | null>(null);
  const [notifData, setNotifData] = useState(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isMobileControlOpen, setIsMobileControlOpen] = useState(false);
  const [headerPullY, setHeaderPullY] = useState(0);
  const [isHeaderDragging, setIsHeaderDragging] = useState(false);
  const headerPullRafRef = useRef<number | null>(null);
  const pendingHeaderPullYRef = useRef(0);
  const dockInnerRef = useRef<HTMLDivElement>(null);
  const dockIndicatorRef = useRef<HTMLDivElement>(null);
  const dockTouchStateRef = useRef<{
    startX: number;
    startY: number;
    dragging: boolean;
    lastHoverIdx: number;
    targetIdx: number;
    suppressClick: boolean;
  }>({ startX: 0, startY: 0, dragging: false, lastHoverIdx: -1, targetIdx: -1, suppressClick: false });
  const [mobileDockMode, setMobileDockMode] = useState<'4' | '6'>(() =>
    (localStorage.getItem('cms_mobile_dock_mode') as '4' | '6') || '4'
  );
  const [mobileHeaderMode, setMobileHeaderMode] = useState<'show' | 'hide'>(() =>
    (localStorage.getItem('cms_mobile_header_mode') as 'show' | 'hide') || 'show'
  );

  useEffect(() => {
    const syncNavPrefs = () => {
      setMobileDockMode((localStorage.getItem('cms_mobile_dock_mode') as '4' | '6') || '4');
      setMobileHeaderMode((localStorage.getItem('cms_mobile_header_mode') as 'show' | 'hide') || 'show');
    };
    window.addEventListener('cms_mobile_nav_prefs_changed', syncNavPrefs);
    return () => window.removeEventListener('cms_mobile_nav_prefs_changed', syncNavPrefs);
  }, []);
  const [isAiTemplateModalOpen, setIsAiTemplateModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cms_dark_mode') !== 'false');
  const [canvases, setCanvases] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [projects, setProjects] = useState(() => storage.getSync('porto_projects', []));

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

  // ── GLOBAL SHORTCUTS: Ctrl+K, '?', and 'g + key' Navigation ──
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const lastGKeyTimeRef = useRef<number>(0);

  // ── CONTENT VERSIONING & SNAPSHOT HISTORY (Time Travel) ──
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [snapshotsList, setSnapshotsList] = useState<ContentSnapshotItem[]>([]);
  const [isRestoringSnap, setIsRestoringSnap] = useState(false);

  const loadSnapshots = useCallback(async () => {
    try {
      const list = await storage.getItem<ContentSnapshotItem[]>('porto_cms_snapshots', []);
      setSnapshotsList(list || []);
    } catch { }
  }, []);

  useEffect(() => {
    if (isVersionHistoryOpen) {
      loadSnapshots();
    }
  }, [isVersionHistoryOpen, loadSnapshots]);

  useEffect(() => {
    const handleOpenVer = () => setIsVersionHistoryOpen(true);
    window.addEventListener('cms_open_version_history', handleOpenVer);
    return () => window.removeEventListener('cms_open_version_history', handleOpenVer);
  }, []);

  const handleRollbackSnapshot = async (snap: ContentSnapshotItem) => {
    if (!window.confirm(`Pulihkan versi ini (${new Date(snap.timestamp).toLocaleString('id-ID')})? Semua blok dan pengaturan halaman akan dikembalikan ke kondisi tersebut.`)) return;
    setIsRestoringSnap(true);
    try {
      const { restoreContentSnapshot } = await import('../../utils/studioBackup');
      const ok = await restoreContentSnapshot(snap.id);
      if (ok) {
        await fetchMainDataRef.current();
        notify(`Versi ${new Date(snap.timestamp).toLocaleTimeString('id-ID')} berhasil dipulihkan`, 'success');
        setIsVersionHistoryOpen(false);
      } else {
        notify('Gagal memulihkan versi ini', 'error');
      }
    } catch (e: any) {
      notify('Error: ' + (e?.message || 'Gagal rollback'), 'error');
    } finally {
      setIsRestoringSnap(false);
    }
  };

  const [recentTabs, setRecentTabs] = useState<Array<{ id: string; label: string; slug: string }>>(() => {
    try {
      const saved = sessionStorage.getItem('porto_session_recent_tabs');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return [{ id: 'dashboard', label: 'Dashboard', slug: 'dashboard' }];
  });

  const PAGE_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    management: 'Manajemen Studio',
    tools: 'Tool Studio',
    tool: 'Tool Studio',
    'visual-editor': 'Website Studio',
    website: 'Website Studio',
    database: 'Master Database',
    portfolio: 'Karya',
    blog: 'Artikel',
    updates: 'Updates',
    update: 'Updates',
    catalog: 'Katalog',
    links: 'Bio Links',
    qr: 'QR Studio',
    notes: 'Catatan',
    flipbook: 'Flipbook Studio',
    'flipbook-studio': 'Flipbook Studio',
    analytics: 'Traffic & Intel',
    intelligence: 'Traffic & Intel',
    traffic: 'Traffic & Intel',
    whiteboard: 'Papan Kreatif',
    projects: 'Proyek',
    proofing: 'Proofing Klien',
    'design-proofing': 'Proofing Klien',
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
      } catch (e) { }
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
    } else if (p === 'invitation' || p === 'undangan' || p === 'invitation-maker') {
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
    useAdminStore.getState().setActivePage(p);
  }, [location.pathname, navigate]);

  // ── Native 1-Step Back Handlers (Mobile & Tablet Back Gestures & Buttons) ──
  useNativeBackHandler(isVersionHistoryOpen, () => setIsVersionHistoryOpen(false), 'cms_version_history', 10);
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

  // Quick Action Drawer Listeners
  useEffect(() => {
    const handleOpenDrawer = (e: any) => {
      if (e?.detail?.type) {
        useAdminStore.getState().openDrawer(e.detail.type, e.detail.payload);
      }
    };
    const handleCloseDrawer = () => {
      useAdminStore.getState().closeDrawer();
    };

    window.addEventListener('porto_open_quick_drawer', handleOpenDrawer);
    window.addEventListener('porto_close_quick_drawer', handleCloseDrawer);
    return () => {
      window.removeEventListener('porto_open_quick_drawer', handleOpenDrawer);
      window.removeEventListener('porto_close_quick_drawer', handleCloseDrawer);
    };
  }, []);

  // AI Template Studio Listener
  useEffect(() => {
    const handleOpenAiTemplate = () => setIsAiTemplateModalOpen(true);
    window.addEventListener('porto_open_ai_templates', handleOpenAiTemplate);
    return () => window.removeEventListener('porto_open_ai_templates', handleOpenAiTemplate);
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

  // Listener for Universal Social Media Promo Poster Studio
  useEffect(() => {
    const handleOpenPromo = (e: any) => {
      handleSwitchPage('poster-promo');
    };
    window.addEventListener('porto_open_social_promo', handleOpenPromo);
    return () => window.removeEventListener('porto_open_social_promo', handleOpenPromo);
  }, []);

  /* ── Refs ── */
  const activePageRef = useRef(activePage);
  const pagesDataRef = useRef(pagesData);
  const globalSettingsRef = useRef(globalSettings);
  const stickersDataRef = useRef(stickersData);
  const framesDataRef = useRef(framesData);
  const prevSelectedRef = useRef(null);
  const fileInputRef = useRef(null);
  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);
  const MAX_HISTORY = 15;
  const userDataRef = useRef<any>(null);
  const impersonatedUserRef = useRef<any>(null);
  const workAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activePageRef.current = activePage;
    setActiveSidebar(null);
    setSelectedBlockId(null);
    setSelectedStickerId(null);
    setSelectedPageSlug(null);
    if (workAreaRef.current) {
      workAreaRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [activePage]);
  const selectedPageSlugRef = useRef(selectedPageSlug);
  useEffect(() => { selectedPageSlugRef.current = selectedPageSlug; }, [selectedPageSlug]);
  useEffect(() => { pagesDataRef.current = pagesData; }, [pagesData]);
  useEffect(() => { globalSettingsRef.current = globalSettings; }, [globalSettings]);
  useEffect(() => { stickersDataRef.current = stickersData; }, [stickersData]);
  useEffect(() => { framesDataRef.current = framesData; }, [framesData]);

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
        notify('Halaman dibersihkan');
      } catch (err) {
        console.error('Reset page error:', err);
        notify('Gagal membersihkan halaman', 'error');
      }
    });
  }, [confirmAction, notify]);

  /* ── Theme Effect (Dark Mode & Accent Color) ── */
  useLayoutEffect(() => {
    localStorage.setItem('cms_dark_mode', isDarkMode ? 'true' : 'false');
    const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
    const themeStr = isDarkMode ? 'dark' : 'light';
    const nativeSurfaceColor = isDarkMode ? '#090a10' : '#f3f4f8';

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
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      if (document.body) {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
      }
    }
    metaThemeColors.forEach((meta) => meta.setAttribute('content', nativeSurfaceColor));

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
    haptic.light();
    triggerSmoothThemeTransition();
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
    const handleToggleZen = () => {
      setIsZenMode(prev => {
        const next = !prev;
        notify(next ? 'Zen Mode Aktif' : 'Zen Mode Nonaktif');
        return next;
      });
    };
    window.addEventListener('porto_toggle_zen', handleToggleZen);
    return () => {
      window.removeEventListener('cms_toggle_dark_mode', handleExtToggle);
      window.removeEventListener('porto_toggle_dark_mode', handleExtToggle);
      window.removeEventListener('porto_toggle_zen', handleToggleZen);
    };
  }, [handleToggleDarkMode]);

  const startTransition = (callback) => {
    reactStartTransition(() => {
      callback();
    });
  };

  const handleSwitchPage = useCallback((slug) => {
    haptic.selection();
    if (slug === 'global-search') {
      setIsGlobalSearchOpen(true);
      return;
    }

    const activeUser = impersonatedUserRef.current || userDataRef.current;
    if (activeUser && slug !== 'dashboard') {
      const allowed = checkPagePermission(slug, activeUser, globalSettingsRef.current?.customPages || []);
      if (!allowed) {
        notify('Akses dibatasi', 'error');
        return;
      }
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
      } else if (slug === 'updates' || slug === 'update') {
        navigate('/admin/updates');
        setTimeout(() => window.dispatchEvent(new CustomEvent('cms_website_change_tab', { detail: { tab: 'updates' } })), 50);
      } else if (slug === 'storage') {
        navigate('/admin/storage');
      } else if (slug === 'settings_storage') {
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

  // Global Shortcuts Listener (placed after handleSwitchPage to prevent TDZ ReferenceError)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable;

      // 1. Ctrl + K / Cmd + K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // 1b. Ctrl + Shift + N / C / I / W: Multitasking Quick Drawers
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const k = e.key.toLowerCase();
        if (k === 'n') {
          e.preventDefault();
          adminEventBus.openDrawer('memo');
          return;
        } else if (k === 'c') {
          e.preventDefault();
          adminEventBus.openDrawer('calculator');
          return;
        } else if (k === 'i') {
          e.preventDefault();
          adminEventBus.openDrawer('invoice');
          return;
        } else if (k === 'w') {
          e.preventDefault();
          adminEventBus.openDrawer('whatsapp');
          return;
        }
      }

      // If typing in form input, skip global single-key hotkeys
      if (isInput) return;

      // 2. '?' or 'Shift + /': Keyboard Shortcuts Cheatsheet
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }

      // 3. Escape: Close any open modal
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
      }

      // 4. Sequential 'g + key' Navigation (Linear/GitHub style)
      const now = Date.now();
      if (e.key.toLowerCase() === 'g') {
        lastGKeyTimeRef.current = now;
        return;
      }

      if (now - lastGKeyTimeRef.current < 1500) {
        const k = e.key.toLowerCase();
        if (k === 'p') {
          e.preventDefault();
          handleSwitchPage('projects');
          lastGKeyTimeRef.current = 0;
        } else if (k === 'f') {
          e.preventDefault();
          handleSwitchPage('transactions');
          lastGKeyTimeRef.current = 0;
        } else if (k === 'c') {
          e.preventDefault();
          handleSwitchPage('katalog');
          lastGKeyTimeRef.current = 0;
        } else if (k === 'd') {
          e.preventDefault();
          handleSwitchPage('dashboard');
          lastGKeyTimeRef.current = 0;
        }
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleSwitchPage, isShortcutsModalOpen]);

  // Sub-menu hub pages: Tombol back TIDAK ditampilkan saat berada di sub-menu / hub overview
  const isSubMenuPage = useMemo(() => {
    return [
      'dashboard',
      'management',
      'tools',
      'tool',
      'database',
      'content-database',
      'settings-portal',
      'apps',
      'third-party',
      'cloud-nexus',
      'integrations'
    ].includes(activePage);
  }, [activePage]);

  // 1-step back handler for mobile bottom navbar & native hardware back
  const handleBackStep = useCallback(() => {
    haptic.light();
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

    // 5. Contextual page stepping (1 step back ke sub-menu asal atau dashboard)
    const MANAGEMENT_FEATURES = ['projects', 'proofing', 'design-proofing', 'transactions', 'keuangan', 'whatsapp', 'wa', 'chat', 'users', 'crm', 'booking', 'schedule', 'calendar'];
    const TOOLS_FEATURES = ['forms', 'form-maker', 'links', 'qr', 'broadcast', 'notes', 'memo', 'flipbook'];
    const DATABASE_FEATURES = ['portfolio', 'karya', 'blog', 'updates', 'update', 'catalog', 'katalog', 'biodata', 'contacts', 'media', 'vault'];

    if (MANAGEMENT_FEATURES.includes(activePage)) {
      handleSwitchPage('management');
    } else if (TOOLS_FEATURES.includes(activePage)) {
      handleSwitchPage('tools');
    } else if (DATABASE_FEATURES.includes(activePage)) {
      handleSwitchPage('database');
    } else if (activePage?.startsWith('settings_') || activePage === 'settings' || activePage?.startsWith('settings/')) {
      if (settingsHasSub) {
        window.dispatchEvent(new CustomEvent('cms_settings_back'));
      } else {
        handleSwitchPage('dashboard');
      }
    } else if (activePage !== 'dashboard') {
      handleSwitchPage('dashboard');
    }
  }, [activeSidebar, isMobile, isTablet, isSidebarExpanded, selectedBlockId, selectedStickerId, selectedPageSlug, activePage, handleSwitchPage, settingsHasSub]);

  // Mobile Hardware / Browser Back Button Hook at CMS root level (priority 5: executes only when no higher priority modal caught it)
  useNativeBackHandler(
    isMobile && (!isSubMenuPage || !!activeSidebar || ((isMobile || isTablet) && isSidebarExpanded) || !!selectedBlockId || !!selectedStickerId || !!selectedPageSlug),
    handleBackStep,
    'cms_dashboard_back',
    5
  );

  const [userData, setUserData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const dataLoadedRef = useRef(false);
  useEffect(() => { dataLoadedRef.current = dataLoaded; }, [dataLoaded]);

  useEffect(() => { userDataRef.current = userData; }, [userData]);
  useEffect(() => { impersonatedUserRef.current = impersonatedUser; }, [impersonatedUser]);

  /* ── Data Fetching Logic ── */
  const unsubsRef = useRef<Array<() => void>>([]);
  const fetchMainData = useCallback(async (forceLoading = false) => {
    if (forceLoading || !dataLoadedRef.current) {
      setIsLoading(true);
    }
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
        requestNotificationPermission().catch(() => { });
        if (currentAuthUidRef.current === user.uid && !impersonatedUserRef.current) {
          return;
        }
        currentAuthUidRef.current = user.uid;

        try {
          const isOwner = user.email === 'mochamadsaifularif33@gmail.com';
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let finalData = null;

          if (userDoc.exists()) {
            finalData = { id: user.uid, ...userDoc.data() };
            if (isOwner && (finalData.role !== 'Super Admin' || finalData.status !== 'Active')) {
              finalData.role = 'Super Admin';
              finalData.status = 'Active';
              updateDoc(doc(db, 'users', user.uid), { role: 'Super Admin', status: 'Active' }).catch(() => { });
            }
            if (finalData.role !== 'Super Admin') {
              finalData.dbScope = 'private';
            }
          } else {
            // New user without record in Firestore -> ALWAYS Pending unless Super Admin owner
            finalData = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email,
              role: isOwner ? 'Super Admin' : 'Pending',
              status: isOwner ? 'Active' : 'Pending',
              allowedPages: isOwner ? ['*'] : [],
              dbScope: isOwner ? 'global' : 'private'
            };
            setDoc(doc(db, 'users', user.uid), {
              ...finalData,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              avatar: user.photoURL || null
            }).catch(() => { });
          }

          console.log(`[CmsDashboard] Active User: ${user.email} | Role: ${finalData.role} | Scope: ${finalData.dbScope || 'global'}`);
          setUserData(finalData);

          // If role is Pending or not in approved list, DO NOT initialize storage or fetch CMS data
          if (finalData.role === 'Pending' || finalData.status === 'Pending' || !['Super Admin', 'Admin', 'Editor', 'Viewer'].includes(finalData.role)) {
            setDataLoaded(true);
            return;
          }

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
      clearTimeout(authTimer);
      unsub();
      window.removeEventListener('porto_switch_page', handleSwitchPageEvent);
    };
  }, []);

  // Cleanup realtime storage listeners on unmount
  useEffect(() => {
    return () => {
      unsubsRef.current.forEach(u => {
        if (typeof u === 'function') u();
      });
      unsubsRef.current = [];
    };
  }, []);

  // Synchronous and reactive Page Access Guard
  const effectiveUser = impersonatedUser || userData;
  const isPageAllowed = useMemo(() => {
    return checkPagePermission(activePage, effectiveUser, globalSettings?.customPages || []);
  }, [activePage, effectiveUser, globalSettings?.customPages]);

  useEffect(() => {
    if (userData && !isPageAllowed) {
      notify('Akses dibatasi', 'error');
      handleSwitchPage('dashboard');
    }
  }, [userData, isPageAllowed, handleSwitchPage, notify]);

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
      notify('Urutan disimpan');
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
      }, () => { });
      return () => unsub();
    } catch (_) { }
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
  const isDatabase = activePage === 'database' || activePage === 'content-database' || (activePage?.startsWith('database/') ?? false) || activePage === 'forms' || activePage === 'form-maker' || activePage === 'biodata' || activePage === 'contacts' || activePage === 'links' || activePage === 'broadcast' || activePage === 'push' || activePage === 'media' || activePage === 'vault' || activePage === 'files' || activePage === 'reviews' || activePage === 'client-voice' || activePage === 'ratecard' || activePage === 'rate-card' || activePage === 'pricing';
  const isPortfolio = activePage === 'portfolio' || activePage === 'karya' || (activePage?.startsWith('portfolio/') ?? false);
  const isSettings = activePage === 'settings' || (activePage?.startsWith('settings_') ?? false) || (activePage?.startsWith('settings/') ?? false);
  const isChat = activePage === 'chat' || (activePage?.startsWith('chat/') ?? false);
  const isCatalog = activePage === 'catalog' || activePage === 'katalog' || (activePage?.startsWith('catalog/') ?? false) || (activePage?.startsWith('katalog/') ?? false);
  const isLinks = activePage === 'links' || (activePage?.startsWith('links/') ?? false);
  const isQr = activePage === 'qr' || (activePage?.startsWith('qr/') ?? false);

  const isNotes = activePage === 'notes' || activePage === 'memo' || activePage === 'whiteboard' || (activePage?.startsWith('notes/') ?? false);
  const isBlog = activePage === 'blog' || activePage === 'updates' || activePage === 'update' || (activePage?.startsWith('blog/') ?? false) || (activePage?.startsWith('updates/') ?? false) || (activePage?.startsWith('update/') ?? false);
  const isProjects = activePage === 'projects' || activePage === 'booking' || activePage === 'schedule' || activePage === 'calendar' || (activePage?.startsWith('projects/') ?? false);
  const isTransactions = activePage === 'transactions' || (activePage?.startsWith('transactions/') ?? false);
  const isApps = activePage === 'apps' || activePage === 'apps-studio' || activePage === 'invitation-maker' || activePage === 'invitation' || activePage === 'undangan' || (activePage?.startsWith('apps/') ?? false);
  const isGameManagement = activePage === 'game-management' || activePage === 'games' || (activePage?.startsWith('game-management/') ?? false);
  const isGuideline = activePage === 'guideline' || activePage === 'panduan' || (activePage?.startsWith('guideline/') ?? false);
  const isBroadcast = activePage === 'broadcast' || activePage === 'push' || (activePage?.startsWith('broadcast/') ?? false);
  const isWhatsApp = activePage === 'whatsapp' || activePage === 'wa' || activePage === 'wa-templates' || (activePage?.startsWith('whatsapp/') ?? false);
  const isAnalytics = activePage === 'analytics' || activePage === 'intelligence' || activePage === 'traffic' || (activePage?.startsWith('analytics/') ?? false);
  const isProofing = activePage === 'proofing' || activePage === 'design-proofing' || (activePage?.startsWith('proofing/') ?? false);
  const isFlipbook = activePage === 'flipbook' || activePage === 'flipbook-studio' || (activePage?.startsWith('flipbook/') ?? false);
  const isManagementPortal = activePage === 'management';
  const isToolsPortal = activePage === 'tools' || activePage === 'tool';
  const isPosterPromo = activePage === 'poster-promo' || activePage === 'poster' || activePage === 'studio-poster';
  const isThirdParty = activePage === 'third-party' || activePage === 'cloud-nexus' || activePage === 'integrations' || (activePage?.startsWith('third-party/') ?? false);

  const isFullWidthMode = useMemo(() => {
    const specialPages = ['dashboard', 'analytics', 'intelligence', 'traffic', 'activity', 'storage', 'users', 'global-search', 'visual-editor', 'database', 'portfolio', 'blog', 'updates', 'update', 'catalog', 'game-management', 'apps', 'invitation-maker', 'invitation', 'undangan', 'guideline', 'panduan', 'forms', 'form-maker', 'biodata', 'contacts', 'media', 'vault', 'files', 'reviews', 'client-voice', 'ratecard', 'pricing', 'whatsapp', 'wa', 'proofing', 'design-proofing', 'poster-promo', 'poster', 'booking', 'schedule', 'calendar', 'whiteboard', 'memo', 'third-party', 'cloud-nexus', 'integrations'];
    return isAnalytics || isVisualEditor || isDatabase || isPortfolio || isSettings || isChat || isCatalog || isLinks || isQr || isNotes || isBlog || isProjects || isProofing || isTransactions || isApps || isGameManagement || isGuideline || isBroadcast || isWhatsApp || isFlipbook || isManagementPortal || isToolsPortal || isPosterPromo || isThirdParty || specialPages.includes(activePage);
  }, [activePage, isAnalytics, isVisualEditor, isDatabase, isPortfolio, isSettings, isChat, isCatalog, isLinks, isQr, isNotes, isBlog, isProjects, isProofing, isTransactions, isApps, isGameManagement, isGuideline, isBroadcast, isWhatsApp, isFlipbook, isManagementPortal, isToolsPortal, isPosterPromo, isThirdParty]);

  const targetPageForContent = selectedPageSlug || activePage;
  const currentBlocks = useMemo(() => (isFullWidthMode) ? [] : (pagesData?.[targetPageForContent] || []), [isFullWidthMode, targetPageForContent, pagesData]);
  const currentStickers = useMemo(() => (isFullWidthMode) ? [] : (stickersData?.[targetPageForContent] || []), [isFullWidthMode, targetPageForContent, stickersData]);
  const selectedIdx = useMemo(() => currentBlocks.findIndex(b => b.id === selectedBlockId), [currentBlocks, selectedBlockId]);

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
    notify('Dibatalkan');
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
    notify('Diulang');
  }, [notify]);

  /* ── Effect: Push History, Flag Unsaved Changes & LOCAL AUTO-SAVE (5s Delay) ── */
  useEffect(() => {
    if (isLoading || !dataLoaded) return;
    const t = setTimeout(() => {
      pushHistory(pagesDataRef.current, stickersDataRef.current, framesData);

      // Auto-Save to Local IndexedDB (5s delay to save tokens & prevent premature saves)
      window.dispatchEvent(new Event('porto_save_start'));
      storage.batchSetItems({
        'porto_pages': pagesDataRef.current,
        'porto_settings': globalSettingsRef.current || globalSettings,
        'porto_stickers': stickersDataRef.current,
        'porto_frames': framesData
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
          }, false);
          await storage.setItem('porto_last_local_backup', now, false);
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
      notify('Blok dihapus');
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
    notify('Stiker dihapus');
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
      notify('Stiker digandakan');
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
      notify(direction === 'up' ? 'Layer dinaikkan' : 'Layer diturunkan');
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
    notify('Halaman baru dibuat');
  }, [globalSettings.customPages, notify]);

  const handleManualSave = useCallback(async () => {
    const currentGlobal = globalSettingsRef.current || globalSettings;
    const currentPages = pagesDataRef.current || pagesData;
    const currentStickers = stickersDataRef.current || stickersData;
    const currentFrames = framesDataRef.current || framesData;
    await performSave(currentPages, currentGlobal, currentStickers, currentFrames, notify, false, setIsSaving);
    await storage.flushAllPendingWrites().catch(() => { });
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
        notify('Blok diduplikasi');
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
    if (activePage === 'blog' || activePage === 'updates' || activePage === 'update') {
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
      notify('Stiker ditambahkan');
    };
    window.addEventListener('porto_sticker_spawn_pos_ready', handleSpawn);
    return () => window.removeEventListener('porto_sticker_spawn_pos_ready', handleSpawn);
  }, [activePage, selectedPageSlug, notify]);

  const handleModeChange = (m) => {
    setCmsMode(m);
    setSelectedBlockId(null);
    setSelectedStickerId(null);
  };

  /* ── Keyboard Shortcuts (unified — includes Ctrl+S, Undo/Redo, etc.) ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+E → Open Studio EcoHub Drawer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        useAdminStore.getState().openDrawer('ecohub');
        return;
      }

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
          notify(next ? 'Zen Mode Aktif (Tekan Z untuk keluar)' : 'Zen Mode Nonaktif');
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
        if (e.key === 'ArrowUp') { e.preventDefault(); handleMoveBlock(selectedBlockId, 'up'); return; }
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
        </div>
      </div>
    );
  }
  if (!isAuth) return <LoginGateway onLoginSuccess={() => setIsAuth(true)} />;

  if (
    userData?.role === 'Pending' ||
    userData?.status === 'Pending' ||
    !userData?.role ||
    !['Super Admin', 'Admin', 'Editor', 'Viewer'].includes(userData?.role)
  ) {
    return (
      <Suspense fallback={null}>
        <WaitingApprovalScreen
          user={auth.currentUser}
          userData={userData}
          onApproved={async (updatedData) => {
            setUserData(updatedData);
            if (!impersonatedUserRef.current) {
              storage.init(updatedData.id, updatedData.dbScope || 'global');
            }
            await fetchMainDataRef.current();
            notifyRef.current('Selamat datang! Akun Anda telah disetujui.', 'success');
          }}
          onSignOut={() => signOut(auth)}
        />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>

      <div
        data-cms-theme={isDarkMode ? 'dark' : 'light'}
        data-theme={isDarkMode ? 'dark' : 'light'}
        className={`${rootClass} cms-dashboard-root ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} ${isZenMode ? 'zen-active' : ''} ${impersonatedUser ? 'impersonation-active' : ''}`}
        onTouchStart={(e) => {
          if ((isMobile || isTablet) && e.touches.length === 1) {
            const t = e.touches[0];
            if (t.clientX <= 24) {
              (e.currentTarget as any)._edgeTouchStart = { x: t.clientX, y: t.clientY };
            } else {
              (e.currentTarget as any)._edgeTouchStart = null;
            }
          }
        }}
        onTouchEnd={(e) => {
          const start = (e.currentTarget as any)._edgeTouchStart;
          if (start && e.changedTouches.length === 1) {
            const t = e.changedTouches[0];
            const deltaX = t.clientX - start.x;
            const deltaY = Math.abs(t.clientY - start.y);
            (e.currentTarget as any)._edgeTouchStart = null;
            if (deltaX > 64 && deltaY < 45) {
              if (activePage !== 'dashboard' || activeSidebar || isSidebarExpanded || selectedBlockId || selectedStickerId || selectedPageSlug) {
                handleBackStep();
              } else {
                haptic.light();
                window.dispatchEvent(new Event('cms_sidebar_toggle_request'));
              }
            }
          }
        }}
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
        <Suspense fallback={null}>
          <NotificationCenter onSwitchPage={handleSwitchPage} />
        </Suspense>
        <AdminPwaSuggestion />

        <div className="cms-main-container">
          {/* Mobile Header: Dynamic Page Title + Contextual Right Actions (or Top Pull-Handle when hidden) */}
          {mobileHeaderMode === 'hide' && (isMobile || isTablet) && (
            <button
              type="button"
              aria-label="Buka Control Panel"
              title="Ketuk atau geser turun untuk membuka Control Panel"
              onClick={() => {
                haptic.light();
                setIsMobileControlOpen(prev => !prev);
              }}
              onTouchStart={(e) => {
                (e.currentTarget as any)._hdrTouchY = e.touches[0].clientY;
                (e.currentTarget as any)._hdrTouchTime = Date.now();
                pendingHeaderPullYRef.current = 0;
                setIsHeaderDragging(true);
              }}
              onTouchMove={(e) => {
                const startY = (e.currentTarget as any)._hdrTouchY;
                if (typeof startY !== 'number') return;
                const dy = e.touches[0].clientY - startY;
                const next = dy > 0 ? Math.min(240, dy) : 0;
                if (Math.abs(next - pendingHeaderPullYRef.current) < 2) return;
                pendingHeaderPullYRef.current = next;
                if (headerPullRafRef.current === null) {
                  headerPullRafRef.current = requestAnimationFrame(() => {
                    headerPullRafRef.current = null;
                    setHeaderPullY(pendingHeaderPullYRef.current);
                  });
                }
              }}
              onTouchEnd={(e) => {
                if (headerPullRafRef.current !== null) {
                  cancelAnimationFrame(headerPullRafRef.current);
                  headerPullRafRef.current = null;
                }
                const startY = (e.currentTarget as any)._hdrTouchY;
                const elapsed = Date.now() - ((e.currentTarget as any)._hdrTouchTime || Date.now());
                setIsHeaderDragging(false);
                if (typeof startY === 'number') {
                  const dy = e.changedTouches[0].clientY - startY;
                  const isFastSwipe = elapsed < 260;
                  if (dy > 40 || (isFastSwipe && dy > 20)) {
                    haptic.light();
                    setIsMobileControlOpen(true);
                  }
                }
                pendingHeaderPullYRef.current = 0;
                setHeaderPullY(0);
                (e.currentTarget as any)._hdrTouchY = null;
              }}
              style={{
                position: 'fixed',
                top: 'env(safe-area-inset-top, 0px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 24,
                zIndex: 9995,
                background: 'transparent',
                border: 'none',
                padding: '6px 0 0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                cursor: 'pointer',
                touchAction: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 9999,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(15, 23, 42, 0.24)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                }}
              />
            </button>
          )}
          {mobileHeaderMode !== 'hide' && (
            <div
              className={`cms-mobile-header ${(isMobileControlOpen || (isHeaderDragging && headerPullY > 4)) ? 'panel-active' : ''}`}
              style={{
                position: 'relative',
                zIndex: (isMobileControlOpen || isHeaderDragging) ? 100000001 : 20,
                borderBottomColor: (isMobileControlOpen || (isHeaderDragging && headerPullY > 4)) ? 'transparent' : undefined,
              }}
              onTouchStart={(e) => {
                (e.currentTarget as any)._hdrTouchY = e.touches[0].clientY;
                (e.currentTarget as any)._hdrTouchTime = Date.now();
                pendingHeaderPullYRef.current = 0;
                setIsHeaderDragging(true);
              }}
              onTouchMove={(e) => {
                const startY = (e.currentTarget as any)._hdrTouchY;
                if (typeof startY !== 'number') return;
                const dy = e.touches[0].clientY - startY;
                const next = !isMobileControlOpen
                  ? (dy > 0 ? Math.min(240, dy) : 0)
                  : (dy < 0 ? Math.max(-240, dy) : 0);
                if (Math.abs(next - pendingHeaderPullYRef.current) < 2) return;
                pendingHeaderPullYRef.current = next;
                if (headerPullRafRef.current === null) {
                  headerPullRafRef.current = requestAnimationFrame(() => {
                    headerPullRafRef.current = null;
                    setHeaderPullY(pendingHeaderPullYRef.current);
                  });
                }
              }}
              onTouchEnd={(e) => {
                if (headerPullRafRef.current !== null) {
                  cancelAnimationFrame(headerPullRafRef.current);
                  headerPullRafRef.current = null;
                }
                const startY = (e.currentTarget as any)._hdrTouchY;
                const elapsed = Date.now() - ((e.currentTarget as any)._hdrTouchTime || Date.now());
                setIsHeaderDragging(false);
                if (typeof startY === 'number') {
                  const dy = e.changedTouches[0].clientY - startY;
                  const isFastSwipe = elapsed < 260;
                  if (!isMobileControlOpen && (dy > 54 || (isFastSwipe && dy > 24))) {
                    haptic.light();
                    setIsMobileControlOpen(true);
                  } else if (isMobileControlOpen && (dy < -50 || (isFastSwipe && dy < -22))) {
                    haptic.light();
                    setIsMobileControlOpen(false);
                  }
                }
                pendingHeaderPullYRef.current = 0;
                setHeaderPullY(0);
                (e.currentTarget as any)._hdrTouchY = null;
              }}
              onTouchCancel={() => {
                if (headerPullRafRef.current !== null) {
                  cancelAnimationFrame(headerPullRafRef.current);
                  headerPullRafRef.current = null;
                }
                pendingHeaderPullYRef.current = 0;
                setIsHeaderDragging(false);
                setHeaderPullY(0);
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, height: 28 }}>
                <span
                  className="cms-header-title"
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: 'var(--cms-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    opacity: isMobileControlOpen ? 0 : (isHeaderDragging && headerPullY > 0 ? Math.max(0, 1 - headerPullY / 110) : 1),
                    transform: isMobileControlOpen ? 'translateY(-6px)' : `translateY(${isHeaderDragging && headerPullY > 0 ? (-Math.min(6, headerPullY / 20)) : 0}px)`,
                    transition: isHeaderDragging ? 'none' : 'opacity 0.24s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {(() => {
                    const p = (activePage || 'dashboard').toLowerCase();
                    if (PAGE_LABELS[p]) return PAGE_LABELS[p];
                    if (p === 'dashboard') return 'Studio Hub';
                    if (p === 'content-database') return 'Database';
                    if (p === 'poster-promo' || p === 'poster' || p === 'studio-poster') return 'Poster Promo';
                    if (p === 'settings') return 'Pengaturan';
                    if (p === 'forms' || p === 'form-maker') return 'Form Builder';
                    if (p === 'biodata') return 'Biodata';
                    if (p === 'contacts') return 'Kontak';
                    if (p === 'reviews' || p === 'client-voice') return 'Ulasan Klien';
                    if (p === 'ratecard' || p === 'rate-card' || p === 'pricing') return 'Rate Card';
                    if (p === 'lpimage' || p.startsWith('lpimage')) return 'LP Image';
                    return p.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                  })()}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    fontSize: 17,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: 'var(--cms-text)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    opacity: isMobileControlOpen ? 1 : (isHeaderDragging && headerPullY > 0 ? Math.min(1, headerPullY / 110) : 0),
                    transform: isMobileControlOpen ? 'translateY(0)' : `translateY(${isHeaderDragging && headerPullY > 0 ? Math.max(0, 6 - headerPullY / 20) : 6}px)`,
                    transition: isHeaderDragging ? 'none' : 'opacity 0.24s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  Panel Kontrol
                </span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: isMobileControlOpen ? 0 : (isHeaderDragging && headerPullY > 0 ? Math.max(0, 1 - headerPullY / 110) : 1),
                    transform: isMobileControlOpen ? 'scale(0.75)' : `scale(${isHeaderDragging && headerPullY > 0 ? Math.max(0.75, 1 - headerPullY / 440) : 1})`,
                    pointerEvents: isMobileControlOpen ? 'none' : 'auto',
                    transition: isHeaderDragging ? 'none' : 'opacity 0.24s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  {mobileDockMode === '6' && (
                    <>
                      <button
                        type="button"
                        className="cms-circle-btn"
                        onClick={() => window.open('/', '_blank')}
                        title="Lihat Website Publik"
                        aria-label="Lihat Website Publik"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'var(--cms-switcher-bg)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Globe2 size={18} strokeWidth={2.3} />
                      </button>
                      <button
                        type="button"
                        className="cms-circle-btn"
                        onClick={() => handleSwitchPage('settings')}
                        title="Pengaturan"
                        aria-label="Pengaturan"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: isSettings ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                          border: '1px solid var(--glass-border)',
                          color: isSettings ? '#fff' : 'var(--cms-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Settings2 size={18} strokeWidth={2.3} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="cms-circle-btn"
                    onClick={() => setIsGlobalSearchOpen(true)}
                    title="Pencarian Global & AI"
                    aria-label="Pencarian Global & AI"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--cms-switcher-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Search size={18} strokeWidth={2.3} />
                  </button>
                  <button
                    type="button"
                    className="cms-circle-btn"
                    onClick={() => setIsMobileControlOpen(true)}
                    title="Panel Kontrol"
                    aria-label="Panel Kontrol"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: isMobileControlOpen ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                      border: '1px solid var(--glass-border)',
                      color: isMobileControlOpen ? '#fff' : 'var(--cms-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <SlidersHorizontal size={18} strokeWidth={2.3} />
                  </button>
                </div>
                <button
                  type="button"
                  className="cms-circle-btn"
                  onClick={() => setIsMobileControlOpen(false)}
                  title="Tutup Panel Kontrol"
                  aria-label="Tutup Panel Kontrol"
                  style={{
                    position: 'absolute',
                    right: 0,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--cms-switcher-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: isMobileControlOpen ? 1 : (isHeaderDragging && headerPullY > 0 ? Math.min(1, headerPullY / 110) : 0),
                    transform: isMobileControlOpen ? 'scale(1)' : `scale(${isHeaderDragging && headerPullY > 0 ? Math.min(1, 0.72 + headerPullY / 400) : 0.72})`,
                    pointerEvents: isMobileControlOpen ? 'auto' : 'none',
                    transition: isHeaderDragging ? 'none' : 'opacity 0.24s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <X size={18} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          )}

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
            <div
              ref={workAreaRef}
              className={`cms-work-area ${(isNotes || isProofing) ? 'cms-work-area-notes' : ''} ${isPosterPromo ? 'cms-work-area-fullbleed' : ''}`}
              style={{
                position: 'relative',
                overflowX: 'clip',
                overflowY: (isNotes || isProofing || isPosterPromo) ? 'hidden' : 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >

              <div style={{ flex: 1, minHeight: 0, overflowX: 'clip', overflowY: (isNotes || isProofing || isPosterPromo) ? 'hidden' : 'visible', display: 'flex', flexDirection: 'column' }}>
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
                    className={`cms-page-theme-fade ${isNotes ? 'cms-page-theme-fade-notes' : ''}`}
                    style={{
                      flex: 1,
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      paddingBottom: 0
                    }}
                  >
                    <ErrorBoundary key={`eb_${activePage}`} fallbackTitle={`Kendala pada modul ${PAGE_LABELS[activePage] || activePage}`}>
                      {!isPageAllowed ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '65vh',
                          textAlign: 'center',
                          padding: '40px 20px',
                          color: isDarkMode ? '#f8fafc' : '#0f172a'
                        }}>
                          <div style={{
                            width: 76,
                            height: 76,
                            borderRadius: 20,
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20,
                            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.15)'
                          }}>
                            <ShieldAlert size={38} color="#ef4444" />
                          </div>
                          <div style={{
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            padding: '4px 14px',
                            borderRadius: 100,
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            marginBottom: 12
                          }}>
                            403 Forbidden
                          </div>
                          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px 0' }}>Akses Fitur Terbatas</h2>
                          <p style={{ maxWidth: 460, fontSize: 14, opacity: 0.75, lineHeight: 1.6, margin: '0 0 24px 0' }}>
                            Akun Anda (<strong>{effectiveUser?.name || effectiveUser?.email}</strong> &bull; <span style={{ color: 'var(--cms-accent, #7c3aed)', fontWeight: 700 }}>{effectiveUser?.role}</span>) tidak memiliki izin akses ke modul <code>/{activePage}</code>.
                          </p>
                          <button
                            onClick={() => handleSwitchPage('dashboard')}
                            style={{
                              padding: '10px 22px',
                              borderRadius: 12,
                              background: 'var(--cms-accent, #7c3aed)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)'
                            }}
                          >
                            <House size={16} /> Kembali ke Dashboard
                          </button>
                        </div>
                      ) : activePage === 'dashboard' ? (
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
                      ) : (activePage === 'proofing' || activePage === 'design-proofing') ? (
                        <ProofingManager
                          notify={notify}
                          confirm={confirmAction}
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
                      ) : (activePage === 'analytics' || activePage === 'intelligence' || activePage === 'traffic') ? (
                        <StudioIntelligenceAnalytics
                          onSwitchPage={handleSwitchPage}
                          notify={notify}
                        />
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
                      ) : (isApps || isGameManagement) ? (
                        <AppsManager
                          initialAppId={
                            (activePage === 'invitation-maker' ||
                              activePage === 'invitation' ||
                              activePage === 'undangan' ||
                              location.pathname.includes('/invitation') ||
                              location.pathname.includes('/undangan') ||
                              new URLSearchParams(location.search).get('app') === 'invitation-maker')
                              ? 'invitation-maker'
                              : undefined
                          }
                          onNavigate={handleSwitchPage}
                          onBack={() => handleSwitchPage('database')}
                        />
                      ) : isGuideline ? (
                        <GuidelinePage
                          onSwitchPage={handleSwitchPage}
                          isEmbeddedInAdmin={true}
                          isDarkMode={isDarkMode}
                        />
                      ) : isManagementPortal ? (
                        <ManagementPortal
                          onNavigate={handleSwitchPage}
                          notify={notify}
                          isDarkMode={isDarkMode}
                        />
                      ) : isThirdParty ? (
                        <ThirdPartyIntegrationsHub
                          onNavigate={handleSwitchPage}
                          notify={notify}
                          isDarkMode={isDarkMode}
                        />
                      ) : isToolsPortal ? (
                        <ToolsPortal
                          onNavigate={handleSwitchPage}
                          notify={notify}
                          isDarkMode={isDarkMode}
                        />
                      ) : isPosterPromo ? (
                        <SocialPosterStudio
                          onNavigate={handleSwitchPage}
                          notify={notify}
                          isDarkMode={isDarkMode}
                        />
                      ) : isDatabase ? (
                        <DatabasePortal
                          initialSubTab={
                            (activePage === 'forms' || activePage === 'form-maker' || activePage === 'database_forms') ? 'forms' :
                              (activePage === 'biodata' || activePage === 'database_biodata') ? 'biodata' :
                                (activePage === 'contacts' || activePage === 'database_contacts') ? 'contacts' :
                                  (activePage === 'links' || activePage === 'database_links') ? 'links' :
                                    (activePage === 'broadcast' || activePage === 'database_broadcast' || activePage === 'push') ? 'broadcast' :
                                      (activePage === 'media' || activePage === 'vault' || activePage === 'files') ? 'media' :
                                        (activePage === 'reviews' || activePage === 'client-voice') ? 'reviews' :
                                          (activePage === 'ratecard' || activePage === 'rate-card' || activePage === 'pricing') ? 'ratecard' : 'hub'
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
                          initialViewMode={(activePage === 'booking' || activePage === 'schedule' || activePage === 'calendar') ? 'schedule' : undefined}
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
                      ) : isFlipbook ? (
                        <FlipbookStudio
                          notify={notify}
                          confirm={confirmAction}
                          onNavigate={handleSwitchPage}
                        />
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
                      ) : isWhatsApp ? (
                        <WhatsAppStudio />
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
                              backdropFilter: 'none',
                              WebkitBackdropFilter: 'none',
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
                    </ErrorBoundary>
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
                        notify('Halaman dihapus');
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
                          notify('Halaman dihapus');
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
        {(() => {
          const dockItems = [
            ...(!isFullWidthMode ? [{
              key: 'left',
              title: 'Buka Sidebar Kiri (Toolkit & Blok)',
              ariaLabel: 'Buka Sidebar Kiri',
              isActive: activeSidebar === 'left',
              icon: <Plus size={26} strokeWidth={2.4} />,
              onSelect: () => setActiveSidebar(prev => prev === 'left' ? null : 'left'),
            }] : []),
            {
              key: 'dashboard',
              title: 'Studio Hub',
              ariaLabel: 'Studio Hub',
              isActive: activePage === 'dashboard',
              icon: <LayoutDashboard size={25} strokeWidth={2.2} />,
              onSelect: () => handleSwitchPage('dashboard'),
            },
            {
              key: 'management',
              title: 'Manajemen',
              ariaLabel: 'Manajemen',
              isActive: isManagementPortal || isProjects || isTransactions || activePage === 'users' || isChat,
              icon: <FolderKanban size={25} strokeWidth={2.2} />,
              onSelect: () => handleSwitchPage('management'),
            },
            {
              key: 'content-database',
              title: 'Database',
              ariaLabel: 'Database',
              isActive: isDatabase || isPortfolio || isBlog || isCatalog,
              icon: <Database size={25} strokeWidth={2.2} />,
              onSelect: () => handleSwitchPage('content-database'),
            },
            {
              key: 'tools',
              title: 'Tool',
              ariaLabel: 'Tool',
              isActive: isToolsPortal || isVisualEditor || isLinks || isQr || isNotes || isApps || isGameManagement || isPosterPromo,
              icon: <Layers size={25} strokeWidth={2.2} />,
              onSelect: () => handleSwitchPage('tools'),
            },
            ...(mobileDockMode === '6' && isFullWidthMode ? [
              {
                key: 'settings',
                title: 'Setting',
                ariaLabel: 'Setting',
                isActive: isSettings,
                icon: <Settings2 size={24} strokeWidth={2.2} />,
                onSelect: () => handleSwitchPage('settings'),
              },
              {
                key: 'web',
                title: 'Lihat Website Publik',
                ariaLabel: 'Lihat Website Publik',
                isActive: false,
                icon: <Globe2 size={24} strokeWidth={2.2} />,
                onSelect: () => window.open('/', '_blank'),
              },
            ] : []),
            ...(!isFullWidthMode ? [{
              key: 'right',
              title: 'Buka Sidebar Kanan (Pengaturan Halaman)',
              ariaLabel: 'Buka Sidebar Kanan',
              isActive: activeSidebar === 'right',
              icon: <Settings2 size={24} strokeWidth={2.2} />,
              onSelect: () => setActiveSidebar(prev => prev === 'right' ? null : 'right'),
            }] : []),
          ];
          const activeDockIdx = dockItems.findIndex(item => item.isActive);
          const count = dockItems.length;

          return (
            <div
              className={`cms-mobile-navbar ios-dock ${((mobileDockMode === '6' && isFullWidthMode) || !isFullWidthMode) ? 'ios-dock-6' : ''}`}
              style={{ pointerEvents: 'auto' }}
              onClickCapture={(e) => {
                if (dockTouchStateRef.current.suppressClick) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if ((e.target as HTMLElement)?.closest('button')) {
                  haptic.light();
                }
              }}
            >
              <div
                ref={dockInnerRef}
                className="cms-navbar-inner"
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  dockTouchStateRef.current.startX = t.clientX;
                  dockTouchStateRef.current.startY = t.clientY;
                  dockTouchStateRef.current.dragging = false;
                  dockTouchStateRef.current.lastHoverIdx = activeDockIdx;
                  dockTouchStateRef.current.targetIdx = activeDockIdx;
                }}
                onTouchMove={(e) => {
                  const st = dockTouchStateRef.current;
                  const t = e.touches[0];
                  const dx = t.clientX - st.startX;
                  const dy = t.clientY - st.startY;
                  if (!st.dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
                    st.dragging = true;
                  }
                  if (!st.dragging) return;
                  const rect = dockInnerRef.current?.getBoundingClientRect();
                  const ind = dockIndicatorRef.current;
                  if (!rect || !ind || count <= 0) return;
                  const rawPos = Math.max(0, Math.min(count - 1, ((t.clientX - rect.left) / rect.width) * count - 0.5));
                  ind.style.transition = 'none';
                  ind.style.opacity = '1';
                  ind.style.transform = `translate3d(${(rawPos * 100).toFixed(2)}%, 0, 0)`;
                  const hoverIdx = Math.round(rawPos);
                  st.targetIdx = hoverIdx;
                  if (hoverIdx !== st.lastHoverIdx) {
                    st.lastHoverIdx = hoverIdx;
                    haptic.selection();
                  }
                }}
                onTouchEnd={() => {
                  const st = dockTouchStateRef.current;
                  const ind = dockIndicatorRef.current;
                  if (ind) ind.style.transition = '';
                  if (st.dragging) {
                    const target = st.targetIdx >= 0 ? st.targetIdx : activeDockIdx;
                    if (ind && target >= 0) {
                      ind.style.transform = `translate3d(${target * 100}%, 0, 0)`;
                    }
                    st.suppressClick = true;
                    setTimeout(() => { dockTouchStateRef.current.suppressClick = false; }, 100);
                    if (target >= 0 && target !== activeDockIdx) {
                      haptic.light();
                      dockItems[target]?.onSelect();
                    }
                  }
                  st.dragging = false;
                }}
                onTouchCancel={() => {
                  const st = dockTouchStateRef.current;
                  const ind = dockIndicatorRef.current;
                  if (ind) {
                    ind.style.transition = '';
                    if (activeDockIdx >= 0) {
                      ind.style.transform = `translate3d(${activeDockIdx * 100}%, 0, 0)`;
                    }
                  }
                  st.dragging = false;
                }}
              >
                <div
                  ref={dockIndicatorRef}
                  className="ios-dock-indicator"
                  style={{
                    width: `calc(100% / ${count})`,
                    transform: `translate3d(${Math.max(0, activeDockIdx) * 100}%, 0, 0)`,
                    opacity: activeDockIdx >= 0 ? 1 : 0,
                  }}
                />
                {dockItems.map((item) => (
                  <button
                    key={item.key}
                    className={`cms-mobile-nav-btn ${item.isActive ? 'active' : ''}`}
                    onClick={item.onSelect}
                    title={item.title}
                    aria-label={item.ariaLabel}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

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

        {isCommandPaletteOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}

        {/* Universal Social Media Promo Poster Studio is now integrated as full page view (isPosterPromo) */}

        {/* ── KEYBOARD SHORTCUTS CHEAT SHEET MODAL ── */}
        {isShortcutsModalOpen && (
          <div
            onClick={() => setIsShortcutsModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              animation: 'cmsFadeIn 0.2s ease-out'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 520,
                background: 'var(--cms-card-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: 22,
                padding: '24px 26px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 18
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>
                      Pintasan Keyboard Studio
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                      Navigasi dan aksi cepat tanpa mouse
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShortcutsModalOpen(false)}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Shortcuts Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    title: 'Navigasi Global',
                    items: [
                      { keys: ['Ctrl', 'K'], label: 'Command Palette Universal' },
                      { keys: ['?'], label: 'Buka / Tutup Panduan Pintasan Ini' },
                      { keys: ['Esc'], label: 'Tutup Modal / Batal Dialog' }
                    ]
                  },
                  {
                    title: 'Akses Cepat Modul (Tekan G lalu tombol)',
                    items: [
                      { keys: ['G', 'P'], label: 'Buka Proyek & Konten' },
                      { keys: ['G', 'F'], label: 'Buka Keuangan & Transaksi' },
                      { keys: ['G', 'C'], label: 'Buka Katalog Toko / Drops' },
                      { keys: ['G', 'D'], label: 'Kembali ke Dashboard Utama' }
                    ]
                  },
                  {
                    title: 'Studio & Keamanan',
                    items: [
                      { keys: ['Eye Icon'], label: 'Mode Privasi (Sensor Omset Keuangan)' },
                      { keys: ['ZIP Button'], label: 'Unduh 1-Klik Semua Berkas Proyek' }
                    ]
                  }
                ].map((sec, sIdx) => (
                  <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {sec.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {sec.items.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: 10,
                            background: 'var(--cms-input-bg)'
                          }}
                        >
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--cms-text)' }}>
                            {item.label}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {item.keys.map((k, kIdx) => (
                              <kbd
                                key={kIdx}
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: 6,
                                  background: 'var(--cms-card-bg)',
                                  border: '1px solid var(--glass-border)',
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  color: 'var(--cms-accent)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
        {isAiTemplateModalOpen && (
          <Suspense fallback={null}>
            <AiTemplateStudioModal
              isOpen={isAiTemplateModalOpen}
              onClose={() => setIsAiTemplateModalOpen(false)}
              isDarkMode={isDarkMode}
              onNavigate={handleSwitchPage}
            />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <MobileControlPanel
            isOpen={isMobileControlOpen}
            onClose={() => setIsMobileControlOpen(false)}
            onSwitchPage={handleSwitchPage}
            onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
            onOpenSync={() => setIsSyncModalOpen(true)}
            onSignOut={() => { signOut(auth); setIsAuth(false); }}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            externalDragY={headerPullY}
            isExternalDragging={isHeaderDragging}
          />
        </Suspense>

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

        {/* ── VERSION HISTORY MODAL (Time Travel Rollback) ── */}
        {isVersionHistoryOpen && (
          <>
            <div
              onClick={() => setIsVersionHistoryOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                zIndex: 99999,
                animation: 'fadeIn 0.2s ease'
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '92%',
                maxWidth: 600,
                maxHeight: '85vh',
                background: 'var(--cms-card-bg, #171824)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: 24,
                boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
                zIndex: 100000,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--cms-accent, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <History size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--cms-text)' }}>
                      Riwayat Versi Halaman (Time Travel)
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
                      Pulihkan struktur blok & halaman ke titik penyimpanan sebelumnya
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVersionHistoryOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Snapshot List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {snapshotsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--cms-text-muted)' }}>
                    <History size={36} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cms-text)' }}>Belum Ada Snapshot Riwayat</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Snapshot otomatis dibuat setiap kali Anda mengklik tombol "Simpan" di Visual Builder.</div>
                  </div>
                ) : (
                  snapshotsList.map((snap, idx) => (
                    <div
                      key={snap.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 16,
                        border: '1px solid var(--glass-border)',
                        background: idx === 0 ? 'rgba(99, 102, 241, 0.08)' : 'var(--cms-input-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                            {new Date(snap.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} pukul {new Date(snap.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {idx === 0 && (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'var(--cms-accent, #6366f1)', color: '#fff' }}>
                              Terbaru
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', display: 'flex', gap: 10 }}>
                          <span>{snap.blockCount || 0} Blok Media</span>
                          <span>{snap.pageCount || 0} Halaman</span>
                          <span>{snap.author || "Admin"}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isRestoringSnap}
                        onClick={() => handleRollbackSnapshot(snap)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 100,
                          border: 'none',
                          background: 'var(--cms-accent, #6366f1)',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: isRestoringSnap ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Rollback</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                <button
                  type="button"
                  onClick={() => setIsVersionHistoryOpen(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 100,
                    border: '1px solid var(--glass-border)',
                    background: 'transparent',
                    color: 'var(--cms-text-muted)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── MULTITASKING SLIDE-OVER QUICK ACTION DRAWER ── */}
        <Suspense fallback={null}>
          <QuickActionDrawer
            isDarkMode={isDarkMode}
            onNavigate={handleSwitchPage}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

const CmsDashboard: React.FC = () => (
  <DialogProvider>
    <CmsDashboardContent />
  </DialogProvider>
);

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
      'porto_pages': pagesData,
      'porto_settings': settingsToSave,
      'porto_stickers': stickersData,
      'porto_frames': framesData,
    }, true);

    window.dispatchEvent(new Event('porto_saved'));
    window.dispatchEvent(new Event('porto_stickers_updated'));
    if (notify && !silent) notify('Semua data tersimpan ke Cloud');

    // Push to Firestore notification log on manual (non-silent) saves
    if (!silent) {
      const totalBlocks = Object.values(pagesData || {}).reduce((sum, arr) => sum + (arr || []).length, 0);
      notifySave(totalBlocks).catch(() => { });
      import('../../utils/studioBackup')
        .then(({ createContentSnapshot }) => createContentSnapshot('Admin Studio', 'Penyimpanan Versi Otomatis'))
        .catch(() => { });
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

