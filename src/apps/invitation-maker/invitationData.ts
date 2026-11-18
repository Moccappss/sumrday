import { storage } from '../../utils/storage';

export interface Guest {
  id: string;
  name: string;
  phone?: string;
  category: string;
  sent: boolean;
  qrSecretCode: string;
  hasCheckedIn?: boolean;
  checkedInAt?: string;
  paxQuota?: number;
}

export interface RSVP {
  id: string;
  name: string;
  attendance: 'hadir' | 'ragu' | 'tidak_hadir';
  count: number;
  message: string;
  createdAt: string;
}

export interface LoveStory {
  id: string;
  yearOrPhase: string;
  title: string;
  story: string;
  photo?: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  category?: string; // e.g. "Prewedding", "Lamaran", "Akad", "Momen"
  title?: string;
  caption?: string;
}

export interface FrameOverlayConfig {
  enabled: boolean;
  preset: 'none' | 'gold_floral' | 'vintage_arch' | 'minimalist_border' | 'luxury_corners' | 'custom';
  url?: string;
  opacity: number; // 0.1 to 1.0
}

export const FRAME_PRESETS: Record<string, string> = {
  gold_floral: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" fill="none"><rect x="14" y="14" width="372" height="772" rx="20" stroke="#eab308" stroke-width="2" stroke-dasharray="8 4" opacity="0.85"/><rect x="22" y="22" width="356" height="756" rx="16" stroke="#ec4899" stroke-width="1.2" opacity="0.5"/><g stroke="#eab308" stroke-width="2.5" fill="none"><path d="M14 60 C14 34 34 14 60 14 M24 24 L50 24 M24 24 L24 50"/><path d="M386 60 C386 34 366 14 340 14 M376 24 L350 24 M376 24 L376 50"/><path d="M14 740 C14 766 34 786 60 786 M24 776 L50 776 M24 776 L24 750"/><path d="M386 740 C386 766 366 786 340 786 M376 776 L350 776 M376 776 L376 750"/></g><circle cx="200" cy="22" r="5" fill="#eab308"/><circle cx="200" cy="778" r="5" fill="#eab308"/></svg>`,
  luxury_corners: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" fill="none"><rect x="16" y="16" width="368" height="768" rx="16" stroke="#f59e0b" stroke-width="2" opacity="0.9"/><rect x="24" y="24" width="352" height="752" rx="12" stroke="#f59e0b" stroke-width="1" opacity="0.5"/><g stroke="#f59e0b" stroke-width="3"><path d="M14 46 L14 14 L46 14"/><path d="M386 46 L386 14 L354 14"/><path d="M14 754 L14 786 L46 786"/><path d="M386 754 L386 786 L354 786"/><path d="M20 36 L36 20"/><path d="M380 36 L364 20"/><path d="M20 764 L36 780"/><path d="M380 764 L364 780"/></g><polygon points="200,14 206,22 200,30 194,22" fill="#f59e0b"/><polygon points="200,770 206,778 200,786 194,778" fill="#f59e0b"/></svg>`,
  vintage_arch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" fill="none"><path d="M20 140 C20 55 80 18 200 18 C320 18 380 55 380 140 L380 780 L20 780 Z" stroke="#d97706" stroke-width="2" opacity="0.85"/><path d="M28 144 C28 65 84 26 200 26 C316 26 372 65 372 144 L372 772 L28 772 Z" stroke="#ec4899" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.6"/><circle cx="200" cy="18" r="6" fill="#d97706"/><circle cx="165" cy="22" r="3" fill="#d97706"/><circle cx="235" cy="22" r="3" fill="#d97706"/></svg>`,
  minimalist_border: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" fill="none"><rect x="14" y="14" width="372" height="772" rx="18" stroke="#ffffff" stroke-width="1.8" opacity="0.75"/><rect x="22" y="22" width="356" height="756" rx="14" stroke="#ffffff" stroke-width="1" opacity="0.4"/><circle cx="14" cy="14" r="5" fill="#ffffff" opacity="0.9"/><circle cx="386" cy="14" r="5" fill="#ffffff" opacity="0.9"/><circle cx="14" cy="786" r="5" fill="#ffffff" opacity="0.9"/><circle cx="386" cy="786" r="5" fill="#ffffff" opacity="0.9"/></svg>`
};

export function getFrameOverlayUrl(preset?: string, customUrl?: string): string {
  if (!preset || preset === 'none') return '';
  if (preset === 'custom') return customUrl || '';
  const rawSvg = FRAME_PRESETS[preset];
  if (!rawSvg) return customUrl || '';
  return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
}

