import { useState, useEffect, useCallback } from 'react';
import { storage } from '../../utils/storage';
import { applyAccentColor } from '../../utils/theme';
import { setGlobalWebsiteTheme } from '../../hooks/useWebsiteTheme';

// ── Default Data Schema ────────────────────────────────────────────────────────
export const DEFAULT_MAIN_WEBSITE_DATA = {
  navbar: {
    items: [
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
    ],
    loginBtnLabel: 'Login',
    logoText: 'sumr.day',
  },
  hero: {
    greeting: "Hey there! ☀️ Welcome to",
    headline: "sumr.day",
    subheadline: 'Creative Digital Studio • Warm Tech & Skena-Aesthetic',
    description: 'Menghadirkan interaksi digital—mulai dari undangan web estetik, landing page modern, hingga aset visual kreatif—secara hangat, santai, dan penuh energi positif khas musim panas.',
    ctaPrimaryLabel: 'Jelajahi Showcase ✨',
    ctaPrimaryUrl: '#portfolio',
    ctaSecondaryLabel: 'Ngobrol Santai ☀️',
    ctaSecondaryUrl: '#contact',
    heroImage: null as string | null,
    cards: [
      { id: 'card-1', text: 'Warm Tech & Flow', icon: 'Sparkles' },
      { id: 'card-2', text: 'Skena-Aesthetic Vibes', icon: 'Heart' }
    ],
    // Deprecated legacy fields
    card1Text: 'Warm Tech & Flow',
    card1Icon: 'Sparkles',
    card2Text: 'Skena-Aesthetic Vibes',
    card2Icon: 'Heart',
    freelanceActive: true,
    badge: {
      active: true,
      smallText: 'CREATIVE COLLABS',
      largeText: 'Open for Projects ☀️',
    },
  },
  featuredLabels: ['Pilihan Editor', 'Karya Terbaik', 'Top 10'] as string[],
  projectCategories: [] as string[],
  landingFeaturedLabel: 'Pilihan Editor' as string,
  profile: {
    bio: 'Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic yang menghadirkan interaksi digital secara hangat, santai, dan penuh energi positif khas musim panas.',
    fullBio: 'Kami adalah sumr.day — Creative Digital Studio yang memadukan teknologi modern dengan estetika visual segar khas anak muda. A little sunshine for your screen.',
    image: null as string | null,
    skills: [
      { id: 'sk-1', name: 'Web Interaction', description: 'Undangan web estetik, landing page interaktif & website modern.', icon: 'Globe' },
      { id: 'sk-2', name: 'UI/UX & Prototyping', description: 'Desain antarmuka berkonsep Warm Tech dengan micro-interactions mulus.', icon: 'Figma' },
      { id: 'sk-3', name: 'Visual Branding', description: 'Identitas brand, typography skena, dan visual aset berkarakter.', icon: 'PenTool' },
      { id: 'sk-4', name: 'Interactive Games', description: 'Game interaktif ringan untuk aktivasi event dan engagement brand.', icon: 'Sparkles' },
      { id: 'sk-5', name: 'AI & Smart Tech', description: 'Pemanfaatan AI kreatif untuk alur kerja yang lebih cepat dan efisien.', icon: 'Cpu' },
    ],
  },
  aboutSettings: {
    mode: 'personal' as 'personal' | 'company',
    company: {
      name: 'sumr.day',
      tagline: 'A little sunshine for your screen | Creative Digital Studio',
      badge: 'RUANG CERITA & STUDIO',
      description: 'sumr.day adalah Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic. Kami percaya bahwa interaksi digital tidak harus terasa dingin atau kaku. Lewat sentuhan hangat, kami menghadirkan undangan web, landing page, dan aset visual yang membahagiakan.',
      foundedYear: '2024',
      headquarters: 'Indonesia (Remote & Creative Hub)',
      teamSize: 'Kolektif Kreatif',
      website: 'https://sumrday.web.app',
      email: 'hi.sumrday@gmail.com',
      phone: '+62 812-3456-7890',
      vision: 'Membawa keceriaan, kehangatan visual, dan estetika segar ke dalam setiap interaksi layar digital.',
      mission: [
        'Meracik undangan web dan landing page dengan estetika skena yang rapi, segar, dan ramah pengguna.',
        'Memadukan teknologi interaktif modern (Warm Tech) dengan sentuhan rasa yang hangat dan berjiwa muda.',
        'Menjadi ruang kolaborasi kreatif yang asyik, santai, transparan, dan membahagiakan.'
      ],
      coreValues: [
        { id: 'v1', title: 'Sunshine Energy', description: 'Menebarkan energi positif, keceriaan, dan antusiasme di setiap proyek.', icon: 'Sparkles' },
        { id: 'v2', title: 'Warm Tech', description: 'Teknologi modern yang ramah, intuitif, dan tidak kaku.', icon: 'Cpu' },
        { id: 'v3', title: 'Skena-Aesthetic', description: 'Eksplorasi visual trendi, clean, dan penuh karakter generasi masa kini.', icon: 'Palette' },
        { id: 'v4', title: 'Chill Collab', description: 'Komunikasi santai, transparan, dan eksekusi tepat waktu.', icon: 'Zap' }
      ],
      stats: [
        { id: 's1', label: 'Karya Terbit', value: '100+' },
        { id: 's2', label: 'Klien Puas', value: '99%' },
        { id: 's3', label: 'Energi Positif', value: '100%' },
        { id: 's4', label: 'Tahun Eksplorasi', value: '3+' }
      ],
      teamMembers: [
        { id: 'tm1', name: 'Arif Wicaksono', role: 'Creative Director & Founder', photo: '', bio: 'Memimpin visi kreatif, visual identity, dan arsitektur Warm Tech sumr.day.' },
        { id: 'tm2', name: 'Nadia Salsabila', role: 'UI/UX & Interaction Designer', photo: '', bio: 'Meracik micro-interactions manis dan antarmuka ramah pengguna.' },
        { id: 'tm3', name: 'Dimas Pratama', role: 'Web & Systems Craftsman', photo: '', bio: 'Mengembangkan pengalaman web yang gesit, mulus, dan responsif.' }
      ],
      milestones: [
        { id: 'm1', year: '2024', title: 'Lahirnya sumr.day', description: 'Memulai perjalanan sebagai studio kreatif yang membawa kehangatan dan keceriaan visual digital.' },
        { id: 'm2', year: '2025', title: 'Ekspansi Warm Tech Suite', description: 'Merilis studio undangan web interaktif, game aktivasi booth, dan modul CMS mandiri.' },
        { id: 'm3', year: '2026', title: 'Kolektif Kreatif & Kolaborator', description: 'Berkolaborasi dengan puluhan brand, kreator konten, dan pasangan bahagia di seluruh Indonesia.' }
      ],
      clients: [
        { id: 'c1', name: 'TechIndo Global' },
        { id: 'c2', name: 'Kopi Nusantara' },
        { id: 'c3', name: 'Nusantara Logistics' },
        { id: 'c4', name: 'Studio Kreatif ID' }
      ]
    }
  },
  process: [
    { id: 'proc-1', title: 'Catch The Sun', description: 'Menyelami ide, vibe, dan ekspektasimu secara santai dan mendalam.', icon: 'Search' },
    { id: 'proc-2', title: 'Brew The Vibe', description: 'Merancang moodboard, konsep visual skena, dan wireframe yang pas di hati.', icon: 'Lightbulb' },
    { id: 'proc-3', title: 'Craft The Magic', description: 'Mengeksekusi desain estetik dan teknologi interaktif (Warm Tech) yang mulus.', icon: 'PenTool' },
    { id: 'proc-4', title: 'Shine Online', description: 'Peluncuran karya digitalmu dengan energi positif dan dukungan penuh.', icon: 'Code' },
  ],
  testimonials: [
    { id: 'test-1', quote: 'Kolaborasi bareng sumr.day asyik banget! Undangan web kami dapet banyak pujian karena estetik dan warm.', author: 'Budi & Cindy', role: 'Wedding Couple', avatar: '' },
    { id: 'test-2', quote: 'Landing page produk kami jadi berkarakter dan hidup. Vibe musim panasnya beneran kerasa fresh.', author: 'Siti Aminah', role: 'Brand Owner, KopiNusantara', avatar: '' },
    { id: 'test-3', quote: 'Komunikasi santai tanpa ribet, hasil akhirnya rapi dan tepat waktu. Recommended studio!', author: 'Andi Wijaya', role: 'Founder, Skena Studio', avatar: '' },
  ],
  theme: {
    accentColor: (() => {
      try {
        return localStorage.getItem('porto_accent_color') || '#f59e0b';
      } catch (e) {
        return '#f59e0b';
      }
    })(),
    defaultMode: 'light' as 'light' | 'dark',
  },
  seo: {
    metaTitle: 'sumr.day | Creative Digital Studio',
    metaDescription: 'A little sunshine for your screen ☀️ Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic untuk undangan web, landing page, dan aset visual impianmu.',
    ogImage: null as string | null,
  },
  footer: {
    description: 'A little sunshine for your screen ☀️ Studio kreatif digital berkonsep Warm Tech & Skena-Aesthetic. Siap mengubah idemu menjadi karya digital yang hangat dan menyenangkan.',
    copyright: '© 2026 sumr.day | Creative Digital Studio. Crafted with warm vibes.',
    email: 'hi.sumrday@gmail.com',
    location: 'Indonesia / Remote Worldwide',
    socialLinks: [
      { id: 'soc-1', platform: 'Instagram', url: 'https://instagram.com/sumrday.studio', icon: 'Camera' },
      { id: 'soc-2', platform: 'Email', url: 'mailto:hi.sumrday@gmail.com', icon: 'Mail' }
    ],
    contactProjectTypes: ['Undangan Web Estetik', 'Landing Page & Website', 'Visual Identity & Branding', 'Game Interaktif & Event', 'Aset Konten Digital'] as string[],
    contactMethods: [
      { id: 'email',    label: 'Email',     icon: '📧', value: 'hi.sumrday@gmail.com', enabled: true  },
      { id: 'whatsapp', label: 'WhatsApp', icon: '💬', value: '',                     enabled: false },
      { id: 'telegram', label: 'Telegram', icon: '✈️', value: '',                     enabled: false },
    ] as { id: string; label: string; icon: string; value: string; enabled: boolean }[],
  },
  blogPreview: {
    enabled: true,
    title: 'Catatan & Wawasan',
    subtitle: 'Cerita di balik layar, eksplorasi desain, dan inspirasi hangat.',
    maxPosts: 3,
    ctaLabel: 'Jelajahi Catatan ☀️',
  },
  updatesFeed: {
    enabled: true,
    badge: 'UTAS & CERITA HANGAT',
    title: 'Jurnal Kreatif & Update Proyek',
    subtitle: 'Catatan progres, kilas balik karya, dan cerita seru dari balik layar sumr.day.',
    maxDisplay: 5,
    showSocialStats: true,
  },
  sync: {
    lastSyncAt: null as string | null,
    status: 'local' as 'local' | 'synced' | 'syncing' | 'error',
  },
  pagesHeader: {
    blog: {
      badge: 'Jurnal & Tulisan',
      title: 'Ide, Wawasan & Catatan Hangat',
      highlight: 'Catatan Hangat',
      description: 'Koleksi tulisan seputar desain web, interaksi digital, estetika skena, dan inovasi kreatif.'
    },
    portfolio: {
      badge: 'Karya & Showcase',
      title: 'Koleksi Kreasi Penuh Cahaya',
      highlight: 'Penuh Cahaya',
      description: 'Eksplorasi undangan digital, landing page interaktif, serta identitas visual berkonsep Warm Tech.'
    },
    catalog: {
      badge: 'Menu Layanan & Produk',
      title: 'Solusi Digital yang Menyenangkan',
      highlight: 'Menyenangkan',
      description: 'Pilihan paket desain, template siap pakai, dan interaksi web dengan harga bersahabat.'
    },
    about: {
      badge: 'Tentang sumr.day',
      title: 'Energi Musim Panas di Setiap Layar',
      highlight: 'Musim Panas',
      description: 'Kenali lebih dekat filosofi Warm Tech, nilai-nilai studio, dan tim di balik sumr.day.'
    },
    links: {
      badge: 'Hub & Media Sosial',
      title: 'Tautan Resmi sumr.day',
      highlight: 'sumr.day',
      description: 'Temukan saluran komunikasi, portofolio, dan media sosial resmi untuk berkolaborasi.'
    },
    games: {
      badge: 'Interactive Fun & Activation',
      title: 'Game Interaktif & Keseruan',
      highlight: 'Aktivasi Event Anda',
      description: 'Tingkatkan keceriaan pengunjung di event, booth, dan festival dengan game berbasis HTML5 bernuansa fresh.'
    },
    pricing: {
      badge: 'Investasi Kreatif',
      title: 'Paket Transparan untuk',
      highlight: 'Hasil Maksimal',
      description: 'Pilihan paket fleksibel dan bersahabat untuk mewujudkan proyek digital impianmu.'
    }
  },
  localization: {
    portfolioSectionTitle: '— KARYA & SHOWCASE',
    portfolioMainTitle: 'Kreasi Penuh Cahaya',
    portfolioSeeAll: 'Lihat Semua Karya ✨',
    aboutSectionTitle: '— TENTANG KAMI',
    aboutMainTitle: 'Cerita di Balik sumr.day ☀️',
    processSectionTitle: '— PROSES KREATIF',
    processMainTitle: 'Bagaimana Kami Bekerja',
    testimonialSectionTitle: '— TEMAN BERBAGI CERITA',
    testimonialMainTitle: 'Cerita Hangat Bersama sumr.day',
    pricingSectionTitle: '— INVESTASI',
    pricingMainTitle: 'Simpel, Santai & Transparan',
    customProjectSectionTitle: '— MULAI KOLABORASI',
    customProjectMainTitle: 'Mari Bikin Layarmu Lebih Berwarna ☀️',
    customProjectSubtitle: 'Punya ide undangan web, landing page estetik, atau aset visual impian? Yuk ngobrol santai bareng tim sumr.day!',
    customProjectCta: 'Ngobrol Santai ☀️',
    footerReadyText: 'Siap menghadirkan sinar baru di proyek digitalmu?',
    footerStartProject: 'Mulai Kolaborasi ☀️',
    footerLinksTitle: 'Tautan'
  },
  pagesVisibility: {
    home: true,
    portfolio: true,
    about: true,
    catalog: true,
    pricing: true,
    games: true,
    blog: true,
    updates: true,
    links: true,
  } as Record<string, boolean>,
  customPages: [] as any[]
};

