import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, X, Sparkles, Send, BrainCircuit, Terminal, Cpu, 
  Zap, Bot, MessageSquare, ShieldCheck, Activity, Globe, Layout, 
  FolderKanban, StickyNote, Settings, ChevronRight, ChevronDown, RefreshCw,
  Database, Users, Link, Palette, ImageIcon, Smartphone, Save,
  ArrowLeft, Clock, AlertCircle, Trash2, Plus, CornerDownLeft, Info,
  Copy, Check, ExternalLink, Lightbulb, Compass, ShoppingBag,
  FileText, BookOpen, Layers, Edit3, Share2, Download, HardDrive,
  Gamepad2, LayoutGrid, Radio, QrCode, Receipt, UploadCloud, FolderPlus, FilePlus2,
  PlusCircle, DollarSign, DownloadCloud, Image as GalleryIcon, Sliders
} from 'lucide-react';
import { callGemini } from '../../utils/ai';
import { storage } from '../../utils/storage';
import { subscribeToGames } from '../../services/gameService';
import MediaGalleryModal from './MediaGalleryModal';

// Simple Markdown Parser for clean response formatting
const MarkdownText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 800, color: 'inherit' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{ background: 'rgba(0,0,0,0.15)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.9em' }}>{part.slice(1, -1)}</code>;
        }
        if (part === '\n') {
          return <br key={i} />;
        }
        return part;
      })}
    </span>
  );
};

// Curated AI Suggestions (Icon-driven, Zero Emojis)
const PROMPT_SUGGESTIONS = [
  { icon: FileText, label: 'Ide Artikel Blog', prompt: 'Berikan 3 ide artikel blog menarik seputar desain web modern, UI/UX, dan teknologi terkini beserta outline singkatnya.' },
  { icon: FolderKanban, label: 'Optimasi Portofolio', prompt: 'Bagaimana cara terbaik menstrukturkan studi kasus proyek portofolio agar memikat calon klien dan perusahaan ternama?' },
  { icon: Palette, label: 'Palet Warna & Tipografi', prompt: 'Rekomendasikan 2 kombinasi palet warna futuristik dan jenis font Google Fonts yang cocok untuk agensi digital kreatif.' },
  { icon: Globe, label: 'Tips SEO Website', prompt: 'Berikan checklist 5 langkah cepat untuk meningkatkan SEO on-page pada website portofolio agensi.' },
  { icon: ShoppingBag, label: 'Strategi Katalog Jasa', prompt: 'Bagaimana cara menyusun paket harga dan penawaran layanan digital agency agar tingkat konversi pemesanan tinggi?' },
  { icon: Edit3, label: 'Draft Memo Kerja', prompt: 'Buatkan template checklist to-do list harian untuk web developer dan desainer UI/UX.' }
];

const ENGINE_META: Record<string, { name: string; placeholder: string; searchUrl: string; directUrl: string; homeUrl: string; icon: React.ReactNode }> = {
  google: {
    name: 'Google',
    placeholder: 'Cari di Google Search...',
    searchUrl: 'https://www.google.com/search?igu=1&q=',
    directUrl: 'https://www.google.com/search?q=',
    homeUrl: 'https://www.google.com/search?igu=1',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
    )
  },
  pinterest: {
    name: 'Pinterest',
    placeholder: 'Cari inspirasi di Pinterest...',
    searchUrl: 'https://www.google.com/search?igu=1&q=site:pinterest.com+',
    directUrl: 'https://www.pinterest.com/search/pins/?q=',
    homeUrl: 'https://www.google.com/search?igu=1&q=site:pinterest.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#E60023" d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
      </svg>
    )
  },
  dribbble: {
    name: 'Dribbble',
    placeholder: 'Cari karya desain di Dribbble...',
    searchUrl: 'https://www.google.com/search?igu=1&q=site:dribbble.com+',
    directUrl: 'https://dribbble.com/search/',
    homeUrl: 'https://www.google.com/search?igu=1&q=site:dribbble.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#EA4C89" d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm8.848 10.655c-.273-.016-2.809-.164-5.543.953-.125-.281-.25-.563-.391-.844a27.18 27.18 0 0 0-.828-1.64c3.078-1.297 4.297-2.906 4.438-3.109a9.923 9.923 0 0 1 2.324 4.64zm-4.484-6.148c-.141.188-1.297 1.688-4.25 2.938A9.97 9.97 0 0 1 7.219 2.64 9.932 9.932 0 0 1 12 2.016c1.609 0 3.109.391 4.364 1.109v.031l-.001.352zm-10.453-.984c.281.391 2.156 3.016 4.969 4.375-1.281 3.516-2.672 7.031-2.906 7.64-2.828-.844-5.203-2.734-5.203-2.734a9.923 9.923 0 0 1 3.14-9.281zm-.813 11.234s2.297 1.844 5.047 2.656c-.344.969-.734 1.891-1.156 2.766a9.99 9.99 0 0 1-5.75-5.422h1.859zm8.594 7.234a26.19 26.19 0 0 0 1.25-2.938c2.453-.391 4.875-.125 5.094-.094a9.99 9.99 0 0 1-6.344 3.032zm2.094-4.828a22.25 22.25 0 0 0-4.906.078c.219-.578 1.547-3.953 2.781-7.344.141.281.266.563.391.844 1.484 3.422 1.734 6.422 1.734 6.422z"/>
      </svg>
    )
  },
  behance: {
    name: 'Behance',
    placeholder: 'Cari portofolio di Behance...',
    searchUrl: 'https://www.google.com/search?igu=1&q=site:behance.net+',
    directUrl: 'https://www.behance.net/search/projects?search=',
    homeUrl: 'https://www.google.com/search?igu=1&q=site:behance.net',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#0057FF" d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-1.646 2.176-3.226 2.176-2.52 0-3.69-1.782-3.69-4.225 0-2.38 1.29-4.225 3.568-4.225 2.378 0 3.394 1.734 3.394 4.072 0 .393-.046.776-.046.776h-5.08c.078 1.343.834 1.942 1.928 1.942.846 0 1.498-.387 1.832-1.016l1.32.5zm-5.068-3.032h3.29c-.066-1.127-.674-1.748-1.636-1.748-.992 0-1.576.657-1.654 1.748zM9.488 12.336c.944-.45 1.512-1.222 1.512-2.35 0-2.128-1.576-2.986-3.626-2.986H0v14h7.528c2.25 0 4.022-1.07 4.022-3.414 0-1.464-.784-2.39-2.062-2.85zM3.46 8.766h3.42c1.074 0 1.728.468 1.728 1.382 0 .914-.654 1.41-1.728 1.41H3.46V8.766zm3.726 8.52H3.46v-3.136h3.726c1.236 0 1.984.52 1.984 1.568 0 1.048-.748 1.568-1.984 1.568z"/>
      </svg>
    )
  },
  unsplash: {
    name: 'Unsplash',
    placeholder: 'Cari foto di Unsplash...',
    searchUrl: 'https://www.google.com/search?igu=1&q=site:unsplash.com+',
    directUrl: 'https://unsplash.com/s/photos/',
    homeUrl: 'https://www.google.com/search?igu=1&q=site:unsplash.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#111111" d="M7.5 6.75V0h9v6.75h-9zm9 3.75H24V24H0V10.5h7.5v6.75h9V10.5z"/>
      </svg>
    )
  },
  freepik: {
    name: 'Freepik',
    placeholder: 'Cari aset grafis di Freepik...',
    searchUrl: 'https://www.google.com/search?igu=1&q=site:freepik.com+',
    directUrl: 'https://www.freepik.com/search?format=search&query=',
    homeUrl: 'https://www.google.com/search?igu=1&q=site:freepik.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#0C80E8" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 5.5h2.5v7.5h-2.5V5.5zm1.25 13.25c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z"/>
      </svg>
    )
  },
  googlefonts: {
    name: 'Google Fonts',
    placeholder: 'Cari font di Google Fonts...',
    searchUrl: 'https://www.google.com/search?igu=1&q=site:fonts.google.com+',
    directUrl: 'https://fonts.google.com/?query=',
    homeUrl: 'https://www.google.com/search?igu=1&q=site:fonts.google.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#EA4335" d="M3 3h18v18H3V3zm9 2.5L6.5 18h2.3l1.3-3.6h4.8l1.3 3.6h2.3L13 5.5h-2zm.5 3.3l1.8 5.1h-3.6l1.8-5.1z"/>
      </svg>
    )
  },
  youtube: {
    name: 'YouTube',
    placeholder: 'Cari video di YouTube...',
    searchUrl: 'https://www.google.com/search?igu=1&q=site:youtube.com+',
    directUrl: 'https://www.youtube.com/results?search_query=',
    homeUrl: 'https://www.google.com/search?igu=1&q=site:youtube.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  github: {
    name: 'GitHub',
    placeholder: 'Cari repo di GitHub...',
    searchUrl: 'https://www.google.com/search?igu=1&q=site:github.com+',
    directUrl: 'https://github.com/search?q=',
    homeUrl: 'https://www.google.com/search?igu=1&q=site:github.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#24292e" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    )
  }
};

