import { useState, useEffect, useCallback } from 'react';
import { storage } from '../../utils/storage';
import { applyAccentColor } from '../../utils/theme';
import { setGlobalWebsiteTheme } from '../../hooks/useWebsiteTheme';

// ── Beranda Widgets Order & Visibility Config ─────────────────────────────────
export interface BerandaSectionConfig {
  id: string;
  label: string;
  enabled: boolean;
}

export const DEFAULT_COMPANY_SECTIONS: BerandaSectionConfig[] = [
  { id: 'hero', label: 'Hero Section', enabled: true },
  { id: 'clients', label: 'Mitra & Klien', enabled: true },
  { id: 'updates', label: 'Pembaruan Studio', enabled: true },
  { id: 'store', label: 'Produk & Aset Digital', enabled: true },
  { id: 'ratecard', label: 'Paket & Rate Card', enabled: true },
  { id: 'estimator', label: 'Estimator Biaya Proyek', enabled: false },
  { id: 'solutions', label: 'Kapabilitas & Layanan', enabled: true },
  { id: 'portfolio', label: 'Karya Pilihan', enabled: true },
  { id: 'beforeafter', label: 'Transformasi Sebelum & Sesudah', enabled: true },
  { id: 'model3d', label: 'Showcase 3D Interaktif', enabled: true },
  { id: 'flipbook', label: 'Lookbook & Flipbook Interaktif', enabled: true },
  { id: 'process', label: 'Alur Pengerjaan', enabled: true },
  { id: 'testimonials', label: 'Ulasan Klien', enabled: true },
  { id: 'blog', label: 'Artikel & Catatan', enabled: true },
  { id: 'faq', label: 'Pertanyaan Umum (FAQ)', enabled: true },
];

export const DEFAULT_PERSONAL_SECTIONS: BerandaSectionConfig[] = [
  { id: 'hero', label: 'Hero Section', enabled: true },
  { id: 'store', label: 'Produk & Aset Digital', enabled: true },
  { id: 'ratecard', label: 'Paket & Rate Card', enabled: true },
  { id: 'estimator', label: 'Estimator Biaya Proyek', enabled: false },
  { id: 'portfolio', label: 'Karya Pilihan', enabled: true },
  { id: 'beforeafter', label: 'Transformasi Sebelum & Sesudah', enabled: true },
  { id: 'model3d', label: 'Showcase 3D Interaktif', enabled: true },
  { id: 'flipbook', label: 'Lookbook & Flipbook Interaktif', enabled: true },
  { id: 'about', label: 'Tentang Saya', enabled: true },
  { id: 'process', label: 'Alur Pengerjaan', enabled: true },
  { id: 'testimonials', label: 'Ulasan Klien', enabled: true },
  { id: 'blog', label: 'Artikel & Catatan', enabled: true },
  { id: 'faq', label: 'Pertanyaan Umum (FAQ)', enabled: true },
];

export const getEffectiveCompanySections = (
  sections?: BerandaSectionConfig[],
  deletedIds?: string[]
): BerandaSectionConfig[] => {
  const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds : []);
  if (!Array.isArray(sections) || (sections.length === 0 && deletedSet.size === 0)) {
    return DEFAULT_COMPANY_SECTIONS.filter(ds => !deletedSet.has(ds.id));
  }
  let result = [...sections];
  const existingIds = new Set(result.map(s => s.id));
  const missing = DEFAULT_COMPANY_SECTIONS.filter(ds => !existingIds.has(ds.id) && !deletedSet.has(ds.id));

  const portfolioIdx = result.findIndex(s => s.id === 'portfolio');
  const model3dItem = missing.find(m => m.id === 'model3d');
  const flipbookItem = missing.find(m => m.id === 'flipbook');
  const otherMissing = missing.filter(m => m.id !== 'model3d' && m.id !== 'flipbook');

  if (model3dItem) {
    const itemToAdd = { ...model3dItem, enabled: true };
    if (portfolioIdx !== -1) {
      result.splice(portfolioIdx + 1, 0, itemToAdd);
    } else {
      result.push(itemToAdd);
    }
  }

  if (flipbookItem) {
    const itemToAdd = { ...flipbookItem, enabled: true };
    const m3dIdx = result.findIndex(s => s.id === 'model3d');
    if (m3dIdx !== -1) {
      result.splice(m3dIdx + 1, 0, itemToAdd);
    } else if (portfolioIdx !== -1) {
      result.splice(portfolioIdx + 1, 0, itemToAdd);
    } else {
      result.push(itemToAdd);
    }
  }

  result = [...result, ...otherMissing];

  return result;
};

