/**
 * ══════════════════════════════════════════════════════════════════════
 * NON-AI AUTO BANNER & POSTER STUDIO ENGINE
 * High-speed 120 FPS deterministic Canvas rasterizer & Cloudinary pipeline.
 * Zero generative AI dependencies.
 * ══════════════════════════════════════════════════════════════════════
 */

export type BannerRatio = '1:1' | '9:16' | '16:9' | '2.4:1';
export type LogoPosition = 'topLeft' | 'topRight' | 'center' | 'none';

export interface BannerConfig {
  ratio: BannerRatio;
  headline: string;
  subtitle: string;
  badge: string;
  logoUrl: string;
  logoPosition: LogoPosition;
  bgImageUrl: string;
  overlayOpacity: number; // 0.1 to 0.9
  blur: number; // 0 to 20
  accentColor: string;
  footerText?: string;
}

export const BANNER_DIMENSIONS: Record<BannerRatio, { width: number; height: number; label: string }> = {
  '1:1': { width: 1080, height: 1080, label: 'Feed (1:1)' },
  '9:16': { width: 1080, height: 1920, label: 'Story (9:16)' },
  '16:9': { width: 1200, height: 630, label: 'Card (16:9)' },
  '2.4:1': { width: 1920, height: 800, label: 'Hero (2.4:1)' }
};

export type BannerPurpose = 'store' | 'category' | 'cover' | 'landing';

export interface BannerPurposePreset {
  id: BannerPurpose;
  label: string;
  ratio: BannerRatio;
  badge: string;
  headline: string;
  subtitle: string;
  bgImageUrl: string;
  overlayOpacity: number;
  logoPosition: LogoPosition;
  accentColor: string;
}

export const BANNER_PURPOSE_PRESETS: BannerPurposePreset[] = [
  {
    id: 'store',
    label: 'Banner Toko',
    ratio: '16:9',
    badge: 'PROMO SPESIAL',
    headline: 'Koleksi Produk Eksklusif',
    subtitle: 'Penawaran terbatas belanja online minggu ini dengan promo potongan harga',
    bgImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80',
    overlayOpacity: 0.5,
    logoPosition: 'topRight',
    accentColor: '#ef4444'
  },
  {
    id: 'category',
    label: 'Kategori Toko',
    ratio: '1:1',
    badge: 'KATEGORI TOKO',
    headline: 'Kategori Produk Unggulan',
    subtitle: 'Pilihan varian terbaik & siap dipesan langsung sekarang',
    bgImageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80',
    overlayOpacity: 0.45,
    logoPosition: 'topLeft',
    accentColor: '#3b82f6'
  },
  {
    id: 'cover',
    label: 'Sampul',
    ratio: '16:9',
    badge: 'SUMR.DAY ARCHIVE',
    headline: 'Brand Identity & Visual Architecture',
    subtitle: 'Dokumentasi visual karya, aset kreatif & panduan desain resmi',
    bgImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    overlayOpacity: 0.55,
    logoPosition: 'topLeft',
    accentColor: '#10b981'
  },
  {
    id: 'landing',
    label: 'Landing Page',
    ratio: '2.4:1',
    badge: 'CREATIVE STUDIO',
    headline: 'Kreativitas Visual Tanpa Batas',
    subtitle: 'Solusi desain terpadu, teknologi digital performa tinggi & pengalaman interaktif',
    bgImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
    overlayOpacity: 0.4,
    logoPosition: 'topLeft',
    accentColor: '#7c3aed'
  }
];

