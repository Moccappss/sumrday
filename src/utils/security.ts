import DOMPurify from 'dompurify';

/**
 * Enterprise-grade Security & Sanitization Utilities
 * Protects against XSS (Cross-Site Scripting), CSS Injections, Open Redirects, and malicious payloads.
 */

// Configure default strict hooks for DOMPurify
if (typeof window !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Force all target="_blank" links to have rel="noopener noreferrer"
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/**
 * Sanitize rich HTML content (e.g. blog posts, project descriptions)
 * Strips script tags, unsafe iframe, object, embed, and inline event handlers (onload, onerror, etc.)
 */
export const safeHtml = (dirty: string | null | undefined): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'b', 'i', 'strong', 'em', 'u', 's', 'strike',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'br',
      'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'section', 'article', 'small', 'mark', 'sub', 'sup'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style',
      'width', 'height', 'loading', 'decoding', 'colspan', 'rowspan'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitize SVG data to prevent SVG-based XSS vectors
 */
export const safeSvg = (dirtySvg: string | null | undefined): string => {
  if (!dirtySvg || typeof dirtySvg !== 'string') return '';
  return DOMPurify.sanitize(dirtySvg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: [
      'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon',
      'ellipse', 'defs', 'linearGradient', 'radialGradient', 'stop', 'use', 'symbol', 'text', 'tspan'
    ],
    ALLOWED_ATTR: [
      'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
      'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
      'points', 'xmlns', 'id', 'class', 'style', 'opacity', 'fill-opacity', 'stroke-opacity',
      'transform', 'offset', 'stop-color', 'stop-opacity'
    ],
    ADD_ATTR: ['aria-hidden', 'role'],
  });
};

/**
 * Validate and sanitize external URL to prevent javascript: or data: phishing / execution
 */
export const safeUrl = (url: string | null | undefined, fallback: string = '#'): string => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  
  // Disallow javascript:, vbscript:, data: pseudo-protocols
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    console.warn('[Security] Blocked dangerous URL protocol:', trimmed);
    return fallback;
  }
  
  // Allow internal relative paths
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }
  
  // Allow valid http / https / mailto / tel URLs
  if (/^(https?:\/\/|mailto:|tel:|wa\.me\/)/i.test(trimmed)) {
    return trimmed;
  }
  
  // Default to https if plain domain
  if (/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

/**
 * Escapes pure text for safe rendering
 */
export const escapeText = (text: string | null | undefined): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * In-memory client rate limiter to protect public actions (forms, chat, AI generation) from spam
 */
const rateLimitMap = new Map<string, number[]>();

export const checkRateLimit = (
  actionKey: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; retryAfterSec: number } => {
  const now = Date.now();
  const attempts = rateLimitMap.get(actionKey) || [];
  
  // Filter out attempts outside current time window
  const recentAttempts = attempts.filter(ts => now - ts < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    const oldest = recentAttempts[0];
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }
  
  recentAttempts.push(now);
  rateLimitMap.set(actionKey, recentAttempts);
  
  return {
    allowed: true,
    remaining: maxAttempts - recentAttempts.length,
    retryAfterSec: 0
  };
};

export default {
  safeHtml,
  safeSvg,
  safeUrl,
  escapeText,
  checkRateLimit
};
