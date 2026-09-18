import { doc, getDoc, setDoc, collection, onSnapshot, type DocumentReference, type Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { get, set, clear, entries } from 'idb-keyval';
import { applyAccentColor } from './theme';
import { GOOGLE_CONFIG, CLOUDINARY_CONFIG, AI_CONFIG } from '../config/AppConfig';

/**
 * Enrich settings object with values from environment variables (.env)
 * Prioritizes .env values so that configurations like Apps Script URL, Sheet ID, etc.
 * always reliably source from .env
 */
const enrichSettingsWithEnv = (settings: any): any => {
  const s = (settings && typeof settings === 'object') ? { ...settings } : {};
  if (GOOGLE_CONFIG.appsScriptUrl) {
    s.googleAppsScriptUrl = GOOGLE_CONFIG.appsScriptUrl;
  }
  if (GOOGLE_CONFIG.sheetId) {
    s.googleSheetId = GOOGLE_CONFIG.sheetId;
  }
  if (CLOUDINARY_CONFIG.cloudName) {
    s.cloudinaryName = CLOUDINARY_CONFIG.cloudName;
  }
  if (CLOUDINARY_CONFIG.uploadPreset) {
    s.cloudinaryPreset = CLOUDINARY_CONFIG.uploadPreset;
  }
  if (AI_CONFIG.geminiApiKey) {
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
  if (Array.isArray(obj)) return obj.map(item => cleanData(item, false)).filter(v => v !== undefined);
  if (typeof obj === 'string') {
    // If it's an excessively huge raw base64 string (>120KB) in Firestore sync payload, sanitize or log warning
    if (obj.startsWith('data:image/') && obj.length > 120000) {
      console.warn('[Storage] Oversized base64 image detected in Firestore sync payload. Please upload via Cloudinary to prevent Firestore 1MB quota breach.');
    }
    return obj;
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined && typeof v !== 'function')
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
  porto_activity_logs: 'data_analytics',
  porto_marketing_broadcasts: 'data_marketing',
  porto_notifications: 'data_marketing',
  porto_messages: 'data_messages',
  porto_contact_inbox: 'data_messages',
  porto_custom_games: 'data_games',
  porto_game_licenses: 'data_games',
  porto_game_dynamic_tags: 'data_games'
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
  syncChannel = new BroadcastChannel('agenze_sync_channel');
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
  _lastBackgroundSyncTime: {} as Record<string, number>,
  _writeDebounceTimers: {} as Record<string, any>,
  _pendingCloudPayloads: {} as Record<string, any>,
  _memCache: new Map<string, { value: any; timestamp: number }>(),

  /**
   * Background storage auto-pruner for cleaning temp files, expired cache, and capping logs
   */
  async autoPruneStorage(): Promise<void> {
    try {
      const allEntries = await entries();
      const now = Date.now();
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

      for (const [k, v] of allEntries) {
        const keyStr = String(k);
        // Prune stale drafts/temp
        if (keyStr.startsWith('temp_') || keyStr.startsWith('draft_')) {
          if (v && typeof v === 'object' && v.updatedAt && (now - v.updatedAt > ONE_WEEK_MS)) {
            await set(keyStr, null).catch(() => {});
          }
        }
      }

      // Cap activity logs to recent 100 entries to prevent memory / storage bloat
      const logsKey = this._getLocalKey('porto_activity_logs');
      const logs = await get(logsKey);
      if (Array.isArray(logs) && logs.length > 100) {
        const trimmedLogs = logs.slice(0, 100);
        await set(logsKey, trimmedLogs).catch(() => {});
      }
    } catch {
      // Fail silently
    }
  },

  async _safeSetLocal(key: string, value: any): Promise<void> {
    try {
      this._memCache.set(key, { value, timestamp: Date.now() });
      await set(key, value);
    } catch (err: any) {
      console.warn(`[Storage] IndexedDB set error for ${key}:`, err);
      if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
        try {
          const all = await entries();
          for (const [k] of all) {
            if (String(k).startsWith('temp_') || String(k).startsWith('draft_')) {
              await set(k, null).catch(() => {});
            }
          }
          await set(key, value);
        } catch (retryErr) {
          console.error(`[Storage] Failed after quota cleanup for ${key}:`, retryErr);
        }
      }
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
    if (currentScope === 'private' && currentUid) {
      return `${currentUid}_${key}`;
    }
    return key;
  },

  async _fetchCloudDocCached(key?: string): Promise<any> {
    const docName = this._getDocNameForKey(key);
    const now = Date.now();
    
    if (this._docCache[docName] && (now - (this._docCacheTime[docName] || 0) < 60000)) {
      return this._docCache[docName];
    }

    if (this._inFlightGetDoc[docName]) {
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
    const lastSync = this._lastBackgroundSyncTime[key] || 0;
    if (now - lastSync < 60000) return;
    this._lastBackgroundSyncTime[key] = now;

    try {
      const data = await this._fetchCloudDocCached(key);
      if (data && data[key] !== undefined && data[key] !== null) {
        const cloudVal = data[key];
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
    } catch {
      // Fail silently in background
    }
  },

  async getItem<T = any>(key: string, defaultValue: T | null = null): Promise<T> {
    const localKey = this._getLocalKey(key);
    try {
      // Check memory cache first (0ms instantaneous lookup)
      const mem = this._memCache.get(localKey);
      if (mem !== undefined && (Date.now() - mem.timestamp < 30000)) {
        const val = key === 'porto_settings' ? enrichSettingsWithEnv(mem.value) : mem.value;
        return val as T;
      }

      try {
        const localData = await get(localKey);
        if (localData !== undefined && localData !== null) {
          this._memCache.set(localKey, { value: localData, timestamp: Date.now() });
          const engine = getStorageEngine();
          if (engine === 'hybrid') {
            this._syncCloudInBackground(key, localKey, localData).catch(() => {});
          }
          const val = key === 'porto_settings' ? enrichSettingsWithEnv(localData) : localData;
          return val as T;
        }
      } catch (localErr) {
        console.warn(`[Storage] Local DB read failed for ${localKey}`, localErr);
      }

      const engine = getStorageEngine();
      if (engine === 'hybrid') {
        const data = await this._fetchCloudDocCached(key);
        if (data) {
          let cloudVal = data[key];
          if (key === 'porto_biodata' && cloudVal === undefined && data['porto_settings']?.biodata) {
            cloudVal = data['porto_settings'].biodata;
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

  listenItem(key: string, callback: (data: any) => void, defaultValue: any = null): Unsubscribe {
    const localKey = this._getLocalKey(key);
    const docName = this._getDocNameForKey(key);
    const engine = getStorageEngine();
    
    const wrapCallback = (val: any) => {
      const enriched = key === 'porto_settings' ? enrichSettingsWithEnv(val) : val;
      callback(enriched);
    };

    get(localKey).then(localData => {
      if (localData !== undefined && localData !== null) {
        wrapCallback(localData);
      } else {
        wrapCallback(defaultValue);
      }
    }).catch(() => {
      wrapCallback(defaultValue);
    });

    const handleLocalDirty = (e: any) => {
      if (e && e.detail && e.detail.key === key) {
        wrapCallback(e.detail.value);
      }
    };

    const handleBgSynced = (e: any) => {
      if (e && e.detail && e.detail.key === key) {
        wrapCallback(e.detail.value);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('porto_storage_dirty', handleLocalDirty);
      window.addEventListener('porto_bg_synced', handleBgSynced);
    }

    let firestoreUnsubscribe: Unsubscribe | null = null;

    if (engine === 'hybrid') {
      const docRef = this._getRef(key);
      firestoreUnsubscribe = onSnapshot(docRef, { includeMetadataChanges: false }, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          this._docCache[docName] = data;
          this._docCacheTime[docName] = Date.now();
          
          let cloudVal = data[key];
          if (key === 'porto_biodata' && cloudVal === undefined && data['porto_settings']?.biodata) {
            cloudVal = data['porto_settings'].biodata;
          }

          if (cloudVal !== undefined && cloudVal !== null) {
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
        }
      }, (error) => {
        console.warn(`[Storage] Realtime snapshot error for ${key}:`, error);
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('porto_storage_dirty', handleLocalDirty);
        window.removeEventListener('porto_bg_synced', handleBgSynced);
      }
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  },

  async setItem(key: string, value: any, syncCloud: boolean = true): Promise<boolean> {
    const localKey = this._getLocalKey(key);
    try {
      let finalValue = value;
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

      await this._safeSetLocal(localKey, finalValue);
      
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
        } else if (key === 'porto_blog') {
          window.dispatchEvent(new CustomEvent('porto_blog_updated', { detail: finalValue }));
        } else if (key === 'porto_catalog') {
          window.dispatchEvent(new CustomEvent('porto_catalog_updated', { detail: finalValue }));
        } else if (key === 'porto_portfolio') {
          window.dispatchEvent(new CustomEvent('porto_portfolio_updated', { detail: finalValue }));
        } else if (key === 'porto_games_data') {
          window.dispatchEvent(new CustomEvent('porto_games_updated', { detail: finalValue }));
        } else if (key === 'porto_transactions') {
          window.dispatchEvent(new CustomEvent('porto_transactions_updated', { detail: finalValue }));
        }
      }
      
      if (syncChannel) {
        try {
          syncChannel.postMessage({ type: 'SYNC', key, value: finalValue });
        } catch {}
      }

      const currentSyncMode = typeof localStorage !== 'undefined' ? (localStorage.getItem('porto_sync_mode') || 'auto') : 'auto';
      const engine = getStorageEngine();

      if (syncCloud && !isUnchanged && currentSyncMode !== 'offline' && engine === 'hybrid') {
        const docRef = this._getRef(key);
        const docName = this._getDocNameForKey(key);
        let cloudPayloadData = finalValue;
        if (key === 'porto_memo_notes' && Array.isArray(finalValue)) {
          cloudPayloadData = finalValue.filter((n: any) => !n.isOfflineOnly);
        }
        
        this._scheduleCloudWrite(key, cloudPayloadData, docRef, docName, valueStr);
      }

      return true;
    } catch (e) {
      console.error(`[Storage] Error writing ${key}:`, e);
      throw e;
    }
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

    try {
      const payload: Record<string, any> = { [key]: cleanData(item.cloudPayloadData) };
      if (key === 'porto_biodata') {
        payload['porto_biodata'] = cleanData(item.cloudPayloadData);
      }
      await setDoc(item.docRef, payload, { merge: true });
      this._lastWrittenCache[key] = item.valueStr;
      if (this._docCache[item.docName]) {
        this._docCache[item.docName][key] = cleanData(item.cloudPayloadData);
      }
    } catch (err) {
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
    this._debouncePending[key] = value;
    const localKey = this._getLocalKey(key);
    set(localKey, value).catch(() => {});

    if (this._debounceTimers[key]) {
      clearTimeout(this._debounceTimers[key]);
    }

    this._debounceTimers[key] = setTimeout(async () => {
      try {
        await this.setItem(key, value, true);
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

      // 3. Kosongkan semua dokumen partisi Firestore di koleksi cms/
      const partitionDocs = [
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
      ];

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

export default storage;
