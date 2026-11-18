/**
 * =========================================================================================
 * STUDIO LIFECYCLE BRIDGE: 4-WAY SEAMLESS INTERCONNECTION
 * sumr.day OS & PORTO 2026 CMS
 * =========================================================================================
 * 
 * Menghubungkan secara dinamis dan otomatis 4 pilar inti agensi:
 * 1. 🛍️ SHOP (Katalog Layanan & Produk)
 * 2. 💰 TRANSAKSI (Billing, PPN, DP/Pelunasan, Bukti TF)
 * 3. 🎯 MANAJEMEN PROYEK (Kanban, Milestone, Production)
 * 4. 🌟 PORTOFOLIO (Showcase Hasil Karya Publik)
 */

import { storage } from './storage';
import { addNotification } from './notifications';

export interface StudioConnectionStatus {
  hasTransaction: boolean;
  hasProject: boolean;
  hasPortfolio: boolean;
  hasCatalogItem: boolean;
}

/**
 * 1. TRANSAKSI ⟷ PROYEK:
 * Sinkronisasi instan saat status pembayaran berubah di Transaksi.
 * Otomatis memajukan milestone dan membuka proyek dari 'pending_acc' menjadi aktif.
 */
export async function syncPaymentToProject(
  transactionId: string,
  paymentStatus: 'belum' | 'dp' | 'lunas' | 'quotation' | 'perlu_verifikasi',
  extraData: { dpAmount?: number; remainingAmount?: number; proofUrl?: string } = {}
): Promise<boolean> {
  try {
    const projects = await storage.getItem<any[]>('porto_projects', []);
    if (!Array.isArray(projects)) return false;

    const projIdx = projects.findIndex(p => p.transactionId === transactionId || p.id === transactionId);
    if (projIdx === -1) return false;

    const project = { ...projects[projIdx] };
    const now = new Date().toISOString();

    project.paymentStatus = paymentStatus;
    if (extraData.dpAmount !== undefined) project.dpAmount = extraData.dpAmount;
    if (extraData.remainingAmount !== undefined) project.remainingAmount = extraData.remainingAmount;
    if (extraData.proofUrl) project.paymentProofUrl = extraData.proofUrl;

    // Jika pembayaran DP atau Lunas masuk, dan proyek tadinya pending ACC -> auto-advance
    if ((paymentStatus === 'dp' || paymentStatus === 'lunas') && project.status === 'pending_acc') {
      project.status = 'todo';
      project.isApproved = true;
      project.approvedAt = now;
      if (!project.activity) project.activity = [];
      project.activity.unshift({
        id: Date.now(),
        time: now,
        message: `Pembayaran ${paymentStatus.toUpperCase()} terverifikasi dari modul Transaksi — Proyek resmi dibuka ke Papan Kanban.`
      });
    }

    projects[projIdx] = project;
    await storage.setItem('porto_projects', projects, true);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porto_project_synced', { detail: { project } }));
    }

    return true;
  } catch (err) {
    console.error('[StudioBridge] syncPaymentToProject error:', err);
    return false;
  }
}

/**
 * 2. PROYEK ⟷ TRANSAKSI:
 * Sinkronisasi instan saat proyek selesai (status 'done' atau 100%).
 * Menandai transaksi terkait siap penagihan pelunasan (Final Invoicing).
 */
export async function syncProjectCompletionToTransaction(
  projectId: string,
  deliverableData: { previewUrl?: string; driveUrl?: string; notes?: string } = {}
): Promise<boolean> {
  try {
    const transactions = await storage.getItem<any[]>('porto_transactions', []);
    if (!Array.isArray(transactions)) return false;

    const trxIdx = transactions.findIndex(t => t.projectId === projectId || t.id === projectId);
    if (trxIdx === -1) return false;

    const trx = { ...transactions[trxIdx] };
    const now = new Date().toISOString();

    trx.milestoneStep = 5; // Selesai
    trx.projectStatus = 'done';
    trx.completedAt = now;
    if (deliverableData.previewUrl) trx.previewUrl = deliverableData.previewUrl;
    if (deliverableData.driveUrl) trx.driveUrl = deliverableData.driveUrl;

    // Jika masih ada sisa pembayaran yang belum lunas
    if (trx.paymentStatus === 'dp' || (trx.remaining && trx.remaining > 0)) {
      trx.readyForFinalBilling = true;
      addNotification({
        title: `Proyek #${projectId} Selesai!`,
        message: `Proyek selesai dikerjakan. Sisa tagihan Rp ${Number(trx.remaining || 0).toLocaleString('id-ID')} siap ditagihkan ke klien ${trx.customer?.name || ''}.`,
        type: 'warning'
      });
    } else {
      addNotification({
        title: `Proyek #${projectId} Selesai & Lunas!`,
        message: `Karya siap diserahterimakan dan diterbitkan ke portofolio.`,
        type: 'success'
      });
    }

    transactions[trxIdx] = trx;
    await storage.setItem('porto_transactions', transactions, true);
    return true;
  } catch (err) {
    console.error('[StudioBridge] syncProjectCompletionToTransaction error:', err);
    return false;
  }
}

