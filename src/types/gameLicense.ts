export type LicenseModel = 'rental' | 'lifetime'; // Sewa vs Beli Putus

export type ClientTier = 'view_only' | 'plus' | 'premium'; 
// view_only: hanya memainkan instance
// plus: dapat mengedit level game (layout level / puzzle)
// premium: kustomisasi visual penuh (UI/UX, gambar/sound lewat Cloudinary)

export interface GameVisualConfig {
  title?: string;
  brandName?: string;         // Nama Brand / Sponsor klien pada link instance
  themeColor?: string;
  heroBackgroundUrl?: string; // Cloudinary URL
  logoUrl?: string;           // Cloudinary URL
  soundtrackUrl?: string;     // Cloudinary URL
  welcomeMessage?: string;    // Pesan sambutan kustom khusus klien/event
  ctaText?: string;           // Teks Tombol Aksi Klien (misal: "Kunjungi Situs Sponsor", "Klaim Diskon")
  ctaUrl?: string;            // URL Tautan Tombol Aksi Klien
  webhookUrl?: string;        // Webhook Google Sheets / Notifikasi khusus link klien ini
  customCss?: string;
  customLevelJson?: string;
  customData?: Record<string, any>;
}

export type GamePricingTier = 'free' | 'basic' | 'plus' | 'premium';

export interface GameEventSpecs {
  estimatedDuration?: string; // misal: "30 - 60 Detik / Pemain"
  leaderboardCapacity?: string; // misal: "Top 10 / 50 Peserta"
  deviceSupport?: string; // misal: "Touchscreen Kiosk, Tablet & Laptop"
}

export interface GameInputSpecs {
  requireCamera?: boolean;       // Akses Kamera / Webcam (Photo booth, AR, Gesture)
  requireMicrophone?: boolean;   // Akses Mikrofon (Voice / Shout game)
  requireTouchTap?: boolean;     // Touch / Tap / Klik Layar
  requireKeyboard?: boolean;     // Keyboard / Controller / Tombol PC
  sessionDurationSec?: number;   // Durasi game per sesi dalam detik (misal: 45)
  maxTargetScore?: number;       // Target Skor Maksimal (misal: 1000)
  instructionText?: string;      // Teks instruksi kustom
}

export interface GameInstance {
  id: string;
  title: string;
  slug: string;
  appType?: 'web_app' | 'game' | 'kiosk' | 'utility' | 'quiz' | 'calculator'; // Klasifikasi tipe modul
  description?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string; // Video MP4/WebM/Cloudinary preview
  engineType: string;
  category?: string; // Label kategori utama (misal: "Event", "Exhibition", "Corporate", "Utilitas")
  tags?: string[]; // Dynamic Tags/Labels (misal: ["Ramadhan", "E-Sport", "Interactive", "Web App"])
  pricingTier?: GamePricingTier; // 'free' | 'basic' | 'plus' | 'premium'
  eventSpecs?: GameEventSpecs;
  inputSpecs?: GameInputSpecs; // Pengaturan Input, Sensor Kamera/Mic, & Kontrol
  defaultConfig: GameVisualConfig;
  htmlContent?: string;        // Kode HTML5 Single File game buatan AI / studio
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export type AdminGameRole = 'master' | 'supplier' | 'view_only';
// 1. master: Admin Seting Master (Tampilan/branding, game final beda user beda branding, data game, & atur hak admin supplier)
// 2. supplier: Admin Seting Supplier (Hanya seting tampilan branding dan data level/konten permainan)
// 3. view_only: Mode View Only (Hanya dapat memainkan game tanpa akses mengubah konfigurasi)

export interface ClientGameLicense {
  id: string;              // unique ID (e.g. `${clientId}_${gameId}`)
  clientId: string;        // ID / Email of the client user from ClientUser
  clientEmail: string;
  clientName: string;
  customTitle?: string;    // Judul kustom untuk link ini (misal: "Simulasi Finansial Bank Mandiri")
  gameId: string;
  gameTitle: string;
  model: LicenseModel;     // 'rental' or 'lifetime'
  tier: ClientTier;        // 'view_only' | 'plus' | 'premium'
  adminRole?: AdminGameRole; // 'master' | 'supplier' | 'view_only'
  startDate: number;       // timestamp
  expiryDate?: number | null; // null if lifetime, or timestamp if rental
  status: 'active' | 'expired' | 'suspended';
  customConfig?: GameVisualConfig; // Config spesifik yang di-override oleh klien / admin
  createdAt: number;
  updatedAt: number;
}
