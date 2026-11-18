import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowRight, ArrowLeft, Activity, HardDrive, Users, Clock, Globe,
  ShieldAlert, Settings, LayoutGrid, Terminal, Database, Image as ImageIcon,
  FolderKanban, MessageSquare, Zap, AlertCircle, BarChart3, Wifi, BatteryCharging,
  Gauge, Search, ShieldCheck, RefreshCw, Cpu, Bell, Map, ListTodo, Send, 
  Layers, MousePointer, Share2, MemoryStick, Target, Layout, Sparkles, TrendingUp,
  Cpu as CpuIcon, Server, Shield, BrainCircuit, Rocket, ChevronRight, Fingerprint,
  Link, Workflow, DatabaseBackup, Network, Loader2, Palette, Smartphone, Save,
  User, Camera, MapPin, Phone, Link as LinkIcon, Building, CalendarDays, Code, Pencil, 
  GraduationCap, Briefcase, Award, ChevronUp, ChevronDown, Medal, FileText, Star, Navigation, 
  Tag, ShoppingBag, Plus, Copy, Check, Eye, Trash2, Edit3, BookmarkCheck, BookOpen, StickyNote,
  CheckCircle2, Circle, MessageSquareMore, Cloud, RefreshCcw, ExternalLink, X,
  Maximize2, Minimize2, Sliders, Contrast, Pipette, CheckCheck, SlidersHorizontal, Shapes,
  Type, Box, Lightbulb, Compass, Monitor, Sun, Moon, Flame, Filter, Download, Wand2,
  MoveLeft, MoveRight, DollarSign, Calendar, CheckSquare, Bookmark, Calculator, ArrowUpRight,
  BookmarkPlus, FolderHeart, Upload, FileCode, Globe2, Link2, QrCode,
  Gamepad2, Megaphone, Trophy, Play, Building2, CreditCard
} from 'lucide-react';
import { useBusinessProfile } from '../../hooks/useBusinessProfile';
import { auth, db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { performCmsAudit } from '../../utils/cmsAudit';
import { storage } from '../../utils/storage';
import { subscribeToGames } from '../../services/gameService';
import { useContextMenu } from './ContextMenuProvider';
import InfoTooltip from './InfoTooltip';
import { clear as clearIdb } from 'idb-keyval';
const DashboardTrafficBarChart = lazy(() => import('./DashboardTrafficBarChart'));
import { applyAccentColor } from '../../utils/theme';
import { haptic } from '../../utils/haptics';
import GlassColorPicker from './GlassColorPicker';
import HeroIdentityWidget from './HeroIdentityWidget';
import FlatSolidDashboard from './FlatSolidDashboard';


interface DashboardOverviewProps {
  pagesData: any;
  stickersData: any;
  globalSettings: any;
  projects?: any[];
  canvases?: any[];
  onSwitchPage: (page: string) => void;
  isMobile?: boolean;
  isTablet?: boolean;
}

// ── Color Theory Math Helpers ──
const hexToHsl = (hex: string): [number, number, number] => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substring(0, 2) || '0', 16) / 255;
  const g = parseInt(c.substring(2, 4) || '0', 16) / 255;
  const b = parseInt(c.substring(4, 6) || '0', 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const hslToHex = (h: number, s: number, l: number): string => {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const generateHarmony = (baseHex: string, mode: 'analogous' | 'complementary' | 'triadic' | 'split' | 'tetradic' | 'monochromatic') => {
  const [h, s, l] = hexToHsl(baseHex);
  switch (mode) {
    case 'analogous':
      return [
        hslToHex(h - 30, s, l),
        hslToHex(h - 15, s, l),
        baseHex,
        hslToHex(h + 15, s, l),
        hslToHex(h + 30, s, l)
      ];
    case 'complementary':
      return [
        baseHex,
        hslToHex(h, s, Math.min(90, l + 20)),
        hslToHex(h + 180, s, l),
        hslToHex(h + 180, s, Math.max(15, l - 20)),
        hslToHex(h + 180, Math.max(20, s - 30), l)
      ];
    case 'triadic':
      return [
        baseHex,
        hslToHex(h + 120, s, l),
        hslToHex(h + 240, s, l),
        hslToHex(h + 120, s, Math.min(90, l + 18)),
        hslToHex(h + 240, s, Math.max(15, l - 18))
      ];
    case 'split':
      return [
        baseHex,
        hslToHex(h + 150, s, l),
        hslToHex(h + 210, s, l),
        hslToHex(h, Math.max(20, s - 25), l),
        hslToHex(h + 180, s, Math.min(90, l + 20))
      ];
    case 'tetradic':
      return [
        baseHex,
        hslToHex(h + 90, s, l),
        hslToHex(h + 180, s, l),
        hslToHex(h + 270, s, l),
        hslToHex(h, s, Math.min(90, l + 25))
      ];
    case 'monochromatic':
    default:
      return [
        hslToHex(h, s, Math.max(15, l - 30)),
        hslToHex(h, s, Math.max(25, l - 15)),
        baseHex,
        hslToHex(h, Math.max(10, s - 15), Math.min(85, l + 15)),
        hslToHex(h, Math.max(5, s - 30), Math.min(95, l + 30))
      ];
  }
};

const getLuminance = (hex: string) => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2) || '0', 16) / 255;
  const g = parseInt(c.substring(2, 4) || '0', 16) / 255;
  const b = parseInt(c.substring(4, 6) || '0', 16) / 255;
  const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

const getContrastRatio = (hex1: string, hex2: string) => {
  try {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return ((lighter + 0.05) / (darker + 0.05)).toFixed(1);
  } catch {
    return '4.5';
  }
};

export type ColorGolongan = 'primer' | 'sekunder' | 'tersier' | 'netral';

export const COLOR_GOLONGAN_DATA: Record<ColorGolongan, { label: string; desc: string; colors: { name: string; hex: string; hue: number; sat: number; val: number }[] }> = {
  primer: {
    label: 'Primer',
    desc: 'Warna dasar murni (Merah, Kuning, Biru) yang tidak dapat dibentuk dari warna lain',
    colors: [
      { name: 'Merah Primer', hex: '#EF4444', hue: 0, sat: 84, val: 60 },
      { name: 'Kuning Primer', hex: '#EAB308', hue: 48, sat: 96, val: 47 },
      { name: 'Biru Primer', hex: '#3B82F6', hue: 217, sat: 91, val: 60 }
    ]
  },
  sekunder: {
    label: 'Sekunder',
    desc: 'Hasil percampuran seimbang dari 2 warna primer (Oranye, Hijau, Ungu)',
    colors: [
      { name: 'Oranye (M+K)', hex: '#F97316', hue: 25, sat: 95, val: 53 },
      { name: 'Hijau (K+B)', hex: '#10B981', hue: 160, sat: 84, val: 39 },
      { name: 'Ungu (B+M)', hex: '#8B5CF6', hue: 258, sat: 90, val: 66 }
    ]
  },
  tersier: {
    label: 'Tersier',
    desc: 'Hasil percampuran antara 1 warna primer dan 1 warna sekunder',
    colors: [
      { name: 'Red-Orange', hex: '#EA580C', hue: 20, sat: 90, val: 48 },
      { name: 'Yellow-Green', hue: 84, sat: 81, val: 44, hex: '#84CC16' },
      { name: 'Blue-Green', hex: '#06B6D4', hue: 189, sat: 94, val: 43 },
      { name: 'Blue-Violet', hex: '#6366F1', hue: 239, sat: 84, val: 67 },
      { name: 'Red-Violet', hex: '#D946EF', hue: 292, sat: 84, val: 61 }
    ]
  },
  netral: {
    label: 'Netral',
    desc: 'Warna rendah saturasi untuk fondasi UI, kontras teks, dan latar belakang',
    colors: [
      { name: 'Dark Slate', hex: '#0F172A', hue: 222, sat: 47, val: 11 },
      { name: 'Cool Gray', hex: '#64748B', hue: 215, sat: 16, val: 47 },
      { name: 'Warm Stone', hex: '#78716C', hue: 28, sat: 5, val: 45 },
      { name: 'Pure Snow', hex: '#F8FAFC', hue: 210, sat: 40, val: 98 }
    ]
  }
};

const detectColorGolongan = (h: number, s: number, l: number): ColorGolongan => {
  if (s <= 18 || l <= 12 || l >= 92) return 'netral';
  if ((h >= 350 || h <= 10) || (h >= 50 && h <= 65) || (h >= 225 && h <= 245)) return 'primer';
  if ((h >= 25 && h <= 40) || (h >= 115 && h <= 135) || (h >= 270 && h <= 290)) return 'sekunder';
  return 'tersier';
};

export interface SavedColorPalette {
  id: string;
  name: string;
  baseHex: string;
  mode: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split' | 'tetradic';
  golongan: ColorGolongan;
  colors: string[];
  createdAt: string;
}

// ── Interactive Color Wheel Component ──
interface InteractiveColorWheelProps {
  hue: number;
  mode: 'analogous' | 'complementary' | 'triadic' | 'split' | 'tetradic' | 'monochromatic';
  onHueChange: (newHue: number) => void;
  size?: number;
  baseHex?: string;
}

