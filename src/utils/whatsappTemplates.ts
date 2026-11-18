/**
 * WhatsApp Smart Template Dispatcher
 * Menyusun pesan WhatsApp profesional berformat rapi untuk berbagai skenario studio sumr.day
 */

export interface WaTemplateOptions {
  clientName: string;
  clientPhone?: string;
  orderId?: string;
  projectName?: string;
  amount?: number;
  remainingAmount?: number;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  dropUrl?: string;
  proofingUrl?: string;
  refNumber?: string;
}

export const cleanPhoneForWa = (phone?: string): string => {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
};

export const openWhatsApp = (phone: string, text: string) => {
  const cleanPhone = cleanPhoneForWa(phone);
  const encoded = encodeURIComponent(text);
  const url = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encoded}` 
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const formatRp = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);
};

export const whatsappTemplates = {
  // 1. Tagihan / Invoice & Instruksi Transfer
  invoiceOrder: (opts: WaTemplateOptions) => {
    return `*INVOICE PEMESANAN - SUMR.DAY STUDIO*
Kpd Yth. ${opts.clientName}

Rincian tagihan pemesanan Anda:
• No. Pesanan: #${opts.orderId || 'ORD-NEW'}
• Layanan: ${opts.projectName || 'Proyek Desain Studio'}
• Total: *${formatRp(opts.amount || 0)}*

Informasi Pembayaran:
• Bank: ${opts.bankName || 'BCA / Mandiri'}
• Rekening: ${opts.accountNumber || '123-456-7890'}
• Atas Nama: ${opts.accountHolder || 'sumr.day Creative Studio'}

Unggah bukti transfer pada portal akun Anda atau kirimkan via percakapan ini. Pesanan segera diproses setelah konfirmasi diterima.`;
  },

  // 2. Permintaan Bahan Mentah / Client Drop-Box Link
  requestAssetDrop: (opts: WaTemplateOptions) => {
    const dropLink = opts.dropUrl || `${window.location.origin}/drop/${opts.orderId || ''}`;
    return `*PERMINTAAN MATERI PROYEK - SUMR.DAY STUDIO*
Kpd Yth. ${opts.clientName}

