import React, { useState, useEffect } from 'react';
import {
  X, ShoppingBag, Clock, CheckCircle2, Package, ArrowRight,
  Search, Download, MessageSquare, ChevronDown,
  ChevronUp, ShieldCheck, FileText, Layers, Sparkles, Send,
  Check, RefreshCw, UserCheck, FolderKanban, Lock
} from 'lucide-react';
import { useClientAuth } from '../../context/ClientAuthContext';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { ClientOrder, getClientOrders, lookupClientOrder } from '../../services/clientAuth';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../utils/storage';

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

// 5-Step Project Lifecycle Milestones
interface MilestoneStep {
  step: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const MILESTONE_STEPS: MilestoneStep[] = [
  { step: 1, label: 'Order & Brief Diterima', sublabel: 'Data pesanan masuk ke antrean studio', icon: FileText },
  { step: 2, label: 'Verifikasi Pembayaran', sublabel: 'Konfirmasi DP / pelunasan transaksi', icon: ShieldCheck },
  { step: 3, label: 'Pengerjaan Warm Tech', sublabel: 'Proses desain, layout & koding interaktif', icon: Layers },
  { step: 4, label: 'Review & QA Internal', sublabel: 'Pengujian kualitas & penyesuaian detail', icon: Sparkles },
  { step: 5, label: 'Serah Terima & Selesai', sublabel: 'Aset siap unduh / tautan web resmi live', icon: CheckCircle2 }
];

export const ClientOrdersModal: React.FC = () => {
  const { client, isOrdersModalOpen, closeOrdersModal, openAuthModal } = useClientAuth();
  const { isDark } = useWebsiteTheme();
  const navigate = useNavigate();

  // Mode: 'my-orders' (for logged in) or 'lookup' (for guest or quick search)
  const [activeTab, setActiveTab] = useState<'my-orders' | 'lookup'>(client ? 'my-orders' : 'lookup');

  // Data state
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Guest / Quick Lookup State
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<ClientOrder[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('081234567890');

  // Load business whatsapp for consultation
  useEffect(() => {
    if (client && isOrdersModalOpen) {
      closeOrdersModal();
      navigate('/akun?tab=orders');
    }
  }, [client, isOrdersModalOpen, closeOrdersModal, navigate]);

  useEffect(() => {
    storage.getItem('porto_business_profile', null).then((prof: any) => {
      if (prof?.whatsapp) setWhatsappNumber(prof.whatsapp.replace(/\D/g, ''));
    }).catch(() => { });
  }, []);

  // Listen to remote open events with query
  useEffect(() => {
    const handleTrackerOpen = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.query) {
        setSearchQuery(detail.query);
        setActiveTab('lookup');
        handlePerformLookup(detail.query);
      }
    };
    window.addEventListener('porto_open_order_tracker', handleTrackerOpen);
    return () => window.removeEventListener('porto_open_order_tracker', handleTrackerOpen);
  }, []);

  // Automatically switch tab if client logs in or logs out
  useEffect(() => {
    if (client) {
      setActiveTab('my-orders');
    } else {
      setActiveTab('lookup');
    }
  }, [client]);

