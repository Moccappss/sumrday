/**
 * ══════════════════════════════════════════════════════════════════════
 * HARDWARE-ADAPTIVE & TAB HIBERNATION ENGINE
 * Dynamically scales graphics fidelity, pauses background activity,
 * and tunes CSS animations based on battery, CPU, RAM, and tab visibility.
 * ══════════════════════════════════════════════════════════════════════
 */

export interface DeviceHardwareProfile {
  cpuCores: number;
  memoryGb: number;
  isLowEndDevice: boolean;
  isBatterySaving: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
}

let _cachedProfile: DeviceHardwareProfile | null = null;
let _isInitialized = false;

/**
 * Detect device hardware capabilities
 */
export function getDeviceHardwareProfile(): DeviceHardwareProfile {
  if (_cachedProfile) return _cachedProfile;

  if (typeof window === 'undefined') {
    return {
      cpuCores: 8,
      memoryGb: 8,
      isLowEndDevice: false,
      isBatterySaving: false,
      prefersReducedMotion: false,
      isMobile: false,
    };
  }

  const cpuCores = navigator.hardwareConcurrency || 4;
  const memoryGb = (navigator as any).deviceMemory || 4;
  const prefersReducedMotion = Boolean(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const isMobile = window.innerWidth <= 768 || Boolean(
    navigator.userAgent && /android|iphone|ipad|mobile/i.test(navigator.userAgent)
  );

  // Consider low-end if <= 4 CPU cores or <= 3GB RAM
  const isLowEndDevice = cpuCores <= 4 || memoryGb <= 3;

  _cachedProfile = {
    cpuCores,
    memoryGb,
    isLowEndDevice,
    isBatterySaving: false,
    prefersReducedMotion,
    isMobile,
  };

  return _cachedProfile;
}

/**
 * Apply hardware-lite optimizations when needed
 */
export function applyHardwareOptimizations(): void {
  if (typeof document === 'undefined') return;

  const profile = getDeviceHardwareProfile();
  const root = document.documentElement;

  if (profile.isLowEndDevice || profile.isBatterySaving || profile.prefersReducedMotion) {
    root.classList.add('hardware-lite');
  } else {
    root.classList.remove('hardware-lite');
  }
}

/**
 * Initialize Hardware Adaptive Engine & Tab Hibernation
 */
export function initHardwareAdaptiveEngine(): void {
  if (typeof window === 'undefined' || _isInitialized) return;
  _isInitialized = true;

  applyHardwareOptimizations();

  // 1. Battery Status Monitoring (if supported by browser)
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      const updateBatteryStatus = () => {
        const isLowBattery = battery.level <= 0.20 && !battery.charging;
        if (_cachedProfile) {
          _cachedProfile.isBatterySaving = isLowBattery;
        }
        applyHardwareOptimizations();
      };

      updateBatteryStatus();
      battery.addEventListener('levelchange', updateBatteryStatus);
      battery.addEventListener('chargingchange', updateBatteryStatus);
    }).catch(() => {});
  }

  // 2. Tab Hibernation: Freeze 100% of non-essential animations when tab is hidden
  document.addEventListener('visibilitychange', () => {
    const root = document.documentElement;
    if (document.hidden) {
      root.classList.add('tab-hibernating');
    } else {
      root.classList.remove('tab-hibernating');
    }
  });

  // 3. Dynamic Reduced Motion listener
  if (window.matchMedia) {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', (e) => {
      if (_cachedProfile) _cachedProfile.prefersReducedMotion = e.matches;
      applyHardwareOptimizations();
    });
  }
}
