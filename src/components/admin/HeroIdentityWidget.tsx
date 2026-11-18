import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Calendar, Search, Sparkles, Globe, Globe2,
  ExternalLink, ShieldCheck, MapPin, Send, Building, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Pencil, Circle, Gift, 
  Sun, Moon, Sunrise, Sunset, Palette, LayoutGrid,
  Briefcase, Cpu as CpuIcon, DatabaseBackup, Camera,
  RefreshCw, Zap, Compass, Star, ArrowUpRight,
  CloudRain, CloudLightning, Snowflake, Waves, Rocket,
  PartyPopper, Heart, BookOpen, Award, Flame, Lightbulb, CheckCircle2,
  Gamepad2, Database, Dices, ArrowDown, DollarSign,
  Layers, FolderKanban, StickyNote, Link2, Megaphone, MessageSquareMore, Building2,
  TrendingUp, ShoppingBag, Film, Image as ImageIcon, Upload, X, Check, RotateCcw, Sliders
} from 'lucide-react';
import { callGemini } from '../../utils/ai';
import { haptic } from '../../utils/haptics';

// ── DAFTAR HARI BESAR & EVENT KALENDER INDONESIA ──
interface NationalHoliday {
  year?: number;
  month: number;
  date: number;
  name: string;
  greeting: string;
  icon: React.ComponentType<any>;
  theme: string;
}

const FIXED_NATIONAL_HOLIDAYS: NationalHoliday[] = [
  { month: 1, date: 1, name: 'Tahun Baru Masehi', greeting: 'Selamat Tahun Baru', icon: PartyPopper, theme: '#f59e0b' },
  { month: 2, date: 14, name: 'Hari Kasih Sayang', greeting: 'Hari Kasih Sayang', icon: Heart, theme: '#ec4899' },
  { month: 4, date: 21, name: 'Hari Kartini', greeting: 'Selamat Hari Kartini', icon: Award, theme: '#a855f7' },
  { month: 5, date: 1, name: 'Hari Buruh', greeting: 'Selamat Hari Buruh', icon: Briefcase, theme: '#f97316' },
  { month: 5, date: 2, name: 'Hari Pendidikan', greeting: 'Selamat Hari Pendidikan', icon: BookOpen, theme: '#3b82f6' },
  { month: 5, date: 20, name: 'Kebangkitan Nasional', greeting: 'Hari Kebangkitan Nasional', icon: Flame, theme: '#f59e0b' },
  { month: 6, date: 1, name: 'Hari Lahir Pancasila', greeting: 'Hari Lahir Pancasila', icon: ShieldCheck, theme: '#ef4444' },
  { month: 8, date: 17, name: 'Kemerdekaan RI', greeting: 'Dirgahayu Republik Indonesia', icon: Award, theme: '#ef4444' },
  { month: 10, date: 1, name: 'Kesaktian Pancasila', greeting: 'Hari Kesaktian Pancasila', icon: ShieldCheck, theme: '#f59e0b' },
  { month: 10, date: 2, name: 'Batik Nasional', greeting: 'Hari Batik Nasional', icon: Palette, theme: '#d97706' },
  { month: 10, date: 28, name: 'Sumpah Pemuda', greeting: 'Hari Sumpah Pemuda', icon: Flame, theme: '#f59e0b' },
  { month: 11, date: 10, name: 'Hari Pahlawan', greeting: 'Selamat Hari Pahlawan', icon: Award, theme: '#b91c1c' },
  { month: 11, date: 25, name: 'Hari Guru', greeting: 'Hari Guru Nasional', icon: BookOpen, theme: '#0284c7' },
  { month: 12, date: 22, name: 'Hari Ibu', greeting: 'Selamat Hari Ibu', icon: Heart, theme: '#ec4899' },
  { month: 12, date: 25, name: 'Hari Raya Natal', greeting: 'Selamat Hari Natal', icon: Gift, theme: '#059669' }
];

const VARIABLE_HOLIDAYS_BY_YEAR: Record<number, NationalHoliday[]> = {
  2024: [
    { month: 2, date: 8, name: 'Isra Mi\'raj', greeting: 'Selamat Isra Mi\'raj', icon: Moon, theme: '#10b981' },
    { month: 2, date: 10, name: 'Tahun Baru Imlek', greeting: 'Selamat Hari Imlek', icon: Sparkles, theme: '#ef4444' },
    { month: 3, date: 11, name: 'Hari Suci Nyepi', greeting: 'Selamat Hari Nyepi', icon: Moon, theme: '#8b5cf6' },
    { month: 3, date: 29, name: 'Wafat Isa Almasih', greeting: 'Wafat Isa Almasih', icon: Award, theme: '#ef4444' },
    { month: 4, date: 10, name: 'Hari Raya Idul Fitri', greeting: 'Selamat Idul Fitri', icon: Moon, theme: '#10b981' },
    { month: 4, date: 11, name: 'Idul Fitri Ke-2', greeting: 'Selamat Idul Fitri', icon: Moon, theme: '#10b981' },
    { month: 5, date: 9, name: 'Kenaikan Isa Almasih', greeting: 'Kenaikan Isa Almasih', icon: Award, theme: '#3b82f6' },
    { month: 5, date: 23, name: 'Hari Raya Waisak', greeting: 'Selamat Hari Waisak', icon: Sun, theme: '#f59e0b' },
    { month: 6, date: 17, name: 'Hari Raya Idul Adha', greeting: 'Selamat Idul Adha', icon: Moon, theme: '#10b981' },
    { month: 7, date: 7, name: 'Tahun Baru Islam', greeting: 'Tahun Baru Hijriyah', icon: Moon, theme: '#10b981' },
    { month: 9, date: 16, name: 'Maulid Nabi', greeting: 'Maulid Nabi Muhammad', icon: Moon, theme: '#10b981' }
  ],
  2025: [
    { month: 1, date: 27, name: 'Isra Mi\'raj', greeting: 'Selamat Isra Mi\'raj', icon: Moon, theme: '#10b981' },
    { month: 1, date: 29, name: 'Tahun Baru Imlek', greeting: 'Selamat Hari Imlek', icon: Sparkles, theme: '#ef4444' },
    { month: 3, date: 29, name: 'Hari Suci Nyepi', greeting: 'Selamat Hari Nyepi', icon: Moon, theme: '#8b5cf6' },
    { month: 3, date: 31, name: 'Hari Raya Idul Fitri', greeting: 'Selamat Idul Fitri', icon: Moon, theme: '#10b981' },
    { month: 4, date: 1, name: 'Idul Fitri Ke-2', greeting: 'Selamat Idul Fitri', icon: Moon, theme: '#10b981' },
    { month: 4, date: 18, name: 'Wafat Isa Almasih', greeting: 'Wafat Isa Almasih', icon: Award, theme: '#ef4444' },
    { month: 5, date: 12, name: 'Hari Raya Waisak', greeting: 'Selamat Hari Waisak', icon: Sun, theme: '#f59e0b' },
    { month: 5, date: 29, name: 'Kenaikan Isa Almasih', greeting: 'Kenaikan Isa Almasih', icon: Award, theme: '#3b82f6' },
    { month: 6, date: 7, name: 'Hari Raya Idul Adha', greeting: 'Selamat Idul Adha', icon: Moon, theme: '#10b981' },
    { month: 6, date: 27, name: 'Tahun Baru Islam', greeting: 'Tahun Baru Hijriyah', icon: Moon, theme: '#10b981' },
    { month: 9, date: 5, name: 'Maulid Nabi', greeting: 'Maulid Nabi Muhammad', icon: Moon, theme: '#10b981' }
  ],
  2026: [
    { month: 1, date: 16, name: 'Isra Mi\'raj', greeting: 'Selamat Isra Mi\'raj', icon: Moon, theme: '#10b981' },
    { month: 2, date: 17, name: 'Tahun Baru Imlek', greeting: 'Selamat Hari Imlek', icon: Sparkles, theme: '#ef4444' },
    { month: 3, date: 19, name: 'Hari Suci Nyepi', greeting: 'Selamat Hari Nyepi', icon: Moon, theme: '#8b5cf6' },
    { month: 3, date: 20, name: 'Hari Raya Idul Fitri', greeting: 'Selamat Idul Fitri', icon: Moon, theme: '#10b981' },
    { month: 3, date: 21, name: 'Idul Fitri Ke-2', greeting: 'Selamat Idul Fitri', icon: Moon, theme: '#10b981' },
    { month: 4, date: 3, name: 'Wafat Isa Almasih', greeting: 'Wafat Isa Almasih', icon: Award, theme: '#ef4444' },
    { month: 5, date: 14, name: 'Kenaikan Isa Almasih', greeting: 'Kenaikan Isa Almasih', icon: Award, theme: '#3b82f6' },
    { month: 5, date: 27, name: 'Hari Raya Idul Adha', greeting: 'Selamat Idul Adha', icon: Moon, theme: '#10b981' },
    { month: 5, date: 31, name: 'Hari Raya Waisak', greeting: 'Selamat Hari Waisak', icon: Sun, theme: '#f59e0b' },
    { month: 6, date: 16, name: 'Tahun Baru Islam', greeting: 'Tahun Baru Hijriyah', icon: Moon, theme: '#10b981' },
    { month: 8, date: 25, name: 'Maulid Nabi', greeting: 'Maulid Nabi Muhammad', icon: Moon, theme: '#10b981' }
  ],
  2027: [
    { month: 1, date: 5, name: 'Isra Mi\'raj', greeting: 'Selamat Isra Mi\'raj', icon: Moon, theme: '#10b981' },
    { month: 2, date: 6, name: 'Tahun Baru Imlek', greeting: 'Selamat Hari Imlek', icon: Sparkles, theme: '#ef4444' },
    { month: 3, date: 8, name: 'Hari Suci Nyepi', greeting: 'Selamat Hari Nyepi', icon: Moon, theme: '#8b5cf6' },
    { month: 3, date: 10, name: 'Hari Raya Idul Fitri', greeting: 'Selamat Idul Fitri', icon: Moon, theme: '#10b981' },
    { month: 3, date: 26, name: 'Wafat Isa Almasih', greeting: 'Wafat Isa Almasih', icon: Award, theme: '#ef4444' },
    { month: 5, date: 6, name: 'Kenaikan Isa Almasih', greeting: 'Kenaikan Isa Almasih', icon: Award, theme: '#3b82f6' },
    { month: 5, date: 16, name: 'Hari Raya Idul Adha', greeting: 'Selamat Idul Adha', icon: Moon, theme: '#10b981' },
    { month: 5, date: 20, name: 'Hari Raya Waisak', greeting: 'Selamat Hari Waisak', icon: Sun, theme: '#f59e0b' },
    { month: 6, date: 6, name: 'Tahun Baru Islam', greeting: 'Tahun Baru Hijriyah', icon: Moon, theme: '#10b981' },
    { month: 8, date: 15, name: 'Maulid Nabi', greeting: 'Maulid Nabi Muhammad', icon: Moon, theme: '#10b981' }
  ]
};

