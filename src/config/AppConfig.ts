/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                    APP CONFIGURATION                        ║
 * ║          Satu Titik Kontrol untuk Semua Layanan             ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Mendukung Multi-Deploy Target secara otomatis tanpa        ║
 * ║  saling menimpa data konfigurasi penyimpanan / server!     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import deployTargets from '../../deploy-targets.json';

export interface DeployTarget {
  id: string;
  name: string;
  projectId: string;
  apiKey?: string;
  appId?: string;
  storagePrefix?: string;
  messagingSenderId?: string;
  measurementId?: string;
  cloudinaryName?: string;
  cloudinaryPreset?: string;
  sheetId?: string;
  appsScriptUrl?: string;
  geminiApiKey?: string;
}

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

/**
 * Resolves the active deploy target:
 * 1. Checks window.location.hostname against project IDs and domains
 * 2. Checks import.meta.env.VITE_FIREBASE_PROJECT_ID
 * 3. Falls back to target-sumrday as primary default
 */
export const getActiveDeployTarget = (): DeployTarget => {
  const targets: DeployTarget[] = (deployTargets as DeployTarget[]) || [];

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    // 1. Direct match on hostname (e.g. sumr-day.web.app or websiteagenzie.web.app)
    const hostMatch = targets.find(t => {
      if (!t.projectId) return false;
      const pid = t.projectId.toLowerCase();
      const sanitizedName = (t.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return host.includes(pid) || (sanitizedName && host.includes(sanitizedName));
    });
    if (hostMatch) return hostMatch;
  }

  // 2. Build-time or local environment project match
  const envProject = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (envProject) {
    const envMatch = targets.find(t => t.projectId.toLowerCase() === envProject.toLowerCase());
    if (envMatch) return envMatch;
  }

  // 3. Fallback to sumr-day default
  return targets[0] || {
    id: 'target-sumrday',
    name: 'sumr.day (Utama)',
    projectId: 'sumr-day',
    apiKey: 'AIzaSyA0ebREB9RCSE14pOptxhrtqm3YpQns2co',
    appId: '1:333413040741:web:03cd168046d95d72d33c8c',
    storagePrefix: 'sumrday',
    messagingSenderId: '333413040741',
    measurementId: 'G-N8LQKJKXCN'
  };
};

const activeTarget = getActiveDeployTarget();

const env = (key: string, fallback: string = ''): string => {
  if (typeof window !== 'undefined') {
    try {
      const overrides = getEnvOverrides();
      if (overrides[key] !== undefined && overrides[key] !== '') {
        return overrides[key];
      }
    } catch {}
  }
  const metaVal = import.meta.env[key] as string | undefined;
  if (metaVal !== undefined && metaVal !== '') {
    return metaVal;
  }
  return fallback;
};

// ─────────────────────────────────────────────────────────────────────────────
//  🔥 FIREBASE
// ─────────────────────────────────────────────────────────────────────────────
export const FIREBASE_CONFIG = {
  apiKey:            env('VITE_FIREBASE_API_KEY',            activeTarget.apiKey || ''),
  authDomain:        env('VITE_FIREBASE_AUTH_DOMAIN',        `${activeTarget.projectId}.firebaseapp.com`),
  projectId:         env('VITE_FIREBASE_PROJECT_ID',         activeTarget.projectId),
  storageBucket:     env('VITE_FIREBASE_STORAGE_BUCKET',     `${activeTarget.projectId}.firebasestorage.app`),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID',activeTarget.messagingSenderId || ''),
  appId:             env('VITE_FIREBASE_APP_ID',             activeTarget.appId || ''),
  measurementId:     env('VITE_FIREBASE_MEASUREMENT_ID',     activeTarget.measurementId || ''),
} as const;

// Targets pool for smart fallback across environments
const targetsPool: DeployTarget[] = (deployTargets as DeployTarget[]) || [];
const sharedCloudinaryTarget = targetsPool.find(t => t.cloudinaryName) || targetsPool[1] || targetsPool[0];
const sharedGoogleTarget = targetsPool.find(t => t.sheetId && t.appsScriptUrl) || targetsPool[1] || targetsPool[0];

// ─────────────────────────────────────────────────────────────────────────────
//  🖼️  CLOUDINARY
// ─────────────────────────────────────────────────────────────────────────────
export const CLOUDINARY_CONFIG = {
  cloudName:    env('VITE_CLOUDINARY_NAME',   activeTarget.cloudinaryName || sharedCloudinaryTarget?.cloudinaryName || 'dlvjat7lg'),
  uploadPreset: env('VITE_CLOUDINARY_PRESET', activeTarget.cloudinaryPreset || sharedCloudinaryTarget?.cloudinaryPreset || 'ml_default'),
  baseUrl: 'https://res.cloudinary.com',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  📊 GOOGLE SERVICES
// ─────────────────────────────────────────────────────────────────────────────
export const GOOGLE_CONFIG = {
  appsScriptUrl: env('VITE_GOOGLE_APPS_SCRIPT_URL', activeTarget.appsScriptUrl || sharedGoogleTarget?.appsScriptUrl || ''),
  sheetId:       env('VITE_GOOGLE_SHEET_ID',       activeTarget.sheetId || sharedGoogleTarget?.sheetId || ''),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  🤖 AI / GEMINI
// ─────────────────────────────────────────────────────────────────────────────
export const AI_CONFIG = {
  geminiApiKey: env('VITE_GEMINI_API_KEY', activeTarget.geminiApiKey || ''),
  priorityModels: [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-flash-latest',
  ],
  defaultMaxTokens: 1000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  🏢 APP / BRAND
// ─────────────────────────────────────────────────────────────────────────────
export const APP_CONFIG = {
  name:        env('VITE_APP_NAME',    activeTarget.name || 'sumr.day'),
  tagline:     env('VITE_APP_TAGLINE', 'A little sunshine for your screen'),
  domain:      env('VITE_APP_DOMAIN',  `https://${activeTarget.projectId}.web.app`),
  timezone:    'Asia/Jakarta',
  locale:      'id-ID',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  🔑 STORAGE KEYS
// ─────────────────────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  prefix:          env('VITE_STORAGE_PREFIX', activeTarget.storagePrefix || 'sumrday'),
  settings:        'porto_settings',
  mediaGallery:    'porto_media_gallery',
  geminiKey:       'GEMINI_API_KEY',
  cachedModel:     'porto_cached_gemini_model',
} as const;

const AppConfig = {
  firebase:    FIREBASE_CONFIG,
  cloudinary:  CLOUDINARY_CONFIG,
  google:      GOOGLE_CONFIG,
  ai:          AI_CONFIG,
  app:         APP_CONFIG,
  storageKeys: STORAGE_KEYS,
  activeTarget: activeTarget,
} as const;

export default AppConfig;
