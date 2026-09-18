import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Clock, CheckCircle, Package, ArrowRight, ExternalLink } from 'lucide-react';
import { useClientAuth } from '../../context/ClientAuthContext';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { ClientOrder, getClientOrders } from '../../services/clientAuth';
import { useNavigate } from 'react-router-dom';

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const ClientOrdersModal: React.FC = () => {
  const { client, isOrdersModalOpen, closeOrdersModal } = useClientAuth();
  const { isDark } = useWebsiteTheme();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOrdersModalOpen && client) {
      setLoading(true);
      getClientOrders(client.id)
        .then((res) => setOrders(res))
        .finally(() => setLoading(false));
    }
  }, [isOrdersModalOpen, client]);

  if (!isOrdersModalOpen || !client) return null;

  const bgModal = isDark ? '#13141f' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'cmsFadeIn 0.25s ease',
      }}
      onClick={closeOrdersModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          background: bgModal,
          borderRadius: 24,
          border: `1px solid ${borderCol}`,
          padding: '28px 24px',
          boxShadow: isDark
            ? '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.2)'
            : '0 24px 60px rgba(0,0,0,0.12)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          animation: 'cmsPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeOrdersModal}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `1px solid ${borderCol}`,
            background: 'transparent',
            color: textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: textPrimary, margin: '0 0 2px' }}>
              Riwayat Pesanan Saya
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: textMuted, margin: 0 }}>
              Daftar produk & layanan yang pernah Anda pesan
            </p>
          </div>
        </div>

        {/* Orders List Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: textMuted, fontSize: 13 }}>
              Memuat riwayat pesanan...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 16px', background: cardBg, borderRadius: 18, border: `1.5px dashed ${borderCol}` }}>
              <Package size={42} style={{ color: textMuted, opacity: 0.5, marginBottom: 12, margin: '0 auto 12px' }} />
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textPrimary, margin: '0 0 4px' }}>
                Belum Ada Pesanan
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: textMuted, margin: '0 0 18px', maxWidth: 320, lineHeight: 1.5 }}>
                Anda belum melakukan pemesanan produk atau layanan.
              </p>
              <button
                onClick={() => { closeOrdersModal(); navigate('/katalog'); }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--cms-accent, #7c3aed)',
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
                <span>Jelajahi Katalog</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                style={{
                  background: cardBg,
                  borderRadius: 16,
                  border: `1px solid ${borderCol}`,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, color: textPrimary }}>
                      {o.productName}
                    </div>
                    {o.variantName && (
                      <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                        Varian: <span style={{ fontWeight: 600, color: textPrimary }}>{o.variantName}</span>
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 100,
                      background: o.status === 'Selesai' ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)',
                      color: o.status === 'Selesai' ? '#10b981' : 'var(--cms-accent, #7c3aed)',
                    }}
                  >
                    {o.status || 'Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTop: `1px solid ${borderCol}`, fontSize: 12 }}>
                  <div style={{ color: textMuted }}>
                    {new Date(o.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {o.quantity}x
                  </div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>
                    {formatRp(o.total)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientOrdersModal;
