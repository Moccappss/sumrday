import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Lock, Save, KeyRound, LogOut, CheckCircle2, 
  Shield, Eye, EyeOff, ShoppingBag, Package, Sparkles, Clock, CheckCircle, 
  RefreshCw, ExternalLink, MessageCircle, AlertCircle
} from 'lucide-react';
import { useClientAuth } from '../../context/ClientAuthContext';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { ClientOrder, getClientOrders } from '../../services/clientAuth';
import { haptic } from '../../utils/haptics';

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const AVATAR_PRESETS = [
  'Arif', 'Alex', 'Sarah', 'Budi', 'Rian', 'Maya', 'Jessica', 'David', 'Dian', 'Reza'
];

export const ClientProfileModal: React.FC = () => {
  const { client, isProfileModalOpen, closeProfileModal, updateProfile, changePassword, logout, isLoading } = useClientAuth();
  const { isDark } = useWebsiteTheme();

  const [tab, setTab] = useState<'profile' | 'orders' | 'password'>('profile');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setAvatar(client.avatar || '');
      
      // Load orders
      if (isProfileModalOpen) {
        setOrdersLoading(true);
        getClientOrders(client.id)
          .then((res) => setOrders(res))
          .finally(() => setOrdersLoading(false));
      }
    }
    setStatusMsg(null);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [client, isProfileModalOpen]);

  if (!isProfileModalOpen || !client) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    haptic.light();

    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'Nama lengkap tidak boleh kosong.' });
      return;
    }

    try {
      await updateProfile({ name, phone, avatar });
      setStatusMsg({ type: 'success', text: 'Profil Anda berhasil diperbarui!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal memperbarui profil.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    haptic.light();

    if (!oldPassword || !newPassword) {
      setStatusMsg({ type: 'error', text: 'Mohon isi kata sandi lama dan baru.' });
      return;
    }

    if (newPassword.length < 5) {
      setStatusMsg({ type: 'error', text: 'Kata sandi baru minimal 5 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    try {
      await changePassword(oldPassword, newPassword);
      setStatusMsg({ type: 'success', text: 'Kata sandi akun Anda berhasil diubah!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
    }
  };

  const bgModal = isDark ? '#0c0d14' : '#ffffff';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';
  const accentColor = 'var(--cms-accent, #7c3aed)';

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Diproses').length;
  const completedOrdersCount = orders.filter(o => o.status === 'Selesai').length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'cmsFadeIn 0.25s ease',
      }}
      onClick={closeProfileModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          background: bgModal,
          borderRadius: 28,
          border: `1.5px solid ${borderCol}`,
          padding: '28px 24px',
          boxShadow: isDark
            ? '0 30px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.25)'
            : '0 25px 60px rgba(0,0,0,0.14)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cmsPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeProfileModal}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1px solid ${borderCol}`,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            color: textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10
          }}
        >
          <X size={17} />
        </button>

        {/* Profile Card Header Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '16px 18px',
          borderRadius: 20,
          background: isDark ? 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(255,255,255,0.02) 100%)' : 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 100%)',
          border: `1px solid ${borderCol}`,
          marginBottom: 18
        }}>
          <div style={{ position: 'relative' }}>
            <img
              src={avatar || client.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(client.name)}`}
              alt={client.name}
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                border: `2px solid ${accentColor}`,
                objectFit: 'cover',
                background: inputBg,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}
            />
            <span style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#10b981',
              border: `2.5px solid ${bgModal}`,
            }} title="Status Akun Aktif" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 18,
                  fontWeight: 900,
                  color: textPrimary,
                  margin: 0,
                  letterSpacing: '-0.3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {client.name}
              </h2>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                Client
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: textMuted,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {client.email} {client.phone ? `• ${client.phone}` : ''}
            </p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 18
        }}>
          <div style={{ padding: '10px 12px', borderRadius: 16, background: inputBg, border: `1px solid ${borderCol}`, textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: textMuted, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Total Pesanan</span>
            <div style={{ fontSize: 16, fontWeight: 900, color: textPrimary, fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
              {orders.length}
            </div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 16, background: inputBg, border: `1px solid ${borderCol}`, textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: textMuted, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Dalam Proses</span>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
              {pendingOrdersCount}
            </div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 16, background: inputBg, border: `1px solid ${borderCol}`, textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: textMuted, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Total Belanja</span>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#10b981', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
              {formatRp(totalSpent)}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            background: inputBg,
            borderRadius: 14,
            padding: 4,
            marginBottom: 18,
            border: `1px solid ${borderCol}`,
          }}
        >
          <button
            type="button"
            onClick={() => { setTab('profile'); setStatusMsg(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 10,
              border: 'none',
              background: tab === 'profile' ? accentColor : 'transparent',
              color: tab === 'profile' ? '#ffffff' : textMuted,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: tab === 'profile' ? `0 4px 12px ${accentColor}40` : 'none'
            }}
          >
            <User size={14} />
            <span>Profil Saya</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('orders'); setStatusMsg(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 10,
              border: 'none',
              background: tab === 'orders' ? accentColor : 'transparent',
              color: tab === 'orders' ? '#ffffff' : textMuted,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: tab === 'orders' ? `0 4px 12px ${accentColor}40` : 'none'
            }}
          >
            <ShoppingBag size={14} />
            <span>Riwayat Pesanan ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('password'); setStatusMsg(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 10,
              border: 'none',
              background: tab === 'password' ? accentColor : 'transparent',
              color: tab === 'password' ? '#ffffff' : textMuted,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: tab === 'password' ? `0 4px 12px ${accentColor}40` : 'none'
            }}
          >
            <KeyRound size={14} />
            <span>Keamanan</span>
          </button>
        </div>

        {/* Feedback Message */}
        {statusMsg && (
          <div
            style={{
              background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: statusMsg.type === 'success' ? '#10b981' : '#ef4444',
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Profile Form */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {tab === 'profile' && (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Avatar Selector Presets */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                  Pilih Karakter Avatar:
                </label>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                  {AVATAR_PRESETS.map((seed) => {
                    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
                    const isSelected = avatar === avatarUrl;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setAvatar(avatarUrl)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? accentColor : borderCol}`,
                          padding: 0,
                          background: inputBg,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxShadow: isSelected ? `0 0 0 3px ${accentColor}30` : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Alamat Email (Akun)
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
                  <input
                    type="email"
                    disabled
                    value={client.email}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: 14,
                      border: `1px solid ${borderCol}`,
                      background: inputBg,
                      color: textMuted,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      opacity: 0.8,
                      cursor: 'not-allowed',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Nama Lengkap
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: 14,
                      border: `1px solid ${borderCol}`,
                      background: inputBg,
                      color: textPrimary,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Nomor WhatsApp / HP
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: 14,
                      border: `1px solid ${borderCol}`,
                      background: inputBg,
                      color: textPrimary,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Save Profile Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 6,
                  padding: '12px',
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#fff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 6px 18px ${accentColor}40`,
                }}
              >
                <Save size={16} />
                <span>Simpan Perubahan Profil</span>
              </button>
            </form>
          )}

          {/* Tab 2: Orders List */}
          {tab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ordersLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: textMuted, fontSize: 13 }}>
                  Memuat data pesanan Anda...
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={42} style={{ opacity: 0.25, margin: '0 auto 12px', color: accentColor }} />
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: textPrimary }}>Belum Ada Pesanan</div>
                  <p style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>Pesan layanan atau produk di Katalog kami untuk melihat riwayat di sini.</p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      background: inputBg,
                      border: `1px solid ${borderCol}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: textMuted, fontFamily: "'Inter', sans-serif" }}>
                        {new Date(ord.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 100,
                        background: ord.status === 'Selesai' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: ord.status === 'Selesai' ? '#10b981' : '#f59e0b',
                        fontFamily: "'Outfit', sans-serif"
                      }}>
                        {ord.status || 'Diproses'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: textPrimary }}>
                          {ord.productName} {ord.variantName ? `(${ord.variantName})` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>
                          {ord.quantity}x • {ord.paymentMethod || 'WhatsApp Order'}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 900, color: accentColor }}>
                        {formatRp(ord.total)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Password Form */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Kata Sandi Lama
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama"
                    style={{
                      width: '100%',
                      padding: '11px 44px 11px 40px',
                      borderRadius: 14,
                      border: `1px solid ${borderCol}`,
                      background: inputBg,
                      color: textPrimary,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(prev => !prev)}
                    aria-label={showOldPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 8,
                      borderRadius: 8,
                      zIndex: 5,
                    }}
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Kata Sandi Baru
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 5 karakter"
                    style={{
                      width: '100%',
                      padding: '11px 44px 11px 40px',
                      borderRadius: 14,
                      border: `1px solid ${borderCol}`,
                      background: inputBg,
                      color: textPrimary,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(prev => !prev)}
                    aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 8,
                      borderRadius: 8,
                      zIndex: 5,
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Konfirmasi Kata Sandi Baru
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    style={{
                      width: '100%',
                      padding: '11px 44px 11px 40px',
                      borderRadius: 14,
                      border: `1px solid ${borderCol}`,
                      background: inputBg,
                      color: textPrimary,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 8,
                      borderRadius: 8,
                      zIndex: 5,
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 6,
                  padding: '12px',
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#fff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 6px 18px ${accentColor}40`,
                }}
              >
                <KeyRound size={16} />
                <span>Perbarui Kata Sandi</span>
              </button>
            </form>
          )}
        </div>

        {/* Logout & Footer Section */}
        <div style={{ marginTop: 18, borderTop: `1px solid ${borderCol}`, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: textMuted, fontFamily: "'Inter', sans-serif" }}>
            ID Akun: {client.id.slice(0, 10)}...
          </span>
          <button
            type="button"
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: 12.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 10,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={15} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientProfileModal;
