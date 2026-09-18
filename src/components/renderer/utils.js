export const buildStickerFilter = (s) => {
  if (!s.shadow || s.shadow === 'none' || s.shadow === 'inner') return undefined;
  const c = s.shadowColor || 'rgba(0,0,0,0.35)';
  const b = s.shadowBlur ?? 10;
  const x = s.shadowX ?? 0;
  const y = s.shadowY ?? 5;
  if (s.shadow === 'glow')
    return `drop-shadow(${x}px ${y}px ${b}px ${c}) drop-shadow(${x}px ${y}px ${b * 1.6}px ${c})`;
  return `drop-shadow(${x}px ${y}px ${b}px ${c})`;
};

/**
 * Generate video poster URL from a Cloudinary video URL.
 * Returns empty string for non-Cloudinary sources.
 */
export const getVideoPoster = (url) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    let posterUrl = url.replace(/\.(mp4|webm|mov|avi|mkv|ogv|3gp)$/i, '.jpg');
    posterUrl = posterUrl.replace('/video/upload/', '/video/upload/w_800,q_auto,so_0/');
    return posterUrl;
  }
  return '';
};

/**
 * Extract YouTube video ID from various URL formats.
 */
export const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

/**
 * Ensure a URL is absolute (adds https:// prefix if missing).
 */
export const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:')
  ) return url;
  return `https://${url}`;
};

export const getOptimizedUrl = (url, width = 800, block = {}) => {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  if (url.includes('__LOCAL_ONLY_BASE64_PLACEHOLDER__')) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="%23ea580c">%E2%9A%A0%EF%B8%8F GAMBAR OFFLINE RAKSASA</text><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="%2394a3b8">Gambar ini disimpan lokal di browser asal. Harap unggah via Cloudinary agar tersinkron.</text></svg>`;
  }
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || url.includes('localhost') || url.includes('127.0.0.1')) return url;
  if (url.trim().startsWith('<svg') || url.includes('<svg')) return url;
  if (url.includes('cloudinary.com')) {
    const transforms = ['f_auto', 'q_auto', `w_${width}`];
    if (block.c_aspect) transforms.push(block.c_aspect);
    if (block.c_gravity) transforms.push(block.c_gravity);
    if (block.c_effect) transforms.push(block.c_effect);
    return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
  }
  if (url.includes('weserv.nl')) return url;
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
};

export const hexToRgba = (hex, opacity) => {
  if (!hex || hex.startsWith('rgba')) return hex;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity ?? 1})`;
};
