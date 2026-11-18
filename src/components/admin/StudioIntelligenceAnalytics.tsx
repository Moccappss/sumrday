import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, Users, Shield, Zap, Search, Filter, RefreshCw, 
  Download, Globe, Laptop, Smartphone, Tablet, ArrowUpRight, 
  CheckCircle2, AlertTriangle, XCircle, X, ChevronRight, ChevronDown, ChevronUp,
  ExternalLink, Eye, Clock, MapPin, Sparkles, Copy, Check, 
  TrendingUp, FileText, Layers, FolderKanban, ShoppingBag, 
  StickyNote, AlertCircle, BarChart3, PieChart, ShieldAlert,
  ArrowRight, Share2, Info, Lock, Edit3, Compass, Calendar
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { 
  VisitorLog, 
  LoginAuditLog, 
  seedIntelligenceDataIfEmpty, 
  recordVisitorHit, 
  recordLoginAudit,
  detectDeviceAndBrowser,
  getClientGeoInfo
} from '../../utils/trafficTracker';
import { 
  ContentAuditResult, 
  analyzeBlogPost, 
  analyzePortfolioProject, 
  analyzeCatalogProduct, 
  analyzeNoteDraft,
  autoFixContentIssue
} from '../../utils/contentHealthAnalyzer';
import { useDialog } from './DialogProvider';

