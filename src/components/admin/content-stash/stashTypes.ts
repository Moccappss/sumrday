export type MediaVaultType = 'image' | 'video' | 'audio' | 'document';
export type MediaStorageSource = 'drive' | 'cloudinary' | 'local' | 'external';

export interface VaultFolder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string;
  createdAt: string;
}

export interface MediaVaultItem {
  id: string;
  name: string;
  url: string;
  type: MediaVaultType;
  source?: MediaStorageSource;
  size?: number; // in bytes
  createdAt: string;
  folderId?: string; // ID folder (null/root jika di luar folder)
  folder?: string; // Nama folder (human readable)
  driveId?: string;
  extension?: string;
}

export interface ClientReviewItem {
  id: string;
  clientName: string;
  brand?: string;
  role?: string;
  avatarUrl?: string;
  rating: number; // 1 - 5
  reviewText: string;
  serviceCategory?: string;
  isFeatured?: boolean;
  isPublished?: boolean; // default false (mata tertutup), true for published on client website
  createdAt: string;
}

export interface DeliverableItem {
  id?: string;
  text: string;
  qty?: string;
  unit?: string;
}

export interface ClientFeedbackItem {
  id: string;
  clientName: string;
  emailOrPhone?: string;
  category: 'layanan' | 'fitur' | 'desain' | 'lainnya';
  feedbackText: string;
  status: 'baru' | 'ditinjau' | 'selesai';
  createdAt: string;
}

export interface ClientFaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export interface RateCardPackage {
  id: string;
  title: string;
  category: string;
  badge?: string; // e.g. "Paling Populer", "Best Value"
  badgeColor?: string; // custom or category-derived hex color e.g. "#10b981"
  categoryColor?: string; // custom hex color e.g. "#6366f1"
  price: number;
  originalPrice?: number;
  billingPeriod?: 'sekali' | 'per bulan' | 'per proyek' | 'mulai dari';
  description?: string;
  deliverables: string[];
  durationDays?: number;
  revisionLimit?: string; // e.g. "3x Revisi" atau "Revisi Sepuasnya"
  isPopular?: boolean;
  isActive?: boolean;
  orderUrl?: string; // custom WA link or checkout url
}

export const DEFAULT_RATE_CARDS: RateCardPackage[] = [
  {
    id: 'pkg-1',
    title: 'Starter Brand & Web',
    category: 'Branding',
    badge: 'Paling Populer',
    price: 2500000,
    originalPrice: 3500000,
    billingPeriod: 'per proyek',
    description: 'Solusi ideal untuk UMKM dan kreator yang ingin tampil profesional dengan identitas visual terpadu.',
    deliverables: [
      'Desain Logo Primer & Sekunder',
      'Panduan Palet Warna & Tipografi',
      'Landing Page 1 Halaman Responsif',
      'Integrasi WhatsApp & Bio Links',
      'Domain Setup & Hosting Cloud'
    ],
    durationDays: 5,
    revisionLimit: '3x Revisi Minor',
    isPopular: true,
    isActive: true
  },
  {
    id: 'pkg-2',
    title: 'Professional Studio Suite',
    category: 'Web & App',
    badge: 'Best Value',
    price: 6500000,
    originalPrice: 8000000,
    billingPeriod: 'per proyek',
    description: 'Arsitektur web kustom lengkap dengan animasi, katalog produk, dan formulir pendaftaran interaktif.',
    deliverables: [
      'Semua fitur Starter Brand',
      'Hingga 5 Halaman Kustom Mandiri',
      'Integrasi Etalase Produk / Katalog',
      'Formulir Survei / Registrasi Dinamis',
      'Animasi Glassmorphism Eksklusif',
      'Dukungan & Pemeliharaan 30 Hari'
    ],
    durationDays: 10,
    revisionLimit: 'Revisi Sepuasnya',
    isPopular: true,
    isActive: true
  },
  {
    id: 'pkg-3',
    title: 'Monthly Creative Retainer',
    category: 'Retainer',
    badge: 'Kerja Sama Rutin',
    price: 4000000,
    billingPeriod: 'per bulan',
    description: 'Layanan desain, konten visual, dan pemeliharaan website berkelanjutan untuk kebutuhan bulanan bisnis Anda.',
    deliverables: [
      '20 Desain Grafis & Konten Sosmed',
      'Update Konten Website Berkala',
      'Dukungan Teknis & Konsultasi Prioritas',
      'Laporan Performa & Analitik Bulanan'
    ],
    durationDays: 30,
    revisionLimit: 'Fleksibel Tiap Pekan',
    isPopular: false,
    isActive: true
  }
];

export interface AddonItem {
  id: string;
  name: string;
  desc: string;
  priceIdr: number;
  priceUsd: number;
  priceSgd: number;
  category: string;
  isSyncedCatalog?: boolean;
}

export const DEFAULT_RATECARD_CATEGORIES: string[] = [
  'Branding',
  'Web & App',
  'Video & Motion',
  'Retainer',
  'Digital Marketing',
  'Konsultasi'
];

export const DEFAULT_RATECARD_BADGES: string[] = [
  'Paling Populer',
  'Best Value',
  'Hemat',
  'Kerja Sama Rutin',
  'Pilihan Favorit',
  'Promo Terbatas',
  'Eksklusif'
];

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  'Branding': '#6366f1',
  'Web & App': '#10b981',
  'Video & Motion': '#ec4899',
  'Retainer': '#f59e0b',
  'Digital Marketing': '#0284c7',
  'Konsultasi': '#8b5cf6'
};

export const DEFAULT_ADDONS: AddonItem[] = [
  {
    id: 'addon-express',
    name: 'Pengiriman Kilat 24-48 Jam',
    desc: 'Prioritas pengerjaan khusus dengan tim terdedikasi.',
    priceIdr: 500000,
    priceUsd: 35,
    priceSgd: 48,
    category: 'Waktu'
  },
  {
    id: 'addon-source',
    name: 'Master Source Files (Figma / AI)',
    desc: 'File sumber lengkap vector, komponen, dan aset desain mentah.',
    priceIdr: 350000,
    priceUsd: 25,
    priceSgd: 35,
    category: 'Aset'
  },
  {
    id: 'addon-guideline',
    name: 'Brand Guidelines Mini PDF',
    desc: 'Buku panduan warna HEX, font pairing, dan aturan visual logo.',
    priceIdr: 450000,
    priceUsd: 30,
    priceSgd: 42,
    category: 'Dokumentasi'
  },
  {
    id: 'addon-revision',
    name: 'Paket Revisi Ekstra (3x Putaran)',
    desc: 'Garansi 3 putaran revisi tambahan di luar paket reguler.',
    priceIdr: 250000,
    priceUsd: 18,
    priceSgd: 24,
    category: 'Revisi'
  },
  {
    id: 'addon-commercial',
    name: 'Lisensi Komersial Skala Penuh',
    desc: 'Hak cipta dan sertifikat lisensi komersial tak terbatas untuk produk massal.',
    priceIdr: 750000,
    priceUsd: 50,
    priceSgd: 70,
    category: 'Lisensi'
  },
  {
    id: 'addon-consultation',
    name: 'Sesi Konsultasi 1-on-1 (60 Menit)',
    desc: 'Diskusi strategi mendalam via Google Meet dengan Creative Lead.',
    priceIdr: 300000,
    priceUsd: 20,
    priceSgd: 28,
    category: 'Konsultasi'
  }
];
