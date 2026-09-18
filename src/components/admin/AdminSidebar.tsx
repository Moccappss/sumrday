import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Globe, Globe2, FolderKanban, Settings2, LogOut, 
  ExternalLink, Zap, StickyNote, Grid, Bell, ChevronLeft, ChevronRight, 
  MessageSquareMore, ChevronDown, Database, Users, Download,
  Receipt, Search, Cloud, HardDrive, CheckCircle2, AlertCircle, FileText, RefreshCw,
  Shield, WifiOff, Link2, QrCode, Megaphone, X, Calendar, History, Clock, ArrowRight,
  Star, Store, Layers, Gamepad2, LayoutGrid, Sun, Moon, Image as ImageIcon, Circle,
  FileSpreadsheet, Fingerprint, Quote
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { subscribeToNotifications } from '../../utils/notifications';
import { storage } from '../../utils/storage';
import { getUpdatedPages, clearPageUpdateDot, clearAllUpdateDots } from '../../utils/multiUserSync';
import { triggerPwaInstall } from './AdminPwaSuggestion';
import MediaGalleryModal from './MediaGalleryModal';

const NAV_SECTIONS = [
  {
    title: 'Menu',
    items: [
      { key: 'dashboard', label: 'Studio', icon: <LayoutDashboard size={22} strokeWidth={2} />, action: 'dashboard' },
      { key: 'global-search', label: 'Search', icon: <Search size={22} strokeWidth={2} />, action: 'global-search' },
      { key: 'visual-editor', label: 'Canvas', icon: <Globe2 size={22} strokeWidth={2} />, action: 'visual-editor' },
      { key: 'content-database', label: 'Vault', icon: <Database size={22} strokeWidth={2} />, action: 'database', hasSub: true },
      { key: 'builder', label: 'Blocks', icon: <Layers size={22} strokeWidth={2} />, action: 'home', hasSub: true },
      { key: 'projects', label: 'Works', icon: <FolderKanban size={22} strokeWidth={2} />, action: 'projects' },
      { key: 'notes', label: 'Notes', icon: <StickyNote size={22} strokeWidth={2} />, action: 'notes' },
      { key: 'transactions', label: 'Finance', icon: <Receipt size={22} strokeWidth={2} />, action: 'transactions' },
      { key: 'chat', label: 'Inbox', icon: <MessageSquareMore size={22} strokeWidth={2} />, action: 'chat' },
      { key: 'users', label: 'Club', icon: <Users size={22} strokeWidth={2} />, action: 'users', superAdminOnly: true },
      { key: 'settings', label: 'Settings', icon: <Settings2 size={22} strokeWidth={2} />, action: 'settings', hasSub: true },
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
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
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
        left: 16,
        bottom: 96
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

  const toggleCollapsedTools = useCallback(() => {
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
        if (item.key === 'global-search') return true;
        const checkKey = item.key === 'builder' ? 'pages' : (item.key === 'content-database' ? 'database' : item.key);
        return (userData.allowedPages || []).includes(checkKey);
      });
      return { ...section, items: allowedItems };
    }).filter(section => section.items.length > 0);

  }, [userData, globalSettings, sidebarConfig]);

  const isExpandedRef = React.useRef(isExpanded);
  useEffect(() => {
    isExpandedRef.current = isExpanded;
    localStorage.setItem('cms_sidebar_expanded', isExpanded);
    window.dispatchEvent(new CustomEvent('cms_sidebar_toggle', { detail: { isExpanded } }));
  }, [isExpanded]);

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
    return () => window.removeEventListener('porto_saved', loadBranding);
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

  const handleNavClick = (item: any) => {
    window.dispatchEvent(new CustomEvent('porto_close_search'));
    clearPageUpdateDot(item.key);
    if (item.action === 'media-vault') {
      setShowMediaVault(true);
      if (window.innerWidth < 1200) setIsExpanded(false);
      return;
    }
    if (item.hasSub) {
      if (!isExpanded) {
        // Mode ciut: hanya berpindah ke halaman utama tanpa membuka submenu agar ikon tetap rapi
        if (item.key === 'content-database') {
          onSwitchPage('database');
        } else if (item.key === 'builder') {
          onSwitchPage('home');
        } else if (item.action) {
          onSwitchPage(item.action);
        }
        return;
      }
      if (item.key === 'content-database') {
        onSwitchPage('database');
        toggleSub(item.key);
      } else if (item.key === 'builder') {
        onSwitchPage('home');
        toggleSub(item.key);
      } else if (item.action === 'settings') {
        onSwitchPage('settings');
        toggleSub(item.key);
      } else {
        if (item.action) onSwitchPage(item.action);
        toggleSub(item.key);
      }
      if (window.innerWidth < 1200) {
        setIsExpanded(false);
      }
      return;
    }
    if (!item.action) return;
    onSwitchPage(item.action === 'builder' ? 'home' : item.action);
    if (window.innerWidth < 1200) setIsExpanded(false);
  };

  const toggleSub = (key: string) => {
    if (!isExpanded) return; // Mode ciut: cegah buka submenu
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset submenu saat sidebar menciut sehingga saat dilebarkan tidak terbuka otomatis
  useEffect(() => {
    if (!isExpanded) {
      setExpandedItems({});
    }
  }, [isExpanded]);

  const isActive = (item: any) => {
    if (item.key === 'media-vault') return showMediaVault;

    if (item.key === 'dashboard') {
      return activePage === 'dashboard';
    }

    if (item.key === 'global-search') {
      return activePage === 'global-search';
    }

    if (item.key === 'visual-editor') {
      return activePage === 'visual-editor' || activePage === 'website' || (activePage?.startsWith('visual-editor/') ?? false) || (activePage?.startsWith('website/') ?? false);
    }

    if (item.key === 'content-database') {
      return [
        'database', 'portfolio', 'karya', 'blog', 'catalog', 'katalog', 
        'apps', 'apps-studio', 'game-management', 'games', 
        'forms', 'form-maker', 'database_forms', 
        'biodata', 'database_biodata', 
        'contacts', 'database_contacts', 
        'links', 'database_links', 
        'broadcast', 'database_broadcast', 'push',
        'media', 'vault', 'reviews', 'client-voice', 'ratecard', 'pricing'
      ].includes(activePage) || (activePage?.startsWith('database/') ?? false) || (activePage?.startsWith('forms/') ?? false) || (activePage?.startsWith('blog/') ?? false) || (activePage?.startsWith('catalog/') ?? false);
    }

    if (item.key === 'projects') {
      return activePage === 'projects' || (activePage?.startsWith('projects/') ?? false);
    }

    if (item.key === 'notes') {
      return ['notes', 'memo', 'whiteboard'].includes(activePage) || (activePage?.startsWith('notes/') ?? false);
    }

    if (item.key === 'transactions') {
      return ['transactions', 'keuangan'].includes(activePage) || (activePage?.startsWith('transactions/') ?? false);
    }

    if (item.key === 'chat') {
      return activePage === 'chat' || (activePage?.startsWith('chat/') ?? false);
    }

    if (item.key === 'users') {
      return activePage === 'users';
    }

    if (item.key === 'settings' || item.action === 'settings') {
      return activePage === 'settings' || (activePage?.startsWith('settings_') ?? false) || (activePage?.startsWith('settings/') ?? false) || activePage === 'storage';
    }

    if (item.key === 'builder') {
      const isDb = [
        'database', 'portfolio', 'karya', 'blog', 'catalog', 'katalog', 
        'apps', 'apps-studio', 'game-management', 'games', 
        'forms', 'form-maker', 'database_forms', 
        'biodata', 'database_biodata', 
        'contacts', 'database_contacts', 
        'links', 'database_links', 
        'broadcast', 'database_broadcast', 'push',
        'media', 'vault', 'reviews', 'client-voice', 'ratecard', 'pricing'
      ].includes(activePage) || (activePage?.startsWith('database/') ?? false);
      if (isDb) return false;

      if (['dashboard', 'global-search', 'visual-editor', 'website', 'projects', 'notes', 'memo', 'whiteboard', 'transactions', 'keuangan', 'chat', 'users', 'storage'].includes(activePage) || (activePage?.startsWith('settings') ?? false)) {
        return false;
      }

      return activePage === 'builder' || activePage === 'home' || activePage === 'lpimage' || (activePage?.startsWith('lpimage/') ?? false) || allBuilderPages.some(p => p.slug === activePage) || (activePage?.startsWith('page-') ?? false);
    }

    return item.action === activePage;
  };

  return (
    <aside className={`admin-sidebar ${isExpanded ? 'expanded' : 'collapsed'} sb-theme-${sidebarConfig.style || 'floating'} sb-density-${sidebarConfig.density || 'comfortable'}`}>

      {/* ── Brand Header (Disembunyikan sementara sesuai permintaan user) ── */}
      {/* <div className="sb-header">...</div> */}
      <div style={{ height: 14 }} />

      {/* ── Navigation ── */}
      <nav className="sb-nav">
        {filteredNavSections.map((section, sIdx) => (
          <div key={section.title} className="sb-section">
            {sidebarConfig.showSectionHeaders !== false && (
              <div className="sb-section-label">{section.title}</div>
            )}
            {sIdx > 0 && <div className="sb-divider" />}

            {section.items.map((item) => {
              const isSubOpen = isExpanded && !!expandedItems[item.key];
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
                    {item.hasSub && (
                      <span 
                        className="sb-chevron"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSub(item.key);
                        }}
                      >
                        {isSubOpen
                          ? <ChevronDown size={12} strokeWidth={2.5} />
                          : <ChevronRight size={12} strokeWidth={2.5} />}
                      </span>
                    )}
                  </button>

                  {/* Database submenu */}
                  {item.hasSub && isSubOpen && item.key === 'content-database' && (
                    <div className="sb-submenu">
                      {[
                        { id: 'portfolio', label: 'Karya', icon: <Star size={18} strokeWidth={2.2} /> },
                        { id: 'blog', label: 'Journal', icon: <FileText size={18} strokeWidth={2.2} /> },
                        { id: 'catalog', label: 'Drops', icon: <Store size={18} strokeWidth={2.2} /> },
                        { id: 'apps', label: 'Apps', icon: <LayoutGrid size={18} strokeWidth={2.2} /> },
                        { id: 'forms', label: 'Forms', icon: <FileSpreadsheet size={18} strokeWidth={2.2} /> },
                        { id: 'links', label: 'Links', icon: <Link2 size={18} strokeWidth={2.2} /> },
                        { id: 'broadcast', label: 'Waves', icon: <Megaphone size={18} strokeWidth={2.2} /> },
                        { id: 'biodata', label: 'Bio', icon: <Fingerprint size={18} strokeWidth={2.2} /> },
                        { id: 'contacts', label: 'Socials', icon: <Globe size={18} strokeWidth={2.2} /> },
                        { id: 'media', label: 'Media', icon: <ImageIcon size={18} strokeWidth={2.2} /> },
                        { id: 'reviews', label: 'Cheers', icon: <Quote size={18} strokeWidth={2.2} /> },
                        { id: 'ratecard', label: 'Rates', icon: <Receipt size={18} strokeWidth={2.2} /> },
                      ].map((sub) => {
                        const isSubActive = activePage === sub.id || 
                          (sub.id === 'portfolio' && activePage === 'karya') || 
                          (sub.id === 'catalog' && activePage === 'katalog') ||
                          (sub.id === 'apps' && (activePage === 'apps' || activePage === 'apps-studio' || activePage === 'game-management' || activePage === 'games')) ||
                          (sub.id === 'blog' && (activePage?.startsWith('blog') ?? false)) ||
                          (sub.id === 'forms' && (activePage === 'forms' || activePage === 'form-maker' || activePage === 'database_forms')) ||
                          (sub.id === 'links' && (activePage === 'links' || (activePage?.startsWith('links/') ?? false))) ||
                          (sub.id === 'broadcast' && (activePage === 'broadcast' || (activePage?.startsWith('broadcast/') ?? false))) ||
                          (sub.id === 'biodata' && (activePage === 'biodata' || activePage === 'database_biodata')) ||
                          (sub.id === 'contacts' && (activePage === 'contacts' || activePage === 'database_contacts')) ||
                          (sub.id === 'media' && (activePage === 'media' || activePage === 'vault')) ||
                          (sub.id === 'reviews' && (activePage === 'reviews' || activePage === 'client-voice')) ||
                          (sub.id === 'ratecard' && (activePage === 'ratecard' || activePage === 'pricing'));
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('porto_close_search'));
                              onSwitchPage(sub.id);
                              if (window.innerWidth < 1200) setIsExpanded(false);
                            }}
                            className={`sb-sub-item ${isSubActive ? 'active' : ''}`}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 10,
                              fontSize: 13,
                              fontWeight: isSubActive ? 800 : 700,
                              padding: '8px 12px 8px 14px'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0, opacity: isSubActive ? 1 : 0.85 }}>
                              {sub.icon}
                            </span>
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Builder submenu */}
                  {item.hasSub && isSubOpen && item.key === 'builder' && (
                    <div className="sb-submenu">
                      {allBuilderPages.map((p) => (
                        <button key={p.slug}
                          onClick={() => { 
                            window.dispatchEvent(new CustomEvent('porto_close_search'));
                            clearPageUpdateDot(p.slug);
                            onSwitchPage(p.slug); 
                            setIsExpanded(false); 
                          }}
                          className={`sb-sub-item ${activePage === p.slug ? 'active' : ''}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{p.name}</span>
                          {updatedPages[p.slug] && (
                            <span className="cms-update-dot" style={{ width: 6, height: 6, minWidth: 6, minHeight: 6 }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Settings submenu */}
                  {item.hasSub && isSubOpen && item.key === 'settings' && (
                    <div className="sb-submenu">
                      {[
                        { id: 'branding', label: 'Vibe' },
                        { id: 'access_lock', label: 'Security' },
                        { id: 'storage', label: 'Storage' },
                        { id: 'cloud', label: 'Sync', superAdminOnly: true },
                        { id: 'security', label: 'Access' }
                      ].map((s) => {
                        if (s.superAdminOnly && userData?.role !== 'Super Admin') return null;
                        return (
                        <button key={s.id}
                          type="button"
                          onClick={() => { 
                            window.dispatchEvent(new CustomEvent('porto_close_search'));
                            clearPageUpdateDot('settings');
                            onSwitchPage(`settings_${s.id}`); 
                            window.dispatchEvent(new CustomEvent('cms_open_settings_category', { detail: { category: s.id } }));
                            if (window.innerWidth < 1200) setIsExpanded(false); 
                          }}
                          className={`sb-sub-item ${activePage === `settings_${s.id}` || activePage === `settings/${s.id}` || (s.id === 'storage' && activePage === 'storage') ? 'active' : ''}`}>
                          <span>{s.label}</span>
                        </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer / System Action Area (Desktop: column, Mobile: row side-by-side) ── */}
      <div 
        className="sb-footer" 
        style={{ 
          position: 'relative', 
          overflow: 'visible', 
          borderTop: 'none',
          boxSizing: 'border-box'
        }}
      >
        {/* 1. Standalone Prominent Ring Circle Tool Button (DI ATAS) */}
        <button 
          ref={toolBtnRef}
          type="button"
          className={`sb-item sb-footer-tool-btn ${showCollapsedTools ? 'active' : ''}`}
          title="Tools"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapsedTools();
          }}
          style={{
            border: 'none',
            background: 'transparent',
            color: showCollapsedTools ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text)',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'background 0.15s ease, color 0.15s ease'
          }}
        >
          <span className="sb-icon" style={{ position: 'relative' }}>
            <Circle size={22} strokeWidth={2.4} />
            {unreadCount > 0 && <span className="sb-notif-dot" style={{ top: -2, right: -2 }} />}
          </span>
          <span className="sb-label">Tools</span>
        </button>

        {/* 2. Collapse / Expand Sidebar Button (DI BAWAH) */}
        <button 
          type="button"
          className="sb-item sb-footer-collapse-btn"
          onClick={() => {
            setShowCollapsedTools(false);
            setIsExpanded(prev => !prev);
          }}
          title={!isExpanded ? "Expand" : "Collapse"}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--cms-text-muted)',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'background 0.15s ease, color 0.15s ease'
          }}
        >
          <span className="sb-icon">
            {isExpanded ? (
              <ChevronLeft size={20} strokeWidth={2.2} />
            ) : (
              <ChevronRight size={20} strokeWidth={2.2} />
            )}
          </span>
          <span className="sb-label">Collapse</span>
        </button>


            {/* Vertical Flyout Modal Menu rendered via createPortal to document.body */}
            {showCollapsedTools && flyoutPos && typeof document !== 'undefined' && createPortal(
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
                    zIndex: 2147483649,
                    background: typeof window !== 'undefined' && window.innerWidth < 768 ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
                    backdropFilter: typeof window !== 'undefined' && window.innerWidth < 768 ? 'blur(4px)' : 'none',
                    WebkitBackdropFilter: typeof window !== 'undefined' && window.innerWidth < 768 ? 'blur(4px)' : 'none',
                  }}
                />

                {/* 2. Elevated Flyout Popup */}
                <div 
                  ref={flyoutMenuRef}
                  className="sb-flyout-popup"
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    position: 'fixed', 
                    left: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : flyoutPos.left, 
                    right: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 'auto', 
                    bottom: typeof window !== 'undefined' && window.innerWidth < 768 ? 96 : flyoutPos.bottom, 
                    maxWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? 380 : 'none',
                    margin: typeof window !== 'undefined' && window.innerWidth < 768 ? '0 auto' : '0',
                    zIndex: 2147483650,
                    background: 'var(--cms-card-bg, #ffffff)', 
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))', 
                    borderRadius: 20, 
                    boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.12)', 
                    padding: '10px 8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 4, 
                    minWidth: 200,
                    animation: 'sbSmoothFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    transform: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {/* Mobile Header Bar */}
                  {typeof window !== 'undefined' && window.innerWidth < 768 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 10px 8px 10px',
                      borderBottom: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
                      marginBottom: 4
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Circle size={15} color="var(--cms-accent, #7c3aed)" strokeWidth={2.5} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text, #f8fafc)' }}>
                          Menu Alat & Sistem
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCollapsedTools(false);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 4,
                          cursor: 'pointer',
                          color: 'var(--cms-text-muted, #94a3b8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        aria-label="Tutup"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  )}

                  {/* Mode Sinkronisasi */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleSyncMode();
                      setShowCollapsedTools(false);
                    }}
                    className="sb-flyout-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--cms-text, #f8fafc)', fontSize: 12, fontWeight: 650,
                      textAlign: 'left', transition: 'background 0.15s ease'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                      {saveStatus === 'saving' ? (
                        <RefreshCw size={16} color="var(--cms-accent)" className="cms-spin" />
                      ) : syncMode === 'auto' ? (
                        <Zap size={16} color="#10b981" />
                      ) : syncMode === 'manual' ? (
                        <Shield size={16} color="#f59e0b" />
                      ) : (
                        <WifiOff size={16} color="#6366f1" />
                      )}
                    </span>
                    <span style={{ flex: 1 }}>
                      {saveStatus === 'saving' ? 'Menyimpan...' : 
                       syncMode === 'auto' ? 'Mode Otomatis' : 
                       syncMode === 'manual' ? 'Mode Hemat' : 'Mode Offline'}
                    </span>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: syncMode === 'auto' ? '#10b981' : '#f59e0b'
                    }} />
                  </button>

                  {/* Notifikasi */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new Event('porto_toggle_notifications'));
                      setShowCollapsedTools(false);
                    }}
                    className="sb-flyout-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--cms-text, #f8fafc)', fontSize: 12, fontWeight: 650,
                      textAlign: 'left', transition: 'background 0.15s ease'
                    }}
                  >
                    <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                      <Bell size={16} strokeWidth={2} />
                      {unreadCount > 0 && <span className="sb-notif-dot" style={{ top: -2, right: -2 }} />}
                    </span>
                    <span style={{ flex: 1 }}>Notifikasi</span>
                    {unreadCount > 0 && (
                      <span style={{ fontSize: 10, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 800 }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Instal App (PWA) */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await triggerPwaInstall();
                      setShowCollapsedTools(false);
                    }}
                    className="sb-flyout-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--cms-text, #f8fafc)', fontSize: 12, fontWeight: 650,
                      textAlign: 'left', transition: 'background 0.15s ease'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                      <Download size={16} color={isStandalone ? '#10b981' : 'var(--cms-accent)'} />
                    </span>
                    <span style={{ flex: 1 }}>{isStandalone ? 'App Terpasang' : 'Instal App (PWA)'}</span>
                  </button>

                  {/* Mode Terang / Gelap */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleDarkMode) onToggleDarkMode();
                      else window.dispatchEvent(new Event('cms_toggle_dark_mode'));
                      setShowCollapsedTools(false);
                    }}
                    className="sb-flyout-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--cms-text, #f8fafc)', fontSize: 12, fontWeight: 650,
                      textAlign: 'left', transition: 'background 0.15s ease'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                      {(isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('cms_dark_mode') !== 'false')) ? (
                        <Sun size={16} color="#f59e0b" />
                      ) : (
                        <Moon size={16} color="#6366f1" />
                      )}
                    </span>
                    <span style={{ flex: 1 }}>
                      {(isDarkMode !== undefined ? isDarkMode : (localStorage.getItem('cms_dark_mode') !== 'false')) ? 'Mode Terang' : 'Mode Gelap'}
                    </span>
                  </button>

                  {/* Lihat Situs */}
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowCollapsedTools(false)}
                    className="sb-flyout-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'var(--cms-text, #f8fafc)', fontSize: 12, fontWeight: 650,
                      textAlign: 'left', textDecoration: 'none', transition: 'background 0.15s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                      <ExternalLink size={16} />
                    </span>
                    <span style={{ flex: 1 }}>Lihat Situs</span>
                  </a>

                  <div style={{ height: 1, background: 'var(--glass-border, rgba(255,255,255,0.08))', margin: '4px 0' }} />

                  {/* Keluar */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setShowCollapsedTools(false);
                      try { await storage.clearLocalCache(); } catch (err) {}
                      await signOut(auth);
                      if (onSignOut) onSignOut();
                    }}
                    className="sb-flyout-item sb-flyout-danger"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#ef4444', fontSize: 12, fontWeight: 650,
                      textAlign: 'left', transition: 'background 0.15s ease'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                      <LogOut size={16} />
                    </span>
                    <span style={{ flex: 1 }}>Keluar</span>
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
            window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: '📋 URL Media berhasil disalin ke clipboard!' } }));
            setShowMediaVault(false);
          }}
        />
      )}
    </aside>
  );
};

export default AdminSidebar;