/**
 * 3. PROYEK ➔ PORTOFOLIO:
 * 1-Click Konversi karya proyek agensi yang sudah selesai menjadi Studi Kasus Portofolio Publik.
 */
export async function convertProjectToPortfolio(project: any): Promise<{ success: boolean; portfolioItem?: any }> {
  try {
    const portfolio = await storage.getItem<any[]>('porto_portfolio', []);
    const safePortfolio = Array.isArray(portfolio) ? [...portfolio] : [];

    const existingIdx = safePortfolio.findIndex(p => p.sourceProjectId === project.id);
    const nowYear = new Date().getFullYear().toString();

    const portfolioItem = {
      id: existingIdx !== -1 ? safePortfolio[existingIdx].id : `PORT-${Date.now().toString(36).toUpperCase()}`,
      title: project.title || project.name || 'Studi Kasus Proyek',
      name: project.title || project.name || 'Studi Kasus Proyek',
      client: project.client || project.clientName || 'Klien Agensi',
      category: project.category || 'Website & Digital',
      year: project.year || nowYear,
      description: project.description || project.briefDescription || 'Hasil karya kolaborasi studio bersama klien.',
      coverImage: project.coverImage || project.previewUrl || project.screenshotUrl || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      images: project.images || (project.previewUrl ? [project.previewUrl] : []),
      tags: project.tags || [project.category || 'Digital', 'Creative Studio'],
      tools: project.tools || ['Figma', 'React', 'TailwindCSS'],
      sourceProjectId: project.id,
      linkedTransactionId: project.transactionId || null,
      featured: false,
      createdAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      safePortfolio[existingIdx] = { ...safePortfolio[existingIdx], ...portfolioItem };
    } else {
      safePortfolio.unshift(portfolioItem);
    }

    await storage.setItem('porto_portfolio', safePortfolio, true);

    addNotification({
      title: '🚀 Berhasil Diterbitkan ke Portofolio!',
      message: `Karya "${portfolioItem.title}" kini telah tersimpan di Portofolio Studio dan siap ditampilkan ke calon klien.`,
      type: 'success'
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porto_portfolio_updated', { detail: { portfolioItem } }));
    }

    return { success: true, portfolioItem };
  } catch (err) {
    console.error('[StudioBridge] convertProjectToPortfolio error:', err);
    return { success: false };
  }
}

/**
 * 4. SHOP (Katalog) ⟷ PORTOFOLIO:
 * Mengambil studi kasus portofolio yang relevan untuk suatu produk/layanan katalog.
 */
export async function getRelatedPortfolioForProduct(category: string, productName?: string): Promise<any[]> {
  try {
    const portfolio = await storage.getItem<any[]>('porto_portfolio', []);
    if (!Array.isArray(portfolio)) return [];

    const targetCat = (category || '').toLowerCase().trim();
    const targetName = (productName || '').toLowerCase().trim();

    return portfolio.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pTitle = (p.title || p.name || '').toLowerCase();
      const matchCat = targetCat && (pCat.includes(targetCat) || targetCat.includes(pCat));
      const matchName = targetName && (pTitle.includes(targetName) || targetName.includes(pTitle));
      return matchCat || matchName;
    }).slice(0, 4);
  } catch {
    return [];
  }
}

/**
 * 5. CLIENT 360-DEGREE RADAR:
 * Mengumpulkan seluruh jejak klien (Order Shop, Tagihan Finansial, Proyek Aktif & Portofolio).
 */
export async function getClient360Overview(clientEmailOrPhone: string): Promise<{
  transactions: any[];
  projects: any[];
  totalSpent: number;
  unpaidTotal: number;
  activeProjectsCount: number;
}> {
  const cleanQ = (clientEmailOrPhone || '').toLowerCase().trim();
  const digits = cleanQ.replace(/\D/g, '');

  const [transactions, projects] = await Promise.all([
    storage.getItem<any[]>('porto_transactions', []),
    storage.getItem<any[]>('porto_projects', [])
  ]);

  const matchedTrxs = (Array.isArray(transactions) ? transactions : []).filter(t => {
    const email = (t.customer?.email || t.clientEmail || '').toLowerCase();
    const phone = (t.customer?.phone || t.clientPhone || '').replace(/\D/g, '');
    return (email && email.includes(cleanQ)) || (digits.length >= 4 && phone.includes(digits));
  });

  const matchedProjects = (Array.isArray(projects) ? projects : []).filter(p => {
    const email = (p.clientEmail || p.customerEmail || '').toLowerCase();
    const phone = (p.clientPhone || p.customerPhone || '').replace(/\D/g, '');
    return (email && email.includes(cleanQ)) || (digits.length >= 4 && phone.includes(digits));
  });

  let totalSpent = 0;
  let unpaidTotal = 0;

  matchedTrxs.forEach(t => {
    if (t.paymentStatus === 'lunas') {
      totalSpent += Number(t.grandTotal || 0);
    } else if (t.paymentStatus === 'dp') {
      totalSpent += Number(t.dpAmount || 0);
      unpaidTotal += Number(t.remaining || 0);
    } else {
      unpaidTotal += Number(t.grandTotal || 0);
    }
  });

  const activeProjectsCount = matchedProjects.filter(p => p.status !== 'done' && p.status !== 'completed' && p.status !== 'trash').length;

  return {
    transactions: matchedTrxs,
    projects: matchedProjects,
    totalSpent,
    unpaidTotal,
    activeProjectsCount
  };
}