export const getEffectivePersonalSections = (
  sections?: BerandaSectionConfig[],
  deletedIds?: string[]
): BerandaSectionConfig[] => {
  const deletedSet = new Set(Array.isArray(deletedIds) ? deletedIds : []);
  if (!Array.isArray(sections) || (sections.length === 0 && deletedSet.size === 0)) {
    return DEFAULT_PERSONAL_SECTIONS.filter(ds => !deletedSet.has(ds.id));
  }
  let result = [...sections];
  const existingIds = new Set(result.map(s => s.id));
  const missing = DEFAULT_PERSONAL_SECTIONS.filter(ds => !existingIds.has(ds.id) && !deletedSet.has(ds.id));

  const portfolioIdx = result.findIndex(s => s.id === 'portfolio');
  const model3dItem = missing.find(m => m.id === 'model3d');
  const flipbookItem = missing.find(m => m.id === 'flipbook');
  const otherMissing = missing.filter(m => m.id !== 'model3d' && m.id !== 'flipbook');

  if (model3dItem) {
    const itemToAdd = { ...model3dItem, enabled: true };
    if (portfolioIdx !== -1) {
      result.splice(portfolioIdx + 1, 0, itemToAdd);
    } else {
      result.push(itemToAdd);
    }
  }

  if (flipbookItem) {
    const itemToAdd = { ...flipbookItem, enabled: true };
    const m3dIdx = result.findIndex(s => s.id === 'model3d');
    if (m3dIdx !== -1) {
      result.splice(m3dIdx + 1, 0, itemToAdd);
    } else if (portfolioIdx !== -1) {
      result.splice(portfolioIdx + 1, 0, itemToAdd);
    } else {
      result.push(itemToAdd);
    }
  }

  result = [...result, ...otherMissing];

  return result;
};

export interface ScrollRadarSettings {
  enabled: boolean;
  showPercentage: boolean;
  showTopBottomButtons: boolean;
  showSectionLabel: boolean;
  trackHeight: number;
  pillWidth: number;
  position: 'right' | 'left';
}

export const DEFAULT_SCROLL_RADAR_SETTINGS: ScrollRadarSettings = {
  enabled: true,
  showPercentage: true,
  showTopBottomButtons: true,
  showSectionLabel: true,
  trackHeight: 240,
  pillWidth: 26,
  position: 'right',
};

