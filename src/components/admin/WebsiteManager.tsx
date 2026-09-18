import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Globe, Navigation, Image as ImageIcon, Star, User, Palette, Cloud, Search,
  Plus, Trash2, GripVertical, Edit3, ChevronDown, ChevronUp, Check, X,
  Upload, Loader2, Link2, AlignLeft, ToggleLeft, ToggleRight, RefreshCw,
  CheckCircle2, AlertCircle, ExternalLink, Monitor, Smartphone, Tablet, Save, Tag, Menu, MessageSquare, Settings, AlignRight, Sun, Moon,
  ChevronLeft, ChevronRight, FileText, Store, LayoutDashboard, Workflow,
  Wand2, Sparkles, PenTool, Layout, Briefcase, Code, Coffee, Camera, Compass, Home, Zap, Award, Trophy, Info,
  Download, UploadCloud, RotateCcw, Copy, Sliders, ShieldCheck, Layers, Eye, EyeOff, Maximize2, Minimize2, Bookmark,
  MessageCircle, MoreVertical
} from 'lucide-react';
import BlogManager from './BlogManager';
import CatalogManager from './CatalogManager';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { DEFAULT_MAIN_WEBSITE_DATA, type MainWebsiteData } from '../landing/useLandingData';
import { DEFAULT_CONCIERGE_SETTINGS, type ConciergeSettings } from '../chat/LiveChatWidget';
import CustomProjectModal from './CustomProjectModal';
import MediaGalleryModal from './MediaGalleryModal';
import GlassColorPicker from './GlassColorPicker';
import GlassSelect from './GlassSelect';
import InfoTooltip from './InfoTooltip';
import PageHeroHeader from '../common/PageHeroHeader';
import { OFFLINE_WEBSITE_TEMPLATES, buildOfflineWebsite, OFFLINE_PAGE_HEADER_TEMPLATES, buildOfflinePageHeader, type OfflineWebsiteTemplate, type OfflinePageHeaderPreset } from '../../utils/offlineTemplates';
import { 
  getCustomWebsiteTemplates, 
  saveCustomWebsiteTemplate, 
  deleteCustomWebsiteTemplate, 
  getCustomWebsiteCategories, 
  addCustomWebsiteCategory 
} from '../../utils/customTemplatesStorage';
import CustomDropdown from './CustomDropdown';
import { generateAiWebsite, generateAiPageHeader } from '../../utils/ai';
import { haptic } from '../../utils/haptics';
import { applyAccentColor } from '../../utils/theme';

const WEBSITE_ICON_MAP: Record<string, React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  PenTool,
  Layout,
  Briefcase,
  Code,
  Store,
  Coffee,
  Camera,
  Compass,
  Home,
  Globe,
  Sparkles,
  Zap,
  Award,
  Trophy,
  Layers,
  Palette,
  User,
  Search,
  MessageSquare
};

// ── Types ──────────────────────────────────────────────────────────────────────
interface NavItem {
  id: string;
  type: 'link' | 'dropdown';
  label: string;
  url?: string;
  children?: { id: string; label: string; url: string }[];
}

interface ProjectData {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  coverImage?: string;
  images?: string[];
  featuredLabel?: string;
  description?: string;
}

// Curated Theme Presets (24 Variasi Tema Estetik & Modern)
const THEME_PALETTES = [
  // Ungu & Indigo
  { id: 'purple', name: 'Velvet Purple', color: '#7c3aed', desc: 'Kreatif' },
  { id: 'indigo', name: 'Royal Indigo', color: '#6366f1', desc: 'Elegan' },
  { id: 'violet', name: 'Midnight Violet', color: '#9333ea', desc: 'Artistik' },
  { id: 'lavender', name: 'Lavender Dream', color: '#a855f7', desc: 'Lembut' },

  // Biru & Cyan
  { id: 'sky', name: 'Ocean Sky', color: '#0ea5e9', desc: 'Modern' },
  { id: 'blue', name: 'Electric Blue', color: '#2563eb', desc: 'Profesional' },
  { id: 'cyan', name: 'Cyber Cyan', color: '#06b6d4', desc: 'Futuristik' },
  { id: 'teal', name: 'Teal Lagoon', color: '#0d9488', desc: 'Sejuk' },

  // Hijau & Lime
  { id: 'emerald', name: 'Emerald Oasis', color: '#10b981', desc: 'Segar' },
  { id: 'mint', name: 'Mint Jade', color: '#059669', desc: 'Harmonis' },
  { id: 'lime', name: 'Neon Lime', color: '#84cc16', desc: 'Enerjik' },
  { id: 'forest', name: 'Nordic Forest', color: '#15803d', desc: 'Alami' },

  // Merah, Pink & Rose
  { id: 'rose', name: 'Rose Gold', color: '#ec4899', desc: 'Mewah' },
  { id: 'ruby', name: 'Crimson Ruby', color: '#e11d48', desc: 'Berani' },
  { id: 'coral', name: 'Coral Punch', color: '#f43f5e', desc: 'Ceria' },
  { id: 'sakura', name: 'Sakura Pink', color: '#f472b6', desc: 'Anggun' },

  // Kuning, Orange & Amber
  { id: 'amber', name: 'Sunset Amber', color: '#f59e0b', desc: 'Hangat' },
  { id: 'orange', name: 'Deep Orange', color: '#ea580c', desc: 'Dinamis' },
  { id: 'bronze', name: 'Golden Bronze', color: '#d97706', desc: 'Klasik' },
  { id: 'sunflower', name: 'Sunflower Yellow', color: '#eab308', desc: 'Cerah' },

  // Netral, Slate & Dark
  { id: 'slate', name: 'Slate Minimal', color: '#64748b', desc: 'Bersih' },
  { id: 'obsidian', name: 'Dark Obsidian', color: '#334155', desc: 'Maskulin' },
  { id: 'zinc', name: 'Titanium Zinc', color: '#71717a', desc: 'Futuris' },
  { id: 'charcoal', name: 'Midnight Charcoal', color: '#1e293b', desc: 'Eksklusif' }
];

// ── Deep merge ─────────────────────────────────────────────────────────────────
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] !== null && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      (result as any)[key] = deepMerge((target as any)[key], (source as any)[key]);
    } else if (source[key] !== undefined) {
      (result as any)[key] = source[key];
    }
  }
  return result;
}

// ── Reusable sub-components ────────────────────────────────────────────────────
const FormField: React.FC<{ label: string; hint?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ label, hint, children, style }) => (
  <div style={{ marginBottom: 18, textAlign: 'left', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6, marginBottom: 6 }}>
      <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>{label}</label>
      {hint && <InfoTooltip content={hint} />}
    </div>
    <div>
      {children}
    </div>
  </div>
);

const CmsInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      width: '100%',
      padding: '10px 14px',
      background: 'var(--cms-input-bg, var(--cms-card-bg))',
      border: '1.5px solid var(--glass-border)',
      borderRadius: 10,
      color: 'var(--cms-text)',
      fontFamily: "'Inter', sans-serif",
      fontSize: 13.5,
      outline: 'none',
      boxSizing: 'border-box',
      textAlign: 'left',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      ...props.style,
    }}
    onFocus={(e) => { e.target.style.borderColor = 'var(--cms-accent)'; if (props.onFocus) props.onFocus(e); }}
    onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; if (props.onBlur) props.onBlur(e); }}
  />
);

const CmsTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    style={{
      width: '100%',
      padding: '10px 14px',
      background: 'var(--cms-input-bg, var(--cms-card-bg))',
      border: '1.5px solid var(--glass-border)',
      borderRadius: 10,
      color: 'var(--cms-text)',
      fontFamily: "'Inter', sans-serif",
      fontSize: 13.5,
      outline: 'none',
      boxSizing: 'border-box',
      resize: 'vertical',
      minHeight: 90,
      textAlign: 'left',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      ...props.style,
    }}
    onFocus={(e) => { e.target.style.borderColor = 'var(--cms-accent)'; if (props.onFocus) props.onFocus(e); }}
    onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; if (props.onBlur) props.onBlur(e); }}
  />
);

// ── Image Uploader ─────────────────────────────────────────────────────────────
const ImageUploader: React.FC<{
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  aspectRatio?: string;
}> = ({ value, onChange, label = 'Upload Gambar', hint, aspectRatio = '16/9' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'image');
      if (result?.url) onChange(result.url);
    } catch (err: any) {
      setError(err.message || 'Upload gagal');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6, marginBottom: 8 }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>{label}</div>
        {hint && <InfoTooltip content={hint} />}
      </div>
      <div
        style={{
          border: `2px dashed var(--glass-border)`,
          borderRadius: 14,
          overflow: 'hidden',
          background: 'var(--cms-card-bg)',
          position: 'relative',
          aspectRatio,
          maxHeight: 220,
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--cms-accent)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; }}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 2 }}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsGalleryOpen(true); }}
                style={{
                  height: 28, padding: '0 10px', borderRadius: 14,
                  background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', fontSize: 11, fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
                title="Ganti Gambar dari Galeri"
              >
                <ImageIcon size={12} /> <span>Galeri</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Hapus Gambar"
              >
                <X size={14} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6, color: 'var(--cms-text-muted)', padding: 12 }}>
            {isUploading ? (
              <><Loader2 size={20} className="cms-spin" style={{ color: 'var(--cms-accent)' }} /><span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: 'var(--cms-accent)' }}>Mengunggah...</span></>
            ) : (
              <>
                <Upload size={20} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, textAlign: 'center', lineHeight: 1.3 }}>
                  {label}<br /><span style={{ fontSize: 10, opacity: 0.7 }}>Klik atau seret gambar</span>
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsGalleryOpen(true); }}
                  style={{
                    marginTop: 2, height: 24, padding: '0 12px', borderRadius: 100,
                    background: 'var(--cms-accent)', border: 'none', color: '#fff',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center', fontSize: 11, fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                  title="Pilih dari Galeri Media"
                >
                  <ImageIcon size={11} /> <span>Galeri</span>
                </button>
              </>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>

      {error && <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#ef4444', fontFamily: "'Inter', sans-serif" }}>{error}</p>}

      <MediaGalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setIsGalleryOpen(false);
        }}
      />
    </div>
  );
};

// ── Icon Picker ────────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
  { id: 'Image', icon: <ImageIcon size={18} /> },
  { id: 'PenTool', icon: <Edit3 size={18} /> },
  { id: 'Video', icon: <Monitor size={18} /> },
  { id: 'Cpu', icon: <Globe size={18} /> },
  { id: 'Star', icon: <Star size={18} /> },
  { id: 'Layers', icon: <Layers size={18} /> },
  { id: 'Palette', icon: <Palette size={18} /> },
  { id: 'Monitor', icon: <Monitor size={18} /> },
  { id: 'Package', icon: <CheckCircle2 size={18} /> },
  { id: 'Layout', icon: <Layout size={18} /> },
  { id: 'Code2', icon: <Code size={18} /> },
  { id: 'Award', icon: <Award size={18} /> },
  { id: 'Trophy', icon: <Trophy size={18} /> },
  { id: 'User', icon: <User size={18} /> },
  { id: 'Search', icon: <Search size={18} /> },
  { id: 'Cloud', icon: <Cloud size={18} /> },
  { id: 'Link2', icon: <Link2 size={18} /> },
  { id: 'Smartphone', icon: <Smartphone size={18} /> },
  { id: 'Tag', icon: <Tag size={18} /> },
  { id: 'MessageSquare', icon: <MessageSquare size={18} /> },
  { id: 'Settings', icon: <Settings size={18} /> },
  { id: 'Check', icon: <Check size={18} /> },
  { id: 'ExternalLink', icon: <ExternalLink size={18} /> },
  { id: 'AlertCircle', icon: <AlertCircle size={18} /> },
];

const IconPicker: React.FC<{ value: string; onChange: (val: string) => void; label?: string; hint?: string }> = ({ value, onChange, label, hint }) => {
  const isCustomSvg = value && value.startsWith('http');
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean }>({ top: 0, left: 0, width: 0, openUp: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClose = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      if (popupRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('touchstart', handleClose);
    window.addEventListener('scroll', handleClose, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('touchstart', handleClose);
      window.removeEventListener('scroll', handleClose, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const popupHeight = 260;
      const openUp = spaceBelow < popupHeight + 10 && rect.top > popupHeight + 10;
      
      const popupWidth = Math.min(340, window.innerWidth - 24);
      let calculatedLeft = rect.left;
      if (calculatedLeft + popupWidth > window.innerWidth - 12) {
        calculatedLeft = window.innerWidth - popupWidth - 12;
      }
      if (calculatedLeft < 12) calculatedLeft = 12;

      setCoords({
        top: openUp ? (rect.top - popupHeight - 8) : (rect.bottom + 8),
        left: calculatedLeft,
        width: popupWidth,
        openUp
      });
    }
  }, [isOpen]);

  const selectedOpt = ICON_OPTIONS.find(o => o.id === value);

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    height: 42,
    padding: '0 14px',
    background: 'var(--cms-input-bg, var(--glass-bg))',
    border: isOpen ? '1.5px solid var(--cms-accent)' : '1.5px solid var(--glass-border)',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--cms-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const dropdownModal = isOpen ? (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: '75vh',
        overflowY: 'auto',
        background: 'var(--cms-panel-bg, #1e293b)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: 14,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        zIndex: 999999,
        padding: '14px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))', gap: 6 }}>
        {ICON_OPTIONS.map((opt) => {
          const isSel = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setIsOpen(false); }}
              title={opt.id}
              style={{
                width: 38, height: 38, borderRadius: 8, border: 'none',
                background: isSel ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                color: isSel ? '#fff' : 'var(--cms-text)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.1s'
              }}
            >
              {opt.icon}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6, marginBottom: 6 }}>
          <label style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>{label}</label>
          {hint && <InfoTooltip content={hint} />}
        </div>
      )}
      
      <button type="button" onClick={() => setIsOpen(!isOpen)} style={triggerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
          {isCustomSvg ? <img src={value} alt="icon" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} /> : <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--cms-accent)' }}>{selectedOpt?.icon || <Star size={18} />}</span>}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12.5 }}>{isCustomSvg ? 'Custom SVG' : selectedOpt?.id || 'Pilih Ikon'}</span>
        </div>
        <ChevronDown size={15} style={{ transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.6, flexShrink: 0, marginLeft: 6 }} />
      </button>

      {typeof document !== 'undefined' && createPortal(dropdownModal, document.body)}
    </div>
  );
};

// ── Tab keys ──────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'hero_profile' | 'portfolio' | 'global_settings' | 'blog' | 'catalog';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; tooltip: string }[] = [
  { key: 'overview', label: 'Menu Utama', icon: <LayoutDashboard size={16} />, tooltip: 'Pusat ringkasan dan kendali seluruh menu website' },
  { key: 'hero_profile', label: 'Profil Utama', icon: <User size={16} />, tooltip: 'Pengaturan hero banner, headline nama, foto dan bio' },
  { key: 'portfolio', label: 'Kurasi Karya', icon: <Star size={16} />, tooltip: 'Manajemen proyek karya dan portofolio' },
  { key: 'blog', label: 'Blog & Artikel', icon: <FileText size={16} />, tooltip: 'Kelola publikasi tulisan dan postingan artikel' },
  { key: 'catalog', label: 'Katalog / Shop', icon: <Store size={16} />, tooltip: 'Daftar produk, paket layanan dan transaksi' },
  { key: 'global_settings', label: 'Seting Global', icon: <Settings size={16} />, tooltip: 'Tema warna, SEO, navigasi, footer dan cadangan JSON' },
];

// ── WebsiteManager Component ───────────────────────────────────────────────────
interface WebsiteManagerProps {
  notify: (msg: string, type?: string) => void;
  confirm: (msg: string, onConfirm: () => void) => void;
}

