import { storage } from './storage';
import type { FormSchema, FormResponse } from '../components/admin/form-maker/formTypes';
import { syncInquiryConversionToFullLead } from './studioLifecycleBridge';

export interface ConvertedLeadResult {
  success: boolean;
  projectId: string;
  projectTitle: string;
  quotationId: string;
  clientId: string;
  clientName: string;
}

export const convertFormResponseToProjectAndQuote = async (
  form: FormSchema,
  response: FormResponse,
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void
): Promise<ConvertedLeadResult | null> => {
  try {
    // 1. Parse respondent info from questions and answers
    let clientName = '';
    let clientPhone = '';
    let clientEmail = '';
    let serviceCategory = '';
    const briefNotesArr: string[] = [];

    (form.questions || []).forEach(q => {
      const ansVal = response.answers?.[q.id];
      if (ansVal === undefined || ansVal === null || ansVal === '') return;

      const titleLower = (q.title || '').toLowerCase();
      const ansStr = Array.isArray(ansVal) ? ansVal.join(', ') : String(ansVal);

      briefNotesArr.push(`• **${q.title}**: ${ansStr}`);

      if (!clientName && (titleLower.includes('nama') || titleLower.includes('name') || titleLower.includes('klien') || titleLower.includes('client'))) {
        clientName = ansStr.trim();
      } else if (!clientPhone && (titleLower.includes('wa') || titleLower.includes('whatsapp') || titleLower.includes('telepon') || titleLower.includes('phone') || titleLower.includes('hp') || titleLower.includes('kontak'))) {
        clientPhone = ansStr.trim();
      } else if (!clientEmail && (titleLower.includes('email') || titleLower.includes('surel'))) {
        clientEmail = ansStr.trim();
      } else if (!serviceCategory && (titleLower.includes('layanan') || titleLower.includes('service') || titleLower.includes('kategori') || titleLower.includes('paket') || titleLower.includes('kebutuhan'))) {
        serviceCategory = ansStr.trim();
      }
    });

    if (!clientName) {
      clientName = `Prospek #${(response.id || Date.now().toString()).slice(-4)}`;
    }

    const clientId = `cli_${Date.now()}`;
    const projectId = `PRJ-${Date.now().toString().slice(-6)}`;
    const quotationId = `Q-${Date.now().toString().slice(-6)}`;
    const projectTitle = `[Brief] ${clientName} - ${serviceCategory || form.title || 'Proyek Baru'}`;

    // 2. Register/Update Contact in Customer Hub & Clients
    try {
      const existingClients = await storage.getItem('porto_clients', []);
      const clientList = Array.isArray(existingClients) ? [...existingClients] : [];
      const alreadyClient = clientList.find((c: any) => 
        (clientPhone && c.phone && c.phone.replace(/[^0-9]/g, '') === clientPhone.replace(/[^0-9]/g, '')) ||
        (clientEmail && c.email && c.email.toLowerCase() === clientEmail.toLowerCase())
      );

      if (!alreadyClient) {
        const newClient = {
          id: clientId,
          name: clientName,
          phone: clientPhone,
          email: clientEmail,
          segment: 'Prospek',
          source: `Form: ${form.title}`,
          totalOrders: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
          notes: `Berasal dari pengisian form "${form.title}" pada ${new Date().toLocaleDateString('id-ID')}`
        };
        clientList.unshift(newClient);
        await storage.setItem('porto_clients', clientList, true);
      }
    } catch (e) {
      console.warn('Failed to save client directory entry:', e);
    }

    // 3. Create Project in porto_projects
    const existingProjects = await storage.getItem('porto_projects', []);
    const projectList = Array.isArray(existingProjects) ? [...existingProjects] : [];

    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 14); // 2 weeks default deadline

    const newProject = {
      id: projectId,
      title: projectTitle,
      client: clientName,
      clientPhone,
      clientEmail,
      status: 'todo',
      priority: 'high',
      dueDate: dueDateObj.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceFormId: form.id,
      sourceFormTitle: form.title,
      description: `### 📋 Brief Formulir: ${form.title}\n*Tanggal Pengisian: ${new Date(response.submittedAt || Date.now()).toLocaleString('id-ID')}*\n\n${briefNotesArr.join('\n\n')}`,
      tasks: [
        { id: `t_${Date.now()}_1`, text: 'Konfirmasi brief & scope of work via WhatsApp dengan klien', completed: false },
        { id: `t_${Date.now()}_2`, text: 'Kirim surat penawaran harga & estimasi jadwal pengerjaan', completed: false },
        { id: `t_${Date.now()}_3`, text: 'Buat kontrak SPK & verifikasi pembayaran DP 50%', completed: false },
        { id: `t_${Date.now()}_4`, text: 'Kick-off pengerjaan fase riset & konsep desain awal', completed: false },
        { id: `t_${Date.now()}_5`, text: 'Review hasil tahap 1 bersama klien & revisi', completed: false },
        { id: `t_${Date.now()}_6`, text: 'Serah terima file master / live deployment & pelunasan', completed: false }
      ],
      progress: 0,
      tags: ['Lead Masuk', serviceCategory || 'Agency Project'].filter(Boolean),
    };

    projectList.unshift(newProject);
    await storage.setItem('porto_projects', projectList, true);

    // 4. Create Draft Quotation in porto_transactions
    try {
      const existingTrx = await storage.getItem('porto_transactions', []);
      const trxList = Array.isArray(existingTrx) ? [...existingTrx] : [];

      const newQuotation = {
        id: quotationId,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        paymentStatus: 'quotation',
        customer: {
          id: clientId,
          name: clientName,
          phone: clientPhone,
          email: clientEmail,
          address: ''
        },
        items: [
          {
            id: `item_${Date.now()}`,
            name: serviceCategory || form.title || 'Layanan Agensi Kreatif',
            price: 0,
            qty: 1,
            unit: 'Paket'
          }
        ],
        notes: `Surat Penawaran resmi berdasarkan brief form "${form.title}". Terhubung dengan Project ${projectId}.`,
        linkedProjectId: projectId
      };

      trxList.unshift(newQuotation);
      await storage.setItem('porto_transactions', trxList, true);
    } catch (e) {
      console.warn('Failed to save draft quotation:', e);
    }

    if (notify) {
      notify(`Berhasil! Project ${projectId} & Surat Penawaran ${quotationId} telah dibuat untuk ${clientName}`, 'success');
    }

    return {
      success: true,
      projectId,
      projectTitle,
      quotationId,
      clientId,
      clientName
    };
  } catch (err: any) {
    console.error('Lead conversion error:', err);
    if (notify) {
      notify(`Gagal mengonversi brief: ${err?.message || 'Terjadi kesalahan sistem'}`, 'error');
    }
    return null;
  }
};