// ── Default Data Schema ────────────────────────────────────────────────────────
export const DEFAULT_MAIN_WEBSITE_DATA = {
  scrollRadar: DEFAULT_SCROLL_RADAR_SETTINGS,
  siteMode: 'company' as 'company' | 'personal',
  companySections: DEFAULT_COMPANY_SECTIONS,
  personalSections: DEFAULT_PERSONAL_SECTIONS,
  navbar: {
    items: [
      { id: 'nav-home', type: 'link', label: 'Beranda', url: '/' },
      { id: 'nav-portfolio', type: 'link', label: 'Karya', url: '/portfolio' },
      { id: 'nav-about', type: 'link', label: 'Tentang', url: '/about' },
      { id: 'nav-catalog', type: 'link', label: 'Katalog', url: '/katalog' },
      { id: 'nav-pricing', type: 'link', label: 'Paket', url: '/pricing' },
      { id: 'nav-games', type: 'link', label: 'Interactive', url: '/games' },
      { id: 'nav-blog', type: 'link', label: 'Jurnal', url: '/blog' },
      { id: 'nav-updates', type: 'link', label: 'Pembaruan', url: '/updates' },
      { id: 'nav-links', type: 'link', label: 'Tautan', url: '/links' },
      { id: 'nav-contact', type: 'link', label: 'Kontak', url: '#contact' },
    ],
    loginBtnLabel: 'Masuk',
    logoText: 'sumr.day',
    logoImage: '/logo.png' as string | null,
  },
  companyHero: {
    badge: 'STUDIO KREATIF & DIGITAL',
    headline: 'sumr.day Studio',
    subheadline: 'Studio Desain & Pengembangan Produk Digital Modern',
    description: 'Kami merancang dan mempublikasikan aset digital berkualitas tinggi, produk web interaktif, serta artikel wawasan terkurasi untuk mengakselerasi karya dan bisnis Anda.',
    ctaPrimaryLabel: 'Jelajahi Pembaruan',
    ctaPrimaryUrl: '#updates-hub',
    ctaSecondaryLabel: 'Katalog Aset',
    ctaSecondaryUrl: '/katalog',
    heroImage: null as string | null,
    stats: [
      { id: 'st-1', label: 'Proyek Selesai', value: '120+' },
      { id: 'st-2', label: 'Klien & Mitra', value: '50+' },
      { id: 'st-3', label: 'Tingkat Kepuasan', value: '99.4%' },
      { id: 'st-4', label: 'Siklus Rilis', value: 'Mingguan' }
    ]
  },
  hero: {
    greeting: "Halo dari",
    headline: "sumr.day",
    subheadline: 'A Little Sunshine for Your Screen',
    description: 'Menghadirkan interaksi digital—mulai dari undangan web estetik, landing page modern, hingga aset visual kreatif—secara hangat, terukur, dan profesional.',
    ctaPrimaryLabel: 'Lihat Karya',
    ctaPrimaryUrl: '#portfolio',
    ctaSecondaryLabel: 'Sapa Kami',
    ctaSecondaryUrl: '#contact',
    heroImage: null as string | null,
    cards: [
      { id: 'card-1', text: 'Arsitektur Modern', icon: 'Code' },
      { id: 'card-2', text: 'Desain Terarah', icon: 'Layers' }
    ],
    // Deprecated legacy fields
    card1Text: 'Arsitektur Modern',
    card1Icon: 'Code',
    card2Text: 'Desain Terarah',
    card2Icon: 'Layers',
    freelanceActive: true,
    badge: {
      active: true,
      smallText: 'STUDIO KREATIF',
      largeText: 'Buka Proyek',
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
  model3dSettings: {
    badge: 'SPATIAL & 3D SHOWCASE',
    title: 'Eksplorasi Desain 3D Interaktif',
    subtitle: 'Putar secara bebas 360°, amati pencahayaan material fotorealistik, dan rasakan kedalaman objek nyata langsung di browser Anda.',
    modelUrl: '/models/armchair.glb',
    height: '520px',
    autoRotate: true
  },
  flipbookSettings: {
    badge: 'EDITORIAL & LOOKBOOK',
    title: 'Katalog & Brand Guidelines Interaktif',
    subtitle: 'Buka dan rasakan pengalaman membaca dokumen panduan visual, rate card, dan studi kasus studio layaknya membuka majalah fisik.',
    pdfUrl: '',
    totalPages: 8,
    bookTitle: 'sumr.day Visual Guideline Book 2026',
    height: '620px',
    defaultViewMode: 'double' as 'double' | 'single',
    allowDownload: true
  },
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
    metaDescription: 'A little sunshine for your screen — Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic untuk undangan web, landing page, dan aset visual impianmu.',
    ogImage: null as string | null,
  },
  footer: {
    description: 'A little sunshine for your screen — Studio kreatif digital berkonsep Warm Tech & Skena-Aesthetic. Siap mengubah idemu menjadi karya digital yang hangat dan menyenangkan.',
    copyright: '© 2026 sumr.day | Creative Digital Studio. Crafted with warm vibes.',
    email: 'hi.sumrday@gmail.com',
    location: 'Indonesia / Remote Worldwide',
    socialLinks: [
      { id: 'soc-1', platform: 'Instagram', url: 'https://instagram.com/sumrday.studio', icon: 'Camera' },
      { id: 'soc-2', platform: 'Email', url: 'mailto:hi.sumrday@gmail.com', icon: 'Mail' }
    ],
    contactProjectTypes: ['Undangan Web Estetik', 'Landing Page & Website', 'Visual Identity & Branding', 'Game Interaktif & Event', 'Aset Konten Digital'] as string[],
    contactMethods: [
      { id: 'email',    label: 'Email',     icon: 'email',    value: 'hi.sumrday@gmail.com', enabled: true  },
      { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', value: '',                     enabled: false },
      { id: 'telegram', label: 'Telegram', icon: 'telegram', value: '',                     enabled: false },
    ] as { id: string; label: string; icon: string; value: string; enabled: boolean }[],
  },
  blogPreview: {
    enabled: true,
    title: 'Catatan & Wawasan',
    subtitle: 'Cerita di balik layar, eksplorasi desain, dan inspirasi hangat.',
    maxPosts: 3,
    ctaLabel: 'Jelajahi Catatan',
  },
  storeSpotlight: {
    badge: 'KOLEKSI ASET DIGITAL',
    title: 'Produk & Template Digital',
    subtitle: 'Koleksi template web, identitas visual, dan aset grafis terkurasi untuk mempercepat peluncuran proyek Anda.',
    maxItems: 3,
    selectedProductIds: [] as string[],
  },
  companyUpdates: {
    badge: 'RILIS & UPDATE TERBARU',
    title: 'Sorotan Rilis & Aktivitas Studio',
    subtitle: 'Pembaruan terpilih seputar rilis aset baru, produk digital, dan wawasan terkini dari studio.',
    selectedUpdateId: '',
  },
  rateCardSpotlight: {
    badge: 'PAKET & RATE CARD PILIHAN',
    title: 'Investasi Terukur untuk Eksekusi Maksimal',
    subtitle: 'Pilihan paket desain, website interaktif, dan sistem kustom dengan deliverables transparan, opsi DP 50%, serta jaminan kualitas profesional.',
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
      badge: 'Jurnal & Publikasi',
      title: 'Ide, Wawasan & Catatan Proyek',
      highlight: 'Catatan Proyek',
      description: 'Koleksi tulisan seputar desain antarmuka, interaksi digital, arsitektur web, dan inovasi visual.'
    },
    portfolio: {
      badge: 'Karya & Showcase',
      title: 'Koleksi Karya & Studi Kasus',
      highlight: 'Studi Kasus',
      description: 'Eksplorasi undangan digital, landing page interaktif, serta identitas visual berkualitas tinggi.'
    },
    catalog: {
      badge: 'Katalog & Produk Digital',
      title: 'Solusi Desain & Produk Digital Siap Pakai',
      highlight: 'Siap Pakai',
      description: 'Koleksi template web, aset visual, dan paket layanan desain terkurasi untuk mempercepat proyek Anda.'
    },
    about: {
      badge: 'Tentang Studio',
      title: 'Membangun Interaksi Digital Berkarakter',
      highlight: 'Berkarakter',
      description: 'Kenali lebih dekat filosofi perancangan, prinsip kerja, dan pendekatan desain di balik sumr.day.'
    },
    links: {
      badge: 'Hub & Media Sosial',
      title: 'Tautan Resmi sumr.day',
      highlight: 'sumr.day',
      description: 'Temukan saluran komunikasi, portofolio, dan media sosial resmi untuk berkolaborasi.'
    },
    games: {
      badge: 'Interactive & Engagement',
      title: 'Game Interaktif untuk',
      highlight: 'Aktivasi Event Anda',
      description: 'Tingkatkan keterlibatan pengunjung di booth, expo, dan festival dengan game berbasis web interaktif.'
    },
    pricing: {
      badge: 'Investasi Terukur',
      title: 'Paket Transparan untuk',
      highlight: 'Hasil Maksimal',
      description: 'Pilihan paket fleksibel dengan deliverables transparan untuk mendukung pertumbuhan brand dan bisnis Anda.'
    }
  },
  localization: {
    portfolioSectionTitle: '— KARYA & SHOWCASE',
    portfolioMainTitle: 'Karya Pilihan & Eksplorasi Visual',
    portfolioSeeAll: 'Lihat Semua Karya',
    aboutSectionTitle: '— TENTANG KAMI',
    aboutMainTitle: 'Cerita di Balik sumr.day',
    processSectionTitle: '— PROSES KREATIF',
    processMainTitle: 'Bagaimana Kami Bekerja',
    testimonialSectionTitle: '— TEMAN BERBAGI CERITA',
    testimonialMainTitle: 'Cerita Hangat Bersama sumr.day',
    pricingSectionTitle: '— INVESTASI',
    pricingMainTitle: 'Simpel, Santai & Transparan',
    customProjectSectionTitle: '— MULAI KOLABORASI',
    customProjectMainTitle: 'Mari Bikin Layarmu Lebih Berwarna',
    customProjectSubtitle: 'Punya ide undangan web, landing page estetik, atau aset visual impian? Yuk ngobrol santai bareng tim sumr.day!',
    customProjectCta: 'Ngobrol Santai',
    footerReadyText: 'Siap menghadirkan sinar baru di proyek digitalmu?',
    footerStartProject: 'Mulai Kolaborasi',
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
  tools?: string[];
  software?: string[];
  client?: string;
  year?: string | number;
  mediaType?: 'image' | 'video' | 'youtube' | '3d' | 'flipbook';
  model3dUrl?: string;
  pdfUrl?: string;
  pdfTotalPages?: number;
  createdAt?: string | number;
}

export const DEFAULT_PORTFOLIO_PROJECTS: ProjectData[] = [
  {
    id: 'proj-flipbook-1',
    name: 'sumr.day Studio Lookbook & Brand Guide 2026',
    title: 'sumr.day Studio Lookbook & Brand Guide 2026',
    category: 'Editorial & Brand Book',
    featuredLabel: 'Flipbook Interaktif',
    description: 'Buku panduan identitas visual dan arsip eksplorasi desain studio sumr.day. Disajikan dalam format flipbook digital interaktif layaknya membaca majalah fisik.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    tags: ['Brand Guidelines', 'Editorial', 'Flipbook', 'Lookbook'],
    mediaType: 'flipbook',
    pdfUrl: '',
    pdfTotalPages: 8,
    tools: ['Figma', 'InDesign', 'Cloudinary PDF Engine'],
    year: '2026'
  },
  {
    id: 'proj-3d-1',
    name: 'Modern Architectural Armchair 3D',
    title: 'Modern Architectural Armchair 3D',
    category: '3D & Spasial',
    featuredLabel: 'Interaktif 3D',
    description: 'Konsep visualisasi furnitur geometris modern (hasil export SketchUp/Blender) dengan tekstur fotorealistis dan inspeksi orbit 360°.',
    coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    tags: ['3D Modeling', 'SketchUp', 'Arsitektur', 'Render 3D'],
    mediaType: '3d',
    model3dUrl: '/models/armchair.glb',
    tools: ['SketchUp', 'Blender', 'Google Model-Viewer'],
    year: '2026'
  },
  {
    id: 'proj-3d-2',
    name: 'Cosmic Spatial Character & Asset',
    title: 'Cosmic Spatial Character & Asset',
    category: 'Visual 3D',
    featuredLabel: 'Eksplorasi 360°',
    description: 'Eksplorasi aset 3D sinematik bertekstur PBR tinggi untuk pengalaman portofolio interaktif dan augmented reality (AR).',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    tags: ['3D Asset', 'PBR Material', 'Blender', 'AR Ready'],
    mediaType: '3d',
    model3dUrl: '/models/helmet.glb',
    tools: ['Blender', 'WebGL', 'Three.js'],
    year: '2026'
  },
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
  }
];

// ── Debounce helper ───────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useLandingData = () => {
  const [data, setData] = useState<MainWebsiteData>(() => {
    try {
      const syncData = storage.getSync('porto_main_website', null);
      const cached = syncData || (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_main_website') : null);
      const savedAccent = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null;
      const cachedLogo = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_cached_logotext') : null;
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        const merged = deepMerge(DEFAULT_MAIN_WEBSITE_DATA, parsed);
        merged.companySections = getEffectiveCompanySections(merged.companySections, merged.deletedCompanySections);
        merged.personalSections = getEffectivePersonalSections(merged.personalSections, merged.deletedPersonalSections);
        if (!merged.model3dSettings) merged.model3dSettings = DEFAULT_MAIN_WEBSITE_DATA.model3dSettings;
        if (!merged.flipbookSettings) merged.flipbookSettings = DEFAULT_MAIN_WEBSITE_DATA.flipbookSettings;
        if (savedAccent) merged.theme.accentColor = savedAccent;
        if (parsed?.navbar?.logoText && parsed.navbar.logoText.trim()) {
          merged.navbar.logoText = parsed.navbar.logoText.trim();
          try { localStorage.setItem('porto_cached_logotext', merged.navbar.logoText); } catch (_) {}
        } else if (cachedLogo && (!merged.navbar?.logoText || merged.navbar.logoText === 'sumr.day' || merged.navbar.logoText === 'Studio')) {
          merged.navbar.logoText = cachedLogo;
        }
        return merged;
      }
      if (savedAccent || cachedLogo) {
        return {
          ...DEFAULT_MAIN_WEBSITE_DATA,
          navbar: {
            ...DEFAULT_MAIN_WEBSITE_DATA.navbar,
            logoText: cachedLogo || DEFAULT_MAIN_WEBSITE_DATA.navbar.logoText
          },
          theme: { ...DEFAULT_MAIN_WEBSITE_DATA.theme, ...(savedAccent ? { accentColor: savedAccent } : {}) }
        };
      }
    } catch (e) {}
    return DEFAULT_MAIN_WEBSITE_DATA;
  });

  const [projects, setProjects] = useState<ProjectData[]>(() => {
    try {
      const syncProjects = storage.getSync('porto_portfolio', null);
      if (Array.isArray(syncProjects) && syncProjects.length > 0) return syncProjects;
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_portfolio') : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !storage.getSync('porto_main_website', null);
    } catch {
      return true;
    }
  });

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

      // Synchronize siteMode and aboutSettings.mode
      const activeSiteMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_site_mode') : null)
        || savedData?.siteMode
        || savedData?.aboutSettings?.mode
        || merged.siteMode
        || 'company';
      merged.siteMode = activeSiteMode as 'company' | 'personal';
      if (!merged.aboutSettings) merged.aboutSettings = {} as any;
      merged.aboutSettings.mode = activeSiteMode as 'company' | 'personal';

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

      // Ensure companySections, personalSections and model3dSettings are synchronized and active
      let websiteNeedsSave = false;
      const effectiveCompany = getEffectiveCompanySections(merged.companySections, merged.deletedCompanySections);
      if (JSON.stringify(effectiveCompany) !== JSON.stringify(merged.companySections)) {
        merged.companySections = effectiveCompany;
        websiteNeedsSave = true;
      }
      const effectivePersonal = getEffectivePersonalSections(merged.personalSections, merged.deletedPersonalSections);
      if (JSON.stringify(effectivePersonal) !== JSON.stringify(merged.personalSections)) {
        merged.personalSections = effectivePersonal;
        websiteNeedsSave = true;
      }
      if (!merged.model3dSettings) {
        merged.model3dSettings = DEFAULT_MAIN_WEBSITE_DATA.model3dSettings;
        websiteNeedsSave = true;
      }
      if (!merged.flipbookSettings) {
        merged.flipbookSettings = DEFAULT_MAIN_WEBSITE_DATA.flipbookSettings;
        websiteNeedsSave = true;
      }
      if (websiteNeedsSave) {
        storage.setItem('porto_main_website', merged, false).catch(() => {});
      }

      if (savedData?.navbar?.logoText && savedData.navbar.logoText.trim()) {
        try { localStorage.setItem('porto_cached_logotext', savedData.navbar.logoText.trim()); } catch (_) {}
      }

      setData(merged);
      let finalProjects = Array.isArray(savedProjects) && savedProjects.length > 0
        ? [...savedProjects]
        : [...DEFAULT_PORTFOLIO_PROJECTS];

      // Auto-heal any stale 404 remote model URLs to local assets
      let needsHeal = false;
      finalProjects = finalProjects.map(p => {
        if (p.model3dUrl?.includes('Chair.glb') || (p.id === 'proj-3d-1' && p.model3dUrl !== '/models/armchair.glb')) {
          needsHeal = true;
          return { ...p, mediaType: '3d', model3dUrl: '/models/armchair.glb' };
        }
        if (p.model3dUrl?.includes('Astronaut.glb') || (p.id === 'proj-3d-2' && p.model3dUrl !== '/models/helmet.glb')) {
          needsHeal = true;
          return { ...p, mediaType: '3d', model3dUrl: '/models/helmet.glb' };
        }
        return p;
      });

      // Auto-seed sample 3D items if not present in existing portfolio list
      const has3d = finalProjects.some(p => p.mediaType === '3d' || p.model3dUrl);
      if (!has3d) {
        const sample3d = DEFAULT_PORTFOLIO_PROJECTS.filter(p => p.mediaType === '3d');
        if (sample3d.length > 0) {
          finalProjects = [...sample3d, ...finalProjects];
          needsHeal = true;
        }
      }

      // Auto-seed sample flipbook items if not present in existing portfolio list
      const hasFlipbook = finalProjects.some(p => p.mediaType === 'flipbook' || p.pdfUrl);
      if (!hasFlipbook) {
        const sampleFlip = DEFAULT_PORTFOLIO_PROJECTS.filter(p => p.mediaType === 'flipbook');
        if (sampleFlip.length > 0) {
          finalProjects = [...sampleFlip, ...finalProjects];
          needsHeal = true;
        }
      }

      if (needsHeal) {
        storage.setItem('porto_portfolio', finalProjects).catch(() => {});
      }

      setProjects(finalProjects);

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

    const unsubData = storage.listenItem('porto_main_website', debounce((d: MainWebsiteData) => {
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
          const activeSiteMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_site_mode') : null)
            || d?.siteMode
            || d?.aboutSettings?.mode
            || merged.siteMode
            || 'company';
          merged.siteMode = activeSiteMode as 'company' | 'personal';
          merged.companySections = getEffectiveCompanySections(merged.companySections, merged.deletedCompanySections);
          merged.personalSections = getEffectivePersonalSections(merged.personalSections, merged.deletedPersonalSections);
          if (!merged.model3dSettings) merged.model3dSettings = DEFAULT_MAIN_WEBSITE_DATA.model3dSettings;
          if (!merged.flipbookSettings) merged.flipbookSettings = DEFAULT_MAIN_WEBSITE_DATA.flipbookSettings;

          if (accent) {
            merged.theme.accentColor = accent;
          }
          return merged;
        });

      }
    }, 150), null);

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

    const handleSiteModeChange = (e: any) => {
      const mode = e?.detail?.mode;
      if (mode) {
        setData(prev => ({
          ...prev,
          siteMode: mode,
          aboutSettings: {
            ...(prev.aboutSettings || {}),
            mode
          }
        }));
      }
    };
    window.addEventListener('porto_sitemode_changed', handleSiteModeChange);

    const handleLogoTextUpdated = (e: any) => {
      const nextLogoText = e?.detail?.logoText;
      if (typeof nextLogoText === 'string' && nextLogoText.trim()) {
        setData(prev => ({
          ...prev,
          navbar: {
            ...(prev.navbar || {}),
            logoText: nextLogoText.trim()
          }
        }));
      }
    };
    const handleLandingDataUpdated = (e: any) => {
      const updated = e?.detail;
      if (updated && typeof updated === 'object') {
        setData(prev => deepMerge(prev, updated));
      }
    };
    window.addEventListener('porto_logotext_updated', handleLogoTextUpdated);
    window.addEventListener('landing_data_updated', handleLandingDataUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('porto_accent_color_changed', handleStorageChange);
      window.removeEventListener('porto_sitemode_changed', handleSiteModeChange);
      window.removeEventListener('porto_logotext_updated', handleLogoTextUpdated);
      window.removeEventListener('landing_data_updated', handleLandingDataUpdated);
      if (typeof unsubData === 'function') unsubData();
      if (typeof unsubSettings === 'function') unsubSettings();
      if (typeof unsubProjects === 'function') unsubProjects();
    };
  }, [load]);

  return { data, projects, isLoading };
};

// ── Global Site Mode Switcher Helper ───────────────────────────────────────────
export const setGlobalSiteMode = async (mode: 'company' | 'personal') => {
  try {
    const current = await storage.getItem('porto_main_website', DEFAULT_MAIN_WEBSITE_DATA);
    const updated = {
      ...current,
      siteMode: mode,
      aboutSettings: {
        ...(current.aboutSettings || {}),
        mode
      }
    };
    await storage.setItem('porto_main_website', updated, true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('porto_site_mode', mode);
    }
    window.dispatchEvent(new CustomEvent('porto_sitemode_changed', { detail: { mode } }));
  } catch (err) {
    console.error('Failed to set site mode:', err);
  }
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
