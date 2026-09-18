import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Upload, Link as LinkIcon, Image, Loader2, User, Camera, 
  Type, ExternalLink, Settings2, Copy, QrCode, Eye, Check, Download, 
  X, Sparkles, Smartphone, ChevronRight, Layers, Palette, Share2, 
  ShieldCheck, ArrowUp, ArrowDown, FolderPlus, Globe, Music, Flame,
  Edit3, CheckCircle2, RefreshCw, Send, MessageCircle, Search, 
  SlidersHorizontal, LayoutList, MoreVertical, Menu, Wand2, 
  SmartphoneNfc, CheckCheck, FileText, Wifi, PhoneCall, Mail,
  Sliders, Paintbrush, Compass, CreditCard, Tag, AlertTriangle, 
  Code, FileCode, CheckSquare, Square, ChevronDown, Award, Zap,
  Star, Grid, ChevronUp, ChevronLeft, Gift, Coffee, HelpCircle,
  Clock, ShoppingBag, Play, Heart, Folder, Info
} from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { storage } from '../../utils/storage';
import GlassColorPicker from './GlassColorPicker';
import MediaGalleryModal from './MediaGalleryModal';
import { RoundedDateTimePicker } from '../common/RoundedDateTimePicker';
import { 
  BioBlockType, 
  BioLinkItem, 
  formatBioCurrency, 
  getEmbedIframeSrc,
  getContrastTextColor 
} from '../../types/bioBlocks';

export type { BioLinkItem, BioBlockType };

export interface BioGroupItem {
  id: string;
  name: string;
  order: number;
}

export interface BioLinkPageData {
  id: string;
  slug: string;
  title: string;
  isDefault?: boolean;
  profile: {
    name: string;
    bio: string;
    avatarUrl: string;
    profileCoverUrl: string;
    whatsappNumber?: string;
    verifiedBadge?: boolean;
    
    themePreset?: string;
    innerBgType?: 'preset' | 'custom' | 'color';
    innerBgCustomUrl?: string;
    innerBgColor?: string;
    
    outerBgType?: 'preset' | 'custom' | 'color';
    outerBgPreset?: string;
    outerBgCustomUrl?: string;
    outerBgColor?: string;
    outerBgBlur?: number;
    
    cardStyle?: 'glass' | 'solid' | 'glow' | 'minimal';
  };
  groups: BioGroupItem[];
  links: BioLinkItem[];
}

