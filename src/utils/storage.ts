import { doc, getDoc, setDoc, collection, onSnapshot, deleteField, type DocumentReference, type Unsubscribe } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { get, set, del, clear, entries } from 'idb-keyval';
import { applyAccentColor } from './theme';
import { GOOGLE_CONFIG, CLOUDINARY_CONFIG, AI_CONFIG, STORAGE_KEYS } from '../config/AppConfig';

/**
 * Enrich settings object with values from environment variables (.env)
 * Prioritizes .env values so that configurations like Apps Script URL, Sheet ID, etc.
 * always reliably source from .env
 */
const enrichSettingsWithEnv = (settings: any): any => {
  const s = (settings && typeof settings === 'object') ? { ...settings } : {};
  // PENTING: Hanya berikan fallback jika nilai BELUM PERNAH disetel/disimpan oleh pengguna di database,
  // agar konfigurasi server penyimpanan di setiap website tidak tertimpa/berubah saat ada pembaruan kode.
  if (!s.googleAppsScriptUrl && GOOGLE_CONFIG.appsScriptUrl) {
    s.googleAppsScriptUrl = GOOGLE_CONFIG.appsScriptUrl;
  }
  if (!s.googleSheetId && GOOGLE_CONFIG.sheetId) {
    s.googleSheetId = GOOGLE_CONFIG.sheetId;
  }
  if (!s.cloudinaryName && CLOUDINARY_CONFIG.cloudName) {
    s.cloudinaryName = CLOUDINARY_CONFIG.cloudName;
  }
  if (!s.cloudinaryPreset && CLOUDINARY_CONFIG.uploadPreset) {
    s.cloudinaryPreset = CLOUDINARY_CONFIG.uploadPreset;
  }
  if (!s.geminiApiKey && AI_CONFIG.geminiApiKey) {
    s.geminiApiKey = AI_CONFIG.geminiApiKey;
  }
  return s;
};

/**
 * Deep merge helper to prevent partial writes from erasing nested configurations
 */
const deepMerge = (target: any, source: any): any => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return source !== undefined ? source : target;
  }
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    return { ...source };
  }
  const output = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (srcVal !== undefined) {
      if (srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal) && tgtVal !== null && typeof tgtVal === 'object' && !Array.isArray(tgtVal)) {
        output[key] = deepMerge(tgtVal, srcVal);
      } else {
        output[key] = srcVal;
      }
    }
  }
  return output;
};

/**
 * Clean data helper to sanitize data for Firestore & prevent quota overflow
 * Strips undefined, functions, and prevents gigantic base64 payloads (>100KB) from bloating Firestore
 */
const cleanData = (obj: any, isRoot: boolean = true): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'number') {
    if (isNaN(obj) || !isFinite(obj)) return 0;
    return obj;
  }
  if (obj instanceof Date) {
    return isNaN(obj.getTime()) ? new Date().toISOString() : obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item, false)).filter(v => v !== undefined);
  }
  if (typeof obj === 'string') {
    // If it's an excessively huge raw base64 string (>150KB) in Firestore sync payload, sanitize to prevent Firestore 1MB quota breach
    if ((obj.startsWith('data:image/') || obj.startsWith('data:application/')) && obj.length > 150000) {
      console.warn('[Storage] Oversized base64 media stripped from cloud payload to protect Firestore 1MB quota. Please upload via Cloudinary.');
      return '';
    }
    return obj;
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([k, v]) => Boolean(k) && v !== undefined && typeof v !== 'function')
        .map(([k, v]) => [k, cleanData(v, false)])
    );
  }
  return obj;
};

const COLLECTION = 'cms';
const DOCUMENT = 'data';

// Map specific high-volume keys to dedicated sub-documents (Ultra-Isolated Partitions)
const KEY_PARTITION_MAP: Record<string, string> = {
  porto_pages: 'data_pages',
  porto_blogs: 'data_website',
  porto_blog_posts: 'data_website',
  porto_memos: 'data_notes',
  porto_memo_notes: 'data_notes',
  porto_memo_folders: 'data_notes',
  porto_whiteboard_canvases: 'data_notes',
  porto_projects: 'data_projects',
  porto_project_templates: 'data_projects',
  porto_project_categories: 'data_projects',
  porto_kanban_columns: 'data_projects',
  porto_catalog: 'data_shop',
  porto_shop_items: 'data_shop',
  porto_shop_products: 'data_shop',
  porto_shop_orders: 'data_shop',
  porto_shop_categories: 'data_shop',
  porto_transactions: 'data_transactions',
  porto_stickers: 'data_stickers',
  porto_frames: 'data_frames',
  porto_bookings: 'data_bookings',
  porto_booking_settings: 'data_bookings',
  porto_links: 'data_links',
  porto_users: 'data_users',
  porto_media_gallery: 'data_media',
  porto_media_folders: 'data_media',
  porto_main_website: 'data_website',
  porto_articles: 'data_website',
  porto_testimonials: 'data_website',
  porto_services: 'data_website',
  porto_faq: 'data_website',
  porto_custom_code: 'data_website',
  porto_analytics: 'data_analytics',
  porto_visitor_stats: 'data_analytics',
  porto_login_audit_logs: 'data_analytics',
  porto_activity_logs: 'data_analytics',
  porto_marketing_broadcasts: 'data_marketing',
  porto_notifications: 'data_marketing',
  porto_messages: 'data_messages',
  porto_contact_inbox: 'data_messages',
  porto_custom_games: 'data_games',
  porto_game_licenses: 'data_games',
  porto_game_dynamic_tags: 'data_games',
  porto_rate_cards: 'data_ratecards',
  porto_rate_card_addons: 'data_ratecards',
  porto_ratecard_categories: 'data_ratecards',
  porto_ratecard_badges: 'data_ratecards',
  porto_ratecard_category_colors: 'data_ratecards',
  porto_client_reviews: 'data_reviews',
  porto_client_feedbacks: 'data_reviews',
  porto_client_faqs: 'data_reviews',
  porto_forms: 'data_forms',
  porto_form_responses: 'data_forms',
  porto_social_updates: 'data_social',
  porto_business_profile: 'data_business',
  porto_trx_customers: 'data_transactions',
  porto_shop_settings: 'data_shop',
  porto_catalog_products: 'data_shop',
  porto_media_vault: 'data_media',
  porto_vault_folders: 'data_media',
  porto_reviews: 'data_reviews',
  porto_faqs: 'data_reviews',
  porto_rate_card: 'data_ratecards',
  porto_affiliate_withdrawals: 'data_affiliates',
  porto_portfolio: 'data_projects',
  porto_project_revisions: 'data_projects',
  porto_blog: 'data_website',
  porto_blog_featured: 'data_website',
  porto_blog_categories: 'data_website',
  porto_catalog_categories: 'data_shop',
  porto_catalog_vouchers: 'data_shop',
  porto_trx_discounts: 'data_transactions',
  porto_trx_settings: 'data_transactions',
  porto_chat_messages: 'data_messages',
  porto_contacts: 'data_messages',
  porto_games_data: 'data_games',
  porto_biodata: 'data_business',
  porto_invitations_list: 'data_website',
  porto_invitation_maker_data: 'data_website',
  porto_invitations: 'data_website',
  porto_leads: 'data_marketing',
  porto_studio_inquiries: 'data_marketing',
  porto_customers: 'data_transactions',
  porto_pricing: 'data_ratecards',
  porto_flash_sales: 'data_shop',
  porto_flashsale_active: 'data_shop',
  porto_contracts_spk: 'data_projects',
  porto_partnerships: 'data_business',
  porto_client_vault_files: 'data_media',
  porto_proofing_reviews: 'data_projects',
  porto_whatsapp_templates: 'data_marketing',
  porto_project_reminders: 'data_projects',
  porto_client_flipbooks: 'data_media',
  porto_proofing_projects: 'data_projects',
  porto_brand_vaults: 'data_media',
  porto_retainers: 'data_business',
  porto_content_plans: 'data_marketing',
  porto_crm_leads: 'data_marketing',
  porto_quick_todos: 'data_notes',
  porto_kanban_deliverables: 'data_projects',
  porto_custom_pages: 'data_pages'
};

// Aliases for bidirectional synchronization across modules and legacy key variations
const CROSS_SYNC_ALIASES: Record<string, string[]> = {
  porto_blog_posts: ['porto_blogs', 'porto_blog'],
  porto_blogs: ['porto_blog_posts', 'porto_blog'],
  porto_blog: ['porto_blog_posts', 'porto_blogs'],
  porto_catalog_products: ['porto_catalog', 'porto_shop_products'],
  porto_catalog: ['porto_catalog_products', 'porto_shop_products'],
  porto_shop_products: ['porto_catalog_products', 'porto_catalog'],
  porto_custom_games: ['porto_games_data'],
  porto_games_data: ['porto_custom_games'],
  porto_memo_notes: ['porto_memos'],
  porto_memos: ['porto_memo_notes'],
  porto_studio_inquiries: ['porto_leads'],
  porto_leads: ['porto_studio_inquiries'],
  porto_flash_sales: ['porto_flashsale_active'],
  porto_flashsale_active: ['porto_flash_sales'],
  porto_trx_customers: ['porto_customers'],
  porto_customers: ['porto_trx_customers'],
  porto_client_reviews: ['porto_reviews'],
  porto_reviews: ['porto_client_reviews'],
  porto_client_faqs: ['porto_faqs'],
  porto_faqs: ['porto_client_faqs'],
  porto_rate_cards: ['porto_rate_card'],
  porto_rate_card: ['porto_rate_cards']
};