export type MainWebsiteData = typeof DEFAULT_MAIN_WEBSITE_DATA;

export interface ProjectData {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  featuredLabel?: string;
  status?: string;
  coverImage?: string;
  images?: string[];
  attachments?: { url: string; name: string; type: string }[];
  tags?: string[];
  client?: string;
  year?: string | number;
  createdAt?: string | number;
}

export const DEFAULT_PORTFOLIO_PROJECTS: ProjectData[] = [
  {
    id: 'proj-1',
    name: 'Brand Identity & Visual System',
    title: 'Brand Identity & Visual System',
    category: 'Branding',
    featuredLabel: 'Pilihan Editor',
    description: 'Perancangan identitas visual merek lengkap, panduan logo, palet warna, dan aset pemasaran digital modern.',
    coverImage: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80',
    tags: ['Branding', 'Logo Guide', 'Design System'],
    year: '2026'
  },
  {
    id: 'proj-2',
    name: 'Mobile App Experience & UI/UX',
    title: 'Mobile App Experience & UI/UX',
    category: 'UI/UX Design',
    featuredLabel: 'Karya Terbaik',
    description: 'Desain antarmuka aplikasi seluler dengan riset pengguna mendalam, micro-interaction halus, dan prototipe interaktif.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    tags: ['UI/UX', 'Mobile App', 'Figma'],
    year: '2026'
  },
  {
    id: 'proj-3',
    name: 'Creative Packaging & Merchandise',
    title: 'Creative Packaging & Merchandise',
    category: 'Print/Packaging',
    featuredLabel: 'Top 10',
    description: 'Eksplorasi kemasan produk ramah lingkungan dan merchandise eksklusif dengan tipografi berkarakter.',
    coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    tags: ['Packaging', 'Print', 'Branding'],
    year: '2026'
  }
];

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useLandingData = () => {
  const [data, setData] = useState<MainWebsiteData>(() => {
    try {
      const cached = localStorage.getItem('porto_main_website');
      const savedAccent = localStorage.getItem('porto_accent_color');
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

  const [projects, setProjects] = useState<ProjectData[]>(() => {
    try {
      const cached = localStorage.getItem('porto_portfolio');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [savedData, savedProjects, globalSettings] = await Promise.all([
        storage.getItem('porto_main_website', null),
        storage.getItem('porto_portfolio', []),
        storage.getItem('porto_settings', {}),
      ]);

      let merged = DEFAULT_MAIN_WEBSITE_DATA;
      if (savedData) {
        merged = deepMerge(DEFAULT_MAIN_WEBSITE_DATA, savedData);
      }

      // Deduplicate navbar items
      if (merged?.navbar?.items && Array.isArray(merged.navbar.items)) {
        const seen = new Set<string>();
        merged.navbar.items = merged.navbar.items.filter((item: any) => {
          const normLabel = (item.label || '').trim().toLowerCase();
          const normUrl = (item.url || '').trim().toLowerCase();
          const key = `${normLabel}::${normUrl}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      // Prioritize saved accent color from localStorage / cloud
      const finalAccent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || savedData?.theme?.accentColor || globalSettings?.accentColor || '#64748b';
      merged.theme.accentColor = finalAccent;
      try {
        localStorage.setItem('porto_accent_color', finalAccent);
        applyAccentColor(finalAccent);
      } catch (_) {}

      // Only apply default mode to DOM if client has NOT expressed a manual preference
      const clientOverride = typeof localStorage !== 'undefined' ? localStorage.getItem('website_theme_override') : null;
      if (!clientOverride && savedData?.theme?.defaultMode && typeof document !== 'undefined') {
        const defaultDark = savedData.theme.defaultMode === 'dark';
        if (!document.documentElement.getAttribute('data-theme')) {
          document.documentElement.setAttribute('data-theme', defaultDark ? 'dark' : 'light');
        }
      }

      setData(merged);
      if (Array.isArray(savedProjects)) {
        setProjects(savedProjects);
      } else {
        setProjects([]);
      }

    } catch (err) {
      console.error('[useLandingData] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const handleStorageChange = (e?: any) => {
      const accent = e?.detail?.color || localStorage.getItem('porto_accent_color');
      if (accent) {
        applyAccentColor(accent);
        setData(prev => {
          if (prev.theme?.accentColor === accent) return prev;
          return {
            ...prev,
            theme: {
              ...prev.theme,
              accentColor: accent
            }
          };
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('porto_accent_color_changed', handleStorageChange);

    const unsubData = storage.listenItem('porto_main_website', (d: MainWebsiteData) => {
      if (d) {
        const accent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || d.theme?.accentColor;
        if (accent) {
          applyAccentColor(accent);
          try { localStorage.setItem('porto_accent_color', accent); } catch (_) {}
        }
        const clientOverride = typeof localStorage !== 'undefined' ? localStorage.getItem('website_theme_override') : null;
        if (!clientOverride && d.theme?.defaultMode && typeof document !== 'undefined') {
          const defaultDark = d.theme.defaultMode === 'dark';
          document.documentElement.setAttribute('data-theme', defaultDark ? 'dark' : 'light');
        }
        setData((prev) => {
          const merged = deepMerge(prev, d);
          if (merged?.navbar?.items && Array.isArray(merged.navbar.items)) {
            const seen = new Set<string>();
            merged.navbar.items = merged.navbar.items.filter((item: any) => {
              const key = `${(item.label || '').trim().toLowerCase()}::${(item.url || '').trim().toLowerCase()}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          }
          if (accent) {
            merged.theme.accentColor = accent;
          }
          return merged;
        });

      }
    }, null);

    const unsubSettings = storage.listenItem('porto_settings', (s: any) => {
      const activeAccent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || s?.accentColor;
      if (activeAccent) {
        applyAccentColor(activeAccent);
        setData((prev) => {
          if (prev.theme?.accentColor === activeAccent) return prev;
          return {
            ...prev,
            theme: {
              ...prev.theme,
              accentColor: activeAccent
            }
          };
        });
      }
    }, {});

    const unsubProjects = storage.listenItem('porto_portfolio', (p: ProjectData[]) => {
      if (Array.isArray(p)) setProjects(p);
    }, []);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('porto_accent_color_changed', handleStorageChange);
      if (typeof unsubData === 'function') unsubData();
      if (typeof unsubSettings === 'function') unsubSettings();
      if (typeof unsubProjects === 'function') unsubProjects();
    };
  }, [load]);

  return { data, projects, isLoading };
};

// ── Deep Merge Helper ─────────────────────────────────────────────────────────
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      (result as any)[key] = deepMerge((target as any)[key], (source as any)[key]);
    } else if (source[key] !== undefined) {
      // MIGRATION: Convert old string[] skills into object[]
      if (key === 'skills' && Array.isArray(source[key]) && source[key].length > 0 && typeof source[key][0] === 'string') {
        (result as any)[key] = source[key].map((s: string, idx: number) => ({
          id: `sk-migrated-${idx}`,
          name: s,
          description: 'Deskripsi untuk layanan ini belum ditambahkan.',
          icon: 'Star'
        }));
      } else {
        (result as any)[key] = source[key];
      }
    }
  }
  return result;
}