const GlobalSearchCenter = ({ 
  isOpen, 
  onClose, 
  pagesData, 
  stickersData, 
  globalSettings, 
  projects, 
  canvases, 
  onSwitchPage, 
  userData 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('shortcuts'); // 'shortcuts' | 'ai-chat' | 'google-search'
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);
  const [googleResults, setGoogleResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  // ── Mini Browser States ──
  const [browserEngine, setBrowserEngine] = useState('google'); // 'google' | 'duckduckgo' | 'bing' | 'wikipedia'
  const [browserUrl, setBrowserUrl] = useState('');
  const [browserInputUrl, setBrowserInputUrl] = useState('');
  const [browserHistory, setBrowserHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isCopiedBrowserUrl, setIsCopiedBrowserUrl] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);

  // AI States
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('porto_ai_sessions');
    return saved ? JSON.parse(saved) : [
      { id: 'default', title: 'Sesi Utama', messages: [
        { role: 'assistant', text: "Halo! Saya adalah Co-Pilot strategis CMS Anda. Anda dapat menanyakan ide konten, saran optimasi website, data offline apa pun, atau mengeksekusi aksi dan pintasan sistem secara instan.", type: 'text' }
      ]}
    ];
  });
  const [currentSessionId, setCurrentSessionId] = useState('default');
  const [dynamicBlogs, setDynamicBlogs] = useState<any[]>([]);
  const [dynamicProducts, setDynamicProducts] = useState<any[]>([]);
  const [dynamicGames, setDynamicGames] = useState<any[]>([]);
  const [dynamicTransactions, setDynamicTransactions] = useState<any[]>([]);
  const [dynamicNotes, setDynamicNotes] = useState<any[]>([]);
  
  // Direct Action & Filter States
  const [showMediaGalleryModal, setShowMediaGalleryModal] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [activeBangEngine, setActiveBangEngine] = useState<{
    key: string;
    label: string;
    icon?: any;
    action: (q: string) => void;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setInputWithCursorAtEnd = (val: string) => {
    setInputValue(val);
    setSearchSelectedIndex(0);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        const len = val.length;
        searchInputRef.current.setSelectionRange(len, len);
      }
    }, 25);
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveBangEngine(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch or listen to all website entities offline
    storage.getItem('porto_blog', []).then(b => {
      if (Array.isArray(b)) setDynamicBlogs(b);
    }).catch(() => {});

    storage.getItem('porto_catalog', []).then(c => {
      if (Array.isArray(c)) setDynamicProducts(c);
    }).catch(() => {});

    storage.getItem('porto_transactions', []).then(t => {
      if (Array.isArray(t)) setDynamicTransactions(t);
    }).catch(() => {});

    storage.getItem('porto_memo_notes', []).then(n => {
      if (Array.isArray(n)) setDynamicNotes(n);
    }).catch(() => {});

    const unsubGames = subscribeToGames((gList) => {
      if (Array.isArray(gList)) setDynamicGames(gList);
    });

    return () => {
      if (unsubGames) unsubGames();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClose = () => {
      if (isOpen) onClose();
    };
    window.addEventListener('porto_close_search', handleClose);
    return () => window.removeEventListener('porto_close_search', handleClose);
  }, [isOpen, onClose]);

  // Handler Direct Backup JSON
  const handleDirectBackup = async () => {
    try {
      window.dispatchEvent(new CustomEvent('porto_notify', { 
        detail: { message: "Menyiapkan file ekspor backup database lengkap...", type: "info" } 
      }));

      const allKeys = [
        'porto_projects', 'porto_blog', 'porto_catalog', 'porto_transactions',
        'porto_memo_notes', 'porto_media_gallery', 'porto_settings', 'porto_canvases'
      ];
      const backupData: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        siteTitle: globalSettings?.siteTitle || 'Website Portfolio',
        version: '2.5'
      };

      for (const k of allKeys) {
        backupData[k] = await storage.getItem(k, null);
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_agensi_lengkap_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.dispatchEvent(new CustomEvent('porto_notify', { 
        detail: { message: "Ekspor backup JSON berhasil diunduh!", type: "success" } 
      }));
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('porto_notify', { 
        detail: { message: "Gagal ekspor backup: " + err.message, type: "error" } 
      }));
    }
  };

  // Direct File Upload from omnibox
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        try {
          const currentGallery = (await storage.getItem('porto_media_gallery', [])) || [];
          const newMediaItem = {
            id: 'media_' + Date.now(),
            url: dataUrl,
            name: file.name,
            size: file.size,
            type: file.type.startsWith('video') ? 'video' : 'image',
            createdAt: new Date().toISOString()
          };
          const updated = [newMediaItem, ...currentGallery];
          await storage.setItem('porto_media_gallery', updated);
          
          window.dispatchEvent(new CustomEvent('porto_notify', { 
            detail: { message: `File "${file.name}" berhasil disimpan ke Galeri Media!`, type: "success" } 
          }));
          window.dispatchEvent(new CustomEvent('porto_media_updated'));
        } catch (err: any) {
          window.dispatchEvent(new CustomEvent('porto_notify', { 
            detail: { message: "Gagal menyimpan file: " + err.message, type: "error" } 
          }));
        }
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const chatScrollRef = useRef(null);
  const searchInputRef = useRef(null);

  const currentSession = (sessions && sessions.length > 0)
    ? (sessions.find(s => s.id === currentSessionId) || sessions[0])
    : { id: 'default', title: 'Sesi Utama', messages: [] };
  const messages = currentSession?.messages || [];

  // Focus Input on Open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setInputValue('');
      setActiveTab('shortcuts');
      setSearchSelectedIndex(0);
    }
  }, [isOpen]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    if (chatScrollRef.current && activeTab === 'ai-chat') {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeTab]);

  // Save Sessions to localStorage
  useEffect(() => {
    localStorage.setItem('porto_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Cache Buster & Cleaners
  const handleClearCache = async () => {
    window.dispatchEvent(new CustomEvent('porto_notify', { 
      detail: { message: "Membersihkan cache PWA & Database Lokal...", type: "info" } 
    }));
    
    try {
      if (window.caches) {
        const keys = await caches.keys();
        for (let k of keys) {
          if (!k.includes('precache')) {
            await caches.delete(k).catch(() => {});
          }
        }
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let r of registrations) {
          await r.update().catch(() => {});
        }
      }
      window.dispatchEvent(new CustomEvent('porto_notify', { 
        detail: { message: "✅ Cache Berhasil Dihapus! Memuat ulang...", type: "success" } 
      }));
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('porto_notify', { 
        detail: { message: "Gagal membersihkan cache: " + e.message, type: "error" } 
      }));
    }
  };

  // ── Integrated Direct Creation Handlers (Auto-Open Creation Modals/Forms) ──
  const triggerCreateProject = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('porto_auto_create_project', '1');
    onSwitchPage('projects');
    setTimeout(() => window.dispatchEvent(new CustomEvent('porto_create_project')), 150);
    onClose();
  };

  const triggerCreateBlog = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('porto_auto_create_blog', '1');
    onSwitchPage('blog');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('porto_create_blog'));
      window.dispatchEvent(new CustomEvent('porto_add_blog_post'));
    }, 150);
    onClose();
  };

  const triggerCreateProduct = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('porto_auto_create_product', '1');
    onSwitchPage('catalog');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('porto_create_product'));
      window.dispatchEvent(new CustomEvent('porto_add_product'));
    }, 150);
    onClose();
  };

  const triggerCreateMemo = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('porto_auto_create_memo', '1');
    onSwitchPage('memo');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('porto_create_memo'));
      window.dispatchEvent(new CustomEvent('porto_add_memo'));
    }, 150);
    onClose();
  };

  const triggerCreateTransaction = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('porto_auto_create_transaction', '1');
    onSwitchPage('transactions');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('porto_create_transaction'));
      window.dispatchEvent(new CustomEvent('porto_add_transaction'));
    }, 150);
    onClose();
  };

  const triggerCreateApp = () => {
    if (typeof window !== 'undefined') sessionStorage.setItem('porto_auto_create_app', '1');
    onSwitchPage('apps');
    setTimeout(() => window.dispatchEvent(new CustomEvent('porto_create_app')), 150);
    onClose();
  };

  // Build Comprehensive Search Items (Strictly Lucide Icons, No Emojis)
  const searchItems = useMemo(() => {
    const list = [
      // 0. Aksi Cepat Terintegrasi (Direct Actions)
      { 
        label: 'Buka Galeri & Kelola Media', 
        desc: 'Lihat koleksi foto, video, salin link URL, atau transformasi AI', 
        category: 'Aksi Cepat', 
        icon: GalleryIcon, 
        action: () => setShowMediaGalleryModal(true) 
      },
      { 
        label: 'Unggah File / Gambar Langsung', 
        desc: 'Upload file media lokal langsung dari pencarian ke galeri sistem', 
        category: 'Aksi Cepat', 
        icon: UploadCloud, 
        action: () => fileInputRef.current?.click() 
      },
      { 
        label: 'Tambah Proyek Portofolio Baru', 
        desc: 'Buat entri proyek baru, upload thumbnail, dan deskripsi karya', 
        category: 'Aksi Cepat', 
        icon: FolderPlus, 
        action: triggerCreateProject 
      },
      { 
        label: 'Tulis Artikel Blog Baru', 
        desc: 'Buka editor artikel, buat tulisan baru, dan publikasikan ke web', 
        category: 'Aksi Cepat', 
        icon: FilePlus2, 
        action: triggerCreateBlog 
      },
      { 
        label: 'Tambah Produk / Jasa Baru', 
        desc: 'Input produk atau layanan baru ke katalog dan atur harganya', 
        category: 'Aksi Cepat', 
        icon: PlusCircle, 
        action: triggerCreateProduct 
      },
      { 
        label: 'Buat Catatan / Memo Baru', 
        desc: 'Tulis memo penting, to-do list, atau pengingat kerja instan', 
        category: 'Aksi Cepat', 
        icon: StickyNote, 
        action: triggerCreateMemo 
      },
      { 
        label: 'Catat Transaksi / Invoice Baru', 
        desc: 'Buat invoice pembayaran pesanan pelanggan dan cetak struk PDF', 
        category: 'Aksi Cepat', 
        icon: DollarSign, 
        action: triggerCreateTransaction 
      },
      { 
        label: 'Pasang Game / App Baru (HTML5)', 
        desc: 'Unggah file bundle ZIP game atau pasang modul interaktif baru', 
        category: 'Aksi Cepat', 
        icon: LayoutGrid, 
        action: triggerCreateApp 
      },
      { 
        label: 'Ekspor Backup Database JSON Lengkap', 
        desc: 'Unduh seluruh database (proyek, blog, produk, transaksi, catatan) ke file JSON', 
        category: 'Aksi Cepat', 
        icon: DownloadCloud, 
        action: handleDirectBackup 
      },
      { 
        label: 'Simpan & Sinkronkan Data Cloud', 
        desc: 'Paksa simpan seluruh data lokal ke cloud Firestore / server', 
        category: 'Aksi Cepat', 
        icon: Save, 
        action: () => window.dispatchEvent(new CustomEvent('porto_manual_save', { detail: { force: true } })) 
      },

      // 1. Modul Utama
      { label: 'Dashboard Overview', desc: 'Halaman ringkasan analitik dan metrik utama', category: 'Modul', icon: Layout, action: () => onSwitchPage('dashboard') },
      { label: 'Game & Apps Studio (HTML5)', desc: 'Katalog game interaktif, upload bundle ZIP, custom branding, & lisensi', category: 'Modul', icon: LayoutGrid, action: () => onSwitchPage('apps') },
      { label: 'QR Studio Generator', desc: 'Desain dan unduh QR Code resolusi tinggi (URL, WA, WiFi, vCard)', category: 'Modul', icon: QrCode, action: () => onSwitchPage('qr') },
      { label: 'Waves (Push Notifikasi)', desc: 'Kirim sapaan hangat langsung ke browser & device member sumr.day club', category: 'Modul', icon: Radio, action: () => onSwitchPage('broadcast') },
      { label: 'Vault (Arsip Master)', desc: 'Portal terpusat karya, jurnal, drops, dan game studio', category: 'Modul', icon: Database, action: () => onSwitchPage('database') },
      { label: 'Finance (Billing & Transaksi)', desc: 'Riwayat pesanan, invoice PDF, diskon, dan buku kas', category: 'Modul', icon: Receipt, action: () => onSwitchPage('transactions') },
      { label: 'Memo & Catatan (Notes)', desc: 'Pengingat catatan, folder, dan to-do list', category: 'Modul', icon: FileText, action: () => onSwitchPage('memo') },
      { label: 'Manajemen Proyek (Works)', desc: 'Kelola daftar karya, media, dan alur pengerjaan klien', category: 'Modul', icon: FolderKanban, action: () => onSwitchPage('projects') },
      { label: 'Journal (Blog & Cerita)', desc: 'Tulis dan publikasikan konten artikel website', category: 'Modul', icon: BookOpen, action: () => onSwitchPage('blog') },
      { label: 'Drops (Katalog & Layanan)', desc: 'Kelola produk digital, voucher, dan stok', category: 'Modul', icon: ShoppingBag, action: () => onSwitchPage('catalog') },
      { label: 'Website Landing Page', desc: 'Atur komponen navbar, hero, fitur, dan footer', category: 'Modul', icon: Globe, action: () => onSwitchPage('website') },
      { label: 'Whiteboard & Sketsa', desc: 'Papan tulis digital untuk brainstorming visual', category: 'Modul', icon: BrainCircuit, action: () => onSwitchPage('whiteboard') },
      { label: 'Inbox & Chat Klien', desc: 'Pesan masuk dan kontak dari pengunjung website', category: 'Modul', icon: MessageSquare, action: () => onSwitchPage('chat') },
      { label: 'Storage & Database Monitor', desc: 'Pantau kapasitas Firestore dan foto Cloudinary', category: 'Modul', icon: Database, action: () => onSwitchPage('storage') },
      { label: 'sumr.day club & Crew', desc: 'Kelola kru studio dan member sumr.day club', category: 'Modul', icon: Users, action: () => onSwitchPage('users') },
      { label: 'Log Aktivitas Sistem', desc: 'Audit riwayat tindakan dan keamanan CMS', category: 'Modul', icon: Clock, action: () => onSwitchPage('activity') },
      { label: 'Guide & Tips Studio', desc: 'Pusat panduan arsitektur sistem dan tips kreatif sumr.day', category: 'Modul', icon: Compass, action: () => onSwitchPage('guideline') },

      // 2. Pengaturan Cepat
      { label: 'Ubah Warna Aksen CMS', desc: 'Sesuaikan palet warna utama di CMS dan website', category: 'Pengaturan', icon: Palette, action: () => { onSwitchPage('settings'); setTimeout(() => window.dispatchEvent(new CustomEvent('porto_focus_setting', { detail: 'accent' })), 300); } },
      { label: 'Logo Kustom & Branding', desc: 'Unggah logo kustom untuk dashboard admin', category: 'Pengaturan', icon: ImageIcon, action: () => { onSwitchPage('settings'); setTimeout(() => window.dispatchEvent(new CustomEvent('porto_focus_setting', { detail: 'branding' })), 300); } },
      { label: 'Biodata & Profil CV', desc: 'Edit foto profil, cover, bio, dan riwayat pekerjaan', category: 'Pengaturan', icon: Users, action: () => onSwitchPage('settings') },
      { label: 'Rasio Preview Desktop', desc: 'Atur rasio preview builder (1/1, 16/9, dll)', category: 'Pengaturan', icon: Smartphone, action: () => { onSwitchPage('settings'); setTimeout(() => window.dispatchEvent(new CustomEvent('porto_focus_setting', { detail: 'ratio' })), 300); } },

      // 3. Pintasan Sistem
      { label: 'Bersihkan Cache PWA & Aset', desc: 'Hapus paksa cache browser agar perubahan terupdate', category: 'Pintasan', icon: RefreshCw, action: handleClearCache },
      { label: 'Ganti Mode Gelap / Terang', desc: 'Toggle tema visual antarmuka sistem', category: 'Pintasan', icon: Zap, action: () => window.dispatchEvent(new CustomEvent('porto_toggle_theme')) },
      { label: 'Buka Website Publik', desc: 'Buka website utama di tab baru browser', category: 'Pintasan', icon: ExternalLink, action: () => window.open('/', '_blank') },
      { label: 'Simpan Perubahan Cloud (Save)', desc: 'Simpan seluruh data secara manual ke server', category: 'Pintasan', icon: Save, action: () => window.dispatchEvent(new CustomEvent('porto_manual_save', { detail: { force: true } })) }
    ];

    // Add Dynamic Custom Pages
    const pages = globalSettings?.customPages || [];
    pages.forEach(p => {
      list.push({
        label: `Edit Halaman: ${p.name || p.slug}`,
        desc: `Kelola susunan layout dan blok halaman /lpimage/${p.slug}`,
        category: 'Halaman',
        icon: Layout,
        action: () => onSwitchPage(p.slug)
      });
    });

    ['home', 'portofolio', 'biodata'].forEach(sys => {
      list.push({
        label: `Halaman Sistem: ${sys.toUpperCase()}`,
        desc: `Kelola susunan layout halaman /lpimage/${sys}`,
        category: 'Halaman',
        icon: Layout,
        action: () => onSwitchPage(sys)
      });
    });

    // Add Dynamic Projects
    (projects || []).forEach(p => {
      list.push({
        label: `Proyek: ${p.title || 'Tanpa Judul'}`,
        desc: `Karya portofolio · Kategori: ${p.category || 'General'}`,
        category: 'Proyek',
        icon: FolderKanban,
        action: () => {
          onSwitchPage('projects');
          setTimeout(() => window.dispatchEvent(new CustomEvent('porto_open_project', { detail: p.id })), 300);
        }
      });
    });

    // Add Dynamic Games & Apps
    (dynamicGames || []).forEach(g => {
      list.push({
        label: `Game/App: ${g.title || 'Tanpa Judul'}`,
        desc: `Game interaktif · ${g.category || 'Arcade'} · Mainkan / kelola lisensi`,
        category: 'Game & Apps',
        icon: LayoutGrid,
        action: () => {
          onSwitchPage('apps');
        }
      });
    });

    // Add Dynamic Articles / Blogs
    (dynamicBlogs || []).forEach(b => {
      list.push({
        label: `Artikel: ${b.title || 'Tanpa Judul'}`,
        desc: `Blog artikel · ${b.category || 'Wawasan'} · ${b.readTime || '3 min'} baca`,
        category: 'Blog',
        icon: BookOpen,
        action: () => {
          onSwitchPage('blog');
        }
      });
    });

    // Add Dynamic Products / Catalog
    (dynamicProducts || []).forEach(prod => {
      list.push({
        label: `Produk: ${prod.name || 'Tanpa Judul'}`,
        desc: `Katalog layanan & produk · ${prod.category || 'Layanan'} · Rp ${Number(prod.price || 0).toLocaleString('id-ID')}`,
        category: 'Katalog',
        icon: ShoppingBag,
        action: () => {
          onSwitchPage('catalog');
        }
      });
    });

    return list;
  }, [pagesData, stickersData, globalSettings, projects, canvases, dynamicGames, dynamicBlogs, dynamicProducts]);

  // ── Contextual Prefix System: Slash Commands (/), Hashtag Modules (#), & Mentions (@) ──
  const slashCommands = useMemo(() => [
    { key: '/buat-proyek', label: 'Tambah Proyek Portofolio', desc: 'Buka wizard karya baru, upload thumbnail mockup, & tag', icon: FolderPlus, badge: 'Buat', action: triggerCreateProject },
    { key: '/tulis-artikel', label: 'Tulis Artikel Blog Baru', desc: 'Buka editor blog untuk membuat dan publikasi tulisan', icon: FilePlus2, badge: 'Buat', action: triggerCreateBlog },
    { key: '/tambah-produk', label: 'Tambah Produk / Jasa Baru', desc: 'Input item produk baru ke katalog & set harga/stok', icon: PlusCircle, badge: 'Buat', action: triggerCreateProduct },
    { key: '/buat-catatan', label: 'Buat Catatan / Memo Baru', desc: 'Tulis memo to-do list, catatan cepat, atau pengingat kerja', icon: StickyNote, badge: 'Buat', action: triggerCreateMemo },
    { key: '/catat-transaksi', label: 'Catat Transaksi / Invoice Baru', desc: 'Buat invoice pembayaran pesanan pelanggan & cetak nota PDF', icon: DollarSign, badge: 'Buat', action: triggerCreateTransaction },
    { key: '/buat-halaman', label: 'Buat Halaman Website Baru', desc: 'Buat custom landing page baru di builder layout', icon: Layout, badge: 'Buat', action: () => { onSwitchPage('website'); setTimeout(() => window.dispatchEvent(new CustomEvent('porto_create_custom_page')), 300); onClose(); } },
    { key: '/unggah-file', label: 'Unggah File Media Langsung', desc: 'Upload file media lokal langsung dari pencarian', icon: UploadCloud, badge: 'Media', action: () => fileInputRef.current?.click() },
    { key: '/buka-galeri', label: 'Buka Galeri & Kelola Media', desc: 'Kelola aset foto, video, salin link URL, atau AI Cloudinary', icon: GalleryIcon, badge: 'Media', action: () => setShowMediaGalleryModal(true) },
    { key: '/pasang-game', label: 'Pasang Game / App Baru (HTML5)', desc: 'Unggah bundle ZIP game atau pasang modul interaktif baru', icon: LayoutGrid, badge: 'Modul', action: triggerCreateApp },
    { key: '/kanvas-sketsa', label: 'Buka Whiteboard & Kanvas Sketsa', desc: 'Papan tulis digital untuk brainstorming & sketsa visual', icon: BrainCircuit, badge: 'Studio', action: () => { onSwitchPage('whiteboard'); onClose(); } },
    { key: '/buat-qr', label: 'Desain QR Code Studio', desc: 'Generate QR Code resolusi tinggi untuk WhatsApp, URL, atau WiFi', icon: QrCode, badge: 'Studio', action: () => { onSwitchPage('qr'); onClose(); } },
    { key: '/kirim-broadcast', label: 'Kirim Notifikasi Broadcast', desc: 'Kirim siaran push notifikasi langsung ke perangkat pengunjung', icon: Radio, badge: 'Studio', action: () => { onSwitchPage('broadcast'); onClose(); } },
    { key: '/backup-json', label: 'Ekspor Backup Database JSON', desc: 'Download seluruh data website (proyek, blog, transaksi, dll)', icon: DownloadCloud, badge: 'Sistem', action: handleDirectBackup },
    { key: '/sync-cloud', label: 'Sinkronkan Data Cloud', desc: 'Simpan seluruh data ke cloud Firestore & Google Sheets', icon: Save, badge: 'Sistem', action: () => window.dispatchEvent(new CustomEvent('porto_manual_save', { detail: { force: true } })) },
    { key: '/ganti-tema', label: 'Ganti Mode Gelap / Terang', desc: 'Toggle tampilan visual antarmuka tema sistem', icon: Zap, badge: 'Sistem', action: () => window.dispatchEvent(new CustomEvent('porto_toggle_theme')) },
    { key: '/bersihkan-cache', label: 'Bersihkan Cache PWA & Aset', desc: 'Hapus cache browser & reload aset CMS terbaru', icon: RefreshCw, badge: 'Sistem', action: handleClearCache },
    { key: '/buka-web', label: 'Buka Website Publik', desc: 'Buka halaman web utama di tab browser baru', icon: ExternalLink, badge: 'Sistem', action: () => window.open('/', '_blank') },
    { key: '/panduan-sop', label: 'Buka Panduan SOP Studio', desc: 'Pusat panduan arsitektur sistem dan SOP agensi digital', icon: Compass, badge: 'Bantuan', action: () => { onSwitchPage('guideline'); onClose(); } }
  ], [onSwitchPage, onClose]);

  const hashtagModules = useMemo(() => [
    { key: '#proyek', label: 'Portofolio & Karya', desc: 'Semua daftar proyek karya agensi dan portofolio desain', icon: FolderKanban, page: 'projects' },
    { key: '#blog', label: 'Blog & Artikel Berita', desc: 'Semua konten tulisan, publikasi, dan artikel website', icon: BookOpen, page: 'blog' },
    { key: '#katalog', label: 'Katalog Produk & Layanan', desc: 'Daftar produk digital, layanan jasa, dan paket harga', icon: ShoppingBag, page: 'catalog' },
    { key: '#transaksi', label: 'Keuangan & Nota Pembayaran', desc: 'Histori transaksi, nota invoice, dan laporan omset', icon: Receipt, page: 'transactions' },
    { key: '#memo', label: 'Memo & Catatan Kerja', desc: 'Daftar to-do list, catatan cepat, dan pengingat harian', icon: FileText, page: 'memo' },
    { key: '#apps', label: 'Apps & Game Studio', desc: 'Koleksi aplikasi interaktif, kalkulator, dan game HTML5', icon: LayoutGrid, page: 'apps' },
    { key: '#halaman', label: 'Halaman Website & Landing', desc: 'Susunan blok layout halaman utama dan custom landing page', icon: Layout, page: 'website' },
    { key: '#media', label: 'Galeri Media & File Cloud', desc: 'Penyimpanan file foto, video, dan aset Cloudinary', icon: GalleryIcon, action: () => setShowMediaGalleryModal(true) },
    { key: '#whiteboard', label: 'Whiteboard & Kanvas Sketsa', desc: 'Papan sketsa digital visual untuk rancangan ide', icon: BrainCircuit, page: 'whiteboard' },
    { key: '#qr', label: 'QR Studio Generator', desc: 'Generator kode QR resolusi tinggi serbaguna', icon: QrCode, page: 'qr' },
    { key: '#broadcast', label: 'Broadcast & Push Notif', desc: 'Pusat siaran notifikasi web ke pelanggan', icon: Radio, page: 'broadcast' },
    { key: '#storage', label: 'Storage & Database Monitor', desc: 'Pantau kapasitas Firestore dan foto Cloudinary', icon: Database, page: 'storage' },
    { key: '#user', label: 'Pengguna & Hak Akses', desc: 'Kelola anggota tim, admin, dan scope data CMS', icon: Users, page: 'users' },
    { key: '#pengaturan', label: 'Pengaturan Sistem Global', desc: 'Konfigurasi tema, logo kustom, biodata, dan profil', icon: Settings, page: 'settings' }
  ], [onSwitchPage, onClose]);

  const atMentions = useMemo(() => [
    { 
      key: '@ai', 
      label: 'Tanya Agensi Co-Pilot (Gemini AI)', 
      desc: 'Konsultasikan ide desain, konten marketing, strategi SEO, atau kode', 
      icon: Sparkles, 
      type: 'ai' 
    },
    { 
      key: '@keuangan', 
      label: 'Laporan Keuangan & Omset', 
      desc: 'Tampilkan total transaksi, nilai omset uang, dan status invoice', 
      icon: DollarSign, 
      type: 'offline', 
      query: 'omset keuangan transaksi' 
    },
    { 
      key: '@catatan', 
      label: 'Ringkasan Memo & To-Do List', 
      desc: 'Tampilkan catatan penting dan to-do list aktif secara offline', 
      icon: StickyNote, 
      type: 'offline', 
      query: 'catatan memo todo' 
    },
    { 
      key: '@statistik', 
      label: 'Statistik Ekosistem Website', 
      desc: 'Jumlah total karya, blog, produk, transaksi, dan modul apps', 
      icon: Activity, 
      type: 'offline', 
      query: 'statistik total portofolio blog' 
    },
    { 
      key: '@kontak', 
      label: 'Informasi Kontak & Media Sosial', 
      desc: 'Nomor WhatsApp, email, akun Instagram, dan alamat website', 
      icon: Globe, 
      type: 'offline', 
      query: 'kontak whatsapp wa email medsos' 
    },
    { 
      key: '@profil', 
      label: 'Profil Pemilik & Biodata Agensi', 
      desc: 'Nama admin pengelola, role, deskripsi bio, dan branding', 
      icon: Users, 
      type: 'offline', 
      query: 'profil pemilik biodata agensi' 
    },
    { 
      key: '@storage', 
      label: 'Kapasitas Storage & Database', 
      desc: 'Informasi penyimpanan lokal, Firestore, dan aset media', 
      icon: Database, 
      type: 'offline', 
      query: 'storage database kapasitas' 
    },
    { 
      key: '@sop', 
      label: 'Panduan Fitur & SOP Studio', 
      desc: 'Alur kerja pembuatan portofolio, katalog, dan publish artikel', 
      icon: Compass, 
      type: 'offline', 
      query: 'panduan sop cara kerja' 
    },
    { 
      key: '@web', 
      label: 'Cari di Web Internet (Mini Browser)', 
      desc: 'Jelajahi referensi di Google, Pinterest, Dribbble, atau Unsplash', 
      icon: ExternalLink, 
      type: 'web' 
    }
  ], []);

  // Filter items in real time
  const filteredSearchItems = useMemo(() => {
    if (!inputValue.trim()) return [];
    const q = inputValue.toLowerCase();
    return searchItems.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [searchItems, inputValue]);

  // Contextual Filtering for Prefix / , # , @, !
  const isSlashActive = inputValue.startsWith('/');
  const isHashActive = inputValue.startsWith('#');
  const isAtActive = inputValue.startsWith('@');
  const isBangActive = !!activeBangEngine || inputValue.startsWith('!');

  const filteredSlashCommands = useMemo(() => {
    if (!isSlashActive) return [];
    const q = inputValue.slice(1).trim().toLowerCase();
    if (!q) return slashCommands;
    return slashCommands.filter(c => 
      c.key.toLowerCase().includes(q) || 
      c.label.toLowerCase().includes(q) || 
      c.desc.toLowerCase().includes(q) ||
      c.badge.toLowerCase().includes(q)
    );
  }, [isSlashActive, inputValue, slashCommands]);

  const filteredHashtagModules = useMemo(() => {
    if (!isHashActive) return [];
    const q = inputValue.slice(1).trim().toLowerCase();
    if (!q) return hashtagModules;
    return hashtagModules.filter(h => 
      h.key.toLowerCase().includes(q) || 
      h.label.toLowerCase().includes(q) || 
      h.desc.toLowerCase().includes(q)
    );
  }, [isHashActive, inputValue, hashtagModules]);

  const filteredAtMentions = useMemo(() => {
    if (!isAtActive) return [];
    const q = inputValue.slice(1).trim().toLowerCase();
    if (!q) return atMentions;
    return atMentions.filter(m => 
      m.key.toLowerCase().includes(q) || 
      m.label.toLowerCase().includes(q) || 
      m.desc.toLowerCase().includes(q)
    );
  }, [isAtActive, inputValue, atMentions]);

  const handleSearchSelect = (item) => {
    if (item && item.action) {
      item.action();
      onClose();
    }
  };

  // ── Mini Browser Navigation Helpers ──
  const getEngineSearchUrl = (query, engine = browserEngine) => {
    const encoded = encodeURIComponent(query.trim());
    const meta = ENGINE_META[engine];
    if (meta && meta.searchUrl) {
      return `${meta.searchUrl}${encoded}`;
    }
    return `https://www.google.com/search?igu=1&q=${encoded}`;
  };

  const getEngineHomeUrl = (engine = browserEngine) => {
    const meta = ENGINE_META[engine];
    if (meta && meta.homeUrl) {
      return meta.homeUrl;
    }
    return 'https://www.google.com/search?igu=1';
  };

  const navigateBrowser = (target, engineOverride) => {
    let finalUrl = (target || '').trim();
    if (!finalUrl) return;

    const currentEng = engineOverride || browserEngine;

    if (!/^https?:\/\//i.test(finalUrl)) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = `https://${finalUrl}`;
      } else {
        finalUrl = getEngineSearchUrl(finalUrl, currentEng);
      }
    }

    setHasSearched(true);
    setIsIframeLoading(true);
    setBrowserUrl(finalUrl);
    setBrowserInputUrl(finalUrl);
    setIframeKey(k => k + 1);

    setBrowserHistory(prev => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      return [...nextHistory, finalUrl];
    });
    setHistoryIndex(prev => prev + 1);
  };

  const handleBrowserBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevUrl = browserHistory[prevIdx];
      setHistoryIndex(prevIdx);
      setBrowserUrl(prevUrl);
      setBrowserInputUrl(prevUrl);
      setIsIframeLoading(true);
      setIframeKey(k => k + 1);
    }
  };

  const handleBrowserForward = () => {
    if (historyIndex < browserHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextUrl = browserHistory[nextIdx];
      setHistoryIndex(nextIdx);
      setBrowserUrl(nextUrl);
      setBrowserInputUrl(nextUrl);
      setIsIframeLoading(true);
      setIframeKey(k => k + 1);
    }
  };

  const handleBrowserReload = () => {
    setIsIframeLoading(true);
    setIframeKey(k => k + 1);
  };

  const handleSwitchEngine = (newEngine) => {
    setBrowserEngine(newEngine);
    if (inputValue.trim()) {
      const url = getEngineSearchUrl(inputValue.trim(), newEngine);
      navigateBrowser(url, newEngine);
    } else {
      navigateBrowser(getEngineHomeUrl(newEngine), newEngine);
    }
  };

  // Contextual Prefix System: Bang Internet Engines (!)
  const bangEngines = useMemo(() => [
    { key: '!google', label: 'Cari Google Search', icon: Globe, action: (q: string) => { setActiveTab('google-search'); navigateBrowser(getEngineSearchUrl(q || 'Google', 'google')); } },
    { key: '!duckduckgo', label: 'Cari DuckDuckGo', icon: Globe, action: (q: string) => { setActiveTab('google-search'); navigateBrowser(getEngineSearchUrl(q || 'DuckDuckGo', 'duckduckgo')); } },
    { key: '!bing', label: 'Cari Bing Search', icon: Globe, action: (q: string) => { setActiveTab('google-search'); navigateBrowser(getEngineSearchUrl(q || 'Bing', 'bing')); } },
    { key: '!wikipedia', label: 'Cari Ensiklopedia Wikipedia', icon: BookOpen, action: (q: string) => { setActiveTab('google-search'); navigateBrowser(getEngineSearchUrl(q || 'Wikipedia', 'wikipedia')); } },
    { key: '!dribbble', label: 'Cari Inspirasi Desain Dribbble', icon: ExternalLink, action: (q: string) => window.open(`https://dribbble.com/search/${encodeURIComponent(q || '')}`, '_blank') },
    { key: '!pinterest', label: 'Cari Ide Visual Pinterest', icon: ExternalLink, action: (q: string) => window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q || '')}`, '_blank') },
    { key: '!unsplash', label: 'Cari Foto Unsplash', icon: GalleryIcon, action: (q: string) => window.open(`https://unsplash.com/s/photos/${encodeURIComponent(q || '')}`, '_blank') },
    { key: '!youtube', label: 'Cari Video Tutorial YouTube', icon: ExternalLink, action: (q: string) => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q || '')}`, '_blank') }
  ], [browserEngine]);

  const filteredBangEngines = useMemo(() => {
    if (!isBangActive) return [];
    const q = inputValue.slice(1).trim().toLowerCase();
    if (!q) return bangEngines;
    return bangEngines.filter(b => b.key.toLowerCase().includes(q) || b.label.toLowerCase().includes(q));
  }, [isBangActive, inputValue, bangEngines]);

  // Google Search Submission (Direct Live Mini Browser Loading)
  const handleGoogleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setActiveTab('google-search');
    const q = inputValue.trim();
    if (q) {
      const url = getEngineSearchUrl(q, browserEngine);
      navigateBrowser(url);
    } else {
      if (!browserUrl) {
        navigateBrowser(getEngineHomeUrl(browserEngine));
      }
    }
  };

  // ── Smart Offline Knowledge & Auto-Navigation Engine ──
  const resolveOfflineQuery = (query: string) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return null;

    // 0. CEK INTENT AKSI LANGSUNG (ACTION TRIGGER)
    // A. Upload File / Galeri Media
    if (q.includes('upload') || q.includes('unggah') || q.includes('media') || q.includes('galeri') || q.includes('tambah file') || q.includes('tambah foto') || q.includes('tambah gambar')) {
      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'storage',
        pageLabel: 'Buka Galeri & Upload Media',
        answerText: `**Aksi Unggah File & Galeri Media:**\nKlik tombol di bawah untuk membuka galeri media, melihat URL file, atau mengunggah gambar/video baru secara langsung.`,
        relatedAction: () => { setShowMediaGalleryModal(true); }
      };
    }

    // B. Tambah Proyek Portofolio
    if ((q.includes('tambah') || q.includes('buat') || q.includes('input')) && (q.includes('proyek') || q.includes('karya') || q.includes('portofolio') || q.includes('project'))) {
      return {
        isNavIntent: true,
        targetPage: 'projects',
        pageLabel: 'Tambah Proyek Baru',
        hasDirectAnswer: true,
        answerText: `**Membuka Modul Proyek Portofolio:**\nMenyiapkan form entri karya baru untuk Anda...`,
        relatedAction: triggerCreateProject
      };
    }

    // C. Tulis Artikel / Blog Baru
    if ((q.includes('tulis') || q.includes('buat') || q.includes('tambah')) && (q.includes('artikel') || q.includes('blog') || q.includes('berita') || q.includes('post'))) {
      return {
        isNavIntent: true,
        targetPage: 'blog',
        pageLabel: 'Tulis Artikel Baru',
        hasDirectAnswer: true,
        answerText: `**Membuka Editor Artikel Blog:**\nMenyiapkan form penulisan artikel baru...`,
        relatedAction: triggerCreateBlog
      };
    }

    // D. Tambah Produk / Jasa Baru
    if ((q.includes('tambah') || q.includes('buat') || q.includes('input')) && (q.includes('produk') || q.includes('jasa') || q.includes('layanan') || q.includes('katalog') || q.includes('barang'))) {
      return {
        isNavIntent: true,
        targetPage: 'catalog',
        pageLabel: 'Tambah Produk Baru',
        hasDirectAnswer: true,
        answerText: `**Membuka Katalog Produk:**\nMenyiapkan modal input produk / layanan baru...`,
        relatedAction: triggerCreateProduct
      };
    }

    // E. Buat Catatan / Memo Baru
    if ((q.includes('buat') || q.includes('tulis') || q.includes('tambah')) && (q.includes('catatan') || q.includes('memo') || q.includes('todo') || q.includes('to-do') || q.includes('note'))) {
      return {
        isNavIntent: true,
        targetPage: 'memo',
        pageLabel: 'Buat Memo Baru',
        hasDirectAnswer: true,
        answerText: `**Membuka Modul Memo & Catatan:**\nMenyiapkan formulir catatan to-do baru...`,
        relatedAction: triggerCreateMemo
      };
    }

    // F. Catat Transaksi / Invoice Baru
    if ((q.includes('catat') || q.includes('buat') || q.includes('tambah') || q.includes('input')) && (q.includes('transaksi') || q.includes('invoice') || q.includes('nota') || q.includes('pesanan') || q.includes('order'))) {
      return {
        isNavIntent: true,
        targetPage: 'transactions',
        pageLabel: 'Catat Transaksi Baru',
        hasDirectAnswer: true,
        answerText: `**Membuka Modul Transaksi & Nota:**\nMenyiapkan form pembuatan invoice pelanggan...`,
        relatedAction: triggerCreateTransaction
      };
    }

    // G. Pasang Game / Apps Baru
    if ((q.includes('pasang') || q.includes('tambah') || q.includes('upload') || q.includes('unggah')) && (q.includes('game') || q.includes('app') || q.includes('aplikasi') || q.includes('html5'))) {
      return {
        isNavIntent: true,
        targetPage: 'apps',
        pageLabel: 'Pasang Game / App Baru',
        hasDirectAnswer: true,
        answerText: `**Membuka Apps & Game Studio:**\nMenyiapkan wizard unggah bundle aplikasi interaktif...`,
        relatedAction: triggerCreateApp
      };
    }

    // H. Ekspor Backup JSON Langsung
    if (q.includes('backup') || q.includes('ekspor') || q.includes('export') || q.includes('unduh data') || q.includes('download database')) {
      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'storage',
        pageLabel: 'Ekspor Backup JSON',
        answerText: `**Ekspor Backup Database JSON Lengkap:**\nKlik tombol aksi untuk langsung mengunduh seluruh data website (proyek, blog, katalog, transaksi, dan memo) ke perangkat Anda.`,
        relatedAction: handleDirectBackup
      };
    }

    // I. Ganti Tema / Bersihkan Cache
    if (q.includes('mode gelap') || q.includes('mode terang') || q.includes('dark mode') || q.includes('light mode') || q.includes('toggle theme')) {
      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'settings',
        pageLabel: 'Ganti Tema',
        answerText: `**Mengubah Tema Visual Antarmuka:**\nTema telah dialihkan antara Mode Gelap dan Terang.`,
        relatedAction: () => window.dispatchEvent(new CustomEvent('porto_toggle_theme'))
      };
    }

    if (q.includes('bersihkan cache') || q.includes('hapus cache') || q.includes('clear cache')) {
      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'settings',
        pageLabel: 'Bersihkan Cache',
        answerText: `**Membersihkan Cache PWA & Cache Browser:**\nKlik tombol aksi untuk menghapus cache lokal dan memuat ulang aset terbaru.`,
        relatedAction: handleClearCache
      };
    }

    // 1. CEK INTENT NAVIGASI OTOMATIS
    const navRules = [
      { keywords: ['apps', 'app', 'game', 'games', 'permainan', 'apps studio', 'game studio', 'html5'], target: 'apps', label: 'Apps Studio', actionDesc: 'Pusat aplikasi interaktif HTML5, utilitas kustom, formulir, kalkulator, dan game event' },
      { keywords: ['database', 'data master', 'hub database', 'portal database'], target: 'database', label: 'Hub Database Master', actionDesc: 'Portal terpusat database portofolio, artikel, katalog, dan game' },
      { keywords: ['karya', 'portofolio', 'portfolio', 'proyek', 'project'], target: 'projects', label: 'Manajemen Proyek & Portofolio', actionDesc: 'Kelola daftar karya visual, media mockup, dan deskripsi proyek' },
      { keywords: ['blog', 'artikel', 'berita', 'post', 'tulisan'], target: 'blog', label: 'Blog & Artikel', actionDesc: 'Tulis dan publikasikan konten artikel website' },
      { keywords: ['katalog', 'produk', 'layanan', 'jasa', 'produk digital', 'jual', 'harga'], target: 'catalog', label: 'Katalog Produk & Layanan', actionDesc: 'Kelola produk digital, voucher, paket harga, dan stok' },
      { keywords: ['transaksi', 'keuangan', 'nota', 'invoice', 'pembayaran', 'pesanan', 'order', 'omset'], target: 'transactions', label: 'Keuangan & Transaksi', actionDesc: 'Riwayat pesanan, invoice PDF, diskon, dan buku pelanggan' },
      { keywords: ['catatan', 'memo', 'notes', 'todo', 'to-do', 'pengingat'], target: 'memo', label: 'Memo & Catatan', actionDesc: 'Pengingat catatan cepat, folder, dan to-do list' },
      { keywords: ['whiteboard', 'sketsa', 'kanvas', 'papan tulis', 'sketch'], target: 'whiteboard', label: 'Whiteboard & Kanvas Sketsa', actionDesc: 'Papan tulis digital untuk brainstorming visual' },
      { keywords: ['qr', 'qrcode', 'kode qr', 'barcode'], target: 'qr', label: 'QR Studio Generator', actionDesc: 'Desain dan unduh QR Code resolusi tinggi' },
      { keywords: ['broadcast', 'push notif', 'notifikasi', 'siaran'], target: 'broadcast', label: 'Broadcast & Push Studio', actionDesc: 'Kirim notifikasi siaran push langsung ke browser pelanggan' },
      { keywords: ['website', 'web studio', 'landing page', 'editor web', 'visual editor', 'builder'], target: 'website', label: 'Website Studio', actionDesc: 'Visual website editor untuk mengatur halaman landing page' },
      { keywords: ['pengaturan', 'settings', 'setting', 'konfigurasi'], target: 'settings', label: 'Pengaturan Sistem', actionDesc: 'Pengaturan tema, logo kustom, biodata, dan profil' },
      { keywords: ['pengguna', 'user', 'users', 'admin', 'hak akses', 'tim', 'anggota'], target: 'users', label: 'Pengguna & Hak Akses', actionDesc: 'Kelola anggota tim, admin, dan scope data' },
      { keywords: ['panduan', 'sop', 'guideline', 'bantuan', 'arsitektur'], target: 'guideline', label: 'Panduan Fitur & SOP Studio', actionDesc: 'Pusat panduan arsitektur sistem dan SOP agensi digital' },
      { keywords: ['dashboard', 'beranda', 'home admin', 'ringkasan'], target: 'dashboard', label: 'Dashboard Overview', actionDesc: 'Halaman ringkasan analitik dan metrik utama' },
      { keywords: ['storage', 'penyimpanan', 'kapasitas', 'firestore', 'cloudinary'], target: 'storage', label: 'Storage & Database Monitor', actionDesc: 'Pantau kapasitas Firestore dan foto Cloudinary' }
    ];

    for (const rule of navRules) {
      const isDirectMatch = rule.keywords.some(k => q === k || q === `buka ${k}` || q === `ke ${k}` || q === `halaman ${k}` || q.startsWith(`buka ${k}`) || q.startsWith(`ke ${k}`));
      if (isDirectMatch) {
        return {
          isNavIntent: true,
          targetPage: rule.target,
          pageLabel: rule.label,
          hasDirectAnswer: true,
          answerText: `**${rule.label}** terdeteksi.\n${rule.actionDesc}.\n\n*Mengalihkan ke modul...*`,
          relatedAction: () => { onSwitchPage(rule.target); onClose(); }
        };
      }
    }

    // 2. CEK PERTANYAAN DATA OFFLINE WEBSITE
    // A. Info Keuangan, Omset, Transaksi
    if (q.includes('omset') || q.includes('keuangan') || q.includes('transaksi') || q.includes('pendapatan') || q.includes('penjualan') || q.includes('total uang')) {
      const totalTx = dynamicTransactions.length;
      const totalIncome = dynamicTransactions.reduce((acc, t) => {
        const val = Number(t.total || t.amount || 0);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const paidTx = dynamicTransactions.filter(t => t.status === 'success' || t.status === 'paid' || t.status === 'lunas').length;

      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'transactions',
        pageLabel: 'Buka Transaksi & Nota',
        answerText: `**Laporan Ringkas Keuangan & Transaksi (Data Offline):**\n- **Total Transaksi Dicatat:** ${totalTx} invoice\n- **Total Nilai Transaksi:** Rp ${totalIncome.toLocaleString('id-ID')}\n- **Transaksi Sukses/Lunas:** ${paidTx} dari ${totalTx}\n\n*Semua faktur, nota pelanggan, dan cetak PDF tersedia di modul Transaksi.*`,
        relatedAction: () => { onSwitchPage('transactions'); onClose(); }
      };
    }

    // B. Info Catatan & Memo (To-Do)
    if (q.includes('catatan') || q.includes('memo') || q.includes('todo') || q.includes('to-do') || q.includes('pengingat') || q.includes('tugas')) {
      const totalNotes = dynamicNotes.length;
      let notesPreview = dynamicNotes.slice(0, 4).map((n, i) => `${i + 1}. **${n.title || n.text?.slice(0, 30) || 'Catatan'}**`).join('\n');
      if (totalNotes === 0) notesPreview = 'Belum ada catatan atau memo to-do yang tersimpan.';
      else if (totalNotes > 4) notesPreview += `\n*...dan ${totalNotes - 4} catatan lainnya.*`;

      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'memo',
        pageLabel: 'Buka Memo & Catatan',
        answerText: `**Ringkasan Memo & Catatan (${totalNotes} Item Tersimpan):**\n${notesPreview}\n\n*Buka modul Memo untuk menambah, mengedit, atau menandai selesai to-do list Anda.*`,
        relatedAction: () => { onSwitchPage('memo'); onClose(); }
      };
    }

    // C. Info Kontak & Media Sosial
    if (q.includes('kontak') || q.includes('whatsapp') || q.includes('wa') || q.includes('email') || q.includes('telepon') || q.includes('hubungi') || q.includes('medsos') || q.includes('instagram')) {
      const c = globalSettings?.contacts || {};
      const wa = c.whatsapp || c.phone || 'Belum diisi';
      const email = c.email || userData?.email || 'Belum diisi';
      const ig = c.instagram ? `@${c.instagram.replace('@', '')}` : 'Belum diisi';
      const web = globalSettings?.websiteUrl || window.location.origin;

      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'settings',
        pageLabel: 'Pengaturan Kontak',
        answerText: `**Informasi Kontak Website:**\n- **WhatsApp / HP:** ${wa}\n- **Email Resmi:** ${email}\n- **Instagram:** ${ig}\n- **Alamat URL:** ${web}\n\n*Data ini tersimpan secara offline di pengaturan CMS Anda.*`,
        relatedAction: () => { onSwitchPage('settings'); onClose(); }
      };
    }

    // D. Info Pemilik / Profil Agensi / Biodata
    if (q.includes('pemilik') || q.includes('owner') || q.includes('siapa') || q.includes('profil') || q.includes('biodata') || q.includes('agensi') || q.includes('tentang')) {
      const brandName = globalSettings?.cmsName || 'sumr.day OS';
      const title = globalSettings?.siteTitle || 'sumr.day | Creative Digital Studio';
      const owner = userData?.name || 'Administrator';
      const role = userData?.role || 'Super Admin';
      const bio = globalSettings?.biodata?.bio || 'Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic. A little sunshine for your screen.';

      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'settings',
        pageLabel: 'Pengaturan Biodata',
        answerText: `**Profil & Identitas Website:**\n- **Nama Brand / Agensi:** ${brandName}\n- **Judul Website:** ${title}\n- **Pengelola / Admin:** ${owner} (${role})\n- **Deskripsi Bio:** ${bio}\n\n*Data diambil langsung dari cache konfigurasi lokal Anda.*`,
        relatedAction: () => { onSwitchPage('settings'); onClose(); }
      };
    }

    // E. Info Produk Katalog
    if (q.includes('produk') || q.includes('katalog') || q.includes('jual') || q.includes('layanan') || q.includes('paket') || q.includes('daftar harga')) {
      const count = dynamicProducts.length;
      let listText = dynamicProducts.slice(0, 5).map((p, idx) => `${idx + 1}. **${p.name || 'Produk'}** — Rp ${Number(p.price || 0).toLocaleString('id-ID')} (${p.category || 'Layanan'})`).join('\n');
      if (count > 5) listText += `\n*...dan ${count - 5} produk lainnya.*`;
      if (count === 0) listText = 'Belum ada produk atau layanan yang ditambahkan ke katalog.';

      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'catalog',
        pageLabel: 'Buka Katalog Produk',
        answerText: `**Katalog Produk & Layanan (${count} Item):**\n${listText}\n\n*Kelola harga, diskon, dan deskripsi produk di Katalog.*`,
        relatedAction: () => { onSwitchPage('catalog'); onClose(); }
      };
    }

    // F. Info Artikel Blog
    if (q.includes('artikel') || q.includes('blog') || q.includes('berita') || q.includes('post') || q.includes('tulisan')) {
      const count = dynamicBlogs.length;
      let listText = dynamicBlogs.slice(0, 5).map((b, idx) => `${idx + 1}. **${b.title || 'Artikel'}** (${b.category || 'Wawasan'})`).join('\n');
      if (count > 5) listText += `\n*...dan ${count - 5} artikel lainnya.*`;
      if (count === 0) listText = 'Belum ada artikel yang dipublikasikan.';

      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'blog',
        pageLabel: 'Buka Blog & Artikel',
        answerText: `**Daftar Artikel Blog (${count} Konten):**\n${listText}\n\n*Buka modul Blog untuk menulis atau mengedit artikel.*`,
        relatedAction: () => { onSwitchPage('blog'); onClose(); }
      };
    }

    // G. Info Game / Apps Studio
    if (q.includes('game') || q.includes('apps') || q.includes('aplikasi') || q.includes('permainan')) {
      const count = dynamicGames.length;
      let listText = dynamicGames.slice(0, 5).map((g, idx) => `${idx + 1}. **${g.title || 'Game'}** (${g.category || 'HTML5'})`).join('\n');
      if (count > 5) listText += `\n*...dan ${count - 5} modul lainnya.*`;
      if (count === 0) listText = 'Belum ada game atau aplikasi di Apps Studio.';

      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'apps',
        pageLabel: 'Buka Apps Studio',
        answerText: `**Apps Studio (${count} Modul Terpasang):**\n${listText}\n\n*Semua modul siap dimainkan, diuji, dan digenerate lisensinya di Apps Studio.*`,
        relatedAction: () => { onSwitchPage('apps'); onClose(); }
      };
    }

    // H. Info Statistik & Portofolio
    if (q.includes('statistik') || q.includes('total') || q.includes('berapa') || q.includes('data web') || q.includes('karya') || q.includes('portofolio')) {
      const totalProj = (projects || []).length;
      const totalBlog = dynamicBlogs.length;
      const totalProd = dynamicProducts.length;
      const totalGame = dynamicGames.length;
      const totalTx = dynamicTransactions.length;
      const totalNotes = dynamicNotes.length;
      const totalPages = (globalSettings?.customPages || []).length + 3;

      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'dashboard',
        pageLabel: 'Lihat Dashboard Analitik',
        answerText: `**Statistik Ekosistem Website Lengkap (Offline Data):**\n- **Portofolio / Karya:** ${totalProj} proyek\n- **Artikel Blog:** ${totalBlog} artikel\n- **Produk Katalog:** ${totalProd} produk\n- **Apps Studio:** ${totalGame} game/aplikasi\n- **Transaksi & Invoice:** ${totalTx} transaksi\n- **Memo & Catatan:** ${totalNotes} catatan\n- **Halaman Website:** ${totalPages} halaman\n\n*Semua data tersinkronisasi offline dan dapat dikelola langsung dari CMS.*`,
        relatedAction: () => { onSwitchPage('dashboard'); onClose(); }
      };
    }

    // I. Panduan & SOP Studio
    if (q.includes('panduan') || q.includes('sop') || q.includes('cara kerja') || q.includes('bantuan') || q.includes('manual')) {
      return {
        isNavIntent: false,
        hasDirectAnswer: true,
        targetPage: 'guideline',
        pageLabel: 'Buka Panduan & SOP',
        answerText: `**Pusat Panduan Arsitektur & SOP Studio:**\n- **Alur Kerja Portofolio:** Tambah media, susun tag, set client, dan publikasi.\n- **Katalog & Checkout:** Buat paket layanan, integrasikan dengan WhatsApp atau Invoice.\n- **Apps Studio:** Masukkan bundle ZIP HTML5 atau modul internal untuk game & utilitas interaktif.\n- **Backup:** Selalu ekspor file JSON secara berkala untuk menjaga integritas data.`,
        relatedAction: () => { onSwitchPage('guideline'); onClose(); }
      };
    }

    return null;
  };

  // ── Unified Search, Offline Knowledge, & AI Execution ──
  const handleUnifiedSubmit = async (customPrompt?: string) => {
    const q = (typeof customPrompt === 'string' ? customPrompt : inputValue).trim();
    if (isTyping) return;

    // -1. CEK ACTIVE BANG ENGINE (JIKA SUDAH DIPILIH KOTAKAN)
    if (activeBangEngine) {
      activeBangEngine.action(q);
      setInputValue('');
      setActiveBangEngine(null);
      onClose();
      return;
    }

    if (!q) return;

    // 0. CEK PREFIX SHORTCUT COMMANDS (/, #, @)
    // A. Prefix Slash Command (/)
    if (q.startsWith('/')) {
      const matchCmd = filteredSlashCommands[0] || slashCommands.find(c => c.key.toLowerCase().startsWith(q.toLowerCase()));
      if (matchCmd && matchCmd.action) {
        window.dispatchEvent(new CustomEvent('porto_notify', { 
          detail: { message: `⚡ Eksekusi Perintah: ${matchCmd.label}...`, type: 'info' } 
        }));
        matchCmd.action();
        onClose();
        return;
      }
    }

    // B. Prefix Hashtag Module (#)
    if (q.startsWith('#')) {
      const matchMod = filteredHashtagModules[0] || hashtagModules.find(h => h.key.toLowerCase().startsWith(q.toLowerCase()));
      if (matchMod) {
        if (matchMod.action) {
          matchMod.action();
        } else if (matchMod.page) {
          onSwitchPage(matchMod.page);
        }
        onClose();
        return;
      }
    }

    // C. Prefix Mention (@)
    if (q.startsWith('@')) {
      if (q.toLowerCase().startsWith('@ai')) {
        const aiPrompt = q.slice(3).trim();
        setActiveTab('ai-chat');
        setInputValue('');
        if (aiPrompt) {
          handleUnifiedSubmit(aiPrompt);
        }
        return;
      }

      if (q.toLowerCase().startsWith('@web')) {
        const webQuery = q.slice(4).trim();
        setActiveTab('google-search');
        setInputValue('');
        if (webQuery) {
          navigateBrowser(getEngineSearchUrl(webQuery));
        } else {
          navigateBrowser(getEngineHomeUrl());
        }
        return;
      }

      const matchAt = filteredAtMentions[0] || atMentions.find(m => m.key.toLowerCase().startsWith(q.toLowerCase()));
      if (matchAt) {
        if (matchAt.type === 'web') {
          setActiveTab('google-search');
          navigateBrowser(getEngineHomeUrl());
          return;
        }
        if (matchAt.query) {
          const offRes = resolveOfflineQuery(matchAt.query);
          if (offRes && offRes.hasDirectAnswer) {
            setActiveTab('ai-chat');
            setInputValue('');
            const userMsg = { role: 'user', text: matchAt.label };
            const offlineAssistantMsg = { 
              role: 'assistant', 
              text: offRes.answerText, 
              type: 'text',
              isOffline: true,
              targetPage: offRes.targetPage,
              pageLabel: offRes.pageLabel
            };
            setSessions(prev => prev.map(s => {
              if (s.id === currentSessionId) {
                return { ...s, messages: [...messages, userMsg, offlineAssistantMsg] };
              }
              return s;
            }));
            return;
          }
        }
      }
    }

    // D. Prefix Bang Internet Search (!)
    if (q.startsWith('!')) {
      const trimmedBang = q.slice(1).trim();
      const firstWord = trimmedBang.split(' ')[0].toLowerCase();
      const remainingQuery = trimmedBang.includes(' ') ? trimmedBang.slice(firstWord.length).trim() : '';

      const matchEngine = bangEngines.find(b => b.key.toLowerCase() === `!${firstWord}` || b.key.toLowerCase().startsWith(`!${firstWord}`));
      if (matchEngine) {
        matchEngine.action(remainingQuery || trimmedBang);
        setInputValue('');
        return;
      }

      // Default: Cari langsung di Google Search mini browser
      setActiveTab('google-search');
      setInputValue('');
      if (trimmedBang) {
        navigateBrowser(getEngineSearchUrl(trimmedBang));
      } else {
        navigateBrowser(getEngineHomeUrl());
      }
      return;
    }

    // 1. Cek Offline Knowledge & Nav Intent
    const offlineResult = resolveOfflineQuery(q);

    // A. Jika merupakan Nav Intent langsung (misal "buka apps", "ke database", dll.) -> AUTO NAVIGATE
    if (offlineResult && offlineResult.isNavIntent && offlineResult.targetPage) {
      window.dispatchEvent(new CustomEvent('porto_notify', { 
        detail: { message: `⚡ Auto-navigate: Membuka ${offlineResult.pageLabel}...`, type: 'info' } 
      }));
      onSwitchPage(offlineResult.targetPage);
      onClose();
      return;
    }

    // B. Jika ada item navigasi yang terpilih di daftar menu saat mengetik
    if (activeTab === 'shortcuts' && filteredSearchItems.length > 0 && searchSelectedIndex >= 0 && searchSelectedIndex < filteredSearchItems.length) {
      const selected = filteredSearchItems[searchSelectedIndex];
      if (selected && (selected.label.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(selected.label.toLowerCase()))) {
        handleSearchSelect(selected);
        return;
      }
    }

    // C. Alihkan ke AI Assistant View untuk menyajikan jawaban
    setActiveTab('ai-chat');
    setInputValue('');

    const userMsg = { role: 'user', text: q };
    const updatedMessages = [...messages, userMsg];

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: updatedMessages, title: s.title === 'Sesi Utama' ? q.slice(0, 24) + '...' : s.title };
      }
      return s;
    }));

    // Jika ada jawaban langsung offline dari data website:
    if (offlineResult && offlineResult.hasDirectAnswer && offlineResult.answerText) {
      const offlineAssistantMsg = { 
        role: 'assistant', 
        text: offlineResult.answerText, 
        type: 'text',
        isOffline: true,
        targetPage: offlineResult.targetPage,
        pageLabel: offlineResult.pageLabel
      };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...updatedMessages, offlineAssistantMsg] };
        }
        return s;
      }));
      return;
    }

    // D. Jika TIDAK ada jawaban offline di data website -> BARU SAMBUNGKAN KE AI ATAU WEB!
    setIsTyping(true);
    const context = `
      Anda adalah Sunny (Sunshine Co-Pilot), asisten AI cerdas bawaan studio sumr.day / Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic ("A little sunshine for your screen").
      Informasi Ekosistem Website & CMS Pengguna:
      - Nama Studio / Space: ${globalSettings?.cmsName || 'sumr.day OS'}
      - Judul Website: ${globalSettings?.siteTitle || 'sumr.day | Creative Digital Studio'}
      - Total Portofolio: ${(projects || []).length} proyek
      - Total Artikel: ${dynamicBlogs.length} artikel
      - Total Katalog: ${dynamicProducts.length} produk
      - Total Apps Studio: ${dynamicGames.length} modul
      - Total Halaman: ${(globalSettings?.customPages || []).length + 3} halaman
      - Admin: ${userData?.name || 'Admin'} (${userData?.role || 'Super Admin'})

      Jawablah secara hangat, ramah, membahagiakan, terstruktur, to-the-point, menggunakan format Markdown rapi.
    `;

    try {
      const response = await callGemini(q, context);
      const assistantMsg = { role: 'assistant', text: response, type: 'text', isOffline: false, query: q };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...updatedMessages, assistantMsg] };
        }
        return s;
      }));
    } catch (e: any) {
      const errAssistantMsg = { 
        role: 'assistant', 
        text: `Tidak menemukan data lokal untuk topik ini dan AI online belum dapat dihubungi: ${e.message}.\n\nAnda dapat mencari langsung di Web Internet melalui mini browser pencarian.`, 
        type: 'error',
        query: q,
        suggestWebSearch: true
      };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...updatedMessages, errAssistantMsg] };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const createNewSession = () => {
    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      title: `Sesi #${sessions.length + 1}`,
      messages: [
        { role: 'assistant', text: "Sesi percakapan baru dimulai. Ada yang bisa saya bantu terkait pengelolaan website atau portofolio?", type: 'text' }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        const freshId = `session_${Date.now()}`;
        const freshSession = {
          id: freshId,
          title: 'Sesi Baru',
          messages: [
            { role: 'assistant', text: "Halo! Ruang chat telah dibersihkan. Ada ide atau pertanyaan yang ingin kita diskusikan?", type: 'text' }
          ]
        };
        setCurrentSessionId(freshId);
        return [freshSession];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const clearCurrentSessionMessages = () => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title: 'Sesi Baru',
          messages: [
            { role: 'assistant', text: "Percakapan di ruangan ini telah dibersihkan. Silakan ajukan pertanyaan baru!", type: 'text' }
          ]
        };
      }
      return s;
    }));
  };

  const copyToClipboard = (text, index) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Backspace' && !inputValue && activeBangEngine) {
      e.preventDefault();
      setActiveBangEngine(null);
      setInputWithCursorAtEnd('!');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleUnifiedSubmit();
    } else if (e.key === 'ArrowDown' && activeTab === 'shortcuts' && filteredSearchItems.length > 0) {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev < filteredSearchItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp' && activeTab === 'shortcuts' && filteredSearchItems.length > 0) {
      e.preventDefault();
      setSearchSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredSearchItems.length - 1));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="global-search-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.25)',
        zIndex: 2147483640,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(20px, 3vh) 16px calc(75px + env(safe-area-inset-bottom, 0px))',
        animation: 'cmsFadeIn 0.2s ease-out',
        cursor: 'pointer'
      }}
      onClick={onClose}
    >
      <div 
        className="global-search-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          maxHeight: 'min(640px, calc(100dvh - 120px))',
          borderRadius: 18,
          background: 'var(--cms-card-bg)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.12))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cmsModalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'default',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)'
        }}
      >
        {/* Top Header */}
        <div className="global-search-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid var(--cms-border, rgba(255, 255, 255, 0.08))',
          background: 'var(--cms-card-bg)',
          flexShrink: 0,
          gap: 8,
          flexWrap: 'nowrap'
        }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--cms-accent)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'none',
              flexShrink: 0
            }}>
              <Search size={16} strokeWidth={2.4} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Pencarian Sistem & AI
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
            </div>
          </div>

          {/* Unified Action Header (No fragmented tabs) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {activeTab !== 'shortcuts' && (
              <button
                type="button"
                onClick={() => setActiveTab('shortcuts')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 100,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-switcher-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                <ArrowLeft size={13} strokeWidth={2.5} /> Menu Utama
              </button>
            )}

            <button 
              onClick={onClose} 
              style={{
                width: 32,
                height: 32,
                minWidth: 32,
                minHeight: 32,
                maxWidth: 32,
                maxHeight: 32,
                flexShrink: 0,
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-switcher-bg)',
                color: 'var(--cms-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: '0.2s',
                marginLeft: 2,
                boxSizing: 'border-box'
              }}
              className="close-modal-btn"
              title="Tutup (ESC)"
            >
              <X size={15} style={{ flexShrink: 0 }} />
            </button>
          </div>
        </div>

        {/* ── CENTRAL CONTENT AREA ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', height: 0, scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
          
          {/* TAB 1: SHORTCUTS & LOCAL CMS MATCHES */}
          {activeTab === 'shortcuts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Category Filter Pills (Pure Lucide Icons, No Emojis) */}
              <div className="cat-filter-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 6px 6px 6px', width: '100%', margin: '0 auto' }}>
                {[
                  { id: 'all', label: 'Semua', icon: Layers },
                  { id: 'Aksi Cepat', label: 'Aksi Cepat', icon: Zap },
                  { id: 'Modul', label: 'Modul Konten', icon: FolderKanban },
                  { id: 'Pengaturan', label: 'Pengaturan', icon: Settings },
                  { id: 'Pintasan', label: 'Pintasan Sistem', icon: Sliders }
                ].map(cat => {
                  const CatIcon = cat.icon;
                  const isCatActive = selectedCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className="cat-pill-btn"
                      style={{
                        padding: '5px 12px',
                        borderRadius: 8,
                        border: `1px solid ${isCatActive ? 'var(--cms-accent)' : 'var(--cms-border, rgba(0,0,0,0.1))'}`,
                        background: isCatActive ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)',
                        color: isCatActive ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                      title={cat.label}
                    >
                      <CatIcon size={13} strokeWidth={2.2} />
                      <span className="cat-pill-text">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* When typing, show filtered items instantly */}
              {inputValue.trim() || selectedCategoryFilter !== 'all' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  
                  {/* Smart Offline Detection & Auto-Navigate Banner (Solid Clean) */}
                  {inputValue.trim() && (() => {
                    const match = resolveOfflineQuery(inputValue);
                    if (!match) return null;
                    return (
                      <div 
                        onClick={() => {
                          if (match.relatedAction) match.relatedAction();
                          else if (match.targetPage) { onSwitchPage(match.targetPage); onClose(); }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'var(--cms-accent-soft)',
                          border: '1px solid var(--cms-accent, #7c3aed)',
                          cursor: 'pointer',
                          gap: 12,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--cms-accent, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Zap size={15} strokeWidth={2.4} />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--cms-text)' }}>
                            {match.pageLabel ? `Eksekusi: ${match.pageLabel}` : 'Info Offline Terdeteksi'}
                          </div>
                        </div>
                        <button
                          type="button"
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            background: 'var(--cms-accent, #7c3aed)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0
                          }}
                        >
                          Eksekusi <ArrowLeft size={11} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                      </div>
                    );
                  })()}

                  {/* Contextual Prefix Rendering: Bang Web Search (!) */}
                  {isBangActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Globe size={13} strokeWidth={2.2} /> PENCARIAN WEB INTERNET {activeBangEngine ? `• ${activeBangEngine.label}` : `(${filteredBangEngines.length})`}
                      </div>
                      {activeBangEngine ? (
                        <div style={{
                          padding: '14px 16px',
                          borderRadius: 8,
                          border: '1px solid rgba(37, 99, 235, 0.25)',
                          background: 'rgba(37, 99, 235, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {activeBangEngine.icon ? <activeBangEngine.icon size={16} /> : <Globe size={16} />}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--cms-text)' }}>
                                {activeBangEngine.label}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                                Ketik kata kunci di kolom bawah lalu tekan <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--cms-switcher-bg)', border: '1px solid var(--cms-border, rgba(0,0,0,0.1))' }}>Enter</kbd> atau tombol kirim.
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveBangEngine(null);
                              setInputWithCursorAtEnd('!');
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(37, 99, 235, 0.3)',
                              background: 'var(--cms-card-bg)',
                              color: '#2563eb',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Ganti
                          </button>
                        </div>
                      ) : filteredBangEngines.length === 0 ? (
                        <div style={{ padding: '16px', borderRadius: 8, border: '1px dashed var(--cms-border, rgba(0,0,0,0.1))', textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 12 }}>
                          Ketik topik setelah tanda ! (contoh: ! resep, ! google tutorial, ! wiki sejarah)
                        </div>
                      ) : (
                        filteredBangEngines.map((engine, idx) => {
                          const IconE = engine.icon || Globe;
                          const isSelected = searchSelectedIndex === idx;
                          return (
                            <div
                              key={engine.key}
                              onClick={() => {
                                setActiveBangEngine(engine);
                                setInputValue('');
                                setTimeout(() => {
                                  if (searchInputRef.current) {
                                    searchInputRef.current.focus();
                                  }
                                }, 30);
                              }}
                              onMouseEnter={() => setSearchSelectedIndex(idx)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                                borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s',
                                background: isSelected ? 'rgba(37, 99, 235, 0.1)' : 'var(--cms-card-bg)',
                                border: `1px solid ${isSelected ? '#2563eb' : 'var(--cms-border, rgba(0,0,0,0.06))'}`
                              }}
                            >
                              <div style={{ 
                                width: 28, height: 28, borderRadius: 6,
                                background: isSelected ? '#2563eb' : 'var(--cms-switcher-bg)',
                                color: isSelected ? '#fff' : '#2563eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                              }}>
                                <IconE size={14} strokeWidth={2.2} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', fontFamily: 'monospace', flexShrink: 0 }}>{engine.key}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{engine.label}</span>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '2px 7px', borderRadius: 4 }}>
                                Internet
                              </span>
                              {isSelected && <CornerDownLeft size={13} color="#2563eb" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Contextual Prefix Rendering: Slash Commands (/) */}
                  {isSlashActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Terminal size={13} strokeWidth={2.2} /> DAFTAR PERINTAH & AKSI CEPAT ({filteredSlashCommands.length})
                      </div>
                      {filteredSlashCommands.length === 0 ? (
                        <div style={{ padding: '16px', borderRadius: 8, border: '1px dashed var(--cms-border, rgba(0,0,0,0.1))', textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 12 }}>
                          Tidak ada perintah dengan kata kunci "{inputValue}". Coba /buat-proyek, /tulis-artikel, /tambah-produk, dll.
                        </div>
                      ) : (
                        filteredSlashCommands.map((cmd, idx) => {
                          const IconC = cmd.icon || Zap;
                          const isSelected = searchSelectedIndex === idx;
                          return (
                            <div
                              key={cmd.key}
                              onClick={() => { cmd.action(); onClose(); }}
                              onMouseEnter={() => setSearchSelectedIndex(idx)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                                borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s',
                                background: isSelected ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg)',
                                border: `1px solid ${isSelected ? 'var(--cms-accent)' : 'var(--cms-border, rgba(0,0,0,0.06))'}`
                              }}
                            >
                              <div style={{ 
                                width: 28, height: 28, borderRadius: 6,
                                background: isSelected ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                                color: isSelected ? '#fff' : 'var(--cms-accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                              }}>
                                <IconC size={14} strokeWidth={2.2} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-accent)', fontFamily: 'monospace', flexShrink: 0 }}>{cmd.key}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd.label}</span>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--cms-switcher-bg)', color: 'var(--cms-text-muted)', padding: '2px 7px', borderRadius: 4 }}>
                                {cmd.badge}
                              </span>
                              {isSelected && <CornerDownLeft size={13} color="var(--cms-accent)" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Contextual Prefix Rendering: Hashtag Modules (#) */}
                  {isHashActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <FolderKanban size={13} strokeWidth={2.2} /> FILTER MODUL & ENTITAS ({filteredHashtagModules.length})
                      </div>
                      {filteredHashtagModules.length === 0 ? (
                        <div style={{ padding: '16px', borderRadius: 8, border: '1px dashed var(--cms-border, rgba(0,0,0,0.1))', textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 12 }}>
                          Tidak ada modul dengan tag "{inputValue}". Coba #proyek, #blog, #katalog, #memo, #halaman, dll.
                        </div>
                      ) : (
                        filteredHashtagModules.map((mod, idx) => {
                          const IconM = mod.icon || FolderKanban;
                          const isSelected = searchSelectedIndex === idx;
                          return (
                            <div
                              key={mod.key}
                              onClick={() => {
                                if (mod.action) mod.action();
                                else if (mod.page) onSwitchPage(mod.page);
                                onClose();
                              }}
                              onMouseEnter={() => setSearchSelectedIndex(idx)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                                borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s',
                                background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'var(--cms-card-bg)',
                                border: `1px solid ${isSelected ? '#10b981' : 'var(--cms-border, rgba(0,0,0,0.06))'}`
                              }}
                            >
                              <div style={{ 
                                width: 28, height: 28, borderRadius: 6,
                                background: isSelected ? '#10b981' : 'var(--cms-switcher-bg)',
                                color: isSelected ? '#fff' : '#10b981',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                              }}>
                                <IconM size={14} strokeWidth={2.2} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981', fontFamily: 'monospace', flexShrink: 0 }}>{mod.key}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.label}</span>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 7px', borderRadius: 4 }}>
                                Modul
                              </span>
                              {isSelected && <CornerDownLeft size={13} color="#10b981" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Contextual Prefix Rendering: At-Mentions (@) */}
                  {isAtActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Bot size={13} strokeWidth={2.2} /> TARGET KONTEKS & TANYA AI ({filteredAtMentions.length})
                      </div>
                      {filteredAtMentions.length === 0 ? (
                        <div style={{ padding: '16px', borderRadius: 8, border: '1px dashed var(--cms-border, rgba(0,0,0,0.1))', textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 12 }}>
                          Tidak ada konteks dengan tag "{inputValue}". Coba @ai, @keuangan, @catatan, @kontak, @web, dll.
                        </div>
                      ) : (
                        filteredAtMentions.map((at, idx) => {
                          const IconA = at.icon || Bot;
                          const isSelected = searchSelectedIndex === idx;
                          return (
                            <div
                              key={at.key}
                              onClick={() => {
                                if (at.type === 'ai') {
                                  setActiveTab('ai-chat');
                                  setInputValue('');
                                } else if (at.type === 'web') {
                                  setActiveTab('google-search');
                                  navigateBrowser(getEngineHomeUrl());
                                } else if (at.query) {
                                  const off = resolveOfflineQuery(at.query);
                                  if (off && off.hasDirectAnswer) {
                                    setActiveTab('ai-chat');
                                    setInputValue('');
                                    const userMsg = { role: 'user', text: at.label };
                                    const offlineAssistantMsg = { 
                                      role: 'assistant', text: off.answerText, type: 'text',
                                      isOffline: true, targetPage: off.targetPage, pageLabel: off.pageLabel
                                    };
                                    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...messages, userMsg, offlineAssistantMsg] } : s));
                                  }
                                }
                              }}
                              onMouseEnter={() => setSearchSelectedIndex(idx)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                                borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s',
                                background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'var(--cms-card-bg)',
                                border: `1px solid ${isSelected ? '#f59e0b' : 'var(--cms-border, rgba(0,0,0,0.06))'}`
                              }}
                            >
                              <div style={{ 
                                width: 28, height: 28, borderRadius: 6,
                                background: isSelected ? '#f59e0b' : 'var(--cms-switcher-bg)',
                                color: isSelected ? '#fff' : '#f59e0b',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                              }}>
                                <IconA size={14} strokeWidth={2.2} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace', flexShrink: 0 }}>{at.key}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{at.label}</span>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '2px 7px', borderRadius: 4 }}>
                                {at.type === 'ai' ? 'Asisten AI' : at.type === 'web' ? 'Web' : 'Offline'}
                              </span>
                              {isSelected && <CornerDownLeft size={13} color="#f59e0b" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Standard Search Results (when no prefix active) */}
                  {!isSlashActive && !isHashActive && !isAtActive && !isBangActive && (() => {
                    const displayItems = searchItems.filter(item => {
                      const matchCat = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
                      if (!inputValue.trim()) return matchCat;
                      const q = inputValue.toLowerCase();
                      const matchQuery = item.label.toLowerCase().includes(q) || item.desc?.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
                      return matchCat && matchQuery;
                    });

                    return (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent)', letterSpacing: '0.05em', marginBottom: 2 }}>
                          HASIL PENCARIAN & AKSI ({displayItems.length})
                        </div>
                        {displayItems.length === 0 ? (
                          <div style={{ padding: '20px 16px', borderRadius: 8, border: '1px dashed var(--cms-border, rgba(0,0,0,0.1))', textAlign: 'center', color: 'var(--cms-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text)' }}>Tidak ada menu lokal untuk "{inputValue}"</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleUnifiedSubmit(inputValue)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  background: 'var(--cms-accent)',
                                  color: '#fff',
                                  border: 'none',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}
                              >
                                <Bot size={13} /> Tanya AI Co-Pilot
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('google-search');
                                  navigateBrowser(getEngineSearchUrl(inputValue));
                                }}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 8,
                                  background: 'var(--cms-switcher-bg)',
                                  color: 'var(--cms-text)',
                                  border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}
                              >
                                <Globe size={13} /> Cari di Internet
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {displayItems.map((item, idx) => {
                              const IconComp = item.icon || Info;
                              const isSelected = searchSelectedIndex === idx;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleSearchSelect(item)}
                                  onMouseEnter={() => setSearchSelectedIndex(idx)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s',
                                    background: isSelected ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg)',
                                    border: `1px solid ${isSelected ? 'var(--cms-accent)' : 'var(--cms-border, rgba(0,0,0,0.06))'}`
                                  }}
                                >
                                  <div style={{ 
                                    width: 28, height: 28, borderRadius: 6,
                                    background: isSelected ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                                    color: isSelected ? '#fff' : 'var(--cms-accent)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                                  }}>
                                    <IconComp size={14} strokeWidth={2.2} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {item.label}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--cms-switcher-bg)', padding: '2px 7px', borderRadius: 4, color: 'var(--cms-text-muted)' }}>
                                    {item.category}
                                  </span>
                                  {isSelected && <CornerDownLeft size={13} color="var(--cms-accent)" />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* Default View: Minimalist Clean Sections */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Section 0: Aksi Cepat & Tambah Data */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent)', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={13} /> AKSI CEPAT & TAMBAH DATA
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
                      {[
                        { label: 'Buka Galeri Media', icon: GalleryIcon, action: () => setShowMediaGalleryModal(true) },
                        { label: 'Upload File Langsung', icon: UploadCloud, action: () => fileInputRef.current?.click() },
                        { label: 'Tambah Proyek Baru', icon: FolderPlus, action: triggerCreateProject },
                        { label: 'Tulis Artikel Blog', icon: FilePlus2, action: triggerCreateBlog },
                        { label: 'Tambah Produk Jasa', icon: PlusCircle, action: triggerCreateProduct },
                        { label: 'Buat Catatan / Memo', icon: StickyNote, action: triggerCreateMemo },
                        { label: 'Catat Transaksi Baru', icon: DollarSign, action: triggerCreateTransaction },
                        { label: 'Ekspor Backup JSON', icon: DownloadCloud, action: handleDirectBackup },
                      ].map((m, i) => (
                        <div
                          key={i}
                          onClick={m.action}
                          className="quick-action-card"
                          style={{
                            padding: '10px 12px', borderRadius: 14,
                            background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'all 0.2s', minWidth: 0
                          }}
                        >
                          <m.icon size={15} color="var(--cms-accent)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 1: Modul Utama */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Layers size={13} color="var(--cms-accent)" /> MODUL KONTEN
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                      {[
                        { label: 'Memo & Catatan', icon: FileText, page: 'memo' },
                        { label: 'Proyek Portofolio', icon: FolderKanban, page: 'projects' },
                        { label: 'Artikel Blog', icon: BookOpen, page: 'blog' },
                        { label: 'Katalog & Transaksi', icon: ShoppingBag, page: 'transactions' },
                      ].map((m, i) => (
                        <div
                          key={i}
                          onClick={() => { onSwitchPage(m.page); onClose(); }}
                          className="quick-action-card"
                          style={{
                            padding: '10px 12px', borderRadius: 14,
                            background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'all 0.2s', minWidth: 0
                          }}
                        >
                          <m.icon size={15} color="var(--cms-accent)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Pengaturan & Sistem */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Settings size={13} color="#f59e0b" /> PENGATURAN & SISTEM
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                      {[
                        { label: 'Website Landing', icon: Globe, page: 'website' },
                        { label: 'Penyimpanan & DB', icon: Database, page: 'storage' },
                        { label: 'Manajemen User', icon: Users, page: 'users' },
                        { label: 'Pengaturan Global', icon: Settings, page: 'settings' },
                      ].map((m, i) => (
                        <div
                          key={i}
                          onClick={() => { onSwitchPage(m.page); onClose(); }}
                          className="quick-action-card"
                          style={{
                            padding: '10px 12px', borderRadius: 14,
                            background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'all 0.2s', minWidth: 0
                          }}
                        >
                          <m.icon size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Pintasan Cepat */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={13} color="#10b981" /> PINTASAN CEPAT
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                      {[
                        { label: 'Bersihkan Cache', icon: RefreshCw, action: handleClearCache },
                        { label: 'Mode Gelap / Terang', icon: Zap, action: () => window.dispatchEvent(new CustomEvent('porto_toggle_theme')) },
                        { label: 'Simpan Cloud', icon: Save, action: () => window.dispatchEvent(new CustomEvent('porto_manual_save', { detail: { force: true } })) },
                        { label: 'Buka Web Publik', icon: ExternalLink, action: () => window.open('/', '_blank') },
                      ].map((s, i) => (
                        <div
                          key={i}
                          onClick={() => { s.action(); if (s.label !== 'Bersihkan Cache') onClose(); }}
                          className="quick-action-card"
                          style={{
                            padding: '12px 14px', borderRadius: 14,
                            background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                            transition: 'all 0.2s'
                          }}
                        >
                          <s.icon size={16} color="#10b981" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI CO-PILOT CHAT */}
          {activeTab === 'ai-chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>
              {/* Session Bar & New Session Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--glass-border)', flexShrink: 0, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flex: 1 }}>
                  {sessions.map(s => {
                    const isCurrent = s.id === currentSessionId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setCurrentSessionId(s.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 100,
                          background: isCurrent ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                          color: isCurrent ? '#fff' : 'var(--cms-text-muted)',
                          fontSize: 11,
                          fontWeight: 750,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{s.title}</span>
                        <span
                          role="button"
                          onClick={(e) => deleteSession(e, s.id)}
                          title="Hapus room ini"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: isCurrent ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            opacity: 0.75,
                            transition: 'opacity 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0.75'; }}
                        >
                          <X size={10} strokeWidth={2.5} />
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button 
                    onClick={clearCurrentSessionMessages}
                    title="Bersihkan isi percakapan ruangan ini"
                    style={{
                      padding: '4px 9px', borderRadius: 100, border: '1px solid var(--glass-border)',
                      background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Trash2 size={11} /> Bersihkan
                  </button>
                  <button 
                    onClick={createNewSession}
                    style={{
                      padding: '4px 10px', borderRadius: 100, border: '1px solid var(--glass-border)',
                      background: 'var(--cms-input-bg)', color: 'var(--cms-accent)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Plus size={12} /> Sesi Baru
                  </button>
                </div>
              </div>

              {/* Prompt Suggestions */}
              {messages.length <= 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
                  {PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUnifiedSubmit(item.prompt)}
                      style={{
                        padding: '8px 12px', borderRadius: 12, border: '1px solid var(--glass-border)',
                        background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                    >
                      <item.icon size={13} color="var(--cms-accent)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Message Feed */}
              <div 
                ref={chatScrollRef}
                style={{
                  flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
                  paddingRight: 4, scrollbarWidth: 'thin'
                }}
              >
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        gap: 4
                      }}
                    >
                      <div style={{
                        maxWidth: '85%', padding: '10px 14px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isUser ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                        color: isUser ? '#ffffff' : 'var(--cms-text)',
                        fontSize: 13, lineHeight: 1.5, fontWeight: isUser ? 600 : 400,
                        border: isUser ? 'none' : '1px solid var(--glass-border)',
                        position: 'relative'
                      }}>
                        {msg.isOffline && (
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '2px 8px', borderRadius: 100 }}>
                              <Zap size={10} strokeWidth={2.5} /> Jawaban Offline Website
                            </span>
                          </div>
                        )}
                        <MarkdownText text={msg.text} />
                        {msg.targetPage && (
                          <div style={{ marginTop: 10 }}>
                            <button
                              type="button"
                              onClick={() => { onSwitchPage(msg.targetPage); onClose(); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 100,
                                background: 'var(--cms-accent)',
                                color: '#fff',
                                border: 'none',
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb), 0.3)'
                              }}
                            >
                              <ExternalLink size={12} /> Buka {msg.pageLabel || 'Modul'}
                            </button>
                          </div>
                        )}
                        {msg.suggestWebSearch && (
                          <div style={{ marginTop: 10 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('google-search');
                                setHasSearched(true);
                                const url = getEngineSearchUrl(msg.query || inputValue);
                                navigateBrowser(url);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 100,
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Globe size={12} /> Cari "{msg.query || 'topik ini'}" di Web
                            </button>
                          </div>
                        )}
                        {!isUser && (
                          <button
                            onClick={() => copyToClipboard(msg.text, idx)}
                            style={{
                              position: 'absolute', bottom: 4, right: 4,
                              background: 'transparent', border: 'none',
                              color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4
                            }}
                            title="Salin jawaban"
                          >
                            {copiedIndex === idx ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    borderRadius: 100, background: 'var(--cms-input-bg)', width: 'fit-content',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <Sparkles size={13} color="var(--cms-accent)" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-accent)' }}>
                      Memproses respon...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE / WEB SEARCH */}
          {activeTab === 'google-search' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, position: 'relative' }}>
              {!hasSearched || !browserUrl ? (
                /* Saat belum di-search: Modul Kosong Bersih */
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              ) : (
                /* Saat sudah di-search: Langsung Tampilkan Hasil */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, gap: 6 }}>
                  {/* Slim Action Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {ENGINE_META[browserEngine]?.icon}
                        <span>{ENGINE_META[browserEngine]?.name} Search</span>
                      </span>
                      {isIframeLoading && <RefreshCw size={11} className="cms-spin" color="var(--cms-accent)" />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={handleBrowserReload}
                        style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                        title="Muat Ulang"
                      >
                        <RefreshCw size={12} />
                      </button>

                      <a
                        href={ENGINE_META[browserEngine]?.directUrl ? `${ENGINE_META[browserEngine].directUrl}${encodeURIComponent(inputValue.trim())}` : browserUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)',
                          border: '1px solid var(--glass-border)', borderRadius: 8,
                          padding: '3px 9px', fontSize: 11, fontWeight: 750,
                          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                          boxShadow: 'var(--cms-shadow-sm)'
                        }}
                        title={`Buka langsung di ${ENGINE_META[browserEngine]?.name || 'Web'}`}
                      >
                        <ExternalLink size={11} />
                        <span>Buka {ENGINE_META[browserEngine]?.name || 'Web'}</span>
                      </a>
                    </div>
                  </div>

                  {/* Live Iframe */}
                  <div style={{
                    position: 'relative',
                    flex: 1,
                    minHeight: 280,
                    width: '100%',
                    borderRadius: 16,
                    border: '1px solid var(--glass-border)',
                    background: '#ffffff',
                    overflow: 'hidden'
                  }}>
                    <iframe
                      key={iframeKey}
                      src={browserUrl}
                      onLoad={() => setIsIframeLoading(false)}
                      title="Hasil Pencarian Web"
                      style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff', display: 'block' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── UNIFIED BOTTOM CONTROL STATION ── */}
        <div className="global-search-bottom-station" style={{
          padding: '12px 18px 16px 18px',
          borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          background: 'var(--cms-card-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flexShrink: 0
        }}>
          {activeTab === 'google-search' ? (
            /* Mode Search Web: Back Button + Kapsul Pill Input + Icon Search */
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              {/* Tombol Back */}
              <button
                type="button"
                onClick={() => {
                  setHasSearched(false);
                  setActiveTab('shortcuts');
                }}
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  minHeight: 40,
                  borderRadius: 100,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-card-bg)',
                  color: 'var(--cms-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--cms-shadow-sm)',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                title="Kembali ke Menu"
              >
                <ArrowLeft size={16} strokeWidth={2.5} />
              </button>

              <form
                onSubmit={handleGoogleSearchSubmit}
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--cms-input-bg)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 100,
                  padding: '3px 4px 3px 6px',
                  gap: 6,
                  boxShadow: 'var(--cms-shadow-sm)'
                }}
              >
                {/* Left: Engine Selector Pill */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsEngineDropdownOpen(!isEngineDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      borderRadius: 100,
                      background: 'var(--cms-card-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                    }}
                  >
                    {ENGINE_META[browserEngine]?.icon}
                    <span>{ENGINE_META[browserEngine]?.name}</span>
                    <ChevronDown size={12} style={{ opacity: 0.6 }} />
                  </button>

                  {/* Dropdown Menu (Exact 9 Websites) */}
                  {isEngineDropdownOpen && (
                    <>
                      <div
                        onClick={() => setIsEngineDropdownOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'transparent' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 99999,
                        background: 'var(--cms-card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: 16,
                        boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        minWidth: 165,
                        maxHeight: '290px',
                        overflowY: 'auto'
                      }}>
                        {Object.entries(ENGINE_META).map(([key, meta]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setBrowserEngine(key);
                              setIsEngineDropdownOpen(false);
                              if (inputValue.trim()) {
                                setHasSearched(true);
                                const url = getEngineSearchUrl(inputValue.trim(), key);
                                navigateBrowser(url, key);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 9,
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: 'none',
                              background: browserEngine === key ? 'var(--cms-accent-soft)' : 'transparent',
                              color: browserEngine === key ? 'var(--cms-accent)' : 'var(--cms-text)',
                              fontSize: 12.5,
                              fontWeight: browserEngine === key ? 800 : 650,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {meta.icon}
                            <span>{meta.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Center: Search Input */}
                <input
                  ref={searchInputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={ENGINE_META[browserEngine]?.placeholder || "Cari..."}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '0 8px'
                  }}
                />

                {/* Right: Solid Search Button */}
                <button
                  type="submit"
                  onClick={handleGoogleSearchSubmit}
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 38,
                    minHeight: 38,
                    borderRadius: 8,
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    transition: 'opacity 0.15s ease',
                    flexShrink: 0
                  }}
                  title="Cari Web (Enter)"
                >
                  <Globe size={16} strokeWidth={2.4} />
                </button>
              </form>
            </div>
          ) : (
            /* Mode AI / Shortcuts bottom station */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Quick Prefix Shortcut Chips (Thumb-friendly & Pure Lucide Icons) */}
              <div className="quick-prefix-chips" style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 6px 6px 6px', minHeight: 36 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 2, flexShrink: 0 }}>
                  Aksi Cepat:
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    setActiveBangEngine(null);
                    setInputWithCursorAtEnd('/');
                  }}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 8,
                    border: `1px solid ${isSlashActive ? 'var(--cms-accent)' : 'var(--cms-border, rgba(0,0,0,0.1))'}`,
                    background: isSlashActive ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)',
                    color: isSlashActive ? 'var(--cms-accent)' : 'var(--cms-text)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    lineHeight: 1.2
                  }}
                  title="Perintah Aksi & Buat Data"
                >
                  <Terminal size={12} strokeWidth={2.2} color="var(--cms-accent)" />
                  <span>/ Perintah</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveBangEngine(null);
                    setInputWithCursorAtEnd('#');
                  }}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 8,
                    border: `1px solid ${isHashActive ? '#10b981' : 'var(--cms-border, rgba(0,0,0,0.1))'}`,
                    background: isHashActive ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-input-bg)',
                    color: isHashActive ? '#10b981' : 'var(--cms-text)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    lineHeight: 1.2
                  }}
                  title="Filter Modul & Entitas"
                >
                  <FolderKanban size={12} strokeWidth={2.2} color="#10b981" />
                  <span># Modul</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveBangEngine(null);
                    setInputWithCursorAtEnd('@');
                  }}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 8,
                    border: `1px solid ${isAtActive ? '#f59e0b' : 'var(--cms-border, rgba(0,0,0,0.1))'}`,
                    background: isAtActive ? 'rgba(245, 158, 11, 0.12)' : 'var(--cms-input-bg)',
                    color: isAtActive ? '#d97706' : 'var(--cms-text)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    lineHeight: 1.2
                  }}
                  title="Tanya AI & Konteks Data"
                >
                  <Bot size={12} strokeWidth={2.2} color="#f59e0b" />
                  <span>@ Tanya AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveBangEngine(null);
                    setInputWithCursorAtEnd('!');
                  }}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 8,
                    border: `1px solid ${isBangActive ? '#2563eb' : 'var(--cms-border, rgba(0,0,0,0.1))'}`,
                    background: isBangActive ? 'rgba(37, 99, 235, 0.12)' : 'var(--cms-input-bg)',
                    color: isBangActive ? '#2563eb' : 'var(--cms-text)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                    lineHeight: 1.2
                  }}
                  title="Cari di Web Internet"
                >
                  <Globe size={12} strokeWidth={2.2} color="#2563eb" />
                  <span>! Cari Web</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {activeTab === 'ai-chat' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('shortcuts')}
                    style={{
                      width: 40,
                      height: 40,
                      minWidth: 40,
                      minHeight: 40,
                      borderRadius: 8,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                      background: 'var(--cms-card-bg)',
                      color: 'var(--cms-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Kembali ke Menu"
                  >
                    <ArrowLeft size={16} strokeWidth={2.4} />
                  </button>
                )}

                <div style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--cms-input-bg)',
                  borderRadius: 8,
                  padding: activeBangEngine ? '0 10px 0 6px' : '0 12px',
                  height: 40,
                  border: activeBangEngine 
                    ? '1.5px solid #2563eb' 
                    : isSlashActive 
                    ? '1.5px solid var(--cms-accent)' 
                    : isHashActive 
                    ? '1.5px solid #10b981' 
                    : isAtActive 
                    ? '1.5px solid #f59e0b' 
                    : isBangActive 
                    ? '1.5px solid #2563eb' 
                    : '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                  transition: 'all 0.15s ease'
                }}>
                  {/* Kotakan Active Bang Engine (Misal: !youtube) */}
                  {activeBangEngine && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(37, 99, 235, 0.15)',
                      border: '1px solid #2563eb',
                      color: '#2563eb',
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      marginRight: 6
                    }}>
                      {activeBangEngine.icon && <activeBangEngine.icon size={13} strokeWidth={2.4} />}
                      <span>{activeBangEngine.key}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBangEngine(null);
                          setInputWithCursorAtEnd('!');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          marginLeft: 2
                        }}
                        title="Batal / Ganti"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}

                  <input 
                    ref={searchInputRef}
                    value={inputValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!activeBangEngine && val.startsWith('!')) {
                        const match = bangEngines.find(b => val.toLowerCase().startsWith(`${b.key.toLowerCase()} `));
                        if (match) {
                          const queryAfter = val.slice(match.key.length + 1);
                          setActiveBangEngine(match);
                          setInputValue(queryAfter);
                          setTimeout(() => {
                            if (searchInputRef.current) {
                              searchInputRef.current.focus();
                              searchInputRef.current.setSelectionRange(queryAfter.length, queryAfter.length);
                            }
                          }, 20);
                          return;
                        }
                      }
                      setInputValue(val);
                      setSearchSelectedIndex(0);
                    }}
                    placeholder={
                      activeBangEngine
                        ? `Ketik apa saja untuk cari di ${activeBangEngine.label.replace('Cari ', '')}...`
                        : isSlashActive 
                        ? "Ketik perintah (/buat-proyek, /tulis-artikel, /tambah-produk)..."
                        : isHashActive
                        ? "Filter modul (#proyek, #blog, #katalog, #transaksi, #memo)..."
                        : isAtActive
                        ? "Tanya AI atau panggil data (@ai, @keuangan, @catatan, @kontak)..."
                        : isBangActive
                        ? "Cari Internet (! google, ! duckduckgo, ! wiki)..."
                        : activeTab === 'ai-chat'
                        ? "Ketik pesan untuk AI..."
                        : "Ketik cari, '/' aksi, '#' modul, '@' AI, atau '!' web..."
                    }
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: 0,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      fontWeight: 600,
                      outline: 'none',
                      flex: 1
                    }}
                    className="global-ai-input"
                  />
                </div>

                {/* SINGLE UNIFIED SOLID BUTTON */}
                <button
                  type="button"
                  onClick={() => handleUnifiedSubmit()}
                  disabled={isTyping}
                  style={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    minHeight: 40,
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--cms-accent)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isTyping ? 'not-allowed' : 'pointer',
                    boxShadow: 'none',
                    transition: 'opacity 0.15s ease',
                    flexShrink: 0
                  }}
                  title="Kirim / Cari (Enter)"
                >
                  {isTyping ? (
                    <RefreshCw size={16} className="cms-spin" />
                  ) : (
                    <Send size={15} strokeWidth={2.4} style={{ transform: 'translateX(1px)' }} />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer Keyboard Hints (Desktop only, with clean padding) */}
          <div className="search-footer-hints" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--cms-text-muted)', fontWeight: 600, paddingTop: 4, paddingBottom: 2 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <span><kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--cms-switcher-bg)', border: '1px solid var(--cms-border, rgba(0,0,0,0.06))' }}>Enter</kbd> Pilih</span>
              <span><kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--cms-switcher-bg)', border: '1px solid var(--cms-border, rgba(0,0,0,0.06))' }}>!</kbd> Web</span>
              <span><kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--cms-switcher-bg)', border: '1px solid var(--cms-border, rgba(0,0,0,0.06))' }}>ESC</kbd> Tutup</span>
            </div>
            <div>Google Gemini AI & Internet</div>
          </div>
        </div>
      </div>

      <style>{`
        .global-search-overlay {
          z-index: 100000 !important;
        }
        .quick-prefix-chips {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
          display: flex !important;
          align-items: center !important;
          flex-wrap: nowrap !important;
          padding: 4px 6px 6px 6px !important;
        }
        .quick-prefix-chips button {
          flex-shrink: 0 !important;
          box-sizing: border-box !important;
        }
        .quick-prefix-chips::-webkit-scrollbar {
          display: none !important;
        }
        .global-search-modal {
          width: 100%;
          max-width: 720px;
          height: min(600px, 86vh);
          border-radius: 18px;
          background: var(--cms-card-bg, #ffffff) !important;
          border: 1px solid var(--cms-border, rgba(255, 255, 255, 0.12)) !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22) !important;
        }
        .close-modal-btn {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          min-height: 32px !important;
          max-width: 32px !important;
          max-height: 32px !important;
          flex-shrink: 0 !important;
          aspect-ratio: 1 / 1 !important;
          border-radius: 50% !important;
          box-sizing: border-box !important;
        }
        .close-modal-btn:hover { background: var(--cms-accent-soft) !important; color: var(--cms-accent) !important; }
        .quick-action-card:hover { border-color: var(--cms-accent) !important; background: var(--cms-switcher-bg) !important; }
        .global-ai-input:focus { border-color: var(--cms-accent) !important; }
        
        @media (max-width: 640px) {
          .global-search-overlay {
            padding: 0 !important;
            align-items: stretch !important;
            justify-content: stretch !important;
          }
          .global-search-modal {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 100000 !important;
          }
          .global-search-header {
            padding-top: max(12px, env(safe-area-inset-top, 12px)) !important;
            border-radius: 0 !important;
          }
          .global-search-bottom-station {
            /* 64px navbar + 16px bottom offset + 10px elevation above navbar = 90px */
            padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px)) !important;
            border-radius: 0 !important;
            background: var(--cms-card-bg, #ffffff) !important;
          }
          /* Filter Kategori: Hanya Icon Saja di Mobile (Rata 1 Baris Penuh) */
          .cat-pill-text {
            display: none !important;
          }
        .cat-filter-scroll {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          width: 100% !important;
          margin: 0 auto !important;
          gap: 6px !important;
        }
          .cat-pill-btn {
            flex: 1 !important;
            height: 40px !important;
            min-height: 40px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 8px !important;
          }
          .cat-pill-btn svg {
            width: 18px !important;
            height: 18px !important;
          }
          .hide-on-mobile { display: none !important; }
          .search-footer-hints { display: none !important; }
        }
      `}</style>
      {/* Hidden File Input for Direct Upload from Search */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*,video/*,.pdf,.zip" 
        onChange={handleDirectFileUpload} 
      />

      {/* Media Gallery Modal Integration */}
      {showMediaGalleryModal && (
        <MediaGalleryModal
          isOpen={showMediaGalleryModal}
          onClose={() => setShowMediaGalleryModal(false)}
          onSelect={(url) => {
            navigator.clipboard?.writeText(url);
            window.dispatchEvent(new CustomEvent('porto_notify', { 
              detail: { message: `URL Media disalin ke clipboard: ${url}`, type: 'success' } 
            }));
            setShowMediaGalleryModal(false);
          }}
        />
      )}
    </div>
  );
};

export default GlobalSearchCenter;
