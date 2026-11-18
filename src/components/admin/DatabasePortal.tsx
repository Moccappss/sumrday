import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storage } from '../../utils/storage';
import {
  Star, FileText, Store, ArrowRight, ArrowLeft, Database, Sparkles, FolderKanban, ShoppingBag, BookOpen, LayoutGrid,
  FileSpreadsheet, Fingerprint, Globe, Link2, Megaphone, HardDrive, Quote, Receipt, ArrowUpRight, Search, X, Gamepad2,
  DownloadCloud, UploadCloud, ShieldCheck, Loader2
} from 'lucide-react';
import { exportStudioBackup, restoreStudioBackup } from '../../utils/studioBackup';
import PortfolioManager from './PortfolioManager';
import BlogManager from './BlogManager';
import CatalogManager from './CatalogManager';
import GameManagementTab from '../../pages/admin/GameManagementTab';
import FormMakerManager from './form-maker/FormMakerManager';
import BiodataManager from './BiodataManager';
import BusinessProfileManager from './BusinessProfileManager';
import LinksStudio from './LinksStudio';
import BroadcastStudio from './BroadcastStudio';
import AppsManager from './AppsManager';
import { MediaVaultManager } from './content-stash/MediaVaultManager';
import { ClientVoiceManager } from './content-stash/ClientVoiceManager';
import { RateCardManager } from './content-stash/RateCardManager';
import { subscribeToGames } from '../../services/gameService';
import { AdminPortalFeatureCard } from './AdminPortalFeatureCard';

interface DatabasePortalProps {
  initialSubTab?: 'hub' | 'portfolio' | 'blog' | 'catalog' | 'apps' | 'game' | 'forms' | 'biodata' | 'contacts' | 'links' | 'broadcast' | 'media' | 'reviews' | 'ratecard';
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  onNavigate?: (page: string) => void;
  isDarkMode?: boolean;
}

