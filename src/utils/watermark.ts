/**
 * =========================================================================================
 * ENTERPRISE WATERMARK ENGINE & ASSET PROTECTION SYSTEM
 * sumr.day OS & PORTO 2026 CMS
 * =========================================================================================
 * 
 * Menyediakan proteksi multi-tier untuk aset visual agensi:
 * 1. CDN-Level Watermark via Cloudinary URL transformation
 * 2. Burned-In Pixel Watermark via Offscreen Canvas (kebal DevTools inspect-element)
 * 3. Dynamic Realtime Canvas Watermark Overlay
 */

export type WatermarkStyle = 'grid' | 'center' | 'bottom' | 'corners';
export type WatermarkTheme = 'frosted' | 'gold' | 'crimson';

export interface WatermarkOptions {
  primaryText?: string;
  clientName?: string;
  secondaryText?: string;
  style?: WatermarkStyle;
  theme?: WatermarkTheme;
  opacity?: number; // 0.1 - 0.6
  fontSize?: number;
  rotation?: number; // degrees, default -25
  includeTimestamp?: boolean;
}

const THEME_COLORS: Record<WatermarkTheme, { stroke: string; fill: string }> = {
  frosted: {
    stroke: 'rgba(0, 0, 0, 0.25)',
    fill: 'rgba(255, 255, 255, 0.16)'
  },
  gold: {
    stroke: 'rgba(0, 0, 0, 0.3)',
    fill: 'rgba(245, 158, 11, 0.22)'
  },
  crimson: {
    stroke: 'rgba(0, 0, 0, 0.35)',
    fill: 'rgba(239, 68, 68, 0.22)'
  }
};

/**
 * Render watermark directly onto a 2D canvas context
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: WatermarkOptions = {}
) {
  const {
    primaryText = 'SUMR.DAY • DRAFT PREVIEW',
    clientName = '',
    secondaryText = clientName ? `${clientName.toUpperCase()} • DRAFT REVIEW` : 'PROPRIETARY DRAFT • NOT FOR PRODUCTION',
    style = 'grid',
    theme = 'frosted',
    opacity = 0.16,
    rotation = -22,
    includeTimestamp = false
  } = options;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const colors = THEME_COLORS[theme] || THEME_COLORS.frosted;
  const themeFill = colors.fill.replace(/[\d.]+\)$/, `${opacity})`);

  ctx.fillStyle = themeFill;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 3;

  const dateStr = includeTimestamp ? new Date().toLocaleDateString('id-ID') : '';

  if (style === 'grid') {
    // Rotated repeating diagonal grid with generous breathing room
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    const baseFontSize = Math.max(13, Math.round(width / 42));
    ctx.font = `700 ${baseFontSize}px "Outfit", system-ui, sans-serif`;

    const stepX = Math.max(380, Math.round(width / 1.7));
    const stepY = Math.max(170, Math.round(height / 2.3));

    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.fillText(primaryText, x, y);
        ctx.font = `600 ${Math.max(10, baseFontSize - 3)}px "Outfit", system-ui, sans-serif`;
        ctx.fillText(secondaryText, x, y + baseFontSize + 6);
        if (dateStr) {
          ctx.font = `500 ${Math.max(9, baseFontSize - 5)}px monospace`;
          ctx.fillText(`[ ${dateStr} ]`, x, y + (baseFontSize * 2) + 8);
        }
        ctx.font = `700 ${baseFontSize}px "Outfit", system-ui, sans-serif`;
      }
    }
  } else if (style === 'center') {
    // Massive bold center stamp
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const baseFontSize = Math.max(22, Math.round(width / 18));
    ctx.font = `900 ${baseFontSize}px "Outfit", system-ui, sans-serif`;

    // Rounded border box for stamp
    const boxW = Math.min(width * 0.85, 520);
    const boxH = baseFontSize * 3.5;
    ctx.strokeStyle = themeFill;
    ctx.lineWidth = 3;
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

    ctx.fillText(primaryText, 0, -baseFontSize * 0.4);
    ctx.font = `700 ${Math.round(baseFontSize * 0.65)}px "Outfit", system-ui, sans-serif`;
    ctx.fillText(secondaryText, 0, baseFontSize * 0.7);
  } else if (style === 'bottom') {
    // Elegant bottom banner
    const bannerHeight = Math.max(36, Math.round(height * 0.08));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    ctx.fillStyle = themeFill;
    const baseFontSize = Math.max(12, Math.round(bannerHeight * 0.38));
    ctx.font = `700 ${baseFontSize}px "Outfit", system-ui, sans-serif`;
    ctx.fillText(`${primaryText} | ${secondaryText}`, width / 2, height - (bannerHeight / 2));
  } else if (style === 'corners') {
    // 4 Corner badges + subtle center
    const baseFontSize = Math.max(12, Math.round(width / 42));
    ctx.font = `800 ${baseFontSize}px "Outfit", system-ui, sans-serif`;

    // Top-left
    ctx.fillText(primaryText, 140, 30);
    // Bottom-right
    ctx.fillText(secondaryText, width - 140, height - 30);
    // Center watermark
    ctx.font = `900 ${baseFontSize * 1.5}px "Outfit", system-ui, sans-serif`;
    ctx.fillText('PROTECTED DRAFT', width / 2, height / 2);
  }

  ctx.restore();
}

/**
 * Permanently burns watermark directly into image pixel data using an offscreen canvas.
 * Returns a high-speed data URL (WebP).
 * This makes the image 100% immune to DevTools element removal!
 */
export async function createBurnedWatermarkImage(
  imageSrc: string,
  options: WatermarkOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(imageSrc);
        }

        // 1. Draw base image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Burn watermark directly into pixel buffer
        drawWatermark(ctx, canvas.width, canvas.height, options);

        // 3. Export as permanently watermarked image
        const burnedUrl = canvas.toDataURL('image/webp', 0.88);
        resolve(burnedUrl);
      } catch (err) {
        console.warn('[WatermarkEngine] Canvas pixel burning failed (CORS), falling back to raw:', err);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}

/**
 * Generates Cloudinary CDN-level text watermark overlay
 */
export function getCloudinaryWatermarkUrl(
  url: string,
  text: string = 'SUMR.DAY PREVIEW',
  options: { opacity?: number; angle?: number; fontSize?: number } = {}
): string {
  if (!url || !url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const encodedText = encodeURIComponent(text.replace(/[,\/]/g, ' '));
  const opacity = Math.round((options.opacity ?? 0.3) * 100);
  const angle = options.angle ?? -30;
  const fontSize = options.fontSize ?? 28;

  // Cloudinary text overlay transformation
  const overlay = `l_text:Outfit_${fontSize}_bold:${encodedText},o_${opacity},a_${angle},g_center,f_auto,q_auto`;

  if (url.includes(overlay)) return url;
  return url.replace('/upload/', `/upload/${overlay}/`);
}
