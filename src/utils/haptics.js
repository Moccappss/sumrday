/**
 * Haptic feedback utility using the HTML5 Vibration API.
 * Provides subtle physical tap sensations on supported mobile devices.
 * Supports both haptic('light') and haptic.light() styles.
 */

function triggerHaptic(type = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;

  try {
    switch (type) {
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'success':
        navigator.vibrate([10, 40, 10]);
        break;
      case 'warning':
      case 'error':
        navigator.vibrate([20, 50, 20, 50, 40]);
        break;
      case 'selection':
        navigator.vibrate(8);
        break;
      case 'light':
      default:
        navigator.vibrate(12);
        break;
    }
  } catch {
    // Vibration API not permitted or unsupported on device
  }
}

export const haptic = Object.assign(triggerHaptic, {
  isSupported() {
    return typeof navigator !== 'undefined' && 
           typeof navigator.vibrate === 'function' && 
           (!navigator.userActivation || navigator.userActivation.hasBeenActive);
  },
  light() { triggerHaptic('light'); },
  medium() { triggerHaptic('medium'); },
  success() { triggerHaptic('success'); },
  warning() { triggerHaptic('warning'); },
  error() { triggerHaptic('error'); },
  selection() { triggerHaptic('selection'); }
});

export default haptic;
