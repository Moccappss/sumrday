import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Database, Layers, ArrowRight, X, 
  FolderKanban, StickyNote, Store, 
  Receipt, Globe, ChevronDown, ChevronUp, Clock, Settings, Loader2, Cloud, Shield, WifiOff, Zap, Info, Activity
} from 'lucide-react';
import { googleSync } from '../../utils/googleSync';
import { storage } from '../../utils/storage';
import { SystemHealthPanel } from './SystemHealthTrafficMonitor';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;
  notify: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setProjects?: (projects: any[]) => void;
  onNavigateSettings?: () => void;
}

const PAGE_NAMES: Record<string, { title: string; desc: string; icon: any }> = {
  projects: { title: 'Manajemen Project', desc: 'Proyek, milestone, deadline & progress', icon: <FolderKanban size={15} /> },
  notes: { title: 'Catatan & Kanvas', desc: 'Memo teks dan objek kanvas kreatif', icon: <StickyNote size={15} /> },
  memo: { title: 'Catatan & Kanvas', desc: 'Memo teks dan objek kanvas kreatif', icon: <StickyNote size={15} /> },
  memos: { title: 'Catatan & Kanvas', desc: 'Memo teks dan objek kanvas kreatif', icon: <StickyNote size={15} /> },
  website: { title: 'Website & Blog', desc: 'Artikel blog, halaman kustom & konten', icon: <Globe size={15} /> },
  blog: { title: 'Website & Blog', desc: 'Artikel blog, halaman kustom & konten', icon: <Globe size={15} /> },
  builder: { title: 'Website & Halaman', desc: 'Blok konten dan landing page', icon: <Globe size={15} /> },
  pages: { title: 'Website & Halaman', desc: 'Blok konten dan landing page', icon: <Globe size={15} /> },
  whiteboard: { title: 'Papan Kanvas', desc: 'Objek dan diagram kanvas', icon: <Layers size={15} /> },
  shop: { title: 'Katalog Toko', desc: 'Daftar produk, paket layanan & harga', icon: <Store size={15} /> },
  katalog: { title: 'Katalog Toko', desc: 'Daftar produk, paket layanan & harga', icon: <Store size={15} /> },
  transactions: { title: 'Data Transaksi', desc: 'Rekap invoice & riwayat transaksi', icon: <Receipt size={15} /> },
};

