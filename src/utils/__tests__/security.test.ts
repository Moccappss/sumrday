import { describe, it, expect } from 'vitest';
import { safeUrl, escapeText, checkRateLimit, safeJsonParse, maskSensitiveString } from '../security';

describe('security utilities', () => {
  it('blocks dangerous URL protocols and allows safe ones', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl('DATA:text/html,<script>alert(1)</script>')).toBe('#');
    expect(safeUrl('vbscript:msgbox(1)')).toBe('#');

    expect(safeUrl('https://sumr.day/shop')).toBe('https://sumr.day/shop');
    expect(safeUrl('/admin/dashboard')).toBe('/admin/dashboard');
    expect(safeUrl('sumr.day')).toBe('https://sumr.day');
  });

  it('escapes HTML special characters in plain text', () => {
    expect(escapeText('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('enforces in-memory rate limits per action key', () => {
    const key = `test-rate-${Date.now()}`;
    expect(checkRateLimit(key, 2, 60000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60000).allowed).toBe(true);

    const third = checkRateLimit(key, 2, 60000);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it('parses JSON safely and strips prototype-pollution keys', () => {
    const malicious = '{"name":"sumr","__proto__":{"polluted":true},"constructor":{"bad":1}}';
    const parsed = safeJsonParse<Record<string, any>>(malicious, {});
    expect(parsed.name).toBe('sumr');
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(parsed, 'constructor')).toBe(false);
    expect(safeJsonParse('invalid-json{', { ok: false })).toEqual({ ok: false });
  });

  it('masks sensitive strings safely', () => {
    expect(maskSensitiveString('AIzaSyD1234567890XYZ', 4)).toBe('AIza********0XYZ');
    expect(maskSensitiveString('12345', 4)).toBe('*****');
  });
});
