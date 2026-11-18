import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Globe, Globe2, FolderKanban, Settings2, LogOut, 
  ExternalLink, Zap, StickyNote, Grid, Bell, ChevronLeft, ChevronRight, 
  MessageSquareMore, Database, Users, Download, MessageCircle,
  Receipt, Search, Cloud, HardDrive, CheckCircle2, AlertCircle, FileText, RefreshCw,
  Shield, ShieldCheck, WifiOff, Link2, QrCode, Megaphone, X, Calendar, History, Clock, ArrowRight,
  Star, Store, Layers, Gamepad2, LayoutGrid, Sun, Moon, Image as ImageIcon, Circle,
  FileSpreadsheet, Fingerprint, Quote, Activity, Compass, Sparkles, BookOpen,
  LayoutTemplate, CloudLightning
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { subscribeToNotifications } from '../../utils/notifications';
import { storage } from '../../utils/storage';
import { getUpdatedPages, clearPageUpdateDot, clearAllUpdateDots } from '../../utils/multiUserSync';
import { triggerPwaInstall } from './AdminPwaSuggestion';
import MediaGalleryModal from './MediaGalleryModal';
import { haptic } from '../../utils/haptics';

const NAV_SECTIONS = [
  {
    title: 'Navigasi Studio',
    items: [
      { key: 'dashboard', label: 'Studio Hub', icon: <LayoutDashboard size={20} strokeWidth={2} />, action: 'dashboard' },
      { key: 'management', label: 'Manajemen', icon: <FolderKanban size={20} strokeWidth={2} />, action: 'management' },
      { key: 'content-database', label: 'Database', icon: <Database size={20} strokeWidth={2} />, action: 'database' },
      { key: 'tools', label: 'Tool', icon: <Layers size={20} strokeWidth={2} />, action: 'tools' },
      { key: 'settings', label: 'Setting', icon: <Settings2 size={20} strokeWidth={2} />, action: 'settings' },
    ]
  }
];

