import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Mail, Bell, Plus, ArrowUpRight, Video, Pause, Play, 
  Square, Check, Clock, Calendar, Users, X, Upload, ExternalLink, 
  Layers, ChevronDown, ChevronUp, Sparkles, Filter, CheckCircle2,
  TrendingUp, Database, LayoutGrid, BookOpen, ShoppingBag, Globe2,
  DollarSign, StickyNote, Link2, Megaphone, MessageSquareMore,
  Compass, Building2, FolderKanban, ShieldCheck, ChevronLeft, ChevronRight,
  Flame, Award, Heart, Gift, Moon, Sun, Briefcase, Activity, Rocket,
  FileText, Layout, BarChart3, CornerDownLeft
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { storage } from '../../utils/storage';
import { subscribeToNotifications } from '../../utils/notifications';

interface FlatSolidDashboardProps {
  projects?: any[];
  stats?: any;
  kpiList?: any[];
  chartData?: Array<{ day: string; revenue: number }>;
  monthlyRevenue?: number;
  monthlyGoals?: any;
  blogStats?: any;
  catalogStats?: any;
  liveGames?: any[];
  pagesData?: any;
  canvases?: any[];
  blogPosts?: any[];
  catalogProducts?: any[];
  globalSettings?: any;
  syncMode?: string;
  onSwitchPage?: (page: string) => void;
  onBackupJson?: () => void;
  userData?: any;
  businessProfile?: any;
  isMobile?: boolean;
  isTablet?: boolean;
  onOpenGadgetStation?: () => void;
  showGadgetStationToggle?: boolean;
}

// ── DAFTAR HARI BESAR & EVENT KALENDER INDONESIA ──
interface NationalHoliday {
  month: number;
  date: number;
  name: string;
  greeting: string;
  theme: string;
}

const FIXED_NATIONAL_HOLIDAYS: NationalHoliday[] = [
  { month: 1, date: 1, name: 'Tahun Baru Masehi', greeting: 'Selamat Tahun Baru', theme: '#f59e0b' },
  { month: 2, date: 14, name: 'Hari Kasih Sayang', greeting: 'Hari Kasih Sayang', theme: '#ec4899' },
  { month: 4, date: 21, name: 'Hari Kartini', greeting: 'Selamat Hari Kartini', theme: '#a855f7' },
  { month: 5, date: 1, name: 'Hari Buruh', greeting: 'Selamat Hari Buruh', theme: '#f97316' },
  { month: 5, date: 2, name: 'Hari Pendidikan', greeting: 'Selamat Hari Pendidikan', theme: '#3b82f6' },
  { month: 6, date: 1, name: 'Hari Lahir Pancasila', greeting: 'Hari Lahir Pancasila', theme: '#ef4444' },
  { month: 8, date: 17, name: 'Kemerdekaan RI', greeting: 'Dirgahayu Republik Indonesia', theme: '#ef4444' },
  { month: 10, date: 1, name: 'Kesaktian Pancasila', greeting: 'Hari Kesaktian Pancasila', theme: '#f59e0b' },
  { month: 10, date: 28, name: 'Sumpah Pemuda', greeting: 'Hari Sumpah Pemuda', theme: '#f59e0b' },
  { month: 11, date: 10, name: 'Hari Pahlawan', greeting: 'Selamat Hari Pahlawan', theme: '#b91c1c' },
  { month: 12, date: 25, name: 'Hari Raya Natal', greeting: 'Selamat Hari Natal', theme: '#059669' }
];

const VARIABLE_HOLIDAYS_BY_YEAR: Record<number, NationalHoliday[]> = {
  2024: [
    { month: 2, date: 8, name: 'Isra Mi\'raj', greeting: 'Selamat Isra Mi\'raj', theme: '#10b981' },
    { month: 2, date: 10, name: 'Tahun Baru Imlek', greeting: 'Selamat Hari Imlek', theme: '#ef4444' },
    { month: 3, date: 11, name: 'Hari Suci Nyepi', greeting: 'Selamat Hari Nyepi', theme: '#8b5cf6' },
    { month: 4, date: 10, name: 'Hari Raya Idul Fitri', greeting: 'Selamat Idul Fitri', theme: '#10b981' },
    { month: 5, date: 23, name: 'Hari Raya Waisak', greeting: 'Selamat Hari Waisak', theme: '#f59e0b' },
    { month: 6, date: 17, name: 'Hari Raya Idul Adha', greeting: 'Selamat Idul Adha', theme: '#10b981' },
    { month: 9, date: 16, name: 'Maulid Nabi', greeting: 'Maulid Nabi Muhammad', theme: '#10b981' }
  ],
  2025: [
    { month: 1, date: 27, name: 'Isra Mi\'raj', greeting: 'Selamat Isra Mi\'raj', theme: '#10b981' },
    { month: 1, date: 29, name: 'Tahun Baru Imlek', greeting: 'Selamat Hari Imlek', theme: '#ef4444' },
    { month: 3, date: 31, name: 'Hari Raya Idul Fitri', greeting: 'Selamat Idul Fitri', theme: '#10b981' },
    { month: 5, date: 12, name: 'Hari Raya Waisak', greeting: 'Selamat Hari Waisak', theme: '#f59e0b' },
    { month: 6, date: 7, name: 'Hari Raya Idul Adha', greeting: 'Selamat Idul Adha', theme: '#10b981' },
    { month: 9, date: 5, name: 'Maulid Nabi', greeting: 'Maulid Nabi Muhammad', theme: '#10b981' }
  ],
  2026: [
    { month: 1, date: 16, name: 'Isra Mi\'raj', greeting: 'Selamat Isra Mi\'raj', theme: '#10b981' },
    { month: 2, date: 17, name: 'Tahun Baru Imlek', greeting: 'Selamat Hari Imlek', theme: '#ef4444' },
    { month: 3, date: 19, name: 'Hari Suci Nyepi', greeting: 'Selamat Hari Nyepi', theme: '#8b5cf6' },
    { month: 3, date: 20, name: 'Hari Raya Idul Fitri', greeting: 'Selamat Idul Fitri', theme: '#10b981' },
    { month: 5, date: 27, name: 'Hari Raya Idul Adha', greeting: 'Selamat Idul Adha', theme: '#10b981' },
    { month: 5, date: 31, name: 'Hari Raya Waisak', greeting: 'Selamat Hari Waisak', theme: '#f59e0b' },
    { month: 8, date: 25, name: 'Maulid Nabi', greeting: 'Maulid Nabi Muhammad', theme: '#10b981' }
  ],
  2027: [
    { month: 1, date: 5, name: 'Isra Mi\'raj', greeting: 'Selamat Isra Mi\'raj', theme: '#10b981' },
    { month: 2, date: 6, name: 'Tahun Baru Imlek', greeting: 'Selamat Hari Imlek', theme: '#ef4444' },
    { month: 3, date: 8, name: 'Hari Suci Nyepi', greeting: 'Selamat Hari Nyepi', theme: '#8b5cf6' },
    { month: 3, date: 10, name: 'Hari Raya Idul Fitri', greeting: 'Selamat Idul Fitri', theme: '#10b981' },
    { month: 5, date: 6, name: 'Kenaikan Isa Almasih', greeting: 'Kenaikan Isa Almasih', theme: '#3b82f6' },
    { month: 5, date: 16, name: 'Hari Raya Idul Adha', greeting: 'Selamat Idul Adha', theme: '#10b981' }
  ]
};

const getIndonesianHoliday = (year: number, month: number, date: number): NationalHoliday | null => {
  const fixed = FIXED_NATIONAL_HOLIDAYS.find(h => h.month === month && h.date === date);
  if (fixed) return fixed;
  const variableList = VARIABLE_HOLIDAYS_BY_YEAR[year] || [];
  return variableList.find(h => h.month === month && h.date === date) || null;
};

// ── SEARCH ENGINES DENGAN BRAND SVG ICONS ──
const IconStudio = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#144e3b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><circle cx="12" cy="13" r="2"/></svg>
);
const IconGoogle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
);
const IconDribbble = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EA4C89" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94"/><path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32"/><path d="M8.56 2.75c4.37 6 6 9.42 8 17.72"/></svg>
);
const IconBehance = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#0057FF"><path d="M22 7h-7v2h7V7zm1.726 10c-.442 1.297-2.029 3-5.171 3-3.455 0-5.555-2.261-5.555-5.617 0-3.327 2.05-5.383 5.385-5.383 3.323 0 5.17 2.052 5.17 5.485 0 .399-.047.818-.073 1.015h-7.625c.088 1.503.953 2.5 2.658 2.5 1.258 0 2.094-.572 2.457-1.5h2.754zm-7.925-3.5h4.868c-.062-1.258-.871-2-2.338-2-1.442 0-2.348.74-2.53 2zm-8.801-6.5h-7v14h6.815c3.551 0 5.185-1.579 5.185-4.148 0-1.748-.962-2.924-2.285-3.355 1.096-.532 1.77-1.575 1.77-2.969 0-2.348-1.536-3.528-4.485-3.528zm-4 2.5h3.047c1.328 0 1.953.518 1.953 1.5 0 1.018-.672 1.5-2.047 1.5h-2.953v-3zm0 5.5h3.407c1.47 0 2.093.593 2.093 1.704 0 1.14-.737 1.796-2.207 1.796h-3.293v-3.5z"/></svg>
);
const IconPinterest = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#E60023"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.365-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
);
const IconUnsplash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#111827"><path d="M7.5 6.75V0h9v6.75h-9zm9 3.75H24V24H0V10.5h7.5v6.75h9V10.5z"/></svg>
);
const IconGithub = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#24292e"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
);

