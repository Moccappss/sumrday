import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, X, Sun, Moon, Cloud, Image as ImageIcon,
  LogOut, Sparkles, FolderKanban, Receipt, Users, MessageCircle,
  FileText, ShoppingBag, Link2, QrCode, StickyNote, HardDrive,
  Gamepad2, Palette, Settings2, LayoutDashboard,
  Activity, Briefcase, ClipboardList, UserCheck, Tag, Star,
  ShieldCheck, BookOpen, Layers, Radio, Send, Grid, Wrench,
  Database, BarChart3, Plug, HelpCircle, Volume2, VolumeX,
  Zap, Maximize2, ExternalLink, Trash2, Smartphone, Bell, CheckCheck
} from 'lucide-react';
import { useNativeBackHandler } from '../../utils/nativeNavigation';
import {
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications
} from '../../utils/notifications';

interface MobileControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchPage: (slug: string) => void;
  onOpenGlobalSearch: () => void;
  onOpenSync: () => void;
  onSignOut: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  externalDragY?: number;
  isExternalDragging?: boolean;
}

type DrawerCategory = 'all' | 'ops' | 'content' | 'tools' | 'system';

interface DrawerAppItem {
  key: string;
  label: string;
  category: Exclude<DrawerCategory, 'all'>;
  color: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const APP_DRAWER_ITEMS: DrawerAppItem[] = [
  { key: 'dashboard', label: 'Home', category: 'ops', color: '#f59e0b', icon: LayoutDashboard },
  { key: 'projects', label: 'Proyek', category: 'ops', color: '#3b82f6', icon: FolderKanban },
  { key: 'transactions', label: 'Finance', category: 'ops', color: '#10b981', icon: Receipt },
  { key: 'users', label: 'Klien', category: 'ops', color: '#8b5cf6', icon: Users },
  { key: 'chat', label: 'Chat', category: 'ops', color: '#06b6d4', icon: MessageCircle },
  { key: 'management', label: 'Portal', category: 'ops', color: '#6366f1', icon: Briefcase },
  { key: 'activity', label: 'Log', category: 'ops', color: '#ec4899', icon: Activity },
  { key: 'ratecard', label: 'Harga', category: 'ops', color: '#f97316', icon: Tag },

  { key: 'visual-editor', label: 'Web', category: 'content', color: '#a855f7', icon: Palette },
  { key: 'blog', label: 'Blog', category: 'content', color: '#eab308', icon: FileText },
  { key: 'portfolio', label: 'Karya', category: 'content', color: '#14b8a6', icon: ImageIcon },
  { key: 'catalog', label: 'Katalog', category: 'content', color: '#22c55e', icon: ShoppingBag },
  { key: 'links', label: 'Links', category: 'content', color: '#0ea5e9', icon: Link2 },
  { key: 'forms', label: 'Form', category: 'content', color: '#f43f5e', icon: ClipboardList },
  { key: 'biodata', label: 'Bio', category: 'content', color: '#84cc16', icon: UserCheck },
  { key: 'reviews', label: 'Ulasan', category: 'content', color: '#fbbf24', icon: Star },

  { key: 'proofing', label: 'Proofing', category: 'tools', color: '#06b6d4', icon: ShieldCheck },
  { key: 'flipbook', label: 'Flipbook', category: 'tools', color: '#8b5cf6', icon: BookOpen },
  { key: 'poster-promo', label: 'Poster', category: 'tools', color: '#ec4899', icon: Layers },
  { key: 'qr', label: 'QR', category: 'tools', color: '#64748b', icon: QrCode },
  { key: 'notes', label: 'Memo', category: 'tools', color: '#f59e0b', icon: StickyNote },
  { key: 'broadcast', label: 'Push', category: 'tools', color: '#ef4444', icon: Radio },
  { key: 'whatsapp', label: 'WA', category: 'tools', color: '#22c55e', icon: Send },
  { key: 'apps', label: 'Apps', category: 'tools', color: '#3b82f6', icon: Grid },
  { key: 'game-management', label: 'Game', category: 'tools', color: '#a855f7', icon: Gamepad2 },
  { key: 'tools', label: 'Tools', category: 'tools', color: '#0ea5e9', icon: Wrench },

  { key: 'database', label: 'Data', category: 'system', color: '#10b981', icon: Database },
  { key: 'storage', label: 'Storage', category: 'system', color: '#0284c7', icon: HardDrive },
  { key: 'analytics', label: 'Analitik', category: 'system', color: '#6366f1', icon: BarChart3 },
  { key: 'third-party', label: 'Cloud', category: 'system', color: '#f97316', icon: Plug },
  { key: 'settings', label: 'Setting', category: 'system', color: '#64748b', icon: Settings2 },
  { key: 'guideline', label: 'Panduan', category: 'system', color: '#14b8a6', icon: HelpCircle },
];

export const MobileControlPanel: React.FC<MobileControlPanelProps> = ({
  isOpen,
  onClose,
  onSwitchPage,
  onOpenGlobalSearch,
  onOpenSync,
  onSignOut,
  isDarkMode,
  onToggleDarkMode,
  externalDragY = 0,
  isExternalDragging = false,
}) => {
  const [query, setQuery] = useState('');
  const [drawerCat, setDrawerCat] = useState<DrawerCategory>('all');
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [showNavPrefs, setShowNavPrefs] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    localStorage.getItem('porto_sound_enabled') !== 'false'
  );
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() =>
    localStorage.getItem('porto_haptics_enabled') !== 'false'
  );
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    localStorage.getItem('porto_reduced_motion') === 'true'
  );
  const [syncOfflineMode, setSyncOfflineMode] = useState<boolean>(() =>
    localStorage.getItem('porto_sync_mode') === 'offline'
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );
  const [cacheCleaned, setCacheCleaned] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [dockMode, setDockMode] = useState<'4' | '6'>(() =>
    (localStorage.getItem('cms_mobile_dock_mode') as '4' | '6') || '4'
  );
  const [headerMode, setHeaderMode] = useState<'show' | 'hide'>(() =>
    (localStorage.getItem('cms_mobile_header_mode') as 'show' | 'hide') || 'show'
  );

  // Single unified bottom handle gesture:
  // - Pull down (from collapsed): live-expands App Drawer
  // - Pull up (from expanded): collapses App Drawer
  // - Pull up (from collapsed): closes Control Panel
  // - Tap: toggles App Drawer
  const [drawerDragPx, setDrawerDragPx] = useState(0);
  const [liveSheetHeightPx, setLiveSheetHeightPx] = useState<number | null>(null);
  const [sheetCloseDragY, setSheetCloseDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const sheetPointerStartYRef = useRef<number | null>(null);
  const sheetElRef = useRef<HTMLDivElement>(null);
  const containerElRef = useRef<HTMLDivElement>(null);

  useNativeBackHandler(isOpen, onClose, 'mobile_control_panel', 25);

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      setIsDrawerExpanded(false);
      setDrawerDragPx(0);
      setSheetCloseDragY(0);
      return;
    }
    const raf = requestAnimationFrame(() => setEntered(true));
    const unsub = subscribeToNotifications((list: any[]) => {
      setNotifications(Array.isArray(list) ? list : []);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (typeof unsub === 'function') unsub();
    };
  }, [isOpen]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!isOpen) return;
    setNowTick(Date.now());
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, [isOpen]);

  const timeLabel = useMemo(
    () => new Date(nowTick).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    [nowTick]
  );

  const dateLabel = useMemo(
    () => new Date(nowTick).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    [nowTick]
  );

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = drawerCat === 'all'
      ? APP_DRAWER_ITEMS
      : APP_DRAWER_ITEMS.filter((item) => item.category === drawerCat);
    if (!q) return base;
    return APP_DRAWER_ITEMS.filter(
      (r) => r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q)
    );
  }, [query, drawerCat]);

  // Fixed 2-row (12 icon-only) essential Control Panel
  const controlIcons = [
    {
      id: 'theme',
      label: isDarkMode ? 'Mode Gelap' : 'Mode Terang',
      icon: isDarkMode ? Sun : Moon,
      active: isDarkMode,
      color: '#f59e0b',
      onClick: onToggleDarkMode,
    },
    {
      id: 'sync',
      label: syncOfflineMode ? 'Sync Offline' : 'Cloud Sync',
      icon: Cloud,
      active: !syncOfflineMode,
      color: '#10b981',
      onClick: onOpenSync,
    },
    {
      id: 'media',
      label: 'Media Vault',
      icon: ImageIcon,
      active: false,
      color: '#38bdf8',
      onClick: () => {
        onClose();
        window.dispatchEvent(new CustomEvent('porto_open_media_vault', { detail: { tab: 'all' } }));
      },
    },
    {
      id: 'nav',
      label: 'Tata Letak Navigasi',
      icon: LayoutDashboard,
      active: showNavPrefs,
      color: '#a855f7',
      onClick: () => setShowNavPrefs((v) => !v),
    },
    {
      id: 'sound',
      label: soundEnabled ? 'Suara Aktif' : 'Suara Mati',
      icon: soundEnabled ? Volume2 : VolumeX,
      active: soundEnabled,
      color: '#0ea5e9',
      onClick: () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        localStorage.setItem('porto_sound_enabled', String(next));
      },
    },
    {
      id: 'haptic',
      label: hapticsEnabled ? 'Getar Aktif' : 'Getar Mati',
      icon: Smartphone,
      active: hapticsEnabled,
      color: '#8b5cf6',
      onClick: () => {
        const next = !hapticsEnabled;
        setHapticsEnabled(next);
        localStorage.setItem('porto_haptics_enabled', String(next));
      },
    },
    {
      id: 'eco',
      label: reducedMotion ? 'Hemat Daya Aktif' : 'Mode Animasi',
      icon: Zap,
      active: reducedMotion,
      color: '#eab308',
      onClick: () => {
        const next = !reducedMotion;
        setReducedMotion(next);
        localStorage.setItem('porto_reduced_motion', String(next));
        document.documentElement.classList.toggle('app-paused', next);
      },
    },
    {
      id: 'fullscreen',
      label: isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh',
      icon: Maximize2,
      active: isFullscreen,
      color: '#14b8a6',
      onClick: async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
          } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
          }
        } catch {}
      },
    },
    {
      id: 'cache',
      label: 'Bersihkan Cache',
      icon: Trash2,
      active: cacheCleaned,
      color: '#f43f5e',
      onClick: async () => {
        try {
          const { pruneEphemeralCaches } = await import('../../utils/intelligentStorageEngine');
          await pruneEphemeralCaches();
        } catch {}
        setCacheCleaned(true);
        setTimeout(() => setCacheCleaned(false), 1600);
      },
    },
    {
      id: 'web',
      label: 'Buka Website Publik',
      icon: ExternalLink,
      active: false,
      color: '#0284c7',
      onClick: () => window.open('/', '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings2,
      active: false,
      color: '#64748b',
      onClick: () => {
        onClose();
        onSwitchPage('settings');
      },
    },
    {
      id: 'logout',
      label: 'Keluar',
      icon: LogOut,
      active: false,
      color: '#ef4444',
      onClick: () => {
        onClose();
        onSignOut();
      },
    },
  ];

  const isDrawerExpandedRef = useRef(isDrawerExpanded);
  isDrawerExpandedRef.current = isDrawerExpanded;

  // 1:1 Interactive Bottom Handle Gesture (follows finger/mouse pixel-for-pixel)
  const onSheetHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const startY = e.clientY;
    const wasExpandedAtStart = isDrawerExpandedRef.current;
    const startH = sheetElRef.current?.getBoundingClientRect().height || 260;
    const maxH = (containerElRef.current?.getBoundingClientRect().height || window.innerHeight) - 86;
    const minCollapsedH = 230;

    sheetPointerStartYRef.current = startY;
    setIsSheetDragging(true);

    const onWinMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;

      if (!wasExpandedAtStart) {
        if (dy >= 0) {
          // 1:1 expand downward following finger
          setSheetCloseDragY(0);
          setDrawerDragPx(dy);
          setLiveSheetHeightPx(Math.min(maxH, startH + dy));
        } else {
          // 1:1 slide up to close whole panel
          setDrawerDragPx(0);
          setLiveSheetHeightPx(null);
          setSheetCloseDragY(Math.max(-220, dy));
        }
      } else {
        // Started expanded:
        // Pulling up shrinks height 1:1 back toward compact; continuing further closes panel
        const nextH = startH + dy;
        if (nextH >= minCollapsedH) {
          setSheetCloseDragY(0);
          setDrawerDragPx(dy);
          setLiveSheetHeightPx(Math.min(maxH, nextH));
        } else {
          setLiveSheetHeightPx(minCollapsedH);
          setSheetCloseDragY(Math.max(-220, nextH - minCollapsedH));
        }
      }
    };

    const onWinUp = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      cleanup();

      if (Math.abs(dy) < 8) {
        setIsDrawerExpanded((v) => !v);
        return;
      }

      if (!wasExpandedAtStart) {
        if (dy > 45) {
          setIsDrawerExpanded(true);
        } else if (dy < -42) {
          onClose();
        }
      } else {
        const finalH = startH + dy;
        if (finalH < minCollapsedH - 48) {
          setIsDrawerExpanded(false);
          onClose();
        } else if (dy < -45) {
          setIsDrawerExpanded(false);
        }
      }
    };

    const cleanup = () => {
      sheetPointerStartYRef.current = null;
      setIsSheetDragging(false);
      setLiveSheetHeightPx(null);
      setDrawerDragPx(0);
      setSheetCloseDragY(0);
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinUp);
    };

    window.addEventListener('pointermove', onWinMove);
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinUp);
  };

  const isAnyDragging = isSheetDragging || isExternalDragging;
  const isVisible = isOpen || isAnyDragging;
  if (!isVisible) return null;

  const upwardCloseOffset = sheetCloseDragY < 0 ? sheetCloseDragY : 0;
  const activeDragOffset = upwardCloseOffset + (isExternalDragging ? externalDragY : 0);

  const morphProgress = isOpen
    ? (entered ? Math.max(0, Math.min(1, 1 + activeDragOffset / 220)) : 0)
    : isExternalDragging && externalDragY > 0
      ? Math.max(0, Math.min(1, externalDragY / 220))
      : 0;

  const translateYOffset = ((1 - morphProgress) * -28).toFixed(2);
  const morphScale = (0.94 + morphProgress * 0.06).toFixed(3);
  const morphRadius = Math.round(26 + (1 - morphProgress) * 18);
  const contentOpacity = Math.max(0, Math.min(1, morphProgress * 1.25));

  const showExpandedGrid = isDrawerExpanded || (isSheetDragging && drawerDragPx > 18) || Boolean(query);

  return (
    <div
      ref={containerElRef}
      style={{
        position: 'fixed',
        top: headerMode === 'hide' ? 0 : 'calc(60px + env(safe-area-inset-top, 0px))',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100000000,
        background: `rgba(4, 5, 10, ${(0.48 * morphProgress).toFixed(3)})`,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: isAnyDragging ? 'none' : 'background 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        overflow: 'hidden',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetElRef}
        style={{
          background: isDarkMode ? '#111217' : '#f1f4f9',
          borderBottom: '1px solid var(--glass-border)',
          borderRadius: `0 0 ${morphRadius}px ${morphRadius}px`,
          padding: headerMode === 'hide'
            ? 'calc(10px + env(safe-area-inset-top, 0px)) 12px 6px'
            : '10px 12px 6px',
          color: 'var(--cms-text, #fff)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          height: liveSheetHeightPx !== null ? `${liveSheetHeightPx}px` : 'auto',
          maxHeight: 'calc(100% - 86px)',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: `0 12px 28px rgba(0, 0, 0, ${(0.25 * morphProgress).toFixed(3)})`,
          transformOrigin: 'top center',
          transform: `translate3d(0, ${translateYOffset}px, 0) scale(${morphScale})`,
          opacity: contentOpacity,
          willChange: 'transform, opacity',
          transition: isAnyDragging
            ? 'none'
            : 'transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.34s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. TOP STATUS + COMPACT SEARCH ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0, paddingLeft: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--cms-text)' }}>
              {timeLabel}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cms-text-muted)' }}>
              {dateLabel}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 70,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
              border: '1px solid var(--glass-border)',
              borderRadius: 999,
              padding: '0 9px',
              height: 30,
            }}
          >
            <Search size={12} color="var(--cms-text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari..."
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--cms-text)',
                fontSize: 12,
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', padding: 2, cursor: 'pointer', display: 'flex' }}
              >
                <X size={11} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGlobalSearch();
            }}
            aria-label="AI Search"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--cms-accent)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Sparkles size={13} />
          </button>
          {headerMode === 'hide' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
                border: '1px solid var(--glass-border)',
                color: 'var(--cms-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* ── 2. CONTROL PANEL CARD (ICON-ONLY, FIXED 2 ROWS, NON-EXPANDABLE) ── */}
        <div
          style={{
            flexShrink: 0,
            background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
            borderRadius: 18,
            padding: '8px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6 }}>
            {controlIcons.map((ctrl) => {
              const Icon = ctrl.icon;
              return (
                <button
                  key={ctrl.id}
                  type="button"
                  onClick={ctrl.onClick}
                  title={ctrl.label}
                  aria-label={ctrl.label}
                  style={{
                    height: 36,
                    borderRadius: 12,
                    border: 'none',
                    background: ctrl.active
                      ? ctrl.color
                      : (isDarkMode ? 'rgba(255,255,255,0.07)' : '#f3f5f9'),
                    color: ctrl.active ? '#ffffff' : 'var(--cms-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.12s ease, background 0.16s ease',
                  }}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </button>
              );
            })}
          </div>

          {showNavPrefs && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, paddingTop: 2 }}>
              <div style={{ display: 'flex', gap: 3, padding: 2, borderRadius: 9, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f5f9' }}>
                {(['4', '6'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setDockMode(m);
                      localStorage.setItem('cms_mobile_dock_mode', m);
                      window.dispatchEvent(new Event('cms_mobile_nav_prefs_changed'));
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      borderRadius: 7,
                      border: 'none',
                      fontSize: 10,
                      fontWeight: 750,
                      cursor: 'pointer',
                      background: dockMode === m ? 'var(--cms-accent)' : 'transparent',
                      color: dockMode === m ? '#fff' : 'var(--cms-text-muted)',
                    }}
                  >
                    Dock {m}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 3, padding: 2, borderRadius: 9, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f5f9' }}>
                {([
                  { id: 'show' as const, label: 'Nav On' },
                  { id: 'hide' as const, label: 'Nav Hide' },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setHeaderMode(opt.id);
                      localStorage.setItem('cms_mobile_header_mode', opt.id);
                      window.dispatchEvent(new Event('cms_mobile_nav_prefs_changed'));
                    }}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      borderRadius: 7,
                      border: 'none',
                      fontSize: 10,
                      fontWeight: 750,
                      cursor: 'pointer',
                      background: headerMode === opt.id ? 'var(--cms-accent)' : 'transparent',
                      color: headerMode === opt.id ? '#fff' : 'var(--cms-text-muted)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. APP DRAWER (SMOOTH MORPH BETWEEN 1-ROW & 5-COL EXPANDED) ── */}
        <div
          style={{
            flex: (isDrawerExpanded || liveSheetHeightPx !== null) ? 1 : '0 0 auto',
            minHeight: 0,
            background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
            borderRadius: 18,
            padding: '8px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            overflow: 'hidden',
            transition: isAnyDragging ? 'none' : 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateRows: showExpandedGrid ? '0fr' : '1fr',
              opacity: showExpandedGrid ? 0 : 1,
              transition: isAnyDragging ? 'none' : 'grid-template-rows 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
              overflow: 'hidden',
            }}
          >
            <div style={{ minHeight: 0, overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x proximity',
                  touchAction: 'pan-x',
                }}
              >
                {APP_DRAWER_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchPage(item.key);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        minWidth: 50,
                        padding: '2px 0',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--cms-text)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 11,
                          background: `${item.color}1a`,
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={17} strokeWidth={2.2} />
                      </div>
                      <span style={{ fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateRows: showExpandedGrid ? '1fr' : '0fr',
              opacity: showExpandedGrid ? 1 : 0,
              flex: showExpandedGrid ? 1 : '0 0 auto',
              minHeight: 0,
              transition: isAnyDragging ? 'none' : 'grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minHeight: 0, overflow: 'hidden' }}>
              {!query && (
                <div className="cms-segmented-tabs" style={{ flexShrink: 0, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f3f5f9', padding: 3, borderRadius: 10 }}>
                  {([
                    { id: 'all', label: 'Semua' },
                    { id: 'ops', label: 'Operasi' },
                    { id: 'content', label: 'Konten' },
                    { id: 'tools', label: 'Tools' },
                    { id: 'system', label: 'Sistem' },
                  ] as const).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDrawerCat(cat.id)}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: 7,
                        border: 'none',
                        background: drawerCat === cat.id ? 'var(--cms-accent)' : 'transparent',
                        color: drawerCat === cat.id ? '#fff' : 'var(--cms-text-muted)',
                        fontSize: 10,
                        fontWeight: 750,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                  gap: '8px 4px',
                  flex: 1,
                  minHeight: 0,
                  alignContent: 'start',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  paddingRight: 2,
                }}
              >
                {filteredRoutes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchPage(item.key);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        padding: '3px 2px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--cms-text)',
                        cursor: 'pointer',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 11,
                          background: `${item.color}1a`,
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={16} strokeWidth={2.2} />
                      </div>
                      <span style={{ fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. SINGLE INTERACTIVE BOTTOM HANDLE (PULL DOWN: EXPAND DRAWER, PULL UP: COLLAPSE / CLOSE) ── */}
        <div
          onPointerDown={onSheetHandleDown}
          title={isDrawerExpanded ? 'Geser atas / tap untuk ringkas' : 'Geser bawah / tap untuk semua fitur'}
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '6px 0 3px',
            cursor: isSheetDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: (isSheetDragging && (drawerDragPx > 10 || Math.abs(sheetCloseDragY) > 12)) ? 54 : 38,
              height: 4.5,
              borderRadius: 999,
              background: (isDrawerExpanded || drawerDragPx > 14 || Math.abs(sheetCloseDragY) > 20)
                ? 'var(--cms-accent)'
                : 'var(--glass-border, rgba(128,128,128,0.34))',
              transition: 'width 0.14s ease, background 0.14s ease',
            }}
          />
        </div>
      </div>

      {/* ── FLOATING NOTIFICATION CARDS IN OPEN SPACE BELOW TOP SHEET ── */}
      {isOpen && notifications.length > 0 && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '12px 12px calc(24px + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            opacity: contentOpacity,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={12} color="#fff" style={{ opacity: 0.85 }} />
              <span style={{ fontSize: 11, fontWeight: 750, color: 'rgba(255,255,255,0.88)' }}>
                Notifikasi
              </span>
              {unreadNotifCount > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: 'var(--cms-accent)',
                  color: '#fff',
                }}>
                  {unreadNotifCount}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {unreadNotifCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  title="Baca Semua"
                  aria-label="Tandai semua dibaca"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.16)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCheck size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => clearNotifications()}
                title="Hapus Semua"
                aria-label="Hapus semua notifikasi"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {notifications.slice(0, 12).map((notif) => (
            <button
              key={notif.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notif.id);
                if (notif.data?.page) {
                  onClose();
                  onSwitchPage(notif.data.page);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 20,
                background: isDarkMode ? 'rgba(22, 24, 33, 0.96)' : 'rgba(255, 255, 255, 0.97)',
                border: notif.read
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid var(--cms-accent-border, rgba(217, 86, 41, 0.45))',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
                color: isDarkMode ? '#fff' : '#0f172a',
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  marginTop: 5,
                  flexShrink: 0,
                  background: notif.read ? 'var(--cms-text-muted)' : 'var(--cms-accent)',
                  opacity: notif.read ? 0.35 : 1,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {notif.title || 'Info'}
                  </span>
                  {notif.timeLabel && (
                    <span style={{ fontSize: 10, color: 'var(--cms-text-muted)', flexShrink: 0 }}>
                      {notif.timeLabel}
                    </span>
                  )}
                </div>
                {notif.message && (
                  <div style={{
                    fontSize: 11.5,
                    color: 'var(--cms-text-muted)',
                    marginTop: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {notif.message}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileControlPanel;