const getIndonesianHoliday = (year: number, month: number, date: number): NationalHoliday | null => {
  const fixed = FIXED_NATIONAL_HOLIDAYS.find(h => h.month === month && h.date === date);
  if (fixed) return fixed;
  const variableList = VARIABLE_HOLIDAYS_BY_YEAR[year] || [];
  return variableList.find(h => h.month === month && h.date === date) || null;
};

const DAILY_INSPIRATIONS = [
  { theme: 'Kreativitas', quote: 'Karya Solusi Nyata', author: 'Creative', icon: Palette },
  { theme: 'Fokus Studio', quote: 'Fokus Raih Mahakarya', author: 'Momentum', icon: Zap },
  { theme: 'Karier Desain', quote: 'Komitmen Selesaikan Karya', author: 'Studio', icon: Briefcase },
  { theme: 'Inovasi AI', quote: 'Inovasi Tanpa Batas', author: 'Future', icon: Rocket },
  { theme: 'Mindset Positif', quote: 'Hargai Setiap Progres', author: 'Affirmation', icon: Compass },
  { theme: 'Estetika Visual', quote: 'Sederhana Tapi Elegan', author: 'Visual', icon: Sparkles }
];

// ── BRAND SVG ICONS (DIRECT URL SEARCHABLE ONLY) ──
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#E60023" style={{ flexShrink: 0 }}>
    <path d="M12 0a12 12 0 0 0-4.37 23.18c-.05-.98-.09-2.49.02-3.56l1.24-5.26s-.31-.62-.31-1.54c0-1.45.84-2.53 1.88-2.53.89 0 1.32.67 1.32 1.47 0 .89-.57 2.23-.86 3.47-.24 1.04.52 1.88 1.54 1.88 1.85 0 3.28-1.95 3.28-4.77 0-2.49-1.79-4.24-4.35-4.24-2.96 0-4.7 2.22-4.7 4.51 0 .89.34 1.85.77 2.37a.36.36 0 0 1 .08.34l-.32 1.31c-.05.21-.17.26-.39.16-1.44-.67-2.34-2.77-2.34-4.46 0-3.63 2.64-6.97 7.61-6.97 3.99 0 7.1 2.85 7.1 6.66 0 3.97-2.5 7.16-5.97 7.16-1.17 0-2.27-.61-2.64-1.33l-.72 2.74c-.26 1-.97 2.25-1.44 3.02A12 12 0 1 0 12 0z"/>
  </svg>
);

const DribbbleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#EA4C89" style={{ flexShrink: 0 }}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.885 11.44c-.21-.03-2.4-.41-4.79-.19.46 1.27.88 2.58 1.23 3.86 2.05-.8 3.32-2.3 3.56-3.67zm-1.12-3.18c-1.52-.77-3.72-1.28-6.19-1.17.06-.18.12-.36.17-.55.77-2.45 1.5-4.72 1.5-4.72 2.38 1.3 4.07 3.63 4.52 6.44zM12 2.06c.01 0-.71 2.21-1.47 4.61-4.27-.99-8.24-.03-8.6-.01C3.47 4.14 7.42 2.06 12 2.06zM1.98 9.38c.36-.02 4.67-.99 9.3.14-.37 1.07-.76 2.16-1.18 3.25C6.01 11.66 2.5 13.9 2.27 14.05 1.95 12.63 1.84 11.02 1.98 9.38zm2.08 7.37c.23-.15 3.53-2.24 7.41-1.15-.36 1.01-.73 2.03-1.12 3.03C6.44 19.38 4.63 18.23 4.06 16.75zm8.06 5.17c.4-.97.77-1.96 1.12-2.94 2.15-.22 4.18.21 4.38.26-.64 1.4-1.74 2.54-3.1 3.22-.79.35-1.59.54-2.4.54z"/>
  </svg>
);

const BehanceIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#0057ff" style={{ flexShrink: 0 }}>
    <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-4.981 3-3.642 0-5.745-2.582-5.745-6.009 0-3.564 2.321-6.035 5.674-6.035 3.615 0 5.385 2.569 5.385 5.892 0 .428-.052.884-.079 1.152h-8.216c.088 1.884 1.444 2.871 3.09 2.871 1.407 0 2.273-.667 2.766-1.428l2.106.557zm-7.904-4.148h5.457c-.074-1.503-.984-2.502-2.614-2.502-1.603 0-2.645 1.002-2.843 2.502zM6.71 14.286c.928 0 1.742-.321 2.146-.867.391-.527.502-1.196.502-1.897 0-1.637-1.042-2.383-2.648-2.383H3.016v5.147H6.71zm-.322-6.529c.773 0 1.428-.27 1.776-.713.33-.42.417-.954.417-1.512 0-1.378-.857-1.989-2.193-1.989H3.016v4.214h3.372zM0 20V2h6.732c2.443 0 4.298.922 4.909 2.457.262.66.359 1.397.359 2.176 0 1.258-.458 2.292-1.353 3.003 1.309.684 1.989 1.954 1.989 3.528 0 1.006-.201 1.98-.674 2.805-.984 1.714-3.082 2.443-5.65 2.443L0 20z"/>
  </svg>
);

const UnsplashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#111827" style={{ flexShrink: 0 }}>
    <path d="M7.5 6.75V0h9v6.75h-9zm9 3.75H24V24H0V10.5h7.5v6.75h9V10.5z"/>
  </svg>
);

const FreepikIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" style={{ flexShrink: 0 }}>
    <path fill="#0C8CE9" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
  </svg>
);

const GoogleFontsIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#ea4335" style={{ flexShrink: 0 }}>
    <path d="M9.93 13.5h4.14L12 7.98zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#FF0000" style={{ flexShrink: 0 }}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="#24292e" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

interface SearchEngine {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  placeholder: string;
  buildUrl: (query: string) => string;
}