const WebsiteManager: React.FC<WebsiteManagerProps> = ({ notify, confirm }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  // DEFAULT TAB IS ALWAYS 'overview' (Menu Utama) FOR BOTH DESKTOP & MOBILE
  const defaultTab: TabKey = (pathParts.includes('portfolio') || pathParts.includes('karya'))
    ? 'portfolio'
    : (pathParts.includes('catalog') || pathParts.includes('katalog'))
    ? 'catalog'
    : (pathParts.includes('blog'))
    ? 'blog'
    : (pathParts.length > 2 && pathParts[1] === 'website')
    ? (pathParts[2] as TabKey)
    : 'overview';
  const initialTab = defaultTab;
  const initialSub = (pathParts.length > 3 && pathParts[1] === 'website') ? pathParts[3] : null;
  
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.find(t => t.key === initialTab) ? initialTab : defaultTab
  );
  
  const [activeGlobalSetting, setActiveGlobalSetting] = useState<string | null>(
    initialTab === 'global_settings' ? initialSub : null
  );
  const [activeHeroSetting, setActiveHeroSetting] = useState<string | null>(
    initialTab === 'hero_profile' ? initialSub : null
  );

  const [data, setData] = useState<MainWebsiteData>(DEFAULT_MAIN_WEBSITE_DATA);
  const [conciergeSettings, setConciergeSettings] = useState<ConciergeSettings>(DEFAULT_CONCIERGE_SETTINGS);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'local' | 'synced' | 'syncing' | 'error'>('local');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isTablet, setIsTablet] = useState(() => typeof window !== 'undefined' ? (window.innerWidth > 768 && window.innerWidth <= 1240) : false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 768);
      setIsTablet(w > 768 && w <= 1240);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Search in settings
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('');
  const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false);
  const [isMobileActionMenuOpen, setIsMobileActionMenuOpen] = useState(false);

  // Live Interactive Preview State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // SEO Scorecard State
  const [googlePreviewDevice, setGooglePreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // State: AI & Offline Website Template Generator
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [websiteGenMode, setWebsiteGenMode] = useState<'offline' | 'ai'>('offline');
  const [aiWebsitePrompt, setAiWebsitePrompt] = useState('Buatkan website portofolio desainer grafis dan branding modern.');
  const [aiWebsiteTemplateType, setAiWebsiteTemplateType] = useState<string>('graphic_brand_designer');
  const [aiWebsiteCategoryFilter, setAiWebsiteCategoryFilter] = useState<string>('all');
  const [aiWebsiteSearchQuery, setAiWebsiteSearchQuery] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // ── CUSTOM WEBSITE TEMPLATES & CATEGORIES STATE ──
  const [customWebsiteTemplates, setCustomWebsiteTemplates] = useState<OfflineWebsiteTemplate[]>(() => getCustomWebsiteTemplates());
  const [customWebsiteCategories, setCustomWebsiteCategories] = useState(() => getCustomWebsiteCategories());
  const [isCreatingCustomTemplate, setIsCreatingCustomTemplate] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    label: '',
    category: 'creative',
    newCategoryInput: '',
    headline: '',
    tagline: '',
    bio: '',
    accentColor: '#7c3aed',
    skills: ''
  });

  const handleSaveNewCustomTemplate = () => {
    if (!newTemplateForm.label.trim()) {
      alert('Nama template harus diisi!');
      return;
    }

    let finalCategory = newTemplateForm.category;
    if (newTemplateForm.newCategoryInput.trim()) {
      const added = addCustomWebsiteCategory(newTemplateForm.newCategoryInput.trim());
      setCustomWebsiteCategories(added);
      finalCategory = newTemplateForm.newCategoryInput.trim().toLowerCase().replace(/\s+/g, '_');
    }

    const skillsList = newTemplateForm.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newTemplate: OfflineWebsiteTemplate = {
      id: `custom_web_${Date.now()}`,
      label: newTemplateForm.label.trim(),
      category: finalCategory as any,
      icon: 'Globe',
      title: newTemplateForm.headline.trim() || newTemplateForm.label.trim(),
      tagline: newTemplateForm.tagline.trim() || 'Website Portofolio Profesional',
      bio: newTemplateForm.bio.trim() || 'Template profil kustom yang dirancang rapi.',
      theme: {
        accentColor: newTemplateForm.accentColor || '#7c3aed',
        fontFamily: 'Outfit',
        layoutStyle: 'modern'
      },
      hero: {
        headline: newTemplateForm.headline.trim() || newTemplateForm.label.trim(),
        tagline: newTemplateForm.tagline.trim() || 'Website Portofolio Profesional',
        bio: newTemplateForm.bio.trim() || 'Template profil kustom yang dirancang rapi.',
        ctaPrimaryText: 'Lihat Portofolio',
        ctaSecondaryText: 'Hubungi Saya'
      },
      profile: {
        avatarUrl: '',
        skills: skillsList.map((sk, i) => ({ id: `sk_${i}`, name: sk, category: 'General', level: 90 }))
      },
      features: []
    };

    const updated = saveCustomWebsiteTemplate(newTemplate);
    setCustomWebsiteTemplates(updated);
    setAiWebsiteTemplateType(newTemplate.id);
    setIsCreatingCustomTemplate(false);
    setNewTemplateForm({
      label: '',
      category: 'creative',
      newCategoryInput: '',
      headline: '',
      tagline: '',
      bio: '',
      accentColor: '#7c3aed',
      skills: ''
    });
  };

  const handleDeleteCustomTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteCustomWebsiteTemplate(id);
    setCustomWebsiteTemplates(updated);
    if (aiWebsiteTemplateType === id) {
      setAiWebsiteTemplateType(OFFLINE_WEBSITE_TEMPLATES[0]?.id || '');
    }
  };

  const handleSaveActiveWebsiteAsTemplate = () => {
    const hero = data.hero || DEFAULT_MAIN_WEBSITE_DATA.hero;
    const theme = data.theme || DEFAULT_MAIN_WEBSITE_DATA.theme;
    const newTemplate: OfflineWebsiteTemplate = {
      id: `custom_web_from_active_${Date.now()}`,
      label: hero.headline || 'Website Portofolio Saya',
      category: 'creative',
      icon: 'Globe',
      title: hero.headline || 'Website Portofolio',
      tagline: hero.tagline || '',
      bio: hero.bio || '',
      theme: {
        accentColor: theme.accentColor || '#7c3aed',
        fontFamily: theme.fontFamily || 'Outfit',
        layoutStyle: theme.layoutStyle || 'modern'
      },
      hero: {
        headline: hero.headline || '',
        tagline: hero.tagline || '',
        bio: hero.bio || '',
        ctaPrimaryText: hero.ctaPrimaryText || 'Lihat Portofolio',
        ctaSecondaryText: hero.ctaSecondaryText || 'Hubungi Saya'
      },
      profile: {
        avatarUrl: data.profile?.avatarUrl || '',
        skills: data.profile?.skills || []
      },
      features: data.features || []
    };
    const updated = saveCustomWebsiteTemplate(newTemplate);
    setCustomWebsiteTemplates(updated);
    alert('Konfigurasi website aktif berhasil disimpan sebagai Template! ⭐');
  };

  // State: Page Hero Header AI & Offline Presets
  const [selectedHeaderPage, setSelectedHeaderPage] = useState<'blog' | 'portfolio' | 'catalog' | 'about' | 'links'>('blog');
  const [isHeaderAiGenerating, setIsHeaderAiGenerating] = useState(false);
  const [headerCustomPrompt, setHeaderCustomPrompt] = useState('');

  // Backup / JSON Import Ref
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // Skill tag input
  const [labelInput, setLabelInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');

  // Featured projects multi-select
  const [showCustomProjectModal, setShowCustomProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const update = useCallback(<K extends keyof MainWebsiteData>(section: K, patch: Partial<MainWebsiteData[K]>) => {
    setData((prev) => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && !Array.isArray(prev[section])
        ? { ...(prev[section] as object), ...(patch as object) }
        : patch,
    }));
    setIsDirty(true);
  }, []);

  // Change Tab Callback
  const changeTab = useCallback((tab: TabKey, subSetting: string | null = null) => {
    setActiveTab(tab);
    if (tab === 'global_settings') {
      setActiveGlobalSetting(subSetting);
    } else if (tab === 'hero_profile') {
      setActiveHeroSetting(subSetting);
    } else {
      setActiveGlobalSetting(null);
      setActiveHeroSetting(null);
    }

    let targetPath = `/admin/website/${tab}`;
    if (tab === 'global_settings' && subSetting) {
      targetPath = `/admin/website/global_settings/${subSetting}`;
    } else if (tab === 'hero_profile' && subSetting) {
      targetPath = `/admin/website/hero_profile/${subSetting}`;
    }

    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleTabEvent = (e: any) => {
      const tab = e?.detail?.tab;
      if (tab && TABS.some(t => t.key === tab)) {
        changeTab(tab);
      }
    };
    window.addEventListener('cms_website_change_tab', handleTabEvent);
    return () => window.removeEventListener('cms_website_change_tab', handleTabEvent);
  }, [changeTab]);

  // Sync state when browser URL changes
  useEffect(() => {
    if (!location.pathname.startsWith('/admin/website')) return;

    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 1 && parts[1] === 'website') {
      const urlTab = (parts[2] as TabKey) || defaultTab;
      const urlSub = parts[3] || null;
      if (TABS.some(t => t.key === urlTab)) {
        setActiveTab(prev => prev !== urlTab ? urlTab : prev);
      }
      if (urlTab === 'global_settings') {
        setActiveGlobalSetting(prev => prev !== urlSub ? urlSub : prev);
      } else if (urlTab === 'hero_profile') {
        setActiveHeroSetting(prev => prev !== urlSub ? urlSub : prev);
      } else {
        setActiveGlobalSetting(null);
        setActiveHeroSetting(null);
      }
    }
  }, [location.pathname, defaultTab]);
  
  // Broadcast activeTab so CmsDashboard can update its global nav
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('cms_website_tab_change', { detail: activeTab }));
  }, [activeTab]);

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        let prjs = await storage.getItem('porto_portfolio', null);
        if (prjs === null) {
          const legacy = await storage.getItem('porto_projects', []);
          const portfolioOnly = legacy.filter((p: any) => p.id && p.id.startsWith('prj_'));
          const pmOnly = legacy.filter((p: any) => p.id && p.id.startsWith('proj_'));
          
          if (portfolioOnly.length > 0 || pmOnly.length > 0) {
            await storage.setItem('porto_portfolio', portfolioOnly);
            await storage.setItem('porto_projects', pmOnly);
            prjs = portfolioOnly;
          } else {
            prjs = [];
          }
        }
        
        const [saved, globalSettings, savedConcierge] = await Promise.all([
          storage.getItem('porto_main_website', null),
          storage.getItem('porto_settings', {}),
          storage.getItem('porto_concierge_settings', null)
        ]);

        if (!isMounted) return;
        
        if (savedConcierge) {
          setConciergeSettings({ ...DEFAULT_CONCIERGE_SETTINGS, ...savedConcierge });
        }
        
        let initialData = DEFAULT_MAIN_WEBSITE_DATA;
        if (saved) initialData = deepMerge(DEFAULT_MAIN_WEBSITE_DATA, saved);

        // Ensure accent color is properly resolved and applied
        const savedAccent = localStorage.getItem('porto_accent_color') || initialData.theme?.accentColor || globalSettings?.accentColor || '#7c3aed';
        initialData.theme = { ...initialData.theme, accentColor: savedAccent };
        applyAccentColor(savedAccent);

        setData(initialData);
        setProjects(Array.isArray(prjs) ? prjs : []);
      } catch (err) {
        console.error('[WebsiteManager] Load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-save to local IndexedDB on change (debounced 1.2s)
  useEffect(() => {
    if (isLoading || !isDirty) return;
    const t = setTimeout(async () => {
      try {
        await storage.setItem('porto_main_website', data, false);
        setIsDirty(false);
      } catch (err) {
        console.error('[WebsiteManager] Auto-save failed:', err);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [data, isLoading, isDirty]);

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await storage.setItem('porto_main_website', data);
      
      // Also ensure accentColor is synced to porto_settings
      if (data.theme?.accentColor) {
        const currentSettings = await storage.getItem('porto_settings', {}) || {};
        await storage.setItem('porto_settings', { ...currentSettings, accentColor: data.theme.accentColor }, false);
        applyAccentColor(data.theme.accentColor);
      }

      window.dispatchEvent(new CustomEvent('landing_data_updated', { detail: data }));
      window.dispatchEvent(new CustomEvent('porto_settings_updated', { detail: { settings: data } }));
      notify('✅ Website tersimpan ke database');
      setIsDirty(false);
    } catch (err: any) {
      notify('❌ Gagal menyimpan: ' + err.message, 'error');
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  // Keyboard Shortcuts (Ctrl+S, Esc, /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        if (isPreviewModalOpen) setIsPreviewModalOpen(false);
        else if (isTemplateModalOpen) setIsTemplateModalOpen(false);
        else if (activeGlobalSetting) changeTab('global_settings', null);
        else if (activeHeroSetting) changeTab('hero_profile', null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, isPreviewModalOpen, isTemplateModalOpen, activeGlobalSetting, activeHeroSetting, changeTab]);

  // Sync to Cloud
  const handleSyncToCloud = async () => {
    setSyncStatus('syncing');
    try {
      await storage.setItem('porto_main_website', { ...data, sync: { ...data.sync, lastSyncAt: new Date().toISOString(), status: 'synced' } });
      const now = new Date().toLocaleString('id-ID');
      setLastSyncTime(now);
      setSyncStatus('synced');
      update('sync', { lastSyncAt: new Date().toISOString(), status: 'synced' });
      notify('☁️ Berhasil disinkronkan ke cloud');
    } catch (err: any) {
      setSyncStatus('error');
      notify('❌ Sinkronisasi gagal: ' + err.message, 'error');
    }
  };

  // Theme Accent Switcher with Full Persistence
  const handleApplyThemeAccent = async (color: string) => {
    update('theme', { accentColor: color });
    try {
      applyAccentColor(color);
      localStorage.setItem('porto_accent_color', color);
      
      // Update both database keys so it NEVER reverts back
      await storage.setItem('porto_main_website', { ...data, theme: { ...data.theme, accentColor: color } }, true);
      const currentSettings = await storage.getItem('porto_settings', {}) || {};
      await storage.setItem('porto_settings', { ...currentSettings, accentColor: color }, true);

      window.dispatchEvent(new CustomEvent('porto_accent_color_changed', { detail: { color } }));
      window.dispatchEvent(new CustomEvent('porto_settings_updated', { detail: { settings: { ...data, theme: { ...data.theme, accentColor: color } } } }));
    } catch (_) {}
    notify(`🎨 Warna aksen diubah ke ${color}`);
  };

  // JSON Export / Backup
  const handleExportJson = () => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `website_config_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('📥 Cadangan konfigurasi JSON berhasil diunduh!');
    } catch (err: any) {
      notify('Gagal mengekspor file: ' + err.message, 'error');
    }
  };

  // JSON Import / Restore
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object') throw new Error('Format JSON tidak valid.');

        confirm('Terapkan dan pulihkan data dari file JSON cadangan ini? Data saat ini akan diperbarui.', async () => {
          const merged = deepMerge(DEFAULT_MAIN_WEBSITE_DATA, parsed);
          await storage.setItem('porto_main_website', merged);
          setData(merged);
          setIsDirty(false);
          if (merged.theme?.accentColor) {
            handleApplyThemeAccent(merged.theme.accentColor);
          }
          window.dispatchEvent(new CustomEvent('landing_data_updated', { detail: merged }));
          notify('✅ Konfigurasi website berhasil dipulihkan dari JSON!');
        });
      } catch (err: any) {
        notify('❌ Gagal memuat JSON: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Selective Reset Handlers
  const handleResetSection = (sectionName: string, resetFn: () => void) => {
    confirm(`Anda yakin ingin mereset bagian "${sectionName}" kembali ke pengaturan awal pabrik?`, () => {
      resetFn();
      notify(`🔄 Bagian "${sectionName}" berhasil direset ke standar.`);
    });
  };

  // AI SEO Auto-Generator
  const handleGenerateAiSeo = () => {
    const titleSuggestion = `${data.hero.headline || 'Arif'} — ${data.hero.subheadline || 'Desainer Grafis Profesional'}`;
    const descSuggestion = `${data.profile.bio || data.hero.description || 'Portofolio karya desainer grafis profesional, branding identitas, kemasan produk, dan solusi desain kreatif.'}`;
    
    update('seo', {
      metaTitle: titleSuggestion.slice(0, 68),
      metaDescription: descSuggestion.slice(0, 155),
      ogImage: data.hero.heroImage || data.profile.image || data.seo.ogImage
    });
    notify('✨ SEO & Metadata dioptimasi dari profil utama!');
  };

  // SEO Score Calculator
  const seoScore = useMemo(() => {
    let score = 0;
    const titleLen = data.seo?.metaTitle?.length || 0;
    const descLen = data.seo?.metaDescription?.length || 0;
    const hasOg = Boolean(data.seo?.ogImage);

    if (titleLen >= 35 && titleLen <= 65) score += 35;
    else if (titleLen > 10) score += 20;

    if (descLen >= 100 && descLen <= 165) score += 35;
    else if (descLen > 25) score += 20;

    if (hasOg) score += 30;

    return Math.min(100, score);
  }, [data.seo]);

  // Nav Item helpers
  const addNavItem = (type: 'link' | 'dropdown') => {
    const newItem: NavItem = type === 'link'
      ? { id: `nav-${Date.now()}`, type: 'link', label: 'Menu Baru', url: '#' }
      : { id: `nav-${Date.now()}`, type: 'dropdown', label: 'Grup Baru', children: [{ id: `nc-${Date.now()}`, label: 'Sub Menu', url: '#' }] };
    update('navbar', { items: [...(data.navbar.items as NavItem[]), newItem] } as any);
  };

  const removeNavItem = (id: string) => {
    update('navbar', { items: (data.navbar.items as NavItem[]).filter((i) => i.id !== id) } as any);
  };

  const updateNavItem = (id: string, patch: Partial<NavItem>) => {
    update('navbar', {
      items: (data.navbar.items as NavItem[]).map((i) => i.id === id ? { ...i, ...patch } : i),
    } as any);
  };

  const addNavChild = (parentId: string) => {
    const newChild = { id: `nc-${Date.now()}`, label: 'Sub Menu', url: '#' };
    update('navbar', {
      items: (data.navbar.items as NavItem[]).map((i) =>
        i.id === parentId ? { ...i, children: [...(i.children || []), newChild] } : i
      ),
    } as any);
  };

  const removeNavChild = (parentId: string, childId: string) => {
    update('navbar', {
      items: (data.navbar.items as NavItem[]).map((i) =>
        i.id === parentId ? { ...i, children: (i.children || []).filter((c) => c.id !== childId) } : i
      ),
    } as any);
  };

  const updateNavChild = (parentId: string, childId: string, patch: { label?: string; url?: string }) => {
    update('navbar', {
      items: (data.navbar.items as NavItem[]).map((i) =>
        i.id === parentId ? { ...i, children: (i.children || []).map((c) => c.id === childId ? { ...c, ...patch } : c) } : i
      ),
    } as any);
  };

  const moveNavItem = (id: string, dir: 'up' | 'down') => {
    const items = [...(data.navbar.items as NavItem[])];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    update('navbar', { items } as any);
  };

  // Header AI & Offline Presets
  const handleGenerateHeaderAi = async (pageKey: string) => {
    setIsHeaderAiGenerating(true);
    try {
      const current = data.pagesHeader?.[pageKey as keyof typeof data.pagesHeader] || DEFAULT_MAIN_WEBSITE_DATA.pagesHeader[pageKey as keyof typeof DEFAULT_MAIN_WEBSITE_DATA.pagesHeader];
      const result = await generateAiPageHeader(pageKey, current, headerCustomPrompt);
      if (result && !result.error && result.title) {
        update('pagesHeader', {
          ...(data.pagesHeader || DEFAULT_MAIN_WEBSITE_DATA.pagesHeader),
          [pageKey]: {
            badge: result.badge || current.badge,
            title: result.title || current.title,
            highlight: result.highlight || current.highlight,
            description: result.description || current.description
          }
        });
        notify('✨ Header halaman berhasil dioptimasi dengan AI!', 'success');
      } else {
        const fallbackPreset = buildOfflinePageHeader(pageKey);
        update('pagesHeader', {
          ...(data.pagesHeader || DEFAULT_MAIN_WEBSITE_DATA.pagesHeader),
          [pageKey]: {
            badge: fallbackPreset.badge,
            title: fallbackPreset.title,
            highlight: fallbackPreset.highlight,
            description: fallbackPreset.description
          }
        });
        notify('⚡ Menggunakan Template Offline Cerdas.', 'info');
      }
    } catch (err: any) {
      const fallbackPreset = buildOfflinePageHeader(pageKey);
      update('pagesHeader', {
        ...(data.pagesHeader || DEFAULT_MAIN_WEBSITE_DATA.pagesHeader),
        [pageKey]: {
          badge: fallbackPreset.badge,
          title: fallbackPreset.title,
          highlight: fallbackPreset.highlight,
          description: fallbackPreset.description
        }
      });
      notify('⚡ Diterapkan dari Preset Cerdas Offline.', 'info');
    } finally {
      setIsHeaderAiGenerating(false);
      setHeaderCustomPrompt('');
    }
  };

  const handleApplyHeaderOfflinePreset = (pageKey: string, presetId: string) => {
    const preset = buildOfflinePageHeader(pageKey, presetId);
    update('pagesHeader', {
      ...(data.pagesHeader || DEFAULT_MAIN_WEBSITE_DATA.pagesHeader),
      [pageKey]: {
        badge: preset.badge,
        title: preset.title,
        highlight: preset.highlight,
        description: preset.description
      }
    });
    notify(`✅ Preset "${preset.label}" berhasil diterapkan!`, 'success');
  };

  const handleSelectAiTemplate = (tmpl: OfflineWebsiteTemplate) => {
    setAiWebsiteTemplateType(tmpl.id);
    if (tmpl.prompt) {
      setAiWebsitePrompt(tmpl.prompt);
    }
  };

  const handleApplyWebsiteTemplate = async () => {
    setAiError('');
    setIsAiGenerating(true);
    try {
      let patch: any = null;
      if (websiteGenMode === 'offline') {
        patch = buildOfflineWebsite(aiWebsiteTemplateType, aiWebsitePrompt);
      } else {
        const result = await generateAiWebsite(aiWebsitePrompt, aiWebsiteTemplateType);
        if (!result || result.error) {
          setAiError(result?.error || 'Gagal menghasilkan website via AI.');
          setIsAiGenerating(false);
          return;
        }
        patch = result;
      }

      if (patch) {
        const updated = deepMerge(data, patch);

        if (patch.theme?.accentColor) {
          handleApplyThemeAccent(patch.theme.accentColor);
        }

        await storage.setItem('porto_main_website', updated);
        setData(updated);
        setIsDirty(false);

        window.dispatchEvent(new CustomEvent('landing_data_updated', { detail: updated }));
        window.dispatchEvent(new CustomEvent('porto_settings_updated', { detail: { settings: updated } }));

        notify(`✅ Template "${patch.hero?.headline || 'Website'}" berhasil diterapkan dan disimpan!`);
        setIsTemplateModalOpen(false);
        changeTab('hero_profile');
      }
    } catch (err: any) {
      console.error('Error applying website template:', err);
      setAiError(err.message || 'Gagal menerapkan template.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Featured project helpers
  const toggleFeatured = (id: string) => {
    const current = data.featuredProjects || [];
    if (current.includes(id)) {
      update('featuredProjects', current.filter((x) => x !== id) as any);
    } else if (current.length < 6) {
      update('featuredProjects', [...current, id] as any);
    } else {
      notify('Maksimal 6 proyek unggulan', 'error');
    }
  };

  const addSkill = () => {
    const id = `sk-${Date.now()}`;
    update('profile', { 
      skills: [...(data.profile.skills || []), { id, name: 'Layanan Baru', description: 'Deskripsi singkat layanan.', icon: 'Star' }] 
    });
  };

  const removeSkill = (id: string) => {
    update('profile', { skills: (data.profile.skills || []).filter((s: any) => s.id !== id) });
  };

  const getProjectDisplay = (p: ProjectData) => p.name || p.title || 'Proyek';
  const getProjectCover = (p: ProjectData): string | null => {
    if (p.coverImage) return p.coverImage;
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    if (Array.isArray(p.attachments)) {
      const img = p.attachments.find((a: any) => a?.type?.startsWith('image/'));
      if (img) return img.url;
    }
    if (p.mediaType === 'youtube' && p.youtubeUrl) {
      const m = p.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
      if (m && m[1]) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
    }
    return null;
  };

  // ── Modul Utama Website (Primary Tabs / Modules) ──
  const mainModulesCategories = [
    {
      id: 'hero_profile',
      tabKey: 'hero_profile' as TabKey,
      title: 'Profil Utama',
      tooltip: 'Pengaturan hero banner, sapaan pembuka, headline nama, foto profil, dan biografi landing page.',
      icon: User,
      color: '#3b82f6',
      badge: 'Landing Page',
      keywords: ['profil', 'hero', 'landing', 'bio', 'nama', 'foto', 'headline']
    },
    {
      id: 'portfolio',
      tabKey: 'portfolio' as TabKey,
      title: 'Kurasi Karya',
      tooltip: 'Manajemen proyek karya unggulan, link demo, dan galeri showcase website.',
      icon: Star,
      color: '#ec4899',
      badge: 'Portofolio',
      keywords: ['portofolio', 'karya', 'proyek', 'galeri', 'showcase', 'project']
    },
    {
      id: 'blog',
      tabKey: 'blog' as TabKey,
      title: 'Blog & Artikel',
      tooltip: 'Tulis postingan baru, manajemen draf, tag kategori, dan format artikel SEO.',
      icon: FileText,
      color: '#8b5cf6',
      badge: 'Artikel & Berita',
      keywords: ['blog', 'artikel', 'post', 'tulisan', 'berita', 'publikasi', 'tulis']
    },
    {
      id: 'catalog',
      tabKey: 'catalog' as TabKey,
      title: 'Katalog & Jasa',
      tooltip: 'Etalase produk digital/fisik, paket layanan jasa, harga, dan sistem order.',
      icon: Store,
      color: '#10b981',
      badge: 'Toko / Jasa',
      keywords: ['katalog', 'produk', 'jasa', 'layanan', 'toko', 'shop', 'order', 'harga']
    },
    {
      id: 'global_settings',
      tabKey: 'global_settings' as TabKey,
      title: 'Seting Global',
      tooltip: 'Palet tema warna visual, SEO Google, navigasi header, footer kontak, dan cadangan JSON.',
      icon: Settings,
      color: '#06b6d4',
      badge: 'Sistem Global',
      keywords: ['sistem', 'pengaturan', 'global', 'seo', 'tema', 'warna', 'footer', 'backup']
    }
  ];

  // ── Halaman Publik & Tautan Spesifik ──
  const publicPagesCategories = [
    {
      id: 'page_headers',
      type: 'sub_tab',
      tabKey: 'global_settings' as TabKey,
      subKey: 'page_headers',
      title: 'Header Halaman',
      tooltip: 'Badge, headline judul, dan deskripsi header semua halaman publik dengan bantuan AI.',
      icon: Sparkles,
      color: '#ec4899',
      badge: 'AI Header',
      keywords: ['header', 'judul', 'badge', 'halaman', 'ai']
    },
    {
      id: 'biodata',
      type: 'route',
      route: '/admin/biodata',
      title: 'Biodata Publik',
      tooltip: 'Kelola informasi biodata publik, riwayat pendidikan/karir, dan link profil lengkap.',
      icon: User,
      color: '#3b82f6',
      badge: 'Halaman Biodata',
      keywords: ['biodata', 'profil', 'data diri', 'riwayat', 'about']
    },
    {
      id: 'links',
      type: 'route',
      route: '/admin/apps',
      title: 'Koleksi Tautan',
      tooltip: 'Kelola halaman tautan cepat gaya Linktree untuk profil media sosial.',
      icon: Link2,
      color: '#10b981',
      badge: 'Bio Link',
      keywords: ['link', 'tautan', 'linktree', 'medsos', 'bio']
    }
  ];

  // CLEAN, CONCISE CATEGORIES (1-4 Words Titles, Tooltips for Detail)
  const globalSettingCategories = [
    { id: 'concierge_chat', title: 'Studio Concierge & Chat', tooltip: 'Pengaturan teks formulir brief proyek, pilihan kategori desain, target waktu, tombol WhatsApp, dan live chat.', icon: MessageCircle, color: '#7c3aed', keywords: ['concierge', 'chat', 'brief', 'live chat', 'kebutuhan', 'layanan', 'konsultasi', 'pesan', 'whatsapp'] },
    { id: 'page_headers', title: 'Header Halaman', tooltip: 'Badge, judul, dan deskripsi header halaman publik (Blog, Portofolio, Katalog, Tentang, Links) dengan bantuan AI.', icon: Sparkles, color: '#ec4899', keywords: ['header', 'judul', 'badge', 'blog', 'portfolio', 'katalog', 'about', 'links', 'ai'] },
    { id: 'theme', title: 'Tema & Warna', tooltip: 'Palet warna aksen visual utama website dan pengaturan mode tampilan.', icon: Palette, color: '#8b5cf6', keywords: ['tema', 'warna', 'accent', 'color', 'palet', 'ungu', 'hijau', 'biru'] },
    { id: 'nav', title: 'Menu Navigasi', tooltip: 'Pengaturan teks logo, tombol login/kontak, dan tautan menu di header navbar.', icon: Navigation, color: '#3b82f6', keywords: ['navigasi', 'navbar', 'menu', 'logo', 'link', 'dropdown'] },
    { id: 'localization', title: 'Lokalisasi Teks', tooltip: 'Kustomisasi judul seksi portofolio, tentang saya, alur proses, dan ajakan bertindak (CTA).', icon: Globe, color: '#10b981', keywords: ['bahasa', 'lokalisasi', 'teks', 'label', 'judul seksi', 'cta'] },
    { id: 'footer', title: 'Footer & Kontak', tooltip: 'Email kontak, lokasi domisili, deskripsi bio footer, hak cipta, dan jejaring sosial.', icon: MessageSquare, color: '#8b5cf6', keywords: ['footer', 'email', 'lokasi', 'sosmed', 'instagram', 'linkedin', 'copyright'] },
    { id: 'project_types', title: 'Opsi Proyek', tooltip: 'Pilihan dropdown jenis proyek yang dapat dipilih calon klien pada form kontak.', icon: Tag, color: '#ec4899', keywords: ['jenis proyek', 'kategori', 'form kontak', 'dropdown', 'layanan'] },
    { id: 'contact_methods', title: 'Kontak Cepat', tooltip: 'Integrasi saluran komunikasi langsung WhatsApp, Telegram, dan Email.', icon: Smartphone, color: '#f59e0b', keywords: ['whatsapp', 'wa', 'telegram', 'email', 'chat'] },
    { id: 'seo', title: 'SEO & Cuplikan', tooltip: 'Meta Title, Description, gambar Open Graph (OG Image), dan audit skor Google real-time.', icon: Search, color: '#06b6d4', keywords: ['seo', 'google', 'meta title', 'meta description', 'og image', 'sosial media', 'score'] },
    { id: 'backup', title: 'Cadangan JSON', tooltip: 'Unduh file cadangan konfigurasi JSON website, pulihkan data, atau reset selektif.', icon: Download, color: '#6366f1', keywords: ['backup', 'cadangan', 'export', 'import', 'ekspor', 'impor', 'json', 'reset'] },
    { id: 'sync', title: 'Status Sinkronisasi', tooltip: 'Status penyimpanan lokal IndexedDB dan sinkronisasi cloud server Firestore.', icon: Cloud, color: '#64748b', keywords: ['sync', 'cloud', 'firestore', 'offline', 'lokal', 'database'] },
  ];

  const heroSettingCategories = [
    { id: 'bio', title: 'Teks & Bio', tooltip: 'Sapaan pembuka, headline nama, profesi, badge ketersediaan, dan biografi profil.', icon: User, color: '#3b82f6', keywords: ['nama', 'headline', 'sapaan', 'profesi', 'bio', 'badge'] },
    { id: 'skills', title: 'Layanan & Keahlian', tooltip: 'Daftar bidang keahlian, paket layanan kreatif, dan toolkit desain/development.', icon: Layers, color: '#10b981', keywords: ['keahlian', 'layanan', 'skills', 'tools', 'desain'] },
    { id: 'cards', title: 'Sorotan & CTA', tooltip: 'Kartu mengambang sorotan hero dan tombol aksi utama (Call to Action).', icon: Star, color: '#8b5cf6', keywords: ['kartu', 'sorotan', 'cta', 'tombol', 'unduh cv'] },
    { id: 'avatar', title: 'Foto Hero', tooltip: 'Foto profil utama di hero banner beresolusi tinggi rasio 4:5.', icon: ImageIcon, color: '#ec4899', keywords: ['foto', 'avatar', 'profil', 'gambar hero'] },
    { id: 'process', title: 'Alur Proses', tooltip: 'Langkah-langkah terstruktur alur pengerjaan proyek dari tahap riset sampai selesai.', icon: Workflow, color: '#f59e0b', keywords: ['proses', 'alur kerja', 'langkah'] },
    { id: 'testimonials', title: 'Testimoni Klien', tooltip: 'Kutipan ulasan dan kepuasan kerja sama dari klien atau mitra bisnis.', icon: MessageSquare, color: '#06b6d4', keywords: ['testimoni', 'ulasan', 'klien', 'review'] },
  ];

  const filteredMainModules = useMemo(() => {
    if (!settingsSearchQuery.trim()) return mainModulesCategories;
    const q = settingsSearchQuery.toLowerCase();
    return mainModulesCategories.filter(cat => 
      cat.title.toLowerCase().includes(q) ||
      cat.tooltip.toLowerCase().includes(q) ||
      cat.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [settingsSearchQuery]);

  const filteredPublicPages = useMemo(() => {
    if (!settingsSearchQuery.trim()) return publicPagesCategories;
    const q = settingsSearchQuery.toLowerCase();
    return publicPagesCategories.filter(cat => 
      cat.title.toLowerCase().includes(q) ||
      cat.tooltip.toLowerCase().includes(q) ||
      cat.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [settingsSearchQuery]);

  const filteredGlobalCategories = useMemo(() => {
    if (!settingsSearchQuery.trim()) return globalSettingCategories;
    const q = settingsSearchQuery.toLowerCase();
    return globalSettingCategories.filter(cat => 
      cat.title.toLowerCase().includes(q) ||
      cat.tooltip.toLowerCase().includes(q) ||
      cat.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [settingsSearchQuery]);

  const filteredHeroCategories = useMemo(() => {
    if (!settingsSearchQuery.trim()) return heroSettingCategories;
    const q = settingsSearchQuery.toLowerCase();
    return heroSettingCategories.filter(cat => 
      cat.title.toLowerCase().includes(q) ||
      cat.tooltip.toLowerCase().includes(q) ||
      cat.keywords.some(k => k.toLowerCase().includes(q))
    );
  }, [settingsSearchQuery]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--cms-text-muted)' }}>
        <Loader2 size={22} className="cms-spin" style={{ color: 'var(--cms-accent)' }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600 }}>Memuat Website Studio...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        minHeight: 0,
        height: '100%',
        background: 'var(--cms-bg)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Right drawer toggle for portfolio in mobile */}
      {(isMobile || isTablet) && activeTab === 'portfolio' && !isSidebarOpen && (
        <button
          onClick={() => setIsRightSidebarOpen(s => !s)}
          title={isRightSidebarOpen ? 'Sembunyikan panel kanan' : 'Tampilkan panel kanan'}
          style={{
            position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)',
            zIndex: 95, width: 26, height: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '1px solid var(--cms-border, var(--glass-border))', borderRight: 'none',
            background: 'var(--cms-card-bg)', backdropFilter: 'blur(12px)',
            borderRadius: '12px 0 0 12px', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            transition: 'all 0.25s', color: 'var(--cms-text-muted)',
          }}
        >
          {isRightSidebarOpen ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}
        </button>
      )}

      {/* ── Sidebar Navigation (Desktop) ── */}
      <div
        className={`wm-sidebar ${isSidebarOpen ? 'open' : ''}`}
        style={{
          width: 255,
          background: 'var(--cms-panel-bg)',
          borderRight: '1.5px solid var(--glass-border)',
          display: (isMobile || isTablet) ? 'none' : 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '14px 12px',
          overflowY: 'auto',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        {/* Sidebar Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 14px 6px', borderBottom: '1px solid var(--glass-border)', marginBottom: 6 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'var(--cms-accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cms-accent)',
            flexShrink: 0
          }}>
            <Globe size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 900, color: 'var(--cms-text)', lineHeight: 1.2 }}>
              Website Studio
            </div>
            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontFamily: "'Inter', sans-serif" }}>
              Landing Page & Tema
            </div>
          </div>
        </div>

        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`wm-tab-${tab.key}`}
              onClick={() => {
                changeTab(tab.key);
                setIsSidebarOpen(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '11px 13px',
                background: isActive ? 'var(--cms-accent)' : 'transparent',
                border: 'none',
                borderRadius: 14,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 6px 16px var(--cms-accent-soft)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--cms-input-bg)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: isActive ? 'rgba(255,255,255,0.22)' : 'var(--cms-accent-soft)',
                color: isActive ? '#fff' : 'var(--cms-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {tab.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: isActive ? '#fff' : 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                  {tab.label}
                </div>
                <InfoTooltip content={tab.tooltip} />
              </div>
            </button>
          );
        })}

        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--cms-switcher-bg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--cms-accent, #7c3aed)' }} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text)' }}>Warna Aksen Global</div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('cms_open_settings_category', { detail: { category: 'branding' } }));
                navigate('/admin/settings/branding');
              }}
              title="Buka Studio Tema di Pengaturan Global"
              style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', cursor: 'pointer', padding: 2 }}
            >
              <Sliders size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        
        {/* ── Unified Responsive Header Navbar (Always rendered across all tabs) ── */}
        <div
          style={{
            height: '52px',
              minHeight: '52px',
              padding: isMobile ? '0 8px' : '0 14px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--cms-panel-bg)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: isMobile ? 6 : 10,
              boxSizing: 'border-box',
              zIndex: 20,
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {/* Left: Tab Title / Back navigation (Icon Only on Mobile to preserve space) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexShrink: 0 }}>
              {activeTab !== 'overview' ? (
                <button
                  onClick={() => changeTab('overview')}
                  title="Kembali ke Menu Utama"
                  style={{
                    width: isMobile ? 30 : 32,
                    height: isMobile ? 30 : 32,
                    minWidth: isMobile ? 30 : 32,
                    minHeight: isMobile ? 30 : 32,
                    aspectRatio: '1 / 1',
                    borderRadius: 9,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
              ) : (
                <div 
                  title="Menu Utama Website"
                  style={{
                    width: isMobile ? 30 : 32,
                    height: isMobile ? 30 : 32,
                    minWidth: isMobile ? 30 : 32,
                    minHeight: isMobile ? 30 : 32,
                    aspectRatio: '1 / 1',
                    borderRadius: 9,
                    background: 'var(--cms-accent-soft)',
                    color: 'var(--cms-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Globe size={16} />
                </div>
              )}

              {!isMobile && (() => {
                const currentTabInfo = TABS.find(t => t.key === activeTab);
                return (
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentTabInfo?.label || 'Website Studio'}
                  </span>
                );
              })()}

              {isDirty && (
                <span 
                  title="Ada perubahan belum disimpan"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: 10.5, color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(245, 158, 11, 0.1)', padding: isMobile ? '2px 5px' : '2px 7px', borderRadius: 99, flexShrink: 0 }}
                >
                  <span className="wm-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
                  {!isMobile && 'Belum Disimpan'}
                </span>
              )}
            </div>

            {/* Center: 6 Sleek Icon-Only Tab Switchers (Guaranteed Never Squished / Penyet) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 2 : 3,
              background: 'var(--cms-input-bg)',
              padding: '3px',
              borderRadius: 100,
              border: '1px solid var(--glass-border)',
              flexShrink: 0
            }}>
              {TABS.map(tab => {
                const isSel = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => changeTab(tab.key)}
                    title={tab.label}
                    style={{
                      width: isMobile ? 26 : 28,
                      height: isMobile ? 26 : 28,
                      minWidth: isMobile ? 26 : 28,
                      minHeight: isMobile ? 26 : 28,
                      aspectRatio: '1 / 1',
                      borderRadius: '50%',
                      border: 'none',
                      background: isSel ? 'var(--cms-accent)' : 'transparent',
                      color: isSel ? '#ffffff' : 'var(--cms-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isSel ? '0 2px 8px var(--cms-accent-soft)' : 'none',
                      transition: 'all 0.15s ease',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    {tab.icon}
                  </button>
                );
              })}
            </div>

            {/* Right: Actions (Single Expandable Button on Mobile, 5 Buttons on Desktop) */}
            {isMobile ? (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* 1 Single Action Trigger on Mobile */}
                <button
                  onClick={() => { setIsMobileActionMenuOpen(!isMobileActionMenuOpen); haptic.light(); }}
                  title="Menu Aksi Website"
                  style={{
                    width: 32,
                    height: 32,
                    minWidth: 32,
                    minHeight: 32,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: isDirty ? 'var(--cms-accent)' : isMobileActionMenuOpen ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                    border: isDirty ? 'none' : '1.5px solid var(--glass-border)',
                    color: (isDirty || isMobileActionMenuOpen) ? '#ffffff' : 'var(--cms-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isDirty ? '0 2px 10px var(--cms-accent-soft)' : 'var(--cms-shadow-sm)',
                    transition: 'all 0.18s ease',
                    padding: 0,
                    flexShrink: 0,
                    position: 'relative'
                  }}
                >
                  {isSaving ? (
                    <Loader2 size={15} className="cms-spin" />
                  ) : isDirty ? (
                    <Save size={15} />
                  ) : isMobileActionMenuOpen ? (
                    <X size={15} />
                  ) : (
                    <MoreVertical size={16} />
                  )}
                  {isDirty && !isSaving && !isMobileActionMenuOpen && (
                    <span style={{ position: 'absolute', top: -1, right: -1, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid #fff' }} />
                  )}
                </button>

                {/* Popover Action Menu (Fixed Overlay: No Blur, No Dimming, Never Clipped) */}
                {isMobileActionMenuOpen && (
                  <>
                    <div 
                      onClick={() => setIsMobileActionMenuOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
                    />
                    <div style={{
                      position: 'fixed',
                      top: '58px',
                      right: '10px',
                      zIndex: 9999,
                      background: 'var(--cms-card-bg)',
                      border: '1.5px solid var(--glass-border)',
                      borderRadius: 18,
                      boxShadow: '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
                      padding: '10px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      minWidth: 215,
                      animation: 'fadeIn 0.15s ease-out'
                    }}>
                      <div style={{ fontSize: 9.5, fontWeight: 900, color: 'var(--cms-text-muted)', padding: '2px 8px 6px', letterSpacing: '0.04em', borderBottom: '1px solid var(--glass-border)', marginBottom: 2 }}>
                        MENU AKSI WEBSITE
                      </div>

                      {/* 1. Simpan Perubahan */}
                      <button
                        onClick={() => { handleSave(); setIsMobileActionMenuOpen(false); }}
                        disabled={isSaving}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 10px',
                          borderRadius: 12,
                          border: 'none',
                          background: isDirty ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                          color: isDirty ? '#ffffff' : 'var(--cms-text)',
                          fontSize: 11.5,
                          fontWeight: 850,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: isDirty ? 'rgba(255,255,255,0.2)' : 'var(--cms-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isSaving ? <Loader2 size={13} className="cms-spin" /> : <Save size={13} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{isSaving ? 'Menyimpan...' : 'Simpan Website'}</span>
                          {isDirty && <span style={{ fontSize: 8.5, opacity: 0.9 }}>Ada perubahan baru</span>}
                        </div>
                      </button>

                      {/* 2. Template & AI */}
                      <button
                        onClick={() => { setIsTemplateModalOpen(true); setIsMobileActionMenuOpen(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Sparkles size={13} />
                        </div>
                        <span>Template & AI Generator</span>
                      </button>

                      {/* 3. Simpan Template Kustom */}
                      <button
                        onClick={() => { handleSaveActiveWebsiteAsTemplate(); setIsMobileActionMenuOpen(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Bookmark size={13} />
                        </div>
                        <span>Simpan sbg Template</span>
                      </button>

                      {/* 4. Pratinjau Live Website */}
                      <button
                        onClick={() => { setIsPreviewModalOpen(true); setIsMobileActionMenuOpen(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Eye size={13} />
                        </div>
                        <span>Pratinjau Live</span>
                      </button>

                      {/* 5. Buka Web Publik */}
                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMobileActionMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          textDecoration: 'none',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ExternalLink size={13} />
                        </div>
                        <span>Buka Web Publik</span>
                      </a>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                {/* 1. Template & AI */}
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  title="Template & AI Generator"
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: 'var(--cms-accent-soft)',
                    border: '1.5px solid rgba(var(--cms-accent-rgb), 0.35)',
                    color: 'var(--cms-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={16} color="var(--cms-accent)" />
                </button>

                {/* 2. Simpan Template Kustom */}
                <button
                  onClick={handleSaveActiveWebsiteAsTemplate}
                  title="Simpan Website Saat Ini Sebagai Template Kustom"
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  <Bookmark size={15} color="#10b981" />
                </button>

                {/* 3. Pratinjau Live Website */}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('cms_open_client_preview', { detail: { page: 'home' } }))}
                  title="Pratinjau Live Website (Multi-Device)"
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: 'var(--cms-card-bg)',
                    border: '1.5px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  <Eye size={16} />
                </button>

                {/* 4. Buka Web Publik */}
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka Web Publik (Tab Baru)"
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: 'var(--cms-switcher-bg)',
                    border: '1.5px solid var(--glass-border)',
                    color: 'var(--cms-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.18s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  <ExternalLink size={15} />
                </a>

                {/* 5. Simpan Perubahan */}
                <button
                  id="wm-save-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                  title={isDirty ? "Ada perubahan belum disimpan — Klik untuk Simpan" : "Simpan Perubahan Website"}
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    minHeight: 34,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: 'var(--cms-accent)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isSaving ? 'wait' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    boxShadow: '0 3px 12px var(--cms-accent-soft)',
                    transition: 'all 0.18s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  {isSaving ? <Loader2 size={15} className="cms-spin" /> : <Save size={16} />}
                </button>
              </div>
            )}
          </div>

          <div
            className={`wm-main-content ${activeTab !== 'blog' ? 'admin-scroll-area' : ''}`}
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              maxWidth: '100%',
              overflowX: 'hidden',
              display: activeTab === 'blog' ? 'flex' : 'block',
              flexDirection: activeTab === 'blog' ? 'column' : undefined,
              padding: activeTab === 'blog' ? 0 : (isMobile ? '16px 14px calc(90px + env(safe-area-inset-bottom, 16px)) 14px' : '24px 28px'),
              overflowY: activeTab === 'blog' ? 'hidden' : 'auto',
              scrollBehavior: 'smooth',
              boxSizing: 'border-box'
            }}
          >
            <div
              key={`${activeTab}_${activeHeroSetting || ''}_${activeGlobalSetting || ''}`}
              className="cms-page-theme-fade"
              style={{
                width: '100%',
                height: activeTab === 'blog' ? '100%' : 'auto',
                display: activeTab === 'blog' ? 'flex' : 'block',
                flexDirection: activeTab === 'blog' ? 'column' : undefined,
                minHeight: 0
              }}
            >
            {/* ════════════════════════════════════════ TAB: OVERVIEW (MENU UTAMA) ════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '4px 0 20px' : '6px 0 30px' }}>
                <div style={{ marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 14, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', marginBottom: 8 }}>
                    <Globe size={22} />
                  </div>
                  <h2 style={{ margin: '0 0 4px', fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--cms-text)' }}>
                    Menu Utama Website
                  </h2>
                  <p style={{ margin: '0 auto 14px', maxWidth: 460, fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--cms-text-muted)' }}>
                    Pilih modul atau seksi website di bawah untuk mulai mengelola
                  </p>

                  {/* Quick Search */}
                  <div style={{ maxWidth: 400, margin: '0 auto', position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }} />
                    <input
                      type="text"
                      value={settingsSearchQuery}
                      onChange={(e) => setSettingsSearchQuery(e.target.value)}
                      placeholder="Cari menu (karya, blog, katalog, tema, bio, seo)..."
                      style={{
                        width: '100%', padding: '9px 14px 9px 36px',
                        borderRadius: 100, border: '1.5px solid var(--glass-border)',
                        background: 'var(--cms-card-bg)', color: 'var(--cms-text)',
                        fontSize: 12.5, fontFamily: "'Inter', sans-serif", outline: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)', boxSizing: 'border-box'
                      }}
                    />
                    {settingsSearchQuery && (
                      <button
                        onClick={() => setSettingsSearchQuery('')}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Group 1: Modul Utama Website (Primary Modules) */}
                <div style={{ marginBottom: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <LayoutDashboard size={16} style={{ color: 'var(--cms-accent)' }} />
                    <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 850, color: 'var(--cms-text)' }}>Modul & Halaman Website</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? 10 : 14 }}>
                    {filteredMainModules.map(mod => {
                      const IconC = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => changeTab(mod.tabKey)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: isMobile ? '13px 16px' : '16px 18px',
                            background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                            borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s ease',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', minHeight: isMobile ? 58 : 70
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(var(--cms-accent-rgb), 0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${mod.color}15`, color: mod.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconC size={19} />
                            </div>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14 : 13.5, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {mod.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 6 }}>
                            <InfoTooltip content={mod.tooltip} />
                            {isMobile && <ChevronRight size={16} color="var(--cms-text-muted)" opacity={0.6} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section Group 2: Seksi Profil & Landing Page */}
                <div style={{ marginBottom: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <User size={16} style={{ color: 'var(--cms-accent)' }} />
                    <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 850, color: 'var(--cms-text)' }}>Seksi Profil Landing Page</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? 10 : 14 }}>
                    {filteredHeroCategories.map(cat => {
                      const IconC = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => changeTab('hero_profile', cat.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: isMobile ? '13px 16px' : '16px 18px',
                            background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                            borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s ease',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', minHeight: isMobile ? 58 : 70
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(var(--cms-accent-rgb), 0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${cat.color}15`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconC size={19} />
                            </div>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14 : 13.5, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cat.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 6 }}>
                            <InfoTooltip content={cat.tooltip} />
                            {isMobile && <ChevronRight size={16} color="var(--cms-text-muted)" opacity={0.6} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section Group 3: Halaman Publik Tambahan */}
                <div style={{ marginBottom: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <Globe size={16} style={{ color: 'var(--cms-accent)' }} />
                    <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 850, color: 'var(--cms-text)' }}>Halaman Publik Spesifik</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? 10 : 14 }}>
                    {filteredPublicPages.map(page => {
                      const IconC = page.icon;
                      return (
                        <button
                          key={page.id}
                          onClick={() => {
                            if (page.type === 'route' && page.route) {
                              navigate(page.route);
                            } else if (page.type === 'sub_tab' && page.tabKey) {
                              changeTab(page.tabKey, page.subKey);
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: isMobile ? '13px 16px' : '16px 18px',
                            background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                            borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s ease',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', minHeight: isMobile ? 58 : 70
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(var(--cms-accent-rgb), 0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${page.color}15`, color: page.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconC size={19} />
                            </div>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14 : 13.5, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {page.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 6 }}>
                            <InfoTooltip content={page.tooltip} />
                            {isMobile && <ChevronRight size={16} color="var(--cms-text-muted)" opacity={0.6} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section Group 4: Pengaturan Global & Sistem */}
                <div style={{ marginTop: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <Settings size={16} style={{ color: 'var(--cms-accent)' }} />
                    <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 850, color: 'var(--cms-text)' }}>Pengaturan Global & Sistem</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? 10 : 14 }}>
                    {filteredGlobalCategories.map(cat => {
                      const IconC = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (cat.id === 'theme') {
                              window.dispatchEvent(new CustomEvent('cms_open_settings_category', { detail: { category: 'branding' } }));
                              navigate('/admin/settings/branding');
                            } else {
                              changeTab('global_settings', cat.id);
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: isMobile ? '13px 16px' : '16px 18px',
                            background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                            borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s ease',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)', minHeight: isMobile ? 58 : 70
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(var(--cms-accent-rgb), 0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${cat.color}15`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconC size={19} />
                            </div>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14 : 13.5, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cat.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 6 }}>
                            <InfoTooltip content={cat.tooltip} />
                            {isMobile && <ChevronRight size={16} color="var(--cms-text-muted)" opacity={0.6} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════ TAB: GLOBAL SETTINGS ════════════════════════════════════════ */}
            {activeTab === 'global_settings' && (
              <div style={{ maxWidth: 880, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                
                {/* If no sub-setting is selected, show Simple Grid */}
                {!activeGlobalSetting && (
                  <div>
                    <div style={{ marginBottom: 18, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', marginBottom: 6 }}>
                        <Settings size={20} />
                      </div>
                      <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--cms-text)' }}>Pengaturan Global</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                      {globalSettingCategories.map((cat) => {
                        const IconComp = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              if (cat.id === 'theme') {
                                window.dispatchEvent(new CustomEvent('cms_open_settings_category', { detail: { category: 'branding' } }));
                                navigate('/admin/settings/branding');
                              } else {
                                changeTab('global_settings', cat.id);
                              }
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 14px',
                              background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                              borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                              boxShadow: 'var(--cms-shadow-sm)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cat.color}15`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IconComp size={16} />
                              </div>
                              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cat.title}
                              </span>
                            </div>
                            <InfoTooltip content={cat.tooltip} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-Setting View */}
                {activeGlobalSetting && (
                  <div>
                    {/* Breadcrumb Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => changeTab('global_settings', null)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 12px', background: 'var(--cms-card-bg)',
                          border: '1.5px solid var(--glass-border)', borderRadius: 100,
                          color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif",
                          fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <ChevronLeft size={14} /> Kembali
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--cms-text-muted)' }}>
                        <button onClick={() => changeTab('overview')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}>Website</button>
                        <span>/</span>
                        <span style={{ color: 'var(--cms-text)', fontWeight: 800 }}>
                          {globalSettingCategories.find(c => c.id === activeGlobalSetting)?.title || 'Pengaturan'}
                        </span>
                      </div>
                    </div>

                    {/* --- 0. STUDIO CONCIERGE & LIVE CHAT SETTINGS --- */}
                    {activeGlobalSetting === 'concierge_chat' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Header Box */}
                        <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageCircle size={18} />
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>
                                  Pengaturan Studio Concierge & Brief Proyek
                                </h4>
                                <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                                  Kustomisasi seluruh teks formulir brief, pilihan kategori, waktu pengerjaan, dan tombol live chat.
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                await storage.setItem('porto_concierge_settings', conciergeSettings);
                                window.dispatchEvent(new CustomEvent('porto_concierge_settings_updated', { detail: conciergeSettings }));
                                notify('✨ Pengaturan Studio Concierge berhasil disimpan!', 'success');
                              }}
                              style={{
                                padding: '8px 20px', borderRadius: 100, border: 'none', background: 'var(--cms-accent)',
                                color: '#fff', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 4px 14px var(--cms-accent-soft)'
                              }}
                            >
                              <Save size={14} /> Simpan Pengaturan
                            </button>
                          </div>
                        </div>

                        {/* SECTION 1: HEADER, LAUNCHER & TABS */}
                        <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-accent)', fontFamily: "'Outfit', sans-serif" }}>
                            📌 Teks Header Window & Tombol Melayang (Launcher)
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                            <FormField label="Judul Header Window" hint="Teks judul di bar atas widget concierge">
                              <CmsInput
                                value={conciergeSettings.txtHeaderTitle}
                                onChange={e => setConciergeSettings({ ...conciergeSettings, txtHeaderTitle: e.target.value })}
                                placeholder="Studio Concierge"
                              />
                            </FormField>

                            <FormField label="Sub-Judul Header" hint="Teks deskripsi singkat di bawah judul header">
                              <CmsInput
                                value={conciergeSettings.txtHeaderSubtitle}
                                onChange={e => setConciergeSettings({ ...conciergeSettings, txtHeaderSubtitle: e.target.value })}
                                placeholder="Konsultasi desain & pesan langsung"
                              />
                            </FormField>

                            <FormField label="Teks Tombol Melayang (Launcher)" hint="Label teks pada tombol melayang di pojok kanan bawah website">
                              <CmsInput
                                value={conciergeSettings.txtFloatingButton}
                                onChange={e => setConciergeSettings({ ...conciergeSettings, txtFloatingButton: e.target.value })}
                                placeholder="Konsultasi & Chat"
                              />
                            </FormField>

                            <FormField label="Nama Tab 1 & Tab 2" hint="Label tab navigasi di dalam widget">
                              <div style={{ display: 'flex', gap: 8 }}>
                                <CmsInput
                                  value={conciergeSettings.txtTabBrief}
                                  onChange={e => setConciergeSettings({ ...conciergeSettings, txtTabBrief: e.target.value })}
                                  placeholder="Brief Proyek"
                                />
                                <CmsInput
                                  value={conciergeSettings.txtTabChat}
                                  onChange={e => setConciergeSettings({ ...conciergeSettings, txtTabChat: e.target.value })}
                                  placeholder="Live Chat"
                                />
                              </div>
                            </FormField>
                          </div>
                        </div>

                        {/* SECTION 2: LANGKAH 1 - PILIHAN KATEGORI LAYANAN */}
                        <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-accent)', fontFamily: "'Outfit', sans-serif" }}>
                              🎨 Pilihan Kategori Kebutuhan Proyek (Langkah 1)
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newId = `service_${Date.now()}`;
                                setConciergeSettings({
                                  ...conciergeSettings,
                                  serviceCategories: [
                                    ...(conciergeSettings.serviceCategories || []),
                                    { id: newId, name: 'Layanan Baru', desc: 'Deskripsi singkat layanan', icon: 'Sparkles' }
                                  ]
                                });
                              }}
                              style={{
                                padding: '5px 12px', borderRadius: 100, border: 'none', background: 'var(--cms-accent)',
                                color: '#fff', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Plus size={13} /> Tambah Layanan
                            </button>
                          </div>

                          <FormField label="Judul Bagian Langkah 1">
                            <CmsInput
                              value={conciergeSettings.txtStep1Title}
                              onChange={e => setConciergeSettings({ ...conciergeSettings, txtStep1Title: e.target.value })}
                              placeholder="1. Kebutuhan Desain / Proyek"
                            />
                          </FormField>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(conciergeSettings.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories).map((srv, idx) => (
                              <div key={srv.id || idx} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--cms-switcher-bg)', padding: '10px 12px', borderRadius: 14, border: '1px solid var(--glass-border)' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cms-card-bg)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900, fontSize: 11 }}>
                                  {idx + 1}
                                </div>
                                <CmsInput
                                  value={srv.name}
                                  onChange={e => {
                                    const updated = [...(conciergeSettings.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories)];
                                    updated[idx].name = e.target.value;
                                    setConciergeSettings({ ...conciergeSettings, serviceCategories: updated });
                                  }}
                                  placeholder="Nama Kategori Layanan"
                                  style={{ flex: 1.2, fontWeight: 700 }}
                                />
                                <CmsInput
                                  value={srv.desc}
                                  onChange={e => {
                                    const updated = [...(conciergeSettings.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories)];
                                    updated[idx].desc = e.target.value;
                                    setConciergeSettings({ ...conciergeSettings, serviceCategories: updated });
                                  }}
                                  placeholder="Keterangan singkat / sub-label"
                                  style={{ flex: 1.8 }}
                                />
                                {(conciergeSettings.serviceCategories || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = conciergeSettings.serviceCategories.filter((_, i) => i !== idx);
                                      setConciergeSettings({ ...conciergeSettings, serviceCategories: updated });
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 6 }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SECTION 3: LANGKAH 2 - TARGET WAKTU PENGERJAAN */}
                        <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-accent)', fontFamily: "'Outfit', sans-serif" }}>
                            ⏱️ Target Waktu Pengerjaan (Langkah 2)
                          </div>

                          <FormField label="Judul Bagian Langkah 2">
                            <CmsInput
                              value={conciergeSettings.txtStep2Title}
                              onChange={e => setConciergeSettings({ ...conciergeSettings, txtStep2Title: e.target.value })}
                              placeholder="2. Target Waktu Pengerjaan"
                            />
                          </FormField>

                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
                            {(conciergeSettings.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions).map((t, idx) => (
                              <div key={t.id || idx}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>Opsi {idx + 1}:</label>
                                <CmsInput
                                  value={t.name}
                                  onChange={e => {
                                    const updated = [...(conciergeSettings.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions)];
                                    updated[idx].name = e.target.value;
                                    setConciergeSettings({ ...conciergeSettings, timelineOptions: updated });
                                  }}
                                  placeholder="Nama Opsi Waktu"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SECTION 4: LANGKAH 3, CATATAN & TOMBOL AKSI */}
                        <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-accent)', fontFamily: "'Outfit', sans-serif" }}>
                            💬 Kolom Catatan Ide & Tombol Aksi
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                            <FormField label="Judul Bagian Langkah 3">
                              <CmsInput
                                value={conciergeSettings.txtStep3Title}
                                onChange={e => setConciergeSettings({ ...conciergeSettings, txtStep3Title: e.target.value })}
                                placeholder="3. Ceritakan Ide atau Konsep Proyek"
                              />
                            </FormField>

                            <FormField label="Placeholder Input Catatan">
                              <CmsInput
                                value={conciergeSettings.txtStep3Placeholder}
                                onChange={e => setConciergeSettings({ ...conciergeSettings, txtStep3Placeholder: e.target.value })}
                                placeholder="Contoh: Saya ingin membuat..."
                              />
                            </FormField>

                            <FormField label="Teks Tombol Kirim WhatsApp">
                              <CmsInput
                                value={conciergeSettings.txtBtnWhatsapp}
                                onChange={e => setConciergeSettings({ ...conciergeSettings, txtBtnWhatsapp: e.target.value })}
                                placeholder="Kirim Brief via WhatsApp"
                              />
                            </FormField>

                            <FormField label="Teks Tombol Kirim ke Live Chat">
                              <CmsInput
                                value={conciergeSettings.txtBtnLiveChat}
                                onChange={e => setConciergeSettings({ ...conciergeSettings, txtBtnLiveChat: e.target.value })}
                                placeholder="Kirim ke Live Chat Studio"
                              />
                            </FormField>
                          </div>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setConciergeSettings(DEFAULT_CONCIERGE_SETTINGS);
                              notify('🔄 Pengaturan dikembalikan ke standar awal.', 'info');
                            }}
                            style={{
                              padding: '9px 18px', borderRadius: 100, border: '1px solid var(--glass-border)',
                              background: 'var(--cms-switcher-bg)', color: 'var(--cms-text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6
                            }}
                          >
                            <RotateCcw size={13} /> Reset ke Standar
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              await storage.setItem('porto_concierge_settings', conciergeSettings);
                              window.dispatchEvent(new CustomEvent('porto_concierge_settings_updated', { detail: conciergeSettings }));
                              notify('✨ Pengaturan Studio Concierge berhasil disimpan!', 'success');
                            }}
                            style={{
                              padding: '11px 26px', borderRadius: 100, border: 'none', background: 'var(--cms-accent)',
                              color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                              boxShadow: '0 4px 16px var(--cms-accent-soft)'
                            }}
                          >
                            <Save size={15} /> Simpan Seluruh Perubahan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* --- 1. TEMA & PALET WARNA (NAVIGASI KE SETTING GLOBAL) --- */}
                    {activeGlobalSetting === 'theme' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 20, padding: isMobile ? 20 : 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, boxShadow: 'var(--cms-shadow-md)' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px var(--cms-accent-soft)' }}>
                          <Palette size={32} />
                        </div>
                        <div style={{ maxWidth: 520 }}>
                          <h4 style={{ margin: '0 0 8px', fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--cms-text)' }}>
                            Studio Tema & Warna Global
                          </h4>
                          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cms-text-muted)', lineHeight: 1.6 }}>
                            Pengaturan palet warna dan tema visual telah disatukan di <b>Pengaturan Global</b> agar tersinkronisasi 100% otomatis di seluruh sistem dashboard admin dan website publik.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('cms_open_settings_category', { detail: { category: 'branding' } }));
                              navigate('/admin/settings/branding');
                            }}
                            className="cms-btn"
                            style={{
                              padding: '12px 26px', borderRadius: 100, background: 'var(--cms-accent)', color: '#fff', border: 'none',
                              fontWeight: 800, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                              boxShadow: '0 6px 20px var(--cms-accent-soft)'
                            }}
                          >
                            <Sliders size={16} /> Buka Pengaturan Tema & Warna ➔
                          </button>
                          <button
                            onClick={() => changeTab('global_settings', null)}
                            className="cms-btn"
                            style={{
                              padding: '12px 20px', borderRadius: 100, background: 'var(--cms-switcher-bg)', color: 'var(--cms-text-muted)', border: '1px solid var(--glass-border)',
                              fontWeight: 700, fontSize: 13, cursor: 'pointer'
                            }}
                          >
                            Kembali ke Menu
                          </button>
                        </div>
                      </div>
                    )}

                    {/* --- 2. HEADER HALAMAN --- */}
                    {activeGlobalSetting === 'page_headers' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                            <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>
                              Header Halaman Publik
                            </h4>
                          </div>

                          {/* Page Selection Tabs */}
                          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                            {[
                              { key: 'blog', label: 'Blog', icon: FileText },
                              { key: 'portfolio', label: 'Portofolio', icon: Star },
                              { key: 'catalog', label: 'Katalog', icon: Store },
                              { key: 'about', label: 'Tentang', icon: User },
                              { key: 'links', label: 'Links', icon: Link2 },
                            ].map((pg) => {
                              const isActive = selectedHeaderPage === pg.key;
                              const IconC = pg.icon;
                              return (
                                <button
                                  key={pg.key}
                                  onClick={() => setSelectedHeaderPage(pg.key as any)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                                    borderRadius: 10,
                                    border: isActive ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                                    background: isActive ? 'var(--cms-accent-soft)' : 'var(--cms-switcher-bg)',
                                    color: isActive ? 'var(--cms-accent)' : 'var(--cms-text)',
                                    fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700,
                                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
                                  }}
                                >
                                  <IconC size={13} />
                                  <span>{pg.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* AI & Offline Presets Bar */}
                        <div style={{
                          background: 'var(--cms-accent-soft)',
                          border: '1.5px solid var(--cms-accent)', borderRadius: 18, padding: isMobile ? 14 : 16,
                          display: 'flex', flexDirection: 'column', gap: 10
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Wand2 size={15} style={{ color: 'var(--cms-accent)' }} />
                              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                                Preset Header ({selectedHeaderPage})
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleApplyHeaderOfflinePreset(selectedHeaderPage, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                                style={{
                                  padding: '6px 12px', borderRadius: 100, background: 'var(--cms-card-bg)',
                                  border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)',
                                  fontFamily: "'Outfit', sans-serif", fontSize: 11.5, fontWeight: 700, outline: 'none', cursor: 'pointer'
                                }}
                              >
                                <option value="" disabled>⚡ Preset Offline</option>
                                {OFFLINE_PAGE_HEADER_TEMPLATES.filter(p => p.pageKey === selectedHeaderPage).map((pr) => (
                                  <option key={pr.id} value={pr.id}>{pr.label}</option>
                                ))}
                              </select>

                              <button
                                onClick={() => handleGenerateHeaderAi(selectedHeaderPage)}
                                disabled={isHeaderAiGenerating}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                                  borderRadius: 100, background: 'var(--cms-accent)',
                                  border: 'none', color: '#fff', fontFamily: "'Outfit', sans-serif", fontSize: 12,
                                  fontWeight: 800, cursor: isHeaderAiGenerating ? 'wait' : 'pointer',
                                  boxShadow: '0 4px 12px var(--cms-accent-soft)'
                                }}
                              >
                                {isHeaderAiGenerating ? <Loader2 size={13} className="cms-spin" /> : <Sparkles size={13} />}
                                <span>{isHeaderAiGenerating ? 'Menulis...' : '✨ Tulis AI'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Editor Form for Selected Page Header */}
                        {(() => {
                          const pageHeaders = data.pagesHeader || DEFAULT_MAIN_WEBSITE_DATA.pagesHeader;
                          const cur = pageHeaders[selectedHeaderPage] || DEFAULT_MAIN_WEBSITE_DATA.pagesHeader[selectedHeaderPage];

                          const updateCur = (field: string, val: string) => {
                            update('pagesHeader', {
                              ...pageHeaders,
                              [selectedHeaderPage]: { ...cur, [field]: val }
                            });
                          };

                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                              <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 18, boxShadow: 'var(--cms-shadow-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <FormField label="Lencana (Badge)">
                                  <CmsInput value={cur?.badge || ''} onChange={(e) => updateCur('badge', e.target.value)} placeholder="BADGE TEKS" />
                                </FormField>

                                <FormField label="Judul Utama">
                                  <CmsInput value={cur?.title || ''} onChange={(e) => updateCur('title', e.target.value)} placeholder="Judul Halaman" />
                                </FormField>

                                <FormField label="Kata Kunci Gradasi">
                                  <CmsInput value={cur?.highlight || ''} onChange={(e) => updateCur('highlight', e.target.value)} placeholder="Kata Gradasi" />
                                </FormField>

                                <FormField label="Deskripsi Pengantar">
                                  <CmsTextarea value={cur?.description || ''} onChange={(e) => updateCur('description', e.target.value)} placeholder="Deskripsi singkat..." rows={2} />
                                </FormField>
                              </div>

                              {/* Real-time Preview */}
                              <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 18, boxShadow: 'var(--cms-shadow-md)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 8, marginBottom: 12 }}>
                                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                                    Pratinjau
                                  </span>
                                  <span style={{ fontSize: 10.5, color: 'var(--cms-accent)', fontWeight: 700 }}>Real-Time</span>
                                </div>

                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px dashed var(--glass-border)' }}>
                                  <PageHeroHeader
                                    badgeText={cur?.badge || 'BADGE'}
                                    title={cur?.title || 'Judul Contoh'}
                                    highlightText={cur?.highlight}
                                    description={cur?.description || 'Deskripsi singkat halaman.'}
                                    accentColor={data.theme?.accentColor || '#7c3aed'}
                                    align="center"
                                    style={{ marginBottom: 0 }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* --- 3. MENU NAVIGASI --- */}
                    {activeGlobalSetting === 'nav' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                          <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>Menu Navigasi</h4>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => addNavItem('link')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--cms-accent-soft)', border: '1.5px solid var(--cms-accent)', borderRadius: 100, color: 'var(--cms-accent)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                              <Plus size={13} /> Link
                            </button>
                            <button onClick={() => addNavItem('dropdown')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--cms-switcher-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 100, color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                              <Plus size={13} /> Dropdown
                            </button>
                          </div>
                        </div>

                        <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                          <FormField label="Teks Logo">
                            <CmsInput value={data.navbar.logoText || 'Arif.'} onChange={(e) => update('navbar', { logoText: e.target.value })} placeholder="Arif." />
                          </FormField>
                          <FormField label="Label Tombol Aksi">
                            <CmsInput value={data.navbar.loginBtnLabel || 'Login'} onChange={(e) => update('navbar', { loginBtnLabel: e.target.value })} placeholder="Login" />
                          </FormField>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(data.navbar.items as NavItem[]).map((item, idx) => (
                            <div key={item.id} style={{ background: 'var(--cms-switcher-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 12, padding: '10px 12px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                                <GripVertical size={15} style={{ color: 'var(--cms-text-muted)', flexShrink: 0 }} />
                                <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-accent)', padding: '2px 6px', borderRadius: 100, background: 'var(--cms-accent-soft)', flexShrink: 0 }}>
                                  {item.type === 'dropdown' ? 'DROPDOWN' : 'LINK'}
                                </span>
                                <div style={{ flex: isMobile ? '1 1 100%' : '1 1 120px', minWidth: 0 }}>
                                  <CmsInput value={item.label} onChange={(e) => updateNavItem(item.id, { label: e.target.value })} placeholder="Label" />
                                </div>
                                {item.type === 'link' && (
                                  <div style={{ flex: isMobile ? '1 1 100%' : '1 1 120px', minWidth: 0 }}>
                                    <CmsInput value={item.url || ''} onChange={(e) => updateNavItem(item.id, { url: e.target.value })} placeholder="URL" />
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginLeft: 'auto' }}>
                                  <button onClick={() => moveNavItem(item.id, 'up')} disabled={idx === 0} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'var(--cms-card-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: idx === 0 ? 0.3 : 1 }}><ChevronUp size={13} /></button>
                                  <button onClick={() => moveNavItem(item.id, 'down')} disabled={idx === (data.navbar.items as NavItem[]).length - 1} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'var(--cms-card-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: idx === (data.navbar.items as NavItem[]).length - 1 ? 0.3 : 1 }}><ChevronDown size={13} /></button>
                                  <button onClick={() => confirm('Hapus menu ini?', () => removeNavItem(item.id))} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* --- 4. LOKALISASI TEKS --- */}
                    {activeGlobalSetting === 'localization' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ padding: '14px', background: 'var(--cms-switcher-bg)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: 'var(--cms-accent)' }}>Seksi Portofolio</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                            <FormField label="Lencana"><CmsInput value={data.localization?.portfolioSectionTitle || ''} onChange={(e) => update('localization', { portfolioSectionTitle: e.target.value })} placeholder="— KARYA PILIHAN" /></FormField>
                            <FormField label="Judul"><CmsInput value={data.localization?.portfolioMainTitle || ''} onChange={(e) => update('localization', { portfolioMainTitle: e.target.value })} placeholder="Studi Kasus" /></FormField>
                          </div>
                        </div>

                        <div style={{ padding: '14px', background: 'var(--cms-switcher-bg)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: 'var(--cms-accent)' }}>Seksi Ajakan Bertindak (CTA)</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                            <FormField label="Judul CTA"><CmsInput value={data.localization?.customProjectMainTitle || ''} onChange={(e) => update('localization', { customProjectMainTitle: e.target.value })} placeholder="Mari Bekerja Sama" /></FormField>
                            <FormField label="Tombol CTA"><CmsInput value={data.localization?.customProjectCta || ''} onChange={(e) => update('localization', { customProjectCta: e.target.value })} placeholder="Hubungi Saya" /></FormField>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- 5. FOOTER & SOSMED --- */}
                    {activeGlobalSetting === 'footer' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                          <FormField label="Email Kontak"><CmsInput value={data.footer?.email || ''} onChange={(e) => update('footer', { email: e.target.value })} placeholder="hello@domain.com" /></FormField>
                          <FormField label="Domisili / Lokasi"><CmsInput value={data.footer?.location || ''} onChange={(e) => update('footer', { location: e.target.value })} placeholder="Remote / Indonesia" /></FormField>
                        </div>
                        <FormField label="Teks Hak Cipta"><CmsInput value={data.footer?.copyright || ''} onChange={(e) => update('footer', { copyright: e.target.value })} placeholder="© 2026 Brand. All rights reserved." /></FormField>
                      </div>
                    )}

                    {/* --- 6. OPSI PROYEK --- */}
                    {activeGlobalSetting === 'project_types' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>Pilihan Jenis Proyek</h4>
                          <button onClick={() => {
                            const arr = [...(data.footer?.contactProjectTypes || []), 'Opsi Baru'];
                            update('footer', { contactProjectTypes: arr });
                          }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--cms-accent-soft)', border: '1.5px solid var(--cms-accent)', borderRadius: 100, color: 'var(--cms-accent)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                            <Plus size={13} /> Tambah
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(data.footer?.contactProjectTypes || []).map((type: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <CmsInput value={type} onChange={(e) => {
                                const arr = [...(data.footer?.contactProjectTypes || [])];
                                arr[i] = e.target.value;
                                update('footer', { contactProjectTypes: arr });
                              }} placeholder="Nama jenis proyek..." />
                              <button onClick={() => {
                                const arr = (data.footer?.contactProjectTypes || []).filter((_: string, j: number) => j !== i);
                                update('footer', { contactProjectTypes: arr });
                              }} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* --- 7. KONTAK CEPAT --- */}
                    {activeGlobalSetting === 'contact_methods' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <h4 style={{ margin: '0 0 2px', fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>Saluran Kontak Cepat</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(data.footer?.contactMethods || [
                            { id: 'email',    label: 'Email',     icon: '📧', value: data.footer?.email || '', enabled: true  },
                            { id: 'whatsapp', label: 'WhatsApp', icon: '💬', value: '',                        enabled: false },
                            { id: 'telegram', label: 'Telegram', icon: '✈️', value: '',                        enabled: false },
                          ]).map((method: any, i: number) => {
                            const methods = data.footer?.contactMethods || [];
                            const updateMethod = (patch: any) => {
                              const arr = methods.map((m: any, j: number) => j === i ? { ...m, ...patch } : m);
                              update('footer', { contactMethods: arr });
                            };
                            return (
                              <div key={method.id} style={{ background: 'var(--cms-switcher-bg)', border: `1.5px solid ${method.enabled ? 'var(--cms-accent)' : 'var(--glass-border)'}`, borderRadius: 12, padding: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: method.enabled ? 8 : 0 }}>
                                  <input value={method.icon} onChange={(e) => updateMethod({ icon: e.target.value })} style={{ width: 32, height: 32, textAlign: 'center', fontSize: 16, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, outline: 'none', color: 'var(--cms-text)' }} maxLength={4} />
                                  <CmsInput value={method.label} onChange={(e) => updateMethod({ label: e.target.value })} placeholder="Nama" style={{ flex: 1 }} />
                                  <button type="button" onClick={() => updateMethod({ enabled: !method.enabled })} style={{ padding: '5px 12px', borderRadius: 100, border: 'none', background: method.enabled ? 'var(--cms-accent)' : 'var(--cms-card-bg)', color: method.enabled ? '#fff' : 'var(--cms-text-muted)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                                    {method.enabled ? 'Aktif' : 'Nonaktif'}
                                  </button>
                                </div>
                                {method.enabled && (
                                  <CmsInput value={method.value} onChange={(e) => updateMethod({ value: e.target.value })} placeholder={method.id === 'whatsapp' ? '+628123456789' : method.id === 'telegram' ? '@username' : 'email@domain.com'} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* --- 8. SEO & CUPLIKAN --- */}
                    {activeGlobalSetting === 'seo' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{
                          background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                          borderRadius: 18, padding: isMobile ? 14 : 18, boxShadow: 'var(--cms-shadow-md)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 46, height: 46, borderRadius: '50%',
                              background: seoScore >= 80 ? 'rgba(16,185,129,0.15)' : seoScore >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                              color: seoScore >= 80 ? '#10b981' : seoScore >= 50 ? '#f59e0b' : '#ef4444',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900,
                              border: `2px solid ${seoScore >= 80 ? '#10b981' : seoScore >= 50 ? '#f59e0b' : '#ef4444'}`
                            }}>
                              {seoScore}%
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                                Skor SEO: {seoScore >= 80 ? 'Optimal' : seoScore >= 50 ? 'Cukup' : 'Lengkapi'}
                              </h4>
                            </div>
                          </div>

                          <button
                            onClick={handleGenerateAiSeo}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                              background: 'var(--cms-accent)', border: 'none',
                              borderRadius: 100, color: '#fff', fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                              boxShadow: '0 4px 12px var(--cms-accent-soft)'
                            }}
                          >
                            <Sparkles size={13} /> Auto-Generate
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                          <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <FormField label="Meta Title">
                              <CmsInput value={data.seo?.metaTitle || ''} onChange={(e) => update('seo', { metaTitle: e.target.value })} placeholder="Nama Brand — Profesi" maxLength={70} />
                            </FormField>
                            <FormField label="Meta Description">
                              <CmsTextarea value={data.seo?.metaDescription || ''} onChange={(e) => update('seo', { metaDescription: e.target.value })} placeholder="Deskripsi ringkas..." rows={3} maxLength={180} />
                            </FormField>
                            <ImageUploader value={data.seo?.ogImage || null} onChange={(url) => update('seo', { ogImage: url })} label="Open Graph Banner (1200x630)" aspectRatio="1200/630" />
                          </div>

                          {/* Google Snippet Preview */}
                          <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Pratinjau Google</h4>
                            <div style={{ background: '#fff', color: '#202124', borderRadius: 12, padding: 14, border: '1px solid #dadce0' }}>
                              <div style={{ fontSize: 11, color: '#202124', marginBottom: 2 }}>{typeof window !== 'undefined' ? window.location.origin : 'https://domain.com'}</div>
                              <div style={{ fontSize: 14.5, fontWeight: 500, color: '#1a0dab', lineHeight: 1.3, marginBottom: 4 }}>{data.seo?.metaTitle || 'Judul Website'}</div>
                              <div style={{ fontSize: 12, color: '#4d5156', lineHeight: 1.4 }}>{data.seo?.metaDescription || 'Deskripsi halaman...'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- 9. CADANGAN JSON --- */}
                    {activeGlobalSetting === 'backup' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>Cadangan & Pemulihan JSON</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                          <div style={{ background: 'var(--cms-switcher-bg)', borderRadius: 14, padding: 14, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>Ekspor Konfigurasi</div>
                            <button onClick={handleExportJson} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', background: 'var(--cms-accent)', border: 'none', borderRadius: 100, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                              <Download size={13} /> Unduh JSON
                            </button>
                          </div>

                          <div style={{ background: 'var(--cms-switcher-bg)', borderRadius: 14, padding: 14, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>Impor Konfigurasi</div>
                            <button onClick={() => jsonImportRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', background: '#10b981', border: 'none', borderRadius: 100, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                              <UploadCloud size={13} /> Pilih File JSON
                            </button>
                            <input ref={jsonImportRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImportJson} />
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Reset Standar:</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button onClick={() => handleResetSection('Hero', () => update('hero', DEFAULT_MAIN_WEBSITE_DATA.hero))} style={{ padding: '5px 10px', borderRadius: 100, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reset Hero</button>
                            <button onClick={() => handleResetSection('Header Halaman', () => update('pagesHeader', DEFAULT_MAIN_WEBSITE_DATA.pagesHeader))} style={{ padding: '5px 10px', borderRadius: 100, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reset Header</button>
                            <button onClick={() => handleResetSection('Seluruh Website', () => { setData(DEFAULT_MAIN_WEBSITE_DATA); setIsDirty(true); })} style={{ padding: '5px 12px', borderRadius: 100, border: 'none', background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Reset Penuh</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- 10. STATUS SYNC --- */}
                    {activeGlobalSetting === 'sync' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                        <div style={{ background: 'var(--cms-switcher-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 14, padding: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: syncStatus === 'synced' ? 'rgba(16,185,129,0.15)' : 'var(--cms-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: syncStatus === 'synced' ? '#10b981' : 'var(--cms-accent)' }}>
                              {syncStatus === 'synced' ? <CheckCircle2 size={20} /> : <Cloud size={20} />}
                            </div>
                            <div>
                              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                                {syncStatus === 'synced' ? 'Tersinkronisasi Cloud' : 'Tersimpan Lokal'}
                              </div>
                              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                                {lastSyncTime ? `Sync: ${lastSyncTime}` : 'Penyimpanan lokal IndexedDB aktif'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleSyncToCloud} disabled={syncStatus === 'syncing'} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'var(--cms-accent)', border: 'none', borderRadius: 100, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                              {syncStatus === 'syncing' ? <Loader2 size={13} className="cms-spin" /> : <RefreshCw size={13} />} Sync Cloud
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════ TAB: HERO & PROFILE ════════════════════════════════════════ */}
            {activeTab === 'hero_profile' && (
              <div style={{ maxWidth: 880, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                
                {/* If no sub-setting is selected, show Simple Grid */}
                {!activeHeroSetting && (
                  <div>
                    <div style={{ marginBottom: 18, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', marginBottom: 6 }}>
                        <User size={20} />
                      </div>
                      <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--cms-text)' }}>Profil Utama</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                      {heroSettingCategories.map((cat) => {
                        const IconComp = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => changeTab('hero_profile', cat.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 14px',
                              background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                              borderRadius: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                              boxShadow: 'var(--cms-shadow-sm)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cat.color}15`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IconComp size={16} />
                              </div>
                              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cat.title}
                              </span>
                            </div>
                            <InfoTooltip content={cat.tooltip} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-Setting View */}
                {activeHeroSetting && (
                  <div>
                    {/* Breadcrumb Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => changeTab('hero_profile', null)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '5px 12px', background: 'var(--cms-card-bg)',
                          border: '1.5px solid var(--glass-border)', borderRadius: 100,
                          color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif",
                          fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <ChevronLeft size={14} /> Kembali
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--cms-text-muted)' }}>
                        <button onClick={() => changeTab('overview')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}>Website</button>
                        <span>/</span>
                        <span style={{ color: 'var(--cms-text)', fontWeight: 800 }}>
                          {heroSettingCategories.find(c => c.id === activeHeroSetting)?.title || 'Profil'}
                        </span>
                      </div>
                    </div>

                    {/* --- 1. TEKS & BIO --- */}
                    {activeHeroSetting === 'bio' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                          <FormField label="Sapaan"><CmsInput value={data.hero.greeting} onChange={(e) => update('hero', { greeting: e.target.value })} placeholder="Hello, I'm" /></FormField>
                          <FormField label="Nama Lengkap"><CmsInput value={data.hero.headline} onChange={(e) => update('hero', { headline: e.target.value })} placeholder="Nama Anda" /></FormField>
                        </div>
                        <FormField label="Profesi"><CmsInput value={data.hero.subheadline} onChange={(e) => update('hero', { subheadline: e.target.value })} placeholder="Junior Graphic Designer" /></FormField>
                        <FormField label="Deskripsi Hero Singkat"><CmsTextarea value={data.hero.description} onChange={(e) => update('hero', { description: e.target.value })} placeholder="Deskripsi ringkas..." rows={2} /></FormField>
                        <FormField label="Bio Seksi Tentang Saya"><CmsTextarea value={data.profile.bio} onChange={(e) => update('profile', { bio: e.target.value })} placeholder="Biografi diri Anda..." rows={3} /></FormField>
                      </div>
                    )}

                    {/* --- 2. LAYANAN & KEAHLIAN --- */}
                    {activeHeroSetting === 'skills' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>Layanan Ditawarkan</h4>
                          <button onClick={addSkill} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--cms-accent-soft)', border: '1.5px solid var(--cms-accent)', borderRadius: 100, color: 'var(--cms-accent)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                            <Plus size={13} /> Tambah
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(data.profile.skills || []).map((skill: any, i: number) => (
                            <div key={skill.id || i} style={{ background: 'var(--cms-switcher-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 12, padding: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-accent)' }}>Layanan {i + 1}</span>
                                <button onClick={() => removeSkill(skill.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 8, marginBottom: 6 }}>
                                <IconPicker value={skill.icon} onChange={(val) => update('profile', { skills: data.profile.skills.map((s: any) => s.id === skill.id ? { ...s, icon: val } : s) })} />
                                <CmsInput value={skill.name} onChange={(e) => update('profile', { skills: data.profile.skills.map((s: any) => s.id === skill.id ? { ...s, name: e.target.value } : s) })} placeholder="Nama Layanan" />
                              </div>
                              <CmsTextarea value={skill.description} onChange={(e) => update('profile', { skills: data.profile.skills.map((s: any) => s.id === skill.id ? { ...s, description: e.target.value } : s) })} placeholder="Deskripsi..." rows={2} style={{ minHeight: 50 }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* --- 3. SOROTAN & CTA --- */}
                    {activeHeroSetting === 'cards' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                          <FormField label="Tombol CTA Utama">
                            <CmsInput value={data.hero.ctaPrimaryLabel} onChange={(e) => update('hero', { ctaPrimaryLabel: e.target.value })} placeholder="Label (Lihat Karya)" style={{ marginBottom: 4 }} />
                            <CmsInput value={data.hero.ctaPrimaryUrl} onChange={(e) => update('hero', { ctaPrimaryUrl: e.target.value })} placeholder="URL (#portfolio)" />
                          </FormField>
                          <FormField label="Tombol CTA Sekunder">
                            <CmsInput value={data.hero.ctaSecondaryLabel} onChange={(e) => update('hero', { ctaSecondaryLabel: e.target.value })} placeholder="Label (Unduh CV)" style={{ marginBottom: 4 }} />
                            <CmsInput value={data.hero.ctaSecondaryUrl} onChange={(e) => update('hero', { ctaSecondaryUrl: e.target.value })} placeholder="URL (#contact)" />
                          </FormField>
                        </div>
                      </div>
                    )}

                    {/* --- 4. FOTO HERO --- */}
                    {activeHeroSetting === 'avatar' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>Foto Profil Hero (4:5)</h4>
                        <ImageUploader value={data.hero.heroImage} onChange={(url) => update('hero', { heroImage: url })} label="Upload Foto Hero" aspectRatio="4/5" />
                      </div>
                    )}

                    {/* --- 5. ALUR PROSES --- */}
                    {activeHeroSetting === 'process' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>Langkah Proses</h4>
                          <button onClick={() => {
                            const id = 'proc-' + Date.now();
                            update('process', [...(data.process || []), { id, title: 'Langkah Baru', description: 'Deskripsi...', icon: 'Search' }]);
                          }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', borderRadius: 100, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                            <Plus size={13} /> Tambah
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(data.process || []).map((proc: any, i: number) => (
                            <div key={proc.id} style={{ padding: 12, background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)', borderRadius: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-accent)' }}>Langkah {i + 1}</span>
                                <button onClick={() => update('process', data.process.filter((p: any) => p.id !== proc.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                              </div>
                              <CmsInput value={proc.title} onChange={(e) => {
                                const newProc = [...data.process];
                                newProc[i].title = e.target.value;
                                update('process', newProc);
                              }} placeholder="Judul" style={{ marginBottom: 6 }} />
                              <CmsTextarea value={proc.description} onChange={(e) => {
                                const newProc = [...data.process];
                                newProc[i].description = e.target.value;
                                update('process', newProc);
                              }} placeholder="Deskripsi..." rows={2} style={{ minHeight: 50 }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* --- 6. TESTIMONI KLIEN --- */}
                    {activeHeroSetting === 'testimonials' && (
                      <div style={{ background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 18, padding: isMobile ? 14 : 20, boxShadow: 'var(--cms-shadow-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>Testimoni Klien</h4>
                          <button onClick={() => {
                            const id = 'test-' + Date.now();
                            update('testimonials', [...(data.testimonials || []), { id, quote: 'Karya luar biasa...', author: 'Nama', role: 'Perusahaan', avatar: '' }]);
                          }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', borderRadius: 100, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                            <Plus size={13} /> Tambah
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(data.testimonials || []).map((testi: any, i: number) => (
                            <div key={testi.id} style={{ padding: 12, background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)', borderRadius: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                                <button onClick={() => update('testimonials', data.testimonials.filter((t: any) => t.id !== testi.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                              </div>
                              <CmsTextarea value={testi.quote} onChange={(e) => {
                                const newTesti = [...data.testimonials];
                                newTesti[i].quote = e.target.value;
                                update('testimonials', newTesti);
                              }} placeholder="Kutipan..." rows={2} style={{ marginBottom: 6, minHeight: 50 }} />
                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 6 }}>
                                <CmsInput value={testi.author} onChange={(e) => {
                                  const newTesti = [...data.testimonials];
                                  newTesti[i].author = e.target.value;
                                  update('testimonials', newTesti);
                                }} placeholder="Nama" />
                                <CmsInput value={testi.role} onChange={(e) => {
                                  const newTesti = [...data.testimonials];
                                  newTesti[i].role = e.target.value;
                                  update('testimonials', newTesti);
                                }} placeholder="Perusahaan" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════ TAB: PORTFOLIO ════════════════════════════════════════ */}
            {activeTab === 'portfolio' && (
              <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h3 style={{ margin: '0 0 2px', fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>
                        Portofolio Karya ({projects.length})
                      </h3>
                    </div>
                    <button onClick={() => setShowCustomProjectModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--cms-accent)', color: '#fff', border: 'none', borderRadius: 100, fontSize: 12, fontWeight: 750, cursor: 'pointer', boxShadow: '0 4px 12px var(--cms-accent-soft)' }}>
                      <Plus size={14} /> Tambah Karya
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div style={{ padding: '30px 16px', border: '2px dashed var(--glass-border)', borderRadius: 14, textAlign: 'center', color: 'var(--cms-text-muted)' }}>
                      Belum ada karya terdaftar.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {projects.map((p) => {
                        const isSelected = (data.featuredProjects || []).includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setEditingProject(p);
                              setShowCustomProjectModal(true);
                            }}
                            style={{
                              background: 'var(--cms-card-bg)',
                              border: `1.5px solid ${isSelected ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                              borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                              boxShadow: isSelected ? '0 4px 14px var(--cms-accent-soft)' : 'none',
                              position: 'relative'
                            }}
                          >
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: 'var(--cms-switcher-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {getProjectCover(p) ? (
                                <img src={getProjectCover(p)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : p.mediaType === 'video' && p.videoUrl ? (
                                <video src={p.videoUrl} preload="metadata" muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Palette size={24} color="var(--cms-text-muted)" opacity={0.4} />
                              )}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFeatured(p.id);
                                }}
                                style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: isSelected ? 'var(--cms-accent)' : 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                title="Pilihan Utama"
                              >
                                <Star size={13} color="#fff" fill={isSelected ? '#fff' : 'none'} />
                              </div>
                            </div>
                            <div style={{ padding: '8px 10px' }}>
                              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{getProjectDisplay(p)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Sidebar: Labels & Categories */}
                <div className={`wm-right-sidebar ${isRightSidebarOpen ? 'open' : ''}`} style={{ width: 280, flexShrink: 0, position: 'sticky', top: 0, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 14, padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', fontFamily: "'Outfit', sans-serif", fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)' }}>Label & Kategori</h4>

                  <FormField label="Buat Label">
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      <CmsInput value={labelInput} onChange={(e) => setLabelInput(e.target.value)} placeholder="Label..." />
                      <button onClick={() => {
                        const val = labelInput.trim();
                        if (val && !(data.featuredLabels || []).includes(val)) {
                          update('featuredLabels' as any, [...(data.featuredLabels || []), val]);
                          setLabelInput('');
                        }
                      }} style={{ width: 34, height: 34, background: 'var(--cms-accent)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(data.featuredLabels || []).map((label: string) => (
                        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', borderRadius: 100, fontSize: 10.5, fontWeight: 700 }}>
                          {label}
                          <button onClick={() => update('featuredLabels' as any, (data.featuredLabels || []).filter((l: string) => l !== label))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><X size={9} /></button>
                        </span>
                      ))}
                    </div>
                  </FormField>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════ TAB: BLOG ════════════════════════════════════════ */}
            {activeTab === 'blog' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, width: '100%', overflow: 'hidden' }}>
                <BlogManager />
              </div>
            )}

            {/* ════════════════════════════════════════ TAB: CATALOG ════════════════════════════════════════ */}
            {activeTab === 'catalog' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <CatalogManager notify={notify} confirm={confirm} />
              </div>
            )}

            </div>
          </div>
        </div>

      {/* ── MODALS ── */}

      {/* 1. Custom Project Modal */}
      {showCustomProjectModal && (
        <CustomProjectModal
          initialData={editingProject}
          availableLabels={data.featuredLabels || []}
          availableCategories={data.projectCategories || []}
          onClose={() => {
            setShowCustomProjectModal(false);
            setEditingProject(null);
          }}
          onDelete={async (id) => {
            const existing = await storage.getItem('porto_portfolio', []);
            const updated = existing.filter((p: any) => p.id !== id);
            await storage.setItem('porto_portfolio', updated);
            setProjects(updated);
            setShowCustomProjectModal(false);
            setEditingProject(null);
            notify('✅ Karya berhasil dihapus');
          }}
          onSave={async () => {
            const existing = await storage.getItem('porto_portfolio', []);
            setProjects(existing);
          }}
          notify={notify}
        />
      )}

      {/* 2. Live Website Preview Modal */}
      {isPreviewModalOpen && createPortal(
        <div 
          onClick={() => setIsPreviewModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000000,
            background: isMobile ? 'var(--cms-card-bg)' : 'rgba(0,0,0,0.65)',
            backdropFilter: isMobile ? 'none' : 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: isMobile ? 0 : 16
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--cms-card-bg)',
              border: isMobile ? 'none' : '1.5px solid var(--glass-border)',
              borderRadius: isMobile ? 0 : 18,
              width: '100%',
              maxWidth: isMobile ? '100vw' : 1000,
              height: isMobile ? '100%' : '88vh',
              maxHeight: isMobile ? '100%' : '88vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isMobile ? 'none' : '0 25px 70px rgba(0,0,0,0.3)',
              color: 'var(--cms-text)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderBottom: '1px solid var(--glass-border)',
              background: 'var(--cms-card-bg)', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} style={{ color: 'var(--cms-accent)' }} />
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>Pratinjau Live Website</h3>
              </div>

              {/* Viewport Switcher */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--cms-input-bg)', padding: 3, borderRadius: 100, border: '1px solid var(--glass-border)' }}>
                <button
                  onClick={() => setPreviewViewport('desktop')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, border: 'none',
                    background: previewViewport === 'desktop' ? 'var(--cms-card-bg)' : 'transparent',
                    color: previewViewport === 'desktop' ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Monitor size={12} /> Desktop
                </button>
                <button
                  onClick={() => setPreviewViewport('tablet')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, border: 'none',
                    background: previewViewport === 'tablet' ? 'var(--cms-card-bg)' : 'transparent',
                    color: previewViewport === 'tablet' ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Tablet size={12} /> Tablet
                </button>
                <button
                  onClick={() => setPreviewViewport('mobile')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, border: 'none',
                    background: previewViewport === 'mobile' ? 'var(--cms-card-bg)' : 'transparent',
                    color: previewViewport === 'mobile' ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Smartphone size={12} /> Mobile
                </button>
              </div>

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Simulator Screen Container */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '16px 12px', background: 'rgba(0,0,0,0.2)' }}>
              <div
                className="wm-device-frame"
                style={{
                  width: previewViewport === 'desktop' ? '100%' : previewViewport === 'tablet' ? '768px' : '375px',
                  maxWidth: previewViewport === 'desktop' ? '1180px' : previewViewport === 'tablet' ? '768px' : '375px',
                  background: 'var(--cms-bg, #ffffff)',
                  borderRadius: previewViewport === 'mobile' ? 20 : 14,
                  border: '1px solid var(--glass-border)',
                  overflow: 'hidden',
                  padding: previewViewport === 'mobile' ? '20px 14px' : '30px 24px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Simulated Hero Header */}
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, background: `${data.theme?.accentColor || '#7c3aed'}20`, color: data.theme?.accentColor || '#7c3aed', fontSize: 10.5, fontWeight: 800, marginBottom: 10 }}>
                    {data.hero.badge?.smallText || 'STATUS'} • {data.hero.badge?.largeText || 'TERSEDIA'}
                  </span>
                  <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', fontWeight: 600 }}>{data.hero.greeting}</div>
                  <h1 style={{ fontSize: previewViewport === 'mobile' ? 26 : 38, fontWeight: 900, color: 'var(--cms-text)', margin: '4px 0 6px' }}>
                    {data.hero.headline}
                  </h1>
                  <div style={{ fontSize: previewViewport === 'mobile' ? 13 : 16, fontWeight: 700, color: data.theme?.accentColor || '#7c3aed', marginBottom: 12 }}>
                    {data.hero.subheadline}
                  </div>
                  <p style={{ maxWidth: 540, margin: '0 auto 16px', fontSize: 12.5, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
                    {data.hero.description}
                  </p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button style={{ padding: '8px 20px', borderRadius: 100, background: data.theme?.accentColor || '#7c3aed', color: '#fff', border: 'none', fontSize: 12, fontWeight: 800 }}>
                      {data.hero.ctaPrimaryLabel || 'Lihat Karya'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── REDESIGNED UNIFIED AI & TEMPLATE MODAL ── */}
      {isTemplateModalOpen && createPortal(
        <div 
          onClick={() => !isAiGenerating && setIsTemplateModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483640,
            background: isMobile ? 'var(--cms-panel-bg, var(--cms-bg))' : 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 20,
            boxSizing: 'border-box',
            animation: 'cmsFadeIn 0.2s ease both'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={isMobile ? {
              position: 'relative',
              width: '100vw',
              height: '100dvh',
              maxHeight: '100dvh',
              background: 'var(--cms-panel-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'nativeSheetUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
              overflow: 'hidden',
              boxSizing: 'border-box'
            } : {
              position: 'relative',
              width: '100%',
              maxWidth: 700,
              height: 'min(660px, 90vh)',
              minHeight: 600,
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 24,
              boxShadow: '0 28px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'pmModalIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '12px 14px' : '16px 20px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: websiteGenMode === 'offline' ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-accent-soft)',
                  color: websiteGenMode === 'offline' ? '#10b981' : 'var(--cms-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: websiteGenMode === 'offline' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px var(--cms-accent-soft)'
                }}>
                  {websiteGenMode === 'offline' ? <Zap size={18} /> : <Sparkles size={18} />}
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>{websiteGenMode === 'offline' ? 'Template Profil Website' : 'AI Website Generator'}</span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 100,
                      background: websiteGenMode === 'offline' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(124, 58, 237, 0.15)',
                      color: websiteGenMode === 'offline' ? '#10b981' : '#8b5cf6',
                      border: `1px solid ${websiteGenMode === 'offline' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(124, 58, 237, 0.3)'}`,
                      display: 'inline-flex', alignItems: 'center', gap: 3
                    }}>
                      {websiteGenMode === 'offline' ? <><Zap size={10} /> 0 Kuota</> : <><Sparkles size={10} /> Gemini AI</>}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 1 }}>
                    {websiteGenMode === 'offline' ? 'Preset profil, bio, dan tema website siap pakai' : 'Generate konfigurasi profil & bio otomatis dengan AI'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                disabled={isAiGenerating}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '12px 14px' : '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              WebkitOverflowScrolling: 'touch'
            }}>
              {/* 1. Sleek Mode Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 12,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: websiteGenMode === 'ai' ? 'var(--cms-accent-soft)' : 'rgba(16, 185, 129, 0.15)',
                    color: websiteGenMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {websiteGenMode === 'ai' ? <Sparkles size={14} /> : <Zap size={14} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 850, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{websiteGenMode === 'ai' ? 'Mode AI Generator' : 'Mode Template Instan'}</span>
                    </div>
                  </div>
                </div>

                {/* Switch Toggle Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={websiteGenMode === 'ai'}
                  onClick={() => setWebsiteGenMode(websiteGenMode === 'ai' ? 'offline' : 'ai')}
                  title={websiteGenMode === 'ai' ? 'Beralih ke Template (Offline)' : 'Beralih ke AI Generator'}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    borderRadius: 100,
                    border: `1.5px solid ${websiteGenMode === 'ai' ? 'var(--cms-accent)' : '#10b981'}`,
                    background: websiteGenMode === 'ai' ? 'var(--cms-accent-soft)' : 'rgba(16, 185, 129, 0.2)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 2,
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    background: websiteGenMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: websiteGenMode === 'ai' ? 'translateY(-50%) translateX(20px)' : 'translateY(-50%) translateX(0)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                  }}>
                    {websiteGenMode === 'ai' ? <Sparkles size={10} /> : <Zap size={10} />}
                  </div>
                </button>
              </div>

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* MODE 1: TEMPLATE INSTAN                                      */}
              {/* 1. Mode Switcher -> 2. Live Preview -> 3. Controls -> 4. Grid */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {websiteGenMode === 'offline' && (() => {
                const allTemplates = [...customWebsiteTemplates, ...OFFLINE_WEBSITE_TEMPLATES];
                const currentTemplate = allTemplates.find(t => t.id === aiWebsiteTemplateType) || allTemplates[0];
                const baseCategories = [
                  { id: 'all', label: 'Semua' },
                  ...(customWebsiteTemplates.length > 0 ? [{ id: 'custom', label: '⭐ Kustom' }] : []),
                  { id: 'creative', label: 'Desain' },
                  { id: 'tech', label: 'Tech & Dev' },
                  { id: 'business', label: 'Bisnis' },
                  { id: 'photo', label: 'Media' },
                  ...customWebsiteCategories
                ];

                return (
                  <>
                    {/* 2. LIVE PREVIEW BOX (TEPAT DI BAWAH SWITCH MODE) */}
                    {currentTemplate && (
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--cms-card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        flexShrink: 0
                      }}>
                        {/* Header Preview */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 850, color: '#10b981', minWidth: 0 }}>
                            <Eye size={13} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Preview Preset: {currentTemplate.label}
                            </span>
                            {currentTemplate.id.startsWith('custom_') && (
                              <span style={{ fontSize: 8.5, fontWeight: 850, padding: '1px 5px', borderRadius: 4, background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', flexShrink: 0 }}>
                                ⭐ KUSTOM
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                            {currentTemplate.theme?.accentColor && (
                              <span style={{
                                width: 12, height: 12, borderRadius: '50%',
                                background: currentTemplate.theme.accentColor,
                                border: '1px solid rgba(255,255,255,0.4)',
                                display: 'inline-block'
                              }} title={`Warna Aksen: ${currentTemplate.theme.accentColor}`} />
                            )}
                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 5, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                              {String(currentTemplate.category).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Bio & Headline Preview */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 850, color: 'var(--cms-text)' }}>
                            {currentTemplate.hero?.headline || currentTemplate.title}
                          </div>
                          <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginTop: 1 }}>
                            {currentTemplate.hero?.tagline || currentTemplate.tagline}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', lineHeight: 1.4, marginTop: 3 }}>
                            {currentTemplate.hero?.bio || currentTemplate.bio}
                          </div>
                        </div>

                        {/* Skills / Services Chips Preview */}
                        {currentTemplate.profile?.skills && currentTemplate.profile.skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 1 }}>
                            {currentTemplate.profile.skills.map((sk: any, idx: number) => (
                              <span key={idx} style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                                background: 'var(--cms-input-bg)', color: 'var(--cms-text)'
                              }}>
                                • {sk.name || sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. SEARCH BAR + CATEGORY FILTER CHIPS + +TEMPLATE BUTTON (JADI SATU KONTROL) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          flex: 1,
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 10px', borderRadius: 10,
                          background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)'
                        }}>
                          <Search size={13} style={{ color: 'var(--cms-text-muted)', flexShrink: 0 }} />
                          <input
                            type="text"
                            value={aiWebsiteSearchQuery}
                            onChange={e => setAiWebsiteSearchQuery(e.target.value)}
                            placeholder="Cari tema / profesi website..."
                            style={{
                              width: '100%', background: 'transparent', border: 'none',
                              outline: 'none', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 600
                            }}
                          />
                          {aiWebsiteSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setAiWebsiteSearchQuery('')}
                              style={{
                                background: 'transparent', border: 'none', color: 'var(--cms-text-muted)',
                                cursor: 'pointer', padding: 0, display: 'flex'
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* + Buat Template Baru Button */}
                        <button
                          type="button"
                          onClick={() => setIsCreatingCustomTemplate(true)}
                          style={{
                            padding: '6px 11px',
                            borderRadius: 10,
                            border: '1px solid #10b981',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontSize: 11,
                            fontWeight: 850,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Plus size={13} />
                          <span>Template</span>
                        </button>
                      </div>

                      {/* Category Filter Chips */}
                      <div style={{
                        display: 'flex', flexWrap: 'nowrap', gap: 5, padding: '1px 0',
                        overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
                      }}>
                        {baseCategories.map(cat => {
                          const isActive = aiWebsiteCategoryFilter === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setAiWebsiteCategoryFilter(cat.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 100,
                                border: `1px solid ${isActive ? '#10b981' : 'var(--glass-border)'}`,
                                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-input-bg)',
                                color: isActive ? '#10b981' : 'var(--cms-text-muted)',
                                fontSize: 10.5, fontWeight: isActive ? 850 : 650,
                                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                transition: 'all 0.12s ease'
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. TEMPLATE CARDS GRID (DI BAWAH MENEMPEL TOMBOL AKSI, MENGISI SELURUH RUANG KE BAWAH) */}
                    <div style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: 6,
                      padding: '1px',
                      alignContent: 'start'
                    }}>
                      {allTemplates
                        .filter(tmpl => {
                          const isCustom = tmpl.id.startsWith('custom_');
                          let matchesCategory = true;
                          if (aiWebsiteCategoryFilter === 'custom') {
                            matchesCategory = isCustom;
                          } else if (aiWebsiteCategoryFilter !== 'all') {
                            matchesCategory = tmpl.category === aiWebsiteCategoryFilter;
                          }
                          const matchesSearch = !aiWebsiteSearchQuery.trim() || 
                            tmpl.label.toLowerCase().includes(aiWebsiteSearchQuery.toLowerCase()) || 
                            tmpl.title.toLowerCase().includes(aiWebsiteSearchQuery.toLowerCase());
                          return matchesCategory && matchesSearch;
                        })
                        .map(tmpl => {
                          const IconComponent = WEBSITE_ICON_MAP[tmpl.icon] || Globe;
                          const isSelected = aiWebsiteTemplateType === tmpl.id;
                          const isCustom = tmpl.id.startsWith('custom_');
                          return (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => handleSelectAiTemplate(tmpl)}
                              style={{
                                padding: isMobile ? '9px 12px' : '8px 10px',
                                borderRadius: 10,
                                border: `1.5px solid ${isSelected ? '#10b981' : 'var(--glass-border)'}`,
                                background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-input-bg)',
                                color: isSelected ? '#10b981' : 'var(--cms-text)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 9,
                                textAlign: 'left',
                                transition: 'all 0.12s ease',
                                boxShadow: isSelected ? '0 2px 10px rgba(16, 185, 129, 0.15)' : 'none',
                                width: '100%',
                                boxSizing: 'border-box',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--cms-card-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isSelected ? '#10b981' : 'var(--cms-text-muted)'
                              }}>
                                <IconComponent size={14} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: 12,
                                  fontWeight: isSelected ? 850 : 700,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}>
                                  <span>{tmpl.label}</span>
                                  {isCustom && (
                                    <span style={{ fontSize: 8.5, padding: '1px 4px', borderRadius: 4, background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', fontWeight: 900 }}>
                                      ⭐
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                                  {tmpl.title || tmpl.tagline || 'Preset Web'}
                                </div>
                              </div>
                              {isCustom ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCustomTemplate(e, tmpl.id)}
                                  title="Hapus template kustom"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--cms-text-muted)',
                                    cursor: 'pointer',
                                    padding: 2,
                                    display: 'flex',
                                    borderRadius: 4
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              ) : (
                                isSelected && (
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                                )
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </>
                );
              })()}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* MODE 2: GEMINI AI GENERATOR (Hanya Form Prompt + Tombol)     */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {websiteGenMode === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                  {/* Quick Chips Topik */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={11} color="var(--cms-accent)" /> Rekomendasi Profil Cepat:
                    </div>
                    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                      {[
                        'Portofolio Minimalis & Clean',
                        'Fullstack Developer & Tech Stack',
                        'Agensi Desain & Branding Studio',
                        'Fotografer & Videografer Estetik'
                      ].map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiWebsitePrompt(sug)}
                          style={{
                            padding: '4px 9px',
                            borderRadius: 8,
                            border: '1px solid var(--glass-border)',
                            background: 'var(--cms-card-bg)',
                            color: 'var(--cms-text)',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cms-accent)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Textarea Instruksi */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 850, color: 'var(--cms-text)' }}>
                        <FileText size={13} color="var(--cms-accent)" />
                        <span>Instruksi Profil & Kebutuhan Website</span>
                      </div>
                      {/* Info Tooltip with Fade Transition */}
                      <div 
                        title="AI akan menghasilkan nama headline, tagline, bio profesional, palet warna tema, dan daftar layanan."
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 10, color: 'var(--cms-text-muted)', cursor: 'help'
                        }}
                      >
                        <Info size={12} />
                        <span>Format Bebas</span>
                      </div>
                    </div>

                    <textarea
                      value={aiWebsitePrompt}
                      onChange={e => setAiWebsitePrompt(e.target.value)}
                      placeholder="Contoh: Saya seorang desainer UI/UX & konsultan branding yang fokus pada startup teknologi, ingin website bergaya minimalis gelap..."
                      rows={isMobile ? 3 : 4}
                      disabled={isAiGenerating}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--cms-input-bg)',
                        border: '1.5px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--cms-accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>

                  {aiError && (
                    <div style={{
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444', fontSize: 11, fontWeight: 700
                    }}>
                      {aiError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div style={{
              display: 'flex',
              gap: 8,
              padding: isMobile ? '10px 14px max(14px, env(safe-area-inset-bottom, 14px)) 14px' : '14px 20px',
              borderTop: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                disabled={isAiGenerating}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--cms-text)',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyWebsiteTemplate}
                disabled={isAiGenerating}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: websiteGenMode === 'offline' ? '#10b981' : 'var(--cms-accent)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 850,
                  cursor: isAiGenerating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: websiteGenMode === 'offline' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : '0 4px 14px var(--cms-accent-soft)',
                  opacity: isAiGenerating ? 0.7 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {isAiGenerating ? (
                  <><Loader2 size={13} className="cms-spin" /><span>Memproses...</span></>
                ) : (
                  <>{websiteGenMode === 'offline' ? <Zap size={14} /> : <Sparkles size={14} />}<span>{websiteGenMode === 'offline' ? 'Terapkan Template' : 'Generate Profil Website'}</span></>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CREATE CUSTOM WEBSITE TEMPLATE MODAL ── */}
      {isCreatingCustomTemplate && createPortal(
        <div
          onClick={() => setIsCreatingCustomTemplate(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483645,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={isMobile ? {
              position: 'relative',
              width: '100vw',
              height: '100dvh',
              maxHeight: '100dvh',
              background: 'var(--cms-panel-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'nativeSheetUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
              overflow: 'hidden',
              boxSizing: 'border-box'
            } : {
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '12px 16px' : '14px 18px', borderBottom: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>
                <Plus size={16} color="#10b981" />
                <span>Buat Template Website Baru</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingCustomTemplate(false)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: isMobile ? '12px 16px' : '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Nama Template Website *
                </label>
                <input
                  type="text"
                  value={newTemplateForm.label}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, label: e.target.value })}
                  placeholder="Contoh: Portofolio Tech & Agency"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Kategori
                  </label>
                  <CustomDropdown
                    value={newTemplateForm.category}
                    onChange={(val) => setNewTemplateForm({ ...newTemplateForm, category: val })}
                    options={[
                      { value: 'creative', label: 'Desain' },
                      { value: 'tech', label: 'Tech & Dev' },
                      { value: 'business', label: 'Bisnis' },
                      { value: 'photo', label: 'Media' },
                      ...customWebsiteCategories.map(c => ({ value: c.id, label: c.label }))
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    + Buat Kategori Baru
                  </label>
                  <input
                    type="text"
                    value={newTemplateForm.newCategoryInput}
                    onChange={e => setNewTemplateForm({ ...newTemplateForm, newCategoryInput: e.target.value })}
                    placeholder="Nama kategori..."
                    style={{
                      width: '100%', height: 38, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 10, padding: '0 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Headline Utama
                </label>
                <input
                  type="text"
                  value={newTemplateForm.headline}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, headline: e.target.value })}
                  placeholder="Contoh: Digital Product Designer & Creative Developer"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Tagline Ringkas
                </label>
                <input
                  type="text"
                  value={newTemplateForm.tagline}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, tagline: e.target.value })}
                  placeholder="Contoh: Merancang Pengalaman Digital yang Berdampak"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Bio / Deskripsi Profil
                </label>
                <textarea
                  rows={2}
                  value={newTemplateForm.bio}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, bio: e.target.value })}
                  placeholder="Tuliskan perkenalan singkat..."
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', resize: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Skills / Keahlian (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={newTemplateForm.skills}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, skills: e.target.value })}
                  placeholder="UI/UX Design, React, Branding, Figma, Next.js"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
              padding: isMobile ? '10px 16px max(14px, env(safe-area-inset-bottom, 14px)) 16px' : '12px 18px',
              borderTop: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)'
            }}>
              <button
                type="button"
                onClick={() => setIsCreatingCustomTemplate(false)}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 750, cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewCustomTemplate}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none',
                  background: '#10b981', color: '#fff', fontSize: 11.5, fontWeight: 850, cursor: 'pointer'
                }}
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Mobile Quick Navigation Switcher Modal ── */}
      {isMobileTabMenuOpen && createPortal(
        <div
          onClick={() => setIsMobileTabMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000000,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 24,
              width: 'calc(100vw - 32px)',
              maxWidth: 540,
              maxHeight: 'calc(100dvh - 120px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              color: 'var(--cms-text, #1e293b)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
              background: 'var(--cms-card-bg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Globe size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                    Navigasi Website Studio
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--cms-text-muted)' }}>
                    Pilih menu untuk langsung berpindah modul
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileTabMenuOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                  color: 'var(--cms-text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal List of Tabs */}
            <div style={{
              padding: '12px 16px 20px 16px',
              display: 'flex', flexDirection: 'column', gap: 8,
              overflowY: 'auto', WebkitOverflowScrolling: 'touch'
            }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      changeTab(tab.key);
                      setIsMobileTabMenuOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: isActive ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                      background: isActive ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)',
                      color: isActive ? 'var(--cms-accent)' : 'var(--cms-text)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: isActive ? 'var(--cms-accent)' : 'var(--cms-card-bg)',
                        color: isActive ? '#fff' : 'var(--cms-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isActive ? '0 3px 10px var(--cms-accent-soft)' : 'none'
                      }}>
                        {tab.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13.5, fontWeight: isActive ? 850 : 700, color: 'var(--cms-text)' }}>
                          {tab.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tab.tooltip}
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--cms-accent)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Check size={14} />
                      </div>
                    ) : (
                      <ChevronRight size={16} color="var(--cms-text-muted)" opacity={0.6} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default WebsiteManager;
