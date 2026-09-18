import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  User, Mail, Phone, Lock, Save, KeyRound, LogOut, CheckCircle2, 
  Shield, Eye, EyeOff, ShoppingBag, Package, Sparkles, Clock, CheckCircle, 
  ExternalLink, MessageCircle, AlertCircle, ShoppingCart, Heart, ArrowRight,
  ArrowUpRight, ChevronRight, ShieldCheck, Zap, RefreshCw,
  Palette, Compass, Users, Cpu, Glasses, Smile, Shuffle, ChevronUp, ChevronDown,
  Gamepad2, Download, Play
} from 'lucide-react';
import { useClientAuth } from '../context/ClientAuthContext';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import SEOHelmet from '../components/SEOHelmet';
import { ClientOrder, getClientOrders } from '../services/clientAuth';
import { useToast } from '../context/ToastContext';
import { storage } from '../utils/storage';
import { haptic } from '../utils/haptics';
import AvatarPickerModal from '../components/common/AvatarPickerModal';
import { ALL_AVATARS, AVATAR_CATEGORIES, getRandomAvatar } from '../utils/avatarPresets';
import { ClientGameLicense } from '../types/gameLicense';
import { getOfflineLicenses } from '../utils/offlineLicenseDb';
import { exportGameZip } from '../utils/gameExporter';

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function ClientAccountPage() {
  const navigate = useNavigate();
  const { data } = useLandingData();
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const { client, updateProfile, changePassword, logout, openAuthModal, isLoading } = useClientAuth();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'orders' | 'games' | 'digital' | 'profile' | 'wishlist' | 'security'>('games');
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const digitalOrders = useMemo(() => {
    return orders.filter(o => o.isDigitalAsset || !!o.downloadUrl);
  }, [orders]);
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(true);
  const [avatarCategory, setAvatarCategory] = useState('all');

  // Client Games State (Offline-first from IndexedDB)
  const [clientGames, setClientGames] = useState<ClientGameLicense[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [downloadingGameId, setDownloadingGameId] = useState<string | null>(null);
  const [activePlayGame, setActivePlayGame] = useState<ClientGameLicense | null>(null);

  // Profile Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Wishlist products
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Force body/html/root scrollable (overrides global CMS fixed-body CSS)
  useLandingBodyFix();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      const rawW = localStorage.getItem('porto_client_wishlist');
      setWishlistIds(rawW ? JSON.parse(rawW) : []);
    } catch {}

    storage.getItem('porto_catalog_products', []).then((prods: any[]) => {
      setCatalogProducts(prods || []);
    });
  }, []);

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setAvatar(client.avatar || '');

      setOrdersLoading(true);
      getClientOrders(client.id)
        .then((res) => setOrders(res))
        .finally(() => setOrdersLoading(false));

      // Ambil Lisensi Game Klien dari IndexedDB secara Offline-First
      setGamesLoading(true);
      const cId = client.id || client.email;
      getOfflineLicenses(cId, client.email)
        .then((licenses) => {
          const lics = licenses || [];
          setClientGames(lics);

          // Cek Dynamic Instance URL (misal: /client?play=INSTANCE_ID atau /client/play/INSTANCE_ID)
          const playParam = searchParams.get('play') || searchParams.get('instance');
          const pathMatch = location.pathname.match(/\/client\/(?:play|instance)\/([^/?#]+)/i);
          const targetInstanceId = playParam || (pathMatch ? pathMatch[1] : null);

          if (targetInstanceId) {
            const matched = lics.find(l => l.id === targetInstanceId || l.gameId === targetInstanceId);
            if (matched) {
              setActivePlayGame(matched);
              setActiveTab('games');
            }
          }
        })
        .catch(() => setClientGames([]))
        .finally(() => setGamesLoading(false));
    }
  }, [client, location.pathname, searchParams]);

  const accentColor = data?.theme?.accentColor || '#7c3aed';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';
  const pageBg = isDark ? '#08080f' : '#ffffff';

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
      showToast('Profil Diperbarui', 'Data profil Anda telah disimpan dengan aman.', 'success');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal memperbarui profil.' });
      showToast('Gagal Memperbarui', err.message || 'Terjadi kesalahan.', 'error');
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
      showToast('Kata Sandi Diubah', 'Kata sandi baru Anda telah aktif.', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
      showToast('Gagal Mengubah Sandi', err.message || 'Terjadi kesalahan.', 'error');
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Diproses');
  const completedOrders = orders.filter(o => o.status === 'Selesai');
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const wishlistProducts = catalogProducts.filter(p => wishlistIds.includes(p.id));

  return (
    <div
      ref={containerRef}
      onScroll={(e) => {
        const st = (e.target as HTMLDivElement).scrollTop;
        window.dispatchEvent(new CustomEvent('page-scroll', { detail: { scrollTop: st } }));
      }}
      style={{
        backgroundColor: pageBg,
        width: '100%',
        minHeight: '100vh',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: textColor,
        transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
      }}
    >
      <SEOHelmet
        title="Akun Client & Riwayat Pesanan"
        description="Kelola profil akun, riwayat pesanan layanan, wishlist, dan pengaturan keamanan Anda."
      />

      <LPNavbar
        items={(data?.navbar?.items || []) as any}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        isDark={isDark}
        accentColor={accentColor}
      />

      <main style={{ 
        flex: 1, 
        width: '100%', 
        maxWidth: 1180, 
        margin: '0 auto', 
        padding: isMobile ? '110px 16px 80px' : '130px 24px 100px', 
        boxSizing: 'border-box' 
      }}>
        
        {/* Not Logged In View */}
        {!client ? (
          <div style={{
            maxWidth: 480,
            margin: '40px auto',
            padding: isMobile ? '32px 20px' : '44px 32px',
            borderRadius: 28,
            background: cardBg,
            border: `1.5px solid ${cardBorder}`,
            textAlign: 'center',
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 16px 40px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16
          }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, margin: '0 auto' }}>
              <User size={34} />
            </div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 900, margin: 0, color: textColor }}>
              Masuk ke Akun Anda
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor, margin: 0, lineHeight: 1.6, maxWidth: 360 }}>
              Silakan masuk atau daftar akun client untuk melihat riwayat pesanan, produk favorit, dan mengelola profil Anda.
            </p>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                onClick={() => openAuthModal('login')}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 6px 18px ${accentColor}40`
                }}
              >
                Masuk Sekarang
              </button>
              <button
                onClick={() => openAuthModal('register')}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 100,
                  border: `1.5px solid ${cardBorder}`,
                  background: 'transparent',
                  color: textColor,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Daftar Akun Baru
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
            {/* Header Client Hero Card */}
            <div style={{
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: 28,
              background: isDark ? `linear-gradient(135deg, ${accentColor}22 0%, rgba(30, 41, 59, 0.85) 100%)` : `linear-gradient(135deg, ${accentColor}12 0%, #ffffff 100%)`,
              border: `1.5px solid ${cardBorder}`,
              padding: isMobile ? '20px 18px' : '28px 32px',
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 20,
              boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4)' : '0 12px 32px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: isMobile ? 62 : 72,
                    height: isMobile ? 62 : 72,
                    borderRadius: '50%',
                    border: `3px solid ${accentColor}`,
                    background: inputBg,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2
                  }}>
                    <img
                      src={avatar || client.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(client.name)}`}
                      alt={client.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '50%'
                      }}
                    />
                  </div>
                  <span style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#10b981',
                    border: `2.5px solid ${cardBg}`,
                  }} title="Akun Aktif" />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 900, color: textColor, margin: 0 }}>
                      Halo, {client.name}!
                    </h1>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                      Terverifikasi ✓
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor, margin: 0, wordBreak: 'break-all' }}>
                    {client.email} {client.phone ? `• ${client.phone}` : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                <button
                  onClick={() => {
                    navigate('/katalog');
                    setTimeout(() => window.dispatchEvent(new CustomEvent('porto_open_cart')), 100);
                  }}
                  style={{
                    flex: isMobile ? 1 : 'initial',
                    padding: '9px 18px',
                    borderRadius: 100,
                    border: `1.5px solid ${cardBorder}`,
                    background: cardBg,
                    color: textColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <ShoppingCart size={15} color={accentColor} />
                  <span>Keranjang</span>
                </button>
                <button
                  onClick={logout}
                  style={{
                    flex: isMobile ? 1 : 'initial',
                    padding: '9px 18px',
                    borderRadius: 100,
                    border: '1.5px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.08)',
                    color: '#ef4444',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <LogOut size={15} />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? 10 : 16,
              width: '100%'
            }}>
              <div style={{ padding: isMobile ? '14px 16px' : '18px 20px', borderRadius: 22, background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: subTextColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Total Pesanan</span>
                  <ShoppingBag size={18} color={accentColor} />
                </div>
                <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                  {orders.length}
                </div>
              </div>

              <div style={{ padding: isMobile ? '14px 16px' : '18px 20px', borderRadius: 22, background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: subTextColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Dalam Proses</span>
                  <Clock size={18} color="#f59e0b" />
                </div>
                <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>
                  {pendingOrders.length}
                </div>
              </div>

              <div style={{ padding: isMobile ? '14px 16px' : '18px 20px', borderRadius: 22, background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: subTextColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Selesai</span>
                  <CheckCircle size={18} color="#10b981" />
                </div>
                <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                  {completedOrders.length}
                </div>
              </div>

              <div style={{ padding: isMobile ? '14px 16px' : '18px 20px', borderRadius: 22, background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: subTextColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Total Transaksi</span>
                  <Zap size={18} color={accentColor} />
                </div>
                <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                  {formatRp(totalSpent)}
                </div>
              </div>
            </div>

            {/* Navigation Tab Bar */}
            <div style={{
              display: 'flex',
              gap: isMobile ? 6 : 8,
              borderBottom: `1.5px solid ${cardBorder}`,
              paddingBottom: 12,
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {[
                { id: 'games', label: `Game Saya (${clientGames.length})`, count: clientGames.length, icon: <Gamepad2 size={isMobile ? 19 : 15} /> },
                { id: 'digital', label: `Aset Digital (${digitalOrders.length})`, count: digitalOrders.length, icon: <Download size={isMobile ? 19 : 15} /> },
                { id: 'orders', label: `Riwayat Pesanan (${orders.length})`, count: orders.length, icon: <ShoppingBag size={isMobile ? 19 : 15} /> },
                { id: 'wishlist', label: `Wishlist (${wishlistIds.length})`, count: wishlistIds.length, icon: <Heart size={isMobile ? 19 : 15} /> },
                { id: 'profile', label: 'Pengaturan Profil', icon: <User size={isMobile ? 19 : 15} /> },
                { id: 'security', label: 'Keamanan Sandi', icon: <KeyRound size={isMobile ? 19 : 15} /> },
              ].map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      haptic.light();
                      setActiveTab(t.id as any);
                      setStatusMsg(null);
                    }}
                    title={t.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      flex: isMobile ? 1 : 'initial',
                      height: isMobile ? 44 : 40,
                      padding: isMobile ? '0' : '0 22px',
                      borderRadius: isMobile ? 14 : 100,
                      border: `1.5px solid ${isActive ? accentColor : 'transparent'}`,
                      background: isActive ? accentColor : (isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'),
                      color: isActive ? '#ffffff' : subTextColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13.5,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? `0 6px 18px ${accentColor}35` : 'none'
                    }}
                  >
                    {t.icon}
                    {!isMobile && <span>{t.label}</span>}
                    {isMobile && t.count !== undefined && t.count > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: 6,
                        right: 'calc(50% - 16px)',
                        minWidth: 15,
                        height: 15,
                        padding: '0 4px',
                        borderRadius: 10,
                        background: isActive ? '#ffffff' : accentColor,
                        color: isActive ? accentColor : '#ffffff',
                        fontSize: 9.5,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                      }}>
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab: Game Saya (Offline-First from IndexedDB) */}
            {activeTab === 'games' && (
              <div style={{ width: '100%' }}>
                {gamesLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }}>
                    Memuat lisensi game offline Anda...
                  </div>
                ) : clientGames.length === 0 ? (
                  <div style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    padding: isMobile ? '40px 16px' : '60px 20px',
                    borderRadius: 24,
                    background: cardBg,
                    border: `1.5px dashed ${cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Gamepad2 size={48} style={{ opacity: 0.3, color: accentColor, margin: '0 auto 14px' }} />
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: textColor }}>
                      Belum Ada Game Terdaftar
                    </h3>
                    <p style={{ fontSize: 13.5, color: subTextColor, margin: '0 0 18px', maxWidth: 380, lineHeight: 1.5 }}>
                      Anda belum memiliki lisensi game sewa maupun beli putus. Hubungi admin untuk mengaktifkan lisensi game Anda.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18, width: '100%' }}>
                    {clientGames.map((lic) => {
                      const isLifetime = lic.model === 'lifetime';
                      const isExpired = lic.model === 'rental' && lic.expiryDate && lic.expiryDate < Date.now();

                      return (
                        <div
                          key={lic.id}
                          style={{
                            background: cardBg,
                            border: `1.5px solid ${cardBorder}`,
                            borderRadius: 22,
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 16,
                            boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: isLifetime ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: isLifetime ? '#10b981' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Gamepad2 size={24} />
                              </div>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: 100,
                                background: isExpired ? 'rgba(239,68,68,0.2)' : isLifetime ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                                color: isExpired ? '#ef4444' : isLifetime ? '#10b981' : '#3b82f6',
                                textTransform: 'uppercase'
                              }}>
                                {isExpired ? 'Kedaluwarsa' : isLifetime ? 'Beli Putus' : 'Sewa Waktu'}
                              </span>
                            </div>

                            <h4 style={{ margin: '4px 0', fontSize: 17, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              {lic.gameTitle || 'Game Instance'}
                            </h4>
                            <p style={{ margin: 0, fontSize: 12, color: subTextColor }}>
                              Tier: <strong>{lic.tier.toUpperCase()}</strong> • Status: <span style={{ color: isExpired ? '#ef4444' : '#10b981', fontWeight: 700 }}>{isExpired ? 'Non-aktif' : 'Aktif'}</span>
                            </p>

                            {lic.model === 'rental' && lic.expiryDate && (
                              <p style={{ margin: '8px 0 0', fontSize: 11, color: isExpired ? '#ef4444' : subTextColor }}>
                                Masa Sewa: s/d {new Date(lic.expiryDate).toLocaleDateString('id-ID')}
                              </p>
                            )}
                          </div>

                          {/* Tombol Aksi */}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: `1px solid ${cardBorder}` }}>
                            <button
                              disabled={isExpired}
                              onClick={() => {
                                showToast('Membuka Game', `Menyiapkan ${lic.gameTitle}...`, 'info');
                                setActivePlayGame(lic);
                              }}
                              style={{
                                flex: 1,
                                height: 38,
                                borderRadius: 100,
                                border: 'none',
                                background: isExpired ? '#64748b' : accentColor,
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                cursor: isExpired ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <Play size={13} /> Mainkan
                            </button>

                            {isLifetime && (
                              <button
                                disabled={downloadingGameId === lic.id}
                                onClick={async () => {
                                  setDownloadingGameId(lic.id);
                                  showToast('Download Dimulai', 'Mengekstrak aset offline DRM-free...', 'info');
                                  try {
                                    await exportGameZip({
                                      gameId: lic.gameId,
                                      gameTitle: lic.gameTitle,
                                      config: lic.customConfig,
                                      clientName: client.name,
                                      clientId: client.id || client.email
                                    });
                                    showToast('Download Selesai', 'Game ZIP offline berhasil diunduh.', 'success');
                                  } catch (err: any) {
                                    showToast('Gagal Download', err.message || 'Terjadi kesalahan.', 'error');
                                  } finally {
                                    setDownloadingGameId(null);
                                  }
                                }}
                                style={{
                                  height: 38,
                                  padding: '0 14px',
                                  borderRadius: 100,
                                  border: `1.5px solid ${cardBorder}`,
                                  background: 'rgba(16,185,129,0.15)',
                                  color: '#10b981',
                                  fontWeight: 800,
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  cursor: 'pointer'
                                }}
                                title="Unduh Game Offline murni tanpa DRM"
                              >
                                <Download size={13} /> {downloadingGameId === lic.id ? 'Mengompres...' : 'Download ZIP'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Modal Mainkan Game Sederhana (Launcher Web dengan Dynamic Instance Branding) */}
                {activePlayGame && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{
                      width: '100%', maxWidth: 840, height: 580, background: '#121124', borderRadius: 24, overflow: 'hidden',
                      border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column',
                      boxShadow: '0 25px 60px rgba(0,0,0,0.8)', position: 'relative'
                    }}>
                      {/* Topbar Launcher */}
                      <div style={{ padding: '14px 20px', background: '#18172e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {activePlayGame.customConfig?.logoUrl ? (
                            <img src={activePlayGame.customConfig.logoUrl} alt="Logo" style={{ height: 26, objectFit: 'contain', borderRadius: 4 }} />
                          ) : (
                            <Gamepad2 size={22} color={activePlayGame.customConfig?.themeColor || accentColor} />
                          )}
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{activePlayGame.gameTitle}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>Instance ID: {activePlayGame.id}</span>
                          </div>
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 800 }}>
                            LISENSI AKTIF
                          </span>
                        </div>
                        <button
                          onClick={() => setActivePlayGame(null)}
                          style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                        >
                          ✕ Tutup Game
                        </button>
                      </div>

                      {/* Main Canvas / Screen with Custom Branding */}
                      <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', padding: 24, position: 'relative', overflow: 'hidden',
                        backgroundImage: activePlayGame.customConfig?.heroBackgroundUrl ? `linear-gradient(rgba(18,17,36,0.82), rgba(18,17,36,0.9)), url(${activePlayGame.customConfig.heroBackgroundUrl})` : undefined,
                        backgroundSize: 'cover', backgroundPosition: 'center'
                      }}>
                        {activePlayGame.customConfig?.logoUrl && (
                          <div style={{ marginBottom: 16 }}>
                            <img src={activePlayGame.customConfig.logoUrl} alt="" style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }} />
                          </div>
                        )}

                        <div style={{ width: 64, height: 64, borderRadius: 18, background: `${activePlayGame.customConfig?.themeColor || accentColor}25`, color: activePlayGame.customConfig?.themeColor || accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                          <Gamepad2 size={36} />
                        </div>

                        <h3 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                          Game Event Launcher Siap
                        </h3>

                        <p style={{ margin: '10px 0 20px', color: '#cbd5e1', fontSize: 13.5, maxWidth: 480, lineHeight: 1.6 }}>
                          Lisensi diverifikasi secara <strong>Offline-First</strong> dari IndexedDB lokal (Zero-Read Firestore). Anda memegang hak akses <strong>{activePlayGame.model === 'lifetime' ? 'Beli Putus (Permanen)' : 'Sewa Waktu'}</strong> tier <strong>{activePlayGame.tier.toUpperCase()}</strong> dengan branding eksklusif <strong>{activePlayGame.clientName}</strong>.
                        </p>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            onClick={() => showToast('Memulai Game', 'Engine HTML5 Single File dimuat.', 'success')}
                            style={{
                              padding: '12px 28px', borderRadius: 100,
                              background: activePlayGame.customConfig?.themeColor || accentColor,
                              color: '#fff', border: 'none', fontWeight: 900, fontSize: 13.5, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 8,
                              boxShadow: `0 4px 16px ${activePlayGame.customConfig?.themeColor || accentColor}60`
                            }}
                          >
                            <Play size={16} fill="#fff" /> Mainkan Sekarang (60 FPS)
                          </button>

                          {activePlayGame.model === 'lifetime' && (
                            <button
                              onClick={async () => {
                                showToast('Download Dimulai', 'Mengekstrak aset offline DRM-free...', 'info');
                                await exportGameZip({
                                  gameId: activePlayGame.gameId,
                                  gameTitle: activePlayGame.gameTitle,
                                  config: activePlayGame.customConfig,
                                  clientName: client.name,
                                  clientId: client.id || client.email
                                });
                                showToast('Download Selesai', 'Game ZIP offline berhasil diunduh.', 'success');
                              }}
                              style={{ padding: '12px 22px', borderRadius: 100, background: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                              <Download size={15} /> Download ZIP Offline
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Aset Digital Saya (Instant Download Vault) */}
            {activeTab === 'digital' && (
              <div style={{ width: '100%' }}>
                {ordersLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }}>
                    Memuat aset digital Anda...
                  </div>
                ) : digitalOrders.length === 0 ? (
                  <div style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    padding: isMobile ? '40px 16px' : '60px 20px',
                    borderRadius: 24,
                    background: cardBg,
                    border: `1.5px dashed ${cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Download size={48} style={{ opacity: 0.3, color: accentColor, margin: '0 auto 14px' }} />
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: textColor }}>
                      Belum Ada Aset Digital
                    </h3>
                    <p style={{ fontSize: 13.5, color: subTextColor, margin: '0 0 18px', maxWidth: 360, lineHeight: 1.5 }}>
                      Aset digital, e-book, template, atau berkas yang Anda beli di katalog akan otomatis muncul di sini dan siap diunduh 24 jam.
                    </p>
                    <button
                      onClick={() => navigate('/katalog')}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#fff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: `0 6px 18px ${accentColor}40`
                      }}
                    >
                      <span>Jelajahi Aset Digital</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, width: '100%' }}>
                    {digitalOrders.map((ord) => {
                      const isPaid = ord.status === 'Selesai';
                      return (
                        <div
                          key={ord.id}
                          style={{
                            background: cardBg,
                            border: `1.5px solid ${isPaid ? 'rgba(16,185,129,0.35)' : cardBorder}`,
                            borderRadius: 22,
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 16,
                            boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.04)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {isPaid && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                          )}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: isPaid ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: isPaid ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Download size={22} />
                              </div>
                              <span style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                padding: '4px 10px',
                                borderRadius: 100,
                                background: isPaid ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                                color: isPaid ? '#10b981' : '#f59e0b',
                                fontFamily: "'Outfit', sans-serif",
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                {isPaid ? 'LUNAS / SIAP UNDUH' : 'MENUNGGU KONFIRMASI'}
                              </span>
                            </div>

                            <h4 style={{ margin: '4px 0 6px', fontSize: 16.5, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              {ord.productName}
                            </h4>

                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                              <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: subTextColor, fontWeight: 700 }}>
                                📦 {ord.fileFormat || 'ZIP / File'}
                              </span>
                              {ord.fileSize && (
                                <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: subTextColor, fontWeight: 700 }}>
                                  {ord.fileSize}
                                </span>
                              )}
                              <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: subTextColor }}>
                                #{ord.id.slice(0, 10)}
                              </span>
                            </div>

                            {/* Secret instructions / License key if available */}
                            {isPaid && ord.instantDeliveryMessage && (
                              <div style={{ padding: 12, borderRadius: 12, background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <ShieldCheck size={13} /> Instruksi Rahasia & Kunci Lisensi:
                                </div>
                                <div style={{ fontSize: 12, color: textColor, lineHeight: 1.5, wordBreak: 'break-word', fontFamily: 'monospace' }}>
                                  {ord.instantDeliveryMessage}
                                </div>
                              </div>
                            )}

                            {!isPaid && (
                              <div style={{ padding: 10, borderRadius: 12, background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 11.5, color: '#f59e0b', lineHeight: 1.4 }}>
                                Tautan unduh otomatis aktif begitu konfirmasi pembayaran Anda diverifikasi oleh admin.
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <div style={{ paddingTop: 10, borderTop: `1px solid ${cardBorder}` }}>
                            {isPaid && ord.downloadUrl ? (
                              <a
                                href={ord.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  width: '100%',
                                  height: 42,
                                  borderRadius: 100,
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: 13,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                  textDecoration: 'none',
                                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <Download size={15} /> Unduh Berkas Sekarang
                              </a>
                            ) : (
                              <button
                                disabled
                                style={{
                                  width: '100%',
                                  height: 42,
                                  borderRadius: 100,
                                  background: 'rgba(150,150,150,0.15)',
                                  color: subTextColor,
                                  fontWeight: 700,
                                  fontSize: 12.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  border: 'none',
                                  cursor: 'not-allowed'
                                }}
                              >
                                <Clock size={14} /> Menunggu Verifikasi
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 1: Orders History */}
            {activeTab === 'orders' && (
              <div style={{ width: '100%' }}>
                {ordersLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }}>
                    Memuat riwayat pesanan Anda...
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    padding: isMobile ? '40px 16px' : '60px 20px',
                    borderRadius: 24,
                    background: cardBg,
                    border: `1.5px dashed ${cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Package size={48} style={{ opacity: 0.3, color: accentColor, margin: '0 auto 14px' }} />
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: textColor }}>
                      Belum Ada Pesanan
                    </h3>
                    <p style={{ fontSize: 13.5, color: subTextColor, margin: '0 0 18px', maxWidth: 360, lineHeight: 1.5 }}>
                      Anda belum memiliki riwayat transaksi pemesanan produk atau jasa desain.
                    </p>
                    <button
                      onClick={() => navigate('/katalog')}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#fff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: `0 6px 18px ${accentColor}40`
                      }}
                    >
                      <span>Jelajahi Katalog</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: isMobile ? '16px 18px' : '20px 24px',
                          borderRadius: 22,
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: textColor }}>
                              #{ord.id.slice(0, 12)}
                            </span>
                            <span style={{ fontSize: 12, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>
                              • {new Date(ord.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>

                          <span style={{
                            fontSize: 12,
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: 100,
                            background: ord.status === 'Selesai' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color: ord.status === 'Selesai' ? '#10b981' : '#f59e0b',
                            fontFamily: "'Outfit', sans-serif"
                          }}>
                            {ord.status || 'Diproses'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, paddingTop: 10, borderTop: `1px solid ${cardBorder}` }}>
                          <div>
                            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: textColor }}>
                              {ord.productName} {ord.variantName ? `(${ord.variantName})` : ''}
                            </div>
                            <div style={{ fontSize: 12.5, color: subTextColor, marginTop: 2 }}>
                              Jumlah: <strong>{ord.quantity}x</strong> • Metode: {ord.paymentMethod || 'WhatsApp Order'}
                            </div>
                          </div>

                          <div style={{ textAlign: isMobile ? 'left' : 'right', width: isMobile ? '100%' : 'auto' }}>
                            <span style={{ fontSize: 11, color: subTextColor, fontWeight: 700 }}>Total Pembayaran</span>
                            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: accentColor }}>
                              {formatRp(ord.total)}
                            </div>
                          </div>
                        </div>

                        {ord.status === 'Selesai' && ord.downloadUrl && (
                          <div style={{ paddingTop: 8, borderTop: `1px dashed ${cardBorder}`, display: 'flex', justifyContent: 'flex-end' }}>
                            <a
                              href={ord.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 16px',
                                borderRadius: 100,
                                background: 'rgba(16,185,129,0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16,185,129,0.3)',
                                fontSize: 12,
                                fontWeight: 800,
                                textDecoration: 'none'
                              }}
                            >
                              <Download size={13} /> Unduh Berkas ({ord.fileFormat || 'File'})
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Wishlist */}
            {activeTab === 'wishlist' && (
              <div style={{ width: '100%' }}>
                {wishlistProducts.length === 0 ? (
                  <div style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    padding: isMobile ? '40px 16px' : '60px 20px',
                    borderRadius: 24,
                    background: cardBg,
                    border: `1.5px dashed ${cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Heart size={48} style={{ opacity: 0.3, color: '#ef4444', margin: '0 auto 14px' }} />
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: textColor }}>
                      Wishlist Masih Kosong
                    </h3>
                    <p style={{ fontSize: 13.5, color: subTextColor, margin: '0 0 18px', maxWidth: 360, lineHeight: 1.5 }}>
                      Simpan produk favorit Anda saat menjelajahi katalog dengan mengklik ikon hati ❤️.
                    </p>
                    <button
                      onClick={() => navigate('/katalog')}
                      style={{
                        padding: '10px 24px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#fff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      Buka Katalog Produk
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', 
                    gap: 16,
                    width: '100%'
                  }}>
                    {wishlistProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate('/katalog')}
                        style={{
                          background: cardBg,
                          borderRadius: 20,
                          overflow: 'hidden',
                          border: `1px solid ${cardBorder}`,
                          padding: 14,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <img src={p.gallery?.[0] || 'https://placehold.co/200x200?text=Produk'} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 14 }} />
                        <div>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 900, color: accentColor, marginTop: 2 }}>
                            {formatRp(p.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Profile Settings (FULL WIDTH CARD) */}
            {activeTab === 'profile' && (
              <div style={{ 
                width: '100%', 
                boxSizing: 'border-box',
                background: cardBg, 
                borderRadius: 28, 
                border: `1.5px solid ${cardBorder}`, 
                padding: isMobile ? '20px 18px' : '32px 36px',
                boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.03)'
              }}>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, margin: '0 0 4px', color: textColor }}>
                    Pengaturan Profil Client
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor, margin: 0 }}>
                    Perbarui nama lengkap, nomor WhatsApp, serta karakter avatar akun Anda.
                  </p>
                </div>

                {statusMsg && (
                  <div style={{
                    background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: statusMsg.type === 'success' ? '#10b981' : '#ef4444',
                    borderRadius: 14,
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{statusMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
                  {/* Inline Expandable Avatar Picker with Left Sidebar Categories */}
                  <div style={{ padding: '16px 18px', borderRadius: 20, background: inputBg, border: `1px solid ${cardBorder}`, transition: 'all 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2.5px solid ${accentColor}`, overflow: 'hidden', background: isDark ? '#1e293b' : '#ffffff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={avatar || ALL_AVATARS[0].url} alt="Current Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif", margin: 0, display: 'block' }}>
                            Pilih Karakter Avatar Anda:
                          </label>
                          <span style={{ fontSize: 11, color: textColor, opacity: 0.6 }}>200+ Karakter siap pakai</span>
                        </div>
                      </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            haptic.light();
                            const rand = getRandomAvatar();
                            setAvatar(rand.url);
                            setAvatarCategory(prev => (prev === 'all' ? 'male' : prev === 'male' ? 'female' : 'all'));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 14px',
                            borderRadius: 100,
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                            color: textColor,
                            border: `1px solid ${cardBorder}`,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                          }}
                        >
                          <Shuffle size={12} /> Acak
                        </button>
                      </div>
                    </div>

                    {/* Always in Ciut Mode - Spans 100% full width with auto-fill grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                      gap: 8,
                      width: '100%',
                      boxSizing: 'border-box',
                      marginTop: 8
                    }}>
                      {ALL_AVATARS.slice(0, 36).map((item) => {
                        const isSelected = avatar === item.url;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              haptic.light();
                              setAvatar(item.url);
                            }}
                            style={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              borderRadius: '50%',
                              border: `2.5px solid ${isSelected ? accentColor : cardBorder}`,
                              padding: 2,
                              background: isSelected ? `${accentColor}15` : (isDark ? '#1e293b' : '#ffffff'),
                              cursor: 'pointer',
                              flexShrink: 0,
                              boxShadow: isSelected ? `0 0 0 3px ${accentColor}35` : 'none',
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxSizing: 'border-box'
                            }}
                            title={`Pilih avatar ${item.name}`}
                          >
                            <img
                              src={item.url}
                              alt={item.name}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Grid: 2 columns on desktop, 1 on mobile */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: 16,
                    width: '100%'
                  }}>
                    {/* Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                        Nama Lengkap
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama Lengkap Anda"
                          style={{
                            width: '100%',
                            padding: '12px 16px 12px 42px',
                            borderRadius: 14,
                            border: `1.5px solid ${cardBorder}`,
                            background: inputBg,
                            color: textColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                        Nomor WhatsApp / HP
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0812xxxxxxxx"
                          style={{
                            width: '100%',
                            padding: '12px 16px 12px 42px',
                            borderRadius: 14,
                            border: `1.5px solid ${cardBorder}`,
                            background: inputBg,
                            color: textColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Email (Full width on desktop) */}
                    <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                        Alamat Email (Akun Utama)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
                        <input
                          type="email"
                          disabled
                          value={client.email}
                          style={{
                            width: '100%',
                            padding: '12px 16px 12px 42px',
                            borderRadius: 14,
                            border: `1px solid ${cardBorder}`,
                            background: inputBg,
                            color: subTextColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14,
                            opacity: 0.8,
                            cursor: 'not-allowed',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{
                        width: isMobile ? '100%' : 'auto',
                        minWidth: 200,
                        height: 48,
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: `0 6px 18px ${accentColor}40`
                      }}
                    >
                      <Save size={16} />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 4: Security (FULL WIDTH CARD) */}
            {activeTab === 'security' && (
              <div style={{ 
                width: '100%', 
                boxSizing: 'border-box',
                background: cardBg, 
                borderRadius: 28, 
                border: `1.5px solid ${cardBorder}`, 
                padding: isMobile ? '20px 18px' : '32px 36px',
                boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.03)'
              }}>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, margin: '0 0 4px', color: textColor }}>
                    Keamanan & Ganti Kata Sandi
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor, margin: 0 }}>
                    Pastikan kata sandi Anda kuat dan tidak mudah ditebak untuk menjaga keamanan pesanan.
                  </p>
                </div>

                {statusMsg && (
                  <div style={{
                    background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: statusMsg.type === 'success' ? '#10b981' : '#ef4444',
                    borderRadius: 14,
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{statusMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: 16,
                    width: '100%'
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                        Kata Sandi Lama
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          required
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Kata sandi lama"
                          style={{
                            width: '100%',
                            padding: '12px 44px 12px 16px',
                            borderRadius: 14,
                            border: `1.5px solid ${cardBorder}`,
                            background: inputBg,
                            color: textColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(prev => !prev)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: 6 }}
                        >
                          {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                        Kata Sandi Baru
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 5 karakter"
                          style={{
                            width: '100%',
                            padding: '12px 44px 12px 16px',
                            borderRadius: 14,
                            border: `1.5px solid ${cardBorder}`,
                            background: inputBg,
                            color: textColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(prev => !prev)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: 6 }}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                        Konfirmasi Baru
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi sandi baru"
                          style={{
                            width: '100%',
                            padding: '12px 44px 12px 16px',
                            borderRadius: 14,
                            border: `1.5px solid ${cardBorder}`,
                            background: inputBg,
                            color: textColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(prev => !prev)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: 6 }}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{
                        width: isMobile ? '100%' : 'auto',
                        minWidth: 200,
                        height: 48,
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: `0 6px 18px ${accentColor}40`
                      }}
                    >
                      Perbarui Kata Sandi
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <LPFooter isDark={isDark} accentColor={accentColor} data={data?.footer} />
    </div>
  );
}
