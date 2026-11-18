import type { 
  AdminDrawerType, 
  QuickInvoicePayload, 
  QuickMemoPayload, 
  QuickWhatsAppPayload, 
  ConvertToProjectPayload 
} from '../types/adminEvents';

/**
 * Type-Safe Admin Event Dispatchers
 */
export const adminEventBus = {
  /**
   * Open the Multitasking Quick Action Drawer
   */
  openDrawer: (type: AdminDrawerType, payload?: any) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('porto_open_quick_drawer', { detail: { type, payload } }));
  },

  /**
   * Close the Multitasking Quick Action Drawer
   */
  closeDrawer: () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('porto_close_quick_drawer'));
  },

  /**
   * Trigger Quick Invoice Draft with prefilled data
   */
  draftQuickInvoice: (payload: QuickInvoicePayload) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('porto_open_quick_drawer', { detail: { type: 'invoice', payload } }));
    window.dispatchEvent(new CustomEvent('porto_quick_invoice_draft', { detail: payload }));
  },

  /**
   * Trigger Quick Memo with prefilled data
   */
  draftQuickMemo: (payload: QuickMemoPayload) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('porto_open_quick_drawer', { detail: { type: 'memo', payload } }));
    window.dispatchEvent(new CustomEvent('porto_quick_memo_draft', { detail: payload }));
  },

  /**
   * Open WhatsApp Quick Launcher with prefilled contact and template
   */
  sendWhatsApp: (payload: QuickWhatsAppPayload) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('porto_open_quick_drawer', { detail: { type: 'whatsapp', payload } }));
    window.dispatchEvent(new CustomEvent('porto_quick_wa_send', { detail: payload }));
  },

  /**
   * Convert an inquiry/chat/memo into a Kanban project
   */
  convertToProject: (payload: ConvertToProjectPayload) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('porto_convert_to_project', { detail: payload }));
  }
};
