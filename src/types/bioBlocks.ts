import { storage } from '../utils/storage';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type BioBlockType = 
  | 'link' 
  | 'lead-magnet' 
  | 'tip-jar' 
  | 'accordion' 
  | 'countdown' 
  | 'product-card' 
  | 'embed';

export interface BioLinkItem {
  id: string;
  itemType?: BioBlockType;
  url: string;
  title: string;
  subtitle?: string;
  category?: string;
  iconSvg?: string;
  coverImageUrl?: string;
  btnBgType?: 'solid' | 'gradient' | 'image' | 'glass' | 'neon' | 'outline';
  btnBgColor?: string;
  btnTextColor?: string;
  btnBgImage?: string;
  btnBgGradient?: string;
  btnShape?: 'pill' | 'square' | 'rounded';
  btnStyle?: 'flat' | 'elevated' | 'glass' | 'neon';
  animation?: 'none' | 'pulse' | 'glow' | 'shimmer' | 'bounce' | 'wobble' | 'float' | 'heartbeat' | 'gradient-shift' | 'border-glow';
  isFeatured?: boolean;
  order?: number;

  // Custom Colors & Style for All Block Types
  blockAccentColor?: string; // Primary accent: badges, icons, active highlights, action button gradient
  blockBgColor?: string;     // Container / card background color
  blockTextColor?: string;   // Title & header text color
  blockBorderColor?: string; // Custom border / glow color
  blockBtnColor?: string;    // Custom action button color or gradient
  blockBtnTextColor?: string;// Custom action button text color

  // Lead Magnet block specific
  leadDownloadUrl?: string;
  leadButtonText?: string;
  leadSuccessMsg?: string;
  leadBadge?: string;

  // Tip Jar block specific
  tipAmounts?: number[];
  tipRecipientWa?: string;
  tipPresetNote?: string;
  tipSaweriaUrl?: string; // e.g. https://saweria.co/username or trakteer.id/username
  tipQrisImageUrl?: string; // Image QRIS URL
  tipPreferredMethod?: 'all' | 'saweria' | 'qris' | 'whatsapp';

  // Accordion FAQ specific
  accordionContent?: string;

  // Countdown specific
  countdownTargetDate?: string; // ISO string e.g. "2026-12-31T23:59"
  countdownBadge?: string;
  countdownImageUrl?: string; // Flash sale promotional banner image URL

  // Product Card specific
  productPrice?: number;
  productOriginalPrice?: number;
  productBadge?: string;
  productButtonText?: string;

  // Embed specific
  embedUrl?: string;
  embedType?: 'youtube' | 'spotify' | 'custom';
}

export interface BioLeadEntry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  resourceTitle: string;
  pageSlug?: string;
  createdAt: string;
}