interface AdminSidebarProps {
  activePage: string;
  onSwitchPage: (page: string) => void;
  onSignOut?: () => void;
  pages?: any[];
  userData?: any;
  onToggleAi?: () => void;
  globalSettings?: any;
  isImpersonating?: boolean;
  onExitImpersonation?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activePage, 
  onSwitchPage, 
  onSignOut, 
  pages = [], 
  userData, 
  onToggleAi, 
  globalSettings, 
  isImpersonating, 
  onExitImpersonation,
  isDarkMode,
  onToggleDarkMode
}) => {
  const systemPages = useMemo(() => [
    { name: 'Home Canvas', slug: 'home' }
  ], []);
  const allBuilderPages = useMemo(() => [
    ...systemPages,
    ...pages.filter((p: any) => !['home', 'portofolio', 'portfolio', 'biodata', 'contacts', 'database', 'settings', 'projects', 'notes', 'transactions', 'chat', 'users', 'pricing', 'catalog', 'blog'].includes(p.slug))
  ], [systemPages, pages]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [cmsBranding, setCmsBranding] = useState({ name: 'sumr.day OS', logoIcon: null });
  const [syncMode, setSyncMode] = useState(() => (localStorage.getItem('porto_sync_mode') || 'auto'));
  const [updatedPages, setUpdatedPages] = useState<Record<string, boolean>>(getUpdatedPages);
  const [isStandalone, setIsStandalone] = useState(() => (
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  ));
  const [showMediaVault, setShowMediaVault] = useState(false);
  const [mediaVaultInitialTab, setMediaVaultInitialTab] = useState<'all' | 'image' | 'video' | 'unsplash' | 'logo-fetch'>('all');

  useEffect(() => {
    const handleOpenVault = (e: any) => {
      if (e.detail?.tab) setMediaVaultInitialTab(e.detail.tab);
      setShowMediaVault(true);
    };
    window.addEventListener('porto_open_media_vault', handleOpenVault);
    return () => window.removeEventListener('porto_open_media_vault', handleOpenVault);
  }, []);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('cms_sidebar_expanded');
    if (saved === null) return window.innerWidth > 1200;
    return saved === 'true';
  });

  const isDark = isDarkMode !== undefined ? isDarkMode : (typeof localStorage !== 'undefined' ? localStorage.getItem('cms_dark_mode') !== 'false' : true);

  const [showCollapsedTools, setShowCollapsedTools] = useState(false);
  const [flyoutPos, setFlyoutPos] = useState<{ bottom: number; left: number } | null>(null);
  const toolBtnRef = useRef<HTMLButtonElement>(null);
  const flyoutMenuRef = useRef<HTMLDivElement>(null);

  const calculateFlyoutPos = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768) {
      setFlyoutPos({
        left: Math.round(window.innerWidth / 2),
        bottom: 82
      });
      return;
    }
    const frame = document.querySelector('.cms-main-container') || document.querySelector('.cms-body-wrapper');
    if (frame) {
      const frameRect = frame.getBoundingClientRect();
      // Exactly 20px gap from the main frame's left border & bottom border, precisely like NotificationCenter in Gambar 2
      const left = Math.min(frameRect.left + 20, window.innerWidth - 260);
      const bottom = Math.max(20, (window.innerHeight - frameRect.bottom) + 20);
      setFlyoutPos({ left, bottom });
    } else if (toolBtnRef.current) {
      const rect = toolBtnRef.current.getBoundingClientRect();
      setFlyoutPos({
        bottom: 36,
        left: rect.right + 20
      });
    }
  }, []);

  const toggleCollapsedTools = useCallback(() => { haptic.light();
    calculateFlyoutPos();
    setShowCollapsedTools(prev => !prev);
  }, [calculateFlyoutPos]);

  useEffect(() => {
    if (!showCollapsedTools) return;
    const handleResize = () => calculateFlyoutPos();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showCollapsedTools, calculateFlyoutPos]);

  useEffect(() => {
    if (!showCollapsedTools) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        flyoutMenuRef.current && !flyoutMenuRef.current.contains(target) &&
        toolBtnRef.current && !toolBtnRef.current.contains(target)
      ) {
        setShowCollapsedTools(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCollapsedTools]);

  useEffect(() => {
    if (!isExpanded) setShowCollapsedTools(false);
  }, [isExpanded]);

  useEffect(() => {
    // Initial mount: bersihkan sisa dot lama jika tidak ada event nyata
    const handleDots = (e: any) => {
      if (e.detail) setUpdatedPages(e.detail);
      else setUpdatedPages(getUpdatedPages());
    };
    window.addEventListener('porto_page_dots_updated', handleDots);
    return () => window.removeEventListener('porto_page_dots_updated', handleDots);
  }, []);

  useEffect(() => {
    if (activePage) {
      clearPageUpdateDot(activePage);
      if (activePage === 'memo' || activePage === 'whiteboard') clearPageUpdateDot('notes');
      if (activePage.startsWith('settings')) clearPageUpdateDot('settings');
      if (activePage === 'dashboard') clearAllUpdateDots();
    }
  }, [activePage]);

  useEffect(() => {
    const handleSyncMode = (e) => {
      if (e.detail?.mode) setSyncMode(e.detail.mode);
      else if (typeof localStorage !== 'undefined') setSyncMode(localStorage.getItem('porto_sync_mode') || 'auto');
    };
    const handleSettingsUpdated = (e) => {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_sync_mode') : null;
      if (stored) {
        setSyncMode(stored);
      } else if (e.detail?.syncMode) {
        setSyncMode(e.detail.syncMode);
      }
    };
    window.addEventListener('porto_sync_mode_changed', handleSyncMode);
    window.addEventListener('porto_settings_updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('porto_sync_mode_changed', handleSyncMode);
      window.removeEventListener('porto_settings_updated', handleSettingsUpdated);
    };
  }, []);

  const cycleSyncMode = useCallback(() => {
    window.dispatchEvent(new Event('porto_open_sync_modal'));
  }, []);

  const [mobilePanelMode, setMobilePanelMode] = useState<'menu' | 'tools'>('menu');

  useEffect(() => {
    if (!isExpanded) {
      setMobilePanelMode('menu');
    }
  }, [isExpanded]);

  const [sidebarConfig, setSidebarConfig] = useState(() => ({
    style: globalSettings?.sidebarConfig?.style || 'floating',
    density: globalSettings?.sidebarConfig?.density || 'comfortable',
    showLogo: globalSettings?.sidebarConfig?.showLogo !== false,
    showSectionHeaders: globalSettings?.sidebarConfig?.showSectionHeaders !== false,
    hiddenMenus: Array.isArray(globalSettings?.sidebarConfig?.hiddenMenus) ? globalSettings.sidebarConfig.hiddenMenus : [],
  }));

  useEffect(() => {
    if (globalSettings?.sidebarConfig) {
      setSidebarConfig(prev => ({ ...prev, ...globalSettings.sidebarConfig }));
    }
  }, [globalSettings]);

  useEffect(() => {
    const handleSidebarConfigChanged = (e: any) => {
      if (e.detail?.sidebarConfig) {
        setSidebarConfig(e.detail.sidebarConfig);
      }
    };
    window.addEventListener('porto_sidebar_config_changed', handleSidebarConfigChanged);
    return () => window.removeEventListener('porto_sidebar_config_changed', handleSidebarConfigChanged);
  }, []);

  const filteredNavSections = useMemo(() => {
    if (!userData) return [];
    const hidden = sidebarConfig.hiddenMenus || [];
    return NAV_SECTIONS.map(section => {
      const allowedItems = section.items.filter(item => {
        if (hidden.includes(item.key)) return false;
        if (userData.role === 'Super Admin') return true;
        if (item.key === 'users' || item.key === 'storage') return false;
        if (item.key === 'global-search' || item.key === 'builder' || item.key === 'management' || item.key === 'tools' || item.key === 'content-database') return true;
        const checkKey = item.key === 'builder' ? 'pages' : (item.key === 'content-database' ? 'database' : item.key);
        return (userData.allowedPages || []).includes(checkKey);
      });
      return { ...section, items: allowedItems };
    }).filter(section => section.items.length > 0);

  }, [userData, globalSettings, sidebarConfig]);

  const isExpandedRef = React.useRef(isExpanded);

  useEffect(() => {
    // If globalSettings prop is passed and has branding, use it immediately
    if (globalSettings && (globalSettings.cmsName || globalSettings.cmsLogo)) {
      setCmsBranding({ name: globalSettings.cmsName || 'sumr.day OS', logoIcon: globalSettings.cmsLogo || null });
    } else {
      const loadBranding = async () => {
        const s = await storage.getItem('porto_settings', {});
        setCmsBranding({ name: s.cmsName || 'sumr.day OS', logoIcon: s.cmsLogo || null });
        if (s.siteTitle) document.title = s.siteTitle;
      };
      loadBranding();
    }
  }, [globalSettings]);

  useEffect(() => {
    const loadBranding = async () => {
      if (globalSettings && (globalSettings.cmsName || globalSettings.cmsLogo)) return; // rely on prop
      const s = await storage.getItem('porto_settings', {});
      setCmsBranding({ name: s.cmsName || 'sumr.day OS', logoIcon: s.cmsLogo || null });
    };
    window.addEventListener('porto_saved', loadBranding);
    window.addEventListener('porto_logo_updated', loadBranding);
    return () => {
      window.removeEventListener('porto_saved', loadBranding);
      window.removeEventListener('porto_logo_updated', loadBranding);
    };
  }, [globalSettings]);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
    localStorage.setItem('cms_sidebar_expanded', String(isExpanded));
    window.dispatchEvent(new CustomEvent('cms_sidebar_toggle', { detail: { isExpanded } }));
  }, [isExpanded]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 768 && isExpandedRef.current) setIsExpanded(false); };
    const handleExternalToggle = () => setIsExpanded(prev => !prev);
    const handleExternalState = (e) => setIsExpanded(e.detail.isExpanded);
    const handleSaveStart = () => setSaveStatus('saving');
    const handleSaveEnd = () => {
      setSaveStatus('saved');
      setLastSavedTime(new Date());
    };

    const handleSaveError = () => setSaveStatus('error');
    const handleOnline = () => setSaveStatus('saved');
    const handleOffline = () => setSaveStatus('offline');

    window.addEventListener('resize', handleResize);
    window.addEventListener('cms_sidebar_toggle_request', handleExternalToggle);
    window.addEventListener('cms_sidebar_set_expanded', handleExternalState);
    window.addEventListener('porto_save_start', handleSaveStart);
    window.addEventListener('porto_save_end', handleSaveEnd);
    window.addEventListener('porto_saved', handleSaveEnd);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('cms_sidebar_toggle_request', handleExternalToggle);
      window.removeEventListener('cms_sidebar_set_expanded', handleExternalState);
      window.removeEventListener('porto_save_start', handleSaveStart);
      window.removeEventListener('porto_save_end', handleSaveEnd);
      window.removeEventListener('porto_saved', handleSaveEnd);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeToNotifications((notifs) => setUnreadCount(notifs.filter(n => !n.read).length));
    return () => unsub();
  }, []);

  const handleNavClick = (item: any) => { haptic.selection();
    window.dispatchEvent(new CustomEvent('porto_close_search'));
    clearPageUpdateDot(item.key);
    if (item.action === 'media-vault') {
      setShowMediaVault(true);
      if (window.innerWidth < 1200) setIsExpanded(false);
      return;
    }
    if (!item.action) return;
    onSwitchPage(item.action === 'builder' ? 'home' : item.action);
    if (window.innerWidth < 1200) setIsExpanded(false);
  };

  const isActive = (item: any) => {
    if (item.key === 'media-vault') return showMediaVault;

    if (item.key === 'dashboard') {
      return ['dashboard', 'analytics', 'intelligence', 'traffic'].includes(activePage) || (activePage?.startsWith('analytics/') ?? false);
    }

    if (item.key === 'management') {
      return [
        'management', 'projects', 'proofing', 'design-proofing', 
        'transactions', 'keuangan', 'whatsapp', 'wa', 'chat', 'users',
        'booking', 'schedule', 'calendar'
      ].includes(activePage) || 
      (activePage?.startsWith('projects/') ?? false) || 
      (activePage?.startsWith('proofing/') ?? false) || 
      (activePage?.startsWith('transactions/') ?? false) || 
      (activePage?.startsWith('whatsapp/') ?? false) || 
      (activePage?.startsWith('chat/') ?? false) ||
      (activePage?.startsWith('booking/') ?? false);
    }

    if (item.key === 'content-database') {
      return [
        'database', 'content-database', 
        'portfolio', 'karya', 'catalog', 'katalog', 'blog', 'apps', 'games', 'game-management',
        'forms', 'form-maker', 'database_forms', 
        'biodata', 'database_biodata', 
        'contacts', 'database_contacts', 
        'links', 'database_links', 
        'broadcast', 'database_broadcast', 'push',
        'media', 'vault', 'reviews', 'client-voice', 'ratecard', 'pricing'
      ].includes(activePage) || 
      (activePage?.startsWith('database/') ?? false) || 
      (activePage?.startsWith('portfolio/') ?? false) || 
      (activePage?.startsWith('forms/') ?? false) || 
      (activePage?.startsWith('apps/') ?? false);
    }

    if (item.key === 'analytics') {
      return ['analytics', 'intelligence', 'traffic'].includes(activePage) || (activePage?.startsWith('analytics/') ?? false);
    }

    if (item.key === 'tools') {
      return [
        'tools', 'tool', 'flipbook', 'flipbook-studio', 
        'notes', 'memo', 'whiteboard', 'visual-editor', 'website', 'qr', 'broadcast',
        'builder', 'lpimage', 'home',
        'poster-promo', 'poster', 'studio-poster'
      ].includes(activePage) || 
      (activePage?.startsWith('flipbook/') ?? false) || 
      (activePage?.startsWith('notes/') ?? false) || 
      (activePage?.startsWith('visual-editor/') ?? false) || 
      (activePage?.startsWith('website/') ?? false) ||
      (activePage?.startsWith('lpimage/') ?? false) ||
      (activePage?.startsWith('poster-promo') ?? false) ||
      (activePage?.startsWith('page-') ?? false) ||
      allBuilderPages.some(p => p.slug === activePage);
    }

    if (item.key === 'settings' || item.action === 'settings') {
      return [
        'settings', 'guideline', 'guide', 'panduan', 'storage'
      ].includes(activePage) || 
      (activePage?.startsWith('settings_') ?? false) || 
      (activePage?.startsWith('settings/') ?? false);
    }

    return item.action === activePage;
  };

  return (
    <aside
      className={`admin-sidebar ${isExpanded ? 'expanded' : 'collapsed'} sb-theme-${sidebarConfig.style || 'floating'} sb-density-${sidebarConfig.density || 'comfortable'}`}
      onTouchStart={(e) => {
        if (typeof window !== 'undefined' && window.innerWidth < 768 && e.touches.length === 1) {
          (e.currentTarget as any)._touchStartY = e.touches[0].clientY;
        }
      }}
      onTouchEnd={(e) => {
        const startY = (e.currentTarget as any)._touchStartY;
        if (typeof startY === 'number' && e.changedTouches.length === 1) {
          const deltaY = e.changedTouches[0].clientY - startY;
          (e.currentTarget as any)._touchStartY = null;
          if (deltaY > 52 && isExpanded) {
            haptic.light();
            setIsExpanded(false);
          }
        }
      }}
    >
      <div
        className="sb-mobile-sheet-handle"
        onClick={() => {
          haptic.light();
          setIsExpanded(false);
        }}
      >
        <div className="sb-mobile-sheet-handle-bar" />
      </div>

      {/* ── Brand Header (Disembunyikan sementara sesuai permintaan user) ── */}
      {/* <div className="sb-header">...</div> */}
      <div className="sb-top-spacer" style={{ height: 14 }} />

      {/* ── Mobile Quick Control Panel (Pusat Kontrol Cepat: HANYA IKON TANPA LABEL, baru muncul saat klik lingkaran) ── */}
      {mobilePanelMode === 'tools' && (
        <div 
          className="sb-mobile-control-panel"
          style={{
            margin: '0 4px 14px 4px',
            padding: '12px 14px',
            borderRadius: 20,
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            animation: 'cmsPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
            <button
              type="button"
              onClick={() => setMobilePanelMode('menu')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: 'var(--cms-accent, #6366f1)',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                padding: 0
              }}
            >
              <ChevronLeft size={16} />
              <span>Kembali ke Menu</span>
            </button>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: syncMode === 'auto' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: syncMode === 'auto' ? '#10b981' : '#f59e0b' }} />
              {syncMode === 'auto' ? 'Cloud Aktif' : 'Mode Hemat'}
            </span>
          </div>

          {/* 8 Action Tiles (4 x 2 Grid) - PURE ICONS NO LABELS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {/* 1. EcoHub */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('porto_open_quick_drawer', { detail: { type: 'ecohub' } }));
                if (window.innerWidth < 768) setIsExpanded(false);
              }}
              title="Studio EcoHub & Monitoring"
              aria-label="EcoHub"
              style={{
                height: 48,
                borderRadius: 14,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                background: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.08)',
                color: '#38bdf8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <Cloud size={20} />
            </button>

            {/* 2. Multitask Hub */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('porto_open_quick_drawer', { detail: { type: 'shortcuts' } }));
                if (window.innerWidth < 768) setIsExpanded(false);
              }}
              title="Multitask Hub & Pintasan Cepat"
              aria-label="Multitask"
              style={{
                height: 48,
                borderRadius: 14,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                background: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.08)',
                color: '#c084fc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <LayoutGrid size={20} />
            </button>

            {/* 3. Sync Mode */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cycleSyncMode();
              }}
              title={saveStatus === 'saving' ? 'Menyimpan...' : syncMode === 'auto' ? 'Mode Otomatis' : syncMode === 'manual' ? 'Mode Hemat' : 'Mode Offline'}
              aria-label="Sinkronisasi"
              style={{
                height: 48,
                borderRadius: 14,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                background: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                color: syncMode === 'auto' ? '#10b981' : '#f59e0b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {saveStatus === 'saving' ? <RefreshCw size={20} className="cms-spin" /> : syncMode === 'auto' ? <Zap size={20} /> : syncMode === 'manual' ? <Shield size={20} /> : <WifiOff size={20} />}
            </button>

            {/* 4. Notifikasi */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new Event('porto_toggle_notifications'));
                if (window.innerWidth < 768) setIsExpanded(false);
              }}
              title={unreadCount > 0 ? `${unreadCount} Notifikasi Baru` : 'Pusat Notifikasi'}
              aria-label="Notifikasi"
              style={{
                position: 'relative',
                height: 48,
                borderRadius: 14,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f8fafc',
                color: isDark ? '#f8fafc' : '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="sb-notif-dot" style={{ top: 8, right: 8 }} />}
            </button>

            {/* 5. PWA Install */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                await triggerPwaInstall();
                if (window.innerWidth < 768) setIsExpanded(false);
              }}
              title={isStandalone ? 'Aplikasi Web Telah Terpasang' : 'Instal Aplikasi (PWA)'}
              aria-label="Instal Aplikasi"
              style={{
                height: 48,
                borderRadius: 14,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f8fafc',
                color: isStandalone ? '#10b981' : 'var(--cms-accent, #7c3aed)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <Download size={20} />
            </button>

            {/* 6. Mode Terang / Gelap */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleDarkMode) onToggleDarkMode();
                else window.dispatchEvent(new Event('cms_toggle_dark_mode'));
              }}
              title={(isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('cms_dark_mode') !== 'false')) ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Mode Gelap / Terang"
              style={{
                height: 48,
                borderRadius: 14,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f8fafc',
                color: (isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('cms_dark_mode') !== 'false')) ? '#f59e0b' : '#6366f1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {(isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('cms_dark_mode') !== 'false')) ? (
                <Sun size={20} strokeWidth={2.2} />
              ) : (
                <Moon size={20} strokeWidth={2.2} />
              )}
            </button>

            {/* 7. Website Publik */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { if (window.innerWidth < 768) setIsExpanded(false); }}
              title="Buka Website Publik (/)"
              aria-label="Lihat Situs"
              style={{
                height: 48,
                borderRadius: 14,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f8fafc',
                color: 'var(--cms-text, #f8fafc)',
                textDecoration: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <ExternalLink size={20} />
            </a>

            {/* 8. Keluar */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (window.innerWidth < 768) setIsExpanded(false);
                try { await storage.clearLocalCache(); } catch (err) {}
                await signOut(auth);
                if (onSignOut) onSignOut();
              }}
              title="Keluar dari Akun"
              aria-label="Keluar"
              style={{
                height: 48,
                borderRadius: 14,
                border: '1px solid rgba(239,68,68,0.25)',
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation (menciut / disembunyikan saat mode tools aktif) ── */}
      {mobilePanelMode === 'menu' && (
        <nav className="sb-nav">
        {filteredNavSections.map((section, sIdx) => (
          <div key={section.title} className="sb-section">
            {sidebarConfig.showSectionHeaders !== false && (
              <div className="sb-section-label">{section.title}</div>
            )}
            {sIdx > 0 && <div className="sb-divider" />}

            {section.items.map((item) => {
              const active = isActive(item);
              const hasDot = updatedPages[item.key] || 
                (item.key === 'builder' && (updatedPages['builder'] || allBuilderPages.some(p => updatedPages[p.slug]))) ||
                (item.key === 'content-database' && (updatedPages['portfolio'] || updatedPages['blog'] || updatedPages['catalog'] || updatedPages['game-management'])) ||
                (item.key === 'settings' && updatedPages['settings']);

              return (
                <div key={item.key} className="sb-item-wrap">
                  <button
                    className={`sb-item ${active ? 'active' : ''}`}
                    onClick={() => handleNavClick(item)}
                    title={!isExpanded ? (hasDot ? `${item.label} (Ada Pembaruan)` : item.label) : ''}
                  >
                    <span className="sb-icon" style={{ position: 'relative' }}>
                      {item.icon}
                      {hasDot && (
                        <span className="cms-update-dot" style={{ position: 'absolute', top: -2, right: -2 }} title="Ada pembaruan data baru" />
                      )}
                    </span>
                    <span className="sb-label">{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      )}

      {/* ── Footer / System Action Area ── */}
      <div 
        className="sb-footer" 
        style={{ 
          position: 'relative', 
          overflow: 'visible', 
          borderTop: 'none',
          boxSizing: 'border-box'
        }}
      >
        {/* 1. Standalone Prominent Ring Circle Tool Button */}
        <button 
          ref={toolBtnRef}
          type="button"
          className={`sb-item sb-footer-tool-btn ${(showCollapsedTools || mobilePanelMode === 'tools') ? 'active' : ''}`}
          title={!isExpanded ? "Tools & Pengaturan Cepat" : undefined}
          aria-label="Tools"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              if (!isExpanded) {
                setIsExpanded(true);
                setMobilePanelMode('tools');
              } else {
                setMobilePanelMode(prev => prev === 'tools' ? 'menu' : 'tools');
              }
            } else {
              toggleCollapsedTools();
            }
          }}
          style={{
            border: 'none',
            background: 'transparent',
            color: showCollapsedTools ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text)',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'background 0.15s ease, color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 14px'
          }}
        >
          <span className="sb-icon" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
            <Circle size={22} strokeWidth={2.4} />
            {unreadCount > 0 && <span className="sb-notif-dot" style={{ top: -2, right: -2 }} />}
          </span>
          <span className="sb-label">Tools</span>
        </button>

        {/* 2. Direct Search Button */}
        <button
          type="button"
          className="sb-item sb-footer-search-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSwitchPage('global-search');
          }}
          title={!isExpanded ? "Pencarian Global (Ctrl+K)" : undefined}
          aria-label="Pencarian Global (Ctrl+K)"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--sb-text)',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'background 0.15s ease, color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 14px'
          }}
        >
          <span className="sb-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, color: 'var(--sb-text)' }}>
            <Search size={20} strokeWidth={2.2} />
          </span>
          <span className="sb-label">
            Pencarian
          </span>
        </button>

        {/* 3. Collapse / Expand Sidebar Button */}
        <button 
          type="button"
          className="sb-item sb-footer-collapse-btn"
          onClick={() => {
            setShowCollapsedTools(false);
            setIsExpanded(prev => !prev);
          }}
          title={!isExpanded ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          aria-label={!isExpanded ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          style={{
            border: 'none',
            background: 'var(--cms-accent-soft, rgba(217, 86, 41, 0.15))',
            color: 'var(--cms-text)',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'background 0.15s ease, color 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 14px'
          }}
        >
          <span className="sb-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
            {isExpanded ? (
              <ChevronLeft size={20} strokeWidth={2.2} />
            ) : (
              <ChevronRight size={20} strokeWidth={2.2} />
            )}
          </span>
          <span className="sb-label">
            {isExpanded ? 'Ciutkan' : 'Perluas'}
          </span>
        </button>

            {/* Horizontal Icon-Only Flyout Dock Modal */}
            {showCollapsedTools && flyoutPos && typeof document !== 'undefined' && typeof window !== 'undefined' && window.innerWidth >= 768 && createPortal(
              <>
                {/* 1. Backdrop Overlay for tapping outside */}
                <div 
                  className="sb-flyout-backdrop"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCollapsedTools(false);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setShowCollapsedTools(false);
                  }}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2147483640,
                    background: typeof window !== 'undefined' && window.innerWidth < 768 ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
                    backdropFilter: typeof window !== 'undefined' && window.innerWidth < 768 ? 'blur(4px)' : 'none',
                    WebkitBackdropFilter: typeof window !== 'undefined' && window.innerWidth < 768 ? 'blur(4px)' : 'none',
                  }}
                />

                {/* 2. Elevated Flyout Popup: Pure Icon-Only Toolbar */}
                <div 
                  ref={flyoutMenuRef}
                  className="sb-flyout-popup"
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    position: 'fixed', 
                    left: typeof window !== 'undefined' && window.innerWidth < 768 ? '50%' : flyoutPos.left, 
                    right: 'auto', 
                    bottom: typeof window !== 'undefined' && window.innerWidth < 768 ? 82 : flyoutPos.bottom, 
                    transform: typeof window !== 'undefined' && window.innerWidth < 768 ? 'translate(-50%, 0)' : 'none',
                    zIndex: 2147483641,
                    background: isDark ? 'var(--cms-card-bg, #171824)' : '#ffffff', 
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: isDark ? '1.5px solid var(--cms-border, rgba(255,255,255,0.14))' : '1.5px solid #e2e8f0', 
                    borderRadius: 20, 
                    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.15)' : '0 16px 45px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)', 
                    padding: '8px 10px', 
                    display: 'flex', 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6, 
                    whiteSpace: 'nowrap'
                  }}
                >
                  {/* Studio EcoHub & Multitask Hub (Icon Only) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('porto_open_quick_drawer', { detail: { type: 'ecohub' } }));
                      setShowCollapsedTools(false);
                    }}
                    title="Studio EcoHub & Multitask Drawer (Audit Database, Flipbook, Memo - Ctrl+E)"
                    aria-label="Studio EcoHub"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: isDark ? '1px solid var(--glass-border, rgba(255,255,255,0.1))' : '1px solid #e2e8f0',
                      background: 'var(--cms-accent-soft, rgba(59,130,246,0.18))',
                      color: 'var(--cms-accent, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <Sparkles size={18} strokeWidth={2.2} />
                  </button>

                  {/* Cloud Nexus (Icon Only) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.selection();
                      onSwitchPage('third-party');
                      setShowCollapsedTools(false);
                    }}
                    title="Cloud Nexus & Gimic Cerdas Pihak Ketiga"
                    aria-label="Cloud Nexus"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: isDark ? '1px solid var(--glass-border, rgba(255,255,255,0.1))' : '1px solid #e2e8f0',
                      background: 'rgba(56, 189, 248, 0.16)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <CloudLightning size={18} strokeWidth={2.2} />
                  </button>

                  {/* Poster Promosi (Icon Only) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('porto_open_social_promo'));
                      setShowCollapsedTools(false);
                    }}
                    title="Poster Promosi (Story, Feed, QR)"
                    aria-label="Poster Promosi"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: isDark ? '1px solid var(--glass-border, rgba(255,255,255,0.1))' : '1px solid #e2e8f0',
                      background: 'rgba(124, 58, 237, 0.16)',
                      color: 'var(--cms-accent, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <LayoutTemplate size={18} strokeWidth={2.2} />
                  </button>

                  {/* Mode Sinkronisasi (Icon Only) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleSyncMode();
                      setShowCollapsedTools(false);
                    }}
                    title={saveStatus === 'saving' ? 'Menyimpan...' : syncMode === 'auto' ? 'Mode Otomatis' : syncMode === 'manual' ? 'Mode Hemat' : 'Mode Offline'}
                    aria-label="Mode Sinkronisasi"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: isDark ? '1px solid var(--glass-border, rgba(255,255,255,0.1))' : '1px solid #e2e8f0',
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                      color: syncMode === 'auto' ? '#10b981' : '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0,
                      position: 'relative'
                    }}
                  >
                    {saveStatus === 'saving' ? (
                      <RefreshCw size={17} color="var(--cms-accent)" className="cms-spin" />
                    ) : syncMode === 'auto' ? (
                      <Zap size={17} />
                    ) : syncMode === 'manual' ? (
                      <Shield size={17} />
                    ) : (
                      <WifiOff size={17} />
                    )}
                    <span style={{
                      position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%',
                      background: syncMode === 'auto' ? '#10b981' : '#f59e0b'
                    }} />
                  </button>

                  {/* Notifikasi (Icon Only) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new Event('porto_toggle_notifications'));
                      setShowCollapsedTools(false);
                    }}
                    title={unreadCount > 0 ? `${unreadCount} Notifikasi Baru` : 'Pusat Notifikasi'}
                    aria-label="Pusat Notifikasi"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: isDark ? '1px solid var(--glass-border, rgba(255,255,255,0.1))' : '1px solid #e2e8f0',
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                      color: isDark ? 'var(--cms-text, #f8fafc)' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0,
                      position: 'relative'
                    }}
                  >
                    <Bell size={18} strokeWidth={2} />
                    {unreadCount > 0 && <span className="sb-notif-dot" style={{ top: 5, right: 5 }} />}
                  </button>

                  {/* Instal App PWA (Icon Only) */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await triggerPwaInstall();
                      setShowCollapsedTools(false);
                    }}
                    title={isStandalone ? 'Aplikasi Web Telah Terpasang' : 'Instal Aplikasi (PWA)'}
                    aria-label="Instal Aplikasi"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: isDark ? '1px solid var(--glass-border, rgba(255,255,255,0.1))' : '1px solid #e2e8f0',
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                      color: isStandalone ? '#10b981' : 'var(--cms-accent, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <Download size={18} />
                  </button>

                  {/* Mode Terang / Gelap (Icon Only Switch Mode) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleDarkMode) onToggleDarkMode();
                      else window.dispatchEvent(new Event('cms_toggle_dark_mode'));
                      setShowCollapsedTools(false);
                    }}
                    title={(isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('cms_dark_mode') !== 'false')) ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                    aria-label="Beralih Mode Gelap / Terang"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: isDark ? '1px solid var(--glass-border, rgba(255,255,255,0.1))' : '1px solid #e2e8f0',
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                      color: (isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('cms_dark_mode') !== 'false')) ? '#f59e0b' : '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    {(isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('cms_dark_mode') !== 'false')) ? (
                      <Sun size={18} strokeWidth={2.2} />
                    ) : (
                      <Moon size={18} strokeWidth={2.2} />
                    )}
                  </button>

                  {/* Lihat Situs Publik (Icon Only) */}
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowCollapsedTools(false)}
                    title="Buka Website Publik (/)"
                    aria-label="Lihat Situs Publik"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--cms-text, #f8fafc)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <ExternalLink size={18} />
                  </a>

                  {/* Keluar (Icon Only) */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setShowCollapsedTools(false);
                      try { await storage.clearLocalCache(); } catch (err) {}
                      await signOut(auth);
                      if (onSignOut) onSignOut();
                    }}
                    title="Keluar dari Akun"
                    aria-label="Keluar"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.12)',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <LogOut size={18} />
                  </button>

                  {/* Tutup Menu Flyout (Icon Only) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCollapsedTools(false);
                    }}
                    title="Tutup Menu"
                    aria-label="Tutup"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--cms-text-muted, #94a3b8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </>,
              document.body
            )}
      </div>

      {showMediaVault && (
        <MediaGalleryModal
          isOpen={showMediaVault}
          onClose={() => setShowMediaVault(false)}
          onSelect={(url) => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(url);
            }
            window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'URL media berhasil disalin ke clipboard' } }));
            setShowMediaVault(false);
          }}
        />
      )}
    </aside>
  );
};

export default AdminSidebar;