export interface SlideBackground {
  bgType: 'none' | 'color' | 'image';
  color?: string;
  image?: string;
  opacity?: number; // overlay darken amount 0-1
}

export interface EnabledWidgets {
  cover?: boolean;
  quote?: boolean;
  mempelai?: boolean;
  acara?: boolean;
  story?: boolean;
  gallery?: boolean;
  video?: boolean;
  hadiah?: boolean;
  ucapan?: boolean;
  navbar?: boolean;
  countdown?: boolean;
}

export interface CoverConfig {
  style?: 'classic' | 'modern' | 'poster' | 'luxury_arch' | 'hero_full';
  title?: string;
  subtitle?: string;
  badge?: string;
  openButtonText?: string;
  guestLabel?: string;
  bgType?: 'theme' | 'color' | 'image' | 'gradient';
  bgColor?: string;
  bgGradient?: string;
  bgImage?: string;
  bgOpacity?: number; // 0.1 to 1.0 overlay darken
  align?: 'center' | 'left';
  showCountdown?: boolean;
  showGuestName?: boolean;
}

export interface CustomBlock {
  id: string;
  type: 
    | 'cover'
    | 'persons'
    | 'countdown'
    | 'quote'
    | 'events'
    | 'story'
    | 'gallery'
    | 'video'
    | 'gifts'
    | 'rsvp'
    | 'map'
    | 'custom_text'
    | 'custom_button'
    | 'divider';
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  icon?: string;
  align?: 'left' | 'center' | 'right';
  background?: string;
  bgType?: 'theme' | 'color' | 'image' | 'gradient';
  bgColor?: string;
  bgGradient?: string;
  bgImage?: string;
  bgOpacity?: number;
  textColor?: string;
  accentColor?: string;
  padding?: string;
  borderRadius?: number;
  enabled?: boolean;
}

export const BACKGROUND_GRADIENTS = [
  { id: 'midnight', name: 'Midnight Obsidian', gradient: 'linear-gradient(180deg, #09090e 0%, #151522 100%)' },
  { id: 'royal_gold', name: 'Royal Gold Noir', gradient: 'linear-gradient(180deg, #120e06 0%, #2b200b 100%)' },
  { id: 'rose_wine', name: 'Rose Wine Romance', gradient: 'linear-gradient(180deg, #17080e 0%, #30101d 100%)' },
  { id: 'emerald_deep', name: 'Emerald Sanctuary', gradient: 'linear-gradient(180deg, #06150f 0%, #0d281e 100%)' },
  { id: 'sapphire_night', name: 'Sapphire Abyss', gradient: 'linear-gradient(180deg, #070d18 0%, #111d33 100%)' },
  { id: 'velvet_purple', name: 'Mystic Amethyst', gradient: 'linear-gradient(180deg, #11071d 0%, #25103d 100%)' }
];

