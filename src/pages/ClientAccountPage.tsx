import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { 
  User, Mail, Phone, Lock, Save, KeyRound, LogOut, CheckCircle2, 
  Shield, Eye, EyeOff, ShoppingBag, Package, Sparkles, Clock, CheckCircle, 
  ExternalLink, MessageCircle, AlertCircle, ShoppingCart, Heart, ArrowRight,
  ArrowUpRight, ChevronRight, ShieldCheck, Zap, RefreshCw, X,
  Palette, Compass, Users, Cpu, Glasses, Smile, Shuffle, ChevronUp, ChevronDown,
  Gamepad2, Download, Play, Copy, Share2, CreditCard, TrendingUp, Coins, Percent, Award,
  Trophy, Layers, AppWindow, Calculator, FileText, QrCode, FileCheck, Crown, HelpCircle,
  Sliders, Check, Calendar, Infinity, AlertTriangle, PenTool, FolderKanban
} from 'lucide-react';
import { useClientAuth } from '../context/ClientAuthContext';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import SEOHelmet from '../components/SEOHelmet';
import { ClientOrder, getClientOrders, generateAffiliateCode, calculatePartnerTierProgress, lookupClientOrder } from '../services/clientAuth';
import DesignProofingCanvas from '../components/client/DesignProofingCanvas';
import { useToast } from '../context/ToastContext';
import { storage } from '../utils/storage';
import { haptic } from '../utils/haptics';
import AvatarPickerModal from '../components/common/AvatarPickerModal';
import { ALL_AVATARS, AVATAR_CATEGORIES, getRandomAvatar } from '../utils/avatarPresets';
import { ClientGameLicense } from '../types/gameLicense';
import { getOfflineLicenses } from '../utils/offlineLicenseDb';
import { exportGameZip } from '../utils/gameExporter';
import ClientBrandVault from '../components/client/ClientBrandVault';
import { useBusinessProfile } from '../hooks/useBusinessProfile';

const TAB_SLUGS: Record<string, string> = {
  vault: 'brand-vault',
  apps: 'aplikasi',
  digital: 'aset',
  orders: 'pesanan',
  tracker: 'proyek',
  partnership: 'mitra',
  wishlist: 'wishlist',
  profile: 'profil',
  security: 'keamanan'
};