function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) return 'Belum pernah';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  activePage,
  notify,
  setProjects,
  onNavigateSettings
}) => {
  // ── ALL HOOKS CALLED UNCONDITIONALLY AT THE TOP ──
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState<'page' | 'all' | 'cloud' | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => localStorage.getItem('cms_sidebar_expanded') !== 'false');
  const [syncMode, setSyncMode] = useState<'auto' | 'manual' | 'offline'>(() => {
    return (localStorage.getItem('porto_sync_mode') as any) || 'auto';
  });
  const [syncTimes, setSyncTimes] = useState<{
    all: number | null;
    projects: number | null;
    notes: number | null;
    website: number | null;
    shop: number | null;
  }>({ all: null, projects: null, notes: null, website: null, shop: null });

  const loadSyncData = async () => {
    const s = await storage.getItem('porto_settings', {});
    setIsConfigured(Boolean(s.googleAppsScriptUrl && s.googleSheetId));
    
    // Accurate sync mode priority: localStorage as active state, then settings, default 'auto'
    const storedLocalMode = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_sync_mode') as 'auto' | 'manual' | 'offline' : null;
    const currentMode = storedLocalMode || s.syncMode || 'auto';
    setSyncMode(currentMode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('porto_sync_mode', currentMode);
    }
    if (s.syncMode !== currentMode) {
      storage.setItem('porto_settings', { ...s, syncMode: currentMode }, currentMode !== 'offline').catch(() => {});
    }
    
    const [all, projects, notes, website, shop] = await Promise.all([
      storage.getItem('porto_last_sync_all', null),
      storage.getItem('porto_last_sync_projects', null),
      storage.getItem('porto_last_sync_notes', null),
      storage.getItem('porto_last_sync_website', null),
      storage.getItem('porto_last_sync_shop', null),
    ]);

    setSyncTimes({ all, projects, notes, website, shop });
  };

  const handleModeChange = async (mode: 'auto' | 'manual' | 'offline') => {
    setSyncMode(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('porto_sync_mode', mode);
    }
    window.dispatchEvent(new CustomEvent('porto_sync_mode_changed', { detail: { mode } }));
    const settings = await storage.getItem('porto_settings', {});
    await storage.setItem('porto_settings', { ...settings, syncMode: mode }, mode !== 'offline');
    notify(`Mode sinkronisasi: ${mode === 'auto' ? 'Otomatis (Realtime)' : mode === 'manual' ? 'Hemat Kuota (Manual)' : 'Mode Offline (Lokal)'}`, 'info');
  };

  const [anchorPos, setAnchorPos] = useState<{ left: number; bottom: number } | null>(null);

  const calculateAnchorPos = () => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 768) {
      setAnchorPos(null);
      return;
    }
    const isExp = localStorage.getItem('cms_sidebar_expanded') !== 'false';
    const sidebarEl = document.querySelector('.cms-sidebar');
    let left = isExp ? 280 : 96;
    if (sidebarEl) {
      const rect = sidebarEl.getBoundingClientRect();
      if (rect.right > 0 && rect.right < 400) {
        left = rect.right + 16;
      }
    }
    setAnchorPos({ left, bottom: 28 });
  };

  useEffect(() => {
    if (isOpen) {
      loadSyncData();
      calculateAnchorPos();
      // On mobile only, auto close mobile drawer menu when sync popover opens
      if (window.innerWidth < 768) {
        window.dispatchEvent(new CustomEvent('cms_sidebar_set_expanded', { detail: { isExpanded: false } }));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSyncDone = () => loadSyncData();
    window.addEventListener('porto_sync_completed', handleSyncDone);
    return () => window.removeEventListener('porto_sync_completed', handleSyncDone);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
      calculateAnchorPos();
    };
    const handleSidebar = (e: any) => {
      setSidebarExpanded(e.detail.isExpanded);
      setTimeout(calculateAnchorPos, 150);
    };
    const handleCloseOnAction = () => { if (!isSyncing) onClose(); };

    window.addEventListener('resize', handleResize);
    window.addEventListener('cms_sidebar_toggle', handleSidebar);
    window.addEventListener('porto_switch_page', handleCloseOnAction);
    window.addEventListener('cms_sidebar_toggle_request', handleCloseOnAction);
    window.addEventListener('cms_global_add', handleCloseOnAction);
    window.addEventListener('porto_toggle_notifications', handleCloseOnAction);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('cms_sidebar_toggle', handleSidebar);
      window.removeEventListener('porto_switch_page', handleCloseOnAction);
      window.removeEventListener('cms_sidebar_toggle_request', handleCloseOnAction);
      window.removeEventListener('cms_global_add', handleCloseOnAction);
      window.removeEventListener('porto_toggle_notifications', handleCloseOnAction);
    };
  }, [isSyncing, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSyncing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSyncing, onClose]);

  // ── EARLY RETURN ONLY AFTER ALL HOOKS ARE INITIALIZED ──
  if (!isOpen) return null;

  const activePageInfo = PAGE_NAMES[activePage.toLowerCase()] || {
    title: `Halaman (${activePage})`,
    desc: 'Sinkronisasi data halaman aktif',
    icon: <Layers size={15} />
  };

  const handleSyncCurrentPage = async () => {
    setIsSyncing(true);
    setSyncType('page');
    try {
      await googleSync.syncCurrentPage(activePage, notify, setProjects);
      await loadSyncData();
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      notify('Gagal sinkronisasi: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSyncing(false);
      setSyncType(null);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncType('all');
    try {
      await googleSync.syncAllData(notify);
      await loadSyncData();
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      notify('Gagal sinkronisasi database: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSyncing(false);
      setSyncType(null);
    }
  };

  const handleBackupMasterToDrive = async () => {
    setIsSyncing(true);
    setSyncType('drive_backup' as any);
    try {
      await googleSync.backupToDrive(notify);
      await loadSyncData();
    } catch (err: any) {
      notify('Gagal backup ke Drive: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
      setSyncType(null);
    }
  };

  const handleRestoreMasterFromDrive = async () => {
    if (!confirm('Apakah Anda yakin ingin memulihkan seluruh database dari Google Drive? Data lokal akan diperbarui sesuai arsip di Drive.')) {
      return;
    }
    setIsSyncing(true);
    setSyncType('drive_restore' as any);
    try {
      await googleSync.restoreFromDrive(notify);
      await loadSyncData();
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      notify('Gagal restore dari Drive: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
      setSyncType(null);
    }
  };

  const handleBuildDashboard = async () => {
    setIsSyncing(true);
    setSyncType('dashboard' as any);
    try {
      await googleSync.buildDashboard(notify);
    } catch (err: any) {
      notify('Gagal membangun dashboard: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
      setSyncType(null);
    }
  };

  const handleForceCloudSave = async () => {
    setIsSyncing(true);
    setSyncType('cloud');
    try {
      window.dispatchEvent(new Event('porto_save_start'));
      await storage.flushDebounced();
      window.dispatchEvent(new Event('porto_saved'));
      notify('Seluruh data berhasil dicadangkan ke Cloud.');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      notify('Gagal menyimpan ke cloud: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
      setSyncType(null);
    }
  };

  // Active theme configuration based on mode
  const modeConfig = {
    auto: {
      color: '#10b981',
      bgLight: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.25)',
      name: 'Otomatis',
      desc: 'Realtime background sync ke Cloud & Google Sheets.',
      icon: <Zap size={15} strokeWidth={2.2} />
    },
    manual: {
      color: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
      name: 'Hemat Kuota',
      desc: 'Sheets hanya disinkronkan saat tombol ditekan.',
      icon: <Shield size={15} strokeWidth={2.2} />
    },
    offline: {
      color: '#6366f1',
      bgLight: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.25)',
      name: 'Offline',
      desc: '100% data tersimpan di memori browser lokal (0 kuota).',
      icon: <WifiOff size={15} strokeWidth={2.2} />
    }
  }[syncMode];

  // Modules detail list based on Tri-Tier Cloud Storage Architecture
  const modulesList = [
    { label: 'Google Drive Vault', status: 'Master SSOT', time: syncTimes.all, icon: <Cloud size={13} color="#3b82f6" /> },
    { label: 'Firebase Live Relay', status: syncMode === 'offline' ? 'Offline' : 'Token Saver (99.8%)', time: 'Realtime', icon: <Zap size={13} color="#10b981" /> },
    { label: 'Cloudinary Media CDN', status: 'Optimasi WebP', time: 'CDN Aktif', icon: <Layers size={13} color="#f43f5e" /> },
    { label: 'Halaman & Web Builder', status: syncMode === 'auto' ? 'Otomatis' : syncMode === 'manual' ? 'Manual' : 'Offline', time: syncTimes.website || syncTimes.all, icon: <Globe size={13} color="#3b82f6" /> },
    { label: 'Proyek & Jadwal', status: syncMode === 'auto' ? 'Otomatis' : syncMode === 'manual' ? 'Manual' : 'Offline', time: syncTimes.projects || syncTimes.all, icon: <FolderKanban size={13} color="#f59e0b" /> },
    { label: 'Dokumen & Memo Drive', status: 'Master Drive', time: syncTimes.notes || syncTimes.all, icon: <StickyNote size={13} color="#ec4899" /> },
    { label: 'Katalog & Transaksi', status: syncMode === 'auto' ? 'Otomatis' : syncMode === 'manual' ? 'Manual' : 'Offline', time: syncTimes.shop || syncTimes.all, icon: <Store size={13} color="#10b981" /> }
  ];

  const handleSafeClose = () => {
    if (isSyncing) {
      notify('⏳ Sinkronisasi berlanjut di latar belakang...', 'info');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop for click-outside closing */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          zIndex: 9998,
          cursor: 'pointer'
        }}
        onClick={handleSafeClose}
      />

      {/* Solid Compact Card Popover (Anchored right next to the left sidebar) */}
      <div 
        className="cms-sync-popover"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: (typeof window !== 'undefined' && window.innerWidth >= 768)
            ? (anchorPos ? anchorPos.left : (sidebarExpanded ? 280 : 96))
            : '50%',
          bottom: (typeof window !== 'undefined' && window.innerWidth >= 768)
            ? (anchorPos ? anchorPos.bottom : 28)
            : 85,
          transform: (typeof window !== 'undefined' && window.innerWidth >= 768) ? 'none' : 'translateX(-50%)',
          width: isMobileScreen ? 'calc(100vw - 32px)' : 340,
          maxWidth: 360,
          maxHeight: isMobileScreen ? '85vh' : 'calc(100vh - 100px)',
          background: 'var(--cms-card-bg, #ffffff)',
          border: `1.5px solid ${modeConfig.border}`,
          borderRadius: 20,
          padding: '14px',
          boxShadow: '0 14px 40px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxSizing: 'border-box',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          animation: isMobileScreen ? 'cmsFadeIn 0.2s ease-out' : 'cmsPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.2s ease, border-color 0.2s ease',
          color: 'var(--cms-text)'
        }}
      >
        {/* Header with Striking Mode Distinction (No Emojis) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cms-border, rgba(0,0,0,0.08))', paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: modeConfig.bgLight,
              color: modeConfig.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {modeConfig.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 5 }}>
                Mode {modeConfig.name}
                <span style={{ 
                  fontSize: 8.5, 
                  background: modeConfig.color, 
                  color: '#ffffff', 
                  padding: '1px 5px', 
                  borderRadius: 4, 
                  fontWeight: 700 
                }}>
                  {syncMode.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Clock size={10.5} />
                <span>Sheets: {formatTimeAgo(syncTimes.all)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSafeClose}
            title={isSyncing ? "Tutup (Sinkronisasi berlanjut di background)" : "Tutup"}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--cms-text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* 3-Mode Selector (Striking & Visual) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'var(--cms-bg, #f3f4f6)',
          borderRadius: 10,
          padding: 2.5,
          gap: 2
        }}>
          <button
            onClick={() => handleModeChange('auto')}
            style={{
              padding: '5px 2px',
              borderRadius: 8,
              border: 'none',
              background: syncMode === 'auto' ? '#10b981' : 'transparent',
              boxShadow: syncMode === 'auto' ? '0 2px 5px rgba(16, 185, 129, 0.3)' : 'none',
              color: syncMode === 'auto' ? '#ffffff' : 'var(--cms-text-muted)',
              fontSize: 10.5,
              fontWeight: syncMode === 'auto' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={11} /> Otomatis
          </button>

          <button
            onClick={() => handleModeChange('manual')}
            style={{
              padding: '5px 2px',
              borderRadius: 8,
              border: 'none',
              background: syncMode === 'manual' ? '#f59e0b' : 'transparent',
              boxShadow: syncMode === 'manual' ? '0 2px 5px rgba(245, 158, 11, 0.3)' : 'none',
              color: syncMode === 'manual' ? '#ffffff' : 'var(--cms-text-muted)',
              fontSize: 10.5,
              fontWeight: syncMode === 'manual' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={11} /> Hemat
          </button>

          <button
            onClick={() => handleModeChange('offline')}
            style={{
              padding: '5px 2px',
              borderRadius: 8,
              border: 'none',
              background: syncMode === 'offline' ? '#6366f1' : 'transparent',
              boxShadow: syncMode === 'offline' ? '0 2px 5px rgba(99, 102, 241, 0.3)' : 'none',
              color: syncMode === 'offline' ? '#ffffff' : 'var(--cms-text-muted)',
              fontSize: 10.5,
              fontWeight: syncMode === 'offline' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              transition: 'all 0.15s ease'
            }}
          >
            <WifiOff size={11} /> Offline
          </button>
        </div>

        {/* Minimal Info Bar with (i) toggle button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: modeConfig.bgLight,
          border: `1px solid ${modeConfig.border}`,
          padding: '5px 8px',
          borderRadius: 8,
          fontSize: 10.5,
          color: modeConfig.color
        }}>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {modeConfig.desc}
          </span>
          <button
            onClick={() => setShowInfo(!showInfo)}
            title="Penjelasan mode"
            style={{
              background: 'transparent',
              border: 'none',
              color: modeConfig.color,
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Info size={13} />
          </button>
        </div>

        {/* Expandable Info Detail (Only when (i) is clicked) */}
        {showInfo && (
          <div style={{
            fontSize: 10,
            color: 'var(--cms-text)',
            background: 'var(--cms-bg, #f9fafb)',
            border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
            borderRadius: 8,
            padding: '7px 9px',
            lineHeight: 1.35
          }}>
            {syncMode === 'auto' && 'Realtime background relay ke Firebase & cache lokal. Snapshot Master dicadangkan ke Google Drive Vault.'}
            {syncMode === 'manual' && 'Perubahan disimpan ke cache lokal & Firebase relay. Sinkronisasi Google Drive/Sheets dilakukan manual.'}
            {syncMode === 'offline' && 'Perubahan hanya disimpan di IndexedDB lokal. 100% tanpa transfer internet.'}
          </div>
        )}

        {/* Action Buttons (Clean & Minimal) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Button 1: Sync Current Page */}
          <button
            onClick={handleSyncCurrentPage}
            disabled={isSyncing || !isConfigured}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
              background: 'var(--cms-bg, #f9fafb)',
              cursor: (isSyncing || !isConfigured) ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              opacity: (isSyncing && syncType !== 'page') ? 0.4 : 1
            }}
            onMouseEnter={e => {
              if (!isSyncing && isConfigured) {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(0,0,0,0.1))';
              e.currentTarget.style.background = 'var(--cms-bg, #f9fafb)';
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isSyncing && syncType === 'page' ? (
                <Loader2 size={12} className="cms-spin" />
              ) : (
                activePageInfo.icon
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)' }}>
                Sinkron Halaman Ini
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activePageInfo.title}
              </div>
            </div>

            <ArrowRight size={11} color="var(--cms-text-muted)" />
          </button>

          {/* Button 2: Sync All Data */}
          <button
            onClick={handleSyncAll}
            disabled={isSyncing || !isConfigured}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
              background: 'var(--cms-bg, #f9fafb)',
              cursor: (isSyncing || !isConfigured) ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              opacity: (isSyncing && syncType !== 'all') ? 0.4 : 1
            }}
            onMouseEnter={e => {
              if (!isSyncing && isConfigured) {
                e.currentTarget.style.borderColor = 'var(--cms-accent, #6366f1)';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(0,0,0,0.1))';
              e.currentTarget.style.background = 'var(--cms-bg, #f9fafb)';
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'var(--cms-accent-soft, rgba(99, 102, 241, 0.1))',
              color: 'var(--cms-accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isSyncing && syncType === 'all' ? (
                <Loader2 size={12} className="cms-spin" />
              ) : (
                <Database size={12} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)' }}>
                Sinkron Semua Data
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--cms-text-muted)' }}>
                Proyek, Notes, Website, Toko
              </div>
            </div>

            <ArrowRight size={11} color="var(--cms-text-muted)" />
          </button>

          {/* Button 3: Google Drive Master Backup */}
          <button
            onClick={handleBackupMasterToDrive}
            disabled={isSyncing || !isConfigured}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
              background: 'var(--cms-bg, #f9fafb)',
              cursor: (isSyncing || !isConfigured) ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              opacity: (isSyncing && syncType !== ('drive_backup' as any)) ? 0.4 : 1
            }}
            onMouseEnter={e => {
              if (!isSyncing && isConfigured) {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.06)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(0,0,0,0.1))';
              e.currentTarget.style.background = 'var(--cms-bg, #f9fafb)';
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isSyncing && syncType === ('drive_backup' as any) ? (
                <Loader2 size={12} className="cms-spin" />
              ) : (
                <Cloud size={12} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)' }}>
                Simpan ke Google Drive
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--cms-text-muted)' }}>
                Arsip Master JSON di Drive Pribadi
              </div>
            </div>

            <ArrowRight size={11} color="var(--cms-text-muted)" />
          </button>

          {/* Button 4: Google Drive Master Restore */}
          <button
            onClick={handleRestoreMasterFromDrive}
            disabled={isSyncing || !isConfigured}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
              background: 'var(--cms-bg, #f9fafb)',
              cursor: (isSyncing || !isConfigured) ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              opacity: (isSyncing && syncType !== ('drive_restore' as any)) ? 0.4 : 1
            }}
            onMouseEnter={e => {
              if (!isSyncing && isConfigured) {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.06)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(0,0,0,0.1))';
              e.currentTarget.style.background = 'var(--cms-bg, #f9fafb)';
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isSyncing && syncType === ('drive_restore' as any) ? (
                <Loader2 size={12} className="cms-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)' }}>
                Pulihkan dari Google Drive
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--cms-text-muted)' }}>
                Restore data ke perangkat ini
              </div>
            </div>

            <ArrowRight size={11} color="var(--cms-text-muted)" />
          </button>

          {/* Button 5: Google Sheets Dashboard Studio (Tab #1) */}
          <button
            onClick={handleBuildDashboard}
            disabled={isSyncing || !isConfigured}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
              background: 'var(--cms-bg, #f9fafb)',
              cursor: (isSyncing || !isConfigured) ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              opacity: (isSyncing && syncType !== ('dashboard' as any)) ? 0.4 : 1
            }}
            onMouseEnter={e => {
              if (!isSyncing && isConfigured) {
                e.currentTarget.style.borderColor = '#d95629';
                e.currentTarget.style.background = 'rgba(217, 86, 41, 0.08)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(0,0,0,0.1))';
              e.currentTarget.style.background = 'var(--cms-bg, #f9fafb)';
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'rgba(217, 86, 41, 0.12)',
              color: '#d95629',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isSyncing && syncType === ('dashboard' as any) ? (
                <Loader2 size={12} className="cms-spin" />
              ) : (
                <Activity size={12} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)' }}>
                Bangun Dashboard Studio
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--cms-text-muted)' }}>
                Format Tab #1 ringkasan eksekutif & kas
              </div>
            </div>

            <ArrowRight size={11} color="var(--cms-text-muted)" />
          </button>
        </div>

        {/* Dropdown / Accordion: System Health & Traffic Monitor */}
        <div style={{ borderTop: '1px solid var(--cms-border, rgba(0,0,0,0.08))', paddingTop: 6 }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowHealth(prev => !prev);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: showHealth ? 'var(--cms-input-bg, rgba(0,0,0,0.04))' : 'transparent',
              border: 'none',
              borderRadius: 8,
              color: 'var(--cms-text)',
              fontSize: 11,
              fontWeight: 750,
              cursor: 'pointer',
              padding: '6px 8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={13} color="#10b981" />
              <span>System Health &amp; Traffic</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981'
              }} />
              {showHealth ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {showHealth && (
            <div style={{ marginTop: 6 }}>
              <SystemHealthPanel />
            </div>
          )}
        </div>

        {/* Dropdown / Accordion: Rincian Status */}
        <div style={{ borderTop: '1px solid var(--cms-border, rgba(0,0,0,0.08))', paddingTop: 6 }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDetails(prev => !prev);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: showDetails ? 'var(--cms-input-bg, rgba(0,0,0,0.04))' : 'transparent',
              border: 'none',
              borderRadius: 8,
              color: 'var(--cms-text)',
              fontSize: 11,
              fontWeight: 750,
              cursor: 'pointer',
              padding: '6px 8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={13} color="var(--cms-accent, #6366f1)" />
              Rincian Status Modul
            </span>
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDetails && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginTop: 6,
              padding: '8px 10px',
              background: 'var(--cms-bg, #f9fafb)',
              borderRadius: 10,
              border: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
              fontSize: 10.5
            }}>
              {modulesList.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cms-text)', fontWeight: 650 }}>
                    {m.icon}
                    <span>{m.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 9,
                      background: m.status === 'Otomatis' || m.status === 'Realtime' || m.status.includes('Token') ? 'rgba(16, 185, 129, 0.12)' : m.status === 'Manual' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                      color: m.status === 'Otomatis' || m.status === 'Realtime' || m.status.includes('Token') ? '#10b981' : m.status === 'Manual' ? '#d97706' : '#6366f1',
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontWeight: 800
                    }}>
                      {m.status}
                    </span>
                    {m.time && (
                      <span style={{ fontSize: 9, color: 'var(--cms-text-muted)', fontWeight: 600 }}>
                        ({typeof m.time === 'string' ? m.time : formatTimeAgo(m.time)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mini Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9.5, color: 'var(--cms-text-muted)', paddingTop: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: modeConfig.color, fontWeight: 700 }}>
            {modeConfig.icon} Mode {modeConfig.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('porto_switch_page', { detail: 'storage' }));
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--cms-accent, #6366f1)',
                cursor: 'pointer',
                fontSize: 9.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Database size={10} /> Storage
            </button>
            {onNavigateSettings && (
              <button
                onClick={() => { onClose(); onNavigateSettings(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <Settings size={10} /> Pengaturan
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GoogleSyncModal;