export const BACKGROUND_PATTERNS = [
  { id: 'none', name: 'Polos (Tanpa Corak)', css: 'none' },
  { id: 'dots', name: 'Bintik Elegan (Polka Dots)', css: 'radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)', size: '20px 20px' },
  { id: 'grid', name: 'Grid Halus', css: 'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)', size: '24px 24px' },
  { id: 'stars', name: 'Taburan Bintang Kilau', css: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 40px 70px, #eab308, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0))', size: '120px 120px' }
];

export interface PersonProfile {
  id: string;
  role?: string; // e.g. "Pemateri 1", "Keynote Speaker", "Mempelai Pria", "Mempelai Wanita", "Moderator", "Narasumber"
  fullName: string;
  nickname: string;
  parents?: string; // e.g. "CEO Sumr Creative" atau "Putra pertama dari Bpk. X & Ibu Y"
  instagram?: string;
  photo?: string;
}

export interface InvitationData {
  id: string;
  slug: string; // e.g. "arif-nadia"
  navigationMode: 'vertical_scroll' | 'story_slide';
  bottomNavbarEnabled?: boolean;
  navbarStyle?: 'floating_glass' | 'pill_minimal' | 'solid_dock';
  theme: 'floral' | 'luxury' | 'sage' | 'modern';
  backgroundType?: 'theme' | 'color' | 'image' | 'gradient';
  customBackgroundColor?: string;
  customBackgroundImage?: string;
  customBackgroundGradient?: string;
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'stars';
  animationStyle?: 'fade' | 'zoom' | 'slide' | 'spill' | 'flip';
  frameOverlay?: FrameOverlayConfig;
  mainIcon?: 'heart' | 'ring' | 'sparkles' | 'building' | 'star' | 'cake' | 'calendar' | 'music' | 'ticket';
  eventType: 'universal' | 'exhibition' | 'wedding' | 'birthday' | 'conference' | 'event';
  categoryBadge?: string; // e.g. "EXHIBITION & EXPO", "OFFICIAL INVITATION", "THE WEDDING OF"
  organizer?: string; // e.g. "Sumr Creative Studio" or "Keluarga Besar"
  description?: string; // Deskripsi acara / tentang pameran
  personsLabel?: string; // e.g. "Tokoh & Bintang Tamu", "Mempelai", "Pembicara Utama"
  sessionsLabel?: string; // e.g. "Jadwal & Agenda Acara", "Rangkaian Acara"
  title: string;
  coverConfig?: CoverConfig; // Konfigurasi desain cover visual kustom
  customBlocks?: CustomBlock[]; // Blok/widget modular kustom yang bisa ditambah, reorder, dan edit visual
  blockOrder?: string[]; // Urutan susunan blok visual
  persons?: PersonProfile[]; // Mendukung lebih dari 2 orang (pemateri, keynote speakers, pengisi acara, mempelai)
  groom: {
    fullName: string;
    nickname: string;
    parents: string;
    instagram?: string;
    photo?: string;
  };
  bride: {
    fullName: string;
    nickname: string;
    parents: string;
    instagram?: string;
    photo?: string;
  };
  eventDate: string; // YYYY-MM-DD
  akad: {
    title: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  };
  reception: {
    title: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  };
  quote: string;
  quoteSource: string;
  musicTitle: string;
  musicUrl: string;
  musicAutoplay?: boolean;
  videoUrl?: string;
  galleryImages?: string[];
  loveStories?: LoveStory[];
  enabledWidgets?: EnabledWidgets;
  hideQrPass?: boolean; // Sembunyikan slide QR Pass dari tamu
  slideBackgrounds?: SlideBackground[]; // Background khusus per-slide (index 0-6)
  clientAdminPassword?: string; // Sandi khusus Klien Pemesan untuk kelola Tamu & RSVP
  coverImage: string;
  bankAccounts: Array<{ bank: string; accountNumber: string; accountName: string; qrisImage?: string }>;
  rsvps: RSVP[];
  guests: Guest[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_INVITATION: InvitationData = {
  id: 'inv-sample-01',
  slug: 'arif-nadia',
  navigationMode: 'vertical_scroll',
  bottomNavbarEnabled: true,
  navbarStyle: 'floating_glass',
  theme: 'floral',
  backgroundType: 'theme',
  customBackgroundColor: '#0a0a14',
  customBackgroundImage: '',
  customBackgroundGradient: 'linear-gradient(180deg, #09090e 0%, #151522 100%)',
  backgroundPattern: 'none',
  coverConfig: {
    style: 'classic',
    title: 'The Wedding of Arif & Nadia',
    subtitle: 'Kami mengundang Anda untuk hadir dan memberikan doa restu',
    badge: "WALIMATUL 'URS",
    openButtonText: 'Buka Undangan',
    guestLabel: 'Kepada Yth:',
    bgType: 'theme',
    showCountdown: true,
    showGuestName: true
  },
  customBlocks: [],
  animationStyle: 'spill',
  frameOverlay: {
    enabled: true,
    preset: 'gold_floral',
    url: '',
    opacity: 0.8
  },
  mainIcon: 'heart',
  eventType: 'wedding',
  title: 'The Wedding of Arif & Nadia',
  clientAdminPassword: 'sumr',
  musicAutoplay: true,
  videoUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
  galleryImages: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80'
  ],
  galleryItems: [
    {
      id: 'g-1',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
      category: 'Prewedding',
      title: 'Sunrise at Bromo Mountain',
      caption: 'Momen magis saat matahari terbit di lautan pasir Bromo.'
    },
    {
      id: 'g-2',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80',
      category: 'Prewedding',
      title: 'The Royal Garden Session',
      caption: 'Nuansa klasik bernuansa royal floral di taman botani.'
    },
    {
      id: 'g-3',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80',
      category: 'Lamaran',
      title: 'Hari Pertunangan',
      caption: 'Langkah awal menyatukan dua keluarga besar dalam kehangatan doa.'
    },
    {
      id: 'g-4',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80',
      category: 'Momen',
      title: 'Candid Smiles',
      caption: 'Tawa bahagia di antara persiapan hari istimewa kami.'
    }
  ],
  loveStories: [
    {
      id: 'story-1',
      yearOrPhase: '2020',
      title: 'Pertemuan Pertama',
      story: 'Takdir mempertemukan kami saat sama-sama mengikuti proyek creative branding di Jakarta.',
      photo: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'story-2',
      yearOrPhase: '2023',
      title: 'Komitmen & Lamaran',
      story: 'Setelah tiga tahun bersama, di hadapan kedua keluarga kami memutuskan untuk melangkah ke jenjang yang lebih serius.',
      photo: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop&q=80'
    }
  ],
  hideQrPass: false,
  slideBackgrounds: [],
  enabledWidgets: {
    cover: true,
    quote: true,
    mempelai: true,
    countdown: true,
    acara: true,
    story: true,
    gallery: true,
    video: true,
    hadiah: true,
    ucapan: true,
    navbar: true
  },
  persons: [
    {
      id: 'person-1',
      role: 'Mempelai Pria',
      fullName: 'Muhammad Arif Rahman, S.Kom',
      nickname: 'Arif',
      parents: 'Putra pertama dari Bpk. H. Rahmat & Ibu Hj. Siti Aminah',
      instagram: 'arif_design',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'person-2',
      role: 'Mempelai Wanita',
      fullName: 'Nadia Putri Maharani, S.Ds',
      nickname: 'Nadia',
      parents: 'Putri kedua dari Bpk. Ir. Bambang & Ibu Hj. Nurhayati',
      instagram: 'nadiaputri',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
    }
  ],
  groom: {
    fullName: 'Muhammad Arif Rahman, S.Kom',
    nickname: 'Arif',
    parents: 'Putra pertama dari Bpk. H. Rahmat & Ibu Hj. Siti Aminah',
    instagram: '@arif_design',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  },
  bride: {
    fullName: 'Nadia Putri Maharani, S.Ds',
    nickname: 'Nadia',
    parents: 'Putri kedua dari Bpk. Ir. Bambang & Ibu Hj. Nurhayati',
    instagram: '@nadiaputri',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
  },
  eventDate: '2026-11-28',
  akad: {
    title: 'Akad Nikah',
    time: '08:00 - 10:00 WIB',
    venue: 'Masjid Agung Al-Barkah',
    address: 'Jl. Veteran No. 12, Jakarta Pusat',
    mapUrl: 'https://maps.google.com'
  },
  reception: {
    title: 'Resepsi Pernikahan',
    time: '11:00 - 14:00 WIB',
    venue: 'The Grand Ballroom Sakura',
    address: 'Jl. Sudirman Kav. 45, Jakarta Selatan',
    mapUrl: 'https://maps.google.com'
  },
  quote: '"Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."',
  quoteSource: 'QS. Ar-Rum: 21',
  musicTitle: 'Canon in D - Romantic Acoustic',
  musicUrl: '',
  coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
  bankAccounts: [
    { bank: 'BCA', accountNumber: '8820192831', accountName: 'Muhammad Arif Rahman' },
    { bank: 'Bank Mandiri', accountNumber: '1370019283711', accountName: 'Nadia Putri Maharani' }
  ],
  rsvps: [
    {
      id: 'rsvp-1',
      name: 'Dimas Prasetyo & Istri',
      attendance: 'hadir',
      count: 2,
      message: 'Selamat berbahagia Arif & Nadia! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Aamiin.',
      createdAt: '2 jam yang lalu'
    },
    {
      id: 'rsvp-2',
      name: 'Sarah Amelia',
      attendance: 'hadir',
      count: 1,
      message: 'Happy wedding Nadia sayang! Lancar sampai hari H yaa.',
      createdAt: '5 jam yang lalu'
    },
    {
      id: 'rsvp-3',
      name: 'Rian Kurniawan',
      attendance: 'ragu',
      count: 1,
      message: 'Barakallahu lakuma, semoga dimudahkan segala urusannya brader!',
      createdAt: '1 hari yang lalu'
    }
  ],
  guests: [
    { id: 'g-1', name: 'Bapak Joko Widodo & Keluarga', phone: '628123456789', category: 'VIP', sent: true, qrSecretCode: 'QR-ARIF-001', hasCheckedIn: false, paxQuota: 2 },
    { id: 'g-2', name: 'Rekan Tim Creative Agency', phone: '628987654321', category: 'Teman', sent: true, qrSecretCode: 'QR-ARIF-002', hasCheckedIn: true, checkedInAt: '10:15 WIB', paxQuota: 4 },
    { id: 'g-3', name: 'Keluarga Besar Bpk. Rahmat', phone: '', category: 'Keluarga', sent: false, qrSecretCode: 'QR-ARIF-003', hasCheckedIn: false, paxQuota: 2 },
    { id: 'g-4', name: 'Alumni SMA 1 Angkatan 2018', phone: '', category: 'Teman', sent: false, qrSecretCode: 'QR-ARIF-004', hasCheckedIn: false, paxQuota: 1 }
  ]
};

export function getInvitationPersons(data: Partial<InvitationData> | null | undefined): PersonProfile[] {
  if (!data) return [];
  if (data.persons && Array.isArray(data.persons) && data.persons.length > 0) {
    return data.persons;
  }
  const result: PersonProfile[] = [];
  if (data.groom && (data.groom.fullName || data.groom.nickname || data.groom.photo)) {
    result.push({
      id: 'person-groom',
      role: 'Mempelai Pria',
      fullName: data.groom.fullName || '',
      nickname: data.groom.nickname || '',
      parents: data.groom.parents || '',
      instagram: (data.groom.instagram || '').replace(/^@/, ''),
      photo: data.groom.photo || ''
    });
  }
  if (data.bride && (data.bride.fullName || data.bride.nickname || data.bride.photo)) {
    result.push({
      id: 'person-bride',
      role: 'Mempelai Wanita',
      fullName: data.bride.fullName || '',
      nickname: data.bride.nickname || '',
      parents: data.bride.parents || '',
      instagram: (data.bride.instagram || '').replace(/^@/, ''),
      photo: data.bride.photo || ''
    });
  }
  return result.length > 0 ? result : (DEFAULT_INVITATION.persons || []);
}

const STORAGE_LIST_KEY = 'porto_invitations_list';
const STORAGE_LEGACY_KEY = 'porto_invitation_maker_data';

// Background sync from persistent storage (IndexedDB / Cloud)
let _hasHydratedFromStorage = false;
export const syncInvitationsFromCloud = async (): Promise<InvitationData[]> => {
  try {
    const cloudList = await storage.getItem<InvitationData[]>(STORAGE_LIST_KEY, null);
    if (Array.isArray(cloudList) && cloudList.length > 0) {
      const rawLocal = localStorage.getItem(STORAGE_LIST_KEY);
      const localList = rawLocal ? JSON.parse(rawLocal) : [];
      if (!Array.isArray(localList) || localList.length === 0 || cloudList.length >= localList.length) {
        localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(cloudList));
        window.dispatchEvent(new CustomEvent('porto_invitations_updated', { detail: cloudList }));
        return cloudList;
      }
    }
  } catch (e) {
    console.warn('[invitationData] Cloud hydrate warning:', e);
  }
  return getAllInvitations();
};

export const getAllInvitations = (): InvitationData[] => {
  try {
    if (!_hasHydratedFromStorage && typeof window !== 'undefined') {
      _hasHydratedFromStorage = true;
      syncInvitationsFromCloud().catch(() => {});
    }

    const rawList = localStorage.getItem(STORAGE_LIST_KEY);
    if (rawList) {
      const parsed = JSON.parse(rawList);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          ...DEFAULT_INVITATION,
          ...item,
          slug: item.slug || item.id || 'undangan',
          navigationMode: item.navigationMode || 'vertical_scroll',
          bottomNavbarEnabled: item.bottomNavbarEnabled !== false,
          animationStyle: item.animationStyle || 'spill',
          frameOverlay: item.frameOverlay || DEFAULT_INVITATION.frameOverlay,
          persons: (item.persons && Array.isArray(item.persons) && item.persons.length > 0)
            ? item.persons
            : getInvitationPersons(item),
          coverConfig: item.coverConfig || DEFAULT_INVITATION.coverConfig,
          customBlocks: Array.isArray(item.customBlocks) ? item.customBlocks : [],
          customBackgroundGradient: item.customBackgroundGradient || DEFAULT_INVITATION.customBackgroundGradient,
          backgroundPattern: item.backgroundPattern || 'none',
          galleryItems: (item.galleryItems && item.galleryItems.length > 0)
            ? item.galleryItems
            : (item.galleryImages || DEFAULT_INVITATION.galleryImages || []).map((url: string, i: number) => ({
                id: `g-${i}`,
                url,
                category: i % 2 === 0 ? 'Prewedding' : 'Momen',
                title: `Foto ${i + 1}`,
                caption: 'Dokumentasi momen istimewa.'
              }))
        }));
      }
    }
    const rawLegacy = localStorage.getItem(STORAGE_LEGACY_KEY);
    if (rawLegacy) {
      const parsed = JSON.parse(rawLegacy);
      const migrated: InvitationData = {
        ...DEFAULT_INVITATION,
        ...parsed,
        slug: parsed.slug || 'arif-nadia',
        animationStyle: parsed.animationStyle || 'spill',
        frameOverlay: parsed.frameOverlay || DEFAULT_INVITATION.frameOverlay,
        persons: (parsed.persons && Array.isArray(parsed.persons) && parsed.persons.length > 0)
          ? parsed.persons
          : getInvitationPersons(parsed),
        coverConfig: parsed.coverConfig || DEFAULT_INVITATION.coverConfig,
        customBlocks: Array.isArray(parsed.customBlocks) ? parsed.customBlocks : [],
        customBackgroundGradient: parsed.customBackgroundGradient || DEFAULT_INVITATION.customBackgroundGradient,
        backgroundPattern: parsed.backgroundPattern || 'none',
        galleryItems: (parsed.galleryItems && parsed.galleryItems.length > 0)
          ? parsed.galleryItems
          : (parsed.galleryImages || DEFAULT_INVITATION.galleryImages || []).map((url: string, i: number) => ({
              id: `g-${i}`,
              url,
              category: i % 2 === 0 ? 'Prewedding' : 'Momen',
              title: `Foto ${i + 1}`,
              caption: 'Dokumentasi momen istimewa.'
            }))
      };
      saveAllInvitations([migrated]);
      return [migrated];
    }
    saveAllInvitations([DEFAULT_INVITATION]);
    return [DEFAULT_INVITATION];
  } catch {
    return [DEFAULT_INVITATION];
  }
};