// Canonical primary key for each alias group to prevent 2x-3x payload duplication inside the same Firestore document
const CANONICAL_KEY_MAP: Record<string, string> = {
  porto_blogs: 'porto_blog_posts',
  porto_blog: 'porto_blog_posts',
  porto_catalog: 'porto_catalog_products',
  porto_shop_products: 'porto_catalog_products',
  porto_games_data: 'porto_custom_games',
  porto_memos: 'porto_memo_notes',
  porto_leads: 'porto_studio_inquiries',
  porto_flashsale_active: 'porto_flash_sales',
  porto_customers: 'porto_trx_customers',
  porto_reviews: 'porto_client_reviews',
  porto_faqs: 'porto_client_faqs',
  porto_rate_card: 'porto_rate_cards'
};

/**
 * Strict Database Isolation & Sanitization Guard
 * Guarantees collections never get mixed up or corrupted by malformed data.
 */
export const sanitizeDatabaseCollection = (key: string, value: any): any => {
  if (value === null || value === undefined) return value;

  // Special handling for porto_links which can be { profile, links: [...], theme } or an array of link items
  if (key === 'porto_links') {
    let targetObj = value;
    // Self-heal if previously wrapped into a 1-element array [{ profile, links: [...] }]
    if (Array.isArray(value) && value.length === 1 && value[0] && typeof value[0] === 'object' && Array.isArray(value[0].links)) {
      targetObj = value[0];
    }
    if (targetObj && typeof targetObj === 'object' && !Array.isArray(targetObj) && Array.isArray(targetObj.links)) {
      const cleanLinks = targetObj.links.filter((item: any) => item !== null && item !== undefined && typeof item === 'object');
      const seenLinkIds = new Set<string>();
      const dedupLinks: any[] = [];
      for (const item of cleanLinks) {
        const lid = item.id ? String(item.id) : '';
        if (lid) {
          if (!seenLinkIds.has(lid)) {
            seenLinkIds.add(lid);
            dedupLinks.push(item);
          }
        } else {
          dedupLinks.push(item);
        }
      }
      return { ...targetObj, links: dedupLinks };
    }
    if (Array.isArray(targetObj)) {
      return targetObj.filter((item: any) => item !== null && item !== undefined && typeof item === 'object');
    }
    return targetObj;
  }

  // 1. Array-based collections must strictly be arrays
  const ARRAY_COLLECTIONS = new Set([
    'porto_portfolio',
    'porto_projects',
    'porto_proofing_projects',
    'porto_catalog_products',
    'porto_catalog',
    'porto_shop_products',
    'porto_blog_posts',
    'porto_blogs',
    'porto_blog',
    'porto_client_flipbooks',
    'porto_memos',
    'porto_memo_notes',
    'porto_forms',
    'porto_media_vault',
    'porto_media_gallery',
    'porto_client_reviews',
    'porto_reviews',
    'porto_client_feedbacks',
    'porto_client_faqs',
    'porto_faqs',
    'porto_rate_cards',
    'porto_rate_card',
    'porto_transactions',
    'porto_users',
    'porto_custom_games',
    'porto_games_data'
  ]);

  if (ARRAY_COLLECTIONS.has(key)) {
    let arr: any[] = [];
    if (Array.isArray(value)) {
      arr = value;
    } else if (typeof value === 'object' && value !== null) {
      // If caller wrapped it in an object like { items: [...] } or { data: [...] }
      if (Array.isArray(value.items)) arr = value.items;
      else if (Array.isArray(value.data)) arr = value.data;
      else if (Array.isArray(value.links)) arr = value.links;
      else if (Array.isArray(value.products)) arr = value.products;
      else if (Array.isArray(value.posts)) arr = value.posts;
      else arr = [value];
    } else {
      arr = [];
    }

    // Clean out nulls, undefined, and non-objects
    arr = arr.filter(item => item !== null && item !== undefined && typeof item === 'object');

    // Normalize media URLs if a CloudinaryMediaResult object was accidentally stored as item.url
    if (key === 'porto_media_vault' || key === 'porto_media_gallery') {
      arr = arr.map(item => {
        if (item.url && typeof item.url === 'object' && typeof item.url.url === 'string') {
          return { ...item, url: item.url.url };
        }
        return item;
      }).filter(item => typeof item.url === 'string' && item.url.trim().length > 0);
    }

    // ── ISOLATION GUARD: porto_portfolio VS porto_projects ──
    if (key === 'porto_portfolio') {
      // Filter out any proofing / kanban files that leaked by mistake
      arr = arr.filter(item => {
        const idStr = String(item.id || '');
        const isProofing = idStr.startsWith('PRF-') || 
                           item.proofingWatermarkStyle !== undefined || 
                           item.proofingImages !== undefined || 
                           item.isPasswordProtected !== undefined ||
                           item.clientPhone !== undefined;
        return !isProofing;
      });
    }

    // ── DEDUPLICATION GUARD ──
    const seenIds = new Set<string>();
    const deduplicated: any[] = [];
    for (const item of arr) {
      const id = item.id || item.slug;
      if (id) {
        const idKey = String(id);
        if (!seenIds.has(idKey)) {
          seenIds.add(idKey);
          deduplicated.push(item);
        }
      } else {
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }

  return value;
};

export type StorageEngineType = 'drive_first' | 'hybrid' | 'offline';

export function getStorageEngine(): StorageEngineType {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('porto_storage_engine') as StorageEngineType;
    if (saved === 'hybrid' || saved === 'offline' || saved === 'drive_first') return saved;
  }
  return 'hybrid';
}

export function setStorageEngine(engine: StorageEngineType): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('porto_storage_engine', engine);
    window.dispatchEvent(new CustomEvent('porto_storage_engine_changed', { detail: { engine } }));
  }
}

let currentUid: string | null = null;
let currentScope: 'global' | 'private' = 'global';

// ── Accent Color Debounce Lock ──
// Prevents competing Firestore snapshots from flickering the accent color back and forth.
// Only the most-recently user-set color (via setItem) is authoritative.
let _accentLockUntil = 0;
const ACCENT_LOCK_MS = 1500; // 1.5s lock after any user-driven change

function _applyAccentIfAllowed(cloudAccent: string): void {
  if (Date.now() < _accentLockUntil) return; // user just changed it — don't overwrite
  const current = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null;
  if (current === cloudAccent) return; // already same, skip
  
  // Accept the cloud accent color (this ensures all devices sync to the same theme)
  localStorage.setItem('porto_accent_color', cloudAccent);
  applyAccentColor(cloudAccent);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('porto_accent_color_changed', { detail: { color: cloudAccent } }));
  }
}

let syncChannel: BroadcastChannel | null = null;
if (typeof BroadcastChannel !== 'undefined') {
  syncChannel = new BroadcastChannel('sumrday_sync_channel');
  syncChannel.onmessage = (event) => {
    if (event.data && event.data.type === 'SYNC') {
      const { key, value } = event.data;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('porto_bg_synced', { detail: { key, value } }));
      }
    }
  };
}

const _offlinePendingKeys = new Set<string>();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Storage] Network is online. Resuming cloud synchronization...');
    window.dispatchEvent(new CustomEvent('porto_network_status', { detail: { online: true } }));
    if (_offlinePendingKeys.size > 0) {
      storage.flushOfflineQueue().catch(err => console.warn('[Storage] Flush offline queue error:', err));
    }
  });

  window.addEventListener('offline', () => {
    console.warn('[Storage] Network is offline. Offline fallback active.');
    window.dispatchEvent(new CustomEvent('porto_network_status', { detail: { online: false } }));
  });

  window.addEventListener('beforeunload', () => {
    storage.flushAllPendingWrites().catch(() => {});
  });

  window.addEventListener('pagehide', () => {
    storage.flushAllPendingWrites().catch(() => {});
  });

  // ── Smart Multi-Device Focus Sync (Auto-Sync saat buka HP/Laptop - Admin Only) ──
  let _lastFocusSyncTime = 0;
  const _triggerAutoFocusSync = () => {
    if (typeof window === 'undefined' || !window.location.pathname.startsWith('/admin')) return;
    const now = Date.now();
    // Throttle minimal 60 detik sekali agar tidak membebani server
    if (now - _lastFocusSyncTime < 60000) return;
    _lastFocusSyncTime = now;
    window.dispatchEvent(new CustomEvent('porto_request_drive_sync'));
  };

  window.addEventListener('focus', _triggerAutoFocusSync);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      _triggerAutoFocusSync();
    }
  });
}

export interface StorageUsage {
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
}

