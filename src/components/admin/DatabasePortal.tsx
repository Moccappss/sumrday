import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { 
  Star, FileText, Store, ArrowRight, ArrowLeft, Database, Sparkles, FolderKanban, ShoppingBag, BookOpen, LayoutGrid,
  FileSpreadsheet, Fingerprint, Globe, Link2, Megaphone, HardDrive, Quote, Receipt
} from 'lucide-react';
import PortfolioManager from './PortfolioManager';
import BlogManager from './BlogManager';
import CatalogManager from './CatalogManager';
import GameManagementTab from '../../pages/admin/GameManagementTab';
import FormMakerManager from './form-maker/FormMakerManager';
import BiodataManager from './BiodataManager';
import BusinessProfileManager from './BusinessProfileManager';
import LinksStudio from './LinksStudio';
import BroadcastStudio from './BroadcastStudio';
import { MediaVaultManager } from './content-stash/MediaVaultManager';
import { ClientVoiceManager } from './content-stash/ClientVoiceManager';
import { RateCardManager } from './content-stash/RateCardManager';
import { subscribeToGames } from '../../services/gameService';

interface DatabasePortalProps {
  initialSubTab?: 'hub' | 'portfolio' | 'blog' | 'catalog' | 'game' | 'forms' | 'biodata' | 'contacts' | 'links' | 'broadcast' | 'media' | 'reviews' | 'ratecard';
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
  const [activeTab, setActiveTab] = useState<'hub' | 'portfolio' | 'blog' | 'catalog' | 'game' | 'forms' | 'biodata' | 'contacts' | 'links' | 'broadcast' | 'media' | 'reviews' | 'ratecard'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [stats, setStats] = useState({
    portfolioCount: 0,
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

  const loadStats = async () => {
    try {
      const [projects, websiteData, blogs, products, games, forms, linksData, mediaVault, reviews, faqs, rateCards] = await Promise.all([
        storage.getItem('porto_portfolio', []),
        storage.getItem('porto_main_website', {}),
        storage.getItem('porto_blog', []),
        storage.getItem('porto_catalog', []),
        storage.getItem('porto_games_data', []),
        storage.getItem('porto_forms', []),
        storage.getItem('porto_links', []),
        storage.getItem('porto_media_vault', []),
        storage.getItem('porto_client_reviews', []),
        storage.getItem('porto_client_faqs', []),
        storage.getItem('porto_rate_cards', [])
      ]);

      const pList = Array.isArray(projects) ? projects : [];
      const featured = (websiteData?.featuredProjects || []).length;
      const bList = Array.isArray(blogs) ? blogs : [];
      const cList = Array.isArray(products) ? products : [];
      const gList = Array.isArray(games) ? games : [];
      const fList = Array.isArray(forms) ? forms : [];
      const lList = Array.isArray(linksData) ? linksData : (linksData?.links || []);
      const mList = Array.isArray(mediaVault) ? mediaVault : [];
      const rList = Array.isArray(reviews) ? reviews : [];
      const qList = Array.isArray(faqs) ? faqs : [];
      const rcList = Array.isArray(rateCards) ? rateCards : [];

      setStats(prev => ({
        portfolioCount: pList.length,
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

  useEffect(() => {
    loadStats();

    const handleDataUpdate = () => {
      loadStats();
    };

    window.addEventListener('porto_blog_updated', handleDataUpdate);
    window.addEventListener('porto_catalog_updated', handleDataUpdate);
    window.addEventListener('porto_portfolio_updated', handleDataUpdate);
    window.addEventListener('porto_games_updated', handleDataUpdate);
    window.addEventListener('porto_media_vault_updated', handleDataUpdate);
    window.addEventListener('porto_reviews_updated', handleDataUpdate);
    window.addEventListener('porto_faqs_updated', handleDataUpdate);
    window.addEventListener('porto_ratecards_updated', handleDataUpdate);

    return () => {
      window.removeEventListener('porto_blog_updated', handleDataUpdate);
      window.removeEventListener('porto_catalog_updated', handleDataUpdate);
      window.removeEventListener('porto_portfolio_updated', handleDataUpdate);
      window.removeEventListener('porto_games_updated', handleDataUpdate);
      window.removeEventListener('porto_media_vault_updated', handleDataUpdate);
      window.removeEventListener('porto_reviews_updated', handleDataUpdate);
      window.removeEventListener('porto_faqs_updated', handleDataUpdate);
      window.removeEventListener('porto_ratecards_updated', handleDataUpdate);
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

  // 1. Showcase Karya Sub-Manager
  if (activeTab === 'portfolio') {
    return <PortfolioManager notify={notify} confirm={confirm} />;
  }

  // 2. Creative Spill Sub-Manager
  if (activeTab === 'blog') {
    return <BlogManager />;
  }

  // 3. Store Drop Sub-Manager
  if (activeTab === 'catalog') {
    return <CatalogManager notify={notify} confirm={confirm} />;
  }

  // 4. Play Space / Apps Studios Sub-Manager
  if (activeTab === 'game') {
    return (
      <GameManagementTab 
        notify={notify} 
        confirm={confirm} 
        isDarkMode={isDarkMode} 
        onSwitchPage={onNavigate} 
      />
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

  // ── HUB VIEW (PREMIUM BENTO GRID DESIGN) ──
  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: isMobile ? '16px 16px 90px' : '24px 24px 80px',
      boxSizing: 'border-box',
      background: 'var(--cms-bg, #0b1120)',
      color: 'var(--cms-text, #0f172a)'
    }}>
      <div style={{ maxWidth: 1280, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        
        {/* Header Title with Badge */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 100,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: 'var(--cms-accent, #6366f1)',
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            <Database size={13} />
            <span>Vault</span>
          </div>

          <h2 style={{
            margin: 0,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 900,
            color: 'var(--cms-text, currentColor)',
            letterSpacing: '-0.02em'
          }}>
            Vault
          </h2>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--cms-text-muted, #64748b)',
            maxWidth: 540
          }}>
            Arsip karya cerah, jurnal hangat, rilisan produk, dan modul interaktif sumr.day studio ☀️
          </p>
        </div>

        {/* 4 Bento Grid Cards (Kurasi Karya, Blog & Artikel, Katalog / Shop, Apps Studio) */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(185px, 1fr))',
          gap: isMobile ? 12 : 16
        }}>
          
          {/* 1. Kurasi Karya */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('portfolio');
              else setActiveTab('portfolio');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--cms-accent, #6366f1)';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-md, 0 10px 24px rgba(0,0,0,0.08))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: '#d97706',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Star size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Karya
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: 'var(--cms-text-muted, #64748b)',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.portfolioCount} Karya
              </span>
            </div>
          </div>

          {/* 2. Blog & Artikel */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('blog');
              else setActiveTab('blog');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--cms-accent, #6366f1)';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-md, 0 10px 24px rgba(0,0,0,0.08))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: '#0284c7',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BookOpen size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Journal
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: 'var(--cms-text-muted, #64748b)',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.blogCount} Artikel
              </span>
            </div>
          </div>

          {/* 3. Katalog / Shop */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('catalog');
              else setActiveTab('catalog');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--cms-accent, #6366f1)';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-md, 0 10px 24px rgba(0,0,0,0.08))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: '#10b981',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShoppingBag size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Drops
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: 'var(--cms-text-muted, #64748b)',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.catalogCount} Produk
              </span>
            </div>
          </div>

          {/* 4. Apps Studio */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('apps');
              else setActiveTab('game');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--cms-accent, #6366f1)';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-md, 0 10px 24px rgba(0,0,0,0.08))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(124, 58, 237, 0.14)',
              color: 'var(--cms-accent, #8b5cf6)',
              border: '1.5px solid rgba(124, 58, 237, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.22)',
              flexShrink: 0
            }}>
              <LayoutGrid size={isMobile ? 22 : 28} strokeWidth={2.4} color="#8b5cf6" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Apps
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#8b5cf6',
                background: 'rgba(124, 58, 237, 0.12)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.gameCount} Modul
              </span>
            </div>
          </div>

          {/* 5. Form Maker (Google Forms) */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('forms');
              else setActiveTab('forms');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#673ab7';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(103, 58, 183, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(103, 58, 183, 0.12)',
              color: '#673ab7',
              border: '1.5px solid rgba(103, 58, 183, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(103, 58, 183, 0.18)',
              flexShrink: 0
            }}>
              <FileSpreadsheet size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Forms
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#673ab7',
                background: 'rgba(103, 58, 183, 0.12)',
                border: '1px solid rgba(103, 58, 183, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.formsCount} Formulir
              </span>
            </div>
          </div>

          {/* 6. Link Space (Bio Links) */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('links');
              else setActiveTab('links');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#06b6d4';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(6, 182, 212, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(6, 182, 212, 0.12)',
              color: '#06b6d4',
              border: '1.5px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.18)',
              flexShrink: 0
            }}>
              <Link2 size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Links
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#06b6d4',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.linksCount ? `${stats.linksCount} Tautan` : 'Bio Links'}
              </span>
            </div>
          </div>

          {/* 7. Blast Space (Broadcast) */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('broadcast');
              else setActiveTab('broadcast');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#f43f5e';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(244, 63, 94, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(244, 63, 94, 0.12)',
              color: '#f43f5e',
              border: '1.5px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.18)',
              flexShrink: 0
            }}>
              <Megaphone size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Waves
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#f43f5e',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                Push Notifikasi
              </span>
            </div>
          </div>

          {/* 8. Bio & Profil */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('biodata');
              else setActiveTab('biodata');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(99, 102, 241, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#6366f1',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.18)',
              flexShrink: 0
            }}>
              <Fingerprint size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Bio
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#6366f1',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                Identitas Akun
              </span>
            </div>
          </div>

          {/* 7. Social & Kontak */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('contacts');
              else setActiveTab('contacts');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(2, 132, 199, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              border: '1.5px solid rgba(2, 132, 199, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.18)',
              flexShrink: 0
            }}>
              <Globe size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Socials
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#0284c7',
                background: 'rgba(2, 132, 199, 0.12)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                WA, Sosmed & Bank
              </span>
            </div>
          </div>

          {/* 10. Media Vault */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('media');
              else setActiveTab('media');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#0d9488';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(13, 148, 136, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(13, 148, 136, 0.12)',
              color: '#0d9488',
              border: '1.5px solid rgba(13, 148, 136, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.18)',
              flexShrink: 0
            }}>
              <HardDrive size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Media
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#0d9488',
                background: 'rgba(13, 148, 136, 0.12)',
                border: '1px solid rgba(13, 148, 136, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.mediaCount > 0 ? `${stats.mediaCount} Media` : 'Media'}
              </span>
            </div>
          </div>

          {/* 11. Client Voice */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('reviews');
              else setActiveTab('reviews');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(139, 92, 246, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              border: '1.5px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.18)',
              flexShrink: 0
            }}>
              <Quote size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Cheers
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#8b5cf6',
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.reviewsCount > 0 ? `${stats.reviewsCount} Ulasan` : 'Ulasan'}
              </span>
            </div>
          </div>

          {/* 12. Rate Card */}
          <div
            onClick={() => {
              if (onNavigate) onNavigate('ratecard');
              else setActiveTab('ratecard');
            }}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '20px 10px' : '28px 20px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? 10 : 14,
              boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
              transition: 'all 0.2s ease',
              position: 'relative',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(16, 185, 129, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))';
              e.currentTarget.style.boxShadow = 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))';
            }}
          >
            <div style={{
              width: isMobile ? 48 : 58,
              height: isMobile ? 48 : 58,
              minWidth: isMobile ? 48 : 58,
              minHeight: isMobile ? 48 : 58,
              borderRadius: isMobile ? 14 : 18,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1.5px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.18)',
              flexShrink: 0
            }}>
              <Receipt size={isMobile ? 22 : 28} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: '100%', minWidth: 0 }}>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14.5 : 16.5, fontWeight: 850, color: 'var(--cms-text, currentColor)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                Rates
              </h3>
              <span style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: isMobile ? '2px 8px' : '3px 12px',
                borderRadius: 100,
                whiteSpace: 'nowrap'
              }}>
                {stats.rateCardCount > 0 ? `${stats.rateCardCount} Paket` : 'Tarif'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DatabasePortal;