export const BANNER_BG_PRESETS: Array<{ label: string; url: string }> = [
  { label: 'Arsitektur', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80' },
  { label: 'Kopi', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80' },
  { label: 'Kantor', url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80' },
  { label: 'Minimalis', url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1400&q=80' },
  { label: 'Tech', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80' },
  { label: 'Alam', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=80' },
  { label: 'Gelap', url: '' }
];

// Helper to cache loaded images for 120 FPS real-time rendering
const imageCache: Map<string, HTMLImageElement> = new Map();

const loadImageAsync = (url: string): Promise<HTMLImageElement | null> => {
  if (!url) return Promise.resolve(null);
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete) return Promise.resolve(cached);
  }

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
};

/**
 * Draws crisp multi-line text with automatic line wrapping
 */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

/**
 * Renders the entire banner onto an HTML5 Canvas at full logical resolution
 */
export const renderBannerToCanvas = async (
  canvas: HTMLCanvasElement,
  config: BannerConfig
): Promise<void> => {
  const dim = BANNER_DIMENSIONS[config.ratio] || BANNER_DIMENSIONS['16:9'];
  canvas.width = dim.width;
  canvas.height = dim.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = dim.width;
  const H = dim.height;

  // 1. Draw Base Background (Solid dark gradient or Image)
  let bgImg: HTMLImageElement | null = null;
  if (config.bgImageUrl) {
    bgImg = await loadImageAsync(config.bgImageUrl);
  }

  if (bgImg) {
    // Cover-fit image
    const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
    const canvasRatio = W / H;
    let renderW = W;
    let renderH = H;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderH = W / imgRatio;
      offsetY = (H - renderH) / 2;
    } else {
      renderW = H * imgRatio;
      offsetX = (W - renderW) / 2;
    }

    if (config.blur > 0) {
      ctx.filter = `blur(${config.blur}px)`;
    }
    ctx.drawImage(bgImg, offsetX, offsetY, renderW, renderH);
    ctx.filter = 'none';
  } else {
    // Minimalist dark gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Draw Dark Tint Overlay & Cinematic Vignette
  const overlayOpacity = Math.max(0.15, Math.min(0.9, config.overlayOpacity || 0.45));
  ctx.fillStyle = `rgba(10, 11, 14, ${overlayOpacity})`;
  ctx.fillRect(0, 0, W, H);

  // Bottom gradient boost for readability
  const bottomGrad = ctx.createLinearGradient(0, H * 0.35, 0, H);
  bottomGrad.addColorStop(0, 'rgba(10, 11, 14, 0)');
  bottomGrad.addColorStop(1, 'rgba(10, 11, 14, 0.88)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, 0, W, H);

  // 3. Draw Brand Logo
  if (config.logoUrl && config.logoPosition !== 'none') {
    const logoImg = await loadImageAsync(config.logoUrl);
    if (logoImg) {
      const logoMaxW = Math.round(W * 0.12);
      const logoMaxH = Math.round(H * 0.12);
      const logoScale = Math.min(logoMaxW / logoImg.naturalWidth, logoMaxH / logoImg.naturalHeight, 1);
      const drawW = logoImg.naturalWidth * logoScale;
      const drawH = logoImg.naturalHeight * logoScale;

      let lx = W * 0.08;
      let ly = H * 0.08;

      if (config.logoPosition === 'topRight') {
        lx = W - drawW - (W * 0.08);
      } else if (config.logoPosition === 'center') {
        lx = (W - drawW) / 2;
        ly = H * 0.12;
      }

      // Rounded background plate for logo contrast
      const pad = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(lx - pad, ly - pad, drawW + (pad * 2), drawH + (pad * 2), 14);
      ctx.fill();

      ctx.drawImage(logoImg, lx, ly, drawW, drawH);
    }
  }

  // 4. Draw Badge / Category Label
  const contentLeft = W * 0.08;
  const contentMaxW = W * 0.84;
  let textY = H * 0.44;

  if (config.ratio === '9:16') {
    textY = H * 0.48;
  } else if (config.ratio === '2.4:1') {
    textY = H * 0.38;
  }

  if (config.badge) {
    const badgeText = config.badge.toUpperCase();
    ctx.font = `750 ${Math.round(W * 0.016)}px Inter, system-ui, sans-serif`;
    const bMetrics = ctx.measureText(badgeText);
    const bPadX = 14;
    const bPadY = 6;
    const bH = Math.round(W * 0.026);
    const bW = bMetrics.width + (bPadX * 2);

    ctx.fillStyle = config.accentColor || '#7c3aed';
    ctx.beginPath();
    ctx.roundRect(contentLeft, textY - bH + 2, bW, bH, 9999);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeText, contentLeft + bPadX, textY - 6);

    textY += Math.round(W * 0.045);
  }

  // 5. Draw Headline
  if (config.headline) {
    const headlineSize = config.ratio === '2.4:1'
      ? Math.round(W * 0.038)
      : Math.round(W * 0.048);

    ctx.font = `850 ${headlineSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    const headlineLines = wrapText(ctx, config.headline, contentMaxW);
    const lineHeight = headlineSize * 1.15;

    for (const line of headlineLines) {
      ctx.fillText(line, contentLeft, textY);
      textY += lineHeight;
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // 6. Draw Subtitle / Tagline
  if (config.subtitle) {
    textY += Math.round(W * 0.012);
    const subSize = config.ratio === '2.4:1'
      ? Math.round(W * 0.018)
      : Math.round(W * 0.022);

    ctx.font = `500 ${subSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#cbd5e1';

    const subLines = wrapText(ctx, config.subtitle, contentMaxW);
    const subLineHeight = subSize * 1.35;

    for (const sLine of subLines) {
      ctx.fillText(sLine, contentLeft, textY);
      textY += subLineHeight;
    }
  }

  // 7. Draw Footer Studio Watermark (Bottom Right)
  const footerText = config.footerText || 'sumr.day';
  ctx.font = `650 ${Math.round(W * 0.014)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  const fMetrics = ctx.measureText(footerText);
  ctx.fillText(footerText, W - fMetrics.width - (W * 0.08), H - (H * 0.06));
};

/**
 * Exports canvas content to high-efficiency WebP Blob (saving ~85% storage vs PNG)
 */
export const exportCanvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/webp',
  quality: number = 0.86
): Promise<Blob | null> => {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), mimeType, quality);
  });
};

/**
 * Generates Cloudinary remote fetch URL with text & logo overlays
 */
export const getCloudinaryDynamicBannerUrl = (
  config: BannerConfig,
  cloudName: string = 'dnm2vhhbv'
): string => {
  const dim = BANNER_DIMENSIONS[config.ratio] || BANNER_DIMENSIONS['16:9'];
  const cleanTitle = encodeURIComponent((config.headline || 'Banner Studio').slice(0, 70));
  const cleanSub = encodeURIComponent((config.subtitle || '').slice(0, 100));

  if (config.bgImageUrl) {
    return `https://res.cloudinary.com/${cloudName}/image/fetch/w_${dim.width},h_${dim.height},c_fill,e_brightness:-40/l_text:Arial_52_bold:${cleanTitle},co_rgb:ffffff,w_${Math.round(dim.width * 0.85)},c_fit,g_west,x_70,y_-40/l_text:Arial_26:${cleanSub},co_rgb:cbd5e1,w_${Math.round(dim.width * 0.85)},c_fit,g_west,x_70,y_60/f_auto,q_auto/${encodeURIComponent(config.bgImageUrl)}`;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${dim.width},h_${dim.height},c_fill,b_rgb:0f172a/l_text:Arial_54_bold:${cleanTitle},co_rgb:ffffff,w_${Math.round(dim.width * 0.85)},c_fit,g_west,x_70,y_-40/l_text:Arial_26:${cleanSub},co_rgb:94a3b8,w_${Math.round(dim.width * 0.85)},c_fit,g_west,x_70,y_60/f_auto,q_auto/sample.jpg`;
};