export interface ConvertInquiryOptions {
  autoApprove?: boolean; // if true, status is 'todo'; if false, status is 'pending_acc'
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const convertStudioInquiryToProject = async (
  inquiry: {
    id: string;
    clientName: string;
    brandName?: string;
    phone: string;
    email?: string;
    serviceType: string;
    goals: string;
    budgetRange: string;
    deadline?: string;
    referenceUrl?: string;
  },
  options: ConvertInquiryOptions = {}
): Promise<ConvertedLeadResult | null> => {
  try {
    const clientName = inquiry.clientName?.trim() || 'Klien Baru';
    const clientPhone = inquiry.phone?.trim() || '';
    const clientEmail = inquiry.email?.trim() || '';
    const serviceType = inquiry.serviceType || 'Creative Design';

    const clientId = `cli_${Date.now()}`;
    const projectId = `PRJ-${Date.now().toString().slice(-6)}`;
    const quotationId = `Q-${Date.now().toString().slice(-6)}`;
    const projectTitle = `[Inquiry] ${clientName}${inquiry.brandName ? ` (${inquiry.brandName})` : ''} - ${serviceType}`;

    // 1. Client Hub registration
    try {
      const existingClients = await storage.getItem('porto_clients', []);
      const clientList = Array.isArray(existingClients) ? [...existingClients] : [];
      const alreadyClient = clientList.find((c: any) => 
        (clientPhone && c.phone && c.phone.replace(/[^0-9]/g, '') === clientPhone.replace(/[^0-9]/g, '')) ||
        (clientEmail && c.email && c.email.toLowerCase() === clientEmail.toLowerCase())
      );

      if (!alreadyClient) {
        const newClient = {
          id: clientId,
          name: clientName,
          brandName: inquiry.brandName || '',
          phone: clientPhone,
          email: clientEmail,
          segment: 'Prospek',
          source: `Creative Inquiry (${inquiry.id})`,
          totalOrders: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
          notes: `Inquiry #${inquiry.id}: ${serviceType} | Budget: ${inquiry.budgetRange}`
        };
        clientList.unshift(newClient);
        await storage.setItem('porto_clients', clientList, true);
      }
    } catch (e) {
      console.warn('Failed to save client from inquiry:', e);
    }

    // 2. Project Creation
    const existingProjects = await storage.getItem('porto_projects', []);
    const projectList = Array.isArray(existingProjects) ? [...existingProjects] : [];

    let dueDate = '';
    if (inquiry.deadline) {
      dueDate = inquiry.deadline;
    } else {
      const due = new Date();
      due.setDate(due.getDate() + 10);
      dueDate = due.toISOString().split('T')[0];
    }

    const description = [
      `### 🎨 Creative Brief Inquiry: ${inquiry.id}`,
      `*Klien: **${clientName}**${inquiry.brandName ? ` | Brand: **${inquiry.brandName}**` : ''}*`,
      `*Layanan: **${serviceType}** | Estimasi Anggaran: **${inquiry.budgetRange}** | Target Selesai: **${inquiry.deadline || 'Fleksibel'}***`,
      '',
      '#### 🎯 Visi & Kebutuhan Proyek:',
      inquiry.goals || '-',
      '',
      inquiry.referenceUrl ? `#### 🔗 Link Referensi Moodboard:\n${inquiry.referenceUrl}` : ''
    ].filter(Boolean).join('\n');

    const newProject = {
      id: projectId,
      title: projectTitle,
      client: clientName,
      brandName: inquiry.brandName || '',
      clientPhone,
      clientEmail,
      status: options.autoApprove ? 'todo' : 'pending_acc',
      isApproved: Boolean(options.autoApprove),
      priority: 'high',
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceInquiryId: inquiry.id,
      description,
      tasks: [
        { id: `t_${Date.now()}_1`, text: 'Hubungi klien via WhatsApp konfirmasi brief & estimasi biaya', completed: false },
        { id: `t_${Date.now()}_2`, text: 'Terbitkan Surat Penawaran (Quotation) / SPK Kontrak resmi', completed: false },
        { id: `t_${Date.now()}_3`, text: 'Konfirmasi pembayaran Down Payment (DP 50%)', completed: false },
        { id: `t_${Date.now()}_4`, text: 'Eksplorasi konsep visual & layout awal (Draft 1)', completed: false },
        { id: `t_${Date.now()}_5`, text: 'Presentasi hasil melalui Proofing Canvas & revisi klien', completed: false },
        { id: `t_${Date.now()}_6`, text: 'Penyelesaian pelunasan & serah terima berkas master', completed: false }
      ],
      progress: 0,
      tags: ['Inquiry Masuk', serviceType, inquiry.budgetRange].filter(Boolean)
    };

    projectList.unshift(newProject);
    await storage.setItem('porto_projects', projectList, true);

    // 3. Draft Quotation in porto_transactions
    try {
      const existingTrx = await storage.getItem('porto_transactions', []);
      const trxList = Array.isArray(existingTrx) ? [...existingTrx] : [];

      const newQuotation = {
        id: quotationId,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        paymentStatus: 'quotation',
        customer: {
          id: clientId,
          name: clientName,
          phone: clientPhone,
          email: clientEmail,
          company: inquiry.brandName || ''
        },
        items: [
          {
            id: `item_${Date.now()}`,
            name: serviceType,
            price: 0,
            qty: 1,
            unit: 'Paket'
          }
        ],
        notes: `Surat Penawaran resmi dari Inquiry #${inquiry.id}. Terhubung dengan Project ${projectId}. Budget Klien: ${inquiry.budgetRange}.`,
        linkedProjectId: projectId,
        sourceInquiryId: inquiry.id
      };

      trxList.unshift(newQuotation);
      await storage.setItem('porto_transactions', trxList, true);
    } catch (e) {
      console.warn('Failed to save quotation for inquiry:', e);
    }

    // 4. Update inquiry conversion state in database
    try {
      await syncInquiryConversionToFullLead(inquiry.id, projectId, quotationId);
    } catch (e) {
      console.warn('Failed to sync inquiry conversion status:', e);
    }

    // 5. Live Events
    window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: projectList }));
    window.dispatchEvent(new CustomEvent('porto_project_synced', { detail: { project: newProject } }));

    if (options.notify) {
      options.notify(`Prospek berhasil diintegrasikan! Project ${projectId} telah dibuat.`, 'success');
    }

    return {
      success: true,
      projectId,
      projectTitle,
      quotationId,
      clientId,
      clientName
    };
  } catch (err: any) {
    console.error('Error converting inquiry to project:', err);
    if (options.notify) {
      options.notify(`Gagal integrasi proyek: ${err?.message || 'Error'}`, 'error');
    }
    return null;
  }
};