const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', icon: GoogleIcon, color: '#4285F4', placeholder: 'Cari Google...', buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: 'pinterest', name: 'Pinterest', icon: PinterestIcon, color: '#E60023', placeholder: 'Cari Inspirasi...', buildUrl: (q) => `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}` },
  { id: 'dribbble', name: 'Dribbble', icon: DribbbleIcon, color: '#EA4C89', placeholder: 'Eksplorasi UI...', buildUrl: (q) => `https://dribbble.com/search/${encodeURIComponent(q)}` },
  { id: 'behance', name: 'Behance', icon: BehanceIcon, color: '#0057ff', placeholder: 'Portofolio Desain...', buildUrl: (q) => `https://www.behance.net/search/projects?search=${encodeURIComponent(q)}` },
  { id: 'unsplash', name: 'Unsplash', icon: UnsplashIcon, color: '#111827', placeholder: 'Foto HD...', buildUrl: (q) => `https://unsplash.com/s/photos/${encodeURIComponent(q)}` },
  { id: 'freepik', name: 'Freepik', icon: FreepikIcon, color: '#0C8CE9', placeholder: 'Vektor Grafis...', buildUrl: (q) => `https://www.freepik.com/search?format=search&query=${encodeURIComponent(q)}` },
  { id: 'fonts', name: 'Google Fonts', icon: GoogleFontsIcon, color: '#ea4335', placeholder: 'Tipografi Font...', buildUrl: (q) => `https://fonts.google.com/?query=${encodeURIComponent(q)}` },
  { id: 'youtube', name: 'YouTube', icon: YouTubeIcon, color: '#FF0000', placeholder: 'Video Tutorial...', buildUrl: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { id: 'github', name: 'GitHub', icon: GithubIcon, color: '#24292e', placeholder: 'Repositori Kode...', buildUrl: (q) => `https://github.com/search?q=${encodeURIComponent(q)}` }
];

interface WeatherAtmosphere {
  id: string;
  name: string;
  badge: string;
  icon: React.ComponentType<any>;
  skyGradient: string;
  isDarkSky: boolean;
  desc: string;
}

const WEATHER_MODES: WeatherAtmosphere[] = [
  {
    id: 'auto',
    name: 'Auto Realtime',
    badge: 'Waktu Nyata',
    icon: Sparkles,
    skyGradient: '',
    isDarkSky: true,
    desc: 'Otomatis Realtime'
  },
  {
    id: 'sunny',
    name: 'Cerah Tropis',
    badge: 'Siang Cerah',
    icon: Sun,
    skyGradient: 'linear-gradient(145deg, #0284c7 0%, #38bdf8 55%, #7dd3fc 100%)',
    isDarkSky: false,
    desc: 'Cerah Tropis'
  },
  {
    id: 'sunset',
    name: 'Senja Emas',
    badge: 'Sunset Amber',
    icon: Sunset,
    skyGradient: 'linear-gradient(145deg, #311042 0%, #831843 35%, #ea580c 70%, #fde047 100%)',
    isDarkSky: true,
    desc: 'Lembayung Senja'
  },
  {
    id: 'starry',
    name: 'Malam Kosmik',
    badge: 'Galaxy Starry',
    icon: Moon,
    skyGradient: 'linear-gradient(145deg, #090a1a 0%, #171936 50%, #2c1a4d 100%)',
    isDarkSky: true,
    desc: 'Malam Bintang'
  },
  {
    id: 'rain',
    name: 'Hujan Sejuk',
    badge: 'Hujan Rintik',
    icon: CloudRain,
    skyGradient: 'linear-gradient(145deg, #182335 0%, #28374d 50%, #3b4d66 100%)',
    isDarkSky: true,
    desc: 'Hujan Sejuk'
  },
  {
    id: 'storm',
    name: 'Badai Petir',
    badge: 'Badai & Kilat',
    icon: CloudLightning,
    skyGradient: 'linear-gradient(145deg, #0a0b12 0%, #181932 50%, #2e2652 100%)',
    isDarkSky: true,
    desc: 'Badai Kilat'
  },
  {
    id: 'snow',
    name: 'Salju Halus',
    badge: 'Winter Frost',
    icon: Snowflake,
    skyGradient: 'linear-gradient(145deg, #1e293b 0%, #334155 45%, #64748b 85%, #cbd5e1 100%)',
    isDarkSky: true,
    desc: 'Salju Dingin'
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    badge: 'Cahaya Utara',
    icon: Waves,
    skyGradient: 'linear-gradient(145deg, #031b26 0%, #064e3b 40%, #047857 70%, #06b6d4 100%)',
    isDarkSky: true,
    desc: 'Cahaya Nordik'
  },
  {
    id: 'ufo_invasion',
    name: 'Invasi Sci-Fi',
    badge: 'Cosmic Sci-Fi',
    icon: Rocket,
    skyGradient: 'linear-gradient(145deg, #050510 0%, #1e103a 45%, #3b0764 85%, #06b6d4 100%)',
    isDarkSky: true,
    desc: 'Kosmik Sci-Fi'
  }
];

export interface HeroKpiItem {
  label: string;
  shortLabel: string;
  val: string;
  icon: React.ComponentType<any>;
  color: string;
  page: string;
  progress: number;
  progressGrad: string;
}

export interface HeroIdentityWidgetProps {
  globalSettings: any;
  syncMode: string;
  studioTab: string;
  setStudioTab: (tab: any) => void;
  isCompact: boolean;
  isMobile: boolean;
  isTablet: boolean;
  onSwitchPage: (page: string) => void;
  handleBackupJson: () => void;
  kpis?: HeroKpiItem[];
  projects?: any[];
  onExpandSuite?: (suiteKey: string) => void;
}

export interface WallpaperConfig {
  type: 'default' | 'video' | 'image' | 'solid';
  url: string;
  solidColor?: string;
  overlayOpacity: number; // 0 to 1
}

const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  type: 'default',
  url: '',
  solidColor: '#0f172a',
  overlayOpacity: 0.35
};

const HeroClockText = React.memo(() => {
  const [clock, setClock] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`;
  });

  useEffect(() => {
    const update = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      setClock(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`);
    };
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return <>{clock}</>;
});

