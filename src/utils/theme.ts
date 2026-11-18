/**
 * Dynamic Analogous Color & Theme Engine
 * Generates harmonious, vibrant analogous color schemes from any primary accent.
 */

let lastAppliedHex = '';

// Helper: Convert HEX to HSL
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Helper: Convert HSL to HEX
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Helper: Convert HEX to RGB string
export function hexToRgbString(hex: string): string {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

import { getSolarAtmosphere } from './solarCircadianEngine';

export interface AnalogousPalette {
  primary: string;       // Base H
  analogousCool: string; // H - 35° (Cool neighbor)
  analogousWarm: string; // H + 35° (Warm neighbor)
  analogousDeep: string; // H - 20° (Deep richer tone)
  analogousPop: string;  // H + 55° (Vibrant contrast accent)
}

export interface CuratedPalette {
  id: string;
  name: string;
  hex: string;
  desc: string;
  tag: string;
}

export const CURATED_STUDIO_PALETTES: CuratedPalette[] = [
  { id: 'terracotta', name: 'Terracotta Ember', hex: '#D95629', desc: 'Signature sumr.day — Hangat & Kreatif', tag: 'Signature' },
  { id: 'solar', name: 'Solar Sunrise', hex: '#F59E0B', desc: 'Energi Fajar & Semangat Produktif', tag: 'Pagi' },
  { id: 'emerald', name: 'Zen Emerald', hex: '#10B981', desc: 'Keseimbangan, Keuangan & Pertumbuhan', tag: 'Growth' },
  { id: 'azure', name: 'Pacific Azure', hex: '#0EA5E9', desc: 'Modern Tech, Jernih & Profesional', tag: 'Modern' },
  { id: 'indigo', name: 'Cosmic Indigo', hex: '#6366F1', desc: 'Fokus Mendalam & Elegan', tag: 'Studio' },
  { id: 'violet', name: 'Velvet Violet', hex: '#8B5CF6', desc: 'Mewah, Artistik & Eksklusif', tag: 'Luxury' },
  { id: 'rose', name: 'Cyber Rose', hex: '#EC4899', desc: 'Berani, Ceria & Berenergi Pop', tag: 'Vibrant' },
  { id: 'lime', name: 'Electric Lime', hex: '#84CC16', desc: 'Segar, Unik & Cepat Tanggap', tag: 'Fresh' }
];

/**
 * Calculates WCAG 2.1 Relative Luminance for a given HEX color
 */
export function getRelativeLuminance(hex: string): number {
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const sRGB = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculates WCAG 2.1 Contrast Ratio between two HEX colors (e.g., 4.5:1, 7:1)
 */
export function getWcagContrast(hex1: string, hex2: string): number {
  try {
    const l1 = getRelativeLuminance(hex1);
    const l2 = getRelativeLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(1));
  } catch {
    return 4.5;
  }
}

/**
 * Returns human-readable readability rating and badge styles based on WCAG contrast
 */
export function getContrastRating(ratio: number): {
  grade: 'AAA' | 'AA' | 'AA Large' | 'Rendah';
  label: string;
  badgeBg: string;
  textColor: string;
} {
  if (ratio >= 7.0) {
    return { grade: 'AAA', label: 'Kontras Sangat Nyaman (AAA)', badgeBg: 'rgba(16, 185, 129, 0.15)', textColor: '#10b981' };
  }
  if (ratio >= 4.5) {
    return { grade: 'AA', label: 'Kontras Standar Tinggi (AA)', badgeBg: 'rgba(16, 185, 129, 0.12)', textColor: '#10b981' };
  }
  if (ratio >= 3.0) {
    return { grade: 'AA Large', label: 'Cukup untuk Teks Besar', badgeBg: 'rgba(245, 158, 11, 0.15)', textColor: '#f59e0b' };
  }
  return { grade: 'Rendah', label: 'Kontras Rendah (Perlu Penyesuaian)', badgeBg: 'rgba(239, 68, 68, 0.15)', textColor: '#ef4444' };
}

/**
 * Generates dynamic analogous palette with optimized contrast and saturation
 */
export function generateAnalogousPalette(primaryHex: string): AnalogousPalette {
  const { h, s, l } = hexToHsl(primaryHex);

  const sat = Math.max(75, s); // Ensure lively saturation
  const lum = Math.min(65, Math.max(45, l)); // Ensure readable brightness

  return {
    primary: primaryHex,
    analogousCool: hslToHex(h - 32, sat * 0.95, lum * 1.05),
    analogousWarm: hslToHex(h + 32, sat * 1.02, lum * 0.98),
    analogousDeep: hslToHex(h - 18, sat, Math.max(38, lum * 0.88)),
    analogousPop: hslToHex(h + 54, Math.min(100, sat * 1.1), lum * 1.08),
  };
}

export const applyAccentColor = (accentColor?: string | null): string => {
  let raw = accentColor;
  if (!raw || typeof raw !== 'string') {
    try {
      raw = localStorage.getItem('porto_accent_color') || '#D95629';
    } catch {
      raw = '#D95629';
    }
  }
  let hex = (raw || '').trim();

  if (hex.startsWith('var')) {
    const match = hex.match(/#[0-9a-fA-F]{3,8}/);
    hex = match ? match[0] : '#D95629';
  }

  if (!hex.startsWith('#') && /^[0-9a-fA-F]{3,8}$/.test(hex)) {
    hex = '#' + hex;
  }

  const isValidHex = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex);
  if (!isValidHex) {
    try {
      hex = localStorage.getItem('porto_accent_color') || '#D95629';
    } catch {
      hex = '#D95629';
    }
  }

  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  } else if (hex.length === 5) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] + hex[4] + hex[4];
  }

  if (lastAppliedHex === hex) {
    return hex;
  }
  lastAppliedHex = hex;

  try {
    localStorage.setItem('porto_accent_color', hex);
  } catch {}

  if (typeof document !== 'undefined') {
    const rootStyle = document.documentElement.style;
    
    // 1. Core Primary Accent
    rootStyle.setProperty('--cms-accent', hex);
    rootStyle.setProperty('--accent', hex);
    rootStyle.setProperty('--accent-color', hex);
    rootStyle.setProperty('--color-primary', hex);
    rootStyle.setProperty('--primary', hex);
    rootStyle.setProperty('--theme-accent', hex);
    rootStyle.setProperty('--blog-accent', hex);
    
    const rgbStr = hexToRgbString(hex);
    rootStyle.setProperty('--cms-accent-rgb', rgbStr);
    rootStyle.setProperty('--theme-accent-rgb', rgbStr);
    rootStyle.setProperty('--color-primary-rgb', rgbStr);
    rootStyle.setProperty('--primary-rgb', rgbStr);

    // 2. Generate Analogous Harmonious Palette
    const palette = generateAnalogousPalette(hex);
    const coolRgb = hexToRgbString(palette.analogousCool);
    const warmRgb = hexToRgbString(palette.analogousWarm);
    const popRgb = hexToRgbString(palette.analogousPop);

    rootStyle.setProperty('--theme-analogous-1', palette.primary);
    rootStyle.setProperty('--theme-analogous-2', palette.analogousCool);
    rootStyle.setProperty('--theme-analogous-3', palette.analogousWarm);
    rootStyle.setProperty('--theme-analogous-4', palette.analogousPop);
    rootStyle.setProperty('--theme-analogous-deep', palette.analogousDeep);

    rootStyle.setProperty('--theme-analogous-cool-rgb', coolRgb);
    rootStyle.setProperty('--theme-analogous-warm-rgb', warmRgb);
    rootStyle.setProperty('--theme-analogous-pop-rgb', popRgb);

    // 3. Multi-Hue Analogous Gradients & Mesh
    rootStyle.setProperty('--cms-accent-hover', palette.analogousDeep);
    rootStyle.setProperty('--cms-accent-gradient', `linear-gradient(135deg, ${palette.primary} 0%, ${palette.analogousDeep} 100%)`);
    rootStyle.setProperty('--cms-accent-gradient-analogous', `linear-gradient(135deg, ${palette.analogousCool} 0%, ${palette.primary} 50%, ${palette.analogousWarm} 100%)`);
    rootStyle.setProperty('--cms-accent-gradient-vibrant', `linear-gradient(135deg, ${palette.analogousCool} 0%, ${palette.primary} 45%, ${palette.analogousPop} 100%)`);
    rootStyle.setProperty('--cms-accent-gradient-subtle', `linear-gradient(135deg, rgba(${coolRgb}, 0.15) 0%, rgba(${rgbStr}, 0.08) 50%, rgba(${warmRgb}, 0.15) 100%)`);
    rootStyle.setProperty('--cms-accent-mesh', `radial-gradient(circle at 10% 10%, rgba(${coolRgb}, 0.25) 0%, transparent 60%), radial-gradient(circle at 90% 90%, rgba(${warmRgb}, 0.22) 0%, transparent 60%)`);

    // 4. Vibrant Multi-Hue Borders & Glows
    rootStyle.setProperty('--cms-accent-soft', `rgba(${rgbStr}, 0.12)`);
    rootStyle.setProperty('--cms-accent-light', `rgba(${rgbStr}, 0.22)`);
    rootStyle.setProperty('--cms-accent-medium', `rgba(${rgbStr}, 0.45)`);
    rootStyle.setProperty('--cms-accent-strong', `rgba(${rgbStr}, 0.7)`);
    
    rootStyle.setProperty('--cms-accent-border', `rgba(${rgbStr}, 0.35)`);
    rootStyle.setProperty('--cms-accent-border-strong', `rgba(${rgbStr}, 0.75)`);
    rootStyle.setProperty('--cms-accent-ring', `0 0 0 3px rgba(${coolRgb}, 0.35)`);
    rootStyle.setProperty('--cms-accent-ring-strong', `0 0 0 4px rgba(${rgbStr}, 0.5)`);

    rootStyle.setProperty('--cms-accent-glow', `0 0 24px rgba(${rgbStr}, 0.45), 0 0 12px rgba(${warmRgb}, 0.35)`);
    rootStyle.setProperty('--cms-accent-glow-subtle', `0 0 14px rgba(${coolRgb}, 0.25)`);
    rootStyle.setProperty('--cms-accent-glow-intense', `0 0 36px rgba(${rgbStr}, 0.7), 0 0 16px rgba(${popRgb}, 0.55)`);
    rootStyle.setProperty('--cms-accent-shadow', `0 8px 24px -4px rgba(${coolRgb}, 0.35), 0 4px 12px -2px rgba(${warmRgb}, 0.25)`);

    // 5. Calculate text brightness
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    rootStyle.setProperty('--cms-accent-fg', brightness < 135 ? '#ffffff' : '#0a0a0f');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porto_accent_color_changed', { 
        detail: { color: hex, palette } 
      }));
    }
  }

  return hex;
};

/**
 * Activates the solar circadian theme color for the current time of day
 */
export function applyCircadianAccent(): { hex: string; phaseLabel: string; sunIcon: string } {
  const atmo = getSolarAtmosphere();
  const hex = atmo.suggestedAccentColor;
  applyAccentColor(hex);
  return {
    hex,
    phaseLabel: atmo.phaseLabel,
    sunIcon: atmo.sunIcon
  };
}

export default applyAccentColor;