// ── 24+ ARTISTIC CURATED WALLPAPER PRESETS ──
export const OUTER_BG_PRESETS = [
  { id: 'abstract-mesh', category: '3D & Mesh', label: 'Dark Nebula Mesh', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80' },
  { id: 'liquid-waves', category: '3D & Mesh', label: 'Liquid 3D Waves', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1920&q=80' },
  { id: 'hologram-fluid', category: '3D & Mesh', label: 'Hologram Fluid Prism', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80' },
  { id: 'emerald-aurora', category: 'Nature & Glow', label: 'Emerald Aurora', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80' },
  { id: 'velvet-sunset', category: 'Nature & Glow', label: 'Velvet Horizon', url: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1920&q=80' },
  { id: 'deep-galaxy', category: 'Nature & Glow', label: 'Deep Cosmos Nebula', url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=1920&q=80' },
  { id: 'cyber-city', category: 'Cyberpunk', label: 'Cyber Tokyo Lights', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80' },
  { id: 'neon-grid', category: 'Cyberpunk', label: 'Synthwave Matrix Grid', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80' },
  { id: 'dark-carbon', category: 'Minimal & Dark', label: 'Matte Obsidian Carbon', url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=1920&q=80' },
  { id: 'studio-minimal', category: 'Minimal & Dark', label: 'Studio Soft Monochrome', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80' },
  { id: 'clean-slate', category: 'Clean Light', label: 'Clean Light Slate', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80' },
  { id: 'pastel-aura', category: 'Clean Light', label: 'Soft Pastel Aura Cloud', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80' }
];

// ── 16+ CURATED PHONE THEME PRESETS ──
export const THEME_PRESETS = [
  { id: 'dark-glass', label: 'Dark Glassmorphism', bg: 'linear-gradient(155deg, #0d0d14 0%, #13131e 55%, #0a0a12 100%)', text: '#ffffff', border: 'rgba(255,255,255,0.1)' },
  { id: 'emerald-oasis', label: 'Emerald Oasis', bg: 'linear-gradient(155deg, #064e3b 0%, #022c22 100%)', text: '#ecfdf5', border: 'rgba(16,185,129,0.2)' },
  { id: 'velvet-purple', label: 'Velvet Purple', bg: 'linear-gradient(155deg, #2e1065 0%, #170736 100%)', text: '#f3e8ff', border: 'rgba(168,85,247,0.25)' },
  { id: 'cyberpunk-neon', label: 'Cyberpunk Neon', bg: 'linear-gradient(155deg, #050505 0%, #11052C 100%)', text: '#38bdf8', border: 'rgba(56,189,248,0.3)' },
  { id: 'sunset-glow', label: 'Sunset Crimson', bg: 'linear-gradient(155deg, #450a0a 0%, #1c0505 100%)', text: '#ffedd5', border: 'rgba(249,115,22,0.25)' },
  { id: 'pure-light', label: 'Pure Elegance Light', bg: '#f8fafc', text: '#0f172a', border: 'rgba(0,0,0,0.08)' },
  { id: 'tokyo-night', label: 'Tokyo Night Violet', bg: 'linear-gradient(155deg, #0f172a 0%, #1e1b4b 100%)', text: '#e0e7ff', border: 'rgba(99,102,241,0.25)' },
  { id: 'solar-gold', label: 'Solar Luxury Gold', bg: 'linear-gradient(155deg, #1c1917 0%, #292524 50%, #451a03 100%)', text: '#fef3c7', border: 'rgba(245,158,11,0.3)' },
  { id: 'deep-ocean', label: 'Deep Oceanic Abyss', bg: 'linear-gradient(155deg, #082f49 0%, #0c192c 100%)', text: '#e0f2fe', border: 'rgba(14,165,233,0.25)' },
  { id: 'acid-tech', label: 'Acid Lime Tech', bg: 'linear-gradient(155deg, #022c22 0%, #064e3b 50%, #000000 100%)', text: '#bef264', border: 'rgba(163,230,53,0.3)' },
  { id: 'carbon-stealth', label: 'Carbon Stealth Matte', bg: '#111115', text: '#f4f4f5', border: 'rgba(255,255,255,0.08)' },
  { id: 'rose-minimal', label: 'Rose Gold Minimalist', bg: 'linear-gradient(155deg, #2a0815 0%, #14030a 100%)', text: '#fce7f3', border: 'rgba(244,114,182,0.25)' }
];

// ── 36+ CURATED BUTTON TEMPLATES (NEON GLOW, ANIMATED, GRADIENT, GLASS) ──
export const BUTTON_DESIGN_TEMPLATES = [
  // ── NEON & LASER GLOW TEMPLATES ──
  { id: 'tpl-cyan-neon', label: 'Cyan Cyber Glow', type: 'neon', color: '#06b6d4', textColor: '#38bdf8', animation: 'glow' },
  { id: 'tpl-violet-neon', label: 'Electric Purple Glow', type: 'neon', color: '#a855f7', textColor: '#e9d5ff', animation: 'glow' },
  { id: 'tpl-magenta-neon', label: 'Neon Pink Laser', type: 'neon', color: '#ec4899', textColor: '#fbcfe8', animation: 'border-glow' },
  { id: 'tpl-acid-neon', label: 'Toxic Lime Glow', type: 'neon', color: '#84cc16', textColor: '#ecfccb', animation: 'glow' },
  { id: 'tpl-crimson-neon', label: 'Crimson Blood Neon', type: 'neon', color: '#ef4444', textColor: '#fee2e2', animation: 'glow' },
  { id: 'tpl-solar-neon', label: 'Solar Amber Glow', type: 'neon', color: '#f59e0b', textColor: '#fef3c7', animation: 'glow' },
  { id: 'tpl-emerald-neon', label: 'Emerald Laser Glow', type: 'neon', color: '#10b981', textColor: '#d1fae5', animation: 'border-glow' },
  { id: 'tpl-arctic-neon', label: 'Ice Blue Neon', type: 'neon', color: '#0284c7', textColor: '#bae6fd', animation: 'glow' },

  // ── ANIMATED SPECIAL EFFECTS ──
  { id: 'tpl-anim-shimmer', label: 'Shimmering Silver Glass', type: 'glass', textColor: '#ffffff', animation: 'shimmer' },
  { id: 'tpl-anim-pulse', label: 'Pulsing Cosmic Indigo', type: 'gradient', gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)', textColor: '#ffffff', animation: 'pulse' },
  { id: 'tpl-anim-gradflow', label: 'Rainbow Gradient Flow', type: 'gradient', gradient: 'linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4)', textColor: '#ffffff', animation: 'gradient-shift' },
  { id: 'tpl-anim-heartbeat', label: 'Heartbeat Scarlet Flame', type: 'gradient', gradient: 'linear-gradient(135deg, #dc2626, #f97316)', textColor: '#ffffff', animation: 'heartbeat' },
  { id: 'tpl-anim-float', label: 'Floating Levitasi Teal', type: 'gradient', gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)', textColor: '#ffffff', animation: 'float' },
  { id: 'tpl-anim-bounce', label: 'Bouncing Rhythm Gold', type: 'gradient', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)', textColor: '#ffffff', animation: 'bounce' },

  // ── PREMIUM GRADIENTS ──
  { id: 'tpl-royal-purple', label: 'Royal Purple', type: 'gradient', gradient: 'linear-gradient(135deg, #7c3aed, #9333ea)', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-emerald-mint', label: 'Emerald Mint', type: 'gradient', gradient: 'linear-gradient(135deg, #059669, #10b981)', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-sunset-crimson', label: 'Sunset Crimson', type: 'gradient', gradient: 'linear-gradient(135deg, #ea580c, #f43f5e)', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-cyber-blue', label: 'Cyber Blue', type: 'gradient', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-golden-amber', label: 'Golden Amber', type: 'gradient', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-midnight-metal', label: 'Midnight Metal', type: 'gradient', gradient: 'linear-gradient(135deg, #1e293b, #334155)', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-magenta-fire', label: 'Magenta Fire', type: 'gradient', gradient: 'linear-gradient(135deg, #d946ef, #8b5cf6)', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-cherry-blossom', label: 'Cherry Blossom', type: 'gradient', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-deep-space', label: 'Deep Cosmic Indigo', type: 'gradient', gradient: 'linear-gradient(135deg, #312e81, #4f46e5)', textColor: '#ffffff', animation: 'none' },

  // ── GLASS & MINIMAL SOLIDS ──
  { id: 'tpl-frosted-glass', label: 'Frosted Glass UI', type: 'glass', textColor: '#ffffff', animation: 'none' },
  { id: 'tpl-matte-black', label: 'Matte Onyx Dark', type: 'solid', color: '#18181b', textColor: '#f4f4f5', animation: 'none' },
  { id: 'tpl-pure-white', label: 'Elegance Crisp White', type: 'solid', color: '#ffffff', textColor: '#0f172a', animation: 'none' }
];

// ── 20+ ARTISTIC QR CODE COLOR PALETTES ──
export const QR_PALETTES = [
  { label: 'Putih Bersih', fg: '#000000', bg: '#ffffff' },
  { label: 'Dark Onyx', fg: '#ffffff', bg: '#12121a' },
  { label: 'Cyber Blue', fg: '#38bdf8', bg: '#030712' },
  { label: 'Emerald Green', fg: '#10b981', bg: '#022c22' },
  { label: 'Velvet Violet', fg: '#c084fc', bg: '#1e1136' },
  { label: 'Sunset Amber', fg: '#f97316', bg: '#1c0a00' },
  { label: 'Brand Indigo', fg: '#ffffff', bg: '#4f46e5' },
  { label: 'Acid Lime', fg: '#bef264', bg: '#052e16' },
  { label: 'Crimson Blade', fg: '#f87171', bg: '#2b0606' },
  { label: 'Luxury Gold', fg: '#fbbf24', bg: '#1c1503' },
  { label: 'Rose Quartz', fg: '#f472b6', bg: '#240615' },
  { label: 'Arctic Teal', fg: '#2dd4bf', bg: '#042220' },
];

const DEFAULT_MAIN_PAGE: BioLinkPageData = {
  id: 'page_main',
  slug: 'main',
  title: 'Halaman Utama',
  isDefault: true,
  profile: {
    name: 'Profil Saya',
    bio: 'Selamat datang di kumpulan tautan dan portofolio resmi saya.',
    avatarUrl: '',
    profileCoverUrl: '',
    whatsappNumber: '',
    verifiedBadge: true,
    themePreset: 'dark-glass',
    innerBgType: 'preset',
    outerBgType: 'preset',
    outerBgPreset: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    cardStyle: 'glass'
  },
  groups: [
    { id: 'grp-1', name: 'Tautan Utama', order: 0 },
    { id: 'grp-2', name: 'Media Sosial & Kontak', order: 1 }
  ],
  links: [
    {
      id: 'lnk-1',
      title: 'Website Utama & Portofolio',
      subtitle: 'Kunjungi showcase karya terbaik kami',
      url: 'https://sumrday.web.app',
      category: 'Tautan Utama',
      btnShape: 'rounded',
      btnBgType: 'gradient',
      btnBgGradient: 'linear-gradient(135deg, #7c3aed, #9333ea)',
      animation: 'glow',
      isFeatured: true,
      order: 0
    },
    {
      id: 'lnk-2',
      title: 'Katalog Produk & Layanan',
      subtitle: 'Cek daftar produk digital dan servis',
      url: '/katalog',
      category: 'Tautan Utama',
      btnShape: 'rounded',
      btnBgType: 'glass',
      animation: 'none',
      order: 1
    }
  ]
};

// ── CUSTOM TOGGLE SWITCH COMPONENT ──
const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({ checked, onChange, label }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div 
        onClick={() => onChange(!checked)}
        style={{
          width: 46, height: 26, borderRadius: 100,
          background: checked ? 'var(--cms-accent, #7c3aed)' : 'rgba(255,255,255,0.12)',
          border: '1px solid var(--glass-border)',
          position: 'relative', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer', flexShrink: 0
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#ffffff',
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        }} />
      </div>
      {label && <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>{label}</span>}
    </label>
  );
};

// ── CUSTOM ROUNDED PILL DROPDOWN COMPONENT (FIXED Z-INDEX & NO CLIPPING) ──
const PillDropdown: React.FC<{
  value: string | number;
  onChange: (val: any) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  style?: React.CSSProperties;
}> = ({ value, onChange, options, placeholder = 'Pilih...', style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 9999 : 'auto', ...style }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: 42,
          borderRadius: 100,
          background: 'var(--cms-card-bg, #ffffff)',
          border: `1.5px solid ${isOpen ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-border, #cbd5e1)'}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--cms-text, #0f172a)',
          fontSize: 12.5,
          fontWeight: 850,
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          zIndex: 999999,
          background: 'var(--cms-card-bg, #1a1a26)',
          border: '1.5px solid var(--cms-accent, #7c3aed)',
          borderRadius: 22,
          padding: 6,
          boxShadow: '0 20px 55px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 230,
          overflowY: 'auto',
          animation: 'cmsFadeIn 0.15s ease'
        }}>
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: 100,
                  background: isSelected ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--cms-text)',
                  fontSize: 12,
                  fontWeight: isSelected ? 850 : 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} strokeWidth={2.5} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const LinksStudio: React.FC<{ notify?: (msg: string, type?: string) => void }> = ({ notify }) => {

  // ── STUDIO MASTER MODE: 'links' OR 'qr' ──
  const [studioMode, setStudioMode] = useState<'links' | 'qr'>('links');

  // ── LINKS MODE STATES ──
  const [pages, setPages] = useState<BioLinkPageData[]>([DEFAULT_MAIN_PAGE]);
  const [activePageId, setActivePageId] = useState<string>('page_main');
  const [activeTab, setActiveTab] = useState<'links' | 'groups' | 'profile' | 'backgrounds' | 'analytics'>('links');
  const [qrActiveTab, setQrActiveTab] = useState<'content' | 'design' | 'frame' | 'export'>('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkClicks, setLinkClicks] = useState<Record<string, number>>({});
  const [expandedLinks, setExpandedLinks] = useState<Record<string, boolean>>({});
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPagesDrawerOpen, setIsPagesDrawerOpen] = useState(false);
  const [mobileViewTab, setMobileViewTab] = useState<'editor' | 'preview'>('editor');
  const [isQrDownloadDropdownOpen, setIsQrDownloadDropdownOpen] = useState(false);
  // On desktop (>1200px) both panels open by default; on tablet/mobile start HIDDEN
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 1200 : false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 1200 : false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryCallback, setGalleryCallback] = useState<((url: string) => void) | null>(null);

  // Tablet mutual exclusion handlers: opening one auto-closes the other
  const handleToggleLeftSidebar = () => {
    setIsLeftSidebarOpen(prev => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth <= 1200) {
        setIsPreviewOpen(false);
      }
      return next;
    });
  };

  const handleTogglePreview = () => {
    setIsPreviewOpen(prev => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth <= 1200) {
        setIsLeftSidebarOpen(false);
      }
      return next;
    });
  };
  // Detect tablet (768-1200)
  const isTablet = typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth <= 1200) : false;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('cms_links_state_changed', { detail: { studioMode, mobileViewTab } }));
  }, [studioMode, mobileViewTab]);

  useEffect(() => {
    const handleSetMode = (e: any) => {
      if (e?.detail?.mode) setStudioMode(e.detail.mode);
    };
    const handleSetView = (e: any) => {
      if (e?.detail?.view) setMobileViewTab(e.detail.view);
    };
    window.addEventListener('cms_links_set_mode', handleSetMode);
    window.addEventListener('cms_links_set_view', handleSetView);
    return () => {
      window.removeEventListener('cms_links_set_mode', handleSetMode);
      window.removeEventListener('cms_links_set_view', handleSetView);
    };
  }, []);

  // ── NEW CATEGORY / GROUP FORM STATE ──
  const [newGroupName, setNewGroupName] = useState('');

  // ── MULTI-SELECT / TANDAI HAPUS STATE ──
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<Record<string, boolean>>({});

  // ── CUSTOM MODAL CONFIRMATION DIALOG STATE ──
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Hapus Sekarang',
    onConfirm: () => {}
  });

  // ── QR STUDIO MODE STATES ──
  const [qrSourceMode, setQrSourceMode] = useState<'custom' | 'page'>('custom');
  const [qrPresetType, setQrPresetType] = useState<'url' | 'wa' | 'wifi' | 'vcard' | 'email' | 'text'>('url');
  const [qrCustomUrl, setQrCustomUrl] = useState('https://sumrday.web.app');
  const [qrCustomText, setQrCustomText] = useState('');
  const [qrWaNumber, setQrWaNumber] = useState('6281234567890');
  const [qrWaMessage, setQrWaMessage] = useState('Halo, saya tertarik dengan portofolio & layanan Anda.');
  const [qrWifiSsid, setQrWifiSsid] = useState('Studio-WiFi');
  const [qrWifiPassword, setQrWifiPassword] = useState('');
  const [qrWifiType, setQrWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [qrVcardName, setQrVcardName] = useState('Nama Lengkap');
  const [qrVcardPhone, setQrVcardPhone] = useState('6281234567890');
  const [qrVcardEmail, setQrVcardEmail] = useState('kontak@domain.com');
  const [qrVcardCompany, setQrVcardCompany] = useState('Creative Studio');
  const [qrEmailTo, setQrEmailTo] = useState('kontak@domain.com');
  const [qrEmailSubject, setQrEmailSubject] = useState('Tanya Proyek');
  const [qrEmailBody, setQrEmailBody] = useState('Halo, saya ingin berdiskusi.');

  const [qrFgColor, setQrFgColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrIsTransparentBg, setQrIsTransparentBg] = useState(false);
  const [qrFrameStyle, setQrFrameStyle] = useState<'none' | 'badge' | 'card' | 'polaroid' | 'pill-badge' | 'ticket' | 'barcode' | 'gold-trim' | 'glass-float' | 'stamp'>('badge');
  const [qrFrameHeader, setQrFrameHeader] = useState('SCAN ME');
  const [qrFrameSubtext, setQrFrameSubtext] = useState('Pindai kamera untuk membuka');
  const [qrResolution, setQrResolution] = useState(1200);
  const [qrPreviewMockup, setQrPreviewMockup] = useState<'card' | 'phone' | 'sticker'>('card');
  const [qrCopied, setQrCopied] = useState(false);

  // Hidden file inputs
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const outerBgFileRef = useRef<HTMLInputElement>(null);
  const innerBgFileRef = useRef<HTMLInputElement>(null);
  const linkCoverFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const linkBgImageFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load Data
  useEffect(() => {
    const load = async () => {
      const storedPages = await storage.getItem('porto_bio_pages', null);
      if (storedPages && Array.isArray(storedPages) && storedPages.length > 0) {
        setPages(storedPages);
        setActivePageId(storedPages[0].id);
      } else {
        const singleData = await storage.getItem('porto_links', null);
        if (singleData && (singleData.links || singleData.profile)) {
          const migrated: BioLinkPageData = {
            id: 'page_main',
            slug: 'main',
            title: 'Halaman Utama',
            isDefault: true,
            profile: {
              ...DEFAULT_MAIN_PAGE.profile,
              ...(singleData.profile || {})
            },
            groups: singleData.groups || DEFAULT_MAIN_PAGE.groups,
            links: singleData.links || DEFAULT_MAIN_PAGE.links
          };
          setPages([migrated]);
          setActivePageId(migrated.id);
          await storage.setItem('porto_bio_pages', [migrated]);
        }
      }

      const clicks = await storage.getItem('porto_link_clicks', {});
      setLinkClicks(clicks || {});
    };

    load();
  }, []);

  const currentPage = useMemo(() => {
    return pages.find(p => p.id === activePageId) || pages[0] || DEFAULT_MAIN_PAGE;
  }, [pages, activePageId]);

  const savePages = async (updatedPages: BioLinkPageData[]) => {
    setPages(updatedPages);
    await storage.setItem('porto_bio_pages', updatedPages);
    
    const defaultPage = updatedPages.find(p => p.isDefault) || updatedPages[0];
    if (defaultPage) {
      await storage.setItem('porto_links', {
        profile: defaultPage.profile,
        groups: defaultPage.groups,
        links: defaultPage.links
      });
    }
    
    window.dispatchEvent(new Event('porto_saved'));
    if (notify) notify('Perubahan tersimpan');
  };

  const updateCurrentPage = (updater: (prev: BioLinkPageData) => BioLinkPageData) => {
    setPages(prev => {
      const updated = prev.map(p => p.id === activePageId ? updater(p) : p);
      storage.setItem('porto_bio_pages', updated);
      const defaultPage = updated.find(p => p.isDefault) || updated[0];
      if (defaultPage) {
        storage.setItem('porto_links', {
          profile: defaultPage.profile,
          groups: defaultPage.groups,
          links: defaultPage.links
        });
      }
      window.dispatchEvent(new Event('porto_saved'));
      return updated;
    });
  };

  // ── Page Management ──
  const handleAddNewPage = () => {
    const newSlug = `links-${pages.length + 1}`;
    const newPage: BioLinkPageData = {
      id: `page_${Date.now()}`,
      slug: newSlug,
      title: `Bio Link ${pages.length + 1}`,
      isDefault: false,
      profile: {
        ...DEFAULT_MAIN_PAGE.profile,
        name: `Profil ${pages.length + 1}`,
        bio: 'Halaman tautan bio kustom.'
      },
      groups: [{ id: 'grp-def', name: 'Tautan Utama', order: 0 }],
      links: [
        {
          id: `lnk-${Date.now()}`,
          title: 'Tautan Baru',
          subtitle: 'Kunjungi situs resmi',
          url: 'https://',
          category: 'Tautan Utama',
          btnShape: 'rounded',
          btnBgType: 'gradient',
          btnBgGradient: 'linear-gradient(135deg, #7c3aed, #9333ea)',
          animation: 'none',
          order: 0
        }
      ]
    };
    const updated = [...pages, newPage];
    savePages(updated);
    setActivePageId(newPage.id);
    setIsPagesDrawerOpen(false);
    if (notify) notify('Halaman Bio Link baru dibuat');
  };

  const handleDuplicatePage = (pageToDup: BioLinkPageData) => {
    const newPage: BioLinkPageData = {
      ...JSON.parse(JSON.stringify(pageToDup)),
      id: `page_${Date.now()}`,
      slug: `${pageToDup.slug}-copy`,
      title: `${pageToDup.title} (Salinan)`,
      isDefault: false
    };
    const updated = [...pages, newPage];
    savePages(updated);
    setActivePageId(newPage.id);
    if (notify) notify('Halaman berhasil digandakan');
  };

  const promptDeletePage = (pageId: string, pageTitle: string) => {
    if (pages.length <= 1) {
      if (notify) notify('Minimal harus memiliki satu halaman', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Halaman Bio Link?',
      description: `Halaman "${pageTitle}" beserta seluruh tautan di dalamnya akan dihapus secara permanen.`,
      confirmText: 'Ya, Hapus Halaman',
      onConfirm: () => {
        const updated = pages.filter(p => p.id !== pageId);
        setActivePageId(updated[0].id);
        savePages(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (notify) notify('Halaman berhasil dihapus');
      }
    });
  };

  const promptBulkDelete = () => {
    const idsToDelete = Object.keys(selectedPageIds).filter(id => selectedPageIds[id]);
    if (idsToDelete.length === 0) {
      if (notify) notify('Pilih halaman yang ingin dihapus terlebih dahulu', 'error');
      return;
    }
    if (idsToDelete.length >= pages.length) {
      if (notify) notify('Minimal sisakan satu halaman default', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `Hapus ${idsToDelete.length} Halaman Terpilih?`,
      description: `Seluruh halaman yang ditandai akan dihapus secara bersamaan.`,
      confirmText: `Hapus ${idsToDelete.length} Halaman`,
      onConfirm: () => {
        const updated = pages.filter(p => !idsToDelete.includes(p.id));
        setActivePageId(updated[0].id);
        savePages(updated);
        setSelectedPageIds({});
        setIsBulkDeleteMode(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (notify) notify(`${idsToDelete.length} halaman berhasil dihapus`);
      }
    });
  };

  const handleSetDefault = (pageId: string) => {
    const updated = pages.map(p => ({
      ...p,
      isDefault: p.id === pageId
    }));
    savePages(updated);
    if (notify) notify('Halaman dijadikan default (/links)');
  };

  // ── Groups & Category Management ──
  const handleAddGroup = () => {
    if (!newGroupName.trim()) {
      if (notify) notify('Masukkan nama grup kategori', 'error');
      return;
    }
    const newGroup: BioGroupItem = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      order: (currentPage.groups || []).length
    };
    updateCurrentPage(p => ({
      ...p,
      groups: [...(p.groups || []), newGroup]
    }));
    setNewGroupName('');
    if (notify) notify(`Kategori "${newGroup.name}" ditambahkan`);
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    updateCurrentPage(p => ({
      ...p,
      groups: (p.groups || []).filter(g => g.id !== groupId),
      links: (p.links || []).map(l => l.category === groupName ? { ...l, category: '' } : l)
    }));
    if (notify) notify('Kategori berhasil dihapus');
  };

  // ── Links Editing ──
  const handleAddLink = (blockType: BioBlockType = 'link') => {
    const defaultCat = currentPage.groups?.[0]?.name || '';
    let defaultTitle = 'Tautan Baru';
    let defaultSubtitle = 'Deskripsi singkat...';
    let defaultUrl = 'https://';

    if (blockType === 'lead-magnet') {
      defaultTitle = 'Download Template & Aset Gratis';
      defaultSubtitle = 'Masukkan nama & WhatsApp untuk unduh langsung';
      defaultUrl = 'https://drive.google.com';
    } else if (blockType === 'tip-jar') {
      defaultTitle = 'Traktir Kopi untuk Tim Kreatif';
      defaultSubtitle = 'Dukungan Anda membantu kami terus berkarya';
      defaultUrl = '';
    } else if (blockType === 'accordion') {
      defaultTitle = 'Berapa lama proses pengerjaan proyek?';
      defaultSubtitle = 'FAQ Seputar Layanan';
      defaultUrl = '';
    } else if (blockType === 'countdown') {
      defaultTitle = 'Flash Sale Diskon 30% Layanan Desain';
      defaultSubtitle = 'Promo terbatas untuk 5 klien pertama';
      defaultUrl = '/katalog';
    } else if (blockType === 'product-card') {
      defaultTitle = 'Design System & UI Kit 2026';
      defaultSubtitle = 'Komponen lengkap Figma & React siap pakai';
      defaultUrl = '/shop';
    } else if (blockType === 'embed') {
      defaultTitle = 'Showcase Video Reel';
      defaultSubtitle = 'Tonton video preview langsung di sini';
      defaultUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    }

    const newLink: BioLinkItem = {
      id: `lnk_${Date.now()}`,
      itemType: blockType,
      title: defaultTitle,
      subtitle: defaultSubtitle,
      url: defaultUrl,
      category: defaultCat,
      btnShape: 'rounded',
      btnBgType: 'gradient',
      btnBgGradient: 'linear-gradient(135deg, #7c3aed, #9333ea)',
      animation: 'none',
      order: (currentPage.links || []).length,
      ...(blockType === 'lead-magnet' ? {
        leadDownloadUrl: 'https://drive.google.com',
        leadButtonText: 'Klaim & Download File Gratis',
        leadBadge: 'GRATIS',
        leadSuccessMsg: 'Akses berhasil dibuka! Silakan unduh file Anda:'
      } : {}),
      ...(blockType === 'tip-jar' ? {
        tipAmounts: [10000, 25000, 50000, 100000],
        tipRecipientWa: currentPage.profile?.whatsappNumber || '',
        tipSaweriaUrl: '',
        tipQrisImageUrl: '',
        tipPreferredMethod: 'all'
      } : {}),
      ...(blockType === 'accordion' ? {
        accordionContent: 'Pengerjaan standar memakan waktu 5-7 hari kerja untuk branding, dan 10-14 hari kerja untuk website.'
      } : {}),
      ...(blockType === 'countdown' ? {
        countdownTargetDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
        countdownBadge: 'FLASH SALE',
        countdownImageUrl: ''
      } : {}),
      ...(blockType === 'product-card' ? {
        productPrice: 99000,
        productOriginalPrice: 199000,
        productBadge: 'BESTSELLER',
        productButtonText: 'Beli Sekarang'
      } : {}),
      ...(blockType === 'embed' ? {
        embedUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      } : {})
    };

    updateCurrentPage(p => ({
      ...p,
      links: [...(p.links || []), newLink]
    }));
    setExpandedLinks(prev => ({ ...prev, [newLink.id]: true }));
    if (notify) notify(`Blok "${blockType}" ditambahkan`);
  };

  const handleUpdateLink = (id: string, fieldOrUpdates: keyof BioLinkItem | Partial<BioLinkItem>, value?: any) => {
    updateCurrentPage(p => ({
      ...p,
      links: (p.links || []).map(lnk => {
        if (lnk.id !== id) return lnk;
        if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
          return { ...lnk, ...fieldOrUpdates };
        }
        return { ...lnk, [fieldOrUpdates]: value };
      })
    }));
  };

  const promptDeleteLink = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Tautan?',
      description: `Tautan "${title}" akan dihapus dari halaman ini.`,
      confirmText: 'Ya, Hapus Tautan',
      onConfirm: () => {
        const nextLinks = (currentPage.links || []).filter(lnk => lnk.id !== id);
        updateCurrentPage(p => ({ ...p, links: nextLinks }));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (notify) notify('Tautan berhasil dihapus');
      }
    });
  };

  const handleMoveLink = (id: string, direction: 'up' | 'down') => {
    const list = [...(currentPage.links || [])];
    const idx = list.findIndex(l => l.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    
    [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
    const reordered = list.map((l, i) => ({ ...l, order: i }));
    updateCurrentPage(p => ({ ...p, links: reordered }));
  };

  const handleApplyButtonTemplate = (linkId: string, tpl: any) => {
    updateCurrentPage(p => ({
      ...p,
      links: (p.links || []).map(lnk => {
        if (lnk.id !== linkId) return lnk;
        const col = tpl.color || (tpl.type === 'gradient' ? '#7c3aed' : '#ffffff');
        return {
          ...lnk,
          btnBgType: tpl.type,
          btnBgGradient: tpl.gradient || '',
          btnBgColor: tpl.color || '',
          blockBgColor: tpl.color || (tpl.type === 'glass' ? 'rgba(255,255,255,0.08)' : (tpl.type === 'neon' ? 'rgba(0,0,0,0.75)' : '')),
          blockAccentColor: col,
          btnTextColor: tpl.textColor || '#ffffff',
          blockTextColor: tpl.textColor || '#ffffff',
          blockBorderColor: tpl.type === 'neon' ? tpl.color : '',
          blockBtnColor: tpl.gradient || tpl.color || '',
          animation: tpl.animation || (tpl.type === 'neon' ? 'glow' : 'none')
        };
      })
    }));
    if (notify) notify(`Template "${tpl.label}" diterapkan ke blok`);
  };

  const handleUploadImage = async (file: File, onDone: (url: string) => void, key: string) => {
    setIsUploading(p => ({ ...p, [key]: true }));
    try {
      const res = await uploadToCloudinary(file);
      onDone(res.url);
      if (notify) notify('Upload gambar berhasil');
    } catch (err: any) {
      if (notify) notify('Upload gagal: ' + err.message, 'error');
    } finally {
      setIsUploading(p => ({ ...p, [key]: false }));
    }
  };

  // Public URL computed
  const publicPageUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (currentPage.isDefault || currentPage.slug === 'main') {
      return `${origin}/links`;
    }
    return `${origin}/links/${currentPage.slug}`;
  }, [currentPage]);

  // Filtered pages for sidebar
  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    return pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pages, searchQuery]);

  // Backgrounds for Live Preview
  const outerBgStyle = useMemo(() => {
    const p = currentPage.profile;
    if (p?.outerBgType === 'color' && p.outerBgColor) {
      return { backgroundColor: p.outerBgColor };
    }
    if (p?.outerBgType === 'custom' && p.outerBgCustomUrl) {
      return { backgroundImage: `url(${p.outerBgCustomUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    const presetUrl = p?.outerBgPreset || OUTER_BG_PRESETS[0].url;
    return { backgroundImage: `url(${presetUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }, [currentPage]);

  const innerBgStyle = useMemo(() => {
    const p = currentPage.profile;
    if (p?.innerBgType === 'color' && p.innerBgColor) {
      return p.innerBgColor;
    }
    if (p?.innerBgType === 'custom' && p.innerBgCustomUrl) {
      return `url(${p.innerBgCustomUrl}) center/cover no-repeat`;
    }
    const foundTheme = THEME_PRESETS.find(t => t.id === (p?.themePreset || 'dark-glass'));
    return foundTheme ? foundTheme.bg : THEME_PRESETS[0].bg;
  }, [currentPage]);

  // Grouped links for preview
  const groupedLinks = useMemo(() => {
    const links = currentPage.links || [];
    const groups = currentPage.groups || [];
    const groupNames = groups.map(g => g.name);
    
    const res: Record<string, BioLinkItem[]> = {};
    groupNames.forEach(name => { res[name] = []; });
    res['Lainnya'] = [];

    links.forEach(lnk => {
      const cat = lnk.category || 'Lainnya';
      if (!res[cat]) res[cat] = [];
      res[cat].push(lnk);
    });

    return res;
  }, [currentPage]);

  // ── QR CODE CONTENT COMPUTATION ──
  const qrDataContent = useMemo(() => {
    if (qrSourceMode === 'page') {
      return publicPageUrl;
    }
    switch (qrPresetType) {
      case 'url':
        return qrCustomUrl || 'https://sumrday.web.app';
      case 'wa': {
        const clean = qrWaNumber.replace(/[^0-9]/g, '');
        return `https://wa.me/${clean}?text=${encodeURIComponent(qrWaMessage)}`;
      }
      case 'wifi':
        return `WIFI:T:${qrWifiType};S:${qrWifiSsid};P:${qrWifiPassword};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${qrVcardName}\nFN:${qrVcardName}\nORG:${qrVcardCompany}\nTEL:${qrVcardPhone}\nEMAIL:${qrVcardEmail}\nEND:VCARD`;
      case 'email':
        return `mailto:${qrEmailTo}?subject=${encodeURIComponent(qrEmailSubject)}&body=${encodeURIComponent(qrEmailBody)}`;
      case 'text':
        return qrCustomText || 'Teks Desain Kustom';
      default:
        return 'https://sumrday.web.app';
    }
  }, [qrSourceMode, publicPageUrl, qrPresetType, qrCustomUrl, qrWaNumber, qrWaMessage, qrWifiType, qrWifiSsid, qrWifiPassword, qrVcardName, qrVcardCompany, qrVcardPhone, qrVcardEmail, qrEmailTo, qrEmailSubject, qrEmailBody, qrCustomText]);

  const cleanFg = qrFgColor.replace('#', '');
  const cleanBg = qrIsTransparentBg ? 'ffffff00' : qrBgColor.replace('#', '');
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrResolution}x${qrResolution}&data=${encodeURIComponent(qrDataContent)}&color=${cleanFg}&bgcolor=${cleanBg}&qzone=2&margin=0`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&format=svg&data=${encodeURIComponent(qrDataContent)}&color=${cleanFg}&bgcolor=${cleanBg}&qzone=2&margin=0`;
  const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrDataContent)}&color=${cleanFg}&bgcolor=${cleanBg}&qzone=2&margin=0`;

  // HTML Export Snippet
  const htmlExportCode = useMemo(() => {
    return `<!-- Antigravity Universal QR Code Widget -->
<div style="display:inline-flex;flex-direction:column;align-items:center;background:${qrIsTransparentBg ? 'transparent' : qrBgColor};padding:22px;border-radius:22px;box-shadow:0 12px 35px rgba(0,0,0,0.18);font-family:system-ui,-apple-system,sans-serif;text-align:center;">
  ${qrFrameStyle !== 'none' && qrFrameHeader ? `<div style="font-size:14px;font-weight:900;color:${qrFgColor};margin-bottom:12px;letter-spacing:0.06em;">${qrFrameHeader}</div>` : ''}
  <a href="${qrDataContent}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
    <img src="${qrApiUrl}" alt="QR Code" width="220" height="220" style="display:block;border-radius:12px;" />
  </a>
  ${qrFrameStyle !== 'none' && qrFrameSubtext ? `<div style="font-size:11px;font-weight:600;color:${qrFgColor};opacity:0.85;margin-top:10px;max-width:200px;">${qrFrameSubtext}</div>` : ''}
</div>`;
  }, [qrIsTransparentBg, qrBgColor, qrFrameStyle, qrFrameHeader, qrFgColor, qrDataContent, qrApiUrl, qrFrameSubtext]);

  const handleDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code - ${qrFrameHeader || 'Scan Me'}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0b0c14; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  ${htmlExportCode}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode-stand-alone.html';
    a.click();
    URL.revokeObjectURL(url);
    if (notify) notify('File HTML berhasil diunduh');
  };

  const handleCopyHtml = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(htmlExportCode);
      if (notify) notify('Kode HTML Embed disalin');
    }
  };

  return (
    <div className="links-studio-root" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      animation: 'cmsFadeIn 0.2s ease',
      width: '100%',
      height: '100%',
      minHeight: 'calc(100vh - 70px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* ── TOP ACTION HEADER BAR ── */}
      <div className="links-studio-top-bar" style={{
        padding: '8px 16px',
        height: 56,
        minHeight: 56,
        maxHeight: 56,
        boxSizing: 'border-box',
        background: 'var(--cms-card-bg)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexShrink: 0,
        zIndex: 20
      }}>
        {/* Left Section: Mobile Drawer Trigger / Desktop Title & Path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          {/* Mobile Drawer Trigger with current page title badge */}
          <button
            type="button"
            onClick={() => setIsPagesDrawerOpen(true)}
            className="cms-mobile-toggle-btn"
            style={{
              padding: '6px 12px',
              borderRadius: 100,
              border: '1.5px solid var(--cms-border, #cbd5e1)',
              background: 'var(--cms-card-bg, #ffffff)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              color: 'var(--cms-text)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 850,
              maxWidth: '100%'
            }}
            title="Ganti Halaman Bio Link"
          >
            <LayoutList size={15} color="var(--cms-accent)" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
              {studioMode === 'links' ? currentPage.title : (qrPresetType === 'url' ? 'URL Link' : qrPresetType === 'wa' ? 'WhatsApp' : qrPresetType === 'wifi' ? 'WiFi' : qrPresetType === 'vcard' ? 'vCard' : qrPresetType === 'email' ? 'Email' : 'QR Studio')}
            </span>
            <ChevronDown size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
          </button>

          {/* Desktop Title & Path Info */}
          <div className="cms-desktop-title-block" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 100, background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))', color: 'var(--cms-accent, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {studioMode === 'links' ? <LinkIcon size={17} strokeWidth={2.4} /> : <QrCode size={17} strokeWidth={2.4} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                  {studioMode === 'links' ? 'Bio Links Studio' : 'Universal QR Studio'}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)' }}>
                  {studioMode === 'links' ? currentPage.title : 'Bahan Desain'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 1 }}>
                {studioMode === 'links' ? (
                  <>Path: <code style={{ color: 'var(--cms-accent)', fontWeight: 800 }}>/links{currentPage.isDefault ? '' : `/${currentPage.slug}`}</code></>
                ) : (
                  <>Multi-Format Export: PNG, SVG, HTML Widget</>
                )}
              </div>
            </div>

            {/* QR / Link Mode Switcher - Desktop & Tablet only */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: 4,
              borderRadius: 100,
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--cms-border, #cbd5e1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              marginLeft: 8,
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setStudioMode('links')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 100, border: 'none',
                  background: studioMode === 'links' ? 'var(--cms-accent)' : 'transparent',
                  color: studioMode === 'links' ? '#ffffff' : 'var(--cms-text-muted)',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Mode Bio Link"
              >
                <LinkIcon size={13} />
                <span>Link</span>
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('qr')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 100, border: 'none',
                  background: studioMode === 'qr' ? 'var(--cms-accent)' : 'transparent',
                  color: studioMode === 'qr' ? '#ffffff' : 'var(--cms-text-muted)',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Mode QR Code"
              >
                <QrCode size={13} />
                <span>QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Mobile Quick Link Button */}
          <a
            href={publicPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cms-mobile-quick-open-btn"
            style={{
              width: 34,
              height: 34,
              borderRadius: 100,
              background: 'var(--cms-accent-soft)',
              color: 'var(--cms-accent)',
              border: '1.5px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            title="Buka Publik"
            aria-label="Buka Publik"
          >
            <ExternalLink size={14} />
          </a>

          {/* Desktop/Tablet Action Buttons */}
          <div className="cms-desktop-actions-strip" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {studioMode === 'links' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(publicPageUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                      if (notify) notify('URL Bio Link disalin');
                    }
                  }}
                  className="cms-btn cms-btn-secondary"
                  style={{ width: 34, height: 34, borderRadius: 100, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={copiedLink ? 'Tersalin' : 'Salin URL'}
                  aria-label="Salin URL"
                >
                  {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>

                <a
                  href={publicPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cms-btn cms-btn-primary"
                  style={{ width: 34, height: 34, borderRadius: 100, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                  title="Buka Publik"
                  aria-label="Buka Publik"
                >
                  <ExternalLink size={14} />
                </a>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <a
                  href={qrApiUrl}
                  download="qrcode-hd.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cms-btn cms-btn-primary"
                  style={{ height: 34, padding: '0 14px', borderRadius: 100, fontSize: 11.5, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                >
                  <Download size={13} /> PNG
                </a>
                <a
                  href={qrSvgUrl}
                  download="qrcode-vector.svg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cms-btn cms-btn-secondary"
                  style={{ height: 34, padding: '0 14px', borderRadius: 100, fontSize: 11.5, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                >
                  <FileCode size={13} /> SVG
                </a>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="cms-btn cms-btn-secondary"
                  style={{ height: 34, padding: '0 14px', borderRadius: 100, fontSize: 11.5, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Code size={13} /> HTML
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── 3-COLUMN STACKED FULL HEIGHT LAYOUT ── */}
      <div className="links-studio-grid" style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        flex: 1,
        height: 'calc(100% - 60px)',
        minHeight: 0,
        overflow: 'hidden'
      }}>

        {/* ── TABLET: Left Sidebar Arrow Toggle Button ── */}
        <button
          type="button"
          className="links-col-toggle-btn links-tablet-left-btn"
          onClick={handleToggleLeftSidebar}
          title={isLeftSidebarOpen ? 'Sembunyikan Daftar Halaman' : 'Tampilkan Daftar Halaman'}
          style={{
            position: 'absolute',
            top: '50%',
            left: isLeftSidebarOpen ? 270 : 0,
            transform: 'translateY(-50%)',
            zIndex: 90,
            width: 32,
            height: 64,
            borderRadius: '0 16px 16px 0',
            background: 'var(--cms-card-bg)',
            border: '1.5px solid var(--glass-border)',
            borderLeft: isLeftSidebarOpen ? 'none' : '1.5px solid var(--glass-border)',
            color: 'var(--cms-accent, #a855f7)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
            boxShadow: '6px 0 24px rgba(0,0,0,0.3)',
            transition: 'left 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {isLeftSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {/* ── TABLET: Right Preview Arrow Toggle Button ── */}
        <button
          type="button"
          className="links-col-toggle-btn links-tablet-right-btn"
          onClick={handleTogglePreview}
          title={isPreviewOpen ? 'Sembunyikan Pratinjau' : 'Tampilkan Pratinjau'}
          style={{
            position: 'absolute',
            top: '50%',
            right: isPreviewOpen ? 440 : 0,
            transform: 'translateY(-50%)',
            zIndex: 90,
            width: 32,
            height: 64,
            borderRadius: '16px 0 0 16px',
            background: 'var(--cms-card-bg)',
            border: '1.5px solid var(--glass-border)',
            borderRight: isPreviewOpen ? 'none' : '1.5px solid var(--glass-border)',
            color: 'var(--cms-accent, #a855f7)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
            boxShadow: '-6px 0 24px rgba(0,0,0,0.3)',
            transition: 'right 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {isPreviewOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* ── COLUMN 1: LEFT SIDEBAR WITH SCROLLING PAGES LIST ── */}
        <div className={`links-desktop-pages-sidebar ${isLeftSidebarOpen ? 'sidebar-open' : ''}`} style={{
          padding: '16px 14px',
          width: 270,
          minWidth: 270,
          maxWidth: 270,
          background: 'var(--cms-card-bg)',
          borderRight: '1px solid var(--glass-border)',
          display: isLeftSidebarOpen ? 'flex' : 'none',
          flexDirection: 'column',
          gap: 12,
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>

          {/* ── MODE A: BIO LINK PAGES LIST (SCROLLABLE) ── */}
          {studioMode === 'links' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px', flexShrink: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>Daftar Halaman ({pages.length})</span>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkDeleteMode(!isBulkDeleteMode);
                    setSelectedPageIds({});
                  }}
                  style={{
                    padding: '4px 10px', borderRadius: 100,
                    background: isBulkDeleteMode ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isBulkDeleteMode ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}`,
                    color: isBulkDeleteMode ? '#ef4444' : 'var(--cms-text-muted)',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  {isBulkDeleteMode ? 'Batal' : 'Hapus'}
                </button>
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Search size={13} style={{ position: 'absolute', left: 14, top: 11, color: 'var(--cms-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Cari halaman..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="links-clean-input"
                  style={{
                    width: '100%', height: 36, paddingLeft: 36, paddingRight: 12,
                    borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)',
                    background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, outline: 'none', boxSizing: 'border-box',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                />
              </div>

              {/* Pages Vertical List */}
              <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingRight: 2,
                scrollbarWidth: 'thin'
              }}>
                {filteredPages.map((p) => {
                  const isActive = p.id === currentPage.id;
                  const isChecked = !!selectedPageIds[p.id];

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isBulkDeleteMode) {
                          if (!p.isDefault) {
                            setSelectedPageIds(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                          }
                        } else {
                          setActivePageId(p.id);
                        }
                      }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 18,
                        cursor: 'pointer',
                        background: isActive ? 'var(--cms-accent-soft, rgba(124,58,237,0.12))' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${isActive ? 'var(--cms-accent, #7c3aed)' : 'var(--glass-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        transition: 'all 0.15s',
                        flexShrink: 0
                      }}
                    >
                      {isBulkDeleteMode && (
                        <div style={{ flexShrink: 0 }}>
                          {p.isDefault ? (
                            <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>-</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setSelectedPageIds(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                              onClick={e => e.stopPropagation()}
                              style={{ width: 16, height: 16, accentColor: '#ef4444', cursor: 'pointer' }}
                            />
                          )}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 850, color: isActive ? 'var(--cms-accent)' : 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title || p.slug}
                          </span>
                          {p.isDefault && (
                            <span style={{ fontSize: 8.5, fontWeight: 900, padding: '2px 6px', borderRadius: 100, background: 'var(--cms-accent)', color: '#fff' }}>
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                          /{p.slug} • {p.links?.length || 0} tautan
                        </span>
                      </div>

                      {!isBulkDeleteMode && pages.length > 1 && !p.isDefault && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeletePage(p.id, p.title || p.slug);
                          }}
                          title="Hapus Halaman"
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: 'none',
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bulk Delete Action Strip OR Add Page Button */}
              <div style={{ flexShrink: 0, paddingTop: 4 }}>
                {isBulkDeleteMode ? (
                  <button
                    type="button"
                    onClick={promptBulkDelete}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 100,
                      background: '#ef4444', color: '#fff',
                      border: 'none', fontSize: 12.5, fontWeight: 850,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 4px 14px rgba(239,68,68,0.3)'
                    }}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddNewPage}
                    style={{
                      width: '100%', padding: '11px', borderRadius: 100,
                      background: 'rgba(255,255,255,0.04)', border: '1.5px dashed var(--cms-accent)',
                      color: 'var(--cms-accent)', fontSize: 12.5, fontWeight: 850,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <Plus size={15} /> Tambah
                  </button>
                )}
              </div>
            </>
          ) : (
            /* ── MODE B: QR PRESET SELECTOR ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', minHeight: 0, overflowY: 'auto' }}>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>Sumber Data QR</div>
              
              <div style={{ display: 'flex', gap: 4, padding: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setQrSourceMode('custom')}
                  style={{
                    flex: 1, padding: '7px 0', border: 'none', borderRadius: 100,
                    background: qrSourceMode === 'custom' ? 'var(--cms-accent)' : 'transparent',
                    color: qrSourceMode === 'custom' ? '#fff' : 'var(--cms-text-muted)',
                    fontSize: 11.5, fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Desain
                </button>
                <button
                  type="button"
                  onClick={() => setQrSourceMode('page')}
                  style={{
                    flex: 1, padding: '7px 0', border: 'none', borderRadius: 100,
                    background: qrSourceMode === 'page' ? 'var(--cms-accent)' : 'transparent',
                    color: qrSourceMode === 'page' ? '#fff' : 'var(--cms-text-muted)',
                    fontSize: 11.5, fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Bio Link
                </button>
              </div>

              {qrSourceMode === 'custom' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {[
                    { id: 'url', label: 'URL', icon: Globe },
                    { id: 'wa', label: 'WhatsApp', icon: MessageCircle },
                    { id: 'wifi', label: 'WiFi', icon: Wifi },
                    { id: 'vcard', label: 'Kontak', icon: User },
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'text', label: 'Teks', icon: Type },
                  ].map(pst => (
                    <button
                      key={pst.id}
                      type="button"
                      onClick={() => setQrPresetType(pst.id as any)}
                      style={{
                        padding: '11px 16px', borderRadius: 100, border: 'none',
                        background: qrPresetType === pst.id ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg)',
                        color: qrPresetType === pst.id ? 'var(--cms-accent)' : 'var(--cms-text)',
                        border: `1.5px solid ${qrPresetType === pst.id ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                        fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left'
                      }}
                    >
                      <pst.icon size={16} />
                      <span>{pst.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="cms-label" style={{ fontSize: 11 }}>Pilih Halaman Bio</label>
                  {pages.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setActivePageId(p.id)}
                      style={{
                        padding: '11px 16px', borderRadius: 16, cursor: 'pointer',
                        background: p.id === currentPage.id ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg)',
                        border: `1.5px solid ${p.id === currentPage.id ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                        fontSize: 12.5, fontWeight: 800, color: p.id === currentPage.id ? 'var(--cms-accent)' : 'var(--cms-text)'
                      }}
                    >
                      {p.title} (/links{p.isDefault ? '' : `/${p.slug}`})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── COLUMN 2: ACTIVE EDITOR PANEL ── */}
        <div className={`links-editor-main-col ${mobileViewTab === 'preview' ? 'hide-on-mobile' : ''}`} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '20px 24px 140px 24px',
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          boxSizing: 'border-box',
          flex: 1,
          minWidth: 0
        }}>
          
          {studioMode === 'links' ? (
            <>
              {/* SUB-TABS DOCK */}
              <div style={{
                padding: 4,
                borderRadius: 100,
                background: 'var(--cms-card-bg)',
                border: '1.5px solid var(--glass-border)',
                display: 'flex',
                gap: 4,
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {[
                  { id: 'links', label: 'Tautan', icon: LinkIcon },
                  { id: 'groups', label: 'Grup', icon: Layers },
                  { id: 'profile', label: 'Profil', icon: User },
                  { id: 'backgrounds', label: 'Background', icon: Paintbrush },
                  { id: 'analytics', label: 'Analitik', icon: Eye },
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`links-subtab-btn ${isActive ? 'active' : ''}`}
                      title={tab.label}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 100,
                        border: 'none',
                        background: isActive ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--cms-text-muted)',
                        fontSize: 12.5,
                        fontWeight: 850,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        minWidth: 0
                      }}
                    >
                      <tab.icon size={18} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                      <span className="links-tab-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ── TAB 1: LINKS BUILDER ── */}
              {activeTab === 'links' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {/* Top Bar Status Pill */}
                  <div style={{ padding: '14px 20px', borderRadius: 100, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--cms-text)' }}>
                        {currentPage.title}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginLeft: 8 }}>
                        /links{currentPage.isDefault ? '' : `/${currentPage.slug}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {!currentPage.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(currentPage.id)}
                          style={{ padding: '6px 14px', borderRadius: 100, background: 'var(--cms-card-bg, #ffffff)', border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', cursor: 'pointer' }}
                        >
                          Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDuplicatePage(currentPage)}
                        style={{ padding: '6px 14px', borderRadius: 100, background: 'var(--cms-card-bg, #ffffff)', border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', cursor: 'pointer' }}
                      >
                        Duplikat
                      </button>
                      {pages.length > 1 && !currentPage.isDefault && (
                        <button
                          type="button"
                          onClick={() => promptDeletePage(currentPage.id, currentPage.title)}
                          style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: 11.5, fontWeight: 800, color: '#ef4444', cursor: 'pointer' }}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add Link Big Pill Button with Quick Block Types */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleAddLink('link')}
                      style={{
                        width: '100%', height: 46, borderRadius: 100,
                        background: 'var(--cms-accent, #7c3aed)', color: '#ffffff',
                        border: 'none', fontSize: 13.5, fontWeight: 900,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 6px 20px var(--cms-accent-soft)'
                      }}
                    >
                      <Plus size={18} strokeWidth={2.6} /> Tambah
                    </button>

                    {/* Quick Block Adder Chips - Centered & Justified across all screen sizes */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                      gap: 8,
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      {[
                        { type: 'lead-magnet' as BioBlockType, label: 'Freebie', icon: Gift, color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
                        { type: 'tip-jar' as BioBlockType, label: 'Kopi', icon: Coffee, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                        { type: 'accordion' as BioBlockType, label: 'FAQ', icon: HelpCircle, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                        { type: 'countdown' as BioBlockType, label: 'Promo', icon: Clock, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                        { type: 'product-card' as BioBlockType, label: 'Produk', icon: ShoppingBag, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                        { type: 'embed' as BioBlockType, label: 'Media', icon: Play, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
                      ].map(blk => (
                        <button
                          key={blk.type}
                          type="button"
                          onClick={() => handleAddLink(blk.type)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 100,
                            background: blk.bg,
                            border: `1px solid ${blk.color}44`,
                            color: blk.color,
                            fontSize: 11.5,
                            fontWeight: 850,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            width: '100%',
                            boxSizing: 'border-box',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <blk.icon size={13} /> {blk.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Links Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(currentPage.links || []).length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)', background: 'var(--cms-card-bg)', borderRadius: 28, border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <LinkIcon size={34} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Belum Ada Tautan</div>
                        <div style={{ fontSize: 12.5, marginTop: 4 }}>Klik tombol di atas untuk menambahkan tautan baru.</div>
                      </div>
                    ) : (
                      (currentPage.links || []).map((lnk, idx) => {
                        const isExpanded = !!expandedLinks[lnk.id];
                        const isTplExpanded = !!expandedTemplates[lnk.id];
                        const clickCount = linkClicks[lnk.id] || 0;

                        return (
                          <div
                            key={lnk.id}
                            className="links-item-card"
                            style={{
                              padding: 0,
                              borderRadius: 28,
                              background: 'var(--cms-card-bg, #ffffff)',
                              border: `1.5px solid ${lnk.isFeatured ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-border, #cbd5e1)'}`,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                              position: 'relative',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {/* Card Main Block */}
                            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                              
                              {/* Row 1 (Meta Header): Reorder Buttons + Category + Stats on Left | Highlight badge + Delete on Right */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  {/* Order Arrows in horizontal pill */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 100, padding: '2px 4px', border: '1px solid var(--glass-border)' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveLink(lnk.id, 'up')}
                                      disabled={idx === 0}
                                      style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                      title="Pindah ke Atas"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveLink(lnk.id, 'down')}
                                      disabled={idx === (currentPage.links.length - 1)}
                                      style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: idx === (currentPage.links.length - 1) ? 'default' : 'pointer', opacity: idx === (currentPage.links.length - 1) ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                      title="Pindah ke Bawah"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                  </div>

                                  {/* Block Type Badge */}
                                  <span style={{
                                    fontSize: 10.5, fontWeight: 850, padding: '3px 9px', borderRadius: 100,
                                    background: lnk.itemType === 'lead-magnet' ? 'rgba(236,72,153,0.18)' :
                                                lnk.itemType === 'tip-jar' ? 'rgba(245,158,11,0.18)' :
                                                lnk.itemType === 'accordion' ? 'rgba(59,130,246,0.18)' :
                                                lnk.itemType === 'countdown' ? 'rgba(239,68,68,0.18)' :
                                                lnk.itemType === 'product-card' ? 'rgba(16,185,129,0.18)' :
                                                lnk.itemType === 'embed' ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.06)',
                                    color: lnk.itemType === 'lead-magnet' ? '#f472b6' :
                                           lnk.itemType === 'tip-jar' ? '#fbbf24' :
                                           lnk.itemType === 'accordion' ? '#60a5fa' :
                                           lnk.itemType === 'countdown' ? '#f87171' :
                                           lnk.itemType === 'product-card' ? '#34d399' :
                                           lnk.itemType === 'embed' ? '#c084fc' : 'var(--cms-text-muted)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}>
                                    {lnk.itemType === 'lead-magnet' ? <><Gift size={11} /> Freebie Lead</> :
                                     lnk.itemType === 'tip-jar' ? <><Coffee size={11} /> Traktir Kopi</> :
                                     lnk.itemType === 'accordion' ? <><HelpCircle size={11} /> FAQ Accordion</> :
                                     lnk.itemType === 'countdown' ? <><Clock size={11} /> Countdown</> :
                                     lnk.itemType === 'product-card' ? <><ShoppingBag size={11} /> Mini Produk</> :
                                     lnk.itemType === 'embed' ? <><Play size={11} /> Media Embed</> : <><LinkIcon size={11} /> Tautan</>}
                                  </span>

                                  {/* Category Badge */}
                                  {lnk.category ? (
                                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: 'var(--cms-accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <Folder size={11} /> {lnk.category}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontStyle: 'italic', padding: '3px 6px' }}>
                                      Umum
                                    </span>
                                  )}

                                  {/* Click Count */}
                                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 100, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Eye size={11} /> {clickCount}
                                  </span>

                                  {lnk.isFeatured && (
                                    <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 100, background: 'var(--cms-accent)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      <Star size={10} style={{ fill: 'currentColor' }} /> HIGHLIGHT
                                    </span>
                                  )}
                                </div>

                                {/* Right Quick Delete Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    promptDeleteLink(lnk.id, lnk.title);
                                  }}
                                  style={{
                                    width: 28, height: 28, borderRadius: 8, border: 'none',
                                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    flexShrink: 0
                                  }}
                                  title="Hapus Tautan"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Row 2: Thumbnail Avatar on Left + Clean Inputs Stretched Full Width on Right */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                {/* Link Cover Thumbnail */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <div
                                    onClick={() => linkCoverFileRefs.current[lnk.id]?.click()}
                                    title="Upload Ikon / Gambar Sampul"
                                    style={{
                                      width: 52, height: 52, borderRadius: lnk.btnShape === 'pill' ? 100 : 16,
                                      background: 'var(--cms-card-bg, #ffffff)',
                                      border: '1.5px dashed var(--cms-accent, #7c3aed)',
                                      cursor: 'pointer', overflow: 'hidden',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                    }}
                                  >
                                    {lnk.coverImageUrl ? (
                                      <img src={lnk.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <Camera size={19} color="var(--cms-accent)" />
                                    )}
                                    <input
                                      ref={el => { linkCoverFileRefs.current[lnk.id] = el; }}
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadImage(file, url => handleUpdateLink(lnk.id, 'coverImageUrl', url), `cover_${lnk.id}`);
                                      }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGalleryCallback(() => (url: string) => handleUpdateLink(lnk.id, 'coverImageUrl', url));
                                      setIsGalleryModalOpen(true);
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', fontSize: 10, fontWeight: 750, cursor: 'pointer', padding: 0 }}
                                  >
                                    Galeri
                                  </button>
                                </div>

                                {/* Title & URL Full-width Inputs */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                                  {/* Title Input */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    height: 40,
                                    padding: '0 14px',
                                    borderRadius: 100,
                                    background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}>
                                    <Type size={14} color="var(--cms-accent, #7c3aed)" style={{ flexShrink: 0 }} />
                                    <input
                                      type="text"
                                      value={lnk.title}
                                      onChange={e => handleUpdateLink(lnk.id, 'title', e.target.value)}
                                      placeholder="Judul Tautan..."
                                      className="links-clean-input"
                                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}
                                    />
                                  </div>

                                  {/* URL Input */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    height: 38,
                                    padding: '0 14px',
                                    borderRadius: 100,
                                    background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}>
                                    <LinkIcon size={12} color="var(--cms-accent, #7c3aed)" style={{ flexShrink: 0 }} />
                                    <input
                                      type="text"
                                      value={lnk.url}
                                      onChange={e => handleUpdateLink(lnk.id, 'url', e.target.value)}
                                      placeholder="https://..."
                                      className="links-clean-input"
                                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: 'var(--cms-text)' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row 3: Full Width Expand Button / Toggle Bar */}
                              <button
                                type="button"
                                onClick={() => setExpandedLinks(p => ({ ...p, [lnk.id]: !p[lnk.id] }))}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  padding: '8px 14px',
                                  marginTop: 2,
                                  borderRadius: 100,
                                  background: isExpanded ? 'var(--cms-accent-soft)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${isExpanded ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                                  color: isExpanded ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Settings2 size={13} />
                                  <span>{isExpanded ? 'Tutup' : 'Desain'}</span>
                                </div>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>

                            </div>

                            {/* Expanded Details (Harmonious Matching Pill Form Controls & Theme Box) */}
                            {isExpanded && (
                              <div style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14, borderRadius: '0 0 28px 28px' }}>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                  {/* Block Type Selector */}
                                  <div>
                                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Tipe Blok</label>
                                    <PillDropdown
                                      value={lnk.itemType || 'link'}
                                      onChange={v => handleUpdateLink(lnk.id, 'itemType', v)}
                                      placeholder="Pilih Tipe Blok..."
                                      options={[
                                        { value: 'link', label: 'Tautan Standar' },
                                        { value: 'lead-magnet', label: 'Lead Magnet (Koleksi Kontak WA)' },
                                        { value: 'tip-jar', label: 'Traktir Kopi (Tip Jar / Saweria / QRIS)' },
                                        { value: 'accordion', label: 'FAQ Accordion (Tanya Jawab)' },
                                        { value: 'countdown', label: 'Countdown Timer (Promo Flash Sale)' },
                                        { value: 'product-card', label: 'Mini Produk (Katalog)' },
                                        { value: 'embed', label: 'Media Embed (YouTube / Spotify)' },
                                      ]}
                                    />
                                  </div>

                                  {/* ── CONDITIONAL SPECIALIZED CONFIG FOR BLOCKS ── */}
                                  {lnk.itemType === 'lead-magnet' && (
                                    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(236,72,153,0.08)', border: '1.5px solid rgba(236,72,153,0.25)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <div style={{ fontSize: 12, fontWeight: 900, color: '#f472b6', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Gift size={15} /> Pengaturan Lead Magnet / Freebie
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                                        <div>
                                          <label className="cms-label" style={{ fontSize: 10.5 }}>URL File Download (Google Drive / Direct Link)</label>
                                          <input
                                            type="text"
                                            value={lnk.leadDownloadUrl || ''}
                                            onChange={e => handleUpdateLink(lnk.id, 'leadDownloadUrl', e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                        <div>
                                          <label className="cms-label" style={{ fontSize: 10.5 }}>Teks Badge</label>
                                          <input
                                            type="text"
                                            value={lnk.leadBadge || 'GRATIS'}
                                            onChange={e => handleUpdateLink(lnk.id, 'leadBadge', e.target.value)}
                                            placeholder="GRATIS / 100% FREE"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                        <div>
                                          <label className="cms-label" style={{ fontSize: 10.5 }}>Teks Tombol Klaim</label>
                                          <input
                                            type="text"
                                            value={lnk.leadButtonText || 'Klaim & Download File Gratis'}
                                            onChange={e => handleUpdateLink(lnk.id, 'leadButtonText', e.target.value)}
                                            placeholder="Klaim & Download File Gratis"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                        <div>
                                          <label className="cms-label" style={{ fontSize: 10.5 }}>Pesan Sukses Download</label>
                                          <input
                                            type="text"
                                            value={lnk.leadSuccessMsg || ''}
                                            onChange={e => handleUpdateLink(lnk.id, 'leadSuccessMsg', e.target.value)}
                                            placeholder="Akses berhasil dibuka! Silakan unduh file Anda:"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                      </div>
                                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Sparkles size={12} color="var(--cms-accent)" /> Kontak nama & WhatsApp yang mengisi otomatis tersimpan ke database prospek (`porto_leads`) & sinkron dengan Broadcast Studio!
                                      </div>
                                    </div>
                                  )}

                                  {lnk.itemType === 'tip-jar' && (
                                    <div style={{ padding: 16, borderRadius: 18, background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                        <div style={{ fontSize: 12.5, fontWeight: 900, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <Coffee size={15} /> Pengaturan Traktir Kopi / Tip Jar
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: 100 }}>
                                          Saweria &bull; QRIS &bull; WhatsApp
                                        </span>
                                      </div>

                                      {/* Pilihan Metode Pembayaran yang Disediakan */}
                                      <div>
                                        <label className="cms-label" style={{ fontSize: 10.5, marginBottom: 4 }}>Opsi / Metode Apresiasi yang Ditampilkan</label>
                                        <PillDropdown
                                          value={lnk.tipPreferredMethod || 'all'}
                                          onChange={v => handleUpdateLink(lnk.id, 'tipPreferredMethod', v)}
                                          options={[
                                            { value: 'all', label: 'Semua Opsi (Tab QRIS, Saweria & WhatsApp)' },
                                            { value: 'qris', label: 'Hanya QRIS (Barcode Gambar / Auto)' },
                                            { value: 'saweria', label: 'Hanya Saweria / Trakteer (Tautan Langsung)' },
                                            { value: 'whatsapp', label: 'Hanya WhatsApp (Konfirmasi Manual)' }
                                          ]}
                                        />
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                                        {/* Link Saweria / Trakteer */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                          <label className="cms-label" style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <ExternalLink size={11} /> Link Saweria / Trakteer
                                          </label>
                                          <input
                                            type="url"
                                            value={lnk.tipSaweriaUrl || ''}
                                            onChange={e => handleUpdateLink(lnk.id, 'tipSaweriaUrl', e.target.value)}
                                            placeholder="https://saweria.co/username"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                          <div style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                                            Pengunjung dapat langsung memberi tip via Saweria atau Trakteer.
                                          </div>
                                        </div>

                                        {/* Nomor WhatsApp */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                          <label className="cms-label" style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MessageCircle size={11} /> Nomor WhatsApp Penerima
                                          </label>
                                          <input
                                            type="text"
                                            value={lnk.tipRecipientWa || ''}
                                            onChange={e => handleUpdateLink(lnk.id, 'tipRecipientWa', e.target.value)}
                                            placeholder="6281234567890 (kosong = sesuai profil)"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                          <div style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                                            Untuk konfirmasi bukti transfer atau chat dukungan.
                                          </div>
                                        </div>
                                      </div>

                                      {/* QRIS Barcode Setting */}
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 14, background: 'var(--cms-card-bg, #ffffff)', border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <label className="cms-label" style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                                          <QrCode size={12} /> Gambar Barcode QRIS (Kustom)
                                        </label>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                          <input
                                            type="text"
                                            value={lnk.tipQrisImageUrl || ''}
                                            onChange={e => handleUpdateLink(lnk.id, 'tipQrisImageUrl', e.target.value)}
                                            placeholder="https://... (URL gambar barcode QRIS Anda)"
                                            className="links-clean-input"
                                            style={{ flex: 1, height: 36, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setGalleryCallback(() => (url: string) => handleUpdateLink(lnk.id, 'tipQrisImageUrl', url));
                                              setIsGalleryModalOpen(true);
                                            }}
                                            className="cms-btn"
                                            style={{ height: 36, padding: '0 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}
                                          >
                                            <Image size={12} /> Galeri / Upload
                                          </button>
                                          {lnk.tipQrisImageUrl && (
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateLink(lnk.id, 'tipQrisImageUrl', '')}
                                              style={{ height: 36, width: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                              title="Hapus gambar QRIS kustom"
                                            >
                                              <X size={13} />
                                            </button>
                                          )}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <Sparkles size={11} color="#fbbf24" /> Jika dikosongkan, sistem otomatis membuat barcode QR code dinamis.
                                        </div>
                                      </div>

                                      {/* Pilihan Nominal Cepat */}
                                      <div>
                                        <label className="cms-label" style={{ fontSize: 10.5 }}>Pilihan Nominal Cepat (pisahkan dengan koma)</label>
                                        <input
                                          type="text"
                                          value={(lnk.tipAmounts || [10000, 25000, 50000, 100000]).join(', ')}
                                          onChange={e => {
                                            const arr = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                                            handleUpdateLink(lnk.id, 'tipAmounts', arr);
                                          }}
                                          placeholder="10000, 25000, 50000, 100000"
                                          className="links-clean-input"
                                          style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {lnk.itemType === 'accordion' && (
                                    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.25)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <div style={{ fontSize: 12, fontWeight: 900, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <HelpCircle size={15} /> Konten FAQ Accordion
                                      </div>
                                      <div>
                                        <label className="cms-label" style={{ fontSize: 10.5 }}>Isi Jawaban / Penjelasan (Muncul saat dropdown dibuka)</label>
                                        <textarea
                                          value={lnk.accordionContent || ''}
                                          onChange={e => handleUpdateLink(lnk.id, 'accordionContent', e.target.value)}
                                          rows={3}
                                          placeholder="Tuliskan jawaban atau penjelasan detail seputar layanan/prosedur di sini..."
                                          style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, outline: 'none', resize: 'vertical', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                   {lnk.itemType === 'countdown' && (
                                     <div style={{ padding: 16, borderRadius: 18, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                         <div style={{ fontSize: 12.5, fontWeight: 900, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                                           <Clock size={15} /> Pengaturan Flash Sale / Countdown Timer
                                         </div>
                                         <span style={{ fontSize: 10, fontWeight: 800, color: '#f87171', background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: 100 }}>
                                           Banner &bull; Kalender Rounded &bull; Live Timer
                                         </span>
                                       </div>

                                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                                         <div>
                                           <label className="cms-label" style={{ fontSize: 10.5, marginBottom: 4 }}>Batas Waktu Target Promo</label>
                                           <RoundedDateTimePicker
                                             value={lnk.countdownTargetDate || ''}
                                             onChange={val => handleUpdateLink(lnk.id, 'countdownTargetDate', val)}
                                             accentColor="#ef4444"
                                             placeholder="Pilih Batas Waktu Promo..."
                                           />
                                         </div>
                                         <div>
                                           <label className="cms-label" style={{ fontSize: 10.5, marginBottom: 4 }}>Teks Badge Promo</label>
                                           <input
                                             type="text"
                                             value={lnk.countdownBadge || 'FLASH SALE'}
                                             onChange={e => handleUpdateLink(lnk.id, 'countdownBadge', e.target.value)}
                                             placeholder="FLASH SALE / PROMO SPESIAL"
                                             className="links-clean-input"
                                             style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                           />
                                         </div>
                                       </div>

                                       {/* Gambar Banner / Preview Flash Sale */}
                                       <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 14, background: 'var(--cms-card-bg, #ffffff)', border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                         <label className="cms-label" style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                                           <Image size={12} /> Gambar Banner Promo / Flash Sale (Preview)
                                         </label>
                                         <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                           <input
                                             type="text"
                                             value={lnk.countdownImageUrl || ''}
                                             onChange={e => handleUpdateLink(lnk.id, 'countdownImageUrl', e.target.value)}
                                             placeholder="https://... (URL gambar promo atau pilih dari galeri)"
                                             className="links-clean-input"
                                             style={{ flex: 1, height: 36, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                           />
                                           <button
                                             type="button"
                                             onClick={() => {
                                               setGalleryCallback(() => (url: string) => handleUpdateLink(lnk.id, 'countdownImageUrl', url));
                                               setIsGalleryModalOpen(true);
                                             }}
                                             className="cms-btn"
                                             style={{ height: 36, padding: '0 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}
                                           >
                                             <Image size={12} /> Galeri / Upload
                                           </button>
                                           {lnk.countdownImageUrl && (
                                             <button
                                               type="button"
                                               onClick={() => handleUpdateLink(lnk.id, 'countdownImageUrl', '')}
                                               style={{ height: 36, width: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                               title="Hapus gambar banner"
                                             >
                                               <X size={13} />
                                             </button>
                                           )}
                                         </div>
                                         {lnk.countdownImageUrl ? (
                                           <div style={{ width: '100%', height: 90, borderRadius: 10, overflow: 'hidden', marginTop: 4, position: 'relative' }}>
                                             <img src={lnk.countdownImageUrl} alt="Preview Flash Sale" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                             <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
                                               Preview Banner Aktif
                                             </div>
                                           </div>
                                         ) : (
                                           <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                             <Sparkles size={11} color="#f87171" /> Tambahkan gambar banner visual menarik agar promo flash sale memikat pengunjung!
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                   )}

                                  {lnk.itemType === 'product-card' && (
                                    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.25)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <div style={{ fontSize: 12, fontWeight: 900, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <ShoppingBag size={15} /> Pengaturan Mini Produk
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                                        <div>
                                          <label className="cms-label" style={{ fontSize: 10.5 }}>Harga Produk (Rp)</label>
                                          <input
                                            type="number"
                                            value={lnk.productPrice ?? 99000}
                                            onChange={e => handleUpdateLink(lnk.id, 'productPrice', parseFloat(e.target.value) || 0)}
                                            placeholder="99000"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                        <div>
                                          <label className="cms-label" style={{ fontSize: 10.5 }}>Harga Coret / Normal (Rp)</label>
                                          <input
                                            type="number"
                                            value={lnk.productOriginalPrice ?? ''}
                                            onChange={e => handleUpdateLink(lnk.id, 'productOriginalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="199000 (opsional)"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                        <div>
                                          <label className="cms-label" style={{ fontSize: 10.5 }}>Badge Produk</label>
                                          <input
                                            type="text"
                                            value={lnk.productBadge || 'BESTSELLER'}
                                            onChange={e => handleUpdateLink(lnk.id, 'productBadge', e.target.value)}
                                            placeholder="BESTSELLER / LIMITED"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                        <div>
                                          <label className="cms-label" style={{ fontSize: 10.5 }}>Teks Tombol Beli</label>
                                          <input
                                            type="text"
                                            value={lnk.productButtonText || 'Beli Sekarang'}
                                            onChange={e => handleUpdateLink(lnk.id, 'productButtonText', e.target.value)}
                                            placeholder="Beli Sekarang"
                                            className="links-clean-input"
                                            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {lnk.itemType === 'embed' && (
                                    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(168,85,247,0.08)', border: '1.5px solid rgba(168,85,247,0.25)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <div style={{ fontSize: 12, fontWeight: 900, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Play size={15} /> Pengaturan Media Embed
                                      </div>
                                      <div>
                                        <label className="cms-label" style={{ fontSize: 10.5 }}>URL Video YouTube / Shorts atau Spotify</label>
                                        <input
                                          type="text"
                                          value={lnk.embedUrl || lnk.url || ''}
                                          onChange={e => {
                                            handleUpdateLink(lnk.id, 'embedUrl', e.target.value);
                                            handleUpdateLink(lnk.id, 'url', e.target.value);
                                          }}
                                          placeholder="https://www.youtube.com/watch?v=... atau open.spotify.com/track/..."
                                          className="links-clean-input"
                                          style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Sub-judul Keterangan</label>
                                    <div style={{
                                      display: 'flex', alignItems: 'center',
                                      height: 42, padding: '0 16px', borderRadius: 100,
                                      background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                    }}>
                                      <input
                                        type="text"
                                        value={lnk.subtitle || ''}
                                        onChange={e => handleUpdateLink(lnk.id, 'subtitle', e.target.value)}
                                        placeholder="Keterangan singkat..."
                                        className="links-clean-input"
                                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--cms-text)' }}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Kategori / Grup</label>
                                    <PillDropdown
                                      value={lnk.category || ''}
                                      onChange={v => handleUpdateLink(lnk.id, 'category', v)}
                                      placeholder="-- Tanpa Kategori --"
                                      options={[
                                        { value: '', label: '-- Tanpa Kategori --' },
                                        ...(currentPage.groups || []).map(g => ({ value: g.name, label: g.name }))
                                      ]}
                                    />
                                  </div>
                                </div>

                                 {/* ── UNIVERSAL BLOCK DESIGN & COLOR CUSTOMIZATION CONTAINER ── */}
                                  <div style={{
                                    padding: 18,
                                    borderRadius: 22,
                                    background: '#ffffff',
                                    border: '1.5px solid #cbd5e1',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16
                                  }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 900, color: '#0f172a' }}>
                                        <Palette size={16} color="var(--cms-accent)" />
                                        <span>Kustomisasi Desain & Warna Blok</span>
                                      </div>
                                      <span style={{
                                        fontSize: 10,
                                        fontWeight: 850,
                                        padding: '3px 10px',
                                        borderRadius: 100,
                                        background: 'rgba(var(--cms-accent-rgb, 124,58,237), 0.1)',
                                        color: 'var(--cms-accent)',
                                        border: '1.5px solid rgba(var(--cms-accent-rgb, 124,58,237), 0.25)',
                                        textTransform: 'uppercase'
                                      }}>
                                        {lnk.itemType === 'lead-magnet' ? 'Lead Magnet' : lnk.itemType === 'tip-jar' ? 'Traktir Kopi' : lnk.itemType === 'accordion' ? 'Accordion FAQ' : lnk.itemType === 'countdown' ? 'Countdown Promo' : lnk.itemType === 'product-card' ? 'Mini Produk' : lnk.itemType === 'embed' ? 'Media Embed' : 'Tautan Standar'}
                                      </span>
                                    </div>

                                    {/* 1-Click Quick Accent Swatches */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <label className="cms-label" style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Sparkles size={13} color="var(--cms-accent)" />
                                        <span>PILIHAN CEPAT WARNA AKSEN BLOK</span>
                                      </label>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                                        {[
                                          { hex: '#7c3aed', label: 'Violet Ungu' },
                                          { hex: '#ec4899', label: 'Pink Magenta' },
                                          { hex: '#f59e0b', label: 'Amber Gold' },
                                          { hex: '#10b981', label: 'Emerald Mint' },
                                          { hex: '#06b6d4', label: 'Cyan Sky' },
                                          { hex: '#ef4444', label: 'Crimson Red' },
                                          { hex: '#3b82f6', label: 'Royal Blue' },
                                          { hex: '#a855f7', label: 'Purple Neon' },
                                          { hex: '#ffffff', label: 'Putih Bersih' },
                                          { hex: '#0f172a', label: 'Dark Onyx' }
                                        ].map(item => {
                                          const isSelected = lnk.blockAccentColor === item.hex;
                                          return (
                                            <button
                                              key={item.hex}
                                              type="button"
                                              onClick={() => {
                                                const isSolid = lnk.btnBgType === 'solid';
                                                const isNeon = lnk.btnBgType === 'neon';
                                                handleUpdateLink(lnk.id, {
                                                  blockAccentColor: item.hex,
                                                  blockBtnColor: item.hex,
                                                  blockBorderColor: item.hex,
                                                  ...(isSolid ? { btnBgColor: item.hex, blockBgColor: item.hex } : {}),
                                                  ...(isNeon ? { blockBorderColor: item.hex, btnBgColor: item.hex } : {}),
                                                  blockTextColor: '',
                                                  btnTextColor: ''
                                                });
                                              }}
                                              title={item.label}
                                              style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                background: item.hex,
                                                border: isSelected ? '3px solid #ffffff' : '2px solid rgba(0,0,0,0.2)',
                                                boxShadow: isSelected ? `0 0 0 2.5px var(--cms-accent), 0 0 12px ${item.hex}` : '0 2px 6px rgba(0,0,0,0.15)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0
                                              }}
                                            >
                                              {isSelected && <Check size={13} color={item.hex === '#ffffff' ? '#000000' : '#ffffff'} strokeWidth={3.5} />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Quick Templates Accordion */}
                                    <div style={{
                                      padding: 14,
                                      borderRadius: 18,
                                      background: '#ffffff',
                                      border: '1.5px solid #cbd5e1',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 10
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a' }}>
                                          Template Tampilan Populer ({BUTTON_DESIGN_TEMPLATES.length})
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedTemplates(p => ({ ...p, [lnk.id]: !p[lnk.id] }))}
                                          style={{
                                            background: 'rgba(var(--cms-accent-rgb, 124,58,237), 0.08)',
                                            border: '1px solid rgba(var(--cms-accent-rgb, 124,58,237), 0.25)',
                                            borderRadius: 100,
                                            padding: '3px 10px',
                                            color: 'var(--cms-accent)',
                                            fontSize: 10.5,
                                            fontWeight: 850,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4
                                          }}
                                        >
                                          <span>{isTplExpanded ? 'Ciutkan' : 'Tampilkan Semua'}</span>
                                          {isTplExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {(isTplExpanded ? BUTTON_DESIGN_TEMPLATES : BUTTON_DESIGN_TEMPLATES.slice(0, 8)).map((tpl) => {
                                          const isNeon = tpl.type === 'neon';
                                          const neonCol = tpl.color || '#38bdf8';
                                          return (
                                            <button
                                              key={tpl.id}
                                              type="button"
                                              onClick={() => handleApplyButtonTemplate(lnk.id, tpl)}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '6px 12px',
                                                borderRadius: 100,
                                                background: isNeon ? 'rgba(0,0,0,0.85)' : '#ffffff',
                                                border: isNeon ? `2px solid ${neonCol}` : '1.5px solid #cbd5e1',
                                                color: isNeon ? neonCol : '#0f172a',
                                                fontSize: 11,
                                                fontWeight: 850,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                boxShadow: isNeon ? `0 0 10px ${neonCol}66` : '0 1px 4px rgba(0,0,0,0.04)'
                                              }}
                                            >
                                              <span style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: tpl.type === 'gradient' ? tpl.gradient : (tpl.color || '#7c3aed'),
                                                border: isNeon ? `1.5px solid ${neonCol}` : '1px solid rgba(0,0,0,0.2)',
                                                flexShrink: 0
                                              }} />
                                              <span>{tpl.label}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Block Shape, Background Type, & Animation */}
                                    <div className="cms-responsive-3col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                      <div>
                                        <label className="cms-label" style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', marginBottom: 5, display: 'block' }}>BENTUK SUDUT</label>
                                        <PillDropdown
                                          value={lnk.btnShape || 'rounded'}
                                          onChange={v => handleUpdateLink(lnk.id, 'btnShape', v)}
                                          options={[
                                            { value: 'pill', label: 'Pill Kapsul (100px)' },
                                            { value: 'rounded', label: 'Rounded Corner (18px)' },
                                            { value: 'square', label: 'Smooth Square (8px)' }
                                          ]}
                                        />
                                      </div>

                                      <div>
                                        <label className="cms-label" style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', marginBottom: 5, display: 'block' }}>TIPE BACKGROUND</label>
                                        <PillDropdown
                                          value={lnk.btnBgType || 'gradient'}
                                          onChange={v => {
                                            if (v === 'solid') {
                                              const col = lnk.blockBgColor || lnk.btnBgColor || lnk.blockAccentColor || '#ef4444';
                                              handleUpdateLink(lnk.id, {
                                                btnBgType: 'solid',
                                                blockBgColor: col,
                                                btnBgColor: col,
                                                blockTextColor: '',
                                                btnTextColor: ''
                                              });
                                            } else {
                                              handleUpdateLink(lnk.id, 'btnBgType', v);
                                            }
                                          }}
                                          options={[
                                            { value: 'gradient', label: 'Gradient Modern' },
                                            { value: 'solid', label: 'Warna Solid' },
                                            { value: 'glass', label: 'Glassmorphism Transparan' },
                                            { value: 'neon', label: 'Neon Glow Outline' },
                                            { value: 'image', label: 'Upload Gambar Latar' }
                                          ]}
                                        />
                                      </div>

                                      <div>
                                        <label className="cms-label" style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', marginBottom: 5, display: 'block' }}>ANIMASI GERAK</label>
                                        <PillDropdown
                                          value={lnk.animation || 'none'}
                                          onChange={v => handleUpdateLink(lnk.id, 'animation', v)}
                                          options={[
                                            { value: 'none', label: 'Tidak Ada' },
                                            { value: 'pulse', label: 'Pulse Breathing' },
                                            { value: 'glow', label: 'Neon Glow Cycle' },
                                            { value: 'shimmer', label: 'Shimmer Glare Light' },
                                            { value: 'bounce', label: 'Bouncing Rhythm' },
                                            { value: 'wobble', label: 'Wobble Tilt' },
                                            { value: 'float', label: 'Floating Levitasi' },
                                            { value: 'heartbeat', label: 'Heartbeat Detak' },
                                            { value: 'gradient-shift', label: 'Gradient Flow' },
                                            { value: 'border-glow', label: 'Laser Border Glow' }
                                          ]}
                                        />
                                      </div>
                                    </div>

                                    {/* ── 5 KUSTOMISASI WARNA DETAIL ELEMEN (TINGGI KONTRAS, ATOMIK, PERSISTEN) ── */}
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 14,
                                      padding: 18,
                                      borderRadius: 20,
                                      background: '#ffffff',
                                      border: '2px solid rgba(var(--cms-accent-rgb, 124,58,237), 0.3)',
                                      boxShadow: '0 4px 20px rgba(var(--cms-accent-rgb, 124,58,237), 0.08)'
                                    }}>
                                      {/* Header row with reset */}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                        <span style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.03em' }}>
                                          <Sliders size={14} color="var(--cms-accent)" />
                                          <span>PENGATURAN WARNA DETAIL ELEMEN BLOK</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateLink(lnk.id, {
                                              blockAccentColor: '',
                                              blockBgColor: '',
                                              blockTextColor: '',
                                              blockBorderColor: '',
                                              blockBtnColor: '',
                                              btnBgColor: '',
                                              btnTextColor: ''
                                            });
                                            if (notify) notify('Semua warna blok dikembalikan ke bawaan');
                                          }}
                                          style={{
                                            background: '#ffffff',
                                            border: '1.5px solid #cbd5e1',
                                            borderRadius: 100,
                                            padding: '4px 12px',
                                            fontSize: 10.5,
                                            fontWeight: 800,
                                            color: '#475569',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                          }}
                                        >
                                          <RefreshCw size={11} /> Reset ke Bawaan
                                        </button>
                                      </div>

                                      {/* 5 Color Pickers Grid */}
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                                        gap: 14
                                      }}>
                                        {/* 1. WARNA AKSEN UTAMA (BADGE & IKON) */}
                                        <GlassColorPicker
                                          label="WARNA AKSEN UTAMA (BADGE & IKON)"
                                          value={lnk.blockAccentColor || (lnk.itemType === 'lead-magnet' ? '#ec4899' : lnk.itemType === 'tip-jar' ? '#f59e0b' : lnk.itemType === 'accordion' ? '#3b82f6' : lnk.itemType === 'countdown' ? '#ef4444' : lnk.itemType === 'product-card' ? '#10b981' : lnk.itemType === 'embed' ? '#a855f7' : '#7c3aed')}
                                          onChange={val => {
                                            handleUpdateLink(lnk.id, 'blockAccentColor', val);
                                          }}
                                        />

                                        {/* 2. WARNA BACKGROUND BLOK */}
                                        <GlassColorPicker
                                          label="WARNA BACKGROUND BLOK"
                                          value={lnk.blockBgColor || lnk.btnBgColor || (lnk.btnBgType === 'solid' ? (lnk.blockAccentColor || '#ef4444') : (lnk.btnBgType === 'neon' ? '#0f172a' : '#ffffff'))}
                                          onChange={val => {
                                            handleUpdateLink(lnk.id, {
                                              blockBgColor: val,
                                              btnBgColor: val
                                            });
                                          }}
                                        />

                                        {/* 3. WARNA JUDUL & TEKS */}
                                        <GlassColorPicker
                                          label="WARNA JUDUL & TEKS"
                                          value={lnk.blockTextColor || (lnk.btnBgType === 'solid' ? getContrastTextColor(lnk.blockBgColor || lnk.btnBgColor || lnk.blockAccentColor || '#ef4444') : (lnk.btnBgType === 'neon' ? (lnk.blockAccentColor || '#38bdf8') : '#0f172a'))}
                                          onChange={val => {
                                            handleUpdateLink(lnk.id, 'blockTextColor', val);
                                          }}
                                        />

                                        {/* 4. WARNA GARIS TEPI (BORDER / GLOW) */}
                                        <GlassColorPicker
                                          label="WARNA GARIS TEPI (BORDER / GLOW)"
                                          value={lnk.blockBorderColor || lnk.blockAccentColor || (lnk.itemType === 'lead-magnet' ? '#ec4899' : lnk.itemType === 'tip-jar' ? '#f59e0b' : lnk.itemType === 'accordion' ? '#3b82f6' : lnk.itemType === 'countdown' ? '#ef4444' : lnk.itemType === 'product-card' ? '#10b981' : lnk.itemType === 'embed' ? '#a855f7' : '#7c3aed')}
                                          onChange={val => {
                                            handleUpdateLink(lnk.id, 'blockBorderColor', val);
                                          }}
                                        />

                                        {/* 5. WARNA TOMBOL AKSI (CTA) */}
                                        <GlassColorPicker
                                          label="WARNA TOMBOL AKSI (CTA)"
                                          value={lnk.blockBtnColor || lnk.blockAccentColor || (lnk.itemType === 'lead-magnet' ? '#ec4899' : lnk.itemType === 'tip-jar' ? '#f59e0b' : lnk.itemType === 'accordion' ? '#3b82f6' : lnk.itemType === 'countdown' ? '#ef4444' : lnk.itemType === 'product-card' ? '#10b981' : lnk.itemType === 'embed' ? '#a855f7' : '#7c3aed')}
                                          onChange={val => {
                                            handleUpdateLink(lnk.id, 'blockBtnColor', val);
                                          }}
                                        />
                                      </div>

                                      {/* Helpful Tip */}
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 9,
                                        padding: '9px 13px',
                                        borderRadius: 12,
                                        background: 'rgba(var(--cms-accent-rgb, 124,58,237), 0.08)',
                                        border: '1px solid rgba(var(--cms-accent-rgb, 124,58,237), 0.22)',
                                        fontSize: 11,
                                        color: '#0f172a',
                                        lineHeight: 1.4
                                      }}>
                                        <Sparkles size={13} color="var(--cms-accent, #7c3aed)" style={{ flexShrink: 0 }} />
                                        <span>
                                          <strong style={{ color: 'var(--cms-accent, #7c3aed)', fontWeight: 900 }}>Tips Cepat:</strong>{' '}
                                          Pilih salah satu dari 10 lingkaran warna di atas untuk keselarasan instan, lalu sesuaikan elemen tertentu di sini bila perlu.
                                        </span>
                                      </div>
                                    </div>

                                   {/* Image Upload if Image bg */}
                                   {lnk.btnBgType === 'image' && (
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'var(--cms-card-bg, #ffffff)', border: '1.5px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                       <button
                                         type="button"
                                         onClick={() => linkBgImageFileRefs.current[lnk.id]?.click()}
                                         className="cms-btn cms-btn-secondary"
                                         style={{ height: 38, borderRadius: 100, padding: '0 16px', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
                                       >
                                         <Upload size={14} /> Upload Gambar Latar
                                       </button>
                                       {lnk.btnBgImage && (
                                         <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>✓ Gambar Latar Terpasang</span>
                                       )}
                                       <input
                                         ref={el => { linkBgImageFileRefs.current[lnk.id] = el; }}
                                         type="file"
                                         accept="image/*"
                                         style={{ display: 'none' }}
                                         onChange={e => {
                                           const file = e.target.files?.[0];
                                           if (file) handleUploadImage(file, url => handleUpdateLink(lnk.id, 'btnBgImage', url), `bg_${lnk.id}`);
                                         }}
                                       />
                                     </div>
                                   )}

                                   {/* Featured Toggle */}
                                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--cms-card-bg, #ffffff)', borderRadius: 100, border: '1.5px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                     <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>Jadikan Highlight Banner Unggulan</span>
                                     <Switch 
                                       checked={!!lnk.isFeatured} 
                                       onChange={v => handleUpdateLink(lnk.id, 'isFeatured', v)} 
                                     />
                                   </div>
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

              {/* ── TAB 2: GROUPS & CATEGORIES MANAGEMENT ── */}
              {activeTab === 'groups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 22, borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Kategori & Pengelompokan Tautan</span>
                      <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                        Pisahkan tautan ke dalam section rapi di halaman publik.
                      </div>
                    </div>

                    {/* Add Group Form */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        height: 42, padding: '0 16px', borderRadius: 100,
                        background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}>
                        <input
                          type="text"
                          placeholder="Nama kategori baru..."
                          value={newGroupName}
                          onChange={e => setNewGroupName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); }}
                          className="links-clean-input"
                          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddGroup}
                        style={{
                          height: 42, padding: '0 20px', borderRadius: 100,
                          background: 'var(--cms-accent, #7c3aed)', color: '#fff',
                          border: 'none', fontSize: 12.5, fontWeight: 850,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
                        }}
                      >
                        <Plus size={15} /> Tambah
                      </button>
                    </div>

                    {/* Groups List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                      {(currentPage.groups || []).map((grp) => {
                        const linkCount = (currentPage.links || []).filter(l => l.category === grp.name).length;
                        return (
                          <div
                            key={grp.id}
                            style={{
                              padding: '12px 18px', borderRadius: 100,
                              background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Layers size={16} color="var(--cms-accent)" />
                              <span style={{ fontSize: 13.5, fontWeight: 850, color: 'var(--cms-text)' }}>{grp.name}</span>
                              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'var(--cms-card-bg)', color: 'var(--cms-text-muted)' }}>
                                {linkCount} Tautan
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(grp.id, grp.name)}
                              style={{
                                width: 28, height: 28, borderRadius: 8, border: 'none',
                                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0
                              }}
                              title="Hapus Kategori"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: PROFILE & BIO ── */}
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 22, borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Informasi Profil</span>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div
                        onClick={() => avatarFileRef.current?.click()}
                        style={{
                          width: 72, height: 72, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.06)',
                          border: '2.5px dashed var(--cms-accent)',
                          cursor: 'pointer', position: 'relative', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}
                      >
                        {currentPage.profile?.avatarUrl ? (
                          <img src={currentPage.profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Camera size={22} color="var(--cms-accent)" />
                        )}
                        {isUploading.avatar && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 className="animate-spin" color="#fff" size={16} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Foto Profil</span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => avatarFileRef.current?.click()}
                            className="cms-btn"
                            style={{ height: 30, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                          >
                            <Upload size={11} /> Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGalleryCallback(() => (url: string) => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, avatarUrl: url } })));
                              setIsGalleryModalOpen(true);
                            }}
                            className="cms-btn"
                            style={{ height: 30, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                          >
                            <Image size={11} /> Galeri
                          </button>
                        </div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            placeholder="Nama Tampilan..."
                            value={currentPage.profile?.name || ''}
                            onChange={e => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, name: e.target.value } }))}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontWeight: 850, fontSize: 13.5, color: 'var(--cms-text)' }}
                          />
                        </div>

                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            placeholder="Bio / Tagline singkat..."
                            value={currentPage.profile?.bio || ''}
                            onChange={e => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, bio: e.target.value } }))}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Nomor WhatsApp (Direct Chat)</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            placeholder="6281234567890"
                            value={currentPage.profile?.whatsappNumber || ''}
                            onChange={e => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, whatsappNumber: e.target.value } }))}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Kustom Slug URL</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            placeholder="slug-halaman"
                            value={currentPage.slug}
                            onChange={e => updateCurrentPage(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>

                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--cms-card-bg, #ffffff)', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Tampilkan Verified Badge Centang Biru</span>
                        <Switch 
                          checked={!!currentPage.profile?.verifiedBadge} 
                          onChange={v => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, verifiedBadge: v } }))} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: BACKGROUNDS (LUAR & DALAM - 40+ TEMPLATES) ── */}
              {activeTab === 'backgrounds' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* 1. OUTER BACKGROUND */}
                  <div style={{ padding: 22, borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Background Luar Desktop ({OUTER_BG_PRESETS.length} Pilihan)</span>
                        <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>Sampel wallpaper atau upload gambar latar luar ponsel.</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => outerBgFileRef.current?.click()}
                        disabled={isUploading.outerBg}
                        className="cms-btn cms-btn-secondary"
                        style={{ height: 36, padding: '0 16px', fontSize: 12, fontWeight: 800, borderRadius: 100, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {isUploading.outerBg ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        <span>Upload</span>
                      </button>
                      <input
                        ref={outerBgFileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(file, url => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, outerBgType: 'custom', outerBgCustomUrl: url } })), 'outerBg');
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                      {OUTER_BG_PRESETS.map((pst) => {
                        const isSelected = currentPage.profile?.outerBgPreset === pst.url && currentPage.profile?.outerBgType !== 'custom';
                        return (
                          <div
                            key={pst.id}
                            onClick={() => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, outerBgType: 'preset', outerBgPreset: pst.url } }))}
                            style={{
                              height: 80, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                              position: 'relative', border: `2.5px solid ${isSelected ? 'var(--cms-accent, #7c3aed)' : 'var(--glass-border)'}`,
                              boxShadow: isSelected ? '0 0 0 2px var(--cms-accent-soft)' : 'none'
                            }}
                          >
                            <img src={pst.url} alt={pst.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', display: 'flex', alignItems: 'flex-end', padding: 8 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {pst.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. INNER BACKGROUND */}
                  <div style={{ padding: 22, borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Background Layar Ponsel ({THEME_PRESETS.length} Tema)</span>
                        <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>Pilih tema warna, gradient, atau upload gambar layar.</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => innerBgFileRef.current?.click()}
                        disabled={isUploading.innerBg}
                        className="cms-btn cms-btn-secondary"
                        style={{ height: 36, padding: '0 16px', fontSize: 12, fontWeight: 800, borderRadius: 100, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {isUploading.innerBg ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        <span>Upload</span>
                      </button>
                      <input
                        ref={innerBgFileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(file, url => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, innerBgType: 'custom', innerBgCustomUrl: url } })), 'innerBg');
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                      {THEME_PRESETS.map(preset => {
                        const isSelected = (currentPage.profile?.themePreset || 'dark-glass') === preset.id && currentPage.profile?.innerBgType !== 'custom';
                        return (
                          <div
                            key={preset.id}
                            onClick={() => updateCurrentPage(p => ({ ...p, profile: { ...p.profile, innerBgType: 'preset', themePreset: preset.id } }))}
                            style={{
                              padding: 12, borderRadius: 16, cursor: 'pointer',
                              background: preset.bg, color: preset.text,
                              border: `2.5px solid ${isSelected ? 'var(--cms-accent, #7c3aed)' : preset.border}`,
                              boxShadow: isSelected ? '0 0 0 2px var(--cms-accent-soft)' : 'none',
                              display: 'flex', flexDirection: 'column', gap: 5
                            }}
                          >
                            <div style={{ fontSize: 11.5, fontWeight: 850 }}>{preset.label}</div>
                            <div style={{ height: 4, borderRadius: 100, background: isSelected ? 'var(--cms-accent)' : 'rgba(255,255,255,0.2)' }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* ── TAB 5: ANALYTICS ── */}
              {activeTab === 'analytics' && (
                <div style={{ padding: 22, borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                    Statistik Klik Tautan
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(currentPage.links || []).map((lnk) => {
                      const clicks = linkClicks[lnk.id] || 0;
                      return (
                        <div
                          key={lnk.id}
                          style={{
                            padding: '14px 20px', borderRadius: 100,
                            background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 850, color: 'var(--cms-text)' }}>{lnk.title}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>{lnk.url}</div>
                          </div>
                          <div style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--cms-accent)' }}>
                            {clicks} Klik
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── QR STUDIO CENTER WORKSPACE CONTROLS ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* QR Sub-tabs Dock matching Bio Link sub-tabs dock */}
              <div style={{
                display: 'flex',
                gap: 6,
                padding: '4px',
                background: 'var(--cms-card-bg, #ffffff)',
                borderRadius: 100,
                border: '1.5px solid var(--cms-border, #cbd5e1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                marginBottom: 16,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                flexShrink: 0
              }}>
                {[
                  { id: 'content', label: 'Konten', icon: QrCode },
                  { id: 'design', label: 'Warna', icon: Palette },
                  { id: 'frame', label: 'Bingkai', icon: Sliders },
                  { id: 'export', label: 'Ekspor', icon: Download },
                ].map(tab => {
                  const isActive = qrActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setQrActiveTab(tab.id as any)}
                      className={`links-subtab-btn ${isActive ? 'active' : ''}`}
                      title={tab.label}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 100,
                        border: 'none',
                        background: isActive ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--cms-text-muted)',
                        fontSize: 12.5,
                        fontWeight: 850,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        minWidth: 0
                      }}
                    >
                      <tab.icon size={18} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                      <span className="links-tab-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ── TAB 1: KONTEN QR ── */}
              {qrActiveTab === 'content' && (
                <div style={{ padding: 22, borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Detail Konten QR</span>

                  {qrPresetType === 'url' && (
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>URL / Tautan Website</label>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        height: 42, padding: '0 16px', borderRadius: 100,
                        background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}>
                        <input
                          type="url"
                          placeholder="https://domain-anda.com"
                          value={qrCustomUrl}
                          onChange={e => setQrCustomUrl(e.target.value)}
                          className="links-clean-input"
                          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                        />
                      </div>
                    </div>
                  )}

                  {qrPresetType === 'wa' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Nomor WhatsApp</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            placeholder="6281234567890"
                            value={qrWaNumber}
                            onChange={e => setQrWaNumber(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Pesan Pembuka Otomatis</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            placeholder="Halo, saya ingin bertanya..."
                            value={qrWaMessage}
                            onChange={e => setQrWaMessage(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {qrPresetType === 'wifi' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Nama WiFi (SSID)</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            placeholder="Studio_Guest"
                            value={qrWifiSsid}
                            onChange={e => setQrWifiSsid(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Password WiFi</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            placeholder="Password123"
                            value={qrWifiPassword}
                            onChange={e => setQrWifiPassword(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Keamanan</label>
                        <PillDropdown
                          value={qrWifiType}
                          onChange={v => setQrWifiType(v)}
                          options={[
                            { value: 'WPA', label: 'WPA/WPA2' },
                            { value: 'WEP', label: 'WEP' },
                            { value: 'nopass', label: 'Tanpa Sandi' }
                          ]}
                        />
                      </div>
                    </div>
                  )}

                  {qrPresetType === 'vcard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Nama Lengkap</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            value={qrVcardName}
                            onChange={e => setQrVcardName(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Perusahaan / Brand</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            value={qrVcardCompany}
                            onChange={e => setQrVcardCompany(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Telepon</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            value={qrVcardPhone}
                            onChange={e => setQrVcardPhone(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Email</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="email"
                            value={qrVcardEmail}
                            onChange={e => setQrVcardEmail(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {qrPresetType === 'email' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Email Tujuan</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="email"
                            value={qrEmailTo}
                            onChange={e => setQrEmailTo(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Subjek Pesan</label>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          height: 42, padding: '0 16px', borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <input
                            type="text"
                            value={qrEmailSubject}
                            onChange={e => setQrEmailSubject(e.target.value)}
                            className="links-clean-input"
                            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {qrPresetType === 'text' && (
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Isi Teks</label>
                      <textarea
                        value={qrCustomText}
                        onChange={e => setQrCustomText(e.target.value)}
                        className="links-clean-input"
                        style={{ width: '100%', height: 80, fontSize: 13, resize: 'none', borderRadius: 18, background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: 12, boxSizing: 'border-box', outline: 'none', color: 'var(--cms-text)' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: WARNA & DESAIN QR ── */}
              {qrActiveTab === 'design' && (
                <div style={{ padding: 22, borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                    Pilihan Palet Warna QR ({QR_PALETTES.length} Warna)
                  </span>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {QR_PALETTES.map((pst, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQrFgColor(pst.fg);
                          setQrBgColor(pst.bg);
                          setQrIsTransparentBg(false);
                        }}
                        style={{
                          padding: '7px 14px', borderRadius: 100,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--glass-border)',
                          fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <span style={{ width: 11, height: 11, borderRadius: '50%', background: pst.fg, border: '1px solid rgba(255,255,255,0.3)' }} />
                        <span>{pst.label}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                    <GlassColorPicker
                      label="Warna QR (Foreground)"
                      value={qrFgColor}
                      onChange={v => setQrFgColor(v)}
                    />

                    {!qrIsTransparentBg && (
                      <GlassColorPicker
                        label="Warna Latar (Background)"
                        value={qrBgColor}
                        onChange={v => setQrBgColor(v)}
                      />
                    )}

                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--cms-card-bg, #ffffff)', borderRadius: 100, border: '1.5px solid var(--cms-border, #cbd5e1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Latar Transparan (PNG Alpha)</span>
                      <Switch 
                        checked={qrIsTransparentBg} 
                        onChange={v => setQrIsTransparentBg(v)} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: BINGKAI & FRAME QR ── */}
              {qrActiveTab === 'frame' && (
                <div style={{ padding: '20px 18px', borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Gaya Frame Desain</label>
                    <PillDropdown
                      value={qrFrameStyle}
                      onChange={v => setQrFrameStyle(v)}
                      options={[
                        { value: 'badge', label: 'Badge Modern Header & Subtext' },
                        { value: 'card', label: 'Card Minimalist Rounded' },
                        { value: 'polaroid', label: 'Polaroid Classic Frame' },
                        { value: 'pill-badge', label: 'Capsule Pill Border' },
                        { value: 'ticket', label: 'Event Ticket Stub' },
                        { value: 'barcode', label: 'Cyber Tech Barcode Style' },
                        { value: 'gold-trim', label: 'Luxury Gold Trim' },
                        { value: 'glass-float', label: 'Glassmorphism Floating' },
                        { value: 'stamp', label: 'Stamp Seal Circle' },
                        { value: 'none', label: 'Polos Tanpa Frame' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Teks Label Utama</label>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      height: 42, padding: '0 16px', borderRadius: 100,
                      background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <input
                        type="text"
                        value={qrFrameHeader}
                        onChange={e => setQrFrameHeader(e.target.value)}
                        className="links-clean-input"
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Subteks Keterangan</label>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      height: 42, padding: '0 16px', borderRadius: 100,
                      background: 'var(--cms-card-bg, #ffffff)',
                                    border: '1.5px solid var(--cms-border, #cbd5e1)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <input
                        type="text"
                        value={qrFrameSubtext}
                        onChange={e => setQrFrameSubtext(e.target.value)}
                        className="links-clean-input"
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--cms-text)' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: EKSPOR & UNDUH QR ── */}
              {qrActiveTab === 'export' && (
                <div style={{ padding: '20px 18px', borderRadius: 28, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Resolusi Ekspor PNG</label>
                    <PillDropdown
                      value={qrResolution}
                      onChange={v => setQrResolution(Number(v))}
                      options={[
                        { value: 300, label: '300 x 300 px (Digital/Web)' },
                        { value: 600, label: '600 x 600 px (Standar HD)' },
                        { value: 1200, label: '1200 x 1200 px (High-Res Cetak)' },
                        { value: 2400, label: '2400 x 2400 px (Ultra-HD Poster)' },
                        { value: 4000, label: '4000 x 4000 px (Master Print 300 DPI)' }
                      ]}
                    />
                  </div>

                  {/* Unduh Cepat File */}
                  <div>
                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 6 }}>Unduh Cepat</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <a
                        href={qrApiUrl}
                        download="qrcode-hd.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cms-btn cms-btn-primary"
                        style={{ height: 42, borderRadius: 100, fontSize: 12.5, fontWeight: 850, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                      >
                        <Download size={14} /> PNG
                      </a>
                      <a
                        href={qrSvgUrl}
                        download="qrcode-vector.svg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cms-btn cms-btn-secondary"
                        style={{ height: 42, borderRadius: 100, fontSize: 12.5, fontWeight: 850, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                      >
                        <FileCode size={14} /> SVG
                      </a>
                    </div>
                  </div>

                  {/* HTML Export Code Box */}
                  <div style={{ width: '100%', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="cms-label" style={{ fontSize: 11.5 }}>Kode HTML Embed Widget</label>
                      <button
                        type="button"
                        onClick={handleCopyHtml}
                        style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 14px', borderRadius: 100, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', cursor: 'pointer' }}
                        title="Salin Kode HTML"
                      >
                        Salin
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={htmlExportCode}
                      style={{
                        width: '100%', height: 75, borderRadius: 16, border: '1.5px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.3)', color: '#93c5fd', fontSize: 11, fontFamily: 'monospace',
                        padding: 10, boxSizing: 'border-box', resize: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ── COLUMN 3: STICKY LIVE MOCKUP PREVIEW ── */}
        <div className={`links-preview-col ${mobileViewTab === 'editor' ? 'hide-on-mobile' : ''} ${isPreviewOpen ? 'preview-open' : ''}`} style={{
          padding: '20px 24px',
          width: 460,
          minWidth: 460,
          maxWidth: 460,
          background: 'var(--cms-card-bg)',
          borderLeft: '1px solid var(--glass-border)',
          display: isPreviewOpen ? 'flex' : 'none',
          flexDirection: 'column',
          gap: 14,
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          boxSizing: 'border-box',
          alignItems: 'center',
          flexShrink: 0
        }}>
          
          {studioMode === 'links' ? (
            <>
              <div className="links-preview-header" style={{ width: '100%', height: 48, minHeight: 48, maxHeight: 48, padding: '0 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', boxSizing: 'border-box', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 850, color: 'var(--cms-text)' }}>Pratinjau Halaman Bio</span>
                <span style={{ fontSize: 10.5, fontWeight: 850, color: 'var(--cms-accent)' }}>LIVE ANIMATION ENGINE</span>
              </div>

              {/* Full-Height Desktop/Mobile Wallpaper Stage */}
              <div className="links-preview-stage" style={{
                flex: 1,
                width: '100%',
                height: 'calc(100% - 48px)',
                minHeight: 0,
                padding: '18px 16px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...outerBgStyle,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Phone Shell */}
                <div className="links-phone-shell" style={{
                  width: '100%',
                  maxWidth: 380,
                  height: '100%',
                  borderRadius: 30,
                  overflowY: 'auto',
                  background: innerBgStyle,
                  color: currentPage.profile?.themePreset === 'pure-light' ? '#0f172a' : '#ffffff',
                  border: '1px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 25px 70px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.2)',
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  scrollbarWidth: 'none',
                  position: 'relative',
                  boxSizing: 'border-box',
                  margin: '0 auto'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '2.5px solid var(--cms-accent, #7c3aed)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 8
                  }}>
                    {currentPage.profile?.avatarUrl ? (
                      <img src={currentPage.profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={30} color="var(--cms-accent)" />
                    )}
                  </div>

                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16.5, fontWeight: 900 }}>{currentPage.profile?.name || 'Nama Profil'}</span>
                    {currentPage.profile?.verifiedBadge && (
                      <ShieldCheck size={16} color="#3b82f6" />
                    )}
                  </div>

                  {/* Bio */}
                  <p style={{ fontSize: 12, opacity: 0.75, textAlign: 'center', margin: '4px 0 18px', maxWidth: 300, lineHeight: 1.4 }}>
                    {currentPage.profile?.bio || 'Bio singkat profil...'}
                  </p>

                  {/* Links Categorized in Sections with Live CSS Keyframe Animations */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.keys(groupedLinks).map(catName => {
                      const list = groupedLinks[catName];
                      if (!list || list.length === 0) return null;

                      return (
                        <div key={catName} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {catName !== 'Lainnya' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.15)' }} />
                              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>
                                {catName}
                              </span>
                              <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.15)' }} />
                            </div>
                          )}

                          {list.map((lnk) => {
                            // ── Modular Bio Blocks Live Preview ──
                            if (lnk.itemType === 'lead-magnet') {
                              const lmPill = lnk.btnShape === 'pill';
                              const lmSquare = lnk.btnShape === 'square';
                              const lmRadius = lmPill ? 28 : lmSquare ? 10 : 18;
                              const lmBtnRadius = lmPill ? 100 : lmSquare ? 8 : 10;
                              const lmAccent = lnk.blockAccentColor || '#ec4899';
                              const lmTextColor = lnk.blockTextColor || (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor) ? getContrastTextColor(lnk.blockBgColor || lnk.btnBgColor) : '#ffffff');
                              const lmBtnTextColor = getContrastTextColor(lmAccent);
                              const lmBorder = lnk.blockBorderColor ? `1.5px solid ${lnk.blockBorderColor}` : (lnk.btnBgType === 'neon' ? `2px solid ${lmAccent}` : `1px solid ${lmAccent}44`);
                              let lmBg = lnk.blockBgColor || 'rgba(255,255,255,0.06)';
                              if (lnk.btnBgType === 'gradient' && lnk.btnBgGradient) {
                                lmBg = lnk.btnBgGradient;
                              } else if (lnk.btnBgType === 'solid') {
                                lmBg = lnk.blockBgColor || lnk.btnBgColor || lmAccent;
                              } else if (lnk.btnBgType === 'glass') {
                                lmBg = lnk.blockBgColor || 'rgba(255,255,255,0.08)';
                              } else if (lnk.btnBgType === 'neon') {
                                lmBg = lnk.blockBgColor || 'rgba(0,0,0,0.7)';
                              }
                              const lmBtnBg = lnk.blockBtnColor || lnk.btnBgGradient || `linear-gradient(135deg, ${lmAccent}, #ec4899)`;
                              const lmAnim = lnk.animation && lnk.animation !== 'none' ? `lp-anim-${lnk.animation}` : '';

                              return (
                                <div
                                  key={lnk.id}
                                  className={lmAnim}
                                  style={{
                                    width: '100%', padding: '12px 14px', borderRadius: lmRadius,
                                    background: lmBg, border: lmBorder,
                                    display: 'flex', flexDirection: 'column', gap: 8, boxSizing: 'border-box',
                                    boxShadow: lnk.blockBorderColor ? `0 0 14px ${lnk.blockBorderColor}33` : (lnk.btnBgType === 'neon' ? `0 0 16px ${lmAccent}55` : '0 4px 10px rgba(0,0,0,0.12)')
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 100, background: `${lmAccent}25`, color: lmAccent, border: `1px solid ${lmAccent}55`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      <Gift size={10} /> {lnk.leadBadge || 'GRATIS'}
                                    </span>
                                    <Sparkles size={12} color={lmAccent} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 12.5, fontWeight: 850, color: lmTextColor }}>{lnk.title}</div>
                                    {lnk.subtitle && <div style={{ fontSize: 10, color: `${lmTextColor}aa`, marginTop: 2 }}>{lnk.subtitle}</div>}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ height: 26, borderRadius: lmBtnRadius > 16 ? 100 : 6, background: 'rgba(0,0,0,0.3)', padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 10, opacity: 0.6, color: '#ffffff' }}>Nama lengkap...</div>
                                    <div style={{ height: 26, borderRadius: lmBtnRadius > 16 ? 100 : 6, background: 'rgba(0,0,0,0.3)', padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 10, opacity: 0.6, color: '#ffffff' }}>No WhatsApp...</div>
                                    <div style={{ height: 28, borderRadius: lmBtnRadius, background: lmBtnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, color: lmBtnTextColor, gap: 4 }}>
                                      <Download size={11} /> {lnk.leadButtonText || 'Download Gratis'}
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (lnk.itemType === 'tip-jar') {
                              const amounts = lnk.tipAmounts && lnk.tipAmounts.length > 0 ? lnk.tipAmounts : [10000, 25000, 50000];
                              const method = lnk.tipPreferredMethod || 'all';
                              const tjPill = lnk.btnShape === 'pill';
                              const tjSquare = lnk.btnShape === 'square';
                              const tjRadius = tjPill ? 28 : tjSquare ? 10 : 18;
                              const tjBtnRadius = tjPill ? 100 : tjSquare ? 8 : 10;
                              const tjAccent = lnk.blockAccentColor || '#f59e0b';
                              const tjTextColor = lnk.blockTextColor || (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor) ? getContrastTextColor(lnk.blockBgColor || lnk.btnBgColor) : '#ffffff');
                              const tjBtnTextColor = getContrastTextColor(tjAccent);
                              const tjBorder = lnk.blockBorderColor ? `1.5px solid ${lnk.blockBorderColor}` : (lnk.btnBgType === 'neon' ? `2px solid ${tjAccent}` : `1px solid ${tjAccent}44`);
                              let tjBg = lnk.blockBgColor || 'rgba(255,255,255,0.06)';
                              if (lnk.btnBgType === 'gradient' && lnk.btnBgGradient) {
                                tjBg = lnk.btnBgGradient;
                              } else if (lnk.btnBgType === 'solid') {
                                tjBg = lnk.blockBgColor || lnk.btnBgColor || tjAccent;
                              } else if (lnk.btnBgType === 'glass') {
                                tjBg = lnk.blockBgColor || 'rgba(255,255,255,0.08)';
                              } else if (lnk.btnBgType === 'neon') {
                                tjBg = lnk.blockBgColor || 'rgba(0,0,0,0.7)';
                              }
                              const tjBtnBg = lnk.blockBtnColor || lnk.btnBgGradient || `linear-gradient(135deg, ${tjAccent}, #d97706)`;
                              const tjAnim = lnk.animation && lnk.animation !== 'none' ? `lp-anim-${lnk.animation}` : '';

                              return (
                                <div
                                  key={lnk.id}
                                  className={tjAnim}
                                  style={{
                                    width: '100%', padding: '12px 14px', borderRadius: tjRadius,
                                    background: tjBg, border: tjBorder,
                                    display: 'flex', flexDirection: 'column', gap: 8, boxSizing: 'border-box',
                                    boxShadow: lnk.blockBorderColor ? `0 0 14px ${lnk.blockBorderColor}33` : (lnk.btnBgType === 'neon' ? `0 0 16px ${tjAccent}55` : '0 4px 10px rgba(0,0,0,0.12)')
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 26, height: 26, borderRadius: tjBtnRadius > 16 ? 100 : 8, background: `${tjAccent}25`, color: tjAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Coffee size={14} />
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 12, fontWeight: 850, color: tjTextColor }}>{lnk.title || 'Traktir Kopi'}</div>
                                        <div style={{ fontSize: 9.5, color: `${tjTextColor}aa` }}>{lnk.subtitle || 'Dukungan karya'}</div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 3 }}>
                                      {(method === 'all' || method === 'qris') && (
                                        <span title="QRIS" style={{ padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: tjAccent, display: 'flex', alignItems: 'center' }}>
                                          <QrCode size={10} />
                                        </span>
                                      )}
                                      {(method === 'all' || method === 'saweria') && (
                                        <span title="Saweria" style={{ padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: tjAccent, display: 'flex', alignItems: 'center' }}>
                                          <ExternalLink size={10} />
                                        </span>
                                      )}
                                      {(method === 'all' || method === 'whatsapp') && (
                                        <span title="WhatsApp" style={{ padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: '#10b981', display: 'flex', alignItems: 'center' }}>
                                          <MessageCircle size={10} />
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {amounts.slice(0, 3).map(amt => (
                                      <div key={amt} style={{ flex: 1, height: 24, borderRadius: tjBtnRadius > 16 ? 100 : 6, background: 'rgba(255,255,255,0.08)', border: `1px solid ${tjAccent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, color: tjAccent }}>
                                        {amt >= 1000 ? `${amt / 1000}k` : amt}
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ height: 28, borderRadius: tjBtnRadius, background: tjBtnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, color: tjBtnTextColor, gap: 4 }}>
                                    <Heart size={11} fill="currentColor" /> {method === 'saweria' ? 'Buka Saweria' : method === 'qris' ? 'Scan QRIS' : 'Traktir Kopi'}
                                  </div>
                                </div>
                              );
                            }

                            if (lnk.itemType === 'accordion') {
                              const accPill = lnk.btnShape === 'pill';
                              const accSquare = lnk.btnShape === 'square';
                              const accRadius = accPill ? 24 : accSquare ? 10 : 14;
                              const accAccent = lnk.blockAccentColor || '#3b82f6';
                              const accTextColor = lnk.blockTextColor || (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor) ? getContrastTextColor(lnk.blockBgColor || lnk.btnBgColor) : '#ffffff');
                              const accBorder = lnk.blockBorderColor ? `1.5px solid ${lnk.blockBorderColor}` : (lnk.btnBgType === 'neon' ? `2px solid ${accAccent}` : `1px solid ${accAccent}44`);
                              let accBg = lnk.blockBgColor || 'rgba(255,255,255,0.06)';
                              if (lnk.btnBgType === 'gradient' && lnk.btnBgGradient) {
                                accBg = lnk.btnBgGradient;
                              } else if (lnk.btnBgType === 'solid') {
                                accBg = lnk.blockBgColor || lnk.btnBgColor || accAccent;
                              } else if (lnk.btnBgType === 'glass') {
                                accBg = lnk.blockBgColor || 'rgba(255,255,255,0.08)';
                              } else if (lnk.btnBgType === 'neon') {
                                accBg = lnk.blockBgColor || 'rgba(0,0,0,0.7)';
                              }
                              const accAnim = lnk.animation && lnk.animation !== 'none' ? `lp-anim-${lnk.animation}` : '';

                              return (
                                <div
                                  key={lnk.id}
                                  className={accAnim}
                                  style={{
                                    width: '100%', padding: '10px 12px', borderRadius: accRadius,
                                    background: accBg, border: accBorder,
                                    display: 'flex', flexDirection: 'column', gap: 6, boxSizing: 'border-box',
                                    boxShadow: lnk.blockBorderColor ? `0 0 14px ${lnk.blockBorderColor}33` : (lnk.btnBgType === 'neon' ? `0 0 16px ${accAccent}55` : 'none')
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <HelpCircle size={13} color={accAccent} />
                                      <span style={{ fontSize: 11.5, fontWeight: 850, color: accTextColor }}>{lnk.title}</span>
                                    </div>
                                    <ChevronDown size={13} style={{ color: accTextColor, opacity: 0.6 }} />
                                  </div>
                                  {lnk.accordionContent && (
                                    <div style={{ fontSize: 9.5, color: `${accTextColor}aa`, paddingLeft: 19, lineHeight: 1.4 }}>
                                      {lnk.accordionContent}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            if (lnk.itemType === 'countdown') {
                              const cdPill = lnk.btnShape === 'pill';
                              const cdSquare = lnk.btnShape === 'square';
                              const cdRadius = cdPill ? 28 : cdSquare ? 10 : 16;
                              const cdAccent = lnk.blockAccentColor || '#ef4444';
                              const cdTextColor = lnk.blockTextColor || (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor) ? getContrastTextColor(lnk.blockBgColor || lnk.btnBgColor) : '#ffffff');
                              const cdBorder = lnk.blockBorderColor ? `1.5px solid ${lnk.blockBorderColor}` : (lnk.btnBgType === 'neon' ? `2px solid ${cdAccent}` : `1px solid ${cdAccent}44`);
                              let cdBg = lnk.blockBgColor || 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))';
                              if (lnk.btnBgType === 'gradient' && lnk.btnBgGradient) {
                                cdBg = lnk.btnBgGradient;
                              } else if (lnk.btnBgType === 'solid') {
                                cdBg = lnk.blockBgColor || lnk.btnBgColor || cdAccent;
                              } else if (lnk.btnBgType === 'glass') {
                                cdBg = lnk.blockBgColor || 'rgba(255,255,255,0.08)';
                              } else if (lnk.btnBgType === 'neon') {
                                cdBg = lnk.blockBgColor || 'rgba(0,0,0,0.7)';
                              }
                              const cdAnim = lnk.animation && lnk.animation !== 'none' ? `lp-anim-${lnk.animation}` : '';

                              return (
                                <div
                                  key={lnk.id}
                                  className={cdAnim}
                                  style={{
                                    width: '100%', padding: '12px 14px', borderRadius: cdRadius,
                                    background: cdBg,
                                    border: cdBorder,
                                    display: 'flex', flexDirection: 'column', gap: 8, boxSizing: 'border-box',
                                    boxShadow: lnk.blockBorderColor ? `0 0 14px ${lnk.blockBorderColor}33` : (lnk.btnBgType === 'neon' ? `0 0 16px ${cdAccent}55` : '0 4px 10px rgba(0,0,0,0.12)')
                                  }}
                                >
                                  {lnk.countdownImageUrl && (
                                    <div style={{ width: '100%', height: 75, borderRadius: cdRadius > 16 ? 14 : 10, overflow: 'hidden', position: 'relative' }}>
                                      <img src={lnk.countdownImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 8.5, fontWeight: 900, padding: '2px 6px', borderRadius: 100, background: cdAccent, color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      <Zap size={10} /> {lnk.countdownBadge || 'FLASH SALE'}
                                    </span>
                                    <span style={{ fontSize: 9.5, color: cdAccent, fontWeight: 800 }}>Segera Berakhir!</span>
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 850, color: cdTextColor }}>{lnk.title}</div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, textAlign: 'center' }}>
                                    {['02H', '14J', '35M', '40D'].map((t, i) => (
                                      <div key={i} style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${cdAccent}33`, borderRadius: cdRadius > 16 ? 10 : 6, padding: '4px 0', fontSize: 11, fontWeight: 900, color: '#ffffff' }}>
                                        {t}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            if (lnk.itemType === 'product-card') {
                              const prodPill = lnk.btnShape === 'pill';
                              const prodSquare = lnk.btnShape === 'square';
                              const prodRadius = prodPill ? 26 : prodSquare ? 10 : 16;
                              const prodBtnRadius = prodPill ? 100 : prodSquare ? 8 : 10;
                              const prodAccent = lnk.blockAccentColor || '#10b981';
                              const prodTextColor = lnk.blockTextColor || (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor) ? getContrastTextColor(lnk.blockBgColor || lnk.btnBgColor) : '#ffffff');
                              const prodBtnTextColor = getContrastTextColor(prodAccent);
                              const prodBorder = lnk.blockBorderColor ? `1.5px solid ${lnk.blockBorderColor}` : (lnk.btnBgType === 'neon' ? `2px solid ${prodAccent}` : `1px solid ${prodAccent}44`);
                              let prodBg = lnk.blockBgColor || 'rgba(255,255,255,0.06)';
                              if (lnk.btnBgType === 'gradient' && lnk.btnBgGradient) {
                                prodBg = lnk.btnBgGradient;
                              } else if (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor)) {
                                prodBg = lnk.blockBgColor || lnk.btnBgColor;
                              } else if (lnk.btnBgType === 'glass') {
                                prodBg = lnk.blockBgColor || 'rgba(255,255,255,0.08)';
                              } else if (lnk.btnBgType === 'neon') {
                                prodBg = lnk.blockBgColor || 'rgba(0,0,0,0.7)';
                              }
                              const prodBtnBg = lnk.blockBtnColor || lnk.btnBgGradient || `linear-gradient(135deg, ${prodAccent}, #10b981)`;
                              const prodAnim = lnk.animation && lnk.animation !== 'none' ? `lp-anim-${lnk.animation}` : '';

                              return (
                                <div
                                  key={lnk.id}
                                  className={prodAnim}
                                  style={{
                                    width: '100%', borderRadius: prodRadius, overflow: 'hidden',
                                    background: prodBg, border: prodBorder,
                                    display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                                    boxShadow: lnk.blockBorderColor ? `0 0 14px ${lnk.blockBorderColor}33` : (lnk.btnBgType === 'neon' ? `0 0 16px ${prodAccent}55` : '0 4px 10px rgba(0,0,0,0.12)')
                                  }}
                                >
                                  {lnk.coverImageUrl && (
                                    <img src={lnk.coverImageUrl} alt="" style={{ width: '100%', height: 75, objectFit: 'cover' }} />
                                  )}
                                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ fontSize: 12, fontWeight: 850, color: prodTextColor }}>{lnk.title}</div>
                                    <div style={{ fontSize: 12, fontWeight: 900, color: prodAccent }}>
                                      {formatBioCurrency(lnk.productPrice || 99000)}
                                    </div>
                                    <div style={{ height: 26, borderRadius: prodBtnRadius, background: prodBtnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 850, color: prodBtnTextColor, gap: 4, marginTop: 2 }}>
                                      <ShoppingBag size={11} /> {lnk.productButtonText || 'Beli Sekarang'}
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (lnk.itemType === 'embed') {
                              const embPill = lnk.btnShape === 'pill';
                              const embSquare = lnk.btnShape === 'square';
                              const embRadius = embPill ? 24 : embSquare ? 10 : 14;
                              const embAccent = lnk.blockAccentColor || '#a855f7';
                              const embTextColor = lnk.blockTextColor || (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor) ? getContrastTextColor(lnk.blockBgColor || lnk.btnBgColor) : '#ffffff');
                              const embBorder = lnk.blockBorderColor ? `1.5px solid ${lnk.blockBorderColor}` : (lnk.btnBgType === 'neon' ? `2px solid ${embAccent}` : `1px solid ${embAccent}44`);
                              let embBg = lnk.blockBgColor || 'rgba(255,255,255,0.06)';
                              if (lnk.btnBgType === 'gradient' && lnk.btnBgGradient) {
                                embBg = lnk.btnBgGradient;
                              } else if (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor)) {
                                embBg = lnk.blockBgColor || lnk.btnBgColor;
                              } else if (lnk.btnBgType === 'glass') {
                                embBg = lnk.blockBgColor || 'rgba(255,255,255,0.08)';
                              } else if (lnk.btnBgType === 'neon') {
                                embBg = lnk.blockBgColor || 'rgba(0,0,0,0.7)';
                              }
                              const embAnim = lnk.animation && lnk.animation !== 'none' ? `lp-anim-${lnk.animation}` : '';

                              return (
                                <div
                                  key={lnk.id}
                                  className={embAnim}
                                  style={{
                                    width: '100%', padding: 8, borderRadius: embRadius,
                                    background: embBg, border: embBorder,
                                    display: 'flex', flexDirection: 'column', gap: 6, boxSizing: 'border-box',
                                    boxShadow: lnk.blockBorderColor ? `0 0 14px ${lnk.blockBorderColor}33` : (lnk.btnBgType === 'neon' ? `0 0 16px ${embAccent}55` : 'none')
                                  }}
                                >
                                  <div style={{ fontSize: 11, fontWeight: 850, color: embAccent, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Play size={12} /> {lnk.title || 'Media Player Embed'}
                                  </div>
                                  <div style={{ width: '100%', height: 60, borderRadius: embRadius > 14 ? 12 : 8, background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(255,255,255,0.7)', gap: 5 }}>
                                    <Play size={12} fill="currentColor" /> Preview Media Player
                                  </div>
                                </div>
                              );
                            }

                            // Standard Link Button Preview
                            const isPill = lnk.btnShape === 'pill';
                            const isSquare = lnk.btnShape === 'square';
                            const radius = isPill ? 100 : isSquare ? 8 : 16;
                            const isNeon = lnk.btnBgType === 'neon';
                            const neonCol = lnk.blockAccentColor || lnk.btnBgColor || 'var(--cms-accent, #7c3aed)';
                            const accentCol = lnk.blockAccentColor || 'var(--cms-accent, #7c3aed)';

                            let btnBg = 'rgba(255,255,255,0.06)';
                            if (lnk.btnBgType === 'gradient') {
                              btnBg = lnk.btnBgGradient || `linear-gradient(135deg, ${accentCol}, #9333ea)`;
                            } else if (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor)) {
                              btnBg = lnk.blockBgColor || lnk.btnBgColor;
                            } else if (lnk.btnBgType === 'image' && lnk.btnBgImage) {
                              btnBg = `url(${lnk.btnBgImage}) center/cover no-repeat`;
                            } else if (lnk.btnBgType === 'glass') {
                              btnBg = lnk.blockBgColor || 'rgba(255,255,255,0.12)';
                            } else if (isNeon) {
                              btnBg = lnk.blockBgColor || 'rgba(0,0,0,0.65)';
                            } else if (lnk.blockBgColor) {
                              btnBg = lnk.blockBgColor;
                            } else if (lnk.btnBgColor) {
                              btnBg = lnk.btnBgColor;
                            }

                            const textColor = lnk.blockTextColor || lnk.btnTextColor || (isNeon ? neonCol : (lnk.btnBgType === 'solid' && (lnk.blockBgColor || lnk.btnBgColor) ? getContrastTextColor(lnk.blockBgColor || lnk.btnBgColor) : (currentPage.profile?.themePreset === 'pure-light' && lnk.btnBgType === 'glass' ? '#0f172a' : '#ffffff')));
                            const borderColor = lnk.blockBorderColor ? (isNeon ? `2px solid ${lnk.blockBorderColor}` : `1.5px solid ${lnk.blockBorderColor}`) : (isNeon ? `2px solid ${neonCol}` : '1px solid rgba(255,255,255,0.15)');
                            const animClass = lnk.animation && lnk.animation !== 'none' ? `lp-anim-${lnk.animation}` : '';

                            return (
                              <a
                                key={lnk.id}
                                href={lnk.url}
                                target="_blank"
                                rel="noreferrer"
                                className={animClass}
                                style={{
                                  width: '100%', padding: '13px 16px', borderRadius: radius,
                                  background: btnBg,
                                  color: textColor,
                                  border: borderColor,
                                  boxShadow: lnk.blockBorderColor ? `0 0 16px ${lnk.blockBorderColor}44` : (isNeon ? `0 0 20px ${neonCol}, 0 0 6px ${neonCol}, inset 0 0 8px rgba(0,0,0,0.5)` : '0 4px 10px rgba(0,0,0,0.14)'),
                                  textDecoration: 'none',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  boxSizing: 'border-box',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '--link-glow-color': neonCol
                                } as React.CSSProperties}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                                  {lnk.coverImageUrl ? (
                                    <img src={lnk.coverImageUrl} alt="" style={{ width: 36, height: 36, borderRadius: isPill ? '50%' : 10, objectFit: 'cover', flexShrink: 0 }} />
                                  ) : (
                                    <div style={{ width: 36, height: 36, borderRadius: isPill ? '50%' : 10, background: `${accentCol}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <LinkIcon size={15} color={accentCol} />
                                    </div>
                                  )}
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                    <span style={{ fontSize: 13, fontWeight: 850, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: textColor }}>{lnk.title}</span>
                                    {lnk.subtitle && (
                                      <span style={{ fontSize: 10.5, color: `${textColor}aa`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lnk.subtitle}</span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight size={15} opacity={0.6} style={{ flexShrink: 0, color: textColor }} />
                              </a>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── QR STUDIO MOCKUP PREVIEW STAGE ── */
            <div className="links-qr-preview-wrapper" style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
              
              {/* Top Header: Mockup switcher tabs & Rounded Download Dropdown */}
              <div className="links-preview-header" style={{
                width: '100%',
                height: 48,
                minHeight: 48,
                maxHeight: 48,
                padding: '0 16px',
                borderBottom: '1px solid var(--glass-border)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                position: 'relative',
                background: 'var(--cms-card-bg)'
              }}>
                {/* Mockup Tabs - Bigger & Compact */}
                <div style={{
                  display: 'flex',
                  gap: 4,
                  padding: '3px 4px',
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: '1.5px solid var(--cms-border, #cbd5e1)',
                  borderRadius: 100,
                  flex: 1,
                  maxWidth: 320,
                  height: 36,
                  boxSizing: 'border-box',
                  alignItems: 'center'
                }}>
                  {[
                    { id: 'card', label: 'Kartu', icon: CreditCard },
                    { id: 'phone', label: 'Ponsel', icon: Smartphone },
                    { id: 'sticker', label: 'Stiker', icon: Tag },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setQrPreviewMockup(tab.id as any)}
                      style={{
                        flex: 1,
                        height: '100%',
                        padding: '0 8px',
                        borderRadius: 100,
                        border: 'none',
                        background: qrPreviewMockup === tab.id ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                        color: qrPreviewMockup === tab.id ? '#ffffff' : 'var(--cms-text-muted)',
                        fontSize: 12,
                        fontWeight: 850,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <tab.icon size={13} /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Top Download Icon Trigger with Rounded Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsQrDownloadDropdownOpen(prev => !prev)}
                    className="cms-btn cms-btn-primary"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 100,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--cms-accent, #7c3aed)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                      flexShrink: 0
                    }}
                    title="Unduh QR Code"
                  >
                    <Download size={16} />
                  </button>

                  {/* Rounded Dropdown Menu */}
                  {isQrDownloadDropdownOpen && (
                    <>
                      <div
                        onClick={() => setIsQrDownloadDropdownOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 120 }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 44,
                        right: 0,
                        zIndex: 125,
                        background: 'var(--cms-card-bg, #12121a)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: 20,
                        padding: 6,
                        width: 205,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        backdropFilter: 'blur(16px)'
                      }}>
                        <a
                          href={qrApiUrl}
                          download="qrcode-desain.png"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsQrDownloadDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 12px',
                            borderRadius: 14,
                            fontSize: 12,
                            fontWeight: 800,
                            color: 'var(--cms-text)',
                            textDecoration: 'none',
                            background: 'rgba(255,255,255,0.03)',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-accent-soft)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                          <Download size={14} color="var(--cms-accent)" />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>PNG</span>
                            <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 600 }}>Gambar Raster HD</span>
                          </div>
                        </a>

                        <a
                          href={qrSvgUrl}
                          download="qrcode-vector.svg"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsQrDownloadDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 12px',
                            borderRadius: 14,
                            fontSize: 12,
                            fontWeight: 800,
                            color: 'var(--cms-text)',
                            textDecoration: 'none',
                            background: 'rgba(255,255,255,0.03)',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-accent-soft)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                          <FileCode size={14} color="#38bdf8" />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>SVG</span>
                            <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 600 }}>Vektor Resolusi Tinggi</span>
                          </div>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            handleDownloadHtml();
                            setIsQrDownloadDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 12px',
                            borderRadius: 14,
                            fontSize: 12,
                            fontWeight: 800,
                            color: 'var(--cms-text)',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            background: 'rgba(255,255,255,0.03)',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-accent-soft)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                          <Code size={14} color="#a855f7" />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>HTML</span>
                            <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 600 }}>Embed Web Siap Pakai</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Stage Canvas */}
              <div className="links-qr-stage-canvas" style={{
                flex: 1,
                width: '100%',
                height: 'calc(100% - 48px)',
                minHeight: 0,
                padding: '20px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--cms-card-bg)',
                position: 'relative',
                overflowY: 'auto',
                boxSizing: 'border-box'
              }}>
                {/* MOCKUP A: CARD */}
                {qrPreviewMockup === 'card' && (
                  <div style={{
                    width: '100%',
                    maxWidth: 280,
                    background: qrIsTransparentBg ? '#ffffff' : qrBgColor,
                    borderRadius: qrFrameStyle === 'polaroid' ? '16px 16px 30px 30px' : qrFrameStyle === 'ticket' ? 14 : 24,
                    padding: qrFrameStyle === 'polaroid' ? '18px 18px 28px' : 20,
                    border: qrFrameStyle === 'gold-trim' ? '2.5px solid #fbbf24' : '1px solid var(--glass-border)',
                    boxShadow: qrFrameStyle === 'gold-trim' ? '0 20px 50px rgba(251,191,36,0.2)' : '0 20px 50px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 10,
                    position: 'relative',
                    margin: '0 auto'
                  }}>
                    {qrFrameStyle === 'ticket' && (
                      <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 24, height: 16, background: 'var(--cms-card-bg)', borderRadius: 100 }} />
                    )}
                    {qrFrameStyle !== 'none' && qrFrameHeader && (
                      <div style={{ fontSize: 13.5, fontWeight: 900, color: qrFgColor, letterSpacing: '0.06em' }}>
                        {qrFrameHeader}
                      </div>
                    )}
                    <img src={qrPreviewUrl} alt="QR Code" style={{ width: 170, height: 170, display: 'block', borderRadius: 10 }} />
                    {qrFrameStyle !== 'none' && qrFrameSubtext && (
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: qrFgColor, opacity: 0.85, maxWidth: 210, lineHeight: 1.3 }}>
                        {qrFrameSubtext}
                      </div>
                    )}
                  </div>
                )}

                {/* MOCKUP B: PHONE */}
                {qrPreviewMockup === 'phone' && (
                  <div style={{
                    width: 230, height: 400,
                    background: '#090910',
                    borderRadius: 30,
                    border: '4px solid #27273a',
                    padding: '22px 12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#fff',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
                    margin: '0 auto'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.6 }}>Tampilan QR Ponsel</div>
                    <div style={{ padding: 12, background: qrIsTransparentBg ? '#fff' : qrBgColor, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <img src={qrPreviewUrl} alt="QR" style={{ width: 125, height: 125, display: 'block', borderRadius: 8 }} />
                      {qrFrameHeader && <span style={{ fontSize: 9, fontWeight: 900, color: qrFgColor }}>{qrFrameHeader}</span>}
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.5, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{qrDataContent}</div>
                  </div>
                )}

                {/* MOCKUP C: STICKER */}
                {qrPreviewMockup === 'sticker' && (
                  <div style={{
                    width: 230, height: 230,
                    background: qrIsTransparentBg ? '#ffffff' : qrBgColor,
                    borderRadius: '50%',
                    border: `3px dashed ${qrFgColor}`,
                    padding: 16,
                    boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    textAlign: 'center',
                    margin: '0 auto'
                  }}>
                    {qrFrameHeader && <span style={{ fontSize: 11, fontWeight: 900, color: qrFgColor, letterSpacing: '0.08em' }}>{qrFrameHeader}</span>}
                    <img src={qrPreviewUrl} alt="QR" style={{ width: 115, height: 115, display: 'block', borderRadius: 6 }} />
                    {qrFrameSubtext && <span style={{ fontSize: 9, fontWeight: 700, color: qrFgColor, opacity: 0.8 }}>{qrFrameSubtext}</span>}
                  </div>
                )}

                <div style={{ marginTop: 12, fontSize: 10.5, color: 'var(--cms-text-muted)', textAlign: 'center', maxWidth: 260, wordBreak: 'break-all' }}>
                  Target: {qrDataContent}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ── CUSTOM CENTER MODAL DIALOG ── */}
      {confirmModal.isOpen && (
        <div
          onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            animation: 'cmsFadeIn 0.18s ease'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 380,
              background: 'var(--cms-card-bg, #1a1a24)',
              color: 'var(--cms-text, #ffffff)',
              borderRadius: 28,
              padding: 24,
              border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
              boxShadow: '0 25px 70px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14,
              animation: 'cmsScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={26} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{confirmModal.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--cms-text-muted)', lineHeight: 1.45 }}>
                {confirmModal.description}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  flex: 1, height: 42, borderRadius: 100,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
                  color: 'var(--cms-text)', fontSize: 12.5, fontWeight: 800, cursor: 'pointer'
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1, height: 42, borderRadius: 100,
                  background: '#ef4444', color: '#ffffff',
                  border: 'none', fontSize: 12.5, fontWeight: 850, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
                }}
              >
                {confirmModal.confirmText || 'Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── MOBILE SLIDE-OVER DRAWER ── */}
      {isPagesDrawerOpen && (
        <div 
          onClick={() => setIsPagesDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', justifyContent: 'flex-start',
            animation: 'cmsFadeIn 0.2s ease'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: 310, maxWidth: '88vw', height: '100%',
              background: 'var(--cms-card-bg)',
              borderRight: '1px solid var(--glass-border)',
              padding: '18px 16px 140px 16px', boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column', gap: 14,
              boxShadow: '10px 0 30px rgba(0,0,0,0.25)',
              animation: 'cmsSlideRight 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--cms-text)' }}>
                {studioMode === 'links' ? 'Pilih Halaman Bio' : 'Preset Sumber QR'}
              </span>
              <button
                onClick={() => setIsPagesDrawerOpen(false)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {studioMode === 'links' ? (
              <>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'none' }}>
                  {pages.map((p) => {
                    const isActive = p.id === currentPage.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActivePageId(p.id);
                          setIsPagesDrawerOpen(false);
                        }}
                        style={{
                          padding: '12px 16px', borderRadius: 16,
                          background: isActive ? 'var(--cms-accent-soft)' : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${isActive ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                          cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 850, color: isActive ? 'var(--cms-accent)' : 'var(--cms-text)' }}>
                            {p.title || p.slug}
                          </span>
                          {p.isDefault && (
                            <span style={{ fontSize: 8.5, fontWeight: 900, padding: '2px 6px', borderRadius: 100, background: 'var(--cms-accent)', color: '#fff' }}>
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                          /{p.slug} • {p.links?.length || 0} tautan
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddNewPage}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 100,
                    background: 'var(--cms-accent)', color: '#fff',
                    border: 'none', fontSize: 13, fontWeight: 850,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <Plus size={15} /> Tambah Halaman Baru
                </button>
              </>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: 'url', label: 'URL / Website', icon: Globe },
                  { id: 'wa', label: 'WhatsApp Langsung', icon: MessageCircle },
                  { id: 'wifi', label: 'WiFi Access', icon: Wifi },
                  { id: 'vcard', label: 'Kontak (vCard)', icon: User },
                  { id: 'email', label: 'Kirim Email', icon: Mail },
                  { id: 'text', label: 'Teks Bebas', icon: Type },
                ].map(pst => (
                  <button
                    key={pst.id}
                    type="button"
                    onClick={() => {
                      setQrSourceMode('custom');
                      setQrPresetType(pst.id as any);
                      setIsPagesDrawerOpen(false);
                    }}
                    style={{
                      padding: '12px 16px', borderRadius: 100, border: 'none',
                      background: qrPresetType === pst.id && qrSourceMode === 'custom' ? 'var(--cms-accent-soft)' : 'rgba(255,255,255,0.03)',
                      color: qrPresetType === pst.id && qrSourceMode === 'custom' ? 'var(--cms-accent)' : 'var(--cms-text)',
                      fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left'
                    }}
                  >
                    <pst.icon size={16} />
                    <span>{pst.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CSS RESPONSIVE STYLES & STRICT INPUT TRANSPARENCY ── */}
      <style>{`
        @keyframes cmsScaleIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        
        /* Eliminate any browser/theme default background on clean input fields */
        .links-studio-root .links-clean-input {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: var(--cms-text) !important;
          -webkit-appearance: none !important;
        }

        .links-studio-root .links-clean-input:focus {
          background: transparent !important;
          box-shadow: none !important;
          outline: none !important;
        }

        /* GlassColorPicker trigger integration */
        .links-studio-root .glass-color-trigger {
          border-radius: 100px !important;
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04) !important;
          height: 44px !important;
          padding: 0 16px !important;
          box-sizing: border-box !important;
        }

        .links-studio-root .glass-color-trigger:hover {
          border-color: var(--cms-accent) !important;
          box-shadow: 0 4px 14px rgba(var(--cms-accent-rgb, 124,58,237), 0.18) !important;
        }

        .links-studio-root .glass-color-trigger input {
          background: transparent !important;
          border: none !important;
          color: #0f172a !important;
          font-family: monospace !important;
          font-weight: 900 !important;
          font-size: 13.5px !important;
        }

        .links-studio-root .glass-color-trigger .hex-label {
          font-size: 10px !important;
          font-weight: 900 !important;
          color: #334155 !important;
          background: #f1f5f9 !important;
          padding: 2px 7px !important;
          border-radius: 6px !important;
          border: 1px solid #e2e8f0 !important;
          letter-spacing: 0.05em !important;
        }

        [data-cms-theme="dark"] .links-studio-root .glass-color-trigger {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.18) !important;
        }
        [data-cms-theme="dark"] .links-studio-root .glass-color-trigger input {
          color: #ffffff !important;
        }
        [data-cms-theme="dark"] .links-studio-root .glass-color-trigger .hex-label {
          background: rgba(255,255,255,0.1) !important;
          color: #ffffff !important;
          border-color: rgba(255,255,255,0.15) !important;
        }

        /* High-contrast crisp styling across LinksStudio */
        .links-studio-root .cms-label {
          color: #0f172a !important;
          font-weight: 850 !important;
          letter-spacing: 0.03em !important;
        }
        [data-cms-theme="dark"] .links-studio-root .cms-label {
          color: #f1f5f9 !important;
        }

        /* High-contrast link item cards */
        .links-studio-root .links-item-card {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05) !important;
        }
        [data-cms-theme="dark"] .links-studio-root .links-item-card {
          background: var(--cms-card-bg) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
        }

        /* High-contrast inputs */
        .links-studio-root input.links-clean-input,
        .links-studio-root textarea.links-clean-input {
          color: #0f172a !important;
        }
        [data-cms-theme="dark"] .links-studio-root input.links-clean-input,
        [data-cms-theme="dark"] .links-studio-root textarea.links-clean-input {
          color: #f8fafc !important;
        }

        /* Tablet & Large screen collapsible buttons styling */
        .links-col-toggle-btn:hover {
          color: #fff !important;
          background: var(--cms-accent) !important;
          border-color: var(--cms-accent) !important;
        }

        /* ── TABLET (768px-1200px): Overlay sidebars + visible arrow buttons (Portrait & Landscape) ── */
        @media (min-width: 768px) and (max-width: 1200px) {
          /* Arrow toggle buttons: show on tablet */
          .links-tablet-left-btn {
            display: flex !important;
          }
          .links-tablet-right-btn {
            display: flex !important;
          }

          /* Left sidebar: overlay above editor, not pushing it */
          .links-desktop-pages-sidebar {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            height: 100% !important;
            width: 270px !important;
            min-width: 270px !important;
            max-width: 270px !important;
            z-index: 80 !important;
            box-shadow: 8px 0 36px rgba(0,0,0,0.4) !important;
          }

          /* Right preview: overlay above editor from the right */
          .links-preview-col {
            position: absolute !important;
            right: 0 !important;
            top: 0 !important;
            height: 100% !important;
            width: 440px !important;
            min-width: 440px !important;
            max-width: 440px !important;
            z-index: 80 !important;
            box-shadow: -8px 0 36px rgba(0,0,0,0.4) !important;
            border-left: 1.5px solid var(--glass-border) !important;
          }

          .links-preview-header {
            display: flex !important;
          }
        }

        /* ── MOBILE (<= 767px): Phone screens ── */
        @media (max-width: 767px) {
          .links-studio-root {
            height: 100% !important;
            min-height: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .links-studio-grid {
            height: 100% !important;
            min-height: 100% !important;
            display: flex !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .links-desktop-pages-sidebar {
            display: none !important;
          }
          .cms-desktop-title-block {
            display: none !important;
          }
          .cms-desktop-actions-strip {
            display: none !important;
          }
          .cms-mobile-toggle-btn {
            display: flex !important;
          }
          .cms-mobile-preview-switcher {
            display: flex !important;
          }
          .cms-mobile-quick-open-btn {
            display: flex !important;
          }
          .cms-mobile-floating-switcher {
            display: flex !important;
          }

          /* Sub-tabs dock on mobile: ICON ONLY, perfectly centered */
          .links-subtabs-dock {
            padding: 4px !important;
            gap: 4px !important;
            border-radius: 100px !important;
          }
          .links-tab-text {
            display: none !important;
          }
          .links-subtab-btn {
            padding: 0 !important;
            height: 42px !important;
            border-radius: 100px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          .links-subtab-btn svg {
            width: 19px !important;
            height: 19px !important;
          }

          /* Enforce 1 full-width column per form input */
          .cms-responsive-form-grid,
          .cms-responsive-3col-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
          }

          /* Bottom Padding on Mobile Editor to avoid collision with bottom navigation */
          .links-editor-main-col {
            padding: 10px 12px 140px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          
          /* Mobile preview: fill 100% width and full height, seamlessly centered */
          .links-preview-col {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            height: 100% !important;
            background: transparent !important;
            border: none !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }

          /* Hide redundant secondary preview header on mobile to remove empty gap at top */
          .links-preview-header {
            display: none !important;
          }

          /* Mobile wallpaper stage: spans 100% full width and full height to behind bottom navbar */
          .links-preview-stage {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            height: 100% !important;
            flex: 1 !important;
            margin: 0 !important;
            padding: 10px 14px 118px 14px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow-y: auto !important;
            box-sizing: border-box !important;
            background-size: cover !important;
            background-position: center center !important;
            background-repeat: no-repeat !important;
          }

          /* Phone shell on mobile: elevated with distinct spacing margin above bottom navbar */
          .links-phone-shell {
            width: 100% !important;
            max-width: min(380px, calc(100vw - 28px)) !important;
            height: 100% !important;
            min-height: 480px !important;
            max-height: calc(100vh - 205px) !important;
            margin: 0 auto !important;
            align-self: center !important;
            box-sizing: border-box !important;
            border-radius: 34px !important;
            box-shadow: 0 24px 70px rgba(0,0,0,0.6) !important;
            padding: 24px 16px 20px 16px !important;
          }

          /* QR preview container on mobile: clean flex without bottom export collision */
          .links-qr-preview-wrapper {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .links-qr-stage-canvas {
            padding: 24px 14px 90px 14px !important;
          }

          /* Strict isolation of editor & preview on mobile */
          .links-editor-main-col.hide-on-mobile {
            display: none !important;
          }
          .links-preview-col.hide-on-mobile {
            display: none !important;
          }
          .links-preview-col:not(.hide-on-mobile) {
            display: flex !important;
            width: 100% !important;
            border-left: none !important;
          }
          .links-editor-main-col:not(.hide-on-mobile) {
            display: flex !important;
            width: 100% !important;
          }
        }

        @media (min-width: 768px) {
          .cms-mobile-toggle-btn {
            display: none !important;
          }
          .cms-mobile-preview-switcher {
            display: none !important;
          }
          .cms-mobile-quick-open-btn {
            display: none !important;
          }
        }
      `}</style>

      <MediaGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => { setIsGalleryModalOpen(false); setGalleryCallback(null); }}
        onSelect={(url) => {
          if (galleryCallback) galleryCallback(url);
          setIsGalleryModalOpen(false);
          setGalleryCallback(null);
        }}
      />
    </div>
  );
};

export default LinksStudio;
