import { storage } from './storage';
import { addNotification } from './notifications';

export type CustomerType = 'client' | 'reseller' | 'vip' | 'corporate';
export type BriefMode = 'gdoc' | 'whatsapp' | 'text';
export type PaymentScheme = 'dp' | 'full' | 'termin' | 'quotation';
export type PaymentStatus = 'belum' | 'dp' | 'lunas' | 'quotation';

export interface ServiceOrderCustomer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
}

export interface ServiceOrderInput {
  id?: string;
  customerType: CustomerType;
  customer: ServiceOrderCustomer;
  serviceCategory: string;
  serviceTitle: string;
  briefMode: BriefMode;
  googleDocUrl?: string;
  briefDescription?: string;
  price: number;
  resellerDiscountPercent?: number;
  resellerDiscountAmount?: number;
  grandTotal: number;
  paymentScheme: PaymentScheme;
  dpAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  deadline?: string;
  requiresAcc?: boolean; // default true: "baru muncul kalau aku acc"
  autoAcc?: boolean; // if true, directly enters active board
  notes?: string;
}

export interface ServiceOrderResult {
  transaction: any;
  project: any;
  isNew: boolean;
}

const genId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

export const normalizeGoogleDocUrl = (url?: string): string => {
  if (!url) return '';
  let clean = url.trim();
  if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
};

/**
 * Creates or updates a custom service order.
 * - Saves into porto_transactions (with DP, grandTotal, notes, and links).
 * - Creates entry into porto_projects:
 *   If requiresAcc is true (and not autoAcc), project has status: 'pending_acc', isApproved: false.
 *   So it DOES NOT appear in active kanban columns until the admin approves (ACC) it!
 * - Saves contact into porto_trx_customers.
 */