export const saveAllInvitations = (list: InvitationData[]): void => {
  try {
    localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(list));
    // Persist to indexedDB and Cloud Firestore asynchronously
    storage.setItem(STORAGE_LIST_KEY, list, true).catch(err => {
      console.warn('[invitationData] Cloud persist warning:', err);
    });
    window.dispatchEvent(new CustomEvent('porto_invitations_updated', { detail: list }));
  } catch (err) {
    console.error('Failed to save invitations list', err);
  }
};

export const getInvitationBySlug = (slug: string): InvitationData | null => {
  const list = getAllInvitations();
  const clean = String(slug || '').toLowerCase().trim();
  return list.find(inv => (inv.slug || '').toLowerCase().trim() === clean || inv.id === clean) || null;
};

export const getInvitationById = (id: string): InvitationData | null => {
  const list = getAllInvitations();
  return list.find(inv => inv.id === id) || null;
};

export const saveInvitation = (data: InvitationData): void => {
  const timestamp = new Date().toISOString();
  const withMeta: InvitationData = { ...data, updatedAt: timestamp };

  // 1. Immediate local save for snappy UI
  const localList = getAllInvitations();
  const localIdx = localList.findIndex(inv => inv.id === data.id || (data.slug && inv.slug === data.slug));
  let updatedLocalList: InvitationData[];
  if (localIdx >= 0) {
    updatedLocalList = [...localList];
    updatedLocalList[localIdx] = withMeta;
  } else {
    updatedLocalList = [withMeta, ...localList];
  }
  saveAllInvitations(updatedLocalList);

  // 2. Authoritative merge with cloud storage to prevent wiping out other clients' invitations
  storage.getItem<InvitationData[]>(STORAGE_LIST_KEY, null).then((cloudList) => {
    if (Array.isArray(cloudList) && cloudList.length > 0) {
      const cloudIdx = cloudList.findIndex(inv => inv.id === data.id || (data.slug && inv.slug === data.slug));
      let mergedList: InvitationData[];
      if (cloudIdx >= 0) {
        mergedList = [...cloudList];
        mergedList[cloudIdx] = withMeta;
      } else {
        mergedList = [withMeta, ...cloudList];
      }
      saveAllInvitations(mergedList);
    }
  }).catch((err) => {
    console.warn('[invitationData] Cloud merge fallback warning:', err);
  });

  try {
    localStorage.setItem(STORAGE_LEGACY_KEY, JSON.stringify(withMeta));
    storage.setItem(STORAGE_LEGACY_KEY, withMeta, true).catch(() => {});
    window.dispatchEvent(new CustomEvent('porto_invitation_updated', { detail: withMeta }));
  } catch {}
};

