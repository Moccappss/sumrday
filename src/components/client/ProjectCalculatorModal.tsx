import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Calculator, Clock, Sparkles, ShieldCheck,
  ArrowRight, Phone, Layers, Globe, PenTool,
  ExternalLink, Zap, Check, RefreshCw, Copy,
  FileText, MessageCircle, Calendar, User, Users,
  Shield, Info, CreditCard
} from 'lucide-react';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import { createOrUpdateServiceOrder, normalizeGoogleDocUrl, CustomerType } from '../../utils/serviceOrderSync';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

interface ServicePackage {
  id: string;
  name: string;
  subtitle: string;
  basePrice: number;
  baseDays: number;
  icon: React.ElementType;
}

interface AddonOption {
  id: string;
  name: string;
  description: string;
  price: number;
  days: number;
}

interface AdminPicOption {
  id: string;
  name: string;
  role: string;
}

const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'sol-web',
    name: 'Web App',
    subtitle: 'Undangan web estetik, landing page & portal interaktif',
    basePrice: 1500000,
    baseDays: 7,
    icon: Globe,
  },
  {
    id: 'sol-uiux',
    name: 'UI/UX Design',
    subtitle: 'Riset mobile app, figma system, asset & prototipe',
    basePrice: 2500000,
    baseDays: 10,
    icon: Layers,
  },
  {
    id: 'sol-branding',
    name: 'Brand Identity',
    subtitle: 'Identitas karakter, typography skena, logo & visual guide',
    basePrice: 1800000,
    baseDays: 7,
    icon: PenTool,
  },
  {
    id: 'sol-games',
    name: 'Mini Game',
    subtitle: 'Mini-game HTML5 & photobooth web event activation',
    basePrice: 2000000,
    baseDays: 5,
    icon: Sparkles,
  },
  {
    id: 'sol-custom',
    name: 'Custom System',
    subtitle: 'Software terintegrasi, database, POS, & CMS mandiri',
    basePrice: 4500000,
    baseDays: 14,
    icon: Zap,
  },
];

const ADDONS: AddonOption[] = [
  {
    id: 'pwa',
    name: 'PWA Offline',
    description: 'Dapat diinstall di smartphone & dibuka tanpa kuota',
    price: 400000,
    days: 2,
  },
  {
    id: 'express',
    name: 'Express Lane',
    description: 'Prioritas pengerjaan lembur intensif studio',
    price: 600000,
    days: -3,
  },
  {
    id: 'domain_ssl',
    name: 'Domain SSL',
    description: 'Konfigurasi custom domain & Cloudflare SSL HTTPS',
    price: 250000,
    days: 1,
  },
  {
    id: 'ecommerce',
    name: 'Toko Online',
    description: 'Katalog produk digital/fisik & checkout link',
    price: 850000,
    days: 4,
  },
  {
    id: 'cms_panel',
    name: 'CMS Panel',
    description: 'Dashboard khusus kelola konten tanpa coding',
    price: 750000,
    days: 3,
  },
  {
    id: 'bilingual',
    name: 'Multi Bahasa',
    description: 'Arsitektur dwibahasa ID & EN dengan switcher',
    price: 350000,
    days: 2,
  },
  {
    id: 'payment_gateway',
    name: 'Payment Gateway',
    description: 'Integrasi otomatis transfer bank & QRIS',
    price: 500000,
    days: 2,
  },
  {
    id: 'seo_pack',
    name: 'Optimasi SEO',
    description: 'Audit meta tags, sitemap & Google Console indexing',
    price: 300000,
    days: 1,
  },
];