export const DatabasePortal: React.FC<DatabasePortalProps> = ({
  initialSubTab = 'hub',
  notify,
  confirm,
  onNavigate,
  isDarkMode = true
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'portfolio' | 'blog' | 'catalog' | 'apps' | 'game' | 'forms' | 'biodata' | 'contacts' | 'links' | 'broadcast' | 'media' | 'reviews' | 'ratecard'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [stats, setStats] = useState({
    portfolioCount: 0,
    projectsCount: 0,
    featuredCount: 0,
    blogCount: 0,
    catalogCount: 0,
    gameCount: 0,
    formsCount: 0,
    linksCount: 0,
    mediaCount: 0,
    reviewsCount: 0,
    rateCardCount: 0
  });
  const [isReconciling, setIsReconciling] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    try {
      const [
        portfolio, projects, websiteData,
        blogPosts, blogs,
        catalogProducts, catalog,
        customGames, gamesData,
        forms, linksData, mediaVault, reviews, faqs, rateCards
      ] = await Promise.all([
        storage.getItem('porto_portfolio', []),
        storage.getItem('porto_projects', []),
        storage.getItem('porto_main_website', {}),
        storage.getItem('porto_blog_posts', []),
        storage.getItem('porto_blogs', []),
        storage.getItem('porto_catalog_products', []),
        storage.getItem('porto_catalog', []),
        storage.getItem('porto_custom_games', []),
        storage.getItem('porto_games_data', []),
        storage.getItem('porto_forms', []),
        storage.getItem('porto_links', []),
        storage.getItem('porto_media_vault', []),
        storage.getItem('porto_client_reviews', []),
        storage.getItem('porto_client_faqs', []),
        storage.getItem('porto_rate_cards', [])
      ]);

      const pList = Array.isArray(portfolio) ? portfolio : [];
      const prjList = Array.isArray(projects) ? projects : [];
      const featured = (websiteData?.featuredProjects || []).length;
      const bList = (Array.isArray(blogPosts) && blogPosts.length > 0) ? blogPosts : (Array.isArray(blogs) ? blogs : []);
      const cList = (Array.isArray(catalogProducts) && catalogProducts.length > 0) ? catalogProducts : (Array.isArray(catalog) ? catalog : []);
      const gList = (Array.isArray(customGames) && customGames.length > 0) ? customGames : (Array.isArray(gamesData) ? gamesData : []);
      const fList = Array.isArray(forms) ? forms : [];
      const lList = Array.isArray(linksData) ? linksData : (linksData?.links || []);
      const mList = Array.isArray(mediaVault) ? mediaVault : [];
      const rList = Array.isArray(reviews) ? reviews : [];
      const qList = Array.isArray(faqs) ? faqs : [];
      const rcList = Array.isArray(rateCards) ? rateCards : [];

      setStats(prev => ({
        portfolioCount: pList.length,
        projectsCount: prjList.length,
        featuredCount: featured,
        blogCount: bList.length,
        catalogCount: cList.length,
        gameCount: gList.length || prev.gameCount,
        formsCount: fList.length,
        linksCount: lList.length,
        mediaCount: mList.length,
        reviewsCount: rList.length + qList.length,
        rateCardCount: rcList.length
      }));
    } catch (err) {
      console.error('Failed to load database stats:', err);
    }
  };

  const handleReconcileDatabase = async () => {
    setIsReconciling(true);
    try {
      const result = await storage.reconcileDatabaseIntegrity();
      await loadStats();
      const repairedCount = result.repaired.length;
      if (repairedCount > 0) {
        notify?.(`✅ Berhasil merekonsiliasi ${repairedCount} relasi data database! Seluruh tabel kini 100% sinkron.`, 'success');
      } else {
        notify?.('✅ Seluruh tabel database sudah 100% akurat dan tersinkronisasi tanpa ada data yang miss.', 'success');
      }
    } catch (err: any) {
      console.error('Reconcile failed:', err);
      notify?.('❌ Gagal rekonsiliasi database: ' + (err?.message || 'Error tidak diketahui'), 'error');
    } finally {
      setIsReconciling(false);
    }
  };

  useEffect(() => {
    loadStats();

    const handleDataUpdate = () => {
      loadStats();
    };

    window.addEventListener('porto_blog_updated', handleDataUpdate);
    window.addEventListener('porto_blog_saved', handleDataUpdate);
    window.addEventListener('porto_catalog_updated', handleDataUpdate);
    window.addEventListener('porto_catalog_products_updated', handleDataUpdate);
    window.addEventListener('porto_portfolio_updated', handleDataUpdate);
    window.addEventListener('porto_projects_updated', handleDataUpdate);
    window.addEventListener('porto_games_updated', handleDataUpdate);
    window.addEventListener('porto_media_vault_updated', handleDataUpdate);
    window.addEventListener('porto_reviews_updated', handleDataUpdate);
    window.addEventListener('porto_faqs_updated', handleDataUpdate);
    window.addEventListener('porto_ratecards_updated', handleDataUpdate);
    window.addEventListener('porto_database_reconciled', handleDataUpdate);

    return () => {
      window.removeEventListener('porto_blog_updated', handleDataUpdate);
      window.removeEventListener('porto_blog_saved', handleDataUpdate);
      window.removeEventListener('porto_catalog_updated', handleDataUpdate);
      window.removeEventListener('porto_catalog_products_updated', handleDataUpdate);
      window.removeEventListener('porto_portfolio_updated', handleDataUpdate);
      window.removeEventListener('porto_projects_updated', handleDataUpdate);
      window.removeEventListener('porto_games_updated', handleDataUpdate);
      window.removeEventListener('porto_media_vault_updated', handleDataUpdate);
      window.removeEventListener('porto_reviews_updated', handleDataUpdate);
      window.removeEventListener('porto_faqs_updated', handleDataUpdate);
      window.removeEventListener('porto_ratecards_updated', handleDataUpdate);
      window.removeEventListener('porto_database_reconciled', handleDataUpdate);
    };
  }, [activeTab]);

  useEffect(() => {
    const unsub = subscribeToGames((data) => {
      if (Array.isArray(data)) {
        setStats(prev => ({ ...prev, gameCount: data.length }));
      }
    });
    return () => unsub();
  }, []);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allCards = useMemo(() => [
    {
      key: 'portfolio',
      fallbackTab: 'portfolio',
      title: 'Showcase',
      databaseType: 'Portofolio',
      badge: `${stats.portfolioCount} Portofolio`,
      subtitle: 'Kurasi karya visual & studi kasus',
      icon: Star,
      paletteIndex: 0,
    },
    {
      key: 'blog',
      fallbackTab: 'blog',
      title: 'Journal',
      databaseType: 'Artikel',
      badge: `${stats.blogCount} Artikel`,
      subtitle: 'Publikasi artikel & catatan wawasan',
      icon: BookOpen,
      paletteIndex: 2,
    },
    {
      key: 'catalog',
      fallbackTab: 'catalog',
      title: 'Drops',
      databaseType: 'Produk',
      badge: `${stats.catalogCount} Produk`,
      subtitle: 'Katalog produk & aset toko digital',
      icon: ShoppingBag,
      paletteIndex: 3,
    },
    {
      key: 'media',
      fallbackTab: 'media',
      title: 'Media',
      databaseType: 'Media Aset',
      badge: stats.mediaCount > 0 ? `${stats.mediaCount} Media` : 'Aset',
      subtitle: 'Pustaka gambar, video & dokumen',
      icon: HardDrive,
      paletteIndex: 1,
    },
    {
      key: 'reviews',
      fallbackTab: 'reviews',
      title: 'Cheers',
      databaseType: 'Ulasan',
      badge: stats.reviewsCount > 0 ? `${stats.reviewsCount} Ulasan` : 'Ulasan',
      subtitle: 'Testimoni klien & daftar FAQ',
      icon: Quote,
      paletteIndex: 5,
    },
    {
      key: 'ratecard',
      fallbackTab: 'ratecard',
      title: 'Rates',
      databaseType: 'Paket Tarif',
      badge: stats.rateCardCount > 0 ? `${stats.rateCardCount} Paket` : 'Paket',
      subtitle: 'Struktur harga & paket layanan',
      icon: Receipt,
      paletteIndex: 4,
    }
  ], [stats]);

  const handleBackToHub = () => {
    setActiveTab('hub');
    if (onNavigate) onNavigate('database');
  };

  // 1. Showcase Karya Sub-Manager
  if (activeTab === 'portfolio') {
    return <PortfolioManager notify={notify} confirm={confirm} onBack={handleBackToHub} />;
  }

  // 2. Creative Spill Sub-Manager
  if (activeTab === 'blog') {
    return <BlogManager onBack={handleBackToHub} />;
  }

  // 3. Store Drop Sub-Manager
  if (activeTab === 'catalog') {
    return <CatalogManager notify={notify} confirm={confirm} onBack={handleBackToHub} />;
  }

  // 4. Apps Studio Sub-Manager (Invitation Studio, Modular Apps)
  if (activeTab === 'apps' || activeTab === 'game') {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <AppsManager onNavigate={onNavigate} onBack={() => { setActiveTab('hub'); if (onNavigate) onNavigate('database'); }} />
      </div>
    );
  }

  // 5. Form Maker Sub-Manager
  if (activeTab === 'forms') {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <FormMakerManager notify={notify} confirm={confirm} isDarkMode={isDarkMode} />
      </div>
    );
  }

  // 6. Bio & Profil Sub-Manager
  if (activeTab === 'biodata') {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <BiodataManager notify={notify} />
      </div>
    );
  }

  // 7. Social & Kontak Sub-Manager
  if (activeTab === 'contacts') {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <BusinessProfileManager notify={notify} />
      </div>
    );
  }

  // 8. Link Space Sub-Manager
  if (activeTab === 'links') {
    return <LinksStudio notify={notify} />;
  }

  // 9. Blast Space Sub-Manager
  if (activeTab === 'broadcast') {
    return <BroadcastStudio hideHeader={false} onClose={() => { setActiveTab('hub'); if (onNavigate) onNavigate('database'); }} />;
  }

  // 10. Media Vault Sub-Manager View
  if (activeTab === 'media') {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: isMobile ? 12 : 24 }}>
        <MediaVaultManager notify={notify} confirm={confirm} isDarkMode={isDarkMode} onBack={() => { setActiveTab('hub'); if (onNavigate) onNavigate('database'); }} />
      </div>
    );
  }

  // 11. Client Voice Sub-Manager View
  if (activeTab === 'reviews') {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: isMobile ? 12 : 24 }}>
        <ClientVoiceManager notify={notify} confirm={confirm} isDarkMode={isDarkMode} onBack={() => { setActiveTab('hub'); if (onNavigate) onNavigate('database'); }} />
      </div>
    );
  }

  // 12. Rate Card Sub-Manager View
  if (activeTab === 'ratecard') {
    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: isMobile ? 12 : 24 }}>
        <RateCardManager notify={notify} confirm={confirm} isDarkMode={isDarkMode} onBack={() => { setActiveTab('hub'); if (onNavigate) onNavigate('database'); }} />
      </div>
    );
  }

  // ── HUB VIEW (MINIMALIST: ONLY ICON & LABEL, ZERO TEXT CLUTTER) ──
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: isMobile ? 'flex-start' : 'center',
      padding: isMobile ? '24px 16px 8px' : '28px 24px 60px',
      boxSizing: 'border-box',
      background: 'var(--cms-bg, #0b1120)',
      color: 'var(--cms-text, #0f172a)'
    }}>
      <div style={{ maxWidth: 1160, width: '100%', margin: isMobile ? '0 auto' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Clean Centered Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 28, maxWidth: 640 }}>
          <h1 style={{
            margin: '0 0 8px',
            fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
            fontSize: isMobile ? 28 : 34,
            fontWeight: 800,
            color: 'var(--cms-text, currentColor)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            WebkitFontSmoothing: 'antialiased',
          }}>
            Vault
          </h1>


          <style>{`
            @media (max-width: 767px) {
              .db-vault-actions { flex-wrap: nowrap !important; gap: 10px !important; }
              .db-vault-actions .db-vault-action-pill {
                width: 40px !important;
                height: 40px !important;
                padding: 0 !important;
                justify-content: center !important;
                border-radius: 50% !important;
              }
              .db-vault-actions .db-vault-action-pill span {
                display: none !important;
              }
            }
          `}</style>
          <div className="db-vault-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {/* EcoShield Status Badge */}
            <div className="db-vault-action-pill" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 100,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.02em',
              userSelect: 'none'
            }} title="EcoShield: 100% Terisolasi">
              <ShieldCheck size={14} />
              <span>EcoShield</span>
            </div>

            <button
              className="db-vault-action-pill"
              onClick={handleReconcileDatabase}
              disabled={isReconciling}
              title="Sinkronkan Database"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 100,
                background: isReconciling ? 'rgba(217, 86, 41, 0.4)' : 'var(--cms-accent, #D95629)',
                color: '#ffffff',
                border: 'none',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isReconciling ? 'not-allowed' : 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseOver={(e) => {
                if (!isReconciling) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                if (!isReconciling) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Sparkles size={14} className={isReconciling ? 'animate-spin' : ''} />
              <span>{isReconciling ? 'Sinkron...' : 'Sinkron'}</span>
            </button>

            {/* One-Click Backup */}
            <button
              type="button"
              className="db-vault-action-pill"
              disabled={isExportingBackup}
              onClick={async () => {
                setIsExportingBackup(true);
                try {
                  const fname = await exportStudioBackup();
                  notify?.(`🛡️ Cadangan studio berhasil diunduh: ${fname}`, 'success');
                } catch (err: any) {
                  notify?.(err?.message || 'Gagal membuat cadangan', 'error');
                } finally {
                  setIsExportingBackup(false);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 100,
                background: 'var(--cms-card-bg)',
                color: 'var(--cms-text)',
                border: '1.5px solid var(--glass-border)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isExportingBackup ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Unduh snapshot penuh seluruh database studio sebagai berkas JSON aman"
            >
              {isExportingBackup ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} color="#10b981" />}
              <span>Cadangan</span>
            </button>

            {/* One-Click Restore */}
            <input
              type="file"
              ref={backupFileInputRef}
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsRestoringBackup(true);
                try {
                  const res = await restoreStudioBackup(file, (msg) => notify?.(msg, 'info'));
                  notify?.(res.message, 'success');
                  await loadStats();
                } catch (err: any) {
                  notify?.(err?.message || 'Gagal memulihkan cadangan', 'error');
                } finally {
                  setIsRestoringBackup(false);
                  if (backupFileInputRef.current) backupFileInputRef.current.value = '';
                }
              }}
            />
            <button
              type="button"
              className="db-vault-action-pill"
              disabled={isRestoringBackup}
              onClick={() => {
                if (confirm) {
                  confirm({
                    title: 'Pulihkan Cadangan Studio?',
                    message: 'Memulihkan data akan menimpa data studio saat ini dengan data dari file cadangan. Pastikan file backup valid.',
                    onConfirm: () => backupFileInputRef.current?.click()
                  });
                } else {
                  backupFileInputRef.current?.click();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 100,
                background: 'var(--cms-card-bg)',
                color: 'var(--cms-text)',
                border: '1.5px solid var(--glass-border)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isRestoringBackup ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Pulihkan database studio dari file JSON cadangan"
            >
              {isRestoringBackup ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} color="#3b82f6" />}
              <span>Pulihkan</span>
            </button>
          </div>
        </div>

        {/* ── 6 EDITORIAL WAVE FEATURE CARDS ── */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(3, minmax(0, 1fr))',
          gap: isMobile ? 14 : 18
        }}>
          {allCards.map((card, idx) => (
            <AdminPortalFeatureCard
              key={card.key}
              index={idx}
              title={card.title}
              badge={card.badge}
              subtitle={card.subtitle}
              customTag={card.databaseType}
              icon={card.icon}
              paletteIndex={card.paletteIndex}
              isMobile={isMobile}
              isDarkMode={isDarkMode}
              onClick={() => {
                if (onNavigate) onNavigate(card.key);
                else setActiveTab(card.fallbackTab as any);
              }}
            />
          ))}
        </div>

        {/* Dedicated Mobile Bottom Spacer */}
        {isMobile && <div style={{ height: 110, width: '100%', flexShrink: 0 }} />}

      </div>
    </div>
  );
};

export default DatabasePortal;
