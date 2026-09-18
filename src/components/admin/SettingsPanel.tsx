import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Lock, Unlock, Save, Plus, Trash2, Upload, Link as LinkIcon, ChevronRight, ChevronUp, ChevronDown, ArrowLeft, MessageSquare, ShieldCheck, Globe, ExternalLink, Layout, LogOut, Monitor, Moon, Sun, Sparkles, Settings2, Loader2, Image, Palette, Fingerprint, Smartphone, UserCog, Brush, Workflow, FileText, Info, Zap, RotateCw, ShoppingBag, Code, Type, Eye, EyeOff, CheckCircle2, AlertCircle, LayoutGrid, Database, Check, RotateCcw, User, Phone, Mail, Camera, Heart, Compass, Users, Cpu, Glasses, Smile, Shuffle, Laptop, Calendar, Video, LayoutDashboard, Search as SearchIcon, Globe2, FolderKanban, StickyNote, Receipt, Megaphone, HardDrive, Menu, Layers, Tag, SlidersHorizontal, Bell, X, Rocket, Edit3, FileCode } from 'lucide-react';
import { testGeminiConnection, PRIORITY_MODELS } from '../../utils/ai';
import { CLOUDINARY_CONFIG, GOOGLE_CONFIG } from '../../config/AppConfig';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import ShopSettingsManager from './ShopSettingsManager';
import AiMagicButton from './AiMagicButton';
import GlassColorPicker from './GlassColorPicker';
import { googleSync } from '../../utils/googleSync';
import InfoTooltip from './InfoTooltip';
import { useDialog } from './DialogProvider';
import { ALL_AVATARS, AVATAR_CATEGORIES, getRandomAvatar } from '../../utils/avatarPresets';
import { triggerPwaInstall } from './AdminPwaSuggestion';
import MediaGalleryModal from './MediaGalleryModal';
import DeployTargetModal from './DeployTargetModal';
import { EnvConfigModal, type ServiceTarget } from './EnvConfigModal';
import GoogleScriptViewerModal from './GoogleScriptViewerModal';
const StorageMonitor = React.lazy(() => import('./StorageMonitor'));

const CONTACT_PRESETS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    url: 'https://wa.me/6281234567890',
    iconBg: '#25d366',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.74 14.07c-.24.67-1.39 1.28-1.92 1.36-.5.08-1.14.12-3.32-.78-2.64-1.09-4.32-3.77-4.45-3.95-.13-.18-1.07-1.42-1.07-2.71 0-1.29.68-1.92.92-2.18.24-.26.53-.32.71-.32.18 0 .36.002.51.01.17.01.39-.06.61.47.23.55.78 1.9.85 2.04.07.14.12.31.02.5-.1.19-.15.31-.3.48-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.31.8 1.31 1.71 2.12 1.17 1.04 2.16 1.36 2.47 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.16.52.24.6.37.08.13.08.76-.16 1.43z"/></svg>`
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://instagram.com/username',
    iconBg: '#e1306c',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
  },
  {
    id: 'email',
    name: 'Email',
    url: 'mailto:hello@example.com',
    iconBg: '#ea4335',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/username',
    iconBg: '#0a66c2',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>`
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/username',
    iconBg: '#24292e',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`
  },
  {
    id: 'telegram',
    name: 'Telegram',
    url: 'https://t.me/username',
    iconBg: '#0088cc',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>`
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://youtube.com/@channel',
    iconBg: '#ff0000',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://tiktok.com/@username',
    iconBg: '#000000',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.9c0 1.75-.47 3.49-1.48 4.91-1.39 1.95-3.66 3.19-6.07 3.17-2.31-.02-4.52-1.12-5.88-2.97-1.48-2.02-1.84-4.73-1.01-7.05.83-2.33 2.87-3.99 5.33-4.32.74-.1 1.48-.07 2.21.08v4.13c-.45-.14-.93-.18-1.4-.14-1.19.09-2.28.84-2.73 1.93-.45 1.09-.23 2.39.56 3.25.79.86 2.02 1.17 3.15.81 1.03-.33 1.76-1.29 1.79-2.38V.02h-.7z"/></svg>`
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    url: 'https://x.com/username',
    iconBg: '#000000',
    iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
  }
];

