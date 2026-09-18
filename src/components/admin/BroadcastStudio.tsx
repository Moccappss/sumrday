import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, BellRing, Sparkles, Users, Smartphone, Monitor, Tablet, 
  Trash2, ExternalLink, RefreshCw, Flame, BookOpen, ShoppingBag, 
  Megaphone, Tag, Link2, CheckCircle2, Clock, Eye, Layers,
  Globe, Radio, Volume2, ArrowUpRight, Check, X, Bell,
  MessageCircle, Phone, Mail, Image as ImageIcon, Upload, Shield,
  ChevronDown, ArrowRight, ShieldCheck, Zap, Apple, Compass, 
  Share2, Play
} from 'lucide-react';
import { 
  sendBroadcastCampaign, getSubscriberStats, getRecentCampaigns, 
  deleteCampaign, BroadcastCampaign, playBroadcastChime 
} from '../../utils/pushBroadcast';
import { sendNativeNotification, addNotification, NOTIF_TYPES } from '../../utils/notifications';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';

interface BroadcastStudioProps {
  onClose?: () => void;
  hideHeader?: boolean;
}

type PreviewPlatform = 'ios' | 'android' | 'island' | 'desktop';

const TEMPLATE_CATEGORIES = [
  {
    category: 'Promosi & Diskon',
    icon: <Tag size={14} color="var(--cms-accent)" />,
    items: [
      {
        type: 'promo' as const,
        label: 'Diskon Eksklusif Desain',
        title: 'Penawaran Spesial: Diskon Eksklusif Desain & Branding',
        message: 'Dapatkan penawaran terbatas untuk pesanan identitas visual & media kreatif bulan ini.',
        actionType: 'url',
        url: '/katalog',
      },
      {
        type: 'promo' as const,
        label: 'Flash Sale 24 Jam',
        title: 'Flash Sale 24 Jam: Potongan Harga Paket Kreatif',
        message: 'Hanya berlaku hari ini! Dapatkan diskon spesial untuk pemesanan semua paket desain.',
        actionType: 'url',
        url: '/katalog',
      },
      {
        type: 'promo' as const,
        label: 'Cashback & Bonus Order',
        title: 'Bonus Spesial Pemesanan Desain Pertama',
        message: 'Klaim bonus aset grafis dan revisi gratis untuk pemesanan proyek baru Anda.',
        actionType: 'url',
        url: '/katalog',
      },
    ],
  },
  {
    category: 'Konten & Blog',
    icon: <BookOpen size={14} color="#3b82f6" />,
    items: [
      {
        type: 'blog' as const,
        label: 'Tren Visual Branding 2026',
        title: 'Artikel Baru: Tren & Strategi Visual Branding 2026',
        message: 'Simak tips & inspirasi desain grafis terkini untuk meningkatkan daya tarik brand Anda.',
        actionType: 'url',
        url: '/blog',
      },
      {
        type: 'blog' as const,
        label: 'Panduan Desain Media Sosial',
        title: 'Panduan Praktis: Cara Meningkatkan Engagement Visual',
        message: 'Pelajari rahasia membuat konten visual yang menarik dan menghasilkan konversi tinggi.',
        actionType: 'url',
        url: '/blog',
      },
    ],
  },
  {
    category: 'Katalog & Portofolio',
    icon: <ShoppingBag size={14} color="#10b981" />,
    items: [
      {
        type: 'catalog' as const,
        label: 'Rilis Katalog Layanan Baru',
        title: 'Rilis Layanan Baru: Paket Desain & Konsultasi Kreatif',
        message: 'Katalog layanan kreatif terbaru kini telah tersedia. Lihat paket dan pesan langsung sekarang.',
        actionType: 'url',
        url: '/katalog',
      },
      {
        type: 'announcement' as const,
        label: 'Karya Portofolio Terbaru',
        title: 'Karya Baru Dipublikasikan di Galeri Portofolio',
        message: 'Studi kasus dan hasil karya desain terbaru telah dipublikasikan. Intip visual selengkapnya.',
        actionType: 'url',
        url: '/portofolio',
      },
    ],
  },
  {
    category: 'WhatsApp & Langsung',
    icon: <MessageCircle size={14} color="#22c55e" />,
    items: [
      {
        type: 'promo' as const,
        label: 'Konsultasi Proyek Cepat',
        title: 'Konsultasi Proyek Desain Gratis Hari Ini',
        message: 'Hubungi tim kreatif kami via WhatsApp untuk diskusi konsep dan penawaran terbaik.',
        actionType: 'whatsapp',
        url: 'https://wa.me/6281234567890?text=Halo,%20saya%20tertarik%20dengan%20layanan%20kreatif%20Anda',
      },
      {
        type: 'announcement' as const,
        label: 'Pesan Khusus Tim Admin',
        title: 'Pengingat Internal: Review Pesanan & Update Katalog',
        message: 'Harap periksa daftar pesanan baru dan pastikan ketersediaan portofolio terupdate.',
        actionType: 'url',
        url: '/admin',
      },
    ],
  },
];