const SLUG_TO_TAB: Record<string, 'apps' | 'digital' | 'orders' | 'tracker' | 'vault' | 'partnership' | 'wishlist' | 'profile' | 'security'> = {
  'brand-vault': 'vault',
  vault: 'vault',
  brand: 'vault',
  brandvault: 'vault',
  aplikasi: 'apps',
  apps: 'apps',
  game: 'apps',
  games: 'apps',
  aset: 'digital',
  digital: 'digital',
  files: 'digital',
  unduhan: 'digital',
  pesanan: 'orders',
  orders: 'orders',
  transaksi: 'orders',
  proyek: 'tracker',
  tracker: 'tracker',
  projects: 'tracker',
  mitra: 'partnership',
  partnership: 'partnership',
  reseller: 'partnership',
  afiliasi: 'partnership',
  features: 'partnership',
  wishlist: 'wishlist',
  favorit: 'wishlist',
  profil: 'profile',
  profile: 'profile',
  keamanan: 'security',
  security: 'security',
  password: 'security'
};

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function ClientAccountPage() {
  const navigate = useNavigate();
  const routeParams = useParams<{ tab?: string }>();
  const { data } = useLandingData();
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const { client, updateProfile, changePassword, logout, openAuthModal, isLoading } = useClientAuth();
  const { getCleanWa } = useBusinessProfile();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'orders' | 'tracker' | 'vault' | 'games' | 'apps' | 'features' | 'digital' | 'partnership' | 'profile' | 'wishlist' | 'security'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && SLUG_TO_TAB[p.toLowerCase()]) return SLUG_TO_TAB[p.toLowerCase()];
    }
    return 'tracker';
  });
  
  // Tier Suite State
  const [resellerSellPrice, setResellerSellPrice] = useState<number>(3500000);
  const [resellerStudioCost, setResellerStudioCost] = useState<number>(2000000);
  const [quoteClientName, setQuoteClientName] = useState('');
  const [quoteServiceName, setQuoteServiceName] = useState('');
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [quoteNotes, setQuoteNotes] = useState('Termin: DP 50%, Pelunasan 50% setelah serah terima.');

  const [affiliateTargetPage, setAffiliateTargetPage] = useState<'home' | 'catalog' | 'services' | 'contact'>('catalog');
  const [affiliateChannel, setAffiliateChannel] = useState<'whatsapp' | 'instagram' | 'tiktok' | 'twitter' | 'facebook'>('whatsapp');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [activeTierSubTab, setActiveTierSubTab] = useState<string>('default');
  const [ndaClientCompany, setNdaClientCompany] = useState('');
  const [ndaProjectTitle, setNdaProjectTitle] = useState('');
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
  const [activeProofingProject, setActiveProofingProject] = useState<any | null>(null);

  // Profile Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  // Bank & Kemitraan State
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

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

  // Smoothly center active tab in horizontal scrollable bar on mobile
  useEffect(() => {
    if (isMobile && tabContainerRef.current) {
      const activeEl = tabContainerRef.current.querySelector('[data-tab-active="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab, isMobile]);

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
      setBankName(client.bankDetails?.bankName || '');
      setAccountNumber(client.bankDetails?.accountNumber || '');
      setAccountHolder(client.bankDetails?.accountHolder || '');

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

      // Ambil Proyek & Layanan Klien dari porto_projects & porto_transactions secara komprehensif
      Promise.all([
        storage.getItem<any[]>('porto_projects', []),
        storage.getItem<any[]>('porto_transactions', [])
      ]).then(([projs, trxs]) => {
        const clientEmail = (client.email || '').toLowerCase().trim();
        const clientName = (client.name || '').toLowerCase().trim();
        const clientPhone = (client.phone || '').trim();

        const myProjects: any[] = [];

        // 1. Proyek dari Porto Projects
        (projs || []).forEach((p: any) => {
          if (!p || !p.id) return;
          const pEmail = (p.clientEmail || p.customerEmail || '').toLowerCase().trim();
          const pName = (p.clientName || p.customerName || p.client || '').toLowerCase().trim();
          const pPhone = (p.clientPhone || p.customerPhone || '').trim();

          const isMatch = (p.clientId && p.clientId === client.id) ||
                          (clientEmail && pEmail && pEmail === clientEmail) ||
                          (clientPhone && pPhone && (pPhone === clientPhone || pPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, ''))) ||
                          (clientName && pName && pName === clientName);

          if (isMatch && !myProjects.some(x => x.id === p.id)) {
            myProjects.push(p);
          }
        });

        // 2. Transaksi Jasa Website / Desain yang belum memiliki kartu proyek terpisah
        (trxs || []).forEach((trx: any) => {
          if (!trx || !trx.id) return;
          const cust = trx.customer || {};
          const cEmail = (cust.email || '').toLowerCase().trim();
          const cPhone = (cust.phone || '').trim();
          const cName = (cust.name || '').toLowerCase().trim();

          const isMatch = (cust.clientId && cust.clientId === client.id) ||
                          (clientEmail && cEmail && cEmail === clientEmail) ||
                          (clientPhone && cPhone && (cPhone === clientPhone || cPhone.replace(/\D/g, '') === clientPhone.replace(/\D/g, ''))) ||
                          (clientName && cName && cName === clientName);

          if (isMatch && !myProjects.some(x => x.id === trx.id)) {
            const firstItem = (trx.items || [])[0] || {};
            myProjects.push({
              id: trx.id,
              clientId: client.id,
              title: (trx.items || []).map((i: any) => i.name).join(', ') || 'Layanan Agensi & Website',
              clientName: cust.name || client.name,
              clientEmail: cust.email || client.email,
              clientPhone: cust.phone || client.phone,
              budget: trx.grandTotal || 0,
              status: trx.paymentStatus === 'lunas' ? 'completed' : 'in_progress',
              progress: trx.paymentStatus === 'lunas' ? 100 : (trx.paymentStatus === 'dp' ? 50 : 20),
              startDate: trx.createdAt || trx.date || new Date().toISOString(),
              previewUrl: trx.driveUrl || '',
              description: trx.notes || 'Pesanan layanan kreatif',
              category: 'Website & Design'
            });
          }
        });

        setClientProjects(myProjects);
      }).catch(() => setClientProjects([]));
    }
  }, [client, location.pathname, searchParams]);

  useEffect(() => {
    const rawParam = routeParams.tab || searchParams.get('tab');
    if (rawParam) {
      const lower = rawParam.toLowerCase();
      if (SLUG_TO_TAB[lower]) {
        setActiveTab(SLUG_TO_TAB[lower]);
      }
    }
  }, [routeParams.tab, searchParams]);

  const handleTabChange = (targetTab: typeof activeTab) => {
    haptic.light();
    setActiveTab(targetTab);
    setStatusMsg(null);
    const slug = TAB_SLUGS[targetTab] || targetTab;
    navigate(`/akun/${slug}`, { replace: true });
  };

  const [clientProjects, setClientProjects] = useState<any[]>([]);

  // ── Public Invoice / Order QR Verification State ──
  const [verifiedInvoiceData, setVerifiedInvoiceData] = useState<{
    order?: any;
    trx?: any;
    query: string;
  } | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isVerifyingInvoice, setIsVerifyingInvoice] = useState(false);

  useEffect(() => {
    const orderQuery = searchParams.get('order') || searchParams.get('invoice');
    if (!orderQuery) return;

    setIsVerifyingInvoice(true);
    (async () => {
      try {
        const [ordersList, trxsList] = await Promise.all([
          lookupClientOrder(orderQuery),
          storage.getItem<any[]>('porto_transactions', [])
        ]);

        const qLower = orderQuery.trim().toLowerCase();
        const matchedTrx = Array.isArray(trxsList)
          ? trxsList.find((t: any) => t && (
              t.id?.toLowerCase() === qLower ||
              (t.invoiceNumber && t.invoiceNumber.toLowerCase() === qLower)
            ))
          : null;
        const matchedOrder = (ordersList && ordersList.length > 0) ? ordersList[0] : null;

        if (matchedTrx || matchedOrder) {
          setVerifiedInvoiceData({
            order: matchedOrder,
            trx: matchedTrx,
            query: orderQuery
          });
          setShowInvoiceModal(true);
        }
      } catch (err) {
        console.warn('[ClientAccountPage] Invoice verification error:', err);
      } finally {
        setIsVerifyingInvoice(false);
      }
    })();
  }, [searchParams]);

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    setVerifiedInvoiceData(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('order');
    newParams.delete('invoice');
    newParams.delete('pay');
    newParams.delete('amount');
    setSearchParams(newParams, { replace: true });
  };

  const accentColor = data?.theme?.accentColor || '#7c3aed';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const pageBg = isDark ? '#06070a' : '#eef2f6';

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

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) {
      showToast('Harap lengkapi semua kolom rekening bank / e-wallet.', 'error');
      return;
    }
    setIsSavingBank(true);
    try {
      await updateProfile({
        bankDetails: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
        }
      });
      showToast('Informasi Rekening Berhasil Disimpan', 'Rekening pencairan dana komisi telah diperbarui.', 'success');
    } catch (err: any) {
      showToast('Gagal Menyimpan Rekening', err.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setIsSavingBank(false);
    }
  };

  const affiliateReferralCode = client?.affiliateCode || (client?.id ? client.id.substring(0, 8).toUpperCase() : 'SUMR');
  const referralUrl = `${window.location.origin}/?ref=${affiliateReferralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText(referralUrl);
    showToast('Tautan Disalin!', `Link referral: ${referralUrl}`, 'success');
  };

  const handleShareWA = () => {
    const text = encodeURIComponent(
      `Halo! Kunjungi ${data?.navbar?.logoText || 'sumr.day'} untuk melihat portofolio & layanan kreatif terbaik melalui link rekomendasi saya:\n${referralUrl}\n\nGunakan kode referal: *${affiliateReferralCode}*`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRequestWithdrawal = () => {
    const bal = client?.affiliateBalance || 0;
    if (bal <= 0) {
      showToast('Saldo Komisi Kosong', 'Anda belum memiliki saldo komisi yang dapat ditarik.', 'error');
      return;
    }
    const bankInfo = client?.bankDetails?.bankName 
      ? `Rekening: ${client.bankDetails.bankName} - ${client.bankDetails.accountNumber} a/n ${client.bankDetails.accountHolder}`
      : 'Belum mengisi rekening di dashboard';
    const text = encodeURIComponent(
      `Halo Admin sumr.day, saya ingin mengajukan pencairan saldo komisi afiliasi:\n\nNama: ${client?.name}\nEmail: ${client?.email}\nKode Afiliasi: ${affiliateReferralCode}\nJumlah Penarikan: ${formatRp(bal)}\n${bankInfo}\n\nMohon diproses, terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, '_blank');
  };

  
  const renderTierTools = () => {
    if (!client) return null;
    return (
<div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header Feature Suite */}
                <div style={{
                  padding: isMobile ? '20px 18px' : '26px 28px',
                  borderRadius: 24,
                  background: cardBg,
                  border: `1.5px solid ${
                    client.membershipTier === 'reseller' ? 'rgba(59,130,246,0.3)'
                    : client.membershipTier === 'affiliate' ? 'rgba(236,72,153,0.3)'
                    : client.membershipTier === 'vip' ? 'rgba(245,158,11,0.3)'
                    : cardBorder
                  }`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: client.membershipTier === 'reseller' ? 'rgba(59,130,246,0.15)'
                          : client.membershipTier === 'affiliate' ? 'rgba(236,72,153,0.15)'
                          : client.membershipTier === 'vip' ? 'rgba(245,158,11,0.15)'
                          : 'rgba(124,58,237,0.15)',
                        color: client.membershipTier === 'reseller' ? '#3b82f6'
                          : client.membershipTier === 'affiliate' ? '#ec4899'
                          : client.membershipTier === 'vip' ? '#f59e0b'
                          : accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {client.membershipTier === 'reseller' && <Calculator size={26} />}
                        {client.membershipTier === 'affiliate' && <Share2 size={26} />}
                        {client.membershipTier === 'vip' && <Crown size={26} />}
                        {(!client.membershipTier || client.membershipTier === 'regular') && <Sparkles size={26} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h2 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 900, color: textColor }}>
                            {client.membershipTier === 'reseller' && 'Suite Mitra Reseller'}
                            {client.membershipTier === 'affiliate' && 'Suite Mitra Afiliasi'}
                            {client.membershipTier === 'vip' && 'VIP Partner Concierge'}
                            {(!client.membershipTier || client.membershipTier === 'regular') && 'Utilitas & Akses Klien'}
                          </h2>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 900,
                            padding: '3px 10px',
                            borderRadius: 100,
                            background: client.membershipTier === 'reseller' ? 'rgba(59,130,246,0.15)'
                              : client.membershipTier === 'affiliate' ? 'rgba(236,72,153,0.15)'
                              : client.membershipTier === 'vip' ? 'rgba(245,158,11,0.15)'
                              : (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
                            color: client.membershipTier === 'reseller' ? '#3b82f6'
                              : client.membershipTier === 'affiliate' ? '#ec4899'
                              : client.membershipTier === 'vip' ? '#f59e0b'
                              : subTextColor,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                          }}>
                            {client.membershipTier === 'reseller' ? `Diskon ${client.resellerDiscountRate || 15}% Aktif`
                              : client.membershipTier === 'affiliate' ? `Komisi ${client.affiliateCommissionRate || 10}% Aktif`
                              : client.membershipTier === 'vip' ? 'Dual-Benefit VIP'
                              : 'Tingkat Standar'}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: subTextColor, maxWidth: 640, lineHeight: 1.5 }}>
                          {client.membershipTier === 'reseller' && 'Hitung potensi margin keuntungan, buat draf penawaran white-label untuk klien Anda, serta unduh materi promosi tanpa merek.'}
                          {client.membershipTier === 'affiliate' && 'Buat tautan promosi berparameter kampanye, salin copywriting teruji, dan pantau proyeksi komisi pasif Anda.'}
                          {client.membershipTier === 'vip' && 'Akses jalur hotline prioritas dedicated, antrean fast-track proyek, draf NDA instan, serta seluruh alat reseller & afiliasi.'}
                          {(!client.membershipTier || client.membershipTier === 'regular') && 'Pantau progres transaksi Anda menuju level Mitra, unduh starter kit gratis, atau ajukan upgrade akun ke admin.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Feature Sections depending on Tier */}
                {/* 1. RESELLER TIER */}
                {client.membershipTier === 'reseller' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Grid of 2 Main Interactive Reseller Tools */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18 }}>
                      
                      {/* Tool A: Kalkulator Margin & Simulasi Profit */}
                      <div style={{
                        padding: 22,
                        borderRadius: 22,
                        background: cardBg,
                        border: `1.5px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Calculator size={18} />
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                                Kalkulator Margin
                              </h3>
                              <span style={{ fontSize: 11.5, color: subTextColor }}>Simulasi profit per proyek</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 100, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                            Diskon {client.resellerDiscountRate || 15}%
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>
                              Harga Pokok Studio (Modal Awal)
                            </label>
                            <input
                              type="number"
                              value={resellerStudioCost || ''}
                              onChange={(e) => setResellerStudioCost(Number(e.target.value) || 0)}
                              placeholder="Contoh: 2000000"
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '10px 14px',
                                borderRadius: 12,
                                border: `1.5px solid ${cardBorder}`,
                                background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                                color: textColor,
                                fontSize: 13.5,
                                fontWeight: 700,
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>
                              Harga Jual ke Klien Anda
                            </label>
                            <input
                              type="number"
                              value={resellerSellPrice || ''}
                              onChange={(e) => setResellerSellPrice(Number(e.target.value) || 0)}
                              placeholder="Contoh: 3500000"
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '10px 14px',
                                borderRadius: 12,
                                border: `1.5px solid ${cardBorder}`,
                                background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                                color: textColor,
                                fontSize: 13.5,
                                fontWeight: 700,
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Quick Presets */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {[1500000, 3000000, 5000000, 10000000].map((preset) => (
                              <button
                                key={preset}
                                onClick={() => {
                                  setResellerStudioCost(preset);
                                  setResellerSellPrice(Math.round(preset * 1.5));
                                }}
                                style={{
                                  fontSize: 10.5,
                                  padding: '4px 8px',
                                  borderRadius: 8,
                                  border: `1px solid ${cardBorder}`,
                                  background: 'transparent',
                                  color: subTextColor,
                                  cursor: 'pointer'
                                }}
                              >
                                {preset >= 1000000 ? `${preset / 1000000} Jt` : `${preset / 1000} Rb`}
                              </button>
                            ))}
                          </div>

                          {/* Calculation Output Box */}
                          {(() => {
                            const discRate = client.resellerDiscountRate || 15;
                            const effectiveCost = Math.round(resellerStudioCost * (1 - discRate / 100));
                            const profit = Math.max(0, resellerSellPrice - effectiveCost);
                            const marginPct = resellerSellPrice > 0 ? ((profit / resellerSellPrice) * 100).toFixed(1) : '0';

                            return (
                              <div style={{
                                padding: 14,
                                borderRadius: 16,
                                background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                                border: '1px solid rgba(59,130,246,0.25)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: subTextColor }}>
                                  <span>Modal Studio (Diskon {discRate}%):</span>
                                  <strong style={{ color: textColor }}>{formatRp(effectiveCost)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: subTextColor }}>
                                  <span>Harga Jual Klien:</span>
                                  <strong style={{ color: textColor }}>{formatRp(resellerSellPrice)}</strong>
                                </div>
                                <div style={{ height: 1, background: 'rgba(59,130,246,0.2)', margin: '2px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#3b82f6' }}>
                                      Estimasi Keuntungan Bersih
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                                      {formatRp(profit)}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 900, padding: '4px 10px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                    Margin {marginPct}%
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    const text = `Simulasi Margin Reseller:\n- Harga Studio: ${formatRp(resellerStudioCost)}\n- Modal Reseller (${discRate}% OFF): ${formatRp(effectiveCost)}\n- Harga Klien: ${formatRp(resellerSellPrice)}\n- Keuntungan: ${formatRp(profit)} (${marginPct}%)`;
                                    navigator.clipboard.writeText(text);
                                    showToast('Disalin', 'Rincian margin berhasil disalin ke clipboard.', 'success');
                                  }}
                                  style={{
                                    marginTop: 4,
                                    height: 32,
                                    borderRadius: 100,
                                    border: 'none',
                                    background: '#3b82f6',
                                    color: '#fff',
                                    fontSize: 11.5,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                  }}
                                >
                                  <Copy size={13} /> Salin
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Tool B: Generator Penawaran Klien (White-Label) */}
                      <div style={{
                        padding: 22,
                        borderRadius: 22,
                        background: cardBg,
                        border: `1.5px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileText size={18} />
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                                Generator Penawaran
                              </h3>
                              <span style={{ fontSize: 11.5, color: subTextColor }}>Format penawaran white-label</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            White-Label
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <input
                              type="text"
                              value={quoteClientName}
                              onChange={(e) => setQuoteClientName(e.target.value)}
                              placeholder="Nama Klien / Perusahaan Prospek"
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '9px 12px',
                                borderRadius: 10,
                                border: `1.5px solid ${cardBorder}`,
                                background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                                color: textColor,
                                fontSize: 12.5,
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              value={quoteServiceName}
                              onChange={(e) => setQuoteServiceName(e.target.value)}
                              placeholder="Nama Layanan / Paket Proyek"
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '9px 12px',
                                borderRadius: 10,
                                border: `1.5px solid ${cardBorder}`,
                                background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                                color: textColor,
                                fontSize: 12.5,
                                outline: 'none'
                              }}
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              value={quotePrice || ''}
                              onChange={(e) => setQuotePrice(Number(e.target.value) || 0)}
                              placeholder="Biaya Penawaran ke Klien (Rp)"
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '9px 12px',
                                borderRadius: 10,
                                border: `1.5px solid ${cardBorder}`,
                                background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                                color: textColor,
                                fontSize: 12.5,
                                outline: 'none'
                              }}
                            />
                          </div>

                          {/* Dynamic Quote Text Preview */}
                          {(() => {
                            const qText = `SURAT ESTIMASI PENAWARAN PROYEK\n` +
                              `================================\n` +
                              `Klien: ${quoteClientName || '[Nama Klien]'}\n` +
                              `Penyedia: ${client.name}\n` +
                              `Layanan: ${quoteServiceName || '[Nama Layanan]'}\n` +
                              `Total Investasi: ${formatRp(quotePrice)}\n` +
                              `Syarat & Ketentuan: ${quoteNotes}\n` +
                              `================================\n` +
                              `Silakan hubungi kami untuk konfirmasi dan proses mulai pengerjaan.`;

                            return (
                              <div style={{
                                padding: 12,
                                borderRadius: 12,
                                background: isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9',
                                border: `1px solid ${cardBorder}`,
                                fontSize: 11,
                                color: subTextColor,
                                whiteSpace: 'pre-wrap',
                                maxHeight: 110,
                                overflowY: 'auto',
                                lineHeight: 1.4
                              }}>
                                {qText}
                              </div>
                            );
                          })()}

                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button
                              onClick={() => {
                                const qText = `SURAT ESTIMASI PENAWARAN PROYEK\n` +
                                  `================================\n` +
                                  `Klien: ${quoteClientName || '[Nama Klien]'}\n` +
                                  `Penyedia: ${client.name}\n` +
                                  `Layanan: ${quoteServiceName || '[Nama Layanan]'}\n` +
                                  `Total Investasi: ${formatRp(quotePrice)}\n` +
                                  `Syarat & Ketentuan: ${quoteNotes}\n` +
                                  `================================\n` +
                                  `Silakan hubungi kami untuk konfirmasi dan proses mulai pengerjaan.`;
                                navigator.clipboard.writeText(qText);
                                showToast('Disalin', 'Format penawaran berhasil disalin ke clipboard.', 'success');
                              }}
                              style={{
                                flex: 1,
                                height: 34,
                                borderRadius: 100,
                                border: 'none',
                                background: '#10b981',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                              }}
                            >
                              <Copy size={13} /> Salin
                            </button>

                            <button
                              onClick={() => {
                                const qText = `Halo ${quoteClientName || 'Bapak/Ibu'}, berikut draf penawaran pengerjaan *${quoteServiceName || 'proyek'}*:\n\nTotal Investasi: ${formatRp(quotePrice)}\n${quoteNotes}\n\nDisiapkan oleh: ${client.name}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(qText)}`, '_blank');
                              }}
                              style={{
                                height: 34,
                                padding: '0 16px',
                                borderRadius: 100,
                                border: `1px solid ${cardBorder}`,
                                background: cardBg,
                                color: textColor,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <Share2 size={13} /> Bagikan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reseller Materials & Fast-Order Strip */}
                    <div style={{
                      padding: 20,
                      borderRadius: 22,
                      background: cardBg,
                      border: `1.5px solid ${cardBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={22} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            Kit Pemasaran & Mockup Polos
                          </h4>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: subTextColor }}>
                            Unduh template proposal, mockup 3D tanpa watermark, dan lembar brief kerja untuk klien Anda.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            showToast('Unduhan Siap', 'Paket materi reseller sedang diunduh.', 'success');
                          }}
                          style={{
                            height: 36,
                            padding: '0 18px',
                            borderRadius: 100,
                            border: `1.5px solid ${cardBorder}`,
                            background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                            color: textColor,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Download size={13} /> Unduh
                        </button>

                        <button
                          onClick={() => {
                            const msg = `Halo Admin Studio, saya Reseller resmi [${client.name}], ingin submit order klien baru dengan kupon reseller.`;
                            window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          style={{
                            height: 36,
                            padding: '0 18px',
                            borderRadius: 100,
                            border: 'none',
                            background: '#3b82f6',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <MessageCircle size={14} /> Pesan
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AFFILIATE TIER */}
                {client.membershipTier === 'affiliate' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18 }}>
                      
                      {/* Tool A: Smart UTM & Campaign Link Generator */}
                      <div style={{
                        padding: 22,
                        borderRadius: 22,
                        background: cardBg,
                        border: `1.5px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(236,72,153,0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Share2 size={18} />
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                                Smart Link Builder
                              </h3>
                              <span style={{ fontSize: 11.5, color: subTextColor }}>Tautan referral ber-tag saluran</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 100, background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>
                            Komisi {client.affiliateCommissionRate || 10}%
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>
                              Pilih Halaman Tujuan
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              {[
                                { id: 'catalog', label: 'Katalog' },
                                { id: 'home', label: 'Beranda' },
                                { id: 'services', label: 'Layanan' },
                                { id: 'contact', label: 'Kontak' },
                              ].map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => setAffiliateTargetPage(p.id as any)}
                                  style={{
                                    padding: '7px 10px',
                                    borderRadius: 10,
                                    border: `1.5px solid ${affiliateTargetPage === p.id ? '#ec4899' : cardBorder}`,
                                    background: affiliateTargetPage === p.id ? 'rgba(236,72,153,0.12)' : 'transparent',
                                    color: affiliateTargetPage === p.id ? '#ec4899' : textColor,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: subTextColor, display: 'block', marginBottom: 4 }}>
                              Pilih Saluran Promosi
                            </label>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {[
                                { id: 'whatsapp', label: 'WhatsApp' },
                                { id: 'instagram', label: 'Instagram' },
                                { id: 'tiktok', label: 'TikTok' },
                                { id: 'twitter', label: 'X/Twitter' },
                                { id: 'facebook', label: 'Facebook' },
                              ].map((ch) => (
                                <button
                                  key={ch.id}
                                  onClick={() => setAffiliateChannel(ch.id as any)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: 8,
                                    border: `1px solid ${affiliateChannel === ch.id ? '#ec4899' : cardBorder}`,
                                    background: affiliateChannel === ch.id ? 'rgba(236,72,153,0.12)' : 'transparent',
                                    color: affiliateChannel === ch.id ? '#ec4899' : subTextColor,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {ch.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Generated Link Preview */}
                          {(() => {
                            const baseUrl = window.location.origin;
                            const path = affiliateTargetPage === 'home' ? '' : `/${affiliateTargetPage}`;
                            const fullRefLink = `${baseUrl}${path}?ref=${client.affiliateCode || client.id}&utm_source=${affiliateChannel}`;

                            return (
                              <div style={{
                                padding: 12,
                                borderRadius: 12,
                                background: isDark ? 'rgba(236,72,153,0.08)' : '#fdf2f8',
                                border: '1px solid rgba(236,72,153,0.25)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6
                              }}>
                                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#ec4899', textTransform: 'uppercase' }}>
                                  Tautan Kampanye Siap Pakai
                                </span>
                                <div style={{
                                  fontSize: 11.5,
                                  color: textColor,
                                  wordBreak: 'break-all',
                                  fontFamily: 'monospace',
                                  fontWeight: 600
                                }}>
                                  {fullRefLink}
                                </div>

                                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(fullRefLink);
                                      showToast('Disalin', 'Tautan referral berhasil disalin ke clipboard.', 'success');
                                    }}
                                    style={{
                                      flex: 1,
                                      height: 32,
                                      borderRadius: 100,
                                      border: 'none',
                                      background: '#ec4899',
                                      color: '#fff',
                                      fontSize: 12,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6
                                    }}
                                  >
                                    <Copy size={13} /> Salin
                                  </button>

                                  <button
                                    onClick={() => {
                                      const shareText = `Halo! Cek katalog produk dan layanan digital rekomendasi saya di sini:\n${fullRefLink}`;
                                      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                                    }}
                                    style={{
                                      height: 32,
                                      padding: '0 14px',
                                      borderRadius: 100,
                                      border: `1px solid ${cardBorder}`,
                                      background: cardBg,
                                      color: textColor,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 5
                                    }}
                                  >
                                    <Share2 size={13} /> Bagikan
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Tool B: Koleksi Copywriting Siap Pakai (Swipe File) */}
                      <div style={{
                        padding: 22,
                        borderRadius: 22,
                        background: cardBg,
                        border: `1.5px solid ${cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MessageCircle size={18} />
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                                Copywriting Promosi
                              </h3>
                              <span style={{ fontSize: 11.5, color: subTextColor }}>Template broadcast & status</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            Siap Pakai
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[
                            {
                              id: 'promo_diskon',
                              title: 'Promo Diskon Kupon',
                              text: `Lagi butuh bikin website, aplikasi, atau desain branding profesional? Pakai kode kupon saya *${client.affiliateCode || 'SUMRPRO'}* di ${window.location.origin}/katalog?ref=${client.affiliateCode || client.id} buat dapetin potongan harga langsung!`
                            },
                            {
                              id: 'rekomendasi',
                              title: 'Rekomendasi Digital Studio',
                              text: `Buat teman-teman yang mau digitalisasi bisnis atau event dengan visual premium, sangat rekomendasi tim di ${window.location.origin}?ref=${client.affiliateCode || client.id}. Pengerjaan cepat, revisi terjamin, dan hasilnya memuaskan!`
                            },
                          ].map((t) => (
                            <div
                              key={t.id}
                              style={{
                                padding: 12,
                                borderRadius: 14,
                                background: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
                                border: `1px solid ${cardBorder}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: 12, color: textColor }}>{t.title}</strong>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(t.text);
                                    showToast('Disalin', 'Teks promosi berhasil disalin ke clipboard.', 'success');
                                  }}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 100,
                                    border: 'none',
                                    background: 'rgba(16,185,129,0.15)',
                                    color: '#10b981',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <Copy size={11} /> Salin
                                </button>
                              </div>
                              <p style={{ margin: 0, fontSize: 11.5, color: subTextColor, lineHeight: 1.4 }}>
                                {t.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. VIP TIER */}
                {client.membershipTier === 'vip' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* VIP Concierge Card */}
                    <div style={{
                      padding: 24,
                      borderRadius: 22,
                      background: isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(30,41,59,0.9))' : 'linear-gradient(135deg, rgba(245,158,11,0.1), #fffbeb)',
                      border: '1.5px solid rgba(245,158,11,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 20,
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Crown size={26} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            VIP Dedicated Concierge
                          </h3>
                          <p style={{ margin: '3px 0 0', fontSize: 13, color: subTextColor }}>
                            Jalur hotline khusus VIP Partner. SLA respon teknis & render prioritas &lt; 15 menit setiap saat.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => {
                            const msg = `Halo Tim Senior Studio, saya VIP Partner [${client.name}], membutuhkan konsultasi prioritas langsung.`;
                            window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          style={{
                            height: 38,
                            padding: '0 20px',
                            borderRadius: 100,
                            border: 'none',
                            background: '#f59e0b',
                            color: '#ffffff',
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7
                          }}
                        >
                          <MessageCircle size={15} /> Hotline
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. REGULAR TIER (PELANGGAN BIASA) */}
                {(!client.membershipTier || client.membershipTier === 'regular') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Tier Roadmap Progress Card */}
                    <div style={{
                      padding: 24,
                      borderRadius: 22,
                      background: cardBg,
                      border: `1.5px solid ${cardBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,58,237,0.15)', color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={20} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              Jalur Menuju Kemitraan
                            </h3>
                            <span style={{ fontSize: 12, color: subTextColor }}>Selesaikan pesanan untuk membuka level Reseller atau Afiliasi</span>
                          </div>
                        </div>

                        <span style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>
                          {orders.length} / 3 Pesanan Selesai
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: 8, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, (orders.length / 3) * 100)}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${accentColor}, #ec4899)`,
                          borderRadius: 100,
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
                        <div style={{ padding: 12, borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: subTextColor }}>LANGKAH 1</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: textColor, marginTop: 2 }}>Transaksi Aktif</div>
                          <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 2 }}>Lakukan pemesanan aset atau proyek di katalog.</div>
                        </div>

                        <div style={{ padding: 12, borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: subTextColor }}>LANGKAH 2</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: textColor, marginTop: 2 }}>Pilih Kemitraan</div>
                          <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 2 }}>Tentukan jalur Reseller (diskon) atau Afiliasi (komisi).</div>
                        </div>

                        <div style={{ padding: 12, borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: subTextColor }}>LANGKAH 3</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: textColor, marginTop: 2 }}>Aktivasi CMS</div>
                          <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 2 }}>Admin memverifikasi akun Anda dalam waktu 1x24 jam.</div>
                        </div>
                      </div>
                    </div>

                    {/* Free Starter Kit Downloads */}
                    <div style={{
                      padding: 22,
                      borderRadius: 22,
                      background: cardBg,
                      border: `1.5px solid ${cardBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Download size={18} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              Starter Kit Klien Gratis
                            </h4>
                            <span style={{ fontSize: 11.5, color: subTextColor }}>Aset panduan untuk mempermudah pengerjaan proyek Anda</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                          Gratis
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
                        {[
                          { title: 'Template Brief Proyek', desc: 'Panduan merangkum kebutuhan desain & web.' },
                          { title: 'Checklist Aset Brand', desc: 'Daftar resolusi logo, warna, dan font siap pakai.' },
                          { title: 'Panduan Launching Web', desc: 'Langkah cek domain, hosting, dan SEO dasar.' },
                        ].map((kit, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: 14,
                              borderRadius: 14,
                              background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                              border: `1px solid ${cardBorder}`,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: 10
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: 13, color: textColor, display: 'block', marginBottom: 3 }}>
                                {kit.title}
                              </strong>
                              <p style={{ margin: 0, fontSize: 11.5, color: subTextColor, lineHeight: 1.4 }}>
                                {kit.desc}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                showToast('Unduhan Berhasil', `File ${kit.title} berhasil diunduh.`, 'success');
                              }}
                              style={{
                                height: 32,
                                borderRadius: 100,
                                border: 'none',
                                background: '#10b981',
                                color: '#ffffff',
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5
                              }}
                            >
                              <Download size={12} /> Unduh
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instant Upgrade Request Button */}
                    <div style={{
                      padding: 20,
                      borderRadius: 22,
                      background: isDark ? 'rgba(124,58,237,0.1)' : '#f5f3ff',
                      border: '1.5px solid rgba(124,58,237,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                          Siap Menjadi Mitra Reseller atau Afiliasi?
                        </h4>
                        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: subTextColor }}>
                          Kirimkan pesan langsung ke Admin untuk aktivasi level kemitraan akun Anda sekarang.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const msg = `Halo Admin Studio, saya [${client.name}] (${client.email}) ingin mengajukan upgrade akun saya menjadi Mitra Reseller / Afiliasi resmi. Mohon dibantu aktivasinya.`;
                          window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        style={{
                          height: 38,
                          padding: '0 20px',
                          borderRadius: 100,
                          border: 'none',
                          background: accentColor,
                          color: '#ffffff',
                          fontSize: 12.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <MessageCircle size={15} /> Ajukan
                      </button>
                    </div>
                  </div>
                )}
              </div>
    );
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
        maxWidth: 1360, 
        margin: '0 auto', 
        padding: isMobile ? '110px 16px 80px' : '130px 28px 100px', 
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
                      Terverifikasi
                    </span>
                    {client.membershipTier === 'reseller' && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 100, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                        Reseller
                      </span>
                    )}
                    {client.membershipTier === 'affiliate' && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 100, background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                        Afiliasi
                      </span>
                    )}
                    {client.membershipTier === 'vip' && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 100, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                        VIP
                      </span>
                    )}
                    {(!client.membershipTier || client.membershipTier === 'regular') && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>
                        Pelanggan
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor, margin: 0, wordBreak: 'break-all' }}>
                    {client.email} {client.phone ? `• ${client.phone}` : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    navigate('/keranjang');
                  }}
                  title="Keranjang"
                  aria-label="Keranjang"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    border: `1.5px solid ${cardBorder}`,
                    background: cardBg,
                    color: textColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <ShoppingCart size={18} color={accentColor} />
                </button>
                <button
                  onClick={logout}
                  title="Keluar"
                  aria-label="Keluar"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.08)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            {/* Tier Privilege Banner */}
            <div style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: isMobile ? '14px 16px' : '16px 20px',
              borderRadius: 20,
              background: client.membershipTier === 'reseller'
                ? (isDark ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(30,41,59,0.85))' : 'linear-gradient(135deg, rgba(59,130,246,0.1), #eff6ff)')
                : client.membershipTier === 'affiliate'
                ? (isDark ? 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(30,41,59,0.85))' : 'linear-gradient(135deg, rgba(236,72,153,0.1), #fdf2f8)')
                : client.membershipTier === 'vip'
                ? (isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(30,41,59,0.85))' : 'linear-gradient(135deg, rgba(245,158,11,0.1), #fffbeb)')
                : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
              border: `1.5px solid ${
                client.membershipTier === 'reseller' ? 'rgba(59,130,246,0.35)'
                : client.membershipTier === 'affiliate' ? 'rgba(236,72,153,0.35)'
                : client.membershipTier === 'vip' ? 'rgba(245,158,11,0.35)'
                : cardBorder
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: client.membershipTier === 'reseller' ? 'rgba(59,130,246,0.2)'
                    : client.membershipTier === 'affiliate' ? 'rgba(236,72,153,0.2)'
                    : client.membershipTier === 'vip' ? 'rgba(245,158,11,0.2)'
                    : 'rgba(124,58,237,0.15)',
                  color: client.membershipTier === 'reseller' ? '#3b82f6'
                    : client.membershipTier === 'affiliate' ? '#ec4899'
                    : client.membershipTier === 'vip' ? '#f59e0b'
                    : accentColor
                }}>
                  {client.membershipTier === 'reseller' && <Percent size={20} />}
                  {client.membershipTier === 'affiliate' && <Coins size={20} />}
                  {client.membershipTier === 'vip' && <Crown size={20} />}
                  {(!client.membershipTier || client.membershipTier === 'regular') && <Award size={20} />}
                </div>
                <div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: 900,
                    color: textColor,
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    {client.membershipTier === 'reseller' && `Mitra Reseller Aktif • Diskon ${client.resellerDiscountRate || 15}% Otomatis`}
                    {client.membershipTier === 'affiliate' && `Mitra Afiliasi Aktif • Komisi ${client.affiliateCommissionRate || 10}% Tiap Referral`}
                    {client.membershipTier === 'vip' && 'Akses VIP Partner Studio • Prioritas Fast-Track & Dedicated Concierge'}
                    {(!client.membershipTier || client.membershipTier === 'regular') && 'Tingkatkan Level Akun ke Reseller atau Afiliasi'}
                  </div>
                  <div style={{ fontSize: 12, color: subTextColor, marginTop: 1 }}>
                    {client.membershipTier === 'reseller' && 'Gunakan kalkulator margin, generator penawaran, dan download kit materi.'}
                    {client.membershipTier === 'affiliate' && 'Buat tautan promosi ber-tag kampanye dan gunakan copywriting siap pakai.'}
                    {client.membershipTier === 'vip' && 'Nikmati benefit potongan grosir, komisi referral, dan concierge prioritas.'}
                    {(!client.membershipTier || client.membershipTier === 'regular') && 'Dapatkan diskon khusus grosir, bagi hasil referral, dan starter kit proyek gratis.'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTabChange('partnership')}
                style={{
                  height: 34,
                  padding: '0 16px',
                  borderRadius: 100,
                  border: 'none',
                  background: client.membershipTier === 'reseller' ? '#3b82f6'
                    : client.membershipTier === 'affiliate' ? '#ec4899'
                    : client.membershipTier === 'vip' ? '#f59e0b'
                    : accentColor,
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'Outfit', sans-serif",
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
                title="Buka Hub Mitra"
              >
                <Sparkles size={14} />
                <span>Mitra</span>
              </button>
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
                  <span style={{ fontSize: 12, color: subTextColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Pesanan</span>
                  <ShoppingBag size={18} color={accentColor} />
                </div>
                <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                  {orders.length}
                </div>
              </div>

              <div style={{ padding: isMobile ? '14px 16px' : '18px 20px', borderRadius: 22, background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: subTextColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Proses</span>
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
                  <span style={{ fontSize: 12, color: subTextColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Total</span>
                  <Zap size={18} color={accentColor} />
                </div>
                <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                  {formatRp(totalSpent)}
                </div>
              </div>
            </div>

            {/* Navigation Tab Bar - Symmetrical Rata Kanan Kiri */}
            <div 
              ref={tabContainerRef}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                display: isMobile ? 'flex' : 'grid',
                gridTemplateColumns: isMobile ? undefined : 'repeat(9, 1fr)',
                gap: isMobile ? 8 : 10,
                overflowX: isMobile ? 'auto' : 'visible',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                paddingBottom: 4,
              }}>
              {[
                { id: 'vault', label: 'Brand Vault', icon: <Palette size={16} /> },
                { id: 'tracker', label: 'Proyek', count: clientProjects.length, icon: <Layers size={16} /> },
                { id: 'orders', label: 'Pesanan', count: orders.length, icon: <ShoppingBag size={16} /> },
                { id: 'digital', label: 'Aset', count: digitalOrders.length, icon: <Download size={16} /> },
                { id: 'apps', label: 'Aplikasi', count: clientGames.length, icon: <AppWindow size={16} /> },
                { id: 'partnership', label: 'Mitra', icon: <Sparkles size={16} /> },
                { id: 'wishlist', label: 'Wishlist', count: wishlistIds.length, icon: <Heart size={16} /> },
                { id: 'profile', label: 'Profil', icon: <User size={16} /> },
                { id: 'security', label: 'Keamanan', icon: <KeyRound size={16} /> },
              ].map((t) => {
                const isActive = activeTab === t.id || (t.id === 'apps' && (activeTab as string) === 'games');
                return (
                  <button
                    key={t.id}
                    data-tab-active={isActive ? "true" : undefined}
                    onClick={() => handleTabChange(t.id as any)}
                    title={t.label}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      height: 42,
                      padding: isMobile ? '0 16px' : '0 8px',
                      flexShrink: 0,
                      borderRadius: 14,
                      border: `1.5px solid ${isActive ? accentColor : cardBorder}`,
                      background: isActive ? accentColor : cardBg,
                      color: isActive ? '#ffffff' : textColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isActive ? `0 6px 18px ${accentColor}35` : (isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.03)')
                    }}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                    {t.count !== undefined && t.count > 0 && (
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: 100,
                        background: isActive ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                        color: isActive ? '#ffffff' : subTextColor,
                        fontSize: 11,
                        fontWeight: 800,
                        marginLeft: 1
                      }}>
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab: Brand Vault (Identitas Resmi & Master File Klien) */}
            {activeTab === 'vault' && (
              <div style={{ width: '100%' }}>
                <ClientBrandVault
                  clientId={client?.id}
                  clientEmail={client?.email}
                  clientPhone={client?.phone}
                  isDark={isDark}
                  accentColor={accentColor}
                />
              </div>
            )}

            {/* Tab: Aplikasi Saya (Offline-First from IndexedDB) */}
            {(activeTab === 'apps' || activeTab === 'games') && (
              <div style={{ width: '100%' }}>
                {gamesLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }}>
                    Memuat lisensi aplikasi offline Anda...
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
                    <AppWindow size={48} style={{ opacity: 0.3, color: accentColor, margin: '0 auto 14px' }} />
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: textColor }}>
                      Belum Ada Aplikasi
                    </h3>
                    <p style={{ fontSize: 13.5, color: subTextColor, margin: '0 0 18px', maxWidth: 380, lineHeight: 1.5 }}>
                      Anda belum memiliki lisensi aplikasi sewa maupun beli putus. Hubungi admin untuk mengaktifkan lisensi aplikasi Anda.
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
                                <AppWindow size={24} />
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
                              {lic.gameTitle || 'Aplikasi Instance'}
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
                                showToast('Membuka Aplikasi', `Menyiapkan ${lic.gameTitle}...`, 'info');
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
                              <Play size={13} /> Jalankan
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
                                    showToast('Download Selesai', 'Aplikasi ZIP offline berhasil diunduh.', 'success');
                                  } catch (err: any) {
                                    showToast('Gagal Download', err.message || 'Terjadi kesalahan.', 'error');
                                  } finally {
                                    setDownloadingGameId(null);
                                  }
                                }}
                                style={{
                                  height: 38,
                                  padding: '0 16px',
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
                                title="Unduh Aplikasi Offline murni tanpa DRM"
                              >
                                <Download size={13} /> {downloadingGameId === lic.id ? 'Proses...' : 'Unduh'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Modal Mainkan Aplikasi Sederhana (Launcher Web dengan Dynamic Instance Branding) */}
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
                            <AppWindow size={22} color={activePlayGame.customConfig?.themeColor || accentColor} />
                          )}
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{activePlayGame.gameTitle}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>Instance ID: {activePlayGame.id}</span>
                          </div>
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 800 }}>
                            APLIKASI AKTIF
                          </span>
                        </div>
                        <button
                          onClick={() => setActivePlayGame(null)}
                          style={{ padding: '7px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          <X size={14} /> Tutup
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
                          <AppWindow size={36} />
                        </div>

                        <h3 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                          Aplikasi Launcher Siap
                        </h3>

                        <p style={{ margin: '10px 0 20px', color: '#cbd5e1', fontSize: 13.5, maxWidth: 480, lineHeight: 1.6 }}>
                          Lisensi diverifikasi secara <strong>Offline-First</strong> dari IndexedDB lokal (Zero-Read Firestore). Anda memegang hak akses <strong>{activePlayGame.model === 'lifetime' ? 'Beli Putus (Permanen)' : 'Sewa Waktu'}</strong> tier <strong>{activePlayGame.tier.toUpperCase()}</strong> dengan branding eksklusif <strong>{activePlayGame.clientName}</strong>.
                        </p>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            onClick={() => showToast('Memulai Aplikasi', 'Engine Single File dimuat.', 'success')}
                            style={{
                              padding: '12px 28px', borderRadius: 100,
                              background: activePlayGame.customConfig?.themeColor || accentColor,
                              color: '#fff', border: 'none', fontWeight: 900, fontSize: 13.5, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 8,
                              boxShadow: `0 4px 16px ${activePlayGame.customConfig?.themeColor || accentColor}60`
                            }}
                          >
                            <Play size={16} fill="#fff" /> Jalankan
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
                                showToast('Download Selesai', 'Aplikasi ZIP offline berhasil diunduh.', 'success');
                              }}
                              style={{ padding: '12px 22px', borderRadius: 100, background: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                              <Download size={15} /> Unduh
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Fitur Khusus Berdasarkan Tingkatan (Tier Feature Suite) */}
            {activeTab === 'features' && renderTierTools()}

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
                      Belum Ada Aset
                    </h3>
                    <p style={{ fontSize: 13.5, color: subTextColor, margin: '0 0 18px', maxWidth: 360, lineHeight: 1.5 }}>
                      Aset digital, e-book, template, atau berkas yang Anda beli di katalog akan otomatis muncul di sini dan siap diunduh 24 jam.
                    </p>
                    <button
                      onClick={() => navigate('/katalog')}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#fff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: `0 6px 18px ${accentColor}40`
                      }}
                    >
                      <Compass size={14} />
                      <span>Katalog</span>
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
                                {isPaid ? 'LUNAS' : 'MENUNGGU'}
                              </span>
                            </div>

                            <h4 style={{ margin: '4px 0 6px', fontSize: 16.5, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              {ord.productName}
                            </h4>

                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                              <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: subTextColor, fontWeight: 700 }}>
                                {ord.fileFormat || 'ZIP / Berkas'}
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
                                  height: 40,
                                  borderRadius: 100,
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: 13,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  textDecoration: 'none',
                                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <Download size={15} /> Unduh
                              </a>
                            ) : (
                              <button
                                disabled
                                style={{
                                  width: '100%',
                                  height: 40,
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
                                <Clock size={14} /> Menunggu
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
                        padding: '10px 22px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#fff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: `0 6px 18px ${accentColor}40`
                      }}
                    >
                      <Compass size={14} />
                      <span>Katalog</span>
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

                        {/* Delivery & Review Links for Design Studio */}
                        <div style={{ paddingTop: 8, borderTop: `1px dashed ${cardBorder}`, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {(ord.figmaUrl || (ord.notes && ord.notes.includes('figma.com'))) && (
                            <a
                              href={ord.figmaUrl || ord.notes.match(/https?:\/\/(?:www\.)?figma\.com\/[^\s]+/)?.[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 16px',
                                borderRadius: 100,
                                background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))',
                                color: '#0ea5e9',
                                border: '1px solid rgba(14,165,233,0.3)',
                                fontSize: 12,
                                fontWeight: 800,
                                textDecoration: 'none'
                              }}
                            >
                              <Sparkles size={13} /> Review di Figma
                            </a>
                          )}

                          {ord.clientDriveUrl && (
                            (ord.status === 'Selesai' || ord.paymentStatus === 'lunas') ? (
                              <a
                                href={ord.clientDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 16px',
                                  borderRadius: 100,
                                  background: 'rgba(217,86,41,0.15)',
                                  color: 'var(--cms-accent, #D95629)',
                                  border: '1px solid rgba(217,86,41,0.3)',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  textDecoration: 'none'
                                }}
                              >
                                <FolderKanban size={13} /> Google Drive Master File
                              </a>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 14px',
                                  borderRadius: 100,
                                  background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                  color: subTextColor,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  border: `1px dashed ${cardBorder}`
                                }}
                              >
                                <Lock size={12} /> Drive Master File (Terkunci Hingga Pelunasan)
                              </span>
                            )
                          )}

                          {ord.status === 'Selesai' && ord.downloadUrl && (
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
                              <Download size={13} /> Unduh
                            </a>
                          )}
                        </div>
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
                      Wishlist Kosong
                    </h3>
                    <p style={{ fontSize: 13.5, color: subTextColor, margin: '0 0 18px', maxWidth: 360, lineHeight: 1.5 }}>
                      Simpan produk favorit Anda saat menjelajahi katalog dengan mengklik ikon favorit.
                    </p>
                    <button
                      onClick={() => navigate('/katalog')}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#fff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Compass size={14} />
                      <span>Katalog</span>
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
                        minWidth: 140,
                        height: 44,
                        padding: '0 24px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        boxShadow: `0 6px 18px ${accentColor}40`
                      }}
                    >
                      <Save size={15} />
                      <span>Simpan</span>
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
                    Keamanan
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
                        minWidth: 140,
                        height: 44,
                        padding: '0 24px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        boxShadow: `0 6px 18px ${accentColor}40`
                      }}
                    >
                      <KeyRound size={15} />
                      <span>Simpan</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Progres Proyek & Milestone Tracker */}
            {activeTab === 'tracker' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
                <div style={{
                  padding: isMobile ? '20px 16px' : '26px 24px',
                  borderRadius: 24,
                  background: cardBg,
                  border: `1.5px solid ${cardBorder}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <Layers size={13} /> Project Live Tracker
                    </div>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 900, color: textColor, margin: '4px 0 0' }}>
                      Pantau Progres Pengerjaan Proyek Anda
                    </h2>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor, margin: '2px 0 0' }}>
                      Setiap tahap pengerjaan desain, visual, dan koding studio kami tercatat transparan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const waNumber = getCleanWa() || '6281234567890';
                      const text = encodeURIComponent(`Halo tim sumr.day, saya ${client?.name || 'Klien'} ingin konsultasi mengenai progres pengerjaan proyek saya.`);
                      window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
                    }}
                    style={{
                      height: 40,
                      padding: '0 18px',
                      borderRadius: 100,
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#22c55e',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <MessageCircle size={15} /> Konsultasi via WhatsApp
                  </button>
                </div>

                {clientProjects.length === 0 ? (
                  <div style={{
                    padding: isMobile ? '40px 16px' : '60px 24px',
                    borderRadius: 24,
                    background: cardBg,
                    border: `1.5px dashed ${cardBorder}`,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                      <Layers size={28} />
                    </div>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, margin: 0, color: textColor }}>
                      Belum Ada Proyek
                    </h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor, margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
                      Saat Anda memesan layanan jasa kustom (branding, website, animasi) dari studio kami, timeline milestone dan status pengerjaannya akan muncul langsung di sini.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/katalog')}
                      style={{
                        marginTop: 6,
                        height: 40,
                        padding: '0 22px',
                        borderRadius: 100,
                        background: accentColor,
                        border: 'none',
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Compass size={14} />
                      <span>Katalog</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {clientProjects.map((proj: any, idx: number) => {
                      const currentStep = proj.milestoneStep || (proj.status === 'Selesai' ? 5 : proj.status === 'Review' ? 4 : proj.status === 'Produksi' ? 3 : proj.status === 'Brief' ? 2 : 1);
                      const steps = [
                        { step: 1, title: 'Brief Diterima', desc: 'Analisis kebutuhan & kick-off' },
                        { step: 2, title: 'Konsep & Produksi', desc: 'Proses desain & coding' },
                        { step: 3, title: 'QA & Review Internal', desc: 'Pengecekan kualitas studio' },
                        { step: 4, title: 'Sesi Revisi Klien', desc: 'Umpan balik & penyesuaian' },
                        { step: 5, title: 'Serah Terima Final', desc: 'File live & siap pakai' }
                      ];

                      return (
                        <div key={proj.id || idx} style={{
                          padding: isMobile ? '20px 16px' : '26px 24px',
                          borderRadius: 24,
                          background: cardBg,
                          border: `1.5px solid ${cardBorder}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 18
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                            <div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: 'rgba(124, 58, 237, 0.12)', color: accentColor, marginBottom: 6 }}>
                                ID: #{proj.id?.slice(-6) || `PRJ-${idx + 1}`} • {proj.category || 'Jasa Kreatif'}
                              </div>
                              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor, margin: 0 }}>
                                {proj.title || proj.name || 'Proyek Desain & Kreatif Studio'}
                              </h3>
                              {proj.deadline && (
                                <div style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>
                                  Target Selesai: <strong>{new Date(proj.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                                </div>
                              )}
                            </div>

                            <span style={{
                              fontSize: 12,
                              fontWeight: 800,
                              padding: '5px 14px',
                              borderRadius: 100,
                              background: proj.status === 'Selesai' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                              color: proj.status === 'Selesai' ? '#10b981' : '#f59e0b',
                              border: `1px solid ${proj.status === 'Selesai' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                            }}>
                              Status: {proj.status || 'Sedang Dikerjakan'}
                            </span>
                          </div>

                          {/* 5-Step Timeline Tracker */}
                          <div className="client-tracker-steps-grid">
                            {steps.map(s => {
                              const isCompleted = s.step < currentStep;
                              const isCurrent = s.step === currentStep;
                              return (
                                <div key={s.step} style={{
                                  padding: '12px 14px',
                                  borderRadius: 16,
                                  background: isCurrent ? `${accentColor}15` : isCompleted ? (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc') : inputBg,
                                  border: `1.5px solid ${isCurrent ? accentColor : isCompleted ? '#10b981' : cardBorder}`,
                                  position: 'relative'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <div style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      background: isCompleted ? '#10b981' : isCurrent ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'),
                                      color: '#ffffff',
                                      fontSize: 10,
                                      fontWeight: 900,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      {isCompleted ? '✓' : s.step}
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: isCurrent ? accentColor : textColor, fontFamily: "'Outfit', sans-serif" }}>
                                      {s.title}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 11, color: subTextColor, lineHeight: 1.4 }}>
                                    {s.desc}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {proj.notes && (
                            <div style={{ padding: '12px 16px', borderRadius: 14, background: inputBg, border: `1px solid ${cardBorder}`, fontSize: 12.5, color: subTextColor }}>
                              <strong style={{ color: textColor }}>Catatan Tim Studio: </strong>
                              {proj.notes}
                            </div>
                          )}

                          {/* Action Buttons: Proofing, Figma, Drive Vault & Brief */}
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 10, borderTop: `1px solid ${cardBorder}`, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                haptic.light();
                                setActiveProofingProject(proj);
                              }}
                              style={{
                                padding: '9px 18px',
                                borderRadius: 100,
                                border: 'none',
                                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                color: '#ffffff',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 7,
                                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
                              }}
                            >
                              <PenTool size={14} /> Proofing Visual
                            </button>

                            {(proj.figmaUrl || (proj.previewUrl && proj.previewUrl.includes('figma.com')) || (proj.notes && proj.notes.includes('figma.com'))) && (
                              <a
                                href={proj.figmaUrl || (proj.previewUrl && proj.previewUrl.includes('figma.com') ? proj.previewUrl : proj.notes.match(/https?:\/\/(?:www\.)?figma\.com\/[^\s]+/)?.[0])}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '9px 18px',
                                  borderRadius: 100,
                                  background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))',
                                  color: '#0ea5e9',
                                  border: '1px solid rgba(14,165,233,0.3)',
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 7
                                }}
                              >
                                <Sparkles size={14} /> Review di Figma
                              </a>
                            )}

                            {(proj.clientDriveUrl || proj.driveUrl) && (
                              (proj.status === 'Selesai' || proj.paymentStatus === 'lunas') ? (
                                <a
                                  href={proj.clientDriveUrl || proj.driveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: '9px 18px',
                                    borderRadius: 100,
                                    background: 'rgba(217,86,41,0.15)',
                                    color: 'var(--cms-accent, #D95629)',
                                    border: '1px solid rgba(217,86,41,0.3)',
                                    fontSize: 12.5,
                                    fontWeight: 800,
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7
                                  }}
                                >
                                  <FolderKanban size={14} /> Buka Drive Master File
                                </a>
                              ) : (
                                <span
                                  style={{
                                    padding: '7px 14px',
                                    borderRadius: 100,
                                    background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                    color: subTextColor,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    border: `1px dashed ${cardBorder}`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6
                                  }}
                                >
                                  <Lock size={13} /> Master File (.AI/.EPS) Terkunci (Selesaikan Pelunasan 50%)
                                </span>
                              )
                            )}

                            {proj.googleDocUrl && (
                              <a
                                href={proj.googleDocUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '9px 16px',
                                  borderRadius: 100,
                                  background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                                  color: textColor,
                                  border: `1px solid ${cardBorder}`,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <FileText size={14} /> Brief Dokumen
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const waNumber = getCleanWa() || '6281234567890';
                                const projName = proj.title || proj.name || 'Proyek Desain';
                                const projId = proj.id?.slice(-6) || proj.id || 'PRJ';
                                const text = encodeURIComponent(`Halo tim sumr.day, saya ${client?.name || 'Klien'} ingin menanyakan update mengenai proyek "${projName}" (ID: #${projId}).`);
                                window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
                              }}
                              style={{
                                padding: '9px 16px',
                                borderRadius: 100,
                                background: 'rgba(34, 197, 94, 0.12)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.25)',
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <MessageCircle size={14} /> Chat Tim Desain
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Modal Design Proofing Canvas */}
                {activeProofingProject && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16
                  }}>
                    <div style={{ width: '100%', maxWidth: 960, maxHeight: '90vh', overflowY: 'auto' }}>
                      <DesignProofingCanvas
                        orderId={activeProofingProject.id || 'PRJ-LIVE'}
                        projectName={activeProofingProject.title || activeProofingProject.name || 'Proyek Desain Studio'}
                        previewUrl={activeProofingProject.previewUrl || activeProofingProject.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                        clientName={client?.name || 'Klien'}
                        isPaid={activeProofingProject.status === 'Selesai' || activeProofingProject.paymentStatus === 'lunas'}
                        onClose={() => setActiveProofingProject(null)}
                        onDesignApproved={(approvalData) => {
                          showToast(`Proyek berhasil Anda ACC atas nama ${approvalData.signerName}!`, 'success');
                          setActiveProofingProject(null);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Kemitraan & Afiliasi (Reseller / Affiliate Hub) */}
            {activeTab === 'partnership' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
                {/* 1. Header Level Banner */}
                <div style={{
                  padding: isMobile ? '24px 18px' : '32px 28px',
                  borderRadius: 24,
                  background: client?.membershipTier === 'reseller'
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.08) 100%)'
                    : client?.membershipTier === 'affiliate'
                    ? 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(168,85,247,0.08) 100%)'
                    : client?.membershipTier === 'vip'
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.05) 100%)',
                  border: `1.5px solid ${
                    client?.membershipTier === 'reseller' ? 'rgba(59,130,246,0.3)'
                    : client?.membershipTier === 'affiliate' ? 'rgba(236,72,153,0.3)'
                    : client?.membershipTier === 'vip' ? 'rgba(245,158,11,0.3)'
                    : cardBorder
                  }`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ maxWidth: 640 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, color: client?.membershipTier === 'reseller' ? '#3b82f6' : client?.membershipTier === 'affiliate' ? '#ec4899' : client?.membershipTier === 'vip' ? '#f59e0b' : accentColor }}>
                        <Sparkles size={14} /> 
                        {client?.membershipTier === 'reseller' ? 'Level: Reseller Resmi' 
                          : client?.membershipTier === 'affiliate' ? 'Level: Mitra Afiliasi'
                          : client?.membershipTier === 'vip' ? 'Level: VIP Partner' 
                          : 'Tingkatan: Pelanggan Reguler'}
                      </div>
                      <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 20 : 24, fontWeight: 900, color: textColor, margin: '0 0 8px' }}>
                        {client?.membershipTier === 'reseller' && `Selamat! Anda Menikmati Diskon ${client.resellerDiscountRate || 15}% OFF`}
                        {client?.membershipTier === 'affiliate' && `Program Afiliasi Aktif (${client.affiliateCommissionRate || 10}% Komisi)`}
                        {client?.membershipTier === 'vip' && 'Akses VIP Partner Eksklusif Studio'}
                        {(!client?.membershipTier || client?.membershipTier === 'regular') && 'Program Kemitraan Reseller & Afiliasi'}
                      </h2>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: subTextColor, margin: 0, lineHeight: 1.6 }}>
                        {client?.membershipTier === 'reseller' && 'Akun Anda telah di-upgrade oleh Admin ke level Reseller. Anda berhak mendapatkan harga khusus dan potongan otomatis saat melakukan pemesanan.'}
                        {client?.membershipTier === 'affiliate' && 'Bagikan tautan referral atau kode kupon Anda ke calon klien. Dapatkan komisi langsung dari setiap transaksi yang berhasil diverifikasi studio.'}
                        {client?.membershipTier === 'vip' && 'Sebagai VIP Partner, Anda mendapatkan prioritas pemesanan, potongan harga reseller, serta komisi bagi hasil afiliasi penuh.'}
                        {(!client?.membershipTier || client?.membershipTier === 'regular') && 'Tingkatkan akun Anda ke level Reseller (untuk diskon khusus pemesanan) atau Mitra Afiliasi (untuk komisi bagi hasil referral). Penyetelan level dilakukan langsung oleh Admin studio.'}
                      </p>
                    </div>

                    {(!client?.membershipTier || client?.membershipTier === 'regular') && (
                      <button
                        type="button"
                        onClick={() => {
                          const waText = encodeURIComponent(
                            `Halo Admin sumr.day, saya (${client?.name} - ${client?.email}) ingin mengajukan upgrade akun saya menjadi Reseller / Mitra Afiliasi Studio.`
                          );
                          window.open(`https://wa.me/6281234567890?text=${waText}`, '_blank');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '11px 22px',
                          borderRadius: 100,
                          background: accentColor,
                          border: 'none',
                          color: '#ffffff',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: `0 6px 20px ${accentColor}40`,
                          flexShrink: 0
                        }}
                      >
                        <MessageCircle size={15} /> Daftar
                      </button>
                    )}
                  </div>

                  {/* Catatan Admin Authority */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: subTextColor }}>
                    <ShieldCheck size={14} color={accentColor} />
                    <span>Perubahan tingkatan akun (Regular ➔ Reseller/Afiliasi) diatur dan diverifikasi langsung secara eksklusif oleh Admin di CMS.</span>
                  </div>
                </div>

                {/* 1.5. Gamifikasi Kasta Mitra: Bronze -> Silver -> Gold Partner */}
                {(() => {
                  const partnerProgress = calculatePartnerTierProgress(client?.affiliateSalesCount || 0, client?.affiliateCommissionRate);
                  return (
                    <div style={{
                      padding: isMobile ? '20px 16px' : '24px 26px',
                      borderRadius: 24,
                      background: cardBg,
                      border: `1.5px solid ${cardBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: partnerProgress.badgeBg,
                            color: partnerProgress.badgeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Trophy size={22} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                                {partnerProgress.levelName}
                              </span>
                              <span style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: 100,
                                background: partnerProgress.badgeBg,
                                color: partnerProgress.badgeColor,
                                textTransform: 'uppercase'
                              }}>
                                Kasta {partnerProgress.level.toUpperCase()}
                              </span>
                            </div>
                            <span style={{ fontSize: 12, color: subTextColor }}>
                              Benefit Anda: Komisi Otomatis {partnerProgress.currentCommission}% • Diskon Mitra {partnerProgress.currentDiscount}%
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                          <span style={{ fontSize: 11, color: subTextColor, fontWeight: 700 }}>Total Penjualan:</span>
                          <div style={{ fontSize: 18, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                            {client?.affiliateSalesCount || 0} Order Berhasil
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar to Next Level */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                          <span style={{ color: subTextColor }}>
                            {partnerProgress.nextLevelName 
                              ? `Progres Menuju ${partnerProgress.nextLevelName}`
                              : 'Tingkat Kemitraan Tertinggi'}
                          </span>
                          <span style={{ color: partnerProgress.badgeColor }}>
                            {partnerProgress.progressPercent}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 10, borderRadius: 100, background: inputBg, overflow: 'hidden', border: `1px solid ${cardBorder}` }}>
                          <div style={{
                            width: `${partnerProgress.progressPercent}%`,
                            height: '100%',
                            borderRadius: 100,
                            background: `linear-gradient(90deg, ${accentColor}, ${partnerProgress.badgeColor})`,
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                        {partnerProgress.nextLevelName && (
                          <span style={{ fontSize: 11, color: subTextColor, display: 'block', marginTop: 6 }}>
                            Tingkatkan {Math.max(0, partnerProgress.targetSales - (client?.affiliateSalesCount || 0))} order lagi untuk otomatis naik ke {partnerProgress.nextLevelName} & dapatkan komisi lebih tinggi!
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Referral Link & Kupon Card (Bisa diakses jika Affiliate, Reseller, VIP, atau Regular untuk promosi) */}
                <div style={{
                  padding: isMobile ? '20px 16px' : '26px 24px',
                  borderRadius: 24,
                  background: cardBg,
                  border: `1.5px solid ${cardBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: textColor }}>
                        Tautan & Kode Kupon Afiliasi Anda
                      </h3>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: subTextColor, margin: 0 }}>
                        Bagikan link ini ke teman, klien, atau media sosial. Setiap pesanan melalui tautan ini akan terhubung ke akun Anda.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: subTextColor }}>KODE KUPON:</span>
                      <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', padding: '4px 10px', borderRadius: 8, background: inputBg, border: `1px solid ${cardBorder}`, color: accentColor, letterSpacing: 1 }}>
                        {affiliateReferralCode}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      background: inputBg,
                      border: `1.5px solid ${cardBorder}`,
                      borderRadius: 14,
                      padding: '0 14px',
                      height: 44,
                      fontSize: 13,
                      fontFamily: 'monospace',
                      color: textColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {referralUrl}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleCopyReferral}
                        style={{
                          height: 44,
                          padding: '0 18px',
                          borderRadius: 14,
                          background: cardBg,
                          border: `1.5px solid ${cardBorder}`,
                          color: textColor,
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Copy size={15} /> Salin
                      </button>
                      <button
                        type="button"
                        onClick={handleShareWA}
                        style={{
                          height: 44,
                          padding: '0 18px',
                          borderRadius: 14,
                          background: 'rgba(34, 197, 94, 0.15)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          color: '#22c55e',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Share2 size={15} /> Bagikan
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Tiga Statistik Finansial Komisi (Saldo, Total Komisi, Penjualan) */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
                  <div style={{ padding: '20px', borderRadius: 22, background: cardBg, border: `1.5px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>Saldo</span>
                        <Coins size={18} color="#10b981" />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                        {formatRp(client?.affiliateBalance || 0)}
                      </div>
                      <div style={{ fontSize: 11, color: subTextColor, marginTop: 4 }}>
                        Dapat ditarik ke rekening bank Anda kapan saja
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestWithdrawal}
                      style={{
                        marginTop: 14,
                        height: 38,
                        borderRadius: 100,
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 800,
                        fontFamily: "'Outfit', sans-serif",
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <CreditCard size={14} /> Tarik
                    </button>
                  </div>

                  <div style={{ padding: '20px', borderRadius: 22, background: cardBg, border: `1.5px solid ${cardBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>Penghasilan</span>
                      <TrendingUp size={18} color={accentColor} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                      {formatRp(client?.affiliateTotalEarnings || 0)}
                    </div>
                    <div style={{ fontSize: 11, color: subTextColor, marginTop: 4 }}>
                      Akumulasi seluruh komisi yang telah Anda peroleh
                    </div>
                  </div>

                  <div style={{ padding: '20px', borderRadius: 22, background: cardBg, border: `1.5px solid ${cardBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>Referral</span>
                      <ShoppingBag size={18} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>
                      {client?.affiliateSalesCount || 0}
                    </div>
                    <div style={{ fontSize: 11, color: subTextColor, marginTop: 4 }}>
                      Jumlah pesanan sukses dari tautan referral Anda
                    </div>
                  </div>
                </div>

                {/* 4. Alat Kerja & Utilitas Eksklusif Mitra */}
                {renderTierTools()}

                {/* 4. Rekening Bank & E-Wallet untuk Pencairan Komisi */}
                <div style={{
                  padding: isMobile ? '20px 16px' : '26px 24px',
                  borderRadius: 24,
                  background: cardBg,
                  border: `1.5px solid ${cardBorder}`
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: textColor }}>
                      Rekening Pencairan Dana Komisi
                    </h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: subTextColor, margin: 0 }}>
                      Pastikan informasi rekening bank atau e-wallet Anda valid untuk mempermudah transfer pencairan saldo komisi.
                    </p>
                  </div>

                  <form onSubmit={handleSaveBankDetails} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                          Nama Bank / E-Wallet
                        </label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Cth: BCA / Mandiri / Dana"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: 14,
                            border: `1.5px solid ${cardBorder}`,
                            background: inputBg,
                            color: textColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 13.5,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                          Nomor Rekening / No. HP E-Wallet
                        </label>
                        <input
                          type="text"
                          required
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Cth: 1234567890"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: 14,
                            border: `1.5px solid ${cardBorder}`,
                            background: inputBg,
                            color: textColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 13.5,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                          Nama Pemilik Rekening
                        </label>
                        <input
                          type="text"
                          required
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="Cth: Sesuai Buku Tabungan"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: 14,
                            border: `1.5px solid ${cardBorder}`,
                            background: inputBg,
                            color: textColor,
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 13.5,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <button
                        type="submit"
                        disabled={isSavingBank}
                        style={{
                          height: 40,
                          padding: '0 22px',
                          borderRadius: 100,
                          background: accentColor,
                          border: 'none',
                          color: '#ffffff',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: `0 4px 14px ${accentColor}35`
                        }}
                      >
                        <Save size={15} />
                        <span>{isSavingBank ? 'Proses...' : 'Simpan'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 5. Leaderboard Top Mitra & Afiliasi */}
                <div style={{
                  padding: isMobile ? '20px 16px' : '26px 24px',
                  borderRadius: 24,
                  background: cardBg,
                  border: `1.5px solid ${cardBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        <Trophy size={14} /> Affiliate Hall of Fame
                      </div>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, margin: '4px 0 0', color: textColor }}>
                        Papan Peringkat Top Mitra & Afiliasi Bulan Ini
                      </h3>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: subTextColor, margin: '2px 0 0' }}>
                        Dapatkan reward bonus komisi ekstra untuk 3 mitra dengan transaksi referral tertinggi setiap bulannya.
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      Periode Berjalan
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { rank: '#1 Juara', name: 'Mitra Unggulan Studio', count: 24, reward: 'Bonus Komisi +5%', border: 'rgba(245, 158, 11, 0.4)', bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' },
                      { rank: '#2 Runner-up', name: 'Creative Partner ID', count: 17, reward: 'Bonus Komisi +2.5%', border: 'rgba(148, 163, 184, 0.4)', bg: 'rgba(148, 163, 184, 0.08)', color: isDark ? '#e2e8f0' : '#475569' },
                      { rank: '#3 Finalis', name: 'DesignHub Agency', count: 11, reward: 'Merchandise Exclusive Studio', border: 'rgba(217, 119, 6, 0.4)', bg: 'rgba(217, 119, 6, 0.08)', color: '#d97706' }
                    ].map((m, i) => (
                      <div key={i} style={{
                        padding: '16px 18px',
                        borderRadius: 18,
                        background: m.bg,
                        border: `1.5px solid ${m.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: m.color, fontFamily: "'Outfit', sans-serif" }}>
                            {m.rank}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: textColor, margin: '6px 0 2px', fontFamily: "'Outfit', sans-serif" }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: 12, color: subTextColor }}>
                            {m.count} Pesanan Referral Sukses
                          </div>
                        </div>
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${m.border}`, fontSize: 11.5, fontWeight: 700, color: m.color }}>
                          Hadiah: {m.reward}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, color: subTextColor, textAlign: 'center', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Sparkles size={14} color="#f59e0b" />
                    <span>Bagikan tautan referral Anda ke lebih banyak klien untuk menduduki peringkat teratas dan raih bonus tambahannya!</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Public Verified Invoice Modal ── */}
      {showInvoiceModal && verifiedInvoiceData && (() => {
        const { order, trx, query } = verifiedInvoiceData;
        const invId = trx?.invoiceNumber || trx?.id || order?.orderId || order?.id || query;
        const clientName = trx?.customer?.name || order?.clientName || 'Pelanggan';
        const clientPhone = trx?.customer?.phone || order?.clientPhone || '-';
        const clientEmail = trx?.customer?.email || order?.clientEmail || '-';
        const dateStr = trx?.date || trx?.createdAt || order?.createdAt || new Date().toISOString();
        const payStatus = (trx?.paymentStatus || order?.paymentStatus || 'belum').toLowerCase();
        const grandTotal = Number(trx?.grandTotal ?? order?.total ?? 0);
        const dpPaid = Number(trx?.dpAmount ?? order?.dpAmount ?? 0);
        const remaining = Number(trx?.remaining ?? order?.remainingAmount ?? (payStatus === 'lunas' ? 0 : Math.max(0, grandTotal - dpPaid)));
        const items = trx?.items && trx.items.length > 0 
          ? trx.items 
          : [{ name: order?.productName || 'Layanan Agensi & Studio', qty: order?.quantity || 1, price: order?.price || grandTotal }];

        const isLunas = payStatus === 'lunas';
        const isDp = payStatus === 'dp';

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '12px' : '24px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: isDark ? '#111827' : '#ffffff',
              borderRadius: 24,
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              padding: isMobile ? '20px 16px' : '28px 26px',
              color: textColor,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              position: 'relative'
            }}>
              {/* Header with Verified Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 100,
                    background: isLunas ? 'rgba(16, 185, 129, 0.15)' : 'rgba(124, 58, 237, 0.12)',
                    color: isLunas ? '#10b981' : accentColor,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase'
                  }}>
                    <ShieldCheck size={14} /> Dokumen Resmi Terverifikasi
                  </div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 900, margin: '8px 0 2px', color: textColor }}>
                    Verifikasi Status Faktur
                  </h2>
                  <div style={{ fontSize: 12, color: subTextColor }}>
                    No: <strong style={{ color: textColor }}>{invId}</strong> • {new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <button
                  onClick={handleCloseInvoiceModal}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                    color: textColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Banner */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 16,
                background: isLunas 
                  ? 'rgba(16, 185, 129, 0.12)' 
                  : isDp 
                  ? 'rgba(245, 158, 11, 0.12)' 
                  : 'rgba(239, 68, 68, 0.12)',
                border: `1.5px solid ${isLunas ? '#10b981' : isDp ? '#f59e0b' : '#ef4444'}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: isLunas ? '#10b981' : isDp ? '#f59e0b' : '#ef4444',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isLunas ? <CheckCircle2 size={24} /> : isDp ? <Clock size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: isLunas ? '#10b981' : isDp ? '#f59e0b' : '#ef4444',
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    {isLunas ? 'LUNAS (TERVERIFIKASI)' : isDp ? 'PEMBAYARAN DP (BERTAHAP)' : 'MENUNGGU PEMBAYARAN'}
                  </div>
                  <div style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                    {isLunas 
                      ? 'Seluruh pembayaran telah terkonfirmasi dan tercatat sah di sistem studio.' 
                      : isDp 
                      ? `DP sebesar ${formatRp(dpPaid)} telah diterima. Sisa tagihan: ${formatRp(remaining)}.`
                      : `Total tagihan sebesar ${formatRp(grandTotal)} siap diproses.`}
                  </div>
                </div>
              </div>

              {/* Client & Studio Information */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
                padding: 14,
                borderRadius: 16,
                background: cardBg,
                border: `1px solid ${cardBorder}`
              }}>
                <div>
                  <div style={{ fontSize: 11, color: subTextColor, textTransform: 'uppercase', fontWeight: 700 }}>Klien Penerima</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: textColor, marginTop: 2 }}>{clientName}</div>
                  <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 1 }}>{clientPhone} {clientEmail !== '-' ? `• ${clientEmail}` : ''}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: subTextColor, textTransform: 'uppercase', fontWeight: 700 }}>Penerbit Resmi</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: textColor, marginTop: 2 }}>sumr.day Studio</div>
                  <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 1 }}>Digital & Creative Agency ID</div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div style={{
                borderRadius: 16,
                border: `1px solid ${cardBorder}`,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  borderBottom: `1px solid ${cardBorder}`,
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: subTextColor,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Rincian Layanan / Produk
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', padding: '6px 0' }}>
                  {items.map((it: any, idx: number) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 14px',
                      borderBottom: idx < items.length - 1 ? `1px dashed ${cardBorder}` : 'none'
                    }}>
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{it.name || 'Produk'}</div>
                        <div style={{ fontSize: 11, color: subTextColor }}>{it.qty || 1}x @ {formatRp(it.price || 0)}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>
                        {formatRp((it.price || 0) * (it.qty || 1))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div style={{
                  padding: '12px 14px',
                  background: isDark ? 'rgba(255,255,255,0.02)' : '#fcfcfd',
                  borderTop: `1px solid ${cardBorder}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: subTextColor }}>
                    <span>Total Tagihan:</span>
                    <strong style={{ color: textColor }}>{formatRp(grandTotal)}</strong>
                  </div>
                  {dpPaid > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#10b981' }}>
                      <span>Telah Dibayar (DP):</span>
                      <strong>{formatRp(dpPaid)}</strong>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 14,
                    fontWeight: 900,
                    color: remaining > 0 ? '#ef4444' : '#10b981',
                    paddingTop: 6,
                    borderTop: `1px solid ${cardBorder}`
                  }}>
                    <span>{remaining > 0 ? 'Sisa yang Harus Dibayar:' : 'Status Saldo:'}</span>
                    <span>{remaining > 0 ? formatRp(remaining) : 'Lunas (Rp 0)'}</span>
                  </div>
                </div>
              </div>

              {/* QRIS Quick Pay (if remaining balance > 0) */}
              {remaining > 0 && (
                <div style={{
                  padding: 14,
                  borderRadius: 16,
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14
                }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                      `${window.location.origin}/client/account?order=${query}&pay=true&amount=${remaining}`
                    )}`}
                    alt="QRIS Quick Pay"
                    style={{ width: 68, height: 68, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>
                      QRIS / Pembayaran Cepat
                    </div>
                    <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 2, lineHeight: 1.4 }}>
                      Scan untuk transfer sisa tagihan langsung dari m-Banking atau e-Wallet pilihan Anda.
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                <button
                  onClick={() => {
                    const waText = encodeURIComponent(
                      `Halo Admin sumr.day, saya ingin mengonfirmasi faktur resmi:\n\nNo Faktur: *${invId}*\nAtas Nama: *${clientName}*\nTotal: *${formatRp(grandTotal)}*\nStatus: *${payStatus.toUpperCase()}*\n\nMohon diverifikasi, terima kasih!`
                    );
                    window.open(`https://wa.me/6281234567890?text=${waText}`, '_blank');
                  }}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    height: 42,
                    borderRadius: 12,
                    border: 'none',
                    background: '#25D366',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <MessageCircle size={16} /> Konfirmasi WA
                </button>

                <button
                  onClick={() => window.print()}
                  style={{
                    height: 42,
                    padding: '0 16px',
                    borderRadius: 12,
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    color: textColor,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <FileText size={16} /> Cetak Bukti
                </button>

                <button
                  onClick={handleCloseInvoiceModal}
                  style={{
                    height: 42,
                    padding: '0 18px',
                    borderRadius: 12,
                    border: 'none',
                    background: accentColor,
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <LPFooter isDark={isDark} accentColor={accentColor} data={data?.footer} />
    </div>
  );
}
