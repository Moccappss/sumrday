export type UpdateStickerType = 'poll' | 'this_or_that' | 'slider_rate' | 'qna' | 'product_card' | 'portfolio_card' | 'article_card' | 'flash_sale';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollSticker {
  type: 'poll';
  question: string;
  options: PollOption[];
}

export interface ThisOrThatSticker {
  type: 'this_or_that';
  question: string;
  optionA: { id: string; text: string; emoji?: string; votes: number };
  optionB: { id: string; text: string; emoji?: string; votes: number };
}

export interface SliderRateSticker {
  type: 'slider_rate';
  question: string;
  emoji: string; // e.g. "☀️", "🔥", "☕", "⭐", "❤️"
  minLabel?: string; // e.g. "Biasa"
  maxLabel?: string; // e.g. "Hangat Pol! ☀️"
  totalScore: number; // total accumulated score
  ratingsCount: number; // total number of ratings
  averageScore: number; // average score 0 - 100
}

export interface QnAResponse {
  id: string;
  text: string;
  authorName?: string;
  createdAt: string;
}

export interface QnASticker {
  type: 'qna';
  prompt: string;
  placeholder?: string;
  responses?: QnAResponse[];
}

export interface ProductSticker {
  type: 'product_card';
  productId?: string;
  title: string;
  price: string | number;
  originalPrice?: string | number;
  imageUrl?: string;
  productUrl?: string;
  badge?: string;
  buttonText?: string;
}

export interface PortfolioSticker {
  type: 'portfolio_card';
  projectId?: string;
  title: string;
  category?: string;
  imageUrl?: string;
  projectUrl?: string;
  buttonText?: string;
}

export interface ArticleSticker {
  type: 'article_card';
  articleId?: string;
  title: string;
  category?: string;
  imageUrl?: string;
  articleUrl?: string;
  readTime?: string;
  buttonText?: string;
}

export interface FlashSaleSticker {
  type: 'flash_sale';
  productId?: string;
  title: string;
  originalPrice: string | number;
  salePrice: string | number;
  discountPercent?: number;
  endTime: string; // ISO string
  productUrl?: string;
  imageUrl?: string;
  stockLeft?: number;
  totalStock?: number;
}

export type UpdateSticker = 
  | PollSticker 
  | ThisOrThatSticker 
  | SliderRateSticker 
  | QnASticker 
  | ProductSticker 
  | PortfolioSticker 
  | ArticleSticker
  | FlashSaleSticker;

export interface SocialUpdate {
  id: string;
  title?: string;
  category?: 'asset' | 'product' | 'article' | 'announcement' | 'general' | string;
  content: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'mixed';
  projectTag?: string;
  projectUrl?: string;
  ctaLabel?: string;
  badge?: string;
  price?: string;
  customDate: string; // ISO date format 'YYYY-MM-DD' or timestamp string, supports backdating
  createdAt: string;
  likesCount: number;
  isPinned?: boolean;
  isPublished: boolean;
  sticker?: UpdateSticker;
  author?: {
    name: string;
    role: string;
    avatar: string;
  };
}

