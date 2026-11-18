/**
 * ══════════════════════════════════════════════════════════════════════
 * SOLAR & CIRCADIAN ATMOSPHERE ENGINE
 * "A little sunshine for your screen" ☀️
 * Synchronizes website ambient lighting, glow gradients, and subtle accents
 * with the visitor's local solar phase throughout the day (0 KB server cost).
 * ══════════════════════════════════════════════════════════════════════
 */

export type SolarPhase = 'fajar' | 'pagi' | 'siang' | 'senja' | 'malam';

export interface SolarAtmosphere {
  phase: SolarPhase;
  phaseLabel: string;
  greeting: string;
  sunIcon: string;
  ambientGlowColor: string;
  suggestedAccentColor: string;
  warmthLevel: number; // 0 - 100
}

/**
 * Calculates current solar phase and ambient colors from local system clock
 */
export function getSolarAtmosphere(date: Date = new Date()): SolarAtmosphere {
  const hours = date.getHours() + date.getMinutes() / 60;

  // 1. Fajar / Dawn (05:00 - 06:59)
  if (hours >= 5 && hours < 7) {
    return {
      phase: 'fajar',
      phaseLabel: 'Fajar Hangat',
      greeting: 'Selamat Fajar',
      sunIcon: '🌅',
      ambientGlowColor: 'rgba(251, 146, 60, 0.22)', // Soft Amber Dawn
      suggestedAccentColor: '#f97316',
      warmthLevel: 65,
    };
  }

  // 2. Pagi / Morning Sunshine (07:00 - 11:29)
  if (hours >= 7 && hours < 11.5) {
    return {
      phase: 'pagi',
      phaseLabel: 'Pagi Cerah',
      greeting: 'Selamat Pagi',
      sunIcon: '☀️',
      ambientGlowColor: 'rgba(245, 158, 11, 0.25)', // Golden Sunshine
      suggestedAccentColor: '#f59e0b',
      warmthLevel: 75,
    };
  }

  // 3. Siang / High Noon (11:30 - 15:29)
  if (hours >= 11.5 && hours < 15.5) {
    return {
      phase: 'siang',
      phaseLabel: 'Siang Terang',
      greeting: 'Selamat Siang',
      sunIcon: '🌞',
      ambientGlowColor: 'rgba(234, 179, 8, 0.28)', // Vivid Sun Gold
      suggestedAccentColor: '#eab308',
      warmthLevel: 85,
    };
  }

  // 4. Senja / Golden Hour & Sunset (15:30 - 18:29)
  if (hours >= 15.5 && hours < 18.5) {
    return {
      phase: 'senja',
      phaseLabel: 'Senja Terracotta',
      greeting: 'Selamat Sore',
      sunIcon: '🌇',
      ambientGlowColor: 'rgba(244, 63, 94, 0.24)', // Sunset Terracotta Rose
      suggestedAccentColor: '#f43f5e',
      warmthLevel: 90,
    };
  }

  // 5. Malam / Midnight Warm Tech (18:30 - 04:59)
  return {
    phase: 'malam',
    phaseLabel: 'Malam Tenang',
    greeting: 'Selamat Malam',
    sunIcon: '✨',
    ambientGlowColor: 'rgba(168, 85, 247, 0.18)', // Midnight Violet Embers
    suggestedAccentColor: '#8b5cf6',
    warmthLevel: 50,
  };
}

/**
 * Injects solar CSS tokens into the document root
 */
export function applySolarAtmosphere(): void {
  if (typeof document === 'undefined') return;

  const atmo = getSolarAtmosphere();
  const root = document.documentElement;

  root.style.setProperty('--solar-glow', atmo.ambientGlowColor);
  root.style.setProperty('--solar-warmth', `${atmo.warmthLevel}%`);
  root.setAttribute('data-solar-phase', atmo.phase);
}

let _isInitialized = false;

/**
 * Initializes auto-updating solar circadian engine (checks every 10 minutes)
 */
export function initSolarCircadianEngine(): void {
  if (typeof window === 'undefined' || _isInitialized) return;
  _isInitialized = true;

  applySolarAtmosphere();

  // Re-evaluate every 10 minutes (0.00% battery impact)
  setInterval(() => {
    applySolarAtmosphere();
  }, 10 * 60 * 1000);
}
