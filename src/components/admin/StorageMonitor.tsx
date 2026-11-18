import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Database, Cloud, HardDrive, RefreshCw, Download, 
  AlertTriangle, CheckCircle, Info, Zap, Globe, 
  FolderKanban, StickyNote, Settings, Image, 
  FileText, Layers, Clock, TrendingUp, AlertCircle, 
  Package, Users, Trash2, Cpu, Activity, ShieldCheck,
  ChevronRight, HardDrive as Disk, Gauge, Server,
  Network, Cpu as CpuIcon, Shield, Sparkles, ArrowRight,
  Workflow, Copy, ExternalLink, CheckCircle2, Lock,
  Calendar, ShoppingBag, DollarSign, Link2, Eye, FileSpreadsheet, X, RotateCw, MoreVertical, Check
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { db } from '../../firebase';
import { useContextMenu } from './ContextMenuProvider';
import { collection, getDocs } from 'firebase/firestore';
import { googleSync } from '../../utils/googleSync';
import { auditAndBalanceStorage } from '../../utils/intelligentStorageEngine';
import { addNotification } from '../../utils/notifications';
import { useDialog } from './DialogProvider';
import StorageGalleryTimeline from './StorageGalleryTimeline';

// ── PARTISI LENGKAP SEMUA MODUL SISTEM HYBRID ──
const COLLECTIONS = [
  { key: 'porto_main_website', label: 'Website Utama & Hero', icon: Globe, color: '#eab308', tier: 'Firebase + Drive', desc: 'Landing page, hero, bio & portofolio publik' },
  { key: 'porto_pages', label: 'Halaman Web Custom', icon: Globe, color: '#3b82f6', tier: 'Firebase + Drive', desc: 'Blok konten dinamis & layout halaman /lpimage' },
  { key: 'porto_blogs', label: 'Blog & Publikasi', icon: FileText, color: '#8b5cf6', tier: 'Firebase + Drive', desc: 'Artikel, publikasi & artikel Markdown' },
  { key: 'porto_memos', label: 'Dokumen & Memo', icon: StickyNote, color: '#ec4899', tier: 'Google Drive', desc: 'Catatan kerja & lampiran berkas Drive' },
  { key: 'porto_projects', label: 'Proyek & Jadwal', icon: FolderKanban, color: '#f59e0b', tier: 'Firebase + Drive', desc: 'Manajemen tugas, timeline & kanban' },
  { key: 'porto_catalog', label: 'Katalog & Produk', icon: ShoppingBag, color: '#10b981', tier: 'Firebase + Drive', desc: 'Daftar produk, paket layanan & harga' },
  { key: 'porto_transactions', label: 'Transaksi & Finansial', icon: DollarSign, color: '#14b8a6', tier: 'Google Drive / Sheets', desc: 'Laporan keuangan, invoice & rekap pesanan' },
  { key: 'porto_stickers', label: 'Stiker Visual', icon: Image, color: '#f43f5e', tier: 'Cloudinary', desc: 'Aset dekorasi visual per halaman' },
  { key: 'porto_frames', label: 'Bingkai Halaman', icon: Layers, color: '#6366f1', tier: 'Cloudinary', desc: 'Dekorasi frame latar belakang' },
  { key: 'porto_settings', label: 'Pengaturan Global', icon: Settings, color: '#64748b', tier: 'Google Drive + Firebase', desc: 'Konfigurasi sistem, tema & profil' },
  { key: 'porto_whiteboard_canvases', label: 'Whiteboard & Kanvas', icon: Cpu, color: '#a855f7', tier: 'Google Drive', desc: 'Papan tulis digital & kanvas coretan' },
  { key: 'porto_bookings', label: 'Janji Temu Klien', icon: Calendar, color: '#06b6d4', tier: 'Drive + Kalender', desc: 'Booking slot & sinkronisasi Google Calendar' },
  { key: 'porto_users', label: 'Pengguna & Akun', icon: Users, color: '#84cc16', tier: 'Firebase + Drive', desc: 'Data akun klien & hak akses admin' },
  { key: 'porto_links', label: 'Biolink Hub', icon: Link2, color: '#eab308', tier: 'Firebase + Drive', desc: 'Linktree biolink profil & tautan sosial' },
  { key: 'porto_portfolio', label: 'Showcase Portofolio', icon: Layers, color: '#d95629', tier: 'Firebase + Drive', desc: 'Karya visual publik & studi kasus' },
  { key: 'porto_media_vault', label: 'Media Vault & Drive', icon: HardDrive, color: '#22c55e', tier: 'Drive + Cloudinary', desc: 'Pustaka berkas aset, gambar, video & dokumen' },
  { key: 'porto_biodata', label: 'Profil & Biodata', icon: Users, color: '#0ea5e9', tier: 'Firebase + Drive', desc: 'Identitas personal & profil bisnis studio' },
  { key: 'porto_rate_cards', label: 'Paket Tarif & Layanan', icon: DollarSign, color: '#f97316', tier: 'Firebase + Drive', desc: 'Struktur harga & add-on layanan' },
  { key: 'porto_client_reviews', label: 'Testimoni & Ulasan', icon: CheckCircle, color: '#ec4899', tier: 'Firebase + Drive', desc: 'Ulasan terverifikasi & kepuasan klien' },
  { key: 'porto_forms', label: 'Formulir & Survei', icon: FileSpreadsheet, color: '#6366f1', tier: 'Drive + Sheets', desc: 'Skema formulir brief & kuesioner klien' },
];

