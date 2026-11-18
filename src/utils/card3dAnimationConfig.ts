/**
 * Pusat Basis Data & Konfigurasi Animasi Kartu 3D (Single Source of Truth)
 * Seluruh kartu di website (Client, Sub-page, & Admin) menggunakan parameter,
 * kurva transisi, elevasi, dan efek shine yang identik dengan kartu Proofing.
 */

export const CARD_3D_ANIMATION_CONFIG = {
  perspective: 1000,
  maxTiltDeg: 11,
  wideMaxTiltDeg: 7,
  bannerMaxTiltDeg: 5,
  navbarMaxTiltDeg: 3.5,
  wideWidthThreshold: 560,
  bannerWidthThreshold: 820,
  hoverLiftY: -6,
  hoverLiftZ: 8,
  bannerHoverLiftY: -4,
  navbarHoverLiftY: -3,
  resetCleanupDelayMs: 860,
  transitions: {
    enterTransform: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
    enterBoxShadow: 'box-shadow 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
    enterBorder: 'border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
    leaveTransform: 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
    leaveBoxShadow: 'box-shadow 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
    leaveBorder: 'border-color 0.55s ease',
    glareOpacity: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  glare: {
    darkAlpha: 0.11,
    lightAlpha: 0.14,
    radiusStop: '62%',
  },
  shadows: {
    hoverDark: '0 20px 40px -10px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.14)',
    hoverLight: '0 10px 26px -8px rgba(15, 23, 42, 0.07), 0 0 0 1px rgba(15, 23, 42, 0.05)',
    restDefault: 'var(--cms-shadow-sm, 0 4px 18px rgba(0,0,0,0.04))',
  },
} as const;

export interface Card3dTiltState {
  rotX: number;
  rotY: number;
  glareX: number;
  glareY: number;
}

export function computeCard3dTilt(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  useWideClamp = true,
  maxTiltOverride?: number
): Card3dTiltState {
  if (rect.width <= 0 || rect.height <= 0) {
    return { rotX: 0, rotY: 0, glareX: 50, glareY: 50 };
  }
  const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  const px = normX - 0.5;
  const py = normY - 0.5;
  const defaultMaxTilt =
    useWideClamp && rect.width > CARD_3D_ANIMATION_CONFIG.wideWidthThreshold
      ? rect.width > CARD_3D_ANIMATION_CONFIG.bannerWidthThreshold
        ? CARD_3D_ANIMATION_CONFIG.bannerMaxTiltDeg
        : CARD_3D_ANIMATION_CONFIG.wideMaxTiltDeg
      : CARD_3D_ANIMATION_CONFIG.maxTiltDeg;
  const maxTilt = maxTiltOverride !== undefined ? maxTiltOverride : defaultMaxTilt;

  return {
    rotX: Number((-py * maxTilt).toFixed(2)),
    rotY: Number((px * maxTilt).toFixed(2)),
    glareX: Number((normX * 100).toFixed(1)),
    glareY: Number((normY * 100).toFixed(1)),
  };
}

export function getCard3dTransform(
  rotX: number,
  rotY: number,
  isHovered: boolean,
  hoverLiftOverride?: number
): string {
  const lift = hoverLiftOverride !== undefined ? hoverLiftOverride : CARD_3D_ANIMATION_CONFIG.hoverLiftY;
  const liftY = isHovered ? lift : 0;
  const liftZ = isHovered ? (hoverLiftOverride !== undefined ? 4 : CARD_3D_ANIMATION_CONFIG.hoverLiftZ) : 0;
  return `perspective(${CARD_3D_ANIMATION_CONFIG.perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) translate3d(0, ${liftY}px, ${liftZ}px)`;
}

export function getCard3dTransition(isHovered: boolean, includeBorder = true): string {
  const { transitions } = CARD_3D_ANIMATION_CONFIG;
  if (isHovered) {
    return includeBorder
      ? `${transitions.enterTransform}, ${transitions.enterBoxShadow}, ${transitions.enterBorder}`
      : `${transitions.enterTransform}, ${transitions.enterBoxShadow}`;
  }
  return includeBorder
    ? `${transitions.leaveTransform}, ${transitions.leaveBoxShadow}, ${transitions.leaveBorder}`
    : `${transitions.leaveTransform}, ${transitions.leaveBoxShadow}`;
}

export function getCard3dHoverShadow(isLight: boolean): string {
  return isLight ? CARD_3D_ANIMATION_CONFIG.shadows.hoverLight : CARD_3D_ANIMATION_CONFIG.shadows.hoverDark;
}

export function getCard3dGlareBackground(glareX: number, glareY: number, isLight = false): string {
  const alpha = isLight
    ? CARD_3D_ANIMATION_CONFIG.glare.lightAlpha
    : CARD_3D_ANIMATION_CONFIG.glare.darkAlpha;
  return `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,${alpha}) 0%, transparent ${CARD_3D_ANIMATION_CONFIG.glare.radiusStop})`;
}
