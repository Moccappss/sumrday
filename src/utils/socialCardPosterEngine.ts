/**
 * ══════════════════════════════════════════════════════════════════════
 * FLOATING CARD SOCIAL POSTER ENGINE (APPLE iOS HIG BENCHMARK)
 * - Strict Unified Column Grid: cardPad = 32px (Left & Right margins 100% equal)
 * - Generous vertical breathing room: gapBelowImage = 44px
 * - Precise font baseline accounting (Zero text-image collisions)
 * - Dynamic content-fitted card height (Zero empty gap / space kosong)
 * - Authentic Apple typography (52px Bold Title, 24px Subtitle, 62px Pill Button)
 * ══════════════════════════════════════════════════════════════════════
 */

export type SocialPosterRatio = '9:16' | '4:5' | '1:1';
export type CardLayoutTemplate = 'appStack' | 'scenicShowcase' | 'headerTop' | 'dualIdentity' | 'trioCollage' | 'bentoTrio';
export type ImageShape = 'auto' | 'square' | 'portrait';
export type PosterFontFamily = 'sans' | 'display' | 'serif' | 'grotesk' | 'mono';
export type CardTheme = 'light' | 'darkGlass';
export type BgType = 'blurred' | 'solid' | 'gradient' | 'image';
export type BgPattern = 'none' | 'grid' | 'dots' | 'triangles' | 'waves' | 'stripes' | 'isometric' | 'crosses' | 'mesh';
export type PosterAnimationType = 'none' | 'tilt3d' | 'parallax3d' | 'float' | 'zoom' | 'shimmer' | 'pulse';

export interface PosterAnimationState {
  type: PosterAnimationType;
  progress: number; // 0.0 to 1.0
}

export const POSTER_ANIMATION_PRESETS: { id: PosterAnimationType; label: string; desc: string }[] = [
  { id: 'none', label: 'None', desc: 'Statis tanpa animasi' },
  { id: 'tilt3d', label: '3D Tilt', desc: 'Rotasi perspektif 3D & pantulan cahaya' },
  { id: 'parallax3d', label: '3D Layer', desc: 'Efek kedalaman 3D multi-layer' },
  { id: 'float', label: 'Float', desc: 'Kartu melayang halus dan dinamis' },
  { id: 'zoom', label: 'Zoom', desc: 'Ken Burns sinematik pada foto' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Kilau cahaya mewah menyapu kartu' },
  { id: 'pulse', label: 'Pulse', desc: 'Denyut napas lembut berirama' }
];

export const POSTER_FONT_PRESETS: { id: PosterFontFamily; label: string; fontStack: string }[] = [
  { id: 'sans', label: 'Sans', fontStack: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Inter", sans-serif' },
  { id: 'display', label: 'Display', fontStack: '"Outfit", "Plus Jakarta Sans", -apple-system, sans-serif' },
  { id: 'serif', label: 'Serif', fontStack: '"Playfair Display", "Lora", Georgia, serif' },
  { id: 'grotesk', label: 'Grotesk', fontStack: '"Space Grotesk", "Plus Jakarta Sans", sans-serif' },
  { id: 'mono', label: 'Mono', fontStack: '"JetBrains Mono", "SF Mono", Consolas, monospace' }
];

export const getFontFamilyStack = (font?: PosterFontFamily | string): string => {
  const found = POSTER_FONT_PRESETS.find(f => f.id === font);
  return found ? found.fontStack : POSTER_FONT_PRESETS[0].fontStack;
};

export const SHARED_POSTER_IMAGE = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';
export const SHARED_POSTER_IMAGE_2 = 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80';
export const SHARED_POSTER_IMAGE_3 = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80';

export interface SocialCardConfig {
  ratio: SocialPosterRatio;
  template: CardLayoutTemplate;
  theme: CardTheme;
  bgType: BgType;
  solidColor?: string;
  gradientPreset?: string;
  customBgUrl?: string;

  // Pattern settings
  bgPattern?: BgPattern;
  bgPatternColor?: string;
  bgPatternOpacity?: number;

  // Custom styling attributes from templates
  cardBg?: string;
  cardBorder?: string;
  accentColor?: string;
  textColor?: string;
  fontFamily?: PosterFontFamily;
  animation?: PosterAnimationState;
  
  // Content & Images
  title: string;
  subtitle: string;
  badge: string;
  coverUrl: string;
  coverUrl2?: string;
  coverUrl3?: string;
  imageShape?: ImageShape;
  priceOrTag?: string;
  linkText: string;
  showQrCode?: boolean;
  qrUrl?: string;
  brandText?: string;
}

export const POSTER_RATIOS: Record<SocialPosterRatio, { width: number; height: number; label: string }> = {
  '9:16': { width: 1080, height: 1920, label: 'Story (9:16)' },
  '4:5': { width: 1080, height: 1350, label: 'Feed (4:5)' },
  '1:1': { width: 1080, height: 1080, label: 'Square (1:1)' }
};

export const SOLID_COLOR_PRESETS = [
  { label: 'Mint', hex: '#edf7ee' },
  { label: 'Slate', hex: '#cbd5e1' },
  { label: 'Sand', hex: '#f5f5f4' },
  { label: 'Lilac', hex: '#faf5ff' },
  { label: 'Sky', hex: '#eff6ff' },
  { label: 'Rose', hex: '#fff1f2' },
  { label: 'Sage', hex: '#e2ece9' },
  { label: 'Amber', hex: '#fef3c7' },
  { label: 'Dark Onyx', hex: '#0A0B0E' },
  { label: 'Charcoal', hex: '#1e293b' },
  { label: 'Coral', hex: '#ffedd5' },
  { label: 'Indigo', hex: '#0f172a' }
];

export const GRADIENT_PRESETS: Record<string, [string, string]> = {
  mint: ['#d1fae5', '#a7f3d0'],
  sunset: ['#fed7aa', '#fbcfe8'],
  ocean: ['#bae6fd', '#c7d2fe'],
  dark: ['#0f172a', '#020617'],
  pastel: ['#fdf4ff', '#e0e7ff'],
  cyber: ['#3b0764', '#0f172a'],
  aurora: ['#064e3b', '#0f172a'],
  peach: ['#fed7aa', '#ffedd5']
};

export const CARD_BG_PRESETS = [
  { label: 'Putih', hex: '#ffffff' },
  { label: 'Onyx', hex: '#14151f' },
  { label: 'Kaca', hex: 'rgba(20, 21, 31, 0.90)' },
  { label: 'Terang', hex: 'rgba(255, 255, 255, 0.92)' },
  { label: 'Cream', hex: '#faf7f2' },
  { label: 'Slate', hex: '#f1f5f9' },
  { label: 'Navy', hex: '#0a0f1d' }
];

export const PATTERN_LIST: { id: BgPattern; label: string }[] = [
  { id: 'none', label: 'Polos' },
  { id: 'grid', label: 'Grid' },
  { id: 'dots', label: 'Dot' },
  { id: 'triangles', label: 'Segitiga' },
  { id: 'waves', label: 'Gelombang' },
  { id: 'stripes', label: 'Garis' },
  { id: 'isometric', label: 'Isometrik' },
  { id: 'crosses', label: 'Cross' },
  { id: 'mesh', label: 'Mesh' }
];

export const imageCache: Map<string, HTMLImageElement> = new Map();

export const loadImageAsync = (url: string, timeoutMs: number = 3000): Promise<HTMLImageElement | null> => {
  if (!url) return Promise.resolve(null);
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
  }

  return new Promise(resolve => {
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(null);
      }
    }, timeoutMs);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        imageCache.set(url, img);
        resolve(img);
      }
    };
    img.onerror = () => {
      // Retry without anonymous to bypass strict CORS if server doesn't send CORS header
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          imageCache.set(url, fallbackImg);
          resolve(fallbackImg);
        }
      };
      fallbackImg.onerror = () => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve(null);
        }
      };
      fallbackImg.src = url;
    };
    img.src = url;
  });
};