export const saveBioLead = async (lead: Omit<BioLeadEntry, 'id' | 'createdAt'>): Promise<boolean> => {
  try {
    const entry: BioLeadEntry = {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };

    // 1. Simpan ke database prospek / leads
    const existingLeads = (await storage.getItem('porto_leads', [])) || [];
    await storage.setItem('porto_leads', [entry, ...existingLeads]);

    // 2. Otomatis sinkronisasi ke data pelanggan / customer database (Space Circle)
    try {
      const existingCust = (await storage.getItem('porto_customers', [])) || [];
      const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
      const idx = existingCust.findIndex((c: any) => c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone);

      const customerPayload = {
        id: idx >= 0 ? existingCust[idx].id : `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || (idx >= 0 ? existingCust[idx].email : ''),
        source: 'Bio Link (Lead Magnet)',
        sourceType: 'bio-link',
        sourceDetail: lead.resourceTitle || 'Freebie Template',
        totalOrders: idx >= 0 ? (existingCust[idx].totalOrders || 0) : 0,
        totalSpent: idx >= 0 ? (existingCust[idx].totalSpent || 0) : 0,
        createdAt: idx >= 0 ? existingCust[idx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: `Freebie: ${lead.resourceTitle || 'Lead Magnet'}${lead.pageSlug ? ` (Halaman: ${lead.pageSlug})` : ''}`
      };

      if (idx >= 0) {
        existingCust[idx] = { ...existingCust[idx], ...customerPayload };
        await storage.setItem('porto_customers', existingCust);
      } else {
        await storage.setItem('porto_customers', [customerPayload, ...existingCust]);
      }

      // Kirim event update agar UI Space Circle & Broadcast Studio langsung refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('porto_customers_updated', { detail: customerPayload }));
        window.dispatchEvent(new CustomEvent('porto_leads_updated', { detail: entry }));
      }
    } catch (syncErr) {
      console.warn('Customer auto-sync warning:', syncErr);
    }

    // 3. Also register to Broadcast Subscribers if Firestore is active
    try {
      if (db) {
        await addDoc(collection(db, 'porto_broadcast_subscribers'), {
          id: entry.id,
          name: entry.name,
          phone: entry.phone,
          email: entry.email || '',
          source: `lead-magnet:${entry.resourceTitle}`,
          subscribedAt: serverTimestamp(),
          platform: 'web-bio-link'
        });
      }
    } catch (firebaseErr) {
      console.warn('Silent broadcast subscriber sync notice:', firebaseErr);
    }

    return true;
  } catch (err) {
    console.error('Failed to save bio lead:', err);
    return false;
  }
};

/**
 * Format number into Indonesian Rupiah (e.g. Rp 25.000)
 */
export const formatBioCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Convert user input URL (YouTube, Spotify) to proper embed iframe src
 */
export const getEmbedIframeSrc = (url: string): { src: string; type: 'youtube' | 'spotify' | 'generic' } => {
  if (!url) return { src: '', type: 'generic' };

  // YouTube / Shorts
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      src: `https://www.youtube.com/embed/${ytMatch[1]}`,
      type: 'youtube'
    };
  }

  // Spotify (track, album, playlist, episode)
  if (url.includes('spotify.com')) {
    const spotifyClean = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    return {
      src: spotifyClean,
      type: 'spotify'
    };
  }

  // Generic / web URL fallback
  return {
    src: url,
    type: 'generic'
  };
};

/**
 * Automatically computes high-contrast text color based on background luminance (YIQ / WCAG formula)
 */
export function getContrastTextColor(hexColor?: string, dark = '#0f172a', light = '#ffffff'): string {
  if (!hexColor || typeof hexColor !== 'string') return light;
  let clean = hexColor.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return light;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? dark : light;
}

/**
 * Automatically computes harmonious, high-contrast styles for any BioLinkItem
 */
export function getAutoBlockStyle(link: BioLinkItem, defaultAccent = '#7c3aed') {
  const accent = link.blockAccentColor || (link.btnBgType === 'solid' ? link.btnBgColor : '') || defaultAccent;
  const isPill = link.btnShape === 'pill';
  const isSquare = link.btnShape === 'square';
  const cardRadius = isPill ? 28 : isSquare ? 10 : 18;
  const btnRadius = isPill ? 100 : isSquare ? 8 : 12;
  const isNeon = link.btnBgType === 'neon';
  const isGlass = link.btnBgType === 'glass';
  const isSolid = link.btnBgType === 'solid';

  // Card Background
  let cardBg = 'rgba(255, 255, 255, 0.06)';
  if (isSolid) {
    cardBg = link.blockBgColor || link.btnBgColor || accent;
  } else if (isNeon) {
    cardBg = 'rgba(0, 0, 0, 0.72)';
  } else if (isGlass) {
    cardBg = 'rgba(255, 255, 255, 0.08)';
  } else if (link.btnBgType === 'gradient') {
    cardBg = link.btnBgGradient || `linear-gradient(135deg, ${accent}25, rgba(0,0,0,0.5))`;
  }

  // Smart Contrast Text:
  // If card is solid, calculate contrast against cardBg. Otherwise default to high-contrast white.
  let textColor = '#ffffff';
  if (isSolid && (cardBg.startsWith('#') || cardBg.startsWith('rgb'))) {
    textColor = getContrastTextColor(cardBg, '#0f172a', '#ffffff');
  } else if (link.blockTextColor) {
    textColor = link.blockTextColor;
  }

  // Border & Glow:
  const borderColor = isNeon ? accent : (link.blockBorderColor || `${accent}40`);

  // Action Button & Contrast:
  const btnBg = link.blockBtnColor || link.btnBgGradient || `linear-gradient(135deg, ${accent}, #7c3aed)`;
  const btnTextColor = getContrastTextColor(accent, '#0f172a', '#ffffff');

  // Animation:
  const animClass = link.animation && link.animation !== 'none' ? `lp-anim-${link.animation}` : '';

  return {
    accent,
    cardRadius,
    btnRadius,
    cardBg,
    textColor,
    borderColor,
    btnBg,
    btnTextColor,
    isNeon,
    isGlass,
    isSolid,
    animClass
  };
}