export const HeroIdentityWidget: React.FC<HeroIdentityWidgetProps> = ({
  globalSettings,
  syncMode,
  studioTab,
  setStudioTab,
  isCompact,
  isMobile,
  isTablet,
  onSwitchPage,
  handleBackupJson,
  kpis,
  projects = [],
  onExpandSuite
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEngine, setSelectedEngine] = useState<string>('google');
  const [engineDropdownOpen, setEngineDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Custom Wallpaper State (WebM, WebP, Video, Image, Solid) ──
  const [wallpaperConfig, setWallpaperConfig] = useState<WallpaperConfig>(() => {
    try {
      const saved = localStorage.getItem('agenze_os_wallpaper_config') || localStorage.getItem('agence_os_wallpaper_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load wallpaper config', e);
    }
    return DEFAULT_WALLPAPER_CONFIG;
  });
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [tempWallpaperType, setTempWallpaperType] = useState<'video' | 'image' | 'solid' | 'default'>('image');
  const [tempWallpaperUrl, setTempWallpaperUrl] = useState('');
  const [tempSolidColor, setTempSolidColor] = useState('#0f172a');
  const [tempOverlayOpacity, setTempOverlayOpacity] = useState(35);
  const [wallpaperUploadError, setWallpaperUploadError] = useState<string | null>(null);

  const openWallpaperModal = () => {
    setTempWallpaperType(wallpaperConfig.type);
    setTempWallpaperUrl(wallpaperConfig.url || '');
    setTempSolidColor(wallpaperConfig.solidColor || '#0f172a');
    setTempOverlayOpacity(Math.round((wallpaperConfig.overlayOpacity ?? 0.35) * 100));
    setWallpaperUploadError(null);
    setIsWallpaperModalOpen(true);
    haptic.light();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWallpaperUploadError(null);

    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.webm') || file.name.endsWith('.mp4');
    const isImage = file.type.startsWith('image/') || file.name.endsWith('.webp') || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.gif');

    if (!isVideo && !isImage) {
      setWallpaperUploadError('Format tidak didukung. Harap gunakan WebM, WebP, MP4, PNG, atau JPG.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setWallpaperUploadError('Ukuran file maksimal 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setTempWallpaperUrl(result);
      setTempWallpaperType(isVideo ? 'video' : 'image');
    };
    reader.onerror = () => {
      setWallpaperUploadError('Gagal membaca file lokal.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveWallpaper = () => {
    const newConfig: WallpaperConfig = {
      type: tempWallpaperType,
      url: tempWallpaperUrl.trim(),
      solidColor: tempSolidColor,
      overlayOpacity: tempOverlayOpacity / 100
    };
    setWallpaperConfig(newConfig);
    try {
      localStorage.setItem('agenze_os_wallpaper_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('LocalStorage limit reached, cached in session');
    }
    setIsWallpaperModalOpen(false);
    haptic.success();
  };

  const handleResetWallpaper = () => {
    setWallpaperConfig(DEFAULT_WALLPAPER_CONFIG);
    try {
      localStorage.removeItem('agenze_os_wallpaper_config');
      localStorage.removeItem('agence_os_wallpaper_config');
    } catch (e) {}
    setIsWallpaperModalOpen(false);
    haptic.medium();
  };

  // ── OS Desktop Project & Holiday Calendar State ──
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(() => new Date().getDate());
  const [showCalendarDetail, setShowCalendarDetail] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return DAILY_INSPIRATIONS[dayOfYear % DAILY_INSPIRATIONS.length];
  });
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [weatherModeIdx, setWeatherModeIdx] = useState(0);
  const [ufoWarped, setUfoWarped] = useState(false);

  const activeEngineObj = SEARCH_ENGINES.find(se => se.id === selectedEngine) || SEARCH_ENGINES[0];

  useEffect(() => {
    const updateTime = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setCurrentTime(new Date());
    };
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  
  const isNight = hours >= 18 || hours < 6;
  const isMorning = hours >= 6 && hours < 11;
  const isAfternoon = hours >= 11 && hours < 15;
  const isEvening = hours >= 15 && hours < 18;

  const handleCycleWeather = () => {
    setWeatherModeIdx((prev) => (prev + 1) % WEATHER_MODES.length);
    haptic.medium();
  };

  const currentMode = WEATHER_MODES[weatherModeIdx];
  const CurrentModeIcon = currentMode.icon || Sparkles;

  const currentHoliday = useMemo(() => {
    return getIndonesianHoliday(currentTime.getFullYear(), currentTime.getMonth() + 1, currentTime.getDate());
  }, [currentTime]);

  const HolidayIcon = currentHoliday ? currentHoliday.icon : Calendar;
  const QuoteIcon = dailyQuote.icon || Sparkles;

  const timeGreeting = useMemo(() => {
    if (isMorning) return { text: 'Selamat Pagi', desc: 'Semangat Berkarya', skyGradient: 'linear-gradient(145deg, #0284c7 0%, #38bdf8 60%, #bae6fd 100%)', isDarkSky: false };
    if (isAfternoon) return { text: 'Selamat Siang', desc: 'Fokus Produktif', skyGradient: 'linear-gradient(145deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)', isDarkSky: false };
    if (isEvening) return { text: 'Selamat Sore', desc: 'Selesaikan Agenda', skyGradient: 'linear-gradient(145deg, #311042 0%, #7c2d12 45%, #d97706 80%, #fde047 100%)', isDarkSky: true };
    return { text: 'Selamat Malam', desc: 'Waktu Istirahat', skyGradient: 'linear-gradient(145deg, #0b0c1e 0%, #171936 50%, #2e1065 100%)', isDarkSky: true };
  }, [isMorning, isAfternoon, isEvening]);

  const activeSkyGradient = currentMode.id === 'auto' ? timeGreeting.skyGradient : currentMode.skyGradient;
  const isDarkSkyActive = currentMode.id === 'auto' ? timeGreeting.isDarkSky : currentMode.isDarkSky;

  const hasRain = currentMode.id === 'rain' || currentMode.id === 'storm';
  const hasStorm = currentMode.id === 'storm';
  const hasSnow = currentMode.id === 'snow';
  const hasAurora = currentMode.id === 'aurora';
  const hasUfo = currentMode.id === 'ufo_invasion' || (currentMode.id === 'auto' && isNight);
  const hasStars = isNight || currentMode.id === 'starry' || currentMode.id === 'storm' || currentMode.id === 'aurora' || currentMode.id === 'ufo_invasion';
  const hasClouds = currentMode.id === 'sunny' || currentMode.id === 'sunset' || currentMode.id === 'auto' || currentMode.id === 'rain';

  const formattedDate = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[currentTime.getDay()]}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
  }, [currentTime]);

  const formattedClock = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)} WIB`;
  }, [hours, minutes, seconds]);

  const celestialPositionPercent = useMemo(() => {
    if (!isNight) {
      const dayMinutes = (hours - 6) * 60 + minutes;
      return Math.min(100, Math.max(0, (dayMinutes / (12 * 60)) * 100));
    } else {
      const nightMinutes = hours >= 18 ? (hours - 18) * 60 + minutes : (hours + 6) * 60 + minutes;
      return Math.min(100, Math.max(0, (nightMinutes / (12 * 60)) * 100));
    }
  }, [hours, minutes, isNight]);


  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    const engine = SEARCH_ENGINES.find(se => se.id === selectedEngine) || SEARCH_ENGINES[0];
    const url = engine.buildUrl(searchQuery.trim());
    window.open(url, '_blank', 'noopener,noreferrer');
    haptic.light();
  };

  const handleGenerateAiAffirmation = async () => {
    setIsAiGenerating(true);
    haptic.medium();
    try {
      const themes = ['Inovasi Kreatif Desain', 'Produktivitas Studio', 'Semangat Kerja', 'Inovasi Masa Depan'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      const prompt = `Buatkan 1 kalimat kutipan inspiratif & kata penyemangat harian yang sangat elegan dan ringkas untuk desainer grafis/kreator bernama "${globalSettings?.biodata?.fullName || 'Saiful'}". Tema: "${randomTheme}". Output HANYA kalimat kutipan langsung tanpa tanda petik dan tanpa pengantar.`;
      
      const res = await callGemini(prompt, "Kamu adalah kurator afirmasi kreatif.", 100, true);
      if (res && res.length > 10 && !res.includes('API Key belum diatur')) {
        setDailyQuote({
          theme: randomTheme,
          quote: res.replace(/^["']|["']$/g, '').trim(),
          author: 'Gemini AI',
          icon: Sparkles
        });
      } else {
        const nextIdx = (DAILY_INSPIRATIONS.indexOf(dailyQuote) + 1) % DAILY_INSPIRATIONS.length;
        setDailyQuote(DAILY_INSPIRATIONS[nextIdx]);
      }
    } catch {
      const nextIdx = (DAILY_INSPIRATIONS.indexOf(dailyQuote) + 1) % DAILY_INSPIRATIONS.length;
      setDailyQuote(DAILY_INSPIRATIONS[nextIdx]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleUfoClick = () => {
    setUfoWarped(true);
    haptic.medium();
    setTimeout(() => setUfoWarped(false), 2000);
  };

  const OS_APPS = useMemo(() => [
    { label: 'Canvas', shortLabel: 'Canvas', icon: Globe2, color: '#7c3aed', page: 'visual-editor' },
    { label: 'Vault', shortLabel: 'Vault', icon: Database, color: '#0284c7', page: 'database' },
    { label: 'Apps', shortLabel: 'Apps', icon: LayoutGrid, color: '#8b5cf6', page: 'apps' },
    { label: 'Contacts', shortLabel: 'Contacts', icon: Building2, color: '#6366f1', page: 'settings', action: () => { onSwitchPage('settings'); setTimeout(() => window.dispatchEvent(new CustomEvent('cms_open_settings_category', { detail: { category: 'contacts' } })), 100); } },
    { label: 'Blocks', shortLabel: 'Blocks', icon: Layers, color: '#ec4899', page: 'builder' },
    { label: 'Works', shortLabel: 'Works', icon: FolderKanban, color: '#3b82f6', page: 'projects', action: () => { onSwitchPage('projects'); setTimeout(() => window.dispatchEvent(new Event('porto_open_new_project')), 300); } },
    { label: 'Finance', shortLabel: 'Finance', icon: DollarSign, color: '#10b981', page: 'transactions' },
    { label: 'Notes', shortLabel: 'Notes', icon: StickyNote, color: '#f59e0b', page: 'notes' },
    { label: 'Links', shortLabel: 'Links', icon: Link2, color: '#06b6d4', page: 'links' },
    { label: 'Waves', shortLabel: 'Waves', icon: Megaphone, color: '#f43f5e', page: 'broadcast' },
    { label: 'Inbox', shortLabel: 'Inbox', icon: MessageSquareMore, color: '#14b8a6', page: 'chat' },
    { label: 'Guide', shortLabel: 'Guide', icon: Compass, color: '#a855f7', page: 'guideline' },
  ], [onSwitchPage]);

  const effectiveKpis = useMemo(() => {
    if (kpis && kpis.length > 0) return kpis;
    return [
      { label: 'OMSET KAS', shortLabel: 'OMSET', val: 'Rp 0', icon: TrendingUp, color: '#10b981', page: 'transactions', progress: 85, progressGrad: 'linear-gradient(90deg, #10b981, #34d399)' },
      { label: 'TOTAL PROYEK', shortLabel: 'PROYEK', val: '0 Proyek', icon: Rocket, color: '#3b82f6', page: 'projects', progress: 70, progressGrad: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
      { label: 'PUSAT DATA', shortLabel: 'DATA', val: '0 Data', icon: Database, color: '#0284c7', page: 'database', progress: 90, progressGrad: 'linear-gradient(90deg, #0284c7, #38bdf8)' },
      { label: 'APLIKASI LIVE', shortLabel: 'APPS', val: '0 Modul', icon: LayoutGrid, color: '#8b5cf6', page: 'apps', progress: 80, progressGrad: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
      { label: 'ARTIKEL BLOG', shortLabel: 'BLOG', val: '0 Artikel', icon: BookOpen, color: '#f59e0b', page: 'blog', progress: 60, progressGrad: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
      { label: 'PRODUK JUAL', shortLabel: 'PRODUK', val: '0 Produk', icon: ShoppingBag, color: '#ec4899', page: 'catalog', progress: 75, progressGrad: 'linear-gradient(90deg, #ec4899, #f472b6)' }
    ];
  }, [kpis]);

  const MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    // Monday-first calculation (standard Indonesia): 0 = Sen, 1 = Sel, ..., 6 = Min
    const firstDayRaw = new Date(calYear, calMonth, 1).getDay(); // JS getDay(): 0 is Sunday
    const firstDayIndex = (firstDayRaw + 6) % 7;
    const today = new Date();
    const isCurrentMonthYear = today.getMonth() === calMonth && today.getFullYear() === calYear;
    const todayDate = today.getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: '', isToday: false, holiday: null, projectDeadlines: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const holiday = getIndonesianHoliday(calYear, calMonth + 1, d);
      const projectDeadlines = (projects || []).filter((p: any) => {
        if (!p || p.isTrash || p.isDeleted) return false;
        const dStr = p.deadline || p.scheduledDate;
        return dStr && String(dStr).startsWith(dateStr);
      });
      days.push({
        day: d,
        dateStr,
        isToday: isCurrentMonthYear && d === todayDate,
        holiday,
        projectDeadlines
      });
    }
    return days;
  }, [calMonth, calYear, projects]);

  const selectedDayInfo = useMemo(() => {
    if (!selectedCalDay) return null;
    return calendarDays.find(d => d.day === selectedCalDay) || null;
  }, [selectedCalDay, calendarDays]);

  const totalDeadlinesThisMonth = useMemo(() => {
    return calendarDays.reduce((acc, d) => acc + (d.projectDeadlines?.length || 0), 0);
  }, [calendarDays]);

  const totalHolidaysThisMonth = useMemo(() => {
    return calendarDays.filter(d => !!d.holiday).length;
  }, [calendarDays]);

  return (
    <div style={{
      width: '100%',
      height: isMobile ? 'auto' : 'calc(100vh - 40px)',
      minHeight: isMobile ? 'auto' : 'calc(100vh - 40px)',
      maxHeight: isMobile ? 'none' : 'calc(100vh - 40px)',
      position: 'relative',
      borderRadius: isMobile ? 20 : 28,
      background: wallpaperConfig.type === 'solid'
        ? (wallpaperConfig.solidColor || '#0a0a0f')
        : (wallpaperConfig.type === 'default' ? activeSkyGradient : '#090a0f'),
      border: '1.5px solid rgba(255, 255, 255, 0.16)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: isMobile ? '12px 10px 10px' : isTablet ? '14px 18px 10px' : '16px 24px 10px',
      boxSizing: 'border-box',
      transition: 'background 0.5s ease'
    }}>
      {/* ── CUSTOM WALLPAPER LAYER: VIDEO (WEBM/MP4), IMAGE (WEBP/PNG/JPG) ── */}
      {wallpaperConfig.type === 'video' && wallpaperConfig.url && (
        <video
          key={wallpaperConfig.url}
          src={wallpaperConfig.url}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
      )}

      {wallpaperConfig.type === 'image' && wallpaperConfig.url && (
        <img
          src={wallpaperConfig.url}
          alt="Custom Wallpaper"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Scrim overlay to maintain high contrast for clock & widgets */}
      {wallpaperConfig.type !== 'default' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0, 0, 0, ${wallpaperConfig.overlayOpacity ?? 0.35})`,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* ══════ TIER 1: TOP OS STATUS BAR & AMBIENT CAPSULE ══════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        position: 'relative',
        zIndex: 5,
        gap: 10,
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        {/* Left: OS Brand & Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 9999,
            background: isDarkSkyActive ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: isDarkSkyActive ? '#ffffff' : '#0f172a',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }} />
            <span>sumr.day OS</span>
          </div>
          {!isMobile && (
            <span style={{ fontSize: 11, fontWeight: 700, color: isDarkSkyActive ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.65)', whiteSpace: 'nowrap' }}>
              {formattedDate}
            </span>
          )}
        </div>

        {/* Center: Slim Ambient Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isDarkSkyActive ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.65)',
          padding: '5px 14px',
          borderRadius: 9999,
          border: '1px solid rgba(255, 255, 255, 0.22)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
          minWidth: 0,
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
            <HolidayIcon size={13} color={currentHoliday ? '#ef4444' : '#10b981'} />
            <span style={{ fontSize: 11, fontWeight: 850, color: isDarkSkyActive ? '#ffffff' : '#0f172a', whiteSpace: 'nowrap' }}>
              {currentHoliday ? currentHoliday.name : 'Hari Kerja'}
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: 9999,
              background: currentHoliday ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
              color: currentHoliday ? '#ef4444' : '#10b981',
              whiteSpace: 'nowrap'
            }}>
              {currentHoliday ? 'Hari Besar' : 'Studio Aktif'}
            </span>
          </div>

          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
            <QuoteIcon size={12} color="var(--cms-accent, #6366f1)" />
            <span style={{ fontSize: 10.5, fontWeight: 750, color: isDarkSkyActive ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? 120 : 220 }}>
              Fokus: <strong>{dailyQuote.theme}</strong>
            </span>
            <button
              type="button"
              onClick={handleGenerateAiAffirmation}
              disabled={isAiGenerating}
              className="cms-circle-btn"
              style={{
                width: 22,
                height: 22,
                minWidth: 22,
                minHeight: 22,
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: isDarkSkyActive ? '#ffffff' : '#0f172a',
                cursor: isAiGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: 0
              }}
              title="Inspirasi Baru"
            >
              {isAiGenerating ? <RefreshCw size={10} className="cms-spin" /> : <Dices size={11} />}
            </button>
          </div>
        </div>

        {/* Right: Quick Tools, Custom Wallpaper (Pencil), Wallpaper Cycler & Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Custom Wallpaper Button (Pencil) */}
          <button
            type="button"
            onClick={openWallpaperModal}
            style={{
              width: 34,
              height: 34,
              minWidth: 34,
              minHeight: 34,
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              background: wallpaperConfig.type !== 'default' ? 'var(--cms-accent, #6366f1)' : 'rgba(0, 0, 0, 0.42)',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              transition: 'transform 0.18s ease, background 0.18s ease',
              padding: 0,
              flexShrink: 0
            }}
            title="Ganti Wallpaper Studio (Video WebM/MP4, Gambar WebP/PNG, atau Warna Solid)"
          >
            <Pencil size={15} />
          </button>

          {/* Wallpaper Mood Cycler */}
          <button
            type="button"
            onClick={handleCycleWeather}
            style={{
              width: 34,
              height: 34,
              minWidth: 34,
              minHeight: 34,
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fde047',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.18s ease',
              padding: 0,
              flexShrink: 0
            }}
            title={`Suasana: ${currentMode.name} — Klik untuk ganti preset langit`}
          >
            <CurrentModeIcon size={16} />
          </button>

          {!isMobile && (
            <>
              <button 
                type="button"
                onClick={() => onSwitchPage('guideline')}
                style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, aspectRatio: '1 / 1', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                title="Panduan Studio"
              >
                <BookOpen size={15} />
              </button>

              <button 
                type="button"
                onClick={handleBackupJson}
                style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, aspectRatio: '1 / 1', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                title="Backup JSON"
              >
                <DatabaseBackup size={15} />
              </button>

              <button 
                type="button"
                onClick={() => window.open(window.location.origin, '_blank')}
                style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, aspectRatio: '1 / 1', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                title="Website Publik"
              >
                <Globe size={15} />
              </button>
            </>
          )}

          {/* User Avatar */}
          <div 
            onClick={() => onSwitchPage('settings')}
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              minHeight: 36,
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.85)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.25)',
              flexShrink: 0
            }}
            title="Edit Profil"
          >
            {globalSettings?.biodata?.avatarUrl ? (
              <img src={globalSettings.biodata.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--cms-accent, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 13 }}>
                {(globalSettings?.biodata?.fullName || 'SA')[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CENTERED OS DESKTOP BODY (TIER 2 & TIER 3) ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
        gap: isMobile ? 8 : 12,
        position: 'relative',
        zIndex: 5,
        margin: 'auto 0'
      }}>
        {/* ══════ TIER 2: OS STAGE (CLOCK & SPOTLIGHT + PROJECT & HOLIDAY CALENDAR) ══════ */}
        <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : 'minmax(0, 1.25fr) minmax(360px, 0.95fr)',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 12 : 20,
        width: '100%',
        maxWidth: 1240,
        margin: isMobile ? '4px auto' : '8px auto',
        position: 'relative',
        zIndex: 5,
        boxSizing: 'border-box'
      }}>
        {/* Left Column: Clock, Greetings, Arc & Spotlight Omnibox */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile || isTablet ? 'center' : 'flex-start',
          textAlign: isMobile || isTablet ? 'center' : 'left',
          gap: isMobile ? 6 : 8,
          width: '100%'
        }}>
          {/* Massive OS Digital Clock */}
          <div style={{
            fontSize: 'clamp(36px, 5.2vw, 64px)',
            fontWeight: 950,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontFamily: 'monospace',
            color: isDarkSkyActive ? '#ffffff' : '#0f172a',
            textShadow: isDarkSkyActive ? '0 4px 24px rgba(0,0,0,0.45)' : 'none'
          }}>
            <HeroClockText />
          </div>

          {/* Dynamic Sapaan & Status Singkat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: isMobile || isTablet ? 'center' : 'flex-start' }}>
            <span style={{
              fontSize: isMobile ? 13 : 15,
              fontWeight: 900,
              color: isDarkSkyActive ? '#fde047' : '#0284c7'
            }}>
              {timeGreeting.text}, {globalSettings?.biodata?.fullName || 'Saiful'}
            </span>
            <span style={{ color: isDarkSkyActive ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }}>•</span>
            <span style={{
              fontSize: isMobile ? 11.5 : 12.5,
              fontWeight: 750,
              color: isDarkSkyActive ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.75)'
            }}>
              {timeGreeting.desc}
            </span>
          </div>

          {/* Dotted Celestial Parabolic Arc (Clean & Floating) */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 440, height: 24, margin: '2px 0' }}>
            <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
              <path
                d="M 12 55 Q 200 6 388 55"
                fill="none"
                stroke={isDarkSkyActive ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.25)'}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                left: `${3 + (94 * (celestialPositionPercent / 100))}%`,
                bottom: `${(10 + (70 * Math.sin((Math.PI * celestialPositionPercent) / 100)))}%`,
                transform: 'translate(-50%, 50%)',
                width: 14,
                height: 14,
                minWidth: 14,
                minHeight: 14,
                borderRadius: '50%',
                background: isDarkSkyActive ? '#38bdf8' : '#f59e0b',
                border: '2px solid #ffffff',
                boxShadow: isDarkSkyActive ? '0 0 14px rgba(56, 189, 248, 0.95)' : '0 0 14px rgba(245, 158, 11, 0.95)',
                pointerEvents: 'none',
                transition: 'left 0.4s ease-out, bottom 0.4s ease-out',
                zIndex: 4
              }}
            />
          </div>

          {/* Spotlight Omnibox Search Bar (Floating Glass Capsule) */}
          <form 
            onSubmit={handleExecuteSearch}
            style={{
              width: '100%',
              maxWidth: 520,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: isDarkSkyActive ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.85)',
              borderRadius: 100,
              padding: '4px 6px 4px 12px',
              border: '1.5px solid rgba(255, 255, 255, 0.28)',
              boxSizing: 'border-box',
              position: 'relative',
              zIndex: 10,
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
            }}
          >
            {/* Engine Dropdown Selector */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setEngineDropdownOpen(!engineDropdownOpen)}
                style={{
                  height: 30,
                  padding: '0 10px',
                  borderRadius: 100,
                  background: isDarkSkyActive ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
                  border: 'none',
                  color: isDarkSkyActive ? '#ffffff' : '#0f172a',
                  fontSize: 11,
                  fontWeight: 850,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <activeEngineObj.icon />
                <span>{activeEngineObj.name}</span>
                <ChevronDown size={11} />
              </button>

              {engineDropdownOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setEngineDropdownOpen(false)} />
                  <div style={{
                    position: 'absolute',
                    top: 36,
                    left: 0,
                    background: 'var(--cms-card-bg, #ffffff)',
                    borderRadius: 18,
                    border: '1.5px solid var(--glass-border)',
                    boxShadow: '0 18px 45px rgba(0,0,0,0.22)',
                    padding: 6,
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    minWidth: 180
                  }}>
                    {SEARCH_ENGINES.map(eng => {
                      const EngIcon = eng.icon;
                      const isSel = selectedEngine === eng.id;
                      return (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => { setSelectedEngine(eng.id); setEngineDropdownOpen(false); haptic.light(); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 12,
                            background: isSel ? 'var(--cms-accent-soft, rgba(99, 102, 241, 0.1))' : 'transparent',
                            color: isSel ? 'var(--cms-accent, #6366f1)' : 'var(--cms-text)',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: isSel ? 850 : 650,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <EngIcon />
                          <span>{eng.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeEngineObj.placeholder}
              style={{
                flex: 1,
                minWidth: 0,
                height: 30,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: isDarkSkyActive ? '#ffffff' : '#0f172a',
                fontSize: 12,
                fontWeight: 700,
                padding: '0 4px'
              }}
            />

            <button
              type="submit"
              style={{
                width: 30,
                height: 30,
                minWidth: 30,
                maxWidth: 30,
                minHeight: 30,
                maxHeight: 30,
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                padding: 0,
                background: activeEngineObj.color,
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 8px ${activeEngineObj.color}50`
              }}
              title={`Cari di ${activeEngineObj.name}`}
            >
              <Search size={13} color="#ffffff" style={{ display: 'block', flexShrink: 0 }} />
            </button>
          </form>
        </div>

        {/* Right Column: OS Desktop Project & Holiday Calendar Card */}
        <div style={{
          width: '100%',
          maxWidth: isMobile || isTablet ? 520 : 440,
          margin: isMobile || isTablet ? '0 auto' : '0 0 0 auto',
          background: isDarkSkyActive ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.72)',
          border: '1.2px solid rgba(255, 255, 255, 0.22)',
          borderRadius: 22,
          padding: isMobile ? '10px 12px' : '12px 14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          userSelect: 'none'
        }}>
          {/* Calendar Header: Month/Year + Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} color={isDarkSkyActive ? '#fde047' : '#7c3aed'} />
              <span style={{
                fontSize: 13,
                fontWeight: 900,
                color: isDarkSkyActive ? '#ffffff' : '#0f172a',
                letterSpacing: '-0.01em'
              }}>
                {MONTH_NAMES_ID[calMonth]} {calYear}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                  else setCalMonth(m => m - 1);
                  haptic.light();
                }}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: 'none', background: isDarkSkyActive ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                  color: isDarkSkyActive ? '#ffffff' : '#0f172a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
                title="Bulan Sebelumnya"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCalMonth(now.getMonth());
                  setCalYear(now.getFullYear());
                  setSelectedCalDay(now.getDate());
                  haptic.light();
                }}
                style={{
                  padding: '2px 8px', borderRadius: 9999,
                  border: 'none', background: isDarkSkyActive ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
                  color: isDarkSkyActive ? '#ffffff' : '#0f172a',
                  fontSize: 10, fontWeight: 800, cursor: 'pointer'
                }}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                  else setCalMonth(m => m + 1);
                  haptic.light();
                }}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: 'none', background: isDarkSkyActive ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                  color: isDarkSkyActive ? '#ffffff' : '#0f172a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
                title="Bulan Berikutnya"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* 7 Days Header (Senin s/d Minggu standard Indonesia) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2,
            textAlign: 'center',
            fontSize: 9.5,
            fontWeight: 800,
            color: isDarkSkyActive ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.45)',
            textTransform: 'uppercase'
          }}>
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d, idx) => (
              <div key={idx} style={{ color: idx === 6 ? '#f43f5e' : undefined }}>{d}</div>
            ))}
          </div>

          {/* Days Grid with Holiday & Project Deadline Dots */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2.5,
            textAlign: 'center'
          }}>
            {calendarDays.map((cell, idx) => {
              if (!cell.day) {
                return <div key={`empty-${idx}`} style={{ height: 25 }} />;
              }
              const isSelected = selectedCalDay === cell.day;
              const hasHoliday = !!cell.holiday;
              const hasDeadlines = cell.projectDeadlines && cell.projectDeadlines.length > 0;
              const isSunday = idx % 7 === 6;

              return (
                <div
                  key={`day-${cell.day}`}
                  onClick={() => {
                    setSelectedCalDay(cell.day);
                    haptic.light();
                  }}
                  style={{
                    height: 25,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 7,
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--cms-accent, #7c3aed)'
                      : cell.isToday
                        ? (isDarkSkyActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
                        : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : hasHoliday || isSunday
                        ? '#f43f5e'
                        : cell.isToday
                          ? (isDarkSkyActive ? '#fde047' : 'var(--cms-accent, #7c3aed)')
                          : (isDarkSkyActive ? '#ffffff' : '#0f172a'),
                    fontWeight: cell.isToday || isSelected ? 900 : 700,
                    fontSize: 10.5,
                    position: 'relative',
                    transition: 'all 0.12s ease'
                  }}
                  title={hasHoliday ? cell.holiday.name : hasDeadlines ? `${cell.projectDeadlines.length} Tenggat Proyek` : undefined}
                >
                  <span style={{ lineHeight: 1 }}>{cell.day}</span>
                  {/* Indicator dots container */}
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center', marginTop: 1 }}>
                    {hasHoliday && (
                      <span style={{
                        width: 3.5, height: 3.5, borderRadius: '50%',
                        background: isSelected ? '#ffffff' : '#f43f5e',
                        display: 'block'
                      }} />
                    )}
                    {hasDeadlines && (
                      <span style={{
                        width: 3.5, height: 3.5, borderRadius: '50%',
                        background: isSelected ? '#ffffff' : '#10b981',
                        display: 'block'
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Date Insight Strip & Direct Action to Projects */}
          <div style={{
            padding: '5px 8px',
            borderRadius: 9,
            background: isDarkSkyActive ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            fontSize: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              {selectedDayInfo?.holiday ? (
                <span style={{
                  color: '#f43f5e', fontWeight: 850,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {selectedDayInfo.holiday.name}
                </span>
              ) : selectedDayInfo?.projectDeadlines?.length ? (
                <span style={{
                  color: '#10b981', fontWeight: 850,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {selectedDayInfo.projectDeadlines.length} Tenggat: {selectedDayInfo.projectDeadlines[0].title}
                </span>
              ) : (
                <span style={{
                  color: isDarkSkyActive ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.6)',
                  fontWeight: 700
                }}>
                  {selectedCalDay} {MONTH_NAMES_ID[calMonth]}: Bebas Tenggat
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onSwitchPage('projects');
                haptic.light();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 9999,
                border: 'none',
                background: 'var(--cms-accent, #7c3aed)',
                color: '#ffffff',
                fontSize: 9.5,
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <FolderKanban size={11} />
              <span>Buka Proyek</span>
            </button>
          </div>

          {/* Micro Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 9.5,
            fontWeight: 750,
            color: isDarkSkyActive ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.55)',
            padding: '0 2px'
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#f43f5e' }} />
                <span>Hari Besar</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#10b981' }} />
                <span>Tenggat Proyek</span>
              </span>
            </div>
            <span>{totalDeadlinesThisMonth} Tenggat Bulan Ini</span>
          </div>
        </div>
      </div>

      {/* ══════ TIER 3: OS DESKTOP CANVAS (12 APPS ICON SAJA + 6 KPI WIDGETS) ══════ */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        width: '100%',
        maxWidth: 1240,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 12 : 16,
        boxSizing: 'border-box'
      }}>
        {/* Row A: 12 OS Desktop App Icons (ICON SAJA, CLEAN TRANSPARENT DOCK) */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(6, minmax(0, 1fr))' : isTablet ? 'repeat(8, minmax(0, 1fr))' : 'repeat(12, minmax(0, 1fr))',
          gap: isMobile ? 8 : 10,
          boxSizing: 'border-box',
          padding: '2px 0'
        }}>
          {OS_APPS.map((app, i) => {
            const AppIcon = app.icon;
            return (
              <div
                key={i}
                onClick={() => {
                  if (app.action) app.action();
                  else onSwitchPage(app.page);
                  haptic.light();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  userSelect: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
                title={app.label}
              >
                <div style={{
                  width: isMobile ? 38 : 44,
                  height: isMobile ? 38 : 44,
                  minWidth: isMobile ? 38 : 44,
                  minHeight: isMobile ? 38 : 44,
                  aspectRatio: '1 / 1',
                  borderRadius: 13,
                  background: `radial-gradient(circle at 35% 35%, ${app.color} 0%, ${app.color}dd 100%)`,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 5px 16px ${app.color}45, 0 2px 5px rgba(0,0,0,0.18)`,
                  flexShrink: 0
                }}>
                  <AppIcon size={isMobile ? 19 : 22} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Row B: 6 OS Desktop KPI Widgets */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : isTablet ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))',
          gap: isMobile ? 8 : 10,
          boxSizing: 'border-box'
        }}>
          {effectiveKpis.map((kpi, i) => {
            const KpiIcon = kpi.icon;
            return (
              <div
                key={i}
                onClick={() => {
                  onSwitchPage(kpi.page);
                  haptic.light();
                }}
                style={{
                  padding: isMobile ? '10px 10px 8px' : '12px 14px 10px',
                  borderRadius: 18,
                  background: isDarkSkyActive ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.65)',
                  border: '1.2px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 6,
                  cursor: 'pointer',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.background = isDarkSkyActive ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.85)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = isDarkSkyActive ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.65)';
                }}
                title={`Buka ${kpi.label}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 4 }}>
                  <span style={{
                    fontSize: isMobile ? 9.5 : 10.5,
                    fontWeight: 850,
                    color: isDarkSkyActive ? 'rgba(255, 255, 255, 0.82)' : 'rgba(15, 23, 42, 0.75)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {isMobile ? kpi.shortLabel : kpi.label}
                  </span>
                  <div style={{
                    width: isMobile ? 24 : 26,
                    height: isMobile ? 24 : 26,
                    minWidth: isMobile ? 24 : 26,
                    minHeight: isMobile ? 24 : 26,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${kpi.color}35 0%, ${kpi.color}15 100%)`,
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <KpiIcon size={isMobile ? 12 : 14} />
                  </div>
                </div>

                <div style={{
                  fontSize: isMobile ? 14 : 17,
                  fontWeight: 950,
                  color: isDarkSkyActive ? '#ffffff' : '#0f172a',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: isDarkSkyActive ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                }}>
                  {kpi.val}
                </div>

                {/* Progress Line Meter */}
                <div style={{
                  height: 4,
                  borderRadius: 100,
                  background: isDarkSkyActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(15, kpi.progress))}%`,
                    height: '100%',
                    borderRadius: 100,
                    background: kpi.progressGrad
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* ══════ TIER 4: FLOATING SCROLL CUE TO GADGET STATION ══════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
        zIndex: 5,
        paddingTop: 2
      }}>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('gadget-station-anchor');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else window.scrollBy({ top: 600, behavior: 'smooth' });
            haptic.light();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 16px',
            borderRadius: 9999,
            background: isDarkSkyActive ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.85)',
            border: '1.2px solid rgba(255, 255, 255, 0.25)',
            color: isDarkSkyActive ? '#ffffff' : '#0f172a',
            fontSize: 11,
            fontWeight: 850,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            transition: 'transform 0.18s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          title="Gulir ke Bawah untuk Buka Stasiun Gadget"
        >
          <ChevronDown size={13} color="#f59e0b" />
          <span>Gulir Bawah (Stasiun Gadget)</span>
          <ChevronDown size={13} color="#f59e0b" />
        </button>
      </div>

      {/* ══════ MODAL KUSTOMISASI WALLPAPER (WEBM, WEBP, VIDEO, GAMBAR, SOLID) ══════ */}
      {isWallpaperModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setIsWallpaperModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 580,
              background: '#0f172a',
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 24,
              boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
              padding: 22,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              color: '#ffffff',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em' }}>Kustomisasi Wallpaper Studio</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>Pilih Video WebM / MP4, Gambar WebP / PNG, atau Warna Solid</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWallpaperModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, background: 'rgba(255,255,255,0.06)', padding: 4, borderRadius: 12 }}>
              {[
                { id: 'image', label: 'Gambar/WebP', icon: ImageIcon },
                { id: 'video', label: 'Video/WebM', icon: Film },
                { id: 'solid', label: 'Warna Solid', icon: Palette },
                { id: 'default', label: 'Default Langit', icon: Sparkles }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = tempWallpaperType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setTempWallpaperType(tab.id as any);
                      setWallpaperUploadError(null);
                      haptic.light();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 4px',
                      borderRadius: 9,
                      border: 'none',
                      background: isActive ? 'var(--cms-accent, #6366f1)' : 'transparent',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <TabIcon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1 & 2: Video or Image Options */}
            {(tempWallpaperType === 'video' || tempWallpaperType === 'image') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* File Upload Zone */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.9)' }}>
                    Upload File dari Laptop / Komputer:
                  </label>
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '20px 16px',
                    borderRadius: 14,
                    border: '2px dashed rgba(255,255,255,0.22)',
                    background: 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'border-color 0.18s ease'
                  }}>
                    <input
                      type="file"
                      accept={tempWallpaperType === 'video' ? 'video/webm,video/mp4,video/*' : 'image/webp,image/png,image/jpeg,image/gif,image/*'}
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <Upload size={24} color="var(--cms-accent, #6366f1)" />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      Klik untuk pilih file {tempWallpaperType === 'video' ? 'WebM atau MP4' : 'WebP, PNG, atau JPG'}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)' }}>
                      Maksimal 20MB • Disimpan langsung di browser Anda
                    </span>
                  </label>
                </div>

                {/* Direct URL input */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.9)' }}>
                    Atau Masukkan URL Link Online:
                  </label>
                  <input
                    type="text"
                    value={tempWallpaperUrl}
                    onChange={e => {
                      setTempWallpaperUrl(e.target.value);
                      setWallpaperUploadError(null);
                    }}
                    placeholder={tempWallpaperType === 'video' ? 'https://example.com/loop.webm atau .mp4' : 'https://example.com/wallpaper.webp'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1.2px solid rgba(255,255,255,0.18)',
                      color: '#ffffff',
                      fontSize: 12.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {wallpaperUploadError && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 11 }}>
                    {wallpaperUploadError}
                  </div>
                )}

                {/* Curated Aesthetic Presets */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 800, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.75)' }}>
                    Preset Pilihan Siap Pakai:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {(tempWallpaperType === 'video' ? [
                      { name: 'Cyber Grid Loop', url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-changing-numbers-41604-large.mp4' },
                      { name: 'Space Stars Drift', url: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4' },
                      { name: 'Abstract Flowing Lights', url: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-41484-large.mp4' }
                    ] : [
                      { name: 'Cosmic Dark WebP', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80' },
                      { name: 'Minimalist Tokyo Night', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=80' },
                      { name: 'Aurora Borealis', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80' }
                    ]).map(pr => (
                      <button
                        key={pr.name}
                        type="button"
                        onClick={() => {
                          setTempWallpaperUrl(pr.url);
                          haptic.light();
                        }}
                        style={{
                          padding: '7px 8px',
                          borderRadius: 8,
                          border: tempWallpaperUrl === pr.url ? '1.5px solid var(--cms-accent, #6366f1)' : '1px solid rgba(255,255,255,0.12)',
                          background: tempWallpaperUrl === pr.url ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                          color: '#ffffff',
                          fontSize: 11,
                          fontWeight: 750,
                          cursor: 'pointer',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={pr.name}
                      >
                        {pr.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Solid Color */}
            {tempWallpaperType === 'solid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 800, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.9)' }}>
                  Pilih Warna Solid Minimalis:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {[
                    { name: 'Obsidian Black', color: '#090a0f' },
                    { name: 'Midnight Slate', color: '#0f172a' },
                    { name: 'Deep Space Navy', color: '#0a0e1a' },
                    { name: 'Forest Emerald', color: '#021812' },
                    { name: 'Burgundy Crimson', color: '#1a050d' },
                    { name: 'Graphite Dark', color: '#18181b' },
                    { name: 'Dark Purple', color: '#130826' },
                    { name: 'Deep Teal', color: '#041c24' },
                    { name: 'Warm Amber Black', color: '#191107' },
                    { name: 'Clean Charcoal', color: '#27272a' },
                    { name: 'Coffee Dark', color: '#1c130e' },
                    { name: 'Pure Deep Void', color: '#000000' }
                  ].map(sc => (
                    <div
                      key={sc.color}
                      onClick={() => {
                        setTempSolidColor(sc.color);
                        haptic.light();
                      }}
                      style={{
                        height: 38,
                        borderRadius: 10,
                        background: sc.color,
                        border: tempSolidColor === sc.color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: tempSolidColor === sc.color ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s ease'
                      }}
                      title={sc.name}
                    >
                      {tempSolidColor === sc.color && <Check size={16} color="#ffffff" />}
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, display: 'block', marginBottom: 4, color: 'rgba(255,255,255,0.7)' }}>
                    Kode Warna Hex:
                  </label>
                  <input
                    type="text"
                    value={tempSolidColor}
                    onChange={e => setTempSolidColor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontSize: 12
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Default Dynamic Sky Info */}
            {tempWallpaperType === 'default' && (
              <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fde047' }}>Langit Dinamis OS (Solid Minimalis)</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                  Gradien elegan solid berbasis waktu lokal (Pagi, Siang, Sore, Malam) dengan tampilan rapi, bersih, dan performa instan tanpa beban animasi celestial.
                </div>
              </div>
            )}

            {/* Overlay Dimming Scrim Slider (for video & image) */}
            {(tempWallpaperType === 'video' || tempWallpaperType === 'image') && (
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>Kegelapan Lapisan Overlay (Scrim):</span>
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--cms-accent, #6366f1)' }}>{tempOverlayOpacity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={tempOverlayOpacity}
                  onChange={e => setTempOverlayOpacity(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--cms-accent, #6366f1)' }}
                />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: 3 }}>
                  Makin gelap lapisan, jam dan kalender akan semakin kontras terbaca di atas video/gambar terang.
                </span>
              </div>
            )}

            {/* Live Mini Preview Box */}
            <div style={{
              width: '100%',
              height: 100,
              borderRadius: 14,
              overflow: 'hidden',
              position: 'relative',
              background: tempWallpaperType === 'solid' ? tempSolidColor : '#090a0f',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {tempWallpaperType === 'video' && tempWallpaperUrl && (
                <video src={tempWallpaperUrl} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {tempWallpaperType === 'image' && tempWallpaperUrl && (
                <img src={tempWallpaperUrl} alt="Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {tempWallpaperType === 'default' && (
                <div style={{ position: 'absolute', inset: 0, background: activeSkyGradient }} />
              )}
              {tempWallpaperType !== 'default' && (
                <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${tempOverlayOpacity / 100})` }} />
              )}
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace' }}>17:45:00 WIB</div>
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>Pratinjau Wallpaper OS</div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleResetWallpaper}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} />
                <span>Reset Default</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsWallpaperModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveWallpaper}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--cms-accent, #6366f1)',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)'
                  }}
                >
                  <Check size={14} />
                  <span>Terapkan Wallpaper</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HeroIdentityWidget;
