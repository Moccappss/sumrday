export type CursorVisualTheme = 'duotone' | 'solid-ink' | 'minimal-dot';
export type CursorTrailColorMode = 'accent' | 'custom' | 'gradient';

export interface CustomCursorConfig {
  enabled: boolean;
  theme: CursorVisualTheme;
  cursorSize: number; // multiplier 0.75 - 1.5
  clickBurst: boolean;
  trailEnabled: boolean;
  trailWidth: number; // 2 - 14 (halfWidth = trailWidth / 2)
  trailLength: number; // 10 - 50 points
  trailStability: number; // 15 - 75 (%) -> lower = looser/more organic S-curve, higher = tighter/faster
  trailColorMode: CursorTrailColorMode;
  trailCustomColor: string;
  trailSecondaryColor: string;
  trailGlow: boolean;
  trailGlowBlur: number; // 4 - 28 px
}

export const DEFAULT_CUSTOM_CURSOR_CONFIG: CustomCursorConfig = {
  enabled: true,
  theme: 'duotone',
  cursorSize: 1.0,
  clickBurst: true,
  trailEnabled: true,
  trailWidth: 8,
  trailLength: 28,
  trailStability: 36,
  trailColorMode: 'accent',
  trailCustomColor: '#0EA5E9',
  trailSecondaryColor: '#8B5CF6',
  trailGlow: true,
  trailGlowBlur: 12,
};

export function resolveCustomCursorConfig(raw?: Partial<CustomCursorConfig> | null): CustomCursorConfig {
  return {
    ...DEFAULT_CUSTOM_CURSOR_CONFIG,
    ...(raw || {}),
  };
}