const PRESET_PAGES = [
  { label: 'Katalog', path: '/katalog' },
  { label: 'Blog', path: '/blog' },
  { label: 'Portofolio', path: '/portofolio' },
  { label: 'Bio Links', path: '/links' },
  { label: 'Biodata', path: '/biodata' },
  { label: 'Beranda', path: '/' },
];

export const BroadcastStudio: React.FC<BroadcastStudioProps> = ({ onClose, hideHeader = false }) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [stats, setStats] = useState({ total: 0, desktop: 0, mobile: 0, tablet: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [brandName, setBrandName] = useState('SUMR.DAY STUDIO');

  // Preview Platform Switcher
  const [previewPlatform, setPreviewPlatform] = useState<PreviewPlatform>('ios');

  // Composer Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionType, setActionType] = useState<'url' | 'whatsapp' | 'phone' | 'email'>('url');
  const [url, setUrl] = useState('/katalog');
  const [waNumber, setWaNumber] = useState('');
  const [waText, setWaText] = useState('Halo, saya tertarik dengan penawaran ini.');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [type, setType] = useState<'promo' | 'blog' | 'catalog' | 'announcement' | 'custom'>('promo');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [targetScope, setTargetScope] = useState<'public' | 'admin'>('public');
  
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [testSent, setTestSent] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    setStatsLoading(true);
    const data = await getSubscriberStats();
    setStats(data);
    setStatsLoading(false);
  };

  useEffect(() => {
    loadStats();

    // Load dynamic brand name
    Promise.all([
      storage.getItem('porto_settings', {}),
      storage.getItem('porto_main_website', {}),
    ]).then(([settings, mainWeb]) => {
      const name = mainWeb?.brandName || mainWeb?.siteTitle || settings?.websiteName || settings?.siteName || 'SUMR.DAY STUDIO';
      setBrandName(name);
      if (mainWeb?.whatsapp || settings?.whatsapp) {
        setWaNumber(mainWeb?.whatsapp || settings?.whatsapp || '');
      }
    }).catch(() => {});

    const unsub = getRecentCampaigns((list) => {
      setCampaigns(list);
    });
    return () => unsub();
  }, []);

  const getEffectiveUrl = () => {
    if (actionType === 'whatsapp') {
      const cleanWa = waNumber.replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(waText || 'Halo, saya tertarik dengan penawaran ini.');
      return cleanWa ? `https://wa.me/${cleanWa}?text=${encodedMsg}` : 'https://wa.me/';
    }
    if (actionType === 'phone') {
      return phoneNumber ? `tel:${phoneNumber.trim()}` : 'tel:';
    }
    if (actionType === 'email') {
      return emailAddress ? `mailto:${emailAddress.trim()}?subject=${encodeURIComponent(title || 'Pesan Baru')}` : 'mailto:';
    }
    return url.trim() || '/';
  };

  const handleApplyTemplate = (tpl: any) => {
    haptic('light');
    setTitle(tpl.title);
    setMessage(tpl.message);
    setType(tpl.type);
    if (tpl.actionType) setActionType(tpl.actionType);
    if (tpl.url) setUrl(tpl.url);
    setIsTemplateModalOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      haptic('light');
      const uploadedResult: any = await uploadToCloudinary(file);
      const urlStr = typeof uploadedResult === 'string' 
        ? uploadedResult 
        : (uploadedResult?.url || uploadedResult?.secure_url || '');
      if (urlStr) {
        setImageUrl(urlStr);
      }
    } catch (err: any) {
      alert(`Gagal mengunggah gambar: ${err?.message || 'Error'}`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTestNotification = () => {
    haptic('light');
    const finalUrl = getEffectiveUrl();
    playBroadcastChime(type);
    
    // 1. Send native browser notification
    sendNativeNotification(title || 'Pratinjau Judul Push Notifikasi', {
      body: message || 'Ini adalah contoh tampilan push notifikasi di perangkat Anda.',
      icon: '/favicon.svg',
      image: imageUrl || undefined,
      tag: `test-push-${Date.now()}`,
      url: finalUrl,
    });

    // 2. Trigger in-app floating banner simulation
    window.dispatchEvent(new CustomEvent('porto_public_broadcast_received', {
      detail: {
        id: `test_${Date.now()}`,
        title: title || 'Pratinjau Siaran Broadcast',
        message: message || 'Ini adalah contoh tampilan pengumuman/promo di layar pengunjung.',
        url: finalUrl,
        type,
        imageUrl: imageUrl || undefined,
        actionType,
      }
    }));

    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Judul dan pesan notifikasi wajib diisi!');
      return;
    }

    haptic('medium');
    setIsSending(true);
    const finalUrl = getEffectiveUrl();

    if (targetScope === 'admin') {
      await addNotification({
        type: NOTIF_TYPES.SYSTEM,
        title: title.trim(),
        message: message.trim(),
        data: { url: finalUrl, imageUrl, targetScope: 'admin', type }
      });
      playBroadcastChime('promo');
    } else {
      await sendBroadcastCampaign({
        title: title.trim(),
        message: message.trim(),
        url: finalUrl,
        type,
        imageUrl: imageUrl.trim() || undefined,
        targetAudience,
        actionType,
      });
    }

    setIsSending(false);
    setTitle('');
    setMessage('');
    setImageUrl('');
    setActiveTab('history');
    loadStats();
  };

  const handleDeleteCampaign = async (id?: string) => {
    if (!id) return;
    if (confirm('Hapus riwayat notifikasi ini?')) {
      haptic('light');
      await deleteCampaign(id);
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'promo': return <Tag size={14} />;
      case 'blog': return <BookOpen size={14} />;
      case 'catalog': return <ShoppingBag size={14} />;
      case 'announcement': return <Megaphone size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'promo': return 'Promo';
      case 'blog': return 'Blog';
      case 'catalog': return 'Katalog';
      case 'announcement': return 'Info';
      default: return 'Kustom';
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
        padding: isMobile ? '16px 16px 90px' : '24px 24px 80px',
        animation: 'cmsFadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontFamily: "'Inter', sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* ── Top Bar Header (Only shown when not wrapped by parent sub-manager) ── */}
        {!hideHeader && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              borderBottom: '1px solid var(--glass-border)',
              paddingBottom: 14,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                  flexShrink: 0,
                }}
              >
                <Radio size={18} color="#ffffff" strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--cms-text)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Waves</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12)', color: 'var(--cms-accent)' }}>
                    {brandName}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => { haptic('light'); setIsTemplateModalOpen(true); }}
                title="Pilih Template Cepat"
                aria-label="Pilih Template Cepat"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12)',
                  border: '1px solid rgba(var(--cms-accent-rgb, 124, 58, 237), 0.25)',
                  color: 'var(--cms-accent, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <Sparkles size={16} />
              </button>

              <button
                onClick={() => { haptic('light'); loadStats(); }}
                title="Sinkronisasi Data"
                aria-label="Sinkronisasi Data"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--cms-switcher-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--cms-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <RefreshCw size={15} className={statsLoading ? 'cms-spin' : ''} />
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  title="Tutup"
                  aria-label="Tutup"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--cms-switcher-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 1-ROW MULTI-PLATFORM LIVE PREVIEW DECK (iOS, Android, Dynamic Island, Desktop) ── */}
        <div
          style={{
            background: 'var(--cms-card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 18,
            padding: '14px 18px',
            boxShadow: 'var(--cms-shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Preview & Platform Selector Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--glass-border)', paddingBottom: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Eye size={12} color="var(--cms-accent)" />
              <span>Pratinjau Layar</span>
            </div>

            {/* Platform Selector Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--cms-switcher-bg)', padding: '3px', borderRadius: 8 }}>
              {[
                { id: 'ios', label: 'iOS Banner', icon: <Apple size={11} /> },
                { id: 'android', label: 'Android Card', icon: <Smartphone size={11} /> },
                { id: 'island', label: 'Dynamic Island', icon: <Sparkles size={11} /> },
                { id: 'desktop', label: 'Desktop OS', icon: <Monitor size={11} /> },
              ].map((plat) => (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => { haptic('selection'); setPreviewPlatform(plat.id as any); }}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 6,
                    border: 'none',
                    background: previewPlatform === plat.id ? 'var(--cms-card-bg)' : 'transparent',
                    color: previewPlatform === plat.id ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                    boxShadow: previewPlatform === plat.id ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                    fontSize: 10.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  {plat.icon}
                  <span>{plat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Platform Mockup Display in 1 Horizontal Container with High Contrast Stage */}
          <div style={{
            width: '100%',
            minHeight: 100,
            background: 'radial-gradient(ellipse at 50% 30%, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
            borderRadius: 16,
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}>
            {/* 1. iOS Notification Banner Mockup */}
            {previewPlatform === 'ios' && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 620,
                  background: 'rgba(255, 255, 255, 0.16)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  color: '#ffffff',
                  borderRadius: 16,
                  padding: '12px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--cms-accent, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
                  }}
                >
                  <BellRing size={16} color="#fff" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 850, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {brandName}
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>SEKARANG</span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                    {title || 'Judul Notifikasi'}
                  </div>

                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 2, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {message || 'Isi pesan notifikasi promosi atau pembaruan konten...'}
                  </div>

                  {imageUrl && typeof imageUrl === 'string' && (
                    <div style={{ marginTop: 6, borderRadius: 8, overflow: 'hidden', maxHeight: 75, border: '1px solid rgba(255,255,255,0.2)' }}>
                      <img 
                        src={imageUrl} 
                        alt="Banner" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3, alignSelf: 'flex-start', background: 'rgba(56,189,248,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                  <Link2 size={10} />
                  <span>Link</span>
                </div>
              </div>
            )}

            {/* 2. Android Notification Mockup */}
            {previewPlatform === 'android' && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 620,
                  background: 'rgba(30, 41, 59, 0.95)',
                  color: '#f8fafc',
                  borderRadius: 16,
                  padding: '12px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BellRing size={9} color="#fff" />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>{brandName}</span>
                    <span style={{ fontSize: 9, color: '#64748b' }}>• sekarang</span>
                  </div>
                  <span style={{ fontSize: 9, color: '#64748b' }}>v</span>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {title || 'Judul Notifikasi'}
                    </div>
                    <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 2 }}>
                      {message || 'Isi pesan notifikasi promosi atau pembaruan...'}
                    </div>
                  </div>

                  {imageUrl && typeof imageUrl === 'string' && (
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <img 
                        src={imageUrl} 
                        alt="Thumb" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', padding: '3px 8px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Link2 size={10} />
                    <span>{actionType === 'whatsapp' ? 'Buka WhatsApp' : 'Kunjungi Link'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Dynamic Island Pill Mockup */}
            {previewPlatform === 'island' && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 480,
                  background: '#000000',
                  color: '#ffffff',
                  borderRadius: 100,
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={12} color="#fff" />
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap' }}>
                    {title || 'Judul Notifikasi'}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    • {message || 'Isi pesan...'}
                  </span>
                </div>

                <ArrowUpRight size={13} style={{ color: '#06b6d4', flexShrink: 0 }} />
              </div>
            )}

            {/* 4. Desktop OS Notification Mockup */}
            {previewPlatform === 'desktop' && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 620,
                  background: 'rgba(15, 23, 42, 0.96)',
                  color: '#ffffff',
                  borderRadius: 14,
                  padding: '12px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.3)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'var(--cms-accent, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BellRing size={16} color="#fff" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span style={{ fontSize: 8.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {brandName.toUpperCase()} · PUSH NOTIFIKASI
                    </span>
                    <span style={{ fontSize: 8.5, color: '#64748b' }}>Baru saja</span>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 900, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {title || 'Judul Notifikasi'}
                  </div>

                  <div style={{ fontSize: 10.5, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {message || 'Pesan notifikasi...'}
                  </div>
                </div>

                <div style={{ fontSize: 10, color: '#06b6d4', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Link2 size={11} />
                  <span>Buka</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Audience Metrics Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            width: '100%',
          }}
        >
          {/* Total Subscribers */}
          <div
            style={{
              background: 'var(--cms-card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent)', flexShrink: 0 }}>
              <Users size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Sub</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                {statsLoading ? '...' : (stats.total || 0)} <span style={{ fontSize: 10, fontWeight: 600, color: '#10b981' }}>Device</span>
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div
            style={{
              background: 'var(--cms-card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
              <Monitor size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Desktop</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                {statsLoading ? '...' : (stats.desktop || 0)}
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div
            style={{
              background: 'var(--cms-card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
              <Smartphone size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ponsel</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                {statsLoading ? '...' : (stats.mobile || 0)}
              </div>
            </div>
          </div>

          {/* Tablet */}
          <div
            style={{
              background: 'var(--cms-card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
              <Tablet size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tablet</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                {statsLoading ? '...' : (stats.tablet || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Tab Switcher ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--cms-switcher-bg)',
            padding: '4px',
            borderRadius: 10,
            border: '1px solid var(--glass-border)',
            width: 'fit-content',
          }}
        >
          <button
            onClick={() => { haptic('light'); setActiveTab('compose'); }}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'compose' ? 'var(--cms-card-bg)' : 'transparent',
              color: activeTab === 'compose' ? 'var(--cms-text)' : 'var(--cms-text-muted)',
              boxShadow: activeTab === 'compose' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              fontSize: 11.5,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Send size={12} />
            <span>Composer</span>
          </button>

          <button
            onClick={() => { haptic('light'); setActiveTab('history'); }}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'history' ? 'var(--cms-card-bg)' : 'transparent',
              color: activeTab === 'history' ? 'var(--cms-text)' : 'var(--cms-text-muted)',
              boxShadow: activeTab === 'history' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              fontSize: 11.5,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Clock size={12} />
            <span>Riwayat ({campaigns.length})</span>
          </button>
        </div>

        {/* ── Mode 1: Composer Form ── */}
        {activeTab === 'compose' && (
          <form
            onSubmit={handleSend}
            style={{
              background: 'var(--cms-card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 18,
              padding: '20px',
              boxShadow: 'var(--cms-shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Target Audience Scope: Public vs Admin */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                Target Penerima:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setTargetScope('public')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 9,
                    background: targetScope === 'public' ? 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12)' : 'var(--cms-switcher-bg)',
                    border: `1.5px solid ${targetScope === 'public' ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                    color: targetScope === 'public' ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                    fontSize: 11.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    cursor: 'pointer',
                  }}
                >
                  <Globe size={14} />
                  <span>sumr.day club</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetScope('admin')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 9,
                    background: targetScope === 'admin' ? 'rgba(245, 158, 11, 0.12)' : 'var(--cms-switcher-bg)',
                    border: `1.5px solid ${targetScope === 'admin' ? '#f59e0b' : 'var(--glass-border)'}`,
                    color: targetScope === 'admin' ? '#f59e0b' : 'var(--cms-text-muted)',
                    fontSize: 11.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    cursor: 'pointer',
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Crew Internal</span>
                </button>
              </div>
            </div>

            {/* Category Switcher */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                Kategori:
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'promo', label: 'Promo', icon: <Tag size={12} /> },
                  { id: 'blog', label: 'Blog', icon: <BookOpen size={12} /> },
                  { id: 'catalog', label: 'Katalog', icon: <ShoppingBag size={12} /> },
                  { id: 'announcement', label: 'Info', icon: <Megaphone size={12} /> },
                  { id: 'custom', label: 'Kustom', icon: <Sparkles size={12} /> },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { haptic('light'); setType(cat.id as any); }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 7,
                      background: type === cat.id ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                      color: type === cat.id ? '#ffffff' : 'var(--cms-text-muted)',
                      border: type === cat.id ? 'none' : '1px solid var(--glass-border)',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title Field */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                Judul:
              </label>
              <input
                className="cms-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Diskon 20% Paket Desain & Branding"
                required
                style={{ height: 38, fontSize: 12, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Message Body Field */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                Pesan:
              </label>
              <textarea
                className="cms-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis ringkasan penawaran atau pembaruan konten..."
                rows={2}
                required
                style={{ fontSize: 12, borderRadius: 8, width: '100%', padding: '8px 10px', minHeight: 60, boxSizing: 'border-box' }}
              />
            </div>

            {/* Image Post & Upload Feature */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                Gambar Banner:
              </label>
              
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    background: 'var(--cms-switcher-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={12} className={isUploadingImage ? 'cms-spin' : ''} />
                  <span>{isUploadingImage ? 'Mengunggah...' : 'Unggah'}</span>
                </button>

                <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
                  <input
                    className="cms-input"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL gambar (https://...)"
                    style={{ height: 36, fontSize: 11.5, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 8,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Hapus
                  </button>
                )}
              </div>

              {imageUrl && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={imageUrl}
                    alt="Banner Preview"
                    style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--glass-border)' }}
                  />
                  <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>Gambar siap disematkan.</span>
                </div>
              )}
            </div>

            {/* Action Type Destination Selector */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                Aksi Klik:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 5, marginBottom: 8 }}>
                {[
                  { id: 'url', label: 'Web Link', icon: <Link2 size={12} /> },
                  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={12} /> },
                  { id: 'phone', label: 'Telepon', icon: <Phone size={12} /> },
                  { id: 'email', label: 'Email', icon: <Mail size={12} /> },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => { haptic('light'); setActionType(act.id as any); }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 7,
                      background: actionType === act.id ? 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.15)' : 'var(--cms-switcher-bg)',
                      border: `1.5px solid ${actionType === act.id ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                      color: actionType === act.id ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    {act.icon}
                    <span>{act.label}</span>
                  </button>
                ))}
              </div>

              {/* Action Form: URL */}
              {actionType === 'url' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {PRESET_PAGES.map((pg) => (
                      <button
                        key={pg.path}
                        type="button"
                        onClick={() => setUrl(pg.path)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 5,
                          background: url === pg.path ? 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.15)' : 'var(--cms-switcher-bg)',
                          border: `1px solid ${url === pg.path ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                          color: url === pg.path ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {pg.label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="cms-input"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="/katalog, /blog, /portofolio, /links"
                    style={{ height: 36, fontSize: 12, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* Action Form: WhatsApp */}
              {actionType === 'whatsapp' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  <div>
                    <input
                      className="cms-input"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      placeholder="Nomor WA (62812...)"
                      style={{ height: 36, fontSize: 12, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <input
                      className="cms-input"
                      value={waText}
                      onChange={(e) => setWaText(e.target.value)}
                      placeholder="Pesan awal WA..."
                      style={{ height: 36, fontSize: 12, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {/* Action Form: Phone */}
              {actionType === 'phone' && (
                <div>
                  <input
                    className="cms-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Nomor Telepon (+628...)"
                    style={{ height: 36, fontSize: 12, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* Action Form: Email */}
              {actionType === 'email' && (
                <div>
                  <input
                    className="cms-input"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Alamat Email (kontak@...)"
                    style={{ height: 36, fontSize: 12, borderRadius: 8, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>

            {/* Target Device Filter */}
            {targetScope === 'public' && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>
                  Perangkat:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'all', label: 'Semua', icon: <Globe size={12} /> },
                    { id: 'desktop', label: 'Desktop', icon: <Monitor size={12} /> },
                    { id: 'mobile', label: 'Ponsel', icon: <Smartphone size={12} /> },
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetAudience(aud.id as any)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 7,
                        background: targetAudience === aud.id ? 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12)' : 'var(--cms-switcher-bg)',
                        border: `1.5px solid ${targetAudience === aud.id ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                        color: targetAudience === aud.id ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {aud.icon}
                      <span>{aud.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleTestNotification}
                style={{
                  flex: '1 1 120px',
                  height: 40,
                  borderRadius: 9,
                  background: 'var(--cms-switcher-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--cms-text)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Bell size={13} />
                <span>{testSent ? 'Terkirim' : 'Uji'}</span>
              </button>

              <button
                type="submit"
                disabled={isSending}
                style={{
                  flex: '2 1 180px',
                  height: 40,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #6366f1)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(var(--cms-accent-rgb, 124, 58, 237), 0.3)',
                }}
              >
                {isSending ? (
                  <span>Mengirim...</span>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Kirim</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Mode 2: Campaign History Log ── */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
            {campaigns.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  color: 'var(--cms-text-muted)',
                  background: 'var(--cms-card-bg)',
                  borderRadius: 16,
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BellRing size={36} style={{ opacity: 0.3, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>Belum Ada Riwayat</div>
                <p style={{ fontSize: 11.5, margin: '3px 0 0' }}>Notifikasi yang terkirim akan tercatat di sini.</p>
              </div>
            ) : (
              campaigns.map((camp) => (
                <div
                  key={camp.id}
                  style={{
                    background: 'var(--cms-card-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 14,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    boxShadow: 'var(--cms-shadow-sm)',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.12)',
                        color: 'var(--cms-accent, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getTypeIcon(camp.type)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: 'var(--cms-switcher-bg)',
                            color: 'var(--cms-text-muted)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {getTypeLabel(camp.type)}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                          {camp.createdAt?.seconds ? new Date(camp.createdAt.seconds * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja'}
                        </span>
                      </div>

                      <div style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {camp.title}
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {camp.message}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 10, color: 'var(--cms-accent)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Link2 size={10} /> {camp.url || '/'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => handleDeleteCampaign(camp.id)}
                      className="sidebar-icon-btn danger"
                      style={{ borderRadius: 7, width: 30, height: 30 }}
                      title="Hapus riwayat"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: CATEGORIZED TEMPLATES DRAWER ── */}
      {isTemplateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setIsTemplateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--cms-card-bg)',
              color: 'var(--cms-text)',
              border: '1px solid var(--glass-border)',
              borderRadius: 18,
              padding: '20px',
              maxWidth: 540,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="var(--cms-accent)" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900 }}>Katalog Template</h3>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="sidebar-icon-btn"
                style={{ borderRadius: 7, width: 28, height: 28 }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {TEMPLATE_CATEGORIES.map((cat, cIdx) => (
                <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {cat.icon}
                    <span>{cat.category}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {cat.items.map((tpl, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => handleApplyTemplate(tpl)}
                        style={{
                          background: 'var(--cms-switcher-bg)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 10,
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          color: 'var(--cms-text)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 1 }}>{tpl.label}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tpl.title}
                          </div>
                        </div>
                        <ArrowRight size={13} style={{ color: 'var(--cms-accent)', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastStudio;