interface StudioIntelligenceAnalyticsProps {
  onSwitchPage?: (page: string) => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

// ── Custom 100% Rounded Pill Dropdown (Floating Menu with Rounded Corners) ──
const RoundedPillDropdown: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: DropdownOption[];
  minWidth?: number;
}> = ({ value, onChange, options, minWidth = 150 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 16px',
          borderRadius: 999,
          background: isOpen ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${isOpen ? 'var(--cms-accent, #6366f1)' : 'var(--cms-border, rgba(255, 255, 255, 0.12))'}`,
          color: 'var(--cms-text, #fff)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          outline: 'none',
          userSelect: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none'
        }}
      >
        {selectedOption?.icon && (
          <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
            {selectedOption.icon}
          </span>
        )}
        <span>{selectedOption?.label}</span>
        <ChevronDown
          size={13}
          style={{
            opacity: 0.65,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            marginLeft: 2
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: Math.max(minWidth, 155),
            background: 'var(--cms-card-bg, #141523)',
            border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.14))',
            borderRadius: 16,
            padding: 6,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                  border: 'none',
                  color: isSelected ? 'var(--cms-accent, #a5b4fc)' : 'var(--cms-text, #e2e8f0)',
                  fontSize: 12,
                  fontWeight: isSelected ? 750 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {opt.icon && <span>{opt.icon}</span>}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={13} color="var(--cms-accent, #818cf8)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const getPageCategory = (path: string) => {
  if (!path) return { label: 'Halaman Web', bg: 'rgba(255, 255, 255, 0.06)', color: 'var(--cms-text, #fff)', border: 'rgba(255, 255, 255, 0.1)' };
  if (path.startsWith('/admin')) return { label: 'Admin Panel', bg: 'rgba(99, 102, 241, 0.14)', color: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)' };
  if (path === '/' || path === '') return { label: 'Beranda', bg: 'rgba(56, 189, 248, 0.14)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
  if (path.startsWith('/katalog')) return { label: 'Katalog', bg: 'rgba(168, 85, 247, 0.14)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
  if (path.startsWith('/portfolio') || path.startsWith('/karya')) return { label: 'Portofolio', bg: 'rgba(236, 72, 153, 0.14)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' };
  if (path.startsWith('/pricing') || path.startsWith('/harga')) return { label: 'Paket Biaya', bg: 'rgba(245, 158, 11, 0.14)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
  if (path.startsWith('/blog') || path.startsWith('/jurnal')) return { label: 'Jurnal / Blog', bg: 'rgba(16, 185, 129, 0.14)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
  if (path.startsWith('/updates')) return { label: 'Kabar Update', bg: 'rgba(20, 184, 166, 0.14)', color: '#2dd4bf', border: 'rgba(20, 184, 166, 0.3)' };
  if (path.startsWith('/links')) return { label: 'Bio Link', bg: 'rgba(251, 146, 60, 0.14)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' };
  return { label: 'Halaman Web', bg: 'rgba(255, 255, 255, 0.06)', color: 'var(--cms-text, #fff)', border: 'rgba(255, 255, 255, 0.1)' };
};

const formatSessionDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds} dtk`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
};

export const StudioIntelligenceAnalytics: React.FC<StudioIntelligenceAnalyticsProps> = ({
  onSwitchPage,
  notify = (msg) => console.log(msg)
}) => {
  const { showAlert } = useDialog();

  // Active Tab: 'visitors' | 'logins' | 'content_optimizer'
  const [activeTab, setActiveTab] = useState<'visitors' | 'logins' | 'content_optimizer'>('visitors');

  // Loading & Data States
  const [isLoading, setIsLoading] = useState(true);
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [logins, setLogins] = useState<LoginAuditLog[]>([]);
  const [contentAudits, setContentAudits] = useState<ContentAuditResult[]>([]);
  const [currentGeo, setCurrentGeo] = useState<{ ip: string; city: string; country: string } | null>({
    ip: '2404:c0:b603:6358:c093:1549:47:87f5',
    city: 'Surabaya',
    country: 'Indonesia'
  });

  // Search & Filter States
  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorDeviceFilter, setVisitorDeviceFilter] = useState<string>('all');
  const [visitorRoleFilter, setVisitorRoleFilter] = useState<string>('all');
  const [visitorViewMode, setVisitorViewMode] = useState<'sessions' | 'raw'>('sessions');
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const [loginSearch, setLoginSearch] = useState('');
  const [loginStatusFilter, setLoginStatusFilter] = useState<string>('all');

  const [contentSearch, setContentSearch] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [contentScoreFilter, setContentScoreFilter] = useState<string>('all');
  const [expandedContentId, setExpandedContentId] = useState<string | null>(null);

  // Copied feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Load All Data ──
  const loadAllAnalyticsData = useCallback(async (forceGeoRefresh = false) => {
    setIsLoading(true);
    try {
      // Resolve Live Client Geo
      const geo = await getClientGeoInfo(forceGeoRefresh);
      setCurrentGeo(geo);

      // 1. Visitor & Login Data
      const { visitors: seedVis, logins: seedLogs } = await seedIntelligenceDataIfEmpty();
      setVisitors(seedVis);
      setLogins(seedLogs);

      // 2. Content Data for Optimization Engine
      const [blogPosts, portfolioItems, catalogProducts, memoNotes] = await Promise.all([
        storage.getItem('porto_blog_posts', []),
        storage.getItem('porto_portfolio', []),
        storage.getItem('porto_catalog_products', []),
        storage.getItem('porto_memo_notes', [])
      ]);

      const audits: ContentAuditResult[] = [];

      // Analyze Blog Posts
      if (Array.isArray(blogPosts)) {
        blogPosts.forEach(post => {
          if (post && !post.isDeleted) audits.push(analyzeBlogPost(post));
        });
      }

      // Analyze Portfolio Items
      if (Array.isArray(portfolioItems)) {
        portfolioItems.forEach(item => {
          if (item) audits.push(analyzePortfolioProject(item));
        });
      }

      // Analyze Catalog Products
      if (Array.isArray(catalogProducts)) {
        catalogProducts.forEach(prod => {
          if (prod) audits.push(analyzeCatalogProduct(prod));
        });
      }

      // Analyze Memo Notes
      if (Array.isArray(memoNotes)) {
        memoNotes.forEach(note => {
          if (note && !note.isArchived) audits.push(analyzeNoteDraft(note));
        });
      }

      // Sort by score ascending (lowest score / needs attention first)
      audits.sort((a, b) => a.score - b.score);
      setContentAudits(audits);

    } catch (err) {
      console.error('[IntelligenceAnalytics] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler One-Click AI Auto-Fix
  const [fixingCheckKey, setFixingCheckKey] = useState<string | null>(null);

  const handleAutoFix = async (item: ContentAuditResult, checkId: string) => {
    const key = `${item.id}_${checkId}`;
    setFixingCheckKey(key);
    try {
      const res = await autoFixContentIssue(item.sourceItem, item.type, checkId);
      if (res.success) {
        notify?.(res.message, 'success');
        await loadAllAnalyticsData();
      } else {
        notify?.(res.message || 'Gagal memperbaiki otomatis.', 'error');
      }
    } catch (err: any) {
      notify?.(err?.message || 'Terjadi kendala saat menghubungkan AI.', 'error');
    } finally {
      setFixingCheckKey(null);
    }
  };

  useEffect(() => {
    loadAllAnalyticsData();

    // Listen for live updates
    const handleVisitorHit = () => {
      storage.getItem('porto_visitor_stats', []).then(v => {
        if (Array.isArray(v)) setVisitors(v);
      });
    };

    const handleLoginHit = () => {
      storage.getItem('porto_login_audit_logs', []).then(l => {
        if (Array.isArray(l)) setLogins(l);
      });
    };

    window.addEventListener('sumr_visitor_logged', handleVisitorHit);
    window.addEventListener('sumr_login_audit_logged', handleLoginHit);
    window.addEventListener('porto_blog_saved', () => loadAllAnalyticsData());

    return () => {
      window.removeEventListener('sumr_visitor_logged', handleVisitorHit);
      window.removeEventListener('sumr_login_audit_logged', handleLoginHit);
      window.removeEventListener('porto_blog_saved', () => loadAllAnalyticsData());
    };
  }, [loadAllAnalyticsData]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notify(`Disalin: ${text}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Metrics Calculations ──
  const totalVisitorsCount = visitors.length;
  const uniqueIps = useMemo(() => new Set(visitors.map(v => v.ip)).size, [visitors]);
  
  const deviceStats = useMemo(() => {
    const counts = { Desktop: 0, Mobile: 0, Tablet: 0 };
    visitors.forEach(v => {
      if (v.device === 'Mobile') counts.Mobile++;
      else if (v.device === 'Tablet') counts.Tablet++;
      else counts.Desktop++;
    });
    const total = visitors.length || 1;
    return {
      desktopPct: Math.round((counts.Desktop / total) * 100),
      mobilePct: Math.round((counts.Mobile / total) * 100),
      tabletPct: Math.round((counts.Tablet / total) * 100),
      ...counts
    };
  }, [visitors]);

  const topLocations = useMemo(() => {
    const map = new Map<string, number>();
    visitors.forEach(v => {
      const key = `${v.city}, ${v.country}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([loc, count]) => ({ loc, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visitors]);

  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    visitors.forEach(v => {
      map.set(v.path, (map.get(v.path) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visitors]);

  const averageHealthScore = useMemo(() => {
    if (contentAudits.length === 0) return 100;
    const sum = contentAudits.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / contentAudits.length);
  }, [contentAudits]);

  const successfulLoginsCount = useMemo(() => {
    return logins.filter(l => l.status === 'success').length;
  }, [logins]);

  const failedLoginsCount = useMemo(() => {
    return logins.filter(l => l.status === 'failed').length;
  }, [logins]);

  // ── Filtered Visitor Logs ──
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const q = visitorSearch.toLowerCase();
      const matchQuery = !q || 
        v.ip.toLowerCase().includes(q) || 
        v.city.toLowerCase().includes(q) || 
        v.country.toLowerCase().includes(q) || 
        v.path.toLowerCase().includes(q) || 
        v.userName.toLowerCase().includes(q);

      const matchDevice = visitorDeviceFilter === 'all' || v.device.toLowerCase() === visitorDeviceFilter.toLowerCase();
      const matchRole = visitorRoleFilter === 'all' || v.userRole.toLowerCase() === visitorRoleFilter.toLowerCase();

      return matchQuery && matchDevice && matchRole;
    });
  }, [visitors, visitorSearch, visitorDeviceFilter, visitorRoleFilter]);

  // ── Session Rollup & Date Grouping Helper ──
  const groupedVisitorSessions = useMemo(() => {
    const sorted = [...filteredVisitors].sort((a, b) => b.timestamp - a.timestamp);
    const sessions: Array<{
      id: string;
      ip: string;
      city: string;
      region?: string;
      country: string;
      countryCode?: string;
      isp?: string;
      browser: string;
      os: string;
      device: 'Desktop' | 'Mobile' | 'Tablet';
      userRole: 'Admin' | 'Klien' | 'Pengunjung';
      userName: string;
      startTime: number;
      endTime: number;
      startDateString: string;
      endDateString: string;
      timeRangeLabel: string;
      dateKey: string;
      dateLabel: string;
      paths: string[];
      hits: VisitorLog[];
    }> = [];

    const SESSION_GAP_MS = 25 * 60 * 1000; // 25 menit threshold sesi dari IP & perangkat yang sama

    const getDateInfo = (timestamp: number) => {
      const d = new Date(timestamp || Date.now());
      const now = new Date();
      
      const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const diffDays = Math.round((nowMidnight - dMidnight) / (1000 * 60 * 60 * 24));

      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const formattedDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      let prefix = '';
      if (diffDays === 0) prefix = 'Hari Ini — ';
      else if (diffDays === 1) prefix = 'Kemarin — ';

      return {
        dateKey,
        dateLabel: `${prefix}${formattedDate}`,
        isToday: diffDays === 0
      };
    };

    sorted.forEach((vis) => {
      const { dateKey, dateLabel } = getDateInfo(vis.timestamp);

      // Cari sesi aktif yang cocok (IP sama, browser sama, device sama, tanggal sama, jarak waktu <= 25 menit)
      const existing = sessions.find((s) => 
        s.ip === vis.ip &&
        s.browser === vis.browser &&
        s.device === vis.device &&
        s.dateKey === dateKey &&
        (Math.abs(s.startTime - vis.timestamp) <= SESSION_GAP_MS || Math.abs(s.endTime - vis.timestamp) <= SESSION_GAP_MS)
      );

      if (existing) {
        existing.hits.push(vis);
        if (vis.timestamp < existing.startTime) {
          existing.startTime = vis.timestamp;
          existing.startDateString = vis.dateString;
        }
        if (vis.timestamp > existing.endTime) {
          existing.endTime = vis.timestamp;
          existing.endDateString = vis.dateString;
        }
        if (!existing.paths.includes(vis.path)) {
          existing.paths.push(vis.path);
        }
      } else {
        sessions.push({
          id: `sess_${vis.id}`,
          ip: vis.ip,
          city: vis.city,
          region: vis.region,
          country: vis.country,
          countryCode: vis.countryCode,
          isp: vis.isp,
          browser: vis.browser,
          os: vis.os,
          device: vis.device,
          userRole: vis.userRole,
          userName: vis.userName,
          startTime: vis.timestamp,
          endTime: vis.timestamp,
          startDateString: vis.dateString,
          endDateString: vis.dateString,
          timeRangeLabel: '',
          dateKey,
          dateLabel,
          paths: [vis.path],
          hits: [vis]
        });
      }
    });

    // Urutkan hits di dalam masing-masing sesi dan buat label rentang waktu
    sessions.forEach((s) => {
      s.hits.sort((a, b) => b.timestamp - a.timestamp);
      const startD = new Date(s.startTime);
      const endD = new Date(s.endTime);
      const startStr = startD.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');
      const endStr = endD.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');

      if (s.hits.length <= 1 || startStr === endStr) {
        s.timeRangeLabel = endStr;
      } else {
        s.timeRangeLabel = `${startStr} – ${endStr}`;
      }
    });

    // Grouping berdasarkan Tanggal (Date)
    const dateGroupsMap = new Map<string, { dateKey: string; dateLabel: string; sessions: typeof sessions; totalHits: number }>();

    sessions.forEach((s) => {
      if (!dateGroupsMap.has(s.dateKey)) {
        dateGroupsMap.set(s.dateKey, {
          dateKey: s.dateKey,
          dateLabel: s.dateLabel,
          sessions: [],
          totalHits: 0
        });
      }
      const grp = dateGroupsMap.get(s.dateKey)!;
      grp.sessions.push(s);
      grp.totalHits += s.hits.length;
    });

    return Array.from(dateGroupsMap.values());
  }, [filteredVisitors]);

  // ── Filtered Login Audit Logs ──
  const filteredLogins = useMemo(() => {
    return logins.filter(l => {
      const q = loginSearch.toLowerCase();
      const matchQuery = !q || 
        l.email.toLowerCase().includes(q) || 
        l.name.toLowerCase().includes(q) || 
        l.ip.toLowerCase().includes(q) || 
        l.city.toLowerCase().includes(q);

      const matchStatus = loginStatusFilter === 'all' || l.status === loginStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [logins, loginSearch, loginStatusFilter]);

  // ── Filtered Content Audits ──
  const filteredContentAudits = useMemo(() => {
    return contentAudits.filter(item => {
      const q = contentSearch.toLowerCase();
      const matchQuery = !q || item.title.toLowerCase().includes(q);
      const matchType = contentTypeFilter === 'all' || item.type === contentTypeFilter;
      
      let matchScore = true;
      if (contentScoreFilter === 'optimal') matchScore = item.score >= 85;
      else if (contentScoreFilter === 'needs_fix') matchScore = item.score < 85 && item.score >= 50;
      else if (contentScoreFilter === 'critical') matchScore = item.score < 50;

      return matchQuery && matchType && matchScore;
    });
  }, [contentAudits, contentSearch, contentTypeFilter, contentScoreFilter]);

  // Export JSON Report
  const handleExportData = () => {
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      studioHealthScore: averageHealthScore,
      totalVisitors: totalVisitorsCount,
      uniqueVisitors: uniqueIps,
      deviceBreakdown: deviceStats,
      visitors: visitors.slice(0, 100),
      loginAuditTrail: logins.slice(0, 100),
      contentHealthAudits: contentAudits.map(c => ({
        title: c.title,
        type: c.typeLabel,
        score: c.score,
        grade: c.grade,
        passedChecks: `${c.passedCount}/${c.totalChecks}`,
        wordCount: c.wordCount
      }))
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sumrday-studio-intelligence-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Laporan berhasil diekspor', 'success');
  };

  // Simulate a live test visitor hit using real live Geo
  const handleSimulateVisitorHit = async () => {
    const demoPaths = ['/', '/blog', '/portofolio', '/katalog', '/pricing', '/preview/note/demo-concept'];
    const randomPath = demoPaths[Math.floor(Math.random() * demoPaths.length)];
    const log = await recordVisitorHit(randomPath, `Live Ping (${randomPath})`, 'Pengunjung', 'Tamu Studio');
    if (log) {
      setVisitors(prev => [log, ...prev]);
      notify(`Ping tercatat: ${randomPath}`, 'success');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 40px)',
      maxHeight: 'calc(100vh - 40px)',
      width: '100%',
      background: 'var(--cms-bg, #0b0c14)',
      color: 'var(--cms-text, #f8fafc)',
      padding: '14px 20px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* ── HEADER BANNER ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 10,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))',
            border: '1.5px solid rgba(99, 102, 241, 0.4)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.22)'
          }}>
            <Activity size={24} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--cms-text, #fff)' }}>
                Traffic & Intel
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                Aktif
              </span>
              {currentGeo && (
                <span 
                  onClick={() => loadAllAnalyticsData(true)}
                  title="Klik untuk deteksi ulang IP dan lokasi terkini"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '2px 9px',
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--cms-text-muted, #94a3b8)',
                    border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.1))',
                    cursor: 'pointer'
                  }}
                >
                  <MapPin size={11} color="#10b981" />
                  {currentGeo.city} ({currentGeo.ip})
                  <RefreshCw size={10} style={{ marginLeft: 3 }} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls (Icon-Only Minimalis) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={handleSimulateVisitorHit}
            title="Ping"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.12))',
              color: 'var(--cms-text, #fff)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
          >
            <Zap size={14} color="#eab308" />
          </button>

          <button
            onClick={() => loadAllAnalyticsData(true)}
            title="Segarkan"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.12))',
              color: 'var(--cms-text, #fff)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => {
              window.open('https://lookerstudio.google.com/', '_blank', 'noopener,noreferrer');
              notify('Membuka Google Looker Studio untuk pelaporan eksekutif', 'info');
            }}
            title="Buka Google Looker Studio"
            style={{
              padding: '0 12px',
              height: 34,
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.12))',
              color: 'var(--cms-text, #fff)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 800,
              transition: 'all 0.15s'
            }}
          >
            <BarChart3 size={14} color="#3b82f6" />
            <span>Looker Studio</span>
          </button>

          <button
            onClick={handleExportData}
            title="Ekspor"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: 'var(--cms-accent, #6366f1)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.15s'
            }}
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* ── 4 KPI CARDS (Sleek Compact Metrics Bar) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        marginBottom: 10,
        flexShrink: 0
      }}>
        {/* Card 1: Visitors */}
        <div style={{
          background: 'var(--cms-card-bg, #13141f)',
          border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Kunjungan
            </span>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, #fff)', marginTop: 2 }}>
              {totalVisitorsCount} <span style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6' }}>({uniqueIps} Unik)</span>
            </div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={14} />
          </div>
        </div>

        {/* Card 2: Login Security */}
        <div style={{
          background: 'var(--cms-card-bg, #13141f)',
          border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Login
            </span>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, #fff)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{successfulLoginsCount} <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>Sukses</span></span>
              {failedLoginsCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{failedLoginsCount} Gagal</span>
              )}
            </div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} />
          </div>
        </div>

        {/* Card 3: Content SEO Score */}
        <div style={{
          background: 'var(--cms-card-bg, #13141f)',
          border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SEO
            </span>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, #fff)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{averageHealthScore}<span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cms-text-muted)' }}>/100</span></span>
              <span style={{
                fontSize: 9.5,
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 999,
                background: averageHealthScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                color: averageHealthScore >= 80 ? '#10b981' : '#eab308'
              }}>
                {averageHealthScore >= 80 ? 'Optimal' : 'Audit'}
              </span>
            </div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} />
          </div>
        </div>

        {/* Card 4: Device Spread */}
        <div style={{
          background: 'var(--cms-card-bg, #13141f)',
          border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Perangkat
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, marginTop: 4 }}>
              <span style={{ color: '#818cf8' }}>{deviceStats.desktopPct}% Desk</span>
              <span style={{ color: '#38bdf8' }}>{deviceStats.mobilePct}% Mob</span>
              <span style={{ color: '#c084fc' }}>{deviceStats.tabletPct}% Tab</span>
            </div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Laptop size={14} />
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION (Rounded Pill Style, 1-2 words) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: 3,
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
        borderRadius: 999,
        width: 'fit-content',
        marginBottom: 10,
        flexShrink: 0
      }}>
        <button
          onClick={() => setActiveTab('visitors')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            borderRadius: 999,
            border: 'none',
            background: activeTab === 'visitors' ? 'var(--cms-accent, #6366f1)' : 'transparent',
            color: activeTab === 'visitors' ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Users size={14} />
          Traffic ({visitors.length})
        </button>

        <button
          onClick={() => setActiveTab('logins')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            borderRadius: 999,
            border: 'none',
            background: activeTab === 'logins' ? 'var(--cms-accent, #6366f1)' : 'transparent',
            color: activeTab === 'logins' ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Shield size={14} />
          Keamanan ({logins.length})
        </button>

        <button
          onClick={() => setActiveTab('content_optimizer')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            borderRadius: 999,
            border: 'none',
            background: activeTab === 'content_optimizer' ? 'var(--cms-accent, #6366f1)' : 'transparent',
            color: activeTab === 'content_optimizer' ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Zap size={14} />
          Optimasi ({contentAudits.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: TRAFFIC & PENGUNJUNG
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'visitors' && (
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 260px',
          gap: 12,
          alignItems: 'stretch',
          overflow: 'hidden'
        }}>
          {/* ── KOLOM UTAMA (KIRI): Toolbar & Tabel Sesi ── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minWidth: 0,
            height: '100%',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {/* Search & Rounded Dropdowns Toolbar */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            background: 'var(--cms-card-bg, #13141f)',
            border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 999,
            padding: '6px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
              <Search size={14} color="var(--cms-text-muted)" />
              <input
                type="text"
                placeholder="Cari..."
                value={visitorSearch}
                onChange={(e) => setVisitorSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--cms-text, #fff)',
                  fontSize: 12,
                  width: '100%'
                }}
              />
              {visitorSearch && (
                <button
                  onClick={() => setVisitorSearch('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Hapus pencarian"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Rounded Custom Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <RoundedPillDropdown
                value={visitorDeviceFilter}
                onChange={setVisitorDeviceFilter}
                options={[
                  { value: 'all', label: 'Perangkat' },
                  { value: 'desktop', label: 'Desktop', icon: <Laptop size={13} /> },
                  { value: 'mobile', label: 'Mobile', icon: <Smartphone size={13} /> },
                  { value: 'tablet', label: 'Tablet', icon: <Tablet size={13} /> }
                ]}
              />

              <RoundedPillDropdown
                value={visitorRoleFilter}
                onChange={setVisitorRoleFilter}
                options={[
                  { value: 'all', label: 'Peran' },
                  { value: 'pengunjung', label: 'Tamu', icon: <Users size={13} /> },
                  { value: 'klien', label: 'Klien', icon: <Users size={13} /> },
                  { value: 'admin', label: 'Admin', icon: <Shield size={13} /> }
                ]}
              />
            {/* View Mode Toggle: Ringkasan Sesi (Default) vs Log Mentah - Icon Only */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
              borderRadius: 100,
              padding: '2px 3px',
              gap: 2
            }}>
              <button
                type="button"
                onClick={() => setVisitorViewMode('sessions')}
                title="Sesi Ringkas"
                aria-label="Sesi Ringkas"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 100,
                  border: 'none',
                  background: visitorViewMode === 'sessions' ? 'var(--cms-accent, #6366f1)' : 'transparent',
                  color: visitorViewMode === 'sessions' ? '#ffffff' : 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0
                }}
              >
                <BarChart3 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setVisitorViewMode('raw')}
                title={`Semua Log Mentah (${filteredVisitors.length})`}
                aria-label={`Semua Log Mentah (${filteredVisitors.length})`}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 100,
                  border: 'none',
                  background: visitorViewMode === 'raw' ? 'var(--cms-accent, #6366f1)' : 'transparent',
                  color: visitorViewMode === 'raw' ? '#ffffff' : 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0
                }}
              >
                <FileText size={14} />
              </button>
            </div>
          </div>
        </div>

          {/* Visitor Logs Table */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--cms-card-bg, #13141f)',
            border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 16,
            overflow: 'hidden'
          }}>
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: 'var(--cms-card-bg, #13141f)'
                }}>
                  <tr style={{
                    background: 'var(--cms-table-header-bg, rgba(255, 255, 255, 0.04))',
                    borderBottom: '1px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
                    color: 'var(--cms-text-muted, #94a3b8)',
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 800
                  }}>
                    <th style={{ padding: '10px 14px' }}>Waktu</th>
                    <th style={{ padding: '10px 14px' }}>IP</th>
                    <th style={{ padding: '10px 14px' }}>Lokasi</th>
                    <th style={{ padding: '10px 14px' }}>Perangkat</th>
                    <th style={{ padding: '10px 14px' }}>Halaman</th>
                    <th style={{ padding: '10px 14px' }}>Peran</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'var(--cms-text-muted)' }}>
                        Tidak ada data kunjungan yang sesuai filter.
                      </td>
                    </tr>
                  ) : visitorViewMode === 'sessions' ? (
                    /* ══════════════════════════════════════════════
                       MODE 1: RINGKASAN SESI & GROUPING TANGGAL
                       ══════════════════════════════════════════════ */
                    groupedVisitorSessions.map((dateGrp) => (
                      <React.Fragment key={dateGrp.dateKey}>
                        {/* Date Group Header */}
                        <tr style={{
                          background: 'rgba(99, 102, 241, 0.07)',
                          borderBottom: '1px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
                          borderTop: '1px solid var(--cms-border, rgba(255, 255, 255, 0.08))'
                        }}>
                          <td colSpan={6} style={{ padding: '8px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, color: 'var(--cms-text, #fff)', fontSize: 12 }}>
                                <Calendar size={13} color="var(--cms-accent, #818cf8)" />
                                <span>{dateGrp.dateLabel}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 750, color: 'var(--cms-text-muted)' }}>
                                <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 100 }}>
                                  {dateGrp.sessions.length} Sesi
                                </span>
                                <span>&bull;</span>
                                <span style={{ color: 'var(--cms-accent, #818cf8)' }}>
                                  {dateGrp.totalHits} Aksi
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>


                        {/* Sessions Rows within this Date */}
                        {dateGrp.sessions.map((sess) => {
                          const isExpanded = Boolean(expandedSessions[sess.id]);
                          const lastHit = sess.hits[0];
                          const entryHit = sess.hits[sess.hits.length - 1];

                          // Hitung agregasi & frekuensi halaman unik
                          const pageFrequency = sess.paths.map((p) => {
                            const count = sess.hits.filter(h => h.path === p).length;
                            const percent = Math.round((count / sess.hits.length) * 100);
                            return { path: p, count, percent };
                          }).sort((a, b) => b.count - a.count);

                          return (
                            <React.Fragment key={sess.id}>
                              <tr 
                                style={{
                                  borderBottom: isExpanded ? 'none' : '1px solid var(--cms-border, rgba(255, 255, 255, 0.05))',
                                  background: isExpanded ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                {/* Waktu Sesi */}
                                <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--cms-text, #0f172a)', fontSize: 12 }}>
                                      {sess.timeRangeLabel}
                                    </span>
                                    {sess.hits.length > 1 && (
                                      <span style={{
                                        fontSize: 10,
                                        fontWeight: 750,
                                        padding: '1.5px 6px',
                                        borderRadius: 999,
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        color: '#10b981'
                                      }}>
                                        {sess.hits.length}x
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedSessions(p => ({ ...p, [sess.id]: !p[sess.id] }))}
                                      style={{
                                        background: isExpanded ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                        border: isExpanded ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid var(--cms-border, rgba(0, 0, 0, 0.06))',
                                        borderRadius: 6,
                                        padding: '2px 8px',
                                        color: isExpanded ? 'var(--cms-accent, #6366f1)' : 'var(--cms-text-muted)',
                                        fontSize: 11,
                                        fontWeight: 650,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      <span>{isExpanded ? 'Tutup alur' : `Alur sesi (${sess.hits.length})`}</span>
                                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                    </button>
                                  </div>
                                </td>

                                {/* IP Geolocation */}
                                <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{
                                      fontFamily: 'monospace',
                                      fontWeight: 700,
                                      color: 'var(--cms-accent, #6366f1)',
                                      background: 'rgba(99, 102, 241, 0.08)',
                                      border: '1px solid rgba(99, 102, 241, 0.2)',
                                      padding: '3px 8px',
                                      borderRadius: 6,
                                      fontSize: 11.5
                                    }}>
                                      {sess.ip}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(sess.ip, sess.id)}
                                      title="Salin Alamat IP"
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.05))',
                                        color: copiedId === sess.id ? '#10b981' : 'var(--cms-text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {copiedId === sess.id ? <Check size={11} /> : <Copy size={11} />}
                                    </button>
                                    <a
                                      href={`https://ipwho.is/${encodeURIComponent(sess.ip)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Cek Geolocation Akurat (ipwho.is)"
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.05))',
                                        color: 'var(--cms-text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textDecoration: 'none',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cms-accent, #6366f1)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cms-text-muted)')}
                                    >
                                      <Compass size={11} />
                                    </a>
                                  </div>
                                </td>

                                {/* Lokasi Asal & ISP */}
                                <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>
                                    <MapPin size={12} color="#f43f5e" />
                                    <span>{sess.city}{sess.region ? `, ${sess.region}` : ''}, {sess.country}</span>
                                  </div>
                                  {sess.isp && (
                                    <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 2, paddingLeft: 17 }}>
                                      {sess.isp}
                                    </div>
                                  )}
                                </td>

                                {/* Perangkat & OS */}
                                <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    {sess.device === 'Mobile' ? (
                                      <Smartphone size={13} color="#38bdf8" />
                                    ) : sess.device === 'Tablet' ? (
                                      <Tablet size={13} color="#c084fc" />
                                    ) : (
                                      <Laptop size={13} color="var(--cms-accent, #6366f1)" />
                                    )}
                                    <div>
                                      <div style={{ fontWeight: 650, color: 'var(--cms-text, #0f172a)' }}>
                                        {sess.browser}
                                      </div>
                                      <div style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                                        {sess.os}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Ringkasan Alur Halaman (Single-line & Rapi) */}
                                <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, maxWidth: 300, overflow: 'hidden' }}>
                                    {sess.paths.length === 1 ? (
                                      <span style={{
                                        fontFamily: 'monospace',
                                        fontWeight: 650,
                                        fontSize: 11.5,
                                        color: 'var(--cms-text, #0f172a)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        padding: '2px 7px',
                                        borderRadius: 6,
                                        border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.06))',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {sess.paths[0]}
                                      </span>
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                                        <span style={{
                                          fontFamily: 'monospace',
                                          fontWeight: 650,
                                          fontSize: 11,
                                          color: 'var(--cms-text-muted)',
                                          background: 'rgba(255, 255, 255, 0.05)',
                                          padding: '2px 6px',
                                          borderRadius: 5,
                                          border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.05))',
                                          maxWidth: 110,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }} title={`Masuk: ${entryHit?.path || sess.paths[0]}`}>
                                          {entryHit?.path || sess.paths[0]}
                                        </span>
                                        <ArrowRight size={10} style={{ opacity: 0.35, flexShrink: 0 }} />
                                        <span style={{
                                          fontFamily: 'monospace',
                                          fontWeight: 650,
                                          fontSize: 11,
                                          color: 'var(--cms-accent, #6366f1)',
                                          background: 'rgba(99, 102, 241, 0.08)',
                                          padding: '2px 6px',
                                          borderRadius: 5,
                                          border: '1px solid rgba(99, 102, 241, 0.18)',
                                          maxWidth: 110,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }} title={`Terakhir: ${lastHit?.path || sess.paths[sess.paths.length - 1]}`}>
                                          {lastHit?.path || sess.paths[sess.paths.length - 1]}
                                        </span>
                                        {sess.paths.length > 2 && (
                                          <span style={{
                                            fontSize: 9.5,
                                            fontWeight: 750,
                                            color: 'var(--cms-text-muted)',
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            padding: '1.5px 5px',
                                            borderRadius: 4,
                                            flexShrink: 0
                                          }}>
                                            +{sess.paths.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Peran Pengunjung */}
                                <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: sess.userRole === 'Admin' ? 'rgba(99, 102, 241, 0.12)' : sess.userRole === 'Klien' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                    color: sess.userRole === 'Admin' ? 'var(--cms-accent, #6366f1)' : sess.userRole === 'Klien' ? '#10b981' : 'var(--cms-text-muted)'
                                  }}>
                                    {sess.userRole}
                                  </span>
                                </td>
                              </tr>

                              {/* Accordion Child: Dashboard Alur Lengkap, Efektif & Full-Width */}
                              {isExpanded && (
                                <tr style={{ background: 'transparent' }}>
                                  <td colSpan={6} style={{ padding: '4px 16px 16px 16px' }}>
                                    <div style={{
                                      background: 'var(--cms-card-bg, #ffffff)',
                                      border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.08))',
                                      borderRadius: 14,
                                      padding: '16px 20px',
                                      width: '100%',
                                      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
                                    }}>
                                      {/* Header Ringkas & Metrik Sesi */}
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 10,
                                        paddingBottom: 12,
                                        borderBottom: '1px solid var(--cms-border, rgba(0, 0, 0, 0.06))'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--cms-text, #0f172a)', fontSize: 13 }}>
                                            <Layers size={15} color="var(--cms-accent, #6366f1)" />
                                            <span>Rincian Sesi Pengunjung</span>
                                          </div>
                                          <span style={{
                                            fontSize: 11,
                                            fontWeight: 650,
                                            color: 'var(--cms-text-muted)',
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.04))',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4
                                          }}>
                                            <Clock size={11} />
                                            <span>Durasi: {formatSessionDuration(Math.abs(sess.endTime - sess.startTime))}</span>
                                          </span>
                                          <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: '#10b981',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4
                                          }}>
                                            <Zap size={11} />
                                            <span>{sess.hits.length} Total Akses</span>
                                          </span>
                                          <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: 'var(--cms-accent, #6366f1)',
                                            background: 'rgba(99, 102, 241, 0.08)',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4
                                          }}>
                                            <FileText size={11} />
                                            <span>{sess.paths.length} Halaman Unik</span>
                                          </span>
                                          {entryHit?.referrer && !entryHit.referrer.includes('sumr.day') && !entryHit.referrer.startsWith('/') && (
                                            <span style={{
                                              fontSize: 11,
                                              color: 'var(--cms-text-muted)',
                                              background: 'rgba(255, 255, 255, 0.05)',
                                              padding: '2px 8px',
                                              borderRadius: 999,
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: 4
                                            }}>
                                              <Compass size={11} />
                                              <span>Rujukan Awal: <strong>{entryHit.referrer}</strong></span>
                                            </span>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => setExpandedSessions(p => ({ ...p, [sess.id]: false }))}
                                          style={{
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.06))',
                                            borderRadius: 7,
                                            color: 'var(--cms-text-muted)',
                                            fontSize: 11.5,
                                            fontWeight: 650,
                                            cursor: 'pointer',
                                            padding: '4px 10px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            transition: 'all 0.15s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'var(--cms-text, #0f172a)';
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'var(--cms-text-muted)';
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                          }}
                                        >
                                          <span>Tutup alur</span>
                                          <ChevronUp size={12} />
                                        </button>
                                      </div>

                                      {/* Two-Column Grid: Ringkasan Efektif (Kiri) + Kronologi Timeline (Kanan) */}
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                        gap: 20,
                                        marginTop: 14
                                      }}>
                                        {/* KOLOM 1: Ringkasan Frekuensi Halaman (Efektif & Tidak Penuh) */}
                                        <div style={{
                                          background: 'rgba(255, 255, 255, 0.02)',
                                          border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.05))',
                                          borderRadius: 10,
                                          padding: '12px 14px'
                                        }}>
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 10,
                                            fontSize: 11.5,
                                            fontWeight: 750,
                                            color: 'var(--cms-text-muted)'
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                              <BarChart3 size={13} color="var(--cms-accent, #6366f1)" />
                                              <span>Frekuensi Halaman yang Dikunjungi</span>
                                            </div>
                                            <span style={{ fontSize: 10.5, opacity: 0.7 }}>{pageFrequency.length} Halaman</span>
                                          </div>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                                            {pageFrequency.map((item) => (
                                              <div
                                                key={item.path}
                                                style={{
                                                  padding: '7px 10px',
                                                  borderRadius: 8,
                                                  background: 'rgba(255, 255, 255, 0.03)',
                                                  border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.04))',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  gap: 4
                                                }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                  <a
                                                    href={item.path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                      fontFamily: 'monospace',
                                                      fontWeight: 650,
                                                      fontSize: 11.5,
                                                      color: 'var(--cms-text, #0f172a)',
                                                      textDecoration: 'none',
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: 4,
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap'
                                                    }}
                                                  >
                                                    <span>{item.path}</span>
                                                    <ExternalLink size={10} style={{ opacity: 0.4 }} />
                                                  </a>
                                                  <span style={{
                                                    fontSize: 10.5,
                                                    fontWeight: 750,
                                                    color: 'var(--cms-accent, #6366f1)',
                                                    background: 'rgba(99, 102, 241, 0.08)',
                                                    padding: '1px 6px',
                                                    borderRadius: 4,
                                                    flexShrink: 0
                                                  }}>
                                                    {item.count}x ({item.percent}%)
                                                  </span>
                                                </div>
                                                {/* Mini progress bar */}
                                                <div style={{
                                                  width: '100%',
                                                  height: 3,
                                                  background: 'rgba(255, 255, 255, 0.08)',
                                                  borderRadius: 2,
                                                  overflow: 'hidden'
                                                }}>
                                                  <div style={{
                                                    width: `${item.percent}%`,
                                                    height: '100%',
                                                    background: 'var(--cms-accent, #6366f1)',
                                                    borderRadius: 2
                                                  }} />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* KOLOM 2: Kronologi Timeline Sesi (Minimalis & Indah) */}
                                        <div style={{
                                          background: 'rgba(255, 255, 255, 0.02)',
                                          border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.05))',
                                          borderRadius: 10,
                                          padding: '12px 14px'
                                        }}>
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 10,
                                            fontSize: 11.5,
                                            fontWeight: 750,
                                            color: 'var(--cms-text-muted)'
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                              <Clock size={13} color="var(--cms-accent, #6366f1)" />
                                              <span>Kronologi Alur Akses (Terbaru ke Awal)</span>
                                            </div>
                                            <span style={{ fontSize: 10.5, opacity: 0.7 }}>{sess.hits.length} Akses</span>
                                          </div>

                                          <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0,
                                            maxHeight: 280,
                                            overflowY: 'auto',
                                            paddingRight: 4
                                          }}>
                                            {sess.hits.map((hit, hIdx) => {
                                              const hitTime = new Date(hit.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');
                                              const isLatest = hIdx === 0;
                                              const isFirst = hIdx === sess.hits.length - 1;

                                              return (
                                                <div
                                                  key={hit.id || hIdx}
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    fontSize: 11.5,
                                                    padding: '5px 8px',
                                                    borderRadius: 6,
                                                    position: 'relative',
                                                    transition: 'background 0.12s ease'
                                                  }}
                                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                  {/* Titik Status Timeline */}
                                                  <div style={{
                                                    width: 7,
                                                    height: 7,
                                                    borderRadius: '50%',
                                                    background: isLatest ? '#f43f5e' : isFirst ? '#10b981' : 'var(--cms-text-muted)',
                                                    opacity: isLatest || isFirst ? 1 : 0.45,
                                                    flexShrink: 0
                                                  }} />

                                                  {/* Jam Monospace Netral */}
                                                  <span style={{
                                                    fontFamily: 'monospace',
                                                    fontWeight: 650,
                                                    color: 'var(--cms-text-muted)',
                                                    fontSize: 11,
                                                    minWidth: 58
                                                  }}>
                                                    {hitTime}
                                                  </span>

                                                  {/* Tautan Halaman */}
                                                  <a
                                                    href={hit.path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                      color: 'var(--cms-text, #0f172a)',
                                                      textDecoration: 'none',
                                                      fontWeight: 600,
                                                      fontFamily: 'monospace',
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: 4,
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap'
                                                    }}
                                                  >
                                                    <span>{hit.path}</span>
                                                    <ExternalLink size={9.5} style={{ opacity: 0.35 }} />
                                                  </a>

                                                  {/* Badge Awal / Terakhir */}
                                                  {isLatest && sess.hits.length > 1 && (
                                                    <span style={{
                                                      fontSize: 9,
                                                      color: '#f43f5e',
                                                      fontWeight: 750,
                                                      background: 'rgba(244, 63, 94, 0.1)',
                                                      padding: '1px 5px',
                                                      borderRadius: 3,
                                                      marginLeft: 'auto'
                                                    }}>
                                                      terkini
                                                    </span>
                                                  )}
                                                  {isFirst && sess.hits.length > 1 && (
                                                    <span style={{
                                                      fontSize: 9,
                                                      color: '#10b981',
                                                      fontWeight: 750,
                                                      background: 'rgba(16, 185, 129, 0.1)',
                                                      padding: '1px 5px',
                                                      borderRadius: 3,
                                                      marginLeft: 'auto'
                                                    }}>
                                                      awal
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    ))
                  ) : (
                    /* ══════════════════════════════════════════════
                       MODE 2: SEMUA LOG MENTAH (RAW HITS)
                       ══════════════════════════════════════════════ */
                    filteredVisitors.map((vis) => (
                      <tr 
                        key={vis.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Waktu */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--cms-text, #fff)' }}>
                            {vis.dateString}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>
                            {vis.referrer}
                          </div>
                        </td>

                        {/* IP Geolocation */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: 'var(--cms-accent, #818cf8)',
                              background: 'rgba(99, 102, 241, 0.12)',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                              padding: '3px 9px',
                              borderRadius: 999,
                              fontSize: 11.5
                            }}>
                              {vis.ip}
                            </span>
                            <button
                              onClick={() => handleCopy(vis.ip, vis.id)}
                              title="Salin IP"
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.06)',
                                border: 'none',
                                color: copiedId === vis.id ? '#10b981' : 'var(--cms-text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {copiedId === vis.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            <a
                              href={`https://ipwho.is/${encodeURIComponent(vis.ip)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Cek Geolocation Akurat (ipwho.is)"
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'var(--cms-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cms-text-muted)')}
                            >
                              <Compass size={12} />
                            </a>
                          </div>
                        </td>

                        {/* Lokasi Asal & ISP */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: 'var(--cms-text, #fff)' }}>
                            <MapPin size={13} color="#f43f5e" />
                            <span>{vis.city}{vis.region ? `, ${vis.region}` : ''}, {vis.country}</span>
                          </div>
                          {vis.isp && (
                            <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 2, paddingLeft: 18 }}>
                              ISP: {vis.isp}
                            </div>
                          )}
                        </td>

                        {/* Perangkat & OS */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {vis.device === 'Mobile' ? (
                              <Smartphone size={14} color="#38bdf8" />
                            ) : vis.device === 'Tablet' ? (
                              <Tablet size={14} color="#c084fc" />
                            ) : (
                              <Laptop size={14} color="#818cf8" />
                            )}
                            <div>
                              <div style={{ fontWeight: 650, color: 'var(--cms-text)' }}>
                                {vis.browser}
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>
                                {vis.os}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Halaman Tujuan */}
                        <td style={{ padding: '11px 16px' }}>
                          <a
                            href={vis.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              color: 'var(--cms-text, #fff)',
                              textDecoration: 'none',
                              fontWeight: 650,
                              maxWidth: 220,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <span>{vis.path}</span>
                            <ExternalLink size={11} color="var(--cms-text-muted)" />
                          </a>
                        </td>

                        {/* Pengunjung */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: vis.userRole === 'Admin' ? 'rgba(99, 102, 241, 0.15)' : vis.userRole === 'Klien' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: vis.userRole === 'Admin' ? '#818cf8' : vis.userRole === 'Klien' ? '#10b981' : 'var(--cms-text-muted)'
                          }}>
                            {vis.userRole}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR INSIGHTS (KANAN): Populer & Wilayah ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Card Populer */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--cms-card-bg, #13141f)',
            border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 14,
            padding: 12,
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexShrink: 0 }}>
              <Globe size={14} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text, #fff)' }}>
                Populer
              </h3>
            </div>
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingRight: 4,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}>
              {topPages.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 7,
                  background: 'rgba(255, 255, 255, 0.03)',
                  fontSize: 11
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--cms-text, #fff)', fontFamily: 'monospace', maxWidth: 165, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.path}
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--cms-accent, #818cf8)', flexShrink: 0, marginLeft: 6 }}>
                    {item.count} hits
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card Wilayah */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--cms-card-bg, #13141f)',
            border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 14,
            padding: 12,
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexShrink: 0 }}>
              <MapPin size={14} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text, #fff)' }}>
                Wilayah
              </h3>
            </div>
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingRight: 4,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}>
              {topLocations.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 7,
                  background: 'rgba(255, 255, 255, 0.03)',
                  fontSize: 11
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--cms-text, #fff)', maxWidth: 165, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <MapPin size={10} style={{ color: 'var(--cms-accent, #6366f1)', opacity: 0.8 }} />
                    <span>{item.loc}</span>
                  </span>
                  <span style={{ fontWeight: 800, color: '#10b981', flexShrink: 0, marginLeft: 6 }}>
                    {item.count} hits
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: AUDIT LOGIN & KEAMANAN
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'logins' && (
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflow: 'hidden'
        }}>
          {/* Search & Rounded Dropdown Toolbar */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'var(--cms-card-bg, #13141f)',
            border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 999,
            padding: '6px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
              <Search size={14} color="var(--cms-text-muted)" />
              <input
                type="text"
                placeholder="Cari..."
                value={loginSearch}
                onChange={(e) => setLoginSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--cms-text, #fff)',
                  fontSize: 12,
                  width: '100%'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RoundedPillDropdown
                value={loginStatusFilter}
                onChange={setLoginStatusFilter}
                options={[
                  { value: 'all', label: 'Status' },
                  { value: 'success', label: 'Sukses', icon: <CheckCircle2 size={13} color="#10b981" /> },
                  { value: 'failed', label: 'Gagal', icon: <AlertTriangle size={13} color="#f43f5e" /> }
                ]}
              />
            </div>
          </div>

          {/* Login Audit Table */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--cms-card-bg, #13141f)',
            border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 16,
            overflow: 'hidden'
          }}>
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: 'var(--cms-card-bg, #13141f)'
                }}>
                  <tr style={{
                    background: 'var(--cms-table-header-bg, rgba(255, 255, 255, 0.04))',
                    borderBottom: '1px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
                    color: 'var(--cms-text-muted, #94a3b8)',
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 800
                  }}>
                    <th style={{ padding: '10px 14px' }}>Waktu</th>
                    <th style={{ padding: '10px 14px' }}>Pengguna</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px' }}>Lokasi & IP</th>
                    <th style={{ padding: '10px 14px' }}>Perangkat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogins.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'var(--cms-text-muted)' }}>
                        Tidak ada riwayat login.
                      </td>
                    </tr>
                  ) : (
                    filteredLogins.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: item.status === 'failed' ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                        }}
                      >
                        {/* Waktu */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--cms-text, #fff)' }}>
                            {item.dateString}
                          </div>
                        </td>

                        {/* Pengguna & Role */}
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--cms-text)' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', fontFamily: 'monospace' }}>
                            {item.email}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            marginTop: 3,
                            fontSize: 10,
                            fontWeight: 750,
                            padding: '1px 6px',
                            borderRadius: 999,
                            background: item.role === 'Super Admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                            color: item.role === 'Super Admin' ? '#c084fc' : '#818cf8'
                          }}>
                            {item.role}
                          </span>
                        </td>

                        {/* Status & Metode */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {item.status === 'success' ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 800,
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981'
                              }}>
                                <CheckCircle2 size={12} /> Sukses
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 800,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444'
                              }}>
                                <ShieldAlert size={12} /> Gagal
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                              ({item.method})
                            </span>
                          </div>
                          {item.reason && (
                            <div style={{ fontSize: 10.5, color: '#ef4444', marginTop: 3 }}>
                              {item.reason}
                            </div>
                          )}
                        </td>

                        {/* IP & Lokasi Asal Geolocation */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: 'var(--cms-text, #fff)',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11.5
                            }}>
                              {item.ip}
                            </span>
                            <button
                              onClick={() => handleCopy(item.ip, item.id)}
                              title="Salin IP"
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'transparent',
                                border: 'none',
                                color: copiedId === item.id ? '#10b981' : 'var(--cms-text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            <a
                              href={`https://ipwho.is/${encodeURIComponent(item.ip)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Cek Geolocation Akurat (ipwho.is)"
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'transparent',
                                color: 'var(--cms-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cms-text-muted)')}
                            >
                              <Compass size={12} />
                            </a>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={11} style={{ opacity: 0.7 }} />
                            <span>{item.city}{item.region ? `, ${item.region}` : ''}, {item.country}</span>
                          </div>
                          {item.isp && (
                            <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', opacity: 0.8, marginTop: 1 }}>
                              ISP: {item.isp}
                            </div>
                          )}
                        </td>

                        {/* Perangkat & OS */}
                        <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 650, color: 'var(--cms-text)' }}>
                            {item.browser}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>
                            {item.os} • {item.device}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: MESIN PENGOPTIMAL KONTEN & SEO (1-2 WORDS, ICON ONLY ACTIONS)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'content_optimizer' && (
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflow: 'hidden'
        }}>
          {/* Filter Toolbar (Rounded Pill Style) */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'var(--cms-card-bg, #13141f)',
            border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
            borderRadius: 999,
            padding: '8px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
              <Search size={15} color="var(--cms-text-muted)" />
              <input
                type="text"
                placeholder="Cari postingan, portofolio, atau draf..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--cms-text, #fff)',
                  fontSize: 12.5,
                  width: '100%'
                }}
              />
            </div>

            {/* Rounded Custom Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <RoundedPillDropdown
                value={contentTypeFilter}
                onChange={setContentTypeFilter}
                options={[
                  { value: 'all', label: 'Semua Tipe' },
                  { value: 'blog', label: 'Artikel', icon: <FileText size={13} /> },
                  { value: 'portfolio', label: 'Karya', icon: <FolderKanban size={13} /> },
                  { value: 'catalog', label: 'Katalog', icon: <ShoppingBag size={13} /> },
                  { value: 'note', label: 'Catatan', icon: <StickyNote size={13} /> }
                ]}
              />

              <RoundedPillDropdown
                value={contentScoreFilter}
                onChange={setContentScoreFilter}
                options={[
                  { value: 'all', label: 'Semua Skor' },
                  { value: 'optimal', label: 'Optimal (≥85)', icon: <CheckCircle2 size={13} color="#10b981" /> },
                  { value: 'needs_fix', label: 'Perbaikan (50-84)', icon: <AlertTriangle size={13} color="#f59e0b" /> },
                  { value: 'critical', label: 'Kritis (<50)', icon: <AlertCircle size={13} color="#f43f5e" /> }
                ]}
              />
            </div>
          </div>

          {/* Content Audit Cards List */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingRight: 4,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            {filteredContentAudits.length === 0 ? (
              <div style={{
                background: 'var(--cms-card-bg, #13141f)',
                border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
                borderRadius: 18,
                padding: 36,
                textAlign: 'center',
                color: 'var(--cms-text-muted)'
              }}>
                Tidak ada konten yang sesuai filter.
              </div>
            ) : (
              filteredContentAudits.map((item) => {
                const isExpanded = expandedContentId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--cms-card-bg, #13141f)',
                      border: `1.5px solid ${item.score < 60 ? 'rgba(239, 68, 68, 0.3)' : 'var(--cms-border, rgba(255, 255, 255, 0.08))'}`,
                      borderRadius: 18,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Top Row: Meta & Score */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 240 }}>
                        {/* Thumbnail or Icon */}
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.1))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : item.type === 'blog' ? (
                            <FileText size={20} color="#818cf8" />
                          ) : item.type === 'portfolio' ? (
                            <Layers size={20} color="#38bdf8" />
                          ) : item.type === 'catalog' ? (
                            <ShoppingBag size={20} color="#34d399" />
                          ) : (
                            <StickyNote size={20} color="#fbbf24" />
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: 999,
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--cms-text-muted)'
                            }}>
                              {item.typeLabel}
                            </span>
                            <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                              • {item.wordCount} Kata • {item.estimatedReadTimeMinutes} mnt
                            </span>
                          </div>
                          <h4 style={{ margin: '3px 0 0', fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text, #fff)' }}>
                            {item.title}
                          </h4>
                        </div>
                      </div>

                      {/* Right: Score Pill & Action Buttons (Short labels & Icon-centric) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Score Indicator */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          borderRadius: 999,
                          background: `${item.gradeColor}18`,
                          border: `1px solid ${item.gradeColor}40`
                        }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: item.gradeColor }}>
                            {item.score}
                          </span>
                          <span style={{ fontSize: 10.5, fontWeight: 750, color: item.gradeColor }}>{item.grade}</span>
                        </div>

                        {/* Open in Editor Button (Short: "Edit") */}
                        <button
                          onClick={() => {
                            if (onSwitchPage) {
                              const pageKey = item.type === 'blog' ? 'blog' 
                                : item.type === 'portfolio' ? 'portfolio' 
                                : item.type === 'catalog' ? 'catalog' 
                                : 'notes';
                              onSwitchPage(pageKey);
                            }
                          }}
                          title="Buka di editor"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 999,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.12))',
                            color: 'var(--cms-text, #fff)',
                            fontSize: 11.5,
                            fontWeight: 750,
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>

                        {/* Expand/Collapse Diagnostics Checklist (Circular Icon Only) */}
                        <button
                          onClick={() => setExpandedContentId(isExpanded ? null : item.id)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
                            color: 'var(--cms-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title={isExpanded ? 'Tutup' : 'Rincian'}
                        >
                          <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Diagnostic Checklist */}
                    {isExpanded && (
                      <div style={{
                        marginTop: 4,
                        paddingTop: 12,
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Diagnostik ({item.passedCount}/{item.totalChecks} Lulus):
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: 8
                        }}>
                          {item.checks.map((chk) => (
                            <div
                              key={chk.id}
                              style={{
                                padding: '9px 12px',
                                borderRadius: 12,
                                background: chk.passed ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                                border: `1px solid ${chk.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: chk.passed ? '#10b981' : '#ef4444' }}>
                                  {chk.passed ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                                  <span>{chk.label}</span>
                                </div>
                                <span style={{ fontSize: 10.5, fontWeight: 800, color: chk.passed ? '#10b981' : 'var(--cms-text-muted)' }}>
                                  +{chk.passed ? chk.scoreWeight : 0} pt
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--cms-text-muted)', lineHeight: 1.4 }}>
                                {chk.tip}
                              </p>
                              {!chk.passed && ['meta_description', 'catalog_desc', 'summary', 'tags_presence', 'catalog_tags', 'title_length', 'headings_structure', 'note_todos'].includes(chk.id) && (
                                <button
                                  type="button"
                                  disabled={fixingCheckKey === `${item.id}_${chk.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAutoFix(item, chk.id);
                                  }}
                                  style={{
                                    marginTop: 4,
                                    alignSelf: 'flex-start',
                                    padding: '3px 9px',
                                    borderRadius: 9999,
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                    color: '#38bdf8',
                                    fontSize: 10,
                                    fontWeight: 750,
                                    cursor: fixingCheckKey === `${item.id}_${chk.id}` ? 'wait' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    transition: 'all 0.18s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'}
                                >
                                  <Sparkles size={11} />
                                  <span>{fixingCheckKey === `${item.id}_${chk.id}` ? 'Memperbaiki...' : 'Perbaiki Otomatis'}</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioIntelligenceAnalytics;
