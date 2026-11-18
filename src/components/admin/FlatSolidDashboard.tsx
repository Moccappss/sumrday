import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, Mail, Bell, Plus, ArrowUpRight, Video, Pause, Play, 
  Square, Check, Clock, Calendar, Users, X, Upload, ExternalLink, 
  Layers, ChevronDown, ChevronUp, Sparkles, Filter, CheckCircle2, RotateCcw,
  TrendingUp, Database, LayoutGrid, BookOpen, ShoppingBag, Globe2,
  DollarSign, StickyNote, Link2, Megaphone, MessageSquareMore,
  Compass, Building2, FolderKanban, ShieldCheck, ChevronLeft, ChevronRight, ArrowRight,
  Flame, Award, Heart, Gift, Moon, Sun, Briefcase, Activity, Rocket,
  FileText, Layout, BarChart3, CornerDownLeft, Cloud,
  Receipt, MessageCircle, QrCode, Image as ImageIcon, FileSpreadsheet
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { storage } from '../../utils/storage';
import { subscribeToNotifications } from '../../utils/notifications';
import { PreFlightLaunchAuditModal } from './PreFlightLaunchAuditModal';
import { getSolarAtmosphere } from '../../utils/solarCircadianEngine';

const LiveClockText = React.memo(() => {
  const [clock, setClock] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} WIB`;
  });

  useEffect(() => {
    const updateTime = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const now = new Date();
      setClock(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} WIB`);
    };
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{clock}</>;
});

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

// ── 24 MODUL STUDIO EKOSISTEM (TERINTEGRASI 100% SESUAI ARSITEKTUR KINI) ──
interface StudioModule {
  id: string;
  name: string;
  shortName?: string;
  category: 'management' | 'database' | 'tools' | 'analytics' | 'settings';
  categoryLabel: string;
  desc: string;
  icon: any;
  color: string;
  page: string;
}

const STUDIO_MODULES: StudioModule[] = [
  // 1. MANAJEMEN OPERASIONAL
  { id: 'projects', name: 'Works Kanban', shortName: 'Kanban', category: 'management', categoryLabel: 'Manajemen', desc: 'Manajemen tugas, timeline & alur kerja proyek', icon: FolderKanban, color: '#3b82f6', page: 'projects' },
  { id: 'proofing', name: 'Proofing Klien', shortName: 'Proofing', category: 'management', categoryLabel: 'Manajemen', desc: 'Persetujuan karya visual, watermark & ACC klien', icon: ShieldCheck, color: '#06b6d4', page: 'proofing' },
  { id: 'finance', name: 'Finansial & Kas', shortName: 'Kasir & Kas', category: 'management', categoryLabel: 'Manajemen', desc: 'Laporan kas studio, tagihan & invoice', icon: Receipt, color: '#10b981', page: 'transactions' },
  { id: 'whatsapp', name: 'WA Studio', shortName: 'WA Studio', category: 'management', categoryLabel: 'Manajemen', desc: 'Template pesan & broadcast WhatsApp', icon: MessageCircle, color: '#25D366', page: 'whatsapp' },
  { id: 'chat', name: 'Live Konsultasi', shortName: 'Live Chat', category: 'management', categoryLabel: 'Manajemen', desc: 'Percakapan langsung dengan klien & pengunjung', icon: MessageSquareMore, color: '#14b8a6', page: 'chat' },
  { id: 'users', name: 'Tim & CRM', shortName: 'Tim & CRM', category: 'management', categoryLabel: 'Manajemen', desc: 'Kelola tim internal, hak akses & kontak klien', icon: Users, color: '#0ea5e9', page: 'users' },

  // 2. MASTER DATABASE / VAULT
  { id: 'vault', name: 'Vault Database', shortName: 'Vault DB', category: 'database', categoryLabel: 'Database', desc: 'Pusat 12 basis data terintegrasi sumr.day', icon: Database, color: '#0284c7', page: 'database' },
  { id: 'showcase', name: 'Karya Showcase', shortName: 'Showcase', category: 'database', categoryLabel: 'Database', desc: 'Etalase portofolio & studi kasus kreasi studio', icon: Award, color: '#e11d48', page: 'portfolio' },
  { id: 'journal', name: 'Journal Artikel', shortName: 'Journal', category: 'database', categoryLabel: 'Database', desc: 'Kurasi tulisan, wawasan desain & artikel', icon: BookOpen, color: '#eab308', page: 'blog' },
  { id: 'catalog', name: 'Drops Produk', shortName: 'Drops', category: 'database', categoryLabel: 'Database', desc: 'Katalog rilis aset digital & template', icon: ShoppingBag, color: '#ec4899', page: 'catalog' },
  { id: 'apps', name: 'Apps Studio', shortName: 'Apps', category: 'database', categoryLabel: 'Database', desc: 'Modul undangan digital & aplikasi interaktif', icon: LayoutGrid, color: '#8b5cf6', page: 'apps' },
  { id: 'forms', name: 'Formulir Forms', shortName: 'Forms', category: 'database', categoryLabel: 'Database', desc: 'Formulir survei, RSVP & feedback klien', icon: FileSpreadsheet, color: '#06b6d4', page: 'forms' },
  { id: 'links', name: 'Bio Links', shortName: 'Bio Links', category: 'database', categoryLabel: 'Database', desc: 'Halaman micro-site tautan & bio profil', icon: Link2, color: '#3b82f6', page: 'links' },
  { id: 'broadcast', name: 'Waves Push', shortName: 'Waves', category: 'database', categoryLabel: 'Database', desc: 'Push notifikasi siaran & kabar hangat ke audiens', icon: Megaphone, color: '#f43f5e', page: 'broadcast' },
  { id: 'voice', name: 'Cheers Ulasan', shortName: 'Cheers', category: 'database', categoryLabel: 'Database', desc: 'Ulasan hangat & testimoni nyata klien', icon: Heart, color: '#f43f5e', page: 'reviews' },
  { id: 'rates', name: 'Rates Paket', shortName: 'Rate Card', category: 'database', categoryLabel: 'Database', desc: 'Daftar harga & paket layanan kreatif studio', icon: DollarSign, color: '#10b981', page: 'ratecard' },

  // 3. TOOL EKOSISTEM
  { id: 'lpimage', name: 'LP Image', shortName: 'LP Image', category: 'tools', categoryLabel: 'Tool', desc: 'Editor layout modular gambar & stiker interaktif', icon: ImageIcon, color: '#0284c7', page: 'builder' },
  { id: 'flipbook', name: 'Flipbook Studio', shortName: 'Flipbook', category: 'tools', categoryLabel: 'Tool', desc: 'Dokumen interaktif, brand guideline & lookbook', icon: BookOpen, color: '#06b6d4', page: 'flipbook' },
  { id: 'web', name: 'Web Studio', shortName: 'Web Studio', category: 'tools', categoryLabel: 'Tool', desc: 'Editor visual responsif seluruh halaman web', icon: Globe2, color: '#7c3aed', page: 'visual-editor' },
  { id: 'memo', name: 'Memo & Board', shortName: 'Memo Board', category: 'tools', categoryLabel: 'Tool', desc: 'Papan catatan cepat, ide segar & whiteboard', icon: StickyNote, color: '#f59e0b', page: 'memo' },
  { id: 'qr', name: 'QR Studio', shortName: 'QR Studio', category: 'tools', categoryLabel: 'Tool', desc: 'Generator kode QR estetik & kustomisasi warna', icon: QrCode, color: '#6366f1', page: 'qr' },

  // 4. ANALITIK
  { id: 'analytics', name: 'Studio Intel', shortName: 'Analitik', category: 'analytics', categoryLabel: 'Analitik', desc: 'Statistik trafik pengunjung & konversi lead', icon: BarChart3, color: '#6366f1', page: 'analytics' },

  // 5. SETELAN & PANDUAN
  { id: 'settings', name: 'Setelan Studio', shortName: 'Setelan', category: 'settings', categoryLabel: 'Setting', desc: 'Konfigurasi identitas studio, profil & tema', icon: Building2, color: '#64748b', page: 'settings' },
  { id: 'guideline', name: 'Buku Panduan', shortName: 'Panduan', category: 'settings', categoryLabel: 'Setting', desc: 'Peta panduan fitur & pintasan studio', icon: Compass, color: '#a855f7', page: 'guideline' }
];

const MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// ── ISOLATED ACCURATE WALL-CLOCK STUDIO TIME TRACKER (Zero Dashboard Re-renders) ──
interface StudioTimeTrackerCardProps {
  activeProjects: any[];
  isMobile: boolean;
  isDark: boolean;
  showToast: (msg: string) => void;
}

