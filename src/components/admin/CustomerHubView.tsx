import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, UserPlus, Phone, Mail, Search, Download, 
  MessageCircle, Copy, Check, Trash2, Edit3, X, 
  Sparkles, Crown, Receipt, Activity, ShoppingBag, 
  ExternalLink, Calendar, Filter, ChevronRight, Layers,
  RefreshCw, CheckCircle2, ArrowUpDown, Building2, MapPin,
  Globe, Star, Save, MoreVertical, Palette, FolderKanban,
  Rocket, Send, MessageSquare, Briefcase, Target, Zap
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { callGemini } from '../../utils/ai';
import ServiceOrderModal from './ServiceOrderModal';
import ClientVaultFileManagerModal from './ClientVaultFileManagerModal';

export type CustomerSegment = 'VIP' | 'Pelanggan' | 'Prospek' | 'Klien Proyek' | 'Baru';

export interface UnifiedContact {
  id: string;
  name: string;
  phone: string;
  cleanPhone: string;
  email: string;
  avatar?: string;
  company?: string;
  address?: string;
  city?: string;
  instagram?: string;
  segment: CustomerSegment;
  primarySource: 'bio-link' | 'client-account' | 'transaction' | 'project' | 'manual' | 'inquiry';
  sources: Array<{
    type: 'bio-link' | 'client-account' | 'transaction' | 'project' | 'manual' | 'inquiry';
    label: string;
    detail?: string;
    date?: string;
  }>;
  totalOrders: number;
  totalSpent: number;
  lastOrderId?: string;
  lastOrderDate?: string;
  createdAt: string;
  lastActive?: string;
  notes?: string;
}

