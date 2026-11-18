import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Send, MessageCircle, Building2, User, Phone, Mail,
  Calendar, Layers, CheckCircle2, Copy, Check, ExternalLink, Link2,
  HelpCircle, ArrowRight, ShieldCheck, Palette, Upload
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { openWhatsApp, whatsappTemplates } from '../../utils/whatsappTemplates';
import { haptic } from '../../utils/haptics';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { addNotification } from '../../utils/notifications';
import { convertStudioInquiryToProject } from '../../utils/leadToProject';

export interface StudioInquiry {
  id: string;
  createdAt: string;
  clientName: string;
  brandName?: string;
  phone: string;
  email?: string;
  serviceType: string;
  goals: string;
  budgetRange: string;
  deadline?: string;
  referenceUrl?: string;
  status: 'new' | 'reviewed' | 'converted' | 'archived';
  notes?: string;
}

export const DESIGN_SERVICE_OPTIONS = [
  'Brand Identity & Logo Suite',
  'UI/UX & Web Design (Figma)',
  'Packaging & Print Collateral',
  'Social Media Content Kit & Visual Feed',
  'Creative Retainer (Rutin Bulanan)',
  'Desain Kustom / Konsultasi Lainnya'
];

export const BUDGET_RANGES = [
  '< Rp 1.500.000',
  'Rp 1.500.000 - Rp 3.000.000',
  'Rp 3.000.000 - Rp 6.000.000',
  'Rp 6.000.000 - Rp 15.000.000',
  '> Rp 15.000.000',
  'Fleksibel / Sesuai Rekomendasi Studio'
];

interface StudioInquiryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultService?: string;
  accentColor?: string;
  isDark?: boolean;
}