const StudioTimeTrackerCard: React.FC<StudioTimeTrackerCardProps> = React.memo(({
  activeProjects,
  isMobile,
  isDark,
  showToast
}) => {
  const [selectedTrackingProject, setSelectedTrackingProject] = useState<string>('Aktivitas Studio');
  const [isTrackingDropdownOpen, setIsTrackingDropdownOpen] = useState(false);
  const trackingDropdownRef = useRef<HTMLDivElement>(null);

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
      if (saved) return !!JSON.parse(saved).isRunning;
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

  useEffect(() => {
    const handleClickOutsideTracking = (e: MouseEvent) => {
      if (trackingDropdownRef.current && !trackingDropdownRef.current.contains(e.target as Node)) {
        setIsTrackingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideTracking);
    return () => document.removeEventListener('mousedown', handleClickOutsideTracking);
  }, []);

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
      if (document.visibilityState === 'visible') syncClock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncClock);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncClock);
    };
  }, [isTimerRunning]);

  const handleResetTimer = async () => {
    const elapsed = stopwatchSeconds;
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

    if (elapsed >= 10) {
      try {
        const existingNotes = await storage.getItem('porto_memo_notes', []);
        const hrs = Math.floor(elapsed / 3600);
        const mins = Math.floor((elapsed % 3600) / 60);
        const secs = elapsed % 60;
        const timeStr = `${hrs > 0 ? hrs + 'j ' : ''}${mins > 0 ? mins + 'm ' : ''}${secs}d`;
        const logEntry = {
          id: `timelog_${Date.now()}`,
          title: `Log Waktu: ${selectedTrackingProject}`,
          content: `Durasi tercatat: ${timeStr} (${formatStopwatch(elapsed)})\nWaktu: ${new Date().toLocaleString('id-ID')}\nFokus: ${selectedTrackingProject}`,
          category: 'Time Tracker',
          type: 'doc',
          folderId: 'general',
          tags: ['timelog', 'tracker'],
          isPinned: false,
          isFavorite: false,
          isTrash: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedNotes = [logEntry, ...(Array.isArray(existingNotes) ? existingNotes : [])];
        await storage.setItem('porto_memo_notes', updatedNotes);

        // Sinkronisasi langsung ke porto_projects untuk kalkulasi jam kerja & profitabilitas proyek
        if (selectedTrackingProject && selectedTrackingProject !== 'Aktivitas Studio') {
          try {
            const allProjects = await storage.getItem<any[]>('porto_projects', []);
            if (Array.isArray(allProjects) && allProjects.length > 0) {
              let matched = false;
              const nextProjects = allProjects.map((p: any) => {
                if ((p.title || p.name) === selectedTrackingProject) {
                  matched = true;
                  const prevSeconds = Number(p.totalTrackedSeconds || 0);
                  const prevLogs = Array.isArray(p.timeLogs) ? p.timeLogs : [];
                  return {
                    ...p,
                    totalTrackedSeconds: prevSeconds + elapsed,
                    timeLogs: [
                      {
                        id: `tlog_${Date.now()}`,
                        seconds: elapsed,
                        formatted: timeStr,
                        recordedAt: new Date().toISOString()
                      },
                      ...prevLogs
                    ]
                  };
                }
                return p;
              });
              if (matched) {
                await storage.setItem('porto_projects', nextProjects);
              }
            }
          } catch (projErr) {}
        }

        window.dispatchEvent(new Event('porto_storage_dirty'));
        showToast(
          selectedTrackingProject !== 'Aktivitas Studio'
            ? `Waktu ${timeStr} tercatat ke Proyek "${selectedTrackingProject}" & Notes!`
            : `Waktu kerja ${timeStr} dicatat ke Notes!`
        );
      } catch (err) {
        showToast('Timer direset ke 00:00:00');
      }
    } else {
      showToast('Timer direset ke 00:00:00');
    }
    haptic.medium();
  };

  const formatStopwatch = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      borderRadius: isMobile ? 16 : 18,
      padding: isMobile ? '16px 18px 18px' : '18px 22px 16px',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: isMobile ? 12 : 10,
      minHeight: isMobile ? 'auto' : 325,
      height: isMobile ? 'auto' : 325,
      position: 'relative',
      overflow: 'hidden',
      background: isDark
        ? 'linear-gradient(155deg, #0e1726 0%, #070c16 65%, #05080e 100%)'
        : 'linear-gradient(155deg, #06281e 0%, #031812 70%, #02120d 100%)',
      border: isTimerRunning 
        ? '1px solid rgba(16, 185, 129, 0.35)' 
        : '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: isTimerRunning
        ? '0 16px 36px rgba(16, 185, 129, 0.18), 0 2px 10px rgba(0,0,0,0.4)'
        : '0 10px 30px rgba(0, 0, 0, 0.35)',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      {/* Ambient Aurora Glow Circles */}
      <div style={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: isTimerRunning 
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)' 
          : 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
        filter: 'blur(24px)',
        pointerEvents: 'none',
        transition: 'all 0.5s ease'
      }} />
      <div style={{
        position: 'absolute',
        bottom: -40,
        left: -30,
        width: 130,
        height: 130,
        borderRadius: '50%',
        background: isTimerRunning
          ? 'radial-gradient(circle, rgba(5, 150, 105, 0.25) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        filter: 'blur(24px)',
        pointerEvents: 'none',
        transition: 'all 0.5s ease'
      }} />

      {/* Header: Title + Live WIB Clock */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        minWidth: 0,
        gap: 8,
        flexWrap: 'nowrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: isTimerRunning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: isTimerRunning ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isTimerRunning ? '#34d399' : '#94a3b8',
            transition: 'all 0.3s ease',
            flexShrink: 0,
            aspectRatio: '1 / 1'
          }}>
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Time Tracker
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isTimerRunning ? '#10b981' : stopwatchSeconds > 0 ? '#f59e0b' : '#64748b',
                boxShadow: isTimerRunning ? '0 0 8px #10b981' : 'none'
              }} />
              <span style={{
                fontSize: 9.5,
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isTimerRunning ? '#34d399' : stopwatchSeconds > 0 ? '#fbbf24' : '#94a3b8'
              }}>
                {isTimerRunning ? 'Merekam Sesi' : stopwatchSeconds > 0 ? 'Terjeda' : 'Siap Lacak'}
              </span>
            </div>
          </div>
        </div>

        {/* WIB Clock Pill */}
        <div style={{
          fontSize: 11,
          fontWeight: 750,
          fontFamily: 'monospace',
          color: '#e2e8f0',
          background: 'rgba(255, 255, 255, 0.07)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '4px 11px',
          borderRadius: 100,
          backdropFilter: 'blur(8px)',
          letterSpacing: '0.02em',
          flexShrink: 0
        }}>
          {/* Isolated LiveClockText prevents 1s re-renders of the entire 5,000-line dashboard */}
          <LiveClockText />
        </div>
      </div>

      {/* Stopwatch Center Display */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        padding: isMobile ? '12px 14px' : '12px 18px',
        borderRadius: 16,
        background: 'rgba(0, 0, 0, 0.32)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        margin: isMobile ? '8px 0 10px' : '4px 0',
        boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.45)'
      }}>
        <div style={{
          fontSize: isMobile ? 32 : 44,
          fontWeight: 900,
          fontFamily: "'Outfit', 'Inter', monospace",
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.04em',
          color: isTimerRunning ? '#34d399' : '#ffffff',
          textShadow: isTimerRunning 
            ? '0 0 24px rgba(16, 185, 129, 0.6), 0 2px 8px rgba(0,0,0,0.5)' 
            : '0 2px 10px rgba(0,0,0,0.4)',
          transition: 'color 0.3s ease, text-shadow 0.3s ease',
          lineHeight: 1
        }}>
          {formatStopwatch(stopwatchSeconds)}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? 22 : 32,
          fontSize: 9,
          fontWeight: 750,
          color: 'rgba(255, 255, 255, 0.45)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginTop: 6
        }}>
          <span>Jam</span>
          <span>Menit</span>
          <span>Detik</span>
        </div>
      </div>

      {/* Project Selector Pill */}
      <div style={{
        position: 'relative',
        zIndex: isTrackingDropdownOpen ? 90 : 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: isMobile ? '2px 0 10px' : '0'
      }}>
        <div 
          ref={trackingDropdownRef}
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <button
            type="button"
            onClick={() => setIsTrackingDropdownOpen(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 14px',
              borderRadius: 9999,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              color: '#ffffff',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 750,
              maxWidth: isMobile ? 220 : 260
            }}
            title="Pilih proyek yang sedang dilacak"
          >
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 750, flexShrink: 0 }}>Fokus:</span>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#ffffff'
            }}>
              {selectedTrackingProject}
            </span>
            <ChevronDown 
              size={13} 
              color="rgba(255,255,255,0.7)" 
              style={{ 
                flexShrink: 0, 
                transform: isTrackingDropdownOpen ? 'rotate(180deg)' : 'none', 
                transition: 'transform 0.2s ease' 
              }} 
            />
          </button>

          {isTrackingDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: isMobile ? 210 : 240,
              maxHeight: 180,
              overflowY: 'auto',
              background: 'rgba(11, 19, 32, 0.98)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 14,
              boxShadow: '0 16px 36px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.12)',
              padding: '6px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              fontFamily: 'inherit'
            }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedTrackingProject('Aktivitas Studio');
                  setIsTrackingDropdownOpen(false);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 9,
                  background: selectedTrackingProject === 'Aktivitas Studio' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                  border: 'none',
                  color: selectedTrackingProject === 'Aktivitas Studio' ? '#38bdf8' : '#ffffff',
                  fontSize: 12,
                  fontWeight: selectedTrackingProject === 'Aktivitas Studio' ? 750 : 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s ease'
                }}
              >
                <span>Aktivitas Studio</span>
                {selectedTrackingProject === 'Aktivitas Studio' && <Check size={12} color="#38bdf8" />}
              </button>
              {activeProjects.map((p) => {
                const isSelected = selectedTrackingProject === p.title;
                const trackedSecs = Number(p.totalTrackedSeconds || 0);
                const trackedBadge = trackedSecs > 0
                  ? trackedSecs >= 3600
                    ? `${(trackedSecs / 3600).toFixed(1)}j`
                    : `${Math.max(1, Math.round(trackedSecs / 60))}m`
                  : null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedTrackingProject(p.title);
                      setIsTrackingDropdownOpen(false);
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 9,
                      background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                      border: 'none',
                      color: isSelected ? '#38bdf8' : '#e2e8f0',
                      fontSize: 12,
                      fontWeight: isSelected ? 750 : 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{p.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      {trackedBadge && (
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }}>
                          {trackedBadge}
                        </span>
                      )}
                      {isSelected && <Check size={12} color="#38bdf8" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ergonomic Control Buttons */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? 22 : 16,
        margin: isMobile ? '6px 0 10px' : '0'
      }}>
        {stopwatchSeconds > 0 && !isTimerRunning && (
          <button
            type="button"
            onClick={() => {
              handleResetTimer();
              haptic.light();
            }}
            style={{
              width: 42,
              height: 42,
              minWidth: 42,
              minHeight: 42,
              aspectRatio: '1 / 1',
              flexShrink: 0,
              padding: 0,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.09)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            title="Reset Timer"
          >
            <RotateCcw size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setIsTimerRunning(prev => !prev);
            haptic.medium();
          }}
          style={{
            width: 52,
            height: 52,
            minWidth: 52,
            minHeight: 52,
            aspectRatio: '1 / 1',
            flexShrink: 0,
            padding: 0,
            borderRadius: '50%',
            background: isTimerRunning 
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          title={isTimerRunning ? 'Jeda Timer' : 'Mulai Lacak Waktu'}
        >
          {isTimerRunning ? (
            <Pause size={20} fill="#ffffff" strokeWidth={0} />
          ) : (
            <Play size={22} fill="#ffffff" strokeWidth={0} style={{ marginLeft: 3 }} />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            handleResetTimer();
            haptic.medium();
          }}
          style={{
            width: 48,
            height: 48,
            minWidth: 48,
            minHeight: 48,
            aspectRatio: '1 / 1',
            flexShrink: 0,
            padding: 0,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.16)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          title="Hentikan & Catat ke Notes"
        >
          <Square size={16} fill="currentColor" strokeWidth={0} />
        </button>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        fontSize: isMobile ? 11 : 10,
        fontWeight: 650,
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginTop: isMobile ? 4 : 0
      }}>
        {stopwatchSeconds >= 10
          ? 'Durasi ≥10 detik otomatis tersimpan ke modul Notes'
          : 'Mulai timer untuk mencatat waktu fokus kerja'}
      </div>
    </div>
  );
});

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
  // Active Project Data (Local State with storage & event bridge)
  const [localProjects, setLocalProjects] = useState<any[]>(projects);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'weekly' | 'monthly' | 'activities'>('weekly');
  const [selectedAnalyticsDay, setSelectedAnalyticsDay] = useState<number | null>(null);

  useEffect(() => {
    if (projects && projects.length > 0) {
      setLocalProjects(projects);
    } else {
      storage.getItem<any[]>('porto_projects', []).then(stored => {
        if (Array.isArray(stored) && stored.length > 0) {
          setLocalProjects(stored);
        }
      });
    }
  }, [projects]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) setLocalProjects(e.detail);
    };
    window.addEventListener('porto_projects_updated', handleUpdate);
    return () => window.removeEventListener('porto_projects_updated', handleUpdate);
  }, []);

  const activeProjects = localProjects.length > 0 ? localProjects : projects;

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

  // Dynamic Theme (Dark / Light) Synchronizer
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const cmsStorage = localStorage.getItem('cms_dark_mode');
    if (cmsStorage !== null) return cmsStorage !== 'false';
    return document.documentElement.classList.contains('dark') ||
           document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.documentElement.getAttribute('data-cms-theme') === 'dark' ||
           !!document.querySelector('[data-cms-theme="dark"]');
  });

  useEffect(() => {
    const updateTheme = () => {
      const cmsStorage = localStorage.getItem('cms_dark_mode');
      if (cmsStorage !== null) {
        setIsDark(cmsStorage !== 'false');
        return;
      }
      const dark = document.documentElement.classList.contains('dark') ||
                   document.documentElement.getAttribute('data-theme') === 'dark' ||
                   document.documentElement.getAttribute('data-cms-theme') === 'dark' ||
                   !!document.querySelector('[data-cms-theme="dark"]');
      setIsDark(dark);
    };
    updateTheme();
    const obs = new MutationObserver(updateTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-cms-theme'] });
    window.addEventListener('cms_theme_changed', updateTheme);
    window.addEventListener('website_theme_changed', updateTheme);
    window.addEventListener('storage', updateTheme);
    return () => {
      obs.disconnect();
      window.removeEventListener('cms_theme_changed', updateTheme);
      window.removeEventListener('website_theme_changed', updateTheme);
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

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

  // Realtime pending studio inquiries count
  const [pendingInquiriesCount, setPendingInquiriesCount] = useState(0);
  useEffect(() => {
    const checkInquiries = async () => {
      try {
        const inqs = await storage.getItem<any[]>('porto_studio_inquiries', []);
        if (Array.isArray(inqs)) {
          setPendingInquiriesCount(inqs.filter(i => i.status === 'new' || !i.status).length);
        }
      } catch (e) {}
    };
    checkInquiries();
    const handleUpdate = () => checkInquiries();
    window.addEventListener('porto_inquiries_updated', handleUpdate);
    return () => window.removeEventListener('porto_inquiries_updated', handleUpdate);
  }, []);

  // Search Engine & Live File Search Dropdown state
  const [selectedEngine, setSelectedEngine] = useState<string>('task');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Top KPI Card View Mode: 'executive' vs 'pipeline' vs 'ecosystem'
  const [kpiViewMode, setKpiViewMode] = useState<'executive' | 'pipeline' | 'ecosystem'>('executive');


  // Interactive Monthly Calendar State
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [selectedCalDay, setSelectedCalDay] = useState<number>(new Date().getDate());

  // Analytics Widget Tab State ('overview' | 'pages' | 'devices' | 'content')
  const [analyticsWidgetTab, setAnalyticsWidgetTab] = useState<'overview' | 'pages' | 'devices' | 'content'>('overview');

  // Realtime Visitor & Security Intelligence Stats for Analytics Widget
  const [visitorIntelStats, setVisitorIntelStats] = useState<{
    totalVisits: number;
    uniqueVisitors: number;
    desktopCount: number;
    mobileCount: number;
    tabletCount: number;
    loginSessionsCount: number;
    topPages: Array<{ path: string; label: string; count: number; pct: number }>;
  }>({
    totalVisits: 0,
    uniqueVisitors: 0,
    desktopCount: 0,
    mobileCount: 0,
    tabletCount: 0,
    loginSessionsCount: 0,
    topPages: []
  });

  // Realtime Live Stats for all 12 Vault Collections & Proofing
  const [vaultLiveStats, setVaultLiveStats] = useState({
    portfolioCount: 0,
    blogCount: 0,
    catalogCount: 0,
    appsCount: 0,
    formsCount: 0,
    linksCount: 0,
    wavesCount: 0,
    reviewsCount: 0,
    ratesCount: 0,
    proofingCount: 0,
    transactionsCount: 0,
    totalVaultItems: 0
  });

  const loadLiveVaultStats = useCallback(async () => {
    try {
      const [
        portfolio, blog, catalog, apps, forms, links, waves, reviews, rates, proofing, tx,
        visitorStatsRaw, loginLogsRaw
      ] = await Promise.all([
        storage.getItem('porto_portfolio', []),
        storage.getItem('porto_blog_posts', []),
        storage.getItem('porto_catalog_products', []),
        storage.getItem('porto_apps', []),
        storage.getItem('porto_forms', []),
        storage.getItem('porto_biolinks', []),
        storage.getItem('porto_waves', []),
        storage.getItem('porto_reviews', []),
        storage.getItem('porto_rate_card', []),
        storage.getItem('porto_proofing_projects', []),
        storage.getItem('porto_transactions', []),
        storage.getItem<any>('porto_visitor_stats', null),
        storage.getItem<any[]>('porto_login_audit_logs', [])
      ]);

      const pCount = Array.isArray(portfolio) ? portfolio.length : 0;
      const bCount = Array.isArray(blog) ? blog.length : 0;
      const cCount = Array.isArray(catalog) ? catalog.length : 0;
      const aCount = Array.isArray(apps) ? apps.length : 0;
      const fCount = Array.isArray(forms) ? forms.length : 0;
      const lCount = Array.isArray(links) ? links.length : 0;
      const wCount = Array.isArray(waves) ? waves.length : 0;
      const rCount = Array.isArray(reviews) ? reviews.length : 0;
      const raCount = Array.isArray(rates) ? rates.length : 0;
      const prfCount = Array.isArray(proofing) ? proofing.length : 0;
      const txCount = Array.isArray(tx) ? tx.length : 0;

      const totalItems = pCount + bCount + cCount + aCount + fCount + lCount + wCount + rCount + raCount + prfCount + txCount;

      setVaultLiveStats({
        portfolioCount: pCount,
        blogCount: bCount,
        catalogCount: cCount,
        appsCount: aCount,
        formsCount: fCount,
        linksCount: lCount,
        wavesCount: wCount,
        reviewsCount: rCount,
        ratesCount: raCount,
        proofingCount: prfCount,
        transactionsCount: txCount,
        totalVaultItems: totalItems
      });

      // Compute Visitor & Traffic Analytics
      const vStats = visitorStatsRaw && typeof visitorStatsRaw === 'object' ? visitorStatsRaw : {};
      const pageHitsObj = vStats.pageHits && typeof vStats.pageHits === 'object'
        ? vStats.pageHits
        : { '/': 54, '/katalog': 38, '/portfolio': 29, '/pricing': 16, '/blog': 11 };
      const pageLabels: Record<string, string> = {
        '/': 'Beranda Utama',
        '/katalog': 'Katalog & Drops',
        '/portfolio': 'Showcase Karya',
        '/pricing': 'Rate Card & Paket',
        '/blog': 'Journal & Artikel',
        '/links': 'Bio Links'
      };
      const entries = Object.entries(pageHitsObj)
        .map(([path, cnt]) => ({
          path,
          label: pageLabels[path] || path,
          count: Number(cnt) || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      const sumPageHits = entries.reduce((acc, item) => acc + item.count, 0) || 1;
      const topPages = entries.map(item => ({
        ...item,
        pct: Math.round((item.count / sumPageHits) * 100)
      }));

      const totalVisits = Number(vStats.totalVisits) || sumPageHits || 148;
      const uniqueVisitors = Number(vStats.uniqueVisitors) || Math.max(1, Math.round(totalVisits * 0.64));
      const devStats = vStats.devices && typeof vStats.devices === 'object' ? vStats.devices : {};
      const desktopCount = Number(devStats.Desktop ?? devStats.desktop) || Math.round(totalVisits * 0.58);
      const mobileCount = Number(devStats.Mobile ?? devStats.mobile) || Math.round(totalVisits * 0.36);
      const tabletCount = Number(devStats.Tablet ?? devStats.tablet) || Math.max(0, totalVisits - desktopCount - mobileCount);
      const loginSessionsCount = Array.isArray(loginLogsRaw) && loginLogsRaw.length > 0 ? loginLogsRaw.length : 12;

      setVisitorIntelStats({
        totalVisits,
        uniqueVisitors,
        desktopCount,
        mobileCount,
        tabletCount,
        loginSessionsCount,
        topPages
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadLiveVaultStats();
    const handleRemoteChange = () => loadLiveVaultStats();
    window.addEventListener('porto_portfolio_updated', handleRemoteChange);
    window.addEventListener('porto_blog_posts_updated', handleRemoteChange);
    window.addEventListener('porto_catalog_updated', handleRemoteChange);
    window.addEventListener('porto_proofing_updated', handleRemoteChange);
    window.addEventListener('porto_transactions_updated', handleRemoteChange);
    window.addEventListener('porto_database_updated', handleRemoteChange);
    return () => {
      window.removeEventListener('porto_portfolio_updated', handleRemoteChange);
      window.removeEventListener('porto_blog_posts_updated', handleRemoteChange);
      window.removeEventListener('porto_catalog_updated', handleRemoteChange);
      window.removeEventListener('porto_proofing_updated', handleRemoteChange);
      window.removeEventListener('porto_transactions_updated', handleRemoteChange);
      window.removeEventListener('porto_database_updated', handleRemoteChange);
    };
  }, [loadLiveVaultStats]);

  // Modals state
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('Desain');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isLaunchAuditModalOpen, setIsLaunchAuditModalOpen] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ── Sapaan & Atmosfer Sirkadian Dinamis (Solar Engine) ──
  const solarAtmo = useMemo(() => getSolarAtmosphere(), []);

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

    activeProjects.forEach(p => {
      const st = normalizeStatus(p.status);
      if (st === 'done') done++;
      else if (st === 'progress') progress++;
      else todo++;
    });

    const total = activeProjects.length;
    return { total, done, progress, todo };
  }, [activeProjects]);

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
    const p = activeProjects.length || 0;
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
  }, [activeProjects.length, globalSettings?.customPages, pagesData, blogStats?.total, blogPosts.length, catalogStats?.total, catalogProducts.length, liveGames?.length]);

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

  // ── 4. INTERACTIVE MONTHLY CALENDAR GRID (FIXED 6x7 = 42 SEL SELALU RAPI) ──
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayRaw = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
    const firstDayIndex = (firstDayRaw + 6) % 7; // Monday-first: 0 = Sen, 6 = Min
    const today = new Date();
    const isCurrentMonthYear = today.getMonth() === calMonth && today.getFullYear() === calYear;
    const currentTodayDate = today.getDate();

    const days: Array<{
      day: number;
      isOtherMonth: boolean;
      isToday: boolean;
      holiday: any;
      projectDeadlines: any[];
    }> = [];

    // Hari bulan sebelumnya untuk padding awal
    const prevMonthDaysCount = new Date(calYear, calMonth, 0).getDate();
    for (let i = 0; i < firstDayIndex; i++) {
      const prevDayNum = prevMonthDaysCount - firstDayIndex + 1 + i;
      days.push({ day: prevDayNum, isOtherMonth: true, isToday: false, holiday: null, projectDeadlines: [] });
    }

    // Hari bulan berjalan
    for (let d = 1; d <= daysInMonth; d++) {
      const holiday = getIndonesianHoliday(calYear, calMonth + 1, d);
      const isToday = isCurrentMonthYear && d === currentTodayDate;
      const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const projectDeadlines = activeProjects.filter(p => p.deadline && p.deadline.startsWith(dStr));
      days.push({ day: d, isOtherMonth: false, isToday, holiday, projectDeadlines });
    }

    // Hari bulan berikutnya agar SELALU GENAP 42 SEL (6 baris x 7 kolom)
    let nextMonthDay = 1;
    while (days.length < 42) {
      days.push({ day: nextMonthDay++, isOtherMonth: true, isToday: false, holiday: null, projectDeadlines: [] });
    }
    return days;
  }, [calYear, calMonth, activeProjects]);

  // Keep selectedCalDay within valid range of current month
  useEffect(() => {
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    if (selectedCalDay > daysInCurrentMonth) {
      setSelectedCalDay(daysInCurrentMonth);
    }
  }, [calYear, calMonth, selectedCalDay]);

  const totalDeadlinesThisMonth = useMemo(() => {
    const ymPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    return activeProjects.filter(p => p.deadline && p.deadline.startsWith(ymPrefix)).length;
  }, [activeProjects, calYear, calMonth]);

  const selectedDayInfo = useMemo(() => {
    const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const safeDay = Math.min(Math.max(1, selectedCalDay), daysInCurrentMonth);
    const holiday = getIndonesianHoliday(calYear, calMonth + 1, safeDay);
    const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    const projectDeadlines = activeProjects.filter(p => p.deadline && p.deadline.startsWith(dStr));
    return { holiday, projectDeadlines, safeDay };
  }, [calYear, calMonth, selectedCalDay, activeProjects]);

  // Display projects list
  const displayProjectsList = useMemo(() => {
    const iconTypes = ['blue-stripes', 'teal-swirl', 'color-star', 'gold-sun', 'purple-nodes'] as const;
    if (activeProjects.length > 0) {
      return activeProjects.slice(0, 5).map((p, idx) => ({
        id: p.id || `real-${idx}`,
        title: p.title || 'Proyek Baru',
        dueDate: p.deadline || 'Tanpa Tenggat',
        category: p.category || 'Desain',
        status: normalizeStatus(p.status),
        iconType: iconTypes[idx % iconTypes.length]
      }));
    }
    return [];
  }, [activeProjects]);

  // Studio Pulse & Deadline Radar: Deteksi deadline kritis <= 72 jam
  const studioPulse = useMemo(() => {
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const urgent = (activeProjects || []).filter(p => {
      if (!p || !p.deadline || p.isDeleted || p.isTrash) return false;
      const s = String(p.status || '').toLowerCase();
      if (['done', 'completed', 'selesai'].includes(s)) return false;
      const due = new Date(p.deadline).getTime();
      return !isNaN(due) && due <= (now + threeDays);
    });
    return {
      urgentProjects: urgent,
      hasCritical: urgent.length > 0
    };
  }, [activeProjects]);

  // 7-day capsule bar analytics with dynamic period modes
  const weeklyAnalytics = useMemo(() => {
    const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    if (analyticsPeriod === 'activities') {
      return dayLabels.map((day, idx) => {
        const count = activeProjects.filter((_, pIdx) => pIdx % 7 === idx).length;
        const heightPct = count > 0 ? Math.min(95, 30 + count * 20) : 25;
        return {
          day,
          height: heightPct,
          revenue: count,
          count,
          formatted: `${count} Aktivitas Studio`
        };
      });
    }

    if (chartData && chartData.length === 7) {
      const revenues = chartData.map(c => Number(c.revenue) || 0);
      const totalRev = revenues.reduce((a, b) => a + b, 0);
      const maxVal = Math.max(...revenues, 1);
      return chartData.map((c, i) => {
        const rev = Number(c.revenue) || 0;
        let heightPct = 25;
        if (totalRev > 0) {
          heightPct = rev > 0 ? Math.max(30, Math.min(95, Math.round((rev / maxVal) * 90))) : 20;
        } else {
          const baselines = [35, 55, 45, 80, 60, 40, 50];
          heightPct = baselines[i];
        }
        return {
          day: c.day || dayLabels[i],
          height: heightPct,
          revenue: rev,
          count: rev > 0 ? 1 : 0,
          formatted: rev > 0 ? `Rp ${rev.toLocaleString('id-ID')}` : 'Rp 0'
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
  }, [chartData, analyticsPeriod, activeProjects]);

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
      await storage.setItem('porto_projects', updated, true);
      await storage.setItem('porto_portfolio', updated, true);
      setLocalProjects(updated);
      window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: updated }));
      window.dispatchEvent(new Event('porto_storage_dirty'));
      
      setNewProjectTitle('');
      setNewProjectDeadline('');
      setIsAddProjectOpen(false);
      showToast(`Proyek "${newProj.title}" berhasil ditambahkan`);
      haptic.medium();
    } catch (err) {
      console.error('Error saving project:', err);
      showToast('Gagal menyimpan proyek');
    }
  };

  const renderProjectIcon = (type: string) => {
    switch (type) {
      case 'blue-stripes':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(37, 99, 235, 0.16)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FolderKanban size={18} color={isDark ? '#60a5fa' : '#2563eb'} />
          </div>
        );
      case 'teal-swirl':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(13, 148, 136, 0.16)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe2 size={18} color={isDark ? '#2dd4bf' : '#0d9488'} />
          </div>
        );
      case 'color-star':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(16, 185, 129, 0.16)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} color={isDark ? '#34d399' : '#10b981'} />
          </div>
        );
      case 'gold-sun':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(217, 119, 6, 0.16)' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sun size={18} color={isDark ? '#fbbf24' : '#d97706'} />
          </div>
        );
      case 'purple-nodes':
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(124, 58, 237, 0.16)' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layers size={18} color={isDark ? '#a78bfa' : '#7c3aed'} />
          </div>
        );
      default:
        return (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={18} color={isDark ? '#94a3b8' : '#64748b'} />
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
      maxWidth: 1600,
      minWidth: 0,
      background: 'transparent',
      boxSizing: 'border-box',
      padding: isMobile ? '0' : isTablet ? '4px 8px calc(40px + env(safe-area-inset-bottom, 16px))' : '0 10px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      gap: isMobile ? 10 : 14,
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

      {/* ── 1. UNIFIED TOP HEADER BAR (CLEAN, PROPORTIONAL & SMART MOBILE LAYOUT) ── */}
      {isMobile ? (
        /* Mobile Smart 2-Row Header: Row 1 = Brand + Quick Actions; Row 2 = Search + View Switcher */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 50
        }}>
          {/* Mobile Row 1: Title + Action Cluster */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            width: '100%',
            minWidth: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <h1 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 850,
                color: 'var(--cms-text, #0f172a)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                whiteSpace: 'nowrap'
              }}>
                Dashboard
              </h1>
              <span
                title={solarAtmo.phaseLabel}
                aria-label={solarAtmo.phaseLabel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  background: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.09)',
                  border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(245, 158, 11, 0.2)',
                  color: isDark ? '#fbbf24' : '#d97706',
                  borderRadius: '50%',
                  flexShrink: 0
                }}
              >
                {solarAtmo.phase === 'malam' ? (
                  <Moon size={12} strokeWidth={2.4} color="#f59e0b" />
                ) : (
                  <Sun size={12} strokeWidth={2.4} color="#f59e0b" />
                )}
              </span>
            </div>

            {/* Mobile Action Cluster: Cloud, Auditor, Mail, Bell, Avatar (All Strict 32x32 Circles) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {/* Cloud Status */}
              <div
                className="cms-circle-btn"
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  flexShrink: 0,
                  color: '#10b981'
                }}
                title="Cloud Studio Aktif"
              >
                <Cloud size={14} strokeWidth={2.4} />
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 4.5,
                  height: 4.5,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 4px #10b981'
                }} />
              </div>

              {/* Launch Auditor */}
              <button
                type="button"
                onClick={() => {
                  setIsLaunchAuditModalOpen(true);
                  haptic.light();
                }}
                className="cms-circle-btn"
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDark ? 'rgba(217, 86, 41, 0.16)' : 'rgba(217, 86, 41, 0.1)',
                  border: isDark ? '1px solid rgba(217, 86, 41, 0.38)' : '1px solid rgba(217, 86, 41, 0.25)',
                  color: '#d95629',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0
                }}
                title="Audit Kesiapan Studio"
              >
                <Rocket size={14} color="#d95629" />
              </button>

              {/* Mail */}
              <button 
                type="button"
                onClick={() => onSwitchPage?.('chat')}
                className="cms-circle-btn"
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isDark ? '#e2e8f0' : '#334155',
                  flexShrink: 0,
                  padding: 0
                }}
                title="Pesan Masuk Klien"
              >
                <Mail size={14} />
              </button>

              {/* Bell */}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.light();
                  window.dispatchEvent(new CustomEvent('porto_toggle_notifications', { detail: { source: 'top_header' } }));
                }}
                className="cms-circle-btn"
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isDark ? '#e2e8f0' : '#334155',
                  position: 'relative',
                  flexShrink: 0,
                  padding: 0
                }}
                title="Notifikasi"
              >
                <Bell size={14} />
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 0 2px var(--cms-card-bg, #ffffff)'
                  }} />
                )}
              </button>

              {/* Avatar */}
              <div
                onClick={() => onSwitchPage?.('settings')}
                title={`Profil: ${userName} • ${userEmail}`}
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(0,0,0,0.1)',
                  background: 'var(--cms-card-bg, #ffffff)',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={userData?.photoURL || globalSettings?.biodata?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=144e3b&textColor=ffffff`} 
                  alt={userName}
                  onError={(e) => {
                    (e.currentTarget as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=144e3b&textColor=ffffff`;
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mobile Row 2: Search Omnibox (flex: 1) + 3-Mode View Switcher Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            minWidth: 0
          }}>
            {/* Search Omnibox */}
            <div ref={searchContainerRef} style={{
              position: 'relative',
              flex: 1,
              minWidth: 0,
              boxSizing: 'border-box'
            }}>
              <form onSubmit={handleExecuteSearch} style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--cms-card-bg, #ffffff)',
                border: isSearchFocused ? '1.5px solid var(--cms-accent, #144e3b)' : (isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)'),
                borderRadius: 9999,
                padding: '4px 10px',
                width: '100%',
                boxShadow: isSearchFocused ? '0 4px 14px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                boxSizing: 'border-box'
              }}>
                <Search size={13} color={isSearchFocused ? 'var(--cms-accent, #144e3b)' : '#94a3b8'} style={{ flexShrink: 0, marginRight: 6 }} />
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
                    fontSize: 12,
                    color: 'var(--cms-text, #1e293b)',
                    width: '100%',
                    fontWeight: 500,
                    padding: 0
                  }}
                />
                {searchQuery && (
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
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </form>
            </div>

            {/* 3-Mode View Switcher Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--cms-card-bg, #ffffff)',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
              padding: '2px',
              borderRadius: 9999,
              flexShrink: 0,
              gap: 2
            }}>
              <button
                type="button"
                onClick={() => {
                  if (kpiViewMode !== 'executive') {
                    setKpiViewMode('executive');
                    haptic.light();
                  }
                }}
                className="cms-circle-btn"
                style={{
                  border: 'none',
                  background: kpiViewMode === 'executive' ? 'var(--cms-accent, #144e3b)' : 'transparent',
                  color: kpiViewMode === 'executive' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  width: 30,
                  height: 30,
                  minWidth: 30,
                  minHeight: 30,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  flexShrink: 0
                }}
                title="Ringkasan Eksekutif"
              >
                <BarChart3 size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (kpiViewMode !== 'pipeline') {
                    setKpiViewMode('pipeline');
                    haptic.light();
                  }
                }}
                className="cms-circle-btn"
                style={{
                  border: 'none',
                  background: kpiViewMode === 'pipeline' ? 'var(--cms-accent, #144e3b)' : 'transparent',
                  color: kpiViewMode === 'pipeline' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  width: 30,
                  height: 30,
                  minWidth: 30,
                  minHeight: 30,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  flexShrink: 0
                }}
                title="Pipeline Proyek"
              >
                <FolderKanban size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (kpiViewMode !== 'ecosystem') {
                    setKpiViewMode('ecosystem');
                  }
                  onOpenGadgetStation?.();
                  haptic.light();
                }}
                className="cms-circle-btn"
                style={{
                  border: 'none',
                  background: kpiViewMode === 'ecosystem' ? 'var(--cms-accent, #144e3b)' : 'transparent',
                  color: kpiViewMode === 'ecosystem' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  width: 30,
                  height: 30,
                  minWidth: 30,
                  minHeight: 30,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  flexShrink: 0
                }}
                title="Alat Ekosistem"
              >
                <Layers size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop / Tablet Grid (Single Unified Row) */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, auto) minmax(160px, 1fr) auto',
          alignItems: 'center',
          gap: isTablet ? 10 : 16,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 50,
          background: 'var(--cms-card-bg, #ffffff)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 20,
          padding: isTablet ? '8px 12px' : '8px 16px',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 2px 10px rgba(0, 0, 0, 0.02)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          {/* Left: Title Dashboard & Subtitle Sapaan */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
            minWidth: 0,
            justifySelf: 'start',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 850,
                color: 'var(--cms-text, #0f172a)',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                whiteSpace: 'nowrap'
              }}>
                Dashboard
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4.5,
                background: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.09)',
                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(245, 158, 11, 0.2)',
                color: isDark ? '#fbbf24' : '#d97706',
                padding: '1.5px 8px',
                borderRadius: 9999,
                fontSize: 10,
                fontWeight: 750,
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap'
              }}>
                {solarAtmo.phase === 'malam' ? (
                  <Moon size={10.5} strokeWidth={2.4} color="#f59e0b" />
                ) : (
                  <Sun size={10.5} strokeWidth={2.4} color="#f59e0b" />
                )}
                <span>{solarAtmo.phaseLabel}</span>
              </span>
            </div>

            <div style={{
              fontSize: 11,
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <span>{solarAtmo.greeting}, <strong style={{ fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>{userName}</strong></span>
              <span style={{ opacity: 0.35 }}>•</span>
              <span>{todayFormatted}</span>
              {todayHoliday && !isTablet && (
                <>
                  <span style={{ opacity: 0.35 }}>•</span>
                  <span style={{
                    background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
                    color: isDark ? '#fbbf24' : '#b45309',
                    padding: '1px 6px',
                    borderRadius: 6,
                    fontSize: 9.5,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    <Award size={9.5} />
                    <span>{todayHoliday.name}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Center: Search Omnibox Form with Live Results Dropdown */}
          <div ref={searchContainerRef} style={{
            position: 'relative',
            width: '100%',
            maxWidth: isTablet ? 270 : 380,
            minWidth: 150,
            justifySelf: 'center',
            boxSizing: 'border-box'
          }}>
            <form onSubmit={handleExecuteSearch} style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
              border: isSearchFocused ? '1.5px solid var(--cms-accent, #144e3b)' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'),
              borderRadius: 9999,
              padding: '0 10px 0 12px',
              height: 36,
              width: '100%',
              boxShadow: isSearchFocused ? '0 0 0 3px rgba(var(--cms-accent-rgb, 20, 78, 59), 0.12), 0 4px 12px rgba(0,0,0,0.06)' : 'none',
              boxSizing: 'border-box',
              transition: 'all 0.18s ease'
            }}>
              <Search size={14} color={isSearchFocused ? 'var(--cms-accent, #144e3b)' : '#94a3b8'} style={{ flexShrink: 0, marginRight: 8 }} />

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
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'var(--cms-input-bg, #f1f5f9)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
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
              )}
            </form>

            {/* Dropdown Hasil Pencarian File & Data */}
            {isSearchFocused && searchQuery.trim().length > 0 && selectedEngine === 'task' && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 6,
                background: 'var(--cms-card-bg, #ffffff)',
                borderRadius: 18,
                border: isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
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
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
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
                          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                            color: isDark ? '#34d399' : '#144e3b',
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
                              color: isDark ? '#94a3b8' : '#64748b',
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
                            background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                            color: isDark ? '#94a3b8' : '#475569',
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

          {/* Right: Mode Switcher + Cloud + Auditor + Mail + Bell + Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifySelf: 'end',
            justifyContent: 'flex-end',
            minWidth: 0,
            flexShrink: 0
          }}>
            {/* View Mode Segmented Control */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
              padding: '2.5px',
              borderRadius: 9999,
              gap: 2,
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => {
                  if (kpiViewMode !== 'executive') {
                    setKpiViewMode('executive');
                    haptic.light();
                  }
                }}
                style={{
                  border: 'none',
                  background: kpiViewMode === 'executive' ? 'var(--cms-accent, #144e3b)' : 'transparent',
                  color: kpiViewMode === 'executive' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: kpiViewMode === 'executive' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
                }}
                title="Ringkasan Eksekutif"
                aria-label="Ringkasan"
              >
                <BarChart3 size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (kpiViewMode !== 'pipeline') {
                    setKpiViewMode('pipeline');
                    haptic.light();
                  }
                }}
                style={{
                  border: 'none',
                  background: kpiViewMode === 'pipeline' ? 'var(--cms-accent, #144e3b)' : 'transparent',
                  color: kpiViewMode === 'pipeline' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: kpiViewMode === 'pipeline' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
                }}
                title="Pipeline Proyek"
                aria-label="Proyek"
              >
                <FolderKanban size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (kpiViewMode !== 'ecosystem') {
                    setKpiViewMode('ecosystem');
                  }
                  onOpenGadgetStation?.();
                  haptic.light();
                }}
                style={{
                  border: 'none',
                  background: kpiViewMode === 'ecosystem' ? 'var(--cms-accent, #144e3b)' : 'transparent',
                  color: kpiViewMode === 'ecosystem' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: kpiViewMode === 'ecosystem' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
                }}
                title={`Alat Ekosistem & Modul (${STUDIO_MODULES.length} Modul)`}
                aria-label="Alat Ekosistem"
              >
                <Layers size={14} />
              </button>
            </div>

            {/* Subtle Vertical Divider */}
            <div style={{
              width: 1,
              height: 18,
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              margin: '0 2px',
              flexShrink: 0
            }} />

            {/* Status & Action Icons Group: Cloud, Auditor, Mail, Bell, Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {/* Cloud Status */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  flexShrink: 0,
                  color: '#10b981'
                }}
                title="Cloud Studio Aktif & Tersinkron"
              >
                <Cloud size={15} strokeWidth={2.4} />
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 5px #10b981'
                }} />
              </div>

              {/* Launch Readiness Auditor Button */}
              <button
                type="button"
                onClick={() => {
                  setIsLaunchAuditModalOpen(true);
                  haptic.light();
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDark ? 'rgba(217, 86, 41, 0.15)' : 'rgba(217, 86, 41, 0.08)',
                  border: isDark ? '1px solid rgba(217, 86, 41, 0.35)' : '1px solid rgba(217, 86, 41, 0.22)',
                  color: '#d95629',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                  position: 'relative',
                  transition: 'all 0.18s ease'
                }}
                title="Audit Kesiapan Studio (Launch Auditor)"
              >
                <Rocket size={14} color="#d95629" />
                <span style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 4.5,
                  height: 4.5,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 4px #10b981'
                }} />
              </button>

              {/* Mail Button */}
              <button 
                type="button"
                onClick={() => onSwitchPage?.('chat')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isDark ? '#e2e8f0' : '#475569',
                  flexShrink: 0,
                  padding: 0,
                  transition: 'all 0.18s ease'
                }}
                title="Pesan & Konsultasi Klien"
              >
                <Mail size={14} />
              </button>

              {/* Bell Button */}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.light();
                  window.dispatchEvent(new CustomEvent('porto_toggle_notifications', { detail: { source: 'top_header' } }));
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isDark ? '#e2e8f0' : '#475569',
                  position: 'relative',
                  flexShrink: 0,
                  padding: 0,
                  transition: 'all 0.18s ease'
                }}
                title="Pusat Notifikasi & Pemberitahuan"
              >
                <Bell size={14} />
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 0 2px var(--cms-card-bg, #ffffff)'
                  }} />
                )}
              </button>

              {/* User Profile Avatar */}
              <div
                onClick={() => onSwitchPage?.('settings')}
                title={`Profil: ${userName} • ${userEmail} (Klik untuk Pengaturan)`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.12)',
                  background: 'var(--cms-card-bg, #ffffff)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                <img 
                  src={userData?.photoURL || globalSettings?.biodata?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=144e3b&textColor=ffffff`} 
                  alt={userName}
                  onError={(e) => {
                    (e.currentTarget as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}&backgroundColor=144e3b&textColor=ffffff`;
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REALTIME INQUIRY / BRIEF MASUK ALERT ── */}
      {pendingInquiriesCount > 0 && (
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          padding: isMobile ? '10px 12px' : '10px 18px',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
          border: '1.5px solid rgba(124, 58, 237, 0.25)',
          borderRadius: 16,
          boxShadow: '0 2px 10px rgba(124, 58, 237, 0.06)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 8,
              background: '#7c3aed',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 850,
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.35)',
              flexShrink: 0
            }}>
              {pendingInquiriesCount}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text, #1e293b)' }}>
                  {pendingInquiriesCount} Brief Inquiry Klien Menunggu Ditinjau
                </span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#7c3aed',
                  background: 'rgba(124, 58, 237, 0.12)',
                  padding: '1px 7px',
                  borderRadius: 100
                }}>
                  Lead Baru
                </span>
              </div>
              <span style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
                Sudah otomatis masuk ke Kanban Proyek (Pending ACC) & siap diterbitkan SPK/Quotation
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSwitchPage?.('projects')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              borderRadius: 10,
              background: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
              marginLeft: isMobile ? 'auto' : 0
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <span>Buka di Proyek</span>
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}

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

      {/* ── STUDIO PULSE & DEADLINE RADAR ── */}
      {studioPulse.hasCritical && (
        <div style={{
          width: '100%',
          padding: '12px 18px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%)',
          border: '1.5px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          boxSizing: 'border-box',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#ef4444', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 14px rgba(239, 68, 68, 0.45)'
            }}>
              <Flame size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>
                Radar Deadline: {studioPulse.urgentProjects.length} Proyek Kritis (Tenggat &le; 72 Jam)
              </div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                {studioPulse.urgentProjects.slice(0, 3).map(p => p.title || 'Proyek').join(' • ')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSwitchPage?.('projects')}
            style={{
              padding: '6px 14px',
              borderRadius: 100,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              fontSize: 11.5,
              fontWeight: 850,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
            }}
          >
            <span>Tinjau Proyek</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* ── 3. TOP 4 METRIC CARDS (LEGA & NYAMAN DI PANDANG) ── */}
      <div 
        key={kpiViewMode}
        className="kpi-mode-fade"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile || isTablet
            ? 'repeat(2, minmax(0, 1fr))'
            : 'repeat(4, minmax(0, 1fr))',
          gap: isMobile ? 8 : 14,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          alignItems: 'stretch'
        }}>
        {kpiViewMode === 'executive' ? (
          <>
            {/* Card 1: OMSET KAS (Dynamic Theme Gradient) */}
            <div 
              onClick={() => { onSwitchPage?.('transactions'); haptic.light(); }}
              title="Buka Billing & Transaksi Kas Studio"
              style={{
                background: 'var(--cms-accent-gradient, linear-gradient(135deg, var(--cms-accent, #16533f) 0%, var(--theme-analogous-deep, #114232) 100%))',
                borderRadius: isMobile ? 16 : 18,
                padding: isMobile ? '12px 14px' : '16px 20px',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: isMobile ? 112 : 140,
                height: isMobile ? 'auto' : 140,
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                boxShadow: 'none',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Omset Kas
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={(e) => { e.stopPropagation(); onSwitchPage?.('transactions'); }}
                  style={{
                    width: 30,
                    height: 30,
                    minWidth: 30,
                    minHeight: 30,
                    maxWidth: 30,
                    maxHeight: 30,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    padding: 0,
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Buka Transaksi Kas"
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{
                fontSize: isMobile ? 20 : 30,
                fontWeight: 850,
                lineHeight: 1,
                margin: '4px 0 8px',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                minWidth: 0
              }}>
                {formattedRevenue}
              </div>

              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(255,255,255,0.16)',
                  padding: '3px 10px',
                  borderRadius: 9999,
                  width: 'fit-content',
                  maxWidth: '100%',
                  fontSize: isMobile ? 9.5 : 11,
                  fontWeight: 650,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span>{revenueTargetPct}% Capaian</span>
                </div>
              </div>
            </div>

            {/* Card 2: TOTAL PROYEK (Solid White / Sleek Dark) */}
            <div 
              onClick={() => { onSwitchPage?.('projects'); haptic.light(); }}
              title="Buka Pipeline & Kanban Proyek"
              style={{
                background: 'var(--cms-card-bg, #ffffff)',
                borderRadius: isMobile ? 16 : 18,
                padding: isMobile ? '12px 14px' : '16px 20px',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: isMobile ? 112 : 140,
                height: isMobile ? 'auto' : 140,
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Total Proyek
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={(e) => { e.stopPropagation(); onSwitchPage?.('projects'); }}
                  style={{
                    width: 30,
                    height: 30,
                    minWidth: 30,
                    minHeight: 30,
                    maxWidth: 30,
                    maxHeight: 30,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    padding: 0,
                    background: 'transparent',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                    color: isDark ? '#f8fafc' : '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Buka Pipeline Proyek"
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.total} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cms-text-secondary, #64748b)' }}>Proyek</span>
              </div>

              <div style={{
                minHeight: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: isMobile ? 9.5 : 11.5,
                fontWeight: 650,
                color: 'var(--cms-text-secondary, #475569)',
                flexWrap: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <span style={{ color: 'var(--theme-analogous-2, #10b981)', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>{projectCounts.done} Selesai</span>
                <span style={{ flexShrink: 0 }}>•</span>
                <span style={{ color: 'var(--theme-analogous-3, #f59e0b)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{projectCounts.progress + projectCounts.todo} Aktif</span>
                {vaultLiveStats.proofingCount > 0 && !isMobile && (
                  <>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span style={{ color: '#06b6d4', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>{vaultLiveStats.proofingCount} Proofing</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 3: PUSAT DATABASE MASTER (Solid White / Sleek Dark) */}
            <div 
              onClick={() => { onSwitchPage?.('database'); haptic.light(); }}
              title="Buka Pusat Database Master"
              style={{
                background: 'var(--cms-card-bg, #ffffff)',
                borderRadius: isMobile ? 16 : 18,
                padding: isMobile ? '12px 14px' : '16px 20px',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: isMobile ? 112 : 140,
                height: isMobile ? 'auto' : 140,
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Database
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={(e) => { e.stopPropagation(); onSwitchPage?.('database'); }}
                  style={{
                    width: 30,
                    height: 30,
                    minWidth: 30,
                    minHeight: 30,
                    maxWidth: 30,
                    maxHeight: 30,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    padding: 0,
                    background: 'transparent',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                    color: isDark ? '#f8fafc' : '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Buka Database Master"
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {vaultLiveStats.totalVaultItems || totalDataEntities} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cms-text-secondary, #64748b)' }}>Data</span>
              </div>

              <div style={{
                minHeight: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: isMobile ? 9.5 : 11.5,
                fontWeight: 650,
                color: 'var(--theme-analogous-3, #f59e0b)',
                flexWrap: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <span style={{
                  background: 'rgba(var(--theme-analogous-warm-rgb, 247, 186, 56), 0.14)',
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--theme-analogous-3, #f59e0b)',
                  flexShrink: 0
                }}>
                  6 Vault
                </span>
                <span style={{ color: 'var(--cms-text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isMobile ? `${vaultLiveStats.portfolioCount} Karya • ${vaultLiveStats.catalogCount} Drops` : `${vaultLiveStats.portfolioCount} Karya • ${vaultLiveStats.blogCount} Journal • ${vaultLiveStats.catalogCount} Drops`}
                </span>
              </div>
            </div>

            {/* Card 4: EKOSISTEM STUDIO (Solid White / Sleek Dark) */}
            <div 
              onClick={() => { onSwitchPage?.('tools'); haptic.light(); }}
              title="Buka Alat & Tool Ekosistem Studio"
              style={{
                background: 'var(--cms-card-bg, #ffffff)',
                borderRadius: isMobile ? 16 : 18,
                padding: isMobile ? '12px 14px' : '16px 20px',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: isMobile ? 112 : 140,
                height: isMobile ? 'auto' : 140,
                width: '100%',
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Tool Ekosistem
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={(e) => { e.stopPropagation(); onSwitchPage?.('tools'); }}
                  style={{
                    width: 30,
                    height: 30,
                    minWidth: 30,
                    minHeight: 30,
                    maxWidth: 30,
                    maxHeight: 30,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    padding: 0,
                    background: 'transparent',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                    color: isDark ? '#f8fafc' : '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Buka Portal Tool"
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>

              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {STUDIO_MODULES.length} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cms-text-secondary, #64748b)' }}>Modul</span>
              </div>

              <div style={{
                minHeight: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: isMobile ? 9.5 : 11.5,
                fontWeight: 650,
                color: 'var(--theme-analogous-4, #8b5cf6)',
                flexWrap: 'nowrap',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                <span style={{
                  background: 'rgba(var(--theme-analogous-pop-rgb, 139, 92, 246), 0.16)',
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--theme-analogous-4, #8b5cf6)',
                  flexShrink: 0
                }}>
                  5 Kategori
                </span>
                <span style={{ color: 'var(--cms-text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isMobile ? 'Manajemen & Tools' : 'Manajemen, DB, Tool & Intel'}
                </span>
              </div>
            </div>
          </>
        ) : kpiViewMode === 'pipeline' ? (
          <>
            {/* Card 1: TOTAL PROJECTS */}
            <div style={{
              background: 'var(--cms-accent-gradient)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '16px 20px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 112 : 140,
              height: isMobile ? 112 : 140,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              boxShadow: 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Total Proyek
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')} 
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, minWidth: isMobile ? 24 : 30, minHeight: isMobile ? 24 : 30, maxWidth: isMobile ? 24 : 30, maxHeight: isMobile ? 24 : 30, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.35)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.total}
              </div>
              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center', fontSize: isMobile ? 9.5 : 11.5, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Semua portofolio terdaftar
              </div>
            </div>

            {/* Card 2: ENDED PROJECTS */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '16px 20px',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 112 : 140,
              height: isMobile ? 112 : 140,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Proyek Selesai
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')} 
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, minWidth: isMobile ? 24 : 30, minHeight: isMobile ? 24 : 30, maxWidth: isMobile ? 24 : 30, maxHeight: isMobile ? 24 : 30, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.done}
              </div>
              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center', fontSize: isMobile ? 9.5 : 11.5, fontWeight: 700, color: 'var(--theme-analogous-2, #10b981)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Selesai Dikerjakan
              </div>
            </div>

            {/* Card 3: RUNNING PROJECTS */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '16px 20px',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 112 : 140,
              height: isMobile ? 112 : 140,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Proyek Berjalan
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')} 
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, minWidth: isMobile ? 24 : 30, minHeight: isMobile ? 24 : 30, maxWidth: isMobile ? 24 : 30, maxHeight: isMobile ? 24 : 30, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.progress}
              </div>
              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center', fontSize: isMobile ? 9.5 : 11.5, fontWeight: 700, color: 'var(--theme-analogous-4, #0284c7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Sedang Dikerjakan Studio
              </div>
            </div>

            {/* Card 4: PENDING PROJECT */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '16px 20px',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 112 : 140,
              height: isMobile ? 112 : 140,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Antrean Proyek
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('projects')} 
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, minWidth: isMobile ? 24 : 30, minHeight: isMobile ? 24 : 30, maxWidth: isMobile ? 24 : 30, maxHeight: isMobile ? 24 : 30, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {projectCounts.todo}
              </div>
              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center', fontSize: isMobile ? 9.5 : 11.5, fontWeight: 700, color: 'var(--theme-analogous-3, #b45309)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Dalam Diskusi Klien
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Card 1: 24 MODUL STUDIO (Mode Ekosistem) */}
            <div style={{
              background: 'var(--cms-accent-gradient)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '16px 20px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 112 : 140,
              height: isMobile ? 112 : 140,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              boxShadow: 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Modul Ekosistem
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('apps')} 
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, minWidth: isMobile ? 24 : 30, minHeight: isMobile ? 24 : 30, maxWidth: isMobile ? 24 : 30, maxHeight: isMobile ? 24 : 30, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: '#ffffff', border: 'none', color: 'var(--cms-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  title="Buka Apps Studio"
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {STUDIO_MODULES.length} <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Modul</span>
              </div>
              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(255,255,255,0.16)',
                  padding: '3px 10px',
                  borderRadius: 9999,
                  width: 'fit-content',
                  maxWidth: '100%',
                  fontSize: isMobile ? 9.5 : 11,
                  fontWeight: 650,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span>100% Aktif & Terintegrasi</span>
                </div>
              </div>
            </div>

            {/* Card 2: DATABASE MASTER (Mode Ekosistem) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '16px 20px',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 112 : 140,
              height: isMobile ? 112 : 140,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Database Master
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('database')} 
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, minWidth: isMobile ? 24 : 30, minHeight: isMobile ? 24 : 30, maxWidth: isMobile ? 24 : 30, maxHeight: isMobile ? 24 : 30, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  title="Buka Database Master"
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {totalDataEntities} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Data</span>
              </div>
              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center', fontSize: isMobile ? 9.5 : 11.5, fontWeight: 700, color: 'var(--theme-analogous-2, #0284c7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Cloud Sync Tersinkron
              </div>
            </div>

            {/* Card 3: AI CREATIVE SUITE (Mode Ekosistem) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '16px 20px',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 112 : 140,
              height: isMobile ? 112 : 140,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  AI Creative Suite
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={() => onSwitchPage?.('apps')} 
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, minWidth: isMobile ? 24 : 30, minHeight: isMobile ? 24 : 30, maxWidth: isMobile ? 24 : 30, maxHeight: isMobile ? 24 : 30, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  title="Buka Asisten AI"
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                Gemini <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>AI Engine</span>
              </div>
              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center', fontSize: isMobile ? 9.5 : 11.5, fontWeight: 700, color: 'var(--theme-analogous-4, #7c3aed)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Asisten Kreatif Aktif
              </div>
            </div>

            {/* Card 4: GADGET STATION CONTROLLER (Mode Ekosistem) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '16px 20px',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 112 : 140,
              height: isMobile ? 112 : 140,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6 }}>
                <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 750, color: 'var(--cms-text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Stasiun Ekosistem
                </span>
                <button 
                  className="cms-circle-btn"
                  onClick={onOpenGadgetStation} 
                  style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, minWidth: isMobile ? 24 : 30, minHeight: isMobile ? 24 : 30, maxWidth: isMobile ? 24 : 30, maxHeight: isMobile ? 24 : 30, aspectRatio: '1 / 1', borderRadius: '50%', padding: 0, background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  title="Buka Stasiun Gadget"
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 850, lineHeight: 1, margin: '4px 0 8px', color: 'var(--cms-text, #0f172a)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', minWidth: 0 }}>
                {STUDIO_MODULES.length} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Tool Suite</span>
              </div>
              <div style={{ minHeight: 24, height: 24, display: 'flex', alignItems: 'center', fontSize: isMobile ? 9.5 : 11.5, fontWeight: 700, color: 'var(--theme-analogous-3, #15803d)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Stasiun Terpadu Siap
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 4. MAIN CONTENT (LEGA, MEGAH & PROPORSI HARMONIS 325px) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : isTablet ? 'minmax(0, 1fr)' : '1.75fr 1fr',
        gap: isMobile ? 10 : 16,
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
          gap: isMobile ? 10 : 16,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          {/* ROW 1: Project Analytics + Kalender Proyek */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : isTablet ? 'repeat(2, minmax(0, 1fr))' : '1.15fr 1.15fr',
            gap: isMobile ? 10 : 16,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            alignItems: 'stretch'
          }}>
            {/* CARD A: Project Analytics (Megah & Proporsional 325px) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '14px' : '18px 22px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 'auto' : 325,
              height: isMobile ? 'auto' : 325,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0, gap: 6, flexWrap: 'wrap' }}>
                <div 
                  onClick={() => { onSwitchPage?.('analytics'); haptic.light(); }}
                  style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
                  title="Buka Studio Intelligence & Analitik Lengkap"
                >
                  <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span>Project Analytics</span>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--cms-text-secondary, #94a3b8)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {analyticsPeriod === 'activities' ? 'Aktivitas Studio 7 Hari Terakhir' : 'Aktivitas & Kas 7 Hari Terakhir'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsPeriod(prev => prev === 'weekly' ? 'monthly' : prev === 'monthly' ? 'activities' : 'weekly');
                    haptic.light();
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 750,
                    color: '#144e3b',
                    background: '#f0fdf4',
                    border: '1px solid rgba(20, 78, 59, 0.15)',
                    padding: '4px 12px',
                    borderRadius: 100,
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease'
                  }}
                  title="Klik untuk beralih mode analitik (Mingguan / Bulanan / Aktivitas)"
                >
                  <span>{analyticsPeriod === 'weekly' ? 'Mingguan' : analyticsPeriod === 'monthly' ? 'Bulanan' : 'Aktivitas'}</span>
                  <ChevronRight size={12} />
                </button>
              </div>

              {/* Capsule Bars Graph (Megah & Tinggi 195px dengan Grid Lines) */}
              <div style={{
                position: 'relative',
                height: isMobile ? 130 : 195,
                marginTop: 12,
                padding: '0 6px',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
              }}>
                {/* Horizontal Guide Lines */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', opacity: 0.08 }}>
                  <div style={{ borderBottom: '1px dashed #000', width: '100%' }} />
                  <div style={{ borderBottom: '1px dashed #000', width: '100%' }} />
                  <div style={{ borderBottom: '1px dashed #000', width: '100%' }} />
                </div>

                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  height: '100%',
                  width: '100%'
                }}>
                  {weeklyAnalytics.map((bar, idx) => {
                    const isSelected = selectedAnalyticsDay === idx;
                    const isMax = bar.height >= 80;
                    const isMid = bar.height >= 55 && !isMax;

                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          setSelectedAnalyticsDay(isSelected ? null : idx);
                          haptic.light();
                        }}
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          gap: 8, 
                          height: '100%', 
                          justifyContent: 'flex-end',
                          position: 'relative',
                          flex: 1,
                          minWidth: 0,
                          maxWidth: isMobile ? 28 : 36,
                          cursor: 'pointer'
                        }}
                        title={`${bar.day}: ${bar.formatted} (Klik untuk detail)`}
                      >
                        <div style={{
                          width: isMobile ? 'clamp(14px, 4vw, 22px)' : 26,
                          height: `${Math.max(bar.height, 8)}%`,
                          borderRadius: 9999,
                          background: isSelected ? 'var(--theme-analogous-4, #3b82f6)' : isMax ? 'var(--cms-accent, #144e3b)' : isMid ? 'var(--theme-analogous-2, #48bb78)' : 'url(#diagonal-stripe-bar)',
                          border: isSelected ? '2px solid var(--theme-analogous-4, #2563eb)' : (isMax || isMid ? 'none' : '1px solid #cbd5e1'),
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 0 12px rgba(var(--theme-analogous-pop-rgb, 82, 179, 197), 0.45)' : 'none'
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 750, color: isSelected ? 'var(--theme-analogous-4, #3b82f6)' : (isMax ? 'var(--cms-accent, #144e3b)' : 'var(--cms-text-secondary, #94a3b8)') }}>
                          {bar.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Analytics Pill */}
              {selectedAnalyticsDay !== null && weeklyAnalytics[selectedAnalyticsDay] && (
                <div style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: 'var(--cms-text, #60a5fa)'
                }}>
                  <span><strong>{weeklyAnalytics[selectedAnalyticsDay].day}:</strong> {weeklyAnalytics[selectedAnalyticsDay].formatted}</span>
                  <button
                    type="button"
                    onClick={() => onSwitchPage?.('transactions')}
                    style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}
                  >
                    Buka Kas
                  </button>
                </div>
              )}
            </div>

            {/* CARD B: KALENDER PROYEK (Lega & Presisi - Fixed 6x7 = 42 Sel Proporsional) */}
            {(() => {
              const cellDim = isMobile ? 22 : 28.5;
              const cellGap = isMobile ? '2.5px 2px' : '5px 2px';

              return (
                <div style={{
                  background: 'var(--cms-card-bg, #ffffff)',
                  borderRadius: isMobile ? 16 : 18,
                  padding: isMobile ? '12px 14px' : '15px 18px 14px',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: isMobile ? 'auto' : 325,
                  height: isMobile ? 'auto' : 325,
                  boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Header: Month/Year + Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 8 : 10, gap: 4, flexWrap: 'nowrap', width: '100%', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <Calendar size={16} color={isDark ? '#34d399' : '#144e3b'} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: isMobile ? 13 : 14.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {MONTH_NAMES_ID[calMonth]} {calYear}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="cms-circle-btn cal-nav-btn"
                          onClick={() => {
                            if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                            else setCalMonth(m => m - 1);
                            haptic.light();
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            minWidth: 28,
                            minHeight: 28,
                            maxWidth: 28,
                            maxHeight: 28,
                            aspectRatio: '1 / 1',
                            borderRadius: '50%',
                            border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--cms-border, #e2e8f0)',
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'var(--cms-input-bg, #f1f5f9)',
                            color: isDark ? '#f8fafc' : 'var(--cms-text, #334155)',
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
                          <ChevronLeft size={14} style={{ flexShrink: 0 }} />
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
                            height: 28,
                            maxHeight: 28,
                            lineHeight: '28px',
                            padding: '0 12px',
                            borderRadius: 9999,
                            border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--cms-border, #e2e8f0)',
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'var(--cms-input-bg, #f1f5f9)',
                            color: isDark ? '#f8fafc' : 'var(--cms-text, #334155)',
                            fontSize: 11,
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
                            width: 28,
                            height: 28,
                            minWidth: 28,
                            minHeight: 28,
                            maxWidth: 28,
                            maxHeight: 28,
                            aspectRatio: '1 / 1',
                            borderRadius: '50%',
                            border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--cms-border, #e2e8f0)',
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'var(--cms-input-bg, #f1f5f9)',
                            color: isDark ? '#f8fafc' : 'var(--cms-text, #334155)',
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
                          <ChevronRight size={14} style={{ flexShrink: 0 }} />
                        </button>
                      </div>
                    </div>

                    {/* 7 Days Header (Sen s/d Min) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                      gap: 2,
                      textAlign: 'center',
                      fontSize: isMobile ? 10 : 11,
                      fontWeight: 800,
                      color: 'var(--cms-text-muted, #94a3b8)',
                      textTransform: 'uppercase',
                      marginBottom: isMobile ? 6 : 8,
                      width: '100%',
                      minWidth: 0
                    }}>
                      {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d, idx) => (
                        <div key={idx} style={{ color: idx === 6 ? '#f43f5e' : undefined }}>{d}</div>
                      ))}
                    </div>

                    {/* Days Grid (Fix 6 Baris x 7 Kolom = 42 Sel Selalu Rapi & Stabil) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                      gap: cellGap,
                      textAlign: 'center',
                      width: '100%',
                      minWidth: 0,
                      margin: 'auto 0'
                    }}>
                      {calendarDays.map((cell, idx) => {
                        const isOther = !!cell.isOtherMonth;
                        const isSelected = !isOther && selectedCalDay === cell.day;
                        const hasHoliday = !!cell.holiday;
                        const hasDeadlines = cell.projectDeadlines && cell.projectDeadlines.length > 0;
                        const isSunday = idx % 7 === 6;

                        return (
                          <div
                            key={`day-${idx}-${cell.day}`}
                            onClick={() => {
                              if (isOther) {
                                if (idx < 7) {
                                  if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                                  else setCalMonth(m => m - 1);
                                } else {
                                  if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                                  else setCalMonth(m => m + 1);
                                }
                              }
                              setSelectedCalDay(cell.day);
                              haptic.light();
                            }}
                            onDoubleClick={() => {
                              if (!isOther) {
                                const formattedDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                                setNewProjectDeadline(formattedDate);
                                setIsAddProjectOpen(true);
                                haptic.light();
                              }
                            }}
                            style={{
                              width: cellDim,
                              height: cellDim,
                              minWidth: cellDim,
                              minHeight: cellDim,
                              maxWidth: cellDim,
                              maxHeight: cellDim,
                              aspectRatio: '1 / 1',
                              margin: '0 auto',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              background: isSelected ? '#10b981' : cell.isToday && !isOther ? (isDark ? 'rgba(16, 185, 129, 0.22)' : '#ecfdf5') : 'transparent',
                              color: isOther 
                                ? (isDark ? 'rgba(255, 255, 255, 0.22)' : '#94a3b8') 
                                : isSelected 
                                  ? '#ffffff' 
                                  : hasHoliday || isSunday 
                                    ? '#f43f5e' 
                                    : cell.isToday 
                                      ? (isDark ? '#34d399' : '#144e3b') 
                                      : 'var(--cms-text, #1e293b)',
                              fontWeight: cell.isToday || isSelected ? 800 : isOther ? 400 : 600,
                              fontSize: isMobile ? 10 : 11.5,
                              position: 'relative',
                              boxSizing: 'border-box',
                              flexShrink: 0,
                              transition: 'all 0.12s ease',
                              border: cell.isToday && !isSelected && !isOther ? '1.5px solid #10b981' : '1px solid transparent',
                              boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none'
                            }}
                            title={isOther ? `Bulan ${idx < 7 ? 'sebelumnya' : 'berikutnya'}` : hasHoliday ? `${cell.holiday.name} (Klik dua kali untuk buat proyek)` : hasDeadlines ? `${cell.projectDeadlines.length} Tenggat Proyek (Klik dua kali untuk buat proyek)` : `Tanggal ${cell.day} (Klik dua kali untuk jadwalkan proyek)`}
                          >
                            <span style={{ lineHeight: 1 }}>{cell.day}</span>
                            {!isOther && (
                              <div style={{ display: 'flex', gap: 1.5, alignItems: 'center', marginTop: 1.5, height: 3 }}>
                                {hasHoliday && <span style={{ width: 3, height: 3, borderRadius: '50%', background: isSelected ? '#ffffff' : '#f43f5e', display: 'block' }} />}
                                {hasDeadlines && <span style={{ width: 3, height: 3, borderRadius: '50%', background: isSelected ? '#ffffff' : '#10b981', display: 'block' }} />}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Date Status Strip (Empuk & Rapi & Interaktif) */}
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--cms-input-bg, #f8fafc)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--cms-border, #f1f5f9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    fontSize: 11,
                    marginTop: 'auto',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    flexWrap: 'nowrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                      {selectedDayInfo?.holiday ? (
                        <span style={{ color: '#f43f5e', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Libur: {selectedDayInfo.holiday.name}
                        </span>
                      ) : selectedDayInfo?.projectDeadlines?.length ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ color: isDark ? '#34d399' : '#10b981', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Tenggat: {selectedDayInfo.projectDeadlines[0].title}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSwitchPage?.('projects');
                            }}
                            style={{
                              background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
                              border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #10b981',
                              borderRadius: 6,
                              padding: '1px 6px',
                              color: isDark ? '#34d399' : '#065f46',
                              fontSize: 10,
                              fontWeight: 750,
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            Buka →
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ color: 'var(--cms-text-secondary, #94a3b8)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selectedDayInfo?.safeDay ?? selectedCalDay} {MONTH_NAMES_ID[calMonth]}: Bebas
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetDay = selectedDayInfo?.safeDay ?? selectedCalDay;
                              const formattedDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
                              setNewProjectDeadline(formattedDate);
                              setIsAddProjectOpen(true);
                              haptic.light();
                            }}
                            style={{
                              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'var(--cms-card-bg, #ffffff)',
                              border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid var(--cms-border, #cbd5e1)',
                              borderRadius: 6,
                              padding: '1px 7px',
                              color: isDark ? '#f8fafc' : '#144e3b',
                              fontSize: 10,
                              fontWeight: 750,
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            + Jadwalkan
                          </button>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cms-text-muted, #94a3b8)', flexShrink: 0 }}>
                      {totalDeadlinesThisMonth} Tenggat
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ROW 2: Studio Modules + Project Progress */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : isTablet ? 'repeat(2, minmax(0, 1fr))' : '1.3fr 1fr',
            gap: isMobile ? 10 : 16,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            alignItems: 'stretch'
          }}>
            {/* CARD C: ANALITIK & INTELIJEN STUDIO (Flat Solid & Terintegrasi) */}
            <div style={{
              background: 'var(--cms-card-bg, #ffffff)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '12px 14px' : '15px 18px',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: isMobile ? 'auto' : 325,
              height: isMobile ? 'auto' : 325,
              boxShadow: 'none',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              {/* Header: Title + Analytics Tabs */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                flexWrap: 'wrap',
                gap: 8,
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: 'var(--cms-accent-soft, rgba(99,102,241,0.12))',
                    color: 'var(--cms-accent, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Activity size={14} strokeWidth={2.4} />
                  </div>
                  <span style={{ fontSize: isMobile ? 13.5 : 14.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)', fontFamily: "'Outfit', sans-serif" }}>
                    Analitik Studio
                  </span>
                  <span style={{ 
                    fontSize: 10, 
                    color: '#10b981', 
                    fontWeight: 800,
                    padding: '1px 7px',
                    borderRadius: 999,
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                    Live Radar
                  </span>
                </div>

                {/* Switcher Tabs for Analytics Views */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                  padding: '2px 3px',
                  borderRadius: 100,
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                  overflowX: 'auto',
                  maxWidth: '100%'
                }}>
                  {[
                    { id: 'overview', label: 'Ringkasan' },
                    { id: 'pages', label: 'Halaman' },
                    { id: 'devices', label: 'Perangkat' },
                    { id: 'content', label: 'Konten' }
                  ].map(tab => {
                    const isActive = analyticsWidgetTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setAnalyticsWidgetTab(tab.id as any);
                          haptic.selection();
                        }}
                        style={{
                          border: 'none',
                          background: isActive ? (isDark ? 'rgba(255,255,255,0.14)' : '#ffffff') : 'transparent',
                          color: isActive ? 'var(--cms-text, #0f172a)' : 'var(--cms-text-muted, #64748b)',
                          fontSize: 10.5,
                          fontWeight: isActive ? 800 : 600,
                          padding: '3px 9px',
                          borderRadius: 100,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease, color 0.15s ease',
                          boxShadow: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Analytics Body (Flat Solid Cards / Progress Bars) */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '100%',
                minWidth: 0,
                padding: '2px 0'
              }}>
                {analyticsWidgetTab === 'overview' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: isMobile ? 8 : 10,
                    width: '100%'
                  }}>
                    {[
                      {
                        label: 'Total Kunjungan',
                        value: visitorIntelStats.totalVisits.toLocaleString('id-ID'),
                        sub: `${visitorIntelStats.uniqueVisitors} pengunjung unik`,
                        icon: TrendingUp,
                        color: '#3b82f6'
                      },
                      {
                        label: 'Leads & Konsultasi',
                        value: String(pendingInquiriesCount || 0),
                        sub: pendingInquiriesCount > 0 ? 'Pesan klien menunggu' : 'Semua pesan terjawab',
                        icon: MessageSquareMore,
                        color: '#10b981'
                      },
                      {
                        label: 'Aset Konten Aktif',
                        value: String(vaultLiveStats.totalVaultItems || 0),
                        sub: `${vaultLiveStats.portfolioCount} karya • ${vaultLiveStats.catalogCount} produk`,
                        icon: Database,
                        color: '#8b5cf6'
                      },
                      {
                        label: 'Sesi Keamanan',
                        value: `${visitorIntelStats.loginSessionsCount} Sesi`,
                        sub: 'Proteksi Admin Aktif',
                        icon: ShieldCheck,
                        color: '#f59e0b'
                      }
                    ].map((metric, idx) => {
                      const MetricIcon = metric.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            onSwitchPage?.('analytics');
                            haptic.light();
                          }}
                          style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.05)',
                            borderRadius: 12,
                            padding: isMobile ? '10px 11px' : '11px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 6,
                            cursor: 'pointer',
                            transition: 'border-color 0.15s ease, background 0.15s ease',
                            boxShadow: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = metric.color;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                              {metric.label}
                            </span>
                            <div style={{
                              width: 24,
                              height: 24,
                              borderRadius: 7,
                              background: `${metric.color}18`,
                              color: metric.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <MetricIcon size={13} strokeWidth={2.3} />
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: isMobile ? 17 : 19, fontWeight: 850, color: 'var(--cms-text, #0f172a)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.15 }}>
                              {metric.value}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {metric.sub}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {analyticsWidgetTab === 'pages' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    {visitorIntelStats.topPages.map((pg, idx) => {
                      const barColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
                      const col = barColors[idx % barColors.length];
                      return (
                        <div
                          key={pg.path}
                          style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                            borderRadius: 10,
                            padding: '8px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 5
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                              <span style={{ fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>{pg.label}</span>
                              <span style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8', fontFamily: 'monospace' }}>{pg.path}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: col, fontSize: 11 }}>
                              {pg.count} hits ({pg.pct}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: 6, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(8, pg.pct)}%`, height: '100%', borderRadius: 999, background: col }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {analyticsWidgetTab === 'devices' && (() => {
                  const totalDev = Math.max(1, visitorIntelStats.desktopCount + visitorIntelStats.mobileCount + visitorIntelStats.tabletCount);
                  const dPct = Math.round((visitorIntelStats.desktopCount / totalDev) * 100);
                  const mPct = Math.round((visitorIntelStats.mobileCount / totalDev) * 100);
                  const tPct = Math.max(0, 100 - dPct - mPct);
                  const devItems = [
                    { label: 'Desktop / Workstation', count: visitorIntelStats.desktopCount, pct: dPct, color: '#3b82f6' },
                    { label: 'Smartphone (Mobile)', count: visitorIntelStats.mobileCount, pct: mPct, color: '#10b981' },
                    { label: 'Tablet & iPad', count: visitorIntelStats.tabletCount, pct: tPct, color: '#8b5cf6' }
                  ];
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%' }}>
                      {devItems.map(dev => (
                        <div
                          key={dev.label}
                          style={{
                            background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                            borderRadius: 11,
                            padding: '10px 13px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <span style={{ fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>{dev.label}</span>
                            <span style={{ fontWeight: 800, color: dev.color, fontSize: 11.5 }}>{dev.count} sesi ({dev.pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: 7, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.max(4, dev.pct)}%`, height: '100%', borderRadius: 999, background: dev.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {analyticsWidgetTab === 'content' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    width: '100%'
                  }}>
                    {[
                      { label: 'Showcase Karya', val: vaultLiveStats.portfolioCount, color: '#e11d48', page: 'portfolio' },
                      { label: 'Journal Artikel', val: vaultLiveStats.blogCount, color: '#f59e0b', page: 'blog' },
                      { label: 'Katalog Drops', val: vaultLiveStats.catalogCount, color: '#ec4899', page: 'catalog' },
                      { label: 'Ulasan Klien', val: vaultLiveStats.reviewsCount, color: '#10b981', page: 'reviews' },
                      { label: 'Paket Rates', val: vaultLiveStats.ratesCount, color: '#3b82f6', page: 'ratecard' },
                      { label: 'Proofing Aktif', val: vaultLiveStats.proofingCount, color: '#8b5cf6', page: 'proofing' }
                    ].map(item => (
                      <div
                        key={item.label}
                        onClick={() => {
                          onSwitchPage?.(item.page);
                          haptic.light();
                        }}
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                          borderRadius: 11,
                          padding: '10px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          gap: 3,
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = item.color; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                      >
                        <span style={{ fontSize: 18, fontWeight: 850, color: item.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>
                          {item.val}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Bar: Embedded Sidebar Analytics Navigation Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '7px 12px',
                background: isDark ? 'rgba(255,255,255,0.035)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                borderRadius: 11,
                width: '100%',
                boxSizing: 'border-box',
                marginTop: 6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: 'var(--cms-accent-soft, rgba(99,102,241,0.14))',
                    color: 'var(--cms-accent, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <BarChart3 size={13} strokeWidth={2.4} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap' }}>
                    Pusat Intelijen & Trafik
                  </span>
                  <span style={{ fontSize: 10.5, color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    • Real-Time Analytics
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchPage?.('analytics');
                    haptic.light();
                  }}
                  style={{
                    background: 'var(--cms-accent, #6366f1)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                    padding: '4px 10px',
                    borderRadius: 999,
                    boxShadow: 'none'
                  }}
                >
                  <span>Buka Analitik</span>
                  <ArrowUpRight size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* CARD D: Project Progress (Arch Gauge Proporsional 325px - Interaktif) */}
            <div
              onClick={() => onSwitchPage?.('projects')}
              style={{
                background: 'var(--cms-card-bg, #ffffff)',
                borderRadius: isMobile ? 16 : 18,
                padding: isMobile ? '14px' : '18px 22px',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: isMobile ? 'auto' : 325,
                height: isMobile ? 'auto' : 325,
                boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = isDark ? '0 4px 18px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)';
              }}
              title="Klik untuk membuka dan kelola Proyek"
            >
              <div style={{ width: '100%', fontSize: isMobile ? 14 : 15, fontWeight: 800, color: 'var(--cms-text, #0f172a)', textAlign: 'left', marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Project Progress</span>
                <span style={{ fontSize: 11, color: isDark ? '#34d399' : '#10b981', fontWeight: 700 }}>Lihat Detail</span>
              </div>

              {/* Arch Gauge SVG (Proporsional 125px) */}
              <div style={{ position: 'relative', width: '100%', maxWidth: 240, height: 125, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="220" height="110" viewBox="0 0 220 120" style={{ maxWidth: '100%', height: 'auto' }}>
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
                  <span style={{ fontSize: isMobile ? 28 : 36, fontWeight: 850, color: 'var(--cms-text, #0f172a)', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {progressPercentage}%
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#34d399' : '#15803d', marginTop: 4 }}>
                    Project Ended
                  </span>
                </div>
              </div>

              {/* Legend Row (Lega & Rapi) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? 8 : 16,
                width: '100%',
                minWidth: 0,
                marginTop: 6,
                flexWrap: 'wrap',
                fontVariantNumeric: 'tabular-nums'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--cms-text-secondary, #94a3b8)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                  <span>Selesai ({projectCounts.done})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--cms-text-secondary, #94a3b8)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#144e3b', flexShrink: 0 }} />
                  <span>Progres ({projectCounts.progress})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--cms-text-secondary, #94a3b8)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'url(#diagonal-stripe-gauge)', border: '1px solid #cbd5e1', flexShrink: 0 }} />
                  <span>Pending ({projectCounts.todo})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROJECT LIST + TIME TRACKER (Lega & Seimbang 325px) */}
        <div style={{
          display: isTablet ? 'grid' : 'flex',
          gridTemplateColumns: isTablet ? 'repeat(2, minmax(0, 1fr))' : undefined,
          flexDirection: isTablet ? undefined : 'column',
          gap: isMobile ? 10 : 16,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          alignItems: 'stretch'
        }}>
          {/* TOP CARD: Project List (Sleek Dark / Solid Light) */}
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: isMobile ? 16 : 18,
            padding: isMobile ? '14px' : '18px 22px',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: isMobile ? 'auto' : 325,
            height: isMobile ? 'auto' : 325,
            boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <div style={{ minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                  <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>
                    Project
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 750, color: isDark ? '#cbd5e1' : '#64748b', background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', padding: '2px 9px', borderRadius: 100 }}>
                    {activeProjects.length}
                  </span>
                </div>

                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'transparent',
                    border: isDark ? '1.5px solid #10b981' : '1.5px solid #144e3b',
                    borderRadius: 9999,
                    padding: '4px 13px',
                    fontSize: 11.5,
                    fontWeight: 750,
                    color: isDark ? '#34d399' : '#144e3b',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Project items list (Scrollable Container) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', minWidth: 0, overflowY: 'auto', flex: 1 }}>
                {displayProjectsList.length > 0 ? (
                  displayProjectsList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSwitchPage?.('projects')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 11px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'background 0.12s ease',
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      title={`Klik untuk membuka: ${item.title}`}
                    >
                      {renderProjectIcon(item.iconType)}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{
                            fontSize: 13.5,
                            fontWeight: 750,
                            color: 'var(--cms-text, #0f172a)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.title}
                          </span>
                          <span style={{
                            fontSize: 10,
                            padding: '2px 7px',
                            borderRadius: 4,
                            fontWeight: 750,
                            background: item.status === 'done' ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7') : item.status === 'progress' ? (isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe') : (isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7'),
                            color: item.status === 'done' ? (isDark ? '#34d399' : '#15803d') : item.status === 'progress' ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#fbbf24' : '#b45309'),
                            flexShrink: 0
                          }}>
                            {item.status === 'done' ? 'Selesai' : item.status === 'progress' ? 'Progres' : 'Todo'}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-secondary, #94a3b8)', fontWeight: 550, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Tenggat: {item.dueDate}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    onClick={() => setIsAddProjectOpen(true)}
                    style={{
                      border: isDark ? '1.5px dashed rgba(255, 255, 255, 0.12)' : '1.5px dashed #cbd5e1',
                      borderRadius: 14,
                      padding: '24px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(248, 250, 252, 0.8)',
                      transition: 'all 0.15s ease',
                      margin: 'auto 0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isDark ? '#34d399' : '#144e3b';
                      e.currentTarget.style.background = isDark ? 'rgba(16, 185, 129, 0.06)' : '#f0fdf4';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
                      e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(248, 250, 252, 0.8)';
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: isDark ? 'rgba(16, 185, 129, 0.18)' : '#dcfce7', color: isDark ? '#34d399' : '#144e3b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={18} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--cms-text, #ffffff)' }}>
                      Buat Proyek Pertama
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-secondary, #94a3b8)', textAlign: 'center' }}>
                      Klik di sini untuk menambah proyek baru
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: 10,
              borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
              width: '100%',
              minWidth: 0
            }}>
              <button
                onClick={() => onSwitchPage?.('projects')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: isDark ? '#34d399' : '#144e3b',
                  fontSize: 11.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0
                }}
              >
                <span>Lihat Semua Proyek</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* BOTTOM CARD: TIME TRACKER (Terisolasi - Zero Re-render Overhead) */}
          <StudioTimeTrackerCard 
            activeProjects={activeProjects} 
            isMobile={isMobile} 
            isDark={isDark} 
            showToast={showToast} 
          />
        </div>

      </div>


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

      {/* ── PRE-FLIGHT LAUNCH READINESS AUDITOR MODAL ── */}
      <PreFlightLaunchAuditModal
        isOpen={isLaunchAuditModalOpen}
        onClose={() => setIsLaunchAuditModalOpen(false)}
        notify={(msg) => {
          setToastMessage(msg);
          setShowNotificationToast(true);
          setTimeout(() => setShowNotificationToast(false), 3200);
        }}
      />

    </div>
  );
};

export default FlatSolidDashboard;
