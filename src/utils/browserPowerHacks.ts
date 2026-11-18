/**
 * ══════════════════════════════════════════════════════════════════════
 * BROWSER POWER HACKS & MODERN WEB API BRIDGE (SUMR.DAY OS)
 * Pemanfaatan API native browser mutakhir & AI Cloudinary URL hacks
 * ══════════════════════════════════════════════════════════════════════
 */

// Simpan judul asli dokumen agar bisa dikembalikan saat badge 0
let originalDocumentTitle = typeof document !== 'undefined' ? document.title : 'sumr.day OS';
let activeWakeLock: any = null;

/**
 * 1. APP BADGING & DYNAMIC TITLE HACK
 * Memunculkan bulatan merah di icon PWA / Taskbar & judul tab browser
 */
export const updateAppBadge = async (count: number, label: string = 'Perlu Cek Mutasi'): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    // A. Native PWA Badging API (Windows Taskbar, macOS Dock, Android Home Screen)
    if ('setAppBadge' in navigator && typeof (navigator as any).setAppBadge === 'function') {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else if ('clearAppBadge' in navigator && typeof (navigator as any).clearAppBadge === 'function') {
        await (navigator as any).clearAppBadge();
      }
    }
  } catch (err) {
    // Ignore badge failure if not running in standalone or unsupported
  }

  // B. Dynamic Browser Tab Title Hack
  try {
    if (count > 0) {
      if (!document.title.startsWith('(')) {
        originalDocumentTitle = document.title;
      }
      document.title = `(${count}) 🔔 ${label} — ${originalDocumentTitle.replace(/^\(\d+\)\s*(🔔\s*)?/, '')}`;
    } else {
      document.title = originalDocumentTitle.replace(/^\(\d+\)\s*(🔔\s*)?/, '');
    }
  } catch (err) {
    // Ignore title update failure
  }
};

/**
 * 2. NATIVE WEB SHARE SHEET API HACK
 * Berbagi langsung ke WhatsApp, Telegram, Story, atau AirDrop tanpa download manual
 */
export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export const shareNativeContent = async (options: ShareOptions): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'failed' }> => {
  if (typeof window === 'undefined') return { success: false, method: 'failed' };

  // 1. Cek dukungan Web Share API tingkat lanjut
  if (navigator.share) {
    try {
      const shareData: ShareData = {
        title: options.title || 'sumr.day Studio',
        text: options.text || '',
        url: options.url || window.location.href,
      };

      // Jika ada file dan browser mendukung file sharing
      if (options.files && options.files.length > 0 && navigator.canShare && navigator.canShare({ files: options.files })) {
        shareData.files = options.files;
      }

      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (err: any) {
      // User membatalkan dialog share (AbortError) bukan error sistem
      if (err.name === 'AbortError') {
        return { success: false, method: 'native' };
      }
    }
  }

  // 2. Fallback cerdas: Salin teks ke Clipboard
  try {
    const fallbackText = `${options.title ? `${options.title}\n\n` : ''}${options.text || ''}${options.url ? `\n\nTautan: ${options.url}` : ''}`.trim();
    if (fallbackText && navigator.clipboard) {
      await navigator.clipboard.writeText(fallbackText);
      return { success: true, method: 'clipboard' };
    }
  } catch {}

  return { success: false, method: 'failed' };
};

/**
 * 3. SCREEN WAKE LOCK API HACK
 * Mencegah layar tablet / laptop / HP redup atau mati saat presentasi flipbook / proofing karya
 */
export const requestScreenWakeLock = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return false;

  try {
    if (activeWakeLock !== null) return true; // Sudah aktif
    activeWakeLock = await (navigator as any).wakeLock.request('screen');
    activeWakeLock.addEventListener('release', () => {
      activeWakeLock = null;
    });
    return true;
  } catch (err) {
    return false;
  }
};

export const releaseScreenWakeLock = async (): Promise<void> => {
  if (activeWakeLock !== null) {
    try {
      await activeWakeLock.release();
    } catch {}
    activeWakeLock = null;
  }
};

/**
 * 4. CLOUDINARY AI GENERATIVE OUTPAINTING / FILL (STORY 9:16 EXPAND HACK)
 * Mengubah foto lanskap produk/portofolio menjadi format vertikal 9:16
 * dengan mengisi background secara mulus menggunakan Generative AI tanpa terpotong!
 */
export const getCloudinaryGenerativeFill = (
  imageUrl: string,
  targetRatio: '9:16' | '1:1' | '16:9' | '4:5' = '9:16'
): string => {
  if (!imageUrl || typeof imageUrl !== 'string') return '';

  // Jika URL Cloudinary langsung
  if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
    const transform = `b_gen_fill,c_pad,ar_${targetRatio},f_auto,q_auto:eco/`;
    return imageUrl.replace('/upload/', `/upload/${transform}`);
  }

  // Jika URL gambar publik lain (Unsplash, external), gunakan Cloudinary Remote Fetch
  return `https://res.cloudinary.com/demo/image/fetch/b_gen_fill,c_pad,ar_${targetRatio},f_auto,q_auto:eco/${encodeURIComponent(imageUrl)}`;
};

