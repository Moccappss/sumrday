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
  estimateObjectSizeBytes,
  formatBytes,
  smartDeduplicate,
  pruneEphemeralCaches,
  getBrowserStorageQuota,
  requestPersistentStorage,
} from '../intelligentStorageEngine';

describe('intelligentStorageEngine', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('estimates byte size and formats human-readable sizes', () => {
    expect(estimateObjectSizeBytes({ hello: 'world' })).toBeGreaterThan(0);
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.00 MB');
  });

  it('deduplicates arrays by primary key while preserving order', () => {
    const input = [
      { id: 'a', name: 'First' },
      { id: 'b', name: 'Second' },
      { id: 'a', name: 'Duplicate' },
    ];
    const result = smartDeduplicate(input, 'id');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First');
    expect(result[1].id).toBe('b');
  });

  it('prunes oversized ephemeral logs and notifications without touching core data', async () => {
    const logs = Array.from({ length: 350 }, (_, i) => ({ id: `log-${i}` }));
    const notifs = Array.from({ length: 180 }, (_, i) => ({ id: `notif-${i}` }));
    const projects = [{ id: 'proj-1', title: 'Core Project' }];

    mockStore.set('porto_activity_logs', logs);
    mockStore.set('porto_notifications', notifs);
    mockStore.set('porto_projects', projects);

    const result = await pruneEphemeralCaches();
    expect(result.prunedKeys).toBeGreaterThanOrEqual(2);
    expect(result.removedItems).toBe(50 + 30);

    expect(mockStore.get('porto_activity_logs')).toHaveLength(300);
    expect(mockStore.get('porto_notifications')).toHaveLength(150);
    expect(mockStore.get('porto_projects')).toEqual(projects);
  });

  it('reports browser storage quota and requests persistent storage safely', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        estimate: vi.fn(async () => ({ usage: 850, quota: 1000 })),
        persisted: vi.fn(async () => false),
        persist: vi.fn(async () => true),
      },
    });

    const quota = await getBrowserStorageQuota();
    expect(quota.supported).toBe(true);
    expect(quota.usagePercent).toBe(85);
    expect(quota.isLowStorage).toBe(true);

    const persisted = await requestPersistentStorage();
    expect(persisted).toBe(true);
  });
});