interface SearchEngine {
  id: string;
  name: string;
  tag: string;
  color: string;
  placeholder: string;
  url: (q: string) => string;
  icon: React.ReactNode;
}

const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'task', name: 'File & Studio', tag: 'Studio', color: '#144e3b', placeholder: 'Cari file, halaman, proyek, atau modul studio...', url: () => '', icon: <IconStudio /> },
  { id: 'google', name: 'Google', tag: 'Google', color: '#4285F4', placeholder: 'Cari inspirasi & referensi di Google...', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`, icon: <IconGoogle /> },
  { id: 'dribbble', name: 'Dribbble', tag: 'Dribbble', color: '#EA4C89', placeholder: 'Cari shots desain di Dribbble...', url: (q) => `https://dribbble.com/search/${encodeURIComponent(q)}`, icon: <IconDribbble /> },
  { id: 'behance', name: 'Behance', tag: 'Behance', color: '#0057FF', placeholder: 'Cari proyek kreatif di Behance...', url: (q) => `https://www.behance.net/search/projects?search=${encodeURIComponent(q)}`, icon: <IconBehance /> },
  { id: 'pinterest', name: 'Pinterest', tag: 'Pinterest', color: '#E60023', placeholder: 'Cari ide visual di Pinterest...', url: (q) => `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`, icon: <IconPinterest /> },
  { id: 'unsplash', name: 'Unsplash', tag: 'Unsplash', color: '#111827', placeholder: 'Cari foto HD di Unsplash...', url: (q) => `https://unsplash.com/s/photos/${encodeURIComponent(q)}`, icon: <IconUnsplash /> },
  { id: 'github', name: 'GitHub', tag: 'GitHub', color: '#24292e', placeholder: 'Cari repository kode di GitHub...', url: (q) => `https://github.com/search?q=${encodeURIComponent(q)}`, icon: <IconGithub /> }
];

// ── 12 MODUL STUDIO EKOSISTEM ──
interface StudioModule {
  id: string;
  name: string;
  category: 'web' | 'design' | 'business' | 'system';
  categoryLabel: string;
  desc: string;
  icon: any;
  color: string;
  page: string;
}

const STUDIO_MODULES: StudioModule[] = [
  { id: 'web', name: 'Canvas', category: 'web', categoryLabel: 'Editor', desc: 'Desain web & landing page santai', icon: Globe2, color: '#7c3aed', page: 'visual-editor' },
  { id: 'db', name: 'Vault', category: 'system', categoryLabel: 'Stash', desc: 'Arsip karya & media studio', icon: Database, color: '#0284c7', page: 'database' },
  { id: 'apps', name: 'Apps', category: 'web', categoryLabel: 'Apps', desc: 'Modul cerah & aplikasi seru', icon: LayoutGrid, color: '#8b5cf6', page: 'apps' },
  { id: 'projects', name: 'Works', category: 'design', categoryLabel: 'Flow', desc: 'Alur proyek & kreasi klien', icon: FolderKanban, color: '#3b82f6', page: 'projects' },
  { id: 'finance', name: 'Finance', category: 'business', categoryLabel: 'Cash', desc: 'Billing & transaksi bahagia', icon: DollarSign, color: '#10b981', page: 'transactions' },
  { id: 'notes', name: 'Notes', category: 'design', categoryLabel: 'Ideas', desc: 'Ide segar, brief & coretan cepat', icon: StickyNote, color: '#f59e0b', page: 'notes' },
  { id: 'links', name: 'Links', category: 'web', categoryLabel: 'Bio', desc: 'Micro-site bio link santai', icon: Link2, color: '#06b6d4', page: 'links' },
  { id: 'broadcast', name: 'Waves', category: 'business', categoryLabel: 'Waves', desc: 'Kirim kabar hangat ke sumr.day club', icon: Megaphone, color: '#f43f5e', page: 'broadcast' },
  { id: 'chat', name: 'Inbox', category: 'business', categoryLabel: 'Talk', desc: 'Obrolan santai bersama member', icon: MessageSquareMore, color: '#14b8a6', page: 'chat' },
  { id: 'guideline', name: 'Guide', category: 'system', categoryLabel: 'Help', desc: 'Peta fitur & tips cerah', icon: Compass, color: '#a855f7', page: 'guideline' },
  { id: 'catalog', name: 'Drops', category: 'business', categoryLabel: 'Drops', desc: 'Katalog karya & rilisan estetik', icon: ShoppingBag, color: '#ec4899', page: 'catalog' },
  { id: 'settings', name: 'Settings', category: 'system', categoryLabel: 'Setup', desc: 'Konfigurasi studio & profil hangat', icon: Building2, color: '#64748b', page: 'settings' }
];

const MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const FlatSolidDashboard: React.FC<FlatSolidDashboardProps> = ({
  projects = [],
  stats,
  kpiList = [],
  chartData = [],
  monthlyRevenue = 0,
  monthlyGoals,
  blogStats,
  catalogStats,
  liveGames = [],
  pagesData,
  canvases = [],
  blogPosts = [],
  catalogProducts = [],
  globalSettings,
  syncMode,
  onSwitchPage,
  onBackupJson,
  userData,
  businessProfile,
  isMobile: isMobileProp = false,
  isTablet: isTabletProp = false,
  onOpenGadgetStation,
  showGadgetStationToggle = true
}) => {
  // Live Current Clock & Accurate Wall-Clock Stopwatch
  const [liveClock, setLiveClock] = useState<string>('');
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('porto_dashboard_time_tracker');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.startTime) {
          const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
          return (parsed.accumulatedSeconds || 0) + Math.max(0, elapsed);
        }
        return parsed.accumulatedSeconds || 0;
      }
    } catch (e) {}
    return 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('porto_dashboard_time_tracker');
      if (saved) {
        return !!JSON.parse(saved).isRunning;
      }
    } catch (e) {}
    return false;
  });

  const timerStateRef = useRef<{
    startTime: number | null;
    accumulatedSeconds: number;
    isRunning: boolean;
  }>({
    startTime: null,
    accumulatedSeconds: 0,
    isRunning: false
  });

  // Hydrate timer ref on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('porto_dashboard_time_tracker');
      if (saved) {
        const parsed = JSON.parse(saved);
        timerStateRef.current = {
          startTime: parsed.startTime || null,
          accumulatedSeconds: parsed.accumulatedSeconds || 0,
          isRunning: !!parsed.isRunning
        };
      }
    } catch (e) {}
  }, []);

  // Dynamic Responsive Viewport Listeners
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = isMobileProp || windowWidth <= 768;
  const isTablet = isTabletProp || (windowWidth > 768 && windowWidth <= 1280);
  const isCompactMobile = windowWidth <= 420;

  // Realtime unread notifications count for header bell
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  useEffect(() => {
    const unsub = subscribeToNotifications((notifs: any[]) => {
      if (Array.isArray(notifs)) {
        setUnreadNotifCount(notifs.filter(n => !n.read).length);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Search Engine & Live File Search Dropdown state
  const [selectedEngine, setSelectedEngine] = useState<string>('task');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Top KPI Card View Mode: 'executive' vs 'pipeline'
  const [kpiViewMode, setKpiViewMode] = useState<'executive' | 'pipeline'>('executive');

  // Interactive Monthly Calendar State
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [selectedCalDay, setSelectedCalDay] = useState<number>(new Date().getDate());

  // Module Category Filter Tab
  const [moduleCategoryTab, setModuleCategoryTab] = useState<'all' | 'web' | 'design' | 'business' | 'system'>('all');

  // Modals state
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('Desain');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ── 1. LIVE TIME & GREETING (TANPA EMOJI) ──
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const secs = now.getSeconds().toString().padStart(2, '0');
      setLiveClock(`${hrs}:${mins}:${secs} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 100% Accurate Wall-Clock Timer Stopwatch
  useEffect(() => {
    const saveState = () => {
      try {
        localStorage.setItem('porto_dashboard_time_tracker', JSON.stringify({
          startTime: timerStateRef.current.startTime,
          accumulatedSeconds: timerStateRef.current.accumulatedSeconds,
          isRunning: timerStateRef.current.isRunning
        }));
      } catch (e) {}
    };

    const syncClock = () => {
      if (timerStateRef.current.isRunning && timerStateRef.current.startTime) {
        const elapsed = Math.floor((Date.now() - timerStateRef.current.startTime) / 1000);
        setStopwatchSeconds(timerStateRef.current.accumulatedSeconds + Math.max(0, elapsed));
      }
    };

    let interval: any = null;
    if (isTimerRunning) {
      if (!timerStateRef.current.startTime) {
        timerStateRef.current.startTime = Date.now();
      }
      timerStateRef.current.isRunning = true;
      saveState();
      syncClock();
      interval = setInterval(syncClock, 500);
    } else {
      if (timerStateRef.current.isRunning && timerStateRef.current.startTime) {
        const elapsed = Math.floor((Date.now() - timerStateRef.current.startTime) / 1000);
        timerStateRef.current.accumulatedSeconds += Math.max(0, elapsed);
      }
      timerStateRef.current.startTime = null;
      timerStateRef.current.isRunning = false;
      saveState();
      setStopwatchSeconds(timerStateRef.current.accumulatedSeconds);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncClock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncClock);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncClock);
    };
  }, [isTimerRunning]);

  const handleResetTimer = () => {
    timerStateRef.current = {
      startTime: null,
      accumulatedSeconds: 0,
      isRunning: false
    };
    try {
      localStorage.removeItem('porto_dashboard_time_tracker');
    } catch (e) {}
    setIsTimerRunning(false);
    setStopwatchSeconds(0);
    showToast('Timer direset ke 00:00:00');
    haptic.medium();
  };

  const formatStopwatch = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sapaan waktu dinamis
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  // Hari libur nasional hari ini
  const todayDate = new Date();
  const todayHoliday = useMemo(() => {
    return getIndonesianHoliday(todayDate.getFullYear(), todayDate.getMonth() + 1, todayDate.getDate());
  }, [todayDate]);

  // Format tanggal Indonesia
  const todayFormatted = useMemo(() => {
    return todayDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [todayDate]);

  // ── 2. AKURATKAN NOMOR / ANGKA DATA RIIL ──
  const normalizeStatus = (s: any): 'done' | 'progress' | 'todo' => {
    if (!s || typeof s !== 'string') return 'todo';
    const norm = s.toLowerCase().replace(/[^a-z]/g, '');
    if (norm.includes('done') || norm.includes('complet') || norm.includes('selesai')) return 'done';
    if (norm.includes('progress') || norm.includes('ongoing') || norm.includes('run') || norm.includes('berjalan')) return 'progress';
    return 'todo';
  };

  const projectCounts = useMemo(() => {
    let done = 0;
    let progress = 0;
    let todo = 0;

    projects.forEach(p => {
      const st = normalizeStatus(p.status);
      if (st === 'done') done++;
      else if (st === 'progress') progress++;
      else todo++;
    });

    const total = projects.length;
    return { total, done, progress, todo };
  }, [projects]);

  // Real progress %
  const progressPercentage = useMemo(() => {
    if (projectCounts.total > 0) {
      return Math.round((projectCounts.done / projectCounts.total) * 100);
    }
    return 0;
  }, [projectCounts]);

  // Effective revenue
  const effectiveRevenueNumber = useMemo(() => {
    if (typeof monthlyRevenue === 'number' && monthlyRevenue > 0) return monthlyRevenue;
    if (stats?.monthlyRevenue) return Number(stats.monthlyRevenue);
    return 0;
  }, [monthlyRevenue, stats?.monthlyRevenue]);

  const formattedRevenue = useMemo(() => {
    return `Rp ${effectiveRevenueNumber.toLocaleString('id-ID')}`;
  }, [effectiveRevenueNumber]);

  // Target Omset Bulanan
  const revenueTargetPct = useMemo(() => {
    const goal = monthlyGoals?.revenue || 10000000;
    if (goal > 0 && effectiveRevenueNumber > 0) {
      return Math.min(100, Math.round((effectiveRevenueNumber / goal) * 100));
    }
    return 0;
  }, [effectiveRevenueNumber, monthlyGoals?.revenue]);

  // Real total data entities
  const totalDataEntities = useMemo(() => {
    const p = projects.length || 0;
    const pagesCount = (globalSettings?.customPages?.length || 0) + 3;
    let blocksCount = 0;
    if (pagesData && typeof pagesData === 'object') {
      Object.values(pagesData).forEach((arr: any) => { blocksCount += (arr || []).length; });
    }
    const b = blogStats?.total || blogPosts.length || 0;
    const c = catalogStats?.total || catalogProducts.length || 0;
    const g = liveGames?.length || 0;
    const total = p + pagesCount + blocksCount + b + c + g;
    return Math.max(total, p + 12);
  }, [projects.length, globalSettings?.customPages, pagesData, blogStats?.total, blogPosts.length, catalogStats?.total, catalogProducts.length, liveGames?.length]);

  // ── 3. SEARCH ENGINE & AKURAT MENGELUARKAN LIST FILE / DATA ──
  interface SearchResultItem {
    id: string;
    title: string;
    subtitle: string;
    type: 'file' | 'page' | 'project' | 'module' | 'blog' | 'product' | 'canvas';
    page: string;
    icon: any;
    badge: string;
  }

  // Master index of searchable files, pages, projects, modules, etc.
  const searchableIndex = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Core Pages & Files
    const corePages = [
      { id: 'page-home', title: 'Beranda (Home)', subtitle: 'Halaman Utama Website', page: 'visual-editor', badge: 'Halaman CMS' },
      { id: 'page-about', title: 'Tentang Studio (About)', subtitle: 'Profil & Tim Studio', page: 'visual-editor', badge: 'Halaman CMS' },
      { id: 'page-projects', title: 'Showcase Karya', subtitle: 'Galeri Karya Proyek', page: 'projects', badge: 'Halaman CMS' },
      { id: 'page-blog', title: 'Creative Spill', subtitle: 'Pusat Publikasi Blog & Insight', page: 'blog', badge: 'Halaman CMS' },
      { id: 'page-contact', title: 'Client Talk', subtitle: 'Formulir Kontak & Konsultasi', page: 'chat', badge: 'Halaman CMS' },
      { id: 'page-builder', title: 'Blok Kreatif', subtitle: 'Modular Block Page Builder', page: 'builder', badge: 'File Kanvas' }
    ];
    corePages.forEach(cp => {
      items.push({
        id: cp.id,
        title: cp.title,
        subtitle: cp.subtitle,
        type: 'page',
        page: cp.page,
        icon: FileText,
        badge: cp.badge
      });
    });

    // Custom Pages from globalSettings
    if (globalSettings?.customPages && Array.isArray(globalSettings.customPages)) {
      globalSettings.customPages.forEach((cp: any, idx: number) => {
        items.push({
          id: `custom-page-${idx}`,
          title: cp.title || cp.name || `Halaman Kustom ${idx + 1}`,
          subtitle: `/${cp.slug || 'custom'}`,
          type: 'page',
          page: 'visual-editor',
          icon: FileText,
          badge: 'Halaman Kustom'
        });
      });
    }

    // Blocks in pagesData
    if (pagesData && typeof pagesData === 'object') {
      Object.keys(pagesData).forEach(pageKey => {
        const blocks = pagesData[pageKey];
        if (Array.isArray(blocks)) {
          blocks.forEach((b: any, bIdx: number) => {
            if (b.type || b.title) {
              items.push({
                id: `block-${pageKey}-${bIdx}`,
                title: b.title || `Blok ${b.type || 'Konten'}`,
                subtitle: `Komponen pada Halaman ${pageKey}`,
                type: 'file',
                page: 'visual-editor',
                icon: Layout,
                badge: 'File Blok CMS'
              });
            }
          });
        }
      });
    }

    // 2. Real Projects
    projects.forEach((p, idx) => {
      items.push({
        id: p.id || `proj-${idx}`,
        title: p.title || 'Proyek Tanpa Judul',
        subtitle: `${p.category || 'Desain'} • Tenggat: ${p.deadline || 'Bebas'}`,
        type: 'project',
        page: 'projects',
        icon: FolderKanban,
        badge: 'Proyek'
      });
    });

    // 3. 12 Studio Modules
    STUDIO_MODULES.forEach(m => {
      items.push({
        id: `mod-${m.id}`,
        title: m.name,
        subtitle: m.desc,
        type: 'module',
        page: m.page,
        icon: m.icon,
        badge: 'Modul Studio'
      });
    });

    // 4. Blog Posts
    blogPosts.forEach((bp: any, idx: number) => {
      items.push({
        id: bp.id || `blog-${idx}`,
        title: bp.title || 'Artikel Blog',
        subtitle: `${bp.category || 'Wawasan'} • ${bp.views || 0} tayangan`,
        type: 'blog',
        page: 'blog',
        icon: BookOpen,
        badge: 'Artikel'
      });
    });

    // 5. Catalog Products
    catalogProducts.forEach((cp: any, idx: number) => {
      items.push({
        id: cp.id || `product-${idx}`,
        title: cp.name || cp.title || 'Produk Studio',
        subtitle: cp.price ? `Rp ${Number(cp.price).toLocaleString('id-ID')}` : 'Katalog Produk',
        type: 'product',
        page: 'catalog',
        icon: ShoppingBag,
        badge: 'Produk'
      });
    });

    // 6. Canvases
    canvases.forEach((cv: any, idx: number) => {
      items.push({
        id: cv.id || `canvas-${idx}`,
        title: cv.name || `Preset Kanvas ${idx + 1}`,
        subtitle: cv.category || 'Template Desain',
        type: 'canvas',
        page: 'builder',
        icon: Layers,
        badge: 'Preset Kanvas'
      });
    });

    return items;
  }, [projects, globalSettings?.customPages, pagesData, blogPosts, catalogProducts, canvases]);

  // Filtered search results based on user query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return searchableIndex.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.subtitle.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [searchQuery, searchableIndex]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── 4. INTERACTIVE MONTHLY CALENDAR GRID ──
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayRaw = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
    const firstDayIndex = (firstDayRaw + 6) % 7; // Monday-first: 0 = Sen, 6 = Min
    const today = new Date();
    const isCurrentMonthYear = today.getMonth() === calMonth && today.getFullYear() === calYear;
    const currentTodayDate = today.getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, isToday: false, holiday: null, projectDeadlines: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const holiday = getIndonesianHoliday(calYear, calMonth + 1, d);
      const isToday = isCurrentMonthYear && d === currentTodayDate;
      const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const projectDeadlines = projects.filter(p => p.deadline && p.deadline.startsWith(dStr));
      days.push({ day: d, isToday, holiday, projectDeadlines });
    }
    // Pad to complete 7-day rows (either 35 or 42 cells)
    const targetTotal = days.length <= 35 ? 35 : 42;
    while (days.length < targetTotal) {
      days.push({ day: 0, isToday: false, holiday: null, projectDeadlines: [] });
    }
    return days;
  }, [calYear, calMonth, projects]);

  // Keep selectedCalDay within valid range of current month
  useEffect(() => {
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    if (selectedCalDay > daysInCurrentMonth) {
      setSelectedCalDay(daysInCurrentMonth);
    }
  }, [calYear, calMonth, selectedCalDay]);

  const totalDeadlinesThisMonth = useMemo(() => {
    const ymPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    return projects.filter(p => p.deadline && p.deadline.startsWith(ymPrefix)).length;
  }, [projects, calYear, calMonth]);

  const selectedDayInfo = useMemo(() => {
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const safeDay = Math.min(Math.max(1, selectedCalDay), daysInCurrentMonth);
    const holiday = getIndonesianHoliday(calYear, calMonth + 1, safeDay);
    const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    const projectDeadlines = projects.filter(p => p.deadline && p.deadline.startsWith(dStr));
    return { holiday, projectDeadlines, safeDay };
  }, [calYear, calMonth, selectedCalDay, projects]);

  // Display projects list
  const displayProjectsList = useMemo(() => {
    const iconTypes = ['blue-stripes', 'teal-swirl', 'color-star', 'gold-sun', 'purple-nodes'] as const;
    if (projects.length > 0) {
      return projects.slice(0, 5).map((p, idx) => ({
        id: p.id || `real-${idx}`,
        title: p.title || 'Proyek Baru',
        dueDate: p.deadline || 'Tanpa Tenggat',
        category: p.category || 'Desain',
        status: normalizeStatus(p.status),
        iconType: iconTypes[idx % iconTypes.length]
      }));
    }
    return [
      { id: 'sample-1', title: 'Belum Ada Proyek', dueDate: 'Tenggat Bebas', category: 'Desain', status: 'todo' as const, iconType: 'color-star' as const }
    ];
  }, [projects]);

  // 7-day capsule bar analytics
  const weeklyAnalytics = useMemo(() => {
    const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    if (chartData && chartData.length === 7) {
      const maxVal = Math.max(...chartData.map(c => c.revenue), 1);
      return chartData.map((c, i) => {
        const heightPct = Math.max(25, Math.min(95, Math.round((c.revenue / maxVal) * 90)));
        return {
          day: c.day || dayLabels[i],
          height: heightPct,
          revenue: c.revenue,
          formatted: `Rp ${c.revenue.toLocaleString('id-ID')}`
        };
      });
    }
    return [
      { day: 'Sen', height: 40, revenue: 0, formatted: 'Rp 0' },
      { day: 'Sel', height: 60, revenue: 0, formatted: 'Rp 0' },
      { day: 'Rab', height: 45, revenue: 0, formatted: 'Rp 0' },
      { day: 'Kam', height: 85, revenue: 0, formatted: 'Rp 0' },
      { day: 'Jum', height: 55, revenue: 0, formatted: 'Rp 0' },
      { day: 'Sab', height: 40, revenue: 0, formatted: 'Rp 0' },
      { day: 'Min', height: 50, revenue: 0, formatted: 'Rp 0' }
    ];
  }, [chartData]);

  // Keyboard shortcut listener (⌘ F / Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const engine = SEARCH_ENGINES.find(eng => eng.id === selectedEngine);
    if (engine && engine.id !== 'task') {
      window.open(engine.url(searchQuery), '_blank');
      setSearchQuery('');
      setIsSearchFocused(false);
    } else if (searchResults.length > 0) {
      // Navigate to first matching item
      onSwitchPage?.(searchResults[0].page);
      setSearchQuery('');
      setIsSearchFocused(false);
      haptic.light();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setShowNotificationToast(true);
    haptic.light();
    setTimeout(() => setShowNotificationToast(false), 3000);
  };

  // Real Add Project handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    try {
      const existing = await storage.getItem('porto_projects', []);
      const newProj = {
        id: `proj_${Date.now()}`,
        title: newProjectTitle.trim(),
        category: newProjectCategory || 'Desain',
        deadline: newProjectDeadline || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'todo',
        progress: 0,
        createdAt: new Date().toISOString()
      };

      const updated = [newProj, ...(Array.isArray(existing) ? existing : [])];
      await storage.setItem('porto_projects', updated);
      window.dispatchEvent(new Event('porto_storage_dirty'));
      
      setNewProjectTitle('');
      setNewProjectDeadline('');
      setIsAddProjectOpen(false);
      showToast(`Proyek "${newProj.title}" berhasil ditambahkan`);
    } catch (err) {
      console.error('Error saving project:', err);
      showToast('Gagal menyimpan proyek');
    }
  };

  const filteredModules = useMemo(() => {
    let mods = STUDIO_MODULES;
    if (moduleCategoryTab !== 'all') {
      mods = mods.filter(m => m.category === moduleCategoryTab);
    }
    return mods;
  }, [moduleCategoryTab]);

  const renderProjectIcon = (type: string) => {
    switch (type) {
      case 'blue-stripes':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FolderKanban size={18} color="#2563eb" />
          </div>
        );
      case 'teal-swirl':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe2 size={18} color="#0d9488" />
          </div>
        );
      case 'color-star':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} color="#10b981" />
          </div>
        );
      case 'gold-sun':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sun size={18} color="#d97706" />
          </div>
        );
      case 'purple-nodes':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layers size={18} color="#7c3aed" />
          </div>
        );
      default:
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={18} color="#64748b" />
          </div>
        );
    }
  };

  const userEmail = 
    userData?.email ||
    businessProfile?.contactEmail ||
    'hi.sumrday@gmail.com';

  const userName = 
    userData?.displayName ||
    (userData?.name && userData.name !== 'Totok Michael' ? userData.name : null) ||
    (userData?.email ? userData.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : null) ||
    businessProfile?.ownerName ||
    globalSettings?.biodata?.fullName || 
    'Admin sumr.day';

  const avatarSeed = encodeURIComponent(userName || 'Admin');

  const activeEngineObj = SEARCH_ENGINES.find(e => e.id === selectedEngine) || SEARCH_ENGINES[0];

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      minHeight: '100%',
      background: 'transparent',
      boxSizing: 'border-box',
      padding: isMobile ? '0' : isTablet ? '4px 12px calc(40px + env(safe-area-inset-bottom, 16px))' : '18px 20px 48px',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? 12 : 18,
      overflowX: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", "Segoe UI", Roboto, sans-serif'
    }}>

      {/* SVG Definitions for Diagonal Stripes */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <pattern id="diagonal-stripe-bar" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#cbd5e1" strokeWidth="3" />
          </pattern>
          <pattern id="diagonal-stripe-gauge" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="2.5" />
          </pattern>
        </defs>
      </svg>

      {/* ── 1. TOP HEADER BAR DENGAN SEARCH BAR AKURAT ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 10 : 12,
        flexWrap: isMobile ? 'nowrap' : 'wrap',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 50
      }}>
        {/* Search Omnibox Form with Live Results Dropdown */}
        <div ref={searchContainerRef} style={{ position: 'relative', width: isMobile ? '100%' : 440, maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <form onSubmit={handleExecuteSearch} style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--cms-card-bg, #ffffff)',
            border: isSearchFocused ? '1.5px solid #144e3b' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: 9999,
            padding: '6px 14px 6px 10px',
            width: '100%',
            boxShadow: isSearchFocused ? '0 4px 16px rgba(20,78,59,0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}>
            {/* Engine Selector Chip (Dengan Brand SVG Icon) */}
            <div style={{ position: 'relative', flexShrink: 0, marginRight: 8 }}>
              <button
                type="button"
                onClick={() => setIsEngineDropdownOpen(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 8px',
                  borderRadius: 100,
                  background: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 750,
                  color: activeEngineObj.color
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{activeEngineObj.icon}</span>
                <span>{activeEngineObj.tag}</span>
                <ChevronDown size={11} color="#64748b" />
              </button>

              {/* Engine Selector Dropdown */}
              {isEngineDropdownOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setIsEngineDropdownOpen(false)} />
                  <div style={{
                    position: 'absolute',
                    top: 34,
                    left: 0,
                    background: '#ffffff',
                    borderRadius: 14,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0',
                    padding: 6,
                    zIndex: 99999,
                    minWidth: 190,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}>
                    {SEARCH_ENGINES.map(eng => (
                      <button
                        key={eng.id}
                        type="button"
                        onClick={() => {
                          setSelectedEngine(eng.id);
                          setIsEngineDropdownOpen(false);
                          searchInputRef.current?.focus();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          padding: '7px 10px',
                          borderRadius: 9,
                          border: 'none',
                          background: selectedEngine === eng.id ? '#f1f5f9' : 'transparent',
                          color: selectedEngine === eng.id ? eng.color : '#334155',
                          fontSize: 12,
                          fontWeight: selectedEngine === eng.id ? 800 : 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', width: 16, justifyContent: 'center' }}>{eng.icon}</span>
                        <span style={{ fontWeight: 800 }}>{eng.tag}</span>
                        <span style={{ color: '#64748b', fontSize: 11, marginLeft: 'auto' }}>{eng.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder={activeEngineObj.placeholder}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                color: 'var(--cms-text, #1e293b)',
                width: '100%',
                fontWeight: 500
              }}
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            ) : !isMobile ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'var(--cms-input-bg, #f1f5f9)',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: 11,
                fontWeight: 700,
                color: '#64748b',
                userSelect: 'none',
                flexShrink: 0
              }}>
                <span>⌘</span>
                <span>F</span>
              </div>
            ) : null}
          </form>

          {/* ── DROPDOWN HASIL PENCARIAN FILE & DATA SECARA AKURAT ── */}
          {isSearchFocused && searchQuery.trim().length > 0 && selectedEngine === 'task' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 6,
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: 18,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
              zIndex: 99999,
              maxHeight: 360,
              overflowY: 'auto',
              padding: 6,
              boxSizing: 'border-box'
            }}>
              <div style={{
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 800,
                color: '#94a3b8',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Hasil Pencarian Studio ({searchResults.length})</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>Klik untuk membuka</span>
              </div>

              {searchResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                  {searchResults.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSwitchPage?.(item.page);
                          setIsSearchFocused(false);
                          setSearchQuery('');
                          haptic.light();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          transition: 'background 0.12s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: '#f1f5f9',
                          color: '#144e3b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <ItemIcon size={16} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 750,
                            color: 'var(--cms-text, #0f172a)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.title}
                          </span>
                          <span style={{
                            fontSize: 11,
                            color: '#64748b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.subtitle}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          background: '#f1f5f9',
                          color: '#475569',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}>
                          {item.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '18px 12px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Tidak ada file atau data yang cocok dengan "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Icons & Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          gap: isMobile ? 8 : 10,
          marginLeft: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : 'auto',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {/* User Profile Pill (Mobile: Rendered on the Left for natural mobile app bar layout) */}
          {isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 9999,
              padding: '3px 12px 3px 4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              maxWidth: 200,
              minWidth: 0
            }}
              onClick={() => onSwitchPage?.('settings')}
              title="Buka Pengaturan Akun & Bisnis"
            >
              <img 
                src={userData?.photoURL || globalSettings?.biodata?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=144e3b&textColor=ffffff`} 
                alt={userName}
                onError={(e) => {
                  (e.currentTarget as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=144e3b&textColor=ffffff`;
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text, #1e293b)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userName}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons Group (Mail & Bell on Right) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, flexShrink: 0 }}>
            {/* Status Cloud Aktif (Tanpa Emoji - Desktop only) */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--cms-card-bg, #ffffff)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 9999,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 750,
                color: '#15803d',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span>Cloud Aktif</span>
              </div>
            )}

            {/* Mail Button -> Direct to Chat */}
            <button 
              onClick={() => onSwitchPage?.('chat')}
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                borderRadius: '50%',
                background: 'var(--cms-card-bg, #ffffff)',
                border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#334155',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexShrink: 0
              }}
              title="Pesan & Konsultasi Klien"
            >
              <Mail size={isMobile ? 15 : 17} />
            </button>

            {/* Bell Button -> Notification Center Pop Up */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                haptic.light();
                window.dispatchEvent(new CustomEvent('porto_toggle_notifications', { detail: { source: 'top_header' } }));
              }}
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                borderRadius: '50%',
                background: 'var(--cms-card-bg, #ffffff)',
                border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#334155',
                position: 'relative',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexShrink: 0
              }}
              title="Pusat Notifikasi & Pemberitahuan"
            >
              <Bell size={isMobile ? 15 : 17} />
              {unreadNotifCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: isMobile ? 7 : 8,
                  right: isMobile ? 8 : 9,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 0 2px var(--cms-card-bg, #ffffff)'
                }} />
              )}
            </button>
          </div>

          {/* User Profile Pill (Desktop: Rendered on the Right) */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 9999,
              padding: '4px 14px 4px 5px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              minWidth: 0
            }}
              onClick={() => onSwitchPage?.('settings')}
              title="Buka Pengaturan Akun & Bisnis"
            >
              <img 
                src={userData?.photoURL || globalSettings?.biodata?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=144e3b&textColor=ffffff`} 
                alt={userName}
                onError={(e) => {
                  (e.currentTarget as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=144e3b&textColor=ffffff`;
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text, #1e293b)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userName}
                </span>
                <span style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userEmail}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. DASHBOARD TITLE & SUBTITLE (HAPUS ADD PROJECT & INPUT DATA) ── */}
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 8,
        width: '100%',
        marginTop: 2
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 24 : 32,
            fontWeight: 800,
            color: 'var(--cms-text, #0f172a)',
            letterSpacing: '-0.03em'
          }}>
            Dashboard
          </h1>
          <div style={{
            margin: '4px 0 0 0',
            fontSize: isMobile ? 12 : 13.5,
            color: '#64748b',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap'
          }}>
            <span>{greetingText}, {userName}</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span>{todayFormatted}</span>
            {todayHoliday && (
              <>
                <span style={{ opacity: 0.35 }}>•</span>
                <span style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 750,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Award size={12} />
                  <span>{todayHoliday.name}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* View Switcher Pill (Tanpa Emoji) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1px solid rgba(0,0,0,0.08)',
          padding: '3px',
          borderRadius: 9999,
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          width: isMobile ? '100%' : 'auto',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => {
              if (kpiViewMode !== 'executive') {
                setKpiViewMode('executive');
                haptic.light();
              }
            }}
            style={{
              flex: isMobile ? 1 : 'none',
              border: 'none',
              background: kpiViewMode === 'executive' ? '#144e3b' : 'transparent',
              color: kpiViewMode === 'executive' ? '#ffffff' : '#64748b',
              padding: isMobile ? '7px 10px' : '5px 14px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <BarChart3 size={13} />
            <span>Omset & Master Data</span>
          </button>
          <button
            onClick={() => {
              if (kpiViewMode !== 'pipeline') {
                setKpiViewMode('pipeline');
                haptic.light();
              }
            }}
            style={{
              flex: isMobile ? 1 : 'none',
              border: 'none',
              background: kpiViewMode === 'pipeline' ? '#144e3b' : 'transparent',
              color: kpiViewMode === 'pipeline' ? '#ffffff' : '#64748b',
              padding: isMobile ? '7px 10px' : '5px 14px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <FolderKanban size={13} />
            <span>Status Proyek</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes kpiFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .kpi-mode-fade {
          animation: kpiFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: opacity, transform;
        }
      `}</style>

      {/* ── 3. TOP 4 METRIC CARDS (RATA, RAPI & ANGKA AKURAT) ── */}
      <div 
        key={kpiViewMode}
        className="kpi-mode-fade"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? 'repeat(2, minmax(0, 1fr))' 
            : (isTablet && typeof window !== 'undefined' && window.innerWidth < 960) 
              ? 'repeat(2, minmax(0, 1fr))' 
              : 'repeat(4, minmax(0, 1fr))',
          gap: isMobile ? 8 : 16,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          alignItems: 'stretch'
        }}>
        {kpiViewMode === 'executive' ? (
          <>
            {/* Card 1: OMSET KAS (Solid Forest Green) */}
            <div style={{
              background: 'linear-gradient(135deg, #16533f 0%, #114232 100%)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? (isCompactMobile ? '12px 10px' : '14px 12px') : '20px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 125 : 155,
              height: '100%',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 6px 18px rgba(20, 78, 59, 0.12)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 750, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  OMSET KAS
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('transactions')}
                  style={{
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    minHeight: 28,
                    maxWidth: 28,
                    maxHeight: 28,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    padding: 0,
                    background: '#ffffff',
                    border: 'none',
                    color: '#144e3b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Buka Transaksi Kas"
                >
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{
                fontSize: isMobile ? 'clamp(16px, 4.2vw, 22px)' : 28,
                fontWeight: 800,
                lineHeight: 1.1,
                margin: '8px 0 10px',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                minWidth: 0
              }}>
                {formattedRevenue}
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255,255,255,0.15)',
                padding: '2px 7px',
                borderRadius: 9999,
                width: 'fit-content',
                maxWidth: '100%',
                fontSize: isMobile ? 9 : 10.5,
                fontWeight: 650,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <span>{revenueTargetPct}% Capaian</span>
              </div>
            </div>

            {/* Card 2: TOTAL PROYEK (Solid White) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? (isCompactMobile ? '12px 10px' : '14px 12px') : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 125 : 155,
              height: '100%',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  TOTAL PROYEK
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')}
                  style={{
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    minHeight: 28,
                    maxWidth: 28,
                    maxHeight: 28,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    padding: 0,
                    background: 'transparent',
                    border: '1.2px solid rgba(0,0,0,0.1)',
                    color: '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Buka Pipeline Proyek"
                >
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{ fontSize: isMobile ? 'clamp(20px, 5.5vw, 28px)' : 34, fontWeight: 800, lineHeight: 1, margin: '8px 0 10px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.total} <span style={{ fontSize: isMobile ? 11.5 : 14, fontWeight: 600, color: '#64748b' }}>Proyek</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: isMobile ? 3 : 6,
                fontSize: isMobile ? 9 : 10.5,
                fontWeight: 650,
                color: '#475569',
                flexWrap: 'wrap',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <span style={{ color: '#15803d', fontWeight: 800, whiteSpace: 'nowrap' }}>{projectCounts.done} Selesai</span>
                <span>•</span>
                <span style={{ color: '#0284c7', fontWeight: 800, whiteSpace: 'nowrap' }}>{projectCounts.progress + projectCounts.todo} Aktif</span>
              </div>
            </div>

            {/* Card 3: PUSAT DATABASE MASTER (Solid White) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? (isCompactMobile ? '12px 10px' : '14px 12px') : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 125 : 155,
              height: '100%',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  DATABASE
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('database')}
                  style={{
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    minHeight: 28,
                    maxWidth: 28,
                    maxHeight: 28,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    padding: 0,
                    background: 'transparent',
                    border: '1.2px solid rgba(0,0,0,0.1)',
                    color: '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Buka Database Master"
                >
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{ fontSize: isMobile ? 'clamp(20px, 5.5vw, 28px)' : 34, fontWeight: 800, lineHeight: 1, margin: '8px 0 10px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {totalDataEntities} <span style={{ fontSize: isMobile ? 11.5 : 14, fontWeight: 600, color: '#64748b' }}>Data</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: isMobile ? 9 : 10.5,
                fontWeight: 650,
                color: '#0284c7',
                flexWrap: 'wrap',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <span style={{
                  background: '#e0f2fe',
                  padding: '2px 5px',
                  borderRadius: 6,
                  fontSize: isMobile ? 8.5 : 10,
                  fontWeight: 800,
                  color: '#0284c7',
                  flexShrink: 0
                }}>
                  Cloud Sync
                </span>
                <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{isMobile ? 'Aktif' : 'Tersinkron'}</span>
              </div>
            </div>

            {/* Card 4: EKOSISTEM STUDIO (Solid White) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? (isCompactMobile ? '12px 10px' : '14px 12px') : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 125 : 155,
              height: '100%',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  MODUL STUDIO
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('apps')}
                  style={{
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    minHeight: 28,
                    maxWidth: 28,
                    maxHeight: 28,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    padding: 0,
                    background: 'transparent',
                    border: '1.2px solid rgba(0,0,0,0.1)',
                    color: '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Buka Apps Studio"
                >
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{ fontSize: isMobile ? 'clamp(20px, 5.5vw, 28px)' : 34, fontWeight: 800, lineHeight: 1, margin: '8px 0 10px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                12 <span style={{ fontSize: isMobile ? 11.5 : 14, fontWeight: 600, color: '#64748b' }}>Modul</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: isMobile ? 9 : 10.5,
                fontWeight: 650,
                color: '#7c3aed',
                flexWrap: 'wrap',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <span style={{
                  background: '#ede9fe',
                  padding: '2px 5px',
                  borderRadius: 6,
                  fontSize: isMobile ? 8.5 : 10,
                  fontWeight: 800,
                  color: '#7c3aed',
                  flexShrink: 0
                }}>
                  100% Aktif
                </span>
                <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{isMobile ? 'Tersedia' : 'Terintegrasi'}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Card 1: TOTAL PROJECTS */}
            <div style={{
              background: 'linear-gradient(135deg, #16533f 0%, #114232 100%)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? (isCompactMobile ? '12px 10px' : '14px 12px') : '20px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 125 : 155,
              height: '100%',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Total Projects
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')} 
                  style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, maxWidth: 28, maxHeight: 28, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: '#ffffff', border: 'none', color: '#144e3b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 'clamp(20px, 5.5vw, 28px)' : 34, fontWeight: 800, lineHeight: 1, margin: '8px 0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.total}
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Semua portofolio terdaftar
              </div>
            </div>

            {/* Card 2: ENDED PROJECTS */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? (isCompactMobile ? '12px 10px' : '14px 12px') : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 125 : 155,
              height: '100%',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Ended Projects
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')} 
                  style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, maxWidth: 28, maxHeight: 28, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: '1.2px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 'clamp(20px, 5.5vw, 28px)' : 34, fontWeight: 800, lineHeight: 1, margin: '8px 0 10px', color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.done}
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 650, color: '#15803d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Selesai Dikerjakan
              </div>
            </div>

            {/* Card 3: RUNNING PROJECTS */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? (isCompactMobile ? '12px 10px' : '14px 12px') : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 125 : 155,
              height: '100%',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Running Projects
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')} 
                  style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, maxWidth: 28, maxHeight: 28, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: '1.2px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 'clamp(20px, 5.5vw, 28px)' : 34, fontWeight: 800, lineHeight: 1, margin: '8px 0 10px', color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.progress}
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 650, color: '#0284c7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Sedang Dikerjakan Studio
              </div>
            </div>

            {/* Card 4: PENDING PROJECT */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? (isCompactMobile ? '12px 10px' : '14px 12px') : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 125 : 155,
              height: '100%',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 4 }}>
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Pending Project
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')} 
                  style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, maxWidth: 28, maxHeight: 28, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: '1.2px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 'clamp(20px, 5.5vw, 28px)' : 34, fontWeight: 800, lineHeight: 1, margin: '8px 0 10px', color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.todo}
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 650, color: '#b45309', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Dalam Diskusi Klien
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 4. MAIN CONTENT (RATA & RAPI 2 KOLOM DESKTOP, STACK RAPI DI MOBILE) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : isTablet ? 'minmax(0, 1fr)' : '1.75fr 1fr',
        gap: isMobile ? 12 : 16,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        alignItems: 'stretch'
      }}>

        {/* LEFT COLUMN: ROW 1 (Analytics + Calendar) & ROW 2 (Modules + Progress) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 12 : 16,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          {/* ROW 1: Project Analytics + Kalender Proyek */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : '1.15fr 1.15fr',
            gap: isMobile ? 12 : 16,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            alignItems: 'stretch'
          }}>
            {/* CARD A: Project Analytics (7-Day Capsule Bars) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '14px 12px' : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 'auto' : 290,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Project Analytics
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Aktivitas & Kas 7 Hari Terakhir
                  </div>
                </div>
                <div style={{
                  fontSize: 10.5,
                  fontWeight: 750,
                  color: '#144e3b',
                  background: '#f0fdf4',
                  padding: '3px 8px',
                  borderRadius: 100,
                  flexShrink: 0
                }}>
                  Mingguan
                </div>
              </div>

              {/* Capsule Bars Graph */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: isMobile ? 130 : 150,
                marginTop: 12,
                padding: '0 2px',
                position: 'relative',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
              }}>
                {weeklyAnalytics.map((bar, idx) => {
                  const isMax = bar.height >= 80;
                  const isMid = bar.height >= 55 && !isMax;

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: 5, 
                        height: '100%', 
                        justifyContent: 'flex-end',
                        position: 'relative',
                        flex: 1,
                        minWidth: 0,
                        maxWidth: isMobile ? 32 : 36
                      }}
                      title={`${bar.day}: ${bar.formatted}`}
                    >
                      <div style={{
                        width: isMobile ? 'clamp(14px, 4vw, 22px)' : 28,
                        height: `${bar.height}%`,
                        borderRadius: 9999,
                        background: isMax ? '#144e3b' : isMid ? '#48bb78' : 'url(#diagonal-stripe-bar)',
                        border: isMax || isMid ? 'none' : '1px solid #cbd5e1',
                        transition: 'height 0.3s ease',
                        cursor: 'pointer'
                      }} />
                      <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: isMax ? '#144e3b' : '#94a3b8' }}>
                        {bar.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD B: KALENDER PROYEK & REMINDERS (DARI WIDGET LAMA) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '14px 12px' : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 'auto' : 290,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div>
                {/* Header: Month/Year + Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6, flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <Calendar size={15} color="#144e3b" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: isMobile ? 12.5 : 13.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {MONTH_NAMES_ID[calMonth]} {calYear}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <button
                      type="button"
                      className="cms-circle-btn cal-nav-btn"
                      onClick={() => {
                        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                        else setCalMonth(m => m - 1);
                        haptic.light();
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        minWidth: 26,
                        minHeight: 26,
                        maxWidth: 26,
                        maxHeight: 26,
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#f1f5f9',
                        color: '#334155',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        boxSizing: 'border-box',
                        flexShrink: 0
                      }}
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft size={13} style={{ flexShrink: 0 }} />
                    </button>

                    <button
                      type="button"
                      className="cal-today-btn"
                      onClick={() => {
                        const now = new Date();
                        setCalMonth(now.getMonth());
                        setCalYear(now.getFullYear());
                        setSelectedCalDay(now.getDate());
                        haptic.light();
                      }}
                      style={{
                        minHeight: 'unset',
                        height: 26,
                        maxHeight: 26,
                        lineHeight: '26px',
                        padding: '0 9px',
                        borderRadius: 9999,
                        border: 'none',
                        background: '#f1f5f9',
                        color: '#334155',
                        fontSize: 10.5,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Hari Ini
                    </button>

                    <button
                      type="button"
                      className="cms-circle-btn cal-nav-btn"
                      onClick={() => {
                        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                        else setCalMonth(m => m + 1);
                        haptic.light();
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        minWidth: 26,
                        minHeight: 26,
                        maxWidth: 26,
                        maxHeight: 26,
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#f1f5f9',
                        color: '#334155',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        boxSizing: 'border-box',
                        flexShrink: 0
                      }}
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight size={13} style={{ flexShrink: 0 }} />
                    </button>
                  </div>
                </div>

                {/* 7 Days Header (Sen s/d Min) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: isMobile ? 3 : 2,
                  textAlign: 'center',
                  fontSize: isMobile ? 11 : 9.5,
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: isMobile ? 6 : 3,
                  width: '100%',
                  minWidth: 0
                }}>
                  {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d, idx) => (
                    <div key={idx} style={{ color: idx === 6 ? '#f43f5e' : undefined }}>{d}</div>
                  ))}
                </div>

                {/* Days Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: isMobile ? 4 : 2,
                  textAlign: 'center',
                  width: '100%',
                  minWidth: 0
                }}>
                  {calendarDays.map((cell, idx) => {
                    if (!cell.day) {
                      return <div key={`empty-${idx}`} style={{ height: isMobile ? 32 : 26, width: '100%', minWidth: 0 }} />;
                    }
                    const isSelected = selectedCalDay === cell.day;
                    const hasHoliday = !!cell.holiday;
                    const hasDeadlines = cell.projectDeadlines && cell.projectDeadlines.length > 0;
                    const isSunday = idx % 7 === 6;

                    return (
                      <div
                        key={`day-${cell.day}-${idx}`}
                        onClick={() => {
                          setSelectedCalDay(cell.day);
                          haptic.light();
                        }}
                        style={{
                          width: isMobile ? 32 : 26,
                          height: isMobile ? 32 : 26,
                          minWidth: isMobile ? 32 : 26,
                          minHeight: isMobile ? 32 : 26,
                          maxWidth: isMobile ? 32 : 26,
                          maxHeight: isMobile ? 32 : 26,
                          aspectRatio: '1 / 1',
                          margin: '0 auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          background: isSelected ? '#144e3b' : cell.isToday ? '#ecfdf5' : 'transparent',
                          color: isSelected ? '#ffffff' : hasHoliday || isSunday ? '#f43f5e' : cell.isToday ? '#144e3b' : 'var(--cms-text, #1e293b)',
                          fontWeight: cell.isToday || isSelected ? 850 : 600,
                          fontSize: isMobile ? 12 : 10,
                          position: 'relative',
                          boxSizing: 'border-box',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                          border: cell.isToday && !isSelected ? '1px solid #10b981' : '1px solid transparent',
                          boxShadow: isSelected ? '0 3px 10px rgba(20, 78, 59, 0.25)' : 'none'
                        }}
                        title={hasHoliday ? cell.holiday.name : hasDeadlines ? `${cell.projectDeadlines.length} Tenggat Proyek` : undefined}
                      >
                        <span style={{ lineHeight: 1 }}>{cell.day}</span>
                        <div style={{ display: 'flex', gap: 2, alignItems: 'center', marginTop: 1.5, height: 3 }}>
                          {hasHoliday && <span style={{ width: 3, height: 3, borderRadius: '50%', background: isSelected ? '#ffffff' : '#f43f5e', display: 'block' }} />}
                          {hasDeadlines && <span style={{ width: 3, height: 3, borderRadius: '50%', background: isSelected ? '#ffffff' : '#10b981', display: 'block' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Status Strip */}
              <div style={{
                padding: isMobile ? '8px 12px' : '6px 12px',
                borderRadius: isMobile ? 12 : 9999,
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontSize: isMobile ? 11 : 10,
                marginTop: isMobile ? 10 : 8,
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: '1 1 auto' }}>
                  {selectedDayInfo?.holiday ? (
                    <span style={{ color: '#f43f5e', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Libur: {selectedDayInfo.holiday.name}
                    </span>
                  ) : selectedDayInfo?.projectDeadlines?.length ? (
                    <span style={{ color: '#10b981', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Tenggat: {selectedDayInfo.projectDeadlines[0].title}
                    </span>
                  ) : (
                    <span style={{ color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedDayInfo?.safeDay ?? selectedCalDay} {MONTH_NAMES_ID[calMonth]}: Bebas Tenggat
                    </span>
                  )}
                </div>
                <span style={{ fontSize: isMobile ? 10 : 9.5, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
                  {totalDeadlinesThisMonth} Tenggat
                </span>
              </div>
            </div>
          </div>

          {/* ROW 2: Studio Modules + Project Progress */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : '1.3fr 1fr',
            gap: isMobile ? 12 : 16,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            alignItems: 'stretch'
          }}>
            {/* CARD C: 12 MODUL STUDIO EKOSISTEM */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '14px 12px' : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 'auto' : 290,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                  flexWrap: 'wrap',
                  gap: 6,
                  width: '100%',
                  minWidth: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>
                      Studio Modules
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                      12 Terpadu
                    </span>
                  </div>
                </div>

                {/* Modules Grid - Icon Only Menu Display (All 12 Modules) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(6, 1fr)',
                  gap: isMobile ? 8 : 10,
                  padding: '6px 2px',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}>
                  {STUDIO_MODULES.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => onSwitchPage?.(mod.page)}
                        title={`${mod.name} • ${mod.desc}`}
                        aria-label={mod.name}
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          borderRadius: 14,
                          background: `${mod.color}14`,
                          border: `1px solid ${mod.color}25`,
                          color: mod.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          padding: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.06)';
                          e.currentTarget.style.background = `${mod.color}24`;
                          e.currentTarget.style.boxShadow = `0 6px 14px ${mod.color}30`;
                          e.currentTarget.style.borderColor = mod.color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.background = `${mod.color}14`;
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                          e.currentTarget.style.borderColor = `${mod.color}25`;
                        }}
                      >
                        <Icon size={isMobile ? 18 : 22} strokeWidth={2.2} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CARD D: Project Progress (Arch Gauge Semi-circle) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 18 : 22,
              padding: isMobile ? '14px 12px' : '20px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: isMobile ? 'auto' : 290,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ width: '100%', fontSize: isMobile ? 15 : 16, fontWeight: 800, color: 'var(--cms-text, #0f172a)', textAlign: 'left', marginBottom: 4 }}>
                Project Progress
              </div>

              {/* Arch Gauge SVG */}
              <div style={{ position: 'relative', width: '100%', maxWidth: 200, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="200" height="120" viewBox="0 0 220 130" style={{ maxWidth: '100%', height: 'auto' }}>
                  <path
                    d="M 25 115 A 85 85 0 0 1 110 30"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 110 30 A 85 85 0 0 1 170 56"
                    fill="none"
                    stroke="#144e3b"
                    strokeWidth="24"
                  />
                  <path
                    d="M 170 56 A 85 85 0 0 1 195 115"
                    fill="none"
                    stroke="url(#diagonal-stripe-gauge)"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Center Percentage */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: 'var(--cms-text, #0f172a)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {progressPercentage}%
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#15803d', marginTop: 3 }}>
                    Project Ended
                  </span>
                </div>
              </div>

              {/* Legend Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? 8 : 10,
                width: '100%',
                minWidth: 0,
                marginTop: 8,
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#475569' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                  <span>Selesai ({projectCounts.done})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#475569' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#144e3b', flexShrink: 0 }} />
                  <span>Progres ({projectCounts.progress})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: '#475569' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'url(#diagonal-stripe-gauge)', border: '1px solid #cbd5e1', flexShrink: 0 }} />
                  <span>Pending ({projectCounts.todo})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROJECT LIST + TIME TRACKER (RATA & SEIMBANG) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 12 : 16,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          {/* TOP CARD: Project List */}
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: isMobile ? 18 : 22,
            padding: isMobile ? '14px 12px' : '20px',
            border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: isMobile ? 'auto' : 290,
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                gap: 6,
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>
                    Project
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '1px 7px', borderRadius: 100 }}>
                    {projects.length}
                  </span>
                </div>

                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'transparent',
                    border: '1.2px solid #144e3b',
                    borderRadius: 9999,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#144e3b',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Project items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', minWidth: 0 }}>
                {displayProjectsList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSwitchPage?.('projects')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 8px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    title={`Klik untuk membuka: ${item.title}`}
                  >
                    {renderProjectIcon(item.iconType)}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 750,
                          color: 'var(--cms-text, #0f172a)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.title}
                        </span>
                        <span style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 4,
                          fontWeight: 750,
                          background: item.status === 'done' ? '#dcfce7' : item.status === 'progress' ? '#e0f2fe' : '#fef3c7',
                          color: item.status === 'done' ? '#15803d' : item.status === 'progress' ? '#0284c7' : '#b45309',
                          flexShrink: 0
                        }}>
                          {item.status === 'done' ? 'Selesai' : item.status === 'progress' ? 'Progres' : 'Todo'}
                        </span>
                      </div>
                      <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Tenggat: {item.dueDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: 8,
              borderTop: '1px solid rgba(0,0,0,0.04)',
              width: '100%',
              minWidth: 0
            }}>
              <button
                onClick={() => onSwitchPage?.('projects')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#144e3b',
                  fontSize: 11,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0
                }}
              >
                <span>Lihat Semua Proyek</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* BOTTOM CARD: TIME TRACKER */}
          <div style={{
            borderRadius: isMobile ? 18 : 22,
            padding: isMobile ? '14px 12px' : '20px',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: isMobile ? 12 : 16,
            minHeight: isMobile ? 'auto' : 290,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(10, 40, 30, 0.2)',
            backgroundImage: 'url(/assets/time_tracker_bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(6, 30, 20, 0.75) 0%, rgba(6, 30, 20, 0.9) 100%)',
              zIndex: 1
            }} />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 750, color: '#ffffff' }}>
                Time Tracker
              </span>
              <div style={{
                fontSize: 10.5,
                fontWeight: 750,
                color: 'rgba(255,255,255,0.85)',
                background: 'rgba(255,255,255,0.15)',
                padding: '2px 8px',
                borderRadius: 100,
                backdropFilter: 'blur(4px)',
                flexShrink: 0
              }}>
                {liveClock || '12:00:00 WIB'}
              </div>
            </div>

            {/* Live Clock Readout */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              margin: isMobile ? '6px 0' : '10px 0',
              width: '100%',
              minWidth: 0
            }}>
              <div style={{
                fontSize: isMobile ? 'clamp(28px, 8vw, 36px)' : 38,
                fontWeight: 800,
                letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
                color: '#ffffff',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap'
              }}>
                {formatStopwatch(stopwatchSeconds)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Melacak: {projects.length > 0 ? projects[0].title : 'Aktivitas Studio'}
              </div>
            </div>

            {/* Controls */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14
            }}>
              <button
                onClick={() => {
                  setIsTimerRunning(prev => !prev);
                  haptic.light();
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: 'none',
                  color: '#144e3b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                title={isTimerRunning ? 'Pause' : 'Resume'}
              >
                {isTimerRunning ? (
                  <Pause size={18} fill="#144e3b" />
                ) : (
                  <Play size={18} fill="#144e3b" style={{ marginLeft: 2 }} />
                )}
              </button>

              <button
                onClick={handleResetTimer}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#dc2626',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
                }}
                title="Stop & Reset"
              >
                <Square size={14} fill="#ffffff" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── 5. TOGGLE STASIUN GADGET EKOSISTEM LAMA ── */}
      {showGadgetStationToggle && onOpenGadgetStation && (
        <div style={{
          marginTop: 6,
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={onOpenGadgetStation}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 9999,
              padding: isMobile ? '8px 14px' : '9px 18px',
              fontSize: isMobile ? 11.5 : 12.5,
              fontWeight: 700,
              color: '#64748b',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
              maxWidth: '100%',
              boxSizing: 'border-box',
              textAlign: 'center'
            }}
          >
            <Layers size={15} color="#144e3b" style={{ flexShrink: 0 }} />
            <span>{isMobile ? 'Stasiun Gadget & Ekosistem CMS' : 'Akses Stasiun Gadget Studio & Ekosistem CMS Lama'}</span>
          </button>
        </div>
      )}

      {/* ── MODAL: TAMBAH PROYEK BARU ── */}
      {isAddProjectOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }} onClick={() => setIsAddProjectOpen(false)}>
          <div style={{
            width: '100%',
            maxWidth: 460,
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: 22,
            padding: 22,
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#144e3b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>
                  Tambah Proyek Baru
                </h3>
              </div>
              <button 
                onClick={() => setIsAddProjectOpen(false)}
                style={{ border: 'none', background: '#f1f5f9', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                  Nama / Judul Proyek
                </label>
                <input
                  type="text"
                  required
                  value={newProjectTitle}
                  onChange={e => setNewProjectTitle(e.target.value)}
                  placeholder="Contoh: Redesign UI Mobile App..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Kategori
                  </label>
                  <select
                    value={newProjectCategory}
                    onChange={e => setNewProjectCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                      outline: 'none',
                      background: '#fff'
                    }}
                  >
                    <option value="Desain">Desain UI/UX</option>
                    <option value="Website">Website</option>
                    <option value="Aplikasi">Aplikasi</option>
                    <option value="Branding">Branding</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    Tenggat Waktu
                  </label>
                  <input
                    type="date"
                    value={newProjectDeadline}
                    onChange={e => setNewProjectDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 12.5,
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 9999,
                    border: '1px solid #cbd5e1',
                    background: 'transparent',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 9999,
                    border: 'none',
                    background: '#144e3b',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(20, 78, 59, 0.25)'
                  }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GOOGLE MEET LAUNCHER ── */}
      {isMeetingModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }} onClick={() => setIsMeetingModalOpen(false)}>
          <div style={{
            width: '100%',
            maxWidth: 420,
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: 22,
            padding: 22,
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#144e3b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <Video size={24} strokeWidth={2.2} />
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>
                Mulai Virtual Meeting
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>
                Buka ruang Google Meet instan untuk diskusi proyek atau review bersama klien.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => {
                  window.open('https://meet.google.com/new', '_blank');
                  setIsMeetingModalOpen(false);
                  showToast('Membuka Google Meet');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#144e3b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '11px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(20, 78, 59, 0.2)'
                }}
              >
                <Video size={16} />
                <span>Buka Google Meet Baru</span>
              </button>

              <button
                onClick={() => {
                  window.open('https://zoom.us/start/videomeeting', '_blank');
                  setIsMeetingModalOpen(false);
                  showToast('Membuka Zoom Meeting');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#ffffff',
                  color: '#2563eb',
                  border: '1.2px solid #2563eb',
                  borderRadius: 9999,
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span>Buka Zoom Meeting</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION TOAST (TANPA EMOJI) ── */}
      {showNotificationToast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default FlatSolidDashboard;