export async function createOrUpdateServiceOrder(input: ServiceOrderInput): Promise<ServiceOrderResult> {
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10);
  const trxId = input.id || genId('TRX-SVC');
  const prjId = genId('PRJ');

  const requiresAcc = input.requiresAcc !== false;
  const isApproved = Boolean(input.autoAcc || !requiresAcc);
  const initialProjectStatus = isApproved ? 'todo' : 'pending_acc';

  // 1. Prepare Customer
  let finalCustomer = { ...input.customer };
  if (!finalCustomer.id) {
    finalCustomer.id = genId('CUS');
  }

  // 2. Prepare Transaction
  const cleanDocUrl = normalizeGoogleDocUrl(input.googleDocUrl);
  const finalTransaction = {
    id: trxId,
    date: dateStr,
    createdAt: now,
    updatedAt: now,
    customer: finalCustomer,
    customerType: input.customerType,
    isServiceOrder: true,
    serviceCategory: input.serviceCategory,
    serviceTitle: input.serviceTitle,
    items: [
      {
        productId: `SVC-${Date.now()}`,
        name: input.serviceTitle,
        category: input.serviceCategory,
        price: input.price,
        qty: 1,
        isCustomService: true,
        briefMode: input.briefMode,
        googleDocUrl: cleanDocUrl,
        briefDescription: input.briefDescription || ''
      }
    ],
    discount: {
      type: 'percent',
      value: input.resellerDiscountPercent || 0,
      label: input.customerType === 'reseller' ? 'Diskon Reseller / Mitra' : ''
    },
    subtotal: input.price,
    grandTotal: input.grandTotal,
    paymentScheme: input.paymentScheme,
    paymentStatus: input.paymentStatus,
    dpAmount: input.dpAmount,
    remaining: input.remainingAmount,
    paymentMethod: input.paymentMethod ? { bankName: input.paymentMethod } : undefined,
    notes: input.notes || '',
    briefMode: input.briefMode,
    googleDocUrl: cleanDocUrl,
    briefDescription: input.briefDescription || '',
    projectId: prjId,
    projectStatus: initialProjectStatus,
    requiresAcc: requiresAcc,
    accStatus: isApproved ? 'approved' : 'pending',
    deadline: input.deadline || ''
  };

  // 3. Prepare Project
  const finalProject = {
    id: prjId,
    title: input.serviceTitle,
    client: finalCustomer.name,
    clientPhone: finalCustomer.phone,
    clientEmail: finalCustomer.email || '',
    clientCompany: finalCustomer.company || '',
    clientType: input.customerType,
    category: input.serviceCategory,
    budget: input.grandTotal,
    deadline: input.deadline || '',
    status: initialProjectStatus,
    progress: 0,
    priority: input.customerType === 'vip' ? 'high' : 'medium',
    isServiceOrder: true,
    requiresAcc: requiresAcc,
    isApproved: isApproved,
    approvedAt: isApproved ? now : null,
    briefMode: input.briefMode,
    googleDocUrl: cleanDocUrl,
    briefDescription: input.briefDescription || '',
    transactionId: trxId,
    dpAmount: input.dpAmount,
    remainingAmount: input.remainingAmount,
    paymentStatus: input.paymentStatus,
    paymentScheme: input.paymentScheme,
    notes: input.notes || '',
    createdAt: now,
    updatedAt: now,
    activity: [
      {
        id: Date.now(),
        time: now,
        message: isApproved 
          ? `Pesanan Jasa dibuat langsung aktif (${input.customerType === 'reseller' ? 'Mitra Reseller' : 'Klien'})` 
          : `Pesanan Jasa baru dicatat — Menunggu persetujuan (ACC) Admin untuk masuk ke Papan Proyek.`
      }
    ]
  };

  // 4. Save to porto_transactions
  const existingTrxs = await storage.getItem<any[]>('porto_transactions', []);
  const safeTrxList = Array.isArray(existingTrxs) ? existingTrxs : [];
  const trxIdx = safeTrxList.findIndex(t => t.id === trxId);
  let updatedTrxs: any[];
  if (trxIdx !== -1) {
    updatedTrxs = [...safeTrxList];
    const prevItems = safeTrxList[trxIdx].items;
    updatedTrxs[trxIdx] = { 
      ...updatedTrxs[trxIdx], 
      ...finalTransaction,
      // Preserve existing transaction items if checkout already created a multi-item cart
      items: (Array.isArray(prevItems) && prevItems.length > 0) ? prevItems : finalTransaction.items
    };
  } else {
    updatedTrxs = [finalTransaction, ...safeTrxList];
  }
  await storage.setItem('porto_transactions', updatedTrxs, true);

  // 5. Save to porto_projects
  const existingProjects = await storage.getItem<any[]>('porto_projects', []);
  const safeProjList = Array.isArray(existingProjects) ? existingProjects : [];
  const projIdx = safeProjList.findIndex(p => p.id === prjId || (p.transactionId === trxId && p.title === input.serviceTitle));
  let updatedProjects: any[];
  if (projIdx !== -1) {
    updatedProjects = [...safeProjList];
    updatedProjects[projIdx] = { ...updatedProjects[projIdx], ...finalProject };
  } else {
    updatedProjects = [finalProject, ...safeProjList];
  }
  await storage.setItem('porto_projects', updatedProjects, true);

  // 6. Save/update customer in porto_trx_customers
  try {
    const existingCustomers = await storage.getItem<any[]>('porto_trx_customers', []);
    const safeCusList = Array.isArray(existingCustomers) ? existingCustomers : [];
    const cusIdx = safeCusList.findIndex(c => 
      (c.phone && c.phone === finalCustomer.phone) || 
      (c.name && c.name.toLowerCase() === finalCustomer.name.toLowerCase())
    );
    if (cusIdx === -1) {
      await storage.setItem('porto_trx_customers', [{ ...finalCustomer }, ...safeCusList], true);
    }
  } catch (_) {}

  // 7. Fire Events
  window.dispatchEvent(new CustomEvent('porto_transactions_updated', { detail: updatedTrxs }));
  window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: updatedProjects }));
  window.dispatchEvent(new CustomEvent('porto_service_orders_updated'));

  // 8. Notifications
  if (isApproved) {
    addNotification('project', 'Proyek Jasa Aktif', `Pesanan "${input.serviceTitle}" langsung aktif di papan proyek.`, { projectId: prjId });
  } else {
    addNotification('project', 'Pesanan Jasa Menunggu ACC', `Pesanan baru dari ${finalCustomer.name} (${input.serviceTitle}) menunggu ACC Anda untuk masuk ke papan proyek.`, { projectId: prjId, transactionId: trxId });
  }

  return {
    transaction: finalTransaction,
    project: finalProject,
    isNew: trxIdx === -1
  };
}

/**
 * Approve (ACC) a service order project so it now appears on the active Kanban board!
 */
export async function approveServiceOrder(projectId: string, transactionId?: string): Promise<boolean> {
  const now = new Date().toISOString();

  // 1. Update Project
  const projects = await storage.getItem<any[]>('porto_projects', []);
  if (!Array.isArray(projects)) return false;

  const pIdx = projects.findIndex(p => p.id === projectId);
  if (pIdx === -1) return false;

  const currentP = projects[pIdx];
  const targetTrxId = transactionId || currentP.transactionId;

  const updatedProject = {
    ...currentP,
    status: currentP.status === 'pending_acc' ? 'todo' : currentP.status,
    isApproved: true,
    approvedAt: now,
    activity: [
      { id: Date.now(), time: now, message: '✅ Disetujui (ACC) oleh Admin. Masuk ke Papan Pengerjaan Proyek aktif.' },
      ...(Array.isArray(currentP.activity) ? currentP.activity : [])
    ]
  };
  projects[pIdx] = updatedProject;
  await storage.setItem('porto_projects', [...projects], true);

  // 2. Update matching Transaction
  if (targetTrxId) {
    const trxs = await storage.getItem<any[]>('porto_transactions', []);
    if (Array.isArray(trxs)) {
      const tIdx = trxs.findIndex(t => t.id === targetTrxId);
      if (tIdx !== -1) {
        trxs[tIdx] = {
          ...trxs[tIdx],
          accStatus: 'approved',
          projectStatus: updatedProject.status,
          updatedAt: now
        };
        await storage.setItem('porto_transactions', [...trxs], true);
        window.dispatchEvent(new CustomEvent('porto_transactions_updated', { detail: trxs }));
      }
    }
  }

  // 3. Dispatch events
  window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: projects }));
  window.dispatchEvent(new CustomEvent('porto_service_orders_updated'));

  addNotification('project', 'Pesanan Jasa Telah Di-ACC', `Proyek "${updatedProject.title}" kini aktif di Papan Proyek.`, { projectId });

  return true;
}

