import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sparkles, FileText, CheckCircle2, Clock, 
  Send, ExternalLink, MessageCircle, AlertCircle, 
  DollarSign, Calendar, User, Phone, Mail, Building, 
  HelpCircle, ShieldCheck, Tag, Percent, ArrowRight,
  Link as LinkIcon, Check, Copy, Crown, Handshake
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { openWhatsApp, whatsappTemplates, cleanPhoneForWa } from '../../utils/whatsappTemplates';
import { 
  createOrUpdateServiceOrder, 
  CustomerType, 
  BriefMode, 
  PaymentScheme, 
  PaymentStatus,
  normalizeGoogleDocUrl
} from '../../utils/serviceOrderSync';

interface ServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialData?: any;
  defaultCustomer?: {
    name?: string;
    phone?: string;
    email?: string;
    company?: string;
  };
}

const SERVICE_CATEGORIES = [
  'Web & Landing Page Development',
  'UI/UX Design & App Prototyping',
  'Graphic Design & Brand Identity',
  'Content Creation & Video Editing',
  'Custom Software & Automation System',
  'Mini Game & Interactive Web',
  'Lainnya / Custom Service'
];

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  onClose,
  notify,
  initialData,
  defaultCustomer
}) => {
  if (!isOpen) return null;

  // 1. Form States
  const [customerType, setCustomerType] = useState<CustomerType>('client');
  const [customerName, setCustomerName] = useState(defaultCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(defaultCustomer?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(defaultCustomer?.email || '');
  const [customerCompany, setCustomerCompany] = useState(defaultCustomer?.company || '');
  
  // Existing contacts for autocomplete
  const [existingContacts, setExistingContacts] = useState<any[]>([]);
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);

  // Service details
  const [serviceCategory, setServiceCategory] = useState(SERVICE_CATEGORIES[0]);
  const [serviceTitle, setServiceTitle] = useState('');
  
  // Brief options
  const [briefMode, setBriefMode] = useState<BriefMode>('whatsapp');
  const [googleDocUrl, setGoogleDocUrl] = useState('');
  const [briefDescription, setBriefDescription] = useState('');

  // Financials
  const [price, setPrice] = useState<number>(1500000);
  const [resellerDiscountPercent, setResellerDiscountPercent] = useState<number>(15);
  const [paymentScheme, setPaymentScheme] = useState<PaymentScheme>('dp');
  const [customDpAmount, setCustomDpAmount] = useState<number>(750000);
  const [paymentMethod, setPaymentMethod] = useState('BCA Transfer');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  const daysUntilDeadline = useMemo(() => {
    if (!deadline) return null;
    const target = new Date(deadline);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [deadline]);

  const setDeadlineDaysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDeadline(d.toISOString().slice(0, 10));
  };
  
  // ACC Option (default: true -> "manajemen proyek baru muncul kalau aku acc")
  const [requiresAcc, setRequiresAcc] = useState(true);
  const [autoAcc, setAutoAcc] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing contacts from storage
  useEffect(() => {
    storage.getItem<any[]>('porto_trx_customers', []).then(list => {
      if (Array.isArray(list)) setExistingContacts(list);
    }).catch(() => {});
  }, []);

  // Sync initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.customerType) setCustomerType(initialData.customerType);
      if (initialData.customer?.name || initialData.client) setCustomerName(initialData.customer?.name || initialData.client || '');
      if (initialData.customer?.phone || initialData.clientPhone) setCustomerPhone(initialData.customer?.phone || initialData.clientPhone || '');
      if (initialData.customer?.email || initialData.clientEmail) setCustomerEmail(initialData.customer?.email || initialData.clientEmail || '');
      if (initialData.serviceTitle || initialData.title) setServiceTitle(initialData.serviceTitle || initialData.title || '');
      if (initialData.serviceCategory || initialData.category) setServiceCategory(initialData.serviceCategory || initialData.category || SERVICE_CATEGORIES[0]);
      if (initialData.briefMode) setBriefMode(initialData.briefMode);
      if (initialData.googleDocUrl) setGoogleDocUrl(initialData.googleDocUrl);
      if (initialData.briefDescription || initialData.notes) setBriefDescription(initialData.briefDescription || initialData.notes || '');
      if (initialData.price || initialData.budget) setPrice(Number(initialData.price || initialData.budget) || 1500000);
      if (initialData.deadline) setDeadline(initialData.deadline);
    }
  }, [initialData]);

  // Calculations
  const calculatedDiscount = useMemo(() => {
    if (customerType === 'reseller' && resellerDiscountPercent > 0) {
      return Math.round((price * resellerDiscountPercent) / 100);
    }
    return 0;
  }, [customerType, resellerDiscountPercent, price]);

  const grandTotal = useMemo(() => {
    return Math.max(0, price - calculatedDiscount);
  }, [price, calculatedDiscount]);

  const { dpAmount, remainingAmount, paymentStatus } = useMemo(() => {
    let dp = 0;
    let remaining = 0;
    let status: PaymentStatus = 'belum';

    if (paymentScheme === 'full') {
      dp = grandTotal;
      remaining = 0;
      status = 'lunas';
    } else if (paymentScheme === 'dp') {
      dp = Math.min(grandTotal, customDpAmount);
      remaining = Math.max(0, grandTotal - dp);
      status = dp > 0 ? (remaining === 0 ? 'lunas' : 'dp') : 'belum';
    } else if (paymentScheme === 'termin') {
      dp = Math.round(grandTotal * 0.5);
      remaining = grandTotal - dp;
      status = 'dp';
    } else if (paymentScheme === 'quotation') {
      dp = 0;
      remaining = grandTotal;
      status = 'quotation';
    }

    return { dpAmount: dp, remainingAmount: remaining, paymentStatus: status };
  }, [paymentScheme, customDpAmount, grandTotal]);

  const filteredContacts = useMemo(() => {
    if (!customerName.trim()) return [];
    const q = customerName.toLowerCase();
    return existingContacts.filter(c => 
      c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).slice(0, 5);
  }, [customerName, existingContacts]);

  const selectContact = (c: any) => {
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    if (c.company) setCustomerCompany(c.company);
    setShowContactSuggestions(false);
  };

  const handleOpenDocTest = () => {
    const cleanUrl = normalizeGoogleDocUrl(googleDocUrl);
    if (!cleanUrl) {
      notify?.('Masukkan tautan Google Doc terlebih dahulu', 'error');
      return;
    }
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      notify?.('Nama klien/pemesan wajib diisi!', 'error');
      return;
    }
    if (!serviceTitle.trim()) {
      notify?.('Judul layanan/pesanan jasa wajib diisi!', 'error');
      return;
    }
    if (briefMode === 'gdoc' && !googleDocUrl.trim()) {
      notify?.('Harap masukkan tautan berkas Google Doc atau pilih opsi penjelasan via WA!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createOrUpdateServiceOrder({
        customerType,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          company: customerCompany.trim()
        },
        serviceCategory,
        serviceTitle: serviceTitle.trim(),
        briefMode,
        googleDocUrl: briefMode === 'gdoc' ? googleDocUrl.trim() : '',
        briefDescription: briefDescription.trim(),
        price,
        resellerDiscountPercent: customerType === 'reseller' ? resellerDiscountPercent : 0,
        resellerDiscountAmount: calculatedDiscount,
        grandTotal,
        paymentScheme,
        dpAmount,
        remainingAmount,
        paymentStatus,
        paymentMethod,
        deadline,
        requiresAcc,
        autoAcc,
        notes: notes.trim()
      });

      notify?.(
        autoAcc 
          ? `Pesanan Jasa berhasil dibuat & langsung masuk ke Papan Proyek! 🚀` 
          : `Pesanan Jasa berhasil dicatat! Menunggu ACC Anda sebelum masuk ke Manajemen Proyek. 🔔`,
        'success'
      );

      // Offer quick WhatsApp opening if customer phone exists
      if (customerPhone.trim()) {
        const confirmWa = window.confirm(
          `Pesanan berhasil dibuat!\n\nApakah Anda ingin membuka WhatsApp untuk mengirim konfirmasi / diskusi brief kepada ${customerName}?`
        );
        if (confirmWa) {
          const waText = whatsappTemplates.serviceBriefDiscussion({
            clientName: customerName.trim(),
            projectName: serviceTitle.trim(),
            orderId: res.transaction.id,
            googleDocUrl: briefMode === 'gdoc' ? normalizeGoogleDocUrl(googleDocUrl) : undefined,
            briefSummary: briefDescription.trim() || undefined
          });
          openWhatsApp(customerPhone.trim(), waText);
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to create service order:', err);
      notify?.('Gagal menyimpan pesanan jasa. Periksa data kembali.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      overflowY: 'auto'
    }}>
      <div 
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          background: 'var(--cms-card-bg)',
          borderRadius: 24,
          border: '1.5px solid var(--glass-border)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--cms-text)',
          animation: 'pmModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1.5px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(var(--cms-accent-rgb), 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--cms-accent), #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.3)'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                Pesanan Jasa & Kustom Baru
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(var(--cms-accent-rgb), 0.15)', color: 'var(--cms-accent)' }}>
                  Auto-Sync Proyek & Transaksi
                </span>
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                Buat pesanan jasa untuk Klien / Reseller, kelola format brief Google Doc / WA, dan sinkronkan ke manajemen proyek.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1.5px solid var(--glass-border)',
              background: 'var(--cms-switcher-bg)',
              color: 'var(--cms-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Section 1: Customer Type & Profile */}
          <div style={{ background: 'var(--cms-panel-bg)', borderRadius: 16, padding: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} color="var(--cms-accent)" /> 1. Profil Pemesan / Klien
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={11} strokeWidth={3} /> Nama pembeli otomatis masuk Transaksi & Buku Kontak
              </span>
            </div>

            {/* Type Selector (Client vs Reseller vs VIP) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { id: 'client', label: 'Klien Reguler', icon: <User size={13} /> },
                { id: 'reseller', label: 'Mitra Reseller', icon: <Handshake size={13} /> },
                { id: 'vip', label: 'Klien VIP', icon: <Crown size={13} /> },
                { id: 'corporate', label: 'B2B / Perusahaan', icon: <Building size={13} /> },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCustomerType(t.id as CustomerType)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 12,
                    border: customerType === t.id ? '2px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                    background: customerType === t.id ? 'rgba(var(--cms-accent-rgb), 0.12)' : 'var(--cms-input-bg)',
                    color: customerType === t.id ? 'var(--cms-accent)' : 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Customer Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  Nama Pemesan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso / PT Sejahtera"
                  value={customerName}
                  onChange={e => {
                    setCustomerName(e.target.value);
                    setShowContactSuggestions(true);
                  }}
                  onFocus={() => setShowContactSuggestions(true)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '0 12px',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {/* Autocomplete Dropdown */}
                {showContactSuggestions && filteredContacts.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    background: 'var(--cms-card-bg)',
                    borderRadius: 12,
                    border: '1.5px solid var(--glass-border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    padding: 4,
                    overflow: 'hidden'
                  }}>
                    {filteredContacts.map(c => (
                      <button
                        key={c.id || c.phone}
                        type="button"
                        onClick={() => selectContact(c)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: 700 }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  No. WhatsApp (Aktif) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789 atau 628..."
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    style={{
                      width: '100%',
                      height: 38,
                      borderRadius: 10,
                      border: '1.5px solid var(--glass-border)',
                      background: 'var(--cms-input-bg)',
                      color: 'var(--cms-text)',
                      padding: '0 12px 0 34px',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Phone size={14} style={{ position: 'absolute', left: 11, top: 12, color: 'var(--cms-text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  Email Klien (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="klien@gmail.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '0 12px',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  Instansi / Perusahaan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Nama Brand / PT"
                  value={customerCompany}
                  onChange={e => setCustomerCompany(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '0 12px',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Layanan & Deskripsi Request (Google Doc / WhatsApp) */}
          <div style={{ background: 'var(--cms-panel-bg)', borderRadius: 16, padding: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color="#3b82f6" /> 2. Rincian Layanan & Deskripsi Request
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  Kategori Jasa
                </label>
                <select
                  value={serviceCategory}
                  onChange={e => setServiceCategory(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '0 10px',
                    fontSize: 12.5,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {SERVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  Nama / Judul Pesanan Jasa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Redesign Website PT Maju Bersama & Company Profile"
                  value={serviceTitle}
                  onChange={e => setServiceTitle(e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '0 12px',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Brief Method Selector: Google Doc vs WA Saja vs Ketik Langsung */}
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text)' }}>
                Format Penyampaian Brief / Deskripsi Request:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setBriefMode('whatsapp')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: briefMode === 'whatsapp' ? '2px solid #22c55e' : '1px solid var(--glass-border)',
                    background: briefMode === 'whatsapp' ? 'rgba(34, 197, 94, 0.12)' : 'var(--cms-input-bg)',
                    color: briefMode === 'whatsapp' ? '#22c55e' : 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageCircle size={15} color="#22c55e" />
                    <span>Penjelasan via WA Saja</span>
                  </div>
                  <span style={{ fontSize: 10.5, opacity: 0.75, fontWeight: 500 }}>
                    Praktis, brief langsung dibahas lewat WhatsApp
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBriefMode('gdoc')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: briefMode === 'gdoc' ? '2px solid #3b82f6' : '1px solid var(--glass-border)',
                    background: briefMode === 'gdoc' ? 'rgba(59, 130, 246, 0.12)' : 'var(--cms-input-bg)',
                    color: briefMode === 'gdoc' ? '#3b82f6' : 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={15} color="#3b82f6" />
                    <span>Format Google Doc / Link</span>
                  </div>
                  <span style={{ fontSize: 10.5, opacity: 0.75, fontWeight: 500 }}>
                    Tautkan URL Google Doc dokumen spesifikasi
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBriefMode('text')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: briefMode === 'text' ? '2px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                    background: briefMode === 'text' ? 'rgba(var(--cms-accent-rgb), 0.12)' : 'var(--cms-input-bg)',
                    color: briefMode === 'text' ? 'var(--cms-accent)' : 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag size={15} color="var(--cms-accent)" />
                    <span>Tulis di Form Ini</span>
                  </div>
                  <span style={{ fontSize: 10.5, opacity: 0.75, fontWeight: 500 }}>
                    Ketik catatan / rangkuman brief langsung
                  </span>
                </button>
              </div>

              {/* Dynamic Sub-form based on selected mode */}
              {briefMode === 'gdoc' && (
                <div style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  marginBottom: 10
                }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#3b82f6', marginBottom: 6 }}>
                    Tautan Google Doc / Google Drive Berkas Brief:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="url"
                        placeholder="https://docs.google.com/document/d/... atau drive.google.com/..."
                        value={googleDocUrl}
                        onChange={e => setGoogleDocUrl(e.target.value)}
                        style={{
                          width: '100%',
                          height: 38,
                          borderRadius: 10,
                          border: '1.5px solid rgba(59, 130, 246, 0.3)',
                          background: 'var(--cms-card-bg)',
                          color: 'var(--cms-text)',
                          padding: '0 12px 0 34px',
                          fontSize: 12.5,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <LinkIcon size={14} style={{ position: 'absolute', left: 11, top: 12, color: '#3b82f6' }} />
                    </div>
                    {googleDocUrl && (
                      <button
                        type="button"
                        onClick={handleOpenDocTest}
                        title="Buka & Uji Link Google Doc"
                        style={{
                          padding: '0 14px',
                          height: 38,
                          borderRadius: 10,
                          border: 'none',
                          background: '#3b82f6',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexShrink: 0
                        }}
                      >
                        <ExternalLink size={14} /> Uji Buka
                      </button>
                    )}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--cms-text-muted)' }}>
                    💡 Pastikan izin akses Google Doc diset minimal <i>"Anyone with the link can view / commenter"</i> agar tim dapat meninjau.
                  </p>
                </div>
              )}

              {briefMode === 'whatsapp' && (
                <div style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(34, 197, 94, 0.06)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageCircle size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e' }}>Opsi Penjelasan via WhatsApp Aktif</div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                        Klien atau reseller akan berdiskusi langsung di chat WA. Di manajemen proyek akan ada pengingat khusus untuk koordinasi brief via WA.
                      </div>
                    </div>
                  </div>
                  {customerPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        const text = whatsappTemplates.serviceBriefDiscussion({
                          clientName: customerName || 'Klien',
                          projectName: serviceTitle || 'Proyek Desain/Jasa',
                          orderId: 'SVC-DRAFT'
                        });
                        openWhatsApp(customerPhone, text);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#22c55e',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0
                      }}
                    >
                      <Send size={12} /> Buka Chat WA
                    </button>
                  )}
                </div>
              )}

              {/* Textarea for brief notes / instructions */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  Catatan Tambahan / Ringkasan Instruksi Request
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan scope of work, referensi warna, gaya visual, atau fitur utama yang diminta..."
                  value={briefDescription}
                  onChange={e => setBriefDescription(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '8px 12px',
                    fontSize: 12.5,
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Finansial, Skema Pembayaran & Reseller */}
          <div style={{ background: 'var(--cms-panel-bg)', borderRadius: 16, padding: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={14} color="#10b981" /> 3. Nilai Kontrak Jasa & Transaksi
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  Harga Jasa Normal (IDR) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={50000}
                  value={price}
                  onChange={e => setPrice(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '0 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', display: 'block', marginTop: 3 }}>
                  {formatRp(price)}
                </span>
              </div>

              {/* Reseller Discount (if reseller selected) */}
              {customerType === 'reseller' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#f59e0b' }}>
                    Diskon Khusus Reseller (%)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={resellerDiscountPercent}
                      onChange={e => setResellerDiscountPercent(Number(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        height: 38,
                        borderRadius: 10,
                        border: '1.5px solid #f59e0b',
                        background: 'rgba(245, 158, 11, 0.05)',
                        color: 'var(--cms-text)',
                        padding: '0 12px',
                        fontSize: 13,
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: '#f59e0b', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      -{formatRp(calculatedDiscount)}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                  Skema Pembayaran
                </label>
                <select
                  value={paymentScheme}
                  onChange={e => setPaymentScheme(e.target.value as PaymentScheme)}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '0 10px',
                    fontSize: 12.5,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="dp">DP (Down Payment / Bertahap)</option>
                  <option value="full">Lunas (100% Penuh)</option>
                  <option value="termin">Termin (50% Awal / 50% Akhir)</option>
                  <option value="quotation">Penawaran / Belum Bayar</option>
                </select>
              </div>

              {paymentScheme === 'dp' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                    Nominal DP Diterima (IDR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={customDpAmount}
                    onChange={e => setCustomDpAmount(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      height: 38,
                      borderRadius: 10,
                      border: '1.5px solid var(--glass-border)',
                      background: 'var(--cms-input-bg)',
                      color: 'var(--cms-text)',
                      padding: '0 12px',
                      fontSize: 13,
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setCustomDpAmount(Math.round(grandTotal * 0.3))}
                      style={{ padding: '2px 6px', fontSize: 10, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer' }}
                    >
                      30% ({formatRp(grandTotal * 0.3)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomDpAmount(Math.round(grandTotal * 0.5))}
                      style={{ padding: '2px 6px', fontSize: 10, borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer' }}
                    >
                      50% ({formatRp(grandTotal * 0.5)})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              padding: 12,
              borderRadius: 12,
              background: 'rgba(var(--cms-accent-rgb), 0.05)',
              border: '1px solid rgba(var(--cms-accent-rgb), 0.2)'
            }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--cms-text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>
                  Total Kontrak
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>
                  {formatRp(grandTotal)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: '#10b981', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>
                  DP / Terbayar
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>
                  {formatRp(dpAmount)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: remainingAmount > 0 ? '#ef4444' : '#10b981', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>
                  Sisa Tagihan
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: remainingAmount > 0 ? '#ef4444' : '#10b981' }}>
                  {formatRp(remainingAmount)}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 10,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text)',
                  padding: '0 10px',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="BCA Transfer">BCA Transfer</option>
                <option value="Mandiri Transfer">Mandiri Transfer</option>
                <option value="BRI Transfer">BRI Transfer</option>
                <option value="QRIS Studio">QRIS Studio</option>
                <option value="Cash / Tunai">Cash / Tunai</option>
              </select>
            </div>
          </div>

          {/* Section 4: FORM DEADLINE & TENGGAT PENGERJAAN */}
          <div style={{ background: 'var(--cms-panel-bg)', borderRadius: 16, padding: 16, border: '1.5px solid rgba(59, 130, 246, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#3b82f6" /> 4. Form Deadline & Target Pengerjaan Proyek
              </div>
              {daysUntilDeadline !== null && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 850,
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: daysUntilDeadline <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.12)',
                  color: daysUntilDeadline <= 3 ? '#ef4444' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Clock size={11} />
                  <span>
                    {daysUntilDeadline < 0 
                      ? `Terlewat ${Math.abs(daysUntilDeadline)} hari!` 
                      : daysUntilDeadline === 0 
                      ? 'Hari Ini!' 
                      : `Sisa ~${daysUntilDeadline} hari lagi`}
                  </span>
                </span>
              )}
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--cms-text-muted)' }}>
                Pilih Cepat Durasi Deadline:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[
                  { label: '⚡ 3 Hari (Kilat)', days: 3 },
                  { label: '📅 7 Hari (1 Mgg)', days: 7 },
                  { label: '📆 14 Hari (2 Mgg)', days: 14 },
                  { label: '🗓️ 30 Hari (1 Bln)', days: 30 },
                ].map(preset => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setDeadlineDaysFromNow(preset.days)}
                    style={{
                      padding: '7px 8px',
                      borderRadius: 10,
                      border: '1px solid var(--glass-border)',
                      background: 'var(--cms-card-bg)',
                      color: 'var(--cms-text)',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Picker Input */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--cms-text-muted)' }}>
                Tanggal Target Deadline *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 10,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    padding: '0 12px 0 36px',
                    fontSize: 13,
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Calendar size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#3b82f6' }} />
              </div>
            </div>
          </div>

          {/* Section 5: PERATURAN ALUR PESANAN & ACC MASUK ANTRIAN PROYEK */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(var(--cms-accent-rgb), 0.08), rgba(245, 158, 11, 0.08))',
            borderRadius: 16,
            padding: 16,
            border: '1.5px solid rgba(var(--cms-accent-rgb), 0.3)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-accent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} /> 5. Peraturan Alur Pesanan & Masuk Antrian Proyek (ACC)
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', lineHeight: 1.45, marginBottom: 12, background: 'var(--cms-card-bg)', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
              📌 <b>Peraturan:</b> Pesanan jasa baru otomatis ditahan sebagai <b>"Menunggu ACC"</b>. Baru setelah Anda menekan tombol <b>[ACC Sekarang]</b> di widget pengingat, proyek otomatis masuk ke Kolom <b>"To Do" (Antrian Papan Proyek)</b> dan siap dikerjakan tim.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requiresAcc && !autoAcc}
                  onChange={e => {
                    if (e.target.checked) {
                      setRequiresAcc(true);
                      setAutoAcc(false);
                    } else {
                      setRequiresAcc(false);
                      setAutoAcc(true);
                    }
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)', marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                    ⏳ Tahan Dulu & Masuk Antrian "Menunggu ACC" (Rekomendasi)
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', lineHeight: 1.4, marginTop: 2 }}>
                    Proyek <b>TIDAK</b> akan langsung memenuhi papan kerja aktif. Proyek baru akan masuk ke antrian aktif (Kolom <i>To Do</i>) setelah Anda meng-ACC pesanan ini.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', opacity: autoAcc ? 1 : 0.7 }}>
                <input
                  type="checkbox"
                  checked={autoAcc}
                  onChange={e => {
                    if (e.target.checked) {
                      setAutoAcc(true);
                      setRequiresAcc(false);
                    } else {
                      setAutoAcc(false);
                      setRequiresAcc(true);
                    }
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)', marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>
                    ⚡ Langsung Masukkan ke Antrian Papan Proyek (Bypass ACC)
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 1 }}>
                    Proyek langsung ditempatkan di Kolom <i>To Do</i> Papan Kanban tanpa menunggu tombol ACC.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            paddingTop: 8,
            borderTop: '1px solid var(--glass-border)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 40,
                padding: '0 18px',
                borderRadius: 12,
                border: '1.5px solid var(--glass-border)',
                background: 'var(--cms-switcher-bg)',
                color: 'var(--cms-text)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: 40,
                padding: '0 24px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--cms-accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.35)'
              }}
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Simpan Pesanan & Sambungkan Proyek</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceOrderModal;