const ADMIN_PIC_OPTIONS: AdminPicOption[] = [
  { id: 'auto', name: 'Auto PIC', role: 'Tim Siap Melayani' },
  { id: 'lead_dev', name: 'Tech Lead', role: 'Fullstack & Backend' },
  { id: 'uiux_lead', name: 'Design Lead', role: 'Creative & UI/UX' },
  { id: 'pm_support', name: 'Project Manager', role: 'Timeline & QC' }
];

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const ProjectCalculatorModal: React.FC = () => {
  const { isDark } = useWebsiteTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [businessWhatsapp, setBusinessWhatsapp] = useState('6281234567890');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('sol-web');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(['pwa']);
  const [customerType, setCustomerType] = useState<CustomerType>('client');
  const [selectedAdminPic, setSelectedAdminPic] = useState<string>('auto');
  const [requestedDeadline, setRequestedDeadline] = useState<string>('');

  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [briefMode, setBriefMode] = useState<'whatsapp' | 'gdoc' | 'text'>('gdoc');
  const [googleDocUrl, setGoogleDocUrl] = useState('');

  // Generated Order Result State
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync accent color, WhatsApp & Banks
  useEffect(() => {
    try {
      const ac = localStorage.getItem('porto_accent_color') || '#2563eb';
      setAccentColor(ac);
    } catch { }

    storage.getItem('porto_business_profile', null).then((p: any) => {
      if (p?.whatsapp) {
        setBusinessWhatsapp(p.whatsapp.replace(/\D/g, ''));
      }
      if (p?.bankAccounts && Array.isArray(p.bankAccounts) && p.bankAccounts.length > 0) {
        setBankAccounts(p.bankAccounts);
      }
    }).catch(() => { });
  }, [isOpen]);

  // Autofill client contact info
  const autoFillBuyerInfo = () => {
    try {
      const currentClient = localStorage.getItem('porto_current_client');
      if (currentClient) {
        const parsed = JSON.parse(currentClient);
        if (parsed.name) setClientName(parsed.name);
        if (parsed.phone) setClientContact(parsed.phone);
        if (parsed.clientType) setCustomerType(parsed.clientType);
        return;
      }

      const lastBuyer = localStorage.getItem('porto_last_checkout_buyer');
      if (lastBuyer) {
        const parsed = JSON.parse(lastBuyer);
        if (parsed.name) setClientName(parsed.name);
        if (parsed.phone) setClientContact(parsed.phone);
        if (parsed.customerType) setCustomerType(parsed.customerType);
      }
    } catch { }
  };

  useEffect(() => {
    const handleOpen = (e: any) => {
      haptic.light();
      setIsOpen(true);
      setCreatedOrderCode(null);
      autoFillBuyerInfo();

      if (e?.detail?.service) {
        const found = SERVICE_PACKAGES.find(p =>
          p.name.toLowerCase().includes(e.detail.service.toLowerCase()) ||
          e.detail.service.toLowerCase().includes(p.name.toLowerCase())
        );
        if (found) {
          setSelectedServiceId(found.id);
        }
      }
      if (e?.detail?.description) {
        setClientNotes(e.detail.description);
      }
    };

    window.addEventListener('porto_open_calculator', handleOpen);
    window.addEventListener('porto_open_concierge', handleOpen);

    if ((window as any).__pendingCalcEvent) {
      const pending = (window as any).__pendingCalcEvent;
      delete (window as any).__pendingCalcEvent;
      handleOpen(pending);
    }

    return () => {
      window.removeEventListener('porto_open_calculator', handleOpen);
      window.removeEventListener('porto_open_concierge', handleOpen);
    };
  }, []);

  // Native mobile back gesture / button handler
  useNativeBackHandler(isOpen, () => setIsOpen(false), 'project_calculator_modal', 20);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedService = useMemo(() =>
    SERVICE_PACKAGES.find(s => s.id === selectedServiceId) || SERVICE_PACKAGES[0],
    [selectedServiceId]
  );

  const toggleAddon = (addonId: string) => {
    haptic.selection();
    setSelectedAddonIds(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const subtotalCost = useMemo(() => {
    const base = selectedService.basePrice;
    const addonsTotal = selectedAddonIds.reduce((sum, id) => {
      const a = ADDONS.find(item => item.id === id);
      return sum + (a ? a.price : 0);
    }, 0);
    return base + addonsTotal;
  }, [selectedService, selectedAddonIds]);

  const resellerDiscount = useMemo(() => {
    return customerType === 'reseller' ? Math.round(subtotalCost * 0.10) : 0;
  }, [customerType, subtotalCost]);

  const finalCost = useMemo(() => {
    return Math.max(0, subtotalCost - resellerDiscount);
  }, [subtotalCost, resellerDiscount]);

  const estimatedDays = useMemo(() => {
    const base = selectedService.baseDays;
    const addonsDays = selectedAddonIds.reduce((sum, id) => {
      const a = ADDONS.find(item => item.id === id);
      return sum + (a ? a.days : 0);
    }, 0);
    return Math.max(3, base + addonsDays);
  }, [selectedService, selectedAddonIds]);

  const activeAddonsList = useMemo(() =>
    ADDONS.filter(a => selectedAddonIds.includes(a.id)),
    [selectedAddonIds]
  );

  const effectiveDeadline = useMemo(() => {
    if (requestedDeadline) return requestedDeadline;
    const targetDate = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);
    return targetDate.toISOString().slice(0, 10);
  }, [requestedDeadline, estimatedDays]);

  const daysUntilDeadline = useMemo(() => {
    if (!effectiveDeadline) return estimatedDays;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(effectiveDeadline);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [effectiveDeadline, estimatedDays]);

  const setDeadlinePresetDays = (days: number) => {
    haptic.selection();
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setRequestedDeadline(target.toISOString().slice(0, 10));
  };

  const selectedAdminPicObj = useMemo(() =>
    ADMIN_PIC_OPTIONS.find(p => p.id === selectedAdminPic) || ADMIN_PIC_OPTIONS[0],
    [selectedAdminPic]
  );

  const handleCopyRekening = (id: string, num: string) => {
    haptic.light();
    navigator.clipboard.writeText(num);
    setCopiedBankId(id);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  // Send via WhatsApp
  const handleSendViaWhatsApp = () => {
    haptic.medium();
    const addonsText = activeAddonsList.length > 0
      ? activeAddonsList.map(a => `• ${a.name} (+${formatRp(a.price)})`).join('\n')
      : '• Tanpa Addon';

    let briefInfo = '';
    if (briefMode === 'whatsapp') {
      briefInfo = '• Format Brief: *Via WhatsApp*';
    } else if (briefMode === 'gdoc' && googleDocUrl) {
      briefInfo = `• Format Brief: *Google Doc*\n• Link Doc: ${normalizeGoogleDocUrl(googleDocUrl)}`;
    } else if (briefMode === 'text') {
      briefInfo = '• Format Brief: *Catatan Singkat*';
    }

    if (clientNotes.trim()) {
      briefInfo += `\n• Catatan:\n${clientNotes.trim()}`;
    }

    const typeBadge = customerType === 'reseller'
      ? 'Reseller (-10%)'
      : customerType === 'vip'
        ? 'VIP'
        : 'Reguler';

    const discountText = resellerDiscount > 0
      ? `\n*Diskon Reseller:* -${formatRp(resellerDiscount)}`
      : '';

    const text = `Halo tim *sumr.day Studio*!
Saya memesan layanan:

*Paket Layanan:*
${selectedService.name} (${formatRp(selectedService.basePrice)})

*Addon Dipilih:*
${addonsText}

*Tipe:* ${typeBadge}
*PIC:* ${selectedAdminPicObj.name}
*Target:* ${effectiveDeadline} (~${daysUntilDeadline} hari)
*Total:* *${formatRp(finalCost)}*${discountText}

*Pemesan:*
• Nama: ${clientName.trim() || 'Klien'}
• Kontak: ${clientContact.trim() || '-'}
${briefInfo ? `\n${briefInfo}\n` : ''}
Terima kasih!`;

    const url = `https://wa.me/${businessWhatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Save as Trackable Order Ticket
  const handleCreateOrderTicket = async () => {
    if (!clientName.trim()) {
      alert('Silakan masukkan Nama Anda.');
      return;
    }

    haptic.selection();
    setIsSubmitting(true);

    try {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const orderCode = `SMR-2026-${randomCode}`;
      const now = new Date().toISOString();

      const newOrder = {
        id: orderCode,
        clientName: clientName.trim(),
        clientContact: clientContact.trim(),
        customerType: customerType,
        serviceName: selectedService.name,
        serviceId: selectedService.id,
        adminPic: selectedAdminPicObj.name,
        addons: activeAddonsList.map(a => ({ name: a.name, price: a.price })),
        notes: clientNotes.trim(),
        briefMode,
        googleDocUrl: normalizeGoogleDocUrl(googleDocUrl),
        subtotal: subtotalCost,
        discount: resellerDiscount,
        totalAmount: finalCost,
        estimatedDays: daysUntilDeadline,
        deadline: effectiveDeadline,
        currentStep: 1,
        status: 'pending',
        requiresAcc: true,
        createdAt: now,
        updatedAt: now
      };

      try {
        localStorage.setItem('porto_last_checkout_buyer', JSON.stringify({
          name: clientName.trim(),
          phone: clientContact.trim(),
          customerType,
          updatedAt: now
        }));
      } catch { }

      const existingOrders = await storage.getItem('porto_client_orders', []);
      const updatedOrders = [newOrder, ...(Array.isArray(existingOrders) ? existingOrders : [])];
      await storage.setItem('porto_client_orders', updatedOrders, true);

      await createOrUpdateServiceOrder({
        id: orderCode,
        customerType: customerType,
        customer: {
          name: clientName.trim(),
          phone: clientContact.trim(),
        },
        serviceCategory: selectedService.name,
        serviceTitle: `${selectedService.name} (Web)`,
        briefMode: briefMode,
        googleDocUrl: googleDocUrl,
        briefDescription: clientNotes.trim(),
        price: subtotalCost,
        resellerDiscountPercent: customerType === 'reseller' ? 10 : 0,
        resellerDiscountAmount: resellerDiscount,
        grandTotal: finalCost,
        paymentScheme: 'quotation',
        dpAmount: 0,
        remainingAmount: finalCost,
        paymentStatus: 'quotation',
        deadline: effectiveDeadline,
        requiresAcc: true,
        notes: `PIC: ${selectedAdminPicObj.name}. Addon: ${activeAddonsList.map(a => a.name).join(', ') || 'None'}. Target: ${effectiveDeadline}.`
      });

      window.dispatchEvent(new CustomEvent('porto_orders_updated'));
      window.dispatchEvent(new CustomEvent('porto_transactions_updated'));
      window.dispatchEvent(new CustomEvent('porto_trx_customers_updated'));
      window.dispatchEvent(new CustomEvent('porto_projects_updated'));

      setCreatedOrderCode(orderCode);
    } catch (err) {
      console.error('Failed to create order ticket:', err);
      alert('Gagal menyimpan tiket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTracker = () => {
    if (!createdOrderCode) return;
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('porto_open_order_tracker', { detail: { query: createdOrderCode } }));
  };

  const handleCopyCode = () => {
    if (!createdOrderCode) return;
    navigator.clipboard.writeText(createdOrderCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  const bg = isDark ? '#151824' : '#ffffff';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto'
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 900,
          maxHeight: '92vh',
          background: bg,
          borderRadius: 24,
          border: `1px solid ${borderCol}`,
          boxShadow: isDark ? '0 25px 60px rgba(0, 0, 0, 0.8)' : '0 25px 60px rgba(15, 23, 42, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: `1px solid ${borderCol}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: `${accentColor}18`,
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                Pesan Jasa
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: 'rgba(16,185,129,0.12)',
                  color: '#10b981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Terhubung Proyek, Transaksi & Kontak Studio"
              >
                <Info size={11} />
                <span>Sinkron</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: subTextColor,
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          {/* Order Created Success Screen */}
          {createdOrderCode ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Check size={30} strokeWidth={3} />
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                  Tiket Dibuat
                </h3>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: subTextColor, marginTop: 4 }}>
                  <Info size={13} color="#f59e0b" />
                  <span>Status Menunggu ACC Admin</span>
                </div>
              </div>

              {/* Order Code Box */}
              <div
                style={{
                  background: cardBg,
                  border: `1.5px dashed ${accentColor}`,
                  borderRadius: 12,
                  padding: '12px 20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: accentColor, letterSpacing: '0.05em', userSelect: 'text' }}>
                  {createdOrderCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: copiedCode ? '#10b981' : subTextColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 750
                  }}
                  title="Salin Kode"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>

              {/* Bank Accounts Copy Box (Rekening Studio) */}
              {bankAccounts.length > 0 && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 500,
                    background: cardBg,
                    border: `1px solid ${borderCol}`,
                    borderRadius: 14,
                    padding: '12px 16px',
                    textAlign: 'left',
                    marginTop: 4
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: textColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CreditCard size={14} color={accentColor} />
                      <span>Rekening Studio</span>
                    </div>
                    <span style={{ fontSize: 10, color: subTextColor }}>
                      (i) Salin untuk transfer DP / pelunasan
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bankAccounts.map((b: any) => (
                      <div
                        key={b.id || b.accountNumber}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          padding: '8px 12px',
                          borderRadius: 10,
                          background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                          border: `1px solid ${borderCol}`
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: textColor, userSelect: 'text' }}>
                            {b.bankName} - <span style={{ fontFamily: 'monospace' }}>{b.accountNumber}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: subTextColor }}>
                            A.n {b.accountName || b.accountHolder || 'sumr.day'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyRekening(b.id || b.accountNumber, b.accountNumber)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            border: `1px solid ${copiedBankId === (b.id || b.accountNumber) ? '#10b981' : borderCol}`,
                            background: copiedBankId === (b.id || b.accountNumber) ? 'rgba(16,185,129,0.12)' : 'transparent',
                            color: copiedBankId === (b.id || b.accountNumber) ? '#10b981' : textColor,
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Salin Nomor Rekening"
                        >
                          {copiedBankId === (b.id || b.accountNumber) ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedBankId === (b.id || b.accountNumber) ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleOpenTracker}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 12,
                    background: accentColor,
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ArrowRight size={14} />
                  <span>Lacak Tiket</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 12,
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Phone size={14} />
                  <span>Chat WA</span>
                </button>
              </div>
            </div>
          ) : (
            /* ════ CALCULATOR + ORDER FORM ════ */
            <>
              {/* Step 1: Select Main Package */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5 }}>1</span>
                  <span>Paket Utama</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {SERVICE_PACKAGES.map((pkg) => {
                    const Icon = pkg.icon;
                    const isSelected = pkg.id === selectedServiceId;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          haptic.selection();
                          setSelectedServiceId(pkg.id);
                        }}
                        style={{
                          background: isSelected ? (isDark ? `${accentColor}20` : `${accentColor}08`) : cardBg,
                          borderRadius: 14,
                          border: isSelected ? `2px solid ${accentColor}` : `1px solid ${borderCol}`,
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${accentColor}18`,
                              color: accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          {isSelected && (
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 850, color: textColor }}>
                            {pkg.name}
                          </span>
                          <span title={pkg.subtitle} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                            <Info size={12} color={subTextColor} />
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: `1px solid ${borderCol}`, paddingTop: 8, marginTop: 'auto' }}>
                          <div style={{ fontSize: 10.5, color: subTextColor, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} color={accentColor} />
                            <span>{pkg.baseDays} Hari</span>
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 900, color: accentColor }}>
                            {formatRp(pkg.basePrice)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Addon Checkboxes */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5 }}>2</span>
                    <span>Pilih Addon</span>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: accentColor, background: `${accentColor}12`, padding: '2px 8px', borderRadius: 100 }}>
                    {selectedAddonIds.length} Addon
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  {ADDONS.map((addon) => {
                    const isChecked = selectedAddonIds.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        style={{
                          background: isChecked ? (isDark ? `${accentColor}18` : `${accentColor}06`) : cardBg,
                          borderRadius: 12,
                          border: isChecked ? `1.5px solid ${accentColor}` : `1px solid ${borderCol}`,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: isChecked ? `2px solid ${accentColor}` : `1.5px solid ${subTextColor}`,
                            background: isChecked ? accentColor : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                              <span style={{ fontSize: 12, fontWeight: 750, color: textColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {addon.name}
                              </span>
                              <span title={addon.description} style={{ cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}>
                                <Info size={11} color={subTextColor} />
                              </span>
                            </div>
                            <span style={{ fontSize: 11.5, fontWeight: 850, color: accentColor, whiteSpace: 'nowrap' }}>
                              +{formatRp(addon.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Target Deadline */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5 }}>3</span>
                  <span>Target Deadline</span>
                </div>

                <div
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderCol}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setDeadlinePresetDays(3)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: `1px solid ${borderCol}`,
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                        color: textColor,
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Zap size={11} color="#f59e0b" />
                      <span>3 Hari</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeadlinePresetDays(7)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: `1px solid ${borderCol}`,
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                        color: textColor,
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Calendar size={11} color={accentColor} />
                      <span>7 Hari</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeadlinePresetDays(14)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: `1px solid ${borderCol}`,
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                        color: textColor,
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Calendar size={11} color={accentColor} />
                      <span>14 Hari</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeadlinePresetDays(30)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: `1px solid ${borderCol}`,
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                        color: textColor,
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Calendar size={11} color={accentColor} />
                      <span>30 Hari</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>
                          Pilih Tanggal
                        </label>
                        <Info size={11} color={subTextColor} title="Pilih target tanggal penyerahan hasil proyek" />
                      </div>
                      <input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={effectiveDeadline}
                        onChange={(e) => setRequestedDeadline(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: `1px solid ${borderCol}`,
                          background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                          color: textColor,
                          fontSize: 12,
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: `${accentColor}12`,
                        border: `1px solid ${accentColor}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={15} color={accentColor} />
                        <span style={{ fontSize: 12.5, fontWeight: 850, color: textColor }}>
                          {effectiveDeadline}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 850, padding: '2px 6px', borderRadius: 4, background: accentColor, color: '#fff' }}>
                        ~{daysUntilDeadline} Hari
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Tipe & PIC */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5 }}>4</span>
                  <span>Tipe & PIC</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  <div
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderCol}`,
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>Tipe Akun</span>
                      <Info size={11} color={subTextColor} title="Reseller mendapatkan potongan kemitraan 10%" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setCustomerType('client');
                        }}
                        style={{
                          padding: '6px 4px',
                          borderRadius: 8,
                          border: customerType === 'client' ? `1.5px solid ${accentColor}` : `1px solid ${borderCol}`,
                          background: customerType === 'client' ? `${accentColor}15` : 'transparent',
                          color: customerType === 'client' ? accentColor : textColor,
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Reguler
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setCustomerType('reseller');
                        }}
                        style={{
                          padding: '6px 4px',
                          borderRadius: 8,
                          border: customerType === 'reseller' ? '1.5px solid #10b981' : `1px solid ${borderCol}`,
                          background: customerType === 'reseller' ? 'rgba(16,185,129,0.15)' : 'transparent',
                          color: customerType === 'reseller' ? '#10b981' : textColor,
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Reseller
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setCustomerType('vip');
                        }}
                        style={{
                          padding: '6px 4px',
                          borderRadius: 8,
                          border: customerType === 'vip' ? '1.5px solid #8b5cf6' : `1px solid ${borderCol}`,
                          background: customerType === 'vip' ? 'rgba(139,92,246,0.15)' : 'transparent',
                          color: customerType === 'vip' ? '#8b5cf6' : textColor,
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        VIP
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      background: cardBg,
                      border: `1px solid ${borderCol}`,
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>Pilih PIC</span>
                      <Info size={11} color={subTextColor} title="Penanggung jawab timeline dan alur proyek" />
                    </div>

                    <select
                      value={selectedAdminPic}
                      onChange={(e) => setSelectedAdminPic(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: 8,
                        border: `1px solid ${borderCol}`,
                        background: isDark ? '#141424' : '#fff',
                        color: textColor,
                        fontSize: 12,
                        fontWeight: 750,
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      {ADMIN_PIC_OPTIONS.map((pic) => (
                        <option key={pic.id} value={pic.id} style={{ background: isDark ? '#141424' : '#fff', color: textColor }}>
                          {pic.name} ({pic.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 5: Data Brief */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5 }}>5</span>
                    <span>Data Brief</span>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 750, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 3 }} title="Nama & kontak otomatis tersimpan di Transaksi & Buku Kontak">
                    <Info size={11} />
                    <span>Otomatis Kontak</span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 750, color: subTextColor, textTransform: 'uppercase', marginBottom: 4 }}>
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Anda / Brand"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        color: textColor,
                        fontSize: 12.5,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 750, color: subTextColor, textTransform: 'uppercase', marginBottom: 4 }}>
                      No WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={clientContact}
                      onChange={(e) => setClientContact(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${borderCol}`,
                        background: cardBg,
                        color: textColor,
                        fontSize: 12.5,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Brief Mode Switcher */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>Format Brief</span>
                    <Info size={11} color={subTextColor} title="Pilih cara penyampaian konsep proyek" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setBriefMode('gdoc');
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: briefMode === 'gdoc' ? `1.5px solid ${accentColor}` : `1px solid ${borderCol}`,
                        background: briefMode === 'gdoc' ? (isDark ? `${accentColor}18` : `${accentColor}08`) : cardBg,
                        color: briefMode === 'gdoc' ? accentColor : textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
                      <FileText size={14} color={briefMode === 'gdoc' ? accentColor : subTextColor} />
                      <span>Google Doc</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setBriefMode('text');
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: briefMode === 'text' ? `1.5px solid ${accentColor}` : `1px solid ${borderCol}`,
                        background: briefMode === 'text' ? (isDark ? `${accentColor}18` : `${accentColor}08`) : cardBg,
                        color: briefMode === 'text' ? accentColor : textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
                      <PenTool size={14} color={briefMode === 'text' ? accentColor : subTextColor} />
                      <span>Catatan Singkat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setBriefMode('whatsapp');
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: briefMode === 'whatsapp' ? `1.5px solid #10b981` : `1px solid ${borderCol}`,
                        background: briefMode === 'whatsapp' ? (isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)') : cardBg,
                        color: briefMode === 'whatsapp' ? '#10b981' : textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
                      <MessageCircle size={14} color={briefMode === 'whatsapp' ? '#10b981' : subTextColor} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Brief Inputs */}
                {briefMode === 'gdoc' && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>Link Doc</span>
                      <Info size={11} color={subTextColor} title="Pastikan akses Google Doc Anyone with link can view" />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="url"
                        placeholder="https://docs.google.com/..."
                        value={googleDocUrl}
                        onChange={(e) => setGoogleDocUrl(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: `1px solid ${borderCol}`,
                          background: cardBg,
                          color: textColor,
                          fontSize: 12.5,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      {googleDocUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(normalizeGoogleDocUrl(googleDocUrl), '_blank', 'noopener,noreferrer')}
                          style={{
                            padding: '0 12px',
                            borderRadius: 8,
                            border: `1px solid ${accentColor}`,
                            background: `${accentColor}15`,
                            color: accentColor,
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>Tes Buka</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {briefMode === 'whatsapp' && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10
                    }}
                  >
                    <MessageCircle size={15} color="#10b981" />
                    <span style={{ fontSize: 11.5, color: textColor, fontWeight: 700 }}>Brief WhatsApp</span>
                    <span style={{ fontSize: 11, color: subTextColor }}>(i) Diskusi santai langsung via chat WA studio</span>
                  </div>
                )}

                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 750, color: subTextColor, textTransform: 'uppercase', marginBottom: 4 }}>
                    Catatan Proyek
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan atau kebutuhan khusus..."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${borderCol}`,
                      background: cardBg,
                      color: textColor,
                      fontSize: 12.5,
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* ACC Notice */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)',
                    border: '1px solid rgba(37,99,235,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Info size={14} color={accentColor} />
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: textColor }}>Antrian ACC</span>
                  <span style={{ fontSize: 11, color: subTextColor }}>
                    (i) Pesanan diverifikasi admin sebelum masuk pengerjaan
                  </span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Floating Bottom Bar: Live Dynamic Estimator & Actions */}
        {!createdOrderCode && (
          <div
            style={{
              padding: '14px 22px',
              borderTop: `1px solid ${borderCol}`,
              background: isDark ? 'rgba(15,23,42,0.92)' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>
                Investasi
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 950, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                  {formatRp(finalCost)}
                </span>
                {resellerDiscount > 0 && (
                  <span style={{ fontSize: 12, textDecoration: 'line-through', color: subTextColor }}>
                    {formatRp(subtotalCost)}
                  </span>
                )}
                <span style={{ fontSize: 11.5, fontWeight: 750, color: textColor, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={11} color={accentColor} />
                  <span>~{daysUntilDeadline} Hari</span>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCreateOrderTicket}
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `1.5px solid ${borderCol}`,
                  background: cardBg,
                  color: textColor,
                  fontSize: 12.5,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                {isSubmitting ? (
                  <RefreshCw size={13} className="cms-spin" />
                ) : (
                  <ShieldCheck size={14} color="#10b981" />
                )}
                <span>Simpan Tiket</span>
              </button>

              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Phone size={13} />
                <span>Kirim WA</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCalculatorModal;
