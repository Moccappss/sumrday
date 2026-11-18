/**
 * ══════════════════════════════════════════════════════════════════════
 * SMART WHATSAPP CONTEXTUAL ROUTER
 * Generates conversion-optimized WhatsApp deep-links prefilled with
 * exact product, portfolio, or quotation context for instant closing.
 * ══════════════════════════════════════════════════════════════════════
 */

export interface WhatsAppContext {
  type: 'portfolio' | 'product' | 'quotation' | 'general' | 'service';
  title?: string;
  category?: string;
  price?: number | string;
  clientName?: string;
  features?: string[];
  notes?: string;
  customMessage?: string;
}

/**
 * Normalizes an Indonesian phone number to international 62 format
 */
export function normalizeWhatsAppNumber(rawPhone: string = '6281234567890'): string {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '6281234567890';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return '62' + digits;
}

/**
 * Formats a number to Indonesian Rupiah (e.g. Rp 750.000)
 */
export function formatRupiah(amount: number | string = 0): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9]/g, ''));
  if (isNaN(num) || num <= 0) return 'Konsultasi';
  return 'Rp ' + num.toLocaleString('id-ID');
}

/**
 * Builds a contextual, high-converting WhatsApp URL
 */
export function buildSmartWhatsAppUrl(
  phoneNumber: string = '6281234567890',
  context: WhatsAppContext = { type: 'general' }
): string {
  const normalizedPhone = normalizeWhatsAppNumber(phoneNumber);

  if (context.customMessage) {
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(context.customMessage)}`;
  }

  const nameGreeting = context.clientName ? `Halo sumr.day, saya *${context.clientName}*.` : 'Halo sumr.day!';
  let messageLines: string[] = [];

  switch (context.type) {
    case 'portfolio':
      messageLines = [
        nameGreeting,
        '',
        `Saya melihat karya portofolio *${context.title || 'Desain Digital'}* di website sumr.day.`,
        'Bisa diskusi estimasi biaya dan timeline pengerjaan untuk proyek serupa?',
        '',
        `Referensi: https://sumrday.web.app/portfolio`,
        'Terima kasih! ✨'
      ];
      break;

    case 'product':
      messageLines = [
        nameGreeting,
        '',
        `Saya tertarik memesan layanan *${context.title || 'Layanan Studio'}*`,
        context.category ? `Kategori: _${context.category}_` : '',
        context.price ? `Estimasi Biaya: *${formatRupiah(context.price)}*` : '',
        '',
        'Apakah slot pengerjaan minggu ini masih tersedia?',
        'Terima kasih!'
      ].filter(Boolean);
      break;

    case 'quotation':
      messageLines = [
        nameGreeting,
        '',
        'Saya sudah menghitung estimasi biaya via *Project Calculator* di website:',
        context.title ? `Paket / Layanan: *${context.title}*` : '',
        context.features && context.features.length > 0 ? `Fitur Pilihan:\n• ${context.features.join('\n• ')}` : '',
        context.price ? `Total Estimasi: *${formatRupiah(context.price)}*` : '',
        '',
        'Mohon konfirmasi ketersediaan jadwal dan langkah selanjutnya.',
        'Terima kasih! ☀️'
      ].filter(Boolean);
      break;

    default:
      messageLines = [
        nameGreeting,
        '',
        'Saya ingin konsultasi mengenai pembuatan kebutuhan digital studio (Landing page / Undangan Web / Desain Aset).',
        context.notes ? `Catatan kebutuhan: _${context.notes}_` : '',
        '',
        'Kira-kira kapan waktu yang tepat untuk berdiskusi?',
        'Terima kasih!'
      ].filter(Boolean);
      break;
  }

  const finalMessage = messageLines.join('\n');
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(finalMessage)}`;
}

/**
 * Tracks a WhatsApp closing conversion event and opens WhatsApp in a new tab.
 * Records the lead acquisition source into local analytics without blocking navigation.
 */
export function openSmartWhatsApp(
  phoneNumber: string = '6281234567890',
  context: WhatsAppContext = { type: 'general' },
  sourceTag: string = 'direct'
): void {
  if (typeof window === 'undefined') return;

  const url = buildSmartWhatsAppUrl(phoneNumber, context);

  // Dispatch global custom event for live analytics telemetry
  try {
    window.dispatchEvent(new CustomEvent('porto_wa_conversion', {
      detail: {
        type: context.type,
        title: context.title || 'General Consultation',
        sourceTag,
        timestamp: Date.now()
      }
    }));
  } catch {}

  // Open WhatsApp in new tab safely
  window.open(url, '_blank', 'noopener,noreferrer');
}