// Curated Theme Presets (24 Variasi Tema Estetik & Modern)
export const THEME_PALETTES = [
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

let idCounter = Date.now();
const newId = () => `sc_${++idCounter}`;

const SmoothSlider = ({ min, max, step = 1, defaultValue, suffix = '', onChange, onCommit, cssVar }) => {
  const [val, setVal] = useState(defaultValue);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <input type="range" min={min} max={max} step={step} value={val} 
        onChange={e => {
          const v = parseFloat(e.target.value);
          setVal(v);
          if (cssVar) document.documentElement.style.setProperty(cssVar, suffix === '%' ? v : `${v}${suffix}`);
          if (onChange) onChange(v);
        }} 
        onPointerUp={e => {
          if (onCommit) onCommit(parseFloat(e.target.value));
        }}
        onTouchEnd={e => {
          if (onCommit) onCommit(parseFloat(e.target.value));
        }}
        style={{ flex: 1, accentColor: 'var(--cms-accent)', minWidth: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-accent)', minWidth: 44, textAlign: 'right' }}>
        {suffix === '%' ? Math.round(val * 100) + '%' : val + suffix}
      </span>
    </div>
  );
};

const SettingsRow = ({ icon, title, desc, children }) => (
  <div className="settings-row" style={{ 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '16px 0', borderBottom: '1px solid var(--glass-border)', gap: 12,
    width: '100%'
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        {icon && <div style={{ color: 'var(--cms-accent)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</div>}
        <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.01em' }}>{title}</div>
        {desc && <InfoTooltip content={desc} />}
      </div>
    </div>
    <div className="settings-row-action" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
      {children}
    </div>
  </div>
);

const SectionHeader = ({ icon, title, desc, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, animation: 'cmsSlideIn 0.4s ease' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div className="cms-icon-box" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)' }}>
        {icon}
      </div>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ color: 'var(--cms-text-muted)', margin: '1px 0 0', fontWeight: 600, fontSize: 11 }}>{desc}</p>
      </div>
    </div>
    {action}
  </div>
);

const SettingsPanel = ({ globalSettings, userData, onUpdateSettings, notify, isDarkMode, onToggleDarkMode, currentFrames, onUpdateFrames }) => {
  const { showConfirm, showPrompt } = useDialog();
  const [activeCategory, setActiveCategory] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [isWiping, setIsWiping] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [googleSheetId, setGoogleSheetId] = useState(globalSettings.googleSheetId || '');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(globalSettings.autoBackupEnabled || false);
  // ─── Config kini terpusat di AppConfig.ts — tidak perlu lagi di localStorage ───

  const [isUploadingCmsLogo, setIsUploadingCmsLogo] = useState(false);
  const [isUploadingPreloader, setIsUploadingPreloader] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'cmsLogo' | 'loginBanner'>('cmsLogo');
  const [brandingDraft, setBrandingDraft] = useState({ cmsName: '', siteTitle: '' });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [isDeployTargetOpen, setIsDeployTargetOpen] = useState(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [envModalTarget, setEnvModalTarget] = useState<ServiceTarget>('all');
  const [backupCategory, setBackupCategory] = useState<'all' | 'pages' | 'blogs' | 'catalog' | 'notes' | 'projects'>('all');

  const handleOpenEnvEditor = async (target: ServiceTarget = 'all') => {
    const code = await showPrompt(
      '🔒 KEAMANAN TINGKAT TINGGI\n\nUntuk membuka dan mengubah konfigurasi .env, ketik kalimat persis di bawah ini:\n\nbuka saya mau edit ini',
      '',
      'Kunci Akses .env'
    );
    if (code !== 'buka saya mau edit ini') {
      if (code !== null) {
        if (notify) notify('❌ Kunci salah! Akses ditolak.', 'error');
      }
      return;
    }
    setEnvModalTarget(target);
    setIsEnvModalOpen(true);
  };

  // Gemini key dibaca dari .env / AppConfig — tidak perlu state form override
  const geminiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || localStorage.getItem('GEMINI_API_KEY') || '';
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    model: string;
    message: string;
    latencyMs: number;
  } | null>(null);
  const svgRefs = useRef({});

  // Admin Profile Editor State
  const [adminProfile, setAdminProfile] = useState({
    name: userData?.name || 'Admin',
    phone: userData?.phone || '',
    avatar: userData?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(userData?.name || 'Admin')}`
  });
  const [isSavingAdminProfile, setIsSavingAdminProfile] = useState(false);
  const [adminAvatarCategory, setAdminAvatarCategory] = useState('all');
  const [isAdminAvatarExpanded, setIsAdminAvatarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (userData) {
      setAdminProfile({
        name: userData.name || 'Admin',
        phone: userData.phone || '',
        avatar: userData.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(userData.name || 'Admin')}`
      });
    }
  }, [userData]);

  const handleSaveAdminProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminProfile.name.trim()) {
      notify('Nama admin tidak boleh kosong', 'error');
      return;
    }
    setIsSavingAdminProfile(true);
    try {
      const currentUid = userData?.id || auth.currentUser?.uid;
      if (currentUid) {
        await updateDoc(doc(db, 'users', currentUid), {
          name: adminProfile.name.trim(),
          phone: adminProfile.phone.trim(),
          avatar: adminProfile.avatar
        });
      }
      notify('✅ Profil Admin berhasil diperbarui!', 'success');
    } catch (err) {
      console.error('Error saving admin profile:', err);
      notify('Gagal menyimpan profil admin', 'error');
    } finally {
      setIsSavingAdminProfile(false);
    }
  };





  const categories = useMemo(() => [
    { id: 'branding', icon: <Brush size={18} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', title: 'Vibe', desc: 'Warna cerah, layout & kustomisasi tampilan', group: 'Tampilan' },
    { id: 'access_lock', icon: <Lock size={18} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', title: 'Security', desc: 'Proteksi sandi website & gembok halaman', group: 'Keamanan' },
    { id: 'pwa', icon: <Smartphone size={18} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', title: 'App', desc: 'Instal aplikasi studio & mode offline', group: 'Sistem' },
    { id: 'storage', icon: <HardDrive size={18} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', title: 'Storage', desc: 'Monitoring penyimpanan & galeri media', group: 'Sistem' },
    { id: 'cloud', icon: <Workflow size={18} />, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)', title: 'Sync', desc: 'Gemini AI, Google Sheets & Cloud', group: 'Sistem' },
    { id: 'security', icon: <UserCog size={18} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', title: 'Access', desc: 'Profil crew, avatar & password', group: 'Keamanan' },
  ].filter(c => c.id !== 'cloud' || (userData && userData.role === 'Super Admin')), [userData]);

  const sliderRefs = useRef({
    blur: globalSettings.glassBlur ?? 12,
    opacity: globalSettings.glassOpacity ?? 0.3,
    radius: globalSettings.frameRadius ?? 24
  });

  useEffect(() => {
    sliderRefs.current.blur = globalSettings.glassBlur ?? 12;
    sliderRefs.current.opacity = globalSettings.glassOpacity ?? 0.3;
    sliderRefs.current.radius = globalSettings.frameRadius ?? 24;
  }, [globalSettings.glassBlur, globalSettings.glassOpacity, globalSettings.frameRadius]);

  useEffect(() => {
    const handleCategoryEvent = (e: any) => {
      const cat = e?.detail?.category;
      if (cat && categories.some(c => c.id === cat)) {
        setActiveCategory(cat);
      }
    };
    window.addEventListener('cms_open_settings_category', handleCategoryEvent);
    return () => window.removeEventListener('cms_open_settings_category', handleCategoryEvent);
  }, [categories]);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const page = pathParts.length > 1 ? pathParts[1] : '';
    if (page.startsWith('settings_')) {
      const catId = page.replace('settings_', '');
      if (categories.some(c => c.id === catId)) {
        setActiveCategory(catId);
      }
    } else if (page === 'settings') {
      const sub = pathParts[2];
      if (sub && categories.some(c => c.id === sub)) {
        setActiveCategory(sub);
      } else if (!sub) {
        setActiveCategory(null);
      }
    }
  }, [window.location.pathname, categories]);

  useEffect(() => {
    const handleAdd = () => {
      if (activeCategory === 'contacts') addContact();
    };
    const handleBack = () => {
      setActiveCategory(null);
    };
    window.addEventListener('porto_add_action', handleAdd);
    window.addEventListener('cms_settings_back', handleBack);
    window.dispatchEvent(new CustomEvent('cms_settings_sub_changed', { detail: { hasActiveSub: !!activeCategory } }));
    
    const handleGlobalSave = async () => {
      if (!activeCategory) {
        if (notify) notify('✅ Pengaturan telah tersinkronisasi');
        return;
      }

      if (activeCategory === 'branding') {
        const newSettings = {
          ...globalSettings,
          cmsName: brandingDraft.cmsName,
          siteTitle: brandingDraft.siteTitle,
          glassBlur: sliderRefs.current.blur,
          glassOpacity: sliderRefs.current.opacity,
          frameRadius: sliderRefs.current.radius,
        };
        onUpdateSettings(newSettings);
        if (brandingDraft.siteTitle) document.title = brandingDraft.siteTitle;
        if (notify) notify('✅ Pengaturan Tema & Branding berhasil disimpan!');
      } else if (activeCategory === 'security') {
        await handleSaveAdminProfile();
      } else if (activeCategory === 'access_lock') {
        if (notify) notify('✅ Pengaturan Gembok Akses tersimpan!');
      } else {
        if (notify) notify('✅ Pengaturan berhasil disimpan!');
      }
      window.dispatchEvent(new Event('porto_saved'));
    };

    window.addEventListener('cms_settings_save', handleGlobalSave);

    return () => {
      window.removeEventListener('porto_add_action', handleAdd);
      window.removeEventListener('cms_settings_back', handleBack);
      window.removeEventListener('cms_settings_save', handleGlobalSave);
      window.dispatchEvent(new CustomEvent('cms_settings_sub_changed', { detail: { hasActiveSub: false } }));
    };
  }, [activeCategory, contacts, brandingDraft, globalSettings, onUpdateSettings, handleSaveAdminProfile, notify]);

  useEffect(() => {
    const load = async () => {
      const s = await storage.getItem('porto_contacts', []);
      setContacts(s);
    };
    load();
  }, []);

  useEffect(() => {
    if (activeCategory === 'branding') {
      setBrandingDraft({
        cmsName: globalSettings.cmsName || '',
        siteTitle: globalSettings.siteTitle || ''
      });
    }
  }, [activeCategory, globalSettings.cmsName, globalSettings.siteTitle]);

  const saveBranding = () => {
    onUpdateSettings({ cmsName: brandingDraft.cmsName, siteTitle: brandingDraft.siteTitle });
    if (brandingDraft.siteTitle) document.title = brandingDraft.siteTitle;
    storage.logActivity('Updated Branding', { cmsName: brandingDraft.cmsName });
    if (notify) notify('✅ Branding disimpan!');
  };

  const updateContacts = async (updated) => {
    setContacts(updated);
    storage.debouncedSetItem('porto_contacts', updated);
    window.dispatchEvent(new Event('porto_saved'));
  };

  const addContact = () => {
    if (contacts.length >= 6) {
      if (notify) notify('⚠️ Batas maksimal 6 platform sosmed tercapai', 'error');
      return;
    }
    const updated = [...contacts, { id: newId(), name: '', url: '', iconSvg: '', iconBg: '#f3f4f6' }];
    updateContacts(updated);
    if(notify) notify('✨ Kontak baru ditambahkan');
  };

  const removeContact = async (id) => {
    if (await showConfirm('Hapus kontak ini?')) {
      updateContacts(contacts.filter(c => c.id !== id));
      if(notify) notify('🗑️ Kontak dihapus');
    }
  };

  const updateField = (id, field, value) => {
    updateContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSvgUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateField(id, 'iconSvg', ev.target.result);
    reader.readAsText(file);
  };

  const renderContent = () => {
    if (!activeCategory) {
      return (
        <div className="settings-welcome" style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start', 
          flexDirection: 'column', textAlign: 'center', padding: '48px 24px 80px', animation: 'cmsFadeIn 0.5s ease',
          width: '100%', boxSizing: 'border-box'
        }}>

          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 40px 0', color: 'var(--cms-text)' }}>Studio Settings ☀️</h2>
          
          
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 32,
            width: '100%', maxWidth: 860, textAlign: 'left'
          }}>
            {Object.entries(
              categories.reduce((acc, cat) => {
                if (!acc[cat.group]) acc[cat.group] = [];
                acc[cat.group].push(cat);
                return acc;
              }, {})
            ).map(([groupName, groupCats]) => (
              <div key={groupName} className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 16 }}>
                  {groupName}
                </div>
                <div className="cms-card premium-glass" style={{
                  display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border)',
                  borderRadius: 20, background: 'var(--cms-card-bg)', padding: '6px', overflow: 'hidden'
                }}>
                  {groupCats.map((cat) => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '12px 14px',
                      border: 'none', borderRadius: 14,
                      background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="cms-icon-box" style={{ 
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: cat.bg, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {cat.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>{cat.title}</div>
                      </div>
                      <InfoTooltip content={cat.desc} />
                      <ChevronRight size={18} color="var(--cms-text-muted)" style={{ marginLeft: 6 }} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="settings-detail-view" style={{ animation: 'cmsFadeIn 0.4s ease', paddingBottom: 24 }}>
        {activeCategory !== 'contacts' && (
          <SectionHeader 
            icon={categories.find(c => c.id === activeCategory)?.icon} 
            title={categories.find(c => c.id === activeCategory)?.title} 
            desc={categories.find(c => c.id === activeCategory)?.desc}
            action={null}
          />
        )}
        
        <div className="settings-content-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>

          {activeCategory === 'branding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* ── 1. BRANDING & IDENTITAS UTAMA ── */}
              <div className="cms-card" style={{ padding: 24, borderRadius: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '0.06em', marginBottom: 20, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brush size={16} color="var(--cms-accent)" /> Branding & Identitas
                </div>
                
                <div className="settings-vertical-rows">
                  {/* Nama Brand */}
                  <div className="settings-row" style={{ display: 'flex', flexDirection: 'column', padding: '16px 0', borderBottom: '1px solid var(--glass-border)', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ color: 'var(--cms-accent)' }}><Brush size={18}/></div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Nama Brand</div>
                        <InfoTooltip content="Nama brand/agensi yang tampil di sidebar dan header admin." />
                      </div>
                      <AiMagicButton 
                        label="Saran Nama"
                        prompt="Berikan 3 saran nama kreatif untuk sebuah CMS portofolio pribadi (singkat & profesional)."
                        onSuggest={(text) => setBrandingDraft(p => ({ ...p, cmsName: text.split('\n')[0].replace(/^[0-9].\s*/, '') }))}
                      />
                    </div>
                    <input
                      className="cms-input"
                      style={{ height: 44, borderRadius: 12, fontSize: 14, width: '100%', background: 'var(--cms-input-bg)' }}
                      placeholder="Misal: sumr.day OS"
                      value={brandingDraft.cmsName}
                      onChange={e => setBrandingDraft(p => ({ ...p, cmsName: e.target.value }))}
                    />
                  </div>

                  {/* Logo Brand */}
                  <div className="settings-row" style={{ display: 'flex', flexDirection: 'column', padding: '16px 0', borderBottom: '1px solid var(--glass-border)', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: 'var(--cms-accent)' }}><Image size={18}/></div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Logo Brand</div>
                      <InfoTooltip content="Ikon/logo di pojok kiri sidebar (gambar rasio 1:1)." />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: 16, border: '1px solid var(--glass-border)',
                        background: 'var(--cms-switcher-bg)', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {globalSettings.cmsLogo
                          ? <img src={globalSettings.cmsLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="CMS Logo" />
                          : isUploadingCmsLogo
                            ? <Loader2 size={20} style={{ animation: 'cmsSpin 0.8s linear infinite', color: 'var(--cms-accent)' }} />
                            : <Upload size={18} color="var(--cms-text-muted)" />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="cms-btn"
                            style={{ height: 34, padding: '0 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            onClick={() => document.getElementById('cms-logo-upload').click()}
                          >
                            <Upload size={13} />
                            {globalSettings.cmsLogo ? 'Ganti' : 'Upload'}
                          </button>
                          <button
                            className="cms-btn"
                            type="button"
                            style={{ height: 34, padding: '0 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            onClick={() => { setGalleryTarget('cmsLogo'); setShowGalleryModal(true); }}
                          >
                            <Image size={13} />
                            Galeri
                          </button>
                        </div>
                        {globalSettings.cmsLogo && (
                          <button
                            className="cms-btn"
                            style={{ height: 34, padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            onClick={async () => { if (await showConfirm('Hapus logo CMS?')) onUpdateSettings({ cmsLogo: null }); }}
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        )}
                      </div>
                      <input id="cms-logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                        const file = e.target.files[0]; if (!file) return;
                        setIsUploadingCmsLogo(true);
                        try {
                          const res = await uploadToCloudinary(file, 'image');
                          onUpdateSettings({ cmsLogo: res.url });
                          if (notify) notify('✅ Logo CMS diperbarui!');
                        } catch { if (notify) notify('❌ Gagal upload logo', 'error'); }
                        finally { setIsUploadingCmsLogo(false); }
                      }} />
                    </div>
                  </div>

                  {/* Banner Login */}
                  <div className="settings-row" style={{ display: 'flex', flexDirection: 'column', padding: '16px 0', borderBottom: '1px solid var(--glass-border)', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: '#ec4899' }}><Monitor size={18}/></div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Banner Login</div>
                      <InfoTooltip content="Gambar latar untuk panel visual di halaman login admin." />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{
                        width: 120, height: 72, borderRadius: 12, flexShrink: 0,
                        background: globalSettings.loginBannerImage
                          ? `url(${globalSettings.loginBannerImage}) center/cover no-repeat`
                          : 'linear-gradient(135deg, #0f0c29, #302b63, var(--cms-accent, #7c3aed))',
                        border: '1px solid var(--glass-border)', overflow: 'hidden'
                      }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="cms-btn"
                            style={{ height: 34, padding: '0 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            onClick={() => document.getElementById('login-banner-upload').click()}
                          >
                            <Upload size={13} />
                            {globalSettings.loginBannerImage ? 'Ganti' : 'Upload'}
                          </button>
                          <button
                            className="cms-btn"
                            type="button"
                            style={{ height: 34, padding: '0 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            onClick={() => { setGalleryTarget('loginBanner'); setShowGalleryModal(true); }}
                          >
                            <Image size={13} />
                            Galeri
                          </button>
                        </div>
                        {globalSettings.loginBannerImage && (
                          <button
                            className="cms-btn"
                            style={{ height: 34, padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            onClick={() => onUpdateSettings({ loginBannerImage: null })}
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        )}
                      </div>
                      <input id="login-banner-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                        const file = e.target.files[0]; if (!file) return;
                        try {
                          const res = await uploadToCloudinary(file, 'image');
                          onUpdateSettings({ loginBannerImage: res.url });
                          if (notify) notify('✅ Banner login diperbarui!');
                        } catch { if (notify) notify('❌ Gagal upload banner', 'error'); }
                      }} />
                    </div>
                  </div>

                  {/* Title SEO */}
                  <div className="settings-row" style={{ display: 'flex', flexDirection: 'column', padding: '16px 0', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ color: 'var(--cms-accent)' }}><Globe size={18}/></div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Title SEO</div>
                        <InfoTooltip content="Judul utama yang tampil pada tab browser dan hasil pencarian Google." />
                      </div>
                      <AiMagicButton 
                        label="Saran Title SEO"
                        prompt="Berikan saran title tag SEO yang menarik untuk website portofolio seorang desainer/developer."
                        onSuggest={(text) => setBrandingDraft(p => ({ ...p, siteTitle: text.split('\n')[0].replace(/^[0-9].\s*/, '') }))}
                      />
                    </div>
                    <input
                      className="cms-input"
                      style={{ height: 44, borderRadius: 12, fontSize: 14, width: '100%', background: 'var(--cms-input-bg)' }}
                      placeholder="Misal: sumr.day | Creative Digital Studio"
                      value={brandingDraft.siteTitle}
                      onChange={e => setBrandingDraft(p => ({ ...p, siteTitle: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* ── 2. WARNA AKSEN & TAMPILAN CMS ── */}
              <div className="cms-card" style={{ padding: 24, borderRadius: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '0.06em', marginBottom: 20, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Palette size={16} color="var(--cms-accent)" /> Warna Aksen & Tampilan
                </div>

                <div className="settings-vertical-rows" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Pill Color Selector & Custom Hex */}
                  <SettingsRow title="Warna Aksen" desc="Warna tema utama untuk tombol, lencana, dan aksen navigasi." icon={<Palette size={18} />}>
                    <GlassColorPicker 
                      value={globalSettings.accentColor || 'var(--cms-accent, #7c3aed)'} 
                      onChange={(color) => onUpdateSettings({ accentColor: color })} 
                    />
                  </SettingsRow>

                  <SettingsRow title="Mode Tampilan" desc="Sesuaikan antarmuka sistem CMS (Mode Terang atau Mode Gelap)." icon={isDarkMode ? <Moon size={18}/> : <Sun size={18}/>}>
                    <button 
                      onClick={onToggleDarkMode} 
                      type="button"
                      aria-label="Beralih Tema Gelap/Terang"
                      style={{ 
                        width: 52, 
                        height: 28, 
                        borderRadius: 9999, 
                        border: 'none', 
                        outline: 'none',
                        cursor: 'pointer', 
                        background: isDarkMode ? 'var(--cms-accent, #7c3aed)' : '#cbd5e1', 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: '2px',
                        boxSizing: 'border-box',
                        position: 'relative', 
                        transition: 'background 0.25s ease', 
                        flexShrink: 0,
                        verticalAlign: 'middle',
                        lineHeight: 1
                      }}
                    >
                      <span style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        background: '#ffffff', 
                        transform: isDarkMode ? 'translateX(24px)' : 'translateX(0px)', 
                        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: '0 2px 5px rgba(0,0,0,0.22)',
                        boxSizing: 'border-box',
                        flexShrink: 0
                      }}>
                        {isDarkMode ? <Moon size={13} color="var(--cms-accent, #7c3aed)" strokeWidth={2.5} /> : <Sun size={13} color="#f59e0b" strokeWidth={2.5} />}
                      </span>
                    </button>
                  </SettingsRow>
                </div>
              </div>

              {/* ── 3. TIPOGRAFI & FRAME WEBSITE ── */}
              <div className="cms-card" style={{ padding: 24, borderRadius: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '0.06em', marginBottom: 20, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Type size={16} color="var(--cms-accent)" /> Tipografi & Bingkai
                </div>

                <div className="settings-vertical-rows" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <SettingsRow title="Font Pairing" desc="Kombinasi font untuk Heading dan teks konten website.">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 440, margin: '0 auto' }}>
                      {[
                        { label: 'Inter', val: 'inter' },
                        { label: 'Jakarta', val: 'jakarta' },
                        { label: 'Playfair', val: 'playfair' },
                        { label: 'Space', val: 'space' },
                        { label: 'Outfit', val: 'outfit' },
                        { label: 'Poppins', val: 'poppins' },
                        { label: 'Montserrat', val: 'montserrat' },
                        { label: 'Quicksand', val: 'quicksand' },
                        { label: 'DM Sans', val: 'dmsans' }
                      ].map(s => (
                        <button 
                          key={s.val} 
                          onClick={() => onUpdateSettings({ fontPairing: s.val })} 
                          style={{ 
                            height: 34, 
                            padding: '0 16px', 
                            borderRadius: 100, 
                            border: '1px solid ' + ((globalSettings.fontPairing || 'inter') === s.val ? 'var(--cms-accent)' : 'var(--glass-border)'), 
                            cursor: 'pointer', 
                            background: (globalSettings.fontPairing || 'inter') === s.val ? 'var(--cms-accent)' : 'var(--cms-input-bg)', 
                            color: (globalSettings.fontPairing || 'inter') === s.val ? '#fff' : 'var(--cms-text-muted)', 
                            fontSize: 12, 
                            fontWeight: 800, 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            transition: 'all 0.2s' 
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </SettingsRow>

                  <SettingsRow title="Ukuran Teks" desc="Ukuran dasar font teks (Base Size) untuk seluruh website.">
                    <SmoothSlider min="12" max="20" step="1" defaultValue={globalSettings.baseFontSize || 16} suffix="px" onCommit={v => onUpdateSettings({ baseFontSize: v })} />
                  </SettingsRow>

                  <SettingsRow title="Bingkai Website" desc="Kelengkungan sudut frame website publik (Desktop & Tablet).">
                    <SmoothSlider min="0" max="48" defaultValue={sliderRefs.current.radius} suffix="px" onCommit={v => onUpdateSettings({ frameRadius: v })} onChange={v => sliderRefs.current.radius = v} />
                  </SettingsRow>
                </div>
              </div>

              {/* ── 5. KODE LANJUTAN (CUSTOM CSS) ── */}
              <div className="cms-card" style={{ padding: 24, borderRadius: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '0.06em', marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code size={16} color="var(--cms-accent)" /> Custom CSS
                </div>

                <div className="settings-row" style={{ display: 'flex', flexDirection: 'column', gap: 10, border: 'none', padding: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 600 }}>Tulis kode CSS kustom untuk styling lanjutan di luar pengaturan bawaan:</div>
                  <textarea
                    className="cms-input"
                    style={{ minHeight: 110, borderRadius: 12, fontSize: 12.5, width: '100%', background: 'var(--cms-input-bg)', fontFamily: 'monospace', padding: 12, border: '1.5px solid var(--glass-border)', boxSizing: 'border-box' }}
                    placeholder=".my-custom-class { color: var(--cms-accent); }"
                    value={globalSettings.customCSS || ''}
                    onChange={e => {
                      const css = e.target.value;
                      onUpdateSettings({ customCSS: css });
                      let styleTag = document.getElementById('porto-custom-css');
                      if (!styleTag) { styleTag = document.createElement('style'); styleTag.id = 'porto-custom-css'; document.head.appendChild(styleTag); }
                      styleTag.innerHTML = css;
                    }}
                  />
                </div>
              </div>

              {/* ── TOMBOL SIMPAN PENGATURAN ── */}
              <div style={{ padding: '8px 0 24px', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={async () => {
                    const newSettings = {
                      ...globalSettings,
                      cmsName: brandingDraft.cmsName,
                      siteTitle: brandingDraft.siteTitle,
                      glassBlur: sliderRefs.current.blur,
                      glassOpacity: sliderRefs.current.opacity,
                      frameRadius: sliderRefs.current.radius
                    };
                    
                    onUpdateSettings(newSettings);
                    if (brandingDraft.siteTitle) document.title = brandingDraft.siteTitle;
                    storage.logActivity('Updated Branding', { cmsName: brandingDraft.cmsName });
                    
                    const mainWeb = await storage.getItem('porto_main_website', null);
                    const batchPayload = { 'porto_settings': newSettings };
                    if (mainWeb && newSettings.accentColor) {
                      batchPayload['porto_main_website'] = {
                        ...mainWeb,
                        theme: { ...(mainWeb.theme || {}), accentColor: newSettings.accentColor }
                      };
                    }
                    await storage.batchSetItems(batchPayload, true);
                    window.dispatchEvent(new Event('porto_saved'));
                    
                    if (notify) notify('✅ Konfigurasi Tema & Tampilan Disimpan!');
                  }}
                  className="cms-btn"
                  style={{ width: '100%', height: 50, borderRadius: 14, fontSize: 14, fontWeight: 800, background: 'var(--cms-accent)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 16px var(--cms-accent-soft)', transition: 'all 0.2s ease' }}
                >
                  <Save size={18} /> Simpan
                </button>
              </div>
            </div>
          )}




          {/* ── PUSAT KONTROL GEMBOK & PRIVASI WEBSITE (CENTRALIZED ACCESS LOCK) ── */}
          {activeCategory === 'access_lock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'cmsFadeIn 0.3s ease' }}>
              {/* 1. Status & Master Toggle Card */}
              <div className="cms-card premium-glass" style={{ padding: 24, borderRadius: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: globalSettings.accessLock?.isLocked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: globalSettings.accessLock?.isLocked ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {globalSettings.accessLock?.isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>Status Gembok Akses</div>
                      <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {globalSettings.accessLock?.isLocked ? (
                          globalSettings.accessLock?.mode === 'all' ? (
                            <><Lock size={13} color="#ef4444" /> Seluruh Website Klien Terkunci</>
                          ) : (
                            <><ShieldCheck size={13} color="var(--cms-accent)" /> Mode Gembok Selektif Aktif</>
                          )
                        ) : (
                          <><Globe size={13} color="#10b981" /> Website Terbuka untuk Publik Bebas</>
                        )}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 11, fontWeight: 900, padding: '6px 14px', borderRadius: 100,
                    background: globalSettings.accessLock?.isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: globalSettings.accessLock?.isLocked ? '#ef4444' : '#10b981',
                    border: '1px solid ' + (globalSettings.accessLock?.isLocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'),
                    display: 'inline-flex', alignItems: 'center', gap: 5
                  }}>
                    {globalSettings.accessLock?.isLocked ? <><Lock size={12} /> Terproteksi</> : <><Globe size={12} /> Publik</>}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <SettingsRow title="Proteksi Gembok" desc="Nyalakan gembok untuk memproteksi halaman dari publik / HRD tanpa izin.">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!globalSettings.accessLock?.isLocked}
                      className="cms-switch"
                      onClick={() => {
                        const cur = globalSettings.accessLock || {};
                        const updated = {
                          ...cur,
                          isLocked: !cur.isLocked,
                          mode: cur.mode || 'selective',
                          lockedPages: cur.lockedPages || ['/portfolio', '/about', '/lpimage/biodata'],
                          password: cur.password || '123456',
                          title: cur.title || 'Akses Privat: Dokumen Terproteksi',
                          message: cur.message || 'Halaman ini bersifat privat. Silakan masukkan kata sandi akses atau hubungi pemilik untuk meminta PIN.',
                          contactChannel: cur.contactChannel || 'whatsapp',
                          contactTarget: cur.contactTarget || '',
                          contactText: cur.contactText || 'Halo, saya ingin meminta kode sandi akses untuk melihat halaman ini.'
                        };
                        onUpdateSettings({ accessLock: updated });
                        if (notify) notify(updated.isLocked ? 'Gembok Website Diaktifkan' : 'Website Terbuka untuk Publik');
                      }}
                    >
                      <div className="cms-switch-knob" />
                    </button>
                  </SettingsRow>

                  {/* Mode Selector */}
                  {globalSettings.accessLock?.isLocked && (
                    <div style={{ display: 'flex', gap: 8, background: 'var(--cms-switcher-bg)', padding: 4, borderRadius: 14, border: '1px solid var(--glass-border)' }}>
                      {[
                        { id: 'selective', label: 'Selektif', icon: <ShieldCheck size={14} />, desc: 'Pilih halaman tertentu yang digembok' },
                        { id: 'all', label: 'Semua Halaman', icon: <Lock size={14} />, desc: 'Kunci seluruh website klien' },
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            const cur = globalSettings.accessLock || {};
                            onUpdateSettings({ accessLock: { ...cur, mode: m.id } });
                          }}
                          style={{
                            flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: (globalSettings.accessLock?.mode || 'selective') === m.id ? 'var(--cms-accent)' : 'transparent',
                            color: (globalSettings.accessLock?.mode || 'selective') === m.id ? '#fff' : 'var(--cms-text-muted)',
                            fontSize: 12, fontWeight: 800, transition: 'all 0.2s ease', textAlign: 'center',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
                          }}
                        >
                          {m.icon}
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Categorized Page Matrix (Only shown if isLocked and mode === 'selective') */}
              {globalSettings.accessLock?.isLocked && (globalSettings.accessLock?.mode || 'selective') === 'selective' && (() => {
                const cur = globalSettings.accessLock || {};
                const lockedList: string[] = cur.lockedPages || [];

                const togglePage = (pagePath: string) => {
                  const exists = lockedList.includes(pagePath);
                  const updated = exists ? lockedList.filter(p => p !== pagePath) : [...lockedList, pagePath];
                  onUpdateSettings({ accessLock: { ...cur, lockedPages: updated } });
                };

                const pageCategories = [
                  {
                    name: 'Website Client',
                    icon: <Globe size={15} color="var(--cms-accent)" />,
                    pages: [
                      { path: '/', label: 'Beranda / Landing Page', route: '/' },
                      { path: '/portfolio', label: 'Portofolio & Karya', route: '/portfolio' },
                      { path: '/about', label: 'Tentang Kami & Profil', route: '/about' },
                      { path: '/links', label: 'Bio Links & Tautan', route: '/links' },
                      { path: '/katalog', label: 'Katalog & Toko Online', route: '/katalog' },
                    ]
                  },
                  {
                    name: 'LP Image',
                    icon: <Image size={15} color="#ec4899" />,
                    pages: [
                      { path: '/lpimage/home', label: 'LP Image Home', route: '/lpimage/home' },
                      { path: '/lpimage/portofolio', label: 'LP Image Portofolio', route: '/lpimage/portofolio' },
                      { path: '/lpimage/biodata', label: 'LP Image Biodata / CV', route: '/lpimage/biodata' },
                      ...(globalSettings.customPages || []).filter((p: any) => !p.isSystem && !p.isDeleted).map((p: any) => ({
                        path: `/lpimage/${p.slug}`,
                        label: `LP Image: ${p.name || p.slug}`,
                        route: `/lpimage/${p.slug}`
                      }))
                    ]
                  },
                  {
                    name: 'Blog & Artikel',
                    icon: <FileText size={15} color="#10b981" />,
                    pages: [
                      { path: '/blog', label: 'Seluruh Halaman Blog & Artikel', route: '/blog' },
                    ]
                  }
                ];

                const allDefinedPaths = pageCategories.flatMap(c => c.pages.map(p => p.path));

                return (
                  <div className="cms-card premium-glass" style={{ padding: 24, borderRadius: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Lock size={16} color="var(--cms-accent)" /> Halaman Terkunci ({lockedList.length})
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSettings({ accessLock: { ...cur, lockedPages: allDefinedPaths } });
                            if (notify) notify('Semua halaman berhasil digembok');
                          }}
                          style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Lock size={11} /> Kunci
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateSettings({ accessLock: { ...cur, lockedPages: [] } });
                            if (notify) notify('Semua halaman dibuka untuk publik');
                          }}
                          style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Unlock size={11} /> Buka
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {pageCategories.map(cat => (
                        <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {cat.icon} {cat.name}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                            {cat.pages.map(p => {
                              const isLocked = lockedList.includes(p.path);
                              return (
                                <div
                                  key={p.path}
                                  onClick={() => togglePage(p.path)}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                                    background: isLocked ? 'rgba(var(--cms-accent-rgb), 0.12)' : 'var(--cms-input-bg)',
                                    border: isLocked ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                                    transition: 'all 0.2s ease', userSelect: 'none'
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>{p.label}</span>
                                    <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', fontFamily: 'monospace' }}>{p.route}</span>
                                  </div>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: isLocked ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                                    color: isLocked ? '#fff' : 'var(--cms-text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, transition: 'all 0.2s'
                                  }}>
                                    {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 3. Credentials & Lock Screen Styling Card */}
              {globalSettings.accessLock?.isLocked && (
                <div className="cms-card premium-glass" style={{ padding: 24, borderRadius: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} color="var(--cms-accent)" /> Kredensial Layar Kunci
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Kata Sandi */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Kata Sandi</label>
                          <InfoTooltip content="Kode PIN / password untuk membuka proteksi layar kunci." />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
                            const cur = globalSettings.accessLock || {};
                            onUpdateSettings({ accessLock: { ...cur, password: randomPin } });
                            if (notify) notify(`PIN Baru: ${randomPin}`);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Sparkles size={12} /> Acak
                        </button>
                      </div>
                      <input
                        type="text"
                        className="cms-input"
                        style={{ height: 44, borderRadius: 12, fontSize: 14, fontWeight: 800, width: '100%', letterSpacing: '0.08em' }}
                        value={globalSettings.accessLock?.password || ''}
                        placeholder="Contoh: 123456 atau vip-client"
                        onChange={e => {
                          const cur = globalSettings.accessLock || {};
                          onUpdateSettings({ accessLock: { ...cur, password: e.target.value } });
                        }}
                      />
                    </div>

                    {/* Judul & Saluran */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Judul Gembok</label>
                          <InfoTooltip content="Judul header yang muncul di halaman layar kunci." />
                        </div>
                        <input
                          type="text"
                          className="cms-input"
                          style={{ height: 44, borderRadius: 12, fontSize: 13, width: '100%' }}
                          value={globalSettings.accessLock?.title || ''}
                          placeholder="Misal: Akses Terproteksi: Portofolio Eksklusif"
                          onChange={e => {
                            const cur = globalSettings.accessLock || {};
                            onUpdateSettings({ accessLock: { ...cur, title: e.target.value } });
                          }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Saluran Bantuan</label>
                          <InfoTooltip content="Media kontak bagi pengunjung untuk meminta kode sandi akses." />
                        </div>
                        <div style={{ display: 'flex', gap: 4, background: 'var(--cms-switcher-bg)', padding: 3, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                          {[
                            { label: 'WhatsApp', val: 'whatsapp' },
                            { label: 'Instagram', val: 'instagram' },
                            { label: 'Email', val: 'email' },
                            { label: 'Telegram', val: 'telegram' },
                          ].map(ch => (
                            <button
                              key={ch.val}
                              type="button"
                              onClick={() => {
                                const cur = globalSettings.accessLock || {};
                                onUpdateSettings({ accessLock: { ...cur, contactChannel: ch.val } });
                              }}
                              style={{
                                flex: 1, height: 36, borderRadius: 9, border: 'none', cursor: 'pointer',
                                background: (globalSettings.accessLock?.contactChannel || 'whatsapp') === ch.val ? 'var(--cms-accent)' : 'transparent',
                                color: (globalSettings.accessLock?.contactChannel || 'whatsapp') === ch.val ? '#fff' : 'var(--cms-text-muted)',
                                fontSize: 11, fontWeight: 800, transition: 'all 0.2s'
                              }}
                            >
                              {ch.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Target Kontak & Pesan */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                          Target ({globalSettings.accessLock?.contactChannel === 'email' ? 'Email' : globalSettings.accessLock?.contactChannel === 'instagram' ? 'Username IG' : globalSettings.accessLock?.contactChannel === 'telegram' ? 'Username Telegram' : 'No. WhatsApp'})
                        </label>
                        <input
                          type="text"
                          className="cms-input"
                          style={{ height: 44, borderRadius: 12, fontSize: 13, width: '100%' }}
                          value={globalSettings.accessLock?.contactTarget || ''}
                          placeholder={globalSettings.accessLock?.contactChannel === 'email' ? 'admin@domain.com' : globalSettings.accessLock?.contactChannel === 'instagram' ? 'username_ig' : '6281234567890'}
                          onChange={e => {
                            const cur = globalSettings.accessLock || {};
                            onUpdateSettings({ accessLock: { ...cur, contactTarget: e.target.value } });
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Kalimat Penjelasan Layar</label>
                        <input
                          type="text"
                          className="cms-input"
                          style={{ height: 44, borderRadius: 12, fontSize: 13, width: '100%' }}
                          value={globalSettings.accessLock?.message || ''}
                          placeholder="Halaman ini bersifat privat. Hubungi pemilik untuk meminta PIN."
                          onChange={e => {
                            const cur = globalSettings.accessLock || {};
                            onUpdateSettings({ accessLock: { ...cur, message: e.target.value } });
                          }}
                        />
                      </div>
                    </div>

                    {/* Save Lock Settings Button */}
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          await storage.setItem('porto_settings', globalSettings, true);
                          window.dispatchEvent(new Event('porto_saved'));
                          window.dispatchEvent(new Event('porto_settings_updated'));
                          if (notify) notify('Pengaturan Gembok Akses Disimpan ke Cloud!');
                        }}
                        className="cms-btn cms-btn-primary"
                        style={{ height: 44, padding: '0 28px', borderRadius: 12, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <Save size={16} /> Simpan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeCategory === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Header Overview Card */}
              <div className="cms-card premium-glass" style={{ padding: '24px 28px', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '50%', 
                    border: '3px solid var(--cms-accent, #7c3aed)', 
                    overflow: 'hidden', 
                    background: 'var(--cms-card-bg)',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img src={adminProfile.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=Admin`} alt="Admin Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                        {adminProfile.name || 'Administrator'}
                      </h2>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)' }}>
                        {userData?.role || 'Super Admin'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--cms-text-muted)', fontWeight: 600, margin: '4px 0 0' }}>
                      {auth.currentUser?.email || userData?.email || 'admin@domain.com'}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '8px 14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                  🔒 Sesi Login Aktif & Terenkripsi
                </div>
              </div>

              {/* Edit Profil Admin Card */}
              <div className="cms-card premium-glass" style={{ padding: 28, borderRadius: 28 }}>
                <SectionHeader icon={<UserCog size={18}/>} title="Identitas & Avatar Profil" desc="Atur nama lengkap, foto avatar karakter, dan kontak admin." />

                <form onSubmit={handleSaveAdminProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 18 }}>
                  {/* Inline Expandable Avatar Picker with Left Sidebar Categories */}
                  <div style={{ padding: '16px 18px', borderRadius: 20, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                        Pilih Karakter Avatar Admin (200+ Koleksi):
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const rand = getRandomAvatar();
                            setAdminProfile(prev => ({ ...prev, avatar: rand.url }));
                            setAdminAvatarCategory(prev => (prev === 'all' ? 'male' : prev === 'male' ? 'female' : 'all'));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 14px',
                            borderRadius: 100,
                            background: 'var(--cms-card-bg)',
                            color: 'var(--cms-text)',
                            border: '1px solid var(--glass-border)',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                          }}
                        >
                          <Shuffle size={12} /> Acak
                        </button>
                      </div>
                    </div>

                    {/* Always in Ciut Mode - Spans 100% full width with auto-fill grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                      gap: 8,
                      width: '100%',
                      boxSizing: 'border-box',
                      marginTop: 8
                    }}>
                      {ALL_AVATARS.slice(0, 36).map((item) => {
                        const isSelected = adminProfile.avatar === item.url;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAdminProfile(prev => ({ ...prev, avatar: item.url }))}
                            style={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              borderRadius: '50%',
                              border: `2.5px solid ${isSelected ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                              padding: 2,
                              background: isSelected ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg)',
                              cursor: 'pointer',
                              flexShrink: 0,
                              boxShadow: isSelected ? '0 0 0 3px rgba(124, 58, 237, 0.25)' : 'none',
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxSizing: 'border-box'
                            }}
                            title={`Pilih avatar ${item.name}`}
                          >
                            <img src={item.url} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 900, marginBottom: 6, opacity: 0.7, color: 'var(--cms-text)' }}>
                        NAMA LENGKAP ADMIN
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="cms-input"
                          type="text"
                          required
                          value={adminProfile.name}
                          onChange={e => setAdminProfile({ ...adminProfile, name: e.target.value })}
                          placeholder="Nama lengkap administrator"
                          style={{ height: 46, borderRadius: 12, width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 900, marginBottom: 6, opacity: 0.7, color: 'var(--cms-text)' }}>
                        NOMOR WHATSAPP / TELEPON
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="cms-input"
                          type="tel"
                          value={adminProfile.phone}
                          onChange={e => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                          placeholder="081234567890"
                          style={{ height: 46, borderRadius: 12, width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingAdminProfile}
                    className="cms-btn cms-btn-primary"
                    style={{ height: 46, borderRadius: 12, fontWeight: 900, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start', padding: '0 24px' }}
                  >
                    {isSavingAdminProfile ? <Loader2 size={18} className="cms-spin" /> : <Save size={18} />}
                    Simpan
                  </button>
                </form>
              </div>

              {/* Password Section */}
              <div className="cms-card premium-glass" style={{ padding: 28, borderRadius: 28 }}>
                <SectionHeader icon={<Lock size={18}/>} title="Ganti Password Admin" desc="Perbarui kata sandi login akun administrator Anda." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 900, marginBottom: 6, opacity: 0.7 }}>PASSWORD SAAT INI</label>
                      <input className="cms-input" type="password" value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} placeholder="••••••••" style={{ height: 46, borderRadius: 12 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 900, marginBottom: 6, opacity: 0.7 }}>PASSWORD BARU</label>
                      <input className="cms-input" type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} placeholder="Minimal 6 karakter" style={{ height: 46, borderRadius: 12 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 900, marginBottom: 6, opacity: 0.7 }}>KONFIRMASI PASSWORD</label>
                      <input className="cms-input" type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} placeholder="Ulangi password baru" style={{ height: 46, borderRadius: 12 }} />
                    </div>
                  </div>
                  
                  <button 
                    disabled={isUpdatingPass}
                    onClick={async () => {
                      if (!passwords.old || !passwords.new || !passwords.confirm) {
                        notify('Semua field wajib diisi', 'error');
                        return;
                      }
                      if (passwords.new !== passwords.confirm) {
                        notify('Konfirmasi password tidak cocok', 'error');
                        return;
                      }
                      if (passwords.new.length < 6) {
                        notify('Password baru minimal 6 karakter', 'error');
                        return;
                      }

                      setIsUpdatingPass(true);
                      try {
                        const user = auth.currentUser;
                        const credential = EmailAuthProvider.credential(user.email, passwords.old);
                        await reauthenticateWithCredential(user, credential);
                        await updatePassword(user, passwords.new);
                        notify('✅ Password berhasil diperbarui!');
                        setPasswords({ old: '', new: '', confirm: '' });
                      } catch (err) {
                        console.error(err);
                        notify('Gagal update password. Cek password lama Anda.', 'error');
                      } finally {
                        setIsUpdatingPass(false);
                      }
                    }}
                    className="cms-btn cms-btn-primary" 
                    style={{ height: 46, borderRadius: 12, fontWeight: 900, marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}
                  >
                    {isUpdatingPass ? <Loader2 size={18} className="cms-spin" /> : <ShieldCheck size={18} />}
                    Perbarui
                  </button>
                </div>
              </div>
            </div>
          )}


          {(activeCategory === 'cloud' || activeCategory === 'ai_config') && (
            <div style={{ animation: 'cmsSlideUp 0.4s ease' }}>

              {/* ── STATUS DASHBOARD ── */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 950, color: 'var(--cms-accent)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={13} /> Status Koneksi Layanan
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600 }}>
                      Dikonfigurasi via <code style={{ background: 'var(--cms-input-bg)', padding: '1px 6px', borderRadius: 4 }}>.env</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEnvEditor('all')}
                      style={{
                        background: 'var(--cms-accent-soft)',
                        color: 'var(--cms-accent)',
                        border: '1px solid var(--cms-accent)',
                        borderRadius: 6,
                        padding: '3px 9px',
                        fontSize: 10.5,
                        fontWeight: 850,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                      className="hover-opacity"
                      title="Perlu Kunci Keamanan"
                    >
                      <Lock size={11} />
                      Ubah .env
                    </button>
                  </div>
                </div>

                {/* Status List — 1 baris per layanan, selalu rapi di semua layar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {/* ── Firebase ── */}
                  {(() => {
                    const ok = !!(import.meta.env.VITE_FIREBASE_PROJECT_ID || 'websiteagenzie');
                    const color = ok ? '#10b981' : '#ef4444';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1.5px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Database size={17} color={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 2 }}>Firebase</div>
                          <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Project: <code style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{import.meta.env.VITE_FIREBASE_PROJECT_ID || 'websiteagenzie'}</code>
                            {' · '}Auth: <code style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'websiteagenzie.firebaseapp.com'}</code>
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color, padding: '3px 10px', borderRadius: 100, background: `${color}18`, border: `1px solid ${color}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {ok ? '● TERHUBUNG' : '○ TIDAK AKTIF'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEnvEditor('firebase')}
                          title="Terkunci: Perlu ketik 'buka saya mau edit ini'"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                            background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.12))',
                            color: 'var(--cms-accent, #8b5cf6)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                          className="cms-btn hover-scale"
                        >
                          <Lock size={11} />
                          <span>Edit</span>
                        </button>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 7px ${color}`, flexShrink: 0 }} />
                      </div>
                    );
                  })()}

                  {/* ── Cloudinary ── */}
                  {(() => {
                    const ok = !!CLOUDINARY_CONFIG.cloudName;
                    const color = ok ? '#10b981' : '#ef4444';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1.5px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Image size={17} color={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 2 }}>Cloudinary</div>
                          <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Cloud: <code style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{CLOUDINARY_CONFIG.cloudName}</code>
                            {' · '}Preset: <code style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{CLOUDINARY_CONFIG.uploadPreset}</code>
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color, padding: '3px 10px', borderRadius: 100, background: `${color}18`, border: `1px solid ${color}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {ok ? '● TERHUBUNG' : '○ BELUM DIATUR'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEnvEditor('cloudinary')}
                          title="Terkunci: Perlu ketik 'buka saya mau edit ini'"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                            background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.12))',
                            color: 'var(--cms-accent, #8b5cf6)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                          className="cms-btn hover-scale"
                        >
                          <Lock size={11} />
                          <span>Edit</span>
                        </button>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 7px ${color}`, flexShrink: 0 }} />
                      </div>
                    );
                  })()}

                  {/* ── Gemini AI ── */}
                  {(() => {
                    const key = geminiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
                    const ok = !!key;
                    const tested = aiTestResult?.success;
                    const color = tested ? '#10b981' : ok ? '#38bdf8' : '#ef4444';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: `${color}0d`, border: `1.5px solid ${color}35` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Sparkles size={17} color={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 2 }}>Gemini AI</div>
                          <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Key: <code style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{ok ? key.substring(0, 12) + '••••••••' : '—'}</code>
                            {aiTestResult && <> · Model: <code style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{aiTestResult.model}</code> <span style={{ color: color }}>({aiTestResult.latencyMs}ms)</span></>}
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color, padding: '3px 10px', borderRadius: 100, background: `${color}18`, border: `1px solid ${color}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {tested ? '● TERVERIFIKASI' : ok ? '○ BELUM DITEST' : '○ BELUM DIATUR'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEnvEditor('gemini')}
                          title="Terkunci: Perlu ketik 'buka saya mau edit ini'"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                            background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.12))',
                            color: 'var(--cms-accent, #8b5cf6)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                          className="cms-btn hover-scale"
                        >
                          <Lock size={11} />
                          <span>Edit</span>
                        </button>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 7px ${color}`, flexShrink: 0 }} />
                      </div>
                    );
                  })()}

                  {/* ── Google Apps Script ── */}
                  {(() => {
                    const url = GOOGLE_CONFIG.appsScriptUrl || globalSettings.googleAppsScriptUrl || '';
                    const ok = !!url && url.endsWith('/exec');
                    const warn = !!url && url.endsWith('/dev');
                    const color = ok ? '#10b981' : warn ? '#f59e0b' : '#94a3b8';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: `${color}0d`, border: `1.5px solid ${color}40` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Code size={17} color={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 2 }}>Google Apps Script</div>
                          <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {url ? <code style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{url.length > 48 ? url.substring(0, 48) + '…' : url}</code> : <span>Belum diatur — isi VITE_GOOGLE_APPS_SCRIPT_URL di .env</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color, padding: '3px 10px', borderRadius: 100, background: `${color}18`, border: `1px solid ${color}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {ok ? '● /exec SIAP' : warn ? '⚠ /dev SALAH' : '○ BELUM DIATUR'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEnvEditor('appsScript')}
                          title="Terkunci: Perlu ketik 'buka saya mau edit ini'"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                            background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.12))',
                            color: 'var(--cms-accent, #8b5cf6)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                          className="cms-btn hover-scale"
                        >
                          <Lock size={11} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowScriptModal(true)}
                          title="Lihat & Salin Kode Google Apps Script (Code.gs)"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                          className="cms-btn hover-scale"
                        >
                          <FileCode size={11} />
                          <span>Script</span>
                        </button>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: ok || warn ? `0 0 7px ${color}` : 'none', flexShrink: 0 }} />
                      </div>
                    );
                  })()}

                  {/* ── Google Sheets ── */}
                  {(() => {
                    const sheetId = GOOGLE_CONFIG.sheetId || globalSettings.googleSheetId || '';
                    const ok = !!sheetId;
                    const color = ok ? '#10b981' : '#94a3b8';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: `${color}0d`, border: `1.5px solid ${color}35` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <LayoutGrid size={17} color={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 2 }}>Google Sheets</div>
                          <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ok ? <><span>Sheet ID: </span><code style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{sheetId.length > 40 ? sheetId.substring(0, 40) + '…' : sheetId}</code></> : <span>Belum diatur — isi VITE_GOOGLE_SHEET_ID di .env</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color, padding: '3px 10px', borderRadius: 100, background: `${color}18`, border: `1px solid ${color}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {ok ? '● TERHUBUNG' : '○ BELUM DIATUR'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEnvEditor('sheets')}
                          title="Terkunci: Perlu ketik 'buka saya mau edit ini'"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                            background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.12))',
                            color: 'var(--cms-accent, #8b5cf6)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                          className="cms-btn hover-scale"
                        >
                          <Lock size={11} />
                          <span>Edit</span>
                        </button>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: ok ? `0 0 7px ${color}` : 'none', flexShrink: 0 }} />
                      </div>
                    );
                  })()}

                </div>

                {/* Quick Test Buttons */}
                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" disabled={isTestingAi || !geminiKey.trim()} onClick={async () => { if (!geminiKey.trim()) { if (notify) notify('Masukkan API Key Gemini di .env terlebih dahulu.', 'error'); return; } setIsTestingAi(true); setAiTestResult(null); try { const res = await testGeminiConnection(geminiKey.trim()); setAiTestResult(res); if (res.success) { if (notify) notify(`✅ Gemini AI OK — ${res.model} (${res.latencyMs}ms)`, 'success'); } else { if (notify) notify(`❌ ${res.message}`, 'error'); } } catch (err: any) { setAiTestResult({ success: false, model: '-', message: err?.message || 'Gagal', latencyMs: 0 }); } finally { setIsTestingAi(false); } }} className="cms-btn" style={{ height: 38, padding: '0 18px', borderRadius: 10, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', cursor: !geminiKey.trim() || isTestingAi ? 'not-allowed' : 'pointer', opacity: !geminiKey.trim() ? 0.5 : 1 }}>
                    {isTestingAi ? <Loader2 size={14} className="cms-spin" /> : <Zap size={14} />}
                    {isTestingAi ? 'Menguji...' : 'Tes'}
                  </button>
                  <button type="button" onClick={async () => { if (!globalSettings.googleAppsScriptUrl && !GOOGLE_CONFIG.appsScriptUrl) { notify('URL Apps Script belum diatur di .env!', 'error'); return; } await googleSync.pingAppsScript(notify); }} className="cms-btn" style={{ height: 38, padding: '0 18px', borderRadius: 10, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer' }}>
                    <Cpu size={14} /> Ping
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowScriptModal(true)} 
                    className="cms-btn hover-scale" 
                    style={{ 
                      height: 38, 
                      padding: '0 16px', 
                      borderRadius: 10, 
                      fontSize: 12, 
                      fontWeight: 850, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 7, 
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)', 
                      color: '#10b981', 
                      border: '1px solid rgba(16, 185, 129, 0.4)', 
                      cursor: 'pointer' 
                    }}
                    title="Buka kode Google Apps Script terbaru untuk disalin ke script.google.com"
                  >
                    <FileCode size={14} />
                    <span>Lihat & Salin Script (Code.gs)</span>
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginLeft: 4 }}>
                    Untuk mengganti: edit <code style={{ background: 'var(--cms-input-bg)', padding: '1px 5px', borderRadius: 4 }}>.env</code> → redeploy
                  </span>
                </div>
              </div>



              {/* ── DATABASE & STORAGE ACTIONS ── */}
              <div className="settings-section">
                <h4 style={{ fontSize: 11, fontWeight: 950, color: 'var(--cms-accent)', letterSpacing: '0.15em', marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HardDrive size={13} /> Database & Storage
                  <InfoTooltip content="Backup, restore, migrasi, dan optimasi data. Semua aksi langsung tanpa kunci." />
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 16 }}>
                  <button type="button" onClick={async () => { if (!globalSettings.googleAppsScriptUrl && !GOOGLE_CONFIG.appsScriptUrl) { notify('URL Apps Script belum diatur di .env!', 'error'); return; } notify('⏳ Menyimpan ke Google Drive...'); const success = await googleSync.backupToDrive(notify); if (success) { onUpdateSettings({ lastBackupDate: new Date().toISOString() }); } }} className="cms-btn hover-scale" style={{ height: 42, padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--cms-card-bg)', border: '1.5px solid var(--cms-border)', color: 'var(--cms-text)', cursor: 'pointer' }}>
                    <Upload size={15} /> Backup
                  </button>
                  <button type="button" onClick={async () => { if (!globalSettings.googleAppsScriptUrl && !GOOGLE_CONFIG.appsScriptUrl) { notify('URL Apps Script belum diatur di .env!', 'error'); return; } await googleSync.restoreFromDrive(notify); }} className="cms-btn hover-scale" style={{ height: 42, padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--cms-card-bg)', border: '1.5px solid var(--cms-border)', color: 'var(--cms-text)', cursor: 'pointer' }}>
                    <RotateCw size={15} /> Tarik
                  </button>
                  <button type="button" onClick={async () => { if (!globalSettings.googleAppsScriptUrl && !GOOGLE_CONFIG.appsScriptUrl) { notify('URL Apps Script belum diatur di .env!', 'error'); return; } await googleSync.migrateAllDataToDriveAndCloudinary(notify); }} className="cms-btn hover-scale" style={{ height: 42, padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
                    <Sparkles size={15} /> Migrasi
                  </button>
                  <button disabled={isOptimizing} onClick={async () => { const confirm = await showConfirm('💡 OPTIMISASI DATABASE\n\nSistem akan memindai seluruh database lokal untuk menemukan gambar offline (Base64), mengunggahnya ke Cloudinary, dan menggantinya dengan URL CDN.\n\nLanjutkan?'); if (!confirm) return; setIsOptimizing(true); let uploadSuccessCount = 0; try { const { uploadToCloudinary } = await import('../../utils/cloudinary'); const optimizeNode = async (obj, nodeName = '') => { if (obj === null || obj === undefined) return obj; if (typeof obj === 'string' && obj.startsWith('data:')) { try { const mediaType = obj.includes('video/') ? 'video' : 'image'; const res = await uploadToCloudinary(obj, mediaType); if (res && res.url) { uploadSuccessCount++; return res.url; } } catch (err) {} } else if (Array.isArray(obj)) { const newArr = []; for (let i = 0; i < obj.length; i++) newArr.push(await optimizeNode(obj[i])); return newArr; } else if (typeof obj === 'object') { const newObj = {}; for (const key in obj) newObj[key] = await optimizeNode(obj[key]); return newObj; } return obj; }; if (notify) notify('⏳ Memindai aset offline...'); for (const colKey of ['porto_pages','porto_stickers','porto_frames','porto_whiteboard_canvases']) { const val = await storage.getItem(colKey, null); if (val) { await storage.setItem(colKey, await optimizeNode(val)); } } await storage.syncAllToDatabase(); if (notify) { uploadSuccessCount > 0 ? notify(`✅ ${uploadSuccessCount} gambar dipindah ke Cloudinary.`) : notify('ℹ️ Tidak ditemukan gambar offline.'); } } catch (e) { if (notify) notify('❌ Kesalahan optimisasi', 'error'); } finally { setIsOptimizing(false); } }} className="cms-btn" style={{ height: 42, padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: '#fff', border: 'none', opacity: isOptimizing ? 0.7 : 1, cursor: isOptimizing ? 'not-allowed' : 'pointer' }}>
                    {isOptimizing ? <Loader2 size={15} className="cms-spin" /> : <Sparkles size={15} />}
                    {isOptimizing ? 'Proses...' : 'Optimasi'}
                  </button>
                </div>
                {globalSettings.lastBackupDate && (
                  <div style={{ padding: '10px 16px', background: 'var(--cms-input-bg)', borderRadius: 10, fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span>Terakhir Backup Drive:</span>
                    <span style={{ color: 'var(--cms-text)' }}>{new Date(globalSettings.lastBackupDate).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* ── MULTI-DEPLOY KE FIREBASE TARGET ── */}
              <div className="settings-section" style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 950, color: '#3b82f6', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    <Layers size={13} /> Multi-Deploy Sistem ke Firebase Lain
                    <InfoTooltip content="Kelola daftar target dan deploy ke banyak project Firebase sekaligus via GitHub Actions." />
                  </h4>
                </div>
                <div style={{ padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ maxWidth: 450 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Manajemen Multi-Target Deployment</div>
                    <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                      Daftarkan target-target proyek klien dan lakukan deployment sekaligus bersama-sama secara otomatis tanpa menyentuh terminal.
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsDeployTargetOpen(true)}
                    className="cms-btn hover-scale"
                    style={{
                      height: 40,
                      padding: '0 20px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      color: '#fff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(59,130,246,0.3)'
                    }}
                  >
                    <Layers size={15} /> Deploy
                  </button>
                </div>
              </div>

              {/* ── BACKUP & RESTORE MODULAR JSON ── */}
              <div className="settings-section" style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 11, fontWeight: 950, color: 'var(--cms-accent)', letterSpacing: '0.15em', marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={13} /> Backup & Restore Modular JSON
                </h4>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--cms-border, rgba(255,255,255,0.08))', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>Pilih Kategori Cadangan:</div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', marginTop: 2 }}>Ekspor atau pulihkan modul tertentu tanpa merusak data modul lain</div>
                    </div>
                    <select
                      value={backupCategory}
                      onChange={(e) => setBackupCategory(e.target.value as any)}
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 8,
                        background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                        color: 'var(--cms-text, #ffffff)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all" style={{ background: '#181926', color: '#ffffff' }}>📦 Semua Data Sistem (Full Backup)</option>
                      <option value="pages" style={{ background: '#181926', color: '#ffffff' }}>🌐 Halaman Web & Blok Visual</option>
                      <option value="blogs" style={{ background: '#181926', color: '#ffffff' }}>📝 Blog & Artikel</option>
                      <option value="catalog" style={{ background: '#181926', color: '#ffffff' }}>🛍️ Katalog Toko & Produk</option>
                      <option value="notes" style={{ background: '#181926', color: '#ffffff' }}>📌 Catatan, Memo & Whiteboard</option>
                      <option value="projects" style={{ background: '#181926', color: '#ffffff' }}>🚀 Manajemen Proyek & Tugas</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const exportPayload: any = {
                            version: '2026.modular',
                            module: backupCategory,
                            exportDate: new Date().toISOString()
                          };

                          if (backupCategory === 'all' || backupCategory === 'pages') {
                            exportPayload.pages = await storage.getItem('porto_pages', {});
                            exportPayload.settings = await storage.getItem('porto_settings', {});
                            exportPayload.stickers = await storage.getItem('porto_stickers', {});
                            exportPayload.frames = await storage.getItem('porto_frames', {});
                          }
                          if (backupCategory === 'all' || backupCategory === 'blogs') {
                            exportPayload.blogs = await storage.getItem('porto_blogs', []);
                            exportPayload.blogPosts = await storage.getItem('porto_blog_posts', []);
                            exportPayload.blogCategories = await storage.getItem('porto_blog_categories', []);
                          }
                          if (backupCategory === 'all' || backupCategory === 'catalog') {
                            exportPayload.catalog = await storage.getItem('porto_catalog', []);
                            exportPayload.shopProducts = await storage.getItem('porto_shop_products', []);
                            exportPayload.shopOrders = await storage.getItem('porto_shop_orders', []);
                            exportPayload.shopCategories = await storage.getItem('porto_shop_categories', []);
                          }
                          if (backupCategory === 'all' || backupCategory === 'notes') {
                            exportPayload.memos = await storage.getItem('porto_memos', []);
                            exportPayload.memoNotes = await storage.getItem('porto_memo_notes', []);
                            exportPayload.memoFolders = await storage.getItem('porto_memo_folders', []);
                            exportPayload.whiteboard = await storage.getItem('porto_whiteboard_canvases', []);
                          }
                          if (backupCategory === 'all' || backupCategory === 'projects') {
                            exportPayload.projects = await storage.getItem('porto_projects', []);
                            exportPayload.projectCategories = await storage.getItem('porto_project_categories', []);
                            exportPayload.kanbanColumns = await storage.getItem('porto_kanban_columns', []);
                          }
                          if (backupCategory === 'all') {
                            exportPayload.portfolio = await storage.getItem('porto_portfolio', []);
                            exportPayload.transactions = await storage.getItem('porto_transactions', []);
                          }

                          const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `agenze_backup_${backupCategory}_${Date.now()}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          if (notify) notify(`✅ Backup [${backupCategory.toUpperCase()}] berhasil diunduh!`);
                        } catch (err: any) {
                          if (notify) notify('❌ Gagal mengekspor data: ' + err.message, 'error');
                        }
                      }}
                      className="cms-btn"
                      style={{
                        height: 38,
                        padding: '0 18px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 800,
                        background: 'var(--cms-accent-soft, rgba(59,130,246,0.12))',
                        color: 'var(--cms-accent, #3b82f6)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowLeft size={15} style={{ transform: 'rotate(-90deg)' }} /> Ekspor JSON ({backupCategory.toUpperCase()})
                    </button>

                    <div>
                      <input
                        type="file"
                        id="json-modular-import-input"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            try {
                              const data = JSON.parse(ev.target?.result as string);
                              const moduleType = data.module || (data.pages && data.settings ? 'all' : 'unknown');

                              if (moduleType === 'catalog') {
                                await storage.batchSetItems({
                                  'porto_catalog': data.catalog || [],
                                  'porto_shop_products': data.shopProducts || [],
                                  'porto_shop_orders': data.shopOrders || [],
                                  'porto_shop_categories': data.shopCategories || []
                                });
                                if (notify) notify('✅ Modul Katalog berhasil dipulihkan!');
                              } else if (moduleType === 'blogs') {
                                await storage.batchSetItems({
                                  'porto_blogs': data.blogs || [],
                                  'porto_blog_posts': data.blogPosts || [],
                                  'porto_blog_categories': data.blogCategories || []
                                });
                                if (notify) notify('✅ Modul Blog berhasil dipulihkan!');
                              } else if (moduleType === 'notes') {
                                await storage.batchSetItems({
                                  'porto_memos': data.memos || [],
                                  'porto_memo_notes': data.memoNotes || [],
                                  'porto_memo_folders': data.memoFolders || [],
                                  'porto_whiteboard_canvases': data.whiteboard || []
                                });
                                if (notify) notify('✅ Modul Catatan & Memo berhasil dipulihkan!');
                              } else if (moduleType === 'projects') {
                                await storage.batchSetItems({
                                  'porto_projects': data.projects || [],
                                  'porto_project_categories': data.projectCategories || [],
                                  'porto_kanban_columns': data.kanbanColumns || []
                                });
                                if (notify) notify('✅ Modul Proyek berhasil dipulihkan!');
                              } else if (moduleType === 'pages') {
                                await storage.batchSetItems({
                                  'porto_pages': data.pages || {},
                                  'porto_settings': data.settings || {},
                                  'porto_stickers': data.stickers || {},
                                  'porto_frames': data.frames || {}
                                });
                                if (notify) notify('✅ Modul Halaman Web berhasil dipulihkan! Memuat ulang...');
                                setTimeout(() => window.location.reload(), 1200);
                              } else {
                                const confirm = window.confirm('PERINGATAN: Mengimpor cadangan penuh akan menimpa data sistem saat ini. Lanjutkan?');
                                if (!confirm) return;
                                const items: Record<string, any> = {};
                                if (data.pages) items['porto_pages'] = data.pages;
                                if (data.settings) items['porto_settings'] = data.settings;
                                if (data.stickers) items['porto_stickers'] = data.stickers;
                                if (data.frames) items['porto_frames'] = data.frames;
                                if (data.projects) items['porto_projects'] = data.projects;
                                if (data.portfolio) items['porto_portfolio'] = data.portfolio;
                                if (data.whiteboard) items['porto_whiteboard_canvases'] = data.whiteboard;
                                if (data.blogs) items['porto_blogs'] = data.blogs;
                                if (data.catalog) items['porto_catalog'] = data.catalog;
                                await storage.batchSetItems(items);
                                if (notify) notify('✅ Data berhasil dipulihkan! Halaman akan direfresh.');
                                setTimeout(() => window.location.reload(), 1500);
                              }
                            } catch (err: any) {
                              if (notify) notify('❌ Gagal memulihkan file cadangan: ' + err.message, 'error');
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('json-modular-import-input')?.click()}
                        className="cms-btn"
                        style={{
                          height: 38,
                          padding: '0 18px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 800,
                          background: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCw size={15} /> Impor
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── DEVELOPER TOOLS ── */}
              <div className="settings-section" style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 11, fontWeight: 950, color: 'var(--cms-accent)', letterSpacing: '0.15em', marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Code size={13} /> Developer Tools
                </h4>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={async () => { const dummyTrx = Array.from({ length: 5 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 6)); return { id: `DUMMY-TRX-${Date.now()}-${i}`, date: d.toISOString(), customer: { name: `Dummy Client ${i+1}` }, paymentStatus: ['lunas','dp','belum'][Math.floor(Math.random() * 3)], grandTotal: Math.floor(Math.random() * 5000000) + 1000000 }; }); await storage.setItem('porto_transactions', dummyTrx); await storage.setItem('porto_projects', Array.from({ length: 5 }).map((_, i) => ({ id: `PRJ-${i}`, name: `Project ${i}`, status: 'active' }))); await storage.setItem('porto_whiteboard_canvases', Array.from({ length: 5 }).map((_, i) => ({ id: `CNV-${i}`, title: `Canvas ${i}`, notes: [], bg: 'grid' }))); if (notify) notify('✅ Fake Database Injected!'); }} className="cms-btn" style={{ height: 40, padding: '0 18px', borderRadius: 10, fontSize: 12, fontWeight: 800, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <Database size={15} /> Dummy
                  </button>
                  <button onClick={async () => { const confirmCode = await showPrompt('⚠️ PERINGATAN: Ini akan menghapus SELURUH data konten CMS dan mereset total. Anda akan logout otomatis.\n\nKonfigurasi teknis (.env, Firebase, Cloudinary, Gemini Key) TIDAK akan terhapus.\n\nKetik "HAPUS" untuk melanjutkan:'); if (confirmCode === 'HAPUS') { setIsWiping(true); const savedGeminiKey = localStorage.getItem('GEMINI_API_KEY') || ''; const savedGeminiKey2 = localStorage.getItem('porto_gemini_key') || ''; const savedCachedModel = sessionStorage.getItem('porto_cached_gemini_model') || ''; const savedEnvOverrides = localStorage.getItem('porto_env_overrides') || ''; const savedDeployTargets = localStorage.getItem('porto_deploy_targets') || ''; await storage.clearAll(); if (savedGeminiKey) localStorage.setItem('GEMINI_API_KEY', savedGeminiKey); if (savedGeminiKey2) localStorage.setItem('porto_gemini_key', savedGeminiKey2); if (savedCachedModel) sessionStorage.setItem('porto_cached_gemini_model', savedCachedModel); if (savedEnvOverrides) localStorage.setItem('porto_env_overrides', savedEnvOverrides); if (savedDeployTargets) localStorage.setItem('porto_deploy_targets', savedDeployTargets); } }} disabled={isWiping} className="cms-btn" style={{ height: 40, padding: '0 18px', borderRadius: 10, fontSize: 12, fontWeight: 800, background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 8, opacity: isWiping ? 0.7 : 1, cursor: isWiping ? 'not-allowed' : 'pointer' }}>
                    {isWiping ? <Loader2 size={15} className="cms-spin" /> : <Trash2 size={15} />}
                    Reset
                  </button>
                </div>
              </div>

            </div>
          )}


          {activeCategory === 'pwa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* ── Status Card ── */}
              <div className="cms-card" style={{ padding: 24, borderRadius: 24, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #6366f1)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 20px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)'
                    }}>
                      <Smartphone size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>sumr.day OS — Progressive Web App</h3>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                        Manajemen instalasi aplikasi mandiri & kesiapan offline untuk admin
                      </p>
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 800,
                    background: (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone)) 
                      ? 'rgba(16, 185, 129, 0.15)' : 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12)',
                    color: (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone))
                      ? '#10b981' : 'var(--cms-accent, #7c3aed)',
                    border: (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone))
                      ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(var(--cms-accent-rgb, 124, 58, 237), 0.25)',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <Check size={14} strokeWidth={2.5} />
                    {(typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone))
                      ? 'Mode Native Standalone Aktif'
                      : 'Mode Browser Web'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 16 }}>
                  <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Scope</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)', marginTop: 4 }}>Admin & Studio Workspace</div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>start_url: /admin</div>
                  </div>
                  <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Worker Cache</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#10b981', marginTop: 4 }}>Workbox Auto-Sync</div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>Fonts, Assets & Local Offline Data</div>
                  </div>
                  <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Banner Kebijakan</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-accent, #7c3aed)', marginTop: 4 }}>Inisiatif Mandiri Admin</div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>Zero annoying auto-popups</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      const res = await triggerPwaInstall();
                      if (res.outcome === 'accepted') {
                        notify('🎉 Aplikasi sumr.day OS berhasil dipasang!');
                      } else if (res.message) {
                        notify(res.message);
                      }
                    }}
                    className="cms-btn cms-btn-primary"
                    style={{ height: 42, padding: '0 22px', borderRadius: 12, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Smartphone size={16} strokeWidth={2.2} />
                    <span>Pasang Aplikasi Langsung</span>
                  </button>

                  <button
                    onClick={async () => {
                      if ('serviceWorker' in navigator) {
                        try {
                          const registrations = await navigator.serviceWorker.getRegistrations();
                          for (const reg of registrations) {
                            await reg.update();
                          }
                          notify('✅ Service Worker PWA diperbarui & sinkron!', 'success');
                        } catch {
                          notify('Gagal memperbarui Service Worker', 'error');
                        }
                      }
                    }}
                    className="cms-btn"
                    style={{ height: 42, padding: '0 20px', borderRadius: 12, fontSize: 13, fontWeight: 800, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  >
                    <RotateCw size={15} />
                    <span>Periksa Pembaruan SW</span>
                  </button>
                </div>
              </div>

              {/* ── Panduan Lengkap Perangkat ── */}
              <div className="cms-card" style={{ padding: 24, borderRadius: 24, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '0.06em', marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Laptop size={16} color="var(--cms-accent)" /> Petunjuk Pemasangan di Berbagai Perangkat
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: '14px 18px', borderRadius: 16, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)', marginBottom: 4 }}>
                      💻 Komputer Desktop / Laptop (Google Chrome, Microsoft Edge, Brave, Opera)
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--cms-text-muted)' }}>
                      Buka dashboard admin, lihat pada bilah alamat URL di kanan atas layar. Klik icon <strong>"Install sumr.day OS"</strong> (simbol komputer dengan panah ke bawah atau tanda tambah). Aplikasi akan terpasang di Desktop/Start Menu dan berjalan di jendela mandiri tanpa address bar.
                    </p>
                  </div>

                  <div style={{ padding: '14px 18px', borderRadius: 16, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981', marginBottom: 4 }}>
                      📱 Smartphone & Tablet Android (Google Chrome / Samsung Internet)
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--cms-text-muted)' }}>
                      Tekan tombol menu titik tiga (⋮) di pojok kanan atas browser Chrome, kemudian pilih opsi <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong> atau <strong>"Install Aplikasi"</strong>. Icon CMS akan muncul di app drawer ponsel Anda.
                    </p>
                  </div>

                  <div style={{ padding: '14px 18px', borderRadius: 16, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#3b82f6', marginBottom: 4 }}>
                      🍎 iPhone & iPad (Apple Safari)
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--cms-text-muted)' }}>
                      Buka situs di browser Safari, tekan tombol <strong>Share / Bagikan</strong> (ikon kotak dengan panah ke atas di bilah bawah), scroll ke bawah lalu pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'storage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <StorageMonitor userData={userData} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`cms-settings-container ${activeCategory ? 'category-active' : ''}`} style={{ 
      display: 'flex', 
      gap: 0, 
      padding: 0,
      height: '100%',
      animation: 'cmsFadeIn 0.4s ease',
      background: 'var(--cms-bg)',
      viewTransitionName: 'settings-panel'
    }}>
      {/* Floating Sidebar Menu */}
      <div className="cms-inner-sidebar settings-nav-sidebar" style={{ width: 280, marginLeft: 0 }}>
        <div style={{ padding: '40px 24px 24px' }}>
          <div className="cms-label" style={{ margin: 0, letterSpacing: '0.15em', opacity: 0.6, fontSize: 10 }}>PENGATURAN</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--cms-text)', marginTop: 4, letterSpacing: '-0.03em' }}>Global</div>
        </div>
        
        <div className="settings-category-list" style={{ padding: '0 12px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(
            categories.reduce((acc, cat) => {
              (acc[cat.group] = acc[cat.group] || []).push(cat);
              return acc;
            }, {})
          ).map(([groupName, groupCats]) => (
            <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--cms-text-muted)',
                letterSpacing: '0.04em',
                padding: '10px 16px 4px',
                textTransform: 'uppercase',
                opacity: 0.5,
                lineHeight: 1
              }}>
                {groupName}
              </div>
              {groupCats.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`settings-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    borderRadius: 100, border: 'none', background: activeCategory === cat.id ? 'var(--cms-accent-soft)' : 'transparent',
                    transition: '0.3s', cursor: 'pointer', textAlign: 'left', width: '100%'
                  }}
                >
                  <div className="cms-icon-box" style={{ 
                    width: 34, height: 34, borderRadius: 12, flexShrink: 0,
                    background: activeCategory === cat.id ? 'var(--cms-accent)' : cat.bg, 
                    color: activeCategory === cat.id ? '#fff' : cat.color 
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 750, letterSpacing: '-0.005em', color: activeCategory === cat.id ? 'var(--cms-accent)' : 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.title}</div>
                  </div>
                  <ChevronRight size={14} className="mobile-only-icon" style={{ opacity: 0.3 }} />
                </button>
              ))}
            </div>
          ))}

          <div style={{ marginTop: 12, padding: '8px 4px 0' }}>
            <button
              onClick={async () => {
                const confirmed = await showConfirm('Keluar dari dashboard?');
                if (confirmed) await signOut(auth);
              }}
              className="cms-list-card danger"
              style={{ border: 'none', background: 'rgba(239, 68, 68, 0.05)', padding: '14px 16px', borderRadius: 18, width: '100%', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              <div className="cms-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', width: 34, height: 34, borderRadius: 12 }}>
                <LogOut size={18} color="#ef4444" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="settings-content-area" style={{ 
        flex: 1,
        height: '100%', 
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Tablet/Mobile sticky top bar with back button + centered title */}
        {activeCategory && (
          <div className="settings-sticky-topbar" style={{
            display: 'none', position: 'sticky', top: 0, zIndex: 100,
            background: 'var(--cms-bg)', borderBottom: '1px solid var(--glass-border)',
            padding: '14px 20px', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setActiveCategory(null)}
              title="Kembali"
              aria-label="Kembali"
              style={{
                position: 'absolute', left: 16,
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--cms-switcher-bg)',
                border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--cms-text)', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.01em' }}>
                {(() => { const cat = categories.find(c => c.id === activeCategory); return cat?.title || 'Pengaturan'; })()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 600 }}>
                {(() => { const cat = categories.find(c => c.id === activeCategory); return cat?.desc || ''; })()}
              </div>
            </div>
          </div>
        )}
        
        <div className="settings-content-container" style={{ 
          width: '100%', 
          maxWidth: !activeCategory ? 920 : 1200, 
          margin: '0 auto',
          padding: !activeCategory ? '40px 32px 80px 32px' : '36px 40px 80px 40px',
          boxSizing: 'border-box'
        }}>

          {renderContent()}
        </div>
      </div>

      <style>{`
        /* ── TABLET (501px – 1024px) ── same step logic as mobile ── */
        @media (min-width: 501px) and (max-width: 1280px) {
          .settings-nav-sidebar {
            width: 100% !important;
            display: ${activeCategory ? 'none' : 'flex'} !important;
            flex-direction: column !important;
            border-right: none !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .settings-content-area {
            display: ${activeCategory ? 'flex' : 'none'} !important;
            flex-direction: column !important;
            height: auto !important;
          }
          /* Show sticky top bar */
          .settings-sticky-topbar {
            display: flex !important;
          }
          .settings-content-container {
            padding: 16px 20px calc(84px + env(safe-area-inset-bottom, 0px)) !important;
          }
          /* Tablet back button — same as mobile */
          .mobile-only-icon {
            display: block !important;
          }
          .settings-row {
            flex-wrap: wrap !important;
            gap: 16px !important;
          }
          .settings-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
          }
          .cms-card {
            padding: 24px !important;
          }
          .biodata-main-grid, .user-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .biodata-field-row {
            grid-template-columns: 1fr 1fr !important;
          }
          /* Category list full width on tablet */
          .settings-category-list {
            width: 100% !important;
            max-width: 100% !important;
            padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .settings-category-btn {
            padding: 14px 20px !important;
            font-size: 14px !important;
          }
        }

        @media (max-width: 767px) {
          .settings-nav-sidebar {
            width: 100% !important;
            display: ${activeCategory ? 'none' : 'flex'} !important;
            flex-direction: column !important;
            padding-bottom: 0 !important;
          }
          .settings-category-list {
            padding: 12px 16px calc(90px + env(safe-area-inset-bottom, 16px)) 16px !important;
          }
          .settings-sticky-topbar {
            display: flex !important;
          }
          .settings-content-area {
            display: ${activeCategory ? 'flex' : 'none'} !important;
            flex-direction: column !important;
            padding-top: 0 !important; 
            height: auto !important;
          }
          .settings-content-container {
            padding: 16px 16px calc(110px + env(safe-area-inset-bottom, 20px)) 16px !important;
            box-sizing: border-box !important;
          }
          .settings-row {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
            padding: 16px 0 !important;
          }
          .settings-row-action {
            width: auto !important;
            min-width: unset !important;
            justify-content: flex-end !important;
            flex-shrink: 0 !important;
          }
          .settings-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .cms-card {
            padding: 16px !important;
            border-radius: 18px !important;
          }
          .mobile-only-icon {
            display: block !important;
          }
          /* Fix specific sub-module alignments */
          .biodata-main-grid, .user-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .biodata-field-row {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-only-icon {
            display: none !important;
          }
        }
      `}</style>

      <MediaGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onSelect={(url) => {
          if (galleryTarget === 'cmsLogo') {
            onUpdateSettings({ cmsLogo: url });
            if (notify) notify('✅ Logo CMS dipilih dari galeri!');
          } else if (galleryTarget === 'loginBanner') {
            onUpdateSettings({ loginBannerImage: url });
            if (notify) notify('✅ Banner login dipilih dari galeri!');
          }
        }}
      />

      <DeployTargetModal
        isOpen={isDeployTargetOpen}
        onClose={() => setIsDeployTargetOpen(false)}
        notify={notify}
      />

      <EnvConfigModal
        isOpen={isEnvModalOpen}
        onClose={() => setIsEnvModalOpen(false)}
        initialService={envModalTarget}
        notify={notify}
      />

      <GoogleScriptViewerModal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        notify={notify}
      />
    </div>
  );
};
  
export default SettingsPanel;

