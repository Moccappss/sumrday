import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Monitor, Smartphone, Tablet, Sun, Moon, Save, ExternalLink, 
  Sparkles, RefreshCw, Upload, Plus, Trash2, Edit3, Check, Palette, 
  Layers, CheckCircle2, ChevronDown, ChevronRight, Eye, ArrowUpRight, Camera,
  Globe, FileText, ShoppingBag, User, Link2, FolderPlus, Menu,
  X, Settings, ShieldCheck, MessageSquare, Sliders, ArrowRight,
  ListTree, CornerDownRight, Award, Briefcase, Star, DollarSign,
  Tag, Calendar, Image as ImageIcon, History, Send, HardDrive,
  RotateCcw, Bookmark, CheckCircle, Share2, Phone, Mail, Compass,
  MapPin, GraduationCap, Building2, Download, Languages, PenTool,
  Cpu, Monitor as ScreenIcon, Package, Code2, Layout, MoreVertical, Search,
  Wand2, Zap, FileDown, FileUp, Bold, Italic, Heading2, Heading3, Quote, List, ListOrdered, Code, MessageCircle,
  Video, Users, FileCode, HelpCircle, Copy, CheckCheck, Clock, Music, AlertTriangle, Info, Target, Gamepad2, LayoutGrid,
  Receipt, Heart
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { googleSync } from '../../utils/googleSync';
import { applyAccentColor } from '../../utils/theme';
import { DEFAULT_MAIN_WEBSITE_DATA, deepMerge, type MainWebsiteData } from '../landing/useLandingData';
import { OFFLINE_WEBSITE_TEMPLATES, buildOfflineWebsite, type OfflineWebsiteTemplate } from '../../utils/offlineTemplates';
import { generateAiWebsite } from '../../utils/ai';
import { DEFAULT_CONCIERGE_SETTINGS, type ConciergeSettings } from '../chat/LiveChatWidget';
import MediaGalleryModal from './MediaGalleryModal';
import { subscribeToGames, saveGameInstance, deleteGameInstance } from '../../services/gameService';
import { GameInstance } from '../../types/gameLicense';
import LPUpdatesFeed from '../landing/LPUpdatesFeed';
import LPPortfolio from '../landing/LPPortfolio';
import LPBlogPreview from '../landing/LPBlogPreview';
import LPFooter from '../landing/LPFooter';
import { UpdatesFeedManager } from './blog/UpdatesFeedManager';

export const DEFAULT_BOOKING_SETTINGS = {
  platform: 'WhatsApp',
  modalTitle: 'Jadwalkan Konsultasi',
  modalSubtitle: 'Tersambung langsung via WhatsApp / Online Call',
  adminWhatsApp: '',
  customPlatformName: '',
  customPlatformUrl: '',
  customServices: [
    { id: 'consultation', name: 'Konsultasi Desain & Branding', duration: '30 Menit', desc: 'Diskusi visual brand identity, UI/UX, dan positioning produk.' },
    { id: 'web_dev', name: 'Proyek Web & App Development', duration: '45 Menit', desc: 'Rancang arsitektur website, fitur CMS, dan integrasi custom.' },
    { id: 'marketing', name: 'Strategi Digital Marketing & Ads', duration: '30 Menit', desc: 'Evaluasi funnel penjualan, campaign media sosial, & SEO.' },
    { id: 'general', name: 'Discovery & Intro Call', duration: '20 Menit', desc: 'Perkenalan singkat dan penjajakan kerjasama proyek.' },
  ]
};

interface VisualWebEditorProps {
  notify: (msg: string, type?: string) => void;
  confirm: (msg: string, onConfirm: () => void) => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type ActivePageKey = 'home' | 'portfolio' | 'about' | 'catalog' | 'pricing' | 'games' | 'blog' | 'updates' | 'links' | (string & {});

interface Checkpoint {
  id: string;
  name: string;
  timestamp: number;
  data: MainWebsiteData;
  biodata: any;
  projects: any[];
  products: any[];
  blogPosts: any[];
  bioLinks: any[];
}

const ACCENT_COLORS = [
  '#64748b', '#6366f1', '#7c3aed', '#ec4899', '#f43f5e',
  '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#84cc16'
];

const CARD_PALETTES = [
  { accent: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)', glow: 'rgba(99, 102, 241, 0.18)' },
  { accent: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', glow: 'rgba(16, 185, 129, 0.18)' },
  { accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', glow: 'rgba(245, 158, 11, 0.18)' },
  { accent: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.2)', glow: 'rgba(236, 72, 153, 0.18)' },
  { accent: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.08)', border: 'rgba(14, 165, 233, 0.2)', glow: 'rgba(14, 165, 233, 0.18)' },
  { accent: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.2)', glow: 'rgba(168, 85, 247, 0.18)' },
];

export const EDITABLE_ICON_LIST = [
  { name: 'Sparkles', icon: Sparkles, label: 'Kilau / Kreatif' },
  { name: 'PenTool', icon: PenTool, label: 'Desain / Vektor' },
  { name: 'Layout', icon: Layout, label: 'Tata Letak UI' },
  { name: 'Code2', icon: Code2, label: 'Coding / Dev' },
  { name: 'Cpu', icon: Cpu, label: 'Teknologi / AI' },
  { name: 'Package', icon: Package, label: 'Produk / Paket' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Toko / Jualan' },
  { name: 'Briefcase', icon: Briefcase, label: 'Bisnis / Proyek' },
  { name: 'Globe', icon: Globe, label: 'Website / Global' },
  { name: 'Award', icon: Award, label: 'Prestasi / Sertifikat' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Edukasi / Kuliah' },
  { name: 'Building2', icon: Building2, label: 'Perusahaan / Kantor' },
  { name: 'Camera', icon: Camera, label: 'Fotografi / Media' },
  { name: 'Palette', icon: Palette, label: 'Warna & Seni' },
  { name: 'Layers', icon: Layers, label: 'Layer / Komponen' },
  { name: 'Star', icon: Star, label: 'Favorit / Bintang' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Keamanan / Garansi' },
  { name: 'MessageSquare', icon: MessageSquare, label: 'Chat / Komunikasi' },
  { name: 'Send', icon: Send, label: 'Kirim / Pesan' },
  { name: 'Phone', icon: Phone, label: 'Telepon / Kontak' },
  { name: 'Mail', icon: Mail, label: 'Email Resmi' },
  { name: 'Compass', icon: Compass, label: 'Eksplor / Media' },
  { name: 'Share2', icon: Share2, label: 'Sosial / Berbagi' },
  { name: 'Link2', icon: Link2, label: 'Tautan / Link' },
  { name: 'FileText', icon: FileText, label: 'Dokumen / Blog' },
  { name: 'User', icon: User, label: 'Profil / Person' },
  { name: 'MapPin', icon: MapPin, label: 'Lokasi / Peta' },
  { name: 'DollarSign', icon: DollarSign, label: 'Harga / Finansial' },
  { name: 'Calendar', icon: Calendar, label: 'Jadwal / Waktu' },
  { name: 'Bookmark', icon: Bookmark, label: 'Penanda / Simpan' },
];

export const renderDynamicIcon = (name?: string, size = 20, fallback = Sparkles) => {
  const item = EDITABLE_ICON_LIST.find(i => i.name.toLowerCase() === (name || '').toLowerCase());
  if (item) {
    const IconComp = item.icon;
    return <IconComp size={size} />;
  }
  const FallbackComp = fallback;
  return <FallbackComp size={size} />;
};

export const VisualWebEditor: React.FC<VisualWebEditorProps> = ({ notify, confirm }) => {
  // Main Data States
  const [data, setData] = useState<MainWebsiteData>(() => {
    try {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_main_website') : null;
      const savedAccent = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        const merged = deepMerge(DEFAULT_MAIN_WEBSITE_DATA, parsed);
        if (savedAccent) merged.theme.accentColor = savedAccent;
        return merged;
      }
      if (savedAccent) {
        return {
          ...DEFAULT_MAIN_WEBSITE_DATA,
          theme: { ...DEFAULT_MAIN_WEBSITE_DATA.theme, accentColor: savedAccent }
        };
      }
    } catch (e) {}
    return DEFAULT_MAIN_WEBSITE_DATA;
  });
  const [biodata, setBiodata] = useState<any>({
    fullName: 'sumr.day',
    role: 'Creative Digital Studio • Warm Tech & Skena-Aesthetic',
    company: 'sumr.day',
    location: 'Indonesia / Remote Worldwide',
    email: 'hi.sumrday@gmail.com',
    phone: '+62 812-3456-7890',
    website: 'https://sumrday.web.app',
    bio: 'Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic yang menghadirkan interaksi digital secara hangat, santai, dan penuh energi positif khas musim panas.',
    fullBio: 'Kami adalah sumr.day — Creative Digital Studio yang memadukan teknologi modern dengan estetika visual segar khas anak muda. A little sunshine for your screen.',
    avatarUrl: '',
    experiences: [
      { id: 'exp-1', period: '2024 - Sekarang', role: 'Creative Principal', company: 'sumr.day', description: 'Memimpin perancangan antarmuka visual produk dan sistem Warm Tech.' },
      { id: 'exp-2', period: '2021 - 2023', role: 'Digital Craftsman', company: 'Creative Innovation Labs', description: 'Merancang pengalaman digital untuk puluhan brand dan kreator konten.' }
    ],
    education: [
      { id: 'edu-1', period: '2017 - 2021', degree: 'S1 Desain Komunikasi Visual', institution: 'Institut Seni & Desain Indonesia', description: 'Fokus pada Branding, Typografi, dan Interaksi Digital.' }
    ],
    certifications: [
      { id: 'cert-1', year: '2024', name: 'Certified Professional UI/UX Designer', issuer: 'BNSP Indonesia' },
      { id: 'cert-2', year: '2023', name: 'Google UX Design Professional Certificate', issuer: 'Google / Coursera' }
    ],
    skills: [
      { id: 'sk-1', name: 'UI/UX Design', description: 'Wireframing, Prototyping, Figma' },
      { id: 'sk-2', name: 'Brand Identity', description: 'Logo, Visual Guidelines, Palette' },
      { id: 'sk-3', name: 'Design System', description: 'Token, Reusable Component Library' },
      { id: 'sk-4', name: 'Frontend Dev', description: 'React, Tailwind, Vanilla CSS' }
    ],
    languages: ['Bahasa Indonesia (Native)', 'English (Professional)'],
    socialLinks: {
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com'
    }
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [bioLinks, setBioLinks] = useState<any[]>([]);
  const [games, setGames] = useState<GameInstance[]>([]);
  const [editingGameModal, setEditingGameModal] = useState<GameInstance | null>(null);
  
  // Navigation & Viewport States
  const [activePage, setActivePage] = useState<ActivePageKey>('home');
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [isDark, setIsDark] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Record<string, boolean>>({});

  // Real Screen Size Detection (for mobile full screen optimization)
  const [screenWidth, setScreenWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // UI & Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'draft' | 'syncing'>('synced');
  
  // Modals & Panels
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'seo' | 'identity' | 'contact' | 'consultation' | 'concierge' | 'backup'>('seo');
  const [portfolioActiveCategory, setPortfolioActiveCategory] = useState('Semua');
  const [catalogActiveCategory, setCatalogActiveCategory] = useState('Semua');
  const [showMobilePageSelector, setShowMobilePageSelector] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [editingLinkItem, setEditingLinkItem] = useState<{ parentIdx: number; subIdx?: number } | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<{
    type: 'skill' | 'link' | 'custom';
    index?: number;
    id?: string;
    currentIcon?: string;
    title?: string;
  } | null>(null);
  const [iconSearchQuery, setIconSearchQuery] = useState('');

  // 1. AI & Offline Website Template Preset Generator State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateGenMode, setTemplateGenMode] = useState<'offline' | 'ai'>('offline');
  const [aiPrompt, setAiPrompt] = useState('Portofolio Desainer UI/UX & Brand Identity modern dan futuristik dengan perpaduan warna elegan.');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(OFFLINE_WEBSITE_TEMPLATES[0]?.id || '');

  // 2. Concierge / Live Chat Bot Settings State
  const [conciergeSettings, setConciergeSettings] = useState<ConciergeSettings>(DEFAULT_CONCIERGE_SETTINGS);

  // 3. Booking & Consultation Settings State
  const [bookingSettings, setBookingSettings] = useState<any>(DEFAULT_BOOKING_SETTINGS);

  // 4. Blog Markdown Rich Body Editor State
  const [blogEditorTab, setBlogEditorTab] = useState<'edit' | 'preview'>('edit');
  
  // Interactive Popup Modal Editors
  const [editingProjectModal, setEditingProjectModal] = useState<any>(null);
  const [editingProductModal, setEditingProductModal] = useState<any>(null);
  const [editingBlogModal, setEditingBlogModal] = useState<any>(null);

  // 5. Custom Page Creator Modal State
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [showDesktopPageList, setShowDesktopPageList] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTemplate, setNewPageTemplate] = useState<string>('pricing');
  const [newPageTemplateCategory, setNewPageTemplateCategory] = useState<string>('all');
  const [newPageTemplateSearch, setNewPageTemplateSearch] = useState<string>('');
  const [newPageShowInNavbar, setNewPageShowInNavbar] = useState(true);

  // 6. Modular Block Adder Modal State
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [addBlockCategory, setAddBlockCategory] = useState<string>('all');
  const [addBlockSearch, setAddBlockSearch] = useState<string>('');

  // 7. Custom UI Dropdown Popovers
  const [openNavbarPresetDropdown, setOpenNavbarPresetDropdown] = useState(false);
  const [openBtnVariantDropdown, setOpenBtnVariantDropdown] = useState<string | null>(null);

  const handleCreateNewCustomPage = () => {
    const rawTitle = newPageTitle.trim() || 'Halaman Baru';
    const autoSlug = (newPageSlug.trim() || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
    const finalSlug = autoSlug || `page-${Date.now()}`;
    const pageId = `cp_${Date.now()}`;

    let initialSections: any[] = [];
    let initialBadge = 'HALAMAN RESMI';
    let initialSubtitle = 'Halaman informasi dan layanan digital terintegrasi.';

    if (newPageTemplate === 'pricing') {
      initialBadge = 'PAKET & HARGA';
      initialSubtitle = 'Pilihan paket layanan terbaik sesuai kebutuhan dan skala bisnis Anda.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'pricing',
          title: 'Pilihan Paket Layanan',
          subtitle: 'Investasi terbaik dengan fitur lengkap dan garansi hasil maksimal',
          plans: [
            {
              id: 'p1',
              name: 'Paket Starter',
              desc: 'Cocok untuk personal dan UMKM baru',
              price: 'Rp 450.000',
              period: 'proyek',
              features: ['1 Halaman Landing Page', 'Revisi hingga 2x', 'Desain Responsif Mobile', 'Integrasi WhatsApp Direct', 'Waktu Pengerjaan 3 Hari'],
              buttonText: 'Pilih Starter',
              buttonAction: 'consultation'
            },
            {
              id: 'p2',
              name: 'Paket Profesional',
              desc: 'Pilihan paling populer untuk bisnis berkembang',
              price: 'Rp 1.250.000',
              period: 'proyek',
              isPopular: true,
              features: ['Hingga 5 Halaman Lengkap', 'Revisi hingga 5x', 'Integrasi CMS Dinamis', 'Optimasi SEO & Kecepatan', 'Custom Domain & SSL', 'Waktu Pengerjaan 5 Hari'],
              buttonText: 'Pilih Profesional',
              buttonAction: 'consultation'
            },
            {
              id: 'p3',
              name: 'Paket Enterprise',
              desc: 'Solusi lengkap & custom untuk skala besar',
              price: 'Rp 2.900.000',
              period: 'proyek',
              features: ['Unlimited Halaman', 'Revisi Tanpa Batas', 'Fitur Custom & API', 'Prioritas Support 24/7', 'Panduan & Pelatihan Tim'],
              buttonText: 'Konsultasi Enterprise',
              buttonAction: 'consultation'
            }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'faq',
          title: 'Pertanyaan Seputar Harga',
          subtitle: 'Hal-hal yang sering ditanyakan sebelum memulai kerjasama',
          faqs: [
            { question: 'Apakah ada biaya langganan bulanan tersembunyi?', answer: 'Tidak ada biaya tersembunyi. Biaya paket adalah pembayaran satu kali di awal.' },
            { question: 'Bagaimana sistem pembayaran proyek?', answer: 'Pembayaran dapat dilakukan melalui DP 50% di awal dan pelunasan setelah proyek selesai disetujui.' },
            { question: 'Apakah bisa mengajukan fitur custom?', answer: 'Tentu bisa, Anda dapat mendiskusikan kebutuhan khusus via chat konsultasi.' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Butuh Penawaran Khusus?',
          subtitle: 'Konsultasikan langsung ide dan rencana proyek Anda bersama tim kami.',
          buttonText: 'Jadwalkan Konsultasi',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'showcase') {
      initialBadge = 'SHOWCASE & PORTOFOLIO';
      initialSubtitle = 'Kumpulan karya dan proyek unggulan dengan modal popup interaktif.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'cards_grid',
          title: 'Karya Pilihan & Studi Kasus',
          subtitle: 'Klik setiap kartu untuk melihat rincian lengkap dalam modul popup interaktif',
          cards: [
            {
              id: 'c1',
              title: 'Aplikasi Fintech Modern',
              badge: 'STUDI KASUS',
              description: 'Redesain total antarmuka aplikasi perbankan digital untuk 500k+ pengguna aktif.',
              image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
              images: [
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=80'
              ],
              actionType: 'modal',
              details: 'Proyek mencakup perancangan sistem UI/UX, arsitektur informasi, alur transaksi aman, dan integrasi dashboard analitik dengan metrik konversi naik hingga 42%.',
              tags: ['UI/UX', 'Fintech', 'Mobile App']
            },
            {
              id: 'c2',
              title: 'Brand Identity Agensi Kreatif',
              badge: 'BRANDING',
              description: 'Konsep identitas visual komprehensif mulai dari logo, palet warna hingga guidelines.',
              image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
              images: [
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
              ],
              actionType: 'modal',
              details: 'Membangun karakter visual yang kuat dan konsisten untuk kebutuhan offline maupun media sosial digital.',
              tags: ['Branding', 'Typography', 'Visual Design']
            },
            {
              id: 'c3',
              title: 'E-Commerce Skala Global',
              badge: 'WEBSITE',
              description: 'Platform jual beli online dengan kecepatan tinggi dan sistem pembayaran otomatis.',
              image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
              actionType: 'modal',
              details: 'Menggunakan teknologi headless Next.js dengan optimasi SEO tingkat lanjut dan integrasi payment gateway.',
              tags: ['Web Dev', 'E-Commerce', 'Fullstack']
            }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'stats',
          title: 'Hasil & Dampak Nyata',
          subtitle: 'Pencapaian metrik keberhasilan dari proyek-proyek yang telah diluncurkan',
          items: [
            { value: '42%', label: 'Kenaikan Konversi' },
            { value: '1.2M+', label: 'Pengguna Aktif' },
            { value: '99.9%', label: 'Stabilitas Server' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Tertarik dengan Hasil Serupa?',
          subtitle: 'Mari diskusikan solusi visual dan teknologi terbaik untuk bisnis Anda.',
          buttonText: 'Mulai Diskusi Proyek',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'before_after') {
      initialBadge = 'STUDI TRANSFORMASI';
      initialSubtitle = 'Bandingkan kualitas sebelum dan sesudah redesain secara interaktif.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'before_after',
          title: 'Perbandingan Redesain Visual',
          subtitle: 'Geser slider di tengah untuk melihat perbedaan hasil sebelum dan sesudah pengerjaan',
          beforeImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
          afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
          beforeLabel: 'SEBELUM (BEFORE)',
          afterLabel: 'SESUDAH (AFTER)'
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'features',
          title: 'Peningkatan yang Dihadirkan',
          subtitle: 'Fokus perbaikan yang memberikan nilai tambah nyata bagi brand Anda',
          items: [
            { title: 'Estetika Lebih Segar', desc: 'Warna dan tipografi disesuaikan dengan tren modern berkelas.' },
            { title: 'Navigasi Lebih Intuitif', desc: 'Kemudahan akses menu dan alur checkout yang efisien.' },
            { title: 'Waktu Muat 3x Lebih Cepat', desc: 'Optimasi aset gambar dan arsitektur kode modern.' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Siap Tingkatkan Kualitas Brand Anda?',
          subtitle: 'Dapatkan proposal rancangan dan jadwal konsultasi awal gratis bersama tim kami.',
          buttonText: 'Konsultasi Redesain',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'gallery') {
      initialBadge = 'GALERI VISUAL';
      initialSubtitle = 'Koleksi foto dan hasil karya visual dengan penampil Lightbox Carousel.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'gallery',
          title: 'Dokumentasi & Galeri Foto',
          subtitle: 'Klik foto mana saja untuk membuka tampilan layar penuh dan carousel slide',
          images: [
            { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80', caption: 'Karya Visual Modern #1' },
            { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80', caption: 'Desain Interior & Ruang Kreatif' },
            { url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=80', caption: 'Kemasan & Identitas Produk' },
            { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80', caption: 'Desain Antarmuka Aplikasi' },
            { url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80', caption: 'Sistem Navigasi Interaktif' },
            { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80', caption: 'Kolaborasi Tim Kreatif' }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'cta',
          title: 'Ingin Membuat Galeri Serupa?',
          subtitle: 'Hubungi kami untuk mengintegrasikan dokumentasi visual terbaik pada website Anda.',
          buttonText: 'Hubungi Tim',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'agency_full') {
      initialBadge = 'AGENSI KREATIF';
      initialSubtitle = 'Solusi branding, desain website, dan strategi pertumbuhan digital terintegrasi.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'video',
          title: 'Showreel Kreatif 2026',
          subtitle: 'Cuplikan karya, standar kualitas, dan dedikasi tim kami dalam setiap proyek',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          showHeading: true,
          fullCard: false
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'features',
          title: 'Layanan Unggulan Kami',
          subtitle: 'Pendekatan holistik dari riset strategi hingga peluncuran produk',
          columns: 3,
          items: [
            { title: 'Brand Identity & Strategy', desc: 'Membangun positioning brand yang membedakan Anda di pasar.' },
            { title: 'Website Studio & CMS', desc: 'Landing page berkecepatan tinggi dengan sistem manajemen konten mandiri.' },
            { title: 'Growth Marketing', desc: 'Kampanye digital terarah untuk melipatgandakan prospek dan penjualan.' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'stats',
          title: 'Rekam Jejak Keberhasilan',
          subtitle: 'Angka nyata di balik kepuasan klien',
          items: [
            { value: '150+', label: 'Proyek Selesai' },
            { value: '98%', label: 'Tingkat Kepuasan' },
            { value: '12+', label: 'Penghargaan Desain' }
          ]
        },
        {
          id: `sec_${Date.now()}_4`,
          type: 'testimonials',
          title: 'Kata Klien Kami',
          subtitle: 'Pengalaman nyata bermitra bersama tim agensi',
          items: [
            { name: 'Sarah Amanda', role: 'Chief Marketing Officer', quote: 'Transformasi brand kami sangat luar biasa. Penjualan naik signifikan pasca peluncuran website baru.', rating: 5 },
            { name: 'Budi Hartono', role: 'Founder & CEO', quote: 'Komunikasi sangat responsif, hasil kerja tepat waktu, dan kualitas visual di atas ekspektasi.', rating: 5 }
          ]
        },
        {
          id: `sec_${Date.now()}_5`,
          type: 'cta',
          title: 'Mulai Kolaborasi Bersama Kami',
          subtitle: 'Jadwalkan sesi konsultasi 30 menit bersama Creative Director kami.',
          buttonText: 'Konsultasi Gratis',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'beauty_clinic') {
      initialBadge = 'KLINIK ESTETIKA';
      initialSubtitle = 'Perawatan kecantikan medis terpercaya dengan dokter spesialis bersertifikat.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'before_after',
          title: 'Hasil Transformasi Pasien',
          subtitle: 'Bukti nyata hasil treatment glowing dan peremajaan kulit setelah 3 sesi perawatan',
          beforeImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80',
          afterImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
          beforeLabel: 'SEBELUM TREATMENT',
          afterLabel: 'HASIL SESUDAH',
          showHeading: true,
          fullCard: false
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'cards_grid',
          title: 'Pilihan Menu Treatment Unggulan',
          subtitle: 'Teknologi medis terkini dari Korea dan Eropa untuk kesehatan kulit maksimal',
          cards: [
            {
              id: 't1',
              title: 'Laser Skin Rejuvenation',
              badge: 'POPULER',
              description: 'Mencerahkan flek hitam, meratakan tekstur kulit, dan mengecilkan pori-pori.',
              image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
              actionType: 'modal',
              details: 'Perawatan non-invasif dengan teknologi laser pico terbaru. Waktu pemulihan minimal dan hasil terlihat sejak sesi pertama.',
              tags: ['Laser', 'Pencerah', 'Anti-Aging']
            },
            {
              id: 't2',
              title: 'Acne Deep Cleansing & Peeling',
              badge: 'BESTSELLER',
              description: 'Mengatasi jerawat meradang, memudarkan bekas, dan mengontrol minyak berlebih.',
              image: 'https://images.unsplash.com/photo-1512290900672-1f02e71ed3d0?auto=format&fit=crop&w=800&q=80',
              actionType: 'modal',
              details: 'Kombinasi ekstraksi higienis, masker antibakteri, dan peeling formula khusus untuk kulit sensitif rentan berjerawat.',
              tags: ['Jerawat', 'Cleansing', 'Detox']
            }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Konsultasikan Masalah Kulit Anda',
          subtitle: 'Dapatkan analisis kondisi kulit gratis bersama tim dokter estetika kami.',
          buttonText: 'Reservasi Treatment Sekarang',
          buttonType: 'whatsapp'
        }
      ];
    } else if (newPageTemplate === 'dental_care') {
      initialBadge = 'KLINIK DENTAL';
      initialSubtitle = 'Perawatan gigi modern, estetika senyum, dan ortodonti tanpa rasa sakit.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'before_after',
          title: 'Transformasi Senyum (Smile Makeover)',
          subtitle: 'Perubahan senyum percaya diri setelah perawatan veneer dan perapihan gigi',
          beforeImage: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80',
          afterImage: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1000&q=80',
          beforeLabel: 'SEBELUM PERAWATAN',
          afterLabel: 'SENYUM BARU',
          showHeading: true,
          fullCard: false
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'features',
          title: 'Mengapa Memilih Kami',
          subtitle: 'Standar kebersihan steril internasional dan fasilitas serba digital',
          columns: 3,
          items: [
            { title: 'Dokter Gigi Spesialis', desc: 'Ditangani langsung oleh dokter spesialis konservasi & ortodonti berpengalaman.' },
            { title: 'Peralatan 3D Digital Scan', desc: 'Pemeriksaan akurat tanpa rasa mual dengan intraoral scanner 3D tercanggih.' },
            { title: 'Ruang Nyaman & Tenang', desc: 'Suasana klinik santai dengan hiburan musik dan Netflix saat tindakan.' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Jadwalkan Pemeriksaan Gigi Anda',
          subtitle: 'Booking jadwal konsultasi fleksibel sesuai waktu luang Anda.',
          buttonText: 'Booking Jadwal Dokter',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'fitness_trainer') {
      initialBadge = 'FITNESS & COACHING';
      initialSubtitle = 'Program latihan personal, panduan nutrisi, dan transformasi tubuh terukur.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'before_after',
          title: 'Transformasi Bentuk Tubuh 90 Hari',
          subtitle: 'Hasil konsistensi program weight loss & muscle toning dalam 12 minggu',
          beforeImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
          afterImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80',
          beforeLabel: 'BULAN KE-1 (BEFORE)',
          afterLabel: 'BULAN KE-3 (AFTER)',
          showHeading: true,
          fullCard: false
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'pricing',
          title: 'Pilihan Program Coaching',
          subtitle: 'Pilih paket bimbingan yang sesuai dengan target kebugaran Anda',
          plans: [
            {
              id: 'f1',
              name: 'Online Coaching 1-on-1',
              desc: 'Bimbingan jarak jauh via aplikasi',
              price: 'Rp 650.000',
              period: 'bulan',
              features: ['Program Latihan Custom', 'Meal Plan Nutrisi Harian', 'Evaluasi Mingguan', 'Konsultasi WhatsApp 24/7'],
              buttonText: 'Pilih Online',
              buttonAction: 'consultation'
            },
            {
              id: 'f2',
              name: 'Private Gym Training (12 Sesi)',
              desc: 'Pendampingan langsung di gym',
              price: 'Rp 2.400.000',
              period: 'paket',
              isPopular: true,
              features: ['12 Sesi Private 60 Menit', 'Koreksi Form & Postur', 'Suplemen & Nutrisi Guide', 'Garansi Penurunan Lemak'],
              buttonText: 'Daftar Private',
              buttonAction: 'consultation'
            }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Mulai Transformasi Tubuh Anda Hari Ini',
          subtitle: 'Slot bimbingan terbatas setiap bulannya untuk menjaga kualitas hasil.',
          buttonText: 'Konsultasi Target Tubuh',
          buttonType: 'whatsapp'
        }
      ];
    } else if (newPageTemplate === 'interior_design') {
      initialBadge = 'INTERIOR & ARSITEKTUR';
      initialSubtitle = 'Perancangan ruang estetik, fungsional, dan bernilai investasi tinggi.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'before_after',
          title: 'Transformasi Ruang Tamu & Dapur',
          subtitle: 'Perbandingan kondisi ruang lama dengan hasil renovasi modern minimalis',
          beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
          afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
          beforeLabel: 'RUANG LAMA',
          afterLabel: 'HASIL RENOVASI',
          showHeading: true,
          fullCard: false
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'gallery',
          title: 'Portofolio Desain 3D & Realisasi',
          subtitle: 'Koleksi proyek residensial dan komersial yang telah kami selesaikan',
          images: [
            { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80', caption: 'Modern Japandi Living Room', linkUrl: '' },
            { url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80', caption: 'Master Bedroom Minimalis', linkUrl: '' },
            { url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80', caption: 'Island Kitchen & Dining', linkUrl: '' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Ingin Mewujudkan Rumah Impian?',
          subtitle: 'Diskusikan denah dan konsep ruang Anda bersama Principal Architect kami.',
          buttonText: 'Konsultasi Desain Gratis',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'coffee_shop') {
      initialBadge = 'CAFE & COFFEE';
      initialSubtitle = 'Kopi artisan terbaik, suasana santai, dan ruang kreasi yang nyaman.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'cards_grid',
          title: 'Menu Minuman Signature',
          subtitle: 'Koleksi seduhan kopi pilihan biji single origin nusantara dan mocktail segar',
          cards: [
            {
              id: 'm1',
              title: 'Aren Creamy Latte',
              badge: 'FAVORIT',
              description: 'Espresso bold berpadu susu segar gurih dan gula aren organik murni.',
              image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
              actionType: 'modal',
              details: 'Diracik dengan double espresso blend arabica gayo dan robusta dampit, memberikan aroma karamel yang kaya dan aftertaste lembut.',
              tags: ['Kopi Susu', 'Signature', 'Dingin']
            },
            {
              id: 'm2',
              title: 'Artisan Pour Over V60',
              badge: 'SINGLE ORIGIN',
              description: 'Metode manual brew menonjolkan notes buah segar dan aroma floral.',
              image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
              actionType: 'modal',
              details: 'Pilihan biji kopi berganti setiap minggu (Ethiopia, Kerinci, Ijen Anaerobic) diseduh dengan suhu presisi 92°C.',
              tags: ['Manual Brew', 'Filter', 'Arabica']
            }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'gallery',
          title: 'Suasana & Fasilitas Cafe',
          subtitle: 'Ruang indoor ber-AC, area outdoor rimbun, Wi-Fi 100 Mbps, dan colokan di setiap meja',
          images: [
            { url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80', caption: 'Area Indoor & Barista Bar', linkUrl: '' },
            { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80', caption: 'Co-Working Friendly Seating', linkUrl: '' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Kunjungi Outlet Kami Hari Ini',
          subtitle: 'Buka setiap hari 08.00 - 23.00. Tersedia reservasi meja untuk meeting atau acara komunitas.',
          buttonText: 'Petunjuk Arah Google Maps',
          buttonType: 'link'
        }
      ];
    } else if (newPageTemplate === 'saas_product') {
      initialBadge = 'APLIKASI SAAS';
      initialSubtitle = 'Platform otomatisasi cloud untuk meningkatkan produktivitas tim Anda.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'video',
          title: 'Demo Singkat Produk 2 Menit',
          subtitle: 'Lihat bagaimana platform kami menyederhanakan alur kerja tim Anda secara instan',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          showHeading: true,
          fullCard: false
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'features',
          title: 'Fitur Utama Terintegrasi',
          subtitle: 'Semua alat yang Anda butuhkan dalam satu dashboard terpadu',
          columns: 3,
          items: [
            { title: 'Sinkronisasi Realtime', desc: 'Data terupdate otomatis di seluruh perangkat dalam hitungan milidetik.' },
            { title: 'Analitik & AI Insight', desc: 'Dapatkan laporan prediksi cerdas berbasis machine learning.' },
            { title: 'Keamanan End-to-End', desc: 'Enkripsi AES-256 dan kepatuhan standar privasi data internasional.' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'pricing',
          title: 'Pilihan Paket Langganan',
          subtitle: 'Mulai gratis 14 hari tanpa perlu kartu kredit',
          plans: [
            {
              id: 's1',
              name: 'Starter',
              desc: 'Hingga 5 anggota tim',
              price: 'Rp 149.000',
              period: 'bulan',
              features: ['5 User Accounts', '10 GB Cloud Storage', 'Integrasi WhatsApp & Email', 'Community Support'],
              buttonText: 'Coba Gratis',
              buttonAction: 'consultation'
            },
            {
              id: 's2',
              name: 'Pro Team',
              desc: 'Pilihan terbaik tim berkembang',
              price: 'Rp 399.000',
              period: 'bulan',
              isPopular: true,
              features: ['Unlimited Users', '100 GB Cloud Storage', 'AI Automated Reports', 'Priority 24/7 SLA Support'],
              buttonText: 'Mulai Uji Coba Pro',
              buttonAction: 'consultation'
            }
          ]
        },
        {
          id: `sec_${Date.now()}_4`,
          type: 'cta',
          title: 'Tingkatkan Efisiensi Bisnis Anda',
          subtitle: 'Daftar sekarang dan nikmati akses penuh tanpa risiko selama 14 hari.',
          buttonText: 'Coba Gratis Sekarang',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'about_personal') {
      initialBadge = 'PROFIL & CV PRIBADI';
      initialSubtitle = 'Kisah perjalanan profesional, keahlian khusus, pengalaman kerja, dan portofolio saya.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'text',
          title: 'Tentang Saya & Filosofi Berkarya',
          subtitle: 'Mendedikasikan diri untuk perpaduan estetika visual dan fungsionalitas digital',
          content: 'Saya adalah seorang profesional kreatif yang berfokus pada desain grafis, UI/UX, dan pengembangan identitas merek. Dengan latar belakang eksplorasi visual yang kuat, saya berkomitmen menghadirkan karya yang tidak hanya memikat secara visual, namun juga memecahkan masalah nyata dan meningkatkan nilai bisnis klien.',
          quote: 'Karya terbaik lahir dari rasa ingin tahu tanpa henti, perhatian mendalam pada detail, dan eksekusi yang konsisten.',
          quoteAuthor: biodata?.fullName || 'sumr.day',
          quoteRole: biodata?.role || 'Senior Brand & UI Designer'
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'features',
          title: 'Keahlian & Toolkit Utama',
          subtitle: 'Spesialisasi kemampuan teknis dan alat kreatif yang saya gunakan sehari-hari',
          columns: 3,
          items: [
            { title: 'Brand Identity & Logo', desc: 'Merancang identitas visual lengkap dari logo, palet warna, hingga guidelines merek komprehensif.' },
            { title: 'UI/UX & Prototyping', desc: 'Membangun antarmuka interaktif yang intuitif, ramah pengguna, dan sistem desain yang terukur.' },
            { title: 'Front-End & Website Studio', desc: 'Pengembangan landing page modern dengan performa cepat, responsif mobile, dan ramah SEO.' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'process',
          title: 'Riwayat Karier & Pengalaman Kerja',
          subtitle: 'Jejak langkah profesional dan kontribusi dalam berbagai proyek industri',
          items: [
            { title: '2023 - Sekarang • Lead Brand & Product Designer', desc: 'Memimpin arahan visual agensi, merancang sistem desain, dan menangani puluhan klien enterprise.' },
            { title: '2021 - 2023 • Senior UI/UX Specialist', desc: 'Merancang antarmuka aplikasi digital untuk lebih dari 20+ startup teknologi dan UMKM lokal.' },
            { title: '2018 - 2021 • Freelance Graphic Designer', desc: 'Mengerjakan branding, kemasan produk, dan materi pemasaran media sosial untuk berbagai industri.' }
          ]
        },
        {
          id: `sec_${Date.now()}_4`,
          type: 'stats',
          title: 'Statistik Capaian & Prestasi',
          subtitle: 'Metrik rekam jejak dedikasi selama berkarier di dunia kreatif digital',
          items: [
            { value: '5+ Tahun', label: 'Pengalaman Aktif' },
            { value: '180+', label: 'Proyek Selesai' },
            { value: '99%', label: 'Kepuasan Klien' },
            { value: '10+', label: 'Sertifikasi BNSP & Global' }
          ]
        },
        {
          id: `sec_${Date.now()}_5`,
          type: 'cta',
          title: 'Tertarik Berkolaborasi Bersama Saya?',
          subtitle: 'Buka peluang proyek freelance, konsultasi desain, atau peluang kerja sama baru.',
          buttonText: 'Hubungi Saya Langsung',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'about_company') {
      initialBadge = 'TENTANG PERUSAHAAN';
      initialSubtitle = 'Misi, visi, budaya kerja, dan fondasi nilai perusahaan kami.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'text',
          title: 'Membangun Ekosistem Digital Masa Depan',
          subtitle: 'Solusi teknologi dan visual terpadu untuk percepatan bisnis modern',
          content: 'Didirikan dengan semangat inovasi dan kualitas tinggi, kami hadir untuk membantu para pelaku bisnis dan jenama bertumbuh di era digital. Kami mengintegrasikan riset strategis, desain mutakhir, dan implementasi teknologi berkecepatan tinggi demi mencapai hasil terbaik.',
          quote: 'Keberhasilan klien kami adalah tolak ukur utama dari setiap inovasi yang kami ciptakan.',
          quoteAuthor: 'Leadership Board',
          quoteRole: 'Dewan Direksi & Pendiri'
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'features',
          title: 'Nilai-Nilai Utama Perusahaan',
          subtitle: 'Prinsip kerja yang memandu setiap interaksi dan peluncuran produk kami',
          columns: 3,
          items: [
            { title: 'Inovasi Tanpa Batas', desc: 'Selalu mengadopsi standar teknologi dan metodologi kreatif terkini.' },
            { title: 'Integritas & Transparansi', desc: 'Komunikasi terbuka, tepat waktu, dan mengutamakan kepercayaan klien.' },
            { title: 'Fokus pada Dampak Nyata', desc: 'Setiap karya dirancang untuk memberikan hasil terukur bagi pertumbuhan bisnis.' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'stats',
          title: 'Perjalanan & Skala Perusahaan',
          subtitle: 'Pertumbuhan konsisten dalam melayani pasar nasional dan internasional',
          items: [
            { value: '500+', label: 'Klien Terlayani' },
            { value: '15+', label: 'Kota Jangkauan' },
            { value: '99.8%', label: 'Uptime & Kualitas' },
            { value: '24/7', label: 'Layanan Dukungan' }
          ]
        },
        {
          id: `sec_${Date.now()}_4`,
          type: 'cta',
          title: 'Siap Bertumbuh Bersama Kami?',
          subtitle: 'Jadwalkan pertemuan diskusi strategi bersama tim konsultan ahli kami.',
          buttonText: 'Konsultasi Perusahaan',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'about_team') {
      initialBadge = 'TENTANG KAMI';
      initialSubtitle = 'Kisah perjalanan, visi misi, dan tim berdedikasi di balik layanan kami.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'text',
          title: 'Dedikasi untuk Solusi Digital Terbaik',
          subtitle: 'Berawal dari gairah terhadap desain visual dan kecanggihan teknologi',
          content: 'Kami adalah tim desainer dan pengembang web yang berfokus pada penciptaan pengalaman digital yang berkesan. Setiap proyek kami tangani dengan dedikasi penuh, mengutamakan estetika berkelas, performa kecepatan, dan kemudahan bagi pengguna akhir.',
          quote: 'Desain bukan sekadar apa yang terlihat, melainkan bagaimana pengalaman tersebut bekerja secara sempurna.',
          quoteAuthor: 'Founding Team',
          quoteRole: 'Studio Principal'
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'stats',
          title: 'Pencapaian Kami',
          subtitle: 'Angka dan tonggak prestasi selama melayani klien di berbagai industri',
          items: [
            { value: '7+ Tahun', label: 'Pengalaman Industri' },
            { value: '250+', label: 'Proyek Selesai' },
            { value: '99%', label: 'Kepuasan Klien' },
            { value: '15+', label: 'Penghargaan Desain' }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Mari Bekerjasama',
          subtitle: 'Kami selalu terbuka untuk mendiskusikan peluang kolaborasi baru.',
          buttonText: 'Jadwalkan Sesi Perkenalan',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'roadmap') {
      initialBadge = 'ALUR KERJA';
      initialSubtitle = 'Tahapan proses terstruktur demi menjamin kualitas pengerjaan tepat waktu.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'process',
          title: 'Langkah-Langkah Pengerjaan Proyek',
          subtitle: 'Proses transparan dan terukur dari tahap konsepsi hingga peluncuran resmi',
          items: [
            { title: '1. Riset & Discovery', desc: 'Mendalami tujuan bisnis, target audiens, dan analisis kompetitor secara detail.' },
            { title: '2. Wireframe & Konsep Visual', desc: 'Menyusun struktur layout halaman dan eksplorasi gaya visual modern.' },
            { title: '3. Pengembangan & Integrasi CMS', desc: 'Pengkodean bersih, optimasi kecepatan, dan koneksi dashboard admin.' },
            { title: '4. Pengujian & Peluncuran', desc: 'Uji coba fungsi menyeluruh, verifikasi SEO, dan serah terima akses penuh.' }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'cta',
          title: 'Siap Melangkah Bersama Kami?',
          subtitle: 'Dapatkan perkiraan waktu pengerjaan dan penawaran sesuai kebutuhan Anda.',
          buttonText: 'Mulai Langkah Pertama',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'stats_success') {
      initialBadge = 'BUKTI & PRESTASI';
      initialSubtitle = 'Hasil terukur dan testimoni asli dari klien yang telah bekerjasama.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'stats',
          title: 'Statistik Capaian Klien',
          subtitle: 'Data nyata dampak digitalisasi terhadap pertumbuhan bisnis partner kami',
          items: [
            { value: '350+', label: 'Peluncuran Website' },
            { value: '99.8%', label: 'Tingkat Kepuasan' },
            { value: '50M+', label: 'Total Interaksi Pengguna' }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'testimonials',
          title: 'Testimoni & Pengalaman Klien',
          subtitle: 'Apa yang mereka katakan mengenai dedikasi dan kualitas kerja kami',
          items: [
            {
              name: 'Ahmad Fauzi',
              role: 'CEO PT Inovasi Digital',
              quote: 'Hasil pengerjaan website sangat memuaskan, desain terlihat sangat premium dan mudah dikelola melalui dashboard admin.',
              rating: 5,
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
            },
            {
              name: 'Ratna Sari',
              role: 'Founder Butik Kreatif',
              quote: 'Tim sangat komunikatif dan memahami kebutuhan brand kami. Konversi pesanan meningkat drastis setelah peluncuran.',
              rating: 5,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            }
          ]
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Jadilah Kisah Sukses Berikutnya',
          subtitle: 'Wujudkan standar baru bagi identitas online bisnis Anda hari ini.',
          buttonText: 'Konsultasi Sekarang',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'webinar_event') {
      initialBadge = 'EVENT & WORKSHOP';
      initialSubtitle = 'Jadwal seminar online, pelatihan intensif, dan sesi booking konsultasi.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'features',
          title: 'Materi & Keuntungan Mengikuti',
          subtitle: 'Pengetahuan praktis yang langsung dapat diimplementasikan',
          items: [
            { title: 'Studi Kasus Nyata', desc: 'Pembahasan proyek langsung dari pengalaman industri.' },
            { title: 'Sesi Tanya Jawab Langsung', desc: 'Diskusi interaktif bersama praktisi berpengalaman.' },
            { title: 'Sertifikat & Rekaman Akses', desc: 'Aset materi lengkap dapat diunduh kapan saja.' }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'pricing',
          title: 'Pilihan Tiket & Registrasi',
          subtitle: 'Amankan kuota partisipasi Anda sebelum periode pendaftaran ditutup',
          plans: [
            {
              name: 'Tiket Reguler',
              price: 'Rp 99.000',
              desc: 'Akses webinar langsung & materi presentasi PDF',
              features: ['Akses Live Session 2 Jam', 'Slide Materi PDF', 'Sertifikat Digital'],
              buttonText: 'Daftar Reguler',
              buttonAction: 'consultation'
            },
            {
              name: 'Tiket VIP + 1on1 Call',
              price: 'Rp 299.000',
              desc: 'Termasuk sesi mentoring privat eksklusif',
              isPopular: true,
              features: ['Seluruh Akses Reguler', 'Rekaman Video Seumur Hidup', 'Sesi 1-on-1 Mentoring 45 Menit', 'Review Portofolio Langsung'],
              buttonText: 'Daftar VIP',
              buttonAction: 'consultation'
            }
          ]
        }
      ];
    } else if (newPageTemplate === 'link_bio') {
      initialBadge = 'LINK RESMI';
      initialSubtitle = 'Pusat akses cepat menuju seluruh platform, portofolio, dan kontak resmi kami.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'button_group',
          title: 'Tautan Navigasi Cepat',
          subtitle: 'Pilih saluran yang ingin Anda tuju',
          buttons: [
            { label: 'Chat Langsung via WhatsApp', url: 'https://wa.me/', variant: 'primary' },
            { label: 'Lihat Katalog & Portofolio', url: '/portfolio', variant: 'secondary' },
            { label: 'Jadwalkan Sesi Konsultasi', url: '#', variant: 'secondary' },
            { label: 'Kunjungi Akun Instagram', url: 'https://instagram.com', variant: 'outline' }
          ]
        }
      ];
    } else if (newPageTemplate === 'faq') {
      initialBadge = 'PUSAT BANTUAN';
      initialSubtitle = 'Jawaban lengkap atas pertanyaan yang sering diajukan mengenai layanan kami.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'faq',
          title: 'Pertanyaan Umum (FAQ)',
          subtitle: 'Informasi lengkap alur kerja, durasi pengerjaan, dan garansi layanan',
          faqs: [
            { question: 'Berapa lama rata-rata proses pengerjaan website?', answer: 'Pengerjaan berkisar antara 3 hingga 7 hari kerja tergantung kelengkapan materi dan kompleksitas fitur.' },
            { question: 'Apakah website sudah responsif di HP dan tablet?', answer: 'Ya, seluruh desain dibuat 100% mobile-friendly dan tampil sempurna di segala ukuran layar.' },
            { question: 'Bagaimana cara memperbarui konten di kemudian hari?', answer: 'Anda mendapatkan akses Dashboard CMS admin lengkap untuk mengedit teks, foto, produk, dan portofolio kapan saja tanpa perlu coding.' },
            { question: 'Apakah ada garansi setelah website selesai dibuat?', answer: 'Kami memberikan garansi pemeliharaan dan perbaikan teknis gratis selama 30 hari pasca serah terima.' }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'cta',
          title: 'Pertanyaan Anda Belum Terjawab?',
          subtitle: 'Tim kami siap membantu menjawab pertanyaan Anda melalui chat langsung.',
          buttonText: 'Hubungi Kami via WA',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'features') {
      initialBadge = 'SOLUSI TERBAIK';
      initialSubtitle = 'Keunggulan dan teknologi terkini yang kami gunakan untuk hasil terbaik.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'features',
          title: 'Fitur & Keunggulan Layanan',
          subtitle: 'Fondasi kualitas tinggi untuk meningkatkan citra dan konversi bisnis Anda',
          columns: 3,
          items: [
            { title: 'Desain Modern VisionOS', desc: 'Estetika visual premium dengan efek glassmorphism dan micro-animation halus.' },
            { title: 'Performa Super Cepat', desc: 'Optimasi loading secepat kilat untuk pengalaman pengguna terbaik.' },
            { title: 'SEO & Google Ready', desc: 'Struktur metadata rapi agar mudah ditemukan di mesin pencarian Google.' }
          ]
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'text',
          title: 'Komitmen Kualitas Kami',
          subtitle: 'Dedikasi penuh dalam setiap detail desain dan implementasi kode',
          content: 'Kami percaya bahwa website yang hebat tidak hanya terlihat menarik, tetapi juga memberikan hasil nyata bagi pertumbuhan bisnis Anda. Setiap elemen dirancang dengan riset mendalam dan pengujian fungsionalitas menyeluruh.'
        },
        {
          id: `sec_${Date.now()}_3`,
          type: 'cta',
          title: 'Wujudkan Website Impian Anda',
          subtitle: 'Mulai kolaborasi sekarang dan rasakan kemudahan mengelola website mandiri.',
          buttonText: 'Mulai Sekarang',
          buttonType: 'consultation'
        }
      ];
    } else if (newPageTemplate === 'legal') {
      initialBadge = 'INFORMASI RESMI';
      initialSubtitle = 'Ketentuan penggunaan layanan dan kebijakan privasi klien.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'text',
          title: '1. Ketentuan Umum & Kerjasama',
          subtitle: 'Hak dan kewajiban dalam pelaksanaan proyek',
          content: 'Dengan menggunakan layanan kami, Anda menyetujui seluruh ketentuan pengerjaan proyek, alur revisi, dan serah terima aset digital sesuai kesepakatan awal proposal.'
        },
        {
          id: `sec_${Date.now()}_2`,
          type: 'text',
          title: '2. Hak Cipta & Kepemilikan Aset',
          subtitle: 'Kepemilikan penuh hasil karya desain',
          content: 'Seluruh hasil karya desain final yang telah dilunasi sepenuhnya menjadi hak milik klien. Kami berhak mencantumkan karya tersebut sebagai bagian dari portofolio resmi agensi kecuali ada perjanjian kerahasiaan (NDA) sebelumnya.'
        }
      ];
    } else {
      initialBadge = 'HALAMAN KUSTOM';
      initialSubtitle = 'Deskripsi pengantar halaman baru Anda.';
      initialSections = [
        {
          id: `sec_${Date.now()}_1`,
          type: 'text',
          title: 'Selamat Datang di Halaman Baru',
          subtitle: 'Mulai tambahkan konten visual dan teks Anda di sini',
          content: 'Klik pada teks ini untuk mulai menulis, atau gunakan tombol "+ Tambah Blok" di bawah untuk menambahkan kartu fitur, paket harga, FAQ, atau banner ajakan bertindak.'
        }
      ];
    }

    const newCustomPage = {
      id: pageId,
      title: rawTitle,
      slug: finalSlug,
      badge: initialBadge,
      subtitle: initialSubtitle,
      showInNavbar: newPageShowInNavbar,
      sections: initialSections
    };

    const updatedCustomPages = [...(data.customPages || []), newCustomPage];
    updateField('customPages', updatedCustomPages);
    setActivePage(pageId);
    setShowNewPageModal(false);
    setNewPageTitle('');
    setNewPageSlug('');
    setNewPageTemplate('pricing');
    setIsDirty(true);
    notify(`Halaman "${rawTitle}" berhasil dibuat!`);
  };

  // Checkpoints State
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{ type: string; id?: string; index?: number } | null>(null);

  // Keyboard Escape Handler for all Studio Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTemplateModal) setShowTemplateModal(false);
        else if (showSettingsDrawer) setShowSettingsDrawer(false);
        else if (showHistoryModal) setShowHistoryModal(false);
        else if (isGalleryOpen) setIsGalleryOpen(false);
        else if (iconPickerTarget) setIconPickerTarget(null);
        else if (editingProjectModal) setEditingProjectModal(null);
        else if (editingProductModal) setEditingProductModal(null);
        else if (editingBlogModal) setEditingBlogModal(null);
        else if (showColorPicker) setShowColorPicker(false);
        else if (showMobilePageSelector) setShowMobilePageSelector(false);
        else if (showMobileMoreMenu) setShowMobileMoreMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTemplateModal, showSettingsDrawer, showHistoryModal, isGalleryOpen, iconPickerTarget, editingProjectModal, editingProductModal, editingBlogModal, showColorPicker, showMobilePageSelector, showMobileMoreMenu]);

  // Load initial data & checkpoints
  useEffect(() => {
    let isMounted = true;
    const loadAllData = async () => {
      try {
        const [
          savedData, savedProjects, savedProducts, savedBlogs, savedLinks, savedCheckpoints, savedBio, savedConcierge, savedBooking
        ] = await Promise.all([
          storage.getItem('porto_main_website', null),
          storage.getItem('porto_portfolio', []),
          storage.getItem('porto_catalog', []),
          storage.getItem('porto_blog', []),
          storage.getItem('porto_links', []),
          storage.getItem('porto_visual_checkpoints', []),
          storage.getItem('porto_biodata', null),
          storage.getItem('porto_concierge_settings', DEFAULT_CONCIERGE_SETTINGS),
          storage.getItem('porto_booking_settings', DEFAULT_BOOKING_SETTINGS),
        ]);

        if (!isMounted) return;

        let mergedData = DEFAULT_MAIN_WEBSITE_DATA;
        if (savedData) {
          mergedData = deepMerge(DEFAULT_MAIN_WEBSITE_DATA, savedData);
        }

        // Deduplicate navbar items
        if (mergedData?.navbar?.items && Array.isArray(mergedData.navbar.items)) {
          const seen = new Set<string>();
          mergedData.navbar.items = mergedData.navbar.items.filter((item: any) => {
            const normLabel = (item.label || '').trim().toLowerCase();
            const normUrl = (item.url || '').trim().toLowerCase();
            const key = `${normLabel}::${normUrl}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }

        // Sync accent color with localStorage / cloud
        const savedAccent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || mergedData.theme?.accentColor;
        if (savedAccent) {
          mergedData.theme.accentColor = savedAccent;
          applyAccentColor(savedAccent);
        }

        setData(mergedData);
        if (mergedData.theme?.defaultMode) {
          setIsDark(mergedData.theme.defaultMode === 'dark');
        }
        if (savedBio) {
          setBiodata((prev: any) => ({ ...prev, ...savedBio }));
        }
        if (savedConcierge) {
          setConciergeSettings(savedConcierge);
        }
        if (savedBooking) {
          setBookingSettings((prev: any) => ({
            ...prev,
            ...savedBooking,
            customServices: (savedBooking.customServices && savedBooking.customServices.length > 0) ? savedBooking.customServices : prev.customServices
          }));
        }
        if (Array.isArray(savedProjects)) setProjects(savedProjects);
        if (Array.isArray(savedProducts)) setProducts(savedProducts);
        if (Array.isArray(savedBlogs)) setBlogPosts(savedBlogs);
        if (Array.isArray(savedLinks)) setBioLinks(savedLinks);
        if (Array.isArray(savedCheckpoints)) setCheckpoints(savedCheckpoints);

      } catch (err) {
        console.error('Failed to load visual editor data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAllData();

    // Real-time synchronization listeners to ensure Canvas data is identical to client website & database
    const unsubMain = storage.listenItem('porto_main_website', (d: any) => {
      if (d && isMounted) {
        setData(prev => {
          const merged = deepMerge(prev, d);
          const savedAccent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || d.theme?.accentColor;
          if (savedAccent) merged.theme.accentColor = savedAccent;
          return merged;
        });
      }
    });

    const unsubPortfolio = storage.listenItem('porto_portfolio', (newP: any) => {
      if (Array.isArray(newP) && isMounted) setProjects(newP);
    });

    const unsubCatalog = storage.listenItem('porto_catalog', (newC: any) => {
      if (Array.isArray(newC) && isMounted) setProducts(newC);
    });

    const unsubBlog = storage.listenItem('porto_blog', (newB: any) => {
      if (Array.isArray(newB) && isMounted) setBlogPosts(newB);
    });

    const unsubLinks = storage.listenItem('porto_links', (newL: any) => {
      if (Array.isArray(newL) && isMounted) setBioLinks(newL);
    });

    const unsubBio = storage.listenItem('porto_biodata', (newBio: any) => {
      if (newBio && isMounted) setBiodata((prev: any) => ({ ...prev, ...newBio }));
    });

    const handleAccentChange = (e: any) => {
      const col = e?.detail?.color || (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null);
      if (col && isMounted) {
        setData(prev => ({ ...prev, theme: { ...prev.theme, accentColor: col } }));
      }
    };
    window.addEventListener('porto_accent_color_changed', handleAccentChange);
    window.addEventListener('storage', handleAccentChange);

    // Subscribe to Games (Realtime)
    const unsubGames = subscribeToGames((data) => {
      if (isMounted) setGames(data || []);
    });

    return () => { 
      isMounted = false; 
      if (typeof unsubMain === 'function') unsubMain();
      if (typeof unsubPortfolio === 'function') unsubPortfolio();
      if (typeof unsubCatalog === 'function') unsubCatalog();
      if (typeof unsubBlog === 'function') unsubBlog();
      if (typeof unsubLinks === 'function') unsubLinks();
      if (typeof unsubBio === 'function') unsubBio();
      if (typeof unsubGames === 'function') unsubGames();
      window.removeEventListener('porto_accent_color_changed', handleAccentChange);
      window.removeEventListener('storage', handleAccentChange);
    };
  }, []);

  // Update Field Helper
  const updateField = useCallback((path: string, value: any) => {
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
    setIsDirty(true);
    setSyncStatus('draft');
  }, []);

  // Update Biodata Field Helper
  const updateBioField = useCallback((path: string, value: any) => {
    setBiodata((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev || {}));
      const keys = path.split('.');
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
    setIsDirty(true);
    setSyncStatus('draft');
  }, []);

  // Save Checkpoint (Draft Point)
  const handleCreateCheckpoint = async (name?: string) => {
    const cpName = name || `Checkpoint ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    const newCheckpoint: Checkpoint = {
      id: `cp_${Date.now()}`,
      name: cpName,
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data)),
      biodata: JSON.parse(JSON.stringify(biodata)),
      projects: JSON.parse(JSON.stringify(projects)),
      products: JSON.parse(JSON.stringify(products)),
      blogPosts: JSON.parse(JSON.stringify(blogPosts)),
      bioLinks: JSON.parse(JSON.stringify(bioLinks)),
    };

    const updated = [newCheckpoint, ...checkpoints].slice(0, 15);
    setCheckpoints(updated);
    await storage.setItem('porto_visual_checkpoints', updated);
    notify(`Titik draft "${cpName}" berhasil dibuat!`);
  };

  // Rename Checkpoint
  const handleRenameCheckpoint = (id: string, currentName: string) => {
    const newName = prompt('Ubah nama titik draft checkpoint:', currentName);
    if (newName && newName.trim()) {
      setCheckpoints(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, name: newName.trim() } : c);
        storage.setItem('porto_visual_checkpoints', updated);
        return updated;
      });
      notify('Nama checkpoint berhasil diubah!');
    }
  };

  // Delete Checkpoint
  const handleDeleteCheckpoint = (id: string, name: string) => {
    confirm(`Hapus titik checkpoint "${name}"?`, async () => {
      setCheckpoints(prev => {
        const updated = prev.filter(c => c.id !== id);
        storage.setItem('porto_visual_checkpoints', updated);
        return updated;
      });
      notify('Titik checkpoint berhasil dihapus.');
    });
  };

  // Restore Checkpoint
  const handleRestoreCheckpoint = (cp: Checkpoint) => {
    confirm(`Kembalikan website ke titik "${cp.name}" (${new Date(cp.timestamp).toLocaleString('id-ID')})?`, () => {
      setData(JSON.parse(JSON.stringify(cp.data)));
      if (cp.biodata) setBiodata(JSON.parse(JSON.stringify(cp.biodata)));
      setProjects(JSON.parse(JSON.stringify(cp.projects)));
      setProducts(JSON.parse(JSON.stringify(cp.products)));
      setBlogPosts(JSON.parse(JSON.stringify(cp.blogPosts)));
      setBioLinks(JSON.parse(JSON.stringify(cp.bioLinks)));
      setIsDirty(true);
      setSyncStatus('draft');
      setShowHistoryModal(false);
      notify(`Berhasil memulihkan titik "${cp.name}"!`);
    });
  };

  // ── 1-CLICK OFFLINE TEMPLATE APPLIER ──
  const handleApplyWebsiteTemplate = (templateId: string) => {
    try {
      const tmpl = OFFLINE_WEBSITE_TEMPLATES.find(t => t.id === templateId) || OFFLINE_WEBSITE_TEMPLATES[0];
      if (!tmpl) return;

      const built = buildOfflineWebsite(tmpl.id);
      setData(built);
      if (built.theme?.accentColor) {
        applyAccentColor(built.theme.accentColor);
      }
      if (built.theme?.defaultMode) {
        setIsDark(built.theme.defaultMode === 'dark');
      }
      setBiodata((prev: any) => ({
        ...prev,
        fullName: built.hero?.headline || prev?.fullName || 'Nama Lengkap',
        role: built.hero?.subheadline || prev?.role || 'Profesi Kreatif',
        bio: built.profile?.bio || prev?.bio || '',
      }));
      setIsDirty(true);
      setSyncStatus('draft');
      setShowTemplateModal(false);
      handleCreateCheckpoint(`Terapkan Preset: ${tmpl.label}`);
      notify(`Preset "${tmpl.label}" berhasil diterapkan!`);
    } catch (err: any) {
      console.error('[VisualWebEditor] Template apply error:', err);
      notify(`Gagal menerapkan template: ${err.message || 'Terjadi kesalahan'}`, 'error');
    }
  };

  // ── AI WEBSITE GENERATOR ──
  const handleGenerateAiWebsite = async () => {
    if (!aiPrompt.trim()) {
      notify('Silakan masukkan deskripsi konsep website Anda.', 'error');
      return;
    }
    setIsAiGenerating(true);
    notify('AI sedang merancang konsep, konten, dan gaya visual website...');
    try {
      const result = await generateAiWebsite(aiPrompt);
      if (result) {
        setData((prev) => ({
          ...prev,
          hero: {
            ...prev.hero,
            headline: result.hero?.headline || prev.hero?.headline || 'Nama Portofolio',
            subheadline: result.hero?.subheadline || prev.hero?.subheadline || 'Kreator & Desainer',
            badge: result.hero?.badge || prev.hero?.badge || 'Tersedia untuk Proyek Baru',
            ctaText: result.hero?.ctaPrimaryText || prev.hero?.ctaText || 'Lihat Karya',
          },
          profile: {
            ...prev.profile,
            bio: result.profile?.bio || prev.profile?.bio || '',
            skills: result.profile?.skills?.length ? result.profile.skills : prev.profile?.skills || [],
          },
          theme: {
            ...prev.theme,
            accentColor: result.theme?.accentColor || prev.theme?.accentColor || '#6366f1',
          }
        }));

        if (result.theme?.accentColor) {
          applyAccentColor(result.theme.accentColor);
        }

        setBiodata((prev: any) => ({
          ...prev,
          fullName: result.hero?.headline || prev?.fullName || 'Nama Lengkap',
          role: result.hero?.subheadline || prev?.role || 'Profesi Kreatif',
          bio: result.profile?.bio || prev?.bio || '',
        }));

        setIsDirty(true);
        setSyncStatus('draft');
        setShowTemplateModal(false);
        handleCreateCheckpoint('Hasil AI Website Generator');
        notify('Website berhasil di-generate otomatis dengan AI!');
      } else {
        notify('AI tidak mengembalikan data konsep. Silakan coba prompt lain.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      notify(`Gagal generate AI: ${err.message || 'Silakan coba lagi'}`, 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // ── RAW JSON BACKUP EXPORT & IMPORT ──
  const handleExportJsonBackup = () => {
    const backupBundle = {
      app: 'sumr.day OS Visual Suite',
      version: '2.5',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      databases: {
        porto_main_website: data,
        porto_biodata: biodata,
        porto_portfolio: projects,
        porto_catalog: products,
        porto_blog: blogPosts,
        porto_links: bioLinks,
        porto_booking_settings: bookingSettings,
        porto_concierge_settings: conciergeSettings,
        porto_visual_checkpoints: checkpoints,
      }
    };
    const blob = new Blob([JSON.stringify(backupBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenze_website_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('File cadangan JSON website berhasil diunduh!');
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const db = parsed.databases || parsed;
        if (db.porto_main_website || db.mainWebsite) {
          const rawMain = db.porto_main_website || db.mainWebsite;
          const newMain = deepMerge(DEFAULT_MAIN_WEBSITE_DATA, rawMain);
          setData(newMain);
          if (newMain.theme?.accentColor) {
            applyAccentColor(newMain.theme.accentColor);
          }
        }
        if (db.porto_biodata || db.biodata) setBiodata(db.porto_biodata || db.biodata);
        if (Array.isArray(db.porto_portfolio || db.portfolio)) setProjects(db.porto_portfolio || db.portfolio);
        if (Array.isArray(db.porto_catalog || db.catalog)) setProducts(db.porto_catalog || db.catalog);
        if (Array.isArray(db.porto_blog || db.blog)) setBlogPosts(db.porto_blog || db.blog);
        if (Array.isArray(db.porto_links || db.links)) setBioLinks(db.porto_links || db.links);
        if (db.porto_booking_settings || db.bookingSettings) setBookingSettings(db.porto_booking_settings || db.bookingSettings);
        if (db.porto_concierge_settings || db.conciergeSettings) setConciergeSettings(db.porto_concierge_settings || db.conciergeSettings);
        if (Array.isArray(db.porto_visual_checkpoints || db.checkpoints)) setCheckpoints(db.porto_visual_checkpoints || db.checkpoints);

        setIsDirty(true);
        setSyncStatus('draft');
        handleCreateCheckpoint('Pulihkan dari File Backup JSON');
        notify('Seluruh database website berhasil dipulihkan dari file JSON!');
      } catch (err: any) {
        console.error(err);
        notify('Format file cadangan JSON rusak atau tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // ── MARKDOWN FORMATTING INSERTION HELPER ──
  const insertBlogMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('blog-markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = editingBlogModal?.content || editingBlogModal?.excerpt || '';
    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected || 'teks'}${suffix}`;
    const nextVal = current.substring(0, start) + replacement + current.substring(end);
    setEditingBlogModal({ ...editingBlogModal, content: nextVal });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  // Unified Image URL Applier
  const applyImageUrl = (type: string, url: string, id?: string, index?: number) => {
    if (type === 'hero') {
      updateField('hero.heroImage', url);
    } else if (type === 'home_about_image') {
      updateField('profile.image', url);
    } else if (type === 'about_avatar') {
      updateBioField('avatarUrl', url);
    } else if (type === 'about_cover') {
      updateBioField('coverUrl', url);
    } else if (type === 'avatar' && index !== undefined) {
      const newT = [...(data.testimonials || [])];
      newT[index].avatar = url;
      updateField('testimonials', newT);
    } else if (type === 'company_logo') {
      updateField('aboutSettings.company.logoUrl', url);
    } else if (type === 'company_cover') {
      updateField('aboutSettings.company.coverUrl', url);
    } else if (type === 'company_team_photo' && index !== undefined) {
      const newT = [...(data.aboutSettings?.company?.teamMembers || [])];
      if (newT[index]) {
        newT[index].photo = url;
        updateField('aboutSettings.company.teamMembers', newT);
      }
    } else if (type === 'project' && id) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, coverImage: url } : p));
      setIsDirty(true);
    } else if (type === 'product' && id) {
      setProducts(prev => prev.map(prod => prod.id === id ? { ...prod, image: url } : prod));
      setIsDirty(true);
    } else if (type === 'blog' && id) {
      setBlogPosts(prev => prev.map(b => b.id === id ? { ...b, coverImage: url } : b));
      setIsDirty(true);
    } else if (type === 'modal_project') {
      setEditingProjectModal((prev: any) => ({ ...prev, coverImage: url }));
    } else if (type === 'modal_product') {
      setEditingProductModal((prev: any) => ({ ...prev, image: url }));
    } else if (type === 'game_thumbnail') {
      setEditingGameModal((prev: any) => prev ? { ...prev, thumbnailUrl: url } : null);
    } else if (type === 'seo_favicon') {
      updateField('seo.faviconUrl', url);
    } else if (type === 'seo_ogImage') {
      updateField('seo.ogImage', url);
    } else if (type === 'custom_page_before' && id) {
      const [pId, sIdx] = id.split('::');
      const idx = parseInt(sIdx, 10);
      const cp = (data.customPages || []).find((p: any) => p.id === pId);
      if (cp && cp.sections) {
        const updatedSecs = cp.sections.map((s: any, k: number) => k === idx ? { ...s, beforeImage: url } : s);
        const updatedPages = (data.customPages || []).map((p: any) => p.id === pId ? { ...p, sections: updatedSecs } : p);
        updateField('customPages', updatedPages);
      }
    } else if (type === 'custom_page_after' && id) {
      const [pId, sIdx] = id.split('::');
      const idx = parseInt(sIdx, 10);
      const cp = (data.customPages || []).find((p: any) => p.id === pId);
      if (cp && cp.sections) {
        const updatedSecs = cp.sections.map((s: any, k: number) => k === idx ? { ...s, afterImage: url } : s);
        const updatedPages = (data.customPages || []).map((p: any) => p.id === pId ? { ...p, sections: updatedSecs } : p);
        updateField('customPages', updatedPages);
      }
    } else if (type === 'custom_page_gallery' && id) {
      const [pId, sIdx] = id.split('::');
      const idx = parseInt(sIdx, 10);
      const cp = (data.customPages || []).find((p: any) => p.id === pId);
      if (cp && cp.sections) {
        const updatedSecs = cp.sections.map((s: any, k: number) => k === idx ? { ...s, images: [...(s.images || []), { url, caption: 'Foto Galeri' }] } : s);
        const updatedPages = (data.customPages || []).map((p: any) => p.id === pId ? { ...p, sections: updatedSecs } : p);
        updateField('customPages', updatedPages);
      }
    } else if (type === 'custom_page_card' && id && index !== undefined) {
      const [pId, sIdx] = id.split('::');
      const sIndex = parseInt(sIdx, 10);
      const cp = (data.customPages || []).find((p: any) => p.id === pId);
      if (cp && cp.sections) {
        const updatedSecs = cp.sections.map((s: any, k: number) => {
          if (k !== sIndex) return s;
          const newCards = (s.cards || []).map((c: any, cIdx: number) => cIdx === index ? { ...c, image: url } : c);
          return { ...s, cards: newCards };
        });
        const updatedPages = (data.customPages || []).map((p: any) => p.id === pId ? { ...p, sections: updatedSecs } : p);
        updateField('customPages', updatedPages);
      }
    } else if (type === 'custom_page_card_gallery' && id && index !== undefined) {
      const [pId, sIdx] = id.split('::');
      const sIndex = parseInt(sIdx, 10);
      const cp = (data.customPages || []).find((p: any) => p.id === pId);
      if (cp && cp.sections) {
        const updatedSecs = cp.sections.map((s: any, k: number) => {
          if (k !== sIndex) return s;
          const newCards = (s.cards || []).map((c: any, cIdx: number) => {
            if (cIdx !== index) return c;
            const curImgs = Array.isArray(c.images) ? c.images : (c.image ? [c.image] : []);
            return { ...c, images: [...curImgs, url] };
          });
          return { ...s, cards: newCards };
        });
        const updatedPages = (data.customPages || []).map((p: any) => p.id === pId ? { ...p, sections: updatedSecs } : p);
        updateField('customPages', updatedPages);
      }
    } else if (type === 'custom_page_testimonial' && id && index !== undefined) {
      const [pId, sIdx] = id.split('::');
      const sIndex = parseInt(sIdx, 10);
      const cp = (data.customPages || []).find((p: any) => p.id === pId);
      if (cp && cp.sections) {
        const updatedSecs = cp.sections.map((s: any, k: number) => {
          if (k !== sIndex) return s;
          const newItems = (s.items || []).map((it: any, itIdx: number) => itIdx === index ? { ...it, avatar: url } : it);
          return { ...s, items: newItems };
        });
        const updatedPages = (data.customPages || []).map((p: any) => p.id === pId ? { ...p, sections: updatedSecs } : p);
        updateField('customPages', updatedPages);
      }
    }
  };

  const openMediaPicker = (target: { type: string; id?: string; index?: number }) => {
    uploadTargetRef.current = target;
    setIsGalleryOpen(true);
  };

  const handleRemoveImage = (type: string, id?: string, index?: number) => {
    confirm('Hapus / kosongkan gambar ini?', () => {
      applyImageUrl(type, '', id, index);
      notify('🗑️ Gambar berhasil dihapus / dikosongkan.');
    });
  };

  // Save Draft (Local Working State)
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        storage.setItem('porto_main_website', data),
        storage.setItem('porto_biodata', biodata),
        storage.setItem('porto_portfolio', projects),
        storage.setItem('porto_catalog', products),
        storage.setItem('porto_blog', blogPosts),
        storage.setItem('porto_links', bioLinks),
        storage.setItem('porto_booking_settings', bookingSettings),
        storage.setItem('porto_concierge_settings', conciergeSettings)
      ]);
      await handleCreateCheckpoint('Draft Terakhir Disimpan');
      setIsDirty(false);
      setSyncStatus('synced');
      notify('💾 Draft website berhasil disimpan!');
    } catch (err) {
      console.error(err);
      notify('❌ Gagal menyimpan draft.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish to Live Website + Backup to Google Drive
  const handlePublishLive = async () => {
    setIsPublishing(true);
    setSyncStatus('syncing');
    notify('🚀 Memulai proses publikasi & sinkronisasi Google Drive...');

    try {
      // 1. Commit all data to local database
      await Promise.all([
        storage.setItem('porto_main_website', data),
        storage.setItem('porto_biodata', biodata),
        storage.setItem('porto_portfolio', projects),
        storage.setItem('porto_catalog', products),
        storage.setItem('porto_blog', blogPosts),
        storage.setItem('porto_links', bioLinks),
        storage.setItem('porto_booking_settings', bookingSettings),
        storage.setItem('porto_concierge_settings', conciergeSettings)
      ]);

      // 2. Backup to Google Drive via Apps Script
      try {
        await googleSync.backupToDrive(null);
      } catch (driveErr) {
        console.warn('Google Drive backup notice:', driveErr);
      }

      // 3. Create permanent publish checkpoint
      await handleCreateCheckpoint(`Publikasi Live ${new Date().toLocaleDateString('id-ID')}`);

      setIsDirty(false);
      setSyncStatus('synced');
      notify('🎉 SELURUH WEBSITE BERHASIL DIPUBLIKASIKAN & DISINKRONKAN KE DRIVE!');
    } catch (err) {
      console.error('Publish error:', err);
      notify('❌ Gagal mempublikasikan website.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Image Upload to Cloudinary Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetRef.current) return;

    notify('⏳ Mengunggah foto ke Cloudinary...');
    try {
      const res: any = await uploadToCloudinary(file, 'image');
      if (res?.url) {
        const { type, id, index } = uploadTargetRef.current;
        applyImageUrl(type, res.url, id, index);
        notify('✅ Foto berhasil diunggah via Cloudinary!');
      }
    } catch (err) {
      console.error(err);
      notify('❌ Gagal mengunggah foto.', 'error');
    }
  };

  const triggerUpload = (target: { type: string; id?: string; index?: number }) => {
    uploadTargetRef.current = target;
    fileInputRef.current?.click();
  };

  const accentColor = data.theme?.accentColor || '#6366f1';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(20, 28, 44, 0.7)' : 'rgba(255, 255, 255, 0.85)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const BUILTIN_PAGES = [
    { key: 'home', label: 'Beranda', icon: <Globe size={16} /> },
    { key: 'portfolio', label: 'Portofolio', icon: <Layers size={16} /> },
    { key: 'about', label: 'Tentang', icon: <User size={16} /> },
    { key: 'catalog', label: 'Katalog', icon: <ShoppingBag size={16} /> },
    { key: 'pricing', label: 'Harga', icon: <Receipt size={16} /> },
    { key: 'games', label: 'Game', icon: <LayoutGrid size={16} /> },
    { key: 'blog', label: 'Blog', icon: <FileText size={16} /> },
    { key: 'updates', label: 'Update', icon: <Sparkles size={16} /> },
    { key: 'links', label: 'Links', icon: <Link2 size={16} /> },
  ];

  const customPagesList = (data.customPages || []).map((cp: any) => ({
    key: cp.id,
    label: cp.title || 'Halaman Kustom',
    slug: cp.slug,
    icon: <FileCode size={16} />,
    isCustom: true,
    ...cp
  }));

  const PAGES = [...BUILTIN_PAGES, ...customPagesList];

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080f', color: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <RefreshCw size={24} className="cms-spin" color="#6366f1" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Memuat Visual Studio Website...</span>
        </div>
      </div>
    );
  }

  const isRealMobileScreen = screenWidth < 768;
  const effectiveDevice = isRealMobileScreen ? 'mobile' : device;
  const isMobile = effectiveDevice === 'mobile';
  const isTablet = effectiveDevice === 'tablet';
  const isMobileOrTablet = isMobile || isTablet || isRealMobileScreen;
  const targetWidth = isRealMobileScreen ? '100%' : (device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px');

  const editorThemeTokens: Record<string, string> = {
    '--cms-bg': isDark ? '#08080f' : '#ffffff',
    '--cms-panel-bg': isDark ? '#101726' : '#ffffff',
    '--cms-panel-bg-solid': isDark ? '#101726' : '#ffffff',
    '--cms-card-bg': isDark ? '#181926' : '#ffffff',
    '--cms-input-bg': isDark ? '#0f1019' : '#f8fafc',
    '--cms-text': isDark ? '#f8fafc' : '#0f172a',
    '--cms-text-primary': isDark ? '#f8fafc' : '#0f172a',
    '--cms-text-secondary': isDark ? '#94a3b8' : '#475569',
    '--cms-text-muted': isDark ? '#64748b' : '#94a3b8',
    '--cms-border': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    '--glass-border': isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
    '--glass-bg': isDark ? 'rgba(24, 25, 38, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    '--glass-text': isDark ? '#ffffff' : '#0f172a',
  };

  return (
    <div
      className="visual-web-editor-root"
      data-cms-theme={isDark ? 'dark' : 'light'}
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        ...editorThemeTokens,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: isDark ? '#05060b' : '#f1f5f9',
        color: textColor,
        colorScheme: isDark ? 'dark' : 'light',
        isolation: 'isolate',
        overflow: 'hidden',
        position: 'relative',
      } as React.CSSProperties}
      onClick={() => {
        if (openDropdownIdx !== null) setOpenDropdownIdx(null);
        if (showDesktopPageList) setShowDesktopPageList(false);
        if (showMobilePageSelector) setShowMobilePageSelector(false);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {/* ── TOPBAR CONTROLS ── */}
      <div
        style={{
          height: isRealMobileScreen ? 48 : 52,
          borderBottom: `1px solid ${cardBorder}`,
          background: isDark ? 'rgba(10, 15, 29, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isRealMobileScreen ? '0 10px' : '0 16px',
          zIndex: 100,
          flexShrink: 0,
          gap: isRealMobileScreen ? 6 : 10,
        }}
      >
        {/* Left: Page Switcher */}
        {isRealMobileScreen ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMobilePageSelector(!showMobilePageSelector);
                setShowMobileMoreMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 12px',
                borderRadius: 100,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                color: textColor,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {PAGES.find(p => p.key === activePage)?.icon}
              <span>{PAGES.find(p => p.key === activePage)?.label}</span>
              <ChevronDown size={13} style={{ transform: showMobilePageSelector ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Mobile Page Selector Dropdown */}
            {showMobilePageSelector && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 42,
                  left: 0,
                  width: 200,
                  borderRadius: 16,
                  background: isDark ? '#0f172a' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                  boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  zIndex: 30000,
                }}
              >
                {PAGES.map((p) => {
                  const isSel = activePage === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => {
                        setActivePage(p.key as ActivePageKey);
                        setShowMobilePageSelector(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: 'none',
                        background: isSel ? `${accentColor}20` : 'transparent',
                        color: isSel ? accentColor : textColor,
                        cursor: 'pointer',
                        fontSize: 12.5,
                        fontWeight: isSel ? 800 : 600,
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p.icon}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                    </button>
                  );
                })}

                <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

                <button
                  onClick={() => {
                    setShowMobilePageSelector(false);
                    setShowNewPageModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px dashed ${accentColor}40`,
                    background: `${accentColor}12`,
                    color: accentColor,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 800,
                    textAlign: 'left',
                  }}
                >
                  <Plus size={14} />
                  <span>Halaman Baru</span>
                </button>
              </div>
            )}

            {/* Status Dot */}
            <span
              title={isDirty ? 'Mode Draft (Belum Dipublikasikan)' : 'Tersinkron'}
              style={{
                width: 8,
                height: 8,
                minWidth: 8,
                minHeight: 8,
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                background: isDirty ? '#f59e0b' : '#10b981',
                boxShadow: isDirty ? '0 0 8px #f59e0b' : '0 0 8px #10b981',
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
          </div>
        ) : (
          /* Desktop Page Switcher with Dropdown List */
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDesktopPageList(!showDesktopPageList);
                }}
                style={{
                  display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 36,
                padding: '0 14px',
                borderRadius: 100,
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                color: textColor,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 800,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', color: accentColor }}>
                {PAGES.find(p => p.key === activePage)?.icon}
              </span>
              <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {PAGES.find(p => p.key === activePage)?.label}
              </span>
              <ChevronDown size={14} style={{ color: subTextColor, transform: showDesktopPageList ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Desktop Page Selector Dropdown Popover */}
            {showDesktopPageList && (
              <div
                onClick={(e) => e.stopPropagation()}
                data-cms-theme={isDark ? 'dark' : 'light'}
                data-theme={isDark ? 'dark' : 'light'}
                style={{
                  ...editorThemeTokens,
                  position: 'absolute',
                  top: 44,
                  left: 0,
                  width: 300,
                  maxHeight: 460,
                  overflowY: 'auto',
                  borderRadius: 20,
                  background: isDark ? '#0f172a' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  zIndex: 35000,
                } as React.CSSProperties}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: `1px solid ${cardBorder}` }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Daftar Halaman Website
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: accentColor, background: `${accentColor}15`, padding: '2px 7px', borderRadius: 100 }}>
                    {PAGES.length} Halaman
                  </span>
                </div>

                {/* Group 1: Halaman Utama (Default Pages with ON/OFF Switches) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 6, paddingRight: 4 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: subTextColor, textTransform: 'uppercase' }}>
                      Halaman Utama
                    </span>
                    <span style={{ fontSize: 9.5, color: subTextColor }}>Visibilitas Web</span>
                  </div>

                  {BUILTIN_PAGES.map((p) => {
                    const isSel = activePage === p.key;
                    const isPageActive = data.pagesVisibility?.[p.key] !== false; // Default true

                    return (
                      <div
                        key={p.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 8px',
                          borderRadius: 10,
                          background: isSel ? `${accentColor}18` : 'transparent',
                          transition: 'all 0.15s ease',
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActivePage(p.key as ActivePageKey);
                            setShowDesktopPageList(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            border: 'none',
                            background: 'transparent',
                            color: isSel ? accentColor : (isPageActive ? textColor : subTextColor),
                            cursor: 'pointer',
                            fontSize: 12.5,
                            fontWeight: isSel ? 850 : 600,
                            textAlign: 'left',
                            flex: 1,
                            minWidth: 0,
                            padding: 0
                          }}
                        >
                          <span style={{ opacity: isPageActive ? 1 : 0.45 }}>{p.icon}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: isPageActive ? 1 : 0.6 }}>{p.label}</span>
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {/* Toggle ON/OFF Switch */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cur = data.pagesVisibility || { home: true, portfolio: true, about: true, catalog: true, pricing: true, games: true, blog: true, updates: true, links: true };
                              const next = { ...cur, [p.key]: !isPageActive };
                              updateField('pagesVisibility', next);
                              notify(`Halaman "${p.label}" ${!isPageActive ? 'diaktifkan (ON)' : 'dinonaktifkan (OFF)'}`);
                            }}
                            title={isPageActive ? 'Klik untuk mematikan / menyembunyikan halaman ini dari navigasi publik' : 'Klik untuk mengaktifkan kembali halaman ini'}
                            style={{
                              padding: '2px 7px',
                              borderRadius: 100,
                              border: isPageActive ? `1px solid ${accentColor}50` : '1px solid rgba(239, 68, 68, 0.35)',
                              background: isPageActive ? `${accentColor}18` : 'rgba(239, 68, 68, 0.12)',
                              color: isPageActive ? accentColor : '#ef4444',
                              fontSize: 10,
                              fontWeight: 850,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: isPageActive ? '#10b981' : '#ef4444' }} />
                            <span>{isPageActive ? 'ON' : 'OFF'}</span>
                          </button>
                          {isSel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Group 2: Halaman Kustom Mandiri */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 4, borderTop: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 6, paddingRight: 4 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: subTextColor, textTransform: 'uppercase' }}>
                      Halaman Kustom ({customPagesList.length})
                    </span>
                  </div>

                  {customPagesList.length === 0 ? (
                    <div style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11.5, color: subTextColor, fontStyle: 'italic' }}>
                      Belum ada halaman kustom.
                    </div>
                  ) : (
                    customPagesList.map((cp: any) => {
                      const isSel = activePage === cp.key;
                      const isNavActive = cp.showInNavbar !== false;

                      return (
                        <div
                          key={cp.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '5px 8px',
                            borderRadius: 10,
                            background: isSel ? `${accentColor}18` : 'transparent',
                            transition: 'all 0.15s ease',
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActivePage(cp.key as ActivePageKey);
                              setShowDesktopPageList(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              border: 'none',
                              background: 'transparent',
                              color: isSel ? accentColor : textColor,
                              cursor: 'pointer',
                              fontSize: 12.5,
                              fontWeight: isSel ? 850 : 600,
                              textAlign: 'left',
                              flex: 1,
                              minWidth: 0,
                              padding: 0
                            }}
                          >
                            <FileCode size={15} color={isSel ? accentColor : subTextColor} />
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cp.label}</span>
                              <span style={{ fontSize: 10, color: subTextColor }}>/p/{cp.slug}</span>
                            </div>
                          </button>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = (data.customPages || []).map((p: any) =>
                                  p.id === cp.key ? { ...p, showInNavbar: !isNavActive } : p
                                );
                                updateField('customPages', updated);
                                notify(`Menu navigasi "${cp.label}" ${!isNavActive ? 'ditampilkan (ON)' : 'disembunyikan (OFF)'}`);
                              }}
                              title={isNavActive ? 'Klik untuk menyembunyikan dari menu navigasi' : 'Klik untuk menampilkan di menu navigasi'}
                              style={{
                                padding: '2px 7px',
                                borderRadius: 100,
                                border: isNavActive ? `1px solid ${accentColor}50` : '1px solid rgba(239, 68, 68, 0.35)',
                                background: isNavActive ? `${accentColor}18` : 'rgba(239, 68, 68, 0.12)',
                                color: isNavActive ? accentColor : '#ef4444',
                                fontSize: 10,
                                fontWeight: 850,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: isNavActive ? '#10b981' : '#ef4444' }} />
                              <span>{isNavActive ? 'ON' : 'OFF'}</span>
                            </button>
                            {isSel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Add Action */}
                <button
                  onClick={() => {
                    setShowDesktopPageList(false);
                    setShowNewPageModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '9px 12px',
                    borderRadius: 12,
                    border: `1px dashed ${accentColor}60`,
                    background: `${accentColor}12`,
                    color: accentColor,
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 800,
                    marginTop: 4
                  }}
                >
                  <Plus size={15} />
                  <span>Buat Halaman Baru</span>
                </button>
              </div>
            )}
          </div>

            {/* Draft/Sync Status Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 100,
              background: isDirty ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${isDirty ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              fontSize: 11,
              fontWeight: 750,
              color: isDirty ? '#f59e0b' : '#10b981',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDirty ? '#f59e0b' : '#10b981' }} />
              <span>{isDirty ? 'Mode Draft' : 'Tersinkron'}</span>
            </div>
          </div>
        )}

        {/* Center: Device Simulation Switcher (Desktop Only) */}
        {!isRealMobileScreen && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.06)',
            padding: '3px',
            borderRadius: 100,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            gap: 2,
          }}>
            <button
              onClick={() => setDevice('desktop')}
              title="Desktop"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 30,
                borderRadius: 100,
                border: 'none',
                background: device === 'desktop' ? accentColor : 'transparent',
                color: device === 'desktop' ? '#ffffff' : subTextColor,
                cursor: 'pointer',
              }}
            >
              <Monitor size={15} />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              title="Tablet (768px)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 30,
                borderRadius: 100,
                border: 'none',
                background: device === 'tablet' ? accentColor : 'transparent',
                color: device === 'tablet' ? '#ffffff' : subTextColor,
                cursor: 'pointer',
              }}
            >
              <Tablet size={15} />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              title="Ponsel (390px)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 30,
                borderRadius: 100,
                border: 'none',
                background: device === 'mobile' ? accentColor : 'transparent',
                color: device === 'mobile' ? '#ffffff' : subTextColor,
                cursor: 'pointer',
              }}
            >
              <Smartphone size={15} />
            </button>
          </div>
        )}

        {/* Right: Actions */}
        {isRealMobileScreen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Save Draft */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || isPublishing}
              title="Simpan Draft"
              style={{
                width: 34,
                height: 34,
                minWidth: 34,
                minHeight: 34,
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                color: textColor,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: 0,
              }}
            >
              <Save size={14} />
            </button>

            {/* Publish Live */}
            <button
              onClick={handlePublishLive}
              disabled={isPublishing || isSaving}
              title="Publikasikan Live"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                height: 34,
                padding: '0 14px',
                borderRadius: 100,
                border: 'none',
                background: accentColor,
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                fontWeight: 800,
                cursor: isPublishing ? 'wait' : 'pointer',
                boxShadow: `0 4px 12px ${accentColor}40`,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {isPublishing ? <RefreshCw size={12} className="cms-spin" /> : <Send size={12} />}
              <span>Publish</span>
            </button>

            {/* Mobile More Options (...) */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMoreMenu(!showMobileMoreMenu);
                  setShowMobilePageSelector(false);
                }}
                title="Menu Pengaturan & Checkpoints"
                style={{
                  width: 34,
                  height: 34,
                  minWidth: 34,
                  minHeight: 34,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  color: textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <MoreVertical size={16} />
              </button>

              {/* Mobile More Actions Popover */}
              {showMobileMoreMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 42,
                    right: 0,
                    width: 220,
                    borderRadius: 18,
                    background: isDark ? '#0f172a' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                    boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    zIndex: 30000,
                  }}
                >
                  {/* Template & AI Generator */}
                  <button
                    onClick={() => {
                      setShowTemplateModal(true);
                      setShowMobileMoreMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none',
                      background: `${accentColor}15`,
                      color: accentColor,
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 800,
                      textAlign: 'left',
                    }}
                  >
                    <Wand2 size={15} />
                    <span>Template & AI Generator</span>
                  </button>

                  {/* Titik Draft (Checkpoints) */}
                  <button
                    onClick={() => {
                      setShowHistoryModal(true);
                      setShowMobileMoreMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'transparent',
                      color: textColor,
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 700,
                      textAlign: 'left',
                    }}
                  >
                    <History size={15} color={accentColor} />
                    <span>Titik Draft (Checkpoints)</span>
                  </button>

                  {/* Settings Drawer (SEO, Tema, Kontak) */}
                  <button
                    onClick={() => {
                      setShowSettingsDrawer(true);
                      setShowMobileMoreMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'transparent',
                      color: textColor,
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 700,
                      textAlign: 'left',
                    }}
                  >
                    <Settings size={15} color={accentColor} />
                    <span>Pengaturan Website (SEO, Tema, Kontak)</span>
                  </button>

                  {/* Dark/Light mode */}
                  <button
                    onClick={() => {
                      const newMode = isDark ? 'light' : 'dark';
                      setIsDark(!isDark);
                      updateField('theme.defaultMode', newMode);
                      setShowMobileMoreMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'transparent',
                      color: textColor,
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 700,
                      textAlign: 'left',
                    }}
                  >
                    {isDark ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
                    <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Right Action Buttons (Icon-Only Navbar) */
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* 1. Template & AI Preset Generator button */}
            <button
              onClick={() => setShowTemplateModal(true)}
              title="Template Presets & AI Website Generator"
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                borderRadius: '50%',
                border: `1px solid ${accentColor}40`,
                background: `${accentColor}18`,
                color: accentColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: `0 2px 8px ${accentColor}20`,
                padding: 0,
              }}
            >
              <Wand2 size={16} />
            </button>

            {/* 2. History Checkpoints button */}
            <button
              onClick={() => setShowHistoryModal(true)}
              title="Riwayat Titik Simpan Draft (Checkpoints)"
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                borderRadius: '50%',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: 0,
              }}
            >
              <History size={16} />
            </button>

            {/* 3. Settings Drawer Trigger (SEO, Biodata, Kontak, Footer) */}
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              title="Pengaturan Website, Biodata & SEO"
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                borderRadius: '50%',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: textColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: 0,
              }}
            >
              <Settings size={16} />
            </button>

            {/* 4. Theme Mode Toggle */}
            <button
              onClick={() => {
                const newMode = isDark ? 'light' : 'dark';
                setIsDark(!isDark);
                updateField('theme.defaultMode', newMode);
              }}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                borderRadius: '50%',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#f59e0b' : '#6366f1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: 0,
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* 5. Save Draft Button */}
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || isPublishing}
              title="Simpan Draft Lokal"
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                borderRadius: '50%',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                color: textColor,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: 0,
              }}
            >
              <Save size={16} />
            </button>

            {/* 6. Publish Live Button */}
            <button
              onClick={handlePublishLive}
              disabled={isPublishing || isSaving}
              title="Publikasikan Website Sekarang"
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                minHeight: 36,
                borderRadius: '50%',
                border: 'none',
                background: accentColor,
                color: '#ffffff',
                cursor: isPublishing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px ${accentColor}50`,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                padding: 0,
              }}
            >
              {isPublishing ? <RefreshCw size={16} className="cms-spin" /> : <Send size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN CANVAS VIEWPORT (FULLSCREEN ON MOBILE, CENTERED MOCKUP ON DESKTOP) ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: isRealMobileScreen || device === 'desktop' ? 0 : '16px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <div
          data-cms-theme={isDark ? 'dark' : 'light'}
          data-theme={isDark ? 'dark' : 'light'}
          style={{
            ...editorThemeTokens,
            width: isRealMobileScreen ? '100%' : targetWidth,
            maxWidth: isRealMobileScreen || device === 'desktop' ? '100%' : targetWidth,
            height: isRealMobileScreen || device === 'desktop' ? '100%' : (isMobile ? 'min(720px, calc(100% - 16px))' : 'min(780px, calc(100% - 16px))'),
            maxHeight: isRealMobileScreen || device === 'desktop' ? '100%' : 'calc(100% - 16px)',
            margin: isRealMobileScreen || device === 'desktop' ? 0 : 'auto',
            borderRadius: isRealMobileScreen || device === 'desktop' ? 0 : (isMobile ? 38 : 24),
            boxShadow: isRealMobileScreen || device === 'desktop'
              ? 'none'
              : (isDark
                ? '0 20px 50px -10px rgba(0,0,0,0.85), 0 0 0 8px #1e293b, 0 0 0 10px rgba(255,255,255,0.1)'
                : '0 20px 50px -10px rgba(0,0,0,0.25), 0 0 0 8px #e2e8f0, 0 0 0 10px rgba(0,0,0,0.06)'),
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: isDark ? '#08080f' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            colorScheme: isDark ? 'dark' : 'light',
            isolation: 'isolate',
            position: 'relative',
            transform: 'translateZ(0)',
            transition: 'width 0.3s ease, height 0.3s ease',
            flexShrink: 0,
          } as React.CSSProperties}
        >
          {/* Mobile Notch Simulation (Only when previewing on desktop window) */}
          {isMobile && !isRealMobileScreen && (
            <div
              style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                height: 28,
                background: isDark ? '#08080f' : '#ffffff',
                zIndex: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 90, height: 18, borderRadius: 100, background: '#000000', margin: '4px auto 0' }} />
            </div>
          )}

          {/* ── ON-CANVAS EDITABLE NAVBAR (ADAPTS ACCURATELY TO REAL DESKTOP / TABLET / MOBILE VIEW) ── */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 120,
              width: '100%',
              padding: isMobileOrTablet ? '12px 18px' : '12px 28px',
              boxSizing: 'border-box',
              background: isDark ? 'rgba(8, 8, 15, 0.92)' : 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            {/* Left: Editable Logo Text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateField('navbar.logoText', e.currentTarget.textContent || 'sumr.day')}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: isMobileOrTablet ? 19 : 22,
                  fontWeight: 900,
                  color: textColor,
                  outline: 'none',
                  cursor: 'text',
                  letterSpacing: '-0.02em',
                }}
                title="Klik untuk mengedit Nama Brand / Logo"
              >
                {data?.navbar?.logoText || data?.hero?.headline || 'sumr.day'}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, display: 'inline-block' }} />
            </div>

            {/* Desktop Horizontal Menu */}
            {!isMobileOrTablet ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  padding: '4px 8px',
                  borderRadius: 18,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                  maxWidth: '100%',
                  overflowX: 'auto',
                }}
              >
                {(data?.navbar?.items || []).map((item: any, idx: number) => {
                  const subItems = item.subItems || [];
                  const hasSub = subItems.length > 0;
                  const isDropdownOpen = openDropdownIdx === idx;

                  return (
                    <div
                      key={item.id || idx}
                      style={{ position: 'relative', flexShrink: 0 }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 7px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontFamily: "'Outfit', sans-serif",
                          color: textColor,
                          background: activePage === item.url?.replace('/', '').replace('#', '') ? `${accentColor}20` : 'transparent',
                          transition: 'all 0.15s ease',
                          minWidth: 42,
                        }}
                      >
                        {/* Baris Atas: Label & Dropdown Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const newItems = [...(data?.navbar?.items || [])];
                              newItems[idx].label = e.currentTarget.textContent || '';
                              updateField('navbar.items', newItems);
                            }}
                            style={{
                              outline: 'none',
                              cursor: 'text',
                              whiteSpace: 'nowrap',
                              fontSize: 12,
                              fontWeight: 750,
                              letterSpacing: '-0.01em',
                              lineHeight: 1.2,
                            }}
                            title="Klik untuk mengedit teks menu"
                          >
                            {item.label}
                          </span>

                          {/* Dropdown Toggle */}
                          {hasSub && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownIdx(isDropdownOpen ? null : idx);
                              }}
                              title="Buka / Tutup Sub-menu Dropdown"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: accentColor,
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <ChevronDown size={11} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                          )}
                        </div>

                        {/* Baris Bawah: Icon-icon Aksi Update / Edit di Bawah Label */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            marginTop: 2,
                            opacity: 0.85,
                          }}
                        >
                          {/* Add Subfolder Item button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newItems = [...(data?.navbar?.items || [])];
                              const curSub = newItems[idx].subItems || [];
                              newItems[idx].subItems = [...curSub, { id: `sub-${Date.now()}`, label: 'Sub Menu Baru', url: '#section' }];
                              updateField('navbar.items', newItems);
                              setOpenDropdownIdx(idx);
                              notify('📂 Sub-menu ditambahkan!');
                            }}
                            title="Tambah Sub-link Dropdown"
                            style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', opacity: 0.85, padding: 1, display: 'flex', alignItems: 'center' }}
                          >
                            <FolderPlus size={11} />
                          </button>

                          {/* Link / URL Editor Quick Action */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLinkItem({ parentIdx: idx });
                            }}
                            title={`Ubah URL Link: ${item.url || '#'}`}
                            style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer', opacity: 0.75, padding: 1, display: 'flex', alignItems: 'center' }}
                          >
                            <Link2 size={11} />
                          </button>

                          {/* Delete Menu */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newItems = (data?.navbar?.items || []).filter((_, i) => i !== idx);
                              updateField('navbar.items', newItems);
                            }}
                            title="Hapus Menu Ini"
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.65, padding: 1, display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>

                      {/* LIVE DROPDOWN CARD */}
                      {hasSub && isDropdownOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            minWidth: 200,
                            background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'}`,
                            borderRadius: 18,
                            padding: '10px 8px',
                            boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 800, color: accentColor, textTransform: 'uppercase', padding: '2px 8px 6px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                            SUB-MENU ({item.label})
                          </div>

                          {subItems.map((sub: any, sIdx: number) => (
                            <div
                              key={sub.id || sIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 6,
                                padding: '6px 10px',
                                borderRadius: 10,
                                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                <span
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newItems = [...(data?.navbar?.items || [])];
                                    newItems[idx].subItems[sIdx].label = e.currentTarget.textContent || '';
                                    updateField('navbar.items', newItems);
                                  }}
                                  style={{
                                    fontSize: 12.5,
                                    fontWeight: 750,
                                    color: textColor,
                                    outline: 'none',
                                    cursor: 'text',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {sub.label}
                                </span>
                                <span style={{ fontSize: 10, color: subTextColor, fontFamily: 'monospace' }}>
                                  {sub.url || '#'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <button
                                  onClick={() => setEditingLinkItem({ parentIdx: idx, subIdx: sIdx })}
                                  style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', padding: 2 }}
                                  title="Ubah URL Link"
                                >
                                  <Link2 size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    const newItems = [...(data?.navbar?.items || [])];
                                    newItems[idx].subItems = newItems[idx].subItems.filter((_: any, i: number) => i !== sIdx);
                                    updateField('navbar.items', newItems);
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                  title="Hapus Sub-link"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={() => {
                              const newItems = [...(data?.navbar?.items || [])];
                              const curSub = newItems[idx].subItems || [];
                              newItems[idx].subItems = [...curSub, { id: `sub-${Date.now()}`, label: 'Sub-Link Baru', url: '#section' }];
                              updateField('navbar.items', newItems);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '6px 8px',
                              borderRadius: 10,
                              border: `1px dashed ${accentColor}50`,
                              background: `${accentColor}10`,
                              color: accentColor,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                              marginTop: 4,
                            }}
                          >
                            <Plus size={12} />
                            <span>Tambah Sub-Link</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    const newItems = [...(data?.navbar?.items || []), { id: `nav-${Date.now()}`, type: 'link', label: 'Menu Baru', url: '#section' }];
                    updateField('navbar.items', newItems);
                  }}
                  title="Tambah Menu Navigasi Utama"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    borderRadius: 12,
                    border: 'none',
                    background: `${accentColor}12`,
                    color: accentColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={13} />
                  <span>Tambah Menu</span>
                </button>

                <button
                  onClick={() => {
                    confirm('Kembalikan menu navigasi ke susunan default lengkap (semua halaman utama)?', () => {
                      const defaultItems = [
                        { id: 'nav-home', type: 'link', label: 'Beranda', url: '/' },
                        { id: 'nav-portfolio', type: 'link', label: 'Portofolio', url: '/portfolio' },
                        { id: 'nav-about', type: 'link', label: 'Tentang', url: '/about' },
                        { id: 'nav-catalog', type: 'link', label: 'Katalog', url: '/katalog' },
                        { id: 'nav-pricing', type: 'link', label: 'Harga', url: '/pricing' },
                        { id: 'nav-games', type: 'link', label: 'Game', url: '/games' },
                        { id: 'nav-blog', type: 'link', label: 'Blog', url: '/blog' },
                        { id: 'nav-updates', type: 'link', label: 'Update', url: '/updates' },
                        { id: 'nav-links', type: 'link', label: 'Links', url: '/links' },
                        { id: 'nav-contact', type: 'link', label: 'Kontak', url: '#contact' },
                      ];
                      updateField('navbar.items', defaultItems);
                      notify('✅ Navigasi direset ke susunan default semua halaman utama!');
                    });
                  }}
                  title="Reset susunan navigasi ke default (semua halaman utama)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    borderRadius: 12,
                    border: 'none',
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    color: subTextColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11,
                    fontWeight: 750,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Reset Default</span>
                </button>
              </div>
            ) : (
              /* Mobile / Tablet Real Controls (Editable Login Button + Real Hamburger Button) */
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    background: accentColor,
                    color: '#ffffff',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: `0 4px 12px ${accentColor}35`,
                  }}
                >
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateField('navbar.loginBtnLabel', e.currentTarget.textContent || 'Login')}
                    style={{ outline: 'none', cursor: 'text' }}
                    title="Klik untuk mengedit label login"
                  >
                    {data?.navbar?.loginBtnLabel || 'Login'}
                  </span>
                </div>

                {/* Real Hamburger Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileNavOpen(!mobileNavOpen);
                  }}
                  title={mobileNavOpen ? 'Tutup Menu Navigasi' : 'Buka Menu Navigasi Mobile'}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                    color: textColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </div>
            )}

            {/* Desktop Login Button */}
            {!isMobileOrTablet && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    padding: '8px 18px',
                    borderRadius: 100,
                    background: accentColor,
                    color: '#ffffff',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12.5,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: `0 4px 12px ${accentColor}35`,
                  }}
                >
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateField('navbar.loginBtnLabel', e.currentTarget.textContent || 'Login')}
                    style={{ outline: 'none', cursor: 'text' }}
                    title="Klik untuk mengedit label tombol login"
                  >
                    {data?.navbar?.loginBtnLabel || 'Login'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── REAL MOBILE / TABLET OVERLAY DRAWER MENU (INLINE EDITABLE) ── */}
          {isMobileOrTablet && mobileNavOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: isMobile ? 86 : 60,
                left: 0,
                right: 0,
                bottom: 0,
                background: isDark ? 'rgba(8, 8, 15, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                zIndex: 110,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 18px 30px',
                boxSizing: 'border-box',
                overflowY: 'auto',
                gap: 12,
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  NAVIGASI MENU ({device.toUpperCase()})
                </span>
                <span style={{ fontSize: 11, color: subTextColor }}>Klik teks untuk edit</span>
              </div>

              {/* Mobile Menu Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(data?.navbar?.items || []).map((item: any, idx: number) => {
                  const subItems = item.subItems || [];
                  const hasSub = subItems.length > 0;
                  const isExpanded = !!expandedMobileGroups[item.id || idx];

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        borderRadius: 16,
                        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const newItems = [...(data?.navbar?.items || [])];
                              newItems[idx].label = e.currentTarget.textContent || '';
                              updateField('navbar.items', newItems);
                            }}
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 15,
                              fontWeight: 800,
                              color: textColor,
                              outline: 'none',
                              cursor: 'text',
                            }}
                          >
                            {item.label}
                          </span>
                          <span style={{ fontSize: 11, color: subTextColor, fontFamily: 'monospace' }}>
                            {item.url || '#'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {hasSub && (
                            <button
                              onClick={() => setExpandedMobileGroups(prev => ({ ...prev, [item.id || idx]: !prev[item.id || idx] }))}
                              style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', padding: 4 }}
                            >
                              <ChevronDown size={15} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const newItems = [...(data?.navbar?.items || [])];
                              const curSub = newItems[idx].subItems || [];
                              newItems[idx].subItems = [...curSub, { id: `sub-${Date.now()}`, label: 'Sub-Link Baru', url: '#section' }];
                              updateField('navbar.items', newItems);
                              setExpandedMobileGroups(prev => ({ ...prev, [item.id || idx]: true }));
                            }}
                            title="Tambah Sub-link"
                            style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', padding: 4 }}
                          >
                            <FolderPlus size={14} />
                          </button>

                          <button
                            onClick={() => setEditingLinkItem({ parentIdx: idx })}
                            title="Ubah URL Link"
                            style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer', padding: 4 }}
                          >
                            <Link2 size={14} />
                          </button>

                          <button
                            onClick={() => {
                              const newItems = (data?.navbar?.items || []).filter((_, i) => i !== idx);
                              updateField('navbar.items', newItems);
                            }}
                            title="Hapus Menu"
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Sub-items list in mobile menu */}
                      {hasSub && isExpanded && (
                        <div style={{ padding: '6px 12px 12px', borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`, display: 'flex', flexDirection: 'column', gap: 6, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
                          {subItems.map((sub: any, sIdx: number) => (
                            <div key={sub.id || sIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newItems = [...(data?.navbar?.items || [])];
                                    newItems[idx].subItems[sIdx].label = e.currentTarget.textContent || '';
                                    updateField('navbar.items', newItems);
                                  }}
                                  style={{ fontSize: 13, fontWeight: 700, color: textColor, outline: 'none' }}
                                >
                                  {sub.label}
                                </span>
                                <span style={{ fontSize: 10, color: subTextColor, fontFamily: 'monospace' }}>{sub.url || '#'}</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button
                                  onClick={() => setEditingLinkItem({ parentIdx: idx, subIdx: sIdx })}
                                  style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', padding: 2 }}
                                >
                                  <Link2 size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    const newItems = [...(data?.navbar?.items || [])];
                                    newItems[idx].subItems = newItems[idx].subItems.filter((_: any, i: number) => i !== sIdx);
                                    updateField('navbar.items', newItems);
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    const newItems = [...(data?.navbar?.items || []), { id: `nav-${Date.now()}`, type: 'link', label: 'Menu Baru', url: '#section' }];
                    updateField('navbar.items', newItems);
                    notify('✨ Menu baru ditambahkan!');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 12,
                    borderRadius: 16,
                    border: `1px dashed ${accentColor}50`,
                    background: `${accentColor}10`,
                    color: accentColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginTop: 6,
                  }}
                >
                  <Plus size={15} />
                  <span>Tambah Menu Navigasi</span>
                </button>

                <button
                  onClick={() => {
                    confirm('Kembalikan menu navigasi ke susunan default lengkap (semua halaman utama)?', () => {
                      const defaultItems = [
                        { id: 'nav-home', type: 'link', label: 'Beranda', url: '/' },
                        { id: 'nav-portfolio', type: 'link', label: 'Portofolio', url: '/portfolio' },
                        { id: 'nav-about', type: 'link', label: 'Tentang', url: '/about' },
                        { id: 'nav-catalog', type: 'link', label: 'Katalog', url: '/katalog' },
                        { id: 'nav-pricing', type: 'link', label: 'Harga', url: '/pricing' },
                        { id: 'nav-games', type: 'link', label: 'Game', url: '/games' },
                        { id: 'nav-blog', type: 'link', label: 'Blog', url: '/blog' },
                        { id: 'nav-updates', type: 'link', label: 'Update', url: '/updates' },
                        { id: 'nav-links', type: 'link', label: 'Links', url: '/links' },
                        { id: 'nav-contact', type: 'link', label: 'Kontak', url: '#contact' },
                      ];
                      updateField('navbar.items', defaultItems);
                      notify('✅ Navigasi direset ke susunan default semua halaman utama!');
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 10,
                    borderRadius: 14,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    color: subTextColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Reset Susunan Default (Semua Halaman)</span>
                </button>
              </div>

              {/* Close Drawer Button */}
              <button
                onClick={() => setMobileNavOpen(false)}
                style={{
                  marginTop: 'auto',
                  padding: 12,
                  borderRadius: 100,
                  border: 'none',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: textColor,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Tutup Menu
              </button>
            </div>
          )}

          {/* ── SCROLLABLE VISUAL PAGE CONTENT ── */}
          <div
            data-cms-theme={isDark ? 'dark' : 'light'}
            data-theme={isDark ? 'dark' : 'light'}
            style={{
              ...editorThemeTokens,
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              background: isDark ? '#08080f' : '#ffffff',
              color: isDark ? '#f8fafc' : '#0f172a',
            } as React.CSSProperties}
          >
            {/* ════════════════ PAGE 1: BERANDA (HOME) ════════════════ */}
            {activePage === 'home' && (
              <>
                {/* 1.1 HERO SECTION */}
                <section
                  id="hero"
                  style={{
                    minHeight: isMobileOrTablet ? 'auto' : '85vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isMobileOrTablet ? '40px 16px' : '80px 24px 60px',
                    background: isDark ? '#08080f' : '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobileOrTablet ? 28 : 48, alignItems: 'center' }}>
                    
                    {/* Left: Text Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Status Badge */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 14px',
                        borderRadius: 100,
                        background: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                        color: '#10b981',
                        fontSize: 12,
                        fontWeight: 750,
                        width: 'fit-content',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateField('hero.badge.largeText', e.currentTarget.textContent || 'Open for Projects ☀️')}
                          style={{ outline: 'none', cursor: 'text' }}
                          title="Klik untuk mengedit status"
                        >
                          {data.hero?.badge?.largeText || 'Open for Projects ☀️'}
                        </span>
                      </div>

                      {/* Greeting */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('hero.greeting', e.currentTarget.textContent || "Hey there! ☀️ Welcome to")}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 15,
                          fontWeight: 600,
                          color: accentColor,
                          outline: 'none',
                          cursor: 'text',
                        }}
                        title="Klik untuk mengedit sapaan"
                      >
                        {data.hero?.greeting || "Hey there! ☀️ Welcome to"}
                      </div>

                      {/* Headline / Nama */}
                      <h1
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('hero.headline', e.currentTarget.textContent || 'sumr.day')}
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: isMobileOrTablet ? '32px' : 'clamp(36px, 5vw, 60px)',
                          fontWeight: 900,
                          color: textColor,
                          margin: 0,
                          lineHeight: 1.1,
                          letterSpacing: '-0.03em',
                          outline: 'none',
                          cursor: 'text',
                        }}
                        title="Klik untuk mengedit nama headline"
                      >
                        {data.hero?.headline || 'sumr.day'}
                      </h1>

                      {/* Subheadline / Profesi */}
                      <h2
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('hero.subheadline', e.currentTarget.textContent || 'Creative Digital Studio • Warm Tech & Skena-Aesthetic')}
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: isMobileOrTablet ? '18px' : 'clamp(20px, 2.8vw, 30px)',
                          fontWeight: 750,
                          color: accentColor,
                          margin: 0,
                          outline: 'none',
                          cursor: 'text',
                        }}
                        title="Klik untuk mengedit profesi"
                      >
                        {data.hero?.subheadline || 'Creative Digital Studio • Warm Tech & Skena-Aesthetic'}
                      </h2>

                      {/* Deskripsi */}
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('hero.description', e.currentTarget.textContent || '')}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: isMobileOrTablet ? 14 : 15.5,
                          color: subTextColor,
                          lineHeight: 1.7,
                          margin: 0,
                          outline: 'none',
                          cursor: 'text',
                        }}
                        title="Klik untuk mengedit deskripsi bio"
                      >
                        {data.hero?.description || 'Menghadirkan interaksi digital—mulai dari undangan web estetik, landing page modern, hingga aset visual kreatif—secara hangat, santai, dan penuh energi positif khas musim panas.'}
                      </p>

                      {/* CTA Buttons */}
                      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{
                          padding: '10px 20px',
                          borderRadius: 100,
                          background: accentColor,
                          color: '#ffffff',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 750,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateField('hero.ctaPrimaryLabel', e.currentTarget.textContent || 'Jelajahi Showcase ✨')}
                            style={{ outline: 'none' }}
                          >
                            {data.hero?.ctaPrimaryLabel || 'Jelajahi Showcase ✨'}
                          </span>
                          <ArrowUpRight size={14} />
                        </div>

                        <div style={{
                          padding: '10px 20px',
                          borderRadius: 100,
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          border: `1px solid ${cardBorder}`,
                          color: textColor,
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 750,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateField('hero.ctaSecondaryLabel', e.currentTarget.textContent || 'Ngobrol Santai ☀️')}
                            style={{ outline: 'none' }}
                          >
                            {data.hero?.ctaSecondaryLabel || 'Ngobrol Santai ☀️'}
                          </span>
                        </div>
                      </div>

                      {/* Bento Cards / Badges Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((data.hero?.cards || []).length || 2, 3)}, 1fr)`, gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
                        {(data.hero?.cards && data.hero.cards.length > 0 ? data.hero.cards : [
                          { id: 'card-1', text: 'Warm Tech & Flow', icon: 'Sparkles' },
                          { id: 'card-2', text: 'Skena-Aesthetic Vibes', icon: 'Heart' }
                        ]).map((card: any, cIdx: number) => (
                          <div key={card.id || cIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 14, border: `1px solid ${cardBorder}` }}>
                            <Sparkles size={14} color={accentColor} />
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const currentCards = data.hero?.cards ? [...data.hero.cards] : [
                                  { id: 'card-1', text: 'Warm Tech & Flow', icon: 'Sparkles' },
                                  { id: 'card-2', text: 'Skena-Aesthetic Vibes', icon: 'Heart' }
                                ];
                                currentCards[cIdx].text = e.currentTarget.textContent || '';
                                updateField('hero.cards', currentCards);
                              }}
                              style={{ fontSize: 12, fontWeight: 700, color: textColor, outline: 'none' }}
                            >
                              {card.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Hero Image with Cloudinary Button */}
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <div
                        style={{
                          width: isMobileOrTablet ? '100%' : 'clamp(280px, 80%, 420px)',
                          aspectRatio: '1 / 1',
                          borderRadius: isMobileOrTablet ? 24 : 36,
                          background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                          overflow: 'hidden',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                        }}
                      >
                        {data.hero?.heroImage && typeof data.hero?.heroImage === 'string' && data.hero.heroImage.trim().length > 5 ? (
                          <img
                            src={data.hero?.heroImage}
                            alt="Hero"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ color: subTextColor, fontSize: 13, textAlign: 'center', padding: 20 }}>
                            <Camera size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                            <div>Belum ada foto Hero</div>
                          </div>
                        )}

                        {/* Multi-Action Image Toolbar (Upload / Gallery / Delete) */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
                            padding: '4px 8px',
                            borderRadius: 100,
                            border: '1px solid rgba(255,255,255,0.2)',
                            zIndex: 10,
                          }}
                        >
                          <button
                            onClick={() => triggerUpload({ type: 'hero' })}
                            title="Upload Foto Baru (Cloudinary)"
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px' }}
                          >
                            <Camera size={12} />
                            <span>Upload</span>
                          </button>
                          <button
                            onClick={() => openMediaPicker({ type: 'hero' })}
                            title="Pilih dari Galeri Media"
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                          >
                            <ImageIcon size={12} />
                            <span>Galeri</span>
                          </button>
                          {data.hero?.heroImage && (
                            <button
                              onClick={() => handleRemoveImage('hero')}
                              title="Hapus Foto Hero"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 6px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </section>

                {/* 1.15 FEATURED PORTFOLIO SHOWCASE (EXACT MATCH WITH LPPortfolio.tsx ON CLIENT WEBSITE) */}
                <div style={{ position: 'relative', borderTop: `1px solid ${cardBorder}` }}>
                  <div style={{
                    maxWidth: 1240,
                    margin: '0 auto',
                    padding: '24px 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor }} />
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 800, color: accentColor }}>
                        Showcase Karya Unggulan (Sinkronisasi Live Client)
                      </span>
                    </div>
                    <button
                      onClick={() => setActivePage('portfolio')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 100,
                        background: `${accentColor}18`,
                        border: `1px solid ${accentColor}40`,
                        color: accentColor,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12,
                        fontWeight: 750,
                        cursor: 'pointer',
                      }}
                    >
                      <span>Kelola & Tambah Karya (/portfolio)</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <LPPortfolio
                    projects={projects || []}
                    landingFeaturedLabel={data?.landingFeaturedLabel || ''}
                    isDark={isDark}
                    accentColor={accentColor}
                    localization={data?.localization}
                  />
                </div>

                {/* 1.2 HOME ABOUT SECTION (EXACT MATCH WITH LPAbout.tsx) */}
                <section
                  id="home-about"
                  style={{
                    padding: isMobileOrTablet ? '50px 16px' : '90px 24px',
                    background: isDark ? '#0b0f19' : '#f8fafc',
                    position: 'relative',
                    overflow: 'hidden',
                    borderTop: `1px solid ${cardBorder}`,
                  }}
                >
                  <div style={{ maxWidth: 1240, margin: '0 auto' }}>
                    
                    {/* Bento visual + text grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobileOrTablet ? 28 : 48, alignItems: 'center', marginBottom: 64 }}>
                      
                      {/* Visual Bento Image with Ambient Glow */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: 480,
                            aspectRatio: '4/3',
                            borderRadius: 28,
                            position: 'relative',
                            overflow: 'hidden',
                            padding: 10,
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)'
                              : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                            boxShadow: isDark
                              ? '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
                              : '0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: 20,
                              overflow: 'hidden',
                              position: 'relative',
                              background: isDark ? '#111827' : '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {data.profile?.image ? (
                              <img src={data.profile?.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: accentColor }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <User size={32} />
                                </div>
                                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700 }}>Foto Tentang Saya</span>
                              </div>
                            )}

                            {/* Multi-Action Image Toolbar for Bento Image */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 12,
                                right: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(10px)',
                                padding: '4px 8px',
                                borderRadius: 100,
                                border: '1px solid rgba(255,255,255,0.2)',
                                zIndex: 10,
                              }}
                            >
                              <button
                                onClick={() => triggerUpload({ type: 'home_about_image' })}
                                title="Upload Foto Baru (Cloudinary)"
                                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px' }}
                              >
                                <Camera size={12} />
                                <span>Upload</span>
                              </button>
                              <button
                                onClick={() => openMediaPicker({ type: 'home_about_image' })}
                                title="Pilih dari Galeri Media"
                                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                              >
                                <ImageIcon size={12} />
                                <span>Galeri</span>
                              </button>
                              {data.profile?.image && (
                                <button
                                  onClick={() => handleRemoveImage('home_about_image')}
                                  title="Hapus Foto Tentang"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 6px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Text block */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 12,
                          fontWeight: 700,
                          color: accentColor,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}>
                          <Sparkles size={14} />
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateField('localization.aboutSectionTitle', e.currentTarget.textContent || 'TENTANG SAYA')}
                            style={{ outline: 'none' }}
                          >
                            {data.localization?.aboutSectionTitle || 'TENTANG SAYA'}
                          </span>
                        </div>

                        <h2
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateField('localization.aboutMainTitle', e.currentTarget.textContent || 'Desainer & developer yang fokus pada kesederhanaan, keindahan, dan dampak nyata.')}
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: isMobileOrTablet ? 24 : 'clamp(28px, 3.4vw, 42px)',
                            fontWeight: 850,
                            color: textColor,
                            lineHeight: 1.18,
                            margin: 0,
                            letterSpacing: '-0.02em',
                            outline: 'none',
                          }}
                        >
                          {data.localization?.aboutMainTitle || data.profile?.bio?.split('.')[0] + '.' || "Desainer & developer yang fokus pada kesederhanaan, keindahan, dan dampak nyata."}
                        </h2>

                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateField('profile.bio', e.currentTarget.textContent || '')}
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 15,
                            color: subTextColor,
                            lineHeight: 1.8,
                            margin: 0,
                            outline: 'none',
                          }}
                        >
                          {data.profile?.bio || 'Membangun karya desain yang tidak hanya memanjakan mata tetapi juga memberikan dampak nyata bagi bisnis dan audiens.'}
                        </p>

                        <div style={{ paddingTop: 8 }}>
                          <button
                            onClick={() => setActivePage('about')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '12px 24px',
                              background: accentColor,
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: 100,
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 700,
                              fontSize: 14,
                              boxShadow: `0 8px 24px ${accentColor}35`,
                            }}
                          >
                            <span>Pelajari Lebih Lengkap (/about)</span>
                            <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 1.2.2 COLORFUL SERVICES & TOOLKIT CARDS (HOME SKILLS) */}
                    <div style={{ textAlign: 'center', marginBottom: 36 }}>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: accentColor,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        marginBottom: 10,
                      }}>
                        — LAYANAN & KEAHLIAN
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h2 style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: isMobileOrTablet ? 24 : 'clamp(28px, 3.5vw, 42px)',
                          fontWeight: 850,
                          color: textColor,
                          margin: 0,
                          letterSpacing: '-0.02em',
                        }}>
                          Layanan & Toolkit Profesional
                        </h2>
                        <button
                          onClick={() => {
                            const newSkills = [...(data.profile?.skills || []), { id: `sk-${Date.now()}`, name: 'Layanan Baru', description: 'Deskripsi singkat layanan...', icon: 'Sparkles' }];
                            updateField('profile.skills', newSkills);
                            notify('✨ Kartu Layanan baru ditambahkan!');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 100,
                            background: `${accentColor}18`,
                            border: `1px solid ${accentColor}40`,
                            color: accentColor,
                            fontWeight: 800,
                            fontSize: 11.5,
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={13} />
                          <span>Tambah Layanan</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                      {(data.profile?.skills || []).map((skill: any, index: number) => {
                        const palette = CARD_PALETTES[index % CARD_PALETTES.length];
                        return (
                          <div
                            key={skill.id || index}
                            style={{
                              background: isDark ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
                              backdropFilter: 'blur(16px)',
                              WebkitBackdropFilter: 'blur(16px)',
                              border: `1px solid ${isDark ? palette.border : 'rgba(0,0,0,0.06)'}`,
                              borderRadius: 22,
                              padding: '26px 20px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              textAlign: 'left',
                              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.03)',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              onClick={() => {
                                const newS = (data.profile?.skills || []).filter((_: any, i: number) => i !== index);
                                updateField('profile.skills', newS);
                              }}
                              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                              title="Hapus Layanan"
                            >
                              <Trash2 size={13} />
                            </button>

                            {/* Interactive Editable Icon Badge */}
                            <div
                              onClick={() => setIconPickerTarget({
                                type: 'skill',
                                index,
                                currentIcon: skill.icon || 'Sparkles',
                                title: `Pilih Ikon untuk "${skill.name || 'Layanan'}"`
                              })}
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 14,
                                background: palette.bg,
                                border: `1px solid ${palette.border}`,
                                color: palette.accent,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 18,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                position: 'relative',
                              }}
                              title="Klik untuk memilih ikon lain"
                            >
                              {renderDynamicIcon(skill.icon || 'Sparkles', 22)}
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: -3,
                                  right: -3,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: accentColor,
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: `1.5px solid ${isDark ? '#0f172a' : '#ffffff'}`,
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                                }}
                              >
                                <Edit3 size={8} />
                              </div>
                            </div>

                            <h3
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const newS = [...(data.profile?.skills || [])];
                                newS[index].name = e.currentTarget.textContent || '';
                                updateField('profile.skills', newS);
                              }}
                              style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 17,
                                fontWeight: 800,
                                color: textColor,
                                margin: '0 0 8px',
                                outline: 'none',
                              }}
                            >
                              {skill.name}
                            </h3>

                            <p
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const newS = [...(data.profile?.skills || [])];
                                newS[index].description = e.currentTarget.textContent || '';
                                updateField('profile.skills', newS);
                              }}
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 13,
                                color: subTextColor,
                                lineHeight: 1.6,
                                margin: 0,
                                outline: 'none',
                              }}
                            >
                              {skill.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </section>

                {/* 1.3 PROCESS WORKFLOW */}
                <section style={{ padding: isMobileOrTablet ? '40px 16px' : '80px 24px', background: isDark ? '#05060b' : '#ffffff', borderTop: `1px solid ${cardBorder}` }}>
                  <div style={{ maxWidth: 1240, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {data.localization?.processSectionTitle || 'ALUR KERJA'}
                        </span>
                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobileOrTablet ? 24 : 32, fontWeight: 850, color: textColor, margin: '4px 0 0' }}>
                          {data.localization?.processMainTitle || 'Bagaimana Kami Bekerja'}
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          const currentList = (data.process && data.process.length > 0) ? data.process : (DEFAULT_MAIN_WEBSITE_DATA.process || []);
                          const newP = [...currentList, { id: `proc-${Date.now()}`, title: 'Langkah Baru', description: 'Deskripsi langkah kerja...' }];
                          updateField('process', newP);
                          notify('✨ Kartu alur kerja baru ditambahkan!');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 100,
                          background: `${accentColor}18`,
                          border: `1px solid ${accentColor}40`,
                          color: accentColor,
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} />
                        <span>Tambah Langkah</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                      {((data.process && data.process.length > 0) ? data.process : (DEFAULT_MAIN_WEBSITE_DATA.process || [])).map((proc: any, idx: number) => (
                        <div key={proc.id || idx} style={{ padding: 20, borderRadius: 20, background: cardBg, border: `1px solid ${cardBorder}`, position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: accentColor, opacity: 0.4 }}>0{idx + 1}</span>
                            <button
                              onClick={() => {
                                const currentList = (data.process && data.process.length > 0) ? data.process : (DEFAULT_MAIN_WEBSITE_DATA.process || []);
                                const newP = currentList.filter((_: any, i: number) => i !== idx);
                                updateField('process', newP);
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                              title="Hapus Langkah Ini"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <h4
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const currentList = (data.process && data.process.length > 0) ? data.process : (DEFAULT_MAIN_WEBSITE_DATA.process || []);
                              const newP = JSON.parse(JSON.stringify(currentList));
                              newP[idx].title = e.currentTarget.textContent || '';
                              updateField('process', newP);
                            }}
                            style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textColor, margin: '8px 0 6px', outline: 'none' }}
                          >
                            {proc.title}
                          </h4>
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const currentList = (data.process && data.process.length > 0) ? data.process : (DEFAULT_MAIN_WEBSITE_DATA.process || []);
                              const newP = JSON.parse(JSON.stringify(currentList));
                              newP[idx].description = e.currentTarget.textContent || '';
                              updateField('process', newP);
                            }}
                            style={{ fontSize: 13, color: subTextColor, margin: 0, outline: 'none', lineHeight: 1.6 }}
                          >
                            {proc.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 1.4 TESTIMONIALS */}
                <section style={{ padding: isMobileOrTablet ? '40px 16px' : '80px 24px', background: isDark ? '#08080f' : '#f8fafc', borderTop: `1px solid ${cardBorder}` }}>
                  <div style={{ maxWidth: 1240, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {data.localization?.testimonialSectionTitle || 'TESTIMONI'}
                        </span>
                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobileOrTablet ? 24 : 32, fontWeight: 850, color: textColor, margin: '4px 0 0' }}>
                          {data.localization?.testimonialMainTitle || 'Apa Kata Klien'}
                        </h2>
                      </div>
                      <button
                        onClick={() => {
                          const currentT = (data.testimonials && data.testimonials.length > 0) ? data.testimonials : (DEFAULT_MAIN_WEBSITE_DATA.testimonials || []);
                          const newT = [...currentT, { id: `tst-${Date.now()}`, name: 'Nama Klien', author: 'Nama Klien', role: 'CEO / Founder', company: 'Perusahaan', text: 'Ulasan kerja sama hangat...', quote: 'Ulasan kerja sama hangat...', avatar: '' }];
                          updateField('testimonials', newT);
                          notify('✨ Kartu testimoni baru ditambahkan!');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 100,
                          background: `${accentColor}18`,
                          border: `1px solid ${accentColor}40`,
                          color: accentColor,
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} />
                        <span>Tambah Testimoni</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                      {((data.testimonials && data.testimonials.length > 0) ? data.testimonials : (DEFAULT_MAIN_WEBSITE_DATA.testimonials || [])).map((t: any, idx: number) => (
                        <div key={t.id || idx} style={{ padding: 22, borderRadius: 20, background: cardBg, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                onClick={() => triggerUpload({ type: 'avatar', index: idx })}
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: '50%',
                                  background: `${accentColor}25`,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                }}
                                title="Klik untuk ganti avatar"
                              >
                                {t.avatar ? <img src={t.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color={accentColor} />}
                              </div>
                              <div>
                                <h4
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const currentT = (data.testimonials && data.testimonials.length > 0) ? data.testimonials : (DEFAULT_MAIN_WEBSITE_DATA.testimonials || []);
                                    const newT = JSON.parse(JSON.stringify(currentT));
                                    const val = e.currentTarget.textContent || '';
                                    newT[idx].name = val;
                                    newT[idx].author = val;
                                    updateField('testimonials', newT);
                                  }}
                                  style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: textColor, outline: 'none' }}
                                >
                                  {t.name || t.author || 'Klien'}
                                </h4>
                                <div
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const currentT = (data.testimonials && data.testimonials.length > 0) ? data.testimonials : (DEFAULT_MAIN_WEBSITE_DATA.testimonials || []);
                                    const newT = JSON.parse(JSON.stringify(currentT));
                                    newT[idx].role = e.currentTarget.textContent || '';
                                    updateField('testimonials', newT);
                                  }}
                                  style={{ fontSize: 11.5, color: subTextColor, outline: 'none' }}
                                >
                                  {t.role || 'Klien'}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const currentT = (data.testimonials && data.testimonials.length > 0) ? data.testimonials : (DEFAULT_MAIN_WEBSITE_DATA.testimonials || []);
                                const newT = currentT.filter((_: any, i: number) => i !== idx);
                                updateField('testimonials', newT);
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const currentT = (data.testimonials && data.testimonials.length > 0) ? data.testimonials : (DEFAULT_MAIN_WEBSITE_DATA.testimonials || []);
                              const newT = JSON.parse(JSON.stringify(currentT));
                              const val = e.currentTarget.textContent || '';
                              newT[idx].text = val;
                              newT[idx].quote = val;
                              updateField('testimonials', newT);
                            }}
                            style={{ fontSize: 13, color: subTextColor, fontStyle: 'italic', margin: 0, outline: 'none', lineHeight: 1.6 }}
                          >
                            "{t.text || t.quote || ''}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 1.5 UPDATES & UTAS FEED SECTION */}
                {data.updatesFeed?.enabled !== false && (
                  <LPUpdatesFeed
                    isDark={isDark}
                    accentColor={accentColor}
                    badge={data.updatesFeed?.badge || 'UTAS & CERITA HANGAT'}
                    title={data.updatesFeed?.title || 'Jurnal Kreatif & Update Proyek'}
                    subtitle={data.updatesFeed?.subtitle || 'Catatan progres, kilas balik karya, dan cerita seru dari balik layar sumr.day ☀️'}
                    maxPosts={1}
                    showOnlyPinnedOrSingle={true}
                    seeMoreUrl="/updates"
                    seeMoreLabel="Selengkapnya"
                    showSocialStats={data.updatesFeed?.showSocialStats !== false}
                    isEditableInVisualWeb={true}
                    onUpdateBadge={(val) => updateField('updatesFeed.badge', val)}
                    onUpdateTitle={(val) => updateField('updatesFeed.title', val)}
                    onUpdateSubtitle={(val) => updateField('updatesFeed.subtitle', val)}
                    onEditSection={() => {
                      setActivePage('updates');
                    }}
                  />
                )}

                {/* 1.6 BLOG & INSIGHTS PREVIEW (EXACT MATCH WITH LPBlogPreview.tsx ON CLIENT WEBSITE) */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    maxWidth: 1240,
                    margin: '0 auto',
                    padding: '24px 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor }} />
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 800, color: accentColor }}>
                        Preview Catatan & Blog (Sinkronisasi Live Client)
                      </span>
                    </div>
                    <button
                      onClick={() => setActivePage('blog')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 100,
                        background: `${accentColor}18`,
                        border: `1px solid ${accentColor}40`,
                        color: accentColor,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12,
                        fontWeight: 750,
                        cursor: 'pointer',
                      }}
                    >
                      <span>Kelola Semua Artikel (/blog)</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>

                  <LPBlogPreview
                    isDark={isDark}
                    accentColor={accentColor}
                    title={data?.blogPreview?.title || 'Catatan & Wawasan'}
                    subtitle={data?.blogPreview?.subtitle || 'Cerita di balik layar, eksplorasi desain, dan inspirasi hangat.'}
                    maxPosts={data?.blogPreview?.maxPosts || 3}
                    ctaLabel={data?.blogPreview?.ctaLabel || 'Lihat Semua Artikel'}
                  />
                </div>
              </>
            )}

            {/* ════════════════ PAGE 2: PORTOFOLIO ════════════════ */}
            {activePage === 'portfolio' && (
              <div style={{ padding: isMobileOrTablet ? '30px 16px' : '60px 24px', maxWidth: 1240, margin: '0 auto' }}>
                {/* Header Title & Add Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.portfolio.badge', e.currentTarget.textContent || 'Koleksi Proyek')}
                      style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', outline: 'none' }}
                    >
                      {data.pagesHeader?.portfolio?.badge || 'KOLEKSI PROYEK & DESAIN'}
                    </span>
                    <h1
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.portfolio.title', e.currentTarget.textContent || 'Karya Pilihan & Studi Kasus')}
                      style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobileOrTablet ? 24 : 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: textColor, margin: '6px 0 0', outline: 'none' }}
                    >
                      {data.pagesHeader?.portfolio?.title || 'Karya Pilihan & Studi Kasus'}
                    </h1>
                  </div>

                  <button
                    onClick={() => {
                      const newProj = {
                        id: `prj-${Date.now()}`,
                        title: 'Proyek Baru',
                        category: 'Branding',
                        description: 'Deskripsi studi kasus proyek...',
                        coverImage: '',
                        isFavorite: false,
                        featuredLabel: 'FEATURED',
                        images: []
                      };
                      setProjects(prev => [newProj, ...prev]);
                      setIsDirty(true);
                      notify('✨ Kartu portofolio baru ditambahkan!');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 100,
                      background: accentColor,
                      color: '#ffffff',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12.5,
                      fontWeight: 750,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: `0 4px 14px ${accentColor}40`,
                    }}
                  >
                    <Plus size={15} />
                    <span>Tambah Kartu Proyek</span>
                  </button>
                </div>

                {/* Interactive Category Filter Chips */}
                {(() => {
                  const uniqueCategories = ['Semua', ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))];
                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        overflowX: 'auto',
                        paddingBottom: 8,
                        marginBottom: 24,
                        scrollbarWidth: 'none',
                      }}
                    >
                      {uniqueCategories.map((cat) => {
                        const isCatSel = portfolioActiveCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setPortfolioActiveCategory(cat)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 100,
                              border: `1px solid ${isCatSel ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                              background: isCatSel ? `${accentColor}20` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                              color: isCatSel ? accentColor : textColor,
                              fontSize: 12,
                              fontWeight: isCatSel ? 800 : 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Projects Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {projects
                    .filter(p => portfolioActiveCategory === 'Semua' || p.category === portfolioActiveCategory)
                    .map((p) => (
                    <div
                      key={p.id}
                      style={{
                        borderRadius: 22,
                        background: cardBg,
                        border: `1px solid ${cardBorder}`,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                      }}
                    >
                      {/* Image Thumbnail with Upload Trigger & Favorite Toggle */}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '16/10',
                          background: isDark ? '#0f172a' : '#f1f5f9',
                          overflow: 'hidden',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {p.coverImage ? (
                          <img src={p.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ color: subTextColor, fontSize: 12, textAlign: 'center' }}>
                            <ImageIcon size={24} style={{ margin: '0 auto 4px', opacity: 0.5 }} />
                            <div>Belum ada cover</div>
                          </div>
                        )}

                        {/* Favorite Badge Toggle */}
                        <button
                          onClick={() => {
                            setProjects(prev => prev.map(item => item.id === p.id ? { ...item, isFavorite: !item.isFavorite } : item));
                            setIsDirty(true);
                            notify(p.isFavorite ? '⭐ Dihapus dari Favorit' : '⭐ Ditandai sebagai Favorit!');
                          }}
                          style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            padding: '4px 8px',
                            borderRadius: 100,
                            background: p.isFavorite ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 10,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Star size={11} fill={p.isFavorite ? '#fff' : 'none'} />
                          <span>{p.isFavorite ? 'FAV' : 'FAV'}</span>
                        </button>

                        {/* Open Modal Editor Trigger */}
                        <button
                          onClick={() => setEditingProjectModal(p)}
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            padding: '5px 10px',
                            borderRadius: 100,
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(8px)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            fontSize: 10.5,
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Edit3 size={11} />
                          <span>Edit Pop-up</span>
                        </button>

                        {/* Multi-Action Image Toolbar for Portfolio Card */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)',
                            padding: '3px 6px',
                            borderRadius: 100,
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          <button
                            onClick={() => triggerUpload({ type: 'project', id: p.id })}
                            title="Upload Cover (Cloudinary)"
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <Camera size={11} />
                            <span>Upload</span>
                          </button>
                          <button
                            onClick={() => openMediaPicker({ type: 'project', id: p.id })}
                            title="Pilih dari Galeri Media"
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 5 }}
                          >
                            <ImageIcon size={11} />
                            <span>Galeri</span>
                          </button>
                          {p.coverImage && (
                            <button
                              onClick={() => handleRemoveImage('project', p.id)}
                              title="Hapus Cover"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 5 }}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const val = e.currentTarget.textContent || '';
                              setProjects(prev => prev.map(item => item.id === p.id ? { ...item, category: val } : item));
                              setIsDirty(true);
                            }}
                            style={{ fontSize: 11, fontWeight: 800, color: accentColor, textTransform: 'uppercase', outline: 'none' }}
                          >
                            {p.category || 'Kategori'}
                          </span>
                          <button
                            onClick={() => {
                              setProjects(prev => prev.filter(item => item.id !== p.id));
                              setIsDirty(true);
                              notify('🗑️ Proyek dihapus');
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5 }}
                            title="Hapus Proyek"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <h4
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const val = e.currentTarget.textContent || '';
                            setProjects(prev => prev.map(item => item.id === p.id ? { ...item, title: val, name: val } : item));
                            setIsDirty(true);
                          }}
                          style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textColor, margin: 0, outline: 'none' }}
                        >
                          {p.title || p.name || 'Judul Proyek'}
                        </h4>

                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const val = e.currentTarget.textContent || '';
                            setProjects(prev => prev.map(item => item.id === p.id ? { ...item, description: val } : item));
                            setIsDirty(true);
                          }}
                          style={{ fontSize: 12.5, color: subTextColor, margin: 0, outline: 'none', lineHeight: 1.5 }}
                        >
                          {p.description || 'Deskripsi singkat proyek...'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════ PAGE 3: TENTANG SAYA & PERUSAHAAN (STANDALONE /about PAGE) ════════════════ */}
            {activePage === 'about' && (
              <div style={{ padding: isMobileOrTablet ? '20px 14px' : '40px 24px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                
                {/* ── Mode Switcher Header Bar: Mode Personal vs Mode Perusahaan ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 28,
                  padding: '14px 20px',
                  background: cardBg,
                  borderRadius: 20,
                  border: `1.5px solid ${cardBorder}`,
                  flexWrap: 'wrap',
                  gap: 12,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${accentColor}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: accentColor,
                      flexShrink: 0
                    }}>
                      {data.aboutSettings?.mode === 'company' ? <Building2 size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 900, color: textColor }}>
                        Tipe Profil Halaman Tentang (/about)
                      </div>
                      <div style={{ fontSize: 11.5, color: subTextColor, fontWeight: 500 }}>
                        {data.aboutSettings?.mode === 'company'
                          ? '🏢 Mode Perusahaan Aktif: Menampilkan Company Profile, Visi-Misi, Nilai Inti, Tim & Roadmap'
                          : '👤 Mode Personal Aktif: Menampilkan CV Profesional, Pengalaman Kerja, Pendidikan & Keahlian'}
                      </div>
                    </div>
                  </div>

                  {/* Switch Toggle Button Pill */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.06)',
                    padding: '4px',
                    borderRadius: 100,
                    border: `1px solid ${cardBorder}`
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('aboutSettings.mode', 'personal');
                        notify('👤 Mode Personal (CV / Individu) diaktifkan');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 16px',
                        borderRadius: 100,
                        border: 'none',
                        background: (data.aboutSettings?.mode !== 'company') ? accentColor : 'transparent',
                        color: (data.aboutSettings?.mode !== 'company') ? '#ffffff' : subTextColor,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: (data.aboutSettings?.mode !== 'company') ? `0 2px 10px ${accentColor}40` : 'none'
                      }}
                    >
                      <User size={14} />
                      <span>Mode Personal (CV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('aboutSettings.mode', 'company');
                        notify('🏢 Mode Perusahaan (Company Profile / Agensi) diaktifkan');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 16px',
                        borderRadius: 100,
                        border: 'none',
                        background: (data.aboutSettings?.mode === 'company') ? accentColor : 'transparent',
                        color: (data.aboutSettings?.mode === 'company') ? '#ffffff' : subTextColor,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: (data.aboutSettings?.mode === 'company') ? `0 2px 10px ${accentColor}40` : 'none'
                      }}
                    >
                      <Building2 size={14} />
                      <span>Mode Perusahaan (Studio / Agensi)</span>
                    </button>
                  </div>
                </div>

                {/* ════════════════ COMPANY PROFILE STUDIO (WHEN MODE === 'company') ════════════════ */}
                {data.aboutSettings?.mode === 'company' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    
                    {/* C.1 HERO BANNER PERUSAHAAN */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        minHeight: isMobileOrTablet ? 200 : 260,
                        background: `linear-gradient(135deg, ${accentColor} 0%, #1e1b4b 100%)`,
                        borderRadius: isMobileOrTablet ? 20 : 28,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: isMobileOrTablet ? '24px 20px' : '36px 40px',
                        boxSizing: 'border-box',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                      }}
                    >
                      {/* Ambient Deco Orbs */}
                      <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 180, height: 180, borderRadius: '50%', background: `${accentColor}40`, filter: 'blur(30px)', pointerEvents: 'none' }} />

                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 750 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.25)', width: 'fit-content' }}>
                          <Building2 size={12} color="#fff" />
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateField('aboutSettings.company.badge', e.currentTarget.textContent || '')}
                            style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10.5, fontWeight: 850, color: '#fff', letterSpacing: '0.08em', outline: 'none' }}
                          >
                            {data.aboutSettings?.company?.badge || 'PROFIL PERUSAHAAN & STUDIO'}
                          </span>
                        </div>

                        <h1
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateField('aboutSettings.company.name', e.currentTarget.textContent || '')}
                          style={{
                            margin: 0,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: isMobileOrTablet ? '28px' : 'clamp(34px, 4.5vw, 50px)',
                            fontWeight: 900,
                            letterSpacing: '-1.5px',
                            color: '#ffffff',
                            lineHeight: 1.1,
                            outline: 'none',
                            cursor: 'text',
                          }}
                          title="Klik untuk mengedit Nama Perusahaan"
                        >
                          {data.aboutSettings?.company?.name || 'sumr.day'}
                        </h1>

                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateField('aboutSettings.company.tagline', e.currentTarget.textContent || '')}
                          style={{
                            margin: 0,
                            fontSize: isMobileOrTablet ? 14 : 16,
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.92)',
                            outline: 'none',
                            cursor: 'text',
                            lineHeight: 1.4
                          }}
                          title="Klik untuk mengedit Tagline / Slogan"
                        >
                          {data.aboutSettings?.company?.tagline || DEFAULT_MAIN_WEBSITE_DATA.aboutSettings.company.tagline}
                        </p>
                      </div>
                    </div>

                    {/* C.2 KEY STATS METRIC COUNTER ROW */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
                      {(data.aboutSettings?.company?.stats || DEFAULT_MAIN_WEBSITE_DATA.aboutSettings.company.stats).map((st: any, sIdx: number) => (
                        <div
                          key={st.id || sIdx}
                          style={{
                            padding: '18px 16px',
                            background: cardBg,
                            backdropFilter: 'blur(16px)',
                            borderRadius: 18,
                            border: `1px solid ${cardBorder}`,
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const newStats = [...(data.aboutSettings?.company?.stats || [])];
                              if (newStats[sIdx]) {
                                newStats[sIdx].value = e.currentTarget.textContent || '';
                                updateField('aboutSettings.company.stats', newStats);
                              }
                            }}
                            style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 900, color: accentColor, outline: 'none' }}
                          >
                            {st.value}
                          </div>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const newStats = [...(data.aboutSettings?.company?.stats || [])];
                              if (newStats[sIdx]) {
                                newStats[sIdx].label = e.currentTarget.textContent || '';
                                updateField('aboutSettings.company.stats', newStats);
                              }
                            }}
                            style={{ fontSize: 11, fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.04em', outline: 'none' }}
                          >
                            {st.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* C.3 BENTO GRID: SIDEBAR & MAIN DETAILS */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : '320px 1fr', gap: isMobileOrTablet ? 24 : 36, alignItems: 'start' }}>
                      
                      {/* LEFT SIDEBAR: IDENTITY & CONTACT */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        
                        {/* Company Card */}
                        <div style={{ padding: '24px 20px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0, border: `1px solid ${accentColor}30` }}>
                              <Building2 size={26} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {data.aboutSettings?.company?.name || 'sumr.day'}
                              </div>
                              <div style={{ fontSize: 12, color: accentColor, fontWeight: 700 }}>
                                Creative Digital Studio • Warm Tech
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: `1px solid ${cardBorder}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                              <span style={{ color: subTextColor, fontWeight: 600 }}>Tahun Berdiri:</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateField('aboutSettings.company.foundedYear', e.currentTarget.textContent || '')}
                                style={{ fontWeight: 800, color: textColor, outline: 'none' }}
                              >
                                {data.aboutSettings?.company?.foundedYear || DEFAULT_MAIN_WEBSITE_DATA.aboutSettings.company.foundedYear}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                              <span style={{ color: subTextColor, fontWeight: 600 }}>Ukuran Tim:</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateField('aboutSettings.company.teamSize', e.currentTarget.textContent || '')}
                                style={{ fontWeight: 800, color: textColor, outline: 'none' }}
                              >
                                {data.aboutSettings?.company?.teamSize || DEFAULT_MAIN_WEBSITE_DATA.aboutSettings.company.teamSize}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                              <span style={{ color: subTextColor, fontWeight: 600 }}>Kantor Pusat:</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateField('aboutSettings.company.headquarters', e.currentTarget.textContent || '')}
                                style={{ fontWeight: 800, color: textColor, outline: 'none', maxWidth: 160, textAlign: 'right' }}
                              >
                                {data.aboutSettings?.company?.headquarters || DEFAULT_MAIN_WEBSITE_DATA.aboutSettings.company.headquarters}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Official Contact Info */}
                        <div style={{ padding: '22px 20px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            KONTAK RESMI PERUSAHAAN
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0 }}>
                              <Mail size={14} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>Email Kantor</div>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateField('aboutSettings.company.email', e.currentTarget.textContent || '')}
                                style={{ fontSize: 12.5, fontWeight: 600, color: textColor, outline: 'none', display: 'block' }}
                              >
                                {data.aboutSettings?.company?.email || 'hi.sumrday@gmail.com'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0 }}>
                              <Phone size={14} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>Telepon / WhatsApp</div>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateField('aboutSettings.company.phone', e.currentTarget.textContent || '')}
                                style={{ fontSize: 12.5, fontWeight: 600, color: textColor, outline: 'none', display: 'block' }}
                              >
                                {data.aboutSettings?.company?.phone || '+62 812-3456-7890'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0 }}>
                              <Globe size={14} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>Website Resmi</div>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateField('aboutSettings.company.website', e.currentTarget.textContent || '')}
                                style={{ fontSize: 12.5, fontWeight: 600, color: textColor, outline: 'none', display: 'block' }}
                              >
                                {data.aboutSettings?.company?.website || 'https://sumrday.web.app'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Trusted Clients / Mitra */}
                        <div style={{ padding: '22px 20px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              KLIEN & MITRA
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = data.aboutSettings?.company?.clients || [];
                                const newC = [...cur, { id: `c_${Date.now()}`, name: 'Nama Klien Baru' }];
                                updateField('aboutSettings.company.clients', newC);
                                notify('✨ Mitra / Klien baru ditambahkan');
                              }}
                              style={{ border: 'none', background: `${accentColor}20`, color: accentColor, padding: '3px 8px', borderRadius: 100, fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                            >
                              + Tambah
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(data.aboutSettings?.company?.clients || [
                              { id: 'c1', name: 'TechIndo Global' },
                              { id: 'c2', name: 'Kopi Nusantara' },
                              { id: 'c3', name: 'Nusantara Logistics' }
                            ]).map((cl: any, cIdx: number) => (
                              <div
                                key={cl.id || cIdx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 10px',
                                  borderRadius: 8,
                                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                  border: `1px solid ${cardBorder}`,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: textColor
                                }}
                              >
                                <span
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newClients = [...(data.aboutSettings?.company?.clients || [])];
                                    if (newClients[cIdx]) {
                                      newClients[cIdx].name = e.currentTarget.textContent || '';
                                      updateField('aboutSettings.company.clients', newClients);
                                    }
                                  }}
                                  style={{ outline: 'none' }}
                                >
                                  {cl.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newClients = (data.aboutSettings?.company?.clients || []).filter((_: any, i: number) => i !== cIdx);
                                    updateField('aboutSettings.company.clients', newClients);
                                  }}
                                  style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, padding: 0 }}
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* RIGHT MAIN CONTENT */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        
                        {/* 1. TENTANG PERUSAHAAN (DESCRIPTION) */}
                        <div style={{ padding: '26px 28px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                              <Building2 size={17} />
                            </div>
                            <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                              Tentang Perusahaan / Studio Kami
                            </h2>
                          </div>

                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateField('aboutSettings.company.description', e.currentTarget.textContent || '')}
                            style={{
                              margin: 0,
                              fontSize: 14,
                              color: subTextColor,
                              lineHeight: 1.8,
                              outline: 'none',
                              cursor: 'text'
                            }}
                            title="Klik untuk mengedit deskripsi naratif profil perusahaan"
                          >
                            {data.aboutSettings?.company?.description || DEFAULT_MAIN_WEBSITE_DATA.aboutSettings.company.description}
                          </p>
                        </div>

                        {/* 2. VISI & MISI BENTO BOX */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : '1fr 1fr', gap: 20 }}>
                          {/* Visi */}
                          <div style={{ padding: '24px 22px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1.5px solid ${accentColor}30`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: accentColor }}>
                              <Sparkles size={18} />
                              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: textColor }}>Visi Kami</span>
                            </div>
                            <p
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => updateField('aboutSettings.company.vision', e.currentTarget.textContent || '')}
                              style={{ margin: 0, fontSize: 13.5, color: subTextColor, lineHeight: 1.7, outline: 'none' }}
                            >
                              {data.aboutSettings?.company?.vision || DEFAULT_MAIN_WEBSITE_DATA.aboutSettings.company.vision}
                            </p>
                          </div>

                          {/* Misi */}
                          <div style={{ padding: '24px 22px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981' }}>
                                <Target size={18} />
                                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: textColor }}>Misi Perusahaan</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = data.aboutSettings?.company?.mission || [];
                                  updateField('aboutSettings.company.mission', [...cur, 'Poin misi baru perusahaan']);
                                  notify('✨ Poin misi baru ditambahkan');
                                }}
                                style={{ border: 'none', background: `${accentColor}18`, color: accentColor, padding: '3px 8px', borderRadius: 100, fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                              >
                                + Tambah
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {(data.aboutSettings?.company?.mission || DEFAULT_MAIN_WEBSITE_DATA.aboutSettings.company.mission).map((mItem: string, mIdx: number) => (
                                <div key={mIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, marginTop: 7, flexShrink: 0 }} />
                                  <span
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const newM = [...(data.aboutSettings?.company?.mission || [])];
                                      newM[mIdx] = e.currentTarget.textContent || '';
                                      updateField('aboutSettings.company.mission', newM);
                                    }}
                                    style={{ flex: 1, fontSize: 13, color: subTextColor, lineHeight: 1.6, outline: 'none' }}
                                  >
                                    {mItem}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newM = (data.aboutSettings?.company?.mission || []).filter((_: any, i: number) => i !== mIdx);
                                      updateField('aboutSettings.company.mission', newM);
                                    }}
                                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, padding: 0 }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 3. NILAI-NILAI UTAMA (CORE VALUES GRID) */}
                        <div style={{ padding: '26px 28px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                <Award size={17} />
                              </div>
                              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                                Nilai-Nilai Utama (Core Values)
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = data.aboutSettings?.company?.coreValues || [];
                                const newV = [...cur, { id: `v_${Date.now()}`, title: 'Nilai Baru', description: 'Deskripsi prinsip kerja dan nilai perusahaan.', icon: 'Sparkles' }];
                                updateField('aboutSettings.company.coreValues', newV);
                                notify('✨ Nilai utama baru ditambahkan');
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, background: `${accentColor}18`, border: `1px solid ${accentColor}40`, color: accentColor, fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}
                            >
                              <Plus size={13} />
                              <span>Tambah Nilai</span>
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : '1fr 1fr', gap: 14 }}>
                            {(data.aboutSettings?.company?.coreValues || [
                              { id: 'v1', title: 'Inovasi Tanpa Batas', description: 'Selalu mengeksplorasi tren dan teknologi mutakhir.', icon: 'Sparkles' },
                              { id: 'v2', title: 'Presisi & Estetika', description: 'Memperhatikan setiap detail piksel dan interaksi visual.', icon: 'Palette' },
                              { id: 'v3', title: 'Orientasi Dampak', description: 'Desain sebagai strategi bisnis untuk menaikkan konversi.', icon: 'Target' },
                              { id: 'v4', title: 'Integritas & Kecepatan', description: 'Komunikasi transparan dan ketepatan eksekusi.', icon: 'Zap' }
                            ]).map((val: any, vIdx: number) => (
                              <div
                                key={val.id || vIdx}
                                style={{
                                  padding: '16px',
                                  borderRadius: 16,
                                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                                  border: `1px solid ${cardBorder}`,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6,
                                  position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                      <Sparkles size={14} />
                                    </div>
                                    <h4
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newVals = [...(data.aboutSettings?.company?.coreValues || [])];
                                        if (newVals[vIdx]) {
                                          newVals[vIdx].title = e.currentTarget.textContent || '';
                                          updateField('aboutSettings.company.coreValues', newVals);
                                        }
                                      }}
                                      style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 800, color: textColor, outline: 'none' }}
                                    >
                                      {val.title}
                                    </h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVals = (data.aboutSettings?.company?.coreValues || []).filter((_: any, i: number) => i !== vIdx);
                                      updateField('aboutSettings.company.coreValues', newVals);
                                    }}
                                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <p
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newVals = [...(data.aboutSettings?.company?.coreValues || [])];
                                    if (newVals[vIdx]) {
                                      newVals[vIdx].description = e.currentTarget.textContent || '';
                                      updateField('aboutSettings.company.coreValues', newVals);
                                    }
                                  }}
                                  style={{ margin: 0, fontSize: 12.5, color: subTextColor, lineHeight: 1.6, outline: 'none' }}
                                >
                                  {val.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. STRUKTUR TIM & PIMPINAN (LEADERSHIP SHOWCASE) */}
                        <div style={{ padding: '26px 28px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                <Users size={17} />
                              </div>
                              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                                Tim & Pimpinan Utama
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = data.aboutSettings?.company?.teamMembers || [];
                                const newT = [...cur, { id: `tm_${Date.now()}`, name: 'Nama Anggota Tim', role: 'Jabatan / Peran', photo: '', bio: 'Deskripsi keahlian dan peran tim.' }];
                                updateField('aboutSettings.company.teamMembers', newT);
                                notify('✨ Anggota tim baru ditambahkan');
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, background: `${accentColor}18`, border: `1px solid ${accentColor}40`, color: accentColor, fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}
                            >
                              <Plus size={13} />
                              <span>Tambah Anggota</span>
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
                            {(data.aboutSettings?.company?.teamMembers || [
                              { id: 'tm1', name: 'Arif Wicaksono', role: 'Creative Director & Founder', photo: '', bio: 'Memimpin visi kreatif, visual identity, dan arsitektur Warm Tech sumr.day.' },
                              { id: 'tm2', name: 'Nadia Salsabila', role: 'UI/UX & Interaction Designer', photo: '', bio: 'Meracik micro-interactions manis dan antarmuka ramah pengguna.' },
                              { id: 'tm3', name: 'Dimas Pratama', role: 'Web & Systems Craftsman', photo: '', bio: 'Mengembangkan pengalaman web yang gesit, mulus, dan responsif.' }
                            ]).map((tm: any, tIdx: number) => (
                              <div
                                key={tm.id || tIdx}
                                style={{
                                  padding: '18px 16px',
                                  borderRadius: 18,
                                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                  border: `1px solid ${cardBorder}`,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  textAlign: 'center',
                                  gap: 10,
                                  position: 'relative'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newT = (data.aboutSettings?.company?.teamMembers || []).filter((_: any, i: number) => i !== tIdx);
                                    updateField('aboutSettings.company.teamMembers', newT);
                                  }}
                                  style={{ position: 'absolute', top: 10, right: 10, border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                                  title="Hapus Anggota Tim"
                                >
                                  <Trash2 size={12} />
                                </button>

                                {/* Team Member Avatar */}
                                <div style={{ position: 'relative' }}>
                                  <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${accentColor}40` }}>
                                    {tm.photo ? (
                                      <img src={tm.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <User size={30} color={accentColor} />
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => triggerUpload({ type: 'company_team_photo', index: tIdx })}
                                    style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: accentColor, color: '#fff', border: '2px solid var(--cms-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    title="Ganti Foto Anggota Tim"
                                  >
                                    <Camera size={11} />
                                  </button>
                                </div>

                                <div>
                                  <h4
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const newT = [...(data.aboutSettings?.company?.teamMembers || [])];
                                      if (newT[tIdx]) {
                                        newT[tIdx].name = e.currentTarget.textContent || '';
                                        updateField('aboutSettings.company.teamMembers', newT);
                                      }
                                    }}
                                    style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 850, color: textColor, outline: 'none' }}
                                  >
                                    {tm.name}
                                  </h4>
                                  <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const newT = [...(data.aboutSettings?.company?.teamMembers || [])];
                                      if (newT[tIdx]) {
                                        newT[tIdx].role = e.currentTarget.textContent || '';
                                        updateField('aboutSettings.company.teamMembers', newT);
                                      }
                                    }}
                                    style={{ fontSize: 11.5, color: accentColor, fontWeight: 700, outline: 'none', marginTop: 2 }}
                                  >
                                    {tm.role}
                                  </div>
                                </div>

                                <p
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newT = [...(data.aboutSettings?.company?.teamMembers || [])];
                                    if (newT[tIdx]) {
                                      newT[tIdx].bio = e.currentTarget.textContent || '';
                                      updateField('aboutSettings.company.teamMembers', newT);
                                    }
                                  }}
                                  style={{ margin: 0, fontSize: 12, color: subTextColor, lineHeight: 1.5, outline: 'none' }}
                                >
                                  {tm.bio}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 5. PERJALANAN & MILESTONES (COMPANY ROADMAP) */}
                        <div style={{ padding: '26px 28px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                <Briefcase size={17} />
                              </div>
                              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                                Perjalanan & Milestone Perusahaan
                              </h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = data.aboutSettings?.company?.milestones || [];
                                const newM = [...cur, { id: `m_${Date.now()}`, year: '2026', title: 'Pencapaian Baru', description: 'Deskripsi ekspansi dan perkembangan penting.' }];
                                updateField('aboutSettings.company.milestones', newM);
                                notify('✨ Milestone baru ditambahkan');
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, background: `${accentColor}18`, border: `1px solid ${accentColor}40`, color: accentColor, fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}
                            >
                              <Plus size={13} />
                              <span>Tambah Milestone</span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {(data.aboutSettings?.company?.milestones || [
                              { id: 'm1', year: '2022', title: 'Studio Didirikan', description: 'Memulai perjalanan sebagai studio desain independen.' },
                              { id: 'm2', year: '2024', title: 'Ekspansi Layanan', description: 'Memperluas kapabilitas ke perancangan CMS custom dan web app.' }
                            ]).map((mil: any, mIdx: number) => {
                              const isLast = mIdx === (data.aboutSettings?.company?.milestones || []).length - 1;
                              return (
                                <div key={mil.id || mIdx} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: accentColor, boxShadow: `0 0 0 3px ${accentColor}30`, marginTop: 4 }} />
                                    {!isLast && <div style={{ width: 2, flex: 1, background: `${accentColor}25`, marginTop: 6, minHeight: 40 }} />}
                                  </div>

                                  <div style={{ paddingBottom: isLast ? 0 : 22, flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                                      <h3
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const newM = [...(data.aboutSettings?.company?.milestones || [])];
                                          if (newM[mIdx]) {
                                            newM[mIdx].title = e.currentTarget.textContent || '';
                                            updateField('aboutSettings.company.milestones', newM);
                                          }
                                        }}
                                        style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 15.5, fontWeight: 800, color: textColor, outline: 'none' }}
                                      >
                                        {mil.title}
                                      </h3>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span
                                          contentEditable
                                          suppressContentEditableWarning
                                          onBlur={(e) => {
                                            const newM = [...(data.aboutSettings?.company?.milestones || [])];
                                            if (newM[mIdx]) {
                                              newM[mIdx].year = e.currentTarget.textContent || '';
                                              updateField('aboutSettings.company.milestones', newM);
                                            }
                                          }}
                                          style={{ fontSize: 11, fontWeight: 800, color: accentColor, background: `${accentColor}18`, padding: '2px 8px', borderRadius: 100, outline: 'none' }}
                                        >
                                          {mil.year}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newM = (data.aboutSettings?.company?.milestones || []).filter((_: any, i: number) => i !== mIdx);
                                            updateField('aboutSettings.company.milestones', newM);
                                          }}
                                          style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    <p
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newM = [...(data.aboutSettings?.company?.milestones || [])];
                                        if (newM[mIdx]) {
                                          newM[mIdx].description = e.currentTarget.textContent || '';
                                          updateField('aboutSettings.company.milestones', newM);
                                        }
                                      }}
                                      style={{ margin: 0, fontSize: 13, color: subTextColor, lineHeight: 1.6, outline: 'none' }}
                                    >
                                      {mil.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : (
                  /* ════════════════ PERSONAL PROFILE STUDIO (WHEN MODE === 'personal') ════════════════ */
                  <div>
                    {/* 3.1 EXACT HERO BANNER */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        minHeight: isMobileOrTablet ? 180 : 240,
                        background: `linear-gradient(135deg, ${accentColor}cc 0%, ${accentColor}66 100%)`,
                        borderRadius: isMobileOrTablet ? 20 : 28,
                        overflow: 'hidden',
                        marginBottom: 36,
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: isMobileOrTablet ? '24px 20px' : '36px 40px',
                        boxSizing: 'border-box',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                      }}
                    >
                      {/* Avatar silhouette in banner */}
                      {(biodata?.avatarUrl || data?.hero?.heroImage) && (
                        <div style={{ position: 'absolute', bottom: 0, right: 30, width: 180, height: 180, borderRadius: '50% 50% 0 0', overflow: 'hidden', opacity: 0.2, filter: 'grayscale(20%)' }}>
                          <img src={biodata?.avatarUrl || data?.hero?.heroImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <h1
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const val = e.currentTarget.textContent || '';
                            updateBioField('fullName', val);
                          }}
                          style={{
                            margin: 0,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: isMobileOrTablet ? '26px' : 'clamp(32px, 4.5vw, 48px)',
                            fontWeight: 900,
                            letterSpacing: '-1.5px',
                            color: '#ffffff',
                            lineHeight: 1.05,
                            outline: 'none',
                            cursor: 'text',
                          }}
                          title="Klik untuk mengedit Nama Lengkap"
                        >
                          {biodata?.fullName || 'sumr.day'}
                        </h1>

                        <div style={{ fontSize: 15, fontFamily: "'Inter', sans-serif", fontWeight: 600, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const val = e.currentTarget.textContent || '';
                              updateBioField('role', val);
                            }}
                            style={{ outline: 'none', cursor: 'text' }}
                            title="Klik untuk mengedit Profesi"
                          >
                            {biodata?.role || 'Creative Digital Studio • Warm Tech & Skena-Aesthetic'}
                          </span>
                          <ChevronRight size={14} style={{ opacity: 0.6 }} />
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateBioField('company', e.currentTarget.textContent || '')}
                            style={{ outline: 'none', cursor: 'text', opacity: 0.85 }}
                            title="Klik untuk mengedit Perusahaan / Studio"
                          >
                            {biodata?.company || 'sumr.day'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3.2 EXACT MAIN BENTO GRID (SIDEBAR + CONTENT) */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : '300px 1fr', gap: isMobileOrTablet ? 24 : 36, alignItems: 'start' }}>
                      
                      {/* ═══ LEFT SIDEBAR (PROFILE, STATS & CONTACT) ═══ */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        
                        {/* Profile Card */}
                        <div style={{ padding: '24px 20px', textAlign: 'center', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          
                          {/* Avatar with Exact Camera Replacement Button */}
                          <div style={{ position: 'relative' }}>
                            <div
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: `3px solid ${accentColor}60`,
                                margin: '0 auto',
                                boxShadow: `0 8px 24px ${accentColor}30`,
                                background: `${accentColor}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {biodata?.avatarUrl ? (
                                <img src={biodata?.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <User size={40} color={accentColor} />
                              )}
                            </div>

                            {/* Ganti Foto Trigger for /about Avatar */}
                            <button
                              onClick={() => triggerUpload({ type: 'about_avatar' })}
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: accentColor,
                                color: '#ffffff',
                                border: `2px solid ${isDark ? '#0f172a' : '#ffffff'}`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                              }}
                              title="Klik untuk ganti foto profil /about via Cloudinary"
                            >
                              <Camera size={14} />
                            </button>
                          </div>

                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textColor, marginTop: 4 }}>
                            {biodata?.fullName || 'sumr.day'}
                          </div>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 600, color: accentColor }}>
                            {biodata?.role || 'Creative Digital Studio'}
                          </div>

                          {/* Stats Row */}
                          <div style={{ display: 'flex', width: '100%', marginTop: 12, borderTop: `1px solid ${cardBorder}`, paddingTop: 10 }}>
                            <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${cardBorder}` }}>
                              <div style={{ fontSize: 20, fontWeight: 900, color: accentColor }}>{biodata?.experiences?.length || 0}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>Pengalaman</div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${cardBorder}` }}>
                              <div style={{ fontSize: 20, fontWeight: 900, color: accentColor }}>{biodata?.skills?.length || 0}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>Keahlian</div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ fontSize: 20, fontWeight: 900, color: accentColor }}>{biodata?.certifications?.length || 0}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>Sertifikat</div>
                            </div>
                          </div>
                        </div>

                        {/* Contact Card */}
                        <div style={{ padding: '20px 18px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            KONTAK & LOKASI
                          </div>

                          {/* Lokasi */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: `1px solid ${cardBorder}` }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0 }}>
                              <MapPin size={14} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>Lokasi</div>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateBioField('location', e.currentTarget.textContent || '')}
                                style={{ fontSize: 12.5, fontWeight: 600, color: textColor, outline: 'none', display: 'block' }}
                              >
                                {biodata?.location || 'Indonesia / Remote Worldwide'}
                              </span>
                            </div>
                          </div>

                          {/* Email */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: `1px solid ${cardBorder}` }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0 }}>
                              <Mail size={14} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>Email</div>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateBioField('email', e.currentTarget.textContent || '')}
                                style={{ fontSize: 12.5, fontWeight: 600, color: textColor, outline: 'none', display: 'block' }}
                              >
                                {biodata?.email || 'hi.sumrday@gmail.com'}
                              </span>
                            </div>
                          </div>

                          {/* Telepon */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0 }}>
                              <Phone size={14} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: subTextColor, textTransform: 'uppercase' }}>WhatsApp / Telp</div>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateBioField('phone', e.currentTarget.textContent || '')}
                                style={{ fontSize: 12.5, fontWeight: 600, color: textColor, outline: 'none', display: 'block' }}
                              >
                                {biodata?.phone || '+62 812-3456-7890'}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* ═══ RIGHT CONTENT AREA (BIO, EXPERIENCES, EDUCATION, CERTS, SKILLS) ═══ */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        
                        {/* 3.2.1 BIOGRAFI / TENTANG SAYA */}
                        <div style={{ padding: '26px 28px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                              <User size={17} />
                            </div>
                            <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                              Tentang Saya
                            </h2>
                          </div>

                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const val = e.currentTarget.textContent || '';
                              updateBioField('fullBio', val);
                              updateField('profile.fullBio', val);
                            }}
                            style={{
                              margin: 0,
                              fontSize: 14,
                              color: subTextColor,
                              lineHeight: 1.8,
                              outline: 'none',
                              cursor: 'text',
                            }}
                            title="Klik untuk mengedit Deskripsi Biografi Lengkap"
                          >
                            {biodata?.fullBio || data?.profile?.fullBio || biodata?.bio || data?.profile?.bio || DEFAULT_MAIN_WEBSITE_DATA.profile.bio}
                          </p>
                        </div>

                        {/* 3.2.2 PENGALAMAN KERJA */}
                        <div style={{ padding: '26px 28px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                <Briefcase size={17} />
                              </div>
                              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                                Pengalaman Kerja
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                const newExp = [...(biodata?.experiences || []), { id: `exp-${Date.now()}`, period: '2024 - Sekarang', role: 'Posisi Baru', company: 'Nama Perusahaan', description: 'Deskripsi tanggung jawab...' }];
                                updateBioField('experiences', newExp);
                                notify('✨ Pengalaman kerja baru ditambahkan!');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 100,
                                background: `${accentColor}18`,
                                border: `1px solid ${accentColor}40`,
                                color: accentColor,
                                fontWeight: 800,
                                fontSize: 11.5,
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={13} />
                              <span>Tambah Pengalaman</span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {(biodata?.experiences || []).map((exp: any, idx: number) => {
                              const isLast = idx === (biodata?.experiences || []).length - 1;
                              return (
                                <div key={exp.id || idx} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: accentColor, boxShadow: `0 0 0 3px ${accentColor}30`, marginTop: 5 }} />
                                    {!isLast && <div style={{ width: 2, flex: 1, background: `${accentColor}25`, marginTop: 6, minHeight: 40 }} />}
                                  </div>

                                  <div style={{ paddingBottom: isLast ? 0 : 24, flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                                      <h3
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const newExp = [...(biodata?.experiences || [])];
                                          newExp[idx].role = e.currentTarget.textContent || '';
                                          updateBioField('experiences', newExp);
                                        }}
                                        style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textColor, outline: 'none' }}
                                      >
                                        {exp.role || 'Peran / Jabatan'}
                                      </h3>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span
                                          contentEditable
                                          suppressContentEditableWarning
                                          onBlur={(e) => {
                                            const newExp = [...(biodata?.experiences || [])];
                                            newExp[idx].period = e.currentTarget.textContent || '';
                                            updateBioField('experiences', newExp);
                                          }}
                                          style={{ fontSize: 11, fontWeight: 750, color: accentColor, background: `${accentColor}18`, padding: '2px 8px', borderRadius: 100, outline: 'none' }}
                                        >
                                          {exp.period || '2023 - Sekarang'}
                                        </span>
                                        <button
                                          onClick={() => {
                                            const newExp = (biodata?.experiences || []).filter((_: any, i: number) => i !== idx);
                                            updateBioField('experiences', newExp);
                                          }}
                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                                          title="Hapus Pengalaman"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                      <Building2 size={12} color={subTextColor} />
                                      <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const newExp = [...(biodata?.experiences || [])];
                                          newExp[idx].company = e.currentTarget.textContent || '';
                                          updateBioField('experiences', newExp);
                                        }}
                                        style={{ fontSize: 13, fontWeight: 600, color: subTextColor, outline: 'none' }}
                                      >
                                        {exp.company || 'Perusahaan'}
                                      </span>
                                    </div>

                                    <p
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newExp = [...(biodata?.experiences || [])];
                                        newExp[idx].description = e.currentTarget.textContent || '';
                                        updateBioField('experiences', newExp);
                                      }}
                                      style={{ margin: 0, fontSize: 13, color: subTextColor, lineHeight: 1.65, outline: 'none' }}
                                    >
                                      {exp.description || 'Deskripsi peran dan kontribusi...'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3.2.3 RIWAYAT PENDIDIKAN */}
                        <div style={{ padding: '24px 26px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                <GraduationCap size={17} />
                              </div>
                              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                                Pendidikan
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                const newEdu = [...(biodata?.education || []), { id: `edu-${Date.now()}`, period: '2019 - 2023', degree: 'Gelar / Jurusan Baru', institution: 'Universitas / Sekolah', description: 'Fokus studi...' }];
                                updateBioField('education', newEdu);
                                notify('✨ Riwayat pendidikan baru ditambahkan!');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 100,
                                background: `${accentColor}18`,
                                border: `1px solid ${accentColor}40`,
                                color: accentColor,
                                fontWeight: 800,
                                fontSize: 11.5,
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={13} />
                              <span>Tambah Pendidikan</span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {(biodata?.education || []).map((edu: any, idx: number) => {
                              const isLast = idx === (biodata?.education || []).length - 1;
                              return (
                                <div key={edu.id || idx} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: accentColor, boxShadow: `0 0 0 3px ${accentColor}30`, marginTop: 5 }} />
                                    {!isLast && <div style={{ width: 2, flex: 1, background: `${accentColor}25`, marginTop: 6, minHeight: 40 }} />}
                                  </div>

                                  <div style={{ paddingBottom: isLast ? 0 : 24, flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                                      <h3
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const newEdu = [...(biodata?.education || [])];
                                          newEdu[idx].degree = e.currentTarget.textContent || '';
                                          updateBioField('education', newEdu);
                                        }}
                                        style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textColor, outline: 'none' }}
                                      >
                                        {edu.degree || 'Gelar'}
                                      </h3>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span
                                          contentEditable
                                          suppressContentEditableWarning
                                          onBlur={(e) => {
                                            const newEdu = [...(biodata?.education || [])];
                                            newEdu[idx].period = e.currentTarget.textContent || '';
                                            updateBioField('education', newEdu);
                                          }}
                                          style={{ fontSize: 11, fontWeight: 750, color: accentColor, background: `${accentColor}18`, padding: '2px 8px', borderRadius: 100, outline: 'none' }}
                                        >
                                          {edu.period || '2019 - 2023'}
                                        </span>
                                        <button
                                          onClick={() => {
                                            const newEdu = (biodata?.education || []).filter((_: any, i: number) => i !== idx);
                                            updateBioField('education', newEdu);
                                          }}
                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                                          title="Hapus Pendidikan"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                      <GraduationCap size={12} color={subTextColor} />
                                      <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const newEdu = [...(biodata?.education || [])];
                                          newEdu[idx].institution = e.currentTarget.textContent || '';
                                          updateBioField('education', newEdu);
                                        }}
                                        style={{ fontSize: 13, fontWeight: 600, color: subTextColor, outline: 'none' }}
                                      >
                                        {edu.institution || 'Institusi'}
                                      </span>
                                    </div>

                                    <p
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newEdu = [...(biodata?.education || [])];
                                        newEdu[idx].description = e.currentTarget.textContent || '';
                                        updateBioField('education', newEdu);
                                      }}
                                      style={{ margin: 0, fontSize: 13, color: subTextColor, lineHeight: 1.65, outline: 'none' }}
                                    >
                                      {edu.description || 'Deskripsi fokus studi...'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3.2.4 KEAHLIAN / SKILLS */}
                        <div style={{ padding: '24px 26px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                <Sparkles size={17} />
                              </div>
                              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                                Keahlian Personal
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                const newSk = [...(biodata?.skills || []), { id: `sk-${Date.now()}`, name: 'Keahlian Baru', description: 'Deskripsi keahlian...' }];
                                updateBioField('skills', newSk);
                                notify('✨ Keahlian baru ditambahkan!');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 100,
                                background: `${accentColor}18`,
                                border: `1px solid ${accentColor}40`,
                                color: accentColor,
                                fontWeight: 800,
                                fontSize: 11.5,
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={13} />
                              <span>Tambah Keahlian</span>
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : '1fr 1fr', gap: 12 }}>
                            {(biodata?.skills || []).map((sk: any, idx: number) => {
                              const sName = typeof sk === 'string' ? sk : sk.name;
                              const sDesc = typeof sk === 'string' ? '' : sk.description;
                              return (
                                <div
                                  key={sk.id || idx}
                                  style={{
                                    padding: '14px 16px',
                                    borderRadius: 14,
                                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${cardBorder}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    position: 'relative',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor }} />
                                      <h4
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const newSk = [...(biodata?.skills || [])];
                                          if (typeof newSk[idx] === 'string') newSk[idx] = e.currentTarget.textContent || '';
                                          else newSk[idx].name = e.currentTarget.textContent || '';
                                          updateBioField('skills', newSk);
                                        }}
                                        style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: textColor, outline: 'none' }}
                                      >
                                        {sName || 'Keahlian'}
                                      </h4>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const newSk = (biodata?.skills || []).filter((_: any, i: number) => i !== idx);
                                        updateBioField('skills', newSk);
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                                      title="Hapus Keahlian"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <p
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const newSk = [...(biodata?.skills || [])];
                                      if (typeof newSk[idx] !== 'string') {
                                        newSk[idx].description = e.currentTarget.textContent || '';
                                        updateBioField('skills', newSk);
                                      }
                                    }}
                                    style={{ margin: 0, fontSize: 12, color: subTextColor, lineHeight: 1.5, outline: 'none' }}
                                  >
                                    {sDesc || 'Klik untuk menambahkan deskripsi singkat...'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3.2.5 SERTIFIKASI PROFESIONAL */}
                        <div style={{ padding: '24px 26px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                <Award size={17} />
                              </div>
                              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                                Sertifikasi Profesional
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                const newC = [...(biodata?.certifications || []), { id: `cert-${Date.now()}`, year: '2024', name: 'Nama Sertifikat Baru', issuer: 'Penerbit Sertifikasi' }];
                                updateBioField('certifications', newC);
                                notify('✨ Sertifikat baru ditambahkan!');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 100,
                                background: `${accentColor}18`,
                                border: `1px solid ${accentColor}40`,
                                color: accentColor,
                                fontWeight: 800,
                                fontSize: 11.5,
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={13} />
                              <span>Tambah Sertifikat</span>
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : '1fr 1fr', gap: 12 }}>
                            {(biodata?.certifications || []).map((c: any, idx: number) => (
                              <div
                                key={c.id || idx}
                                style={{
                                  padding: '14px 16px',
                                  borderRadius: 14,
                                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                  border: `1px solid ${cardBorder}`,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                                  <h4
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const newC = [...(biodata?.certifications || [])];
                                      newC[idx].name = e.currentTarget.textContent || '';
                                      updateBioField('certifications', newC);
                                    }}
                                    style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 13.5, fontWeight: 800, color: textColor, outline: 'none' }}
                                  >
                                    {c.name || 'Nama Sertifikat'}
                                  </h4>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newC = [...(biodata?.certifications || [])];
                                        newC[idx].issuer = e.currentTarget.textContent || '';
                                        updateBioField('certifications', newC);
                                      }}
                                      style={{ fontSize: 11.5, color: subTextColor, fontWeight: 600, outline: 'none' }}
                                    >
                                      {c.issuer || 'Penerbit'}
                                    </span>
                                    <span style={{ fontSize: 10, color: accentColor, fontWeight: 800 }}>•</span>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const newC = [...(biodata?.certifications || [])];
                                        newC[idx].year = e.currentTarget.textContent || '';
                                        updateBioField('certifications', newC);
                                      }}
                                      style={{ fontSize: 11, color: accentColor, fontWeight: 750, outline: 'none' }}
                                    >
                                      {c.year || '2024'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const newC = (biodata?.certifications || []).filter((_: any, i: number) => i !== idx);
                                    updateBioField('certifications', newC);
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3.2.6 PENGUASAAN BAHASA */}
                        <div style={{ padding: '24px 26px', background: cardBg, backdropFilter: 'blur(16px)', borderRadius: 22, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                                <Languages size={17} />
                              </div>
                              <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textColor }}>
                                Penguasaan Bahasa
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                const newL = [...(biodata?.languages || []), 'Bahasa Baru'];
                                updateBioField('languages', newL);
                                notify('✨ Bahasa baru ditambahkan!');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 100,
                                background: `${accentColor}18`,
                                border: `1px solid ${accentColor}40`,
                                color: accentColor,
                                fontWeight: 800,
                                fontSize: 11.5,
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={13} />
                              <span>Tambah Bahasa</span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {(biodata?.languages || []).map((lang: string, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '8px 16px',
                                  borderRadius: 100,
                                  background: `${accentColor}15`,
                                  border: `1px solid ${accentColor}35`,
                                  color: accentColor,
                                  fontWeight: 750,
                                  fontSize: 13,
                                }}
                              >
                                <span
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newL = [...(biodata?.languages || [])];
                                    newL[idx] = e.currentTarget.textContent || '';
                                    updateBioField('languages', newL);
                                  }}
                                  style={{ outline: 'none' }}
                                >
                                  {lang}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newL = (biodata?.languages || []).filter((_: any, i: number) => i !== idx);
                                    updateBioField('languages', newL);
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, padding: 0 }}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ PAGE 4: KATALOG PRODUK ════════════════ */}
            {activePage === 'catalog' && (
              <div style={{ padding: isMobileOrTablet ? '30px 16px' : '60px 24px', maxWidth: 1240, margin: '0 auto' }}>
                {/* Promo Header Banner */}
                <div
                  style={{
                    padding: isMobileOrTablet ? '20px 18px' : '30px 36px',
                    borderRadius: 24,
                    background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}08)`,
                    border: `1px solid ${accentColor}40`,
                    marginBottom: 28,
                    display: 'flex',
                    flexDirection: isMobileOrTablet ? 'column' : 'row',
                    alignItems: isMobileOrTablet ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ maxWidth: 620 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, background: accentColor, color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
                      <Sparkles size={12} />
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('pagesHeader.catalog.promoBadge', e.currentTarget.textContent || 'PENAWARAN TERBATAS')}
                        style={{ outline: 'none' }}
                      >
                        {data.pagesHeader?.catalog?.promoBadge || 'PENAWARAN TERBATAS'}
                      </span>
                    </div>
                    <h2
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.catalog.title', e.currentTarget.textContent || 'Solusi Kreatif & Layanan Digital')}
                      style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobileOrTablet ? 20 : 28, fontWeight: 900, color: textColor, outline: 'none' }}
                    >
                      {data.pagesHeader?.catalog?.title || 'Solusi Kreatif & Layanan Digital'}
                    </h2>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.catalog.subtitle', e.currentTarget.textContent || 'Koleksi aset desain, template website & jasa kreatif siap pakai untuk mempercepat proyek Anda.')}
                      style={{ margin: '8px 0 0', fontSize: 13.5, color: subTextColor, lineHeight: 1.5, outline: 'none' }}
                    >
                      {data.pagesHeader?.catalog?.subtitle || 'Koleksi aset desain, template website & jasa kreatif siap pakai untuk mempercepat proyek Anda.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ padding: '8px 16px', borderRadius: 14, background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)', border: `1px dashed ${accentColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: subTextColor, textTransform: 'uppercase' }}>KODE VOUCHER</span>
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('pagesHeader.catalog.voucherCode', e.currentTarget.textContent || 'AGENZE50')}
                        style={{ fontSize: 15, fontWeight: 900, color: accentColor, letterSpacing: '0.05em', outline: 'none' }}
                      >
                        {data.pagesHeader?.catalog?.voucherCode || 'AGENZE50'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const newProd = {
                          id: `prod-${Date.now()}`,
                          name: 'Produk / Paket Baru',
                          price: 150000,
                          originalPrice: 250000,
                          badge: 'BEST SELLER',
                          category: 'Template UI',
                          image: '',
                          description: 'Deskripsi paket produk...'
                        };
                        setProducts(prev => [newProd, ...prev]);
                        setIsDirty(true);
                        notify('✨ Kartu produk baru ditambahkan!');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 18px',
                        borderRadius: 100,
                        background: accentColor,
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: `0 4px 14px ${accentColor}40`,
                      }}
                    >
                      <Plus size={15} />
                      <span>Tambah Produk</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Category Filter Chips */}
                {(() => {
                  const uniqueCategories = ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        overflowX: 'auto',
                        paddingBottom: 8,
                        marginBottom: 24,
                        scrollbarWidth: 'none',
                      }}
                    >
                      {uniqueCategories.map((cat) => {
                        const isCatSel = catalogActiveCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setCatalogActiveCategory(cat)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 100,
                              border: `1px solid ${isCatSel ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                              background: isCatSel ? `${accentColor}20` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                              color: isCatSel ? accentColor : textColor,
                              fontSize: 12,
                              fontWeight: isCatSel ? 800 : 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Product Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {products
                    .filter(p => catalogActiveCategory === 'Semua' || p.category === catalogActiveCategory)
                    .map((prod) => (
                    <div key={prod.id} style={{ borderRadius: 22, background: cardBg, border: `1px solid ${cardBorder}`, overflow: 'hidden', padding: 18, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                      <div style={{ width: '100%', height: 170, borderRadius: 14, background: isDark ? '#0f172a' : '#f1f5f9', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {prod.image ? (
                          <img src={prod.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ShoppingBag size={32} opacity={0.4} color={accentColor} />
                        )}

                        {/* Product Badge */}
                        {prod.badge && (
                          <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 100, background: accentColor, color: '#fff', fontSize: 9.5, fontWeight: 800 }}>
                            {prod.badge}
                          </div>
                        )}
                        
                        {/* Edit Pop-up Modal button */}
                        <button
                          onClick={() => setEditingProductModal(prod)}
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 6,
                            padding: '5px 10px',
                            borderRadius: 100,
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(8px)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            fontSize: 10,
                            fontWeight: 750,
                            cursor: 'pointer',
                          }}
                        >
                          Edit Pop-up
                        </button>

                        {/* Multi-Action Image Toolbar for Product Card */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)',
                            padding: '3px 6px',
                            borderRadius: 100,
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          <button
                            onClick={() => triggerUpload({ type: 'product', id: prod.id })}
                            title="Upload Foto (Cloudinary)"
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <Camera size={11} />
                            <span>Upload</span>
                          </button>
                          <button
                            onClick={() => openMediaPicker({ type: 'product', id: prod.id })}
                            title="Pilih dari Galeri Media"
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 5 }}
                          >
                            <ImageIcon size={11} />
                            <span>Galeri</span>
                          </button>
                          {prod.image && (
                            <button
                              onClick={() => handleRemoveImage('product', prod.id)}
                              title="Hapus Foto Produk"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 5 }}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const val = e.currentTarget.textContent || '';
                              setProducts(prev => prev.map(item => item.id === prod.id ? { ...item, category: val } : item));
                              setIsDirty(true);
                            }}
                            style={{ fontSize: 10.5, fontWeight: 800, color: accentColor, textTransform: 'uppercase', outline: 'none' }}
                          >
                            {prod.category || 'Kategori'}
                          </span>
                          <h4
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const val = e.currentTarget.textContent || '';
                              setProducts(prev => prev.map(item => item.id === prod.id ? { ...item, name: val } : item));
                              setIsDirty(true);
                            }}
                            style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15.5, fontWeight: 800, color: textColor, margin: '2px 0 0', outline: 'none' }}
                          >
                            {prod.name || 'Nama Produk'}
                          </h4>
                        </div>
                        <button
                          onClick={() => {
                            setProducts(prev => prev.filter(item => item.id !== prod.id));
                            setIsDirty(true);
                            notify('🗑️ Produk dihapus');
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: accentColor }}>Rp</span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const val = Number(e.currentTarget.textContent?.replace(/[^0-9]/g, '') || 0);
                            setProducts(prev => prev.map(item => item.id === prod.id ? { ...item, price: val } : item));
                            setIsDirty(true);
                          }}
                          style={{ fontSize: 16, fontWeight: 900, color: accentColor, outline: 'none' }}
                        >
                          {Number(prod.price || 0).toLocaleString('id-ID')}
                        </span>
                        {prod.originalPrice && (
                          <span style={{ fontSize: 12, color: subTextColor, textDecoration: 'line-through' }}>
                            Rp {Number(prod.originalPrice).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════ PAGE: DAFTAR HARGA & PAKET JASA (/pricing) ════════════════ */}
            {activePage === 'pricing' && (
              <div style={{ padding: isMobileOrTablet ? '30px 16px' : '60px 24px', maxWidth: 1240, margin: '0 auto' }}>
                {/* Header Banner Showcase Pricing */}
                <div
                  style={{
                    padding: isMobileOrTablet ? '20px 18px' : '32px 36px',
                    borderRadius: 24,
                    background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}08)`,
                    border: `1px solid ${accentColor}40`,
                    marginBottom: 28,
                    display: 'flex',
                    flexDirection: isMobileOrTablet ? 'column' : 'row',
                    alignItems: isMobileOrTablet ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ maxWidth: 680 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: accentColor, color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
                      <Receipt size={12} />
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('pagesHeader.pricing.badge', e.currentTarget.textContent || 'Daftar Harga & Paket Jasa')}
                        style={{ outline: 'none' }}
                      >
                        {data.pagesHeader?.pricing?.badge || 'Daftar Harga & Paket Jasa'}
                      </span>
                    </div>
                    <h2
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.pricing.title', e.currentTarget.textContent || 'Investasi Transparan untuk')}
                      style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobileOrTablet ? 22 : 30, fontWeight: 900, color: textColor, outline: 'none' }}
                    >
                      {data.pagesHeader?.pricing?.title || 'Investasi Transparan untuk'}
                    </h2>
                    <h3
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.pricing.highlight', e.currentTarget.textContent || 'Hasil Maksimal Bisnis Anda')}
                      style={{ 
                        margin: '2px 0 0', 
                        fontFamily: "'Outfit', sans-serif", 
                        fontSize: isMobileOrTablet ? 20 : 28, 
                        fontWeight: 900, 
                        background: `linear-gradient(90deg, ${accentColor}, #38bdf8)`, 
                        WebkitBackgroundClip: 'text', 
                        WebkitTextFillColor: 'transparent',
                        outline: 'none' 
                      }}
                    >
                      {data.pagesHeader?.pricing?.highlight || 'Hasil Maksimal Bisnis Anda'}
                    </h3>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.pricing.description', e.currentTarget.textContent || 'Pilihan paket fleksibel, add-on kustom, serta estimasi durasi terukur untuk kesuksesan proyek digital Anda.')}
                      style={{ margin: '8px 0 0', fontSize: 13.5, color: subTextColor, lineHeight: 1.5, outline: 'none' }}
                    >
                      {data.pagesHeader?.pricing?.description || 'Pilihan paket fleksibel, add-on kustom, serta estimasi durasi terukur untuk kesuksesan proyek digital Anda.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <a
                      href="/pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '10px 18px',
                        borderRadius: 14,
                        background: accentColor,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: `0 4px 16px ${accentColor}40`,
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <Eye size={15} />
                      <span>Buka Halaman Live</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>

                {/* Embedded Live RateCardManager Studio */}
                <div style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: `1px solid ${cardBorder}`,
                  background: isDark ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
                  boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.35)' : '0 8px 24px rgba(15,23,42,0.06)'
                }}>
                  <RateCardManager
                    notify={notify}
                    confirm={(opts: any) => {
                      if (typeof opts === 'string') {
                        confirm(opts, () => {});
                      } else if (opts?.message && opts?.onConfirm) {
                        confirm(opts.message, opts.onConfirm);
                      }
                    }}
                    isDarkMode={isDark}
                  />
                </div>
              </div>
            )}

            {/* ════════════════ PAGE: KATALOG GAME (/games) ════════════════ */}
            {activePage === 'games' && (
              <div style={{ padding: isMobileOrTablet ? '30px 16px' : '60px 24px', maxWidth: 1240, margin: '0 auto' }}>
                {/* Header Banner Showcase Games */}
                <div
                  style={{
                    padding: isMobileOrTablet ? '20px 18px' : '32px 36px',
                    borderRadius: 24,
                    background: `linear-gradient(135deg, ${accentColor}25, #3b82f615)`,
                    border: `1px solid ${accentColor}40`,
                    marginBottom: 28,
                    display: 'flex',
                    flexDirection: isMobileOrTablet ? 'column' : 'row',
                    alignItems: isMobileOrTablet ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ maxWidth: 680 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: accentColor, color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
                      <Sparkles size={12} />
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateField('pagesHeader.games.badge', e.currentTarget.textContent || 'Interactive Event Activation Games')}
                        style={{ outline: 'none' }}
                      >
                        {data.pagesHeader?.games?.badge || 'Interactive Event Activation Games'}
                      </span>
                    </div>
                    <h2
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.games.title', e.currentTarget.textContent || 'Koleksi Game Kustom untuk')}
                      style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobileOrTablet ? 22 : 30, fontWeight: 900, color: textColor, outline: 'none' }}
                    >
                      {data.pagesHeader?.games?.title || 'Koleksi Game Kustom untuk'}
                    </h2>
                    <h3
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.games.highlight', e.currentTarget.textContent || 'Aktivasi Event & Booth Brand Anda')}
                      style={{ 
                        margin: '2px 0 0', 
                        fontFamily: "'Outfit', sans-serif", 
                        fontSize: isMobileOrTablet ? 20 : 28, 
                        fontWeight: 900, 
                        background: `linear-gradient(135deg, ${accentColor}, #3b82f6)`, 
                        WebkitBackgroundClip: 'text', 
                        WebkitTextFillColor: 'transparent',
                        outline: 'none' 
                      }}
                    >
                      {data.pagesHeader?.games?.highlight || 'Aktivasi Event & Booth Brand Anda'}
                    </h3>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.games.description', e.currentTarget.textContent || 'Tingkatkan keterlibatan pengunjung di pameran, mal, expo, dan festival dengan game interaktif responsif berbasis HTML5.')}
                      style={{ margin: '10px 0 0', fontSize: 13.5, color: subTextColor, lineHeight: 1.5, outline: 'none' }}
                    >
                      {data.pagesHeader?.games?.description || 'Tingkatkan keterlibatan pengunjung di pameran, mal, expo, dan festival dengan game interaktif responsif berbasis HTML5. Tersedia opsi Sewa Lisensi Event atau Beli Putus (Hak Download Offline DRM-free).'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <button
                      onClick={async () => {
                        const newGame: Partial<GameInstance> = {
                          title: 'Game Aktivasi Event Baru',
                          slug: `game-${Date.now()}`,
                          engineType: 'HTML5 Single File (Event Activation)',
                          description: 'Game interaktif event siap dimainkan di tablet kiosk atau smartphone pengunjung.',
                          thumbnailUrl: '',
                          clientLicenses: [],
                          createdAt: Date.now(),
                          updatedAt: Date.now()
                        };
                        try {
                          const created = await saveGameInstance(newGame);
                          setGames(prev => [created, ...prev]);
                          notify('🎮 Game baru berhasil ditambahkan!');
                        } catch (err: any) {
                          notify('Gagal menambah game: ' + (err.message || 'Error'), 'error');
                        }
                      }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#fff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: `0 4px 14px ${accentColor}40`,
                      }}
                    >
                      <Plus size={15} /> Tambah Game Baru
                    </button>
                  </div>
                </div>

                {/* Grid Game Items */}
                {games.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 20, background: cardBg, border: `1px dashed ${cardBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <LayoutGrid size={40} color={subTextColor} style={{ opacity: 0.5, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textColor }}>Belum Ada Game di Katalog</h4>
                    <p style={{ margin: '6px 0 16px', fontSize: 13, color: subTextColor }}>Tambahkan game baru untuk ditampilkan di etalase publik /games</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {games.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          borderRadius: 22,
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)',
                          position: 'relative'
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{ width: '100%', height: 180, position: 'relative', background: isDark ? '#0f172a' : '#f1f5f9', overflow: 'hidden' }}>
                          {g.thumbnailUrl ? (
                            <img src={g.thumbnailUrl} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: subTextColor }}>
                              <LayoutGrid size={36} opacity={0.4} color={accentColor} />
                              <span style={{ fontSize: 11, fontWeight: 700 }}>Tanpa Thumbnail</span>
                            </div>
                          )}

                          {/* Quick Edit Thumbnail Button */}
                          <button
                            onClick={() => {
                              setEditingGameModal(g);
                            }}
                            style={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              padding: '5px 12px',
                              borderRadius: 100,
                              background: 'rgba(0,0,0,0.75)',
                              backdropFilter: 'blur(8px)',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.2)',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            <Camera size={12} /> Edit Media
                          </button>

                          <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 100, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                            {g.engineType}
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <h4
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={async (e) => {
                                const val = e.currentTarget.textContent || g.title;
                                try {
                                  await saveGameInstance({ ...g, title: val });
                                  notify('Judul game diperbarui!');
                                } catch (err) {}
                              }}
                              style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textColor, outline: 'none' }}
                            >
                              {g.title}
                            </h4>
                            <button
                              onClick={() => {
                                confirm(`Hapus game "${g.title}" dari katalog?`, async () => {
                                  try {
                                    await deleteGameInstance(g.id);
                                    setGames(prev => prev.filter(item => item.id !== g.id));
                                    notify('🗑️ Game berhasil dihapus');
                                  } catch (err: any) {
                                    notify('Gagal menghapus game: ' + err.message, 'error');
                                  }
                                });
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, padding: 4 }}
                              title="Hapus Game"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            <span style={{
                              fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', padding: '1px 6px', borderRadius: 4,
                              background: g.pricingTier === 'premium' ? 'rgba(236,72,153,0.2)' : g.pricingTier === 'plus' ? 'rgba(59,130,246,0.2)' : g.pricingTier === 'free' ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.2)',
                              color: g.pricingTier === 'premium' ? '#f472b6' : g.pricingTier === 'plus' ? '#60a5fa' : g.pricingTier === 'free' ? '#34d399' : '#facc15',
                              border: '1px solid currentColor'
                            }}>
                              {g.pricingTier || 'basic'}
                            </span>
                            {g.category && (
                              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${accentColor}20`, color: accentColor, fontWeight: 700 }}>
                                {g.category}
                              </span>
                            )}
                            {g.tags?.slice(0, 2).map((t, idx) => (
                              <span key={idx} style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: subTextColor }}>
                                #{t}
                              </span>
                            ))}
                          </div>

                          <span style={{ fontSize: 11.5, color: accentColor, marginTop: 4, fontFamily: 'monospace' }}>
                            /{g.slug}
                          </span>

                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={async (e) => {
                              const val = e.currentTarget.textContent || '';
                              try {
                                await saveGameInstance({ ...g, description: val });
                                notify('Deskripsi game diperbarui!');
                              } catch (err) {}
                            }}
                            style={{ fontSize: 12.5, color: subTextColor, margin: '10px 0', lineHeight: 1.5, flex: 1, outline: 'none' }}
                          >
                            {g.description || 'Klik untuk mengisi deskripsi gameplay dan fitur aktivasi event.'}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${cardBorder}` }}>
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={12} /> Ready to Play
                            </span>
                            <button
                              onClick={() => setEditingGameModal(g)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: `${accentColor}18`,
                                border: `1px solid ${accentColor}30`,
                                color: accentColor,
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Edit Detail →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ PAGE 5: BLOG & ARTIKEL ════════════════ */}
            {activePage === 'blog' && (
              <div style={{ padding: isMobileOrTablet ? '30px 16px' : '60px 24px', maxWidth: 1240, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.blog.badge', e.currentTarget.textContent || 'Jurnal & Publikasi')}
                      style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', outline: 'none' }}
                    >
                      {data.pagesHeader?.blog?.badge || 'JURNAL & PUBLIKASI ARTIKEL'}
                    </span>
                    <h1
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('pagesHeader.blog.title', e.currentTarget.textContent || 'Ide, Wawasan & Catatan Eksplorasi')}
                      style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobileOrTablet ? 24 : 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: textColor, margin: '6px 0 0', outline: 'none' }}
                    >
                      {data.pagesHeader?.blog?.title || 'Ide, Wawasan & Catatan Eksplorasi'}
                    </h1>
                  </div>

                  <button
                    onClick={() => {
                      const newPost = {
                        id: `blog-${Date.now()}`,
                        title: 'Judul Artikel Baru',
                        excerpt: 'Pratinjau ringkasan artikel menarik...',
                        content: 'Isi lengkap artikel...',
                        category: 'Desain',
                        coverImage: '',
                        date: new Date().toISOString()
                      };
                      setBlogPosts(prev => [newPost, ...prev]);
                      setIsDirty(true);
                      notify('✨ Kartu artikel baru ditambahkan!');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 100,
                      background: accentColor,
                      color: '#ffffff',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12.5,
                      fontWeight: 750,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: `0 4px 14px ${accentColor}40`,
                    }}
                  >
                    <Plus size={15} />
                    <span>Tambah Kartu Artikel</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {blogPosts.map((post) => (
                    <div key={post.id} style={{ borderRadius: 22, background: cardBg, border: `1px solid ${cardBorder}`, overflow: 'hidden', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                      <div style={{ width: '100%', height: 160, borderRadius: 14, background: isDark ? '#0f172a' : '#f1f5f9', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <FileText size={32} opacity={0.4} color={accentColor} />
                        )}
                        
                        <button
                          onClick={() => setEditingBlogModal(post)}
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 6,
                            padding: '4px 8px',
                            borderRadius: 100,
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(8px)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Edit Artikel
                        </button>

                        {/* Multi-Action Image Toolbar for Blog Card */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)',
                            padding: '3px 6px',
                            borderRadius: 100,
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          <button
                            onClick={() => triggerUpload({ type: 'blog', id: post.id })}
                            title="Upload Cover (Cloudinary)"
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <Camera size={11} />
                            <span>Upload</span>
                          </button>
                          <button
                            onClick={() => openMediaPicker({ type: 'blog', id: post.id })}
                            title="Pilih dari Galeri Media"
                            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 10, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 5 }}
                          >
                            <ImageIcon size={11} />
                            <span>Galeri</span>
                          </button>
                          {post.coverImage && (
                            <button
                              onClick={() => handleRemoveImage('blog', post.id)}
                              title="Hapus Cover Artikel"
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 5 }}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const val = e.currentTarget.textContent || '';
                            setBlogPosts(prev => prev.map(item => item.id === post.id ? { ...item, title: val } : item));
                            setIsDirty(true);
                          }}
                          style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textColor, margin: 0, outline: 'none' }}
                        >
                          {post.title || 'Judul Artikel'}
                        </h4>
                        <button
                          onClick={() => {
                            setBlogPosts(prev => prev.filter(item => item.id !== post.id));
                            setIsDirty(true);
                            notify('🗑️ Artikel dihapus');
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const val = e.currentTarget.textContent || '';
                          setBlogPosts(prev => prev.map(item => item.id === post.id ? { ...item, excerpt: val } : item));
                          setIsDirty(true);
                        }}
                        style={{ fontSize: 12.5, color: subTextColor, margin: 0, lineHeight: 1.6, outline: 'none' }}
                      >
                        {post.excerpt || post.description || 'Pratinjau artikel...'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════ PAGE 6: BIO LINKS ════════════════ */}
            {activePage === 'links' && (
              <div style={{ padding: isMobileOrTablet ? '30px 16px' : '60px 24px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ width: 84, height: 84, borderRadius: '50%', background: `${accentColor}25`, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {biodata?.avatarUrl || data.hero?.heroImage ? <img src={biodata?.avatarUrl || data.hero?.heroImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={34} color={accentColor} />}
                </div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: textColor, margin: '0 0 4px' }}>{biodata?.fullName || data.hero?.headline || 'sumr.day'}</h2>
                <p style={{ fontSize: 13, color: subTextColor, margin: '0 0 24px' }}>{biodata?.role || data.hero?.subheadline || 'Creative Digital Studio • Warm Tech & Skena-Aesthetic'}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bioLinks.map((link, idx) => (
                    <div key={link.id || idx} style={{ padding: '10px 18px', borderRadius: 100, background: cardBg, border: `1px solid ${cardBorder}`, color: textColor, fontWeight: 800, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        {/* Interactive Link Icon */}
                        <div
                          onClick={() => setIconPickerTarget({
                            type: 'link',
                            index: idx,
                            currentIcon: link.icon || 'Link2',
                            title: `Pilih Ikon untuk "${link.title || link.label || 'Tautan'}"`
                          })}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: `${accentColor}18`,
                            color: accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            border: `1px solid ${accentColor}30`,
                            position: 'relative',
                          }}
                          title="Klik untuk memilih ikon tautan"
                        >
                          {renderDynamicIcon(link.icon || 'Link2', 17, Link2)}
                        </div>

                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const val = e.currentTarget.textContent || '';
                            setBioLinks(prev => prev.map((item, i) => i === idx ? { ...item, title: val, label: val } : item));
                            setIsDirty(true);
                          }}
                          style={{ outline: 'none', cursor: 'text', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {link.title || link.label || 'Tautan'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => {
                            const newUrl = prompt('Masukkan URL tautan:', link.url || 'https://');
                            if (newUrl !== null) {
                              setBioLinks(prev => prev.map((item, i) => i === idx ? { ...item, url: newUrl } : item));
                              setIsDirty(true);
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: accentColor, cursor: 'pointer', padding: 2 }}
                          title={`URL: ${link.url || '#'}`}
                        >
                          <Link2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setBioLinks(prev => prev.filter((_, i) => i !== idx));
                            setIsDirty(true);
                            notify('🗑️ Tautan dihapus');
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const newL = { id: `link-${Date.now()}`, title: 'Tautan Baru', url: 'https://' };
                      setBioLinks(prev => [...prev, newL]);
                      setIsDirty(true);
                      notify('✨ Tautan bio baru ditambahkan!');
                    }}
                    style={{
                      padding: 14,
                      borderRadius: 100,
                      border: `2px dashed ${accentColor}50`,
                      background: `${accentColor}10`,
                      color: accentColor,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <Plus size={15} />
                    <span>Tambah Tautan Bio</span>
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════ PAGE: SOCIAL UPDATES FEED ════════════════ */}
            {activePage === 'updates' && (
              <div style={{ padding: isMobileOrTablet ? '20px 14px' : '36px 24px', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                <div style={{
                  marginBottom: 24,
                  padding: '18px 22px',
                  borderRadius: 20,
                  background: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                  border: `1px solid ${accentColor}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 100, background: `${accentColor}25`, color: accentColor, fontSize: 10.5, fontWeight: 850, letterSpacing: '0.05em' }}>
                        HALAMAN UTAMA
                      </span>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: textColor, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={18} color={accentColor} />
                        Manajemen Update & Aktivitas
                      </h2>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: subTextColor, lineHeight: 1.5 }}>
                      Kelola postingan progres, utas kilat, dan pengumuman yang tampil di Beranda (1 dipin) dan halaman publik <code>/updates</code>.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <a
                      href="/updates"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 100,
                        background: `${accentColor}18`,
                        color: accentColor,
                        fontSize: 12,
                        fontWeight: 800,
                        textDecoration: 'none',
                        border: `1px solid ${accentColor}30`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Lihat Halaman (/updates)</span>
                    </a>
                  </div>
                </div>

                <UpdatesFeedManager
                  notify={notify}
                  confirm={(opts) => confirm(opts.message || opts.title, opts.onConfirm)}
                />
              </div>
            )}

            {/* ════════════════ PAGE 7+: DYNAMIC CUSTOM PAGES ════════════════ */}
            {(() => {
              const customPage = (data.customPages || []).find((cp: any) => cp.id === activePage || cp.slug === activePage);
              if (!customPage) return null;

              return (
                <div style={{ padding: isMobileOrTablet ? '30px 16px' : '50px 24px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                  {/* Top Bar Settings for Custom Page */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: isMobileOrTablet ? '14px 14px' : '16px 20px',
                    borderRadius: 20,
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${cardBorder}`,
                    marginBottom: 28,
                  }}>
                    {/* Row 1: URL Badge & Action Links | Right: Delete Button */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                      paddingBottom: 12,
                      borderBottom: `1px solid ${cardBorder}`
                    }}>
                      {/* Left: URL Badge & Link */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 900, color: accentColor, background: `${accentColor}18`, padding: '4px 10px', borderRadius: 8 }}>
                          URL: /p/{customPage.slug}
                        </span>
                        <a
                          href={`/p/${customPage.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: subTextColor, textDecoration: 'none' }}
                        >
                          <ExternalLink size={13} />
                          <span>Buka Halaman</span>
                        </a>
                      </div>

                      {/* Right: Delete Custom Page Button */}
                      <button
                        type="button"
                        onClick={() => {
                          confirm(`Hapus halaman "${customPage.title}"?`, () => {
                            const filtered = (data.customPages || []).filter((cp: any) => cp.id !== customPage.id);
                            updateField('customPages', filtered);
                            setActivePage('home');
                            setIsDirty(true);
                            notify('Halaman berhasil dihapus');
                          });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 12px',
                          borderRadius: 10,
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: 'none',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Hapus Halaman</span>
                      </button>
                    </div>

                    {/* Row 2: Navbar Group Selector & Navbar Switch (Strictly 1 Single Row on Mobile) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'nowrap',
                      gap: 8,
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      {/* Left Control: Navbar Dynamic Groups Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: subTextColor, whiteSpace: 'nowrap', flexShrink: 0 }}>Navbar:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenNavbarPresetDropdown(!openNavbarPresetDropdown);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                            padding: '5px 10px',
                            borderRadius: 100,
                            fontSize: 11.5,
                            fontWeight: 800,
                            background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                            border: `1px solid ${openNavbarPresetDropdown ? accentColor : cardBorder}`,
                            color: textColor,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            transition: 'all 0.2s',
                            minWidth: 0,
                            maxWidth: isMobileOrTablet ? 145 : 220
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(() => {
                              const preset = customPage.navbarPreset || 'global';
                              if (preset === 'global') return 'Global (Default)';
                              if (preset === 'hidden') return 'Sembunyikan';
                              const groups: any[] = data.customNavbarGroups || [];
                              const match = groups.find(g => g.id === preset);
                              return match?.name || (preset === 'custom' ? 'Grup Kustom' : 'Global');
                            })()}
                          </span>
                          <ChevronDown size={13} style={{ flexShrink: 0, color: subTextColor, transform: openNavbarPresetDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>

                        {/* Custom Floating Popover Menu with Dynamic Groups */}
                        {openNavbarPresetDropdown && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 8px)',
                              left: 0,
                              minWidth: 240,
                              maxWidth: 290,
                              background: isDark ? '#0f172a' : '#ffffff',
                              borderRadius: 16,
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                              padding: 6,
                              zIndex: 99999,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3,
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              animation: 'fadeIn 0.15s ease-out'
                            }}
                          >
                            <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 900, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              PILIHAN NAVBAR HALAMAN
                            </div>

                            {/* 1. Global Navbar */}
                            <div
                              onClick={() => {
                                const updatedCustom = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, navbarPreset: 'global' } : cp);
                                updateField('customPages', updatedCustom);
                                setIsDirty(true);
                                setOpenNavbarPresetDropdown(false);
                                notify('Navbar: Global Situs');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: 10,
                                background: (customPage.navbarPreset || 'global') === 'global' ? `${accentColor}18` : 'transparent',
                                color: (customPage.navbarPreset || 'global') === 'global' ? accentColor : textColor,
                                fontSize: 12,
                                fontWeight: (customPage.navbarPreset || 'global') === 'global' ? 850 : 600,
                                cursor: 'pointer',
                                transition: 'background 0.15s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <Globe size={14} color={accentColor} />
                                <span>Navbar Global (Default)</span>
                              </div>
                              {(customPage.navbarPreset || 'global') === 'global' && <Check size={14} color={accentColor} />}
                            </div>

                            {/* 2. User-Created Custom Navbar Groups */}
                            {(data.customNavbarGroups || []).map((grp: any) => {
                              const isSelected = customPage.navbarPreset === grp.id;
                              return (
                                <div
                                  key={grp.id}
                                  onClick={() => {
                                    const updatedCustom = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, navbarPreset: grp.id } : cp);
                                    updateField('customPages', updatedCustom);
                                    setIsDirty(true);
                                    setOpenNavbarPresetDropdown(false);
                                    notify(`Navbar: ${grp.name}`);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    background: isSelected ? `${accentColor}18` : 'transparent',
                                    color: isSelected ? accentColor : textColor,
                                    fontSize: 12,
                                    fontWeight: isSelected ? 850 : 600,
                                    cursor: 'pointer',
                                    transition: 'background 0.15s'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <Menu size={14} color={accentColor} />
                                    <span>{grp.name}</span>
                                  </div>
                                  {isSelected && <Check size={14} color={accentColor} />}
                                </div>
                              );
                            })}

                            {/* 3. Action: Buat Grup Navbar Baru (Icon Only Plus) */}
                            <div style={{ borderTop: `1px solid ${cardBorder}`, paddingTop: 6, marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const newGrpId = `grp_${Date.now()}`;
                                  const currentGroups = data.customNavbarGroups || [];
                                  const newGroup = {
                                    id: newGrpId,
                                    name: `Grup Navbar ${currentGroups.length + 1}`,
                                    items: [
                                      { id: `nav_${Date.now()}_1`, label: 'Beranda', url: '/' },
                                      { id: `nav_${Date.now()}_2`, label: 'Layanan', url: '#pricing' },
                                      { id: `nav_${Date.now()}_3`, label: 'Kontak', url: '#contact' }
                                    ]
                                  };
                                  updateField('customNavbarGroups', [...currentGroups, newGroup]);
                                  const updatedCustom = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, navbarPreset: newGrpId } : cp);
                                  updateField('customPages', updatedCustom);
                                  setIsDirty(true);
                                  setOpenNavbarPresetDropdown(false);
                                  notify(`✨ ${newGroup.name} berhasil dibuat!`);
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '8px 12px',
                                  borderRadius: 10,
                                  background: `${accentColor}15`,
                                  color: accentColor,
                                  border: `1px dashed ${accentColor}50`,
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                <Plus size={14} />
                                <span>Buat Grup Navbar Baru</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Control: Redesigned Switch: Menu Navbar */}
                      <div
                        onClick={() => {
                          const newChecked = customPage.showInNavbar === false;
                          const updatedCustom = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, showInNavbar: newChecked } : cp);
                          updateField('customPages', updatedCustom);
                          setIsDirty(true);
                          notify(newChecked ? 'Ditampilkan di Navbar' : 'Disembunyikan dari Navbar');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          userSelect: 'none',
                          padding: '4px 10px 4px 6px',
                          borderRadius: 100,
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          border: `1px solid ${cardBorder}`,
                          flexShrink: 0
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 17,
                            borderRadius: 100,
                            background: customPage.showInNavbar !== false ? accentColor : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                            position: 'relative',
                            transition: 'background 0.2s',
                            flexShrink: 0
                          }}
                        >
                          <div
                            style={{
                              width: 11,
                              height: 11,
                              borderRadius: '50%',
                              background: '#ffffff',
                              position: 'absolute',
                              top: 3,
                              left: customPage.showInNavbar !== false ? 16 : 3,
                              transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 750, color: textColor, whiteSpace: 'nowrap' }}>Menu Navbar</span>
                      </div>
                    </div>

                    {/* Active Custom Navbar Group Editor */}
                    {(() => {
                      const preset = customPage.navbarPreset;
                      if (!preset || preset === 'global' || preset === 'hidden') return null;

                      const groups: any[] = data.customNavbarGroups || [];
                      const activeGroup = groups.find(g => g.id === preset) || (preset === 'custom' ? { id: 'custom', name: 'Grup Kustom Halaman', items: customPage.customNavItems || [{ id: '1', label: 'Beranda', url: '/' }, { id: '2', label: 'Konsultasi', url: '#contact' }] } : null);

                      if (!activeGroup) return null;

                      return (
                        <div style={{
                          padding: isMobileOrTablet ? '14px 14px' : '16px 20px',
                          borderRadius: 20,
                          background: `${accentColor}0e`,
                          border: `1.5px dashed ${accentColor}40`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
                          {/* Group Header & Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
                              <Menu size={16} color={accentColor} style={{ flexShrink: 0 }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                                <span style={{ fontSize: 9.5, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>NAMA GRUP NAVBAR:</span>
                                <input
                                  type="text"
                                  value={activeGroup.name}
                                  placeholder="Nama Grup Navbar"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, name: val } : g);
                                    updateField('customNavbarGroups', updatedGroups);
                                    setIsDirty(true);
                                  }}
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 850,
                                    color: textColor,
                                    background: isDark ? '#1e293b' : '#ffffff',
                                    border: `1px solid ${cardBorder}`,
                                    padding: '5px 10px',
                                    borderRadius: 10,
                                    outline: 'none',
                                    width: '100%',
                                    maxWidth: 260,
                                    boxSizing: 'border-box'
                                  }}
                                />
                              </div>
                            </div>

                            {/* Action Buttons: Tambah Link & Hapus Grup */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const newNavItem = { id: `nav_${Date.now()}`, label: 'Menu Baru', url: '#' };
                                  const updatedItems = [...(activeGroup.items || []), newNavItem];
                                  const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, items: updatedItems } : g);
                                  updateField('customNavbarGroups', updatedGroups);
                                  setIsDirty(true);
                                  notify('Link menu baru ditambahkan');
                                }}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 100,
                                  background: accentColor,
                                  color: '#fff',
                                  border: 'none',
                                  fontSize: 11.5,
                                  fontWeight: 850,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  boxShadow: `0 4px 12px ${accentColor}35`
                                }}
                              >
                                <Plus size={13} />
                                <span>Tambah Link Menu</span>
                              </button>

                              {activeGroup.id !== 'custom' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filteredGroups = groups.filter(g => g.id !== activeGroup.id);
                                    updateField('customNavbarGroups', filteredGroups);
                                    const updatedCustom = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, navbarPreset: 'global' } : cp);
                                    updateField('customPages', updatedCustom);
                                    setIsDirty(true);
                                    notify(`Grup ${activeGroup.name} dihapus`);
                                  }}
                                  title="Hapus Grup Navbar Ini"
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: 100,
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: 'none',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Hapus Grup
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Link & Sub-Menu Items */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                            {(activeGroup.items || []).map((item: any, nIdx: number) => {
                              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                              return (
                                <div
                                  key={item.id || nIdx}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    padding: '8px 12px',
                                    borderRadius: 14,
                                    background: isDark ? '#1e293b' : '#ffffff',
                                    border: `1px solid ${hasChildren ? `${accentColor}50` : cardBorder}`,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                  }}
                                >
                                  {/* Parent Menu Row (Strictly 1 Row with Widened Title) */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'nowrap',
                                    gap: 8,
                                    width: '100%'
                                  }}>
                                    {/* Left: Icon, Widened Label Input, Bullet, URL Input */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                      {hasChildren ? (
                                        <ChevronDown size={14} color={accentColor} style={{ flexShrink: 0 }} />
                                      ) : (
                                        <Globe size={13} color={subTextColor} style={{ flexShrink: 0 }} />
                                      )}
                                      <input
                                        type="text"
                                        value={item.label}
                                        placeholder="Judul Menu"
                                        title="Judul Menu Utama"
                                        onChange={(e) => {
                                          const updatedItems = (activeGroup.items || []).map((it: any, k: number) => k === nIdx ? { ...it, label: e.target.value } : it);
                                          const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, items: updatedItems } : g);
                                          updateField('customNavbarGroups', updatedGroups);
                                          setIsDirty(true);
                                        }}
                                        style={{
                                          width: isMobileOrTablet ? 110 : 150,
                                          flexShrink: 0,
                                          border: 'none',
                                          background: 'transparent',
                                          fontSize: 12.5,
                                          fontWeight: 850,
                                          color: textColor,
                                          outline: 'none'
                                        }}
                                      />
                                      <span style={{ color: subTextColor, fontSize: 10, flexShrink: 0 }}>•</span>
                                      <input
                                        type="text"
                                        value={item.url || ''}
                                        placeholder="URL"
                                        title="Alamat Link"
                                        onChange={(e) => {
                                          const updatedItems = (activeGroup.items || []).map((it: any, k: number) => k === nIdx ? { ...it, url: e.target.value } : it);
                                          const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, items: updatedItems } : g);
                                          updateField('customNavbarGroups', updatedGroups);
                                          setIsDirty(true);
                                        }}
                                        style={{
                                          flex: 1,
                                          minWidth: 40,
                                          border: 'none',
                                          background: 'transparent',
                                          fontSize: 11.5,
                                          color: subTextColor,
                                          outline: 'none',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}
                                      />
                                    </div>

                                    {/* Right: Circular + (Tambah Sub Menu) & Circular X (Hapus) */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const currentChildren = item.children || [];
                                          const newChild = { id: `sub_${Date.now()}`, label: 'Sub Menu', url: '#' };
                                          const updatedItems = (activeGroup.items || []).map((it: any, k: number) => k === nIdx ? { ...it, type: 'dropdown', children: [...currentChildren, newChild] } : it);
                                          const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, items: updatedItems } : g);
                                          updateField('customNavbarGroups', updatedGroups);
                                          setIsDirty(true);
                                          notify(`Sub-menu ditambahkan ke ${item.label || 'Menu'}`);
                                        }}
                                        title="Tambah Sub Menu (Dropdown)"
                                        style={{
                                          width: 26,
                                          height: 26,
                                          minWidth: 26,
                                          minHeight: 26,
                                          aspectRatio: '1 / 1',
                                          flexShrink: 0,
                                          padding: 0,
                                          borderRadius: '50%',
                                          background: `${accentColor}18`,
                                          color: accentColor,
                                          border: `1.5px solid ${accentColor}40`,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          boxSizing: 'border-box',
                                          transition: 'all 0.15s'
                                        }}
                                      >
                                        <Plus size={13} style={{ flexShrink: 0 }} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedItems = (activeGroup.items || []).filter((_: any, k: number) => k !== nIdx);
                                          const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, items: updatedItems } : g);
                                          updateField('customNavbarGroups', updatedGroups);
                                          setIsDirty(true);
                                        }}
                                        title="Hapus Menu Ini"
                                        style={{
                                          width: 26,
                                          height: 26,
                                          minWidth: 26,
                                          minHeight: 26,
                                          aspectRatio: '1 / 1',
                                          flexShrink: 0,
                                          padding: 0,
                                          borderRadius: '50%',
                                          background: 'rgba(239, 68, 68, 0.12)',
                                          border: 'none',
                                          color: '#ef4444',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          boxSizing: 'border-box',
                                          transition: 'all 0.15s'
                                        }}
                                      >
                                        <X size={13} style={{ flexShrink: 0 }} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Nested Sub-Menu List (If Children Exist) */}
                                  {hasChildren && (
                                    <div style={{
                                      marginLeft: 8,
                                      paddingLeft: 10,
                                      borderLeft: `2px solid ${accentColor}40`,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 4,
                                      paddingTop: 4
                                    }}>
                                      <span style={{ fontSize: 9.5, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        SUB MENU:
                                      </span>
                                      {item.children.map((child: any, cIdx: number) => (
                                        <div
                                          key={child.id || cIdx}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'nowrap',
                                            gap: 6,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                                            border: `1px solid ${cardBorder}`
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: 11, color: accentColor, flexShrink: 0 }}>↳</span>
                                            <input
                                              type="text"
                                              value={child.label}
                                              placeholder="Judul Sub Menu"
                                              title="Teks Sub Menu"
                                              onChange={(e) => {
                                                const updatedChildren = item.children.map((c: any, ck: number) => ck === cIdx ? { ...c, label: e.target.value } : c);
                                                const updatedItems = (activeGroup.items || []).map((it: any, k: number) => k === nIdx ? { ...it, children: updatedChildren } : it);
                                                const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, items: updatedItems } : g);
                                                updateField('customNavbarGroups', updatedGroups);
                                                setIsDirty(true);
                                              }}
                                              style={{ width: isMobileOrTablet ? 95 : 130, flexShrink: 0, border: 'none', background: 'transparent', fontSize: 11.5, fontWeight: 800, color: textColor, outline: 'none' }}
                                            />
                                            <span style={{ color: subTextColor, fontSize: 10, flexShrink: 0 }}>•</span>
                                            <input
                                              type="text"
                                              value={child.url || ''}
                                              placeholder="URL Sub"
                                              title="Alamat Link Sub Menu"
                                              onChange={(e) => {
                                                const updatedChildren = item.children.map((c: any, ck: number) => ck === cIdx ? { ...c, url: e.target.value } : c);
                                                const updatedItems = (activeGroup.items || []).map((it: any, k: number) => k === nIdx ? { ...it, children: updatedChildren } : it);
                                                const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, items: updatedItems } : g);
                                                updateField('customNavbarGroups', updatedGroups);
                                                setIsDirty(true);
                                              }}
                                              style={{ flex: 1, minWidth: 30, border: 'none', background: 'transparent', fontSize: 10.5, color: subTextColor, outline: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedChildren = item.children.filter((_: any, ck: number) => ck !== cIdx);
                                              const updatedItems = (activeGroup.items || []).map((it: any, k: number) => k === nIdx ? { ...it, type: updatedChildren.length ? 'dropdown' : 'link', children: updatedChildren } : it);
                                              const updatedGroups = groups.map(g => g.id === activeGroup.id ? { ...g, items: updatedItems } : g);
                                              updateField('customNavbarGroups', updatedGroups);
                                              setIsDirty(true);
                                            }}
                                            title="Hapus Sub Menu"
                                            style={{
                                              width: 22,
                                              height: 22,
                                              minWidth: 22,
                                              minHeight: 22,
                                              aspectRatio: '1 / 1',
                                              flexShrink: 0,
                                              padding: 0,
                                              borderRadius: '50%',
                                              background: 'rgba(239, 68, 68, 0.1)',
                                              border: 'none',
                                              color: '#ef4444',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              boxSizing: 'border-box'
                                            }}
                                          >
                                            <X size={11} style={{ flexShrink: 0 }} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Header Banner */}
                  <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const val = e.currentTarget.textContent || '';
                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, badge: val } : cp);
                        updateField('customPages', updated);
                      }}
                      style={{ fontSize: 12, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', outline: 'none', cursor: 'text' }}
                    >
                      {customPage.badge || 'INFO LENGKAP'}
                    </span>

                    <h1
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const val = e.currentTarget.textContent || '';
                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, title: val } : cp);
                        updateField('customPages', updated);
                      }}
                      style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: textColor, margin: 0, outline: 'none', cursor: 'text' }}
                    >
                      {customPage.title || 'Judul Halaman'}
                    </h1>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const val = e.currentTarget.textContent || '';
                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, subtitle: val } : cp);
                        updateField('customPages', updated);
                      }}
                      style={{ fontSize: 15, color: subTextColor, margin: 0, outline: 'none', maxWidth: 640, lineHeight: 1.6, cursor: 'text' }}
                    >
                      {customPage.subtitle || 'Deskripsi singkat halaman...'}
                    </p>
                  </div>

                  {/* Sections List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                    {(customPage.sections || []).map((sec: any, sIdx: number) => {
                      return (
                        <div
                          key={sec.id || sIdx}
                          style={{
                            padding: 'clamp(20px, 3vw, 36px)',
                            borderRadius: 24,
                            background: cardBg,
                            border: `1px solid ${cardBorder}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            position: 'relative'
                          }}
                        >
                          {/* Section Control Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${cardBorder}`, paddingBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10.5, fontWeight: 900, padding: '3px 8px', borderRadius: 6, background: `${accentColor}20`, color: accentColor, textTransform: 'uppercase' }}>
                                Blok: {sec.type}
                              </span>
                              {/* Redesigned Switch: Teks Atas */}
                              <div
                                onClick={() => {
                                  const newChecked = sec.showHeading === false;
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, showHeading: newChecked } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                  padding: '3px 8px 3px 5px',
                                  borderRadius: 100,
                                  border: `1px solid ${cardBorder}`
                                }}
                              >
                                <div
                                  style={{
                                    width: 26,
                                    height: 15,
                                    borderRadius: 100,
                                    background: sec.showHeading !== false ? accentColor : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                    flexShrink: 0
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 11,
                                      height: 11,
                                      borderRadius: '50%',
                                      background: '#ffffff',
                                      position: 'absolute',
                                      top: 2,
                                      left: sec.showHeading !== false ? 13 : 2,
                                      transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 750, color: textColor }}>Teks Atas</span>
                              </div>

                              {/* Redesigned Switch: Full Mepet Kartu */}
                              {(sec.type === 'video' || sec.type === 'before_after' || sec.type === 'gallery') && (
                                <div
                                  onClick={() => {
                                    const newChecked = !Boolean(sec.fullCard);
                                    const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, fullCard: newChecked } : s);
                                    const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                    updateField('customPages', updated);
                                    setIsDirty(true);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    padding: '3px 8px 3px 5px',
                                    borderRadius: 100,
                                    border: `1px solid ${cardBorder}`
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 26,
                                      height: 15,
                                      borderRadius: 100,
                                      background: Boolean(sec.fullCard) ? accentColor : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                                      position: 'relative',
                                      transition: 'background 0.2s',
                                      flexShrink: 0
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 11,
                                        height: 11,
                                        borderRadius: '50%',
                                        background: '#ffffff',
                                        position: 'absolute',
                                        top: 2,
                                        left: Boolean(sec.fullCard) ? 13 : 2,
                                        transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 750, color: textColor }}>Full Kartu (Mepet)</span>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                onClick={() => {
                                  const filtered = (customPage.sections || []).filter((_: any, idx: number) => idx !== sIdx);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: filtered } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                  notify('Blok dihapus');
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                title="Hapus Blok Ini"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Section Title & Subtitle */}
                          {sec.showHeading !== false && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <h3
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const val = e.currentTarget.textContent || '';
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, title: val } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                }}
                                style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: textColor, margin: 0, outline: 'none', cursor: 'text' }}
                              >
                                {sec.title || 'Judul Bagian'}
                              </h3>
                              <p
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const val = e.currentTarget.textContent || '';
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, subtitle: val } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                }}
                                style={{ fontSize: 13.5, color: subTextColor, margin: 0, outline: 'none', cursor: 'text' }}
                              >
                                {sec.subtitle || 'Subjudul bagian...'}
                              </p>
                            </div>
                          )}

                          {/* 1. TEXT BLOCK */}
                          {sec.type === 'text' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const val = e.currentTarget.textContent || '';
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, content: val } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                }}
                                style={{ fontSize: 15, lineHeight: 1.85, color: textColor, outline: 'none', cursor: 'text', whiteSpace: 'pre-line' }}
                              >
                                {sec.content || 'Tulis isi teks artikel atau konten Anda di sini...'}
                              </div>

                              {/* Optional Quote Box */}
                              <div style={{ padding: 16, borderRadius: 16, background: `${accentColor}10`, borderLeft: `3px solid ${accentColor}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>Kutipan Sorotan (Quote)</span>
                                <div
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const val = e.currentTarget.textContent || '';
                                    const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, quote: val } : s);
                                    const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                    updateField('customPages', updated);
                                  }}
                                  style={{ fontSize: 14.5, fontStyle: 'italic', fontWeight: 600, color: textColor, outline: 'none' }}
                                >
                                  {sec.quote || 'Tulis kutipan penting di sini...'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. GALLERY GRID WITH LIGHTBOX CAROUSEL */}
                          {sec.type === 'gallery' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {/* Top Action Bar for Gallery */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => triggerUpload({ type: 'custom_page_gallery', id: `${customPage.id}::${sIdx}` })}
                                  style={{ padding: '8px 14px', borderRadius: 10, background: accentColor, color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                  <Upload size={13} />
                                  <span>Unggah Foto Langsung</span>
                                </button>
                                <button
                                  onClick={() => openMediaPicker({ type: 'custom_page_gallery', id: `${customPage.id}::${sIdx}` })}
                                  style={{ padding: '8px 14px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                  <ImageIcon size={13} />
                                  <span>Pilih dari Galeri Media</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const newUrl = prompt('Masukkan URL Gambar Galeri:', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80');
                                    if (newUrl) {
                                      const newImgs = [...(sec.images || []), { url: newUrl, caption: 'Foto Galeri', linkUrl: '' }];
                                      const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, images: newImgs } : s);
                                      const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                      updateField('customPages', updated);
                                      setIsDirty(true);
                                    }
                                  }}
                                  style={{ padding: '8px 14px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: textColor, border: `1px solid ${cardBorder}`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                  <Plus size={13} />
                                  <span>Tambah via URL</span>
                                </button>
                              </div>

                              {/* Gallery Thumbnails List */}
                              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(180px, 1fr))`, gap: 14 }}>
                                {(sec.images || []).map((img: any, iIdx: number) => {
                                  const imgUrl = typeof img === 'string' ? img : img.url;
                                  return (
                                    <div key={iIdx} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column' }}>
                                      <div style={{ position: 'relative', aspectRatio: '4/3', width: '100%', overflow: 'hidden' }}>
                                        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                          onClick={() => {
                                            const newImgs = (sec.images || []).filter((_: any, k: number) => k !== iIdx);
                                            const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, images: newImgs } : s);
                                            const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                            updateField('customPages', updated);
                                            setIsDirty(true);
                                            notify('Foto dihapus dari galeri');
                                          }}
                                          style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                          title="Hapus foto ini"
                                        >
                                          <X size={13} />
                                        </button>
                                      </div>
                                      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <input
                                          type="text"
                                          placeholder="Keterangan foto..."
                                          value={typeof img === 'object' ? img.caption || '' : ''}
                                          onChange={(e) => {
                                            const newImgs = (sec.images || []).map((it: any, k: number) => k === iIdx ? { ...(typeof it === 'object' ? it : { url: it }), caption: e.target.value } : it);
                                            const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, images: newImgs } : s);
                                            const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                            updateField('customPages', updated);
                                          }}
                                          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 11, color: textColor, outline: 'none' }}
                                        />
                                        <input
                                          type="text"
                                          placeholder="Tautan URL saat klik (opsional)..."
                                          value={typeof img === 'object' ? img.linkUrl || '' : ''}
                                          onChange={(e) => {
                                            const newImgs = (sec.images || []).map((it: any, k: number) => k === iIdx ? { ...(typeof it === 'object' ? it : { url: it }), linkUrl: e.target.value } : it);
                                            const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, images: newImgs } : s);
                                            const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                            updateField('customPages', updated);
                                          }}
                                          style={{ width: '100%', border: 'none', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '3px 6px', fontSize: 10.5, color: accentColor, outline: 'none' }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 3. BEFORE / AFTER INTERACTIVE SLIDER */}
                          {sec.type === 'before_after' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
                                {/* BEFORE BOX */}
                                <div style={{ padding: 16, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 900, color: accentColor, textTransform: 'uppercase' }}>Foto Before (Sebelum)</span>
                                    <input
                                      type="text"
                                      value={sec.beforeLabel || 'SEBELUM (BEFORE)'}
                                      onChange={(e) => {
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, beforeLabel: e.target.value } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      placeholder="Label Before"
                                      style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, fontSize: 11, fontWeight: 800, width: 130 }}
                                    />
                                  </div>

                                  {sec.beforeImage && (
                                    <div style={{ width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', border: `1px solid ${cardBorder}` }}>
                                      <img src={sec.beforeImage} alt="Before Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                      onClick={() => triggerUpload({ type: 'custom_page_before', id: `${customPage.id}::${sIdx}` })}
                                      style={{ padding: '7px 12px', borderRadius: 8, background: accentColor, color: '#fff', border: 'none', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                    >
                                      <Upload size={12} />
                                      <span>Unggah Foto</span>
                                    </button>
                                    <button
                                      onClick={() => openMediaPicker({ type: 'custom_page_before', id: `${customPage.id}::${sIdx}` })}
                                      style={{ padding: '7px 12px', borderRadius: 8, background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30`, fontWeight: 800, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                    >
                                      <ImageIcon size={12} />
                                      <span>Pilih Media</span>
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={sec.beforeImage || ''}
                                    placeholder="Atau tempel URL gambar Before..."
                                    onChange={(e) => {
                                      const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, beforeImage: e.target.value } : s);
                                      const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                      updateField('customPages', updated);
                                    }}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 11.5 }}
                                  />
                                </div>

                                {/* AFTER BOX */}
                                <div style={{ padding: 16, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 900, color: '#10b981', textTransform: 'uppercase' }}>Foto After (Sesudah)</span>
                                    <input
                                      type="text"
                                      value={sec.afterLabel || 'SESUDAH (AFTER)'}
                                      onChange={(e) => {
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, afterLabel: e.target.value } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      placeholder="Label After"
                                      style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, fontSize: 11, fontWeight: 800, width: 130 }}
                                    />
                                  </div>

                                  {sec.afterImage && (
                                    <div style={{ width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', border: `1px solid ${cardBorder}` }}>
                                      <img src={sec.afterImage} alt="After Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                      onClick={() => triggerUpload({ type: 'custom_page_after', id: `${customPage.id}::${sIdx}` })}
                                      style={{ padding: '7px 12px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                    >
                                      <Upload size={12} />
                                      <span>Unggah Foto</span>
                                    </button>
                                    <button
                                      onClick={() => openMediaPicker({ type: 'custom_page_after', id: `${customPage.id}::${sIdx}` })}
                                      style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                                    >
                                      <ImageIcon size={12} />
                                      <span>Pilih Media</span>
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={sec.afterImage || ''}
                                    placeholder="Atau tempel URL gambar After..."
                                    onChange={(e) => {
                                      const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, afterImage: e.target.value } : s);
                                      const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                      updateField('customPages', updated);
                                    }}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 11.5 }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 4. CARDS GRID WITH SUPERIOR MODAL POPUP OR LINK ACTION */}
                          {sec.type === 'cards_grid' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                                {(sec.cards || []).map((card: any, cIdx: number) => (
                                  <div key={card.id || cIdx} style={{ padding: 18, borderRadius: 20, background: isDark ? 'rgba(255,255,255,0.025)' : '#ffffff', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {/* Card Top Row */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                      <input
                                        type="text"
                                        value={card.badge || 'FEATURED'}
                                        onChange={(e) => {
                                          const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, badge: e.target.value } : c);
                                          const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                          const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                          updateField('customPages', updated);
                                        }}
                                        placeholder="Badge Kartu"
                                        style={{ padding: '3px 8px', borderRadius: 6, background: `${accentColor}18`, color: accentColor, border: 'none', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', width: 110 }}
                                      />
                                      <button
                                        onClick={() => {
                                          const newCards = (sec.cards || []).filter((_: any, k: number) => k !== cIdx);
                                          const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                          const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                          updateField('customPages', updated);
                                          setIsDirty(true);
                                          notify('Kartu dihapus');
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                        title="Hapus kartu ini"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>

                                    {/* Cover Image & Uploads */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      {card.image && (
                                        <div style={{ width: '100%', height: 130, borderRadius: 12, overflow: 'hidden', border: `1px solid ${cardBorder}` }}>
                                          <img src={card.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <button
                                          onClick={() => triggerUpload({ type: 'custom_page_card', id: `${customPage.id}::${sIdx}`, index: cIdx })}
                                          style={{ padding: '5px 10px', borderRadius: 8, background: accentColor, color: '#fff', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                        >
                                          <Upload size={11} />
                                          <span>Cover</span>
                                        </button>
                                        <button
                                          onClick={() => openMediaPicker({ type: 'custom_page_card', id: `${customPage.id}::${sIdx}`, index: cIdx })}
                                          style={{ padding: '5px 10px', borderRadius: 8, background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30`, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                        >
                                          <ImageIcon size={11} />
                                          <span>Media</span>
                                        </button>
                                        <input
                                          type="text"
                                          value={card.image || ''}
                                          placeholder="URL Cover..."
                                          onChange={(e) => {
                                            const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, image: e.target.value } : c);
                                            const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                            const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                            updateField('customPages', updated);
                                          }}
                                          style={{ flex: 1, minWidth: 100, padding: '5px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}`, fontSize: 11, color: textColor }}
                                        />
                                      </div>
                                    </div>

                                    {/* Card Title & Description */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <input
                                        type="text"
                                        value={card.title || ''}
                                        placeholder="Judul Kartu..."
                                        onChange={(e) => {
                                          const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, title: e.target.value } : c);
                                          const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                          const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                          updateField('customPages', updated);
                                        }}
                                        style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 850, color: textColor, border: `1px solid ${cardBorder}`, background: 'transparent', padding: '6px 10px', borderRadius: 8 }}
                                      />
                                      <textarea
                                        value={card.description || ''}
                                        placeholder="Deskripsi singkat kartu..."
                                        rows={2}
                                        onChange={(e) => {
                                          const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, description: e.target.value } : c);
                                          const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                          const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                          updateField('customPages', updated);
                                        }}
                                        style={{ fontSize: 12.5, color: subTextColor, border: `1px solid ${cardBorder}`, background: 'transparent', padding: '6px 10px', borderRadius: 8, resize: 'vertical' }}
                                      />
                                    </div>

                                    {/* Action Selector: Modal Popup vs Open Link */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 14, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}` }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: subTextColor }}>Aksi Saat Diklik:</span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                          <button
                                            onClick={() => {
                                              const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, actionType: 'modal' } : c);
                                              const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                              const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                              updateField('customPages', updated);
                                            }}
                                            style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, border: 'none', cursor: 'pointer', background: card.actionType !== 'link' ? accentColor : 'transparent', color: card.actionType !== 'link' ? '#fff' : subTextColor }}
                                          >
                                            Modal Popup
                                          </button>
                                          <button
                                            onClick={() => {
                                              const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, actionType: 'link' } : c);
                                              const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                              const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                              updateField('customPages', updated);
                                            }}
                                            style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, border: 'none', cursor: 'pointer', background: card.actionType === 'link' ? accentColor : 'transparent', color: card.actionType === 'link' ? '#fff' : subTextColor }}
                                          >
                                            Buka Link URL
                                          </button>
                                        </div>
                                      </div>

                                      {/* When Modal Popup */}
                                      {card.actionType !== 'link' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                                          <textarea
                                            value={card.details || ''}
                                            placeholder="Detail rincian lengkap isi modal popup..."
                                            rows={3}
                                            onChange={(e) => {
                                              const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, details: e.target.value } : c);
                                              const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                              const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                              updateField('customPages', updated);
                                            }}
                                            style={{ fontSize: 12, color: textColor, border: `1px solid ${cardBorder}`, background: 'transparent', padding: '6px 8px', borderRadius: 8, resize: 'vertical' }}
                                          />

                                          {/* Multi-Photo Carousel in Modal */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <span style={{ fontSize: 10.5, fontWeight: 800, color: subTextColor }}>Foto Carousel di Dalam Modal:</span>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                              {(card.images || []).map((cImg: string, gIdx: number) => (
                                                <div key={gIdx} style={{ position: 'relative', width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: `1px solid ${cardBorder}` }}>
                                                  <img src={cImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                  <button
                                                    onClick={() => {
                                                      const newImgs = (card.images || []).filter((_: any, k: number) => k !== gIdx);
                                                      const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, images: newImgs } : c);
                                                      const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                                      const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                                      updateField('customPages', updated);
                                                    }}
                                                    style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                  >
                                                    <X size={9} />
                                                  </button>
                                                </div>
                                              ))}
                                              <button
                                                onClick={() => triggerUpload({ type: 'custom_page_card_gallery', id: `${customPage.id}::${sIdx}`, index: cIdx })}
                                                style={{ padding: '4px 8px', borderRadius: 6, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}40`, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                                              >
                                                + Unggah
                                              </button>
                                              <button
                                                onClick={() => openMediaPicker({ type: 'custom_page_card_gallery', id: `${customPage.id}::${sIdx}`, index: cIdx })}
                                                style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.05)', color: textColor, border: `1px solid ${cardBorder}`, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                                              >
                                                + Media
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                                          <input
                                            type="text"
                                            value={card.linkUrl || ''}
                                            placeholder="URL Target Link (https://...)"
                                            onChange={(e) => {
                                              const newCards = sec.cards.map((c: any, k: number) => k === cIdx ? { ...c, linkUrl: e.target.value } : c);
                                              const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                              const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                              updateField('customPages', updated);
                                            }}
                                            style={{ width: '100%', padding: '6px 8px', borderRadius: 8, background: 'transparent', border: `1px solid ${cardBorder}`, fontSize: 11.5, color: textColor }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => {
                                  const newC = {
                                    id: `card_${Date.now()}`,
                                    title: 'Item Showcase Baru',
                                    badge: 'FEATURED',
                                    description: 'Rincian informasi menarik seputar produk atau layanan ini.',
                                    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
                                    actionType: 'modal',
                                    details: 'Detail lengkap yang akan muncul di dalam modal popup interaktif.',
                                    tags: ['Layanan', 'Desain']
                                  };
                                  const newCards = [...(sec.cards || []), newC];
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, cards: newCards } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                  notify('Kartu baru ditambahkan');
                                }}
                                style={{ padding: '10px 18px', borderRadius: 12, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}40`, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
                              >
                                <Plus size={15} />
                                <span>Tambah Kartu Showcase</span>
                              </button>
                            </div>
                          )}

                          {/* 5. STATS COUNTER GRID */}
                          {sec.type === 'stats' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                                {(sec.items || []).map((stat: any, stIdx: number) => (
                                  <div key={stIdx} style={{ padding: 18, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                                    <button
                                      onClick={() => {
                                        const newItems = (sec.items || []).filter((_: any, k: number) => k !== stIdx);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newItems = sec.items.map((it: any, k: number) => k === stIdx ? { ...it, value: val } : it);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 900, color: accentColor, outline: 'none' }}
                                    >
                                      {stat.value || '100+'}
                                    </span>
                                    <span
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newItems = sec.items.map((it: any, k: number) => k === stIdx ? { ...it, label: val } : it);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontSize: 13, fontWeight: 750, color: textColor, outline: 'none' }}
                                    >
                                      {stat.label || 'Klien Puas'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  const newItems = [...(sec.items || []), { value: '99%', label: 'Label Baru' }];
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                }}
                                style={{ padding: '8px 14px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}40`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
                              >
                                <Plus size={13} />
                                <span>Tambah Angka Statistik</span>
                              </button>
                            </div>
                          )}

                          {/* 6. TESTIMONIALS / REVIEW CARDS */}
                          {sec.type === 'testimonials' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                                {(sec.items || []).map((tItem: any, tIdx: number) => (
                                  <div key={tIdx} style={{ padding: 20, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                                    <button
                                      onClick={() => {
                                        const newItems = (sec.items || []).filter((_: any, k: number) => k !== tIdx);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                    >
                                      <Trash2 size={13} />
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      {tItem.avatar && (
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${cardBorder}` }}>
                                          <img src={tItem.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                          onClick={() => triggerUpload({ type: 'custom_page_testimonial', id: `${customPage.id}::${sIdx}`, index: tIdx })}
                                          style={{ padding: '4px 8px', borderRadius: 6, background: accentColor, color: '#fff', border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                                        >
                                          Unggah Foto
                                        </button>
                                        <button
                                          onClick={() => openMediaPicker({ type: 'custom_page_testimonial', id: `${customPage.id}::${sIdx}`, index: tIdx })}
                                          style={{ padding: '4px 8px', borderRadius: 6, background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30`, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                                        >
                                          Media
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 3, color: '#f59e0b' }}>
                                      {[...Array(5)].map((_, r) => (
                                        <Star key={r} size={14} fill="#f59e0b" />
                                      ))}
                                    </div>
                                    <p
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newItems = sec.items.map((it: any, k: number) => k === tIdx ? { ...it, quote: val } : it);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontSize: 13.5, fontStyle: 'italic', color: textColor, outline: 'none', margin: 0 }}
                                    >
                                      "{tItem.quote || 'Pelayanan profesional dan hasil luar biasa.'}"
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const val = e.currentTarget.textContent || '';
                                          const newItems = sec.items.map((it: any, k: number) => k === tIdx ? { ...it, name: val } : it);
                                          const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                          const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                          updateField('customPages', updated);
                                        }}
                                        style={{ fontSize: 12.5, fontWeight: 800, color: accentColor, outline: 'none' }}
                                      >
                                        {tItem.name || 'Nama Klien'}
                                      </div>
                                      <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const val = e.currentTarget.textContent || '';
                                          const newItems = sec.items.map((it: any, k: number) => k === tIdx ? { ...it, role: val } : it);
                                          const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                          const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                          updateField('customPages', updated);
                                        }}
                                        style={{ fontSize: 11, color: subTextColor, outline: 'none' }}
                                      >
                                        {tItem.role || 'Jabatan / Perusahaan'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => {
                                  const newItems = [...(sec.items || []), { name: 'Klien Baru', role: 'Founder', quote: 'Pelayanan yang sangat memuaskan!', rating: 5, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }];
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                }}
                                style={{ padding: '8px 14px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}40`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
                              >
                                <Plus size={13} />
                                <span>Tambah Testimoni Review</span>
                              </button>
                            </div>
                          )}

                          {/* 7. STEP-BY-STEP PROCESS TIMELINE */}
                          {sec.type === 'process' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                {(sec.items || []).map((step: any, stIdx: number) => (
                                  <div key={stIdx} style={{ padding: 18, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                                    <button
                                      onClick={() => {
                                        const newItems = (sec.items || []).filter((_: any, k: number) => k !== stIdx);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
                                      {stIdx + 1}
                                    </div>
                                    <h4
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newItems = sec.items.map((it: any, k: number) => k === stIdx ? { ...it, title: val } : it);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, margin: 0, color: textColor, outline: 'none' }}
                                    >
                                      {step.title || `Tahap ${stIdx + 1}`}
                                    </h4>
                                    <p
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newItems = sec.items.map((it: any, k: number) => k === stIdx ? { ...it, desc: val } : it);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontSize: 12.5, color: subTextColor, margin: 0, outline: 'none' }}
                                    >
                                      {step.desc || 'Deskripsi proses...'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  const newItems = [...(sec.items || []), { title: `Tahap ${(sec.items || []).length + 1}`, desc: 'Deskripsi tahapan alur kerja...' }];
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                }}
                                style={{ padding: '8px 14px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}40`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
                              >
                                <Plus size={13} />
                                <span>Tambah Tahap Alur Kerja</span>
                              </button>
                            </div>
                          )}

                          {/* 8. VIDEO EMBED BLOCK */}
                          {sec.type === 'video' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <label style={{ fontSize: 11, fontWeight: 800, color: subTextColor }}>URL Video (YouTube / MP4):</label>
                              <input
                                type="text"
                                value={sec.videoUrl || ''}
                                onChange={(e) => {
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, videoUrl: e.target.value } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                }}
                                placeholder="https://www.youtube.com/watch?v=..."
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 13 }}
                              />
                            </div>
                          )}

                          {/* 9. BUTTON GROUP / CTA LINKS (FULL EDITABLE) */}
                          {sec.type === 'button_group' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {/* Buttons Editor List */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(sec.buttons || []).map((btn: any, bIdx: number) => (
                                  <div
                                    key={bIdx}
                                    style={{
                                      padding: '12px 14px',
                                      borderRadius: 14,
                                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                      border: `1px solid ${cardBorder}`,
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: 10
                                    }}
                                  >
                                    {/* Inputs: Label & URL */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260, flexWrap: 'wrap' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 120 }}>
                                        <span style={{ fontSize: 10.5, fontWeight: 800, color: subTextColor }}>Teks Label:</span>
                                        <input
                                          type="text"
                                          value={btn.label || ''}
                                          placeholder="Konsultasi WhatsApp"
                                          onChange={(e) => {
                                            const newBtns = (sec.buttons || []).map((b: any, k: number) => k === bIdx ? { ...b, label: e.target.value } : b);
                                            const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, buttons: newBtns } : s);
                                            const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                            updateField('customPages', updated);
                                            setIsDirty(true);
                                          }}
                                          style={{ padding: '7px 10px', borderRadius: 8, background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 12.5, fontWeight: 800, outline: 'none' }}
                                        />
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1.5, minWidth: 150 }}>
                                        <span style={{ fontSize: 10.5, fontWeight: 800, color: subTextColor }}>Alamat Link / URL:</span>
                                        <input
                                          type="text"
                                          value={btn.url || ''}
                                          placeholder="https://wa.me/628... atau /portfolio"
                                          onChange={(e) => {
                                            const newBtns = (sec.buttons || []).map((b: any, k: number) => k === bIdx ? { ...b, url: e.target.value } : b);
                                            const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, buttons: newBtns } : s);
                                            const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                            updateField('customPages', updated);
                                            setIsDirty(true);
                                          }}
                                          style={{ padding: '7px 10px', borderRadius: 8, background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${cardBorder}`, color: textColor, fontSize: 12, outline: 'none' }}
                                        />
                                      </div>
                                    </div>

                                    {/* Style Variant Custom Dropdown Popover */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
                                        <span style={{ fontSize: 10.5, fontWeight: 800, color: subTextColor }}>Gaya Tombol:</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenBtnVariantDropdown(openBtnVariantDropdown === `${sec.id}_${bIdx}` ? null : `${sec.id}_${bIdx}`);
                                          }}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                            padding: '6px 14px',
                                            borderRadius: 100,
                                            background: isDark ? '#1e293b' : '#ffffff',
                                            border: `1px solid ${openBtnVariantDropdown === `${sec.id}_${bIdx}` ? accentColor : cardBorder}`,
                                            color: textColor,
                                            fontSize: 12,
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            minWidth: 155
                                          }}
                                        >
                                          <span>
                                            {[
                                              { value: 'primary', label: 'Primary (Aksen)' },
                                              { value: 'secondary', label: 'Secondary (Netral)' },
                                              { value: 'outline', label: 'Outline (Garis Tepi)' },
                                              { value: 'whatsapp', label: 'WhatsApp (Hijau)' },
                                              { value: 'call', label: 'Telepon Langsung' },
                                            ].find(o => o.value === (btn.variant || 'primary'))?.label || 'Primary'}
                                          </span>
                                          <ChevronDown size={13} style={{ color: subTextColor, transform: openBtnVariantDropdown === `${sec.id}_${bIdx}` ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                        </button>

                                        {openBtnVariantDropdown === `${sec.id}_${bIdx}` && (
                                          <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                              position: 'absolute',
                                              top: 'calc(100% + 6px)',
                                              left: 0,
                                              minWidth: 185,
                                              background: isDark ? '#0f172a' : '#ffffff',
                                              borderRadius: 16,
                                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                                              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                                              padding: 6,
                                              zIndex: 99999,
                                              display: 'flex',
                                              flexDirection: 'column',
                                              gap: 2,
                                              backdropFilter: 'blur(20px)',
                                              WebkitBackdropFilter: 'blur(20px)',
                                              animation: 'fadeIn 0.15s ease-out'
                                            }}
                                          >
                                            {[
                                              { value: 'primary', label: 'Primary (Aksen)', color: accentColor },
                                              { value: 'secondary', label: 'Secondary (Netral)', color: '#64748b' },
                                              { value: 'outline', label: 'Outline (Garis Tepi)', color: accentColor },
                                              { value: 'whatsapp', label: 'WhatsApp (Hijau)', color: '#22c55e' },
                                              { value: 'call', label: 'Telepon Langsung', color: '#0284c7' },
                                            ].map((opt) => {
                                              const isSelected = (btn.variant || 'primary') === opt.value;
                                              return (
                                                <div
                                                  key={opt.value}
                                                  onClick={() => {
                                                    const newBtns = (sec.buttons || []).map((b: any, k: number) => k === bIdx ? { ...b, variant: opt.value } : b);
                                                    const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, buttons: newBtns } : s);
                                                    const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                                    updateField('customPages', updated);
                                                    setIsDirty(true);
                                                    setOpenBtnVariantDropdown(null);
                                                  }}
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '7px 12px',
                                                    borderRadius: 10,
                                                    background: isSelected ? `${accentColor}18` : 'transparent',
                                                    color: isSelected ? accentColor : textColor,
                                                    fontSize: 12,
                                                    fontWeight: isSelected ? 850 : 600,
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s'
                                                  }}
                                                  onMouseEnter={(e) => {
                                                    if (!isSelected) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                                                  }}
                                                  onMouseLeave={(e) => {
                                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                  }}
                                                >
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} />
                                                    <span>{opt.label}</span>
                                                  </div>
                                                  {isSelected && <Check size={14} color={accentColor} />}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>

                                      <button
                                        onClick={() => {
                                          const newBtns = (sec.buttons || []).filter((_: any, k: number) => k !== bIdx);
                                          const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, buttons: newBtns } : s);
                                          const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                          updateField('customPages', updated);
                                          setIsDirty(true);
                                        }}
                                        title="Hapus Tombol"
                                        style={{ marginTop: 16, padding: '7px 10px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800 }}
                                      >
                                        <Trash2 size={13} />
                                        <span>Hapus</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Action to Add New Button */}
                              <button
                                onClick={() => {
                                  const newBtns = [...(sec.buttons || []), { label: 'Tombol Baru', url: 'https://', variant: 'primary' }];
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, buttons: newBtns } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                }}
                                style={{ padding: '9px 18px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1.5px dashed ${accentColor}50`, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content', margin: '0 auto' }}
                              >
                                <Plus size={14} />
                                <span>Tambah Tombol Link Baru</span>
                              </button>

                              {/* Live Preview of Button Group */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingTop: 10, borderTop: `1px dashed ${cardBorder}` }}>
                                {(sec.buttons || []).map((btn: any, bIdx: number) => (
                                  <div
                                    key={bIdx}
                                    style={{
                                      padding: '10px 20px',
                                      borderRadius: 100,
                                      background: btn.variant === 'primary' || !btn.variant ? accentColor : btn.variant === 'whatsapp' ? '#22c55e' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                      color: btn.variant === 'primary' || btn.variant === 'whatsapp' || !btn.variant ? '#ffffff' : textColor,
                                      border: btn.variant === 'outline' ? `1.5px solid ${accentColor}` : 'none',
                                      fontWeight: 800,
                                      fontSize: 13,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6
                                    }}
                                  >
                                    <span>{btn.label || 'Tombol Link'}</span>
                                    <ArrowRight size={13} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 10. FEATURES BLOCK */}
                          {sec.type === 'features' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                                {(sec.items || []).map((item: any, iIdx: number) => (
                                  <div key={iIdx} style={{ padding: 18, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                                    <button
                                      onClick={() => {
                                        const newItems = (sec.items || []).filter((_: any, k: number) => k !== iIdx);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor}20`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Sparkles size={16} />
                                    </div>
                                    <h4
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newItems = sec.items.map((it: any, k: number) => k === iIdx ? { ...it, title: val } : it);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, margin: 0, color: textColor, outline: 'none' }}
                                    >
                                      {item.title || `Fitur ${iIdx + 1}`}
                                    </h4>
                                    <p
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newItems = sec.items.map((it: any, k: number) => k === iIdx ? { ...it, desc: val } : it);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontSize: 13, color: subTextColor, margin: 0, outline: 'none', lineHeight: 1.5 }}
                                    >
                                      {item.desc || 'Deskripsi fitur...'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  const newItems = [...(sec.items || []), { title: 'Fitur Baru', desc: 'Deskripsi keunggulan solusi yang dihadirkan...' }];
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, items: newItems } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                }}
                                style={{ padding: '8px 14px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}40`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
                              >
                                <Plus size={13} />
                                <span>Tambah Fitur Baru</span>
                              </button>
                            </div>
                          )}

                          {/* 11. PRICING BLOCK */}
                          {sec.type === 'pricing' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                                {(sec.plans || []).map((plan: any, pIdx: number) => (
                                  <div key={pIdx} style={{ padding: 24, borderRadius: 20, background: plan.isPopular ? `${accentColor}12` : 'rgba(0,0,0,0.02)', border: plan.isPopular ? `2px solid ${accentColor}` : `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
                                    <button
                                      onClick={() => {
                                        const newPlans = (sec.plans || []).filter((_: any, k: number) => k !== pIdx);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, plans: newPlans } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                    >
                                      <Trash2 size={13} />
                                    </button>

                                    <h4
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newPlans = sec.plans.map((pl: any, k: number) => k === pIdx ? { ...pl, name: val } : pl);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, plans: newPlans } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, margin: 0, color: textColor, outline: 'none' }}
                                    >
                                      {plan.name || 'Nama Paket'}
                                    </h4>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: textColor }}>
                                      <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                          const val = e.currentTarget.textContent || '';
                                          const newPlans = sec.plans.map((pl: any, k: number) => k === pIdx ? { ...pl, price: val } : pl);
                                          const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, plans: newPlans } : s);
                                          const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                          updateField('customPages', updated);
                                        }}
                                        style={{ outline: 'none' }}
                                      >
                                        {plan.price || 'Rp 500.000'}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: subTextColor }}>
                                      {(plan.features || []).map((f: string, fIdx: number) => (
                                        <div key={fIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Check size={14} color="#10b981" />
                                            <span>{f}</span>
                                          </div>
                                          <button
                                            onClick={() => {
                                              const newFeats = (plan.features || []).filter((_: any, k: number) => k !== fIdx);
                                              const newPlans = sec.plans.map((pl: any, k: number) => k === pIdx ? { ...pl, features: newFeats } : pl);
                                              const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, plans: newPlans } : s);
                                              const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                              updateField('customPages', updated);
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                          >
                                            <X size={11} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => {
                                          const newF = prompt('Masukkan nama fitur baru:');
                                          if (newF) {
                                            const newFeats = [...(plan.features || []), newF];
                                            const newPlans = sec.plans.map((pl: any, k: number) => k === pIdx ? { ...pl, features: newFeats } : pl);
                                            const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, plans: newPlans } : s);
                                            const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                            updateField('customPages', updated);
                                            setIsDirty(true);
                                          }
                                        }}
                                        style={{ padding: '4px 8px', borderRadius: 6, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}30`, fontSize: 11, fontWeight: 800, cursor: 'pointer', marginTop: 4, width: 'fit-content' }}
                                      >
                                        + Tambah Fitur
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => {
                                  const newP = { name: 'Paket Baru', price: 'Rp 750.000', features: ['Fitur Layanan 1', 'Fitur Layanan 2'] };
                                  const newPlans = [...(sec.plans || []), newP];
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, plans: newPlans } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                }}
                                style={{ padding: '8px 14px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}40`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
                              >
                                <Plus size={13} />
                                <span>Tambah Paket Harga</span>
                              </button>
                            </div>
                          )}

                          {/* 12. FAQ BLOCK */}
                          {sec.type === 'faq' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(sec.faqs || []).map((faq: any, fIdx: number) => (
                                  <div key={fIdx} style={{ padding: 14, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, position: 'relative' }}>
                                    <button
                                      onClick={() => {
                                        const newFaqs = (sec.faqs || []).filter((_: any, k: number) => k !== fIdx);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, faqs: newFaqs } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                    <div
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newFaqs = sec.faqs.map((fq: any, k: number) => k === fIdx ? { ...fq, question: val } : fq);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, faqs: newFaqs } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontSize: 14, fontWeight: 800, color: textColor, outline: 'none', marginBottom: 4, paddingRight: 24 }}
                                    >
                                      {faq.question || 'Pertanyaan?'}
                                    </div>
                                    <div
                                      contentEditable
                                      suppressContentEditableWarning
                                      onBlur={(e) => {
                                        const val = e.currentTarget.textContent || '';
                                        const newFaqs = sec.faqs.map((fq: any, k: number) => k === fIdx ? { ...fq, answer: val } : fq);
                                        const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, faqs: newFaqs } : s);
                                        const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                        updateField('customPages', updated);
                                      }}
                                      style={{ fontSize: 13, color: subTextColor, outline: 'none' }}
                                    >
                                      {faq.answer || 'Jawaban detail...'}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => {
                                  const newFaqs = [...(sec.faqs || []), { question: 'Pertanyaan baru?', answer: 'Jawaban detail untuk pertanyaan ini...' }];
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, faqs: newFaqs } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                  setIsDirty(true);
                                }}
                                style={{ padding: '8px 14px', borderRadius: 10, background: `${accentColor}18`, color: accentColor, border: `1px dashed ${accentColor}40`, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
                              >
                                <Plus size={13} />
                                <span>Tambah Tanya Jawab (FAQ)</span>
                              </button>
                            </div>
                          )}

                          {/* 13. CTA BLOCK */}
                          {sec.type === 'cta' && (
                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                              <p
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const val = e.currentTarget.textContent || '';
                                  const updatedSecs = customPage.sections.map((s: any, idx: number) => idx === sIdx ? { ...s, content: val } : s);
                                  const updated = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: updatedSecs } : cp);
                                  updateField('customPages', updated);
                                }}
                                style={{ fontSize: 15, color: subTextColor, margin: 0, outline: 'none' }}
                              >
                                {sec.content || 'Hubungi kami sekarang untuk memulai proyek Anda.'}
                              </p>
                              <button
                                style={{
                                  padding: '12px 28px',
                                  borderRadius: 100,
                                  background: accentColor,
                                  color: '#fff',
                                  border: 'none',
                                  fontWeight: 800,
                                  fontSize: 14,
                                  cursor: 'default'
                                }}
                              >
                                {sec.buttonText || 'Mulai Konsultasi'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* + Tambah Blok Section Toolbar (LENGKAP 13 TIPE BLOK MODULAR) */}
                  <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      padding: isRealMobileScreen ? '16px 14px' : '18px 22px',
                      borderRadius: 20,
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      width: '100%',
                      maxWidth: 960,
                      boxSizing: 'border-box',
                      boxShadow: '0 10px 32px rgba(0,0,0,0.06)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Plus size={14} />
                          Tambah Blok Modular ke Halaman
                        </span>
                        <span style={{ fontSize: 11, color: subTextColor, fontWeight: 700 }}>
                          13 Tipe Blok Tersedia
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                        {[
                          { type: 'text', label: 'Teks', icon: <FileText size={13} /> },
                          { type: 'gallery', label: 'Galeri', icon: <ImageIcon size={13} /> },
                          { type: 'before_after', label: 'Before / After', icon: <Sliders size={13} /> },
                          { type: 'cards_grid', label: 'Showcase', icon: <Layers size={13} /> },
                          { type: 'features', label: 'Fitur', icon: <Sparkles size={13} /> },
                          { type: 'pricing', label: 'Paket Harga', icon: <DollarSign size={13} /> },
                          { type: 'faq', label: 'FAQ', icon: <HelpCircle size={13} /> },
                          { type: 'stats', label: 'Statistik', icon: <Award size={13} /> },
                          { type: 'testimonials', label: 'Testimoni', icon: <Star size={13} /> },
                          { type: 'process', label: 'Alur Kerja', icon: <ListOrdered size={13} /> },
                          { type: 'video', label: 'Video', icon: <Video size={13} /> },
                          { type: 'button_group', label: 'Tombol Link', icon: <Link2 size={13} /> },
                          { type: 'cta', label: 'Banner CTA', icon: <ArrowRight size={13} /> }
                        ].map(b => (
                          <button
                            key={b.type}
                            onClick={() => {
                              let newSec: any = {
                                id: `sec_${Date.now()}`,
                                type: b.type,
                                title: `Bagian ${b.label}`,
                                subtitle: 'Deskripsi pengantar bagian...'
                              };
                              if (b.type === 'text') {
                                newSec.content = 'Tulis konten paragraf Anda di sini...';
                                newSec.quote = 'Kutipan inspiratif atau pesan penting...';
                                newSec.quoteAuthor = 'Nama Penulis';
                              }
                              if (b.type === 'gallery') {
                                newSec.images = [
                                  { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', caption: 'Karya Visual Modern 1' },
                                  { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', caption: 'Desain Interior & Arsitektur' },
                                  { url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80', caption: 'Kemasan & Brand Identity' }
                                ];
                              }
                              if (b.type === 'before_after') {
                                newSec.beforeImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80';
                                newSec.afterImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80';
                                newSec.beforeLabel = 'SEBELUM (BEFORE)';
                                newSec.afterLabel = 'SESUDAH (AFTER)';
                              }
                              if (b.type === 'cards_grid') {
                                newSec.cards = [
                                  { id: 'c1', title: 'Fitur Utama 1', badge: 'POPULER', description: 'Informasi ringkas fitur unggulan dengan popup detail.', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', actionType: 'modal', details: 'Detail lengkap dan spesifikasi dalam popup.' },
                                  { id: 'c2', title: 'Fitur Utama 2', badge: 'BARU', description: 'Informasi ringkas fitur kedua dengan link rujukan.', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80', actionType: 'link', linkUrl: '#', details: 'Penjelasan lebih lanjut.' }
                                ];
                              }
                              if (b.type === 'features') {
                                newSec.items = [
                                  { title: 'Layanan Responsif', desc: 'Desain adaptif di semua perangkat seluler.' },
                                  { title: 'Kecepatan Tinggi', desc: 'Performa loading website super gesit.' },
                                  { title: 'Kustom Fleksibel', desc: 'Sesuai dengan identitas dan brand bisnis Anda.' }
                                ];
                              }
                              if (b.type === 'pricing') {
                                newSec.plans = [
                                  { name: 'Paket Dasar', price: 'Rp 450.000', features: ['1 Halaman Landing Page', 'Revisi 2x', 'Responsif Mobile'] },
                                  { name: 'Paket Pro', price: 'Rp 950.000', isPopular: true, features: ['Hingga 5 Halaman', 'Integrasi CMS & Form', 'Prioritas Support'] }
                                ];
                              }
                              if (b.type === 'faq') {
                                newSec.faqs = [
                                  { question: 'Berapa lama waktu pengerjaan proyek?', answer: 'Rata-rata berkisar antara 3 hingga 7 hari kerja tergantung kompleksitas.' },
                                  { question: 'Apakah website sudah termasuk hosting?', answer: 'Ya, sistem sudah siap pakai dan terhubung dengan cloud hosting cepat.' }
                                ];
                              }
                              if (b.type === 'stats') {
                                newSec.items = [
                                  { value: '150+', label: 'Proyek Selesai' },
                                  { value: '99%', label: 'Kepuasan Klien' },
                                  { value: '24/7', label: 'Dukungan Siaga' }
                                ];
                              }
                              if (b.type === 'testimonials') {
                                newSec.items = [
                                  { name: 'Budi Santoso', role: 'CEO TechIndo', quote: 'Pelayanan cepat dan desain sangat memuaskan.', rating: 5, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
                                  { name: 'Siti Aminah', role: 'Founder FashionID', quote: 'Desain website sangat elegan dan menaikkan konversi.', rating: 5, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' }
                                ];
                              }
                              if (b.type === 'process') {
                                newSec.steps = [
                                  { number: '01', title: 'Konsultasi & Brief', desc: 'Memahami kebutuhan, tujuan brand, dan target audiens Anda.' },
                                  { number: '02', title: 'Perancangan Konsep', desc: 'Pembuatan wireframe, moodboard, dan desain antarmuka.' },
                                  { number: '03', title: 'Pengembangan & Tes', desc: 'Integrasi sistem, optimasi performa responsif, dan peluncuran.' }
                                ];
                              }
                              if (b.type === 'video') {
                                newSec.videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                              }
                              if (b.type === 'button_group') {
                                newSec.buttons = [
                                  { id: 'b1', label: 'Hubungi WhatsApp', url: 'https://wa.me/6281234567890', variant: 'primary', icon: 'MessageCircle' },
                                  { id: 'b2', label: 'Lihat Portofolio', url: '/portfolio', variant: 'outline', icon: 'Globe' }
                                ];
                              }
                              if (b.type === 'cta') {
                                newSec.title = 'Siap Berkolaborasi?';
                                newSec.buttonText = 'Hubungi Tim Kami';
                              }
                              const updatedCustom = (data.customPages || []).map((cp: any) => cp.id === customPage.id ? { ...cp, sections: [...(cp.sections || []), newSec] } : cp);
                              updateField('customPages', updatedCustom);
                              setIsDirty(true);
                              notify(`✨ Blok "${b.label}" ditambahkan!`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '7px 13px',
                              borderRadius: 12,
                              background: `${accentColor}12`,
                              color: accentColor,
                              border: `1px solid ${accentColor}25`,
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {b.icon}
                            <span>{b.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── FOOTER (INLINE EDITABLE ACROSS PAGES) ── */}
            <footer style={{ padding: isMobileOrTablet ? '30px 16px 140px' : '60px 24px 90px', background: isDark ? '#05060b' : '#f8fafc', borderTop: `1px solid ${cardBorder}` }}>
              <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor, margin: '0 0 6px' }}>{data.navbar?.logoText || 'sumr.day'}</h3>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('footer.description', e.currentTarget.textContent || '')}
                      style={{ fontSize: 13, color: subTextColor, margin: 0, outline: 'none', maxWidth: 420 }}
                    >
                      {data.footer?.description || 'A little sunshine for your screen ☀️ Studio kreatif digital berkonsep Warm Tech & Skena-Aesthetic.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>KONTAK LANGSUNG</div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateField('footer.email', e.currentTarget.textContent || '')}
                      style={{ fontSize: 13, fontWeight: 700, color: textColor, outline: 'none' }}
                    >
                      {data.footer?.email || 'hi.sumrday@gmail.com'}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${cardBorder}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: subTextColor }}>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateField('footer.copyright', e.currentTarget.textContent || '')}
                    style={{ outline: 'none' }}
                  >
                    {data.footer?.copyright || '© 2026 sumr.day | Creative Digital Studio. Crafted with warm vibes.'}
                  </span>
                </div>
              </div>
            </footer>

          </div>
        </div>
      </div>

      {/* ── MODAL: CHECKPOINT & DRAFT HISTORY ── */}
      {showHistoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 35000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '80vh',
              borderRadius: 24,
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={20} color={accentColor} />
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor }}>
                  Titik Simpan Draft (Checkpoints)
                </h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: subTextColor, margin: 0 }}>
              Setiap kali Anda mengedit, draft disimpan secara lokal dan tersimpan di titik waktu ini. Anda dapat kembali ke titik revisi kapan saja.
            </p>

            <button
              onClick={() => {
                const name = prompt('Beri nama titik checkpoint ini:', `Revisi ${new Date().toLocaleTimeString('id-ID')}`);
                if (name) handleCreateCheckpoint(name);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 12,
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}40`,
                color: accentColor,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Bookmark size={15} />
              <span>Simpan Titik Checkpoint Baru Sekarang</span>
            </button>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320 }}>
              {checkpoints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: subTextColor, fontSize: 13 }}>
                  Belum ada checkpoint draft tersimpan.
                </div>
              ) : (
                checkpoints.map((cp) => (
                  <div
                    key={cp.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: textColor }}>{cp.name}</div>
                      <div style={{ fontSize: 11, color: subTextColor }}>
                        {new Date(cp.timestamp).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {/* Rename Button */}
                      <button
                        onClick={() => handleRenameCheckpoint(cp.id, cp.name)}
                        title="Ubah Nama Checkpoint"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          border: 'none',
                          color: subTextColor,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Edit3 size={13} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteCheckpoint(cp.id, cp.name)}
                        title="Hapus Checkpoint"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Restore Button */}
                      <button
                        onClick={() => handleRestoreCheckpoint(cp)}
                        title="Pulihkan data website ke versi ini"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '6px 14px',
                          borderRadius: 100,
                          background: accentColor,
                          color: '#fff',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <RotateCcw size={12} />
                        <span>Pulihkan</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PENGATURAN GLOBAL WEBSITE (CENTER MODAL ON DESKTOP, FULL SCREEN ON MOBILE) ── */}
      {showSettingsDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isRealMobileScreen ? 0 : 20,
            boxSizing: 'border-box',
          }}
          onClick={() => setShowSettingsDrawer(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: isRealMobileScreen ? '100%' : 880,
              height: isRealMobileScreen ? '100%' : 680,
              maxHeight: isRealMobileScreen ? '100%' : '90vh',
              background: isDark ? '#0f172a' : '#ffffff',
              borderRadius: isRealMobileScreen ? 0 : 28,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: isRealMobileScreen ? '20px 16px' : '26px 32px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 30px 90px rgba(0,0,0,0.6)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 14, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, flexShrink: 0 }}>
                  <Settings size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isRealMobileScreen ? 18 : 21, fontWeight: 900, color: textColor }}>
                    Pengaturan Global Website
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: subTextColor }}>
                    Pusat konfigurasi SEO, identitas, hero, kontak, tema & hak cipta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                title="Tutup Pengaturan"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: 'none',
                  color: subTextColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Icon-Only Centered Tabs Navigation (6 Streamlined Modules) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '6px',
                borderRadius: 100,
                background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                width: 'fit-content',
                maxWidth: '100%',
                overflowX: 'auto',
                margin: '0 auto',
                flexShrink: 0,
                boxShadow: isDark ? 'inset 0 2px 6px rgba(0,0,0,0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {[
                { key: 'seo', label: 'SEO & Metadata Situs', icon: <Search size={16} /> },
                { key: 'identity', label: 'Biodata & Profil About', icon: <User size={16} /> },
                { key: 'contact', label: 'Kontak & Sosial Media', icon: <Phone size={16} /> },
                { key: 'consultation', label: 'Konsultasi & Janji Temu', icon: <Calendar size={16} /> },
                { key: 'concierge', label: 'Live Chat & Concierge', icon: <MessageSquare size={16} /> },
                { key: 'backup', label: 'Cadangan & Migrasi JSON', icon: <HardDrive size={16} /> },
              ].map((t) => {
                const isSel = settingsActiveTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setSettingsActiveTab(t.key as any)}
                    title={t.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      minWidth: 36,
                      minHeight: 36,
                      aspectRatio: '1 / 1',
                      borderRadius: '50%',
                      border: 'none',
                      background: isSel ? accentColor : 'transparent',
                      color: isSel ? '#ffffff' : subTextColor,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      flexShrink: 0,
                      boxShadow: isSel ? `0 4px 14px ${accentColor}50` : 'none',
                      transform: isSel ? 'scale(1.06)' : 'scale(1)',
                      padding: 0,
                    }}
                  >
                    {t.icon}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Active Tab Header Banner */}
            {(() => {
              const activeMeta = [
                { key: 'seo', label: 'SEO & Metadata Situs', desc: 'Konfigurasi meta title, meta description, keywords Google & pratinjau OpenGraph link banner.' },
                { key: 'identity', label: 'Biodata & Profil About', desc: 'Informasi nama, profesi, avatar, cover banner, statistik portofolio, dan biografi lengkap cerita karier.' },
                { key: 'contact', label: 'Kontak & Sosial Media', desc: 'Email resmi, nomor WhatsApp direct chat, template pesan, dan link tautan media sosial profesional.' },
                { key: 'consultation', label: 'Pusat Kontrol Konsultasi & Janji Temu Klien', desc: 'Kelola metode saluran temu (WhatsApp Direct, Google Meet, Zoom), nomor admin, popup booking, dan topik layanan konsultasi.' },
                { key: 'concierge', label: 'Live Chat & AI Concierge', desc: 'Konfigurasi bot chat asisten interaktif, pesan sambutan, dan kategori layanan cepat.' },
                { key: 'backup', label: 'Cadangan & Migrasi File JSON', desc: 'Unduh file cadangan data mentah JSON atau pulihkan website dari file JSON eksternal.' },
              ].find(m => m.key === settingsActiveTab);

              return (
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 14,
                    background: `${accentColor}12`,
                    border: `1px solid ${accentColor}25`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flexShrink: 0,
                  }}
                >
                  <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 850, color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />
                    <span>{activeMeta?.label}</span>
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: subTextColor, lineHeight: 1.4 }}>
                    {activeMeta?.desc}
                  </p>
                </div>
              );
            })()}

            {/* Tab Body (Scrollable with safe padding for glows & shadows) */}
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 12, paddingLeft: 6, paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* TAB 1: SEO & META TAG */}
              {settingsActiveTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Smart AI Auto-Generate SEO Card */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accentColor}20`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wand2 size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>Asisten Pintar SEO</div>
                        <div style={{ fontSize: 11, color: subTextColor }}>Buat judul, deskripsi Google & kata kunci otomatis dari Biodata</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const name = biodata?.fullName || data.hero?.headline || 'Creative Designer';
                        const role = biodata?.role || data.hero?.subheadline || 'Professional Portfolio';
                        const location = biodata?.location || 'Indonesia';
                        const genTitle = `${name} — ${role}`;
                        const genDesc = `Portfolio resmi ${name} (${role}) berdomisili di ${location}. Melayani kolaborasi desain, konsultasi kreatif, dan proyek profesional.`;
                        const genKeywords = `${name.toLowerCase()}, ${role.toLowerCase()}, portofolio, desain, creative showcase, ${location.toLowerCase()}, UI/UX, branding`;

                        updateField('seo.metaTitle', genTitle);
                        updateField('seo.metaDescription', genDesc);
                        updateField('seo.keywords', genKeywords);
                        notify('✨ Metadata SEO berhasil dibuat otomatis dari biodata!');
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#ffffff',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: `0 2px 8px ${accentColor}40`,
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Auto-Generate SEO</span>
                    </button>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>
                      Judul Situs (Meta Title Tag)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: sumr.day | Creative Digital Studio"
                      value={data.seo?.metaTitle || ''}
                      onChange={(e) => updateField('seo.metaTitle', e.target.value)}
                      style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>
                      Deskripsi Meta (Untuk Google Search & Pratinjau Link)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ringkasan singkat profesional untuk mesin pencari dan kartu link sosial media..."
                      value={data.seo?.metaDescription || ''}
                      onChange={(e) => updateField('seo.metaDescription', e.target.value)}
                      style={{ width: '100%', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: 12, fontSize: 13, outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>
                      Kata Kunci SEO (Keywords - Pisahkan dengan koma)
                    </label>
                    <input
                      type="text"
                      placeholder="desainer grafis, ui/ux, branding, template, yogyakarta"
                      value={data.seo?.keywords || ''}
                      onChange={(e) => updateField('seo.keywords', e.target.value)}
                      style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor }}>Favicon URL</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => triggerUpload({ type: 'seo_favicon' })}
                            style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <Camera size={11} />
                            <span>Upload</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openMediaPicker({ type: 'seo_favicon' })}
                            style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <ImageIcon size={11} />
                            <span>Galeri</span>
                          </button>
                          {data.seo?.faviconUrl && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage('seo_favicon')}
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 750, cursor: 'pointer' }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="https://.../favicon.png"
                        value={data.seo?.faviconUrl || ''}
                        onChange={(e) => updateField('seo.faviconUrl', e.target.value)}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor }}>OpenGraph Banner URL</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => triggerUpload({ type: 'seo_og' })}
                            style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <Camera size={11} />
                            <span>Upload</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openMediaPicker({ type: 'seo_og' })}
                            style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                          >
                            <ImageIcon size={11} />
                            <span>Galeri</span>
                          </button>
                          {data.seo?.ogImageUrl && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage('seo_og')}
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 750, cursor: 'pointer' }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="https://.../og-banner.jpg"
                        value={data.seo?.ogImageUrl || ''}
                        onChange={(e) => updateField('seo.ogImageUrl', e.target.value)}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BIODATA & IDENTITAS LENGKAP */}
              {settingsActiveTab === 'identity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Bagian 1: Identitas & Profil Pokok */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 850, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      1. Identitas Pokok & Posisi
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Nama Lengkap & Gelar</label>
                        <input
                          type="text"
                          value={biodata?.fullName || data.hero?.headline || ''}
                          onChange={(e) => {
                            updateBioField('fullName', e.target.value);
                            updateField('hero.headline', e.target.value);
                          }}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Profesi / Jabatan Utama</label>
                        <input
                          type="text"
                          value={biodata?.role || data.hero?.subheadline || ''}
                          onChange={(e) => {
                            updateBioField('role', e.target.value);
                            updateField('hero.subheadline', e.target.value);
                          }}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Perusahaan / Studio</label>
                        <input
                          type="text"
                          value={biodata?.company || ''}
                          onChange={(e) => updateBioField('company', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Domisili / Lokasi</label>
                        <input
                          type="text"
                          value={biodata?.location || ''}
                          onChange={(e) => updateBioField('location', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Lama Pengalaman</label>
                        <input
                          type="text"
                          value={biodata?.experienceYears || ''}
                          onChange={(e) => updateBioField('experienceYears', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Foto Profil & Cover Banner */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 850, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      2. Foto Profil & Cover Banner
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 14 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor }}>Foto Avatar Profil</label>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => triggerUpload({ type: 'hero_avatar' })}
                              style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                              <Camera size={11} />
                              <span>Upload</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openMediaPicker({ type: 'hero_avatar' })}
                              style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                              <ImageIcon size={11} />
                              <span>Galeri</span>
                            </button>
                            {biodata?.avatar && (
                              <button
                                type="button"
                                onClick={() => handleRemoveImage('hero_avatar')}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 750, cursor: 'pointer' }}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="https://.../avatar.jpg"
                          value={biodata?.avatar || data.hero?.avatarUrl || ''}
                          onChange={(e) => {
                            updateBioField('avatar', e.target.value);
                            updateField('hero.avatarUrl', e.target.value);
                          }}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor }}>Cover Banner (/about)</label>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => triggerUpload({ type: 'bio_cover' })}
                              style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                              <Camera size={11} />
                              <span>Upload</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openMediaPicker({ type: 'bio_cover' })}
                              style={{ background: 'none', border: 'none', color: accentColor, fontSize: 11, fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                              <ImageIcon size={11} />
                              <span>Galeri</span>
                            </button>
                            {biodata?.cover && (
                              <button
                                type="button"
                                onClick={() => handleRemoveImage('bio_cover')}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 750, cursor: 'pointer' }}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="https://.../cover.jpg"
                          value={biodata?.cover || ''}
                          onChange={(e) => updateBioField('cover', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Metrik Portofolio Bento */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 850, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      3. Metrik & Statistik Bento (4 Angka Utama)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 2 }}>Stat 1 (Projek)</label>
                        <input
                          type="text"
                          placeholder="50+"
                          value={biodata?.stats?.projects || '50+'}
                          onChange={(e) => updateBioField('stats.projects', e.target.value)}
                          style={{ width: '100%', height: 38, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 10px', fontSize: 12.5, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 2 }}>Stat 2 (Klien)</label>
                        <input
                          type="text"
                          placeholder="30+"
                          value={biodata?.stats?.clients || '30+'}
                          onChange={(e) => updateBioField('stats.clients', e.target.value)}
                          style={{ width: '100%', height: 38, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 10px', fontSize: 12.5, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 2 }}>Stat 3 (Penghargaan)</label>
                        <input
                          type="text"
                          placeholder="12"
                          value={biodata?.stats?.awards || '12'}
                          onChange={(e) => updateBioField('stats.awards', e.target.value)}
                          style={{ width: '100%', height: 38, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 10px', fontSize: 12.5, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 2 }}>Stat 4 (Jam Terbang)</label>
                        <input
                          type="text"
                          placeholder="5th+"
                          value={biodata?.stats?.hours || '5th+'}
                          onChange={(e) => updateBioField('stats.hours', e.target.value)}
                          style={{ width: '100%', height: 38, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 10px', fontSize: 12.5, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 4: Biografi Ringkas & Lengkap */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 850, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      4. Biografi & Cerita Karier
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Bio Ringkas (Home & Bento Cards)</label>
                      <textarea
                        rows={2}
                        value={biodata?.bio || ''}
                        onChange={(e) => updateBioField('bio', e.target.value)}
                        style={{ width: '100%', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: 12, fontSize: 13, outline: 'none', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KONTAK & SOSIAL MEDIA */}
              {settingsActiveTab === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Sub-bagian 1: Saluran Direct Kontak */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 850, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      1. Saluran Direct Chat & Email
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Email Resmi</label>
                        <input
                          type="email"
                          value={data.footer?.email || biodata?.email || ''}
                          onChange={(e) => {
                            updateField('footer.email', e.target.value);
                            updateBioField('email', e.target.value);
                          }}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Nomor WhatsApp (Contoh: 628123456789)</label>
                        <input
                          type="text"
                          value={biodata?.phone || ''}
                          onChange={(e) => updateBioField('phone', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Template Pesan Otomatis WhatsApp</label>
                      <input
                        type="text"
                        placeholder="Halo sumr.day, saya ingin ngobrol santai mengenai proyek digital..."
                        value={data.footer?.whatsappTemplate || ''}
                        onChange={(e) => updateField('footer.whatsappTemplate', e.target.value)}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Status Ketersediaan Projek</label>
                      <input
                        type="text"
                        placeholder="Open for Freelance & Contract Projects"
                        value={data.footer?.availabilityText || 'Open for Freelance & Contract Projects'}
                        onChange={(e) => updateField('footer.availabilityText', e.target.value)}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Sub-bagian 2: Tautan Sosial Media */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 850, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      2. Tautan Sosial Media Profesional
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Instagram Link</label>
                        <input
                          type="text"
                          placeholder="https://instagram.com/username"
                          value={biodata?.socialLinks?.instagram || ''}
                          onChange={(e) => updateBioField('socialLinks.instagram', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>LinkedIn Link</label>
                        <input
                          type="text"
                          placeholder="https://linkedin.com/in/username"
                          value={biodata?.socialLinks?.linkedin || ''}
                          onChange={(e) => updateBioField('socialLinks.linkedin', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>GitHub Link</label>
                        <input
                          type="text"
                          placeholder="https://github.com/username"
                          value={biodata?.socialLinks?.github || ''}
                          onChange={(e) => updateBioField('socialLinks.github', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Dribbble / Behance Link</label>
                        <input
                          type="text"
                          placeholder="https://dribbble.com/username"
                          value={biodata?.socialLinks?.dribbble || biodata?.socialLinks?.behance || ''}
                          onChange={(e) => updateBioField('socialLinks.dribbble', e.target.value)}
                          style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: KONSULTASI & JANJI TEMU (BOOKING & CONSULTATION SETTINGS) */}
              {settingsActiveTab === 'consultation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Status Banner */}
                  <div style={{ padding: 14, borderRadius: 16, background: `${accentColor}12`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 850, color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={16} color={accentColor} />
                        <span>Pusat Kontrol Konsultasi & Janji Temu Klien</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 2 }}>
                        Konfigurasi saluran meeting, nomor WhatsApp admin, popup booking, dan daftar topik layanan
                      </div>
                    </div>
                  </div>

                  {/* 1. Saluran Pertemuan Utama */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: subTextColor, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Metode & Saluran Konsultasi Utama
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
                      {[
                        { 
                          id: 'WhatsApp', 
                          label: 'WhatsApp Direct', 
                          desc: 'Chat & Call via WA', 
                          icon: (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.74 14.07c-.24.67-1.39 1.28-1.92 1.36-.5.08-1.14.12-3.32-.78-2.64-1.09-4.32-3.77-4.45-3.95-.13-.18-1.07-1.42-1.07-2.71 0-1.29.68-1.92.92-2.18.24-.26.53-.32.71-.32.18 0 .36.002.51.01.17.01.39-.06.61.47.23.55.78 1.9.85 2.04.07.14.12.31.02.5-.1.19-.15.31-.3.48-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.31.8 1.31 1.71 2.12 1.17 1.04 2.16 1.36 2.47 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.16.52.24.6.37.08.13.08.76-.16 1.43z"/>
                            </svg>
                          ), 
                          color: '#25D366', 
                          badge: 'Favorit' 
                        },
                        { 
                          id: 'Google Meet', 
                          label: 'Google Meet', 
                          desc: 'Video conference online', 
                          icon: (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                              <rect width="14" height="14" x="2" y="5" rx="3" fill="#00832d"/>
                              <path fill="#00ac47" d="M16 14.5l5 3.5V6l-5 3.5v5z"/>
                              <circle cx="9" cy="12" r="2.5" fill="#fff"/>
                            </svg>
                          ), 
                          color: '#00897B' 
                        },
                        { 
                          id: 'Zoom', 
                          label: 'Zoom Meeting', 
                          desc: 'Sesi video room Zoom', 
                          icon: (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                              <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h7a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 14 19H7a2.5 2.5 0 0 1-2.5-2.5v-9zM18 9.25l3.5-2.19a.75.75 0 0 1 1.14.64v8.6a.75.75 0 0 1-1.14.64L18 14.75V9.25z"/>
                            </svg>
                          ), 
                          color: '#2D8CFF' 
                        },
                        { 
                          id: 'Telepon Langsung', 
                          label: 'Telepon GSM', 
                          desc: 'Panggilan telepon biasa', 
                          icon: <Phone size={18} />, 
                          color: '#f59e0b' 
                        },
                        { 
                          id: 'Tatap Muka / Offline', 
                          label: 'Tatap Muka', 
                          desc: 'Pertemuan di studio/kafe', 
                          icon: <MapPin size={18} />, 
                          color: '#8b5cf6' 
                        },
                        { 
                          id: 'Kustom', 
                          label: 'Saluran Kustom', 
                          desc: 'Telegram, Discord, Link dll', 
                          icon: <Sparkles size={18} />, 
                          color: '#ec4899',
                          badge: 'Kustom'
                        }
                      ].map((platform) => {
                        const isSelected = (bookingSettings?.platform || 'WhatsApp') === platform.id;
                        return (
                          <div
                            key={platform.id}
                            onClick={() => {
                              const updated = { ...bookingSettings, platform: platform.id };
                              setBookingSettings(updated);
                              storage.setItem('porto_booking_settings', updated);
                              setIsDirty(true);
                            }}
                            style={{
                              padding: '14px 14px',
                              borderRadius: 16,
                              cursor: 'pointer',
                              background: isSelected ? `${platform.color}18` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                              border: isSelected ? `2px solid ${platform.color}` : `1px solid ${cardBorder}`,
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              position: 'relative',
                            }}
                          >
                            {platform.badge && (
                              <span style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                fontSize: 9,
                                fontWeight: 900,
                                padding: '2px 6px',
                                borderRadius: 6,
                                background: platform.color,
                                color: '#ffffff',
                              }}>
                                {platform.badge}
                              </span>
                            )}
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: isSelected ? platform.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                              color: isSelected ? '#ffffff' : platform.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {platform.icon}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>{platform.label}</div>
                              <div style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>{platform.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Jika memilih Saluran Kustom, tampilkan form detail nama & URL */}
                    {bookingSettings?.platform === 'Kustom' && (
                      <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 10, marginTop: 12, padding: 14, borderRadius: 14, background: isDark ? 'rgba(236, 72, 153, 0.08)' : 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 750, color: textColor, display: 'block', marginBottom: 4 }}>
                            Nama Platform / Saluran Kustom
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Telegram / Discord / Skype"
                            value={bookingSettings?.customPlatformName || ''}
                            onChange={(e) => {
                              const updated = { ...bookingSettings, customPlatformName: e.target.value };
                              setBookingSettings(updated);
                              storage.setItem('porto_booking_settings', updated);
                              setIsDirty(true);
                            }}
                            style={{ width: '100%', height: 38, borderRadius: 10, background: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, color: textColor, padding: '0 12px', fontSize: 12.5, outline: 'none' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 750, color: textColor, display: 'block', marginBottom: 4 }}>
                            Tautan Link / Detail Petunjuk Kustom
                          </label>
                          <input
                            type="text"
                            placeholder="https://t.me/username atau https://cal.com/yourlink"
                            value={bookingSettings?.customPlatformUrl || ''}
                            onChange={(e) => {
                              const updated = { ...bookingSettings, customPlatformUrl: e.target.value };
                              setBookingSettings(updated);
                              storage.setItem('porto_booking_settings', updated);
                              setIsDirty(true);
                            }}
                            style={{ width: '100%', height: 38, borderRadius: 10, background: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, color: textColor, padding: '0 12px', fontSize: 12.5, outline: 'none' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Form Nomor WhatsApp & Teks Header Modal */}
                  <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <div style={{ gridColumn: isRealMobileScreen ? 'auto' : '1 / -1' }}>
                      <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>
                        Nomor WhatsApp Tujuan (Admin)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 081234567890"
                        value={bookingSettings?.adminWhatsApp || ''}
                        onChange={(e) => {
                          const updated = { ...bookingSettings, adminWhatsApp: e.target.value };
                          setBookingSettings(updated);
                          storage.setItem('porto_booking_settings', updated);
                          setIsDirty(true);
                        }}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                      <div style={{ fontSize: 11, color: subTextColor, marginTop: 3 }}>
                        Nomor ini akan otomatis dibuka saat klien mengonfirmasi booking konsultasi dari website publik.
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>
                        Judul Modal Konsultasi
                      </label>
                      <input
                        type="text"
                        placeholder="Jadwalkan Konsultasi"
                        value={bookingSettings?.modalTitle || 'Jadwalkan Konsultasi'}
                        onChange={(e) => {
                          const updated = { ...bookingSettings, modalTitle: e.target.value };
                          setBookingSettings(updated);
                          storage.setItem('porto_booking_settings', updated);
                          setIsDirty(true);
                        }}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>
                        Deskripsi Sub-Header Modal
                      </label>
                      <input
                        type="text"
                        placeholder="Tersambung langsung via WhatsApp / Online Call"
                        value={bookingSettings?.modalSubtitle || 'Tersambung langsung via WhatsApp / Online Call'}
                        onChange={(e) => {
                          const updated = { ...bookingSettings, modalSubtitle: e.target.value };
                          setBookingSettings(updated);
                          storage.setItem('porto_booking_settings', updated);
                          setIsDirty(true);
                        }}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* 3. Daftar Topik & Layanan Konsultasi */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Daftar Topik & Layanan Konsultasi ({(bookingSettings?.customServices || []).length})
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newId = `srv_${Date.now()}`;
                          const newItem = {
                            id: newId,
                            name: 'Topik Konsultasi Baru',
                            duration: '30 Menit',
                            desc: 'Deskripsi singkat topik konsultasi ini.'
                          };
                          const currentList = Array.isArray(bookingSettings?.customServices) ? bookingSettings.customServices : [];
                          const updated = { ...bookingSettings, customServices: [...currentList, newItem] };
                          setBookingSettings(updated);
                          storage.setItem('porto_booking_settings', updated);
                          setIsDirty(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: `${accentColor}18`,
                          border: `1px solid ${accentColor}30`,
                          color: accentColor,
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={13} />
                        <span>Tambah Topik</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                      {(bookingSettings?.customServices || []).map((srv: any, idx: number) => (
                        <div
                          key={srv.id || idx}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            border: `1px solid ${cardBorder}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '2fr 1fr auto', gap: 8, alignItems: 'center' }}>
                            <div>
                              <input
                                type="text"
                                value={srv.name || ''}
                                placeholder="Nama Topik Layanan"
                                onChange={(e) => {
                                  const updatedServices = [...(bookingSettings.customServices || [])];
                                  updatedServices[idx] = { ...updatedServices[idx], name: e.target.value };
                                  const updated = { ...bookingSettings, customServices: updatedServices };
                                  setBookingSettings(updated);
                                  storage.setItem('porto_booking_settings', updated);
                                  setIsDirty(true);
                                }}
                                style={{ width: '100%', height: 36, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 10px', fontSize: 12.5, fontWeight: 750, outline: 'none' }}
                              />
                            </div>

                            <div>
                              <input
                                type="text"
                                value={srv.duration || ''}
                                placeholder="Durasi (misal: 30 Menit)"
                                onChange={(e) => {
                                  const updatedServices = [...(bookingSettings.customServices || [])];
                                  updatedServices[idx] = { ...updatedServices[idx], duration: e.target.value };
                                  const updated = { ...bookingSettings, customServices: updatedServices };
                                  setBookingSettings(updated);
                                  storage.setItem('porto_booking_settings', updated);
                                  setIsDirty(true);
                                }}
                                style={{ width: '100%', height: 36, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 10px', fontSize: 12, outline: 'none' }}
                              />
                            </div>

                            {(bookingSettings?.customServices || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedServices = (bookingSettings.customServices || []).filter((_: any, i: number) => i !== idx);
                                  const updated = { ...bookingSettings, customServices: updatedServices };
                                  setBookingSettings(updated);
                                  storage.setItem('porto_booking_settings', updated);
                                  setIsDirty(true);
                                }}
                                title="Hapus Topik Layanan"
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: 'none',
                                  color: '#ef4444',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              value={srv.desc || ''}
                              placeholder="Deskripsi singkat topik konsultasi..."
                              onChange={(e) => {
                                const updatedServices = [...(bookingSettings.customServices || [])];
                                updatedServices[idx] = { ...updatedServices[idx], desc: e.target.value };
                                const updated = { ...bookingSettings, customServices: updatedServices };
                                setBookingSettings(updated);
                                storage.setItem('porto_booking_settings', updated);
                                setIsDirty(true);
                              }}
                              style={{ width: '100%', height: 34, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, color: subTextColor, padding: '0 10px', fontSize: 12, outline: 'none' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: LIVE CHAT & STUDIO CONCIERGE (BRIEF PROYEK & CHAT WIDGET) */}
              {settingsActiveTab === 'concierge' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Status Banner */}
                  <div style={{ padding: 14, borderRadius: 16, background: `${accentColor}12`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 850, color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageSquare size={16} color={accentColor} />
                        <span>Studio Concierge & Formulir Brief Proyek</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 2 }}>
                        Widget floating konsultasi langsung & AI brief di pojok kanan bawah website klien
                      </div>
                    </div>
                  </div>

                  {/* Header Title & Subtitle */}
                  <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Judul Header Concierge</label>
                      <input
                        type="text"
                        value={conciergeSettings?.txtHeaderTitle || 'Studio Concierge'}
                        onChange={(e) => {
                          const updated = { ...conciergeSettings, txtHeaderTitle: e.target.value };
                          setConciergeSettings(updated);
                          storage.setItem('porto_concierge_settings', updated);
                          setIsDirty(true);
                        }}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>Subtitle Status Bot</label>
                      <input
                        type="text"
                        value={conciergeSettings?.txtHeaderSubtitle || 'Konsultasi desain, chat langsung & AI Copilot'}
                        onChange={(e) => {
                          const updated = { ...conciergeSettings, txtHeaderSubtitle: e.target.value };
                          setConciergeSettings(updated);
                          storage.setItem('porto_concierge_settings', updated);
                          setIsDirty(true);
                        }}
                        style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* 1. Kebutuhan Desain / Proyek (Layanan) */}
                  <div style={{ padding: 14, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
                        1. Kebutuhan Desain / Kategori Layanan
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const cats = conciergeSettings?.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || [];
                          const updated = {
                            ...conciergeSettings,
                            serviceCategories: [...cats, { id: `srv-${Date.now()}`, name: 'Layanan Baru', desc: 'Deskripsi singkat layanan...', icon: 'Sparkles' }]
                          };
                          setConciergeSettings(updated);
                          storage.setItem('porto_concierge_settings', updated);
                          setIsDirty(true);
                          notify('✨ Kategori layanan brief ditambahkan!');
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 100, background: `${accentColor}18`, border: `1px solid ${accentColor}40`, color: accentColor, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        <Plus size={12} /> Tambah Layanan
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                      {(conciergeSettings?.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || []).map((srv: any, idx: number) => (
                        <div key={srv.id || idx} style={{ padding: '8px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <input
                              type="text"
                              value={srv.name}
                              onChange={(e) => {
                                const cats = [...(conciergeSettings?.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || [])];
                                cats[idx] = { ...cats[idx], name: e.target.value };
                                const updated = { ...conciergeSettings, serviceCategories: cats };
                                setConciergeSettings(updated);
                                storage.setItem('porto_concierge_settings', updated);
                                setIsDirty(true);
                              }}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: textColor, fontSize: 12.5, fontWeight: 750, outline: 'none' }}
                              placeholder="Nama Kategori Layanan"
                            />
                            <input
                              type="text"
                              value={srv.desc || ''}
                              onChange={(e) => {
                                const cats = [...(conciergeSettings?.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || [])];
                                cats[idx] = { ...cats[idx], desc: e.target.value };
                                const updated = { ...conciergeSettings, serviceCategories: cats };
                                setConciergeSettings(updated);
                                storage.setItem('porto_concierge_settings', updated);
                                setIsDirty(true);
                              }}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: subTextColor, fontSize: 11, outline: 'none' }}
                              placeholder="Deskripsi singkat..."
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const cats = (conciergeSettings?.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || []).filter((_: any, i: number) => i !== idx);
                              const updated = { ...conciergeSettings, serviceCategories: cats };
                              setConciergeSettings(updated);
                              storage.setItem('porto_concierge_settings', updated);
                              setIsDirty(true);
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5, padding: 4 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Target Waktu Pengerjaan (Timeline) */}
                  <div style={{ padding: 14, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
                      2. Opsi Target Waktu Pengerjaan
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(conciergeSettings?.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions || []).map((tml: any, idx: number) => (
                        <div key={tml.id || idx} style={{ padding: '6px 10px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="text"
                            value={tml.name}
                            onChange={(e) => {
                              const timelines = [...(conciergeSettings?.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions || [])];
                              timelines[idx] = { ...timelines[idx], name: e.target.value };
                              const updated = { ...conciergeSettings, timelineOptions: timelines };
                              setConciergeSettings(updated);
                              storage.setItem('porto_concierge_settings', updated);
                              setIsDirty(true);
                            }}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: textColor, fontSize: 12.5, fontWeight: 700, outline: 'none' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: CADANGAN & MIGRASI JSON */}
              {settingsActiveTab === 'backup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileDown size={18} color={accentColor} />
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: textColor }}>Ekspor File Cadangan JSON</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: subTextColor, lineHeight: 1.5 }}>
                      Unduh satu berkas JSON lengkap yang berisi seluruh konfigurasi website, biodata lengkap, portofolio, katalog produk, blog, tautan bio, serta titik simpan (checkpoints).
                    </p>
                    <button
                      type="button"
                      onClick={handleExportJsonBackup}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: `0 4px 14px ${accentColor}40`,
                      }}
                    >
                      <FileDown size={14} />
                      <span>Download File Cadangan (.JSON)</span>
                    </button>
                  </div>

                  <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileUp size={18} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: textColor }}>Pulihkan / Impor dari File JSON</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: subTextColor, lineHeight: 1.5 }}>
                      Pulihkan seluruh website dari file cadangan JSON yang pernah Anda unduh sebelumnya atau hasil migrasi dari perangkat lain.
                    </p>
                    <input
                      type="file"
                      ref={jsonFileInputRef}
                      accept=".json,application/json"
                      onChange={handleImportJsonBackup}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => jsonFileInputRef.current?.click()}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 100,
                        border: '1.5px solid #10b981',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <FileUp size={14} />
                      <span>Pilih & Unggah File Cadangan (.JSON)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, flexShrink: 0 }}>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 100,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: textColor,
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowSettingsDrawer(false);
                  setIsDirty(true);
                  notify('✅ Pengaturan diterapkan & disimpan ke draft!');
                }}
                style={{
                  padding: '9px 24px',
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 4px 14px ${accentColor}40`,
                }}
              >
                Simpan & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: BUAT HALAMAN BARU WEBSITE ── */}
      {showNewPageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isRealMobileScreen ? 0 : 20,
            boxSizing: 'border-box',
          }}
          onClick={() => setShowNewPageModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: isRealMobileScreen ? '100%' : 560,
              height: isRealMobileScreen ? '100%' : 'auto',
              maxHeight: isRealMobileScreen ? '100%' : '90vh',
              background: isDark ? '#0f172a' : '#ffffff',
              borderRadius: isRealMobileScreen ? 0 : 24,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: isRealMobileScreen ? '24px 18px' : '28px 30px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                  <FileCode size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 900, color: textColor }}>
                    Buat Halaman Baru
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: subTextColor }}>
                    Tambah halaman kustom mandiri dengan URL bersih & blok dinamis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewPageModal(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: 'none',
                  color: subTextColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Judul Halaman */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 6 }}>
                  Judul Halaman <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Paket & Biaya Layanan"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    if (!newPageSlug) {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                    background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc',
                    color: textColor,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* URL Slug */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 6 }}>
                  Alamat URL Slug (Otomatis)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', overflow: 'hidden' }}>
                  <span style={{ padding: '0 12px', fontSize: 13, color: subTextColor, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, lineHeight: '42px' }}>
                    /p/
                  </span>
                  <input
                    type="text"
                    placeholder="paket-harga"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    style={{
                      flex: 1,
                      padding: '11px 12px',
                      border: 'none',
                      background: 'transparent',
                      color: textColor,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Template Preset Selector with Search & Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 800, color: textColor }}>
                    Pilih Struktur Template Awal
                  </label>
                  <input
                    type="text"
                    placeholder="Cari template (klinik, saas, resto, video...)"
                    value={newPageTemplateSearch}
                    onChange={(e) => setNewPageTemplateSearch(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', color: textColor, fontSize: 11.5, outline: 'none', width: isRealMobileScreen ? '100%' : 240 }}
                  />
                </div>

                {/* Category Filter Pills */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'agency_saas', label: 'Agensi & SaaS' },
                    { id: 'clinic_beauty', label: 'Klinik & Estetika' },
                    { id: 'design_photo', label: 'Desain & Foto' },
                    { id: 'culinary', label: 'Kuliner & Cafe' },
                    { id: 'event_edu', label: 'Event & Edukasi' },
                    { id: 'utility', label: 'Utilitas & Bio' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewPageTemplateCategory(cat.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 750,
                        border: newPageTemplateCategory === cat.id ? `1px solid ${accentColor}` : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        background: newPageTemplateCategory === cat.id ? `${accentColor}20` : 'transparent',
                        color: newPageTemplateCategory === cat.id ? accentColor : subTextColor,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Template Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : 'repeat(2, 1fr)', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                  {[
                    // Agensi, Perusahaan & SaaS
                    { id: 'about_personal', cat: 'utility', label: 'Tentang Saya (Profil & CV)', desc: 'Biografi personal, keahlian, riwayat karier, pengalaman & kontak', icon: <User size={16} /> },
                    { id: 'about_company', cat: 'agency_saas', label: 'Tentang Perusahaan / Brand', desc: 'Visi misi korporat, nilai utama, skala bisnis & konsultasi', icon: <Building2 size={16} /> },
                    { id: 'agency_full', cat: 'agency_saas', label: 'Agensi Kreatif & Digital', desc: 'Hero Video Showreel, Layanan, Capaian & Testimoni', icon: <Video size={16} /> },
                    { id: 'saas_product', cat: 'agency_saas', label: 'Aplikasi SaaS & Cloud', desc: 'Video Demo 2 Menit, Fitur Grid, Pricing & FAQ', icon: <Layers size={16} /> },
                    { id: 'pricing', cat: 'agency_saas', label: 'Paket & Biaya Layanan', desc: '3 kartu paket, checklist fitur & FAQ harga', icon: <DollarSign size={16} /> },
                    { id: 'showcase', cat: 'agency_saas', label: 'Portofolio Showcase & Popup', desc: 'Grid kartu & modal popup multi-foto detail', icon: <Layers size={16} /> },
                    { id: 'features', cat: 'agency_saas', label: 'Fitur & Solusi Produk', desc: 'Grid kartu ikon, teks penjelasan & CTA', icon: <Sparkles size={16} /> },
                    
                    // Klinik & Estetika
                    { id: 'beauty_clinic', cat: 'clinic_beauty', label: 'Klinik Estetika & Skincare', desc: 'Before/After Treatment, Menu Layanan & Reservasi', icon: <Sparkles size={16} /> },
                    { id: 'dental_care', cat: 'clinic_beauty', label: 'Klinik Gigi & Smile Makeover', desc: 'Transformasi Senyum Before/After & Jadwal Dokter', icon: <Award size={16} /> },
                    { id: 'fitness_trainer', cat: 'clinic_beauty', label: 'Fitness & Body Transformation', desc: 'Before/After 90 Hari, Paket Coaching & Nutrisi', icon: <Award size={16} /> },

                    // Desain & Foto
                    { id: 'before_after', cat: 'design_photo', label: 'Before & After Visual Slider', desc: 'Slider geser interaktif sebelum vs sesudah', icon: <Sliders size={16} /> },
                    { id: 'interior_design', cat: 'design_photo', label: 'Desain Interior & Arsitektur', desc: 'Transformasi Ruang Before/After & Portofolio 3D', icon: <ImageIcon size={16} /> },
                    { id: 'gallery', cat: 'design_photo', label: 'Galeri Foto & Lightbox Carousel', desc: 'Grid foto & penampil carousel fullscreen', icon: <ImageIcon size={16} /> },

                    // Kuliner & Cafe
                    { id: 'coffee_shop', cat: 'culinary', label: 'Cafe & Coffee Shop', desc: 'Menu Minuman Signature, Galeri Suasana & Alamat', icon: <Sparkles size={16} /> },

                    // Event & Edukasi
                    { id: 'webinar_event', cat: 'event_edu', label: 'Event & Workshop Booking', desc: 'Jadwal seminar, fasilitas, tiket & form daftar', icon: <Calendar size={16} /> },
                    { id: 'about_team', cat: 'event_edu', label: 'Tentang Kami & Cerita Tim', desc: 'Artikel biografi, quote sorotan & statistik', icon: <User size={16} /> },
                    { id: 'roadmap', cat: 'event_edu', label: 'Alur Kerja & Roadmap', desc: 'Panduan tahapan pengerjaan bertahap 1-4', icon: <ListOrdered size={16} /> },
                    { id: 'stats_success', cat: 'event_edu', label: 'Prestasi & Testimoni Klien', desc: 'Angka capaian & review kepuasan klien', icon: <Award size={16} /> },

                    // Utilitas & Bio
                    { id: 'faq', cat: 'utility', label: 'Tanya Jawab (FAQ Center)', desc: 'Akordion Q&A interaktif & pusat bantuan', icon: <HelpCircle size={16} /> },
                    { id: 'link_bio', cat: 'utility', label: 'Link in Bio Cepat', desc: 'Kumpulan tombol akses kontak & media', icon: <Link2 size={16} /> },
                    { id: 'legal', cat: 'utility', label: 'Syarat & Ketentuan Legal', desc: 'Format artikel resmi & kebijakan privasi', icon: <FileText size={16} /> },
                    { id: 'blank', cat: 'utility', label: 'Halaman Kosong Bebas', desc: 'Kanvas bersih untuk diisi blok apa saja', icon: <Plus size={16} /> },
                  ].filter((tpl) => {
                    const matchCat = newPageTemplateCategory === 'all' || tpl.cat === newPageTemplateCategory;
                    const q = newPageTemplateSearch.toLowerCase().trim();
                    const matchSearch = !q || tpl.label.toLowerCase().includes(q) || tpl.desc.toLowerCase().includes(q);
                    return matchCat && matchSearch;
                  }).map((tpl) => {
                    const isSel = newPageTemplate === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setNewPageTemplate(tpl.id as any)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 14,
                          background: isSel ? `${accentColor}15` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                          border: isSel ? `2px solid ${accentColor}` : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isSel ? accentColor : textColor }}>
                          {tpl.icon}
                          <span style={{ fontSize: 13, fontWeight: 800 }}>{tpl.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: subTextColor, lineHeight: 1.4 }}>{tpl.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Show in Navbar Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                <input
                  type="checkbox"
                  checked={newPageShowInNavbar}
                  onChange={(e) => setNewPageShowInNavbar(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: textColor }}>Tampilkan di Menu Navigasi Utama</span>
                  <span style={{ fontSize: 11, color: subTextColor }}>Otomatis menambahkan tautan menu ke header navbar publik</span>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
              <button
                onClick={() => setShowNewPageModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 100,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                  background: 'transparent',
                  color: subTextColor,
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleCreateNewCustomPage}
                disabled={!newPageTitle.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: newPageTitle.trim() ? 'pointer' : 'not-allowed',
                  opacity: newPageTitle.trim() ? 1 : 0.5,
                  boxShadow: `0 4px 14px ${accentColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={15} />
                <span>Buat Halaman Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL POP-UP: EDIT PROJECT DETAIL FULL PREVIEW ── */}
      {editingProjectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isRealMobileScreen ? 0 : 16,
            boxSizing: 'border-box',
          }}
          onClick={() => setEditingProjectModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: isRealMobileScreen ? '100%' : 640,
              height: isRealMobileScreen ? '100%' : 'auto',
              maxHeight: isRealMobileScreen ? '100%' : '88vh',
              overflowY: 'auto',
              borderRadius: isRealMobileScreen ? 0 : 24,
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: isRealMobileScreen ? '20px 16px' : 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={20} color={accentColor} />
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor }}>
                  Kustomisasi Detail Portofolio
                </h3>
              </div>
              <button onClick={() => setEditingProjectModal(null)} style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Cover image in modal */}
            <div style={{ width: '100%', height: 210, borderRadius: 16, background: isDark ? '#08080f' : '#f1f5f9', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {editingProjectModal.coverImage ? (
                <img src={editingProjectModal.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon size={36} opacity={0.4} />
              )}
              <button
                onClick={() => triggerUpload({ type: 'modal_project' })}
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  padding: '7px 14px',
                  borderRadius: 100,
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Camera size={13} />
                <span>Ganti Cover Utama</span>
              </button>
            </div>

            {/* Gallery Images Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: subTextColor, textTransform: 'uppercase' }}>
                  Galeri Tangkapan Layar Tambahan
                </label>
                <button
                  onClick={() => {
                    const curImgs = editingProjectModal.images || [];
                    setEditingProjectModal({ ...editingProjectModal, images: [...curImgs, ''] });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 100,
                    background: `${accentColor}18`,
                    border: `1px solid ${accentColor}40`,
                    color: accentColor,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={12} />
                  <span>+ Tambah Gambar</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                {(editingProjectModal.images || []).map((imgUrl: string, gIdx: number) => (
                  <div key={gIdx} style={{ height: 75, borderRadius: 10, background: isDark ? '#08080f' : '#f1f5f9', position: 'relative', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: subTextColor, fontSize: 10 }}>Kosong</div>
                    )}
                    <button
                      onClick={() => {
                        const newImgs = (editingProjectModal.images || []).filter((_: any, i: number) => i !== gIdx);
                        setEditingProjectModal({ ...editingProjectModal, images: newImgs });
                      }}
                      style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Judul Proyek</label>
                <input
                  type="text"
                  value={editingProjectModal.title || editingProjectModal.name || ''}
                  onChange={(e) => setEditingProjectModal({ ...editingProjectModal, title: e.target.value, name: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Kategori Proyek</label>
                <input
                  type="text"
                  value={editingProjectModal.category || ''}
                  onChange={(e) => setEditingProjectModal({ ...editingProjectModal, category: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Nama Klien</label>
                <input
                  type="text"
                  placeholder="Contoh: PT Inovasi Mandiri"
                  value={editingProjectModal.client || ''}
                  onChange={(e) => setEditingProjectModal({ ...editingProjectModal, client: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Tahun / Periode</label>
                <input
                  type="text"
                  placeholder="2026"
                  value={editingProjectModal.year || ''}
                  onChange={(e) => setEditingProjectModal({ ...editingProjectModal, year: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Deskripsi Studi Kasus & Solusi</label>
              <textarea
                rows={4}
                value={editingProjectModal.description || ''}
                onChange={(e) => setEditingProjectModal({ ...editingProjectModal, description: e.target.value })}
                style={{ width: '100%', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: 12, fontSize: 13, outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Live Demo URL (Opsional)</label>
              <input
                type="text"
                placeholder="https://..."
                value={editingProjectModal.liveUrl || editingProjectModal.url || ''}
                onChange={(e) => setEditingProjectModal({ ...editingProjectModal, liveUrl: e.target.value, url: e.target.value })}
                style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <button
              onClick={() => {
                setProjects(prev => prev.map(p => p.id === editingProjectModal.id ? editingProjectModal : p));
                setIsDirty(true);
                setEditingProjectModal(null);
                notify('✅ Pop-up portofolio diperbarui!');
              }}
              style={{
                height: 44,
                borderRadius: 100,
                border: 'none',
                background: accentColor,
                color: '#fff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${accentColor}40`,
              }}
            >
              Simpan Pop-up Proyek
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL POP-UP: EDIT PRODUCT DETAIL FULL PREVIEW ── */}
      {editingProductModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isRealMobileScreen ? 0 : 16,
            boxSizing: 'border-box',
          }}
          onClick={() => setEditingProductModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: isRealMobileScreen ? '100%' : 540,
              height: isRealMobileScreen ? '100%' : 'auto',
              maxHeight: isRealMobileScreen ? '100%' : '88vh',
              overflowY: 'auto',
              borderRadius: isRealMobileScreen ? 0 : 24,
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: isRealMobileScreen ? '20px 16px' : 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={20} color={accentColor} />
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor }}>
                  Kustomisasi Pop-up Produk
                </h3>
              </div>
              <button onClick={() => setEditingProductModal(null)} style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Product Cover image */}
            <div style={{ width: '100%', height: 180, borderRadius: 16, background: isDark ? '#08080f' : '#f1f5f9', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {editingProductModal.image ? (
                <img src={editingProductModal.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon size={32} opacity={0.4} />
              )}
              <button
                onClick={() => triggerUpload({ type: 'product', id: editingProductModal.id })}
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  padding: '7px 14px',
                  borderRadius: 100,
                  background: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Camera size={13} />
                <span>Ganti Gambar Produk</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Nama Produk / Paket</label>
                <input
                  type="text"
                  value={editingProductModal.name || ''}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, name: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Kategori Produk</label>
                <input
                  type="text"
                  value={editingProductModal.category || ''}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, category: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Harga Normal (Rp)</label>
                <input
                  type="number"
                  value={editingProductModal.price || 0}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, price: Number(e.target.value) })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Harga Coret / Diskon (Rp)</label>
                <input
                  type="number"
                  placeholder="Opsional"
                  value={editingProductModal.originalPrice || ''}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Badge Promo (Contoh: BEST SELLER)</label>
                <input
                  type="text"
                  placeholder="BEST SELLER"
                  value={editingProductModal.badge || ''}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, badge: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Link WhatsApp Checkout / Beli</label>
                <input
                  type="text"
                  placeholder="https://wa.me/628123456789?text=Beli"
                  value={editingProductModal.buyUrl || ''}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, buyUrl: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Deskripsi Lengkap & Spesifikasi</label>
              <textarea
                rows={3}
                value={editingProductModal.description || ''}
                onChange={(e) => setEditingProductModal({ ...editingProductModal, description: e.target.value })}
                style={{ width: '100%', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: 12, fontSize: 13, outline: 'none', resize: 'vertical' }}
              />
            </div>

            <button
              onClick={() => {
                setProducts(prev => prev.map(prod => prod.id === editingProductModal.id ? editingProductModal : prod));
                setIsDirty(true);
                setEditingProductModal(null);
                notify('✅ Pop-up produk diperbarui!');
              }}
              style={{
                height: 44,
                borderRadius: 100,
                border: 'none',
                background: accentColor,
                color: '#fff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${accentColor}40`,
              }}
            >
              Simpan Pop-up Produk
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL POP-UP: EDIT DETAIL GAME (/games) ── */}
      {editingGameModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
          }}
          onClick={() => setEditingGameModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 24,
              background: isDark ? '#111827' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accentColor}20`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayoutGrid size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                  Edit Game Instance
                </h3>
              </div>
              <button
                onClick={() => setEditingGameModal(null)}
                style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Thumbnail Preview & Upload/Gallery */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 6 }}>
                Thumbnail / Cover Game
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 100, height: 75, borderRadius: 12, background: isDark ? '#1e293b' : '#f1f5f9', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
                  {editingGameModal.thumbnailUrl ? (
                    <img src={editingGameModal.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <LayoutGrid size={24} color={subTextColor} opacity={0.5} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e: any) => {
                          const file = e.target?.files?.[0];
                          if (!file) return;
                          notify('Mengunggah thumbnail game ke Cloudinary...');
                          try {
                            const res = await uploadToCloudinary(file);
                            if (res && res.secure_url) {
                              setEditingGameModal(prev => prev ? { ...prev, thumbnailUrl: res.secure_url } : null);
                              notify('✅ Thumbnail berhasil diunggah!');
                            }
                          } catch (err) {
                            notify('❌ Gagal upload gambar', 'error');
                          }
                        };
                        input.click();
                      }}
                      style={{ padding: '6px 12px', borderRadius: 8, background: accentColor, color: '#fff', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Upload size={12} /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => openMediaPicker({ type: 'game_thumbnail' })}
                      style={{ padding: '6px 12px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: textColor, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <ImageIcon size={12} /> Buka Galeri
                    </button>
                  </div>
                  <span style={{ fontSize: 11, color: subTextColor }}>Format disarankan 16:9 atau 4:3 (JPG, PNG, WebP)</span>
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Judul Game *</label>
              <input
                type="text"
                value={editingGameModal.title || ''}
                onChange={(e) => setEditingGameModal({ ...editingGameModal, title: e.target.value })}
                style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Slug URL (Identifier)</label>
              <input
                type="text"
                value={editingGameModal.slug || ''}
                onChange={(e) => setEditingGameModal({ ...editingGameModal, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Deskripsi Lengkap Game</label>
              <textarea
                rows={3}
                value={editingGameModal.description || ''}
                onChange={(e) => setEditingGameModal({ ...editingGameModal, description: e.target.value })}
                style={{ width: '100%', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: 12, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={async () => {
                if (!editingGameModal.title.trim()) {
                  notify('Judul game wajib diisi!', 'error');
                  return;
                }
                try {
                  const saved = await saveGameInstance(editingGameModal);
                  setGames(prev => prev.map(g => g.id === saved.id ? saved : g));
                  setEditingGameModal(null);
                  notify('✅ Game berhasil disimpan!');
                } catch (err: any) {
                  notify('Gagal menyimpan game: ' + err.message, 'error');
                }
              }}
              style={{
                height: 44,
                borderRadius: 100,
                border: 'none',
                background: accentColor,
                color: '#fff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${accentColor}40`,
                marginTop: 6
              }}
            >
              Simpan Game
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL POP-UP: EDIT BLOG DETAIL FULL PREVIEW & MARKDOWN EDITOR ── */}
      {editingBlogModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 40000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isRealMobileScreen ? 0 : 16,
            boxSizing: 'border-box',
          }}
          onClick={() => setEditingBlogModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: isRealMobileScreen ? '100%' : 680,
              height: isRealMobileScreen ? '100%' : 'auto',
              maxHeight: isRealMobileScreen ? '100%' : '90vh',
              overflowY: 'auto',
              borderRadius: isRealMobileScreen ? 0 : 24,
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: isRealMobileScreen ? '20px 16px' : 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color={accentColor} />
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor }}>
                  Editor Artikel Blog
                </h3>
              </div>
              <button onClick={() => setEditingBlogModal(null)} style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Cover Image Uploader */}
            <div style={{ position: 'relative', height: 160, borderRadius: 16, overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${cardBorder}` }}>
              {editingBlogModal.coverImage ? (
                <img src={editingBlogModal.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: subTextColor, gap: 6 }}>
                  <ImageIcon size={28} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Belum Ada Cover Artikel</span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => triggerUpload({ type: 'blog', id: editingBlogModal.id })}
                  style={{ padding: '6px 12px', borderRadius: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Camera size={12} />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => openMediaPicker({ type: 'blog', id: editingBlogModal.id })}
                  style={{ padding: '6px 12px', borderRadius: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ImageIcon size={12} />
                  <span>Galeri</span>
                </button>
                {editingBlogModal.coverImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBlogModal({ ...editingBlogModal, coverImage: '' });
                      handleRemoveImage('blog', editingBlogModal.id);
                    }}
                    style={{ padding: '6px 10px', borderRadius: 100, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Judul Artikel</label>
              <input
                type="text"
                value={editingBlogModal.title || ''}
                onChange={(e) => setEditingBlogModal({ ...editingBlogModal, title: e.target.value })}
                style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Kategori Artikel</label>
                <input
                  type="text"
                  placeholder="Design Insight"
                  value={editingBlogModal.category || ''}
                  onChange={(e) => setEditingBlogModal({ ...editingBlogModal, category: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Waktu Baca</label>
                <input
                  type="text"
                  placeholder="4 min read"
                  value={editingBlogModal.readTime || ''}
                  onChange={(e) => setEditingBlogModal({ ...editingBlogModal, readTime: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>Tanggal Terbit</label>
                <input
                  type="text"
                  placeholder="24 Ags 2026"
                  value={editingBlogModal.date || ''}
                  onChange={(e) => setEditingBlogModal({ ...editingBlogModal, date: e.target.value })}
                  style={{ width: '100%', height: 40, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '0 12px', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {/* Mode Switcher: Tulis vs Pratinjau */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, paddingBottom: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setBlogEditorTab('edit')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    border: 'none',
                    background: blogEditorTab === 'edit' ? accentColor : 'transparent',
                    color: blogEditorTab === 'edit' ? '#ffffff' : subTextColor,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  📝 Tulis Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setBlogEditorTab('preview')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    border: 'none',
                    background: blogEditorTab === 'preview' ? accentColor : 'transparent',
                    color: blogEditorTab === 'preview' ? '#ffffff' : subTextColor,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  👁️ Pratinjau Artikel
                </button>
              </div>

              {/* Quick Markdown Toolbar (Only visible on edit tab) */}
              {blogEditorTab === 'edit' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => insertBlogMarkdown('**', '**')} title="Tebal (Bold)" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bold size={13} />
                  </button>
                  <button type="button" onClick={() => insertBlogMarkdown('*', '*')} title="Miring (Italic)" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Italic size={13} />
                  </button>
                  <button type="button" onClick={() => insertBlogMarkdown('## ')} title="Subjudul H2" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heading2 size={13} />
                  </button>
                  <button type="button" onClick={() => insertBlogMarkdown('### ')} title="Subbagian H3" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heading3 size={13} />
                  </button>
                  <button type="button" onClick={() => insertBlogMarkdown('> ')} title="Kutipan (Quote)" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Quote size={13} />
                  </button>
                  <button type="button" onClick={() => insertBlogMarkdown('- ')} title="Daftar Poin (List)" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <List size={13} />
                  </button>
                  <button type="button" onClick={() => insertBlogMarkdown('1. ')} title="Daftar Nomor" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ListOrdered size={13} />
                  </button>
                  <button type="button" onClick={() => insertBlogMarkdown('`', '`')} title="Kode (Code)" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Code size={13} />
                  </button>
                  <button type="button" onClick={() => insertBlogMarkdown('[', '](https://)')} title="Tautan (Link)" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${cardBorder}`, background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Link2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Markdown Textarea vs Rendered Preview */}
            {blogEditorTab === 'edit' ? (
              <div>
                <textarea
                  id="blog-markdown-textarea"
                  rows={9}
                  placeholder="Tulis artikel lengkap menggunakan format Markdown (misal: ## Judul, **tebal**, *miring*, - list, > kutipan)..."
                  value={editingBlogModal.content || editingBlogModal.excerpt || ''}
                  onChange={(e) => setEditingBlogModal({ ...editingBlogModal, content: e.target.value })}
                  style={{ width: '100%', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: 14, fontSize: 13.5, fontFamily: 'monospace', lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            ) : (
              <div style={{ padding: 18, borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}`, maxHeight: 300, overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 8px', fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, color: textColor }}>
                  {editingBlogModal.title || 'Judul Artikel'}
                </h2>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: subTextColor, marginBottom: 16 }}>
                  <span>{editingBlogModal.category || 'General'}</span>
                  <span>•</span>
                  <span>{editingBlogModal.readTime || '3 min read'}</span>
                  <span>•</span>
                  <span>{editingBlogModal.date || 'Hari ini'}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: textColor, whiteSpace: 'pre-wrap' }}>
                  {editingBlogModal.content || editingBlogModal.excerpt || 'Belum ada isi konten artikel.'}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setBlogPosts(prev => prev.map(b => b.id === editingBlogModal.id ? editingBlogModal : b));
                setIsDirty(true);
                setEditingBlogModal(null);
                notify('✅ Konten artikel blog berhasil diperbarui!');
              }}
              style={{
                height: 44,
                borderRadius: 100,
                border: 'none',
                background: accentColor,
                color: '#fff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${accentColor}40`,
              }}
            >
              Simpan Artikel
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: LINK / URL DESTINATION EDITOR ── */}
      {editingLinkItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 30000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setEditingLinkItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              borderRadius: 24,
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={18} color={accentColor} />
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textColor }}>
                  Atur Target Link & URL
                </h3>
              </div>
              <button onClick={() => setEditingLinkItem(null)} style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {(() => {
              const { parentIdx, subIdx } = editingLinkItem;
              const targetObj = subIdx !== undefined
                ? data.navbar?.items?.[parentIdx]?.subItems?.[subIdx]
                : data.navbar?.items?.[parentIdx];

              if (!targetObj) return null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Teks Label Menu
                    </label>
                    <input
                      type="text"
                      value={targetObj.label || ''}
                      onChange={(e) => {
                        const newItems = [...(data.navbar?.items || [])];
                        if (subIdx !== undefined) {
                          newItems[parentIdx].subItems[subIdx].label = e.target.value;
                        } else {
                          newItems[parentIdx].label = e.target.value;
                        }
                        updateField('navbar.items', newItems);
                      }}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 12,
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        color: textColor,
                        padding: '0 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: subTextColor, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Target URL / Halaman Tujuan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: /portfolio, /about, #hero, atau https://..."
                      value={targetObj.url || ''}
                      onChange={(e) => {
                        const newItems = [...(data.navbar?.items || [])];
                        if (subIdx !== undefined) {
                          newItems[parentIdx].subItems[subIdx].url = e.target.value;
                        } else {
                          newItems[parentIdx].url = e.target.value;
                        }
                        updateField('navbar.items', newItems);
                      }}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 12,
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        color: textColor,
                        padding: '0 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Preset Shortcuts */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: subTextColor, marginBottom: 6 }}>Rute Cepat:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['#home', '/portfolio', '/about', '/catalog', '/blog', '/links', '#contact'].map((shortcut) => (
                        <button
                          key={shortcut}
                          onClick={() => {
                            const newItems = [...(data.navbar?.items || [])];
                            if (subIdx !== undefined) {
                              newItems[parentIdx].subItems[subIdx].url = shortcut;
                            } else {
                              newItems[parentIdx].url = shortcut;
                            }
                            updateField('navbar.items', newItems);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 100,
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            border: 'none',
                            color: textColor,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {shortcut}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingLinkItem(null)}
                    style={{
                      marginTop: 8,
                      height: 40,
                      borderRadius: 100,
                      border: 'none',
                      background: accentColor,
                      color: '#ffffff',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Simpan Target Link
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── INTERACTIVE ICON PICKER MODAL ── */}
      {iconPickerTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 50000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
          }}
          onClick={() => setIconPickerTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '85vh',
              borderRadius: 24,
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxSizing: 'border-box',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette size={20} color={accentColor} />
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor }}>
                  {iconPickerTarget.title || 'Pilih Ikon Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIconPickerTarget(null)}
                style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: subTextColor }} />
              <input
                type="text"
                placeholder="Cari nama atau kategori ikon..."
                value={iconSearchQuery}
                onChange={(e) => setIconSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 12,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  color: textColor,
                  padding: '0 12px 0 36px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Icon Grid */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 340, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: 4 }}>
              {EDITABLE_ICON_LIST
                .filter(item => !iconSearchQuery || item.name.toLowerCase().includes(iconSearchQuery.toLowerCase()) || item.label.toLowerCase().includes(iconSearchQuery.toLowerCase()))
                .map((item) => {
                  const IconComp = item.icon;
                  const isSelected = (iconPickerTarget.currentIcon || '').toLowerCase() === item.name.toLowerCase();
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        if (iconPickerTarget.type === 'skill' && iconPickerTarget.index !== undefined) {
                          const newSkills = [...(data.profile?.skills || [])];
                          newSkills[iconPickerTarget.index].icon = item.name;
                          updateField('profile.skills', newSkills);
                          notify(`✨ Ikon layanan diubah menjadi "${item.name}"!`);
                        } else if (iconPickerTarget.type === 'link' && iconPickerTarget.index !== undefined) {
                          const newLinks = [...bioLinks];
                          newLinks[iconPickerTarget.index].icon = item.name;
                          setBioLinks(newLinks);
                          setIsDirty(true);
                          notify(`✨ Ikon tautan diubah menjadi "${item.name}"!`);
                        }
                        setIconPickerTarget(null);
                        setIconSearchQuery('');
                      }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 14,
                        background: isSelected ? `${accentColor}25` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                        border: `1.5px solid ${isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}`,
                        color: isSelected ? accentColor : textColor,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <IconComp size={22} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── 1. AI & OFFLINE WEBSITE TEMPLATE PRESET GENERATOR MODAL ── */}
      {showTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 50000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isRealMobileScreen ? 0 : 16,
            boxSizing: 'border-box',
          }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: isRealMobileScreen ? '100%' : 760,
              height: isRealMobileScreen ? '100%' : 'auto',
              maxHeight: isRealMobileScreen ? '100%' : '88vh',
              overflowY: 'auto',
              borderRadius: isRealMobileScreen ? 0 : 24,
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              padding: isRealMobileScreen ? '20px 16px' : 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxSizing: 'border-box',
            }}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor }}>
                    Template Presets & AI Website Designer
                  </h3>
                  <p style={{ margin: 0, fontSize: 11.5, color: subTextColor }}>
                    Pilih 12+ preset profesi instan (100% lokal) atau generate kustom dengan AI
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Pill */}
            <div style={{ display: 'flex', gap: 8, padding: 4, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', width: 'fit-content' }}>
              <button
                type="button"
                onClick={() => setTemplateGenMode('offline')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 100,
                  border: 'none',
                  background: templateGenMode === 'offline' ? accentColor : 'transparent',
                  color: templateGenMode === 'offline' ? '#ffffff' : subTextColor,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Zap size={14} />
                <span>Template Instan (Offline 12+)</span>
              </button>
              <button
                type="button"
                onClick={() => setTemplateGenMode('ai')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 100,
                  border: 'none',
                  background: templateGenMode === 'ai' ? accentColor : 'transparent',
                  color: templateGenMode === 'ai' ? '#ffffff' : subTextColor,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Sparkles size={14} />
                <span>AI Website Generator (Online)</span>
              </button>
            </div>

            {/* TAB 1: OFFLINE PRESETS */}
            {templateGenMode === 'offline' && (() => {
              const currentTmpl = OFFLINE_WEBSITE_TEMPLATES.find(t => t.id === selectedTemplateId) || OFFLINE_WEBSITE_TEMPLATES[0];
              const categories = [
                { id: 'all', label: 'Semua Kategori' },
                { id: 'creative', label: 'Desain & Seni' },
                { id: 'tech', label: 'Tech & Dev' },
                { id: 'business', label: 'Bisnis & Konsultan' },
                { id: 'photo', label: 'Fotografi & Media' },
              ];

              const filteredTemplates = OFFLINE_WEBSITE_TEMPLATES.filter((t) => {
                const matchCat = templateCategoryFilter === 'all' || t.category === templateCategoryFilter;
                const matchSearch = !templateSearchQuery || t.label.toLowerCase().includes(templateSearchQuery.toLowerCase()) || t.title.toLowerCase().includes(templateSearchQuery.toLowerCase());
                return matchCat && matchSearch;
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Live Selected Template Preview Card */}
                  {currentTmpl && (
                    <div style={{ padding: 14, borderRadius: 16, background: `${accentColor}10`, border: `1px solid ${accentColor}30`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: accentColor, textTransform: 'uppercase' }}>
                            Pratinjau Preset: {currentTmpl.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyWebsiteTemplate(currentTmpl.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 100,
                            border: 'none',
                            background: accentColor,
                            color: '#ffffff',
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: `0 4px 12px ${accentColor}40`,
                          }}
                        >
                          <Zap size={13} />
                          <span>Terapkan Template Ini</span>
                        </button>
                      </div>

                      <div>
                        <h4 style={{ margin: '0 0 2px', fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: textColor }}>
                          {currentTmpl.hero?.headline || currentTmpl.title}
                        </h4>
                        <p style={{ margin: '0 0 6px', fontSize: 12.5, fontWeight: 700, color: accentColor }}>
                          {currentTmpl.hero?.tagline || currentTmpl.tagline}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: subTextColor, lineHeight: 1.5 }}>
                          {currentTmpl.hero?.bio || currentTmpl.bio}
                        </p>
                      </div>

                      {currentTmpl.profile?.skills && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                          {currentTmpl.profile.skills.map((sk: any, sIdx: number) => (
                            <span key={sIdx} style={{ fontSize: 10, fontWeight: 750, padding: '2px 8px', borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: textColor, border: `1px solid ${cardBorder}` }}>
                              • {sk.name || sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Search & Category Filter */}
                  <div style={{ display: 'flex', flexDirection: isRealMobileScreen ? 'column' : 'row', gap: 10, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, width: '100%' }}>
                      <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: subTextColor }} />
                      <input
                        type="text"
                        placeholder="Cari profesi (Desainer, Developer, Kafe, dll)..."
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        style={{ width: '100%', height: 38, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${cardBorder}`, color: textColor, padding: '0 12px 0 34px', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: '100%', paddingBottom: 2 }}>
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setTemplateCategoryFilter(c.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 100,
                            border: `1px solid ${templateCategoryFilter === c.id ? accentColor : cardBorder}`,
                            background: templateCategoryFilter === c.id ? `${accentColor}20` : 'transparent',
                            color: templateCategoryFilter === c.id ? accentColor : textColor,
                            fontSize: 11.5,
                            fontWeight: 750,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Grid Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: isRealMobileScreen ? '1fr' : 'repeat(2, 1fr)', gap: 10, maxHeight: 280, overflowY: 'auto', padding: 2 }}>
                    {filteredTemplates.map((t) => {
                      const isSel = selectedTemplateId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTemplateId(t.id)}
                          style={{
                            padding: 14,
                            borderRadius: 16,
                            background: isSel ? `${accentColor}15` : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                            border: `1.5px solid ${isSel ? accentColor : cardBorder}`,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: 13.5, fontWeight: 900, color: isSel ? accentColor : textColor }}>
                              {t.label}
                            </div>
                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: `${accentColor}18`, color: accentColor, textTransform: 'uppercase' }}>
                              {t.category}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11.5, color: subTextColor, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {t.title} — {t.tagline}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* TAB 2: AI WEBSITE GENERATOR */}
            {templateGenMode === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, display: 'block', marginBottom: 4 }}>
                    Deskripsikan Konsep Website & Gaya Visual yang Anda Inginkan:
                  </label>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Contoh: Buatkan konsep website portofolio untuk Studio Arsitektur & Desain Interior Minimalis di Bandung dengan nuansa warna monokrom elegan dan layanan konsultasi denah 3D..."
                    style={{ width: '100%', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: 14, fontSize: 13, lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Prompt Ideas */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: subTextColor, marginBottom: 6 }}>Ide Prompt Cepat:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      'Portofolio Desainer UI/UX & Brand Identity modern dan futuristik',
                      'Studio Arsitektur & Interior Desain minimalis mewah',
                      'Agensi Kreatif Digital, Social Media Marketing & Video',
                      'Portofolio Fotografer Fashion & Editorial High-End',
                      'Coffee Shop & Roastery dengan nuansa hangat dan menu kopi',
                      'Konsultan Bisnis & Startup Pitch Deck Specialist',
                    ].map((idea, iIdx) => (
                      <button
                        key={iIdx}
                        type="button"
                        onClick={() => setAiPrompt(idea)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 100,
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          border: `1px solid ${cardBorder}`,
                          color: textColor,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        💡 {idea}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiWebsite}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  style={{
                    height: 46,
                    borderRadius: 100,
                    border: 'none',
                    background: accentColor,
                    color: '#ffffff',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: isAiGenerating ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: `0 4px 16px ${accentColor}50`,
                  }}
                >
                  {isAiGenerating ? <RefreshCw size={16} className="cms-spin" /> : <Sparkles size={16} />}
                  <span>{isAiGenerating ? 'AI Sedang Merancang Website...' : 'Generate Website dengan AI'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MEDIA GALLERY MODAL INTEGRATION ── */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => {
          if (uploadTargetRef.current) {
            applyImageUrl(uploadTargetRef.current.type, url, uploadTargetRef.current.id, uploadTargetRef.current.index);
            setIsGalleryOpen(false);
            notify('✨ Gambar berhasil dipilih dari galeri!');
          }
        }}
      />
    </div>
  );
};

export default VisualWebEditor;
