/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                    APP CONFIGURATION                        ║
 * ║          Satu Titik Kontrol untuk Semua Layanan             ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Edit file ini saja untuk deploy ke project/klien baru!    ║
 * ║  Urutan prioritas:                                          ║
 * ║  1. File .env (VITE_*)   → untuk production CI/CD          ║
 * ║  2. Nilai hardcode di bawah → fallback / development       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─── Helpers ────────────────────────────────────────────────────────────────
export const getEnvOverrides = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('porto_env_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveEnvOverrides = (updates: Record<string, string>): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getEnvOverrides();
    const next = { ...current, ...updates };
    localStorage.setItem('porto_env_overrides', JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save env overrides:', e);
  }
};

const env = (key: string, fallback: string = ''): string => {
  if (typeof window !== 'undefined') {
    try {
      const overrides = getEnvOverrides();
      if (overrides[key] !== undefined && overrides[key] !== '') {
        return overrides[key];
      }
    } catch {}
  }
  return (import.meta.env[key] as string | undefined) || fallback;
};

// ─────────────────────────────────────────────────────────────────────────────
//  🔥 FIREBASE
//  Project: https://console.firebase.google.com/project/websiteagenzie
// ─────────────────────────────────────────────────────────────────────────────
export const FIREBASE_CONFIG = {
  apiKey:            env('VITE_FIREBASE_API_KEY',            'AIzaSyAHO3ImKaomLGyywH9bukut7QpG-ETxAdg'),
  authDomain:        env('VITE_FIREBASE_AUTH_DOMAIN',        'websiteagenzie.firebaseapp.com'),
  projectId:         env('VITE_FIREBASE_PROJECT_ID',         'websiteagenzie'),
  storageBucket:     env('VITE_FIREBASE_STORAGE_BUCKET',     'websiteagenzie.firebasestorage.app'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID','434116660065'),
  appId:             env('VITE_FIREBASE_APP_ID',             '1:434116660065:web:4c53914345bf75bd645320'),
  measurementId:     env('VITE_FIREBASE_MEASUREMENT_ID',     'G-CVSGZLLJ0K'),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  🖼️  CLOUDINARY
//  Dashboard: https://cloudinary.com/console
// ─────────────────────────────────────────────────────────────────────────────
export const CLOUDINARY_CONFIG = {
  cloudName:    env('VITE_CLOUDINARY_NAME',   'mutwtddt'),
  uploadPreset: env('VITE_CLOUDINARY_PRESET', 'ml_default'),
  /** URL base CDN — jangan ubah kecuali pindah region */
  baseUrl: 'https://res.cloudinary.com',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  📊 GOOGLE SERVICES
//  - Apps Script  : https://script.google.com
//  - Sheet ID     : ID di URL Google Sheets (bukan nama sheet)
// ─────────────────────────────────────────────────────────────────────────────
export const GOOGLE_CONFIG = {
  /**
   * URL deployment Google Apps Script (berakhiran /exec).
   * Kosongkan jika tidak pakai Google Sheets sync.
   */
  appsScriptUrl: env('VITE_GOOGLE_APPS_SCRIPT_URL', ''),

  /**
   * ID Google Spreadsheet (opsional, dipakai jika Ada integrasi langsung).
   * Contoh: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms'
   */
  sheetId: env('VITE_GOOGLE_SHEET_ID', ''),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  🤖 AI / GEMINI
//  Key: https://aistudio.google.com/app/apikey
// ─────────────────────────────────────────────────────────────────────────────
export const AI_CONFIG = {
  geminiApiKey: env('VITE_GEMINI_API_KEY', 'AIzaSyD9bBc6wuuR_clv28jF4sUI4LN627yw9h4'),

  /** Model priority list — urutan pertama = dicoba pertama */
  priorityModels: [
    'gemini-2.5-flash',       // Utama — cepat, stabil, support v1beta
    'gemini-3.5-flash',       // Generasi terbaru
    'gemini-flash-latest',    // Alias auto-update Google
  ],

  /** Max output tokens default */
  defaultMaxTokens: 1000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  🏢 APP / BRAND
//  Identitas aplikasi untuk PWA, meta tag, dll.
// ─────────────────────────────────────────────────────────────────────────────
export const APP_CONFIG = {
  name:        env('VITE_APP_NAME',    'sumr.day'),
  tagline:     env('VITE_APP_TAGLINE', 'A little sunshine for your screen'),
  /** Domain produksi (tanpa trailing slash) */
  domain:      env('VITE_APP_DOMAIN',  'https://sumrday.web.app'),
  /** Zona waktu default untuk format tanggal */
  timezone:    'Asia/Jakarta',
  /** Kode bahasa default */
  locale:      'id-ID',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  🔑 STORAGE KEYS  (localStorage / IndexedDB)
//  Ganti prefix jika deploy ke klien baru agar data tidak cross-contaminate
// ─────────────────────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  prefix:          env('VITE_STORAGE_PREFIX', 'porto'),
  settings:        'porto_settings',
  mediaGallery:    'porto_media_gallery',
  geminiKey:       'GEMINI_API_KEY',
  cachedModel:     'porto_cached_gemini_model',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  📦 EXPORT DEFAULT  (semua config dalam satu objek)
// ─────────────────────────────────────────────────────────────────────────────
const AppConfig = {
  firebase:    FIREBASE_CONFIG,
  cloudinary:  CLOUDINARY_CONFIG,
  google:      GOOGLE_CONFIG,
  ai:          AI_CONFIG,
  app:         APP_CONFIG,
  storageKeys: STORAGE_KEYS,
} as const;

export default AppConfig;