/**
 * Safely append guest RSVP without touching or risking other invitations in the cloud
 */
export const submitGuestRsvp = async (invitationIdOrSlug: string, rsvp: RSVP): Promise<boolean> => {
  try {
    let list = await storage.getItem<InvitationData[]>(STORAGE_LIST_KEY, []);
    if (!Array.isArray(list) || list.length === 0) {
      list = getAllInvitations();
    }
    const idx = list.findIndex(inv => inv.id === invitationIdOrSlug || inv.slug === invitationIdOrSlug);
    if (idx >= 0) {
      const target = list[idx];
      const existingRsvps = Array.isArray(target.rsvps) ? target.rsvps : [];
      const updatedTarget: InvitationData = {
        ...target,
        rsvps: [rsvp, ...existingRsvps],
        updatedAt: new Date().toISOString()
      };
      const nextList = [...list];
      nextList[idx] = updatedTarget;
      saveAllInvitations(nextList);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[invitationData] submitGuestRsvp failed:', err);
    return false;
  }
};

export const deleteInvitation = (id: string): void => {
  const list = getAllInvitations();
  const filtered = list.filter(inv => inv.id !== id);
  saveAllInvitations(filtered);
};

export const duplicateInvitation = (id: string): InvitationData => {
  const source = getInvitationById(id) || DEFAULT_INVITATION;
  const newId = `inv-${Date.now()}`;
  const randomSlugSuffix = Math.floor(Math.random() * 899) + 100;
  const newSlug = `${source.slug || 'undangan'}-${randomSlugSuffix}`;
  const duplicated: InvitationData = {
    ...source,
    id: newId,
    slug: newSlug,
    title: `${source.title} (Salinan)`,
    rsvps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveInvitation(duplicated);
  return duplicated;
};

export const createNewInvitation = (
  title?: string,
  eventType: 'universal' | 'exhibition' | 'wedding' | 'birthday' | 'conference' | 'event' = 'universal'
): InvitationData => {
  const id = `inv-${Date.now()}`;
  const slug = `undangan-${Date.now().toString().slice(-4)}`;

  const isExhibition = eventType === 'exhibition';
  const isWedding = eventType === 'wedding';
  const isBirthday = eventType === 'birthday';
  const isConference = eventType === 'conference';

  const defaultBadge = isExhibition ? 'EXHIBITION & EXPO' :
    isConference ? 'CONFERENCE & SUMMIT' :
    isBirthday ? 'BIRTHDAY CELEBRATION' :
    isWedding ? 'THE WEDDING OF' : 'OFFICIAL INVITATION';

  const defaultTitle = title || (
    isExhibition ? 'Modern Art & Design Expo 2026' :
    isConference ? 'Digital Tech Summit 2026' :
    isBirthday ? 'The 25th Birthday Celebration' :
    isWedding ? 'The Wedding of Arif & Nadia' : 'Undangan Acara Spesial'
  );

  const newInv: InvitationData = {
    ...DEFAULT_INVITATION,
    id,
    slug,
    eventType,
    categoryBadge: defaultBadge,
    title: defaultTitle,
    organizer: isWedding ? 'Keluarga Besar Pengantin' : 'Tim Penyelenggara & Panitia',
    description: isExhibition ? 'Menampilkan karya seni modern dan instalasi interaktif dari para kreator terkemuka.' :
      isConference ? 'Konferensi teknologi dan inovasi digital menghadirkan pembicara terkemuka dari berbagai industri.' :
      isWedding ? 'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan syukuran pernikahan kami.' :
      'Kami dengan bangga mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara istimewa ini.',
    navigationMode: 'vertical_scroll',
    bottomNavbarEnabled: true,
    navbarStyle: 'floating_glass',
    theme: isExhibition ? 'modern' : isConference ? 'luxury' : isWedding ? 'floral' : 'sage',
    clientAdminPassword: 'sumr',
    groom: {
      fullName: isWedding ? 'Nama Calon Pengantin Pria' : 'Tokoh Utama / Pembicara 1',
      nickname: isWedding ? 'Pria' : 'Tokoh 1',
      parents: isWedding ? 'Putra dari Bpk. ... & Ibu ...' : 'Keynote Speaker / Lead Artist',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    },
    bride: {
      fullName: isWedding ? 'Nama Calon Pengantin Wanita' : 'Tokoh Utama / Pembicara 2',
      nickname: isWedding ? 'Wanita' : 'Tokoh 2',
      parents: isWedding ? 'Putri dari Bpk. ... & Ibu ...' : 'Curator / Co-Host',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
    },
    akad: {
      title: isWedding ? 'Akad Nikah' : isExhibition ? 'Sesi 1: VIP & Press Opening' : 'Sesi 1: Registrasi & Pembukaan',
      time: '09:00 - 12:00 WIB',
      venue: 'Main Exhibition Hall',
      address: 'Jl. Sudirman No. 10, Jakarta Pusat',
      mapUrl: 'https://maps.google.com'
    },
    reception: {
      title: isWedding ? 'Resepsi Pernikahan' : isExhibition ? 'Sesi 2: Pameran Terbuka Umum' : 'Sesi 2: Seminar & Networking',
      time: '13:00 - 17:00 WIB',
      venue: 'Grand Ballroom & Gallery',
      address: 'Jl. Sudirman No. 10, Jakarta Pusat',
      mapUrl: 'https://maps.google.com'
    },
    quote: isWedding ? '"Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu..."' :
      '"Kreativitas dan inovasi adalah jembatan yang menghubungkan ide masa kini dengan mahakarya masa depan."',
    quoteSource: isWedding ? 'QS. Ar-Rum: 21' : 'Official Statement',
    galleryImages: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80'
    ],
    rsvps: [],
    guests: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveInvitation(newInv);
  return newInv;
};

// ── INTEGRASI KALENDER (Google Calendar & Apple / Outlook .ics) ──

export const generateGoogleCalendarUrl = (inv: InvitationData): string => {
  try {
    const rawDate = inv.eventDate ? inv.eventDate.replace(/-/g, '') : '20261128';
    const dates = `${rawDate}T010000Z/${rawDate}T070000Z`;
    const title = encodeURIComponent(inv.title || 'Wedding Event');
    const details = encodeURIComponent(`Undangan Pernikahan ${inv.groom.nickname} & ${inv.bride.nickname}. Lokasi: ${inv.reception.venue}, ${inv.reception.address}`);
    const location = encodeURIComponent(`${inv.reception.venue}, ${inv.reception.address}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  } catch {
    return 'https://calendar.google.com';
  }
};

export const downloadIcsFile = (inv: InvitationData): void => {
  try {
    const rawDate = inv.eventDate ? inv.eventDate.replace(/-/g, '') : '20261128';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//sumr.day//Wedding Invitation//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${rawDate}T080000`,
      `DTEND:${rawDate}T140000`,
      `SUMMARY:${inv.title || 'Wedding Event'}`,
      `DESCRIPTION:Pernikahan ${inv.groom.nickname} & ${inv.bride.nickname}\\nLokasi: ${inv.reception.venue}`,
      `LOCATION:${inv.reception.venue}, ${inv.reception.address}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${inv.slug || 'undangan'}-event.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download .ics', err);
  }
};

// ── BULK CSV IMPORT & EXPORT TAMU ──

export const parseGuestCsv = (csvText: string, invitationSlug: string): Guest[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const guests: Guest[] = [];
  // Skip header if first line has "nama" or "name"
  const startIdx = lines[0].toLowerCase().includes('nama') || lines[0].toLowerCase().includes('name') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts[0]) {
      const name = parts[0];
      const phone = parts[1] || '';
      const category = parts[2] || 'Teman';
      const quota = parseInt(parts[3] || '2', 10) || 2;
      const code = `QR-${(invitationSlug || 'INV').toUpperCase().slice(0, 6)}-${Math.floor(Math.random() * 8999 + 1000)}`;

      guests.push({
        id: `g-${Date.now()}-${i}`,
        name,
        phone,
        category,
        sent: false,
        qrSecretCode: code,
        hasCheckedIn: false,
        paxQuota: quota
      });
    }
  }

  return guests;
};

export const exportGuestCsv = (guests: Guest[]): void => {
  const headers = ['Nama Tamu', 'No WhatsApp', 'Kategori', 'Kuota Pax', 'Kode QR', 'Status Undangan', 'Status Checkin'];
  const rows = guests.map(g => [
    `"${g.name}"`,
    `"${g.phone || ''}"`,
    `"${g.category}"`,
    g.paxQuota || 2,
    `"${g.qrSecretCode}"`,
    g.sent ? '"Sudah Dikirim"' : '"Belum Dikirim"',
    g.hasCheckedIn ? `"Hadir (${g.checkedInAt || ''})"` : '"Belum Hadir"'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'daftar-tamu-undangan.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Legacy compatibility helpers
export const getInvitationData = (): InvitationData => {
  const list = getAllInvitations();
  return list[0] || DEFAULT_INVITATION;
};

export const saveInvitationData = (data: InvitationData): void => {
  saveInvitation(data);
};
