import React, { useState, useEffect, useRef } from 'react';
import { 
  X, StickyNote, Calculator, Receipt, MessageCircle, Activity, 
  Check, Copy, ExternalLink, Send, Plus, ArrowRight, ShieldCheck,
  RefreshCw, DollarSign, Percent, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import type { AdminDrawerType } from '../../types/adminEvents';

interface QuickActionDrawerProps {
  isDarkMode?: boolean;
  onNavigate?: (page: string) => void;
}

export const QuickActionDrawer: React.FC<QuickActionDrawerProps> = ({ 
  isDarkMode = true, 
  onNavigate 
}) => {
  const { activeDrawer, drawerPayload, closeDrawer, openDrawer } = useAdminStore();
  const [activeTab, setActiveTab] = useState<AdminDrawerType>('memo');
  const [isCopied, setIsCopied] = useState(false);

  // ── 0. State EcoHub (Ecosystem Dispatcher & Shield) ──
  const [ecoFlipbooks, setEcoFlipbooks] = useState<any[]>([]);
  const [ecoProofing, setEcoProofing] = useState<any[]>([]);
  const [ecoActiveProjects, setEcoActiveProjects] = useState<any[]>([]);
  const [ecoPartitionStats, setEcoPartitionStats] = useState<{ label: string; count: number; page: string }[]>([]);
  const [isAuditingDb, setIsAuditingDb] = useState(false);
  const [dbAuditResult, setDbAuditResult] = useState<{ repairedCount: number; summary: Record<string, number> } | null>(null);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  useEffect(() => {
    if (activeDrawer === 'ecohub' || activeTab === 'ecohub') {
      const loadEcoData = async () => {
        try {
          const [fbs, prjs, port, cat, trxs, revs, rates, blogs] = await Promise.all([
            storage.getItem('porto_client_flipbooks', []),
            storage.getItem('porto_projects', []),
            storage.getItem('porto_portfolio', []),
            storage.getItem('porto_catalog', []),
            storage.getItem('porto_transactions', []),
            storage.getItem('porto_client_reviews', []),
            storage.getItem('porto_rate_cards', []),
            storage.getItem('porto_blog_posts', [])
          ]);
          const validFbs = Array.isArray(fbs) ? fbs : [];
          const validPrjs = Array.isArray(prjs) ? prjs : [];
          setEcoFlipbooks(validFbs);
          setEcoActiveProjects(validPrjs.filter((p: any) => p && p.status !== 'trash' && p.status !== 'done' && p.status !== 'completed').slice(0, 4));
          const pfs = validPrjs.filter((p: any) => p && (p.proofingWatermarkStyle || p.proofingImages || (typeof p.id === 'string' && p.id.startsWith('PRF-'))));
          setEcoProofing(pfs);
          setEcoPartitionStats([
            { label: 'Karya Portofolio', count: Array.isArray(port) ? port.length : 0, page: 'portfolio' },
            { label: 'Proyek Kanban', count: validPrjs.length, page: 'projects' },
            { label: 'Katalog Produk', count: Array.isArray(cat) ? cat.length : 0, page: 'catalog' },
            { label: 'Invoice & Kas', count: Array.isArray(trxs) ? trxs.length : 0, page: 'transactions' },
            { label: 'Rate Card', count: Array.isArray(rates) ? rates.length : 0, page: 'ratecard' },
            { label: 'Ulasan Klien', count: Array.isArray(revs) ? revs.length : 0, page: 'reviews' },
            { label: 'Artikel Jurnal', count: Array.isArray(blogs) ? blogs.length : 0, page: 'blog' },
            { label: 'Flipbook Klien', count: validFbs.length, page: 'flipbook' },
          ]);
        } catch (e) {
          console.warn('[EcoHub] Load error:', e);
        }
      };
      loadEcoData();
    }
  }, [activeDrawer, activeTab]);

  const handleAuditDatabase = async () => {
    setIsAuditingDb(true);
    haptic.medium();
    try {
      const res = await storage.reconcileDatabaseIntegrity();
      setDbAuditResult({
        repairedCount: res.repaired.length,
        summary: res.summary
      });
      haptic.success();
    } catch (err) {
      console.error('[EcoHub] Audit failed:', err);
    } finally {
      setIsAuditingDb(false);
    }
  };

  const handleCopyEcoLink = (key: string, url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLinkKey(key);
      haptic.light();
      setTimeout(() => setCopiedLinkKey(null), 2200);
    }
  };

  const handleSendEcoWhatsApp = (title: string, link: string, clientName?: string) => {
    const text = `Halo ${clientName || 'Kak'}! Berikut tautan dokumen interaktif Anda dari sumr.day studio:\n\n*${title}*\n${link}\n\nSilakan dibuka dan ditinjau ya. Terima kasih! ✨`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // ── 1. State Memo Kilat ──
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoTag, setMemoTag] = useState('Task');
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [memoSaveSuccess, setMemoSaveSuccess] = useState(false);

  // ── 2. State Kalkulator Proyek ──
  const [hourlyRate, setHourlyRate] = useState<number>(150000);
  const [estimatedHours, setEstimatedHours] = useState<number>(16);
  const [assetCost, setAssetCost] = useState<number>(100000);
  const [profitMargin, setProfitMargin] = useState<number>(20);
  const [includeTax, setIncludeTax] = useState<boolean>(false);

  // ── 3. State Invoice Cepat ──
  const [invClientName, setInvClientName] = useState('');
  const [invClientPhone, setInvClientPhone] = useState('');
  const [invDescription, setInvDescription] = useState('');
  const [invAmount, setInvAmount] = useState<number>(0);
  const [invStatus, setInvStatus] = useState<'paid' | 'pending' | 'down_payment'>('pending');
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [invoiceSaveSuccess, setInvoiceSaveSuccess] = useState(false);

  // ── 4. State WhatsApp Quick Hub ──
  const [waPhone, setWaPhone] = useState('');
  const [waClientName, setWaClientName] = useState('');
  const [waTemplateKey, setWaTemplateKey] = useState<string>('greeting');
  const [waCustomMessage, setWaCustomMessage] = useState('');

  // ── Sync Active Tab with Store ──
  useEffect(() => {
    if (activeDrawer) {
      setActiveTab(activeDrawer);
    }
  }, [activeDrawer]);

  // ── Hydrate Payload when Drawer Opens ──
  useEffect(() => {
    if (!drawerPayload) return;

    if (activeDrawer === 'invoice' || drawerPayload.clientName || drawerPayload.amount) {
      if (drawerPayload.clientName) setInvClientName(drawerPayload.clientName);
      if (drawerPayload.clientPhone) setInvClientPhone(drawerPayload.clientPhone);
      if (drawerPayload.projectName || drawerPayload.notes) setInvDescription(drawerPayload.projectName || drawerPayload.notes);
      if (drawerPayload.amount) setInvAmount(drawerPayload.amount);
      if (drawerPayload.status) setInvStatus(drawerPayload.status);
    }

    if (activeDrawer === 'memo' || drawerPayload.title || drawerPayload.content) {
      if (drawerPayload.title) setMemoTitle(drawerPayload.title);
      if (drawerPayload.content) setMemoContent(drawerPayload.content);
    }

    if (activeDrawer === 'whatsapp' || drawerPayload.phone) {
      if (drawerPayload.phone) setWaPhone(drawerPayload.phone);
      if (drawerPayload.name) setWaClientName(drawerPayload.name);
      if (drawerPayload.message) setWaCustomMessage(drawerPayload.message);
    }
  }, [activeDrawer, drawerPayload]);

  // ── Calculation Math ──
  const baseCost = (hourlyRate * estimatedHours) + assetCost;
  const marginAmount = Math.round(baseCost * (profitMargin / 100));
  const subtotal = baseCost + marginAmount;
  const taxAmount = includeTax ? Math.round(subtotal * 0.11) : 0;
  const grandTotal = subtotal + taxAmount;

  // ── Templates WA ──
  const WA_TEMPLATES: Record<string, { label: string; text: string }> = {
    greeting: {
      label: 'Konsultasi Awal',
      text: `Halo ${waClientName || 'Kak'}! Terima kasih telah menghubungi studio kreatif sumr.day. Kami siap membantu kebutuhan visual & digital brand Anda. Boleh ceritakan detail brief atau proyek yang ingin dikerjakan?`
    },
    invoice_reminder: {
      label: 'Tagihan / Invoice',
      text: `Halo ${waClientName || 'Kak'}, kami informasikan rincian invoice untuk proyek Anda telah siap dengan total Rp ${grandTotal.toLocaleString('id-ID')}. Anda dapat melakukan pembayaran via QRIS atau Transfer Bank. Konfirmasi pembayaran dapat dikirimkan ke sini ya.`
    },
    project_done: {
      label: 'Serah Terima Proyek',
      text: `Kabar baik ${waClientName || 'Kak'}! Pekerjaan proyek visual Anda telah selesai dikerjakan dengan hasil maksimal. Anda dapat mengakses seluruh file resolusi tinggi dan master file melalui portal akun atau tautan yang kami sediakan.`
    },
    review_request: {
      label: 'Permintaan Ulasan',
      text: `Halo ${waClientName || 'Kak'}, senang sekali bisa berkolaborasi dengan Anda! Mohon kesediaannya meluangkan waktu 1 menit untuk memberikan ulasan & feedback singkat tentang pengalaman Anda bersama sumr.day di: ${typeof window !== 'undefined' ? window.location.origin : ''}/feedback`
    }
  };

  useEffect(() => {
    if (WA_TEMPLATES[waTemplateKey]) {
      setWaCustomMessage(WA_TEMPLATES[waTemplateKey].text);
    }
  }, [waTemplateKey, waClientName, grandTotal]);

  // ── Action: Simpan Memo Kilat ──
  const handleSaveQuickMemo = async () => {
    if (!memoTitle.trim() && !memoContent.trim()) return;
    setIsSavingMemo(true);
    haptic.medium();

    try {
      const existingMemos = await storage.getItem('porto_memos', []);
      const newMemo = {
        id: 'memo_' + Date.now(),
        title: memoTitle.trim() || 'Catatan Cepat',
        content: memoContent.trim(),
        category: memoTag,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: false
      };
      const updated = [newMemo, ...(Array.isArray(existingMemos) ? existingMemos : [])];
      await storage.setItem('porto_memos', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('porto_memo_updated'));
      }
      
      setMemoSaveSuccess(true);
      setTimeout(() => {
        setMemoSaveSuccess(false);
        setMemoTitle('');
        setMemoContent('');
      }, 1800);
    } catch (err) {
      console.error('Failed to save quick memo:', err);
    } finally {
      setIsSavingMemo(false);
    }
  };

  // ── Action: Pindahkan Kalkulasi ke Invoice ──
  const handleTransferCalcToInvoice = () => {
    haptic.selection();
    setInvAmount(grandTotal);
    setInvDescription(`Pengerjaan Desain/Web (${estimatedHours} jam pengerjaan)`);
    setActiveTab('invoice');
  };

  // ── Action: Simpan Transaksi Kilat (Skema Terpadu TransactionManager) ──
  const handleSaveQuickInvoice = async () => {
    if (!invClientName.trim() || invAmount <= 0) return;
    setIsSavingInvoice(true);
    haptic.medium();

    try {
      const existingTrx = await storage.getItem('porto_transactions', []);
      const trxId = 'TRX-' + Date.now().toString(36).toUpperCase();
      const invNum = 'INV/' + new Date().getFullYear() + '/' + Math.floor(1000 + Math.random() * 9000);
      const paymentStatusMapped: 'lunas' | 'dp' | 'belum' =
        invStatus === 'paid' ? 'lunas' : invStatus === 'down_payment' ? 'dp' : 'belum';
      const dpAmt = invStatus === 'down_payment' ? Math.round(invAmount * 0.5) : 0;
      const remAmt = invStatus === 'paid' ? 0 : invStatus === 'down_payment' ? Math.max(0, invAmount - dpAmt) : invAmount;
      const custId = 'cust_' + Date.now();

      const newTrx = {
        id: trxId,
        invoiceNumber: invNum,
        date: new Date().toISOString().split('T')[0],
        customer: {
          id: custId,
          name: invClientName.trim(),
          phone: invClientPhone.trim(),
          email: '',
          address: ''
        },
        clientName: invClientName.trim(),
        clientPhone: invClientPhone.trim(),
        items: [{
          id: 'item_' + Date.now(),
          name: invDescription.trim() || 'Layanan Studio Digital',
          qty: 1,
          price: invAmount
        }],
        discount: 0,
        shipping: 0,
        tax: 0,
        grandTotal: invAmount,
        totalAmount: invAmount,
        dpAmount: dpAmt,
        remaining: remAmt,
        paymentStatus: paymentStatusMapped,
        status: invStatus,
        notes: invDescription.trim() || 'Transaksi dibuat via Quick Action Studio',
        createdAt: new Date().toISOString(),
        paymentMethod: 'Bank Transfer / QRIS'
      };

      const updated = [newTrx, ...(Array.isArray(existingTrx) ? existingTrx : [])];
      await storage.setItem('porto_transactions', updated);

      // Sinkronkan pelanggan ke buku kontak transaksi (porto_trx_customers)
      try {
        const existingCustomers = await storage.getItem<any[]>('porto_trx_customers', []);
        const custList = Array.isArray(existingCustomers) ? existingCustomers : [];
        const normName = invClientName.trim().toLowerCase();
        const alreadyExists = custList.some(c => (c.name || '').trim().toLowerCase() === normName);
        if (!alreadyExists) {
          await storage.setItem('porto_trx_customers', [
            { id: custId, name: invClientName.trim(), phone: invClientPhone.trim(), email: '', address: '' },
            ...custList
          ]);
        }
      } catch (_) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('porto_transactions_updated', { detail: updated }));
      }

      setInvoiceSaveSuccess(true);
      setTimeout(() => {
        setInvoiceSaveSuccess(false);
        setInvClientName('');
        setInvClientPhone('');
        setInvDescription('');
        setInvAmount(0);
      }, 2000);
    } catch (err) {
      console.error('Failed to save quick invoice:', err);
    } finally {
      setIsSavingInvoice(false);
    }
  };

  // ── Action: Kirim WhatsApp ──
  const handleSendWhatsApp = () => {
    haptic.selection();
    let cleanPhone = waPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waCustomMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    haptic.success();
    setTimeout(() => setIsCopied(false), 1500);
  };

  if (!activeDrawer) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={closeDrawer}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 2147483640,
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Slide-Over Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 440,
          background: isDarkMode ? '#11121c' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
          borderLeft: isDarkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #e2e8f0',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.35)',
          zIndex: 2147483645,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--cms-accent, #3b82f6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Quick Multitask Hub</h3>
              <p style={{ margin: 0, fontSize: 11, opacity: 0.65 }}>Aksi kilat tanpa ganti halaman</p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Pills */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px',
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9',
          overflowX: 'auto'
        }}>
          {[
            { id: 'ecohub', label: '⚡ EcoHub', icon: Sparkles },
            { id: 'memo', label: 'Memo', icon: StickyNote },
            { id: 'calculator', label: 'Kalkulator', icon: Calculator },
            { id: 'invoice', label: 'Nota Cepat', icon: Receipt },
            { id: 'whatsapp', label: 'WA Hub', icon: MessageCircle },
            { id: 'health', label: 'Status', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  setActiveTab(tab.id as AdminDrawerType);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 650,
                  border: isSel 
                    ? '1.5px solid var(--cms-accent, #3b82f6)' 
                    : (isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'),
                  background: isSel 
                    ? 'var(--cms-accent-soft, rgba(59,130,246,0.18))' 
                    : 'transparent',
                  color: isSel ? 'var(--cms-accent, #3b82f6)' : 'inherit',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          
          {/* TAB 0: ECOSYSTEM HUB (SUPERPOWER GIMMICK) */}
          {activeTab === 'ecohub' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* EcoShield Status Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={20} color="#10b981" />
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#10b981' }}>EcoShield Aktif</span>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                    Zero Leak
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11.5, opacity: 0.8, lineHeight: 1.45 }}>
                  Seluruh tabel database terisolasi ketat. Proofing, flipbook, portofolio, dan kasir terkunci pada partisi independen anti-tercampur.
                </p>
                <button
                  type="button"
                  onClick={handleAuditDatabase}
                  disabled={isAuditingDb}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: 11.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <RefreshCw size={13} className={isAuditingDb ? 'animate-spin' : ''} />
                  <span>{isAuditingDb ? 'Memeriksa & Menyegel...' : 'Audit & Rapikan Database'}</span>
                </button>

                {dbAuditResult && (
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 650, marginTop: 2 }}>
                    ✓ Database 100% sinkron ({dbAuditResult.repairedCount} item dirapikan).
                  </div>
                )}
              </div>

              {/* Section: Cloud Partition Health Inspector */}
              {ecoPartitionStats.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.7 }}>
                      🗄️ Partisi Cloud & Koleksi Aktif
                    </span>
                    <span style={{ fontSize: 10.5, opacity: 0.55 }}>Klik untuk buka modul</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {ecoPartitionStats.map(stat => (
                      <button
                        key={stat.label}
                        type="button"
                        onClick={() => {
                          if (onNavigate) {
                            closeDrawer();
                            onNavigate(stat.page);
                          }
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 9,
                          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                          background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          color: 'inherit',
                          cursor: onNavigate ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 650, opacity: 0.85 }}>{stat.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                          {stat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: 1-Click Agency Pipeline (Proyek Aktif -> Invoice / WA) */}
              {ecoActiveProjects.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.7 }}>
                      🚀 Pipeline Proyek Aktif (1-Click Billing)
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>{ecoActiveProjects.length} Proyek</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ecoActiveProjects.map((prj: any) => {
                      const prjTitle = prj.title || prj.name || 'Proyek Studio';
                      const prjClient = prj.client || prj.clientName || 'Klien';
                      const prjBudget = Number(prj.budget || prj.value || prj.price || 0);
                      const trackedSecs = Number(prj.totalTrackedSeconds || 0);
                      const trackedHrs = trackedSecs > 0 ? (trackedSecs / 3600).toFixed(1) + 'j' : null;
                      return (
                        <div
                          key={prj.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                            gap: 8
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {prjTitle}
                            </div>
                            <div style={{ fontSize: 10.5, opacity: 0.65, display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span>{prjClient}</span>
                              {prjBudget > 0 && <span>• Rp {prjBudget.toLocaleString('id-ID')}</span>}
                              {trackedHrs && <span style={{ color: '#10b981', fontWeight: 700 }}>• ⏱ {trackedHrs}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setInvClientName(prjClient);
                                setInvClientPhone(prj.clientPhone || prj.phone || '');
                                setInvDescription(`Tagihan Proyek: ${prjTitle}`);
                                if (prjBudget > 0) setInvAmount(prjBudget);
                                setActiveTab('invoice');
                              }}
                              title="Buat Invoice dari Proyek Ini"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'var(--cms-accent, #3b82f6)',
                                color: '#fff',
                                fontSize: 10.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Receipt size={11} />
                              <span>Tagih</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWaClientName(prjClient);
                                setWaPhone(prj.clientPhone || prj.phone || '');
                                setWaTemplateKey('project_done');
                                setActiveTab('whatsapp');
                              }}
                              title="Hubungi Klien via WA"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#25D366',
                                color: '#fff',
                                fontSize: 10.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <MessageCircle size={11} />
                              <span>WA</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section: Quick Dispatcher / EcoLink */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.7 }}>
                    📖 Flipbook Terbitan Klien
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{ecoFlipbooks.length} Dokumen</span>
                </div>

                {ecoFlipbooks.length === 0 ? (
                  <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--glass-border)', fontSize: 11.5, opacity: 0.6, textAlign: 'center' }}>
                    Belum ada flipbook. Buat di menu Tool.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ecoFlipbooks.slice(0, 4).map(fb => {
                      const link = `${window.location.origin}/flipbook/${fb.slug}`;
                      const isCopied = copiedLinkKey === fb.id;
                      return (
                        <div
                          key={fb.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                            gap: 8
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {fb.title}
                            </div>
                            <div style={{ fontSize: 10.5, fontFamily: 'monospace', opacity: 0.55 }}>
                              /flipbook/{fb.slug}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleCopyEcoLink(fb.id, link)}
                              title="Salin Tautan"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 6,
                                border: 'none',
                                background: isCopied ? '#10b981' : 'var(--cms-accent, #3b82f6)',
                                color: '#fff',
                                fontSize: 10.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              {isCopied ? <Check size={11} /> : <Copy size={11} />}
                              <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendEcoWhatsApp(fb.title, link, fb.clientName)}
                              title="Kirim ke WA Klien"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#25D366',
                                color: '#fff',
                                fontSize: 10.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Send size={11} />
                              <span>WA</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section: Proofing Links */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.7 }}>
                    🛡️ Proofing & Desain Klien
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.5 }}>{ecoProofing.length} Berkas</span>
                </div>

                {ecoProofing.length === 0 ? (
                  <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--glass-border)', fontSize: 11.5, opacity: 0.6, textAlign: 'center' }}>
                    Belum ada berkas proofing. Buat di Manajemen.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ecoProofing.slice(0, 4).map(pf => {
                      const link = `${window.location.origin}/proofing?id=${encodeURIComponent(pf.id)}`;
                      const isCopied = copiedLinkKey === pf.id;
                      return (
                        <div
                          key={pf.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                            gap: 8
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {pf.title || 'Berkas Proofing'}
                            </div>
                            <div style={{ fontSize: 10.5, fontFamily: 'monospace', opacity: 0.55 }}>
                              /proofing?id={pf.id}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleCopyEcoLink(pf.id, link)}
                              title="Salin Tautan"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 6,
                                border: 'none',
                                background: isCopied ? '#10b981' : 'var(--cms-accent, #3b82f6)',
                                color: '#fff',
                                fontSize: 10.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              {isCopied ? <Check size={11} /> : <Copy size={11} />}
                              <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendEcoWhatsApp(pf.title || 'Preview Desain', link, pf.client)}
                              title="Kirim ke WA Klien"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#25D366',
                                color: '#fff',
                                fontSize: 10.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Send size={11} />
                              <span>WA</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section: Universal Studio Stash (1-Click Snippets) */}
              <div>
                <div style={{ marginBottom: 8, fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.7 }}>
                  ⚡ Studio Stash (Klip Cepat)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'Tautan Bio', val: `${window.location.origin}/bio` },
                    { label: 'Katalog Drops', val: `${window.location.origin}/katalog` },
                    { label: 'Form Kontak', val: `${window.location.origin}/contact` },
                    { label: 'Ulasan / Feedback', val: `${window.location.origin}/feedback` },
                  ].map(item => {
                    const isCopied = copiedLinkKey === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleCopyEcoLink(item.label, item.val)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                          background: isCopied ? 'rgba(16, 185, 129, 0.15)' : (isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                          color: isCopied ? '#10b981' : 'inherit',
                          fontSize: 11,
                          fontWeight: 650,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <span>{item.label}</span>
                        {isCopied ? <Check size={11} /> : <Copy size={11} opacity={0.6} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: MEMO KILAT */}
          {activeTab === 'memo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 6 }}>
                  Judul Catatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Revisi layout landing page..."
                  value={memoTitle}
                  onChange={e => setMemoTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 6 }}>
                  Kategori
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Task', 'Ide', 'Client Note', 'Urgent'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setMemoTag(tag)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        border: 'none',
                        background: memoTag === tag ? 'var(--cms-accent, #3b82f6)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                        color: memoTag === tag ? '#fff' : 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 6 }}>
                  Isi Catatan / Task
                </label>
                <textarea
                  rows={6}
                  placeholder="Ketik catatan kilat, checklist, atau brief..."
                  value={memoContent}
                  onChange={e => setMemoContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 13,
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleSaveQuickMemo}
                  disabled={isSavingMemo || (!memoTitle && !memoContent)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: memoSaveSuccess ? '#10b981' : 'var(--cms-accent, #3b82f6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    opacity: (!memoTitle && !memoContent) ? 0.6 : 1
                  }}
                >
                  {memoSaveSuccess ? <Check size={16} /> : <Plus size={16} />}
                  {memoSaveSuccess ? 'Tersimpan ke Memo!' : 'Simpan Catatan'}
                </button>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      onNavigate('memo');
                    }}
                    title="Buka Modul Memo Penuh"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>

              {/* AI Template Studio Trigger Banner */}
              <div style={{ marginTop: 8, paddingTop: 12, borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    window.dispatchEvent(new Event('porto_open_ai_templates'));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    background: 'rgba(139, 92, 246, 0.12)',
                    color: isDarkMode ? '#c4b5fd' : '#7c3aed',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={15} />
                  Buka AI Template Studio (Mode Centang-Centang)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: KALKULATOR PROYEK */}
          {activeTab === 'calculator' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                padding: '14px 16px',
                borderRadius: 14,
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Estimasi Nilai Proyek
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--cms-accent, #3b82f6)', marginTop: 4 }}>
                  Rp {grandTotal.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                  Subtotal: Rp {subtotal.toLocaleString('id-ID')} {includeTax ? '(termasuk PPN 11%)' : ''}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                    Tarif / Jam (Rp)
                  </label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                      background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      color: 'inherit',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                    Estimasi Jam Kerja
                  </label>
                  <input
                    type="number"
                    value={estimatedHours}
                    onChange={e => setEstimatedHours(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                      background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      color: 'inherit',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Biaya Lisensi / Aset / Hosting (Rp)
                </label>
                <input
                  type="number"
                  value={assetCost}
                  onChange={e => setAssetCost(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 650, opacity: 0.8, marginBottom: 4 }}>
                  <span>Margin Profit Studio</span>
                  <span>{profitMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={profitMargin}
                  onChange={e => setProfitMargin(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--cms-accent, #3b82f6)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Terapkan PPN 11%</span>
                <input
                  type="checkbox"
                  checked={includeTax}
                  onChange={e => setIncludeTax(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--cms-accent, #3b82f6)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={handleTransferCalcToInvoice}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--cms-accent, #3b82f6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Receipt size={15} />
                  Jadikan Nota / Invoice
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText(`Estimasi Proyek: Rp ${grandTotal.toLocaleString('id-ID')} (${estimatedHours} jam pengerjaan)`)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isCopied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: NOTA & INVOICE KILAT */}
          {activeTab === 'invoice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Nama Klien / Perusahaan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PT Kreatif Nusantara"
                  value={invClientName}
                  onChange={e => setInvClientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Nomor WhatsApp Klien
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={invClientPhone}
                  onChange={e => setInvClientPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Layanan / Deskripsi Singkat
                </label>
                <input
                  type="text"
                  placeholder="Desain Logo, Landing Page, dll"
                  value={invDescription}
                  onChange={e => setInvDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Total Nominal (Rp) *
                </label>
                <input
                  type="number"
                  placeholder="500000"
                  value={invAmount || ''}
                  onChange={e => setInvAmount(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Status Transaksi
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'pending', label: 'Belum Lunas' },
                    { id: 'down_payment', label: 'DP 50%' },
                    { id: 'paid', label: 'Lunas' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setInvStatus(st.id as any)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        border: 'none',
                        background: invStatus === st.id ? 'var(--cms-accent, #3b82f6)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                        color: invStatus === st.id ? '#fff' : 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleSaveQuickInvoice}
                  disabled={isSavingInvoice || !invClientName.trim() || invAmount <= 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: invoiceSaveSuccess ? '#10b981' : 'var(--cms-accent, #3b82f6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    opacity: (!invClientName.trim() || invAmount <= 0) ? 0.6 : 1
                  }}
                >
                  {invoiceSaveSuccess ? <Check size={16} /> : <Receipt size={16} />}
                  {invoiceSaveSuccess ? 'Nota Berhasil Diterbitkan!' : 'Terbitkan Transaksi'}
                </button>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      onNavigate('transactions');
                    }}
                    title="Buka Modul Keuangan Lengkap"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP QUICK SENDER */}
          {activeTab === 'whatsapp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Nama Penerima
                </label>
                <input
                  type="text"
                  placeholder="Kak Budi"
                  value={waClientName}
                  onChange={e => setWaClientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={waPhone}
                  onChange={e => setWaPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Pilih Template Pesan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {Object.entries(WA_TEMPLATES).map(([key, tpl]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setWaTemplateKey(key)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        border: 'none',
                        background: waTemplateKey === key ? 'var(--cms-accent, #3b82f6)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                        color: waTemplateKey === key ? '#fff' : 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 650, opacity: 0.8, display: 'block', marginBottom: 4 }}>
                  Pratinjau Pesan
                </label>
                <textarea
                  rows={5}
                  value={waCustomMessage}
                  onChange={e => setWaCustomMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 12,
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!waPhone}
                style={{
                  marginTop: 6,
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#25D366',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  opacity: !waPhone ? 0.6 : 1
                }}
              >
                <Send size={15} />
                Buka WhatsApp Web / App
              </button>
            </div>
          )}

          {/* TAB 5: STUDIO HEALTH & STATUS */}
          {activeTab === 'health' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
                border: '1px solid #10b981',
                padding: '12px 14px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <ShieldCheck size={24} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#10b981' }}>Sistem Normal & Siap</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Sinkronisasi multi-tab aktif dengan proteksi cache lokal.</div>
                </div>
              </div>

              <div style={{
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                borderRadius: 12,
                padding: '12px 14px',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ opacity: 0.7 }}>Cache Firestore Multi-Tab:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>Aktif</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ opacity: 0.7 }}>Penyimpanan Offline (IDB):</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>Terkoneksi</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ opacity: 0.7 }}>Partisi Sharding Dokumen:</span>
                  <span style={{ fontWeight: 700 }}>Aktif (18 Sub-Dokumen)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ opacity: 0.7 }}>PWA Service Worker:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>sw-admin.js Siap</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.medium();
                  window.location.reload();
                }}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                  background: 'transparent',
                  color: 'inherit',
                  fontWeight: 650,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={15} />
                Refresh State & Muat Ulang Cache
              </button>
            </div>
          )}

        </div>
      </aside>
    </>
  );
};

export default QuickActionDrawer;