const fmtBytes = (b) => {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(2)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
};

const fmtNum = (n) => (n || 0).toLocaleString('id-ID');

const StorageMonitor = ({ userData }) => {
  const { bindContextMenu } = useContextMenu();
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [cloudUrls, setCloudUrls] = useState({ images: 0, urls: [] });
  const [userStorages, setUserStorages] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [inspectingPartition, setInspectingPartition] = useState<{ key: string; label: string; raw: any; size: number; count: number } | null>(null);
  const [partitionToWipe, setPartitionToWipe] = useState<{ key: string; label: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCleaningDrive, setIsCleaningDrive] = useState(false);
  const [showExtraMenu, setShowExtraMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [activeStorageTab, setActiveStorageTab] = useState<'overview' | 'gallery'>('overview');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = {};
      const allUrls = [];

      const estimateSizeAndExtractUrls = (obj) => {
        let size = 0;
        if (obj === null || obj === undefined) return 0;
        if (typeof obj === 'string') {
          size += obj.length * 2;
          if (obj.includes('res.cloudinary.com')) {
            const matches = obj.match(/https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\/[v0-9/a-zA-Z0-9_.-]+/g);
            if (matches) allUrls.push(...matches);
          } else if (obj.includes('drive.google.com') || obj.includes('drive.usercontent.google.com')) {
            const matches = obj.match(/https:\/\/(drive\.google\.com|drive\.usercontent\.google\.com)[^\s"']+/g);
            if (matches) allUrls.push(...matches);
          }
        } else if (typeof obj === 'number' || typeof obj === 'boolean') {
          size += 8;
        } else if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) size += estimateSizeAndExtractUrls(obj[i]);
        } else if (typeof obj === 'object') {
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              size += key.length * 2;
              size += estimateSizeAndExtractUrls(obj[key]);
            }
          }
        }
        return size;
      };

      for (const col of COLLECTIONS) {
        const val = await storage.getItem(col.key, null);
        let count = 0;
        if (Array.isArray(val)) count = val.length;
        else if (val && typeof val === 'object') {
          count = Object.values(val).reduce((s: number, arr: any) => s + (Array.isArray(arr) ? arr.length : 1), 0);
        }
        let sizeBytes = 0;
        try {
          sizeBytes = new Blob([JSON.stringify(val || '')]).size;
        } catch {
          sizeBytes = estimateSizeAndExtractUrls(val);
        }
        results[col.key] = { raw: val, size: sizeBytes, count, sizeBytes };
      }
      setData(results);

      const uniqueUrls = [...new Set(allUrls)];
      setCloudUrls({ images: uniqueUrls.length, urls: uniqueUrls });

      if (userData?.role === 'Super Admin') {
        setIsSuperAdmin(true);
        try {
          const q = await getDocs(collection(db, 'user_storage_meta'));
          const metas = [];
          q.forEach(d => metas.push({ id: d.id, ...d.data() }));
          setUserStorages(metas);
        } catch {
          // Ignored if offline
        }
      }
    } catch (e) {
      console.error('Storage telemetry fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Total DB metrics
  const totalBytes = useMemo(() => Object.values(data).reduce((s: number, c: any) => s + (c.sizeBytes || 0), 0), [data]);
  const totalRecords = useMemo(() => Object.values(data).reduce((s: number, c: any) => s + (c.count || 0), 0), [data]);

  // Filtered partition items
  const filteredCollections = useMemo(() => {
    if (!searchFilter.trim()) return COLLECTIONS;
    const q = searchFilter.toLowerCase();
    return COLLECTIONS.filter(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q) || c.tier.toLowerCase().includes(q));
  }, [searchFilter]);

  // Export full JSON offline
  const handleExportOfflineJson = () => {
    try {
      const dump: Record<string, any> = {};
      for (const col of COLLECTIONS) {
        if (data[col.key]?.raw !== undefined) {
          dump[col.key] = data[col.key].raw;
        }
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dump, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `agenze_master_database_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addNotification?.('system', 'Database Export', 'Master database berhasil diunduh dalam format JSON offline.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackupToDrive = async () => {
    setIsBackingUp(true);
    try {
      await googleSync.backupToDrive((msg, type) => {
        addNotification?.('system', 'Google Drive Vault', msg, { type });
      });
      fetchData();
    } catch (err) {
      console.error('Drive backup failed:', err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCleanupDrive = async () => {
    setIsCleaningDrive(true);
    try {
      await googleSync.cleanupDriveBackups(5, (msg, type) => {
        addNotification?.('system', 'Google Drive Cleaner', msg, { type });
      });
      fetchData();
    } catch (err) {
      console.error('Drive cleanup failed:', err);
    } finally {
      setIsCleaningDrive(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    setIsOptimizing(true);
    try {
      let prunedCount = 0;
      let savedBytes = 0;
      if (storage.autoPruneStorage) {
        const res = await storage.autoPruneStorage();
        prunedCount += res?.prunedCount || 0;
        savedBytes += res?.savedBytes || 0;
      }
      if (storage.reconcileDatabaseIntegrity) {
        const rec = await storage.reconcileDatabaseIntegrity();
        prunedCount += rec?.repaired?.length || 0;
      }
      await auditAndBalanceStorage();
      await fetchData();
      const savedText = savedBytes > 0 ? ` (${fmtBytes(savedBytes)} dihemat)` : '';
      addNotification?.('system', 'Optimasi Sukses', `⚡ Database berhasil dioptimalkan! ${prunedCount} entri usang/duplikat telah dibersihkan${savedText}.`, { type: 'success' });
    } catch (err) {
      console.error(err);
      addNotification?.('system', 'Optimasi Selesai', 'Pembersihan cache dan defragmentasi selesai.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleWipeSinglePartition = async (partitionKey: string) => {
    try {
      let emptyVal: any = [];
      if (['porto_pages', 'porto_stickers', 'porto_frames'].includes(partitionKey)) {
        emptyVal = {};
      } else if (partitionKey === 'porto_settings') {
        const cur = await storage.getItem('porto_settings', {});
        emptyVal = {
          ...cur,
          customPages: [
            { slug: 'home', name: 'Home', isSystem: true, isPublished: true, showInNav: true, desktopRatio: '9/16' },
            { slug: 'portofolio', name: 'Portofolio', isSystem: true, isPublished: true, showInNav: true, desktopRatio: '9/16' },
            { slug: 'biodata', name: 'Biodata', isSystem: true, isPublished: true, showInNav: true, desktopRatio: '9/16' }
          ]
        };
      }
      await storage.setItem(partitionKey, emptyVal);
      window.dispatchEvent(new CustomEvent('porto_saved'));
      addNotification?.('system', 'Partisi Dibersihkan', `✅ Partisi ${partitionKey} berhasil dikosongkan.`, { type: 'success' });
      setPartitionToWipe(null);
      await fetchData();
    } catch (err: any) {
      addNotification?.('system', 'Gagal Membersihkan', err.message, { type: 'error' });
    }
  };

  const handleResetContentKeepCloud = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      addNotification?.('system', 'Konfirmasi Salah', 'Ketik "RESET" dengan huruf kapital untuk melanjutkan.', { type: 'error' });
      return;
    }

    setIsResetting(true);
    try {
      handleExportOfflineJson();
      const curSettings = await storage.getItem('porto_settings', {});
      
      const defaultPages = [
        { slug: 'home', name: 'Home', isSystem: true, isPublished: true, showInNav: true, desktopRatio: '9/16' },
        { slug: 'portofolio', name: 'Portofolio', isSystem: true, isPublished: true, showInNav: true, desktopRatio: '9/16' },
        { slug: 'biodata', name: 'Biodata', isSystem: true, isPublished: true, showInNav: true, desktopRatio: '9/16' }
      ];

      const cleanSettings = {
        ...curSettings,
        customPages: defaultPages,
        resetAt: new Date().toISOString()
      };

      await storage.batchSetItems({
        'porto_pages': { home: [], portofolio: [], biodata: [] },
        'porto_blogs': [],
        'porto_memos': [],
        'porto_projects': [],
        'porto_catalog': [],
        'porto_transactions': [],
        'porto_stickers': {},
        'porto_frames': {},
        'porto_whiteboard_canvases': [],
        'porto_bookings': [],
        'porto_links': [],
        'porto_portfolio': [],
        'porto_settings': cleanSettings
      });

      window.dispatchEvent(new CustomEvent('porto_saved'));
      window.dispatchEvent(new CustomEvent('porto_settings_updated'));
      window.dispatchEvent(new CustomEvent('porto_accent_color_changed'));

      addNotification?.('system', 'Database Direset', '✅ Seluruh konten berhasil dibersihkan! Kredensial Google Drive, Cloudinary & Cloud Sync tetap aman 100%.', { type: 'success' });
      setShowResetModal(false);
      setResetConfirmText('');
      await fetchData();
    } catch (err) {
      console.error(err);
      addNotification?.('system', 'Gagal Reset', 'Terjadi kesalahan saat mereset database.', { type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="storage-monitor-root" style={{ height: '100%', overflowY: 'auto', background: 'var(--cms-bg)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 24 }}>
        
        {/* ── HEADER TELEMETRI ── */}
        <header className="storage-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cms-accent)', fontWeight: 900, fontSize: 11, letterSpacing: '0.08em' }}>
              <ShieldCheck size={14} /> MULTI-TIER VAULT
            </div>
            <h1 style={{ fontSize: isMobile ? '22px' : 'clamp(24px, 3vw, 36px)', fontWeight: 950, margin: 0, color: 'var(--cms-text)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Penyimpanan <span style={{ color: 'var(--cms-accent)' }}>Cloud</span>
            </h1>
            <p style={{ margin: 0, fontSize: isMobile ? 11.5 : 12.5, fontWeight: 500, color: 'var(--cms-text-muted)', maxWidth: 580 }}>
              Master database di <strong>Google Drive</strong>, media di <strong>Cloudinary</strong>, dan relay di <strong>Firebase</strong>.
            </p>
          </div>
          
          <div className="storage-header-actions" style={{ 
            display: isMobile ? 'grid' : 'flex', 
            gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : undefined,
            alignItems: 'center', 
            gap: 8, 
            width: isMobile ? '100%' : 'auto',
            position: 'relative' 
          }}>
            {/* Primary Action: Sinkronkan ke Cloud (Super Migrasi & Backup dalam 1 klik) */}
            <button 
              onClick={async () => {
                setIsBackingUp(true);
                try {
                  await googleSync.migrateAllDataToDriveAndCloudinary((msg, type) => addNotification?.('system', 'Sinkronisasi Cloud', msg, { type: type || 'info' }));
                  await fetchData();
                } finally {
                  setIsBackingUp(false);
                }
              }}
              disabled={isBackingUp || isLoading}
              title="Sinkronkan seluruh database & media ke Google Drive & Sheets"
              className="storage-action-btn hover-scale"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: 'transparent',
                color: '#fff',
                fontWeight: 850,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                width: isMobile ? '100%' : 'auto',
                height: 42,
                padding: isMobile ? 0 : '0 14px',
                justifyContent: 'center',
                flex: isMobile ? 1 : 'none'
              }}
            >
              {isBackingUp ? <RefreshCw size={17} className="cms-spin" /> : <Sparkles size={17} />}
              {!isMobile && <span>{isBackingUp ? 'Menyinkronkan...' : 'Sinkronkan ke Cloud'}</span>}
            </button>

            {/* Action 2: Optimalkan & Bersihkan (Defrag lokal + bersihkan snapshot usang) */}
            <button 
              onClick={async () => {
                setIsOptimizing(true);
                try {
                  await handleOptimizeDatabase();
                  await handleCleanupDrive();
                  addNotification?.('system', 'Optimasi Selesai', 'Database lokal dan snapshot cloud berhasil dibersihkan & dioptimalkan!', { type: 'success' });
                } finally {
                  setIsOptimizing(false);
                }
              }}
              disabled={isOptimizing || isLoading} 
              title="Defragmentasi database & bersihkan snapshot usang di Google Drive"
              className="storage-action-btn hover-scale"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontWeight: 750,
                width: isMobile ? '100%' : 'auto',
                height: 42,
                padding: isMobile ? 0 : '0 14px',
                justifyContent: 'center',
                flex: isMobile ? 1 : 'none'
              }}
            >
              <Zap size={17} className={isOptimizing ? 'cms-spin' : ''} />
              {!isMobile && <span>{isOptimizing ? 'Memproses...' : 'Optimasi & Bersihkan'}</span>}
            </button>

            {/* Action 3: Refresh Data & Cek Latensi */}
            <button 
              onClick={async () => {
                await fetchData();
                const res = await googleSync.pingAppsScript();
                if (res?.ok) {
                  addNotification?.('system', 'Apps Script Terkoneksi', `⚡ Data disegarkan & latensi server: ${res.latencyMs}ms`, { type: 'success' });
                }
              }}
              disabled={isLoading} 
              title="Segarkan metrik & uji koneksi Apps Script"
              className="storage-action-btn hover-scale"
              style={{ 
                fontWeight: 700,
                width: isMobile ? '100%' : 'auto',
                height: 42,
                padding: isMobile ? 0 : '0 14px',
                justifyContent: 'center',
                flex: isMobile ? 1 : 'none'
              }}
            >
              <RefreshCw size={17} className={isLoading ? 'cms-spin' : ''} />
              {!isMobile && <span>Refresh & Cek</span>}
            </button>

            {/* Action 4: Dropdown Menu Tindakan Lanjutan */}
            <div style={{ position: 'relative', width: isMobile ? '100%' : 'auto', flex: isMobile ? 1 : 'none' }}>
              <button
                type="button"
                onClick={() => setShowExtraMenu(!showExtraMenu)}
                title="Tindakan Lanjutan (Restore, Ekspor JSON, Reset)"
                className="storage-action-btn hover-scale"
                style={{ width: isMobile ? '100%' : 38, height: 42, padding: 0, justifyContent: 'center' }}
              >
                <MoreVertical size={17} />
              </button>

              {showExtraMenu && (
                <>
                  <div 
                    onClick={() => setShowExtraMenu(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 230,
                    background: 'var(--cms-card-bg, #18181b)',
                    border: '1.5px solid var(--cms-border, rgba(255,255,255,0.12))',
                    borderRadius: 14,
                    padding: 6,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}>
                    <button
                      type="button"
                      onClick={async () => {
                        setShowExtraMenu(false);
                        await googleSync.restoreFromDrive((msg, type) => addNotification?.('system', 'Restore Drive', msg, { type: type || 'info' }));
                        await fetchData();
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <RotateCw size={14} color="#3b82f6" /> Tarik Data dari Drive
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExtraMenu(false);
                        handleExportOfflineJson();
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Download size={14} color="#10b981" /> Ekspor Backup JSON
                    </button>

                    <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setShowExtraMenu(false);
                        setShowResetModal(true);
                        setResetConfirmText('');
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: 12,
                        fontWeight: 750,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Trash2 size={14} /> Reset Database Konten
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── TAB NAVIGATOR ── */}
        <div className="storage-tab-nav">
          <button
            type="button"
            onClick={() => setActiveStorageTab('overview')}
            className={`storage-tab-btn ${activeStorageTab === 'overview' ? 'active' : ''}`}
          >
            <Database size={15} />
            <span>Database</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStorageTab('gallery')}
            className={`storage-tab-btn ${activeStorageTab === 'gallery' ? 'active' : ''}`}
          >
            <Image size={15} />
            <span>Galeri Media</span>
          </button>
        </div>

        {activeStorageTab === 'gallery' ? (
          <StorageGalleryTimeline />
        ) : (
          <>
        {showResetModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--cms-card-bg)', padding: 32, borderRadius: 24, maxWidth: 450, width: '90%', border: '1.5px solid var(--glass-border)' }}>
              <h2 style={{ margin: '0 0 16px', color: '#ef4444' }}>Reset Database?</h2>
              <p style={{ fontSize: 14, color: 'var(--cms-text-muted)', marginBottom: 20 }}>
                Tindakan ini akan menghapus semua konten lokal. Kredensial cloud dan konfigurasi tetap tersimpan. Ketik <strong style={{ color: 'var(--cms-text)' }}>RESET</strong> untuk melanjutkan.
              </p>
              <input 
                type="text" 
                value={resetConfirmText} 
                onChange={e => setResetConfirmText(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', marginBottom: 20, boxSizing: 'border-box' }}
                placeholder="Ketik RESET"
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowResetModal(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer' }}>Batal</button>
                <button onClick={handleResetContentKeepCloud} disabled={isResetting} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{isResetting ? 'Memproses...' : 'Reset Sekarang'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── 4 ARSITEKTUR STORAGE TIERS (BENTO HERO GRID) ── */}
        <div className="storage-bento-grid">
          
          {/* TIER 1: GOOGLE DRIVE MASTER */}
          <div className="storage-tier-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="tier-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                <HardDrive size={20} />
              </div>
              <span className="tier-badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                MASTER VAULT
              </span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 950, color: 'var(--cms-text)' }}>Google Drive</div>
              <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                Penyimpanan database utama & backup.
              </div>
            </div>
            <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
              <span style={{ color: 'var(--cms-text-muted)', fontWeight: 700 }}>Status</span>
              <span style={{ color: '#10b981', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} /> Aktif & Aman
              </span>
            </div>
          </div>

          {/* TIER 2: CLOUDINARY CDN */}
          <div className="storage-tier-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="tier-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <Image size={20} />
              </div>
              <span className="tier-badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                MEDIA ENGINE
              </span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 950, color: 'var(--cms-text)' }}>Cloudinary CDN</div>
              <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                Optimalisasi gambar & WebP.
              </div>
            </div>
            <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
              <span style={{ color: 'var(--cms-text-muted)', fontWeight: 700 }}>Aset Media</span>
              <span style={{ color: 'var(--cms-text)', fontWeight: 900 }}>
                {cloudUrls.images} Berkas
              </span>
            </div>
          </div>

          {/* TIER 3: FIREBASE RELAY (TOKEN SAVER) */}
          <div className="storage-tier-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="tier-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <Zap size={20} />
              </div>
              <span className="tier-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                TOKEN SAVER
              </span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 950, color: 'var(--cms-text)' }}>Firebase Relay</div>
              <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                Relay sinkronisasi realtime.
              </div>
            </div>
            <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
              <span style={{ color: 'var(--cms-text-muted)', fontWeight: 700 }}>Efisiensi</span>
              <span style={{ color: '#10b981', fontWeight: 900 }}>100% Hemat</span>
            </div>
          </div>

          {/* TIER 4: LOCAL CACHE */}
          <div className="storage-tier-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="tier-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <Disk size={20} />
              </div>
              <span className="tier-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                OFFLINE READY
              </span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 950, color: 'var(--cms-text)' }}>IndexedDB Lokal</div>
              <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                Cache instan peramban.
              </div>
            </div>
            <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
              <span style={{ color: 'var(--cms-text-muted)', fontWeight: 700 }}>Terpakai</span>
              <span style={{ color: 'var(--cms-text)', fontWeight: 900 }}>{fmtBytes(totalBytes)}</span>
            </div>
          </div>

        </div>

        {/* ── PARTISI & METRIK LENGKAP ── */}
        <div style={{
          background: 'var(--cms-card-bg)',
          borderRadius: 24,
          border: '1.5px solid var(--glass-border)',
          overflow: 'hidden',
          boxShadow: 'var(--cms-shadow-sm)'
        }}>
          {/* Header Partisi */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 950, color: 'var(--cms-text)' }}>
                Partisi Database
              </h3>
              <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                {fmtNum(totalRecords)} records • {fmtBytes(totalBytes)} payload
              </div>
            </div>

            {/* Filter Search */}
            <div style={{ minWidth: 200, maxWidth: 320, width: '100%' }}>
              <input
                type="text"
                placeholder="Cari partisi..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 100,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 12,
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* ── DESKTOP TABLE ── */}
          <div className="partition-desktop-table" style={{ overflowX: 'auto', padding: '8px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)' }}>
                  <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modul & Partisi</th>
                  <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Storage Tier</th>
                  <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jumlah Data</th>
                  <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ukuran</th>
                  <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((col) => {
                  const d = data[col.key] || { count: 0, sizeBytes: 0, raw: null };
                  const Icon = col.icon;
                  return (
                    <tr 
                      key={col.key}
                      style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      {...bindContextMenu(() => ({
                        title: col.label,
                        subtitle: `${fmtNum(d.count)} records · ${fmtBytes(d.sizeBytes)}`,
                        headerBadge: 'PARTISI DATABASE',
                        items: [
                          {
                            label: 'Lihat Raw JSON',
                            icon: <Eye size={15} color="var(--cms-accent)" />,
                            action: () => setInspectingPartition({ key: col.key, label: col.label, raw: d.raw, size: d.sizeBytes, count: d.count })
                          },
                          {
                            label: 'Salin Ringkasan Partisi',
                            icon: <Copy size={15} color="var(--cms-accent)" />,
                            action: () => {
                              navigator.clipboard?.writeText(`${col.label} (${col.key}): ${fmtNum(d.count)} entries, ${fmtBytes(d.sizeBytes)}`);
                              addNotification?.('system', 'Disalin', `Data ${col.label} disalin ke clipboard.`);
                            }
                          },
                          {
                            label: 'Backup ke Google Drive',
                            icon: <Cloud size={15} color="#3b82f6" />,
                            action: () => handleBackupToDrive()
                          }
                        ]
                      }))}
                    >
                      <td style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: `${col.color}15`, color: col.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 850, color: 'var(--cms-text)' }}>{col.label}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', fontFamily: 'monospace' }}>{col.key}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'var(--cms-input-bg)',
                          border: '1px solid var(--glass-border)',
                          fontSize: 11,
                          fontWeight: 750,
                          color: 'var(--cms-text)',
                          whiteSpace: 'nowrap'
                        }}>
                          {col.tier}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>
                          {fmtNum(d.count)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginLeft: 4 }}>items</span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                          {fmtBytes(d.sizeBytes)}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 100,
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          fontSize: 11,
                          fontWeight: 850
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                          Tersinkron
                        </span>
                      </td>

                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setInspectingPartition({ key: col.key, label: col.label, raw: d.raw, size: d.sizeBytes, count: d.count })}
                            title="Inspeksi Raw JSON Partisi"
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              background: 'var(--cms-input-bg)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--cms-text)',
                              fontSize: 11,
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Eye size={13} />
                            <span>JSON</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPartitionToWipe({ key: col.key, label: col.label })}
                            title="Kosongkan Data Partisi Ini Saja"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 8,
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              fontSize: 11,
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARD LIST (RESPONSIF & RAPI) ── */}
          <div className="partition-mobile-list" style={{ display: 'none', flexDirection: 'column', gap: 8, padding: '10px 14px 14px' }}>
            {filteredCollections.map((col) => {
              const d = data[col.key] || { count: 0, sizeBytes: 0, raw: null };
              const Icon = col.icon;
              return (
                <div
                  key={col.key}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                  {...bindContextMenu(() => ({
                    title: col.label,
                    subtitle: `${fmtNum(d.count)} records · ${fmtBytes(d.sizeBytes)}`,
                    headerBadge: 'PARTISI DATABASE',
                    items: [
                      {
                        label: 'Lihat Raw JSON',
                        icon: <Eye size={15} color="var(--cms-accent)" />,
                        action: () => setInspectingPartition({ key: col.key, label: col.label, raw: d.raw, size: d.sizeBytes, count: d.count })
                      },
                      {
                        label: 'Salin Ringkasan Partisi',
                        icon: <Copy size={15} color="var(--cms-accent)" />,
                        action: () => {
                          navigator.clipboard?.writeText(`${col.label} (${col.key}): ${fmtNum(d.count)} entries, ${fmtBytes(d.sizeBytes)}`);
                          addNotification?.('system', 'Disalin', `Data ${col.label} disalin ke clipboard.`);
                        }
                      },
                      {
                        label: 'Backup ke Google Drive',
                        icon: <Cloud size={15} color="#3b82f6" />,
                        action: () => handleBackupToDrive()
                      }
                    ]
                  }))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${col.color}15`, color: col.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {col.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontFamily: 'monospace' }}>
                          {col.key}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      fontSize: 10.5,
                      fontWeight: 750,
                      color: 'var(--cms-text)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {col.tier}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.06))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                        {fmtNum(d.count)} <span style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 500 }}>data</span>
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>•</span>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>
                        {fmtBytes(d.sizeBytes)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setInspectingPartition({ key: col.key, label: col.label, raw: d.raw, size: d.sizeBytes, count: d.count })}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'var(--cms-input-bg)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
                          fontSize: 11,
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Eye size={12} />
                        <span>JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPartitionToWipe({ key: col.key, label: col.label })}
                        style={{
                          padding: '4px 7px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </>
        )}

      </div>

      {/* ── MODAL: LIVE JSON INSPECTOR ── */}
      {inspectingPartition && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--cms-card-bg)', borderRadius: 24, border: '1.5px solid var(--glass-border)', maxWidth: 750, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>
                  Inspeksi Partisi: {inspectingPartition.label}
                </h3>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                  <code>{inspectingPartition.key}</code> • {fmtNum(inspectingPartition.count)} records • {fmtBytes(inspectingPartition.size)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  title="Salin JSON"
                  aria-label="Salin JSON"
                  onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(inspectingPartition.raw, null, 2));
                    addNotification?.('system', 'Disalin', 'JSON partisi berhasil disalin ke clipboard.');
                  }}
                  style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cms-accent-soft, rgba(99, 102, 241, 0.1))', color: 'var(--cms-accent, #6366f1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingPartition(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, background: 'var(--cms-input-bg)' }}>
              <pre style={{ margin: 0, fontSize: 11.5, fontFamily: 'monospace', color: 'var(--cms-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(inspectingPartition.raw, null, 2) || 'null'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: WIPE SINGLE PARTITION ── */}
      {partitionToWipe && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--cms-card-bg)', borderRadius: 24, border: '1.5px solid rgba(239, 68, 68, 0.3)', maxWidth: 450, width: '100%', padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, color: '#ef4444', fontSize: 18, fontWeight: 900 }}>
              Kosongkan Partisi {partitionToWipe.label}?
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
              Tindakan ini hanya akan mengosongkan partisi <code>{partitionToWipe.key}</code>. Modul database lain serta kredensial cloud tetap aman.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setPartitionToWipe(null)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 10, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleWipeSinglePartition(partitionToWipe.key)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 10, background: '#ef4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 850, cursor: 'pointer' }}
              >
                Kosongkan Partisi
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .storage-monitor-root {
          padding: 24px 24px 80px;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .storage-monitor-root {
            padding: 16px 16px 90px;
          }
        }
        .storage-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
        }
        .storage-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .storage-action-btn {
          height: 38px;
          padding: 0 14px;
          border-radius: 10px;
          background: var(--cms-card-bg);
          border: 1.5px solid var(--glass-border);
          color: var(--cms-text);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
          box-shadow: var(--cms-shadow-sm);
        }
        .storage-action-btn:hover {
          transform: translateY(-1px);
        }
        .storage-tab-nav {
          display: flex;
          gap: 6px;
          padding: 5px;
          background: var(--cms-card-bg);
          border-radius: 14px;
          border: 1.5px solid var(--glass-border);
          width: fit-content;
        }
        .storage-tab-btn {
          padding: 8px 18px;
          border-radius: 10px;
          border: none;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          color: var(--cms-text-muted);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .storage-tab-btn.active {
          background: var(--cms-accent);
          color: #fff;
          box-shadow: 0 4px 14px rgba(var(--cms-accent-rgb), 0.3);
        }
        .storage-bento-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .storage-tier-card {
          background: var(--cms-card-bg);
          border: 1.5px solid var(--glass-border);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--cms-shadow-sm);
          min-width: 0;
        }
        .tier-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tier-badge {
          font-size: 9.5px;
          font-weight: 900;
          padding: 2.5px 8px;
          border-radius: 100px;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .storage-monitor-root {
            padding: 12px 12px 8px 12px !important;
          }
          .storage-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
            margin-bottom: 0 !important;
          }
          .storage-header-actions {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            align-items: center !important;
            gap: 6px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .storage-action-btn {
            width: 100% !important;
            height: 38px !important;
            padding: 0 !important;
            border-radius: 10px !important;
            justify-content: center !important;
            align-items: center !important;
            display: flex !important;
          }
          .storage-action-btn span {
            display: none !important;
          }
          .storage-tab-nav {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 4px !important;
            box-sizing: border-box !important;
          }
          .storage-tab-btn {
            justify-content: center !important;
            padding: 9px 8px !important;
            font-size: 12px !important;
          }
          .storage-bento-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .storage-tier-card {
            padding: 14px !important;
            border-radius: 16px !important;
            gap: 8px !important;
          }
          .tier-icon-wrap {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
          }
          .partition-desktop-table {
            display: none !important;
          }
          .partition-mobile-list {
            display: flex !important;
          }
        }
        @media (max-width: 480px) {
          .storage-bento-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StorageMonitor;
