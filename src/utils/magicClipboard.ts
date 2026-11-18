/**
 * ══════════════════════════════════════════════════════════════════════
 * MAGIC CLIPBOARD EVENT LISTENER (SUMR.DAY OS)
 * Captures global Ctrl+V / Cmd+V paste events anywhere on dashboard.
 * Automatically classifies pasted items into Images, Links, or Notes.
 * ══════════════════════════════════════════════════════════════════════
 */
import { soundEffects } from './soundEffects';

export interface MagicPastedItem {
  type: 'image' | 'url' | 'text';
  data: any;
  sourceUrl?: string;
  timestamp: number;
}

class MagicClipboardEngine {
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.addEventListener('paste', this.handleGlobalPaste.bind(this));
  }

  public destroy() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('paste', this.handleGlobalPaste.bind(this));
    this.isInitialized = false;
  }

  private async handleGlobalPaste(e: ClipboardEvent) {
    // If the active element is an input, textarea or contenteditable, allow normal text paste
    const activeEl = document.activeElement;
    const isEditingText = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl as HTMLElement).isContentEditable
    );

    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    // Check for image files in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          soundEffects.play('pop');

          try {
            // Upload to Cloudinary directly in background (lazy-loaded to keep entry bundle lean)
            const { uploadToCloudinary } = await import('./cloudinary');
            const res = await uploadToCloudinary(file);
            if (res && res.url) {
              soundEffects.play('success');
              const pastedPayload: MagicPastedItem = {
                type: 'image',
                data: res,
                sourceUrl: res.url,
                timestamp: Date.now()
              };

              window.dispatchEvent(new CustomEvent('sumr_magic_pasted', { detail: pastedPayload }));
            }
          } catch (err) {
            soundEffects.play('error');
            console.error('Magic clipboard image upload error:', err);
          }
          return;
        }
      }
    }

    // Only process text if not actively typing in an input
    if (!isEditingText) {
      const text = e.clipboardData?.getData('text/plain')?.trim();
      if (text) {
        if (/^https?:\/\//i.test(text)) {
          soundEffects.play('pop');
          const pastedPayload: MagicPastedItem = {
            type: 'url',
            data: text,
            sourceUrl: text,
            timestamp: Date.now()
          };
          window.dispatchEvent(new CustomEvent('sumr_magic_pasted', { detail: pastedPayload }));
        }
      }
    }
  }
}

export const magicClipboard = new MagicClipboardEngine();

