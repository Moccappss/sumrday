/**
 * ══════════════════════════════════════════════════════════════════════
 * SMART MEDIA OPTIMIZER & SELF-HEALING ASSET PIPELINE
 * Automatically injects next-gen formats (WebP/AVIF, auto-quality, auto-width)
 * into Cloudinary URLs and heals broken images with aesthetic dynamic SVG fallbacks.
 * ══════════════════════════════════════════════════════════════════════
 */

export interface MediaOptimizeOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'thumb';
  quality?: 'auto' | 'auto:eco' | 'auto:good' | number;
}

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  savedPercent: number;
}

/**
 * Compress and resize an image File/Blob to WebP (with JPEG fallback) on the client
 * before storing or uploading, reducing storage usage by 70-90%.
 */
export async function compressImageForStorage(
  file: Blob,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<CompressedImageResult> {
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality = options.quality ?? 0.82;
  const originalBytes = file.size;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image'));
      el.src = objectUrl;
    });

    let { width, height } = img;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, width, height);

    const toBlob = (mime: string) =>
      new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, quality));

    let blob = await toBlob('image/webp');
    if (!blob || blob.size === 0) {
      blob = await toBlob('image/jpeg');
    }
    if (!blob) throw new Error('Image compression failed');

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read compressed blob'));
      reader.readAsDataURL(blob!);
    });

    const compressedBytes = blob.size;
    const savedPercent = originalBytes > 0
      ? Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100))
      : 0;

    return { blob, dataUrl, width, height, originalBytes, compressedBytes, savedPercent };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Generates an ultra-lightweight dynamic SVG gradient placeholder for sumr.day
 */
export function getSmartFallbackPlaceholder(title: string = 'sumr.day Studio', type: string = 'Media'): string {
  const safeTitle = (title || 'sumr.day').replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
    <rect width="600" height="400" fill="#09090b"/>
    <defs>
      <linearGradient id="sumrG" x1="0" y1="0" x2="600" y2="400" gradientUnits="userSpaceOnUse">
        <stop stop-color="#18181b"/>
        <stop offset="0.5" stop-color="#27272a"/>
        <stop offset="1" stop-color="#18181b"/>
      </linearGradient>
      <radialGradient id="sumrGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(300 200) rotate(90) scale(160 240)">
        <stop stop-color="#f59e0b" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#f59e0b" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="600" height="400" fill="url(#sumrG)"/>
    <rect width="600" height="400" fill="url(#sumrGlow)"/>
    <circle cx="300" cy="180" r="32" fill="#27272a" stroke="#3f3f46" stroke-width="1.5"/>
    <path d="M292 188L300 176L308 188H292Z" fill="#f59e0b"/>
    <circle cx="304" cy="172" r="3" fill="#f59e0b"/>
    <text x="300" y="240" fill="#a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="middle" letter-spacing="0.05em">${safeTitle}</text>
    <text x="300" y="260" fill="#71717a" font-family="system-ui, -apple-system, sans-serif" font-size="11" text-anchor="middle">${type}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Optimizes a media URL with Cloudinary next-gen transformation or Google Drive proxy
 */
export function optimizeMediaUrl(url?: string, options: MediaOptimizeOptions = {}): string {
  if (!url || typeof url !== 'string') {
    return getSmartFallbackPlaceholder('sumr.day Asset', 'Digital Asset');
  }

  const trimmed = url.trim();

  // 1. Cloudinary URL optimization
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
    // If transformations are already present, return
    if (trimmed.includes('/f_auto,q_auto')) {
      return trimmed;
    }

    const parts = trimmed.split('/image/upload/');
    if (parts.length === 2) {
      const transformParts: string[] = ['f_auto', 'q_auto'];
      if (options.width) transformParts.push(`w_${options.width}`);
      if (options.height) transformParts.push(`h_${options.height}`);
      if (options.crop) transformParts.push(`c_${options.crop}`);
      else if (options.width) transformParts.push('c_limit');

      const transformStr = transformParts.join(',');
      return `${parts[0]}/image/upload/${transformStr}/${parts[1]}`;
    }
  }

  // 2. Google Drive preview link conversion to direct viewable stream
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  return trimmed;
}

/**
 * Global Self-Healing Image Interceptor
 * Listens to image load errors in the capture phase and replaces broken sources
 * with an aesthetic SVG placeholder without crashing layout.
 */
let _isHealingAttached = false;
export function initSmartMediaSelfHealing(): void {
  if (typeof window === 'undefined' || _isHealingAttached) return;
  _isHealingAttached = true;

  window.addEventListener(
    'error',
    (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        // Avoid infinite fallback loops
        if (img.dataset.healed === 'true') return;

        img.dataset.healed = 'true';
        const altText = img.alt || 'Aset Visual sumr.day';
        img.src = getSmartFallbackPlaceholder(altText, 'Gambar');
        img.style.objectFit = 'cover';
      }
    },
    true // Capture phase to catch image 404s before they bubble
  );
}
