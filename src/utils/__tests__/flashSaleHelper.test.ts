import { describe, it, expect } from 'vitest';
import { getFlashSaleTimeRemaining } from '../flashSaleHelper';

describe('flashSaleHelper', () => {
  it('returns expired state for empty, invalid, or past timestamps', () => {
    expect(getFlashSaleTimeRemaining(null).isExpired).toBe(true);
    expect(getFlashSaleTimeRemaining('not-a-date').isExpired).toBe(true);

    const past = new Date(Date.now() - 10_000).toISOString();
    expect(getFlashSaleTimeRemaining(past).isExpired).toBe(true);
  });

  it('computes remaining time for active flash sale timestamps', () => {
    const future = new Date(Date.now() + 90_500).toISOString();
    const result = getFlashSaleTimeRemaining(future);

    expect(result.isExpired).toBe(false);
    expect(result.totalSeconds).toBeGreaterThanOrEqual(89);
    expect(result.minutes).toBeGreaterThanOrEqual(1);
    expect(result.formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
