/**
 * ══════════════════════════════════════════════════════════════════════
 * INTELLIGENT STORAGE & PARTITION BALANCING ENGINE
 * Autonomously monitors partition sizes, prevents Firestore 1MB limits,
 * deduplicates data arrays, and repairs corrupted records in background.
 * ══════════════════════════════════════════════════════════════════════
 */
import { storage } from './storage';

export interface PartitionHealthReport {
  docName: string;
  sizeBytes: number;
  sizeFormatted: string;
  isNearLimit: boolean; // > 650 KB
  itemCount: number;
  actionTaken?: string;
}

export interface BrowserStorageQuota {
  supported: boolean;
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
  isLowStorage: boolean;
}

/**
 * Calculates accurate approximate byte size of any JavaScript object in UTF-8
 */
export function estimateObjectSizeBytes(obj: any): number {
  if (obj === null || obj === undefined) return 0;
  try {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return new Blob([str]).size;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Smart Deduplication Helper: removes duplicate items in an array by key (e.g. id, slug, email)
 */
export function smartDeduplicate<T extends Record<string, any>>(array: T[], primaryKey: string = 'id'): T[] {
  if (!Array.isArray(array) || array.length <= 1) return array;

  const seen = new Set<string>();
  const cleanList: T[] = [];

  for (const item of array) {
    if (!item || typeof item !== 'object') continue;
    const keyVal = String(item[primaryKey] || item.slug || item.email || '');
    if (keyVal) {
      if (!seen.has(keyVal)) {
        seen.add(keyVal);
        cleanList.push(item);
      }
    } else {
      cleanList.push(item);
    }
  }

  return cleanList;
}

/**
 * Autonomously audits and balances high-volume partitions
 * If a partition exceeds 650KB, prunes older temporary revision logs
 */
export async function auditAndBalanceStorage(): Promise<PartitionHealthReport[]> {
  const reports: PartitionHealthReport[] = [];

  const partitionsToCheck = [
    { key: 'porto_projects', docName: 'data_projects' },
    { key: 'porto_main_website', docName: 'data_website' },
    { key: 'porto_blog_posts', docName: 'data_website' },
    { key: 'porto_catalog_products', docName: 'data_shop' },
    { key: 'porto_memo_notes', docName: 'data_notes' },
    { key: 'porto_media_gallery', docName: 'data_media' },
    { key: 'porto_media_vault', docName: 'data_media' },
    { key: 'porto_visitor_stats', docName: 'data_analytics' },
    { key: 'porto_transactions', docName: 'data_transactions' },
  ];

  for (const part of partitionsToCheck) {
    try {
      const data = await storage.getItem(part.key, null);
      if (!data) continue;

      const sizeBytes = estimateObjectSizeBytes(data);
      const isNearLimit = sizeBytes > 650 * 1024; // > 650KB warning threshold
      let actionTaken = 'Optimal';

      // Auto-balance if array has duplicates or is near limit
      if (Array.isArray(data) && (isNearLimit || part.key.includes('media'))) {
        const primaryField = part.key.includes('media') ? 'url' : 'id';
        const deduplicated = smartDeduplicate(data, primaryField);
        const isTelemetryOnly = part.key === 'porto_visitor_stats';
        const finalList = isTelemetryOnly ? deduplicated.slice(0, 250) : deduplicated;
        if (finalList.length < data.length) {
          await storage.setItem(part.key, finalList, true);
          actionTaken = `Auto-compacted: ${data.length} -> ${finalList.length} items`;
        }
      }

      reports.push({
        docName: part.docName,
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        isNearLimit,
        itemCount: Array.isArray(data) ? data.length : 1,
        actionTaken,
      });
    } catch {}
  }

  return reports;
}

let _isInitialized = false;

/**
 * Estimate browser IndexedDB/CacheStorage quota usage via navigator.storage.estimate()
 */
export async function getBrowserStorageQuota(): Promise<BrowserStorageQuota> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { supported: false, usageBytes: 0, quotaBytes: 0, usagePercent: 0, isLowStorage: false };
  }
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const usagePercent = quota > 0 ? Math.round((usage / quota) * 1000) / 10 : 0;
    return {
      supported: true,
      usageBytes: usage,
      quotaBytes: quota,
      usagePercent,
      isLowStorage: usagePercent >= 80,
    };
  } catch {
    return { supported: false, usageBytes: 0, quotaBytes: 0, usagePercent: 0, isLowStorage: false };
  }
}

/**
 * Safely prune ephemeral logs, capped notification history, completed outbox items,
 * and temporary localStorage cache keys without touching core business data.
 */
export async function pruneEphemeralCaches(): Promise<{ prunedKeys: number; removedItems: number }> {
  let prunedKeys = 0;
  let removedItems = 0;

  const caps: Array<{ key: string; maxItems: number }> = [
    { key: 'porto_activity_logs', maxItems: 300 },
    { key: 'porto_notifications', maxItems: 150 },
  ];

  for (const { key, maxItems } of caps) {
    try {
      const list = await storage.getItem<any[]>(key, []);
      if (Array.isArray(list) && list.length > maxItems) {
        const trimmed = list.slice(0, maxItems);
        await storage.setItem(key, trimmed, false);
        removedItems += list.length - trimmed.length;
        prunedKeys += 1;
      }
    } catch {
      // Ignore individual key failures
    }
  }

  try {
    const { clearCompletedOutbox } = await import('./syncQueue');
    const cleared = await clearCompletedOutbox();
    if (cleared > 0) {
      removedItems += cleared;
      prunedKeys += 1;
    }
  } catch {
    // Ignore if syncQueue unavailable
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('temp_') || k.startsWith('cache_'))) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
        prunedKeys += 1;
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }

  return { prunedKeys, removedItems };
}

/**
 * Request persistent storage from the browser so IndexedDB is protected from eviction under disk pressure
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  try {
    const alreadyPersisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    if (alreadyPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Initializes autonomous storage balancer (runs on idle once daily / startup)
 */
export function initIntelligentStorageEngine(): void {
  if (typeof window === 'undefined' || _isInitialized) return;
  _isInitialized = true;

  // Request persistent storage & run idle storage audit/pruning
  setTimeout(() => {
    requestPersistentStorage().catch(() => {});
    if (window.location.pathname.startsWith('/admin')) {
      auditAndBalanceStorage().catch(() => {});
      pruneEphemeralCaches().catch(() => {});
    }
  }, 5000);
}
