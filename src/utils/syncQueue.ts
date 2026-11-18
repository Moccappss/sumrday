/**
 * =========================================================================================
 * OUTBOX SYNC QUEUE & RESILIENT OFFLINE-FIRST DISPATCHER
 * sumr.day OS & PORTO 2026 CMS
 * =========================================================================================
 * 
 * Menangani antrean mutasi data ketika pengguna berada di jaringan lambat/offline.
 * Mencegah duplikasi data dengan Idempotency Key dan melakukan auto-retry saat kembali online.
 */

import { storage } from './storage';

export interface OutboxItem<T = any> {
  id: string;
  action: string;
  payload: T;
  idempotencyKey: string;
  createdAt: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  nextRetryAt?: number;
  errorMsg?: string;
}

export interface OutboxStats {
  total: number;
  pending: number;
  syncing: number;
  failed: number;
  completed: number;
}

export type ActionHandler<T = any> = (payload: T, idempotencyKey: string) => Promise<boolean | void>;

const OUTBOX_STORAGE_KEY = 'porto_outbox_queue';
const handlers = new Map<string, ActionHandler>();
let isProcessing = false;

/**
 * Register a handler for a specific action type (e.g. 'submit_order', 'update_project')
 */
export function registerSyncHandler<T = any>(action: string, handler: ActionHandler<T>) {
  handlers.set(action, handler);
}

/**
 * Generate a unique idempotency key
 */
export function createIdempotencyKey(prefix: string = 'act'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get all queued outbox items
 */
export async function getOutboxQueue(): Promise<OutboxItem[]> {
  try {
    const raw = await storage.getItem<OutboxItem[]>(OUTBOX_STORAGE_KEY, []);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/**
 * Save current queue to storage and notify UI
 */
async function saveQueue(queue: OutboxItem[]) {
  await storage.setItem(OUTBOX_STORAGE_KEY, queue, false);
  if (typeof window !== 'undefined') {
    const pendingCount = queue.filter(q => q.status === 'pending' || q.status === 'failed').length;
    window.dispatchEvent(new CustomEvent('porto_sync_status_changed', {
      detail: { pendingCount, total: queue.length }
    }));
  }
}

/**
 * Enqueue a new mutation into the outbox
 */
export async function enqueueOutbox<T = any>(
  action: string,
  payload: T,
  options: { idempotencyKey?: string; maxRetries?: number } = {}
): Promise<OutboxItem<T>> {
  const queue = await getOutboxQueue();
  const idempotencyKey = options.idempotencyKey || createIdempotencyKey(action);

  // Prevent duplicate insertion if idempotencyKey already queued
  const existing = queue.find(q => q.idempotencyKey === idempotencyKey);
  if (existing) {
    return existing as OutboxItem<T>;
  }

  const newItem: OutboxItem<T> = {
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    payload,
    idempotencyKey,
    createdAt: Date.now(),
    retries: 0,
    maxRetries: options.maxRetries ?? 3,
    status: 'pending',
  };

  queue.push(newItem);
  await saveQueue(queue);

  // Trigger immediate process if online
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    processOutboxQueue().catch(() => {});
  }

  return newItem;
}

/**
 * Process all pending items in the outbox
 */
export async function processOutboxQueue(): Promise<{ processed: number; failures: number }> {
  if (isProcessing) return { processed: 0, failures: 0 };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { processed: 0, failures: 0 };
  }

  isProcessing = true;
  let processed = 0;
  let failures = 0;

  try {
    const now = Date.now();
    const queue = await getOutboxQueue();
    const pendingItems = queue.filter(
      item =>
        item.status === 'pending' &&
        (!item.nextRetryAt || item.nextRetryAt <= now)
    );

    for (const item of pendingItems) {
      const handler = handlers.get(item.action);
      if (!handler) {
        // No handler registered, skip for now
        continue;
      }

      item.status = 'syncing';
      await saveQueue(queue);

      try {
        await handler(item.payload, item.idempotencyKey);
        item.status = 'completed';
        item.nextRetryAt = undefined;
        item.errorMsg = undefined;
        processed++;
      } catch (err: any) {
        item.retries += 1;
        item.errorMsg = err?.message || 'Gagal sinkronisasi';
        if (item.retries >= item.maxRetries) {
          item.status = 'failed';
          item.nextRetryAt = undefined;
        } else {
          // Exponential backoff: 5s, 15s, 45s... capped at 5 minutes
          const backoffMs = Math.min(5000 * Math.pow(3, item.retries - 1), 5 * 60 * 1000);
          item.status = 'pending';
          item.nextRetryAt = Date.now() + backoffMs;
        }
        failures++;
      }

      await saveQueue(queue);
    }

    // Clean up completed items older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const cleanQueue = queue.filter(item => !(item.status === 'completed' && item.createdAt < oneDayAgo));
    if (cleanQueue.length !== queue.length) {
      await saveQueue(cleanQueue);
    }
  } finally {
    isProcessing = false;
  }

  return { processed, failures };
}

/**
 * Get summary counts of items in the outbox queue (for Admin / Sync Monitor UI)
 */
export async function getOutboxStats(): Promise<OutboxStats> {
  const queue = await getOutboxQueue();
  return queue.reduce<OutboxStats>(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] += 1;
      return acc;
    },
    { total: 0, pending: 0, syncing: 0, failed: 0, completed: 0 }
  );
}

