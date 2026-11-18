/**
 * =========================================================================================
 * SUMR.DAY STUDIO OS — SMART CASH-FLOW PREDICTOR & DEBT RECOVERY RADAR
 * Versi: v1.0.0-predictive-financial-intelligence (C-Level Studio Advisory)
 * =========================================================================================
 * 
 * Melakukan peramalan arus kas masuk dan manajemen penagihan cerdas:
 * 1. 30-Day & 60-Day Inflow Forecasting (Estimasi kas masuk dari pipeline proyek & piutang)
 * 2. Aging Receivables Classifier (Pengelompokan piutang: Lancar, Perhatian, Kritis)
 * 3. Contextual Polite WhatsApp Payment Reminder Generator (Sopan, Personal & Formal)
 * 4. Profitability & Health Ratio Estimator
 */

import { storage } from './storage';

export interface AgingReceivableItem {
  id: string;
  invoiceNo: string;
  clientName: string;
  clientPhone: string;
  dueDate: string;
  daysAging: number;
  remainingAmount: number;
  statusCategory: 'current' | 'attention' | 'critical';
  projectTitle?: string;
}

export interface CashFlowForecast {
  currentCashIn: number;
  totalReceivables: number;
  predicted30DaysInflow: number;
  predicted60DaysInflow: number;
  agingReceivables: AgingReceivableItem[];
  highPriorityCount: number;
}

export const smartCashFlowPredictor = {
  /**
   * Menghitung peramalan arus kas masuk dan analisis umur piutang
   */
  async calculateForecast(): Promise<CashFlowForecast> {
    const [transactions, projects] = await Promise.all([
      storage.getItem<any[]>('porto_transactions', []),
      storage.getItem<any[]>('porto_projects', [])
    ]);

    let currentCashIn = 0;
    let totalReceivables = 0;
    const agingReceivables: AgingReceivableItem[] = [];

    const now = Date.now();

    (transactions || []).forEach(t => {
      const isDeleted = t.isDeleted || t.deleted || t.status === 'batal';
      if (isDeleted) return;

      const paid = Number(t.paid || t.downPayment || 0);
      const total = Number(t.total || 0);
      currentCashIn += paid;

      const remaining = Math.max(0, total - paid);
      if (remaining > 0 && (t.status === 'belum' || t.status === 'dp' || t.status === 'cicilan')) {
        totalReceivables += remaining;

        // Hitung umur piutang berdasarkan tanggal transaksi / invoice
        const trxDate = t.date || t.createdAt || t.timestamp;
        const trxTime = trxDate ? new Date(trxDate).getTime() : now;
        const daysAging = Math.max(0, Math.floor((now - trxTime) / (1000 * 60 * 60 * 24)));

        let statusCategory: 'current' | 'attention' | 'critical' = 'current';
        if (daysAging > 7) {
          statusCategory = 'critical';
        } else if (daysAging > 3) {
          statusCategory = 'attention';
        }

        const clientName = (t.customer && typeof t.customer === 'object' ? t.customer.name : t.customerName) || t.clientName || 'Klien';
        const clientPhone = (t.customer && typeof t.customer === 'object' ? (t.customer.phone || t.customer.whatsapp) : (t.customerPhone || t.customerContact)) || '';

        agingReceivables.push({
          id: t.id || `trx_${Math.random()}`,
          invoiceNo: t.invoiceNo || t.noNota || `INV-${String(t.id).slice(-4)}`,
          clientName,
          clientPhone,
          dueDate: t.dueDate || new Date(trxTime + 7 * 86400000).toLocaleDateString('id-ID'),
          daysAging,
          remainingAmount: remaining,
          statusCategory,
          projectTitle: t.projectTitle || (t.items && t.items[0] ? t.items[0].name : 'Layanan Studio')
        });
      }
    });

    // Urutkan umur piutang dari yang paling lama (kritis)
    agingReceivables.sort((a, b) => b.daysAging - a.daysAging);

    // Hitung estimasi kas masuk dari proyek yang sedang berjalan (In Progress / Review)
    let pendingProjectPipeline = 0;
    (projects || []).forEach(p => {
      if (p.status === 'in_progress' || p.status === 'review') {
        const budget = Number(p.budget || p.contractValue || 0);
        pendingProjectPipeline += budget;
      }
    });

    // Formula peramalan konservatif:
    // 30 hari = 75% dari piutang lancar & perhatian + 40% dari pipeline proyek aktif
    const currentAndAttentionDebt = agingReceivables
      .filter(r => r.statusCategory !== 'critical')
      .reduce((sum, r) => sum + r.remainingAmount, 0);

    const predicted30DaysInflow = Math.round((currentAndAttentionDebt * 0.75) + (pendingProjectPipeline * 0.45));
    const predicted60DaysInflow = Math.round(totalReceivables * 0.85 + pendingProjectPipeline * 0.80);

    return {
      currentCashIn,
      totalReceivables,
      predicted30DaysInflow,
      predicted60DaysInflow,
      agingReceivables,
      highPriorityCount: agingReceivables.filter(r => r.statusCategory === 'critical').length
    };
  },

  /**
   * Membuat draft pesan penagihan ramah & personal untuk WhatsApp Klien
   */
  generateWhatsAppReminder(item: AgingReceivableItem, brandName: string = 'sumr.day Studio', bankInfo?: string): string {
    const formattedAmount = `Rp ${item.remainingAmount.toLocaleString('id-ID')}`;
    
    if (item.statusCategory === 'critical') {
      // Penagihan formal sopan untuk tagihan > 7 hari
      return encodeURIComponent(
        `Halo Kak ${item.clientName}, salam hangat dari tim ${brandName}.\n\n` +
        `Semoga Kakak senantiasa sehat dan sukses. Melalui pesan ini kami ingin mengonfirmasikan status pembayaran untuk nota/invoice *${item.invoiceNo}* (${item.projectTitle || 'Layanan Studio'}) dengan sisa tagihan sebesar *${formattedAmount}* yang telah melewati batas tenggat tempo.\n\n` +
        `Mohon konfirmasi kesiapan transfer agar pencatatan pembukuan dan serah terima aset proyek Kakak berjalan lancar.\n\n` +
        (bankInfo ? `Rekening Pembayaran:\n${bankInfo}\n\n` : '') +
        `Apabila Kakak telah melakukan pembayaran, mohon abaikan pesan ini dan kirimkan bukti transfernya ya Kak. Terima kasih banyak atas kerja samanya! 🙏`
      );
    }

    // Pengingat santai & ramah (Soft Reminder 0 - 7 hari)
    return encodeURIComponent(
      `Halo Kak ${item.clientName}, selamat beraktivitas! Salam dari tim ${brandName}.\n\n` +
      `Sekadar menginfokan kembali bahwa invoice *${item.invoiceNo}* untuk pekerjaan *${item.projectTitle || 'Layanan Desain/Web'}* memiliki sisa tagihan sebesar *${formattedAmount}*.\n\n` +
      `Jika ada hal yang ingin didiskusikan terkait hasil pekerjaan atau skema pembayarannya, kami siap membantu ya Kak.\n\n` +
      `Terima kasih banyak atas kepercayaannya bersama ${brandName}! ✨`
    );
  }
};