/**
 * 6. PROOFING CANVAS ➔ PROYEK & TRANSAKSI:
 * Menangani persetujuan (ACC) hasil desain langsung dari kanvas review klien.
 * Mengubah status proyek menjadi selesai dan memicu invoice pelunasan di modul Keuangan.
 */
export async function syncProofingApprovalToLifecycle(
  projectId: string,
  proofData: { signerName?: string; note?: string; approvedAt?: string } = {}
): Promise<boolean> {
  try {
    const projects = await storage.getItem<any[]>('porto_projects', []);
    if (!Array.isArray(projects)) return false;

    const projIdx = projects.findIndex(p => p.id === projectId);
    if (projIdx === -1) return false;

    const project = { ...projects[projIdx] };
    const now = proofData.approvedAt || new Date().toISOString();

    project.status = 'done';
    project.isApproved = true;
    project.approvedAt = now;
    project.proofingSignOff = {
      approved: true,
      approvedAt: now,
      signerName: proofData.signerName || project.client || 'Klien',
      note: proofData.note || 'Desain disetujui tanpa catatan lanjutan.'
    };

    if (!project.activity) project.activity = [];
    project.activity.unshift({
      id: Date.now(),
      time: now,
      message: `✨ Persetujuan resmi (ACC) diterima dari ${project.proofingSignOff.signerName} melalui Proofing Canvas.`
    });

    projects[projIdx] = project;
    await storage.setItem('porto_projects', projects, true);

    // Otomatis sinkronkan ke modul transaksi & notifikasi pelunasan
    await syncProjectCompletionToTransaction(projectId, { notes: `Proofing ACC oleh ${project.proofingSignOff.signerName}` });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: projects }));
      window.dispatchEvent(new CustomEvent('porto_project_synced', { detail: { project } }));
    }

    return true;
  } catch (err) {
    console.error('[StudioBridge] syncProofingApprovalToLifecycle error:', err);
    return false;
  }
}

/**
 * 7. SPK KONTRAK ➔ PROYEK & TRANSAKSI:
 * Menghubungkan nomor surat perjanjian kerja legal ke kartu proyek dan invoice penagihan.
 */
export async function syncContractSpkToProjectAndTransaction(
  projectId: string,
  contract: { id: string; title: string; contractNumber?: string; termsUrl?: string }
): Promise<boolean> {
  try {
    const projects = await storage.getItem<any[]>('porto_projects', []);
    if (Array.isArray(projects)) {
      const idx = projects.findIndex(p => p.id === projectId);
      if (idx !== -1) {
        projects[idx].contractId = contract.id;
        projects[idx].contractNumber = contract.contractNumber || contract.id;
        projects[idx].hasContract = true;
        projects[idx].updatedAt = new Date().toISOString();
        await storage.setItem('porto_projects', projects, true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: projects }));
        }
      }
    }

    const transactions = await storage.getItem<any[]>('porto_transactions', []);
    if (Array.isArray(transactions)) {
      const tIdx = transactions.findIndex(t => t.projectId === projectId || t.id === projectId);
      if (tIdx !== -1) {
        transactions[tIdx].contractNumber = contract.contractNumber || contract.id;
        transactions[tIdx].hasContract = true;
        await storage.setItem('porto_transactions', transactions, true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('porto_transactions_updated', { detail: transactions }));
        }
      }
    }

    return true;
  } catch (err) {
    console.error('[StudioBridge] syncContractSpkToProjectAndTransaction error:', err);
    return false;
  }
}

/**
 * 8. INQUIRY BRIEF ➔ CONVERSION STATUS:
 * Menandai status brief inquiry telah dikonversi resmi menjadi proyek & penawaran.
 */
export async function syncInquiryConversionToFullLead(
  inquiryId: string,
  projectId: string,
  quotationId?: string
): Promise<boolean> {
  try {
    const inquiries = await storage.getItem<any[]>('porto_studio_inquiries', []);
    if (!Array.isArray(inquiries)) return false;

    const inqIdx = inquiries.findIndex(i => i.id === inquiryId);
    if (inqIdx === -1) return false;

    inquiries[inqIdx].status = 'converted';
    inquiries[inqIdx].convertedProjectId = projectId;
    if (quotationId) inquiries[inqIdx].quotationId = quotationId;
    inquiries[inqIdx].convertedAt = new Date().toISOString();

    await storage.setItem('porto_studio_inquiries', inquiries, true);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porto_inquiries_updated', { detail: inquiries }));
    }

    return true;
  } catch (err) {
    console.error('[StudioBridge] syncInquiryConversionToFullLead error:', err);
    return false;
  }
}