export const storage = {
  _docCache: {} as Record<string, any>,
  _docCacheTime: {} as Record<string, number>,
  _inFlightGetDoc: {} as Record<string, Promise<any> | null>,
  _lastWrittenCache: {} as Record<string, string>,
  _lastLocalWriteTime: {} as Record<string, number>,
  _lastBackgroundSyncTime: {} as Record<string, number>,
  _writeDebounceTimers: {} as Record<string, any>,
  _pendingCloudPayloads: {} as Record<string, any>,
  _memCache: new Map<string, { value: any; timestamp: number }>(),
  _docListeners: {} as Record<string, {
    unsub: Unsubscribe;
    callbacks: Map<string, (docData: any) => void>;
    graceTimer: any;
  }>,

  /**
   * Background storage auto-pruner for cleaning temp files, expired cache, deduplicating media, and capping logs
   */
  async autoPruneStorage(): Promise<{ prunedCount: number; savedBytes: number }> {
    let prunedCount = 0;
    let savedBytes = 0;
    try {
      const allEntries = await entries();
      const now = Date.now();
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

      for (const [k, v] of allEntries) {
        const keyStr = String(k);
        // Remove nullified tombstone keys left over in IndexedDB
        if (v === null || v === undefined) {
          await del(k).catch(() => {});
          prunedCount++;
          continue;
        }
        // Prune stale drafts/temp
        if (keyStr.startsWith('temp_') || keyStr.startsWith('draft_')) {
          if (typeof v === 'object' && (!v.updatedAt || (now - v.updatedAt > ONE_WEEK_MS))) {
            try { savedBytes += JSON.stringify(v).length * 2; } catch {}
            await del(k).catch(() => {});
            prunedCount++;
          }
        }
      }

      // Clean redundant localStorage idb_fallback_* keys that are already safely stored in IndexedDB
      if (typeof localStorage !== 'undefined') {
        const lsKeysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const lk = localStorage.key(i);
          if (lk && lk.startsWith('idb_fallback_')) {
            const rawIdbKey = lk.replace(/^idb_fallback_/, '');
            const idbVal = await get(rawIdbKey).catch(() => undefined);
            if (idbVal !== undefined && idbVal !== null) {
              lsKeysToRemove.push(lk);
            }
          }
        }
        for (const lk of lsKeysToRemove) {
          try {
            const valStr = localStorage.getItem(lk) || '';
            savedBytes += valStr.length * 2;
            localStorage.removeItem(lk);
            prunedCount++;
          } catch {}
        }
      }

      // Deduplicate & compact media collections (porto_media_gallery & porto_media_vault)
      for (const mediaKey of ['porto_media_gallery', 'porto_media_vault']) {
        const localMKey = this._getLocalKey(mediaKey);
        const rawMedia = await get(localMKey);
        if (Array.isArray(rawMedia) && rawMedia.length > 1) {
          const seenUrls = new Set<string>();
          const deduped = rawMedia.filter((item: any) => {
            if (!item || typeof item !== 'object') return false;
            const url = typeof item.url === 'string' ? item.url.trim() : '';
            if (!url || seenUrls.has(url)) return false;
            seenUrls.add(url);
            return true;
          });
          if (deduped.length < rawMedia.length) {
            try {
              savedBytes += (JSON.stringify(rawMedia).length - JSON.stringify(deduped).length) * 2;
            } catch {}
            await set(localMKey, deduped).catch(() => {});
            this._memCache.set(localMKey, { value: deduped, timestamp: Date.now() });
            prunedCount += (rawMedia.length - deduped.length);
          }
        }
      }

      // Cap activity logs to recent 100 entries to prevent memory / storage bloat
      const logsKey = this._getLocalKey('porto_activity_logs');
      const logs = await get(logsKey);
      if (Array.isArray(logs) && logs.length > 100) {
        const trimmedLogs = logs.slice(0, 100);
        await set(logsKey, trimmedLogs).catch(() => {});
        prunedCount += (logs.length - 100);
      }

      // Cap visitor stats in local IndexedDB to recent 250 entries
      const visKey = this._getLocalKey('porto_visitor_stats');
      const visLogs = await get(visKey);
      if (Array.isArray(visLogs) && visLogs.length > 250) {
        await set(visKey, visLogs.slice(0, 250)).catch(() => {});
        prunedCount += (visLogs.length - 250);
      }

      // Cap login audit logs to recent 150 entries
      const loginKey = this._getLocalKey('porto_login_audit_logs');
      const loginLogs = await get(loginKey);
      if (Array.isArray(loginLogs) && loginLogs.length > 150) {
        await set(loginKey, loginLogs.slice(0, 150)).catch(() => {});
        prunedCount += (loginLogs.length - 150);
      }
    } catch {
      // Fail silently
    }
    return { prunedCount, savedBytes };
  },

  async _safeSetLocal(key: string, value: any): Promise<void> {
    if (this._memCache.size >= 120 && !this._memCache.has(key)) {
      const oldestKey = this._memCache.keys().next().value;
      if (oldestKey !== undefined) this._memCache.delete(oldestKey);
    }
    this._memCache.set(key, { value, timestamp: Date.now() });
    try {
      await set(key, value);
      if (typeof localStorage !== 'undefined') {
        try { localStorage.removeItem(`idb_fallback_${key}`); } catch {}
      }
    } catch (err: any) {
      console.warn(`[Storage] IndexedDB set error for ${key}:`, err);
      if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
        try {
          const all = await entries();
          for (const [k, v] of all) {
            if (v === null || String(k).startsWith('temp_') || String(k).startsWith('draft_')) {
              await del(k).catch(() => {});
            }
          }
          const { pruneEphemeralCaches } = await import('./intelligentStorageEngine');
          await pruneEphemeralCaches().catch(() => {});
          await set(key, value);
          return;
        } catch (retryErr) {
          console.error(`[Storage] Failed after quota cleanup for ${key}:`, retryErr);
        }
      }
      // Resilient fallback: mirror critical small payloads (<100KB) into localStorage
      try {
        if (typeof localStorage !== 'undefined' && value !== undefined) {
          const str = JSON.stringify(value);
          if (str.length < 100000) {
            localStorage.setItem(`idb_fallback_${key}`, str);
          }
        }
      } catch {}
    }
  },

  async flushOfflineQueue(): Promise<void> {
    if (_offlinePendingKeys.size === 0) return;
    const keys = Array.from(_offlinePendingKeys);
    _offlinePendingKeys.clear();
    console.log(`[Storage] Flushing ${keys.length} offline pending item(s) to cloud...`);
    for (const key of keys) {
      try {
        const localKey = this._getLocalKey(key);
        const data = await get(localKey);
        if (data !== undefined && data !== null) {
          const docRef = this._getRef(key);
          const payload = { [key]: cleanData(data) };
          await setDoc(docRef, payload, { merge: true });
          this._lastWrittenCache[key] = JSON.stringify(data);
          const docName = this._getDocNameForKey(key);
          if (this._docCache[docName]) this._docCache[docName][key] = cleanData(data);
        }
      } catch (err) {
        console.warn(`[Storage] Failed flushing offline key ${key}:`, err);
        _offlinePendingKeys.add(key);
      }
    }
  },

  async getStorageUsage(): Promise<StorageUsage> {
    try {
      if (navigator?.storage?.estimate) {
        const est = await navigator.storage.estimate();
        return {
          usageBytes: est.usage || 0,
          quotaBytes: est.quota || 0,
          usagePercent: est.quota ? Math.round(((est.usage || 0) / est.quota) * 100) : 0,
        };
      }
    } catch {
      // Storage estimate API not supported
    }
    return { usageBytes: 0, quotaBytes: 0, usagePercent: 0 };
  },

  async logActivity(action: string, details: Record<string, any> = {}, type: string = 'info'): Promise<void> {
    if (!currentUid) return;
    try {
      const logRef = doc(collection(db, 'activity_logs'));
      await setDoc(logRef, {
        uid: currentUid,
        action,
        details,
        type,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[Storage] Failed to log activity:', e);
    }
  },

  init(uid: string | null, scope: 'global' | 'private' = 'global'): void {
    currentUid = uid;
    currentScope = scope;
    this._docCache = {};
    this._docCacheTime = {};
    this._memCache.clear();
    console.log(`[Storage] Initialized with scope: ${scope} (User: ${uid})`);
    
    // Trigger background storage auto-pruning when browser is idle
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => this.autoPruneStorage());
      } else {
        setTimeout(() => this.autoPruneStorage(), 3000);
      }
    }
  },

  getCurrentUser(): { uid: string | null; scope: 'global' | 'private' } {
    return { uid: currentUid, scope: currentScope };
  },

  _getDocNameForKey(key?: string): string {
    if (!key) return DOCUMENT;
    if (key.startsWith('sumr_client_drop_assets_')) return 'data_media';
    if (key.startsWith('porto_last_sync_')) return 'data_analytics';
    return KEY_PARTITION_MAP[key] || DOCUMENT;
  },

  _getRef(key?: string): DocumentReference {
    const docName = this._getDocNameForKey(key);
    if (currentScope === 'private' && currentUid) {
      return doc(db, 'users', currentUid, 'cms', docName);
    }
    return doc(db, COLLECTION, docName);
  },

  _getLocalKey(key: string): string {
    const pfx = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS?.prefix) ? STORAGE_KEYS.prefix : '';
    if (currentScope === 'private' && currentUid) {
      return pfx ? `${pfx}_${currentUid}_${key}` : `${currentUid}_${key}`;
    }
    return pfx ? `${pfx}_${key}` : key;
  },

  async _fetchCloudDocCached(key?: string, forceRefresh: boolean = false): Promise<any> {
    const docName = this._getDocNameForKey(key);
    const now = Date.now();
    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const docTtlMs = isAdmin ? 60000 : 300000; // 5 menit untuk publik, 1 menit untuk admin
    
    if (!forceRefresh && this._docCache[docName] && (now - (this._docCacheTime[docName] || 0) < docTtlMs)) {
      return this._docCache[docName];
    }

    if (!forceRefresh && this._inFlightGetDoc[docName]) {
      return await this._inFlightGetDoc[docName];
    }

    const docRef = this._getRef(key);
    this._inFlightGetDoc[docName] = getDoc(docRef).then(async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this._docCache[docName] = data;
        this._docCacheTime[docName] = Date.now();
        return data;
      }
      return null;
    }).catch((err) => {
      console.warn(`[Storage] Cloud doc fetch failed for ${docName}:`, err);
      return null;
    }).finally(() => {
      this._inFlightGetDoc[docName] = null;
    });

    return await this._inFlightGetDoc[docName];
  },

  async _syncCloudInBackground(key: string, localKey: string, currentLocalData: any): Promise<void> {
    const now = Date.now();
    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const syncThrottleMs = isAdmin ? 60000 : 300000;
    const lastSync = this._lastBackgroundSyncTime[key] || 0;
    if (now - lastSync < syncThrottleMs) return;
    this._lastBackgroundSyncTime[key] = now;

    try {
      const data = await this._fetchCloudDocCached(key);
      if (data) {
        let cloudVal = data[key];
        if (cloudVal === undefined || cloudVal === null || (Array.isArray(cloudVal) && cloudVal.length === 0)) {
          const aliases = CROSS_SYNC_ALIASES[key] || [];
          for (const aliasKey of aliases) {
            if (data[aliasKey] !== undefined && data[aliasKey] !== null && (!Array.isArray(data[aliasKey]) || data[aliasKey].length > 0)) {
              cloudVal = data[aliasKey];
              break;
            }
          }
        }
        if (cloudVal !== undefined && cloudVal !== null) {
          const cloudStr = JSON.stringify(cloudVal);
          const localStr = JSON.stringify(currentLocalData);
          
          if (cloudStr !== localStr) {
            await this._safeSetLocal(localKey, cloudVal);
            this._lastWrittenCache[key] = cloudStr;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('porto_bg_synced', { detail: { key, value: cloudVal } }));
            }
          }
        }
      }
    } catch {
      // Fail silently in background
    }
  },

  /**
   * Synchronous instantaneous zero-latency read for frame-0 hydration.
   * Eliminates UI flickering / layout pop-in on page mount.
   */
  getSync<T = any>(key: string, defaultValue: any = null): T {
    try {
      const localKey = this._getLocalKey(key);
      const mem = this._memCache.get(localKey);
      if (mem !== undefined && mem.value !== null && mem.value !== undefined) {
        return (key === 'porto_settings' ? enrichSettingsWithEnv(mem.value) : mem.value) as T;
      }
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`idb_fallback_${localKey}`)
                 || localStorage.getItem(`idb_fallback_global_${key}`)
                 || localStorage.getItem(`idb_fallback_${key}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed !== undefined && parsed !== null) {
            this._memCache.set(localKey, { value: parsed, timestamp: Date.now() });
            return (key === 'porto_settings' ? enrichSettingsWithEnv(parsed) : parsed) as T;
          }
        }
      }
    } catch {}
    return defaultValue as T;
  },

  async getItem<T = any>(key: string, defaultValue: any = null, forceCloud: boolean = false): Promise<T> {
    const localKey = this._getLocalKey(key);
    try {
      if (!forceCloud) {
        // Check memory cache first (0ms instantaneous lookup)
        const mem = this._memCache.get(localKey);
        if (mem !== undefined && (Date.now() - mem.timestamp < 30000)) {
          const val = key === 'porto_settings' ? enrichSettingsWithEnv(mem.value) : mem.value;
          return val as T;
        }

        try {
          let effectiveLocalData = await get(localKey);
          if ((effectiveLocalData === undefined || effectiveLocalData === null) && localKey !== key) {
            effectiveLocalData = await get(key);
          }
          if (effectiveLocalData === undefined || effectiveLocalData === null) {
            try {
              if (typeof localStorage !== 'undefined') {
                const fb = localStorage.getItem(`idb_fallback_${localKey}`)
                        || localStorage.getItem(`idb_fallback_${key}`);
                if (fb) effectiveLocalData = JSON.parse(fb);
              }
            } catch {}
          }
          // Valid non-empty check
          const isNonEmpty = effectiveLocalData !== undefined && effectiveLocalData !== null && (!Array.isArray(effectiveLocalData) || effectiveLocalData.length > 0);
          if (isNonEmpty) {
            this._memCache.set(localKey, { value: effectiveLocalData, timestamp: Date.now() });
            const engine = getStorageEngine();
            if (engine === 'hybrid' || engine === 'drive_first') {
              this._syncCloudInBackground(key, localKey, effectiveLocalData).catch(() => {});
            }
            const val = key === 'porto_settings' ? enrichSettingsWithEnv(effectiveLocalData) : effectiveLocalData;
            return val as T;
          }

          // If local data is missing or empty array, attempt to recover from cross-sync aliases
          const aliases = CROSS_SYNC_ALIASES[key] || [];
          for (const aliasKey of aliases) {
            try {
              const aliasLocal = await get(this._getLocalKey(aliasKey));
              if (aliasLocal !== undefined && aliasLocal !== null && (!Array.isArray(aliasLocal) || aliasLocal.length > 0)) {
                // Found non-empty data in alias! Mirror it to this key so subsequent reads are instant
                await this._safeSetLocal(localKey, aliasLocal);
                this._memCache.set(localKey, { value: aliasLocal, timestamp: Date.now() });
                const val = key === 'porto_settings' ? enrichSettingsWithEnv(aliasLocal) : aliasLocal;
                return val as T;
              }
            } catch {}
          }

          // If effectiveLocalData exists even if empty array, return it if no alias has better data
          if (effectiveLocalData !== undefined && effectiveLocalData !== null) {
            this._memCache.set(localKey, { value: effectiveLocalData, timestamp: Date.now() });
            const val = key === 'porto_settings' ? enrichSettingsWithEnv(effectiveLocalData) : effectiveLocalData;
            return val as T;
          }
        } catch (localErr) {
          console.warn(`[Storage] Local DB read failed for ${localKey}`, localErr);
        }
      }

      const engine = getStorageEngine();
      if (engine === 'hybrid' || engine === 'drive_first' || forceCloud) {
        const data = await this._fetchCloudDocCached(key, forceCloud);
        if (data) {
          let cloudVal = data[key];
          if (key === 'porto_biodata' && cloudVal === undefined && data['porto_settings']?.biodata) {
            cloudVal = data['porto_settings'].biodata;
          }

          // If cloud data is empty, check aliases in the cloud document
          if (cloudVal === undefined || cloudVal === null || (Array.isArray(cloudVal) && cloudVal.length === 0)) {
            const aliases = CROSS_SYNC_ALIASES[key] || [];
            for (const aliasKey of aliases) {
              if (data[aliasKey] !== undefined && data[aliasKey] !== null && (!Array.isArray(data[aliasKey]) || data[aliasKey].length > 0)) {
                cloudVal = data[aliasKey];
                break;
              }
            }
          }

          if (cloudVal !== undefined && cloudVal !== null) {
            try { 
              await this._safeSetLocal(localKey, cloudVal); 
              this._lastWrittenCache[key] = JSON.stringify(cloudVal);
            } catch {
              // Ignore
            }
            const val = key === 'porto_settings' ? enrichSettingsWithEnv(cloudVal) : cloudVal;
            return val as T;
          }
        }
      }

      const val = key === 'porto_settings' ? enrichSettingsWithEnv(defaultValue) : defaultValue;
      return val as T;
    } catch (e) {
      console.error(`[Storage] Error reading ${key}:`, e);
      const val = key === 'porto_settings' ? enrichSettingsWithEnv(defaultValue) : defaultValue;
      return val as T;
    }
  },

  _subscribeToDocPool(docName: string, key: string, subId: string, callback: (docData: any) => void): void {
    if (!this._docListeners[docName]) {
      const docRef = this._getRef(key);
      const callbacks = new Map<string, (docData: any) => void>();
      callbacks.set(subId, callback);

      const unsub = onSnapshot(docRef, { includeMetadataChanges: false }, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          this._docCache[docName] = data;
          this._docCacheTime[docName] = Date.now();
          // Dispatch to all subscribers of this document partition
          callbacks.forEach(cb => {
            try { cb(data); } catch (e) { console.warn('[Storage] Subscriber dispatch error:', e); }
          });
        }
      }, (error) => {
        console.warn(`[Storage] Pooled snapshot error for ${docName}:`, error);
      });

      this._docListeners[docName] = {
        unsub,
        callbacks,
        graceTimer: null
      };
    } else {
      const pool = this._docListeners[docName];
      if (pool.graceTimer) {
        clearTimeout(pool.graceTimer);
        pool.graceTimer = null;
      }
      pool.callbacks.set(subId, callback);

      // Instant delivery from memory if doc is already in cache
      if (this._docCache[docName]) {
        try { callback(this._docCache[docName]); } catch {}
      }
    }
  },

  _unsubscribeFromDocPool(docName: string, subId: string): void {
    const pool = this._docListeners[docName];
    if (!pool) return;
    pool.callbacks.delete(subId);

    // If no more subscribers, set a 6-second grace timer before closing the Firestore connection
    // (Prevents expensive reconnect churn during fast route navigation)
    if (pool.callbacks.size === 0) {
      if (pool.graceTimer) clearTimeout(pool.graceTimer);
      pool.graceTimer = setTimeout(() => {
        if (pool.callbacks.size === 0) {
          try { pool.unsub(); } catch {}
          delete this._docListeners[docName];
        }
      }, 6000);
    }
  },

  listenItem(key: string, callback: (data: any) => void, defaultValue: any = null): Unsubscribe {
    const localKey = this._getLocalKey(key);
    const docName = this._getDocNameForKey(key);
    const engine = getStorageEngine();
    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    
    const wrapCallback = (val: any) => {
      const enriched = key === 'porto_settings' ? enrichSettingsWithEnv(val) : val;
      callback(enriched);
    };

    // 1. Instant local read (0ms)
    get(localKey).then(localData => {
      if (localData !== undefined && localData !== null) {
        wrapCallback(localData);
      } else {
        // Check aliases for immediate fallback
        const aliases = CROSS_SYNC_ALIASES[key] || [];
        if (aliases.length > 0) {
          get(this._getLocalKey(aliases[0])).then(aliasData => {
            if (aliasData !== undefined && aliasData !== null) {
              wrapCallback(aliasData);
            } else {
              wrapCallback(defaultValue);
            }
          }).catch(() => wrapCallback(defaultValue));
        } else {
          wrapCallback(defaultValue);
        }
      }
    }).catch(() => {
      wrapCallback(defaultValue);
    });

    // 2. Local dirty / background sync listeners
    const handleLocalDirty = (e: any) => {
      if (e && e.detail) {
        if (e.detail.key === key) {
          wrapCallback(e.detail.value);
        } else {
          const aliases = CROSS_SYNC_ALIASES[key] || [];
          if (aliases.includes(e.detail.key)) {
            wrapCallback(e.detail.value);
          }
        }
      }
    };

    const handleBgSynced = (e: any) => {
      if (e && e.detail) {
        if (e.detail.key === key) {
          wrapCallback(e.detail.value);
        } else {
          const aliases = CROSS_SYNC_ALIASES[key] || [];
          if (aliases.includes(e.detail.key)) {
            wrapCallback(e.detail.value);
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('porto_storage_dirty', handleLocalDirty);
      window.addEventListener('porto_bg_synced', handleBgSynced);
    }

    // 3. Cloud synchronization
    let removeCloudListener: (() => void) | null = null;

    if (engine === 'hybrid' || engine === 'drive_first') {
      // FOR PUBLIC VISITORS: Don't spawn heavy real-time onSnapshot listeners for every block/widget!
      // Instead, use background stale-while-revalidate fetch (with doc-level in-flight deduplication and 5-min cache)
      if (!isAdmin) {
        this._syncCloudInBackground(key, localKey, null).catch(() => {});
      } else {
        // FOR ADMIN: Use Pooled Multiplexed Snapshot Listener per Document
        const subId = `sub_${key}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        
        const docCallback = (docData: any) => {
          let cloudVal = docData[key];
          if (key === 'porto_biodata' && cloudVal === undefined && docData['porto_settings']?.biodata) {
            cloudVal = docData['porto_settings'].biodata;
          }

          if (cloudVal === undefined || cloudVal === null) {
            const aliases = CROSS_SYNC_ALIASES[key] || [];
            for (const aliasKey of aliases) {
              if (docData[aliasKey] !== undefined && docData[aliasKey] !== null) {
                cloudVal = docData[aliasKey];
                break;
              }
            }
          }

          if (cloudVal !== undefined && cloudVal !== null) {
            // Concurrency Conflict Guard: If a local write occurred recently and is newer than incoming cloud doc, protect local state
            const lastLocalTime = this._lastLocalWriteTime[key] || 0;
            const cloudUpdatedAt = docData[`${key}_updatedAt_ms`] || docData['_lastCloudSync_ms'] || 0;
            if (lastLocalTime > 0 && (Date.now() - lastLocalTime < 3500) && cloudUpdatedAt < lastLocalTime) {
              return;
            }

            const cloudStr = JSON.stringify(cloudVal);
            if (typeof localStorage !== 'undefined') {
              const cloudAccent = (key === 'porto_settings' ? cloudVal?.accentColor : (key === 'porto_main_website' ? cloudVal?.theme?.accentColor : null));
              if (cloudAccent && typeof cloudAccent === 'string') {
                _applyAccentIfAllowed(cloudAccent);
              }
            }

            this._safeSetLocal(localKey, cloudVal).catch(() => {});
            this._lastWrittenCache[key] = cloudStr;
            wrapCallback(cloudVal);
          } else {
            wrapCallback(defaultValue);
          }
        };

        this._subscribeToDocPool(docName, key, subId, docCallback);

        removeCloudListener = () => {
          this._unsubscribeFromDocPool(docName, subId);
        };
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('porto_storage_dirty', handleLocalDirty);
        window.removeEventListener('porto_bg_synced', handleBgSynced);
      }
      if (removeCloudListener) {
        removeCloudListener();
      }
    };
  },

  async setItem(key: string, value: any, syncCloud: boolean = true): Promise<boolean> {
    const localKey = this._getLocalKey(key);
    try {
      let finalValue = sanitizeDatabaseCollection(key, value);
      if (key === 'porto_settings' && value && typeof value === 'object') {
        const currentSettings = (await get(localKey)) || {};
        finalValue = deepMerge(currentSettings, value);
        if (finalValue.accentColor) {
          try {
            localStorage.setItem('porto_accent_color', finalValue.accentColor);
            applyAccentColor(finalValue.accentColor);
            _accentLockUntil = Date.now() + ACCENT_LOCK_MS; // lock: user action takes priority
          } catch {}
        }
        if (finalValue.storageEngine && typeof localStorage !== 'undefined') {
          localStorage.setItem('porto_storage_engine', finalValue.storageEngine);
        }
      } else if (key === 'porto_main_website' && finalValue && typeof finalValue === 'object') {
        if (finalValue.theme?.accentColor) {
          try {
            localStorage.setItem('porto_accent_color', finalValue.theme.accentColor);
            applyAccentColor(finalValue.theme.accentColor);
            _accentLockUntil = Date.now() + ACCENT_LOCK_MS; // lock: user action takes priority
          } catch {}
        }
      }

      const valueStr = JSON.stringify(finalValue);
      const isUnchanged = this._lastWrittenCache[key] === valueStr;
      const writeNow = Date.now();
      this._lastLocalWriteTime[key] = writeNow;

      await this._safeSetLocal(localKey, finalValue);

      // Automatic Cross-Key Mirroring for Database Consistency
      const aliases = CROSS_SYNC_ALIASES[key] || [];
      for (const aliasKey of aliases) {
        try {
          const aliasLocalKey = this._getLocalKey(aliasKey);
          await this._safeSetLocal(aliasLocalKey, finalValue);
          this._lastWrittenCache[aliasKey] = valueStr;
          this._lastLocalWriteTime[aliasKey] = writeNow;
        } catch {}
      }
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('porto_storage_dirty', { detail: { key, value: finalValue } }));
        if (key === 'porto_settings') {
          if (finalValue?.syncMode && typeof localStorage !== 'undefined') {
            if (localStorage.getItem('porto_sync_mode') !== finalValue.syncMode) {
              localStorage.setItem('porto_sync_mode', finalValue.syncMode);
              window.dispatchEvent(new CustomEvent('porto_sync_mode_changed', { detail: { mode: finalValue.syncMode } }));
            }
          }
          if (finalValue?.storageEngine && typeof localStorage !== 'undefined') {
            window.dispatchEvent(new CustomEvent('porto_storage_engine_changed', { detail: { engine: finalValue.storageEngine } }));
          }
          window.dispatchEvent(new CustomEvent('porto_settings_updated', { detail: finalValue }));
          if (finalValue.biodata) {
            this._safeSetLocal(this._getLocalKey('porto_biodata'), finalValue.biodata).catch(() => {});
            window.dispatchEvent(new CustomEvent('porto_biodata_updated', { detail: finalValue.biodata }));
          }
        } else if (key === 'porto_biodata') {
          window.dispatchEvent(new CustomEvent('porto_biodata_updated', { detail: finalValue }));
          get(this._getLocalKey('porto_settings')).then(s => {
            if (s && typeof s === 'object') {
              const updatedSettings = { ...s, biodata: finalValue };
              this._safeSetLocal(this._getLocalKey('porto_settings'), updatedSettings).catch(() => {});
            }
          }).catch(() => {});
        } else if (key === 'porto_blog' || key === 'porto_blog_posts' || key === 'porto_blogs') {
          window.dispatchEvent(new CustomEvent('porto_blog_updated', { detail: finalValue }));
          window.dispatchEvent(new CustomEvent('porto_blog_saved', { detail: finalValue }));
        } else if (key === 'porto_catalog' || key === 'porto_catalog_products' || key === 'porto_shop_products') {
          window.dispatchEvent(new CustomEvent('porto_catalog_updated', { detail: finalValue }));
          window.dispatchEvent(new CustomEvent('porto_catalog_products_updated', { detail: finalValue }));
        } else if (key === 'porto_portfolio') {
          window.dispatchEvent(new CustomEvent('porto_portfolio_updated', { detail: finalValue }));
        } else if (key === 'porto_projects') {
          window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: finalValue }));
        } else if (key === 'porto_games_data' || key === 'porto_custom_games') {
          window.dispatchEvent(new CustomEvent('porto_games_updated', { detail: finalValue }));
        } else if (key === 'porto_transactions') {
          window.dispatchEvent(new CustomEvent('porto_transactions_updated', { detail: finalValue }));
        } else if (key === 'porto_rate_cards') {
          window.dispatchEvent(new CustomEvent('porto_rate_cards_updated', { detail: finalValue }));
        } else if (key === 'porto_client_reviews') {
          window.dispatchEvent(new CustomEvent('porto_client_reviews_updated', { detail: finalValue }));
        } else if (key === 'porto_client_flipbooks') {
          window.dispatchEvent(new CustomEvent('porto_flipbooks_updated', { detail: finalValue }));
        } else if (key === 'porto_forms') {
          window.dispatchEvent(new CustomEvent('porto_forms_updated', { detail: finalValue }));
        } else if (key === 'porto_links') {
          window.dispatchEvent(new CustomEvent('porto_links_updated', { detail: finalValue }));
        } else if (key === 'porto_media_vault') {
          window.dispatchEvent(new CustomEvent('porto_media_vault_updated', { detail: finalValue }));
        }
      }
      
      if (syncChannel) {
        try {
          syncChannel.postMessage({ type: 'SYNC', key, value: finalValue });
        } catch {}
      }

      const currentSyncMode = typeof localStorage !== 'undefined' ? (localStorage.getItem('porto_sync_mode') || 'auto') : 'auto';
      const engine = getStorageEngine();

      if (syncCloud && !isUnchanged && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('porto_last_local_write_ts', String(Date.now()));
        } catch {}
      }

      if (syncCloud && !isUnchanged && currentSyncMode !== 'offline' && (engine === 'hybrid' || engine === 'drive_first')) {
        const docRef = this._getRef(key);
        const docName = this._getDocNameForKey(key);
        let cloudPayloadData = finalValue;
        if (key === 'porto_memo_notes' && Array.isArray(finalValue)) {
          cloudPayloadData = finalValue.filter((n: any) => !n.isOfflineOnly);
        }
        
        this._scheduleCloudWrite(key, cloudPayloadData, docRef, docName, valueStr);

        // Hanya jadwalkan cloud write terpisah jika alias berada di partisi dokumen yang BERBEDA
        for (const aliasKey of aliases) {
          const aliasDocName = this._getDocNameForKey(aliasKey);
          if (aliasDocName !== docName) {
            const aliasDocRef = this._getRef(aliasKey);
            this._scheduleCloudWrite(aliasKey, cloudPayloadData, aliasDocRef, aliasDocName, valueStr);
          }
        }
      }

      return true;
    } catch (e) {
      console.error(`[Storage] Error writing ${key}:`, e);
      throw e;
    }
  },

  /**
   * Alias helper: get(key, defaultValue)
   */
  async get<T = any>(key: string, defaultValue: any = null): Promise<T> {
    return this.getItem<T>(key, defaultValue);
  },

  /**
   * Alias helper: set(key, value, syncCloud)
   */
  async set(key: string, value: any, syncCloud: boolean = true): Promise<boolean> {
    return this.setItem(key, value, syncCloud);
  },

  /**
   * Reconcile Database Integrity:
   * Scans all key pairs, resolves asymmetric/missing records, eliminates duplicates,
   * and synchronizes local & cloud stores to guarantee 100% database accuracy.
   */
  async reconcileDatabaseIntegrity(): Promise<{ repaired: string[]; summary: Record<string, number> }> {
    const repaired: string[] = [];
    const summary: Record<string, number> = {};

    console.log('[Storage] Starting Deep Database Integrity Reconciler...');

    // ── ISOLATION: Pastikan porto_portfolio dan porto_projects terpisah 100% ──
    try {
      const rawPorto = await get(this._getLocalKey('porto_portfolio'));
      const rawProjects = await get(this._getLocalKey('porto_projects'));

      if (Array.isArray(rawPorto) && rawPorto.length > 0) {
        // Berkas yang memiliki atribut proofing murni milik porto_projects (klien)
        const proofingItems = rawPorto.filter((item: any) => 
          item && (
            item.proofingWatermarkStyle || 
            item.proofingImages || 
            (typeof item.id === 'string' && item.id.startsWith('PRF-')) || 
            item.clientPhone ||
            item.isPasswordProtected !== undefined ||
            item.status === 'progress' ||
            item.status === 'pending_acc' ||
            item.status === 'review'
          )
        );

        if (proofingItems.length > 0) {
          const cleanPorto = rawPorto.filter((item: any) => 
            !item || (
              !item.proofingWatermarkStyle && 
              !item.proofingImages && 
              !(typeof item.id === 'string' && item.id.startsWith('PRF-')) && 
              !item.clientPhone &&
              item.isPasswordProtected === undefined &&
              item.status !== 'progress' &&
              item.status !== 'pending_acc' &&
              item.status !== 'review'
            )
          );
          await this._safeSetLocal(this._getLocalKey('porto_portfolio'), cleanPorto);

          // Pindahkan/satukan ke porto_projects jika belum ada
          const currentProjects = Array.isArray(rawProjects) ? [...rawProjects] : [];
          let added = 0;
          proofingItems.forEach((pf: any) => {
            if (!currentProjects.some((p: any) => p.id === pf.id)) {
              currentProjects.unshift(pf);
              added++;
            }
          });
          if (added > 0) {
            await this._safeSetLocal(this._getLocalKey('porto_projects'), currentProjects);
          }
          repaired.push(`Dipisahkan ${proofingItems.length} berkas proofing keluar dari database portofolio ke database proyek`);
        }
      }
    } catch (unmergeErr) {
      console.warn('[Storage] Unmerge portfolio/projects error:', unmergeErr);
    }

    const pairs: [string, string][] = [
      ['porto_blog_posts', 'porto_blog'],
      ['porto_blog_posts', 'porto_blogs'],
      ['porto_catalog_products', 'porto_catalog'],
      ['porto_catalog_products', 'porto_shop_products'],
      ['porto_custom_games', 'porto_games_data'],
      ['porto_memo_notes', 'porto_memos'],
      ['porto_client_reviews', 'porto_reviews'],
      ['porto_client_faqs', 'porto_faqs'],
      ['porto_rate_cards', 'porto_rate_card'],
      ['porto_studio_inquiries', 'porto_leads'],
      ['porto_trx_customers', 'porto_customers'],
      ['porto_flash_sales', 'porto_flashsale_active'],
    ];

    for (const [primaryKey, aliasKey] of pairs) {
      try {
        const pLocalKey = this._getLocalKey(primaryKey);
        const aLocalKey = this._getLocalKey(aliasKey);
        const primaryData = await get(pLocalKey);
        const aliasData = await get(aLocalKey);

        const primaryHasData = primaryData && (!Array.isArray(primaryData) || primaryData.length > 0);
        const aliasHasData = aliasData && (!Array.isArray(aliasData) || aliasData.length > 0);

        if (primaryHasData && !aliasHasData) {
          await this._safeSetLocal(aLocalKey, primaryData);
          this._memCache.set(aLocalKey, { value: primaryData, timestamp: Date.now() });
          repaired.push(`${aliasKey} synced from ${primaryKey}`);
        } else if (!primaryHasData && aliasHasData) {
          await this._safeSetLocal(pLocalKey, aliasData);
          this._memCache.set(pLocalKey, { value: aliasData, timestamp: Date.now() });
          repaired.push(`${primaryKey} synced from ${aliasKey}`);
        } else if (Array.isArray(primaryData) && Array.isArray(aliasData)) {
          // Merge arrays by ID if different lengths
          if (primaryData.length !== aliasData.length) {
            const map = new Map<string, any>();
            primaryData.forEach((item: any) => { if (item?.id) map.set(String(item.id), item); });
            aliasData.forEach((item: any) => {
              if (item?.id && !map.has(String(item.id))) map.set(String(item.id), item);
            });
            const merged = Array.from(map.values());
            await this._safeSetLocal(pLocalKey, merged);
            await this._safeSetLocal(aLocalKey, merged);
            this._memCache.set(pLocalKey, { value: merged, timestamp: Date.now() });
            this._memCache.set(aLocalKey, { value: merged, timestamp: Date.now() });
            repaired.push(`${primaryKey} & ${aliasKey} merged (${merged.length} items)`);
          }
        }

        const count = Array.isArray(primaryData) ? primaryData.length : (Array.isArray(aliasData) ? aliasData.length : 1);
        summary[primaryKey] = count;
      } catch (pairErr) {
        console.warn(`[Storage] Reconcile pair ${primaryKey} <-> ${aliasKey} error:`, pairErr);
      }
    }

    // ── MEDIA GALLERY <-> MEDIA VAULT BIDIRECTIONAL RECONCILIATION ──
    try {
      const gKey = this._getLocalKey('porto_media_gallery');
      const vKey = this._getLocalKey('porto_media_vault');
      const rawGallery = sanitizeDatabaseCollection('porto_media_gallery', (await get(gKey)) || []);
      const rawVault = sanitizeDatabaseCollection('porto_media_vault', (await get(vKey)) || []);

      if (Array.isArray(rawGallery) && Array.isArray(rawVault)) {
        const vaultUrls = new Set(rawVault.map((v: any) => v?.url).filter(Boolean));
        const galleryUrls = new Set(rawGallery.map((g: any) => g?.url).filter(Boolean));
        let vaultChanged = false;
        let galleryChanged = false;
        const nextVault = [...rawVault];
        const nextGallery = [...rawGallery];

        for (const gItem of rawGallery) {
          if (gItem?.url && typeof gItem.url === 'string' && !vaultUrls.has(gItem.url)) {
            vaultUrls.add(gItem.url);
            const isDrive = gItem.url.includes('drive.google.com') || gItem.url.includes('googleusercontent.com');
            const isCloud = gItem.url.includes('cloudinary.com');
            nextVault.unshift({
              id: gItem.id || `mv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: gItem.name || 'Berkas Media',
              url: gItem.url,
              type: gItem.resource_type === 'video' ? 'video' : 'image',
              source: isDrive ? 'drive' : (isCloud ? 'cloudinary' : 'local'),
              folder: 'Galeri Media',
              createdAt: typeof gItem.createdAt === 'number' ? new Date(gItem.createdAt).toISOString() : (gItem.createdAt || new Date().toISOString())
            });
            vaultChanged = true;
          }
        }

        for (const vItem of rawVault) {
          if (vItem?.url && typeof vItem.url === 'string' && vItem.url !== 'https://drive.google.com' && !galleryUrls.has(vItem.url)) {
            if (vItem.type === 'image' || vItem.type === 'video' || !vItem.type) {
              galleryUrls.add(vItem.url);
              nextGallery.unshift({
                id: vItem.id || `media_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                name: vItem.name || 'Berkas Vault',
                url: vItem.url,
                resource_type: vItem.type === 'video' ? 'video' : 'image',
                format: vItem.type === 'video' ? 'mp4' : 'webp',
                source: vItem.source || (vItem.url.includes('drive.google.com') ? 'drive' : 'cloudinary'),
                createdAt: vItem.createdAt ? new Date(vItem.createdAt).getTime() || Date.now() : Date.now()
              });
              galleryChanged = true;
            }
          }
        }

        if (vaultChanged) {
          await this._safeSetLocal(vKey, nextVault);
          this._memCache.set(vKey, { value: nextVault, timestamp: Date.now() });
          repaired.push(`porto_media_vault disinkronkan dengan Galeri Media (${nextVault.length} aset)`);
        }
        if (galleryChanged) {
          await this._safeSetLocal(gKey, nextGallery);
          this._memCache.set(gKey, { value: nextGallery, timestamp: Date.now() });
          repaired.push(`porto_media_gallery disinkronkan dengan Media Vault (${nextGallery.length} aset)`);
        }
      }
    } catch (mediaRecErr) {
      console.warn('[Storage] Media vault/gallery reconcile warning:', mediaRecErr);
    }

    // ── DEEP SANITIZATION: Sanitize & verify all primary database collections ──
    const ALL_PRIMARY_COLLECTIONS = [
      'porto_portfolio',
      'porto_projects',
      'porto_catalog_products',
      'porto_blog_posts',
      'porto_client_flipbooks',
      'porto_memos',
      'porto_forms',
      'porto_links',
      'porto_media_vault',
      'porto_client_reviews',
      'porto_rate_cards',
      'porto_transactions',
      'porto_users'
    ];

    for (const colKey of ALL_PRIMARY_COLLECTIONS) {
      try {
        const raw = await get(this._getLocalKey(colKey));
        if (raw !== undefined && raw !== null) {
          const sanitized = sanitizeDatabaseCollection(colKey, raw);
          const rawStr = JSON.stringify(raw);
          const sanStr = JSON.stringify(sanitized);
          if (rawStr !== sanStr) {
            await this._safeSetLocal(this._getLocalKey(colKey), sanitized);
            repaired.push(`Pembersihan & isolasi integritas otomatis: ${colKey}`);
          }
          summary[colKey] = Array.isArray(sanitized) ? sanitized.length : 1;
        }
      } catch (err) {
        console.warn(`[Storage] Reconcile collection ${colKey} error:`, err);
      }
    }

    // Safety Snapshot Checkpoint
    try {
      const checkpoint = {
        timestamp: new Date().toISOString(),
        summary,
        repairedCount: repaired.length
      };
      await this._safeSetLocal(this._getLocalKey('porto_zero_downtime_checkpoint'), checkpoint);
    } catch {}

    // Flush any pending cloud sync so cloud stays aligned
    try {
      await this.flushAllPendingWrites();
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porto_database_reconciled', { detail: { repaired, summary } }));
    }

    console.log('[Storage] Database Integrity Reconciler completed:', { repaired, summary });
    return { repaired, summary };
  },

  async batchSetItems(itemsMap: Record<string, any>, syncCloud: boolean = true): Promise<boolean> {
    try {
      const entriesList = Object.entries(itemsMap);
      await Promise.all(entriesList.map(([k, v]) => this.setItem(k, v, syncCloud)));
      return true;
    } catch (err) {
      console.error('[Storage] batchSetItems error:', err);
      return false;
    }
  },

  _scheduleCloudWrite(key: string, cloudPayloadData: any, docRef: DocumentReference, docName: string, valueStr: string): void {
    if (this._writeDebounceTimers[key]) {
      clearTimeout(this._writeDebounceTimers[key]);
    }

    this._pendingCloudPayloads[key] = {
      docRef,
      docName,
      cloudPayloadData,
      valueStr,
      timestamp: Date.now()
    };

    const debounceMs = (key.includes('memo') || key.includes('whiteboard') || key.includes('notes') || key.includes('article')) ? 1200 : 600;

    this._writeDebounceTimers[key] = setTimeout(async () => {
      await this._flushKeyCloudWrite(key);
    }, debounceMs);
  },

  async _flushKeyCloudWrite(key: string): Promise<void> {
    const item = this._pendingCloudPayloads[key];
    if (!item) return;
    delete this._pendingCloudPayloads[key];
    delete this._writeDebounceTimers[key];

    // Jangan kirim write ke Firestore jika pengguna belum terautentikasi (mencegah PERMISSION_DENIED & boros network)
    if (!currentUid && !auth.currentUser && currentScope === 'global') {
      return;
    }

    const writeTimestamp = Date.now();
    const canonicalKey = CANONICAL_KEY_MAP[key] || key;
    const cleanedData = cleanData(item.cloudPayloadData);
    const payload: Record<string, any> = { 
      [canonicalKey]: cleanedData,
      [`${canonicalKey}_updatedAt_ms`]: writeTimestamp,
      _lastCloudSync_ms: writeTimestamp
    };
    if (key === 'porto_biodata') {
      payload['porto_biodata'] = cleanedData;
    }
    
    // Hapus salinan duplikat dari alias di dalam dokumen partisi Firestore yang sama (menghemat hingga 66% kuota 1MB per dokumen)
    const aliases = CROSS_SYNC_ALIASES[canonicalKey] || [];
    for (const aKey of aliases) {
      if (aKey !== canonicalKey && this._getDocNameForKey(aKey) === item.docName) {
        payload[aKey] = deleteField();
        payload[`${aKey}_updatedAt_ms`] = deleteField();
      }
    }

    // Firestore 1MB Document Quota Guard (~900KB threshold)
    try {
      const payloadBytes = new Blob([JSON.stringify({ [canonicalKey]: cleanedData })]).size;
      if (payloadBytes > 900 * 1024) {
        console.warn(`[Storage] Cloud payload for ${canonicalKey} (${Math.round(payloadBytes / 1024)} KB) exceeds Firestore 900KB safe threshold. Skipping Firestore relay (saved locally & synced via Google Drive).`);
        this._lastWrittenCache[key] = item.valueStr;
        return;
      }
    } catch {}

    try {
      await setDoc(item.docRef, payload, { merge: true });
      this._lastWrittenCache[key] = item.valueStr;
      for (const aKey of aliases) {
        if (this._getDocNameForKey(aKey) === item.docName) {
          this._lastWrittenCache[aKey] = item.valueStr;
        }
      }

      if (this._docCache[item.docName]) {
        this._docCache[item.docName][key] = cleanData(item.cloudPayloadData);
        for (const aKey of aliases) {
          if (this._getDocNameForKey(aKey) === item.docName) {
            this._docCache[item.docName][aKey] = cleanData(item.cloudPayloadData);
          }
        }
      }
    } catch (err: any) {
      // Auto-recovery for Firebase JWT token expiration: refresh token and retry write
      if ((err?.code === 'permission-denied' || err?.message?.includes('permission')) && auth.currentUser) {
        try {
          console.warn(`[Storage] Firebase token may be expired on ${key}. Refreshing token and retrying write...`);
          await auth.currentUser.getIdToken(true);
          await setDoc(item.docRef, payload, { merge: true });
          this._lastWrittenCache[key] = item.valueStr;
          return;
        } catch (retryErr) {
          console.warn(`[Storage] Retry write after token refresh failed for ${key}:`, retryErr);
        }
      }
      console.warn(`[Storage] Background cloud sync failed for ${key}, enqueued for offline sync:`, err);
      _offlinePendingKeys.add(key);
    }
  },

  async flushAllPendingWrites(): Promise<void> {
    await this.flushDebounced();
    const pendingKeys = Object.keys(this._pendingCloudPayloads);
    for (const key of pendingKeys) {
      if (this._writeDebounceTimers[key]) {
        clearTimeout(this._writeDebounceTimers[key]);
      }
      await this._flushKeyCloudWrite(key);
    }
  },

  _debounceTimers: {} as Record<string, any>,
  _debouncePending: {} as Record<string, any>,
  
  debouncedSetItem(key: string, value: any, delay: number = 5000): void {
    const sanitized = sanitizeDatabaseCollection(key, value);
    this._debouncePending[key] = sanitized;
    const localKey = this._getLocalKey(key);
    this._safeSetLocal(localKey, sanitized).catch(() => {});

    if (this._debounceTimers[key]) {
      clearTimeout(this._debounceTimers[key]);
    }

    this._debounceTimers[key] = setTimeout(async () => {
      try {
        await this.setItem(key, sanitized, true);
        delete this._debounceTimers[key];
        delete this._debouncePending[key];
      } catch (e) {
        console.error(`[Storage] Debounced save failed for ${key}:`, e);
      }
    }, delay);
  },

  async flushDebounced(targetKey: string | null = null): Promise<void> {
    const keysToFlush = targetKey ? [targetKey] : Object.keys(this._debouncePending);
    for (const key of keysToFlush) {
      if (this._debounceTimers[key]) {
        clearTimeout(this._debounceTimers[key]);
        delete this._debounceTimers[key];
      }
      if (this._debouncePending[key] !== undefined) {
        const val = this._debouncePending[key];
        delete this._debouncePending[key];
        try {
          await this.setItem(key, val, true);
        } catch (e) {
          console.error(`[Storage] Flush failed for ${key}:`, e);
        }
      }
    }
  },

  async clearAll(): Promise<boolean> {
    console.warn('[Storage] INITIATING FULL DATABASE RESET — preserving sensitive settings...');
    try {
      // 1. Ekstrak data settings sensitif yang harus dipertahankan
      let sensitiveSettings: Record<string, any> = {};
      try {
        const currentSettings = await get(this._getLocalKey('porto_settings'));
        if (currentSettings && typeof currentSettings === 'object') {
          sensitiveSettings = {
            googleAppsScriptUrl: currentSettings.googleAppsScriptUrl || '',
            googleSheetId: currentSettings.googleSheetId || '',
            cloudinaryName: currentSettings.cloudinaryName || '',
            cloudinaryPreset: currentSettings.cloudinaryPreset || '',
            cloudinaryApiKey: currentSettings.cloudinaryApiKey || '',
            geminiApiKey: currentSettings.geminiApiKey || '',
            backupEmail: currentSettings.backupEmail || '',
            accentColor: currentSettings.accentColor || '#7c3aed',
            theme: currentSettings.theme || {},
          };
        }
      } catch (e) {}

      // 2. Simpan semua config keys yang ada di localStorage
      const PRESERVE_KEYS = [
        'GEMINI_API_KEY',
        'porto_gemini_key',
        'porto_cached_gemini_model',
        'cms_dark_mode',
        'porto_env_overrides',
        'porto_deploy_targets',
        'porto_env_sync_status',
        'porto_active_deploy_target',
        'porto_accent_color',
      ];
      const savedValues: Record<string, string> = {};
      for (const key of PRESERVE_KEYS) {
        const val = localStorage.getItem(key);
        if (val) savedValues[key] = val;
      }
      const savedSessionModel = sessionStorage.getItem('porto_cached_gemini_model') || '';

      // 3. Kosongkan semua dokumen partisi Firestore di koleksi cms/ (otomatis mencakup seluruh KEY_PARTITION_MAP)
      const partitionDocs = Array.from(new Set([
        'data',
        'data_projects',
        'data_website',
        'data_shop',
        'data_notes',
        'data_transactions',
        'data_stickers',
        'data_frames',
        'data_bookings',
        'data_links',
        'data_media',
        'data_analytics',
        'data_marketing',
        'data_messages',
        'data_games',
        'data_pages',
        ...Object.values(KEY_PARTITION_MAP)
      ]));

      for (const docName of partitionDocs) {
        try {
          const partRef = doc(db, COLLECTION, docName);
          if (docName === 'data') {
            await setDoc(partRef, {
              porto_settings: enrichSettingsWithEnv(sensitiveSettings),
            });
          } else if (docName === 'data_website') {
            await setDoc(partRef, {
              porto_main_website: {
                navbar: { items: [], logoText: 'Studio' },
                hero: { greeting: 'Halo', headline: '', description: '', heroImage: null },
                profile: { bio: '', image: null, skills: [] },
                process: [],
                testimonials: [],
                featuredProjects: [],
              },
              porto_blogs: [],
              porto_blog_posts: [],
            });
          } else if (docName === 'data_projects') {
            await setDoc(partRef, {
              porto_projects: [],
              porto_portfolio: [],
              porto_project_categories: [],
              porto_kanban_columns: [],
            });
          } else {
            await setDoc(partRef, {});
          }
        } catch (err) {
          console.warn(`[Storage] Gagal mengosongkan partisi ${docName}:`, err);
        }
      }

      // 4. Bersihkan localStorage & IndexedDB
      localStorage.clear();
      await clear();

      // 5. Pulihkan kembali semua config keys sensitif
      for (const [key, val] of Object.entries(savedValues)) {
        localStorage.setItem(key, val);
      }
      if (savedSessionModel) {
        sessionStorage.setItem('porto_cached_gemini_model', savedSessionModel);
      }
      if (sensitiveSettings.accentColor) {
        localStorage.setItem('porto_accent_color', sensitiveSettings.accentColor);
      }

      const emptyCleanData: Record<string, any> = {
        porto_settings: enrichSettingsWithEnv(sensitiveSettings),
        porto_projects: [],
        porto_portfolio: [],
        porto_main_website: {
          navbar: { items: [], logoText: 'Studio' },
          hero: { greeting: 'Halo', headline: '', description: '', heroImage: null },
          profile: { bio: '', image: null, skills: [] },
          process: [],
          testimonials: [],
          featuredProjects: [],
        },
        porto_blog_posts: [],
        porto_catalog: [],
        porto_shop_products: [],
        porto_memos: [],
        porto_transactions: [],
        porto_bookings: [],
        porto_whiteboard_canvases: [],
        porto_links: [],
      };

      for (const [k, v] of Object.entries(emptyCleanData)) {
        await set(this._getLocalKey(k), v);
      }

      console.log('[Storage] Database berhasil dikosongkan total. Konfigurasi sensitif aman.');
      window.location.reload();
      return true;
    } catch (e) {
      console.error('[Storage] Reset failed:', e);
      return false;
    }
  },


  async clearLocalCache(): Promise<boolean> {
    try {
      localStorage.removeItem('cms_dark_mode');
      console.log('[Storage] Local session cache cleared on logout.');
      return true;
    } catch (e) {
      console.error('[Storage] Failed to clear local cache on logout:', e);
      return false;
    }
  }
};

// Auto-heal & separate mixed databases in browser (admin only or deferred idle)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (window.location.pathname.startsWith('/admin')) {
      storage.reconcileDatabaseIntegrity().catch(() => {});
    }
  }, 1500);
}

export default storage;
