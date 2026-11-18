import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStore = new Map<string, any>();

vi.mock('../storage', () => ({
  storage: {
    getItem: vi.fn(async (key: string, fallback: any) => {
      return mockStore.has(key) ? JSON.parse(JSON.stringify(mockStore.get(key))) : fallback;
    }),
    setItem: vi.fn(async (key: string, value: any) => {
      mockStore.set(key, JSON.parse(JSON.stringify(value)));
    }),
  },
}));

import {
  enqueueOutbox,
  processOutboxQueue,
  registerSyncHandler,
  getOutboxStats,
  retryFailedOutbox,
  clearCompletedOutbox,
  getOutboxQueue,
} from '../syncQueue';

describe('syncQueue (Offline-First Outbox Engine)', () => {
  beforeEach(() => {
    mockStore.clear();
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('deduplicates items with the same idempotencyKey', async () => {
    const first = await enqueueOutbox('test_dedup', { n: 1 }, { idempotencyKey: 'same-key' });
    const second = await enqueueOutbox('test_dedup', { n: 2 }, { idempotencyKey: 'same-key' });

    expect(second.id).toBe(first.id);
    const queue = await getOutboxQueue();
    expect(queue).toHaveLength(1);
  });

  it('processes queued items and updates outbox stats', async () => {
    const handler = vi.fn(async () => true);
    registerSyncHandler('test_ok', handler);

    vi.stubGlobal('navigator', { onLine: false });
    await enqueueOutbox('test_ok', { orderId: 'ORD-1' }, { idempotencyKey: 'k-ok-1' });
    vi.stubGlobal('navigator', { onLine: true });
    const result = await processOutboxQueue();

    expect(result.processed).toBe(1);
    expect(result.failures).toBe(0);
    expect(handler).toHaveBeenCalledTimes(1);

    const stats = await getOutboxStats();
    expect(stats.completed).toBe(1);
    expect(stats.pending).toBe(0);

    const removed = await clearCompletedOutbox();
    expect(removed).toBe(1);
    expect((await getOutboxStats()).total).toBe(0);
  });

  it('applies exponential backoff on failure and supports manual retryFailedOutbox', async () => {
    let shouldFail = true;
    registerSyncHandler('test_retry', async () => {
      if (shouldFail) throw new Error('Network timeout');
    });

    vi.stubGlobal('navigator', { onLine: false });
    await enqueueOutbox('test_retry', { id: 1 }, { idempotencyKey: 'k-retry-1', maxRetries: 2 });
    vi.stubGlobal('navigator', { onLine: true });

    // First failure -> stays pending with nextRetryAt set in the future
    const firstRun = await processOutboxQueue();
    expect(firstRun.failures).toBe(1);
    let queue = await getOutboxQueue();
    expect(queue[0].status).toBe('pending');
    expect(queue[0].retries).toBe(1);
    expect(queue[0].nextRetryAt).toBeGreaterThan(Date.now());

    // Immediate run skips item because backoff window hasn't elapsed
    const skippedRun = await processOutboxQueue();
    expect(skippedRun.processed).toBe(0);
    expect(skippedRun.failures).toBe(0);

    // Simulate backoff elapsed -> second failure hits maxRetries -> marks as failed
    queue[0].nextRetryAt = Date.now() - 1000;
    mockStore.set('porto_outbox_queue', queue);

    const secondRun = await processOutboxQueue();
    expect(secondRun.failures).toBe(1);
    expect((await getOutboxStats()).failed).toBe(1);

    // Manual retry after recovery succeeds
    shouldFail = false;
    const retried = await retryFailedOutbox();
    expect(retried.processed).toBe(1);
    expect((await getOutboxStats()).completed).toBe(1);
  });
});