/**
 * Reject or Cancel a pending service order
 */
export async function rejectServiceOrder(projectId: string, transactionId?: string, reason?: string): Promise<boolean> {
  const now = new Date().toISOString();

  const projects = await storage.getItem<any[]>('porto_projects', []);
  if (Array.isArray(projects)) {
    const pIdx = projects.findIndex(p => p.id === projectId);
    if (pIdx !== -1) {
      projects[pIdx] = {
        ...projects[pIdx],
        status: 'trash',
        isTrash: true,
        isApproved: false,
        accStatus: 'rejected',
        rejectReason: reason || 'Ditolak oleh admin',
        updatedAt: now
      };
      await storage.setItem('porto_projects', [...projects], true);
      window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: projects }));
    }
  }

  if (transactionId) {
    const trxs = await storage.getItem<any[]>('porto_transactions', []);
    if (Array.isArray(trxs)) {
      const tIdx = trxs.findIndex(t => t.id === transactionId);
      if (tIdx !== -1) {
        trxs[tIdx] = {
          ...trxs[tIdx],
          accStatus: 'rejected',
          paymentStatus: 'belum',
          notes: `${trxs[tIdx].notes || ''}\n[Ditolak: ${reason || 'Dibatalkan oleh admin'}]`,
          updatedAt: now
        };
        await storage.setItem('porto_transactions', [...trxs], true);
        window.dispatchEvent(new CustomEvent('porto_transactions_updated', { detail: trxs }));
      }
    }
  }

  window.dispatchEvent(new CustomEvent('porto_service_orders_updated'));
  return true;
}

/**
 * Returns projects that are waiting for admin ACC
 */
export function getPendingAccProjects(projects: any[]): any[] {
  if (!Array.isArray(projects)) return [];
  return projects.filter(p => 
    !p.isDeleted && 
    !p.isTrash && 
    (p.status === 'pending_acc' || (p.requiresAcc && !p.isApproved))
  );
}

export interface ProjectReminders {
  pendingAcc: any[];
  waBriefPending: any[];
  urgentDeadlines: any[];
  unpaidBalances: any[];
  totalCount: number;
}

/**
 * Calculates all actionable reminders for Project Management
 */
export function getProjectReminders(projects: any[], transactions?: any[]): ProjectReminders {
  if (!Array.isArray(projects)) {
    return { pendingAcc: [], waBriefPending: [], urgentDeadlines: [], unpaidBalances: [], totalCount: 0 };
  }

  const activeProjects = projects.filter(p => !p.isDeleted && !p.isTrash);

  // 1. Pending ACC orders
  const pendingAcc = activeProjects.filter(p => 
    p.status === 'pending_acc' || (p.requiresAcc && !p.isApproved)
  );

  // 2. Orders with WhatsApp Brief explanation option
  const waBriefPending = activeProjects.filter(p => 
    p.briefMode === 'whatsapp' && p.status !== 'done'
  );

  // 3. Urgent deadlines (< 3 days, today, or overdue, and not done)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urgentDeadlines = activeProjects.filter(p => {
    if (!p.deadline || p.status === 'done' || p.status === 'pending_acc') return false;
    const dl = new Date(p.deadline);
    dl.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3; // overdue (diff < 0), today (diff === 0), or within 3 days
  });

  // 4. Unpaid balances (DP paid or belum lunas)
  const unpaidBalances = activeProjects.filter(p => {
    if (p.status === 'done' || p.status === 'pending_acc') return false;
    const rem = Number(p.remainingAmount) || 0;
    return rem > 0 && p.paymentStatus !== 'lunas';
  });

  const totalCount = pendingAcc.length + waBriefPending.length + urgentDeadlines.length + unpaidBalances.length;

  return {
    pendingAcc,
    waBriefPending,
    urgentDeadlines,
    unpaidBalances,
    totalCount
  };
}