  // Load orders for logged-in client
  useEffect(() => {
    if (isOrdersModalOpen && client) {
      setLoading(true);
      getClientOrders(client.id)
        .then((res) => {
          setOrders(res);
          if (res.length > 0 && !expandedOrderId) {
            setExpandedOrderId(res[0].id);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOrdersModalOpen, client]);

  // Handle Lookup
  const handlePerformLookup = async (qString?: string) => {
    const term = (qString ?? searchQuery).trim();
    if (!term) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const found = await lookupClientOrder(term);
      setLookupResults(found);
      if (found.length > 0) {
        setExpandedOrderId(found[0].id);
      }
    } catch (e) {
      setLookupResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOrdersModalOpen) return null;

  // Determine which step an order is currently at (1 to 5)
  const getOrderStep = (o: ClientOrder): number => {
    if (o.status === 'Selesai') return 5;
    if (o.status === 'Diproses') return 3;
    if (o.status === 'Pending') {
      return o.paymentMethod?.toLowerCase().includes('lunas') ? 2 : 1;
    }
    if (o.status === 'Dibatalkan') return 0;
    return 1;
  };

  // Chat consultation about an order
  const handleInquireViaChat = (order: ClientOrder) => {
    closeOrdersModal();
    window.dispatchEvent(
      new CustomEvent('porto_open_chat', {
        detail: {
          service: order.productName,
          message: `Halo sumr.day Studio, saya ingin menanyakan status pengerjaan pesanan saya:\n- ID Pesanan: #${order.id}\n- Produk: ${order.productName}\n- Status: ${order.status}`,
        },
      })
    );
  };

  const handleInquireViaWA = (order: ClientOrder) => {
    const text = encodeURIComponent(
      `Halo sumr.day Studio, saya ingin menanyakan update proyek pesanan #${order.id} (${order.productName}). Mohon info progresnya ya kak!`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleResendOrderWA = (order: ClientOrder) => {
    const rawWa = (whatsappNumber || '6281234567890').toString().replace(/\D/g, '');
    const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa;
    const text = encodeURIComponent(
      `Halo sumr.day team! Saya ingin mengonfirmasi / melanjutkan pesanan saya:\n\n` +
      `*NOMOR PESANAN:* #${order.id}\n` +
      `*Nama:* ${order.clientName || client?.name || '-'}\n` +
      `*Produk:* ${order.productName}${order.variantName ? ` (${order.variantName})` : ''}\n` +
      `*Total Tagihan:* ${formatRp(order.total)}\n` +
      `*Metode Pembayaran:* ${order.paymentMethod || 'Transfer Bank'}\n\n` +
      `Mohon info verifikasi dan kelanjutan pesanan saya ya min. Terima kasih!`
    );
    window.open(`https://wa.me/${cleanWa}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handlePrintInvoice = (order: ClientOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isPaid = order.status === 'Selesai' || order.paymentStatus === 'lunas';
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${order.id} - sumr.day Studio</title>
        <style>
          html, body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            padding: 40px; 
            color: #1e293b !important; 
            background: #ffffff !important; 
            background-color: #ffffff !important; 
            color-scheme: light !important; 
            max-width: 720px; 
            margin: auto; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .badge-paid { background: #dcfce7; color: #15803d; }
          .badge-pending { background: #fef3c7; color: #b45309; }
          .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          .table th { background: #f8fafc; text-align: left; padding: 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; }
          .table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .total-row { font-size: 16px; font-weight: 800; color: #0f172a; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; text-align: center; }
          @media print { body { padding: 20px; background: #ffffff !important; color: #0f172a !important; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">sumr.day Studio</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Official Digital Invoice</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 700;">INV-${order.id}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Tanggal: ${formatDate(order.createdAt)}</div>
            <div style="margin-top: 6px;">
              <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${isPaid ? 'Lunas / Completed' : 'Pending / Menunggu Pembayaran'}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px;">
          <div>
            <strong style="color: #475569;">Ditagihkan Kepada:</strong><br>
            <div style="font-size: 15px; font-weight: 700; margin-top: 3px;">${order.clientName || 'Pelanggan Terhormat'}</div>
            <div style="color: #64748b;">${order.clientPhone || ''} ${order.clientEmail ? '• ' + order.clientEmail : ''}</div>
          </div>
          <div style="text-align: right;">
            <strong style="color: #475569;">Metode Pembayaran:</strong><br>
            <div style="font-weight: 700; margin-top: 3px;">${order.paymentMethod || 'Transfer Bank'}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>DESKRIPSI ITEM</th>
              <th style="text-align: center;">QTY</th>
              <th style="text-align: right;">HARGA</th>
              <th style="text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${order.productName}</strong>
                ${order.variantName ? `<br><small style="color: #64748b;">Varian: ${order.variantName}</small>` : ''}
              </td>
              <td style="text-align: center;">${order.quantity || 1}</td>
              <td style="text-align: right;">${formatRp(order.price)}</td>
              <td style="text-align: right;">${formatRp(order.total)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-top: 18px;">Total Tagihan:</td>
              <td style="text-align: right; padding-top: 18px;">${formatRp(order.total)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          Terima kasih atas kepercayaan Anda bermitra bersama sumr.day Studio.<br>
          Dokumen ini diterbitkan secara sah oleh sistem sumr.day OS dan tidak memerlukan tanda tangan basah.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  const bgModal = isDark ? '#151824' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';
  const accentColor = 'var(--cms-accent, #7c3aed)';

  const displayedOrders = activeTab === 'my-orders' ? orders : lookupResults;

  return (
    <div
      className="sumr-modal-backdrop"
      style={{
        zIndex: 9999999,
        background: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
      onClick={closeOrdersModal}
    >
      <div
        className="sumr-modal-sheet"
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          background: bgModal,
          borderRadius: 24,
          border: `1px solid ${borderCol}`,
          padding: '24px 20px 24px',
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.8)'
            : '0 24px 60px rgba(15, 23, 42, 0.14)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag/Sheet Handle */}
        <div className="sumr-sheet-handle" />

        {/* Close Button */}
        <button
          onClick={closeOrdersModal}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1px solid ${borderCol}`,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            color: textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = textPrimary}
          onMouseLeave={(e) => e.currentTarget.style.color = textMuted}
        >
          <X size={17} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
              flexShrink: 0
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 19, fontWeight: 850, color: textPrimary, margin: '0 0 3px' }}>
              Portal Akun & Pelacak Proyek Klien
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: textMuted, margin: 0 }}>
              Pantau status pengerjaan karya, verifikasi transaksi & serah terima file
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            padding: 4,
            borderRadius: 14,
            marginBottom: 20,
            gap: 4
          }}
        >
          {client ? (
            <button
              type="button"
              onClick={() => setActiveTab('my-orders')}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === 'my-orders' ? (isDark ? '#232538' : '#ffffff') : 'transparent',
                color: activeTab === 'my-orders' ? textPrimary : textMuted,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: activeTab === 'my-orders' ? 750 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                boxShadow: activeTab === 'my-orders' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={15} color={activeTab === 'my-orders' ? '#7c3aed' : 'currentColor'} />
              <span>Pesanan Saya ({orders.length})</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === 'lookup' ? (isDark ? '#232538' : '#ffffff') : 'transparent',
              color: activeTab === 'lookup' ? textPrimary : textMuted,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: activeTab === 'lookup' ? 750 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              boxShadow: activeTab === 'lookup' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Search size={15} color={activeTab === 'lookup' ? '#7c3aed' : 'currentColor'} />
            <span>Lacak Cepat (ID / WhatsApp)</span>
          </button>
        </div>

        {/* Tab Content: Lookup Form if in 'lookup' tab */}
        {activeTab === 'lookup' && (
          <div style={{ marginBottom: 18 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePerformLookup();
              }}
              style={{
                display: 'flex',
                gap: 8
              }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: textMuted
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik ID Pesanan, No. WhatsApp, atau Email..."
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: 12,
                    border: `1.5px solid ${borderCol}`,
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    color: textPrimary,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                style={{
                  padding: '11px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: (isSearching || !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isSearching || !searchQuery.trim()) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isSearching ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>Lacak</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {!client && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: textMuted }}>
                <span>Sudah punya akun resmi di sumr.day?</span>
                <button
                  type="button"
                  onClick={() => {
                    closeOrdersModal();
                    openAuthModal('login');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: accentColor,
                    fontWeight: 750,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Masuk ke Akun Saya
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders Scrollable List Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: textMuted, fontSize: 13 }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: accentColor }} />
              <div>Memuat data pesanan & progres proyek...</div>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 16px', background: cardBg, borderRadius: 20, border: `1.5px dashed ${borderCol}` }}>
              <Package size={44} style={{ color: textMuted, opacity: 0.5, marginBottom: 12 }} />
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textPrimary, margin: '0 0 6px' }}>
                {activeTab === 'lookup' && hasSearched ? 'Pesanan Tidak Ditemukan' : 'Belum Ada Riwayat Pesanan'}
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: textMuted, margin: '0 0 18px', maxWidth: 360, lineHeight: 1.5 }}>
                {activeTab === 'lookup' && hasSearched
                  ? 'Pastikan ID pesanan, nomor WhatsApp, atau email yang Anda masukkan sudah benar.'
                  : 'Anda belum memiliki pesanan aktif. Temukan template, aset digital, atau konsultasikan proyek Anda.'}
              </p>
              <button
                onClick={() => { closeOrdersModal(); navigate('/katalog'); }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#fff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Jelajahi Katalog Produk</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            displayedOrders.map((o) => {
              const isExpanded = expandedOrderId === o.id;
              const currentStep = getOrderStep(o);

              return (
                <div
                  key={o.id}
                  style={{
                    background: cardBg,
                    borderRadius: 18,
                    border: isExpanded ? `1.5px solid ${accentColor}` : `1px solid ${borderCol}`,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'all 0.2s ease',
                    boxShadow: isExpanded ? '0 8px 24px rgba(124,58,237,0.1)' : 'none'
                  }}
                >
                  {/* Order Top Bar: Title, ID & Status Badge */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: textMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          #{o.id}
                        </span>
                        <span style={{ fontSize: 11, color: textMuted }}>•</span>
                        <span style={{ fontSize: 11.5, color: textMuted }}>
                          {formatDate(o.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15.5, fontWeight: 850, color: textPrimary }}>
                        {o.productName}
                      </div>
                      {o.variantName && (
                        <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                          Varian: <span style={{ fontWeight: 600, color: textPrimary }}>{o.variantName}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 100,
                          background: o.status === 'Selesai'
                            ? 'rgba(16,185,129,0.15)'
                            : o.status === 'Diproses'
                              ? 'rgba(245,158,11,0.15)'
                              : o.status === 'Dibatalkan'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(124,58,237,0.15)',
                          color: o.status === 'Selesai'
                            ? '#10b981'
                            : o.status === 'Diproses'
                              ? '#f59e0b'
                              : o.status === 'Dibatalkan'
                                ? '#ef4444'
                                : accentColor,
                        }}
                      >
                        {o.status || 'Pending'}
                      </span>
                      {isExpanded ? <ChevronUp size={16} color={textMuted} /> : <ChevronDown size={16} color={textMuted} />}
                    </div>
                  </div>

                  {/* Summary Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: `1px solid ${borderCol}`, fontSize: 12.5 }}>
                    <div style={{ color: textMuted }}>
                      {o.paymentMethod || 'Metode Pembayaran'} {o.quantity > 1 ? `(${o.quantity}x)` : ''}
                    </div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 800, color: accentColor }}>
                      {formatRp(o.total)}
                    </div>
                  </div>

                  {/* ── INTERACTIVE 5-STEP PROJECT MILESTONE STEPPER (EXPANDED) ── */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 6,
                        paddingTop: 14,
                        borderTop: `1px dashed ${borderCol}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        animation: 'cmsFadeIn 0.2s ease'
                      }}
                    >
                      {/* Milestone Title */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={13} color={accentColor} />
                          <span>Progres Tahapan Proyek / Pesanan</span>
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 750, color: accentColor }}>
                          Step {Math.min(currentStep, 5)} / 5
                        </span>
                      </div>

                      {/* Stepper Visual Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {MILESTONE_STEPS.map((m) => {
                          const isDone = currentStep > m.step || currentStep === 5;
                          const isCurrent = currentStep === m.step && currentStep !== 5;
                          const StepIcon = m.icon;

                          return (
                            <div
                              key={m.step}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '8px 12px',
                                borderRadius: 12,
                                background: isCurrent
                                  ? (isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.08)')
                                  : isDone
                                    ? (isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)')
                                    : 'transparent',
                                border: isCurrent ? `1px solid ${accentColor}40` : '1px solid transparent'
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: isDone
                                    ? '#10b981'
                                    : isCurrent
                                      ? accentColor
                                      : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                  color: isDone || isCurrent ? '#ffffff' : textMuted,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  flexShrink: 0
                                }}
                              >
                                {isDone ? <Check size={14} /> : <StepIcon size={14} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: isCurrent ? 800 : 700, color: isCurrent ? accentColor : isDone ? textPrimary : textMuted }}>
                                  {m.label}
                                </div>
                                <div style={{ fontSize: 11, color: textMuted }}>
                                  {m.sublabel}
                                </div>
                              </div>
                              {isCurrent && (
                                <span style={{ fontSize: 10.5, fontWeight: 800, color: accentColor, background: `${accentColor}18`, padding: '2px 8px', borderRadius: 6 }}>
                                  Sedang Berjalan
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Notes or instant delivery info */}
                      {o.instantDeliveryMessage && (
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: '#10b981' }}>
                          💡 <strong>Info Pengiriman:</strong> {o.instantDeliveryMessage}
                        </div>
                      )}

                      {/* Action Buttons: Download Asset + Client Drive Vault + Inquire Status */}
                      {(() => {
                        const isPaid = o.status === 'Selesai' || o.paymentStatus === 'lunas';

                        return (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 6 }}>
                            {/* Digital Asset Download Button */}
                            {o.downloadUrl && (
                              isPaid ? (
                                <a
                                  href={o.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  style={{
                                    flex: '1 1 180px',
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    background: '#10b981',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12.5,
                                    fontWeight: 750,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                                  }}
                                >
                                  <Download size={14} />
                                  <span>Unduh Aset Digital ({o.fileFormat || 'File'})</span>
                                </a>
                              ) : (
                                <div
                                  style={{
                                    flex: '1 1 180px',
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                                    color: textMuted,
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    border: `1px dashed ${borderCol}`
                                  }}
                                  title="Tautan unduh otomatis aktif begitu pembayaran diverifikasi lunas oleh admin"
                                >
                                  <Lock size={13} />
                                  <span>Unduh Aset (Menunggu Pembayaran)</span>
                                </div>
                              )
                            )}

                            {/* Figma Staging & Review Link */}
                            {(o.figmaUrl || (o.previewUrl && o.previewUrl.includes('figma.com'))) && (
                              <a
                                href={o.figmaUrl || o.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  flex: '1 1 180px',
                                  padding: '10px 16px',
                                  borderRadius: 12,
                                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                  color: '#ffffff',
                                  textDecoration: 'none',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontSize: 12.5,
                                  fontWeight: 750,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 7,
                                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                                }}
                              >
                                <Sparkles size={14} />
                                <span>Review Desain di Figma</span>
                              </a>
                            )}

                            {/* Google Drive Master Asset Vault (Unlocked upon full payment) */}
                            {o.clientDriveUrl && (
                              isPaid ? (
                                <a
                                  href={o.clientDriveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    flex: '1 1 180px',
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    background: 'var(--cms-accent, #D95629)',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12.5,
                                    fontWeight: 750,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    boxShadow: '0 4px 12px rgba(217,86,41,0.25)'
                                  }}
                                >
                                  <FolderKanban size={14} />
                                  <span>Unduh Master Asset (Drive)</span>
                                </a>
                              ) : (
                                <div
                                  style={{
                                    flex: '1 1 180px',
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                                    color: textMuted,
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    border: `1px dashed ${borderCol}`
                                  }}
                                  title="Master file (.AI, .EPS, .SVG, Brand Guideline) terbuka setelah pelunasan"
                                >
                                  <Lock size={13} />
                                  <span>Master File Terkunci (Perlu Pelunasan)</span>
                                </div>
                              )
                            )}

                            {/* WhatsApp Consultation */}
                            <button
                              type="button"
                              onClick={() => handleInquireViaWA(o)}
                              style={{
                                flex: '1 1 140px',
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: isDark ? 'rgba(37,211,102,0.15)' : 'rgba(37,211,102,0.1)',
                                border: '1px solid rgba(37,211,102,0.3)',
                                color: '#25d366',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12.5,
                                fontWeight: 750,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                              }}
                            >
                              <Send size={13} />
                              <span>Tanya via WhatsApp</span>
                            </button>

                            {/* Resend Order Details to WA (if still pending) */}
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleResendOrderWA(o)}
                                style={{
                                  flex: '1 1 140px',
                                  padding: '10px 14px',
                                  borderRadius: 12,
                                  background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
                                  border: '1px solid rgba(59,130,246,0.25)',
                                  color: '#3b82f6',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontSize: 12.5,
                                  fontWeight: 750,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6
                                }}
                              >
                                <Send size={13} />
                                <span>Kirim Ulang ke WA</span>
                              </button>
                            )}

                            {/* Print / Download Digital Invoice PDF */}
                            <button
                              type="button"
                              onClick={() => handlePrintInvoice(o)}
                              style={{
                                flex: '1 1 140px',
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                                border: `1px solid ${borderCol}`,
                                color: textPrimary,
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12.5,
                                fontWeight: 750,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                              }}
                            >
                              <FileText size={13} />
                              <span>Invoice PDF</span>
                            </button>

                            {/* Live Chat Consultation */}
                            <button
                              type="button"
                              onClick={() => handleInquireViaChat(o)}
                              style={{
                                flex: '1 1 140px',
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
                                border: `1px solid ${accentColor}35`,
                                color: accentColor,
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12.5,
                                fontWeight: 750,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                              }}
                            >
                              <MessageSquare size={13} />
                              <span>Live Chat Studio</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientOrdersModal;