interface CustomerHubViewProps {
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  clientList?: any[];
  onOpenAddModal?: () => void;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const normalizePhone = (p: string | undefined | null): string => {
  if (!p) return '';
  let clean = p.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  else if (clean.startsWith('8')) clean = '628' + clean.slice(1);
  return clean;
};

export const CustomerHubView: React.FC<CustomerHubViewProps> = ({
  notify,
  clientList = [],
}) => {
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'bio-link' | 'client-account' | 'transaction' | 'project' | 'manual' | 'inquiry'>('all');
  const [segmentFilter, setSegmentFilter] = useState<'all' | CustomerSegment>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'spent-desc' | 'orders-desc'>('newest');
  
  // Selected contact for detail / edit modal
  const [selectedContact, setSelectedContact] = useState<UnifiedContact | null>(null);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UnifiedContact>>({});
  const [aiInsight, setAiInsight] = useState<{ persona: string; upsell: string; draftMsg: string } | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  const handleAnalyzeClient = async () => {
    if (!selectedContact) return;
    setIsAnalyzingAi(true);
    try {
      const prompt = `Analisis profil pelanggan studio berikut:
Nama: ${selectedContact.name}
Perusahaan: ${selectedContact.company || '-'}
Kota: ${selectedContact.city || selectedContact.address || '-'}
Total Belanja: Rp ${selectedContact.totalSpent}
Jumlah Order: ${selectedContact.totalOrders}
Sumber Interaksi: ${selectedContact.sources?.map(s => s.label).join(', ') || '-'}
Catatan: ${selectedContact.notes || '-'}

Berikan insight cerdas dalam format JSON valid tanpa tanda kutip backtick markdown:
{
  "persona": "Tipe karakter/psikografi singkat (maks 5 kata)",
  "upsell": "1 peluang penawaran/layanan lanjutan spesifik (maks 12 kata)",
  "draftMsg": "Draft pesan WhatsApp follow-up santai dan profesional (maks 25 kata)"
}`;
      const res = await callGemini(prompt, 'Anda adalah konsultan CRM dan bisnis studio kreatif.', 300);
      const cleanJson = res.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setAiInsight(parsed);
    } catch (e) {
      console.error(e);
      notify('Gagal menganalisis insight AI klien', 'error');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [isServiceOrderModalOpen, setIsServiceOrderModalOpen] = useState(false);
  const [serviceOrderCustomer, setServiceOrderCustomer] = useState<any>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultModalContact, setVaultModalContact] = useState<UnifiedContact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [expandedActionContactId, setExpandedActionContactId] = useState<string | null>(null);

  // Close expanded action buttons when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setExpandedActionContactId(null);
    if (expandedActionContactId) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [expandedActionContactId]);

  const handleToggleSelect = (id: string) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Freeze background page scroll when modal is open
  useEffect(() => {
    if (selectedContact || showAddModal) {
      const workArea = document.querySelector('.cms-work-area') as HTMLElement | null;
      const origBodyOverflow = document.body.style.overflow;
      const origWorkAreaOverflow = workArea ? workArea.style.overflowY : '';

      document.body.style.overflow = 'hidden';
      if (workArea) workArea.style.overflowY = 'hidden';

      return () => {
        document.body.style.overflow = origBodyOverflow;
        if (workArea) workArea.style.overflowY = origWorkAreaOverflow;
      };
    }
  }, [selectedContact, showAddModal]);

  // New contact form state (Lengkap: nama, wa, email, instansi, alamat, medsos, catatan)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    city: '',
    instagram: '',
    source: 'manual' as UnifiedContact['primarySource'],
    notes: ''
  });

  // Calculate segment based on metrics
  const computeSegment = (spent: number, orders: number, hasProject: boolean, isLead: boolean): CustomerSegment => {
    if (spent >= 1000000 || orders >= 3) return 'VIP';
    if (orders > 0 || spent > 0) return 'Pelanggan';
    if (hasProject) return 'Klien Proyek';
    if (isLead) return 'Prospek';
    return 'Baru';
  };

  // 1. Aggregator function that pulls from all touchpoints
  const aggregateAllContacts = useCallback(async () => {
    try {
      setIsLoading(true);

      const [leads, transactions, trxCustomers, customers, projects, deletedKeys, studioInquiries] = await Promise.all([
        storage.getItem('porto_leads', []) as Promise<any[]>,
        storage.getItem('porto_transactions', []) as Promise<any[]>,
        storage.getItem('porto_trx_customers', []) as Promise<any[]>,
        storage.getItem('porto_customers', []) as Promise<any[]>,
        storage.getItem('porto_projects', []) as Promise<any[]>,
        storage.getItem('porto_deleted_customers', []) as Promise<string[]>,
        storage.getItem('porto_studio_inquiries', []) as Promise<any[]>,
      ]);
      const deletedSet = new Set(deletedKeys || []);

      const contactMap = new Map<string, UnifiedContact>();

      const getMergeKey = (phone?: string, email?: string, name?: string) => {
        const norm = normalizePhone(phone);
        if (norm && norm.length >= 8) return `phone:${norm}`;
        if (email && email.trim()) return `email:${email.trim().toLowerCase()}`;
        if (name && name.trim()) return `name:${name.trim().toLowerCase()}`;
        return null;
      };

      // A. Bio Link Leads (Lead Magnet downloads)
      (leads || []).forEach(lead => {
        if (!lead) return;
        const key = getMergeKey(lead.phone, lead.email, lead.name);
        if (!key) return;

        const sourceItem = {
          type: 'bio-link' as const,
          label: 'Bio Link (Lead Magnet)',
          detail: lead.resourceTitle ? `Unduh: ${lead.resourceTitle}` : 'Prospek Bio Link',
          date: lead.createdAt || new Date().toISOString()
        };

        const existing = contactMap.get(key);
        if (!existing) {
          contactMap.set(key, {
            id: lead.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: lead.name || 'Pengunjung Bio Link',
            phone: lead.phone || '',
            cleanPhone: normalizePhone(lead.phone),
            email: lead.email || '',
            segment: 'Prospek',
            primarySource: 'bio-link',
            sources: [sourceItem],
            totalOrders: 0,
            totalSpent: 0,
            createdAt: lead.createdAt || new Date().toISOString(),
            lastActive: lead.createdAt,
            notes: lead.resourceTitle ? `Unduh Freebie: ${lead.resourceTitle}` : ''
          });
        } else {
          if (!existing.phone && lead.phone) {
            existing.phone = lead.phone;
            existing.cleanPhone = normalizePhone(lead.phone);
          }
          if (!existing.email && lead.email) existing.email = lead.email;
          if (!existing.sources.some(s => s.type === 'bio-link')) {
            existing.sources.push(sourceItem);
          }
        }
      });

      // B. Registered Web Clients (from Firebase / local cache)
      (clientList || []).forEach(cli => {
        if (!cli) return;
        const key = getMergeKey(cli.phone, cli.email, cli.name);
        if (!key) return;

        const sourceItem = {
          type: 'client-account' as const,
          label: 'Akun Klien Website',
          detail: cli.company ? `Instansi: ${cli.company}` : 'Terdaftar di Portal Klien',
          date: cli.createdAt
        };

        const existing = contactMap.get(key);
        if (!existing) {
          contactMap.set(key, {
            id: cli.id,
            name: cli.name || 'Pelanggan Website',
            phone: cli.phone || '',
            cleanPhone: normalizePhone(cli.phone),
            email: cli.email || '',
            avatar: cli.avatar || '',
            company: cli.company || '',
            address: cli.address || '',
            city: cli.city || '',
            segment: Number(cli.ordersCount) >= 3 ? 'VIP' : Number(cli.ordersCount) > 0 ? 'Pelanggan' : 'Baru',
            primarySource: 'client-account',
            sources: [sourceItem],
            totalOrders: Number(cli.ordersCount) || 0,
            totalSpent: 0,
            createdAt: cli.createdAt || new Date().toISOString(),
            lastActive: cli.lastLogin || cli.createdAt,
            notes: cli.company || ''
          });
        } else {
          if (cli.avatar && !existing.avatar) existing.avatar = cli.avatar;
          if (cli.company && !existing.company) existing.company = cli.company;
          if (cli.address && !existing.address) existing.address = cli.address;
          if (cli.city && !existing.city) existing.city = cli.city;
          if (cli.phone && !existing.phone) {
            existing.phone = cli.phone;
            existing.cleanPhone = normalizePhone(cli.phone);
          }
          if (cli.email && !existing.email) existing.email = cli.email;
          if (cli.ordersCount) existing.totalOrders = Math.max(existing.totalOrders, Number(cli.ordersCount));
          if (!existing.sources.some(s => s.type === 'client-account')) {
            existing.sources.unshift(sourceItem);
            existing.primarySource = 'client-account';
          }
        }
      });

      // C. Money / POS Transactions (porto_transactions)
      (transactions || []).forEach(tx => {
        if (!tx || !tx.customer) return;
        const cus = tx.customer;
        const key = getMergeKey(cus.phone, cus.email, cus.name);
        if (!key) return;

        const amount = Number(tx.grandTotal) || 0;
        const sourceItem = {
          type: 'transaction' as const,
          label: 'Transaksi Kasir (Money)',
          detail: `Nota #${tx.id || ''} (${formatRp(amount)})`,
          date: tx.date
        };

        const existing = contactMap.get(key);
        if (!existing) {
          contactMap.set(key, {
            id: `tx_${tx.id || Date.now()}`,
            name: cus.name || 'Pelanggan Transaksi',
            phone: cus.phone || '',
            cleanPhone: normalizePhone(cus.phone),
            email: cus.email || '',
            address: cus.address || '',
            company: cus.company || '',
            city: cus.city || '',
            segment: amount >= 1000000 ? 'VIP' : 'Pelanggan',
            primarySource: 'transaction',
            sources: [sourceItem],
            totalOrders: 1,
            totalSpent: amount,
            lastOrderId: tx.id,
            lastOrderDate: tx.date,
            createdAt: tx.date || new Date().toISOString(),
            lastActive: tx.date,
            notes: cus.address || ''
          });
        } else {
          existing.totalOrders = (existing.totalOrders || 0) + 1;
          existing.totalSpent = (existing.totalSpent || 0) + amount;
          existing.lastOrderId = tx.id || existing.lastOrderId;
          existing.lastOrderDate = tx.date || existing.lastOrderDate;
          if (cus.address && !existing.address) existing.address = cus.address;
          if (cus.company && !existing.company) existing.company = cus.company;
          if (cus.phone && !existing.phone) {
            existing.phone = cus.phone;
            existing.cleanPhone = normalizePhone(cus.phone);
          }
          if (cus.email && !existing.email) existing.email = cus.email;
          if (!existing.sources.some(s => s.type === 'transaction')) {
            existing.sources.push(sourceItem);
          }
        }
      });

      // D. Transaction CRM Customers (porto_trx_customers)
      (trxCustomers || []).forEach(cus => {
        if (!cus || (!cus.name && !cus.phone && !cus.email)) return;
        const key = getMergeKey(cus.phone, cus.email, cus.name);
        if (!key) return;

        const sourceItem = {
          type: 'transaction' as const,
          label: 'Transaksi Kasir (Money)',
          detail: cus.totalOrders ? `${cus.totalOrders} Transaksi` : 'Pelanggan POS',
          date: cus.createdAt
        };

        const existing = contactMap.get(key);
        if (!existing) {
          contactMap.set(key, {
            id: cus.id || `trxcus_${Date.now()}`,
            name: cus.name || 'Pelanggan Kasir',
            phone: cus.phone || '',
            cleanPhone: normalizePhone(cus.phone),
            email: cus.email || '',
            company: cus.company || '',
            address: cus.address || '',
            city: cus.city || '',
            segment: (Number(cus.totalSpent) >= 1000000 || Number(cus.totalOrders) >= 3) ? 'VIP' : 'Pelanggan',
            primarySource: 'transaction',
            sources: [sourceItem],
            totalOrders: Number(cus.totalOrders) || 0,
            totalSpent: Number(cus.totalSpent) || 0,
            createdAt: cus.createdAt || new Date().toISOString(),
            notes: cus.notes || ''
          });
        } else {
          if (cus.phone && !existing.phone) {
            existing.phone = cus.phone;
            existing.cleanPhone = normalizePhone(cus.phone);
          }
          if (cus.email && !existing.email) existing.email = cus.email;
          if (cus.company && !existing.company) existing.company = cus.company;
          if (cus.address && !existing.address) existing.address = cus.address;
          if (cus.totalOrders) existing.totalOrders = Math.max(existing.totalOrders, Number(cus.totalOrders));
          if (cus.totalSpent) existing.totalSpent = Math.max(existing.totalSpent, Number(cus.totalSpent));
          if (!existing.sources.some(s => s.type === 'transaction')) {
            existing.sources.push(sourceItem);
          }
        }
      });

      // E. Client Projects & Booking (porto_projects)
      (projects || []).forEach(prj => {
        if (!prj) return;
        const clientName = prj.clientName || prj.client;
        const clientPhone = prj.clientWa || prj.clientPhone;
        const clientEmail = prj.clientEmail;
        if (!clientName && !clientPhone && !clientEmail) return;

        const key = getMergeKey(clientPhone, clientEmail, clientName);
        if (!key) return;

        const sourceItem = {
          type: 'project' as const,
          label: 'Proyek & Booking',
          detail: prj.title || prj.name ? `Proyek: ${prj.title || prj.name}` : 'Klien Proyek',
          date: prj.date || prj.createdAt
        };

        const existing = contactMap.get(key);
        if (!existing) {
          contactMap.set(key, {
            id: prj.id || `prj_${Date.now()}`,
            name: clientName || 'Klien Proyek',
            phone: clientPhone || '',
            cleanPhone: normalizePhone(clientPhone),
            email: clientEmail || '',
            company: prj.company || '',
            segment: 'Klien Proyek',
            primarySource: 'project',
            sources: [sourceItem],
            totalOrders: 1,
            totalSpent: Number(prj.budget) || 0,
            createdAt: prj.date || prj.createdAt || new Date().toISOString(),
            notes: `Proyek: ${prj.title || prj.name || ''}`
          });
        } else {
          if (clientPhone && !existing.phone) {
            existing.phone = clientPhone;
            existing.cleanPhone = normalizePhone(clientPhone);
          }
          if (clientEmail && !existing.email) existing.email = clientEmail;
          if (prj.company && !existing.company) existing.company = prj.company;
          if (!existing.sources.some(s => s.type === 'project')) {
            existing.sources.push(sourceItem);
          }
        }
      });

      // F. General Saved Customers (porto_customers)
      (customers || []).forEach(cust => {
        if (!cust) return;
        const key = getMergeKey(cust.phone, cust.email, cust.name);
        if (!key) return;

        const custSourceType = (cust.sourceType || (cust.source?.toLowerCase().includes('link') ? 'bio-link' : 'manual')) as UnifiedContact['primarySource'];
        const sourceItem = {
          type: custSourceType,
          label: cust.source || 'Database Pelanggan',
          detail: cust.sourceDetail || cust.notes || '',
          date: cust.createdAt
        };

        const existing = contactMap.get(key);
        if (!existing) {
          contactMap.set(key, {
            id: cust.id || `cust_${Date.now()}`,
            name: cust.name || 'Pelanggan',
            phone: cust.phone || '',
            cleanPhone: normalizePhone(cust.phone),
            email: cust.email || '',
            company: cust.company || '',
            address: cust.address || '',
            city: cust.city || '',
            instagram: cust.instagram || '',
            segment: cust.segment || computeSegment(Number(cust.totalSpent) || 0, Number(cust.totalOrders) || 0, false, custSourceType === 'bio-link'),
            primarySource: custSourceType,
            sources: [sourceItem],
            totalOrders: Number(cust.totalOrders) || 0,
            totalSpent: Number(cust.totalSpent) || 0,
            createdAt: cust.createdAt || new Date().toISOString(),
            notes: cust.notes || ''
          });
        } else {
          if (cust.phone && !existing.phone) {
            existing.phone = cust.phone;
            existing.cleanPhone = normalizePhone(cust.phone);
          }
          if (cust.email && !existing.email) existing.email = cust.email;
          if (cust.company && !existing.company) existing.company = cust.company;
          if (cust.address && !existing.address) existing.address = cust.address;
          if (cust.city && !existing.city) existing.city = cust.city;
          if (cust.instagram && !existing.instagram) existing.instagram = cust.instagram;
          if (cust.notes && !existing.notes) existing.notes = cust.notes;
          if (cust.segment) existing.segment = cust.segment;
          if (!existing.sources.some(s => s.label === sourceItem.label)) {
            existing.sources.push(sourceItem);
          }
        }
      });

      // G. Creative Studio Inquiries (porto_studio_inquiries)
      (studioInquiries || []).forEach(inq => {
        if (!inq || (!inq.clientName && !inq.phone && !inq.email)) return;
        const key = getMergeKey(inq.phone, inq.email, inq.clientName);
        if (!key) return;

        const sourceItem = {
          type: 'inquiry' as const,
          label: 'Brief Inquiry Studio',
          detail: `Brief #${inq.id || ''}: ${inq.serviceType || 'Desain'} (${inq.budgetRange || 'Budget Fleksibel'})`,
          date: inq.createdAt
        };

        const existing = contactMap.get(key);
        if (!existing) {
          contactMap.set(key, {
            id: inq.id || `inq_${Date.now()}`,
            name: inq.clientName || 'Calon Klien Studio',
            phone: inq.phone || '',
            cleanPhone: normalizePhone(inq.phone),
            email: inq.email || '',
            company: inq.brandName || '',
            segment: 'Prospek',
            primarySource: 'inquiry',
            sources: [sourceItem],
            totalOrders: 0,
            totalSpent: 0,
            createdAt: inq.createdAt || new Date().toISOString(),
            lastActive: inq.createdAt,
            notes: `[Brief #${inq.id}]\nLayanan: ${inq.serviceType}\nVisi: ${inq.goals || '-'}\nBudget: ${inq.budgetRange || '-'}\nTarget: ${inq.deadline || '-'}\nReferensi: ${inq.referenceUrl || '-'}`
          });
        } else {
          if (inq.brandName && !existing.company) existing.company = inq.brandName;
          if (inq.email && !existing.email) existing.email = inq.email;
          if (inq.phone && !existing.phone) {
            existing.phone = inq.phone;
            existing.cleanPhone = normalizePhone(inq.phone);
          }
          if (!existing.sources.some(s => s.type === 'inquiry')) {
            existing.sources.unshift(sourceItem);
          }
        }
      });

      // Update segment for all unified contacts
      contactMap.forEach(c => {
        if (!c.segment || c.segment === 'Baru') {
          const hasProject = c.sources.some(s => s.type === 'project');
          const isLead = c.sources.some(s => s.type === 'bio-link') && c.totalOrders === 0;
          c.segment = computeSegment(c.totalSpent, c.totalOrders, hasProject, isLead);
        }
      });

      // Convert Map to Array & filter out deleted contacts
      const contactList = Array.from(contactMap.values()).filter(c => {
        const pKey = c.cleanPhone ? `phone:${c.cleanPhone}` : null;
        const eKey = c.email ? `email:${c.email.trim().toLowerCase()}` : null;
        const nKey = c.name ? `name:${c.name.trim().toLowerCase()}` : null;
        if (deletedSet.has(c.id)) return false;
        if (pKey && deletedSet.has(pKey)) return false;
        if (eKey && deletedSet.has(eKey)) return false;
        if (nKey && deletedSet.has(nKey)) return false;
        return true;
      });
      setContacts(contactList);
    } catch (err) {
      console.error('Error aggregating contacts:', err);
      notify('Gagal memuat database pelanggan terpadu', 'error');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [clientList, notify]);

  // Initial load and listeners for real-time changes across touchpoints
  useEffect(() => {
    aggregateAllContacts();

    const handleCustUpdate = () => aggregateAllContacts();
    const handleLeadUpdate = () => aggregateAllContacts();
    const handleTrxUpdate = () => aggregateAllContacts();
    const handleInquiryUpdate = () => aggregateAllContacts();

    window.addEventListener('porto_customers_updated', handleCustUpdate);
    window.addEventListener('porto_leads_updated', handleLeadUpdate);
    window.addEventListener('porto_transactions_updated', handleTrxUpdate);
    window.addEventListener('porto_inquiries_updated', handleInquiryUpdate);

    return () => {
      window.removeEventListener('porto_customers_updated', handleCustUpdate);
      window.removeEventListener('porto_leads_updated', handleLeadUpdate);
      window.removeEventListener('porto_transactions_updated', handleTrxUpdate);
      window.removeEventListener('porto_inquiries_updated', handleInquiryUpdate);
    };
  }, [aggregateAllContacts]);

  // Source Stats Counts
  const stats = useMemo(() => {
    const total = contacts.length;
    let fromBioLink = 0;
    let fromWebAccount = 0;
    let fromTransactions = 0;
    let fromProjects = 0;
    let fromInquiry = 0;
    let totalSpentSum = 0;
    let vipCount = 0;

    contacts.forEach(c => {
      totalSpentSum += c.totalSpent || 0;
      if (c.segment === 'VIP') vipCount++;
      if (c.sources.some(s => s.type === 'bio-link')) fromBioLink++;
      if (c.sources.some(s => s.type === 'client-account')) fromWebAccount++;
      if (c.sources.some(s => s.type === 'transaction')) fromTransactions++;
      if (c.sources.some(s => s.type === 'project')) fromProjects++;
      if (c.sources.some(s => s.type === 'inquiry') || c.primarySource === 'inquiry') fromInquiry++;
    });

    return { total, fromBioLink, fromWebAccount, fromTransactions, fromProjects, fromInquiry, totalSpentSum, vipCount };
  }, [contacts]);

  // Filtered and Sorted contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Source Filter
    if (sourceFilter !== 'all') {
      result = result.filter(c => c.sources.some(s => s.type === sourceFilter) || c.primarySource === sourceFilter);
    }

    // Segment Filter
    if (segmentFilter !== 'all') {
      result = result.filter(c => c.segment === segmentFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.instagram && c.instagram.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        c.sources.some(s => (s.label && s.label.toLowerCase().includes(q)) || (s.detail && s.detail.toLowerCase().includes(q)))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'spent-desc') return (b.totalSpent || 0) - (a.totalSpent || 0);
      if (sortBy === 'orders-desc') return (b.totalOrders || 0) - (a.totalOrders || 0);
      return 0;
    });

    return result;
  }, [contacts, sourceFilter, segmentFilter, searchQuery, sortBy]);

  const isAllFilteredSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds.has(c.id));

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedContactIds(prev => {
        const next = new Set(prev);
        filteredContacts.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedContactIds(prev => {
        const next = new Set(prev);
        filteredContacts.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  // Export to Excel (.xlsx) handler - LENGKAP 16 KOLOM DATA
  const handleExportExcel = async () => {
    try {
      if (filteredContacts.length === 0) {
        notify('Tidak ada data pelanggan untuk diekspor', 'info');
        return;
      }

      const XLSX = await import('xlsx');

      const headers = [
        'No.',
        'Nama Lengkap',
        'Nomor WhatsApp / HP',
        'Alamat Email',
        'Status / Segmen',
        'Perusahaan / Instansi',
        'Alamat Lengkap',
        'Kota / Wilayah',
        'Instagram / Medsos',
        'Sumber Utama',
        'Semua Sumber Touchpoint',
        'Detail & Catatan Sumber',
        'Total Frekuensi Transaksi',
        'Total Akumulasi Belanja (Rp)',
        'Tanggal Masuk / Terdaftar',
        'Aktivitas / Transaksi Terakhir',
        'Catatan Khusus CRM'
      ];

      const rows = filteredContacts.map((c, idx) => {
        const formattedCreated = c.createdAt 
          ? new Date(c.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : '-';
        const formattedLast = c.lastActive || c.lastOrderDate
          ? new Date(c.lastActive || c.lastOrderDate || '').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : '-';

        return [
          idx + 1,
          c.name || 'Tanpa Nama',
          c.phone ? `'${c.phone}` : '-', // prepend quote so Excel keeps leading zero / +62
          c.email || '-',
          c.segment || 'Pelanggan',
          c.company || '-',
          c.address || '-',
          c.city || '-',
          c.instagram ? `@${c.instagram.replace(/^@/, '')}` : '-',
          getSourceLabel(c.primarySource),
          c.sources.map(s => s.label).join(' | '),
          c.sources.map(s => s.detail ? `${s.label} (${s.detail})` : s.label).join('; ') || '-',
          c.totalOrders || 0,
          c.totalSpent || 0,
          formattedCreated,
          formattedLast,
          c.notes || '-'
        ];
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Set optimal column widths
      ws['!cols'] = [
        { wch: 6 },   // No
        { wch: 26 },  // Nama
        { wch: 22 },  // Phone
        { wch: 28 },  // Email
        { wch: 18 },  // Segmen
        { wch: 24 },  // Company
        { wch: 32 },  // Alamat
        { wch: 20 },  // Kota
        { wch: 20 },  // Instagram
        { wch: 24 },  // Sumber Utama
        { wch: 36 },  // Semua Sumber
        { wch: 42 },  // Detail Sumber
        { wch: 16 },  // Total Orders
        { wch: 20 },  // Total Spent
        { wch: 20 },  // Tanggal Masuk
        { wch: 20 },  // Aktivitas Terakhir
        { wch: 35 },  // Catatan
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Database Pelanggan');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `Database_Pelanggan_Space_Circle_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notify(`Berhasil mengekspor ${filteredContacts.length} data pelanggan lengkap ke Excel!`, 'success');
    } catch (err) {
      console.error('Error exporting excel:', err);
      notify('Gagal mengekspor file Excel', 'error');
    }
  };

  // Helper for source badges
  const getSourceBadge = (type: UnifiedContact['primarySource']) => {
    switch (type) {
      case 'bio-link':
        return {
          label: 'Bio Link',
          icon: <Sparkles size={11} />,
          bg: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#10b981'
        };
      case 'client-account':
        return {
          label: 'Akun Klien',
          icon: <Globe size={13} />,
          bg: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          color: '#8b5cf6'
        };
      case 'transaction':
        return {
          label: 'Kasir',
          icon: <Receipt size={11} />,
          bg: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          color: '#3b82f6'
        };
      case 'project':
        return {
          label: 'Proyek',
          icon: <Activity size={11} />,
          bg: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          color: '#f59e0b'
        };
      case 'inquiry':
        return {
          label: 'Brief Inquiry',
          icon: <Palette size={11} />,
          bg: 'rgba(217, 86, 41, 0.12)',
          border: '1px solid rgba(217, 86, 41, 0.3)',
          color: '#D95629'
        };
      default:
        return {
          label: 'Manual',
          icon: <UserPlus size={11} />,
          bg: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          color: '#06b6d4'
        };
    }
  };

  const getSourceLabel = (type: string) => {
    if (type === 'bio-link') return 'Bio Link';
    if (type === 'client-account') return 'Akun Klien';
    if (type === 'transaction') return 'Kasir';
    if (type === 'project') return 'Proyek';
    if (type === 'inquiry') return 'Brief Inquiry';
    return 'Manual';
  };

  // Helper for segment badges
  const getSegmentBadge = (seg: CustomerSegment) => {
    switch (seg) {
      case 'VIP':
        return { label: 'VIP', bg: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', icon: <Star size={10} /> };
      case 'Pelanggan':
        return { label: 'Pelanggan', bg: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3b82f6', icon: <ShoppingBag size={10} /> };
      case 'Klien Proyek':
        return { label: 'Proyek', bg: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#8b5cf6', icon: <Activity size={10} /> };
      case 'Prospek':
        return { label: 'Prospek', bg: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', icon: <Sparkles size={10} /> };
      default:
        return { label: 'Baru', bg: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.25)', color: '#94a3b8', icon: <UserPlus size={10} /> };
    }
  };

  // WhatsApp Smart Templates State & Helpers
  const [whatsappModalContact, setWhatsappModalContact] = useState<UnifiedContact | null>(null);
  const [selectedWaTemplate, setSelectedWaTemplate] = useState('greeting');
  const [customWaMessage, setCustomWaMessage] = useState('');

  const getWaTemplateText = useCallback((type: string, c: UnifiedContact | null) => {
    if (!c) return '';
    const name = c.name ? `Kak ${c.name}` : 'Kak';
    switch (type) {
      case 'followup':
        return `Halo ${name}, salam dari tim sumr.day Studio! Kami ingin follow-up terkait rencana proyek dan penawaran yang telah didiskusikan sebelumnya. Apakah ada detail yang ingin disesuaikan?`;
      case 'progress':
        return `Halo ${name}, tim sumr.day ingin mengabarkan pembaruan progres pengerjaan proyek Anda. Semua tahapan berjalan lancar sesuai rencana. Silakan kabari kami jika ada masukan!`;
      case 'invoice':
        return `Halo ${name}, berikut informasi rincian tagihan invoice resmi Anda dari sumr.day Studio. Mohon konfirmasi apabila pembayaran sudah dilakukan ya. Terima kasih banyak!`;
      case 'vault':
        return `Halo ${name}, seluruh berkas dan aset final proyek Anda kini sudah dapat diakses langsung melalui portal Brand Vault sumr.day Studio. Silakan akses kapan saja ya!`;
      default:
        return `Halo ${name}, salam hangat dari tim sumr.day Studio! Ada kebutuhan desain, branding, atau website yang ingin kita diskusikan bersama?`;
    }
  }, []);

  const handleOpenWhatsApp = (c: UnifiedContact) => {
    if (!c.cleanPhone) {
      notify('Nomor WhatsApp tidak tersedia', 'info');
      return;
    }
    setWhatsappModalContact(c);
    setSelectedWaTemplate('greeting');
    setCustomWaMessage(getWaTemplateText('greeting', c));
  };

  const handleSendWhatsAppMessage = () => {
    if (!whatsappModalContact || !whatsappModalContact.cleanPhone) return;
    const text = encodeURIComponent(customWaMessage);
    window.open(`https://wa.me/${whatsappModalContact.cleanPhone}?text=${text}`, '_blank');
    setWhatsappModalContact(null);
  };

  // Convert Lead / Customer directly into a Project
  const handleConvertToProject = async (c: UnifiedContact) => {
    try {
      const existing = (await storage.getItem<any[]>('porto_projects', [])) || [];
      const newId = `prj_${Date.now()}`;
      const projectPayload = {
        id: newId,
        title: `Proyek: ${c.name}${c.company ? ` (${c.company})` : ''}`,
        clientName: c.name,
        clientPhone: c.phone || '',
        clientEmail: c.email || '',
        company: c.company || '',
        status: 'todo',
        priority: c.segment === 'VIP' ? 'high' : 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['CRM Lead', c.segment],
        budget: 0,
        tasks: [
          { id: `tsk_1_${Date.now()}`, title: 'Kickoff brief & konsultasi kebutuhan klien', completed: false },
          { id: `tsk_2_${Date.now()}`, title: 'Penyusunan penawaran & kesepakatan SPK', completed: false },
          { id: `tsk_3_${Date.now()}`, title: 'Pengembangan & preview hasil awal', completed: false }
        ],
        notes: `Data Klien dari CRM:\n• Nama: ${c.name}\n• WhatsApp: ${c.phone || '-'}\n• Email: ${c.email || '-'}\n• Segmen: ${c.segment}\n• Catatan: ${c.notes || '-'}`
      };

      const updatedProjects = [projectPayload, ...existing];
      await storage.setItem('porto_projects', updatedProjects, true);
      window.dispatchEvent(new CustomEvent('porto_projects_updated', { detail: updatedProjects }));
      notify(`🚀 Proyek baru untuk "${c.name}" berhasil dibuat di menu Works/Projects!`, 'success');
    } catch (err: any) {
      notify('Gagal membuat proyek: ' + (err?.message || 'Error'), 'error');
    }
  };

  // Copy helper
  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    notify(`${label} disalin ke clipboard!`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save manual contact
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      notify('Nama dan Nomor WhatsApp wajib diisi', 'error');
      return;
    }

    try {
      const existingCust = (await storage.getItem('porto_customers', [])) || [];
      const cleanPhone = normalizePhone(newContact.phone);

      const payload = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: newContact.name.trim(),
        phone: newContact.phone.trim(),
        email: newContact.email.trim(),
        company: newContact.company.trim(),
        address: newContact.address.trim(),
        city: newContact.city.trim(),
        instagram: newContact.instagram.trim(),
        source: getSourceLabel(newContact.source),
        sourceType: newContact.source,
        sourceDetail: 'Input Manual sumr.day club',
        segment: 'Baru',
        notes: newContact.notes || '',
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString()
      };

      await storage.setItem('porto_customers', [payload, ...existingCust]);
      window.dispatchEvent(new CustomEvent('porto_customers_updated', { detail: payload }));
      
      notify(`Kontak ${newContact.name} berhasil disimpan!`, 'success');
      setShowAddModal(false);
      setNewContact({ name: '', phone: '', email: '', company: '', address: '', city: '', instagram: '', source: 'manual', notes: '' });
      aggregateAllContacts();
    } catch (err) {
      console.error('Error saving manual contact:', err);
      notify('Gagal menyimpan kontak', 'error');
    }
  };

  // Save edited contact details back to porto_customers
  const handleSaveContactEdits = async () => {
    if (!selectedContact) return;
    try {
      const existingCust = (await storage.getItem('porto_customers', [])) || [];
      const cleanPhone = selectedContact.cleanPhone;

      const idx = existingCust.findIndex((c: any) => normalizePhone(c.phone) === cleanPhone);

      const updatedPayload = {
        ...(idx >= 0 ? existingCust[idx] : selectedContact),
        ...editForm,
        updatedAt: new Date().toISOString()
      };

      if (idx >= 0) {
        existingCust[idx] = updatedPayload;
        await storage.setItem('porto_customers', existingCust);
      } else {
        await storage.setItem('porto_customers', [updatedPayload, ...existingCust]);
      }

      window.dispatchEvent(new CustomEvent('porto_customers_updated', { detail: updatedPayload }));
      notify(`Data profil ${selectedContact.name} berhasil diperbarui!`, 'success');
      
      setSelectedContact({ ...selectedContact, ...editForm } as UnifiedContact);
      setIsEditingInModal(false);
      aggregateAllContacts();
    } catch (err) {
      console.error('Error saving edited contact:', err);
      notify('Gagal memperbarui data profil', 'error');
    }
  };

  // Delete contacts (single or bulk marked)
  const handleDeleteContacts = async (idsToDelete: string[], confirmMessage?: string) => {
    if (idsToDelete.length === 0) return;
    
    const message = confirmMessage || (idsToDelete.length === 1 
      ? 'Hapus data pelanggan ini dari database?' 
      : `Hapus ${idsToDelete.length} data pelanggan yang ditandai?`);
      
    if (!window.confirm(message)) return;

    try {
      const contactsToDelete = contacts.filter(c => idsToDelete.includes(c.id));
      const newDeletedIdentifiers: string[] = [];

      contactsToDelete.forEach(c => {
        newDeletedIdentifiers.push(c.id);
        if (c.cleanPhone) newDeletedIdentifiers.push(`phone:${c.cleanPhone}`);
        if (c.email) newDeletedIdentifiers.push(`email:${c.email.trim().toLowerCase()}`);
        if (c.name) newDeletedIdentifiers.push(`name:${c.name.trim().toLowerCase()}`);
      });

      // 1. Update porto_deleted_customers
      const existingDeleted = (await storage.getItem('porto_deleted_customers', [])) as string[];
      const mergedDeleted = Array.from(new Set([...(existingDeleted || []), ...newDeletedIdentifiers]));
      await storage.setItem('porto_deleted_customers', mergedDeleted);

      // 2. Clean up porto_customers
      const existingCustomers = (await storage.getItem('porto_customers', [])) as any[];
      if (existingCustomers && existingCustomers.length > 0) {
        const filteredCust = existingCustomers.filter(c => {
          const norm = normalizePhone(c.phone);
          const email = (c.email || '').trim().toLowerCase();
          const name = (c.name || '').trim().toLowerCase();
          return !idsToDelete.includes(c.id) &&
                 (!norm || !mergedDeleted.includes(`phone:${norm}`)) &&
                 (!email || !mergedDeleted.includes(`email:${email}`)) &&
                 (!name || !mergedDeleted.includes(`name:${name}`));
        });
        await storage.setItem('porto_customers', filteredCust);
      }

      // 3. Clean up porto_leads
      const existingLeads = (await storage.getItem('porto_leads', [])) as any[];
      if (existingLeads && existingLeads.length > 0) {
        const filteredLeads = existingLeads.filter(l => {
          const norm = normalizePhone(l.phone);
          const email = (l.email || '').trim().toLowerCase();
          const name = (l.name || '').trim().toLowerCase();
          return !idsToDelete.includes(l.id) &&
                 (!norm || !mergedDeleted.includes(`phone:${norm}`)) &&
                 (!email || !mergedDeleted.includes(`email:${email}`)) &&
                 (!name || !mergedDeleted.includes(`name:${name}`));
        });
        await storage.setItem('porto_leads', filteredLeads);
      }

      // 4. Clean up porto_trx_customers
      const existingTrxCust = (await storage.getItem('porto_trx_customers', [])) as any[];
      if (existingTrxCust && existingTrxCust.length > 0) {
        const filteredTrxCust = existingTrxCust.filter(tc => {
          const norm = normalizePhone(tc.phone);
          const email = (tc.email || '').trim().toLowerCase();
          const name = (tc.name || '').trim().toLowerCase();
          return !idsToDelete.includes(tc.id) &&
                 (!norm || !mergedDeleted.includes(`phone:${norm}`)) &&
                 (!email || !mergedDeleted.includes(`email:${email}`)) &&
                 (!name || !mergedDeleted.includes(`name:${name}`));
        });
        await storage.setItem('porto_trx_customers', filteredTrxCust);
      }

      // 5. Update local state
      setContacts(prev => prev.filter(c => !idsToDelete.includes(c.id)));
      setSelectedContactIds(prev => {
        const next = new Set(prev);
        idsToDelete.forEach(id => next.delete(id));
        return next;
      });

      if (selectedContact && idsToDelete.includes(selectedContact.id)) {
        setSelectedContact(null);
        setIsEditingInModal(false);
      }

      notify(idsToDelete.length === 1 ? 'Data pelanggan berhasil dihapus' : `${idsToDelete.length} data pelanggan berhasil dihapus`, 'success');
      window.dispatchEvent(new CustomEvent('porto_customers_updated'));
    } catch (err) {
      console.error('Failed to delete customer:', err);
      notify('Gagal menghapus data pelanggan', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── METRIC STATS OVERVIEW ── */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 10,
          marginBottom: 4
        }}
      >
        <div style={{ 
          padding: '12px 14px', borderRadius: 16, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, 
            background: 'rgba(124, 58, 237, 0.12)', color: 'var(--cms-accent, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <Users size={17} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Kontak
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '12px 14px', borderRadius: 16, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, 
            background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <Star size={17} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              VIP
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
              {stats.vipCount}
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '12px 14px', borderRadius: 16, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, 
            background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <Sparkles size={17} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Lead
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
              {stats.fromBioLink}
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '12px 14px', borderRadius: 16, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, 
            background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <Receipt size={17} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Kasir
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
              {stats.fromTransactions}
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '12px 14px', borderRadius: 16, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: 10, 
            background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <Crown size={17} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Klien
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
              {stats.fromWebAccount}
            </div>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR: SEARCH, SOURCE FILTERS & EXCEL SYNC ── */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: 12, 
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 420 }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: 14, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--cms-text-muted)', 
              pointerEvents: 'none' 
            }} 
          />
          <input 
            type="text"
            placeholder="Cari nama, WA, email, instansi, kota, IG..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 42,
              padding: '0 14px 0 42px',
              borderRadius: 100,
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              color: 'var(--cms-text)',
              fontSize: 13,
              fontWeight: 500,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Right: Quick Action Buttons (Excel Sync & Refresh & Add) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              setIsSyncing(true);
              aggregateAllContacts();
            }}
            title="Muat Ulang / Sinkronkan Data Real-time"
            aria-label="Muat Ulang / Sinkronkan Data Real-time"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              borderRadius: '50%',
              border: '1px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              color: 'var(--cms-text)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          </button>

          {/* SINKRON KE EXCEL BUTTON (.XLSX) */}
          <button
            type="button"
            onClick={handleExportExcel}
            title="Download dan Sinkronkan semua data pelanggan ke format Microsoft Excel (.xlsx)"
            aria-label="Download Excel"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              borderRadius: '50%',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <Download size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            title="Tambah Kontak Pelanggan Baru"
            aria-label="Tambah Kontak Pelanggan Baru"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--cms-accent, #7c3aed)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
              flexShrink: 0
            }}
          >
            <UserPlus size={17} />
          </button>
        </div>
      </div>

      {/* ── FILTER PILLS BAR (SUMBER & SEGMEN) ── */}
      <div 
        style={{ 
          display: 'flex', 
          gap: 6, 
          overflowX: 'auto', 
          paddingBottom: 4,
          scrollbarWidth: 'none'
        }}
      >
        {[
          { key: 'all', label: 'Semua', count: stats.total, icon: Users },
          { key: 'inquiry', label: 'Brief Inquiry', count: stats.fromInquiry || 0, icon: Palette },
          { key: 'project', label: 'Proyek', count: stats.fromProjects, icon: Activity },
          { key: 'client-account', label: 'Klien', count: stats.fromWebAccount, icon: Crown },
          { key: 'transaction', label: 'Kasir', count: stats.fromTransactions, icon: Receipt },
          { key: 'bio-link', label: 'Bio Link', count: stats.fromBioLink, icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = sourceFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSourceFilter(tab.key as any)}
              title={`${tab.label} (${tab.count})`}
              aria-label={tab.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 100,
                border: '1px solid',
                borderColor: isActive ? 'var(--cms-accent, #7c3aed)' : 'var(--glass-border)',
                background: isActive ? 'var(--cms-accent-soft, rgba(124,58,237,0.12))' : 'var(--cms-card-bg)',
                color: isActive ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text-muted)',
                fontSize: 12,
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 100,
                  background: isActive ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-input-bg)',
                  color: isActive ? '#ffffff' : 'var(--cms-text)',
                  fontWeight: 800
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── CONTACTS LIST CONTAINER ── */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--cms-text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Mengumpulkan data pelanggan lengkap dari seluruh touchpoint...</div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div 
          style={{ 
            padding: 48, 
            textAlign: 'center', 
            background: 'var(--cms-card-bg)', 
            borderRadius: 20, 
            border: '1px solid var(--glass-border)' 
          }}
        >
          <Users size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>
            Tidak Ada Kontak Ditemukan
          </div>
          <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', maxWidth: 400, margin: '0 auto 18px' }}>
            {searchQuery 
              ? `Tidak ada hasil kontak yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
              : 'Belum ada data pelanggan dari Bio Link, Transaksi Kasir, maupun Akun Klien.'}
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="cms-btn cms-btn-primary"
            style={{ borderRadius: 100, padding: '10px 20px', fontSize: 13, fontWeight: 700 }}
          >
            <UserPlus size={15} /> Tambah Kontak Manual
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* ── SELECT ALL & BULK ACTION BAR ── */}
          {filteredContacts.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 14px',
              borderRadius: 14,
              background: selectedContactIds.size > 0 ? 'var(--cms-accent-soft, rgba(124,58,237,0.1))' : 'var(--cms-card-bg)',
              border: `1.5px solid ${selectedContactIds.size > 0 ? 'var(--cms-accent, #7c3aed)' : 'var(--glass-border)'}`,
              gap: 10,
              flexWrap: 'wrap',
              transition: 'all 0.2s ease'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={handleToggleSelectAllFiltered}
                  style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--cms-accent, #7c3aed)' }}
                />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text)' }}>
                  {selectedContactIds.size > 0 
                    ? `${selectedContactIds.size} dari ${filteredContacts.length} pelanggan ditandai` 
                    : 'Tandai Semua Pelanggan'}
                </span>
              </label>

              {selectedContactIds.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedContactIds(new Set())}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 100,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--cms-input-bg)',
                      color: 'var(--cms-text-muted)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteContacts(Array.from(selectedContactIds))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      border: 'none',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
                    }}
                  >
                    <Trash2 size={13} /> Hapus ({selectedContactIds.size})
                  </button>
                </div>
              )}
            </div>
          )}

          {filteredContacts.map(contact => {
            const isSelected = selectedContactIds.has(contact.id);
            const primaryBadge = getSourceBadge(contact.primarySource);
            const segmentBadge = getSegmentBadge(contact.segment);
            const otherSourcesCount = contact.sources.length - 1;

            return (
              <div
                key={contact.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: isSelected ? 'var(--cms-accent-soft, rgba(124,58,237,0.08))' : 'var(--cms-card-bg)',
                  borderRadius: 16,
                  border: `1.5px solid ${isSelected ? 'var(--cms-accent, #7c3aed)' : 'var(--glass-border)'}`,
                  gap: 14,
                  flexWrap: 'wrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Contact Identity & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px', minWidth: 260 }}>
                  {/* Contact Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(contact.id)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                      accentColor: 'var(--cms-accent, #7c3aed)',
                      flexShrink: 0
                    }}
                    title="Tandai pelanggan ini"
                  />

                  <div 
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'var(--cms-accent-soft, rgba(124,58,237,0.12))',
                      color: 'var(--cms-accent, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 16,
                      flexShrink: 0,
                      overflow: 'hidden',
                      border: '2px solid var(--glass-border)'
                    }}
                  >
                    {contact.avatar ? (
                      <img src={contact.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (contact.name || 'P').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>
                        {contact.name || 'Tanpa Nama'}
                      </span>

                      {/* Segment Badge (VIP, Pelanggan, Prospek) */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 8px',
                          borderRadius: 100,
                          fontSize: 10,
                          fontWeight: 800,
                          background: segmentBadge.bg,
                          border: segmentBadge.border,
                          color: segmentBadge.color
                        }}
                      >
                        {segmentBadge.icon}
                        <span>{segmentBadge.label}</span>
                      </span>

                      {/* Primary Source Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 100,
                          fontSize: 10,
                          fontWeight: 700,
                          background: primaryBadge.bg,
                          border: primaryBadge.border,
                          color: primaryBadge.color
                        }}
                      >
                        {primaryBadge.icon}
                        <span>{primaryBadge.label}</span>
                      </span>

                      {/* Other Touchpoints indicator */}
                      {otherSourcesCount > 0 && (
                        <span
                          title={contact.sources.map(s => s.label).join(', ')}
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 100,
                            background: 'var(--cms-input-bg)',
                            color: 'var(--cms-text-muted)',
                            border: '1px solid var(--glass-border)'
                          }}
                        >
                          +{otherSourcesCount} sumber
                        </span>
                      )}
                    </div>

                    {/* Company & Location (If available) */}
                    {(contact.company || contact.city || contact.address) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--cms-text-muted)', marginBottom: 3 }}>
                        {contact.company && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={11} color="var(--cms-accent)" />
                            <span>{contact.company}</span>
                          </span>
                        )}
                        {(contact.city || contact.address) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={11} color="#f59e0b" />
                            <span>{contact.city || contact.address}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Phone & Email line */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                      {contact.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={12} color="#10b981" />
                          <strong style={{ color: 'var(--cms-text)' }}>{contact.phone}</strong>
                        </span>
                      )}

                      {contact.email && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={12} color="var(--cms-accent)" />
                          <span>{contact.email}</span>
                        </span>
                      )}

                      {contact.instagram && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Globe size={12} color="#e1306c" />
                          <span>@{contact.instagram.replace(/^@/, '')}</span>
                        </span>
                      )}

                      {contact.notes && (
                        <span 
                          style={{ 
                            fontSize: 11, 
                            color: 'var(--cms-text-muted)', 
                            maxWidth: 220, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}
                          title={contact.notes}
                        >
                          • {contact.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial & Activity Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  {contact.totalSpent > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Total Belanja</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>
                        {formatRp(contact.totalSpent)}
                      </div>
                    </div>
                  )}

                  {contact.totalOrders > 0 && (
                    <div 
                      style={{ 
                        padding: '4px 10px', 
                        borderRadius: 100, 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        fontSize: 11, 
                        fontWeight: 800, 
                        color: '#3b82f6' 
                      }}
                    >
                      {contact.totalOrders} Transaksi
                    </div>
                  )}
                </div>

                {/* Action Toolbar: Ringkas Jadi 1 Tombol Yang Bisa Diluaskan */}
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  {expandedActionContactId === contact.id ? (
                    /* Expanded Action Bar (Menampilkan Semua Tombol) */
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        background: 'var(--cms-switcher-bg)', 
                        padding: '3px 6px', 
                        borderRadius: 100, 
                        border: '1.5px solid var(--cms-accent, #7c3aed)',
                        boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
                        animation: 'fadeIn 0.18s ease'
                      }}
                    >
                      {/* WhatsApp Direct Chat */}
                      {contact.cleanPhone && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(contact)}
                          title="Kirim Pesan WhatsApp"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            color: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <MessageCircle size={15} />
                        </button>
                      )}

                      {/* Copy Phone */}
                      {contact.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(contact.phone, contact.id + '_phone', 'Nomor HP')}
                          title="Salin Nomor HP"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--cms-input-bg)',
                            border: '1px solid var(--glass-border)',
                            color: copiedId === contact.id + '_phone' ? '#10b981' : 'var(--cms-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {copiedId === contact.id + '_phone' ? <Check size={13} /> : <Phone size={13} />}
                        </button>
                      )}

                      {/* Detail Modal Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedContact(contact);
                          setEditForm(contact);
                          setIsEditingInModal(false);
                        }}
                        title="Lihat Detail Profil"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--cms-input-bg)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <ChevronRight size={15} />
                      </button>

                      {/* Kirim & Kelola Berkas Klien (Brand Vault) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVaultModalContact(contact);
                          setIsVaultModalOpen(true);
                        }}
                        title="Kirim / Kelola Berkas & Brand Vault Klien"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'rgba(217, 86, 41, 0.15)',
                          border: '1px solid rgba(217, 86, 41, 0.35)',
                          color: '#D95629',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <FolderKanban size={14} />
                      </button>

                      {/* Convert to Project Pipeline */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToProject(contact);
                        }}
                        title="Buat Proyek Baru untuk Klien ini (Works Pipeline)"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          color: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Rocket size={14} />
                      </button>

                      {/* Single Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContacts([contact.id], `Hapus pelanggan "${contact.name}" dari database?`);
                        }}
                        title="Hapus Pelanggan"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Ciutkan (Collapse) Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedActionContactId(null);
                        }}
                        title="Ciutkan Tombol Aksi"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          marginLeft: 2,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--cms-text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--cms-text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    /* Collapsed State: 1 Single Compact Button */
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedActionContactId(contact.id);
                      }}
                      title="Buka Menu Aksi Pelanggan"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'var(--cms-input-bg)',
                        border: '1.5px solid var(--glass-border)',
                        color: 'var(--cms-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--cms-accent, #7c3aed)';
                        e.currentTarget.style.color = 'var(--cms-accent, #7c3aed)';
                        e.currentTarget.style.transform = 'scale(1.08)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(124, 58, 237, 0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                        e.currentTarget.style.color = 'var(--cms-text-muted)';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: TAMBAH KONTAK MANUAL LENGKAP ── */}
      {showAddModal && (
        <>
          <div 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0, 0, 0, 0.78)', 
              backdropFilter: 'none', 
              WebkitBackdropFilter: 'none',
              zIndex: 999998 
            }} 
            onClick={() => setShowAddModal(false)}
            onWheel={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 32px)',
              maxWidth: 520,
              background: 'var(--cms-card-bg)',
              borderRadius: 24,
              border: '1.5px solid var(--glass-border)',
              padding: 24,
              boxShadow: '0 25px 60px -10px rgba(0,0,0,0.45), 0 0 0 1px var(--glass-border)',
              zIndex: 999999,
              maxHeight: 'min(92vh, 680px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              overscrollBehavior: 'contain'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: 10, background: 'var(--cms-accent-soft)', 
                  color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--cms-text)' }}>
                    Tambah Kontak Pelanggan Baru
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
                    Data tersimpan ke sumr.day club dan otomatis sinkron ke Excel
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', 
                  cursor: 'pointer', padding: 4 
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin', paddingRight: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={newContact.name}
                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 10,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    WhatsApp / Telepon *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={newContact.phone}
                    onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 10,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    placeholder="budi@example.com"
                    value={newContact.email}
                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 10,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Perusahaan / Instansi
                  </label>
                  <input
                    type="text"
                    placeholder="PT Mandiri / Agency"
                    value={newContact.company}
                    onChange={e => setNewContact({ ...newContact, company: e.target.value })}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 10,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Kota / Wilayah
                  </label>
                  <input
                    type="text"
                    placeholder="Jakarta, Surabaya..."
                    value={newContact.city}
                    onChange={e => setNewContact({ ...newContact, city: e.target.value })}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 10,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Instagram / Medsos
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={newContact.instagram}
                    onChange={e => setNewContact({ ...newContact, instagram: e.target.value })}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 10,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                  Sumber Data
                </label>
                <select
                  value={newContact.source}
                  onChange={e => setNewContact({ ...newContact, source: e.target.value as any })}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 12px',
                    borderRadius: 10,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="manual">Kontak Manual</option>
                  <option value="bio-link">Bio Link / Lead Magnet</option>
                  <option value="transaction">Transaksi Kasir (Money)</option>
                  <option value="client-account">Akun Klien Website</option>
                  <option value="project">Proyek & Booking</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                  Alamat Lengkap & Catatan
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat pengiriman / catatan preferensi klien..."
                  value={newContact.notes}
                  onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexShrink: 0, paddingTop: 10, borderTop: '1px solid var(--glass-border)' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  title="Batal"
                  aria-label="Batal"
                  style={{
                    height: 42,
                    padding: '0 18px',
                    borderRadius: 12,
                    border: '1px solid var(--glass-border)',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'background 0.15s ease'
                  }}
                >
                  <X size={15} />
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  title="Simpan Kontak Baru"
                  aria-label="Simpan Kontak"
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--cms-accent, #7c3aed)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)',
                    transition: 'opacity 0.15s ease'
                  }}
                >
                  <Save size={15} />
                  <span>Simpan Kontak</span>
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── MODAL: DETAIL, RIWAYAT TOUCHPOINT & EDIT PROFIL ── */}
      {selectedContact && (
        <>
          <div 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0, 0, 0, 0.78)', 
              backdropFilter: 'none', 
              WebkitBackdropFilter: 'none',
              zIndex: 999998 
            }} 
            onClick={() => { setSelectedContact(null); setIsEditingInModal(false); }}
            onWheel={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 32px)',
              maxWidth: 540,
              background: 'var(--cms-card-bg)',
              borderRadius: 24,
              border: '1.5px solid var(--glass-border)',
              padding: 24,
              boxShadow: '0 25px 60px -10px rgba(0,0,0,0.45), 0 0 0 1px var(--glass-border)',
              zIndex: 999999,
              maxHeight: 'min(92vh, 640px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              overscrollBehavior: 'contain'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      letterSpacing: 1, 
                      color: 'var(--cms-accent)' 
                    }}
                  >
                    Profil Pelanggan Terpadu
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: getSegmentBadge(selectedContact.segment).bg,
                      color: getSegmentBadge(selectedContact.segment).color
                    }}
                  >
                    {getSegmentBadge(selectedContact.segment).label}
                  </span>
                </div>
                <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--cms-text)' }}>
                  {selectedContact.name}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsEditingInModal(!isEditingInModal)}
                  style={{
                    background: isEditingInModal ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                    color: isEditingInModal ? '#fff' : 'var(--cms-text)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 100,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Edit3 size={12} />
                  <span>{isEditingInModal ? 'Batal Edit' : 'Edit Profil'}</span>
                </button>
                <button 
                  onClick={() => { setSelectedContact(null); setIsEditingInModal(false); }}
                  style={{ 
                    background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', 
                    cursor: 'pointer', padding: 4 
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body (fits without scrolling for short contacts) */}
            <div style={{ 
              flex: 1, 
              minHeight: 0, 
              overflowY: 'auto', 
              scrollbarWidth: 'thin', 
              paddingRight: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12 
            }}>
              {/* Mode Edit vs Mode View */}
            {isEditingInModal ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 2 }}>Nama</label>
                    <input 
                      type="text" 
                      value={editForm.name || ''} 
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 2 }}>Nomor WhatsApp</label>
                    <input 
                      type="tel" 
                      value={editForm.phone || ''} 
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 2 }}>Email</label>
                    <input 
                      type="email" 
                      value={editForm.email || ''} 
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 2 }}>Instansi / Usaha</label>
                    <input 
                      type="text" 
                      value={editForm.company || ''} 
                      onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 2 }}>Kota / Wilayah</label>
                    <input 
                      type="text" 
                      value={editForm.city || ''} 
                      onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 2 }}>Instagram</label>
                    <input 
                      type="text" 
                      value={editForm.instagram || ''} 
                      onChange={e => setEditForm({ ...editForm, instagram: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 2 }}>Catatan Khusus CRM</label>
                  <textarea 
                    rows={2}
                    value={editForm.notes || ''} 
                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, boxSizing: 'border-box', resize: 'none' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveContactEdits}
                  title="Simpan Perubahan Profil"
                  aria-label="Simpan"
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '0 16px',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Save size={15} />
                  <span>Simpan Perubahan Profil</span>
                </button>
              </div>
            ) : (
              /* Normal View Mode */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 14, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, marginBottom: 3 }}>WhatsApp / HP</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{selectedContact.phone || '-'}</span>
                    {selectedContact.cleanPhone && (
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(selectedContact)}
                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}
                        title="Buka WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 14, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, marginBottom: 3 }}>Email</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedContact.email || '-'}
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 14, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, marginBottom: 3 }}>Perusahaan / Instansi</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                    {selectedContact.company || '-'}
                  </div>
                </div>

                <div style={{ padding: 12, borderRadius: 14, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, marginBottom: 3 }}>Kota / Domisili</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                    {selectedContact.city || selectedContact.address || '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            {(selectedContact.totalSpent > 0 || selectedContact.totalOrders > 0) && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  borderRadius: 14, 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  marginBottom: 16
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>Total Transaksi</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>
                    {formatRp(selectedContact.totalSpent)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Frekuensi Belanja</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>
                    {selectedContact.totalOrders} Order
                  </div>
                </div>
              </div>
            )}

            {/* 🧠 AI Client Persona & Upsell Intelligence */}
            <div style={{
              marginBottom: 16,
              padding: 14,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aiInsight ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--cms-accent, #6366f1)' }}>
                  <Sparkles size={13} />
                  <span>AI Client Intelligence</span>
                </div>
                <button
                  type="button"
                  disabled={isAnalyzingAi}
                  onClick={handleAnalyzeClient}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 9999,
                    background: 'var(--cms-accent, #6366f1)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 10.5,
                    fontWeight: 750,
                    cursor: isAnalyzingAi ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Sparkles size={11} />
                  <span>{isAnalyzingAi ? 'Menganalisis...' : aiInsight ? 'Analisis Ulang' : 'Analisis Karakter & Upsell'}</span>
                </button>
              </div>

              {aiInsight && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 11.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--cms-text-muted)', fontWeight: 650 }}>Persona:</span>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 9999, 
                      background: 'rgba(99, 102, 241, 0.18)', color: 'var(--cms-accent, #6366f1)',
                      fontWeight: 800, fontSize: 11
                    }}>
                      {aiInsight.persona}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--cms-text-muted)', fontWeight: 650 }}>Peluang Upsell: </span>
                    <span style={{ color: 'var(--cms-text)', fontWeight: 750 }}>{aiInsight.upsell}</span>
                  </div>
                  {aiInsight.draftMsg && selectedContact.cleanPhone && (
                    <div style={{ 
                      marginTop: 4, 
                      padding: '8px 10px', 
                      borderRadius: 10, 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Send size={10} /> Rekomendasi Sapaan WhatsApp:
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text)', fontStyle: 'italic' }}>
                        "{aiInsight.draftMsg}"
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `https://wa.me/${selectedContact.cleanPhone}?text=${encodeURIComponent(aiInsight.draftMsg)}`;
                          window.open(url, '_blank');
                        }}
                        style={{
                          marginTop: 2,
                          alignSelf: 'flex-start',
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#10b981',
                          border: 'none',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                      >Kirim WA</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* All Touchpoints Timeline */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', margin: '0 0 8px' }}>
                Jejak Interaksi & Sumber Data:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedContact.sources.map((src, i) => {
                  const b = getSourceBadge(src.type);
                  return (
                    <div 
                      key={i}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: 10, 
                        background: 'var(--cms-input-bg)', 
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                          width: 26, height: 26, borderRadius: 8, background: b.bg, 
                          color: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                          {b.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-text)' }}>
                            {src.label}
                          </div>
                          {src.detail && (
                            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                              {src.detail}
                            </div>
                          )}
                        </div>
                      </div>
                      {src.date && (
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(src.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedContact.notes && (
              <div style={{ padding: 12, borderRadius: 14, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, marginBottom: 3 }}>Catatan CRM</div>
                <div style={{ fontSize: 12, color: 'var(--cms-text)', lineHeight: 1.5 }}>
                  {selectedContact.notes}
                </div>
              </div>
            )}

            </div>

            {/* Bottom Actions */}
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginTop: 14, 
              flexShrink: 0, 
              paddingTop: 14, 
              borderTop: '1px solid var(--glass-border)',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => {
                  setServiceOrderCustomer({
                    name: selectedContact.name || '',
                    phone: selectedContact.cleanPhone || selectedContact.phone || '',
                    email: selectedContact.email || '',
                    instagram: selectedContact.instagram || ''
                  });
                  setIsServiceOrderModalOpen(true);
                }}
                title="Buat Pesanan Jasa"
                aria-label="Buat Pesanan Jasa"
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  minHeight: 42,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f97316, #ec4899)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                  transition: 'all 0.15s ease',
                  padding: 0,
                  flexShrink: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
              >
                <Sparkles size={18} strokeWidth={2.2} />
              </button>

              {/* Tombol Buat Proyek Baru dari Klien ini */}
              <button
                type="button"
                onClick={() => {
                  handleConvertToProject(selectedContact);
                }}
                title="Buat Proyek Baru untuk Klien ini (Works Pipeline)"
                aria-label="Buat Proyek Baru"
                style={{
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 100,
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'; }}
              >
                <Rocket size={16} strokeWidth={2.2} />
                <span style={{ whiteSpace: 'nowrap' }}>Buat Proyek</span>
              </button>

              {/* Tombol Kirim & Kelola Berkas Klien */}
              <button
                type="button"
                onClick={() => {
                  setVaultModalContact(selectedContact);
                  setIsVaultModalOpen(true);
                }}
                title="Kirim / Kelola Berkas & Brand Vault Klien"
                aria-label="Kirim / Kelola Berkas & Brand Vault Klien"
                style={{
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 100,
                  border: '1px solid rgba(217, 86, 41, 0.4)',
                  background: 'rgba(217, 86, 41, 0.15)',
                  color: '#f97316',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(217, 86, 41, 0.2)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.background = 'rgba(217, 86, 41, 0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.background = 'rgba(217, 86, 41, 0.15)'; }}
              >
                <FolderKanban size={16} strokeWidth={2.2} />
                <span style={{ whiteSpace: 'nowrap' }}>Brand Vault</span>
              </button>

              {selectedContact.cleanPhone && (
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(selectedContact)}
                  title="Chat WhatsApp"
                  aria-label="Chat WhatsApp"
                  style={{
                    width: 42,
                    height: 42,
                    minWidth: 42,
                    minHeight: 42,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
                >
                  <MessageCircle size={18} strokeWidth={2.2} />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteContacts([selectedContact.id], `Hapus pelanggan "${selectedContact.name}" dari database?`)}
                title="Hapus Data Pelanggan"
                aria-label="Hapus Data Pelanggan"
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  minHeight: 42,
                  borderRadius: '50%',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0,
                  flexShrink: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
              >
                <Trash2 size={18} strokeWidth={2.2} />
              </button>

              <button
                type="button"
                onClick={() => { setSelectedContact(null); setIsEditingInModal(false); }}
                title="Tutup"
                aria-label="Tutup"
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  minHeight: 42,
                  borderRadius: '50%',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0,
                  flexShrink: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--cms-input-bg)'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </>
      )}
      {isServiceOrderModalOpen && (
        <ServiceOrderModal
          isOpen={isServiceOrderModalOpen}
          onClose={() => {
            setIsServiceOrderModalOpen(false);
            setServiceOrderCustomer(null);
          }}
          notify={notify}
          defaultCustomer={serviceOrderCustomer}
        />
      )}
      {isVaultModalOpen && (
        <ClientVaultFileManagerModal
          isOpen={isVaultModalOpen}
          onClose={() => {
            setIsVaultModalOpen(false);
            setVaultModalContact(null);
          }}
          contact={vaultModalContact}
          notify={notify}
        />
      )}

      {/* ── SMART WHATSAPP TEMPLATE MODAL ── */}
      {whatsappModalContact && (
        <>
          <div 
            onClick={() => setWhatsappModalContact(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              zIndex: 99999,
              animation: 'fadeIn 0.2s ease'
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '92%',
              maxWidth: 540,
              background: 'var(--cms-card-bg, #1e1f2e)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 24,
              boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
              zIndex: 100000,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>
                    Pesan WhatsApp
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
                    {whatsappModalContact.name} &bull; <strong style={{ color: '#22c55e' }}>{whatsappModalContact.phone}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModalContact(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Template Chips */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                Pilih Template Pesan
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'greeting', label: 'Sapaan & Konsultasi', icon: MessageSquare },
                  { id: 'followup', label: 'Follow-up Penawaran', icon: Target },
                  { id: 'progress', label: 'Update Progres', icon: Zap },
                  { id: 'invoice', label: 'Tagihan Invoice', icon: Receipt },
                  { id: 'vault', label: 'Akses Brand Vault', icon: FolderKanban }
                ].map(tpl => {
                  const isActive = selectedWaTemplate === tpl.id;
                  const IconComp = tpl.icon;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedWaTemplate(tpl.id);
                        setCustomWaMessage(getWaTemplateText(tpl.id, whatsappModalContact));
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 100,
                        border: `1px solid ${isActive ? '#22c55e' : 'var(--glass-border)'}`,
                        background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'var(--cms-input-bg)',
                        color: isActive ? '#22c55e' : 'var(--cms-text)',
                        fontSize: 12,
                        fontWeight: isActive ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <IconComp size={13} style={{ flexShrink: 0 }} />
                      <span>{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Text Area */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
                Isi Pesan (Dapat diedit bebas)
              </div>
              <textarea
                value={customWaMessage}
                onChange={(e) => setCustomWaMessage(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setWhatsappModalContact(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 100,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--cms-text-muted)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppMessage}
                style={{
                  padding: '10px 22px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)'
                }}
              >
                <Send size={15} />
                <span>Buka WhatsApp</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
