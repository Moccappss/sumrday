import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, Search, Globe, Shield, ArrowUpRight, CheckCircle2,
  FolderGit2, BookOpen, ShoppingBag, Gamepad2, LayoutGrid, UserCheck, Link2,
  Sparkles, Database, Settings, FileText, CreditCard, MessageSquare,
  Radio, HardDrive, HelpCircle, Layers, ExternalLink, ArrowLeft,
  Lock, RefreshCw, Sun, Moon, Info, Zap, Lightbulb, Check, ChevronDown, ChevronUp,
  Star, Share2, Eye, Award, ArrowRight, ArrowLeftRight, Workflow,
  Building2, QrCode, ShieldCheck, Palette,
  Flame, Activity, Upload, Users, Copy, X
} from 'lucide-react';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingData } from '../components/landing/useLandingData';
import { useContextMenu } from '../components/admin/ContextMenuProvider';
import LPNavbar from '../components/landing/LPNavbar';
import SEOHelmet from '../components/SEOHelmet';

import { 
  type GuidelineItem, 
  type WorkflowItem, 
  type ClientTipItem,
  GUIDELINE_DATA, 
  CLIENT_TIPS_DATA, 
  ECOSYSTEM_WORKFLOWS_DATA 
} from '../data/guidelineData';

export type GuidelineCategory = 'all' | 'public' | 'ops' | 'client_finance' | 'system' | 'workflows' | 'client_tips';