const InteractiveColorWheel: React.FC<InteractiveColorWheelProps> = ({ hue, mode, onHueChange, size = 230, baseHex = '#7c3aed' }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const radius = size / 2;
  const strokeWidth = Math.max(22, size * 0.15);
  const trackRadius = radius - strokeWidth / 2;

  const handlePointer = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (angle < 0) angle += 360;
    onHueChange(angle);
    haptic.light();
  }, [onHueChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePointer(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handlePointer(e.clientX, e.clientY);
    };
    const onMouseUp = () => setIsDragging(false);
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handlePointer]);

  const harmonicAngles = useMemo(() => {
    switch (mode) {
      case 'analogous':
        return [(hue - 30 + 360) % 360, (hue - 15 + 360) % 360, hue, (hue + 15) % 360, (hue + 30) % 360];
      case 'complementary':
        return [hue, (hue + 180) % 360];
      case 'triadic':
        return [hue, (hue + 120) % 360, (hue + 240) % 360];
      case 'split':
        return [hue, (hue + 150) % 360, (hue + 210) % 360];
      case 'tetradic':
        return [hue, (hue + 90) % 360, (hue + 180) % 360, (hue + 270) % 360];
      case 'monochromatic':
      default:
        return [hue];
    }
  }, [hue, mode]);

  const getPointCoord = (ang: number) => {
    const rad = (ang * Math.PI) / 180;
    return {
      x: radius + trackRadius * Math.cos(rad),
      y: radius + trackRadius * Math.sin(rad)
    };
  };

  return (
    <div
      ref={wheelRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'relative',
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        aspectRatio: '1 / 1',
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'grab',
        flexShrink: 0,
        borderRadius: '50%'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          boxShadow: '0 8px 24px -2px rgba(0,0,0,0.35), 0 0 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: '50%',
            background: 'var(--cms-card-bg, #101018)',
            border: '1.5px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.25)',
            gap: 2
          }}
        >
          {/* Enlarged Crisp Color Preview Dot */}
          <div style={{
            width: 22,
            height: 22,
            minWidth: 22,
            minHeight: 22,
            aspectRatio: '1 / 1',
            borderRadius: '50%',
            background: baseHex,
            border: '2px solid #ffffff',
            boxShadow: `0 0 14px ${baseHex}bb, 0 2px 6px rgba(0,0,0,0.35)`,
            marginBottom: 3,
            transition: 'background 0.15s ease, box-shadow 0.15s ease'
          }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{mode}</span>
          <span style={{ fontSize: 16, fontWeight: 950, color: 'var(--cms-text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{hue}°</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-accent)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{baseHex}</span>
        </div>
      </div>

      <svg style={{ position: 'absolute', inset: 0, width: size, height: size, pointerEvents: 'none', overflow: 'visible' }} viewBox={`0 0 ${size} ${size}`}>
        {harmonicAngles.length > 1 && (
          <polygon
            points={harmonicAngles.map(a => `${getPointCoord(a).x},${getPointCoord(a).y}`).join(' ')}
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}
        {harmonicAngles.map((ang, idx) => {
          const pt = getPointCoord(ang);
          const isBase = ang === hue;
          return (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isBase ? 9.5 : 6.5}
                fill={hslToHex(ang, 100, 50)}
                stroke="#ffffff"
                strokeWidth={isBase ? 2.5 : 1.5}
                style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Massive Curated Canvas Presets ──
interface CanvasPreset {
  id: string;
  category: 'social' | 'portfolio' | 'print' | 'digital';
  name: string;
  width: number;
  height: number;
  ratio: string;
  unit: string;
  dpi?: number;
  badge: string;
}

const INITIAL_CANVAS_DATABASE: CanvasPreset[] = [
  { id: 'ig-square', category: 'social', name: 'Instagram Feed Square', width: 1080, height: 1080, ratio: '1:1', unit: 'px', badge: 'IG 1:1' },
  { id: 'ig-portrait', category: 'social', name: 'Instagram Carousel Portrait', width: 1080, height: 1350, ratio: '4:5', unit: 'px', badge: 'IG 4:5' },
  { id: 'ig-story', category: 'social', name: 'Stories / Reels / TikTok', width: 1080, height: 1920, ratio: '9:16', unit: 'px', badge: '9:16 Video' },
  { id: 'yt-banner', category: 'social', name: 'YouTube Channel Header', width: 2560, height: 1440, ratio: '16:9', unit: 'px', badge: 'YT Banner' },
  { id: 'x-header', category: 'social', name: 'Twitter / X Header', width: 1500, height: 500, ratio: '3:1', unit: 'px', badge: 'X Header' },
  { id: 'x-post', category: 'social', name: 'Twitter / X Feed Post', width: 1200, height: 675, ratio: '16:9', unit: 'px', badge: 'X Post' },
  { id: 'fb-cover', category: 'social', name: 'Facebook Page Cover', width: 1640, height: 924, ratio: '16:9', unit: 'px', badge: 'FB Cover' },
  { id: 'li-banner', category: 'social', name: 'LinkedIn Company Banner', width: 1584, height: 396, ratio: '4:1', unit: 'px', badge: 'LinkedIn' },
  { id: 'pin-pin', category: 'social', name: 'Pinterest Long Pin', width: 1000, height: 1500, ratio: '2:3', unit: 'px', badge: 'Pinterest' },
  
  { id: 'behance-header', category: 'portfolio', name: 'Behance Project Cover', width: 1920, height: 1080, ratio: '16:9', unit: 'px', badge: 'Behance HD' },
  { id: 'dribbble-shot', category: 'portfolio', name: 'Dribbble Standard HD Shot', width: 1600, height: 1200, ratio: '4:3', unit: 'px', badge: 'Dribbble 4:3' },
  { id: 'dribbble-4k', category: 'portfolio', name: 'Dribbble 4K Ultra Shot', width: 2800, height: 2100, ratio: '4:3', unit: 'px', badge: 'Dribbble Ultra' },
  { id: 'yt-thumbnail', category: 'portfolio', name: 'YouTube Video Thumbnail', width: 1280, height: 720, ratio: '16:9', unit: 'px', badge: 'YouTube 720p' },
  { id: 'web-hero-fhd', category: 'portfolio', name: 'Website Hero Section 1080p', width: 1920, height: 1080, ratio: '16:9', unit: 'px', badge: 'FHD Hero' },
  { id: 'web-og-image', category: 'portfolio', name: 'OpenGraph Link Preview', width: 1200, height: 630, ratio: '1.91:1', unit: 'px', badge: 'OG Meta' },

  { id: 'print-a4', category: 'print', name: 'Poster / Dokumen Cetak A4', width: 2480, height: 3508, ratio: '1:1.41', unit: 'px', dpi: 300, badge: 'A4 300DPI' },
  { id: 'print-a3', category: 'print', name: 'Poster / Layout Cetak A3', width: 3508, height: 4960, ratio: '1:1.41', unit: 'px', dpi: 300, badge: 'A3 300DPI' },
  { id: 'print-a5', category: 'print', name: 'Flyer / Brosur Cetak A5', width: 1748, height: 2480, ratio: '1:1.41', unit: 'px', dpi: 300, badge: 'A5 300DPI' },
  { id: 'print-namecard', category: 'print', name: 'Kartu Nama Bisnis Standar', width: 1050, height: 600, ratio: '7:4', unit: 'px', dpi: 300, badge: 'Card 300DPI' },
  { id: 'print-tshirt', category: 'print', name: 'Desain Kaos DTF / Sablon A3', width: 3600, height: 4800, ratio: '3:4', unit: 'px', dpi: 300, badge: 'T-Shirt DTF' },
  { id: 'print-rollup', category: 'print', name: 'Rollup Banner 80x200cm', width: 4724, height: 11811, ratio: '1:2.5', unit: 'px', dpi: 150, badge: 'Rollup' },

  { id: 'app-icon-ios', category: 'digital', name: 'iOS & iPadOS App Icon', width: 1024, height: 1024, ratio: '1:1', unit: 'px', badge: 'iOS Icon' },
  { id: 'app-splash', category: 'digital', name: 'Mobile App Splash Screen', width: 1242, height: 2688, ratio: '9:19.5', unit: 'px', badge: 'Splash 9:19.5' },
  { id: 'play-feature', category: 'digital', name: 'Google Play Feature Graphic', width: 1024, height: 500, ratio: '2:1', unit: 'px', badge: 'Play Feature' },
  { id: 'favicon-hd', category: 'digital', name: 'Favicon Web Multi-Res', width: 512, height: 512, ratio: '1:1', unit: 'px', badge: 'Favicon 512' }
];

interface DesignerResource {
  name: string;
  desc: string;
  url: string;
  category: 'typography' | 'icons' | 'mockup' | 'inspiration' | 'colors' | 'stock';
  icon: any;
  color: string;
}

const EXTENDED_DESIGN_RESOURCES: DesignerResource[] = [
  { name: 'Google Fonts', desc: '1500+ Web & Variable Fonts', url: 'https://fonts.google.com', category: 'typography', icon: Type, color: '#ea4335' },
  { name: 'Fontshare', desc: 'Free Pro Quality Fonts by ITF', url: 'https://fontshare.com', category: 'typography', icon: Type, color: '#2563eb' },
  { name: 'Typewolf', desc: 'Curated Typography Inspiration', url: 'https://typewolf.com', category: 'typography', icon: Type, color: '#d97706' },
  { name: 'DaFont', desc: 'Thematic & Display Fonts', url: 'https://dafont.com', category: 'typography', icon: Type, color: '#ec4899' },
  { name: 'FontPair', desc: 'AI Font Pairings & Scales', url: 'https://fontpair.co', category: 'typography', icon: Type, color: '#10b981' },
  { name: 'Lucide Icons', desc: 'Crisp & Modern Icon Library', url: 'https://lucide.dev/icons', category: 'icons', icon: Shapes, color: '#f43f5e' },
  { name: 'Iconify', desc: '100,000+ Unified Vector Sets', url: 'https://icon-sets.iconify.design', category: 'icons', icon: Sparkles, color: '#06b6d4' },
  { name: 'Freepik', desc: 'Vector Graphic & PSD Mockup', url: 'https://freepik.com', category: 'icons', icon: Box, color: '#1273eb' },
  { name: 'SVG Repo', desc: '500,000+ Open SVG Vectors', url: 'https://svgrepo.com', category: 'icons', icon: Code, color: '#10b981' },
  { name: 'Behance', desc: 'Creative Showcase by Adobe', url: 'https://behance.net', category: 'inspiration', icon: Briefcase, color: '#0057ff' },
  { name: 'Dribbble', desc: 'Design Shots, UI & Branding', url: 'https://dribbble.com', category: 'inspiration', icon: Compass, color: '#ea4c89' },
  { name: 'Awwwards', desc: 'Best Web Design Recognitions', url: 'https://awwwards.com', category: 'inspiration', icon: Award, color: '#22c55e' },
  { name: 'Mobbin', desc: 'Mobile & Web Real UX Patterns', url: 'https://mobbin.com', category: 'inspiration', icon: Smartphone, color: '#8b5cf6' },
  { name: 'Coolors', desc: 'Super Fast Palette Engine', url: 'https://coolors.co', category: 'colors', icon: Palette, color: '#0066ff' },
  { name: 'Adobe Color', desc: 'Interactive Wheel & Trends', url: 'https://color.adobe.com', category: 'colors', icon: Palette, color: '#ff0000' },
  { name: 'Color Hunt', desc: 'Curated Beautiful Palettes', url: 'https://colorhunt.co', category: 'colors', icon: Palette, color: '#14b8a6' },
  { name: 'Khroma AI', desc: 'Personalized AI Color Engine', url: 'https://khroma.co', category: 'colors', icon: BrainCircuit, color: '#a855f7' },
  { name: 'Mockup World', desc: 'Free Photorealistic PSDs', url: 'https://mockupworld.co', category: 'mockup', icon: Box, color: '#f59e0b' },
  { name: 'Shots.so', desc: 'Studio Browser Mockup Generator', url: 'https://shots.so', category: 'mockup', icon: Monitor, color: '#3b82f6' },
  { name: 'Spline 3D', desc: 'Interactive 3D Web Design', url: 'https://spline.design', category: 'mockup', icon: Box, color: '#ec4899' },
  { name: 'Unsplash', desc: 'High-Resolution Free Imagery', url: 'https://unsplash.com', category: 'stock', icon: Camera, color: '#111111' },
  { name: 'Pexels', desc: 'Free Stock Photos & 4K Footage', url: 'https://pexels.com', category: 'stock', icon: ImageIcon, color: '#059669' },
  { name: 'Mixkit', desc: 'Free Stock Videos, Audio & Art', url: 'https://mixkit.co', category: 'stock', icon: Flame, color: '#f97316' }
];

const CURATED_DESIGN_TRENDS = [
  { tag: 'Trend 2026', title: 'Bento Grid Architecture', desc: 'Tata letak modular 12-kolom dengan sudut membulat dan visual grouping presisi.', url: 'https://behance.net/search/projects?search=bento+grid' },
  { tag: 'Tipografi', title: 'Kinetic & Editorial Serif', desc: 'Kombinasi headline serif elegan berpadu sans-serif modern yang ekspresif.', url: 'https://typewolf.com' },
  { tag: 'Visual Style', title: 'Glassmorphism & Frosted Mesh', desc: 'Gradien lembut bertekstur blur dinamis yang hidup di layar OLED.', url: 'https://dribbble.com/tags/glassmorphism' },
  { tag: 'Interaksi', title: 'Micro-Interactions & Haptics', desc: 'Umpan balik sentuhan dan transisi 60fps yang terasa responsif.', url: 'https://mobbin.com' }
];

// ── Interactive Deliverable Task Interface ──
interface DeliverableTask {
  id: string;
  title: string;
  client: string;
  stage: 'briefing' | 'design' | 'revision' | 'approved';
  category: string;
  budget?: string;
  deadline?: string;
  notes?: string;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  pagesData, 
  stickersData, 
  globalSettings, 
  projects: initialProjects = [], 
  canvases = [], 
  onSwitchPage, 
  isMobile: isMobileProp = false, 
  isTablet: isTabletProp = false 
}) => {
  const [winWidth, setWinWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = isMobileProp || winWidth <= 768;
  const isTablet = isTabletProp || (winWidth > 768 && winWidth <= 1024);
  const isCompact = isMobile || isTablet;
  const { bindContextMenu } = useContextMenu();
  const { profile: businessProfile } = useBusinessProfile();

  // ── Dashboard Studio Filter Tabs ──
  const [studioTab, setStudioTab] = useState<'all' | 'website' | 'design' | 'business' | 'system'>('all');

  // ── Show Gadget Station Toggle ──
  const [showGadgetStation, setShowGadgetStation] = useState(false);

  // ── 4 Grouped Collapsible Suites State (Auto-ciutkan & lebarkan) ──
  const [expandedSuites, setExpandedSuites] = useState<{ [k: string]: boolean }>({

    web: false,
    design: false,
    business: false,
    system: false
  });

  const toggleSuite = (key: string) => {
    setExpandedSuites(prev => ({ ...prev, [key]: !prev[key] }));
    haptic.light();
  };

  const expandAllSuites = () => {
    setExpandedSuites({ web: true, design: true, business: true, system: true });
    haptic.medium();
  };

  const collapseAllSuites = () => {
    setExpandedSuites({ web: false, design: false, business: false, system: false });
    haptic.medium();
  };

  const handleExpandFromDock = (suiteKey: string) => {
    if (suiteKey === 'all') {
      // Keep state
    } else if (suiteKey === 'website') {
      setExpandedSuites(prev => ({ ...prev, web: true }));
    } else {
      setExpandedSuites(prev => ({ ...prev, [suiteKey]: true }));
    }
  };

  // ── True Fullscreen Application View State & Slash Route URL Sync ──
  const [fullscreenApp, setFullscreenApp] = useState<'color' | 'canvas' | 'trends' | 'resources' | 'pipeline' | null>(null);

  const openFullscreenStudio = (app: 'color' | 'canvas' | 'trends' | 'resources' | 'pipeline') => {
    setFullscreenApp(app);
    const slugMap = {
      color: 'color-studio',
      canvas: 'canvas-studio',
      trends: 'trends-radar',
      resources: 'resource-vault',
      pipeline: 'pipeline-kanban'
    };
    const targetUrl = `/admin/dashboard/${slugMap[app]}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ studioApp: app }, '', targetUrl);
    }
    haptic.light();
  };

  const closeFullscreenStudio = () => {
    setFullscreenApp(null);
    if (window.location.pathname.startsWith('/admin/dashboard/')) {
      window.history.pushState({}, '', '/admin/dashboard');
    }
  };

  useEffect(() => {
    const syncFromUrl = () => {
      const p = window.location.pathname;
      if (p.includes('/color-studio')) setFullscreenApp('color');
      else if (p.includes('/canvas-studio')) setFullscreenApp('canvas');
      else if (p.includes('/trends-radar')) setFullscreenApp('trends');
      else if (p.includes('/resource-vault')) setFullscreenApp('resources');
      else if (p.includes('/pipeline-kanban')) setFullscreenApp('pipeline');
      else if (p === '/admin/dashboard' || p === '/admin' || p === '/admin/') setFullscreenApp(null);
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Keyboard Esc listener to close Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFullscreenStudio();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Live Realtime Database Subscriptions ──
  const [liveProjects, setLiveProjects] = useState<any[]>(initialProjects);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mainWebsiteData, setMainWebsiteData] = useState<any>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [foldersList, setFoldersList] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [syncMode, setSyncMode] = useState<string>(() => localStorage.getItem('porto_sync_mode') || 'manual');

  // ── Advanced Color Theory Engine States ──
  const [baseColorHex, setBaseColorHex] = useState<string>('#7c3aed');
  const [colorTheoryMode, setColorTheoryMode] = useState<'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split' | 'tetradic'>('analogous');
  const [selectedGolonganTab, setSelectedGolonganTab] = useState<ColorGolongan>('primer');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedGradient, setCopiedGradient] = useState(false);
  const [showColorSliders, setShowColorSliders] = useState(true);
  const [copiedPaletteFormat, setCopiedPaletteFormat] = useState<string | null>(null);
  const [aiPaletteLoading, setAiPaletteLoading] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<SavedColorPalette[]>(() => {
    try {
      const saved = localStorage.getItem('porto_saved_palettes');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'pal-1',
        name: 'Cyber Violet Neon',
        baseHex: '#7C3AED',
        mode: 'analogous',
        golongan: 'sekunder',
        colors: ['#7C3AED', '#A855F7', '#C084FC', '#6366F1', '#818CF8'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'pal-2',
        name: 'Emerald Noir Pro',
        baseHex: '#10B981',
        mode: 'triadic',
        golongan: 'sekunder',
        colors: ['#10B981', '#059669', '#34D399', '#3B82F6', '#F59E0B'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'pal-3',
        name: 'Sunset Crimson Gradient',
        baseHex: '#F43F5E',
        mode: 'split',
        golongan: 'primer',
        colors: ['#F43F5E', '#FB7185', '#FDA4AF', '#06B6D4', '#10B981'],
        createdAt: new Date().toISOString()
      }
    ];
  });
  const [showSavedCatalogModal, setShowSavedCatalogModal] = useState(false);
  const [paletteSaveName, setPaletteSaveName] = useState('');
  const [showSaveInputModal, setShowSaveInputModal] = useState(false);
  const [paletteCatalogSearch, setPaletteCatalogSearch] = useState('');

  // Lock scroll and reset position to top whenever fullscreen app opens
  useEffect(() => {
    if (fullscreenApp) {
      const rootEl = document.querySelector('.dashboard-overview-root');
      if (rootEl) rootEl.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, [fullscreenApp]);

  // ── Canvas Database & Search State ──
  const [canvasDatabase, setCanvasDatabase] = useState<CanvasPreset[]>(() => {
    try {
      const saved = localStorage.getItem('porto_extended_canvases');
      return saved ? JSON.parse(saved) : INITIAL_CANVAS_DATABASE;
    } catch {
      return INITIAL_CANVAS_DATABASE;
    }
  });
  const [canvasCategoryTab, setCanvasCategoryTab] = useState<'all' | 'social' | 'portfolio' | 'print' | 'digital'>('all');
  const [canvasSearchQuery, setCanvasSearchQuery] = useState('');
  const [copiedDim, setCopiedDim] = useState<string | null>(null);
  const [aiCanvasPrompt, setAiCanvasPrompt] = useState('');
  const [aiCanvasLoading, setAiCanvasLoading] = useState(false);

  // ── Canvas Unit Calculator State ──
  const [calcW, setCalcW] = useState(1920);
  const [calcH, setCalcH] = useState(1080);
  const [calcDpi, setCalcDpi] = useState(300);
  const [isDpiDropdownOpen, setIsDpiDropdownOpen] = useState(false);

  // ── Interactive Deliverables Kanban Pipeline State ──
  const [kanbanTasks, setKanbanTasks] = useState<DeliverableTask[]>(() => {
    try {
      const saved = localStorage.getItem('porto_kanban_deliverables');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: 't1', title: 'Branding Identitas Visual', client: 'Klien Prioritas', stage: 'briefing', category: 'Branding', budget: 'Rp 4.500.000', deadline: '2026-09-10' },
      { id: 't2', title: 'UI Kit & Desain Halaman Web', client: 'PT Studio Digital', stage: 'design', category: 'UI/UX', budget: 'Rp 6.000.000', deadline: '2026-09-15' },
      { id: 't3', title: 'Brosur & Packaging Produk', client: 'Lumina Brand', stage: 'revision', category: 'Print', budget: 'Rp 2.500.000', deadline: '2026-09-08' },
      { id: 't4', title: 'Asset Ilustrasi & Banner', client: 'FinPay Media', stage: 'approved', category: 'Graphic', budget: 'Rp 3.000.000', deadline: '2026-09-05' }
    ];
  });
  const [selectedTask, setSelectedTask] = useState<DeliverableTask | null>(null);
  const [newKanbanTitle, setNewKanbanTitle] = useState('');
  const [newKanbanClient, setNewKanbanClient] = useState('');
  const [addingToStage, setAddingToStage] = useState<'briefing' | 'design' | 'revision' | 'approved' | null>(null);

  // Save Kanban Tasks
  const updateKanbanTasks = (newTasks: DeliverableTask[]) => {
    setKanbanTasks(newTasks);
    localStorage.setItem('porto_kanban_deliverables', JSON.stringify(newTasks));
  };

  const handleMoveTaskStage = (taskId: string, direction: 'prev' | 'next') => {
    const stages: ('briefing' | 'design' | 'revision' | 'approved')[] = ['briefing', 'design', 'revision', 'approved'];
    const updated = kanbanTasks.map(t => {
      if (t.id === taskId) {
        const curIdx = stages.indexOf(t.stage);
        const nextIdx = direction === 'next' ? Math.min(stages.length - 1, curIdx + 1) : Math.max(0, curIdx - 1);
        return { ...t, stage: stages[nextIdx] };
      }
      return t;
    });
    updateKanbanTasks(updated);
    haptic.light();
  };

  const handleCreateKanbanTask = (stage: 'briefing' | 'design' | 'revision' | 'approved') => {
    if (!newKanbanTitle.trim()) return;
    const newTask: DeliverableTask = {
      id: 'task_' + Date.now(),
      title: newKanbanTitle.trim(),
      client: newKanbanClient.trim() || 'Klien Langsung',
      stage,
      category: 'Desain',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    };
    updateKanbanTasks([newTask, ...kanbanTasks]);
    setNewKanbanTitle('');
    setNewKanbanClient('');
    setAddingToStage(null);
    haptic.medium();
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Item "${newTask.title}" berhasil ditambahkan!`, type: 'success' } }));
  };

  const handleDeleteKanbanTask = (taskId: string) => {
    const updated = kanbanTasks.filter(t => t.id !== taskId);
    updateKanbanTasks(updated);
    if (selectedTask?.id === taskId) setSelectedTask(null);
    haptic.light();
  };

  // ── Keyboard Esc listener to close Fullscreen ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenApp(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Resource Category Filter State ──
  const [resourceCategory, setResourceCategory] = useState<string>('all');

  // ── AI Design Idea Generator ──
  const [aiDesignPrompt, setAiDesignPrompt] = useState<string>('');
  const [aiDesignLoading, setAiDesignLoading] = useState<boolean>(false);
  const [aiDesignResult, setAiDesignResult] = useState<string>('');
  const [aiDesignCopied, setAiDesignCopied] = useState<boolean>(false);

  // ── Profile CV Accordion ──
  const [isCvExpanded, setIsCvExpanded] = useState(false);

  // ── Goals Tracker State ──
  const [monthlyGoals, setMonthlyGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('porto_monthly_goals');
      return saved ? JSON.parse(saved) : { revenue: 5000000, projects: 4, articles: 4 };
    } catch {
      return { revenue: 5000000, projects: 4, articles: 4 };
    }
  });
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState(monthlyGoals);

  // ── Interactive Quick To-Do List State ──
  const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('porto_quick_todos');
      return saved ? JSON.parse(saved) : [
        { id: '1', text: 'Perbarui aset portofolio utama', done: true },
        { id: '2', text: 'Kirim brief proposal ke calon klien', done: false },
        { id: '3', text: 'Uji kontras palet warna branding', done: false }
      ];
    } catch {
      return [
        { id: '1', text: 'Perbarui aset portofolio utama', done: true },
        { id: '2', text: 'Kirim brief proposal ke calon klien', done: false }
      ];
    }
  });
  const [newTodoInput, setNewTodoInput] = useState('');

  // ── AI Quick Studio State ──
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMode, setAiMode] = useState<'article' | 'project' | 'copywriting'>('article');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiCopied, setAiCopied] = useState(false);

  // ── Admin Scratchpad Memo State ──
  const [adminNotes, setAdminNotes] = useState(() => localStorage.getItem('porto_admin_quick_notes') || '');
  const [notesCopied, setNotesCopied] = useState(false);

  // ── Telemetry & Heartbeat ──
  const [liveNotifs, setLiveNotifs] = useState<any[]>([]);
  const [heartbeatState, setHeartbeatState] = useState({ cpu: 6, ram: 42.1, latency: 22 });
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [liveGames, setLiveGames] = useState<any[]>([]);
  const [gameLicenses, setGameLicenses] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch to guarantee non-empty live state on mount
    const fetchInitialData = async () => {
      try {
        const [proj1, tx] = await Promise.all([
          storage.getItem<any[]>('porto_projects', []),
          storage.getItem<any[]>('porto_transactions', [])
        ]);
        const validProjects = Array.isArray(proj1) ? proj1 : [];
        setLiveProjects(validProjects);
        if (Array.isArray(tx) && tx.length > 0) {
          setTransactions(tx);
        }
      } catch (err) {
        console.warn('[DashboardOverview] fetchInitialData error:', err);
      }
    };
    fetchInitialData();

    const unsubProjects = storage.listenItem('porto_projects', (data) => {
      if (Array.isArray(data)) setLiveProjects(data);
    });
    const unsubTx = storage.listenItem('porto_transactions', (data) => setTransactions(data || []));
    const unsubWeb = storage.listenItem('porto_main_website', (data) => setMainWebsiteData(data || null));
    const unsubBlog = storage.listenItem('porto_blog_posts', (data) => setBlogPosts(data || []));
    const unsubProd = storage.listenItem('porto_catalog_products', (data) => setCatalogProducts(data || []));
    const unsubNotes = storage.listenItem('porto_memo_notes', (data) => setNotesList(data || []));
    const unsubFolders = storage.listenItem('porto_memo_folders', (data) => setFoldersList(data || []));
    const unsubBookings = storage.listenItem('porto_bookings', (data) => setBookingsList(data || []));
    const unsubGames = subscribeToGames((data) => {
      if (Array.isArray(data)) setLiveGames(data);
    });
    const unsubLicenses = storage.listenItem('porto_game_licenses', (data) => {
      if (Array.isArray(data)) setGameLicenses(data);
    });

    const unsubChats = storage.listenItem('porto_conversations', (data) => {
      setRecentChats(Array.isArray(data) ? data.slice(0, 4) : []);
    });

    const handleProjectsUpdate = (e: any) => {
      if (Array.isArray(e.detail)) setLiveProjects(e.detail);
    };
    const handleTxUpdate = (e: any) => {
      if (Array.isArray(e.detail)) setTransactions(e.detail);
    };
    const handleStorageDirty = () => {
      fetchInitialData();
    };

    window.addEventListener('porto_projects_updated', handleProjectsUpdate);
    window.addEventListener('porto_transactions_updated', handleTxUpdate);
    window.addEventListener('porto_storage_dirty', handleStorageDirty);

    const handleSyncChange = (e: any) => {
      if (e.detail?.mode) setSyncMode(e.detail.mode);
    };
    window.addEventListener('porto_sync_mode_changed', handleSyncChange);

    return () => {
      unsubProjects();
      unsubTx();
      unsubWeb();
      unsubBlog();
      unsubProd();
      unsubNotes();
      unsubFolders();
      unsubBookings();
      unsubGames();
      unsubLicenses();
      unsubChats();
      window.removeEventListener('porto_projects_updated', handleProjectsUpdate);
      window.removeEventListener('porto_transactions_updated', handleTxUpdate);
      window.removeEventListener('porto_storage_dirty', handleStorageDirty);
      window.removeEventListener('porto_sync_mode_changed', handleSyncChange);
    };
  }, []);

  // ── Color Calculations ──
  const [currentH, currentS, currentL] = useMemo(() => hexToHsl(baseColorHex), [baseColorHex]);

  const generatedHarmonicColors = useMemo(() => {
    return generateHarmony(baseColorHex, colorTheoryMode);
  }, [baseColorHex, colorTheoryMode]);

  const currentColorGolongan = useMemo(() => {
    return detectColorGolongan(currentH, currentS, currentL);
  }, [currentH, currentS, currentL]);

  const darkContrast = useMemo(() => {
    return parseFloat(getContrastRatio(baseColorHex, '#0B0F19'));
  }, [baseColorHex]);

  const lightContrast = useMemo(() => {
    return parseFloat(getContrastRatio(baseColorHex, '#FFFFFF'));
  }, [baseColorHex]);

  const colorRgb = useMemo(() => {
    const c = baseColorHex.replace('#', '');
    const r = parseInt(c.substring(0, 2) || '0', 16);
    const g = parseInt(c.substring(2, 4) || '0', 16);
    const b = parseInt(c.substring(4, 6) || '0', 16);
    return `rgb(${r}, ${g}, ${b})`;
  }, [baseColorHex]);

  const colorMood = useMemo(() => {
    if (currentS < 20) return { temp: 'Netral', mood: 'Fondasi UI, Minimalis, Elegan' };
    if (currentH >= 340 || currentH <= 45) return { temp: 'Warm / Hangat', mood: 'Energetik, Berani, Aksi' };
    if (currentH > 45 && currentH <= 165) return { temp: 'Fresh / Segar', mood: 'Alami, Pertumbuhan, Segar' };
    if (currentH > 165 && currentH <= 260) return { temp: 'Cool / Sejuk', mood: 'Teknologi, Profesional' };
    return { temp: 'Vibrant / Mewah', mood: 'Kreatif, Eksklusif, Mewah' };
  }, [currentH, currentS]);

  const cssGradientString = useMemo(() => {
    return `linear-gradient(135deg, ${generatedHarmonicColors[0]} 0%, ${generatedHarmonicColors[2] || baseColorHex} 50%, ${generatedHarmonicColors[generatedHarmonicColors.length - 1]} 100%)`;
  }, [generatedHarmonicColors, baseColorHex]);


  const handleUpdateHsl = (h: number, s: number, l: number) => {
    const newHex = hslToHex(h, s, l);
    setBaseColorHex(newHex);
  };

  const handleWheelHueChange = (newHue: number) => {
    handleUpdateHsl(newHue, currentS, currentL);
  };

  const handleCopyColor = (color: string) => {
    navigator.clipboard?.writeText(color);
    setCopiedColor(color);
    haptic.light();
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Kode warna ${color} disalin!`, type: 'info' } }));
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const handleCopyGradientCss = () => {
    navigator.clipboard?.writeText(`background: ${cssGradientString};`);
    setCopiedGradient(true);
    haptic.light();
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'CSS Linear Gradient disalin!', type: 'success' } }));
    setTimeout(() => setCopiedGradient(false), 1800);
  };

  const handleCopyPaletteAs = (format: 'css' | 'tailwind' | 'array') => {
    let text = '';
    if (format === 'css') {
      text = generatedHarmonicColors.map((c, i) => `  --studio-color-${i + 1}: ${c};`).join('\n');
      text = `:root {\n${text}\n}`;
    } else if (format === 'tailwind') {
      const obj = generatedHarmonicColors.reduce((acc, c, i) => ({ ...acc, [`${(i + 1) * 100}`]: c }), {});
      text = `colors: ${JSON.stringify(obj, null, 2)}`;
    } else {
      text = JSON.stringify(generatedHarmonicColors);
    }
    navigator.clipboard?.writeText(text);
    setCopiedPaletteFormat(format);
    haptic.light();
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Palet disalin dalam format ${format.toUpperCase()}!`, type: 'success' } }));
    setTimeout(() => setCopiedPaletteFormat(null), 1800);
  };

  const handleSaveCurrentPalette = async (customName?: string) => {
    const defaultName = customName?.trim() || `${COLOR_GOLONGAN_DATA[selectedGolonganTab].label} ${colorTheoryMode.toUpperCase()} (${baseColorHex.toUpperCase()})`;
    const newPalette: SavedColorPalette = {
      id: `pal-${Date.now()}`,
      name: defaultName,
      baseHex: baseColorHex,
      mode: colorTheoryMode,
      golongan: selectedGolonganTab,
      colors: [...generatedHarmonicColors],
      createdAt: new Date().toISOString()
    };

    const updated = [newPalette, ...savedPalettes];
    setSavedPalettes(updated);
    try {
      localStorage.setItem('porto_saved_palettes', JSON.stringify(updated));
      await storage.setItem('porto_saved_palettes', updated);
    } catch (_) {}
    haptic.medium();
    setShowSaveInputModal(false);
    setPaletteSaveName('');
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Palet "${defaultName}" berhasil disimpan ke Katalog!`, type: 'success' } }));
  };

  const handleDeleteSavedPalette = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = savedPalettes.filter(p => p.id !== id);
    setSavedPalettes(updated);
    try {
      localStorage.setItem('porto_saved_palettes', JSON.stringify(updated));
      await storage.setItem('porto_saved_palettes', updated);
    } catch (_) {}
    haptic.light();
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'Palet dihapus dari katalog inspirasi.', type: 'info' } }));
  };

  const handleLoadSavedPalette = (p: SavedColorPalette) => {
    setBaseColorHex(p.baseHex);
    setColorTheoryMode(p.mode);
    setSelectedGolonganTab(p.golongan);
    setShowSavedCatalogModal(false);
    haptic.medium();
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Palet "${p.name}" dimuat ke Studio!`, type: 'success' } }));
  };

  const handleExportAllPalettesJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedPalettes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `katalog-palet-warna-sumrday-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    haptic.medium();
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'Katalog warna berhasil diexport ke file JSON!', type: 'success' } }));
  };

  // ── Palette Card SVG & PNG Export Generator ──
  const generatePaletteSvgString = (p: { name: string; mode?: string; golongan?: string; colors: string[]; baseHex?: string }) => {
    const width = 800;
    const height = 500;
    const colors = p.colors && p.colors.length > 0 ? p.colors : [p.baseHex || '#7C3AED'];
    const baseHex = (p.baseHex || colors[0] || '#7C3AED').toUpperCase();
    const name = p.name || 'Palet Warna Studio';
    const mode = (p.mode || 'Harmoni').toUpperCase();
    const golongan = (p.golongan || 'Koleksi').toUpperCase();
    
    const swCount = colors.length;
    const swGap = 12;
    const totalSwWidth = width - 64;
    const swWidth = (totalSwWidth - (swCount - 1) * swGap) / swCount;
    const swHeight = 180;
    const swY = 125;
    
    const escapeXml = (unsafe: string) => (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });

    const swatchesSvg = colors.map((hex, idx) => {
      const x = 32 + idx * (swWidth + swGap);
      const lum = getLuminance(hex);
      const textColor = lum > 0.4 ? '#000000' : '#ffffff';
      return `
        <g>
          <rect x="${x}" y="${swY}" width="${swWidth}" height="${swHeight}" rx="16" fill="${hex}" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
          <rect x="${x + 8}" y="${swY + 8}" width="${swWidth - 16}" height="22" rx="6" fill="${lum > 0.4 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.18)'}" />
          <text x="${x + swWidth / 2}" y="${swY + 23}" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="900" text-anchor="middle" letter-spacing="0.06em">TONE ${idx + 1}</text>
          <text x="${x + swWidth / 2}" y="${swY + swHeight - 18}" fill="${textColor}" font-family="system-ui, -apple-system, sans-serif" font-size="13.5" font-weight="900" text-anchor="middle" letter-spacing="0.04em">${hex.toUpperCase()}</text>
        </g>
      `;
    }).join('');

    const gradientStops = colors.map((c, i) => `<stop offset="${(i / Math.max(1, colors.length - 1)) * 100}%" stop-color="${c}" />`).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#161F30" />
    </linearGradient>
    <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      ${gradientStops}
    </linearGradient>
    <!-- ClipPath to contain ALL content inside the rounded card -->
    <clipPath id="cardClip">
      <rect width="${width}" height="${height}" rx="24" />
    </clipPath>
  </defs>

  <!-- Card Background (outside clip so border-radius shows) -->
  <rect width="${width}" height="${height}" rx="24" fill="url(#bgGrad)" />

  <!-- Everything clipped inside the rounded card -->
  <g clip-path="url(#cardClip)">

    <!-- Decorative Glow Circles — fully clipped inside card -->
    <circle cx="90" cy="60" r="160" fill="${baseHex}" opacity="0.18" />
    <circle cx="${width - 90}" cy="${height - 60}" r="160" fill="${colors[colors.length - 1] || baseHex}" opacity="0.14" />

    <!-- Header Section -->
    <g transform="translate(36, 40)">
      <text x="0" y="24" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" letter-spacing="-0.02em">${escapeXml(name)}</text>
      <rect x="0" y="36" width="${Math.max(120, (mode.length + golongan.length) * 8 + 40)}" height="22" rx="11" fill="rgba(124,58,237,0.25)" stroke="rgba(124,58,237,0.5)" stroke-width="1"/>
      <text x="12" y="51" fill="#C4B5FD" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" letter-spacing="0.06em">${escapeXml(mode)} • ${escapeXml(golongan)}</text>
    </g>

    <!-- Base Color Hex Badge (top-right) -->
    <g transform="translate(${width - 174}, 40)">
      <rect width="138" height="36" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.16)" stroke-width="1.5" />
      <circle cx="22" cy="18" r="8" fill="${baseHex}" stroke="#FFFFFF" stroke-width="2" />
      <text x="38" y="23" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="900" letter-spacing="0.05em">${baseHex}</text>
    </g>

    <!-- Color Swatches Row -->
    ${swatchesSvg}

    <!-- Gradient Bar -->
    <g transform="translate(32, 335)">
      <rect width="${totalSwWidth}" height="34" rx="10" fill="url(#barGrad)" />
      <rect width="${totalSwWidth}" height="34" rx="10" fill="rgba(0,0,0,0.25)" />
      <text x="16" y="21" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="900" letter-spacing="0.08em">CSS LINEAR GRADIENT 135°</text>
    </g>

    <!-- Separator line -->
    <line x1="36" y1="396" x2="${width - 36}" y2="396" stroke="rgba(255,255,255,0.08)" stroke-width="1" />

    <!-- Footer Branding -->
    <text x="36" y="430" fill="rgba(255,255,255,0.4)" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" letter-spacing="0.05em">SUMR.DAY COLOR STUDIO  •  WARM TECH PALETTES</text>
    <text x="${width - 36}" y="430" fill="#F59E0B" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="900" text-anchor="end" letter-spacing="0.02em">sumr.day</text>

    <!-- Card border overlay on top of everything -->
  </g>
  <rect width="${width}" height="${height}" rx="24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
</svg>`;
  };

  const handleExportPaletteSvg = (palette: { name: string; mode?: string; golongan?: string; colors: string[]; baseHex?: string }) => {
    try {
      const svgStr = generatePaletteSvgString(palette);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(blob);
      const filename = `kartu-warna-${(palette.name || 'palet').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobURL;
      downloadAnchor.download = filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(blobURL);
      
      haptic.medium();
      window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Kartu "${palette.name}" berhasil diexport ke SVG!`, type: 'success' } }));
    } catch (err) {
      console.error('Export SVG failed', err);
      window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'Gagal mengexport file SVG.', type: 'error' } }));
    }
  };

  const handleExportPalettePng = (palette: { name: string; mode?: string; golongan?: string; colors: string[]; baseHex?: string }) => {
    try {
      const svgStr = generatePaletteSvgString(palette);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        const scale = 2; // High-Res Retina
        const canvas = document.createElement('canvas');
        canvas.width = 800 * scale;
        canvas.height = 500 * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobURL);
        
        const pngUrl = canvas.toDataURL('image/png');
        const filename = `kartu-warna-${(palette.name || 'palet').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = pngUrl;
        downloadAnchor.download = filename;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        
        haptic.medium();
        window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Kartu "${palette.name}" berhasil diexport ke PNG HD!`, type: 'success' } }));
      };
      img.onerror = () => {
        window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'Gagal merender gambar PNG.', type: 'error' } }));
      };
      img.src = blobURL;
    } catch (err) {
      console.error('Export PNG failed', err);
      window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'Gagal mengexport gambar PNG.', type: 'error' } }));
    }
  };

  const handleImportPalettesJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...imported, ...savedPalettes].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setSavedPalettes(merged);
          localStorage.setItem('porto_saved_palettes', JSON.stringify(merged));
          await storage.setItem('porto_saved_palettes', merged);
          haptic.medium();
          window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `${imported.length} palet warna berhasil diimport!`, type: 'success' } }));
        }
      } catch {
        window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'Format file JSON tidak valid!', type: 'error' } }));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyThemeColor = async (color: string) => {
    applyAccentColor(color);
    haptic.medium();
    const currentSettings = await storage.getItem('porto_settings', {});
    const updated = { ...currentSettings, accentColor: color };
    await storage.setItem('porto_settings', updated);
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Aksen studio berhasil diubah ke ${color}!`, type: 'success' } }));
  };

  const handleCopyDimension = (p: CanvasPreset) => {
    const text = `${p.width} x ${p.height} ${p.unit}`;
    navigator.clipboard?.writeText(text);
    setCopiedDim(p.id);
    haptic.light();
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Ukuran kanvas ${p.name} (${text}) disalin!`, type: 'info' } }));
    setTimeout(() => setCopiedDim(null), 1800);
  };

  // ── AI Smart Color Inspiration Generator ──
  const handleGenerateAiColorInspiration = async () => {
    if (aiPaletteLoading) return;
    setAiPaletteLoading(true);
    haptic.medium();

    const TREND_PALETTES = [
      '#7C3AED', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#6366F1',
      '#E11D48', '#8B5CF6', '#14B8A6', '#F97316', '#0EA5E9', '#D946EF',
      '#84CC16', '#22C55E', '#3B82F6', '#A855F7', '#FB7185', '#38BDF8',
      '#4ADE80', '#F43F5E', '#64748B', '#0284C7', '#059669', '#D97706'
    ];

    try {
      const prompt = `Berikan 1 kode warna HEX yang sangat tren, estetik, dan elegan untuk desainer grafis (misalnya cyber violet, neon cyan, warm ochre, emerald noir, atau sunset crimson). HANYA kembalikan 1 kode HEX dengan format #RRGGBB tanpa teks lain.`;
      const systemPrompt = `Kamu adalah Color Specialist Senior. Keluarkan hanya 1 kode warna HEX yang modern.`;
      const { callGemini } = await import('../../utils/ai');
      const res = await callGemini(prompt, systemPrompt);
      const match = res.match(/#[0-9a-fA-F]{6}/);
      if (match) {
        setBaseColorHex(match[0].toUpperCase());
        window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Warna tren AI baru diterapkan: ${match[0].toUpperCase()}`, type: 'success' } }));
      } else {
        const randomColor = TREND_PALETTES[Math.floor(Math.random() * TREND_PALETTES.length)];
        setBaseColorHex(randomColor);
        window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Warna tren studio diterapkan: ${randomColor}`, type: 'success' } }));
      }
    } catch {
      const randomColor = TREND_PALETTES[Math.floor(Math.random() * TREND_PALETTES.length)];
      setBaseColorHex(randomColor);
      window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Warna tren studio diterapkan: ${randomColor}`, type: 'success' } }));
    } finally {
      setAiPaletteLoading(false);
    }
  };

  // ── AI Smart Canvas Dimension Generator ──
  const handleGenerateAiCanvasDimension = async () => {
    if (!aiCanvasPrompt.trim() || aiCanvasLoading) return;
    setAiCanvasLoading(true);
    haptic.medium();
    try {
      const prompt = `Berikan spesifikasi dimensi kanvas desain untuk platform/media: "${aiCanvasPrompt.trim()}". Berikan dalam format JSON murni:
{
  "name": "Nama Platform & Format",
  "category": "social" | "portfolio" | "print" | "digital",
  "width": number,
  "height": number,
  "ratio": "string (cth: 16:9)",
  "unit": "px" | "mm",
  "dpi": 72 | 150 | 300,
  "badge": "singkat"
}`;
      const { callGemini } = await import('../../utils/ai');
      const res = await callGemini(prompt, 'Keluarkan JSON valid tanpa markdown tambahan.');
      const parsed = JSON.parse(res.replace(/```json|```/g, '').trim());
      if (parsed.name && parsed.width && parsed.height) {
        const newPreset: CanvasPreset = {
          id: 'ai_' + Date.now(),
          category: parsed.category || 'digital',
          name: parsed.name,
          width: Number(parsed.width),
          height: Number(parsed.height),
          ratio: parsed.ratio || `${parsed.width}:${parsed.height}`,
          unit: parsed.unit || 'px',
          dpi: parsed.dpi || 300,
          badge: parsed.badge || 'AI Format'
        };
        const updated = [newPreset, ...canvasDatabase];
        setCanvasDatabase(updated);
        localStorage.setItem('porto_extended_canvases', JSON.stringify(updated));
        setAiCanvasPrompt('');
        window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Format kanvas baru "${newPreset.name}" ditambahkan!`, type: 'success' } }));
      }
    } catch {
      // Instant graceful fallback generator
      const fallbackPreset: CanvasPreset = {
        id: 'ai_' + Date.now(),
        category: 'digital',
        name: aiCanvasPrompt.trim().toUpperCase() + ' Custom Canvas',
        width: 1920,
        height: 1080,
        ratio: '16:9',
        unit: 'px',
        dpi: 300,
        badge: 'AI Smart'
      };
      const updated = [fallbackPreset, ...canvasDatabase];
      setCanvasDatabase(updated);
      localStorage.setItem('porto_extended_canvases', JSON.stringify(updated));
      setAiCanvasPrompt('');
      window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `Format kanvas "${fallbackPreset.name}" berhasil dibuat!`, type: 'success' } }));
    } finally {
      setAiCanvasLoading(false);
    }
  };

  // ── Delete Canvas Preset ──
  const handleDeleteCanvasPreset = (presetId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = canvasDatabase.filter(p => p.id !== presetId);
    setCanvasDatabase(updated);
    localStorage.setItem('porto_extended_canvases', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'Preset kanvas berhasil dihapus', type: 'info' } }));
    haptic.light();
  };

  // Generate Fresh AI Creative Design Brief
  const handleGenerateFreshDesignIdea = async () => {
    if (aiDesignLoading) return;
    setAiDesignLoading(true);
    setAiDesignResult('');
    haptic.medium();
    try {
      const prompt = aiDesignPrompt.trim() || 'Berikan 1 ide proyek desain grafis / branding kreatif masa kini lengkap dengan: 1. Nama Konsep & Industri, 2. Arah Gaya Visual, 3. Rekomendasi Palet Warna (3 HEX), 4. Tantangan Desain.';
      const systemPrompt = 'Kamu adalah Creative Director & Desainer Grafis Senior. Berikan ide proyek desain yang segar, orisinal, terstruktur rapi dan sangat menginspirasi. Jangan gunakan format yang bertele-tele.';
      const { callGemini } = await import('../../utils/ai');
      const res = await callGemini(prompt, systemPrompt);
      setAiDesignResult(res);
    } catch (err: any) {
      setAiDesignResult('Gagal mendapatkan ide desain baru: ' + (err.message || 'Periksa koneksi internet & API key'));
    } finally {
      setAiDesignLoading(false);
    }
  };

  const handleCopyDesignIdea = () => {
    if (!aiDesignResult) return;
    navigator.clipboard?.writeText(aiDesignResult);
    setAiDesignCopied(true);
    haptic.light();
    setTimeout(() => setAiDesignCopied(false), 2000);
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: 'Ide desain disalin ke clipboard!', type: 'info' } }));
  };

  const handleSaveDesignIdeaToNotes = async () => {
    if (!aiDesignResult) return;
    const titleLine = aiDesignResult.trim().split('\n')[0].replace(/^#+\s*/, '').slice(0, 45) || 'Ide Desain AI';
    const newNote = {
      id: 'note_' + Date.now(),
      title: titleLine,
      content: aiDesignResult.trim(),
      type: 'doc',
      folderId: 'general',
      tags: ['ai-idea', 'brief'],
      isPinned: false,
      isFavorite: true,
      isTrash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newNote, ...notesList];
    await storage.setItem('porto_memo_notes', updated);
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: "Ide desain berhasil disimpan ke Catatan & Notes Hub!", type: "success" } }));
  };

  // System Logs & Heartbeat
  useEffect(() => {
    const handleLog = (e: any) => {
      setLiveNotifs(prev => [
        { 
          id: Date.now(), 
          text: e.detail.message, 
          type: e.detail.type || 'info', 
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
        },
        ...prev
      ].slice(0, 15));
    };
    window.addEventListener('porto_notify', handleLog);

    const initialLogs = [
      { id: 1, text: "Google Sheets Auto-Sync: Ready", type: "success", time: "System" },
      { id: 2, text: "AI Creative Studio: Connected", type: "info", time: "AI Engine" },
      { id: 3, text: "Database integrity check: PASSED", type: "success", time: "Audit" }
    ];
    setLiveNotifs(initialLogs);
    setHeartbeatState({ cpu: 4, ram: 41.2, latency: 18 });

    return () => {
      window.removeEventListener('porto_notify', handleLog);
    };
  }, []);

  // Clear Cache Action (PWA Resilient Safe Clean)
  const handleClearCache = async () => {
    window.dispatchEvent(new CustomEvent('porto_notify', { 
      detail: { message: "Membersihkan cache data & menyinkronkan aset...", type: "info" } 
    }));
    try {
      // 1. Bersihkan runtime / non-precache caches agar shell PWA tetap utuh
      if (window.caches) {
        const keys = await caches.keys();
        for (let k of keys) {
          if (!k.includes('precache')) {
            await caches.delete(k).catch(() => {});
          }
        }
      }

      // 2. Minta service worker untuk update aset terbaru tanpa unregister
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let r of registrations) {
          await r.update().catch(() => {});
        }
      }

      // 3. Bersihkan cache data sementara di storage
      try {
        sessionStorage.clear();
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('porto_notify', { 
        detail: { message: "Cache dibersihkan! Memuat ulang...", type: "success" } 
      }));
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('porto_notify', { 
        detail: { message: "Gagal membersihkan cache: " + e.message, type: "error" } 
      }));
    }
  };

  // Backup JSON Action
  const handleBackupJson = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        pagesData,
        stickersData,
        globalSettings,
        projects: liveProjects,
        canvases,
        blogPosts,
        catalogProducts,
        transactions,
        kanbanDeliverables: kanbanTasks,
        customGames: liveGames,
        gameLicenses: gameLicenses
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: "File cadangan JSON berhasil diunduh!", type: "success" } }));
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: "Gagal membuat cadangan data: " + err.message, type: "error" } }));
    }
  };

  // Quick To-Do Handlers
  const handleAddTodo = () => {
    if (!newTodoInput.trim()) return;
    const updated = [{ id: 'todo_' + Date.now(), text: newTodoInput.trim(), done: false }, ...todos];
    setTodos(updated);
    setNewTodoInput('');
    localStorage.setItem('porto_quick_todos', JSON.stringify(updated));
  };

  const handleToggleTodo = (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTodos(updated);
    localStorage.setItem('porto_quick_todos', JSON.stringify(updated));
  };

  const handleDeleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    localStorage.setItem('porto_quick_todos', JSON.stringify(updated));
  };

  // AI Prompt Studio Generator Handler
  const handleGenerateAi = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult('');
    try {
      let systemPrompt = "Kamu adalah asisten kreatif AI profesional untuk CMS Portofolio & Bisnis.";
      if (aiMode === 'article') {
        systemPrompt = "Buat draft ringkasan artikel blog yang menarik, informatif, terstruktur dengan poin-poin utama.";
      } else if (aiMode === 'project') {
        systemPrompt = "Buat deskripsi studi kasus portofolio kreatif yang profesional mencakup Latar Belakang, Solusi Desain, dan Hasil Akhir.";
      } else if (aiMode === 'copywriting') {
        systemPrompt = "Buat copywriting pemasaran yang memikat untuk produk atau tawaran jasa dengan CTA yang persuasif.";
      }
      const { callGemini } = await import('../../utils/ai');
      const res = await callGemini(aiPrompt, systemPrompt);
      setAiResult(res);
    } catch (err: any) {
      setAiResult("Gagal menghasilkan konten: " + (err.message || 'Periksa API Key Gemini'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAiResult = () => {
    if (!aiResult) return;
    navigator.clipboard?.writeText(aiResult);
    setAiCopied(true);
    setTimeout(() => setAiCopied(false), 2000);
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: "Teks AI disalin ke clipboard!", type: "info" } }));
  };

  // Scratchpad Memo Handlers
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setAdminNotes(val);
    localStorage.setItem('porto_admin_quick_notes', val);
  };

  const handleCopyNotes = () => {
    if (navigator.clipboard && adminNotes) {
      navigator.clipboard.writeText(adminNotes);
      setNotesCopied(true);
      setTimeout(() => setNotesCopied(false), 2000);
    }
  };

  const handleSaveScratchpadToNotes = async () => {
    if (!adminNotes.trim()) return;
    const titleLine = adminNotes.trim().split('\n')[0].replace(/^#+\s*/, '').slice(0, 45) || 'Catatan Cepat';
    const newNote = {
      id: 'note_' + Date.now(),
      title: titleLine,
      content: adminNotes.trim(),
      type: 'doc',
      folderId: 'general',
      tags: ['draft'],
      isPinned: false,
      isFavorite: false,
      isTrash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newNote, ...notesList];
    await storage.setItem('porto_memo_notes', updated);
    setAdminNotes('');
    localStorage.removeItem('porto_admin_quick_notes');
    window.dispatchEvent(new CustomEvent('porto_notify', { 
      detail: { message: "Catatan berhasil disimpan ke Notes Hub!", type: "success" } 
    }));
    onSwitchPage('notes');
  };

  // Goals Save Handler
  const handleSaveGoals = () => {
    setMonthlyGoals(tempGoals);
    localStorage.setItem('porto_monthly_goals', JSON.stringify(tempGoals));
    setIsEditingGoals(false);
    window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: "Target bulanan diperbarui!", type: "success" } }));
  };

  // ── Derived Statistics ──
  const effectiveProjects = liveProjects.length > 0 ? liveProjects : initialProjects;
  const audit = useMemo(() => performCmsAudit({ pagesData, stickersData, globalSettings, projects: effectiveProjects }), [pagesData, stickersData, globalSettings, effectiveProjects]);

  const stats = useMemo(() => {
    const totalPages = (globalSettings?.customPages?.length || 0) + 3;
    let totalBlocks = 0;
    Object.values(pagesData || {}).forEach((arr: any) => { totalBlocks += (arr || []).length; });
    let totalStickers = 0;
    Object.values(stickersData || {}).forEach((arr: any) => { totalStickers += (arr || []).length; });

    let allUrls: string[] = [];
    Object.values(pagesData || {}).forEach((arr: any) => {
      (arr || []).forEach((b: any) => { if (b.url) allUrls.push(b.url); });
    });
    Object.values(stickersData || {}).forEach((arr: any) => {
      (arr || []).forEach((s: any) => { if (s.content) allUrls.push(s.content); });
    });
    const cloudinaryImages = [...new Set(allUrls.filter(url => typeof url === 'string' && url.includes('cloudinary')))].length;
    const totalDataSize = JSON.stringify({ pagesData, stickersData, globalSettings, projects: effectiveProjects, canvases, blogPosts, catalogProducts }).length;

    return {
      totalPages, totalBlocks, totalStickers,
      totalProjects: effectiveProjects.length,
      totalCanvases: canvases.length,
      cloudinaryImages,
      dbUsageBytes: totalDataSize,
      dbUsageKb: (totalDataSize / 1024).toFixed(1),
      connectivity: Math.min(100, Math.round((totalBlocks + totalStickers + effectiveProjects.length + canvases.length) / 2))
    };
  }, [pagesData, stickersData, globalSettings, effectiveProjects, canvases, blogPosts, catalogProducts]);

  const monthlyRevenue = useMemo(() => {
    return transactions
      .filter(t => t.paymentStatus !== 'belum' && new Date(t.date).getMonth() === new Date().getMonth())
      .reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  }, [transactions]);

  const blogStats = useMemo(() => {
    const published = blogPosts.filter(p => p.status === 'Published' || p.status === 'Terbit');
    const drafts = blogPosts.filter(p => p.status !== 'Published' && p.status !== 'Terbit');
    const totalViews = blogPosts.reduce((sum, p) => sum + (p.views || 0), 0);
    const topArticles = [...blogPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
    return { total: blogPosts.length, published: published.length, drafts: drafts.length, totalViews, topArticles };
  }, [blogPosts]);

  const catalogStats = useMemo(() => {
    const active = catalogProducts.filter(p => p.status !== 'inactive' && p.isPublished !== false).length;
    const categoriesCount = [...new Set(catalogProducts.map(p => p.category || 'Umum'))].length;
    return { total: catalogProducts.length, active, categoriesCount };
  }, [catalogProducts]);

  const notesStats = useMemo(() => {
    const docCount = notesList.filter(n => n.type !== 'canvas').length;
    const canvasCount = notesList.filter(n => n.type === 'canvas').length;
    const recentNotes = [...notesList].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()).slice(0, 3);
    return { total: notesList.length, docCount, canvasCount, recentNotes };
  }, [notesList]);

  // Chart Data for 7 Days Revenue
  const chartData = useMemo(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayName = days[d.getDay()];
      const rev = transactions
        .filter(t => t.date && t.date.startsWith(dayStr) && t.paymentStatus !== 'belum')
        .reduce((s, t) => s + (t.grandTotal || 0), 0);
      result.push({ day: dayName, revenue: rev });
    }
    return result;
  }, [transactions]);

  // Goals Percentages
  const revenueGoalPct = Math.min(100, Math.round((monthlyRevenue / (monthlyGoals.revenue || 1)) * 100));
  const projectsGoalPct = Math.min(100, Math.round((effectiveProjects.length / (monthlyGoals.projects || 1)) * 100));
  const articlesGoalPct = Math.min(100, Math.round((blogStats.published / (monthlyGoals.articles || 1)) * 100));

  // Filtered Canvases
  const filteredCanvasPresets = useMemo(() => {
    return canvasDatabase.filter(p => {
      const matchCat = canvasCategoryTab === 'all' || p.category === canvasCategoryTab;
      const matchQuery = canvasSearchQuery.trim() === '' || 
        p.name.toLowerCase().includes(canvasSearchQuery.toLowerCase()) || 
        p.badge.toLowerCase().includes(canvasSearchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [canvasDatabase, canvasCategoryTab, canvasSearchQuery]);

  const filteredResources = useMemo(() => {
    if (resourceCategory === 'all') return EXTENDED_DESIGN_RESOURCES;
    return EXTENDED_DESIGN_RESOURCES.filter(r => r.category === resourceCategory);
  }, [resourceCategory]);


  const kpiList = useMemo(() => [
    { label: 'OMSET KAS', shortLabel: 'OMSET', val: `Rp ${monthlyRevenue.toLocaleString('id-ID')}`, icon: TrendingUp, color: '#10b981', page: 'transactions', progress: 85, progressGrad: 'linear-gradient(90deg, #10b981, #34d399)' },
    { label: 'TOTAL PROYEK', shortLabel: 'PROYEK', val: `${stats.totalProjects} Proyek`, icon: Rocket, color: '#3b82f6', page: 'projects', progress: 70, progressGrad: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { label: 'PUSAT DATA', shortLabel: 'DATA', val: `${stats.totalProjects + blogStats.total + catalogStats.total + liveGames.length} Data`, icon: Database, color: '#0284c7', page: 'database', progress: 90, progressGrad: 'linear-gradient(90deg, #0284c7, #38bdf8)' },
    { label: 'APLIKASI LIVE', shortLabel: 'APPS', val: `${liveGames.length} Modul`, icon: LayoutGrid, color: '#8b5cf6', page: 'apps', progress: 80, progressGrad: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
    { label: 'ARTIKEL BLOG', shortLabel: 'BLOG', val: `${blogStats.published} Artikel`, icon: BookOpen, color: '#f59e0b', page: 'blog', progress: 60, progressGrad: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
    { label: 'PRODUK JUAL', shortLabel: 'PRODUK', val: `${catalogStats.active} Produk`, icon: ShoppingBag, color: '#ec4899', page: 'catalog', progress: 75, progressGrad: 'linear-gradient(90deg, #ec4899, #f472b6)' }
  ], [monthlyRevenue, stats.totalProjects, blogStats.total, blogStats.published, catalogStats.total, catalogStats.active, liveGames.length]);

  return (
    <div 
      className="dashboard-overview-root smart-scroll-y" 
      style={{ 
        height: '100%', 
        minHeight: '100%',
        overflowY: 'auto', 
        background: 'var(--cms-bg)', 
        padding: isMobile 
          ? '10px 8px calc(140px + env(safe-area-inset-bottom, 24px))'
          : isTablet 
            ? 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px)) 16px calc(90px + env(safe-area-inset-bottom, 24px))' 
            : showGadgetStation ? '20px 24px 48px' : '16px 24px 32px', 
        scrollbarWidth: 'thin', 
        width: '100%', 
        maxWidth: '100%', 
        minWidth: 0,
        boxSizing: 'border-box', 
        overflowX: 'hidden',
        display: 'block'
      }}
    >
      {!fullscreenApp ? (
        <div style={{ maxWidth: 1600, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: isMobile ? 10 : 20, boxSizing: 'border-box', minWidth: 0 }}>
        
        {/* ── 1. FLAT SOLID MODERN DASHBOARD ── */}
        <FlatSolidDashboard
          projects={effectiveProjects}
          stats={stats}
          kpiList={kpiList}
          chartData={chartData}
          monthlyRevenue={monthlyRevenue}
          monthlyGoals={monthlyGoals}
          blogStats={blogStats}
          catalogStats={catalogStats}
          liveGames={liveGames}
          pagesData={pagesData}
          canvases={canvases}
          blogPosts={blogPosts}
          catalogProducts={catalogProducts}
          globalSettings={globalSettings}
          syncMode={syncMode}
          onSwitchPage={onSwitchPage}
          onBackupJson={handleBackupJson}
          userData={auth.currentUser}
          businessProfile={businessProfile}
          isMobile={!!isMobile}
          isTablet={!!isTablet}
          onOpenGadgetStation={() => setShowGadgetStation(prev => !prev)}
          showGadgetStationToggle={true}
        />


        {/* ── 2. GADGET STATION MASTER EXECUTIVE CONTROL BAR (COLLAPSIBLE) ── */}
        {showGadgetStation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 20, width: '100%' }}>
            <div id="gadget-station-anchor" style={{ scrollMarginTop: 24, width: '100%' }}>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '10px 14px' : '14px 20px',
            borderRadius: 20,
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1.5px solid var(--glass-border, rgba(0,0,0,0.06))',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'var(--cms-accent, #7c3aed)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Layers size={16} />
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 900, color: 'var(--cms-text)' }}>
                  Stasiun Gadget Studio
                </div>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700 }}>
                  4 Suite Terpadu
                </div>
              </div>
            </div>

            {/* Category Switcher Tabs right in Stasiun Gadget Studio (Icon Only) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: 'var(--cms-input-bg, rgba(0,0,0,0.04))',
              padding: '3px 4px',
              borderRadius: 9999,
              border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
              flexShrink: 0
            }}>
              {[
                { id: 'all', label: 'Semua', icon: LayoutGrid },
                { id: 'website', label: 'Web Studio', icon: Globe2 },
                { id: 'design', label: 'Studio Desain', icon: Palette },
                { id: 'business', label: 'Bisnis Kas', icon: DollarSign },
                { id: 'system', label: 'Sistem Cloud', icon: CpuIcon }
              ].map(tab => {
                const isActive = studioTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    title={tab.label}
                    aria-label={tab.label}
                    className="cms-circle-btn"
                    onClick={() => {
                      setStudioTab(tab.id as any);
                      handleExpandFromDock(tab.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 30,
                      height: 30,
                      minWidth: 30,
                      minHeight: 30,
                      aspectRatio: '1 / 1',
                      borderRadius: '50%',
                      border: 'none',
                      background: isActive ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--cms-text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      padding: 0
                    }}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>

            {/* Controls: Ciutkan & Lebarkan (Icon-only) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <button
                type="button"
                onClick={collapseAllSuites}
                className="cms-circle-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  minWidth: 30,
                  minHeight: 30,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
                  background: 'transparent',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0
                }}
                title="Tutup Semua Suite"
                aria-label="Tutup Semua Suite"
              >
                <ChevronUp size={15} />
              </button>

              <button
                type="button"
                onClick={expandAllSuites}
                className="cms-circle-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  minWidth: 30,
                  minHeight: 30,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--cms-accent, #7c3aed)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.25)',
                  flexShrink: 0,
                  padding: 0
                }}
                title="Buka Semua Suite"
                aria-label="Buka Semua Suite"
              >
                <ChevronDown size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── 5. MAIN BENTO GRID ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isCompact ? 'minmax(0, 1fr)' : 'repeat(12, minmax(0, 1fr))', 
          gap: isMobile ? 12 : 16,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          minWidth: 0
        }}>

          {/* ══════ SECTION W: EKOSISTEM WEBSITE, DATABASE & GAME PLATFORM ══════ */}
          {(studioTab === 'all' || studioTab === 'website') && (
            <div style={{
              gridColumn: isCompact ? 'span 1' : 'span 12',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              minWidth: 0
            }}>
              {/* ── HEADER EKOSISTEM (RATA 1 BARIS & CLEAN) ── */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12), rgba(99, 102, 241, 0.08))',
                borderRadius: isMobile ? 18 : 22,
                border: '1.5px solid var(--glass-border, rgba(124, 58, 237, 0.2))',
                padding: isMobile ? '10px 12px' : '14px 20px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: isMobile ? 8 : 14,
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minWidth: 0
              }}>
                {/* Left: Icon + Title + Realtime Badge in 1 row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    minWidth: isMobile ? 32 : 40,
                    borderRadius: isMobile ? 10 : 12,
                    background: 'var(--cms-accent, #7c3aed)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                    flexShrink: 0
                  }}>
                    <Globe2 size={isMobile ? 16 : 20} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                    <h2 style={{ 
                      margin: 0, 
                      fontSize: isMobile ? 13 : 16, 
                      fontWeight: 900, 
                      color: 'var(--cms-text)', 
                      letterSpacing: '-0.02em', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {isMobile ? 'Ekosistem Web & Studio' : 'Pusat Ekosistem Web & Studio'}
                    </h2>
                    <span style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      padding: '1.5px 6px',
                      borderRadius: 100,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      REALTIME
                    </span>
                  </div>
                </div>

                {/* Right: Action Buttons in the same row */}
                <div style={{ display: 'flex', gap: isMobile ? 5 : 8, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onSwitchPage('visual-editor')}
                    title="Website Studio"
                    aria-label="Website Studio"
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      aspectRatio: '1 / 1',
                      padding: 0,
                      background: 'var(--cms-accent, #7c3aed)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 3px 10px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <Globe2 size={isMobile ? 15 : 16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchPage('database')}
                    title="Hub Database"
                    aria-label="Hub Database"
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      aspectRatio: '1 / 1',
                      padding: 0,
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: '#0284c7',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <Database size={isMobile ? 15 : 16} color="#0284c7" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchPage('apps')}
                    title="Apps Studio"
                    aria-label="Apps Studio"
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      aspectRatio: '1 / 1',
                      padding: 0,
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: '#8b5cf6',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <LayoutGrid size={isMobile ? 15 : 16} color="#8b5cf6" />
                  </button>

                  {/* Toggle Suite Web */}
                  <button
                    type="button"
                    onClick={() => toggleSuite('web')}
                    title={expandedSuites.web ? 'Ciutkan Suite Web' : 'Lebarkan Suite Web'}
                    aria-label={expandedSuites.web ? 'Ciutkan Suite Web' : 'Lebarkan Suite Web'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      border: '1.5px solid var(--glass-border, rgba(124, 58, 237, 0.25))',
                      background: expandedSuites.web ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-card-bg, #ffffff)',
                      color: expandedSuites.web ? '#ffffff' : 'var(--cms-accent, #7c3aed)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {expandedSuites.web ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {expandedSuites.web && (
                <>
              {/* ── BENTO GRID 2 KOLOM: 4 PILAR DATABASE & GAME ARCADE PLATFORM ── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isCompact ? 'minmax(0, 1fr)' : 'repeat(12, minmax(0, 1fr))',
                gap: 14,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minWidth: 0
              }}>
                {/* 1. 4 PILAR DATABASE MASTER CARD (Span 7) */}
                <div style={{
                  gridColumn: isCompact ? 'span 1' : 'span 7',
                  background: 'var(--cms-card-bg)',
                  borderRadius: 22,
                  border: '1px solid var(--glass-border)',
                  padding: isMobile ? '12px 10px' : '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: 'var(--cms-shadow-sm)',
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Database size={16} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: isMobile ? 13.5 : 15, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Pusat Database Terpadu (4 Pilar)
                        </h3>
                        <p style={{ margin: '1px 0 0', fontSize: 10.5, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Portofolio karya, blog wawasan, produk katalog, & game studio
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onSwitchPage('database')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 100,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cms-accent, #6366f1)',
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      <span>Buka Master</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>

                  {/* 4 Cards Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
                    gap: 8,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Pilar 1: Portofolio */}
                    <div
                      onClick={() => onSwitchPage('portfolio')}
                      style={{
                        padding: isMobile ? '10px 10px' : '14px 12px',
                        borderRadius: 16,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        transition: 'all 0.2s ease',
                        minWidth: 0
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Star size={14} />
                        </div>
                        <ArrowUpRight size={13} color="var(--cms-text-muted)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? 10.5 : 11, fontWeight: 700, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isMobile ? 'Karya' : 'Kurasi Karya'}
                        </div>
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 950, color: 'var(--cms-text)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {stats.totalProjects} Karya
                        </div>
                      </div>
                    </div>

                    {/* Pilar 2: Blog */}
                    <div
                      onClick={() => onSwitchPage('blog')}
                      style={{
                        padding: isMobile ? '10px 10px' : '14px 12px',
                        borderRadius: 16,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        transition: 'all 0.2s ease',
                        minWidth: 0
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={14} />
                        </div>
                        <ArrowUpRight size={13} color="var(--cms-text-muted)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? 10.5 : 11, fontWeight: 700, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isMobile ? 'Artikel' : 'Blog & Artikel'}
                        </div>
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 950, color: 'var(--cms-text)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {blogStats.total} Artikel
                        </div>
                      </div>
                    </div>

                    {/* Pilar 3: Katalog */}
                    <div
                      onClick={() => onSwitchPage('catalog')}
                      style={{
                        padding: isMobile ? '10px 10px' : '14px 12px',
                        borderRadius: 16,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        transition: 'all 0.2s ease',
                        minWidth: 0
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={14} />
                        </div>
                        <ArrowUpRight size={13} color="var(--cms-text-muted)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? 10.5 : 11, fontWeight: 700, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isMobile ? 'Katalog' : 'Katalog / Shop'}
                        </div>
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 950, color: 'var(--cms-text)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {catalogStats.total} Produk
                        </div>
                      </div>
                    </div>

                    {/* Pilar 4: Apps Studio */}
                    <div
                      onClick={() => onSwitchPage('apps')}
                      style={{
                        padding: isMobile ? '10px 10px' : '14px 12px',
                        borderRadius: 16,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        transition: 'all 0.2s ease',
                        minWidth: 0
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139, 92, 246, 0.22)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(139,92,246,0.25)' }}>
                          <LayoutGrid size={14} color="#8b5cf6" strokeWidth={2.4} />
                        </div>
                        <ArrowUpRight size={13} color="var(--cms-text-muted)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? 10.5 : 11, fontWeight: 700, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isMobile ? 'Apps' : 'Apps Studio'}
                        </div>
                        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 950, color: 'var(--cms-text)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {liveGames.length} Modul
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. GAME ARCADE & SHOWCASE MINI-CONSOLE (Span 5) */}
                <div style={{
                  gridColumn: isCompact ? 'span 1' : 'span 5',
                  background: 'var(--cms-card-bg)',
                  borderRadius: 22,
                  border: '1px solid var(--glass-border)',
                  padding: isMobile ? '12px 10px' : '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                  boxShadow: 'var(--cms-shadow-sm)',
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(139, 92, 246, 0.22)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(139,92,246,0.25)' }}>
                        <LayoutGrid size={16} color="#8b5cf6" strokeWidth={2.4} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: isMobile ? 13.5 : 15, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Apps Studio
                        </h3>
                        <p style={{ margin: '1px 0 0', fontSize: 10.5, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Aplikasi interaktif, utilitas kustom, & game
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: 'rgba(139, 92, 246, 0.16)',
                      color: '#8b5cf6',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {liveGames.length} Modul
                    </span>
                  </div>

                  {/* Mini Preview of Games / Apps List */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: 14,
                    background: 'var(--cms-input-bg)',
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0
                  }}>
                    {liveGames.length > 0 ? (
                      liveGames.slice(0, 3).map((g: any, gIdx: number) => (
                        <div key={g.id || gIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, minWidth: 0 }}>
                          <span style={{ fontWeight: 800, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Play size={10} color="#8b5cf6" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title || g.name || 'Modul Interaktif'}</span>
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--cms-text-muted)', background: 'var(--cms-card-bg)', padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}>
                            {g.category || 'Web App'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', textAlign: 'center', padding: '6px 0' }}>
                        Preset aplikasi & game interaktif bawaan aktif & siap diakses
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 8, width: '100%', boxSizing: 'border-box' }}>
                    <a
                      href="/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: isMobile ? '7px 8px' : '8px 12px',
                        borderRadius: 10,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: isMobile ? 11 : 11.5,
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        minWidth: 0
                      }}
                    >
                      <ExternalLink size={12} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{isMobile ? 'Coba Apps' : 'Uji Coba Apps'}</span>
                    </a>
                    <button
                      onClick={() => onSwitchPage('apps')}
                      style={{
                        flex: 1,
                        padding: isMobile ? '7px 8px' : '8px 12px',
                        borderRadius: 10,
                        background: 'var(--cms-accent, #7c3aed)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: isMobile ? 11 : 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        whiteSpace: 'nowrap',
                        minWidth: 0
                      }}
                    >
                      <LayoutGrid size={12} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{isMobile ? 'Kelola' : 'Kelola Apps'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. PUSAT BISNIS, KONTAK & PEMBAYARAN HUB (BENTO CARD SPAN 12) */}
                <div style={{
                  gridColumn: isCompact ? 'span 1' : 'span 12',
                  background: 'var(--cms-card-bg)',
                  borderRadius: 22,
                  border: '1.5px solid var(--glass-border)',
                  padding: isMobile ? '14px 12px' : '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  boxShadow: 'var(--cms-shadow-sm)',
                  boxSizing: 'border-box',
                  width: '100%',
                  minWidth: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: isMobile ? 36 : 42,
                      height: isMobile ? 36 : 42,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #6366f1)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.25)'
                    }}>
                      <Building2 size={isMobile ? 18 : 20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                        <h4 style={{ margin: 0, fontSize: isMobile ? 13 : 14.5, fontWeight: 900, color: 'var(--cms-text)' }}>
                          {businessProfile?.brandName || 'Pusat Bisnis & Kontak'}
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 100, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <CheckCircle2 size={10} /> 1-Stop Master
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 100, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <ShieldCheck size={10} /> Anti-Fraud (+Rp XXX)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--cms-text-muted)', flexWrap: 'wrap' }}>
                        <span>WA: <strong style={{ color: 'var(--cms-text)' }}>{businessProfile?.whatsapp || '08...'}</strong></span>
                        <span>•</span>
                        <span>Bank & e-Wallet: <strong style={{ color: 'var(--cms-text)' }}>{businessProfile?.bankAccounts?.length || 0} Rekening</strong></span>
                        <span>•</span>
                        <span>QRIS: <strong style={{ color: businessProfile?.qris?.imageUrl ? '#10b981' : '#f59e0b' }}>{businessProfile?.qris?.imageUrl ? '0% Fee Aktif' : 'Belum Ada Barcode'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchPage('settings');
                        setTimeout(() => window.dispatchEvent(new CustomEvent('cms_open_settings_category', { detail: { category: 'contacts' } })), 100);
                      }}
                      className="cms-btn cms-btn-primary"
                      style={{
                        flex: isMobile ? 1 : 'initial',
                        padding: '0 14px',
                        height: 34,
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5
                      }}
                    >
                      <Building2 size={12} />
                      <span>Kelola Bisnis & Kontak</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSwitchPage('transactions')}
                      className="cms-btn"
                      style={{
                        padding: '0 12px',
                        height: 34,
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <CreditCard size={12} />
                      <span>Nota & Mutasi</span>
                    </button>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          )}

          {/* ══════ SECTION A: ADVANCED COLOR THEORY & HARMONY ENGINE ══════ */}
          {(studioTab === 'all' || studioTab === 'design') && (
            <div id="suite-anchor-design" style={{
              gridColumn: isCompact ? 'span 1' : 'span 12',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              minWidth: 0
            }}>
              {/* Header Suite Desain */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(168, 85, 247, 0.08))',
                borderRadius: isMobile ? 18 : 22,
                border: '1.5px solid var(--glass-border, rgba(236, 72, 153, 0.2))',
                padding: isMobile ? '10px 12px' : '14px 20px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: isMobile ? 8 : 14,
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    minWidth: isMobile ? 32 : 40,
                    borderRadius: isMobile ? 10 : 12,
                    background: '#ec4899',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)',
                    flexShrink: 0
                  }}>
                    <Palette size={isMobile ? 16 : 20} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: isMobile ? 13 : 16,
                      fontWeight: 900,
                      color: 'var(--cms-text)',
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Studio Desain Kreatif
                    </h2>
                    <span style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      padding: '1.5px 6px',
                      borderRadius: 100,
                      background: 'rgba(236, 72, 153, 0.15)',
                      color: '#ec4899',
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      HARMONI
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: isMobile ? 5 : 8, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onSwitchPage('builder')}
                    title="Kanvas Landing Page"
                    aria-label="Kanvas LP"
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      aspectRatio: '1 / 1',
                      padding: 0,
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: '#ec4899',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <Layers size={isMobile ? 15 : 16} color="#ec4899" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSuite('design')}
                    title={expandedSuites.design ? 'Ciutkan Suite Desain' : 'Lebarkan Suite Desain'}
                    aria-label={expandedSuites.design ? 'Ciutkan Suite Desain' : 'Lebarkan Suite Desain'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      border: '1.5px solid var(--glass-border, rgba(236, 72, 153, 0.25))',
                      background: expandedSuites.design ? '#ec4899' : 'var(--cms-card-bg, #ffffff)',
                      color: expandedSuites.design ? '#ffffff' : '#ec4899',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {expandedSuites.design ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {expandedSuites.design && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isCompact ? 'minmax(0, 1fr)' : 'repeat(12, minmax(0, 1fr))',
                  gap: 14,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}>
              {/* ADVANCED COLOR THEORY STUDIO */}
              <div style={{
                gridColumn: isCompact ? 'span 1' : 'span 7',
                background: 'var(--cms-card-bg)',
                borderRadius: 22,
                border: '1px solid var(--glass-border)',
                padding: isMobile ? '12px 10px' : '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0
              }}>
                {/* Header Toolbar - Compact & Gap-Free */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Palette size={15} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <h3 style={{ margin: 0, fontSize: isMobile ? 13 : 16, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Studio Warna</h3>
                    </div>
                  </div>

                  {/* Right Actions: Clean Icon Circle on Mobile, Expanded Badge on Desktop */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6, flexShrink: 0 }}>
                    {isMobile ? (
                      <GlassColorPicker
                        value={baseColorHex}
                        onChange={(c: string) => setBaseColorHex(c)}
                        customTrigger={(open: () => void) => (
                          <button
                            onClick={open}
                            className="cms-circle-btn"
                            style={{
                              width: 28,
                              height: 28,
                              minWidth: 28,
                              minHeight: 28,
                              aspectRatio: '1 / 1',
                              borderRadius: '50%',
                              background: baseColorHex,
                              border: '2px solid rgba(255,255,255,0.8)',
                              boxShadow: `0 0 8px ${baseColorHex}88, inset 0 0 0 1.5px rgba(0,0,0,0.2)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              padding: 0
                            }}
                            title={`Pilih / Input Kode Warna (${baseColorHex.toUpperCase()})`}
                          >
                            <Pipette size={12} color={getLuminance(baseColorHex) > 0.4 ? '#000000' : '#ffffff'} />
                          </button>
                        )}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--cms-input-bg)', padding: '3px 8px', borderRadius: 100, border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                        <GlassColorPicker
                          value={baseColorHex}
                          onChange={(c: string) => setBaseColorHex(c)}
                          customTrigger={(open: () => void) => (
                            <div
                              onClick={open}
                              className="cms-circle-btn"
                              style={{
                                width: 22,
                                height: 22,
                                minWidth: 22,
                                minHeight: 22,
                                aspectRatio: '1 / 1',
                                borderRadius: '50%',
                                background: baseColorHex,
                                boxShadow: `0 0 8px ${baseColorHex}88, inset 0 0 0 1.5px rgba(255,255,255,0.6)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                padding: 0
                              }}
                              title="Buka Glass Color Studio"
                            >
                              <Pipette size={10} color={getLuminance(baseColorHex) > 0.4 ? '#000000' : '#ffffff'} />
                            </div>
                          )}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text-muted)' }}>#</span>
                          <input
                            type="text"
                            value={baseColorHex.replace('#', '')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                              if (val.length > 0) setBaseColorHex('#' + val);
                            }}
                            style={{
                              width: 52, height: 20, borderRadius: 4, background: 'transparent',
                              border: 'none', color: 'var(--cms-text)', fontSize: 11, fontWeight: 850,
                              textTransform: 'uppercase', outline: 'none', padding: 0, flexShrink: 0
                            }}
                            placeholder="7C3AED"
                          />
                        </div>

                        <button
                          onClick={() => setShowColorSliders(!showColorSliders)}
                          className="cms-circle-btn"
                          style={{
                            width: 20, height: 20, minWidth: 20, minHeight: 20, aspectRatio: '1 / 1', borderRadius: '50%',
                            background: showColorSliders ? 'var(--cms-accent)' : 'transparent',
                            border: 'none',
                            color: showColorSliders ? '#fff' : 'var(--cms-text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            flexShrink: 0, padding: 0
                          }}
                          title="Buka/Tutup Slider HSL"
                        >
                          <SlidersHorizontal size={10} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleGenerateAiColorInspiration}
                      disabled={aiPaletteLoading}
                      className="cms-circle-btn"
                      style={{
                        width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, minWidth: isMobile ? 28 : 32, minHeight: isMobile ? 28 : 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)', color: 'var(--cms-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0
                      }}
                      title="Saran Warna AI"
                    >
                      {aiPaletteLoading ? <Loader2 size={12} className="cms-spin" /> : <Wand2 size={12} />}
                    </button>

                    <button
                      onClick={() => openFullscreenStudio('color')}
                      className="cms-circle-btn"
                      style={{
                        width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, minWidth: isMobile ? 28 : 32, minHeight: isMobile ? 28 : 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0
                      }}
                      title="Perbesar Layar Penuh"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </div>
                </div>

                {/* ── INTERACTIVE 360° COLOR WHEEL + HARMONY CONTROLS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '250px 1fr', gap: isCompact ? 12 : 20, alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '0 auto', width: '100%' }}>
                    <InteractiveColorWheel
                      hue={currentH}
                      mode={colorTheoryMode}
                      onHueChange={handleWheelHueChange}
                      size={isMobile ? 180 : isTablet ? 200 : 220}
                      baseHex={baseColorHex}
                    />
                    <span style={{ fontSize: 9, color: 'var(--cms-text-muted)', fontWeight: 750 }}>Putar lingkaran untuk ubah rona warna 360°</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, justifyContent: 'center', width: '100%' }}>
                    {/* Skema Harmoni Selector (Monokrom, Analog, Komplementer, Triadik) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, background: 'var(--cms-input-bg)', padding: 4, borderRadius: 14, border: '1px solid var(--glass-border)', width: '100%', boxSizing: 'border-box' }}>
                      {[
                        { id: 'monochromatic', label: 'Monokrom' },
                        { id: 'analogous', label: 'Analog' },
                        { id: 'complementary', label: 'Komplementer' },
                        { id: 'triadic', label: 'Triadik' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => { setColorTheoryMode(mode.id as any); haptic.light(); }}
                          style={{
                            padding: '9px 10px', borderRadius: 10, border: 'none',
                            background: colorTheoryMode === mode.id ? 'var(--cms-accent)' : 'var(--cms-card-bg)',
                            color: colorTheoryMode === mode.id ? '#ffffff' : 'var(--cms-text-muted)',
                            fontSize: 11, fontWeight: colorTheoryMode === mode.id ? 900 : 750,
                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
                            boxShadow: colorTheoryMode === mode.id ? '0 2px 8px var(--cms-accent-soft)' : 'none'
                          }}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    {/* High Legibility WCAG Contrast Matrices */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                      <div style={{
                        background: '#0a0a10',
                        border: `1.5px solid ${darkContrast >= 4.5 ? '#10b981' : '#f59e0b'}`,
                        padding: '10px 14px',
                        borderRadius: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        boxSizing: 'border-box',
                        minWidth: 0
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#9ca3af', letterSpacing: '0.04em' }}>DARK UI CONTRAST</span>
                          <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 6, background: darkContrast >= 4.5 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: darkContrast >= 4.5 ? '#10b981' : '#f59e0b' }}>
                            {darkContrast >= 7.0 ? 'AAA' : darkContrast >= 4.5 ? 'AA' : 'Fail'}
                          </span>
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 950, color: darkContrast >= 4.5 ? '#10b981' : '#f59e0b' }}>
                          {darkContrast} : 1
                        </div>
                      </div>

                      <div style={{
                        background: '#f8fafc',
                        border: `1.5px solid ${lightContrast >= 4.5 ? '#059669' : '#e11d48'}`,
                        padding: '10px 14px',
                        borderRadius: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        boxSizing: 'border-box',
                        minWidth: 0
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#475569', letterSpacing: '0.04em' }}>LIGHT UI CONTRAST</span>
                          <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 6, background: lightContrast >= 4.5 ? 'rgba(5,150,105,0.15)' : 'rgba(225,29,72,0.15)', color: lightContrast >= 4.5 ? '#059669' : '#e11d48' }}>
                            {lightContrast >= 7.0 ? 'AAA' : lightContrast >= 4.5 ? 'AA' : 'Fail'}
                          </span>
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 950, color: lightContrast >= 4.5 ? '#059669' : '#e11d48' }}>
                          {lightContrast} : 1
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generated Harmonies Swatches */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${generatedHarmonicColors.length}, 1fr)`, gap: 6, height: 60, borderRadius: 14, width: '100%' }}>
                  {generatedHarmonicColors.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => handleCopyColor(c)}
                      style={{
                        background: c,
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.15s ease',
                        border: '1px solid rgba(0,0,0,0.12)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                      }}
                      title={`Klik untuk salin HEX: ${c}`}
                    >
                      <span style={{ fontSize: 9.5, fontWeight: 900, color: getLuminance(c) > 0.4 ? '#000' : '#fff', opacity: 0.95 }}>
                        {copiedColor === c ? 'Tersalin' : c}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Live CSS Gradient Generator & Actions - Single Row Always */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cms-input-bg)', padding: '8px 12px', borderRadius: 16, border: '1px solid var(--glass-border)', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, paddingRight: 6 }}>
                    <div style={{ width: 36, height: 32, borderRadius: 10, background: cssGradientString, border: '1px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>CSS Linear Gradient</div>
                      <div style={{ fontSize: 8.5, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Harmoni otomatis 135°</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={handleCopyGradientCss}
                      className="cms-circle-btn"
                      style={{
                        width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-card-bg)',
                        border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0
                      }}
                      title="Salin CSS Linear Gradient"
                    >
                      {copiedGradient ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>

                    <button
                      onClick={() => handleCopyPaletteAs('css')}
                      className="cms-circle-btn"
                      style={{
                        width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-card-bg)',
                        border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0
                      }}
                      title="Salin CSS :root Variables"
                    >
                      {copiedPaletteFormat === 'css' ? <Check size={14} color="#10b981" /> : <Code size={14} />}
                    </button>

                    <button
                      onClick={() => handleApplyThemeColor(baseColorHex)}
                      className="cms-circle-btn"
                      style={{
                        width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-accent)',
                        color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px var(--cms-accent-soft)', flexShrink: 0, padding: 0
                      }}
                      title="Terapkan Aksen Warna ke Seluruh Website"
                    >
                      <Pipette size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* DESIGN WIDGET 2: MASSIVE CANVAS RESOLUTION DIRECTORY */}
              <div style={{
                gridColumn: isCompact ? 'span 1' : 'span 5',
                background: 'var(--cms-card-bg)',
                borderRadius: 22,
                border: '1px solid var(--glass-border)',
                padding: isMobile ? '14px' : '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                minWidth: 0,
                height: '100%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, aspectRatio: '1 / 1', borderRadius: 12, background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Maximize2 size={17} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Preset Kanvas</h3>
                      <InfoTooltip content="Koleksi dimensi resolusi desain & kalkulator unit" />
                    </div>
                  </div>

                  <button
                    onClick={() => openFullscreenStudio('canvas')}
                    className="cms-circle-btn"
                    style={{
                      width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0
                    }}
                    title="Buka Fullscreen Preset Kanvas"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>

                {/* Search Bar */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={13} color="var(--cms-text-muted)" style={{ position: 'absolute', left: 10, top: 9 }} />
                    <input
                      type="text"
                      value={canvasSearchQuery}
                      onChange={e => setCanvasSearchQuery(e.target.value)}
                      placeholder="Cari preset kanvas (Instagram, A4, Banner)..."
                      style={{
                        width: '100%', padding: '6px 8px 6px 30px', borderRadius: 10,
                        background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text)', fontSize: 10.5, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Preset Platform Filter */}
                <div style={{ display: 'flex', gap: 3, background: 'var(--cms-input-bg)', padding: 3, borderRadius: 100, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'social', label: 'Medsos' },
                    { id: 'portfolio', label: 'Portofolio' },
                    { id: 'print', label: 'Cetak' },
                    { id: 'digital', label: 'UI/App' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCanvasCategoryTab(tab.id as any)}
                      style={{
                        flex: 1, padding: '4px 6px', borderRadius: 100, border: 'none',
                        background: canvasCategoryTab === tab.id ? 'var(--cms-card-bg)' : 'transparent',
                        color: canvasCategoryTab === tab.id ? 'var(--cms-text)' : 'var(--cms-text-muted)',
                        fontSize: 9, fontWeight: canvasCategoryTab === tab.id ? 850 : 700,
                        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Presets List */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 6, 
                  flex: 1, 
                  minHeight: isMobile ? 180 : 225, 
                  maxHeight: isMobile ? 250 : 255, 
                  overflowY: 'auto',
                  paddingRight: 2,
                  scrollbarWidth: 'thin'
                }}>
                  {filteredCanvasPresets.slice(0, 5).map(preset => (
                    <div
                      key={preset.id}
                      onClick={() => handleCopyDimension(preset)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 10px', borderRadius: 10, background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)', cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Klik untuk salin resolusi"
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: 8.5, color: 'var(--cms-text-muted)' }}>
                          Ratio {preset.ratio} {preset.dpi ? `• ${preset.dpi} DPI` : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 900, color: 'var(--cms-accent)' }}>
                          {preset.width} × {preset.height}
                        </span>
                        <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 6, background: 'var(--cms-card-bg)', color: 'var(--cms-text-muted)' }}>
                          {copiedDim === preset.id ? 'Tersalin' : 'Salin'}
                        </span>
                        <button
                          onClick={(e) => handleDeleteCanvasPreset(preset.id, e)}
                          title="Hapus preset kanvas"
                          className="cms-circle-btn"
                          style={{
                            width: 22, height: 22, minWidth: 22, minHeight: 22, aspectRatio: '1 / 1', borderRadius: '50%', background: 'transparent',
                            border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredCanvasPresets.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 10, color: 'var(--cms-text-muted)' }}>
                      Preset tidak ditemukan. Buka fullscreen untuk generator AI.
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
                  <span style={{ fontSize: 8.5, color: 'var(--cms-text-muted)', fontWeight: 700 }}>
                    Menampilkan {filteredCanvasPresets.length} preset
                  </span>
                  <button
                    onClick={() => openFullscreenStudio('canvas')}
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--cms-accent)',
                      fontSize: 9.5, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0
                    }}
                  >
                    <span>Eksplorasi Lengkap</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* DESIGN WIDGET 3: LIVE DESIGN TREND RADAR */}
              <div 
                id="dash-design-inspo"
                style={{
                  gridColumn: isCompact ? 'span 1' : 'span 12',
                  background: 'var(--cms-card-bg)',
                  borderRadius: 22,
                  border: '1px solid var(--glass-border)',
                  padding: isMobile ? '14px' : '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: 'var(--cms-shadow-sm)',
                  boxSizing: 'border-box',
                  minWidth: 0
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, aspectRatio: '1 / 1', borderRadius: 12, background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Lightbulb size={17} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Tren Desain</h3>
                      <InfoTooltip content="Radar kurasi tren visual global & generator ide AI" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={handleGenerateFreshDesignIdea}
                      disabled={aiDesignLoading}
                      className="cms-circle-btn"
                      style={{
                        width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-accent)',
                        color: '#fff', border: 'none',
                        cursor: aiDesignLoading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px var(--cms-accent-soft)', flexShrink: 0, padding: 0
                      }}
                      title="Generate Ide Desain Baru dari AI"
                    >
                      {aiDesignLoading ? <Loader2 size={14} className="cms-spin" /> : <Sparkles size={14} />}
                    </button>

                    <button
                      onClick={() => openFullscreenStudio('trends')}
                      className="cms-circle-btn"
                      style={{
                        width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0
                      }}
                      title="Buka Fullscreen Tren Desain"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>

                {aiDesignResult && (
                  <div style={{ background: 'var(--cms-input-bg)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.04em' }}>IDE DESAIN KREATIF TERBARU:</span>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={handleSaveDesignIdeaToNotes}
                          className="cms-circle-btn"
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-card-bg)',
                            border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0
                          }}
                          title="Simpan ke Catatan Memo"
                        >
                          <StickyNote size={12} />
                        </button>
                        <button
                          onClick={handleCopyDesignIdea}
                          className="cms-circle-btn"
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-card-bg)',
                            border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0
                          }}
                          title="Salin Ide ke Clipboard"
                        >
                          {aiDesignCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--cms-text)', lineHeight: 1.6, maxHeight: 140, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                      {aiDesignResult}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
                  {CURATED_DESIGN_TRENDS.map((tr, i) => (
                    <a
                      key={i}
                      href={tr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: 'none',
                        background: 'var(--cms-input-bg)',
                        borderRadius: 14,
                        padding: '10px 12px',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 6,
                        transition: 'transform 0.15s, border-color 0.15s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 8.5, fontWeight: 850, padding: '2px 6px', borderRadius: 4, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)' }}>
                            {tr.tag}
                          </span>
                          <ExternalLink size={11} color="var(--cms-text-muted)" />
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 2 }}>{tr.title}</div>
                        <div style={{ fontSize: 9, color: 'var(--cms-text-muted)', lineHeight: 1.4 }}>{tr.desc}</div>
                      </div>
                      <span style={{ fontSize: 8.5, fontWeight: 800, color: 'var(--cms-accent)', marginTop: 4 }}>Buka Referensi</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* DESIGN WIDGET 4: CURATED RESOURCE & SHORTCUT VAULT */}
              <div style={{
                gridColumn: isCompact ? 'span 1' : 'span 12',
                background: 'var(--cms-card-bg)',
                borderRadius: 22,
                border: '1px solid var(--glass-border)',
                padding: isMobile ? '14px' : '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, aspectRatio: '1 / 1', borderRadius: 12, background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Rocket size={17} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Toolkit Desain</h3>
                      <InfoTooltip content="Portal direktori aset, font, ikon & mockups" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => openFullscreenStudio('resources')}
                      className="cms-circle-btn"
                      style={{
                        width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0
                      }}
                      title="Buka Fullscreen Toolkit Desain"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: isCompact ? 'space-between' : 'center',
                  gap: isCompact ? 0 : 4,
                  background: 'var(--cms-input-bg)',
                  padding: 4,
                  borderRadius: 100,
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {[
                    { id: 'all', label: 'Semua', icon: LayoutGrid },
                    { id: 'typography', label: 'Font & Teks', icon: Type },
                    { id: 'icons', label: 'Ikon & Vektor', icon: Shapes },
                    { id: 'inspiration', label: 'Inspirasi', icon: Compass },
                    { id: 'colors', label: 'Warna', icon: Palette },
                    { id: 'mockup', label: 'Mockup', icon: Box },
                    { id: 'stock', label: 'Stock Media', icon: Camera }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setResourceCategory(cat.id)}
                      title={cat.label}
                      style={{
                        padding: isMobile ? '6px 10px' : isTablet ? '6px 12px' : '5px 12px',
                        borderRadius: 100,
                        border: 'none',
                        background: resourceCategory === cat.id ? 'var(--cms-card-bg)' : 'transparent',
                        color: resourceCategory === cat.id ? 'var(--cms-text)' : 'var(--cms-text-muted)',
                        fontSize: 9.5,
                        fontWeight: resourceCategory === cat.id ? 850 : 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        flex: isCompact ? 1 : 'none'
                      }}
                    >
                      <cat.icon size={isMobile ? 16 : isTablet ? 18 : 12} />
                      {!isCompact && <span>{cat.label}</span>}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 8 }}>
                  {filteredResources.slice(0, 12).map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: 'none',
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        transition: 'transform 0.15s, border-color 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, background: `${res.color}18`, color: res.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <res.icon size={15} />
                        </div>
                        <ExternalLink size={11} color="var(--cms-text-muted)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text)' }}>{res.name}</div>
                        <div style={{ fontSize: 8.5, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{res.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* DESIGN WIDGET 5: LIVE PROJECT DELIVERABLES PIPELINE */}
              <div style={{
                gridColumn: isCompact ? 'span 1' : 'span 12',
                background: 'var(--cms-card-bg)',
                borderRadius: 22,
                border: '1px solid var(--glass-border)',
                padding: isMobile ? '14px' : '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, aspectRatio: '1 / 1', borderRadius: 12, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Workflow size={17} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Tahapan Proyek</h3>
                      <InfoTooltip content="Pelacakan tahapan konsep & deliverable klien realtime" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => openFullscreenStudio('pipeline')}
                      className="cms-circle-btn"
                      style={{
                        width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0
                      }}
                      title="Buka Fullscreen Tahapan Proyek"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button 
                      onClick={() => onSwitchPage('projects')} 
                      title="Buka Proyek" 
                      className="cms-circle-btn"
                      style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Interactive Clickable Task List Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { id: 'briefing', name: '1. Briefing & Konsep', color: '#3b82f6' },
                    { id: 'design', name: '2. Desain & Aset', color: '#8b5cf6' },
                    { id: 'revision', name: '3. Revisi Klien', color: '#f59e0b' },
                    { id: 'approved', name: '4. Final Approval', color: '#10b981' }
                  ].map(stage => {
                    const items = kanbanTasks.filter(t => t.stage === stage.id);
                    return (
                      <div
                        key={stage.id}
                        style={{
                          padding: '10px 12px', borderRadius: 14, background: 'var(--cms-input-bg)',
                          border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 6
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: stage.color }}>{stage.name}</span>
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 100, background: 'var(--cms-card-bg)', color: 'var(--cms-text-muted)' }}>
                            {items.length}
                          </span>
                        </div>

                        {items.slice(0, 2).map(task => (
                          <div
                            key={task.id}
                            onClick={() => { setSelectedTask(task); openFullscreenStudio('pipeline'); }}
                            style={{
                              padding: '8px', borderRadius: 10, background: 'var(--cms-card-bg)',
                              border: '1px solid var(--glass-border)', cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', gap: 3
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 850, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.title}
                            </div>
                            <div style={{ fontSize: 8.5, color: 'var(--cms-text-muted)' }}>
                              Klien: {task.client}
                            </div>
                          </div>
                        ))}

                        {items.length === 0 && (
                          <div style={{ fontSize: 9, color: 'var(--cms-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                            Kosong
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
                </div>
              )}
            </div>
          )}

          {/* ══════ SECTION B: BUSINESS, SALES & CLIENT MANAGEMENT ══════ */}
          {(studioTab === 'all' || studioTab === 'business') && (
            <div id="suite-anchor-business" style={{
              gridColumn: isCompact ? 'span 1' : 'span 12',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              minWidth: 0
            }}>
              {/* Header Suite Bisnis */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
                borderRadius: isMobile ? 18 : 22,
                border: '1.5px solid var(--glass-border, rgba(16, 185, 129, 0.2))',
                padding: isMobile ? '10px 12px' : '14px 20px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: isMobile ? 8 : 14,
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    minWidth: isMobile ? 32 : 40,
                    borderRadius: isMobile ? 10 : 12,
                    background: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    flexShrink: 0
                  }}>
                    <DollarSign size={isMobile ? 16 : 20} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: isMobile ? 13 : 16,
                      fontWeight: 900,
                      color: 'var(--cms-text)',
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Bisnis & Keuangan Kas
                    </h2>
                    <span style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      padding: '1.5px 6px',
                      borderRadius: 100,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      FINANSIAL
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: isMobile ? 5 : 8, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onSwitchPage('transactions')}
                    title="Buka Kas & Mutasi"
                    aria-label="Keuangan"
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      aspectRatio: '1 / 1',
                      padding: 0,
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: '#10b981',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <DollarSign size={isMobile ? 15 : 16} color="#10b981" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSuite('business')}
                    title={expandedSuites.business ? 'Ciutkan Suite Bisnis' : 'Lebarkan Suite Bisnis'}
                    aria-label={expandedSuites.business ? 'Ciutkan Suite Bisnis' : 'Lebarkan Suite Bisnis'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      border: '1.5px solid var(--glass-border, rgba(16, 185, 129, 0.25))',
                      background: expandedSuites.business ? '#10b981' : 'var(--cms-card-bg, #ffffff)',
                      color: expandedSuites.business ? '#ffffff' : '#10b981',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {expandedSuites.business ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {expandedSuites.business && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isCompact ? 'minmax(0, 1fr)' : 'repeat(12, minmax(0, 1fr))',
                  gap: 14,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}>
              {/* TRANSAKSI & GRAFIK PENDAPATAN */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 7', 
                background: 'var(--cms-card-bg)', 
                border: '1px solid var(--cms-border)',
                color: 'var(--cms-text)', 
                borderRadius: 22, 
                overflow: 'hidden',
                padding: isMobile ? '14px' : '20px', 
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, minWidth: 30, minHeight: 30, aspectRatio: '1 / 1', borderRadius: 8, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrendingUp size={15} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Finansial Studio</h3>
                        <InfoTooltip content="Rekap transaksi penjualan & grafik pendapatan bulanan" />
                      </div>
                    </div>
                    <button onClick={() => onSwitchPage('transactions')} title="Buka Transaksi" className="cms-circle-btn" style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--cms-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1.1fr 1fr', gap: 10, alignItems: 'center', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', minWidth: 0 }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 2 }}>TOTAL PENDAPATAN BULAN INI</div>
                        <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Rp {monthlyRevenue.toLocaleString('id-ID')}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: '100%', minWidth: 0 }}>
                        <div style={{ background: 'var(--cms-input-bg)', border: '1px solid var(--cms-border)', padding: '6px 8px', borderRadius: 10, textAlign: 'center', minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>{transactions.length}</div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--cms-text-muted)', marginTop: 1 }}>TRANSAKSI</div>
                        </div>
                        <div style={{ background: 'var(--cms-input-bg)', border: '1px solid var(--cms-border)', padding: '6px 8px', borderRadius: 10, textAlign: 'center', minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>
                            {transactions.filter(t => t.paymentStatus === 'lunas').length}
                          </div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--cms-text-muted)', marginTop: 1 }}>LUNAS</div>
                        </div>
                      </div>

                      {transactions.length > 0 && (
                        <div style={{ height: 75, width: '100%', minWidth: 0, background: 'var(--cms-input-bg)', border: '1px solid var(--cms-border)', borderRadius: 10, padding: '6px 6px 0', boxSizing: 'border-box', overflow: 'hidden' }}>
                          <Suspense fallback={null}>
                            <DashboardTrafficBarChart data={chartData} />
                          </Suspense>
                        </div>
                      )}
                    </div>

                    <div style={{ background: 'var(--cms-input-bg)', border: '1px solid var(--cms-border)', borderRadius: 12, padding: '10px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, boxSizing: 'border-box' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)', letterSpacing: '0.04em' }}>PESANAN TERAKHIR</div>
                      {transactions.slice(0, 3).map((trx, i) => (
                        <div key={trx.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cms-card-bg)', border: '1px solid var(--cms-border)', padding: '6px 8px', borderRadius: 8, minWidth: 0 }}>
                          <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trx.customer?.name || 'Pelanggan'}</div>
                            <div style={{ fontSize: 8, color: 'var(--cms-text-muted)' }}>{trx.date ? new Date(trx.date).toLocaleDateString('id-ID') : 'Hari ini'}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text)' }}>Rp {Number(trx.grandTotal || 0).toLocaleString('id-ID')}</div>
                            <span style={{ 
                              fontSize: 7, fontWeight: 800, padding: '1px 5px', borderRadius: 4, 
                              background: trx.paymentStatus === 'lunas' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                              color: trx.paymentStatus === 'lunas' ? '#10b981' : '#f59e0b'
                            }}>
                              {trx.paymentStatus?.toUpperCase() || 'BARU'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {transactions.length === 0 && (
                        <div style={{ textAlign: 'center', opacity: 0.75, padding: '10px 0', fontSize: 10 }}>
                          Belum ada transaksi masuk.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TARGET & GOALS BULANAN */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 5', 
                background: 'var(--cms-card-bg)', 
                borderRadius: 22, 
                border: '1px solid var(--glass-border)', 
                padding: isMobile ? '14px' : '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12, 
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Target size={16} color="#ec4899" />
                    <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Target Bulanan</span>
                    <InfoTooltip content="Target pencapaian omset, jumlah proyek & artikel" />
                  </div>
                  <button 
                    onClick={() => setIsEditingGoals(!isEditingGoals)}
                    title={isEditingGoals ? 'Tutup' : 'Ubah Target'}
                    className="cms-circle-btn"
                    style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                  >
                    {isEditingGoals ? <X size={14} /> : <Edit3 size={14} />}
                  </button>
                </div>

                {isEditingGoals ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--cms-input-bg)', padding: 10, borderRadius: 12 }}>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>Target Omset (Rp)</label>
                      <input 
                        type="number" 
                        value={tempGoals.revenue} 
                        onChange={e => setTempGoals({ ...tempGoals, revenue: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, fontWeight: 800, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div>
                        <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>Target Proyek</label>
                        <input 
                          type="number" 
                          value={tempGoals.projects} 
                          onChange={e => setTempGoals({ ...tempGoals, projects: Number(e.target.value) })}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, fontWeight: 800, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>Target Artikel</label>
                        <input 
                          type="number" 
                          value={tempGoals.articles} 
                          onChange={e => setTempGoals({ ...tempGoals, articles: Number(e.target.value) })}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, fontWeight: 800, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveGoals}
                      style={{ background: 'var(--cms-accent)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: 'pointer', marginTop: 4 }}
                    >
                      Simpan Target
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>
                        <span>Target Omset</span>
                        <span>{revenueGoalPct}% (Rp {monthlyRevenue.toLocaleString('id-ID')} / {monthlyGoals.revenue?.toLocaleString('id-ID')})</span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 100, background: 'var(--cms-input-bg)', overflow: 'hidden' }}>
                        <div style={{ width: `${revenueGoalPct}%`, height: '100%', background: '#10b981', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>
                        <span>Proyek Selesai</span>
                        <span>{projectsGoalPct}% ({effectiveProjects.length} / {monthlyGoals.projects} Proyek)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 100, background: 'var(--cms-input-bg)', overflow: 'hidden' }}>
                        <div style={{ width: `${projectsGoalPct}%`, height: '100%', background: '#3b82f6', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>
                        <span>Publikasi Artikel</span>
                        <span>{articlesGoalPct}% ({blogStats.published} / {monthlyGoals.articles} Artikel)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 100, background: 'var(--cms-input-bg)', overflow: 'hidden' }}>
                        <div style={{ width: `${articlesGoalPct}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* KATALOG & JASA */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 4', 
                background: 'var(--cms-card-bg)', 
                borderRadius: 22, 
                border: '1px solid var(--glass-border)', 
                padding: isMobile ? '14px' : '18px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10, 
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShoppingBag size={16} color="#ec4899" />
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: 'var(--cms-text)' }}>Katalog Layanan</span>
                    <InfoTooltip content="Katalog produk jasa, tarif desain & portofolio layanan" />
                  </div>
                  <button onClick={() => onSwitchPage('transactions')} title="Kelola Katalog" className="cms-circle-btn" style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                    <Plus size={15} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  <div style={{ padding: '8px 4px', background: 'var(--cms-input-bg)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#ec4899' }}>{catalogStats.total}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--cms-text-muted)' }}>TOTAL</div>
                  </div>
                  <div style={{ padding: '8px 4px', background: 'var(--cms-input-bg)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#10b981' }}>{catalogStats.active}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--cms-text-muted)' }}>AKTIF</div>
                  </div>
                  <div style={{ padding: '8px 4px', background: 'var(--cms-input-bg)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#3b82f6' }}>{catalogStats.categoriesCount}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--cms-text-muted)' }}>KATEGORI</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {catalogProducts.slice(0, 3).map((prod, idx) => (
                    <div 
                      key={prod.id || idx}
                      onClick={() => onSwitchPage('transactions')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 8px', borderRadius: 8, background: 'var(--cms-input-bg)',
                        cursor: 'pointer', minWidth: 0
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.title || prod.name || 'Produk'}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: '#ec4899', flexShrink: 0 }}>
                        Rp {Number(prod.price || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* INBOX & LEADS PELANGGAN */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 4', 
                background: 'var(--cms-card-bg)', 
                borderRadius: 22, 
                border: '1px solid var(--glass-border)', 
                padding: isMobile ? '14px' : '18px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10, 
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquareMore size={16} color="#06b6d4" />
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: 'var(--cms-text)' }}>Pesan Masuk</span>
                    <InfoTooltip content="Pesan masuk & konsultasi klien terbaru" />
                  </div>
                  <button onClick={() => onSwitchPage('chat')} title="Buka Chat" className="cms-circle-btn" style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recentChats.slice(0, 3).map((chat, idx) => (
                    <div 
                      key={chat.id || idx}
                      onClick={() => onSwitchPage('chat')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 8px', borderRadius: 8, background: 'var(--cms-input-bg)',
                        cursor: 'pointer', minWidth: 0
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {chat.customerName || chat.senderName || 'Pengunjung Web'}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chat.lastMessage || 'Memulai percakapan baru...'}
                        </div>
                      </div>
                      <span style={{ fontSize: 8, fontWeight: 800, color: '#06b6d4', flexShrink: 0 }}>
                        {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru'}
                      </span>
                    </div>
                  ))}
                  {recentChats.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 10, padding: '16px 0' }}>
                      Belum ada pesan pelanggan baru.
                    </div>
                  )}
                </div>
              </div>

              {/* BLOG & PUBLIKASI */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 4', 
                background: 'var(--cms-card-bg)', 
                borderRadius: 22, 
                border: '1px solid var(--glass-border)', 
                padding: isMobile ? '14px' : '18px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10, 
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={16} color="#8b5cf6" />
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: 'var(--cms-text)' }}>Artikel Blog</span>
                    <InfoTooltip content="Statistik pembaca artikel & publikasi blog studio" />
                  </div>
                  <button onClick={() => onSwitchPage('blog')} title="Tulis Artikel Baru" className="cms-circle-btn" style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
                    <Plus size={15} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  <div style={{ padding: '8px 4px', background: 'var(--cms-input-bg)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#8b5cf6' }}>{blogStats.total}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--cms-text-muted)' }}>TOTAL</div>
                  </div>
                  <div style={{ padding: '8px 4px', background: 'var(--cms-input-bg)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#10b981' }}>{blogStats.published}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--cms-text-muted)' }}>TERBIT</div>
                  </div>
                  <div style={{ padding: '8px 4px', background: 'var(--cms-input-bg)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 950, color: '#f59e0b' }}>{blogStats.totalViews}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--cms-text-muted)' }}>VIEWS</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {blogStats.topArticles.map((post, idx) => (
                    <div 
                      key={post.id || idx}
                      onClick={() => onSwitchPage('blog')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 8px', borderRadius: 8, background: 'var(--cms-input-bg)',
                        cursor: 'pointer', minWidth: 0
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {post.title}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--cms-text-muted)', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                        <Eye size={10} /> {post.views || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                </div>
              )}
            </div>
          )}

          {/* ══════ SECTION C & D: SUITE SISTEM CLOUD & OTOMASI ══════ */}
          {(studioTab === 'all' || studioTab === 'system') && (
            <div id="suite-anchor-system" style={{
              gridColumn: isCompact ? 'span 1' : 'span 12',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              minWidth: 0
            }}>
              {/* Header Suite Sistem Cloud */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08))',
                borderRadius: isMobile ? 18 : 22,
                border: '1.5px solid var(--glass-border, rgba(99, 102, 241, 0.2))',
                padding: isMobile ? '10px 12px' : '14px 20px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: isMobile ? 8 : 14,
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    minWidth: isMobile ? 32 : 40,
                    borderRadius: isMobile ? 10 : 12,
                    background: '#6366f1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                    flexShrink: 0
                  }}>
                    <Cloud size={isMobile ? 16 : 20} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: isMobile ? 13 : 16,
                      fontWeight: 900,
                      color: 'var(--cms-text)',
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Sistem Cloud & Otomasi
                    </h2>
                    <span style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      padding: '1.5px 6px',
                      borderRadius: 100,
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      OTOMASI
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: isMobile ? 5 : 8, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onSwitchPage('storage')}
                    title="Monitor Storage & Cloud"
                    aria-label="Storage"
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      borderRadius: isMobile ? 9 : 11,
                      aspectRatio: '1 / 1',
                      padding: 0,
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: '#6366f1',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <HardDrive size={isMobile ? 15 : 16} color="#6366f1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSuite('system')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: isMobile ? '5px 10px' : '6px 14px',
                      borderRadius: 9999,
                      border: '1.5px solid var(--glass-border, rgba(99, 102, 241, 0.25))',
                      background: expandedSuites.system ? '#6366f1' : 'var(--cms-card-bg, #ffffff)',
                      color: expandedSuites.system ? '#ffffff' : '#6366f1',
                      fontSize: 11.5,
                      fontWeight: 850,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <span>{expandedSuites.system ? 'Ciutkan' : 'Lebarkan'}</span>
                    {expandedSuites.system ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>

              {expandedSuites.system && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isCompact ? 'minmax(0, 1fr)' : 'repeat(12, minmax(0, 1fr))',
                  gap: 14,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}>
              {/* AI QUICK STUDIO GENERATOR */}
              <div 
                id="dash-ai-studio"
                style={{ 
                  gridColumn: isCompact ? 'span 1' : 'span 6', 
                  background: 'var(--cms-card-bg)', 
                  borderRadius: 22, 
                  border: '1px solid var(--glass-border)', 
                  padding: isMobile ? '14px' : '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 10, 
                  boxShadow: 'var(--cms-shadow-sm)',
                  boxSizing: 'border-box',
                  width: '100%',
                  minWidth: 0
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} color="#eab308" />
                    <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Studio AI</span>
                    <InfoTooltip content="Generator konten otomatis untuk artikel, proyek & copywriting" />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['article', 'project', 'copywriting'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setAiMode(m)}
                        style={{
                          padding: '2px 7px', borderRadius: 100, fontSize: 8, fontWeight: 800,
                          background: aiMode === m ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                          color: aiMode === m ? '#fff' : 'var(--cms-text-muted)',
                          border: '1px solid var(--glass-border)', cursor: 'pointer'
                        }}
                      >
                        {m === 'article' ? 'Artikel' : m === 'project' ? 'Proyek' : 'Copy'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <input 
                    type="text" 
                    value={aiPrompt} 
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleGenerateAi(); }}
                    placeholder={aiMode === 'article' ? 'Topik artikel (cth: Tren UI/UX 2026)...' : aiMode === 'project' ? 'Nama & jenis proyek portofolio...' : 'Produk atau penawaran jasa...'}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11,
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={handleGenerateAi}
                    disabled={aiLoading || !aiPrompt.trim()}
                    style={{
                      padding: '8px 14px', borderRadius: 10, background: 'var(--cms-accent)', color: '#fff',
                      border: 'none', fontSize: 10, fontWeight: 850, cursor: aiLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0
                    }}
                  >
                    {aiLoading ? <Loader2 size={12} className="cms-spin" /> : <Sparkles size={12} />}
                    <span>Buat</span>
                  </button>
                </div>

                {aiResult && (
                  <div style={{ background: 'var(--cms-input-bg)', borderRadius: 10, padding: 10, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>HASIL AI GENERATOR:</span>
                      <button onClick={handleCopyAiResult} title={aiCopied ? 'Tersalin' : 'Salin'} className="cms-circle-btn" style={{ width: 26, height: 26, minWidth: 26, minHeight: 26, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>
                        {aiCopied ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text)', lineHeight: 1.4, maxHeight: 90, overflowY: 'auto' }}>
                      {aiResult}
                    </div>
                  </div>
                )}
              </div>

              {/* CHECKLIST TUGAS STUDIO */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 6', 
                background: 'var(--cms-card-bg)', 
                borderRadius: 22, 
                border: '1px solid var(--glass-border)', 
                padding: isMobile ? '14px' : '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10, 
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ListTodo size={16} color="#10b981" />
                    <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Checklist Tugas</span>
                    <InfoTooltip content="Daftar tugas harian & to-do list desainer" />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>
                    {todos.filter(t => t.done).length}/{todos.length} Selesai
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <input 
                    type="text" 
                    value={newTodoInput} 
                    onChange={e => setNewTodoInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTodo(); }}
                    placeholder="Tulis tugas desain baru..."
                    style={{
                      flex: 1, padding: '7px 10px', borderRadius: 8, background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11,
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <button 
                    onClick={handleAddTodo}
                    title="Tambah Tugas"
                    className="cms-circle-btn"
                    style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, aspectRatio: '1 / 1', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 110, overflowY: 'auto' }}>
                  {todos.map(t => (
                    <div 
                      key={t.id} 
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 8px', borderRadius: 8, background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)'
                      }}
                    >
                      <div 
                        onClick={() => handleToggleTodo(t.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1, minWidth: 0 }}
                      >
                        {t.done ? <CheckCircle2 size={13} color="#10b981" /> : <Circle size={13} color="var(--cms-text-muted)" />}
                        <span style={{ fontSize: 11, color: t.done ? 'var(--cms-text-muted)' : 'var(--cms-text)', textDecoration: t.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.text}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTodo(t.id)}
                        title="Hapus Tugas"
                        style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══════ SECTION D: SYSTEM, CLOUD HEALTH & AUDIT ══════ */}
              {/* CLOUD STORAGE & SYNC HEALTH */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 12', 
                background: 'var(--cms-card-bg)', 
                borderRadius: 22, 
                border: '1px solid var(--glass-border)', 
                padding: isMobile ? '14px' : '18px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12, 
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Cloud size={16} color="#6366f1" />
                    <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Status Cloud</span>
                    <InfoTooltip content="Monitoring database lokal, Cloudinary & sinkronisasi data" />
                  </div>
                  <button 
                    onClick={() => onSwitchPage('storage')} 
                    title="Monitor Storage"
                    className="cms-circle-btn"
                    style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                  >
                    <HardDrive size={15} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 8 }}>
                  <div style={{ padding: '8px 10px', background: 'var(--cms-input-bg)', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>DATABASE LOKAL</div>
                    <div style={{ fontSize: 14, fontWeight: 950, color: 'var(--cms-text)', marginTop: 2 }}>{stats.dbUsageKb} KB</div>
                    <div style={{ fontSize: 8, color: '#10b981', marginTop: 2 }}>100% Aman di IndexedDB</div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--cms-input-bg)', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>FOTO & MEDIA CLOUDINARY</div>
                    <div style={{ fontSize: 14, fontWeight: 950, color: '#3b82f6', marginTop: 2 }}>{stats.cloudinaryImages} Gambar</div>
                    <div style={{ fontSize: 8, color: 'var(--cms-text-muted)', marginTop: 2 }}>CDN Terhubung</div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--cms-input-bg)', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>MODE PENYIMPANAN</div>
                    <div style={{ fontSize: 14, fontWeight: 950, color: syncMode === 'auto' ? '#10b981' : syncMode === 'offline' ? '#ef4444' : '#f59e0b', marginTop: 2 }}>
                      {syncMode === 'auto' ? 'Auto-Sync' : syncMode === 'offline' ? 'Offline Lokal' : 'Manual / Hemat'}
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--cms-text-muted)', marginTop: 2 }}>Google Sheets Bridge</div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--cms-input-bg)', borderRadius: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>TELEMETRI & LATENCY</div>
                    <div style={{ fontSize: 14, fontWeight: 950, color: '#ec4899', marginTop: 2 }}>{heartbeatState.latency} ms</div>
                    <div style={{ fontSize: 8, color: 'var(--cms-text-muted)', marginTop: 2 }}>RAM: {heartbeatState.ram.toFixed(1)}MB</div>
                  </div>
                </div>
              </div>

              {/* NOTES & SCRATCHPAD HUB */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 12', 
                background: 'var(--cms-card-bg)', 
                borderRadius: 22, 
                border: '1px solid var(--glass-border)', 
                padding: isMobile ? '12px' : '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10, 
                boxShadow: 'var(--cms-shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StickyNote size={16} color="var(--cms-accent)" />
                    <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 900, color: 'var(--cms-text)' }}>Catatan Memo</span>
                    <InfoTooltip content="Buku catatan ide kreatif & memo cepat auto-save" />
                  </div>
                  <button
                    onClick={() => onSwitchPage('notes')}
                    title="Buka Notes"
                    className="cms-circle-btn"
                    style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--cms-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1.1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'var(--cms-input-bg)', borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--cms-text-muted)' }}>CATATAN TERAKHIR</div>
                    {notesStats.recentNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => {
                          window.history.pushState({}, '', `?view=editor&note=${note.id}`);
                          onSwitchPage('notes');
                        }}
                        style={{
                          padding: '6px 8px', borderRadius: 8, background: 'var(--cms-card-bg)',
                          border: '1px solid var(--glass-border)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, minWidth: 0
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {note.title || 'Tanpa Judul'}
                        </div>
                        <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', flexShrink: 0 }}>
                          {note.type === 'canvas' ? 'Kanvas' : 'Dokumen'}
                        </span>
                      </div>
                    ))}
                    {notesStats.recentNotes.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 10, padding: '10px 0' }}>
                        Belum ada catatan.
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'var(--cms-input-bg)', borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--cms-text-muted)' }}>MEMO CEPAT (AUTO-SAVE)</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={handleCopyNotes} disabled={!adminNotes} style={{ padding: '2px 6px', borderRadius: 100, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)', color: 'var(--cms-text)', fontSize: 8, fontWeight: 700, cursor: adminNotes ? 'pointer' : 'default' }}>
                          {notesCopied ? 'Tersalin' : 'Salin'}
                        </button>
                        {adminNotes && (
                          <button onClick={handleSaveScratchpadToNotes} style={{ padding: '2px 6px', borderRadius: 100, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontSize: 8, fontWeight: 800, cursor: 'pointer' }}>
                            Simpan
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={adminNotes}
                      onChange={handleNotesChange}
                      placeholder="Tulis ide instan di sini..."
                      rows={2}
                      style={{
                        width: '100%', padding: '6px 8px', borderRadius: 8, background: 'var(--cms-card-bg)',
                        border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10,
                        resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SYSTEM AUDIT & LOGS */}
              <div style={{ 
                gridColumn: isCompact ? 'span 1' : 'span 12', 
                background: '#0a0a0f', 
                borderRadius: 20, 
                border: 'none', 
                color: '#10b981', 
                display: 'flex', 
                flexDirection: 'column', 
                padding: isMobile ? '12px' : '18px', 
                gap: 8, 
                boxSizing: 'border-box', 
                width: '100%', 
                minWidth: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Terminal size={14} />
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.06em' }}>Audit Sistem</span>
                    <InfoTooltip content="Log diagnosa sistem, integritas data & latensi" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#10b981' }}>
                    <ShieldCheck size={12} /> Trust Score: {100 - audit.issues.length}%
                  </div>
                </div>
                
                <div style={{ fontFamily: 'monospace', fontSize: 9, display: 'flex', flexDirection: 'column', gap: 3, background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 10, overflowX: 'auto' }}>
                  {liveNotifs.slice(0, 3).map((log, i) => (
                    <div key={log.id || i} style={{ display: 'flex', gap: 6, whiteSpace: 'nowrap' }}>
                      <span style={{ opacity: 0.4 }}>[{log.time}]</span>
                      <span style={{ color: log.type === 'error' ? '#ef4444' : '#10b981' }}>{log.type?.toUpperCase()}</span>
                      <span style={{ color: '#d1d5db' }}>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
                </div>
              )}
            </div>
          )}

        </div>
          </div>
        )}
      </div>
      ) : (
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16, width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0, animation: 'fadeIn 0.18s ease-out' }}>
          {/* Top Application Header Bar inside Frame */}
          <header style={{
            borderRadius: isMobile ? 14 : 22,
            border: '1.5px solid var(--glass-border)',
            background: 'var(--cms-card-bg)',
            padding: isMobile ? '10px 12px' : '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--cms-shadow-sm)',
            boxSizing: 'border-box',
            width: '100%',
            flexShrink: 0,
            gap: 8
          }}>
            {/* Left: Back Button — circle on mobile, pill on desktop */}
            <button
              onClick={closeFullscreenStudio}
              style={{
                width: isMobile ? 36 : 'auto',
                height: isMobile ? 36 : 'auto',
                minWidth: isMobile ? 36 : 'auto',
                minHeight: isMobile ? 36 : 'auto',
                aspectRatio: isMobile ? '1 / 1' : undefined,
                padding: isMobile ? 0 : '8px 16px',
                borderRadius: 100,
                background: 'var(--cms-input-bg)',
                border: '1.5px solid var(--glass-border)',
                color: 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 850,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
              }}
              title="Kembali ke Dashboard"
            >
              <ArrowLeft size={15} />
              {!isMobile && <span>Kembali</span>}
            </button>

            {/* Center: Title */}
            <h1 style={{
              margin: 0,
              flex: 1,
              fontSize: isMobile ? 14 : 18,
              fontWeight: 950,
              color: 'var(--cms-text)',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {fullscreenApp === 'color' && 'Studio Warna'}
              {fullscreenApp === 'canvas' && 'Preset Kanvas'}
              {fullscreenApp === 'trends' && 'Tren Desain'}
              {fullscreenApp === 'resources' && 'Toolkit Desain'}
              {fullscreenApp === 'pipeline' && 'Tahapan Proyek'}
            </h1>

            {/* Right: mirror spacer to keep title centered */}
            <div style={{ flexShrink: 0, width: isMobile ? 36 : 85, height: isMobile ? 36 : 'auto' }} />
          </header>

          {/* Expanded Studio View within Frame */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 20, paddingBottom: isMobile ? 80 : 8, flex: 1, minHeight: 0, width: '100%', boxSizing: 'border-box' }}>
              
              {/* ── APP 1: FULLSCREEN KANBAN DELIVERABLES & PIPELINE (CLICKABLE & INTERACTIVE) ── */}
              {fullscreenApp === 'pipeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: 'var(--cms-text)' }}>Papan Kanban Pelacakan Deliverable & Klien</h2>
                      <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>Klik kartu proyek untuk melihat rincian atau geser tahapan</span>
                    </div>

                    <button
                      onClick={() => { onSwitchPage('projects'); closeFullscreenStudio(); }}
                      style={{ padding: '8px 16px', borderRadius: 100, background: 'var(--cms-accent)', color: '#fff', border: 'none', fontWeight: 850, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> <span>Buka Modul Proyek Utama</span>
                    </button>
                  </div>

                  {/* Kanban Columns (4 Stages) */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, flex: 1, minHeight: 0 }}>
                    {[
                      { id: 'briefing', name: '1. Briefing & Konsep', color: '#3b82f6' },
                      { id: 'design', name: '2. Desain & Aset', color: '#8b5cf6' },
                      { id: 'revision', name: '3. Revisi Klien', color: '#f59e0b' },
                      { id: 'approved', name: '4. Final Approval', color: '#10b981' }
                    ].map(col => {
                      const items = kanbanTasks.filter(t => t.stage === col.id);
                      return (
                        <div
                          key={col.id}
                          style={{
                            background: 'var(--cms-card-bg, #111118)',
                            borderRadius: 18,
                            border: '1px solid var(--glass-border)',
                            padding: 14,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            boxShadow: 'var(--cms-shadow-sm)',
                            minHeight: 320
                          }}
                        >
                          {/* Column Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Circle size={8} fill={col.color} color={col.color} />
                              <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-text)' }}>{col.name}</span>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 850, padding: '2px 8px', borderRadius: 100, background: 'var(--cms-input-bg)', color: col.color }}>
                              {items.length}
                            </span>
                          </div>

                          {/* Quick Add Button */}
                          {addingToStage === col.id ? (
                            <div style={{ background: 'var(--cms-input-bg)', padding: 10, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <input
                                type="text"
                                value={newKanbanTitle}
                                onChange={e => setNewKanbanTitle(e.target.value)}
                                placeholder="Judul proyek / aset..."
                                autoFocus
                                style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, outline: 'none' }}
                              />
                              <input
                                type="text"
                                value={newKanbanClient}
                                onChange={e => setNewKanbanClient(e.target.value)}
                                placeholder="Nama klien..."
                                style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, outline: 'none' }}
                              />
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
                                <button onClick={() => setAddingToStage(null)} style={{ padding: '4px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, cursor: 'pointer' }}>Batal</button>
                                <button onClick={() => handleCreateKanbanTask(col.id as any)} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--cms-accent)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>Simpan</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddingToStage(col.id as any); setNewKanbanTitle(''); }}
                              style={{ padding: '7px 10px', borderRadius: 10, background: 'var(--cms-input-bg)', border: '1px dashed var(--glass-border)', color: 'var(--cms-text-muted)', fontSize: 10.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            >
                              <Plus size={13} /> <span>Tambah Deliverable</span>
                            </button>
                          )}

                          {/* Task Cards List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
                            {items.map(task => (
                              <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: 14,
                                  background: 'var(--cms-input-bg, #181822)',
                                  border: selectedTask?.id === task.id ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                  <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-text)', lineHeight: 1.3 }}>{task.title}</span>
                                  <span style={{ fontSize: 8.5, fontWeight: 850, padding: '2px 6px', borderRadius: 4, background: `${col.color}22`, color: col.color, flexShrink: 0 }}>
                                    {task.category || 'Desain'}
                                  </span>
                                </div>

                                <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <User size={11} /> Klien: <span style={{ color: 'var(--cms-text)', fontWeight: 700 }}>{task.client}</span>
                                </div>

                                {task.budget && (
                                  <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <DollarSign size={11} /> Budget: <span style={{ color: '#10b981', fontWeight: 800 }}>{task.budget}</span>
                                  </div>
                                )}

                                {/* Action Controls (Move Stage / Delete) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--glass-border)', marginTop: 2 }}>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {col.id !== 'briefing' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveTaskStage(task.id, 'prev'); }}
                                        title="Pindah ke tahap sebelumnya"
                                        style={{ padding: '3px 6px', borderRadius: 6, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                      >
                                        <MoveLeft size={11} />
                                      </button>
                                    )}
                                    {col.id !== 'approved' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveTaskStage(task.id, 'next'); }}
                                        title="Lanjut ke tahap berikutnya"
                                        style={{ padding: '3px 6px', borderRadius: 6, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                      >
                                        <MoveRight size={11} />
                                      </button>
                                    )}
                                  </div>

                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteKanbanTask(task.id); }}
                                    title="Hapus Task"
                                    style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {items.length === 0 && (
                              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--cms-text-muted)', fontSize: 11 }}>
                                Belum ada deliverable pada tahap ini.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── APP 2: FULLSCREEN COLOR THEORY STUDIO & MOCKUP SIMULATOR ── */}
              {fullscreenApp === 'color' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : isTablet ? 'minmax(0, 1fr)' : '380px minmax(0, 1fr)',
                  gap: isMobile ? 10 : 16,
                  alignItems: 'stretch',
                  minHeight: (isMobile || isTablet) ? 'auto' : 'calc(100vh - 165px)',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}>
                  {/* ── LEFT PANEL: HERO COLOR WHEEL + COLOR INTELLIGENCE MATRIX ── */}
                  <div style={{
                    background: 'var(--cms-card-bg)',
                    borderRadius: isMobile ? 16 : 24,
                    padding: isMobile ? '12px 14px' : 20,
                    border: '1.5px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--cms-shadow-sm)',
                    boxSizing: 'border-box',
                    gap: isMobile ? 10 : 14,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    {/* Header: judul atas, kontrol bawah */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: '2px 0' }}>

                      {/* Baris 1: Icon + Judul + Subtitle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{ width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: 10, background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Palette size={isMobile ? 14 : 17} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 950, color: 'var(--cms-text)', whiteSpace: 'nowrap' }}>
                            RODA WARNA 360°
                          </div>
                          <div style={{ fontSize: 9.5, color: 'var(--cms-text-muted)' }}>Spektrum Harmoni Interaktif</div>
                        </div>
                      </div>

                      {/* Baris 2: Kontrol warna (color picker + hex + degree + sliders) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', width: '100%', boxSizing: 'border-box' }}>
                        <GlassColorPicker
                          value={baseColorHex}
                          onChange={(c: string) => setBaseColorHex(c)}
                          customTrigger={(open: () => void) => (
                            <div
                              onClick={open}
                              className="cms-circle-btn"
                              style={{
                                width: 24, height: 24, minWidth: 24, minHeight: 24,
                                aspectRatio: '1 / 1', borderRadius: '50%',
                                background: baseColorHex,
                                boxShadow: `0 0 10px ${baseColorHex}88, inset 0 0 0 2px rgba(255,255,255,0.6)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0, padding: 0
                              }}
                              title="Buka Glass Color Studio"
                            >
                              <Pipette size={11} color={getLuminance(baseColorHex) > 0.4 ? '#000000' : '#ffffff'} />
                            </div>
                          )}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text-muted)' }}>#</span>
                          <input
                            type="text"
                            value={baseColorHex.replace('#', '')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                              if (val.length > 0) setBaseColorHex('#' + val);
                            }}
                            style={{
                              width: isMobile ? 52 : 58, height: 22, borderRadius: 6, background: 'transparent',
                              border: 'none', color: 'var(--cms-text)', fontSize: 11, fontWeight: 850,
                              textTransform: 'uppercase', outline: 'none', padding: 0, flexShrink: 0
                            }}
                            placeholder="7C3AED"
                          />
                        </div>

                        <span style={{ fontSize: 11, fontWeight: 950, color: 'var(--cms-accent)', padding: '0 4px', borderLeft: '1px solid var(--glass-border)', flexShrink: 0 }}>
                          {currentH}°
                        </span>

                        <button
                          onClick={() => setShowColorSliders(!showColorSliders)}
                          className="cms-circle-btn"
                          style={{
                            width: 24, height: 24, minWidth: 24, minHeight: 24, aspectRatio: '1 / 1', borderRadius: '50%',
                            background: showColorSliders ? 'var(--cms-accent)' : 'var(--cms-card-bg)',
                            border: '1px solid var(--glass-border)',
                            color: showColorSliders ? '#fff' : 'var(--cms-text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            flexShrink: 0, padding: 0, marginLeft: 'auto'
                          }}
                          title="Buka/Tutup Slider HSL"
                        >
                          <SlidersHorizontal size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Massive Color Wheel Centerpiece */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: isMobile ? '8px 0 12px' : '12px 0', flex: isMobile ? 'none' : 1, minWidth: 0 }}>
                      <InteractiveColorWheel
                        hue={currentH}
                        mode={colorTheoryMode}
                        onHueChange={handleWheelHueChange}
                        size={isMobile ? Math.min(typeof window !== 'undefined' ? window.innerWidth - 84 : 200, 200) : isTablet ? 240 : 300}
                        baseHex={baseColorHex}
                      />
                      {!isMobile && (
                        <span style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 750, marginTop: 10 }}>
                          Putar lingkaran untuk mengubah rona spektrum
                        </span>
                      )}
                    </div>

                    {/* Color Intelligence & Metrics Matrix */}
                    <div style={{
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '1fr 1fr',
                      gap: isMobile ? 4 : 10,
                      background: 'var(--cms-input-bg)',
                      padding: isMobile ? '8px 10px' : '12px 14px',
                      borderRadius: isMobile ? 14 : 18,
                      border: '1px solid var(--glass-border)',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 8.5, color: 'var(--cms-text-muted)', fontWeight: 800 }}>HEX / RGB:</span>
                        <span style={{ fontSize: 11, fontWeight: 950, color: 'var(--cms-text)' }}>{baseColorHex.toUpperCase()}</span>
                        <span style={{ fontSize: 9, color: 'var(--cms-text-muted)' }}>{colorRgb}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 8.5, color: 'var(--cms-text-muted)', fontWeight: 800 }}>HSL & LUM:</span>
                        <span style={{ fontSize: 11, fontWeight: 950, color: 'var(--cms-accent)' }}>{currentH}° • {currentS}% • {currentL}%</span>
                        <span style={{ fontSize: 9, color: 'var(--cms-text-muted)' }}>Lum: {getLuminance(baseColorHex).toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 6, borderTop: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: 8.5, color: 'var(--cms-text-muted)', fontWeight: 800 }}>SUHU WARNA:</span>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#06b6d4' }}>{colorMood.temp}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 6, borderTop: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: 8.5, color: 'var(--cms-text-muted)', fontWeight: 800 }}>KARAKTER DESAIN:</span>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#10b981' }}>{colorMood.mood}</span>
                      </div>
                    </div>

                    {/* Left Action Buttons */}
                    <div style={{ width: '100%', display: 'flex', gap: 6 }}>
                      <button
                        onClick={handleGenerateAiColorInspiration}
                        disabled={aiPaletteLoading}
                        style={{
                          flex: 1,
                          padding: '10px 10px',
                          borderRadius: 12,
                          background: 'var(--cms-accent)',
                          color: '#fff',
                          border: 'none',
                          fontSize: isMobile ? 10.5 : 11,
                          fontWeight: 850,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          boxShadow: '0 4px 14px var(--cms-accent-soft)',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                          overflow: 'hidden'
                        }}
                      >
                        {aiPaletteLoading ? <Loader2 size={13} className="cms-spin" /> : <Sparkles size={13} />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isMobile ? 'AI' : 'Inspirasi AI'}</span>
                      </button>

                      <button
                        onClick={() => setShowSaveInputModal(true)}
                        style={{
                          padding: '10px',
                          borderRadius: 12,
                          background: 'var(--cms-input-bg)',
                          color: 'var(--cms-accent)',
                          border: '1px solid var(--glass-border)',
                          fontSize: 11,
                          fontWeight: 850,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: isMobile ? 0 : 5,
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}
                        title="Simpan Palet ke Katalog Inspirasi"
                      >
                        <BookmarkPlus size={14} />
                        {!isMobile && <span>Simpan</span>}
                      </button>

                      <button
                        onClick={() => setShowSavedCatalogModal(true)}
                        style={{
                          padding: '10px',
                          borderRadius: 12,
                          background: 'var(--cms-input-bg)',
                          color: 'var(--cms-text)',
                          border: '1px solid var(--glass-border)',
                          fontSize: 11,
                          fontWeight: 850,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: isMobile ? 0 : 5,
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}
                        title="Buka Katalog Palet Inspirasi Tersimpan"
                      >
                        <FolderHeart size={14} />
                        {!isMobile && <span>Katalog ({savedPalettes.length})</span>}
                      </button>
                    </div>
                  </div>

                  {/* ── RIGHT PANEL: GOLONGAN + TRIO SLIDERS + SKEMA + UI SIMULATOR + WCAG ACCURATE + GRADIENT + EXPORT ── */}
                  <div style={{
                    background: 'var(--cms-card-bg)',
                    borderRadius: isMobile ? 16 : 24,
                    padding: isMobile ? '12px 14px' : 20,
                    border: '1.5px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 10 : 14,
                    justifyContent: 'space-between',
                    boxShadow: 'var(--cms-shadow-sm)',
                    boxSizing: 'border-box',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    {/* Top Row: Golongan Selector & Trio Sliders Side-by-Side */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : '1.1fr 1fr', gap: isMobile ? 8 : 12, alignItems: 'center', width: '100%', minWidth: 0 }}>
                      {/* Golongan Box with Circular Swatches */}
                      <div style={{ background: 'var(--cms-input-bg)', padding: isMobile ? '10px 12px' : '12px 14px', borderRadius: isMobile ? 14 : 18, display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 8, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 900, color: 'var(--cms-text)' }}>
                            GOLONGAN: <span style={{ color: 'var(--cms-accent)' }}>{COLOR_GOLONGAN_DATA[selectedGolonganTab].label.toUpperCase()}</span>
                          </span>
                          {!isMobile && <span style={{ fontSize: 9, color: 'var(--cms-text-muted)' }}>{COLOR_GOLONGAN_DATA[selectedGolonganTab].desc.slice(0, 32)}...</span>}
                        </div>

                        {/* 4 Golongan Pills */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, background: 'var(--cms-card-bg)', padding: 3, borderRadius: 100 }}>
                          {(['primer', 'sekunder', 'tersier', 'netral'] as ColorGolongan[]).map(g => (
                            <button
                              key={g}
                              onClick={() => { setSelectedGolonganTab(g); haptic.light(); }}
                              style={{
                                padding: '5px 0',
                                borderRadius: 100,
                                border: 'none',
                                background: selectedGolonganTab === g ? 'var(--cms-accent)' : 'transparent',
                                color: selectedGolonganTab === g ? '#ffffff' : 'var(--cms-text-muted)',
                                fontSize: 9.5,
                                fontWeight: selectedGolonganTab === g ? 850 : 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: selectedGolonganTab === g ? '#fff' : 'currentColor' }} />
                              <span>{COLOR_GOLONGAN_DATA[g].label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Circular Color Swatches (Rapi & Gak Keluar Tempat) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)' }}>Pilihan:</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {COLOR_GOLONGAN_DATA[selectedGolonganTab].colors.map((c, i) => {
                              const isActive = baseColorHex.toLowerCase() === c.hex.toLowerCase();
                              return (
                                <div
                                  key={i}
                                  onClick={() => { handleUpdateHsl(c.hue, c.sat, c.val); haptic.light(); }}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: c.hex,
                                    boxShadow: isActive ? `0 0 0 2px var(--cms-accent), 0 0 10px ${c.hex}88` : `0 2px 5px rgba(0,0,0,0.25)`,
                                    border: isActive ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    transform: isActive ? 'scale(1.15)' : 'scale(1)'
                                  }}
                                  title={`${c.name} (${c.hex})`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Trio Elemen Sliders */}
                      <div style={{ background: 'var(--cms-input-bg)', padding: isMobile ? '10px 12px' : '12px 14px', borderRadius: isMobile ? 14 : 18, display: 'flex', flexDirection: 'column', gap: 6, width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text)' }}>TRIO ELEMEN</span>
                          <div style={{ display: 'flex', gap: 6, fontSize: 9.5, fontWeight: 850 }}>
                            <span style={{ color: 'var(--cms-accent)' }}>H:{currentH}°</span>
                            <span style={{ color: '#06b6d4' }}>S:{currentS}%</span>
                            <span style={{ color: '#10b981' }}>V:{currentL}%</span>
                          </div>
                        </div>

                        {/* Hue */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)', width: 44 }}>Hue</span>
                          <div style={{ flex: 1, position: 'relative', height: 8, borderRadius: 100, background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}>
                            <input type="range" min="0" max="360" value={currentH} onChange={e => handleUpdateHsl(parseInt(e.target.value), currentS, currentL)} style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
                          </div>
                          <span style={{ fontSize: 9.5, fontWeight: 900, width: 28, textAlign: 'right', color: 'var(--cms-text)' }}>{currentH}°</span>
                        </div>

                        {/* Saturation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)', width: 44 }}>Saturasi</span>
                          <div style={{ flex: 1, position: 'relative', height: 8, borderRadius: 100, background: `linear-gradient(to right, ${hslToHex(currentH, 0, currentL)}, ${hslToHex(currentH, 100, currentL)})` }}>
                            <input type="range" min="0" max="100" value={currentS} onChange={e => handleUpdateHsl(currentH, parseInt(e.target.value), currentL)} style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
                          </div>
                          <span style={{ fontSize: 9.5, fontWeight: 900, width: 28, textAlign: 'right', color: 'var(--cms-text)' }}>{currentS}%</span>
                        </div>

                        {/* Value / Lightness */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cms-text-muted)', width: 44 }}>Value</span>
                          <div style={{ flex: 1, position: 'relative', height: 8, borderRadius: 100, background: `linear-gradient(to right, #000000, ${hslToHex(currentH, currentS, 50)}, #ffffff)` }}>
                            <input type="range" min="5" max="95" value={currentL} onChange={e => handleUpdateHsl(currentH, currentS, parseInt(e.target.value))} style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
                          </div>
                          <span style={{ fontSize: 9.5, fontWeight: 900, width: 28, textAlign: 'right', color: 'var(--cms-text)' }}>{currentL}%</span>
                        </div>
                      </div>
                    </div>

                    {/* 6 Skema Harmoni Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text-muted)', letterSpacing: '0.04em' }}>
                        SKEMA HARMONI WARNA (COLOR HARMONIES):
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 6 }}>
                        {[
                          { id: 'monochromatic', label: 'Monokrom', sub: '1 Rona' },
                          { id: 'analogous', label: 'Analog', sub: '±30° Selaras' },
                          { id: 'complementary', label: 'Komplementer', sub: '180° Kontras' },
                          { id: 'triadic', label: 'Triadik', sub: '120° Segitiga' },
                          { id: 'split', label: 'Split-Komp', sub: '±150° Dinamis' },
                          { id: 'tetradic', label: 'Tetradik', sub: '90° Square' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setColorTheoryMode(m.id as any); haptic.light(); }}
                            style={{
                              padding: '8px 6px',
                              borderRadius: 12,
                              border: 'none',
                              background: colorTheoryMode === m.id ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                              color: colorTheoryMode === m.id ? '#ffffff' : 'var(--cms-text)',
                              cursor: 'pointer',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                              transition: 'all 0.15s ease',
                              boxShadow: colorTheoryMode === m.id ? '0 4px 12px var(--cms-accent-soft)' : 'none'
                            }}
                          >
                            <div style={{ fontSize: 10.5, fontWeight: 900 }}>{m.label}</div>
                            <div style={{ fontSize: 8.5, opacity: 0.8 }}>{m.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live UI Mockup Simulation Grid (Plush & Expanded 3 Cards) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text-muted)', letterSpacing: '0.04em' }}>
                          SIMULASI KOMPONEN UI REAL-TIME:
                        </span>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-accent)' }}>Live Preview</span>
                      </div>

                      {/* UI Simulator: horizontal scroll on mobile so cards don't squish */}
                      <div style={
                        isMobile
                          ? { display: 'flex', flexDirection: 'row', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', paddingBottom: 2 }
                          : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }
                      }>
                        {/* Primary Action Card */}
                        <div style={{ background: generatedHarmonicColors[0], padding: isMobile ? '10px 12px' : '14px 16px', borderRadius: 14, color: getLuminance(generatedHarmonicColors[0]) > 0.4 ? '#000' : '#fff', display: 'flex', flexDirection: 'column', gap: 5, minHeight: isMobile ? 76 : 90, flex: isMobile ? '0 0 calc(50% - 4px)' : undefined, scrollSnapAlign: isMobile ? 'start' : undefined, boxSizing: 'border-box' }}>
                          <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Target size={isMobile ? 11 : 14} /> {isMobile ? 'Primary' : 'Primary Action'}
                          </div>
                          {!isMobile && <div style={{ fontSize: 9.5, opacity: 0.9 }}>Tombol aksi brand dan CTA utama.</div>}
                          <div style={{ marginTop: 'auto', padding: isMobile ? '3px 7px' : '5px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: 9, fontWeight: 850, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                            CTA
                          </div>
                        </div>

                        {/* Secondary Accent Card */}
                        <div style={{ background: generatedHarmonicColors[1] || baseColorHex, padding: isMobile ? '10px 12px' : '14px 16px', borderRadius: 14, color: getLuminance(generatedHarmonicColors[1] || baseColorHex) > 0.4 ? '#000' : '#fff', display: 'flex', flexDirection: 'column', gap: 5, minHeight: isMobile ? 76 : 90, flex: isMobile ? '0 0 calc(50% - 4px)' : undefined, scrollSnapAlign: isMobile ? 'start' : undefined, boxSizing: 'border-box' }}>
                          <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Layers size={isMobile ? 11 : 14} /> {isMobile ? 'Secondary' : 'Secondary Accent'}
                          </div>
                          {!isMobile && <div style={{ fontSize: 9.5, opacity: 0.9 }}>Elemen pendukung dan status badge.</div>}
                          <div style={{ marginTop: 'auto', padding: isMobile ? '3px 7px' : '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 850, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                            Badge
                          </div>
                        </div>

                        {/* Tertiary Card */}
                        <div style={{ background: generatedHarmonicColors[2] || '#111827', padding: isMobile ? '10px 12px' : '14px 16px', borderRadius: 14, color: getLuminance(generatedHarmonicColors[2] || '#111827') > 0.4 ? '#000' : '#fff', display: 'flex', flexDirection: 'column', gap: 5, minHeight: isMobile ? 76 : 90, flex: isMobile ? '0 0 calc(50% - 4px)' : undefined, scrollSnapAlign: isMobile ? 'start' : undefined, boxSizing: 'border-box' }}>
                          <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Shield size={isMobile ? 11 : 14} /> {isMobile ? 'Surface' : 'Surface Card'}
                          </div>
                          {!isMobile && <div style={{ fontSize: 9.5, opacity: 0.9 }}>Kontras permukaan & border garis.</div>}
                          <div style={{ marginTop: 'auto', padding: isMobile ? '3px 7px' : '5px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.25)', fontSize: 9, fontWeight: 850, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                            Surface
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* WCAG 2.1 Contrast Matrix (Visual Stark Dark & Light Contrast Preview) */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : '1fr 1fr', gap: 10, width: '100%', minWidth: 0 }}>
                      {/* Dark Mode Interactive Preview */}
                      <div style={{
                        background: '#090D16',
                        border: `2px solid ${darkContrast >= 4.5 ? '#10b981' : '#f59e0b'}`,
                        borderRadius: 16,
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        minHeight: 88
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                            <span style={{ fontSize: 9.5, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.04em' }}>DARK THEME PREVIEW</span>
                          </div>
                          <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: darkContrast >= 4.5 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: darkContrast >= 4.5 ? '#10b981' : '#f59e0b' }}>
                            {darkContrast >= 7.0 ? 'AAA Lolos' : darkContrast >= 4.5 ? 'AA Standar' : 'Fail'}
                          </span>
                        </div>

                        {/* Live UI Sample on Dark Surface */}
                        <div style={{
                          background: '#131B2E',
                          borderRadius: 10,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid rgba(255,255,255,0.08)',
                          gap: 10
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: baseColorHex, fontSize: 13, fontWeight: 950, letterSpacing: '-0.01em' }}>
                              Aa Teks: {baseColorHex.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 8.5, color: '#64748b' }}>Rasio {darkContrast} : 1 pada latar Gelap</span>
                          </div>

                          <div style={{
                            padding: '5px 12px',
                            borderRadius: 8,
                            background: baseColorHex,
                            color: getLuminance(baseColorHex) > 0.4 ? '#000000' : '#ffffff',
                            fontSize: 10,
                            fontWeight: 900,
                            flexShrink: 0,
                            boxShadow: `0 2px 8px ${baseColorHex}66`
                          }}>
                            Aksi
                          </div>
                        </div>
                      </div>

                      {/* Light Mode Interactive Preview (Stark White Real Light Surface) */}
                      <div style={{
                        background: '#FFFFFF',
                        border: `2px solid ${lightContrast >= 4.5 ? '#059669' : '#e11d48'}`,
                        borderRadius: 16,
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        boxShadow: '0 4px 16px rgba(255,255,255,0.1)',
                        minHeight: 88
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
                            <span style={{ fontSize: 9.5, fontWeight: 900, color: '#334155', letterSpacing: '0.04em' }}>LIGHT THEME PREVIEW</span>
                          </div>
                          <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: lightContrast >= 4.5 ? 'rgba(5,150,105,0.15)' : 'rgba(225,29,72,0.15)', color: lightContrast >= 4.5 ? '#059669' : '#e11d48' }}>
                            {lightContrast >= 7.0 ? 'AAA Lolos' : lightContrast >= 4.5 ? 'AA Standar' : 'Fail'}
                          </span>
                        </div>

                        {/* Live UI Sample on Light Surface */}
                        <div style={{
                          background: '#F1F5F9',
                          borderRadius: 10,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid #E2E8F0',
                          gap: 10
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: baseColorHex, fontSize: 13, fontWeight: 950, letterSpacing: '-0.01em' }}>
                              Aa Teks: {baseColorHex.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 8.5, color: '#64748b' }}>Rasio {lightContrast} : 1 pada latar Terang</span>
                          </div>

                          <div style={{
                            padding: '5px 12px',
                            borderRadius: 8,
                            background: baseColorHex,
                            color: getLuminance(baseColorHex) > 0.4 ? '#000000' : '#ffffff',
                            fontSize: 10,
                            fontWeight: 900,
                            flexShrink: 0,
                            boxShadow: `0 2px 8px ${baseColorHex}66`
                          }}>
                            Aksi
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5 Wide & Plush Swatches (Tone 1-5, Tall & Dense) */}
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${generatedHarmonicColors.length}, minmax(0, 1fr))`, gap: isMobile ? 5 : 10, height: isMobile ? 68 : 92, width: '100%', minWidth: 0 }}>
                      {generatedHarmonicColors.map((c, i) => (
                        <div
                          key={i}
                          onClick={() => handleCopyColor(c)}
                          style={{
                            background: c, borderRadius: isMobile ? 10 : 16, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between',
                            padding: isMobile ? '6px 3px' : '10px 8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.15)',
                            transition: 'all 0.15s ease',
                            overflow: 'hidden',
                            gap: isMobile ? 2 : 0
                          }}
                          title={`Klik untuk salin HEX: ${c}`}
                        >
                          {!isMobile && (
                            <span style={{ fontSize: 9.5, fontWeight: 900, opacity: 0.85, color: getLuminance(c) > 0.4 ? '#000' : '#fff', textTransform: 'uppercase' }}>
                              Tone {i + 1}
                            </span>
                          )}

                          <span style={{ fontSize: isMobile ? 8 : 13, fontWeight: 950, color: getLuminance(c) > 0.4 ? '#000' : '#fff', letterSpacing: '0.01em', textAlign: 'center', overflow: 'hidden', width: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: isMobile ? '0 2px' : 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {copiedColor === c ? <Check size={isMobile ? 10 : 13} /> : (isMobile ? c.replace('#', '') : c.toUpperCase())}
                          </span>

                          {!isMobile && (
                            <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: getLuminance(c) > 0.4 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.3)', color: getLuminance(c) > 0.4 ? '#000' : '#fff' }}>
                              Lum {getLuminance(c).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Dedicated Full-Width CSS Linear Gradient Preview Banner */}
                    <div style={{
                      height: isMobile ? 52 : 64,
                      borderRadius: isMobile ? 12 : 16,
                      background: cssGradientString,
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                      padding: isMobile ? '0 10px' : '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Glassmorphic Gradient Info Badge */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? 6 : 10,
                        background: 'rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(10px)',
                        padding: isMobile ? '5px 10px' : '6px 14px',
                        borderRadius: 100,
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        minWidth: 0,
                        overflow: 'hidden'
                      }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', boxShadow: '0 0 5px #fff', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                          <span style={{ fontSize: isMobile ? 9.5 : 11, fontWeight: 950, color: '#ffffff', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                            {isMobile ? 'CSS GRADIENT 135°' : 'CSS LINEAR GRADIENT 135°'}
                          </span>
                          {!isMobile && (
                            <span style={{ fontSize: 8.5, color: '#cbd5e1', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {generatedHarmonicColors[0]} → {generatedHarmonicColors[2] || baseColorHex} → {generatedHarmonicColors[generatedHarmonicColors.length - 1]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Glassmorphic Action Button */}
                      <button
                        onClick={handleCopyGradientCss}
                        style={{
                          padding: isMobile ? '7px 10px' : '8px 16px',
                          borderRadius: 100,
                          background: 'rgba(0, 0, 0, 0.55)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: copiedGradient ? '#10b981' : '#ffffff',
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? 0 : 6,
                          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}
                        title="Salin Kode CSS Gradient"
                      >
                        {copiedGradient ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        {!isMobile && <span>{copiedGradient ? 'Tersalin' : 'Salin CSS Gradient'}</span>}
                      </button>
                    </div>

                    {/* Pro Export Toolbar */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap', width: '100%', minWidth: 0 }}>
                      <button onClick={() => handleCopyPaletteAs('css')} style={{ padding: isMobile ? '6px 8px' : '7px 12px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} title="Salin CSS :root">
                        <Code size={12} /> <span>CSS</span>
                      </button>
                      <button onClick={() => handleCopyPaletteAs('tailwind')} style={{ padding: isMobile ? '6px 8px' : '7px 12px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} title="Salin Tailwind Config">
                        <Copy size={12} /> <span>Tailwind</span>
                      </button>
                      <button onClick={() => handleCopyPaletteAs('array')} style={{ padding: isMobile ? '6px 8px' : '7px 12px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} title="Salin JSON Array">
                        <FileText size={12} /> <span>JSON</span>
                      </button>
                      <button 
                        onClick={() => handleExportPalettePng({
                          name: `${COLOR_GOLONGAN_DATA[selectedGolonganTab]?.label || 'Palet'} ${colorTheoryMode.toUpperCase()}`,
                          mode: colorTheoryMode,
                          golongan: selectedGolonganTab,
                          colors: generatedHarmonicColors,
                          baseHex: baseColorHex
                        })} 
                        style={{ padding: isMobile ? '6px 8px' : '7px 12px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} 
                        title="Download Gambar Kartu Palet PNG HD"
                      >
                        <ImageIcon size={12} /> <span>PNG</span>
                      </button>
                      <button 
                        onClick={() => handleExportPaletteSvg({
                          name: `${COLOR_GOLONGAN_DATA[selectedGolonganTab]?.label || 'Palet'} ${colorTheoryMode.toUpperCase()}`,
                          mode: colorTheoryMode,
                          golongan: selectedGolonganTab,
                          colors: generatedHarmonicColors,
                          baseHex: baseColorHex
                        })} 
                        style={{ padding: isMobile ? '6px 8px' : '7px 12px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} 
                        title="Download Vektor Kartu Palet SVG"
                      >
                        <FileCode size={12} /> <span>SVG</span>
                      </button>
                      <button onClick={() => handleApplyThemeColor(baseColorHex)} style={{ marginLeft: isMobile ? 0 : 'auto', flex: isMobile ? 1 : undefined, padding: isMobile ? '6px 12px' : '7px 16px', borderRadius: 100, background: 'var(--cms-accent)', color: '#fff', border: 'none', fontSize: isMobile ? 10 : 11, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <Pipette size={12} /> <span>Terapkan Aksen</span>
                      </button>
                    </div>
                  </div>

                  {/* ── MODAL: SIMPAN PALET KE KATALOG INSPIRASI ── */}
                  {showSaveInputModal && (
                    <div style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 99999,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 16
                    }}>
                      <div style={{
                        background: 'var(--cms-card-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 20,
                        padding: 24,
                        width: '100%',
                        maxWidth: 440,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BookmarkPlus size={16} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 950, color: 'var(--cms-text)' }}>SIMPAN KE KATALOG INSPIRASI</span>
                          </div>
                          <button onClick={() => setShowSaveInputModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}>
                            <X size={18} />
                          </button>
                        </div>

                        {/* Palette Swatch Preview */}
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${generatedHarmonicColors.length}, 1fr)`, height: 44, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                          {generatedHarmonicColors.map((c, i) => (
                            <div key={i} style={{ background: c, height: '100%' }} />
                          ))}
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 6, display: 'block' }}>
                            Nama Palet Inspirasi
                          </label>
                          <input
                            type="text"
                            value={paletteSaveName}
                            onChange={e => setPaletteSaveName(e.target.value)}
                            placeholder={`${COLOR_GOLONGAN_DATA[selectedGolonganTab].label} ${colorTheoryMode.toUpperCase()} (${baseColorHex.toUpperCase()})`}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: 12,
                              background: 'var(--cms-input-bg)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--cms-text)',
                              fontSize: 12,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveCurrentPalette(paletteSaveName); }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                          <button
                            onClick={() => setShowSaveInputModal(false)}
                            style={{ padding: '9px 16px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text-muted)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveCurrentPalette(paletteSaveName)}
                            style={{ padding: '9px 20px', borderRadius: 100, background: 'var(--cms-accent)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px var(--cms-accent-soft)' }}
                          >
                            <Save size={13} />
                            <span>Simpan Sekarang</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── MODAL: KATALOG INSPIRASI WARNA TERSIMPAN & EXPORT ── */}
                  {showSavedCatalogModal && (
                    <div style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 99999,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: isMobile ? 12 : 24
                    }}>
                      <div style={{
                        background: 'var(--cms-card-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 24,
                        padding: isMobile ? 16 : 24,
                        width: '100%',
                        maxWidth: 780,
                        maxHeight: '90vh',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        boxSizing: 'border-box'
                      }}>
                        {/* Header with Export & Import */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(124,58,237,0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FolderHeart size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 950, color: 'var(--cms-text)' }}>
                                KATALOG INSPIRASI WARNA ({savedPalettes.length})
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                                Koleksi palet tersimpan di sistem yang siap digunakan & diexport
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {/* Export All JSON Button */}
                            <button
                              onClick={handleExportAllPalettesJson}
                              style={{
                                padding: '8px 14px',
                                borderRadius: 100,
                                background: 'var(--cms-input-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--cms-text)',
                                fontSize: 11,
                                fontWeight: 850,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5
                              }}
                              title="Export semua koleksi ke file JSON"
                            >
                              <Download size={13} />
                              <span>Export JSON</span>
                            </button>

                            {/* Import JSON Button */}
                            <label
                              style={{
                                padding: '8px 14px',
                                borderRadius: 100,
                                background: 'var(--cms-input-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--cms-text)',
                                fontSize: 11,
                                fontWeight: 850,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5
                              }}
                              title="Import file palet JSON ke koleksi"
                            >
                              <Upload size={13} />
                              <span>Import JSON</span>
                              <input type="file" accept=".json" onChange={handleImportPalettesJson} style={{ display: 'none' }} />
                            </label>

                            {/* Close Button */}
                            <button
                              onClick={() => setShowSavedCatalogModal(false)}
                              style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 4 }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div style={{ position: 'relative' }}>
                          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }} />
                          <input
                            type="text"
                            value={paletteCatalogSearch}
                            onChange={e => setPaletteCatalogSearch(e.target.value)}
                            placeholder="Cari berdasarkan nama, warna hex, atau harmoni..."
                            style={{
                              width: '100%',
                              padding: '9px 12px 9px 34px',
                              borderRadius: 12,
                              background: 'var(--cms-input-bg)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--cms-text)',
                              fontSize: 11.5,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Saved Palettes Grid */}
                        <div style={{
                          flex: 1,
                          overflowY: 'auto',
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                          gap: 12,
                          paddingRight: 4,
                          minHeight: 220
                        }}>
                          {savedPalettes
                            .filter(p => {
                              if (!paletteCatalogSearch.trim()) return true;
                              const q = paletteCatalogSearch.toLowerCase();
                              return p.name.toLowerCase().includes(q) || p.mode.toLowerCase().includes(q) || p.golongan.toLowerCase().includes(q) || p.colors.some(c => c.toLowerCase().includes(q));
                            })
                            .map(palette => (
                              <div
                                key={palette.id}
                                style={{
                                  background: 'var(--cms-input-bg)',
                                  border: '1px solid var(--glass-border)',
                                  borderRadius: 16,
                                  padding: 14,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 10,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {/* Swatch Strip (5 Colors) */}
                                <div style={{ height: 48, borderRadius: 10, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  {palette.colors.map((hex, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => handleCopyColor(hex)}
                                      style={{
                                        flex: 1,
                                        height: '100%',
                                        background: hex,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        paddingBottom: 4
                                      }}
                                      title={`Klik untuk salin HEX: ${hex}`}
                                    >
                                      <span style={{ fontSize: 7.5, fontWeight: 900, color: getLuminance(hex) > 0.4 ? '#000' : '#fff', opacity: 0.8 }}>
                                        {hex}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Linear Gradient Mini Strip */}
                                <div style={{
                                  height: 12,
                                  borderRadius: 6,
                                  background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[2] || palette.baseHex}, ${palette.colors[palette.colors.length - 1]})`,
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                                }} />

                                {/* Info & Badges */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 950, color: 'var(--cms-text)' }}>
                                      {palette.name}
                                    </div>
                                    <div style={{ fontSize: 9, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                                      {palette.mode.toUpperCase()} • {COLOR_GOLONGAN_DATA[palette.golongan]?.label || palette.golongan}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.baseHex, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                                    <span style={{ fontSize: 9.5, fontWeight: 900, color: 'var(--cms-text)' }}>{palette.baseHex.toUpperCase()}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid var(--glass-border)' }}>
                                  <button
                                    onClick={() => handleLoadSavedPalette(palette)}
                                    style={{
                                      flex: 1,
                                      padding: '7px 12px',
                                      borderRadius: 100,
                                      background: 'var(--cms-accent)',
                                      color: '#fff',
                                      border: 'none',
                                      fontSize: 10.5,
                                      fontWeight: 850,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5
                                    }}
                                  >
                                    <Sparkles size={12} />
                                    <span>Gunakan Palet</span>
                                  </button>

                                  <button
                                    onClick={() => handleExportPalettePng(palette)}
                                    style={{
                                      padding: '7px 9px',
                                      borderRadius: 100,
                                      background: 'var(--cms-card-bg)',
                                      border: '1px solid var(--glass-border)',
                                      color: 'var(--cms-text)',
                                      fontSize: 10,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 3
                                    }}
                                    title="Export Kartu Palet ke PNG"
                                  >
                                    <ImageIcon size={11} /> <span>PNG</span>
                                  </button>

                                  <button
                                    onClick={() => handleExportPaletteSvg(palette)}
                                    style={{
                                      padding: '7px 9px',
                                      borderRadius: 100,
                                      background: 'var(--cms-card-bg)',
                                      border: '1px solid var(--glass-border)',
                                      color: 'var(--cms-text)',
                                      fontSize: 10,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 3
                                    }}
                                    title="Export Kartu Palet ke SVG"
                                  >
                                    <FileCode size={11} /> <span>SVG</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      const text = palette.colors.map((c, i) => `  --studio-color-${i + 1}: ${c};`).join('\n');
                                      navigator.clipboard?.writeText(`:root {\n${text}\n}`);
                                      window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: `CSS :root untuk ${palette.name} disalin!`, type: 'success' } }));
                                    }}
                                    style={{
                                      padding: '7px 9px',
                                      borderRadius: 100,
                                      background: 'var(--cms-card-bg)',
                                      border: '1px solid var(--glass-border)',
                                      color: 'var(--cms-text)',
                                      fontSize: 10,
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                    title="Salin Kode CSS :root"
                                  >
                                    <Code size={12} />
                                  </button>

                                  <button
                                    onClick={(e) => handleDeleteSavedPalette(palette.id, e)}
                                    style={{
                                      padding: '7px 9px',
                                      borderRadius: 100,
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid rgba(239, 68, 68, 0.2)',
                                      color: '#ef4444',
                                      fontSize: 10,
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                    title="Hapus palet dari katalog"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>

                        {savedPalettes.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--cms-text-muted)', fontSize: 12 }}>
                            Belum ada palet warna tersimpan. Simpan palet warna favorit Anda dari studio!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── APP 3: FULLSCREEN CANVAS DIRECTORY & UNIT CALCULATOR ── */}
              {fullscreenApp === 'canvas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', minWidth: 0 }}>
                  {/* AI Dimension Generator + Live Unit Calculator */}
                  <div style={{ display: 'grid', gridTemplateColumns: isCompact ? 'minmax(0, 1fr)' : '1.3fr 1fr', gap: 14, width: '100%', minWidth: 0 }}>
                    <div style={{ background: 'var(--cms-card-bg)', borderRadius: 16, padding: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, boxSizing: 'border-box' }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Wand2 size={14} /> TAMBAH FORMAT KANVAS DENGAN AI (INTERNET CONNECTED)
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap', width: '100%' }}>
                        <input
                          type="text"
                          value={aiCanvasPrompt}
                          onChange={e => setAiCanvasPrompt(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleGenerateAiCanvasDimension(); }}
                          placeholder="Ketik platform / media (cth: Banner Billboard 4x6m, Twitch Emote, Banner Shopee)..."
                          style={{ flex: 1, minWidth: isMobile ? '100%' : 200, padding: '9px 12px', borderRadius: 10, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11.5, outline: 'none', boxSizing: 'border-box' }}
                        />
                        <button
                          onClick={handleGenerateAiCanvasDimension}
                          disabled={aiCanvasLoading || !aiCanvasPrompt.trim()}
                          style={{ padding: '9px 18px', width: isMobile ? '100%' : 'auto', borderRadius: 10, background: 'var(--cms-accent)', color: '#fff', border: 'none', fontSize: 11.5, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}
                        >
                          {aiCanvasLoading ? <Loader2 size={14} className="cms-spin" /> : <Plus size={14} />}
                          <span>Buat Format</span>
                        </button>
                      </div>
                    </div>

                    {/* Unit Calculator */}
                    <div style={{ background: 'var(--cms-card-bg)', borderRadius: 16, padding: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, boxSizing: 'border-box' }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calculator size={14} /> KALKULATOR RESOLUSI PIKSEL KE CM / INCH
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 6, alignItems: 'center', width: '100%' }}>
                        <input type="number" value={calcW} onChange={e => setCalcW(Number(e.target.value))} placeholder="Lebar px" style={{ padding: '6px 8px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, width: '100%', boxSizing: 'border-box' }} />
                        <input type="number" value={calcH} onChange={e => setCalcH(Number(e.target.value))} placeholder="Tinggi px" style={{ padding: '6px 8px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, width: '100%', boxSizing: 'border-box' }} />
                        
                        {/* Precision Rounded Glass DPI Dropdown */}
                        <div style={{ position: 'relative', gridColumn: isMobile ? 'span 2' : 'auto' }}>
                          <button
                            type="button"
                            onClick={() => setIsDpiDropdownOpen(!isDpiDropdownOpen)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: 8,
                              background: 'var(--cms-input-bg)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--cms-text)',
                              fontSize: 10.5,
                              fontWeight: 850,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              boxSizing: 'border-box'
                            }}
                          >
                            <span>{calcDpi === 72 ? '72 DPI (Web)' : calcDpi === 150 ? '150 DPI (Banner)' : '300 DPI (Cetak)'}</span>
                            <ChevronDown size={12} style={{ transform: isDpiDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
                          </button>

                          {isDpiDropdownOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 4px)',
                                left: 0,
                                right: 0,
                                zIndex: 100,
                                background: 'var(--cms-card-bg, #101018)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 10,
                                padding: 4,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                              }}
                            >
                              {[
                                { value: 72, label: '72 DPI (Web)' },
                                { value: 150, label: '150 DPI (Banner)' },
                                { value: 300, label: '300 DPI (Cetak)' }
                              ].map(opt => (
                                <div
                                  key={opt.value}
                                  onClick={() => { setCalcDpi(opt.value); setIsDpiDropdownOpen(false); }}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: 6,
                                    fontSize: 10.5,
                                    fontWeight: calcDpi === opt.value ? 900 : 700,
                                    background: calcDpi === opt.value ? 'var(--cms-accent)' : 'transparent',
                                    color: calcDpi === opt.value ? '#fff' : 'var(--cms-text)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span>{opt.label}</span>
                                  {calcDpi === opt.value && <Check size={11} />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 800 }}>
                        Ukuran Cetak: {((calcW / calcDpi) * 2.54).toFixed(1)} cm × {((calcH / calcDpi) * 2.54).toFixed(1)} cm • Est. File: {((calcW * calcH * 4) / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} color="var(--cms-text-muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
                      <input
                        type="text"
                        value={canvasSearchQuery}
                        onChange={e => setCanvasSearchQuery(e.target.value)}
                        placeholder="Cari dari ratusan database resolusi (Instagram, Reels, A4, Banner, YouTube)..."
                        style={{
                          width: '100%', padding: '9px 12px 9px 36px', borderRadius: 12,
                          background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)', fontSize: 12, outline: 'none', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Grid of Presets with Action to Whiteboard and Delete with bottom padding */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))', gap: 12, paddingBottom: 140, width: '100%', minWidth: 0 }}>
                    {filteredCanvasPresets.map(p => (
                      <div
                        key={p.id}
                        style={{
                          padding: '14px 16px', borderRadius: 16, background: 'var(--cms-card-bg)',
                          border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                              Ratio {p.ratio} {p.dpi ? `• ${p.dpi} DPI` : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', fontWeight: 850, flexShrink: 0 }}>
                            {p.badge}
                          </span>
                        </div>

                        <div style={{ fontSize: 14, fontWeight: 950, color: 'var(--cms-text)' }}>
                          {p.width} × {p.height} {p.unit}
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 'auto', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleCopyDimension(p)}
                            style={{ flex: 1, minWidth: 80, padding: '6px 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            {copiedDim === p.id ? 'Tersalin' : 'Salin Dimensi'}
                          </button>
                          <button
                            onClick={() => { onSwitchPage('whiteboard'); closeFullscreenStudio(); }}
                            style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--cms-accent)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                          >
                            <Shapes size={12} /> <span>Buka Kanvas</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteCanvasPreset(p.id, e)}
                            title="Hapus preset ini"
                            style={{ padding: '6px 8px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── APP 4: FULLSCREEN RESOURCE VAULT ── */}
              {fullscreenApp === 'resources' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', minWidth: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 12, width: '100%', minWidth: 0 }}>
                    {EXTENDED_DESIGN_RESOURCES.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'none', padding: '16px', borderRadius: 18,
                          background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)',
                          display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.15s ease',
                          minWidth: 0, boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${r.color}18`, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <r.icon size={19} />
                          </div>
                          <ExternalLink size={14} color="var(--cms-text-muted)" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 2, lineHeight: 1.4 }}>{r.desc}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── APP 5: FULLSCREEN TRENDS & AI STUDIO ── */}
              {fullscreenApp === 'trends' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', minWidth: 0 }}>
                  <div style={{ background: 'var(--cms-card-bg)', borderRadius: 18, padding: isMobile ? '14px' : '20px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)' }}>AI Creative Challenge & Brief Generator (Gemini Engine)</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap', width: '100%' }}>
                      <input
                        type="text"
                        value={aiDesignPrompt}
                        onChange={e => setAiDesignPrompt(e.target.value)}
                        placeholder="Ketik topik tantangan kreatif (cth: Branding Kopi Masa Depan, Desain Web 3.0)..."
                        style={{ flex: 1, minWidth: isMobile ? '100%' : 200, padding: '10px 14px', borderRadius: 10, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={handleGenerateFreshDesignIdea}
                        disabled={aiDesignLoading}
                        style={{ padding: '10px 18px', width: isMobile ? '100%' : 'auto', borderRadius: 10, background: 'var(--cms-accent)', color: '#fff', border: 'none', fontWeight: 850, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}
                      >
                        {aiDesignLoading ? <Loader2 size={14} className="cms-spin" /> : <Sparkles size={14} />}
                        <span>Generate Brief Baru</span>
                      </button>
                    </div>

                    {aiDesignResult && (
                      <div style={{ background: 'var(--cms-input-bg)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)' }}>HASIL BRIEF KREATIF:</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={handleSaveDesignIdeaToNotes} style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <StickyNote size={12} /> <span>Simpan ke Catatan</span>
                            </button>
                            <button onClick={handleCopyDesignIdea} style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {aiDesignCopied ? <Check size={12} /> : <Copy size={12} />}
                              <span>{aiDesignCopied ? 'Tersalin' : 'Salin Ide'}</span>
                            </button>
                          </div>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.6, color: 'var(--cms-text)', wordBreak: 'break-word' }}>
                          {aiDesignResult}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardOverview;