/**
 * Reset failed items back to pending and trigger immediate processing
 */
export async function retryFailedOutbox(): Promise<{ processed: number; failures: number }> {
  const queue = await getOutboxQueue();
  let hasChanges = false;
  for (const item of queue) {
    if (item.status === 'failed') {
      item.status = 'pending';
      item.retries = 0;
      item.nextRetryAt = undefined;
      item.errorMsg = undefined;
      hasChanges = true;
    }
  }
  if (hasChanges) {
    await saveQueue(queue);
  }
  return processOutboxQueue();
}

/**
 * Manually clear all completed items from the outbox queue
 */
export async function clearCompletedOutbox(): Promise<number> {
  const queue = await getOutboxQueue();
  const remaining = queue.filter(item => item.status !== 'completed');
  const removed = queue.length - remaining.length;
  if (removed > 0) {
    await saveQueue(remaining);
  }
  return removed;
}

// Default background handler for queued offline orders
registerSyncHandler('submit_order', async (orderTrx: any) => {
  try {
    const { googleSync } = await import('./googleSync');
    const existing = await storage.getItem<any[]>('porto_transactions', []);
    if (!existing.some((t: any) => t.id === orderTrx.id)) {
      await storage.setItem('porto_transactions', [orderTrx, ...existing]);
    }
    await googleSync.syncTransactions([orderTrx, ...existing], null);

    // Also sync client order records to Firestore porto_orders if any items in local cache
    try {
      const raw = localStorage.getItem('porto_client_orders');
      if (raw) {
        const localOrders = JSON.parse(raw);
        const matchingOrders = localOrders.filter((o: any) => o.orderId === orderTrx.id || o.id === orderTrx.id);
        if (matchingOrders.length > 0) {
          const { db } = await import('../firebase');
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          for (const mOrder of matchingOrders) {
            await setDoc(doc(db, 'porto_orders', mOrder.id), {
              ...mOrder,
              syncedFromOffline: true,
              updatedAtServer: serverTimestamp()
            }, { merge: true });
          }
        }
      }
    } catch (eOrderSync) {
      console.warn('[SyncQueue] Firestore order sync retry warning:', eOrderSync);
    }

    console.info(`[SyncQueue] Pesanan offline ${orderTrx.id} berhasil disinkronkan ke cloud.`);
  } catch (err) {
    console.warn('[SyncQueue] submit_order retry error:', err);
    throw err;
  }
});

// Auto-listen to network state changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('[SyncQueue] Jaringan online kembali terdeteksi, memproses antrean...');
    processOutboxQueue().catch(() => {});
  });
}