export const DEFAULT_SOCIAL_UPDATES: SocialUpdate[] = [
  {
    id: 'upd-1',
    title: 'Rilis Design System & UI Kit Studio v2.0',
    category: 'asset',
    content: `Memulai pekan dengan merilis paket sistem desain v2.0 untuk studio dan klien enterprise. Menyatukan arsitektur web modern yang terstruktur dengan komponen modular berkinerja tinggi.

Pilar utama rilis ini:
• Arsitektur komponen modular berbasis token desain terstandar
• Palet warna terkalibrasi untuk antarmuka bisnis dan platform kreatif
• Micro-interactions teroptimasi tanpa membebani performa perangkat

Dokumentasi dan paket aset kini dapat diakses langsung melalui showcase studio.`,
    mediaUrls: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
    ],
    mediaType: 'image',
    projectTag: 'Aset Digital v2.0',
    projectUrl: '/portfolio',
    ctaLabel: 'Lihat Aset Digital',
    badge: 'Rilis Terkini',
    price: 'Aset Studio',
    customDate: '2026-09-20',
    createdAt: '2026-09-20T09:00:00.000Z',
    likesCount: 68,
    isPinned: true,
    isPublished: true,
    sticker: {
      type: 'slider_rate',
      question: 'Tingkat kepuasan arsitektur Design System v2.0?',
      emoji: '⭐',
      minLabel: 'Cukup',
      maxLabel: 'Sangat Memuaskan',
      totalScore: 4032,
      ratingsCount: 42,
      averageScore: 96
    },
    author: {
      name: 'sumr.day',
      role: 'Creative Digital Studio & Enterprise Systems',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    }
  },
  {
    id: 'upd-2',
    title: 'Drop Produk Baru: Template Undangan Interaktif & RSVP',
    category: 'product',
    content: `Rilis resmi produk digital terbaru pada katalog store: Template Undangan Interaktif berbasis web dengan integrasi RSVP real-time, manajemen buku tamu, dan playlist musik ambient terintegrasi.

Keunggulan produk:
• Desain responsif mobile-first dengan animasi halus
• Formulir kehadiran real-time tersinkronisasi ke Google Sheets
• Navigasi lokasi interaktif dan integrasi amplop digital aman`,
    mediaUrls: [
      'https://images.unsplash.com/photo-1581291518655-9523c932edcf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80'
    ],
    mediaType: 'image',
    projectTag: 'Katalog Store',
    projectUrl: '/katalog',
    ctaLabel: 'Beli di Katalog Store',
    badge: 'Produk Baru',
    price: 'Katalog Tersedia',
    customDate: '2026-09-18',
    createdAt: '2026-09-18T14:30:00.000Z',
    likesCount: 84,
    isPinned: false,
    isPublished: true,
    sticker: {
      type: 'this_or_that',
      question: 'Pilihan layout navigasi favorit Anda untuk undangan web?',
      optionA: { id: 'opt-a', text: 'Floating Bottom Bar', votes: 62 },
      optionB: { id: 'opt-b', text: 'Top Minimalist Nav', votes: 38 }
    },
    author: {
      name: 'sumr.day',
      role: 'Creative Digital Studio & Enterprise Systems',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    }
  },
  {
    id: 'upd-3',
    title: 'Artikel Baru: Membangun Web Berorientasi Kinerja Tinggi',
    category: 'article',
    content: `Artikel wawasan teknis dan studi kasus terbaru kami telah terbit di blog studio. Membahas strategi optimasi rendering pada single-page applications, manajemen memori web, dan arsitektur database offline-first.

Ulasan mencakup:
• Teknik hybrid caching menggunakan IndexedDB dan Service Worker
• Pencegahan reflow dan optimasi font web modern
• Metrik performa Google Core Web Vitals pada implementasi nyata`,
    mediaUrls: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    ],
    mediaType: 'image',
    projectTag: 'Wawasan Industri',
    projectUrl: '/blog',
    ctaLabel: 'Baca Artikel Lengkap',
    badge: 'Artikel Baru',
    customDate: '2026-09-12',
    createdAt: '2026-09-12T10:15:00.000Z',
    likesCount: 112,
    isPinned: false,
    isPublished: true,
    sticker: {
      type: 'qna',
      prompt: 'Topik teknis atau studi kasus apa yang ingin Anda baca selanjutnya?',
      placeholder: 'Tulis topik saran Anda...',
      responses: [
        { id: 'res-1', text: 'Pembahasan arsitektur state management di React 19', authorName: 'Rian D.', createdAt: '2026-09-16T11:20:00.000Z' },
        { id: 'res-2', text: 'Tips integrasi gateway pembayaran lokal di aplikasi PWA', authorName: 'Maya K.', createdAt: '2026-09-17T08:15:00.000Z' }
      ]
    },
    author: {
      name: 'sumr.day',
      role: 'Creative Digital Studio & Enterprise Systems',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    }
  },
  {
    id: 'upd-4',
    title: 'Pengumuman Resmi: Pembukaan Jalur Kolaborasi Brand Q4',
    category: 'announcement',
    content: `Kami membuka slot kemitraan strategis dan pengembangan proyek kustom untuk kuartal IV. Terbuka untuk transformasi digital brand, perancangan web app bespoke, dan aset identitas visual perusahaan.

Fasilitas kemitraan:
• Konsultasi teknis terarah dan audit antarmuka gratis
• Perjanjian tingkat layanan (SLA) transparan dan timeline terukur
• Dukungan integrasi sistem CMS mandiri dengan hak milik penuh`,
    mediaUrls: [
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80'
    ],
    mediaType: 'image',
    projectTag: 'Pengumuman Bisnis',
    projectUrl: '#contact',
    ctaLabel: 'Hubungi Tim Kemitraan',
    badge: 'Pengumuman',
    customDate: '2026-09-08',
    createdAt: '2026-09-08T08:00:00.000Z',
    likesCount: 95,
    isPinned: false,
    isPublished: true,
    author: {
      name: 'sumr.day',
      role: 'Creative Digital Studio & Enterprise Systems',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    }
  }
];