Untuk pengerjaan proyek *${opts.projectName || 'Desain'}* (#${opts.orderId || 'ORD'}), silakan unggah materi dan berkas mentah (logo, aset, foto resolusi tinggi, brief) melalui portal berikut:

• Tautan Drop-Box: ${dropLink}

Berkas langsung terhubung secara aman ke direktori proyek studio.`;
  },

  // 3. Notifikasi Desain Siap Ditinjau (Proofing Canvas)
  proofingReady: (opts: WaTemplateOptions) => {
    const proofLink = opts.proofingUrl || `${window.location.origin}/client/account?tab=tracker`;
    return `*PRATINJAU DESAIN SIAP - SUMR.DAY STUDIO*
Kpd Yth. ${opts.clientName}

Pratinjau hasil desain proyek *${opts.projectName || 'Desain Studio'}* (#${opts.orderId || 'ORD'}) telah tersedia.

Tinjau hasil desain dan berikan catatan perbaikan interaktif melalui tautan:
• Tautan Review & Persetujuan: ${proofLink}

Dokumen persetujuan (BAST digital) dapat ditandatangani langsung pada halaman tersebut.`;
  },

  // 4. Pengingat Sisa Pembayaran (Term of Payment / Pelunasan)
  paymentReminder: (opts: WaTemplateOptions) => {
    return `*PENGINGAT PELUNASAN - SUMR.DAY STUDIO*
Kpd Yth. ${opts.clientName}

Pemberitahuan penyelesaian pengerjaan proyek *${opts.projectName || 'Desain Studio'}* (#${opts.orderId || 'ORD'}).

• Sisa Tagihan: *${formatRp(opts.remainingAmount || 0)}*
• Rekening Tujuan: ${opts.bankName || 'BCA'} - ${opts.accountNumber || '123-456-7890'} (a.n ${opts.accountHolder || 'sumr.day'})

Setelah pelunasan terverifikasi, seluruh master berkas cetak resolusi tinggi siap diunduh melalui portal akun Anda.`;
  },

  // 5. Bukti Transfer Penarikan Saldo Komisi Mitra / Reseller
  commissionPaid: (opts: WaTemplateOptions) => {
    return `*KONFIRMASI PENCAIRAN KOMISI - SUMR.DAY STUDIO*
Kpd Yth. ${opts.clientName}

Permintaan pencairan komisi kemitraan Anda telah ditransfer:

• Nominal: *${formatRp(opts.amount || 0)}*
• Tujuan: ${opts.bankName || 'Rekening'} (${opts.accountNumber || '-'}) a.n ${opts.accountHolder || opts.clientName}
• Ref. Transfer: ${opts.refNumber || `TRF-${Date.now().toString().slice(-6)}`}

Terima kasih atas kerja sama kemitraan bersama sumr.day studio.`;
  },

  // 6. Diskusi / Follow-up Brief Request via WhatsApp (Opsi Penjelasan via WA)
  serviceBriefDiscussion: (opts: WaTemplateOptions & { briefSummary?: string; googleDocUrl?: string }) => {
    let briefSection = '';
    if (opts.googleDocUrl) {
      briefSection = `\n• Dokumen Brief Acuan: ${opts.googleDocUrl}`;
    }
    if (opts.briefSummary) {
      briefSection += `\n• Catatan Singkat: ${opts.briefSummary}`;
    }
    return `*DISKUSI BRIEF & SPESIFIKASI JASA - SUMR.DAY STUDIO*
Halo Kak ${opts.clientName},

Terima kasih atas pemesanan jasa custom *${opts.projectName || 'Proyek Desain/Jasa'}* (#${opts.orderId || 'ORD'}).${briefSection}

Sesuai instruksi Anda untuk koordinasi via WhatsApp, mari kita diskusikan rincian brief, konsep visual, referensi yang disukai, dan target pengerjaannya di chat ini.

Silakan kirimkan referensi, materi, atau pertanyaan yang ingin disampaikan ya Kak. Salam kreatif!`;
  },

  // 7. Notifikasi Pesanan Jasa Di-ACC & Masuk Pengerjaan Proyek
  serviceOrderAccApproved: (opts: WaTemplateOptions & { deadline?: string; dpPaid?: number }) => {
    return `*PESANAN DISETUJUI & MASUK JADWAL - SUMR.DAY STUDIO*
Halo Kak ${opts.clientName},

Kabar baik! Pesanan jasa custom *${opts.projectName || 'Proyek Studio'}* (#${opts.orderId || 'ORD'}) telah kami *ACC & DISETUJUI*.

Rincian Jadwal & Status:
• Status: Disetujui & Masuk Antrean Pengerjaan Studio
${opts.deadline ? `• Target Selesai / Deadline: *${opts.deadline}*\n` : ''}${opts.dpPaid ? `• DP Terverifikasi: *${formatRp(opts.dpPaid)}*\n` : ''}
Tim kami mulai mempersiapkan pengerjaan proyek Anda. Kami akan memberikan update berkala terkait progresnya. Terima kasih atas kepercayaannya!`;
  },

  // 8. Kirim Creative Inquiry & Brief Proyek dari Klien ke Studio
  studioCreativeInquiry: (opts: {
    clientName: string;
    brandName?: string;
    serviceType: string;
    inquiryId: string;
    goals?: string;
    budgetRange?: string;
    deadline?: string;
    referenceUrl?: string;
  }) => {
    return `*KONSULTASI BRIEF PROYEK - SUMR.DAY STUDIO*
Halo Tim Studio sumr.day! Saya ingin berkonsultasi mengenai proyek desain:

• No. Inquiry: #${opts.inquiryId}
• Nama Klien: ${opts.clientName}
${opts.brandName ? `• Nama Brand / Usaha: *${opts.brandName}*\n` : ''}• Layanan: *${opts.serviceType}*
${opts.budgetRange ? `• Perkiraan Budget: ${opts.budgetRange}\n` : ''}${opts.deadline ? `• Target Selesai: ${opts.deadline}\n` : ''}${opts.referenceUrl ? `• Referensi / Moodboard: ${opts.referenceUrl}\n` : ''}${opts.goals ? `\n*Visi & Kebutuhan Proyek:*\n"${opts.goals}"\n` : ''}
Mohon arahannya untuk tahapan selanjutnya. Terima kasih!`;
  },

  // 9. Laporan Kemajuan Proyek Cerdas (Smart Sprint Progress Update)
  projectSprintUpdate: (opts: {
    clientName: string;
    projectName: string;
    progressPercent: number;
    completedTasksCount: number;
    totalTasksCount: number;
    nextMilestone?: string;
    estCompletion?: string;
  }) => {
    return `*LAPORAN KEMAJUAN PROYEK - SUMR.DAY STUDIO*
Kpd Yth. ${opts.clientName}

Berikut pembaruan pengerjaan proyek *${opts.projectName}*:
• Progres Saat Ini: *${opts.progressPercent}%*
• Checklist Tugas: ${opts.completedTasksCount} dari ${opts.totalTasksCount} tuntas
• Tahap Selanjutnya: ${opts.nextMilestone || 'Penyelesaian & Quality Check'}
${opts.estCompletion ? `• Target Selesai: ${opts.estCompletion}\n` : ''}
Tim studio terus memantau kualitas pengerjaan agar sesuai standar brand Anda. Terima kasih atas kerja samanya!`;
  }
};
