/**
 * Type-Safe Admin Event Definitions
 * Defines strong types for cross-module communication throughout the sumr.day ecosystem
 */

export interface QuickInvoicePayload {
  clientName?: string;
  clientPhone?: string;
  projectName?: string;
  amount?: number;
  notes?: string;
  category?: string;
  status?: 'paid' | 'pending' | 'down_payment' | 'quotation';
}

export interface QuickMemoPayload {
  title?: string;
  content?: string;
  tags?: string[];
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface QuickWhatsAppPayload {
  phone?: string;
  name?: string;
  message?: string;
  templateKey?: 'greeting' | 'invoice_reminder' | 'project_done' | 'meeting_invite';
}

export interface ConvertToProjectPayload {
  title: string;
  clientName: string;
  clientPhone?: string;
  budget?: number;
  description?: string;
  deadline?: string;
  source?: 'chat' | 'inquiry' | 'memo' | 'booking';
}

export type AdminDrawerType = 'memo' | 'calculator' | 'invoice' | 'whatsapp' | 'health' | 'ecohub';

export interface AdminCustomEvents {
  'porto_open_quick_drawer': { type: AdminDrawerType; payload?: any };
  'porto_close_quick_drawer': void;
  'porto_quick_invoice_draft': QuickInvoicePayload;
  'porto_quick_memo_draft': QuickMemoPayload;
  'porto_quick_wa_send': QuickWhatsAppPayload;
  'porto_convert_to_project': ConvertToProjectPayload;
}
