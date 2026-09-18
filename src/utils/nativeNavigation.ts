import { useEffect, useRef } from 'react';

/**
 * Native Navigation & Modal Back-Stack Manager
 * 
 * Provides native software/mobile app feel by intercepting physical back buttons,
 * swipe-to-go-back gestures, and browser history popstate events.
 * 
 * When a modal, drawer, or sub-step is active, pressing "Back" closes the top-most
 * item (1 step back) without leaving the current view or jumping pages.
 */

interface ModalStackItem {
  id: string;
  onClose: () => void;
  priority?: number;
}

// Global LIFO stack for open modals and sub-views
const modalStack: ModalStackItem[] = [];
let isPopstateListenerAttached = false;
let isExecutingBack = false;

const initPopstateListener = () => {
  if (typeof window === 'undefined' || isPopstateListenerAttached) return;
  
  window.addEventListener('popstate', () => {
    if (modalStack.length > 0) {
      // Pop the topmost modal
      const top = modalStack.pop();
      if (top && typeof top.onClose === 'function') {
        isExecutingBack = true;
        try {
          top.onClose();
        } finally {
          setTimeout(() => {
            isExecutingBack = false;
          }, 50);
        }
      }
    }
  });

  isPopstateListenerAttached = true;
};

/**
 * Programmatically trigger the topmost back action (1-step back)
 * Returns true if an action was handled, false if the stack is empty.
 */
export const triggerNativeBack = (): boolean => {
  if (modalStack.length > 0) {
    const top = modalStack.pop();
    if (top && typeof top.onClose === 'function') {
      isExecutingBack = true;
      try {
        top.onClose();
        return true;
      } catch (e) {
        console.error('Error executing native back step:', e);
        return true;
      } finally {
        setTimeout(() => {
          isExecutingBack = false;
        }, 50);
      }
    }
  }
  return false;
};

export const hasActiveModal = (): boolean => {
  return modalStack.length > 0;
};

/**
 * Push a modal or subview handler onto the back-button stack
 */
export const pushModalBackHandler = (id: string, onClose: () => void, priority = 0) => {
  if (typeof window === 'undefined') return;
  initPopstateListener();

  // Remove existing with same id if already present
  const existingIdx = modalStack.findIndex(item => item.id === id);
  if (existingIdx !== -1) {
    modalStack.splice(existingIdx, 1);
  }

  modalStack.push({ id, onClose, priority });

  // Push history state entry so the browser back button triggers popstate instead of leaving
  try {
    if (!window.history.state || window.history.state.agenzeModal !== id) {
      window.history.pushState({ ...window.history.state, agenzeModal: id, timestamp: Date.now() }, '');
    }
  } catch {
    // Ignore pushState errors
  }
};

/**
 * Remove a modal from the back stack when closed by user action (e.g. clicking 'X' or backdrop)
 */
export const removeModalBackHandler = (id: string, triggerHistoryBack = false) => {
  if (typeof window === 'undefined') return;

  const idx = modalStack.findIndex(item => item.id === id);
  if (idx !== -1) {
    modalStack.splice(idx, 1);
  }

  // If closed by explicit user interaction and NOT from a popstate event, pop the corresponding history entry
  if (triggerHistoryBack && !isExecutingBack) {
    try {
      if (window.history.state && window.history.state.agenzeModal === id) {
        window.history.back();
      }
    } catch {
      // Ignore history.back errors
    }
  }
};

/**
 * React Hook to easily integrate any modal/drawer/sheet with native back button behavior
 */
export const useNativeBackHandler = (
  isOpen: boolean,
  onClose: () => void,
  modalId?: string,
  priority = 0
) => {
  const idRef = useRef<string>(modalId || `modal_${Math.random().toString(36).substring(2, 9)}`);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = idRef.current;
    if (isOpen) {
      pushModalBackHandler(id, () => {
        if (onCloseRef.current) onCloseRef.current();
      }, priority);

      return () => {
        // MUST NEVER trigger history.back() on cleanup to prevent auto-close cascade loops
        removeModalBackHandler(id, false);
      };
    } else {
      removeModalBackHandler(id, false);
    }
  }, [isOpen, priority]);
};

export default useNativeBackHandler;