export const StudioInquiryModal: React.FC<StudioInquiryModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  defaultService,
  accentColor = 'var(--cms-accent, #7c3aed)',
  isDark = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<StudioInquiry | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState(defaultService || DESIGN_SERVICE_OPTIONS[0]);
  const [goals, setGoals] = useState('');
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[1]);
  const [deadline, setDeadline] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');

  const [studioPhone, setStudioPhone] = useState('081234567890');

  useEffect(() => {
    const loadPhone = async () => {
      try {
        const prof = await storage.getItem<any>('porto_business_profile', null);
        if (prof?.whatsapp) {
          setStudioPhone(prof.whatsapp.replace(/\D/g, ''));
          return;
        }
        const main = await storage.getItem<any>('porto_main_website', null);
        if (main?.aboutSettings?.company?.phone) {
          setStudioPhone(main.aboutSettings.company.phone.replace(/\D/g, ''));
          return;
        }
        const settings = await storage.getItem<any>('porto_settings', null);
        if (settings?.phone || settings?.whatsapp) {
          setStudioPhone((settings.phone || settings.whatsapp).replace(/\D/g, ''));
        }
      } catch { }
    };
    loadPhone();
  }, []);

  // Listen to remote open events
  useEffect(() => {
    const handleRemoteOpen = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.serviceType) {
        setServiceType(detail.serviceType);
      }
      if (detail?.goals) {
        setGoals(detail.goals);
      }
      if (detail?.brandName) {
        setBrandName(detail.brandName);
      }
      if (detail?.referenceUrl) {
        setReferenceUrl(detail.referenceUrl);
      }
      if (detail?.budgetRange) {
        setBudgetRange(detail.budgetRange);
      }
      setSubmittedInquiry(null);
      setIsOpen(true);
    };

    window.addEventListener('porto_open_inquiry_modal', handleRemoteOpen);
    return () => window.removeEventListener('porto_open_inquiry_modal', handleRemoteOpen);
  }, []);

  // Sync propIsOpen if controlled
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
      if (propIsOpen) setSubmittedInquiry(null);
    }
  }, [propIsOpen]);

  useEffect(() => {
    if (defaultService) setServiceType(defaultService);
  }, [defaultService]);

  const handleClose = () => {
    setIsOpen(false);
    setSubmittedInquiry(null);
    if (propOnClose) propOnClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !phone.trim() || !goals.trim()) {
      alert('Mohon lengkapi Nama, WhatsApp, dan Visi/Kebutuhan proyek Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const inquiryId = `INQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newInquiry: StudioInquiry = {
        id: inquiryId,
        createdAt: new Date().toISOString(),
        clientName: clientName.trim(),
        brandName: brandName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        serviceType,
        goals: goals.trim(),
        budgetRange,
        deadline: deadline.trim() || undefined,
        referenceUrl: referenceUrl.trim() || undefined,
        status: 'new'
      };

      // 1. Save to porto_studio_inquiries
      const existingInquiries = await storage.getItem<StudioInquiry[]>('porto_studio_inquiries', []);
      const updatedInquiries = [newInquiry, ...(Array.isArray(existingInquiries) ? existingInquiries : [])];
      await storage.setItem('porto_studio_inquiries', updatedInquiries, true);

      // 1b. Cloud Firestore Sync (Safe fallback if offline)
      try {
        if (db) {
          await setDoc(doc(db, 'porto_studio_inquiries', inquiryId), newInquiry);
        }
      } catch (cloudErr) {
        console.warn('Inquiry cloud firestore sync skipped/offline:', cloudErr);
      }

      // 2. Also register into porto_trx_customers for Admin CRM
      const existingContacts = await storage.getItem<any[]>('porto_trx_customers', []);
      const safeContacts = Array.isArray(existingContacts) ? existingContacts : [];
      const cleanPhone = phone.replace(/\D/g, '');
      const existingIdx = safeContacts.findIndex(c => c.cleanPhone === cleanPhone || c.phone === phone);

      const contactItem = {
        id: `CUS-${Date.now().toString().slice(-6)}`,
        name: clientName.trim(),
        phone: phone.trim(),
        cleanPhone: cleanPhone,
        email: email.trim(),
        company: brandName.trim(),
        source: 'inquiry',
        notes: `Inquiry Brief #${inquiryId}: ${serviceType}`,
        updatedAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        safeContacts[existingIdx] = { ...safeContacts[existingIdx], ...contactItem };
      } else {
        safeContacts.unshift(contactItem);
      }
      await storage.setItem('porto_trx_customers', safeContacts, true);

      // 2b. Auto-Bridge to Admin Project & Draft Quotation (Lead-to-Project Bridge)
      try {
        await convertStudioInquiryToProject(newInquiry, { autoApprove: false });
      } catch (bridgeErr) {
        console.warn('Lead-to-project bridge skipped:', bridgeErr);
      }

      // 2c. Send Studio Admin Notification
      try {
        await addNotification(
          'info',
          `💡 Brief Desain Baru: ${clientName.trim()}`,
          `${serviceType} (${budgetRange}) siap ditinjau di Projects Hub.`
        );
      } catch (notifErr) {
        console.warn('Notification trigger skipped:', notifErr);
      }

      // 3. Dispatch Live Events
      window.dispatchEvent(new CustomEvent('porto_inquiries_updated', { detail: updatedInquiries }));
      window.dispatchEvent(new CustomEvent('porto_contacts_updated', { detail: safeContacts }));

      try {
        localStorage.setItem('porto_last_order_id', inquiryId);
      } catch { }

      haptic.success();
      setSubmittedInquiry(newInquiry);
    } catch (err) {
      console.error('Failed to submit studio inquiry:', err);
      alert('Terjadi kendala saat menyimpan brief. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendViaWhatsApp = () => {
    if (!submittedInquiry) return;
    const waText = whatsappTemplates.studioCreativeInquiry({
      clientName: submittedInquiry.clientName,
      brandName: submittedInquiry.brandName,
      serviceType: submittedInquiry.serviceType,
      inquiryId: submittedInquiry.id,
      goals: submittedInquiry.goals,
      budgetRange: submittedInquiry.budgetRange,
      deadline: submittedInquiry.deadline,
      referenceUrl: submittedInquiry.referenceUrl
    });
    openWhatsApp(studioPhone, waText);
  };

  const handleCopyInquiryId = () => {
    if (!submittedInquiry) return;
    navigator.clipboard.writeText(submittedInquiry.id);
    setCopiedId(true);
    haptic.light();
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="sumr-modal-backdrop"
      style={{
        zIndex: 100010,
        background: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
      onClick={handleClose}
    >
      <div
        className="sumr-modal-sheet"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: 'min(820px, calc(100vh - 120px))',
          background: isDark ? '#151824' : '#ffffff',
          borderRadius: 24,
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)'}`,
          boxShadow: isDark
            ? '0 25px 60px rgba(0, 0, 0, 0.8)'
            : '0 25px 60px rgba(15, 23, 42, 0.14)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag/Sheet Handle */}
        <div className="sumr-sheet-handle" />
        {/* Header */}
        <div style={{
          padding: '24px 28px 18px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 850,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: accentColor,
              marginBottom: 6
            }}>
              <Palette size={14} />
              <span>Studio Creative Inquiry & Brief</span>
            </div>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 900,
              color: isDark ? '#f8fafc' : '#0f172a',
              margin: '0 0 4px',
              letterSpacing: '-0.02em'
            }}>
              {submittedInquiry ? 'Brief Berhasil Diterima!' : 'Konsultasikan Proyek Desain Anda'}
            </h2>
            <p style={{
              margin: 0,
              fontSize: 13,
              color: isDark ? '#94a3b8' : '#64748b',
              lineHeight: 1.5
            }}>
              {submittedInquiry
                ? 'Tim studio kami telah mencatat data brief Anda. Lanjutkan diskusi langsung via WhatsApp.'
                : 'Ceritakan visi, target, dan kebutuhan visual brand Anda untuk mendapatkan estimasi dan konsep terarah.'}
            </p>
          </div>

          <button
            onClick={handleClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#94a3b8' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{
          padding: '24px 28px',
          overflowY: 'auto',
          flex: 1
        }}>
          {submittedInquiry ? (
            /* ── SUCCESS STATE ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                padding: '24px 20px',
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(14,165,233,0.08) 100%)',
                border: '1.5px solid rgba(16,185,129,0.3)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.35)'
                }}>
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981' }}>
                    Nomor Referensi Brief
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4,
                    fontSize: 22,
                    fontWeight: 900,
                    fontFamily: "'Outfit', sans-serif",
                    color: isDark ? '#ffffff' : '#0f172a'
                  }}>
                    <span>{submittedInquiry.id}</span>
                    <button
                      onClick={handleCopyInquiryId}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 100,
                        border: 'none',
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {copiedId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedId ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rincian Ringkas Brief */}
              <div style={{
                padding: 16,
                borderRadius: 16,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 13
              }}>
                <div><strong>Klien / Brand:</strong> {submittedInquiry.clientName} {submittedInquiry.brandName ? `(${submittedInquiry.brandName})` : ''}</div>
                <div><strong>Layanan:</strong> {submittedInquiry.serviceType}</div>
                <div><strong>Estimasi Budget:</strong> {submittedInquiry.budgetRange}</div>
                {submittedInquiry.deadline && <div><strong>Target Selesai:</strong> {submittedInquiry.deadline}</div>}
                <div><strong>Visi / Kebutuhan:</strong> <span style={{ fontStyle: 'italic', color: isDark ? '#cbd5e1' : '#475569' }}>"{submittedInquiry.goals}"</span></div>
              </div>

              {/* WhatsApp Action Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  style={{
                    padding: '14px 24px',
                    borderRadius: 14,
                    border: 'none',
                    background: '#25d366',
                    color: '#ffffff',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    fontWeight: 850,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 6px 20px rgba(37,211,102,0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Kirim & Mulai Diskusi di WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    window.location.href = `/drop/${submittedInquiry.id}`;
                  }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 14,
                    border: '1px solid rgba(14, 165, 233, 0.35)',
                    background: 'rgba(14, 165, 233, 0.12)',
                    color: '#0ea5e9',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Upload size={16} />
                  <span>Kirim Berkas / Drop Materi Proyek</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: '11px 20px',
                    borderRadius: 14,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                    background: 'transparent',
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tutup Jendela
                </button>
              </div>
            </div>
          ) : (
            /* ── FORM STATE ── */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Row 1: Nama & Brand */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 }}>
                    Nama Anda *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px 10px 36px',
                        borderRadius: 12,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: 13.5,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 }}>
                    Nama Brand / Bisnis (Opsional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Contoh: Kopi Skena / TechVentures"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px 10px 36px',
                        borderRadius: 12,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: 13.5,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: WhatsApp & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 }}>
                    Nomor WhatsApp *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="tel"
                      required
                      placeholder="08123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px 10px 36px',
                        borderRadius: 12,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: 13.5,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 }}>
                    Email (Opsional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      placeholder="halo@brandanda.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px 10px 36px',
                        borderRadius: 12,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: 13.5,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Service Type Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 8 }}>
                  Lingkup Layanan yang Dibutuhkan *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 8
                }}>
                  {DESIGN_SERVICE_OPTIONS.map((srv) => {
                    const isSelected = serviceType === srv;
                    return (
                      <div
                        key={srv}
                        onClick={() => {
                          haptic.light();
                          setServiceType(srv);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: `1.5px solid ${isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')}`,
                          background: isSelected
                            ? `${accentColor}18`
                            : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                          color: isSelected ? accentColor : (isDark ? '#cbd5e1' : '#475569'),
                          fontSize: 12,
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: `1.5px solid ${isSelected ? accentColor : '#94a3b8'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />}
                        </div>
                        <span style={{ lineHeight: 1.3 }}>{srv}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Goals / Challenge */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 }}>
                  Visi, Tujuan & Tantangan Desain *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ceritakan latar belakang brand Anda, target audiens, dan pesan utama yang ingin disampaikan lewat desain ini..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: 13,
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Budget Range & Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 }}>
                    Estimasi Anggaran / Budget
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                      background: isDark ? '#1a1b26' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  >
                    {BUDGET_RANGES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 }}>
                    Target Selesai / Deadline (Opsional)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                      background: isDark ? '#1a1b26' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Moodboard / Reference Link */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: isDark ? '#cbd5e1' : '#334155', marginBottom: 6 }}>
                  Link Referensi Visual / Moodboard (Opsional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Link2 size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="url"
                    placeholder="https://pinterest.com/... atau link Figma / Google Drive"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px 10px 36px',
                      borderRadius: 12,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: 6,
                  padding: '13px 24px',
                  borderRadius: 14,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 15,
                  fontWeight: 850,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  boxShadow: `0 4px 16px ${accentColor}40`,
                  transition: 'all 0.15s ease'
                }}
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Mengirim Brief...' : 'Kirim Brief & Dapatkan Konsultasi'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudioInquiryModal;