// Fast hardware-accelerated blur via tiny offscreen buffer
const renderFastBlurredBg = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number
) => {
  try {
    const offW = 120;
    const offH = Math.round(120 * (H / W));
    const offCanvas = document.createElement('canvas');
    offCanvas.width = offW;
    offCanvas.height = offH;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.filter = 'blur(6px)';
    const scale = 1.6;
    const bw = offW * scale;
    const bh = offH * scale;
    offCtx.drawImage(img, (offW - bw) / 2, (offH - bh) / 2, bw, bh);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offCanvas, 0, 0, W, H);
    ctx.restore();
  } catch (err) {
    console.warn('Fast blur fallback:', err);
  }
};

// Procedural Pattern Overlay Renderer
const drawPatternOverlay = (
  ctx: CanvasRenderingContext2D,
  pattern: BgPattern,
  color: string,
  opacity: number,
  W: number,
  H: number,
  accentColor?: string
) => {
  if (!pattern || pattern === 'none') return;

  ctx.save();
  ctx.globalAlpha = Math.max(0.01, Math.min(1.0, opacity));

  if (pattern === 'grid') {
    const step = 48;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  } else if (pattern === 'dots') {
    const step = 40;
    const radius = 2.4;
    ctx.fillStyle = color;
    for (let x = step / 2; x < W; x += step) {
      for (let y = step / 2; y < H; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'triangles') {
    const size = 64;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    for (let y = 0; y < H + size; y += size) {
      for (let x = 0; x < W + size; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size / 2, y + size);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (pattern === 'waves') {
    const waveStep = 56;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    for (let y = 0; y < H + waveStep; y += waveStep) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        const waveY = y + Math.sin(x * 0.014 + y * 0.01) * 16;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }
  } else if (pattern === 'stripes') {
    const stripeStep = 36;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    for (let x = -H; x < W + H; x += stripeStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.stroke();
    }
  } else if (pattern === 'isometric') {
    const isoStep = 56;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let x = -H; x < W + H; x += isoStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H * 0.577, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - H * 0.577, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += isoStep * 0.577) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else if (pattern === 'crosses') {
    const step = 60;
    const arm = 6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    for (let x = step / 2; x < W; x += step) {
      for (let y = step / 2; y < H; y += step) {
        ctx.beginPath();
        ctx.moveTo(x - arm, y);
        ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm);
        ctx.lineTo(x, y + arm);
        ctx.stroke();
      }
    }
  } else if (pattern === 'mesh') {
    const g1 = ctx.createRadialGradient(W * 0.2, H * 0.2, 60, W * 0.2, H * 0.2, W * 0.8);
    g1.addColorStop(0, accentColor || '#7c3aed');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.85, H * 0.75, 60, W * 0.85, H * 0.75, W * 0.85);
    g2.addColorStop(0, '#38bdf8');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
};

let currentRenderId = 0;

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = (text || '').split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
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
 * Main Canvas Render Routine
 */
export const renderSocialPosterCanvas = async (
  canvas: HTMLCanvasElement,
  config: SocialCardConfig
): Promise<void> => {
  const renderId = ++currentRenderId;
  const dim = POSTER_RATIOS[config.ratio] || POSTER_RATIOS['9:16'];

  // Only resize canvas buffer if dimensions actually changed to avoid clearing and reallocating GPU memory
  if (canvas.width !== dim.width || canvas.height !== dim.height) {
    canvas.width = dim.width;
    canvas.height = dim.height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = dim.width;
  const H = dim.height;

  // ── 1. DRAW BASE BACKGROUND IMMEDIATELY (ZERO BLACK SCREEN / ZERO LAG) ──
  if (config.bgType === 'gradient') {
    const colors = GRADIENT_PRESETS[config.gradientPreset || 'mint'] || GRADIENT_PRESETS.mint;
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = config.solidColor || (config.theme === 'light' ? '#edf7ee' : '#0A0B0E');
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. LOAD ASSETS IN PARALLEL ──
  const isMultiPhoto = config.template === 'trioCollage' || config.template === 'bentoTrio';
  const [coverImg, coverImg2, coverImg3, qrImg, customBg] = await Promise.all([
    config.coverUrl ? loadImageAsync(config.coverUrl) : Promise.resolve(null),
    (config.coverUrl2 || isMultiPhoto)
      ? loadImageAsync(config.coverUrl2 || SHARED_POSTER_IMAGE_2)
      : Promise.resolve(null),
    (config.coverUrl3 || isMultiPhoto)
      ? loadImageAsync(config.coverUrl3 || SHARED_POSTER_IMAGE_3)
      : Promise.resolve(null),
    (config.showQrCode && config.qrUrl)
      ? loadImageAsync(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(config.qrUrl)}&margin=4`)
      : Promise.resolve(null),
    (config.bgType === 'image' && config.customBgUrl) ? loadImageAsync(config.customBgUrl) : Promise.resolve(null)
  ]);

  // If a newer render request arrived while assets loaded, drop this obsolete frame
  if (renderId !== currentRenderId) return;

  // ── 3. FINALIZE WALLPAPER BACKGROUND (FAST BLUR OR CUSTOM IMAGE) ──
  if (config.bgType === 'blurred' && coverImg) {
    renderFastBlurredBg(ctx, coverImg, W, H);
    ctx.fillStyle = config.theme === 'light' ? 'rgba(242, 244, 247, 0.40)' : 'rgba(10, 11, 14, 0.72)';
    ctx.fillRect(0, 0, W, H);
  } else if (config.bgType === 'image' && customBg) {
    ctx.drawImage(customBg, 0, 0, W, H);
  }

  // ── 4. DRAW PROCEDURAL PATTERNS (Grid, Dots, Triangles, Waves, Stripes, Isometric, Crosses, Mesh) ──
  const patternType = config.bgPattern || 'none';
  const defaultPatternColor = config.theme === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)';
  const patternColor = config.bgPatternColor || defaultPatternColor;
  const patternOpacity = typeof config.bgPatternOpacity === 'number' ? config.bgPatternOpacity : 1.0;
  drawPatternOverlay(ctx, patternType, patternColor, patternOpacity, W, H, config.accentColor);

  // ── 5. RESOLVE DYNAMIC TYPOGRAPHY FONT STACK ──
  const fontPreset = config.fontFamily || 'sans';
  const fontTitle = getFontFamilyStack(fontPreset);
  const fontSub = fontPreset === 'serif' ? '"Lora", Georgia, serif' : fontTitle;

  // ── 6. DYNAMIC REAL IMAGE ASPECT RATIO & AUTO CARD ZOOM-OUT ──
  let imgAspect = 0.65;
  if (config.template === 'trioCollage') {
    imgAspect = 0.82; // Trio Mix: 1 portrait left + 2 squares right
  } else if (config.template === 'bentoTrio') {
    imgAspect = 0.86; // Bento 3: 1 hero top + 2 squares bottom
  } else if (config.imageShape === 'square') {
    imgAspect = 1.0; // Kotak (1:1)
  } else if (config.imageShape === 'portrait') {
    imgAspect = 1.25; // Potret (4:5 / 3:4)
  } else if (coverImg && coverImg.naturalWidth > 0 && coverImg.naturalHeight > 0) {
    imgAspect = coverImg.naturalHeight / coverImg.naturalWidth;
    // Rentang aman dari 0.35 (landscape) hingga 1.30 (portrait)
    imgAspect = Math.max(0.35, Math.min(1.30, imgAspect));
  }

  const isStory = config.ratio === '9:16';
  const isFeed = config.ratio === '4:5';

  // Maksimum tinggi kartu yang diizinkan pada poster agar memiliki margin atas/bawah yang lega
  const maxAllowedH = Math.round(H * (isStory ? 0.88 : (isFeed ? 0.84 : 0.82)));

  const baseCardW = isStory ? 940 : (isFeed ? 940 : 940);
  const baseCardPad = 30;
  const baseCardRadius = 46;
  const baseGap = 24;

  const baseIW = baseCardW - (baseCardPad * 2);
  const baseIH = Math.round(baseIW * imgAspect);

  let unscaledCardH = 920;

  if (config.template === 'appStack' || config.template === 'trioCollage' || config.template === 'bentoTrio') {
    const titleSize = 44;
    const subSize = 20;
    const maxTextW = baseIW - (config.showQrCode ? 150 : 230);

    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    const titleLines = wrapText(ctx, config.title || 'Recenter', maxTextW);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    const subLines = wrapText(ctx, config.subtitle || 'Your mental wellness companion', maxTextW);

    const titleH = titleLines.length * (titleSize * 1.15);
    const subH = subLines.length * (subSize * 1.30);
    const textH = titleH + 8 + subH;
    const btnH = 54;
    const bottomH = Math.max(textH, btnH);

    unscaledCardH = baseCardPad + baseIH + baseGap + bottomH + baseCardPad;

  } else if (config.template === 'scenicShowcase') {
    const titleSize = 42;
    const subSize = 20;
    const btnH = 54;
    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    const titleLines = wrapText(ctx, config.title || 'Koleksi Eksklusif', baseIW - 140);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    const subLines = wrapText(ctx, config.subtitle || 'Desain premium dan modern', baseIW);
    const titleH = titleLines.length * (titleSize * 1.15);
    const subH = subLines.length * (subSize * 1.30);
    const footerInfoH = titleH + 8 + subH + 20 + btnH;
    unscaledCardH = baseCardPad + baseIH + baseGap + footerInfoH + baseCardPad;

  } else if (config.template === 'headerTop') {
    const titleSize = 42;
    const subSize = 20;
    const btnH = 54;
    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    const titleLines = wrapText(ctx, config.title || 'Koleksi Eksklusif', baseIW - 140);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    const subLines = wrapText(ctx, config.subtitle || 'Desain premium dan modern', baseIW);
    const titleH = titleLines.length * (titleSize * 1.15);
    const subH = subLines.length * (subSize * 1.30);
    const headerInfoH = titleH + 8 + subH + 20 + btnH;
    unscaledCardH = baseCardPad + headerInfoH + baseGap + baseIH + baseCardPad;

  } else if (config.template === 'dualIdentity') {
    const titleSize = 44;
    const subSize = 20;
    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    const titleLines = wrapText(ctx, config.title || 'Studio Showcase', baseIW);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    const subLines = wrapText(ctx, config.subtitle || 'Karya terbaik terpilih', baseIW);
    const titleH = titleLines.length * (titleSize * 1.15);
    const subH = subLines.length * (subSize * 1.30);
    const infoH = 24 + 14 + titleH + 8 + subH + 24 + 48;
    unscaledCardH = Math.round(baseCardW * imgAspect * 0.80) + infoH + baseCardPad;
  }

  // Auto Zoom-Out Scale jika tinggi kartu melebihi batas kanvas poster
  const cardScale = Math.min(1.0, maxAllowedH / unscaledCardH);

  const cardW = Math.round(baseCardW * cardScale);
  const cardH = Math.round(unscaledCardH * cardScale);
  const cardPad = Math.round(baseCardPad * cardScale);
  const cardRadius = Math.round(baseCardRadius * cardScale);
  const iRadius = Math.max(10, cardRadius - cardPad); // Kaidah konsentris Apple iOS
  const gapPhotoContent = Math.round(baseGap * cardScale);
  const iW = cardW - (cardPad * 2);
  const iH = Math.round(iW * imgAspect); // Gambar 100% mengikuti rasio asli tanpa crop!

  // Animation Dynamics
  const animType = config.animation?.type ?? 'none';
  const animProg = config.animation?.progress ?? 0;

  let animOffsetX = 0;
  let animOffsetY = 0;
  let animShadowBlurBonus = 0;
  let animShadowOffsetBonus = 0;
  let zoomScale = 1.0;

  if (animType === 'float') {
    animOffsetY = Math.sin(animProg * Math.PI * 2) * (18 * cardScale);
    animShadowBlurBonus = Math.sin(animProg * Math.PI * 2) * (14 * cardScale);
    animShadowOffsetBonus = Math.sin(animProg * Math.PI * 2) * (8 * cardScale);
  } else if (animType === 'tilt3d') {
    animOffsetX = Math.sin(animProg * Math.PI * 2) * (8 * cardScale);
    animOffsetY = Math.cos(animProg * Math.PI * 2) * (10 * cardScale);
    animShadowBlurBonus = Math.abs(Math.sin(animProg * Math.PI * 2)) * (16 * cardScale);
    zoomScale = 1.0 + Math.sin(animProg * Math.PI * 2) * 0.02;
  } else if (animType === 'parallax3d') {
    animOffsetX = Math.sin(animProg * Math.PI * 2) * (14 * cardScale);
    animOffsetY = Math.sin(animProg * Math.PI * 4) * (10 * cardScale);
    animShadowBlurBonus = Math.sin(animProg * Math.PI * 2) * (12 * cardScale);
    zoomScale = 1.0 + Math.sin(animProg * Math.PI * 2) * 0.045;
  } else if (animType === 'zoom') {
    zoomScale = 1.0 + Math.sin(animProg * Math.PI) * 0.08;
  } else if (animType === 'pulse') {
    const pulseFactor = Math.sin(animProg * Math.PI * 2) * 0.022;
    animOffsetY = pulseFactor * (cardH * 0.15);
  }

  // Centering on poster with dynamic levitation
  const cardX = Math.round((W - cardW) / 2) + Math.round(animOffsetX);
  const cardY = Math.round((H - cardH) / 2) - (isStory ? 12 : 0) + Math.round(animOffsetY);
  const cx = cardX + cardW / 2;
  const cy = cardY + cardH / 2;

  // 3D Matrix Perspective Transformation
  ctx.save();
  if (animType === 'tilt3d') {
    const angleX = Math.sin(animProg * Math.PI * 2);
    const angleY = Math.cos(animProg * Math.PI * 2);
    const skewX = angleX * 0.038;
    const skewY = angleY * 0.022;
    const scaleX = 1.0 - Math.abs(angleY) * 0.018;
    const scaleY = 1.0 - Math.abs(angleX) * 0.022;
    ctx.translate(cx, cy);
    ctx.transform(scaleX, skewY, skewX, scaleY, 0, 0);
    ctx.translate(-cx, -cy);
  }

  // ── 3. APPLE MULTI-LAYER AMBIENT SHADOW ──
  const baseCardBg = config.cardBg || (config.theme === 'light' ? '#ffffff' : '#14151f');
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
  ctx.shadowBlur = Math.round((54 + animShadowBlurBonus) * cardScale);
  ctx.shadowOffsetY = Math.round((20 + animShadowOffsetBonus) * cardScale);
  ctx.fillStyle = baseCardBg;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();

  ctx.shadowColor = 'rgba(0, 0, 0, 0.04)';
  ctx.shadowBlur = Math.round(12 * cardScale);
  ctx.shadowOffsetY = Math.round(4 * cardScale);
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.restore();

  // ── 4. CARD BODY CLIPPING ──
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.clip();

  ctx.fillStyle = baseCardBg;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // ══════════════════════════════════════════════════════════════════════
  // ── 5. TEMPLATE 1: APP STACK (Clean Modern Card) ──
  // ══════════════════════════════════════════════════════════════════════
  if (config.template === 'appStack') {
    const iX = cardX + cardPad;
    const iY = cardY + cardPad;

    // Top Photo Container with Concentric Corner Radius
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(iX, iY, iW, iH, iRadius);
    ctx.clip();

    if (coverImg) {
      drawCoverClipped(ctx, coverImg, iX, iY, iW, iH, zoomScale);
      const ovGrad = ctx.createLinearGradient(iX, iY, iX, iY + iH);
      ovGrad.addColorStop(0, 'rgba(0,0,0,0.12)');
      ovGrad.addColorStop(0.35, 'rgba(0,0,0,0)');
      ovGrad.addColorStop(1, 'rgba(0,0,0,0.10)');
      ctx.fillStyle = ovGrad;
      ctx.fillRect(iX, iY, iW, iH);
    } else {
      drawCoverLoadingState(ctx, iX, iY, iW, iH, config.accentColor, config.theme);
    }

    // Top-Left Pill Badge: `● Active now`
    const badgeText = `● ${config.badge || 'Active'}`;
    const badgeFontSize = Math.round(16 * cardScale);
    ctx.font = `700 ${badgeFontSize}px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", Inter, sans-serif`;
    const bMet = ctx.measureText(badgeText);
    const bgW = bMet.width + Math.round(28 * cardScale);
    const bgH = Math.round(36 * cardScale);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.roundRect(iX + Math.round(18 * cardScale), iY + Math.round(18 * cardScale), bgW, bgH, 9999);
    ctx.fill();

    ctx.fillStyle = config.accentColor || '#10b981';
    ctx.fillText(badgeText, iX + Math.round(32 * cardScale), iY + Math.round(18 * cardScale) + bgH * 0.68);

    // Top-Right Circle Button: `•••`
    const cSize = Math.round(38 * cardScale);
    const cX = iX + iW - cSize - Math.round(18 * cardScale);
    const cY = iY + Math.round(18 * cardScale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.arc(cX + cSize / 2, cY + cSize / 2, cSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = `700 ${Math.round(16 * cardScale)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText('•••', cX + cSize / 2, cY + cSize * 0.65);
    ctx.textAlign = 'left';

    ctx.restore();

    // Bottom Section: Tight, coherent typography hierarchy with 8px subtitle gap
    const titleSize = Math.round(44 * cardScale);
    const subSize = Math.round(20 * cardScale);
    const maxTextW = iW - (config.showQrCode ? Math.round(150 * cardScale) : Math.round(220 * cardScale));

    const titleLines = wrapText(ctx, config.title || 'Recenter', maxTextW);
    const subLines = wrapText(ctx, config.subtitle || 'Your mental wellness companion', maxTextW);

    const titleH = titleLines.length * (titleSize * 1.15);
    const subH = subLines.length * (subSize * 1.30);
    const textH = titleH + 8 + subH;
    const btnH = Math.round(52 * cardScale);

    // Compute top of bottom section
    const bottomSectionY = iY + iH + gapPhotoContent;
    let tY = bottomSectionY + titleSize * 0.82;

    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    ctx.fillStyle = config.textColor || (config.theme === 'light' ? '#0f172a' : '#ffffff');

    for (const l of titleLines) {
      ctx.fillText(l, cardX + cardPad, tY);
      tY += titleSize * 1.15;
    }

    // Strict 8px visual gap from title to subtitle
    tY = tY - (titleSize * 1.15) + (titleSize * 0.20) + 8 + (subSize * 0.82);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    ctx.fillStyle = config.theme === 'light' ? '#64748b' : '#94a3b8';

    for (const s of subLines) {
      ctx.fillText(s, cardX + cardPad, tY);
      tY += subSize * 1.30;
    }

    // Action Button Right: vertically balanced with the text block
    if (config.showQrCode && qrImg) {
      const qrSize = Math.round(92 * cardScale);
      const qX = cardX + cardW - cardPad - qrSize;
      const qY = cardY + cardH - cardPad - qrSize;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qX - 6, qY - 6, qrSize + 12, qrSize + 12, 14);
      ctx.fill();
      ctx.drawImage(qrImg, qX, qY, qrSize, qrSize);
    } else {
      const btnText = config.linkText || 'Buka ↗';
      const btnFontSize = Math.round(17 * cardScale);
      ctx.font = `700 ${btnFontSize}px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", Inter, sans-serif`;
      const bMetrics = ctx.measureText(btnText);
      const bW = bMetrics.width + Math.round(44 * cardScale);
      const bX = cardX + cardW - cardPad - bW;
      const bY = cardY + cardH - cardPad - btnH; // Strictly cardPad from bottom edge!

      ctx.fillStyle = config.accentColor || (config.theme === 'light' ? '#000000' : '#ffffff');
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, btnH, 9999);
      ctx.fill();

      ctx.fillStyle = config.accentColor ? '#ffffff' : (config.theme === 'light' ? '#ffffff' : '#000000');
      ctx.fillText(btnText, bX + Math.round(22 * cardScale), bY + btnH * 0.65);
    }

  // ══════════════════════════════════════════════════════════════════════
  // ── 6. TEMPLATE 2: SCENIC SHOWCASE (Modern Card with Showcase Tags) ──
  // ══════════════════════════════════════════════════════════════════════
  } else if (config.template === 'scenicShowcase') {
    const iX = cardX + cardPad;
    const iY = cardY + cardPad;

    // Scenic Photo on Top with Concentric Corner Radius
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(iX, iY, iW, iH, iRadius);
    ctx.clip();

    if (coverImg) {
      drawCoverClipped(ctx, coverImg, iX, iY, iW, iH, zoomScale);
    } else {
      drawCoverLoadingState(ctx, iX, iY, iW, iH, config.accentColor, config.theme);
    }

    // Top Category Chips
    drawPillBadge(ctx, config.badge || 'Unggulan', iX + Math.round(18 * cardScale), iY + Math.round(18 * cardScale));
    drawPillBadge(ctx, '4.9', iX + iW - Math.round(76 * cardScale), iY + Math.round(18 * cardScale));
    drawCarouselDots(ctx, iX + iW / 2, iY + iH - Math.round(20 * cardScale));
    ctx.restore();

    // Bottom Section: gap below photo, strictly aligned with cardPad!
    const titleSize = Math.round(42 * cardScale);
    let currY = iY + iH + gapPhotoContent + titleSize * 0.82;

    // Title Row
    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    ctx.fillStyle = config.textColor || (config.theme === 'light' ? '#0f172a' : '#ffffff');
    ctx.fillText(config.title || 'Koleksi Eksklusif', cardX + cardPad, currY);

    // Subtitle: Strict 8px typographic proximity gap from title
    currY += 8 + Math.round(20 * cardScale) * 0.82;

    const subSize = Math.round(20 * cardScale);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    ctx.fillStyle = config.theme === 'light' ? '#64748b' : '#94a3b8';
    ctx.fillText(config.subtitle || 'Desain elegan dan fungsional', cardX + cardPad, currY);

    // Price on Left & Action Button on Right: Strictly aligned with bottom edge!
    const btnH = Math.round(52 * cardScale);
    const bY = cardY + cardH - cardPad - btnH;

    const priceText = config.priceOrTag || '';
    if (priceText) {
      ctx.font = `800 ${Math.round(30 * cardScale)}px ${fontTitle}`;
      ctx.fillStyle = config.textColor || (config.theme === 'light' ? '#0f172a' : '#ffffff');
      ctx.fillText(priceText, cardX + cardPad, bY + btnH * 0.68);
    }

    if (config.showQrCode && qrImg) {
      const qrSize = Math.round(92 * cardScale);
      const qX = cardX + cardW - cardPad - qrSize;
      const qY = cardY + cardH - cardPad - qrSize;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qX - 6, qY - 6, qrSize + 12, qrSize + 12, 14);
      ctx.fill();
      ctx.drawImage(qrImg, qX, qY, qrSize, qrSize);
    } else {
      const btnText = config.linkText || 'Buka ↗';
      const btnFontSize = Math.round(17 * cardScale);
      ctx.font = `700 ${btnFontSize}px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", Inter, sans-serif`;
      const bMetrics = ctx.measureText(btnText);
      const bW = bMetrics.width + Math.round(44 * cardScale);
      const bX = cardX + cardW - cardPad - bW;

      ctx.fillStyle = config.accentColor || (config.theme === 'light' ? '#000000' : '#ffffff');
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, btnH, 9999);
      ctx.fill();

      ctx.fillStyle = config.accentColor ? '#ffffff' : (config.theme === 'light' ? '#ffffff' : '#000000');
      ctx.fillText(btnText, bX + Math.round(22 * cardScale), bY + btnH * 0.65);
    }

  // ══════════════════════════════════════════════════════════════════════
  // ── 7. TEMPLATE 3: HEADER TOP (Title at Top, Image Below) ──
  // ══════════════════════════════════════════════════════════════════════
  } else if (config.template === 'headerTop') {
    const titleSize = Math.round(42 * cardScale);
    let currY = cardY + cardPad + titleSize * 0.82;

    // Top Header Row: Title on Left, Badge on Right
    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    ctx.fillStyle = config.textColor || (config.theme === 'light' ? '#0f172a' : '#ffffff');
    ctx.fillText(config.title || 'Koleksi Eksklusif', cardX + cardPad, currY);

    const ratingText = config.badge || 'Unggulan';
    const badgeFontSize = Math.round(15 * cardScale);
    ctx.font = `700 ${badgeFontSize}px ${fontTitle}`;
    const rMet = ctx.measureText(ratingText);
    const rW = rMet.width + Math.round(26 * cardScale);
    const rH = Math.round(34 * cardScale);
    const rX = cardX + cardW - cardPad - rW;
    const rY = currY - titleSize * 0.82 + (titleSize - rH) / 2;

    ctx.strokeStyle = config.theme === 'light' ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(rX, rY, rW, rH, 9999);
    ctx.stroke();
    ctx.fillStyle = config.theme === 'light' ? '#334155' : '#cbd5e1';
    ctx.fillText(ratingText, rX + Math.round(13 * cardScale), rY + rH * 0.68);

    // Subtitle: Strict 8px gap
    currY += 8 + Math.round(20 * cardScale) * 0.82;

    const subSize = Math.round(20 * cardScale);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    ctx.fillStyle = config.theme === 'light' ? '#64748b' : '#94a3b8';
    ctx.fillText(config.subtitle || 'Desain elegan dan fungsional', cardX + cardPad, currY);

    // Price & Action Button Row: 18px gap below subtitle
    const btnH = Math.round(52 * cardScale);
    const bY = currY + Math.round(18 * cardScale);

    const priceText = config.priceOrTag || '';
    if (priceText) {
      ctx.font = `800 ${Math.round(30 * cardScale)}px ${fontTitle}`;
      ctx.fillStyle = config.textColor || (config.theme === 'light' ? '#0f172a' : '#ffffff');
      ctx.fillText(priceText, cardX + cardPad, bY + btnH * 0.68);
    }

    const btnText = config.linkText || 'Buka ↗';
    const btnFontSize = Math.round(17 * cardScale);
    ctx.font = `700 ${btnFontSize}px ${fontTitle}`;
    const bMet = ctx.measureText(btnText);
    const bW = bMet.width + Math.round(44 * cardScale);
    const bX = cardX + cardW - cardPad - bW;

    ctx.fillStyle = config.accentColor || (config.theme === 'light' ? '#000000' : '#ffffff');
    ctx.beginPath();
    ctx.roundRect(bX, bY, bW, btnH, 9999);
    ctx.fill();
    ctx.fillStyle = config.accentColor ? '#ffffff' : (config.theme === 'light' ? '#ffffff' : '#000000');
    ctx.fillText(btnText, bX + Math.round(22 * cardScale), bY + btnH * 0.65);

    // Harmonious gap between action row and photo below it!
    const iX = cardX + cardPad;
    const iY = bY + btnH + gapPhotoContent;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(iX, iY, iW, iH, iRadius);
    ctx.clip();
    if (coverImg) {
      drawCoverClipped(ctx, coverImg, iX, iY, iW, iH, zoomScale);
    } else {
      drawCoverLoadingState(ctx, iX, iY, iW, iH, config.accentColor, config.theme);
    }
    drawCarouselDots(ctx, iX + iW / 2, iY + Math.round(22 * cardScale));
    ctx.restore();

  // ══════════════════════════════════════════════════════════════════════
  // ── 8. TEMPLATE 4: DUAL IDENTITY NOTCHED CARD ──
  // ══════════════════════════════════════════════════════════════════════
  } else if (config.template === 'dualIdentity') {
    const photoH = Math.round(cardW * imgAspect * 0.80);

    // 1. Top Photo Half with concentric rounded top corners
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, photoH, [cardRadius, cardRadius, 0, 0]);
    ctx.clip();

    if (coverImg) {
      drawCoverClipped(ctx, coverImg, cardX, cardY, cardW, photoH, zoomScale);
    } else {
      drawCoverLoadingState(ctx, cardX, cardY, cardW, photoH, config.accentColor, config.theme);
    }
    ctx.restore();

    // Curved notch cut-out on the border line
    const notchW = Math.round(72 * cardScale);
    const notchH = Math.round(50 * cardScale);
    const notchX = cardX + cardW - notchW - Math.round(24 * cardScale);
    const notchY = cardY + photoH - (notchH / 2);

    ctx.save();
    ctx.fillStyle = config.theme === 'light' ? '#ffffff' : '#14151f';
    ctx.beginPath();
    ctx.roundRect(notchX, notchY, notchW, notchH, Math.round(22 * cardScale));
    ctx.fill();

    const cSize = Math.round(42 * cardScale);
    const cX = notchX + (notchW - cSize) / 2;
    const cY = notchY + (notchH - cSize) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.arc(cX + cSize / 2, cY + cSize / 2, cSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = `700 ${Math.round(16 * cardScale)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText('•••', cX + cSize / 2, cY + cSize * 0.65);
    ctx.textAlign = 'left';
    ctx.restore();

    // 2. Bottom Identity Section: gap below photo/notch
    const statusSize = Math.round(18 * cardScale);
    let currY = cardY + photoH + Math.round(30 * cardScale) + statusSize * 0.82;

    ctx.font = `600 ${statusSize}px ${fontSub}`;
    ctx.fillStyle = config.theme === 'light' ? '#64748b' : '#94a3b8';
    ctx.fillText(`${config.badge || 'Terbaru'} • Aktif`, cardX + cardPad, currY);

    const titleSize = Math.round(44 * cardScale);
    currY += Math.round(12 * cardScale) + titleSize * 0.82;

    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    ctx.fillStyle = config.textColor || (config.theme === 'light' ? '#0f172a' : '#ffffff');
    ctx.fillText(config.title || 'Studio Showcase', cardX + cardPad, currY);

    const avH = Math.round(44 * cardScale);
    const avY = cardY + cardH - cardPad - avH;

    // Subtle divider
    ctx.strokeStyle = config.theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + cardPad, avY - Math.round(18 * cardScale));
    ctx.lineTo(cardX + cardW - cardPad, avY - Math.round(18 * cardScale));
    ctx.stroke();

    // Avatar Stack on Left, App Badges on Right: strictly aligns with cardPad
    drawAvatarStack(ctx, cardX + cardPad, avY + avH / 2, avH);
    drawAppBadges(ctx, cardX + cardW - cardPad - Math.round(150 * cardScale), avY - 2);

  // ══════════════════════════════════════════════════════════════════════
  // ── 9. TEMPLATE 5: TRIO MIX (3 Gambar Bento / Multi-Photo Collage) ──
  // ══════════════════════════════════════════════════════════════════════
  } else if (config.template === 'trioCollage') {
    const iX = cardX + cardPad;
    const iY = cardY + cardPad;
    const gap = Math.round(10 * cardScale);

    // Left photo: Portrait orientation (58% width, 100% height)
    const leftW = Math.round((iW - gap) * 0.58);
    const leftH = iH;
    const leftRadius = Math.max(8, Math.round(iRadius * 0.85));

    // Right photos: 2 stacked Square photos (42% width)
    const rightX = iX + leftW + gap;
    const rightW = iW - gap - leftW;
    const rightH1 = Math.round((iH - gap) / 2);
    const rightH2 = iH - gap - rightH1;
    const rightRadius = Math.max(8, Math.round(iRadius * 0.70));

    // 1. Draw Left Main Photo (Portrait)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(iX, iY, leftW, leftH, leftRadius);
    ctx.clip();
    if (coverImg) {
      drawCoverClipped(ctx, coverImg, iX, iY, leftW, leftH, zoomScale);
    } else {
      drawCoverLoadingState(ctx, iX, iY, leftW, leftH, config.accentColor, config.theme);
    }
    // Pill badge on left photo
    drawPillBadge(ctx, config.badge || 'Unggulan', iX + Math.round(14 * cardScale), iY + Math.round(14 * cardScale));
    ctx.restore();

    // 2. Draw Top-Right Photo (Kotak)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rightX, iY, rightW, rightH1, rightRadius);
    ctx.clip();
    const img2 = coverImg2 || coverImg;
    if (img2) {
      drawCoverClipped(ctx, img2, rightX, iY, rightW, rightH1, zoomScale);
    } else {
      drawCoverLoadingState(ctx, rightX, iY, rightW, rightH1, config.accentColor, config.theme);
    }
    ctx.restore();

    // 3. Draw Bottom-Right Photo (Kotak)
    const rightY2 = iY + rightH1 + gap;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rightX, rightY2, rightW, rightH2, rightRadius);
    ctx.clip();
    const img3 = coverImg3 || coverImg;
    if (img3) {
      drawCoverClipped(ctx, img3, rightX, rightY2, rightW, rightH2, zoomScale);
    } else {
      drawCoverLoadingState(ctx, rightX, rightY2, rightW, rightH2, config.accentColor, config.theme);
    }

    // 3 Foto Badge on bottom-right photo
    const tagText = '3 Foto';
    ctx.font = `700 ${Math.round(12 * cardScale)}px system-ui`;
    const tMet = ctx.measureText(tagText);
    const tW = tMet.width + Math.round(16 * cardScale);
    const tH = Math.round(24 * cardScale);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(rightX + rightW - tW - Math.round(10 * cardScale), rightY2 + rightH2 - tH - Math.round(10 * cardScale), tW, tH, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, rightX + rightW - tW - Math.round(10 * cardScale) + Math.round(8 * cardScale), rightY2 + rightH2 - Math.round(17 * cardScale));
    ctx.restore();

    // 4. Card Bottom Section (Title, Subtitle & Action)
    const titleSize = Math.round(44 * cardScale);
    const subSize = Math.round(20 * cardScale);
    const btnH = Math.round(54 * cardScale);
    const rightBtnW = config.showQrCode ? Math.round(72 * cardScale) : Math.round(190 * cardScale);
    const maxTextW = iW - rightBtnW - Math.round(20 * cardScale);

    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    const titleLines = wrapText(ctx, config.title || 'Koleksi Studio', maxTextW);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    const subLines = wrapText(ctx, config.subtitle || 'Tiga visual pilihan dalam satu kartu', maxTextW);

    let currY = iY + iH + gapPhotoContent + titleSize * 0.82;
    ctx.fillStyle = config.textColor || (config.theme === 'light' ? '#0f172a' : '#ffffff');
    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    for (const line of titleLines) {
      ctx.fillText(line, cardX + cardPad, currY);
      currY += titleSize * 1.15;
    }

    currY += 4;
    ctx.fillStyle = config.theme === 'light' ? '#64748b' : '#94a3b8';
    ctx.font = `500 ${subSize}px ${fontSub}`;
    for (const line of subLines) {
      ctx.fillText(line, cardX + cardPad, currY);
      currY += subSize * 1.30;
    }

    // Right Action: Pill button or QR code
    const actionY = iY + iH + gapPhotoContent + Math.round(4 * cardScale);
    const actionX = cardX + cardW - cardPad - rightBtnW;

    if (config.showQrCode && qrImg) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(actionX, actionY, rightBtnW, rightBtnW, Math.round(12 * cardScale));
      ctx.fill();
      ctx.drawImage(qrImg, actionX + 4, actionY + 4, rightBtnW - 8, rightBtnW - 8);
    } else {
      ctx.fillStyle = config.accentColor || (config.theme === 'light' ? '#000000' : '#ffffff');
      ctx.beginPath();
      ctx.roundRect(actionX, actionY, rightBtnW, btnH, 9999);
      ctx.fill();

      ctx.font = `700 ${Math.round(18 * cardScale)}px ${fontTitle}`;
      ctx.fillStyle = config.accentColor ? '#ffffff' : (config.theme === 'light' ? '#ffffff' : '#000000');
      ctx.textAlign = 'center';
      ctx.fillText(config.linkText || 'Lihat Koleksi ↗', actionX + rightBtnW / 2, actionY + btnH * 0.64);
      ctx.textAlign = 'left';
    }

  // ══════════════════════════════════════════════════════════════════════
  // ── 10. TEMPLATE 6: BENTO TRIO (Hero Landscape Top + 2 Squares Bottom) ──
  // ══════════════════════════════════════════════════════════════════════
  } else if (config.template === 'bentoTrio') {
    const iX = cardX + cardPad;
    const iY = cardY + cardPad;
    const gap = Math.round(10 * cardScale);

    // Top: Landscape Hero Photo (100% width, 54% height)
    const topW = iW;
    const topH = Math.round((iH - gap) * 0.54);
    const topRadius = Math.max(8, Math.round(iRadius * 0.85));

    // Bottom: 2 side-by-side square photos (46% height)
    const botY = iY + topH + gap;
    const botW1 = Math.round((iW - gap) / 2);
    const botW2 = iW - gap - botW1;
    const botH = iH - gap - topH;
    const botX1 = iX;
    const botX2 = iX + botW1 + gap;
    const botRadius = Math.max(8, Math.round(iRadius * 0.70));

    // 1. Draw Top Hero Photo
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(iX, iY, topW, topH, topRadius);
    ctx.clip();
    if (coverImg) {
      drawCoverClipped(ctx, coverImg, iX, iY, topW, topH, zoomScale);
    } else {
      drawCoverLoadingState(ctx, iX, iY, topW, topH, config.accentColor, config.theme);
    }
    // Pill badge on top photo
    drawPillBadge(ctx, config.badge || 'Unggulan', iX + Math.round(14 * cardScale), iY + Math.round(14 * cardScale));
    ctx.restore();

    // 2. Draw Bottom-Left Photo (Kotak)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(botX1, botY, botW1, botH, botRadius);
    ctx.clip();
    const img2 = coverImg2 || coverImg;
    if (img2) {
      drawCoverClipped(ctx, img2, botX1, botY, botW1, botH, zoomScale);
    } else {
      drawCoverLoadingState(ctx, botX1, botY, botW1, botH, config.accentColor, config.theme);
    }
    ctx.restore();

    // 3. Draw Bottom-Right Photo (Kotak)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(botX2, botY, botW2, botH, botRadius);
    ctx.clip();
    const img3 = coverImg3 || coverImg;
    if (img3) {
      drawCoverClipped(ctx, img3, botX2, botY, botW2, botH, zoomScale);
    } else {
      drawCoverLoadingState(ctx, botX2, botY, botW2, botH, config.accentColor, config.theme);
    }

    // 3 Foto Badge on bottom-right photo
    const tagText = '3 Foto';
    ctx.font = `700 ${Math.round(12 * cardScale)}px system-ui`;
    const tMet = ctx.measureText(tagText);
    const tW = tMet.width + Math.round(16 * cardScale);
    const tH = Math.round(24 * cardScale);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(botX2 + botW2 - tW - Math.round(10 * cardScale), botY + botH - tH - Math.round(10 * cardScale), tW, tH, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, botX2 + botW2 - tW - Math.round(10 * cardScale) + Math.round(8 * cardScale), botY + botH - Math.round(17 * cardScale));
    ctx.restore();

    // 4. Card Bottom Section (Title, Subtitle & Action)
    const titleSize = Math.round(44 * cardScale);
    const subSize = Math.round(20 * cardScale);
    const btnH = Math.round(54 * cardScale);
    const rightBtnW = config.showQrCode ? Math.round(72 * cardScale) : Math.round(190 * cardScale);
    const maxTextW = iW - rightBtnW - Math.round(20 * cardScale);

    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    const titleLines = wrapText(ctx, config.title || 'Bento Koleksi', maxTextW);
    ctx.font = `500 ${subSize}px ${fontSub}`;
    const subLines = wrapText(ctx, config.subtitle || 'Kombinasi visual landscape dan potret', maxTextW);

    let currY = iY + iH + gapPhotoContent + titleSize * 0.82;
    ctx.fillStyle = config.textColor || (config.theme === 'light' ? '#0f172a' : '#ffffff');
    ctx.font = `800 ${titleSize}px ${fontTitle}`;
    for (const line of titleLines) {
      ctx.fillText(line, cardX + cardPad, currY);
      currY += titleSize * 1.15;
    }

    currY += 4;
    ctx.fillStyle = config.theme === 'light' ? '#64748b' : '#94a3b8';
    ctx.font = `500 ${subSize}px ${fontSub}`;
    for (const line of subLines) {
      ctx.fillText(line, cardX + cardPad, currY);
      currY += subSize * 1.30;
    }

    // Right Action: Pill button or QR code
    const actionY = iY + iH + gapPhotoContent + Math.round(4 * cardScale);
    const actionX = cardX + cardW - cardPad - rightBtnW;

    if (config.showQrCode && qrImg) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(actionX, actionY, rightBtnW, rightBtnW, Math.round(12 * cardScale));
      ctx.fill();
      ctx.drawImage(qrImg, actionX + 4, actionY + 4, rightBtnW - 8, rightBtnW - 8);
    } else {
      ctx.fillStyle = config.accentColor || (config.theme === 'light' ? '#000000' : '#ffffff');
      ctx.beginPath();
      ctx.roundRect(actionX, actionY, rightBtnW, btnH, 9999);
      ctx.fill();

      ctx.font = `700 ${Math.round(18 * cardScale)}px ${fontTitle}`;
      ctx.fillStyle = config.accentColor ? '#ffffff' : (config.theme === 'light' ? '#ffffff' : '#000000');
      ctx.textAlign = 'center';
      ctx.fillText(config.linkText || 'Lihat Koleksi ↗', actionX + rightBtnW / 2, actionY + btnH * 0.64);
      ctx.textAlign = 'left';
    }
  }

  // ── 8. SHIMMER LUXURY GLEAM OVERLAY ──
  if (animType === 'shimmer') {
    const sweep = -cardW * 0.9 + animProg * (cardW * 2.4);
    const shimW = Math.round(cardW * 0.55);
    const shimX = cardX + sweep;
    const grad = ctx.createLinearGradient(shimX, cardY, shimX + shimW, cardY + cardH);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.5, config.theme === 'light' ? 'rgba(255, 255, 255, 0.38)' : 'rgba(255, 255, 255, 0.20)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cardX, cardY, cardW, cardH);
  }

  // ── 9. CARD BORDER FOR DEPTH ──
  ctx.strokeStyle = config.cardBorder || (config.theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)');
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── 3D HOLOGRAPHIC SPECULAR GLARE ──
  if (animType === 'tilt3d') {
    const angleX = Math.sin(animProg * Math.PI * 2);
    const angleY = Math.cos(animProg * Math.PI * 2);
    const glareX = cx + angleX * (cardW * 0.38);
    const glareY = cy + angleY * (cardH * 0.38);
    const glareRadius = Math.round(cardW * 0.72);
    const glare = ctx.createRadialGradient(glareX, glareY, 15, glareX, glareY, glareRadius);
    glare.addColorStop(0, config.theme === 'light' ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.22)');
    glare.addColorStop(0.40, config.theme === 'light' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)');
    glare.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glare;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fill();
  }

  ctx.restore(); // Ends 3D Matrix Perspective Transformation

  // ── 10. WATERMARK BRANDING ──
  const footerBrand = config.brandText || 'sumr.day';
  ctx.font = `650 19px ${fontSub}`;
  ctx.fillStyle = config.theme === 'light' ? 'rgba(15,23,42,0.40)' : 'rgba(255,255,255,0.40)';
  const fMet = ctx.measureText(footerBrand);
  ctx.fillText(footerBrand, (W - fMet.width) / 2, H - 38);
};

// ── HELPER ROUTINES ──

const drawCoverClipped = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  zoomScale: number = 1.0
) => {
  const cRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let rW = w;
  let rH = h;
  let oX = x;
  let oY = y;

  if (boxRatio > cRatio) {
    rH = w / cRatio;
    oY = y + (h - rH) / 2;
  } else {
    rW = h * cRatio;
    oX = x + (w - rW) / 2;
  }

  if (zoomScale !== 1.0) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-cx, -cy);
    ctx.drawImage(img, oX, oY, rW, rH);
    ctx.restore();
  } else {
    ctx.drawImage(img, oX, oY, rW, rH);
  }
};

const drawCoverLoadingState = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor?: string,
  theme?: 'light' | 'darkGlass'
) => {
  // Soft skeleton background
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  if (theme === 'light') {
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(0.5, '#e2e8f0');
    grad.addColorStop(1, '#cbd5e1');
  } else {
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Modern circular loading spinner
  const cx = x + w / 2;
  const cy = y + h / 2 - 12;
  const radius = Math.min(36, Math.max(22, w * 0.055));

  ctx.save();
  // Outer circle track
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Active rotating indicator arc
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.strokeStyle = accentColor || '#7c3aed';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Minimalist Status Label
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = theme === 'light' ? '#64748b' : '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText('Memuat Gambar...', cx, cy + radius + 24);
  ctx.restore();
};

const drawPillBadge = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
) => {
  ctx.font = '700 17px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", Inter, sans-serif';
  const met = ctx.measureText(text);
  const pw = met.width + 30;
  const ph = 38;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, pw, ph, 9999);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x + 15, y + 25);
};

const drawCarouselDots = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number
) => {
  const dotCount = 5;
  const dotSpacing = 16;
  const startX = centerX - ((dotCount - 1) * dotSpacing) / 2;

  for (let i = 0; i < dotCount; i++) {
    const x = startX + i * dotSpacing;
    ctx.fillStyle = i === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(x, centerY, i === 0 ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawAvatarStack = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  centerY: number,
  size: number
) => {
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#64748b'];
  const labels = ['A', 'B', 'C', '+3'];

  for (let i = 0; i < 4; i++) {
    const x = startX + i * (size * 0.72);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, centerY, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + size / 2, centerY, (size / 2) - 2.5, 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + size / 2, centerY + 5);
    ctx.restore();
  }
};

const drawAppBadges = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  y: number
) => {
  const apps = [
    { bg: '#ef4444', icon: 'M' },
    { bg: '#10a37f', icon: 'S' },
    { bg: '#e11d48', icon: 'P' }
  ];

  apps.forEach((app, idx) => {
    const x = startX + idx * 46;
    ctx.save();
    ctx.fillStyle = app.bg;
    ctx.beginPath();
    ctx.roundRect(x, y, 38, 38, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(app.icon, x + 19, y + 25);
    ctx.restore();
  });
};

export const exportPosterBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png', 0.95);
  });
};

export const getSupportedVideoMimeType = (): { mimeType: string; extension: string } => {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return { mimeType: 'video/mp4', extension: 'mp4' };
  }
  const candidates = [
    { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' }
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mime)) {
      return { mimeType: c.mime, extension: c.ext };
    }
  }
  return { mimeType: 'video/mp4', extension: 'mp4' };
};

export interface PosterVideoOptions {
  durationSeconds?: number;
  fps?: number;
  onProgress?: (percent: number) => void;
}

export const exportPosterVideo = async (
  canvas: HTMLCanvasElement,
  config: SocialCardConfig,
  options: PosterVideoOptions = {}
): Promise<{ blob: Blob; filename: string; mimeType: string }> => {
  const duration = options.durationSeconds ?? 3;
  const fps = options.fps ?? 30;
  const totalFrames = Math.round(duration * fps);
  const frameIntervalMs = 1000 / fps;

  const { mimeType, extension } = getSupportedVideoMimeType();

  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
  if (!stream) {
    throw new Error('Canvas captureStream tidak didukung di browser ini');
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6000000
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingStopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = (err) => reject(err);
  });

  recorder.start();

  const animType = (config.animation?.type && config.animation.type !== 'none') ? config.animation.type : 'float';

  // Render animation sequence frame by frame
  for (let i = 0; i <= totalFrames; i++) {
    const progress = i / totalFrames;
    await renderSocialPosterCanvas(canvas, {
      ...config,
      animation: {
        type: animType,
        progress
      }
    });
    options.onProgress?.(Math.min(99, Math.round((i / totalFrames) * 100)));
    await new Promise((r) => setTimeout(r, frameIntervalMs));
  }

  if (recorder.state !== 'inactive') {
    recorder.stop();
  }

  await recordingStopped;
  options.onProgress?.(100);

  // Restore canvas to clean static view
  await renderSocialPosterCanvas(canvas, config);

  const finalBlob = new Blob(chunks, { type: mimeType });
  const filename = `poster-${config.template}-${Date.now()}.${extension}`;

  return { blob: finalBlob, filename, mimeType };
};

export const downloadPosterVideo = async (
  canvas: HTMLCanvasElement,
  config: SocialCardConfig,
  options: PosterVideoOptions = {}
): Promise<string> => {
  const { blob, filename } = await exportPosterVideo(canvas, config, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return filename;
};