export default function GuidelinePage({ 
  onSwitchPage, 
  isEmbeddedInAdmin = false,
  isDarkMode: isDarkModeProp 
}: { 
  onSwitchPage?: (page: string) => void; 
  isEmbeddedInAdmin?: boolean;
  isDarkMode?: boolean;
}) {
  const navigate = useNavigate();
  const { data } = useLandingData();
  const { isDark: isPublicDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const { openContextMenu } = useContextMenu();

  // Mode tema adaptif: saat di dalam Admin CMS, ikuti pengaturan CMS (prop atau localStorage/data-cms-theme)
  const isDark = isEmbeddedInAdmin
    ? (isDarkModeProp !== undefined 
        ? isDarkModeProp 
        : (typeof localStorage !== 'undefined' ? localStorage.getItem('cms_dark_mode') !== 'false' : false))
    : isPublicDark;
  
  const [filterType, setFilterType] = useState<GuidelineCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleCardExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyRoute = (e: React.MouseEvent, route: string, id: string) => {
    e.stopPropagation();
    const cleanRoute = (route.split(' ')[0] || '/').trim();
    navigator.clipboard.writeText(cleanRoute);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredItems = useMemo(() => {
    if (filterType === 'client_tips' || filterType === 'workflows') return [];
    const q = searchQuery.trim().toLowerCase();
    return GUIDELINE_DATA.filter(item => {
      let matchCategory = true;
      if (filterType === 'public') {
        matchCategory = item.type === 'public';
      } else if (filterType === 'ops') {
        matchCategory = ['adm-dashboard', 'adm-database', 'adm-visual-editor', 'adm-projects', 'adm-notes', 'adm-whiteboard', 'adm-portfolio', 'adm-apps', 'adm-blog', 'adm-vault'].includes(item.id);
      } else if (filterType === 'client_finance') {
        matchCategory = ['adm-finance', 'adm-catalog', 'adm-chat', 'adm-whatsapp', 'adm-forms', 'adm-reviews', 'adm-ratecard', 'adm-spk', 'adm-flashsale', 'adm-partnership'].includes(item.id);
      } else if (filterType === 'system') {
        matchCategory = ['adm-settings', 'adm-users', 'adm-analytics', 'adm-broadcast', 'adm-qr', 'adm-links', 'adm-business-profile'].includes(item.id);
      }
      if (!matchCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.route.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.features.some(f => f.toLowerCase().includes(q)) ||
        item.tips.toLowerCase().includes(q)
      );
    });
  }, [filterType, searchQuery]);

  const filteredClientTips = useMemo(() => {
    if (filterType !== 'all' && filterType !== 'client_tips') return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CLIENT_TIPS_DATA;
    return CLIENT_TIPS_DATA.filter(tip => 
      tip.title.toLowerCase().includes(q) ||
      tip.desc.toLowerCase().includes(q) ||
      tip.badge.toLowerCase().includes(q)
    );
  }, [filterType, searchQuery]);

  const filteredWorkflows = useMemo(() => {
    if (filterType !== 'all' && filterType !== 'workflows') return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ECOSYSTEM_WORKFLOWS_DATA;
    return ECOSYSTEM_WORKFLOWS_DATA.filter(wf =>
      wf.title.toLowerCase().includes(q) ||
      wf.summary.toLowerCase().includes(q) ||
      wf.badge.toLowerCase().includes(q) ||
      wf.sourceModule.toLowerCase().includes(q) ||
      wf.targetModule.toLowerCase().includes(q)
    );
  }, [filterType, searchQuery]);

  const handleNavigate = (route: string) => {
    // Extract base URL if annotated with modal/tab names
    const cleanRoute = (route.split(' ')[0] || '/').trim();

    if (route.toLowerCase().includes('inquiry') || route.toLowerCase().includes('brief')) {
      window.dispatchEvent(new CustomEvent('porto_open_inquiry_modal'));
    }

    let targetRoute = cleanRoute;
    if (targetRoute.includes('/:id')) {
      targetRoute = isEmbeddedInAdmin ? '/admin/forms' : '/feedback';
    } else if (targetRoute.includes('/:slug')) {
      targetRoute = isEmbeddedInAdmin ? '/admin/apps' : '/apps';
    }

    if (isEmbeddedInAdmin && onSwitchPage) {
      if (targetRoute.startsWith('/admin')) {
        const adminSlug = targetRoute.replace(/^\/admin\/?/, '') || 'dashboard';
        onSwitchPage(adminSlug);
        return;
      }
      window.open(targetRoute, '_blank');
      return;
    }
    if (targetRoute.startsWith('/admin')) {
      navigate(targetRoute);
    } else {
      navigate(targetRoute);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGuidelineContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e, {
      title: 'Panduan Sistem & Peta Situs',
      subtitle: `${GUIDELINE_DATA.length} modul terdata`,
      items: [
        {
          label: 'Tampilkan Semua Halaman',
          icon: <Compass size={15} color="#38bdf8" />,
          action: () => setFilterType('all')
        },
        {
          label: 'Hanya Website Publik',
          icon: <Globe size={15} color="#10b981" />,
          action: () => setFilterType('public')
        },
        {
          label: 'Hanya Admin CMS',
          icon: <Shield size={15} color="#8b5cf6" />,
          action: () => setFilterType('admin')
        },
        {
          label: 'Buka Tips & Trik Klien',
          icon: <Lightbulb size={15} color="#f59e0b" />,
          action: () => setFilterType('client_tips')
        },
        { separator: true, label: '' },
        {
          label: 'Scroll ke Atas',
          icon: <ChevronUp size={15} />,
          action: () => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        },
        {
          label: 'Buka Beranda Publik',
          icon: <ExternalLink size={15} color="#38bdf8" />,
          action: () => window.open('/', '_blank')
        }
      ]
    });
  };

  const accentColor = data?.theme?.accentColor || '#7c3aed';
  const bgColor = isEmbeddedInAdmin 
    ? 'transparent' 
    : (isDark ? '#06070a' : '#eef2f6');
  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div 
      ref={containerRef}
      onContextMenu={handleGuidelineContextMenu}
      style={{ 
        width: '100%',
        height: isEmbeddedInAdmin ? '100%' : 'auto',
        minHeight: isEmbeddedInAdmin ? '100%' : '100vh',
        overflowY: isEmbeddedInAdmin ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        background: bgColor, 
        color: textColor, 
        transition: 'background-color 0.3s ease',
        boxSizing: 'border-box'
      }}
    >
      <SEOHelmet 
        title="Peta Situs, Panduan Fitur & Tips Klien — sumr.day Studio"
        description="Dokumentasi lengkap seluruh rute URL, modul Website Publik, panel kendali Admin CMS (Keuangan, Notes, Proyek, Apps), serta tips & trik khusus klien."
      />

      {!isEmbeddedInAdmin && (
        <LPNavbar 
          items={(data?.navbar?.items || []) as any}
          loginBtnLabel={data?.navbar?.loginBtnLabel || 'Masuk'}
          logoText={data?.navbar?.logoText}
          accentColor={accentColor}
        />
      )}

      <main 
        className="guideline-content-center"
        style={{ 
          maxWidth: 1280, 
          margin: '0 auto', 
          width: '100%',
          padding: isEmbeddedInAdmin 
            ? '20px 16px 80px' 
            : 'calc(80px + env(safe-area-inset-top, 20px)) max(14px, env(safe-area-inset-right, 16px)) 90px max(14px, env(safe-area-inset-left, 16px))', 
          boxSizing: 'border-box' 
        }}
      >
        
        {/* ── HEADER UTAMA ── */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', 
            borderRadius: 100, background: `${accentColor}18`, border: `1px solid ${accentColor}35`, 
            color: accentColor, fontSize: 12.5, fontWeight: 800, marginBottom: 14 
          }}>
            <Compass size={15} />
            <span>Peta Arsitektur, Panduan Modul & Tips Klien</span>
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.02em', color: textColor }}>
            Panduan Fitur & Lokasi Halaman Website
          </h1>
          <p style={{ margin: '0 auto', maxWidth: 720, fontSize: 15, lineHeight: 1.65, color: subTextColor }}>
            Dokumentasi lengkap seluruh rute URL (<code style={{ color: accentColor, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 6 }}>/</code>), fitur inti Admin CMS (Keuangan, Catatan, Proyek, Apps Studio), navigasi langsung, serta panduan praktis & tips trik terbaik bagi Klien.
          </p>
        </div>

        {/* ── KARTU HIGHLIGHT PENTING ── */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 32 
        }}>
          {/* Tip 1: Tema Persisten */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f59e0b20', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sun size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: textColor }}>Tema Selalu Persisten</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: subTextColor }}>
              Pilihan tema Gelap / Terang Anda tersimpan permanen di peramban dan <strong>tidak akan kembali ke mode awal</strong> saat Anda berpindah halaman.
            </p>
          </div>

          {/* Tip 2: Pembaruan Rute Apps */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ec489920', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutGrid size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: textColor }}>Rute Baru: /apps</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: subTextColor }}>
              Fitur Game kini menggunakan rute resmi <code style={{ color: '#ec4899', fontWeight: 700 }}>/apps</code> di website publik dan <code style={{ color: '#ec4899', fontWeight: 700 }}>/admin/apps</code> di CMS. Rute lama dialihkan otomatis.
            </p>
          </div>

          {/* Tip 3: Hapus Massal & Context Menu */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: textColor }}>Tandai & Hapus Massal</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: subTextColor }}>
              Setiap modul berkas banyak (Notes, Chat, Portfolio, Blog, Catalog, Apps) kini dilengkapi <strong>kotak centang tandai</strong> dan tombol <strong>Hapus Ditandai</strong> massal.
            </p>
          </div>
        </div>

        {/* ── KONTROL PENCARIAN & TAB FILTER ── */}
        <div style={{ 
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', 
          gap: 12, marginBottom: 26, padding: '14px 18px', background: cardBg, 
          borderRadius: 16, border: `1px solid ${cardBorder}` 
        }}>
          {/* Tab Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Semua Modul', color: accentColor },
              { id: 'public', label: '🌐 Website Publik', color: 'var(--theme-analogous-2, #0ea5e9)' },
              { id: 'ops', label: '⚡ Studio & Ops', color: accentColor },
              { id: 'client_finance', label: '💼 Klien & Transaksi', color: 'var(--theme-analogous-3, #f59e0b)' },
              { id: 'system', label: '⚙️ Sistem & Integrasi', color: 'var(--theme-analogous-4, #8b5cf6)' },
              { id: 'workflows', label: '⚡ Alur Integrasi', color: 'var(--theme-analogous-4, #8b5cf6)' },
              { id: 'client_tips', label: '🌟 Tips Klien', color: 'var(--theme-analogous-3, #f59e0b)' }
            ].map(tab => {
              const isSelected = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id as any)}
                  style={{
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: 'pointer',
                    border: isSelected ? `1.5px solid ${tab.color}` : `1px solid ${cardBorder}`,
                    background: isSelected ? tab.color : 'transparent',
                    color: isSelected ? '#ffffff' : subTextColor,
                    boxShadow: isSelected ? `0 2px 10px ${tab.color}35` : 'none',
                    transition: 'all 0.18s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 380 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
            <input 
              type="text"
              placeholder="Cari rute, modul, fitur (invoice, brief, wa)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                padding: '0 36px 0 38px',
                borderRadius: 9999,
                border: `1px solid ${searchQuery ? accentColor : cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                color: textColor,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: subTextColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2
                }}
                title="Hapus pencarian"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>



        {/* ── BAGIAN UTAMA: ALUR KERJA & KONEKSI ANTAR-FITUR ── */}
        {(filterType === 'all' || filterType === 'workflows') && (
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.18)', color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Workflow size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: textColor }}>
                  Pusat Integrasi & Alur Fitur Terpadu (Ecosystem Workflow)
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: subTextColor }}>
                  Bagaimana modul Katalog, Keuangan, Proyek, Booking, Chat, dan Portal Klien saling terkoneksi otomatis tanpa input ganda.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
              {filteredWorkflows.map(wf => (
                <div 
                  key={wf.id}
                  style={{
                    background: isDark ? 'linear-gradient(180deg, rgba(23, 25, 36, 0.96) 0%, rgba(15, 16, 24, 0.98) 100%)' : '#ffffff',
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                    borderRadius: 22,
                    padding: '22px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.45)' : '0 4px 18px rgba(0,0,0,0.04)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = `${accentColor}55`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
                  }}
                >
                  {/* Top subtle highlight shimmer */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    background: 'var(--cms-accent-gradient-vibrant, linear-gradient(90deg, #38bdf8 0%, var(--cms-accent) 50%, #ec4899 100%))',
                    opacity: 0.8
                  }} />

                  <div>
                    {/* Header Top Row: Symmetrical Icon (Left) + Badge Emblem (Right) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                      <div style={{ 
                        width: 42, 
                        height: 42, 
                        borderRadius: 13, 
                        background: 'rgba(var(--theme-analogous-cool-rgb, 14, 165, 233), 0.14)', 
                        border: '1px solid rgba(var(--theme-analogous-cool-rgb, 14, 165, 233), 0.25)',
                        color: 'var(--theme-analogous-2, #0ea5e9)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {wf.icon}
                      </div>
                      <span style={{ 
                        fontSize: 10.5, 
                        fontWeight: 800, 
                        padding: '4px 11px', 
                        borderRadius: 9999, 
                        background: 'rgba(var(--theme-analogous-pop-rgb, 139, 92, 246), 0.14)', 
                        color: 'var(--theme-analogous-4, #8b5cf6)', 
                        border: '1px solid rgba(var(--theme-analogous-pop-rgb, 139, 92, 246), 0.3)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}>
                        {wf.badge}
                      </span>
                    </div>

                    {/* Title: Equalized Height so neighboring cards align horizontally */}
                    <h3 style={{ 
                      margin: '0 0 12px', 
                      fontSize: 16.5, 
                      fontWeight: 900, 
                      color: textColor, 
                      letterSpacing: '-0.015em', 
                      lineHeight: 1.35,
                      width: '100%',
                      minHeight: 45,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {wf.title}
                    </h3>

                    {/* Dedicated Route Flow Connector (Source ➔ Target) */}
                    {(() => {
                      const matchSrc = wf.sourceModule.match(/^(.*?)\s*\((.*?)\)$/);
                      const srcName = matchSrc ? matchSrc[1] : wf.sourceModule;
                      const srcRoute = matchSrc ? matchSrc[2] : '';
                      const matchTgt = wf.targetModule.match(/^(.*?)\s*\((.*?)\)$/);
                      const tgtName = matchTgt ? matchTgt[1] : wf.targetModule;
                      const tgtRoute = matchTgt ? matchTgt[2] : '';

                      return (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto 1fr',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 14,
                          padding: '10px 12px',
                          borderRadius: 14,
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                          minHeight: 56
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} />
                              <span title={srcName}>{srcName}</span>
                            </div>
                            {srcRoute && (
                              <div style={{ fontSize: 10.5, color: subTextColor, fontFamily: 'monospace', paddingLeft: 12, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {srcRoute}
                              </div>
                            )}
                          </div>

                          <div style={{ 
                            width: 26, 
                            height: 26, 
                            borderRadius: '50%', 
                            background: `${accentColor}18`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: `1px solid ${accentColor}33`
                          }}>
                            <ArrowRight size={13} color={accentColor} />
                          </div>

                          <div style={{ minWidth: 0, textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, fontSize: 12, fontWeight: 800, color: accentColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span title={tgtName}>{tgtName}</span>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                            </div>
                            {tgtRoute && (
                              <div style={{ fontSize: 10.5, color: `${accentColor}dd`, fontFamily: 'monospace', paddingRight: 12, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {tgtRoute}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Summary: Standardized Height for row-level baseline synchronization */}
                    <p style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.65, color: subTextColor, minHeight: 64 }}>
                      {wf.summary}
                    </p>

                    {/* Steps (Styled cleanly as connected micro-cards) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        fontSize: 11, 
                        fontWeight: 800, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.06em', 
                        color: subTextColor,
                        marginBottom: 2
                      }}>
                        <Layers size={13} color={accentColor} />
                        <span>Alur Eksekusi Otomatis</span>
                      </div>
                      {wf.steps.map((st, sIdx) => (
                        <div 
                          key={sIdx} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: 10, 
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}`,
                            fontSize: 12.5, 
                            color: isDark ? '#cbd5e1' : '#334155', 
                            lineHeight: 1.55 
                          }}
                        >
                          <span style={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: 6, 
                            background: `${accentColor}22`, 
                            color: accentColor, 
                            border: `1px solid ${accentColor}44`,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: 10.5, 
                            fontWeight: 900, 
                            flexShrink: 0, 
                            marginTop: 1 
                          }}>
                            {sIdx + 1}
                          </span>
                          <span style={{ flex: 1 }}>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits Banner */}
                  <div style={{
                    padding: '11px 14px',
                    borderRadius: 12,
                    background: isDark ? 'linear-gradient(135deg, rgba(16,185,129,0.09) 0%, rgba(6,182,212,0.04) 100%)' : 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: isDark ? '#34d399' : '#059669'
                  }}>
                    <Sparkles size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong style={{ color: isDark ? '#6ee7b7' : '#047857' }}>Nilai Efisiensi:</strong>{' '}
                      <span style={{ color: isDark ? '#a7f3d0' : '#065f46' }}>{wf.benefits}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredWorkflows.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: subTextColor }}>
                <Workflow size={32} style={{ opacity: 0.4, marginBottom: 10 }} />
                <h4 style={{ margin: '0 0 4px', fontSize: 16, color: textColor }}>Tidak ada alur kerja ekosistem yang cocok</h4>
                <p style={{ margin: 0, fontSize: 13 }}>Coba kata kunci pencarian lain.</p>
              </div>
            )}
          </div>
        )}

        {/* ── BAGIAN KHUSUS: TIPS & TRIK UNTUK KLIEN ── */}
        {(filterType === 'all' || filterType === 'client_tips') && (
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.18)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: textColor }}>
                  Tips & Trik Khusus Klien (Client Guide)
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: subTextColor }}>
                  Panduan praktis berinteraksi dengan studio, memesan jasa, mencoba demo aplikasi, dan memantau status pesanan.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {filteredClientTips.map(tip => (
                <div 
                  key={tip.id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 18,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    {/* Top Row: Icon + Badge Emblem */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(var(--theme-analogous-warm-rgb, 245, 158, 11), 0.14)', color: 'var(--theme-analogous-3, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {tip.icon}
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: 'rgba(var(--theme-analogous-warm-rgb, 245, 158, 11), 0.15)', color: 'var(--theme-analogous-3, #f59e0b)', border: '1px solid rgba(var(--theme-analogous-warm-rgb, 245, 158, 11), 0.25)', whiteSpace: 'nowrap' }}>
                          {tip.badge}
                        </span>
                      </div>
                    </div>

                    {/* Title: Full Width */}
                    <h3 style={{ margin: '0 0 12px', fontSize: 15.5, fontWeight: 850, color: textColor, lineHeight: 1.4 }}>
                      {tip.title}
                    </h3>

                    <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: subTextColor }}>
                      {tip.desc}
                    </p>
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
                    border: `1px solid ${cardBorder}`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--theme-analogous-3, #f59e0b)'
                  }}>
                    🎯 <strong>Langkah:</strong> {tip.step}
                  </div>
                </div>
              ))}
            </div>

            {filteredClientTips.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: subTextColor }}>
                <Lightbulb size={32} style={{ opacity: 0.4, marginBottom: 10 }} />
                <h4 style={{ margin: '0 0 4px', fontSize: 16, color: textColor }}>Tidak ada tips klien yang cocok</h4>
                <p style={{ margin: 0, fontSize: 13 }}>Coba kata kunci pencarian lain.</p>
              </div>
            )}
          </div>
        )}

        {/* ── DAFTAR KARTU FITUR & RUTE LENGKAP ── */}
        {(filterType === 'all' || filterType === 'public' || filterType === 'ops' || filterType === 'client_finance' || filterType === 'system') && (
          <div>
            {/* Section Header with Stats & View Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor}18`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: textColor }}>
                      Katalog Seluruh Halaman & Modul Sistem
                    </h2>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: `${accentColor}18`, color: accentColor }}>
                      {filteredItems.length} Modul
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: subTextColor }}>
                    {searchQuery ? `Ditemukan ${filteredItems.length} modul untuk "${searchQuery}" (rincian otomatis dibuka)` : 'Tampilan ringkas minim teks — klik "Detail & Tips" untuk membuka fitur lengkap.'}
                  </p>
                </div>
              </div>

              {/* View Switcher (Compact vs Detailed) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', padding: 4, borderRadius: 10, border: `1px solid ${cardBorder}` }}>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  style={{
                    height: 28,
                    padding: '0 10px',
                    borderRadius: 7,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: viewMode === 'compact' ? cardBg : 'transparent',
                    color: viewMode === 'compact' ? textColor : subTextColor,
                    boxShadow: viewMode === 'compact' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Tampilan ringkas minim teks"
                >
                  <span>⊟ Mode Ringkas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  style={{
                    height: 28,
                    padding: '0 10px',
                    borderRadius: 7,
                    border: 'none',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: viewMode === 'detailed' ? cardBg : 'transparent',
                    color: viewMode === 'detailed' ? textColor : subTextColor,
                    boxShadow: viewMode === 'detailed' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Tampilkan seluruh detail fitur & tips"
                >
                  <span>⊞ Mode Detail</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14 }}>
              {filteredItems.map(item => {
                const isExpanded = viewMode === 'detailed' || (searchQuery.trim().length > 0) || !!expandedIds[item.id];
                const isCopied = copiedId === item.id;
                
                // Color harmony based on module category
                const itemColor = item.type === 'public' 
                  ? 'var(--theme-analogous-2, #0ea5e9)' 
                  : ['adm-finance', 'adm-catalog', 'adm-forms', 'adm-reviews', 'adm-ratecard', 'adm-spk', 'adm-flashsale'].includes(item.id)
                    ? 'var(--theme-analogous-3, #f59e0b)'
                    : ['adm-settings', 'adm-users', 'adm-analytics', 'adm-qr', 'adm-links', 'adm-broadcast'].includes(item.id)
                      ? 'var(--theme-analogous-4, #8b5cf6)'
                      : accentColor;

                const itemBgSoft = item.type === 'public'
                  ? 'rgba(var(--theme-analogous-cool-rgb, 14, 165, 233), 0.12)'
                  : ['adm-finance', 'adm-catalog', 'adm-forms', 'adm-reviews', 'adm-ratecard', 'adm-spk', 'adm-flashsale'].includes(item.id)
                    ? 'rgba(var(--theme-analogous-warm-rgb, 245, 158, 11), 0.12)'
                    : ['adm-settings', 'adm-users', 'adm-analytics', 'adm-qr', 'adm-links', 'adm-broadcast'].includes(item.id)
                      ? 'rgba(var(--theme-analogous-pop-rgb, 139, 92, 246), 0.12)'
                      : `rgba(var(--cms-accent-rgb), 0.12)`;

                return (
                  <div 
                    key={item.id}
                    style={{
                      background: cardBg,
                      border: `1.5px solid ${isExpanded ? `${itemColor}45` : cardBorder}`,
                      borderRadius: 18,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.22)' : '0 2px 10px rgba(0,0,0,0.03)',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Header Row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <div style={{ 
                            width: 38, height: 38, borderRadius: 11, 
                            background: itemBgSoft, 
                            color: itemColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                          }}>
                            {item.icon}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 850, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                              <span style={{ 
                                fontSize: 10.5, fontWeight: 750, padding: '1.5px 6px', borderRadius: 5, 
                                background: itemBgSoft,
                                color: itemColor,
                                border: `1px solid ${itemColor}25`
                              }}>
                                {item.badge}
                              </span>
                              
                              {/* Route copy chip */}
                              <button
                                type="button"
                                onClick={(e) => handleCopyRoute(e, item.route, item.id)}
                                title="Klik untuk salin rute URL"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '1.5px 7px',
                                  borderRadius: 5,
                                  background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                  border: `1px solid ${cardBorder}`,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: isCopied ? '#10b981' : itemColor,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>{item.route.split(' ')[0]}</span>
                                {isCopied ? <Check size={11} color="#10b981" /> : <Copy size={11} style={{ opacity: 0.6 }} />}
                                {isCopied && <span style={{ fontSize: 9.5, fontWeight: 800 }}>Tersalin</span>}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Direct Open Button */}
                        <button
                          type="button"
                          onClick={() => handleNavigate(item.route)}
                          title={`Buka ${item.name}`}
                          style={{
                            height: 30,
                            padding: '0 10px',
                            borderRadius: 9999,
                            border: `1px solid ${itemColor}35`,
                            background: itemBgSoft,
                            color: textColor,
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0,
                            transition: 'all 0.18s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = itemColor;
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = itemBgSoft;
                            e.currentTarget.style.color = textColor;
                          }}
                        >
                          <span>Buka</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </div>

                      {/* Summary */}
                      <p style={{ 
                        margin: '6px 0 10px', 
                        fontSize: 12.5, 
                        lineHeight: 1.45, 
                        color: subTextColor,
                        ...(isExpanded ? {} : {
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        })
                      }}>
                        {item.summary}
                      </p>

                      {/* Expanded Features & Tips */}
                      {isExpanded && (
                        <div style={{ animation: 'cmsFadeIn 0.2s ease', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {/* Features List */}
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${cardBorder}`
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: accentColor, marginBottom: 6 }}>
                              Fitur & Kapabilitas Inti:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.6, color: textColor }}>
                              {item.features.map((f, idx) => (
                                <li key={idx} style={{ marginBottom: 3 }}>{f}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Tips Callout */}
                          <div style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.22)',
                            fontSize: 11.5,
                            color: textColor,
                            lineHeight: 1.48
                          }}>
                            💡 <strong style={{ color: '#10b981' }}>Tips Pro:</strong> {item.tips}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginTop: 10, 
                      paddingTop: 8, 
                      borderTop: `1px solid ${cardBorder}` 
                    }}>
                      <span style={{ 
                        fontSize: 10.5, 
                        fontWeight: 750, 
                        padding: '2px 8px', 
                        borderRadius: 9999, 
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', 
                        color: subTextColor 
                      }}>
                        ⚡ {item.features.length} Fitur
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleCardExpand(item.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: accentColor,
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 4px'
                        }}
                      >
                        {isExpanded ? (
                          <><span>Tutup Rincian</span> <ChevronUp size={13} /></>
                        ) : (
                          <><span>Detail & Tips</span> <ChevronDown size={13} /></>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredItems.length === 0 && (filterType === 'all' || filterType === 'public' || filterType === 'ops' || filterType === 'client_finance' || filterType === 'system') && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }}>
            <Compass size={38} style={{ opacity: 0.4, marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 17, color: textColor }}>Tidak ada rute atau modul yang cocok</h3>
            <p style={{ margin: 0, fontSize: 13 }}>Coba kata kunci lain atau pilih tab filter 'Semua Modul'.</p>
          </div>
        )}

      </main>
    </div>
  );
}
