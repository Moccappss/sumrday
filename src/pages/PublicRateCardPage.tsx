import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';
import { 
  type RateCardPackage, 
  type ClientFaqItem,
  type AddonItem,
  DEFAULT_ADDONS,
  DEFAULT_CATEGORY_COLORS
} from '../components/admin/content-stash/stashTypes';
import { 
  Receipt, Check, MessageSquare, Tag, ArrowUpRight, Sparkles, LayoutGrid, Table,
  Clock, RotateCcw, ShieldCheck, ChevronRight, Share2, Copy, Printer, DollarSign,
  Plus, CheckCircle2, ChevronDown, ChevronUp, X, Send, CreditCard, Building, User, Mail, Phone, FileText,
  Folder, ShoppingBag, Search, ArrowUpDown, SlidersHorizontal, ExternalLink
} from 'lucide-react';
import SEOHelmet from '../components/SEOHelmet';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import PageHeroHeader from '../components/common/PageHeroHeader';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { haptic } from '../utils/haptics';
import StudioInquiryModal from '../components/common/StudioInquiryModal';

type Currency = 'IDR' | 'USD' | 'SGD';

export const PublicRateCardPage: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<RateCardPackage[]>(() => {
    try {
      const raw = localStorage.getItem('porto_rate_cards');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((p: any) => p.isActive !== false);
      }
    } catch {}
    return [];
  });
  const [businessProfile, setBusinessProfile] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('porto_business_profile');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });
  const [faqs, setFaqs] = useState<ClientFaqItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(() => packages.length === 0);

  // Dynamic Add-ons & Category Colors
  const [addons, setAddons] = useState<AddonItem[]>(DEFAULT_ADDONS);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(DEFAULT_CATEGORY_COLORS);

  // Multi-currency
  const [currency, setCurrency] = useState<Currency>('IDR');

  // Detail Modal popup
  const [detailPackage, setDetailPackage] = useState<RateCardPackage | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedAddonIds([]);
  }, [detailPackage]);

  // Table controls
  const [tableSearch, setTableSearch] = useState('');
  const [tableSort, setTableSort] = useState<'name' | 'price-asc' | 'price-desc' | 'duration'>('price-asc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortOptions = [
    { value: 'price-asc', label: 'Harga Terendah' },
    { value: 'price-desc', label: 'Harga Tertinggi' },
    { value: 'name', label: 'Nama Paket' },
    { value: 'duration', label: 'Durasi Pengerjaan' }
  ];

  // FAQ Accordion
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedPkgs, profile, savedFaqs, savedAddons, savedCatColors] = await Promise.all([
          storage.getItem('porto_rate_cards', []),
          storage.getItem('porto_business_profile', {}),
          storage.getItem('porto_client_faqs', []),
          storage.getItem('porto_rate_card_addons', null),
          storage.getItem('porto_ratecard_category_colors', null)
        ]);
        if (Array.isArray(savedPkgs) && savedPkgs.length > 0) {
          const active = savedPkgs.filter(p => p.isActive !== false);
          setPackages(active);
        }
        setBusinessProfile(profile || {});
        if (Array.isArray(savedFaqs) && savedFaqs.length > 0) {
          setFaqs(savedFaqs);
        }
        if (Array.isArray(savedAddons) && savedAddons.length > 0) {
          setAddons(savedAddons);
        }
        if (savedCatColors && typeof savedCatColors === 'object') {
          setCategoryColors({ ...DEFAULT_CATEGORY_COLORS, ...savedCatColors });
        }
      } catch (err) {
        console.error('Failed to load rate cards:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const unsubAddons = storage.listenItem('porto_rate_card_addons', (data) => {
      if (Array.isArray(data) && data.length > 0) setAddons(data);
    });
    const unsubCatColors = storage.listenItem('porto_ratecard_category_colors', (data) => {
      if (data && typeof data === 'object') setCategoryColors(prev => ({ ...prev, ...data }));
    });
    const unsubPkgs = storage.listenItem('porto_rate_cards', (data) => {
      if (Array.isArray(data)) {
        setPackages(data.filter((p: any) => p.isActive !== false));
      }
    });

    const handleRateCardsUpdated = () => {
      loadData();
    };
    window.addEventListener('porto_ratecards_updated', handleRateCardsUpdated);

    return () => {
      if (unsubAddons) unsubAddons();
      if (unsubCatColors) unsubCatColors();
      if (unsubPkgs) unsubPkgs();
      window.removeEventListener('porto_ratecards_updated', handleRateCardsUpdated);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  useLandingBodyFix();
  useScrollReveal(containerRef, [packages, activeCategory, viewMode, tableSearch, tableSort, isLoading]);

  const { data: landingData } = useLandingData();
  const { isDark } = useWebsiteTheme(landingData?.theme?.defaultMode);
  const accentColor = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || landingData?.theme?.accentColor || '#64748b';

  const hex2rgb = (hex: string) => {
    let clean = (hex || '#64748b').replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const r = parseInt(clean.substring(0, 2), 16) || 100;
    const g = parseInt(clean.substring(2, 4), 16) || 116;
    const b = parseInt(clean.substring(4, 6), 16) || 139;
    return `${r}, ${g}, ${b}`;
  };

  const accentRgb = hex2rgb(accentColor);

  const getPackageBadgeColor = (p: RateCardPackage) => {
    if (p.badgeColor) return p.badgeColor;
    if (p.category && categoryColors[p.category]) return categoryColors[p.category];
    return accentColor;
  };

  const categories = Array.from(new Set(['all', ...packages.map(p => p.category).filter(Boolean)]));

  const filteredPackages = useMemo(() => {
    return packages.filter(p => {
      return activeCategory === 'all' || p.category === activeCategory;
    });
  }, [packages, activeCategory]);

  // Featured packages (shown at the top)
  const featuredPackages = useMemo(() => {
    return packages.filter(p => p.isPopular || p.isFeatured || (p.badge && p.badge.trim().length > 0));
  }, [packages]);

  // Grouped packages for grid & table
  const groupedCategories = useMemo(() => {
    if (activeCategory !== 'all') {
      return [{
        category: activeCategory,
        items: filteredPackages
      }];
    }
    const map = new Map<string, RateCardPackage[]>();
    filteredPackages.forEach(pkg => {
      const cat = pkg.category || 'Umum';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(pkg);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [filteredPackages, activeCategory]);

  // Table items filtered and sorted
  const tableFilteredGrouped = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return groupedCategories.map(group => {
      let items = group.items.filter(p => {
        if (!q) return true;
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch;
      });

      if (tableSort === 'name') {
        items = [...items].sort((a, b) => a.title.localeCompare(b.title));
      } else if (tableSort === 'price-asc') {
        items = [...items].sort((a, b) => a.price - b.price);
      } else if (tableSort === 'price-desc') {
        items = [...items].sort((a, b) => b.price - a.price);
      } else if (tableSort === 'duration') {
        items = [...items].sort((a, b) => (a.durationDays || 0) - (b.durationDays || 0));
      }

      return {
        category: group.category,
        items
      };
    }).filter(g => g.items.length > 0);
  }, [groupedCategories, tableSearch, tableSort]);

  // Rates approximation
  const USD_RATE = 15800;
  const SGD_RATE = 11700;

  const formatCurrency = (valIdr: number, customCurrency: Currency = currency) => {
    if (customCurrency === 'USD') {
      const usdVal = Math.round(valIdr / USD_RATE);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(usdVal);
    }
    if (customCurrency === 'SGD') {
      const sgdVal = Math.round(valIdr / SGD_RATE);
      return new Intl.NumberFormat('en-SG', {
        style: 'currency',
        currency: 'SGD',
        minimumFractionDigits: 0
      }).format(sgdVal);
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(valIdr);
  };

  const getAddonPrice = (addon: AddonItem) => {
    if (currency === 'USD') return `$${addon.priceUsd}`;
    if (currency === 'SGD') return `S$${addon.priceSgd}`;
    return formatCurrency(addon.priceIdr, 'IDR');
  };

  const phone = businessProfile?.whatsapp || businessProfile?.phone || '';
  const studioName = businessProfile?.name || businessProfile?.businessName || 'sumr.day';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintProposal = () => {
    window.print();
  };

  const handleConsultWhatsApp = (pkg: RateCardPackage, customAddons?: AddonItem[]) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const chosen = customAddons !== undefined ? customAddons : addons.filter(a => selectedAddonIds.includes(a.id));
    const addonsSum = chosen.reduce((acc, a) => acc + (a.priceIdr || 0), 0);
    const totalAmount = pkg.price + addonsSum;

    let addonText = '';
    if (chosen.length > 0) {
      addonText = `\n➕ Add-on Tambahan:\n` + chosen.map(a => `• ${a.name} (${formatCurrency(a.priceIdr, 'IDR')})`).join('\n');
    }

    const deliverablesText = (pkg.deliverables || []).map(d => `• ${d}`).join('\n');

    const msg = `Halo ${studioName},\nSaya ingin konsultasi & pemesanan paket layanan:\n\n` +
      `🏷️ Paket: *${pkg.title}*\n` +
      `💰 Harga Paket: *${formatCurrency(pkg.price, 'IDR')}* (${pkg.billingPeriod || 'per proyek'})\n` +
      `⏱️ Estimasi: *${pkg.durationDays ? `${pkg.durationDays} hari kerja` : 'Fleksibel'}*` +
      addonText +
      `\n\n💵 Total Investasi: *${formatCurrency(totalAmount, 'IDR')}*\n` +
      `📋 Deliverables:\n${deliverablesText}\n\n` +
      `Apakah slot pengerjaan masih tersedia? Mohon petunjuk langkah selanjutnya ya. Terima kasih!`;

    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleOrderPackage = (pkg: RateCardPackage, customAddons?: AddonItem[]) => {
    try {
      const chosen = customAddons !== undefined ? customAddons : addons.filter(a => selectedAddonIds.includes(a.id));
      const addonsSum = chosen.reduce((acc, a) => acc + (a.priceIdr || 0), 0);
      const totalAmount = pkg.price + addonsSum;

      const raw = localStorage.getItem('porto_client_cart');
      const currentCart = raw ? JSON.parse(raw) : [];
      const cartItemId = `ratecard_${pkg.id}_${Date.now()}`;

      const newCartItem = {
        id: cartItemId,
        productId: `ratecard_${pkg.id}`,
        name: chosen.length > 0 
          ? `${pkg.title} (+ ${chosen.map(a => a.name).join(', ')})`
          : pkg.title,
        price: totalAmount,
        originalPrice: totalAmount,
        quantity: 1,
        category: pkg.category || 'Paket Layanan',
        type: 'Jasa',
        durationDays: pkg.durationDays || 7,
        deliverables: [
          ...(pkg.deliverables || []),
          ...chosen.map(a => `Add-on: ${a.name}`)
        ],
        serviceDpAllowed: true,
        billingPeriod: pkg.billingPeriod || 'proyek',
        isDigitalAsset: false,
        selectedAddons: chosen
      };

      currentCart.push(newCartItem);
      localStorage.setItem('porto_client_cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('porto_cart_updated'));
      setDetailPackage(null);
      navigate('/keranjang');
    } catch {
      navigate('/keranjang');
    }
  };

  return (
    <div 
      ref={containerRef}
      className="public-ratecard-root"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? '#06070a' : '#eef2f6',
        color: isDark ? '#ffffff' : '#0f172a',
        fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
        transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <SEOHelmet
        title={`Daftar Harga & Paket Jasa — ${studioName}`}
        description={`Daftar harga resmi, rincian deliverables, dan estimasi waktu pengerjaan paket layanan dari ${studioName}.`}
      />

      {/* Floating Top Navbar (Isolated from page content) */}
      <div className="no-print">
        <LPNavbar
          items={(landingData?.navbar?.items || []) as any}
          loginBtnLabel={landingData?.navbar?.loginBtnLabel || 'Login'}
          logoText={landingData?.navbar?.logoText || studioName}
          isDark={isDark}
          accentColor={accentColor}
        />
      </div>

      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: 1240,
        margin: '0 auto',
        padding: isMobile ? '80px 16px 20px' : '100px clamp(16px, 3.5vw, 24px) 20px',
        boxSizing: 'border-box'
      }}>

        {/* ── UNIFIED HERO POSTER SECTION ── */}
        <PageHeroHeader
          isDark={isDark}
          accentColor={accentColor}
          bgPattern={(landingData?.pagesHeader as any)?.pricing?.bgPattern || 'grid'}
          badgeIcon={<Receipt size={14} />}
          badgeText={landingData?.pagesHeader?.pricing?.badge || 'Rate Card & Paket Layanan'}
          title={landingData?.pagesHeader?.pricing?.title || 'Investasi Terukur untuk Hasil Maksimal'}
          highlightText={landingData?.pagesHeader?.pricing?.highlight || 'Hasil Maksimal'}
          description={landingData?.pagesHeader?.pricing?.description || 'Pilih paket layanan yang sesuai dengan kebutuhan studio atau bisnis Anda. Semua paket mencakup revisi terukur dan jaminan kualitas profesional.'}
          stats={[
            { icon: <ShoppingBag size={14} />, value: packages.length, label: 'Total Paket' },
            { icon: <Sparkles size={14} />, value: featuredPackages.length, label: 'Unggulan' },
            { icon: <Folder size={14} />, value: Math.max(1, categories.length - 1), label: 'Kategori' }
          ]}
          actionButtons={
            <>
              <button
                onClick={() => navigate('/katalog')}
                className="no-print"
                style={{
                  padding: '10px 22px',
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShoppingBag size={16} />
                <span>Buka Katalog Toko</span>
              </button>

              <button
                onClick={() => {
                  haptic.light();
                  window.dispatchEvent(new CustomEvent('porto_open_inquiry_modal', { detail: { serviceType: 'Brand Identity & Logo Suite' } }));
                }}
                className="no-print"
                style={{
                  padding: '10px 22px',
                  borderRadius: 100,
                  border: `1px solid ${accentColor}`,
                  background: `rgba(${accentRgb}, 0.08)`,
                  color: accentColor,
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={16} />
                <span>Konsultasi & Brief Kustom</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="no-print"
                style={{
                  padding: '10px 20px',
                  borderRadius: 100,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'}`,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: 13.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease'
                }}
              >
                {copied ? <Check size={16} color={accentColor} /> : <Share2 size={16} />}
                <span>{copied ? 'Tautan Disalin' : 'Bagikan'}</span>
              </button>
            </>
          }
        />

        {/* ── 1. TAMPILAN PAKET UNGGULAN (PALING ATAS) ── */}
        {featuredPackages.length > 0 && (
          <div data-reveal="true" data-reveal-type="fade" style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={16} color={accentColor} />
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                Paket Unggulan
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 20
            }}>
              {featuredPackages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  data-reveal="true"
                  data-reveal-type="fade"
                  onClick={() => setDetailPackage(pkg)}
                  className={`print-white-bg reveal-delay-${(idx % 4) + 1}`}
                  style={{
                    background: isDark ? '#151824' : '#ffffff',
                    backdropFilter: 'none',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)'}`,
                    borderRadius: 22,
                    padding: '24px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, border-color 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {pkg.badge && (
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      right: 20,
                      background: getPackageBadgeColor(pkg),
                      color: '#ffffff',
                      fontSize: 10.5,
                      fontWeight: 850,
                      padding: '3px 11px',
                      borderRadius: 100,
                      letterSpacing: '0.04em',
                      boxShadow: 'none'
                    }}>
                      {pkg.badge}
                    </div>
                  )}

                  <div style={{ 
                    fontSize: 11, 
                    fontWeight: 800, 
                    color: (pkg.category && categoryColors[pkg.category]) || accentColor, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    marginBottom: 4 
                  }}>
                    {pkg.category || 'Unggulan'}
                  </div>

                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                    {pkg.title}
                  </h3>

                  <div style={{ margin: '10px 0 14px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                      {formatCurrency(pkg.price)}
                    </span>
                    <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                      / {pkg.billingPeriod || 'proyek'}
                    </span>
                  </div>

                  {pkg.deliverables && pkg.deliverables.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, flex: 1 }}>
                      {pkg.deliverables.slice(0, 3).map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: isDark ? '#cbd5e1' : '#334155' }}>
                          <Check size={12} color={accentColor} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item}</span>
                        </div>
                      ))}
                      {pkg.deliverables.length > 3 && (
                        <span style={{ fontSize: 11, color: accentColor, fontWeight: 750 }}>
                          +{pkg.deliverables.length - 3} fitur lainnya
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}>
                    <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {pkg.durationDays ? `${pkg.durationDays} hari` : 'Fleksibel'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderPackage(pkg);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 100,
                          border: 'none',
                          background: accentColor,
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: 'none'
                        }}
                      >
                        <ShoppingBag size={12} /> Pesan
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 800, color: accentColor, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Detail <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TOOLBAR: CATEGORIES & VIEW SWITCHER ── */}
        <div className="no-print" style={{
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}>
          {/* Category Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 100,
                  border: '1px solid',
                  borderColor: activeCategory === cat ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  background: activeCategory === cat ? accentColor : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  color: activeCategory === cat ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  fontSize: 12.5,
                  fontWeight: activeCategory === cat ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat === 'all' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>

          {/* View Switcher: Grid vs Table */}
          <div style={{
            display: 'flex',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderRadius: 100,
            padding: 4,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: 'none',
                background: viewMode === 'grid' ? accentColor : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <LayoutGrid size={13} />
              <span>Kartu Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: 'none',
                background: viewMode === 'table' ? accentColor : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Table size={13} />
              <span>Tabel Lengkap</span>
            </button>
          </div>
        </div>

        {/* ── CONTENT CONTAINER ── */}
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Memuat paket layanan...</div>
          ) : filteredPackages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '50px 20px',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderRadius: 20,
              border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
            }}>
              <p style={{ margin: 0, color: isDark ? '#94a3b8' : '#64748b', fontSize: 14 }}>Belum ada paket layanan pada kategori ini.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW: KARTU KECIL / COMPACT DENGAN POPUP DETAIL ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {groupedCategories.map((group, gIdx) => (
                <div key={group.category || gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {activeCategory === 'all' && groupedCategories.length > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      paddingBottom: 8,
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                    }}>
                      <Folder size={14} color={accentColor} />
                      <span style={{ fontSize: 13, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {group.category}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: `rgba(${accentRgb}, 0.15)`, color: accentColor }}>
                        {group.items.length} Paket
                      </span>
                    </div>
                  )}

                  {/* Grid of Compact / Small Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16
                  }}>
                    {group.items.map((pkg, pIdx) => (
                      <div
                        key={pkg.id}
                        data-reveal="true"
                        data-reveal-type="fade"
                        onClick={() => setDetailPackage(pkg)}
                        className={`print-white-bg reveal-delay-${(pIdx % 6) + 1}`}
                        style={{
                          background: isDark ? '#151824' : '#ffffff',
                          backdropFilter: 'none',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15, 23, 42, 0.08)'}`,
                          borderRadius: 22,
                          padding: '22px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          transition: 'transform 0.15s ease, border-color 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = accentColor;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15, 23, 42, 0.08)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {pkg.badge && (
                          <div style={{
                            alignSelf: 'flex-start',
                            background: getPackageBadgeColor(pkg),
                            color: '#ffffff',
                            fontSize: 10.5,
                            fontWeight: 850,
                            padding: '3px 10px',
                            borderRadius: 100,
                            marginBottom: 8,
                            boxShadow: 'none',
                            letterSpacing: '0.03em'
                          }}>
                            {pkg.badge}
                          </div>
                        )}

                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                          {pkg.title}
                        </h4>

                        <div style={{ margin: '8px 0 12px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                            {formatCurrency(pkg.price)}
                          </span>
                          <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                            / {pkg.billingPeriod || 'proyek'}
                          </span>
                        </div>

                        {pkg.deliverables && pkg.deliverables.length > 0 && (
                          <div style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {pkg.deliverables.slice(0, 2).map((d, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Check size={11} color={accentColor} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d}</span>
                              </div>
                            ))}
                            {pkg.deliverables.length > 2 && (
                              <span style={{ fontSize: 11, color: accentColor, fontWeight: 700 }}>
                                +{pkg.deliverables.length - 2} fitur lainnya
                              </span>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, paddingTop: 10, marginTop: 'auto' }}>
                          <span style={{ fontSize: 11.5, color: isDark ? '#94a3b8' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> {pkg.durationDays ? `${pkg.durationDays} hari` : 'Fleksibel'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrderPackage(pkg);
                              }}
                              style={{
                                padding: '3px 10px',
                                borderRadius: 100,
                                border: 'none',
                                background: accentColor,
                                color: '#ffffff',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                boxShadow: 'none'
                              }}
                            >
                              <ShoppingBag size={11} /> Pesan
                            </button>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: accentColor, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              Detail <ArrowUpRight size={12} />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── TABLE VIEW: TABEL DENGAN FITUR LEBIH BAIK (SEARCH, SORT, GROUPED, DETAIL MODAL) ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Table Toolbar */}
              <div className="no-print" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: isDark ? 'rgba(30,41,59,0.4)' : '#f8fafc',
                padding: '12px 18px',
                borderRadius: 20,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`
              }}>
                <div style={{ position: 'relative', minWidth: 240, flex: 1, maxWidth: 380 }}>
                  <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: isDark ? '#94a3b8' : '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Cari nama paket, fitur, atau deliverables..."
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: 100,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                      background: isDark ? 'rgba(15,23,42,0.6)' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: 13,
                      fontWeight: 500,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Custom Rounded Dropdown (Bukan native square browser select) */}
                <div ref={sortDropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569' }}>Urutkan:</span>
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen(prev => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 16px',
                      borderRadius: 100,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : '#cbd5e1'}`,
                      background: isDark ? '#0f172a' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: 13,
                      fontWeight: 750,
                      cursor: 'pointer',
                      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <SlidersHorizontal size={13} color={accentColor} />
                    <span>{sortOptions.find(o => o.value === tableSort)?.label || 'Urutkan'}</span>
                    <ChevronDown size={14} style={{ transform: sortDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: isDark ? '#94a3b8' : '#64748b' }} />
                  </button>

                  {/* Floating Rounded Menu */}
                  {sortDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        minWidth: 200,
                        background: isDark ? '#0f172a' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : '#e2e8f0'}`,
                        borderRadius: 18,
                        boxShadow: isDark ? '0 18px 40px rgba(0,0,0,0.6)' : '0 14px 32px rgba(15,23,42,0.12)',
                        padding: 7,
                        zIndex: 70,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      {sortOptions.map(opt => {
                        const isSelected = tableSort === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setTableSort(opt.value as any);
                              setSortDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: 12,
                              border: 'none',
                              background: isSelected 
                                ? (isDark ? `rgba(${accentRgb}, 0.2)` : `rgba(${accentRgb}, 0.12)`) 
                                : 'transparent',
                              color: isSelected 
                                ? accentColor 
                                : (isDark ? '#f1f5f9' : '#0f172a'),
                              fontSize: 13,
                              fontWeight: isSelected ? 800 : 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) {
                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check size={14} color={accentColor} strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Redesigned Bento 2.0 High-Contrast Table */}
              <div className="print-white-bg" style={{
                background: isDark ? '#151824' : '#ffffff',
                backdropFilter: 'none',
                borderRadius: 22,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)'}`,
                overflow: 'hidden',
                boxShadow: 'none'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 720 }}>
                    <thead>
                      <tr style={{
                        background: isDark ? '#1e293b' : '#f8fafc',
                        borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`
                      }}>
                        <th style={{ padding: '16px 22px', fontSize: 12, fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Paket</th>
                        <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Harga</th>
                        <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Durasi</th>
                        <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Fitur</th>
                        <th className="no-print" style={{ padding: '16px 22px', fontSize: 12, fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', whiteSpace: 'nowrap' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableFilteredGrouped.map((group) => (
                        <React.Fragment key={group.category}>
                          {activeCategory === 'all' && tableFilteredGrouped.length > 1 && (
                            <tr style={{
                              background: isDark ? `rgba(${accentRgb}, 0.12)` : `rgba(${accentRgb}, 0.08)`,
                              borderTop: `1px solid rgba(${accentRgb}, 0.25)`,
                              borderBottom: `1px solid rgba(${accentRgb}, 0.25)`
                            }}>
                              <td colSpan={5} style={{ padding: '12px 22px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                    <div style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 8,
                                      background: `rgba(${accentRgb}, 0.2)`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      <Folder size={14} color={accentColor} />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                      {group.category}
                                    </span>
                                  </div>
                                  <span style={{
                                    fontSize: 11.5,
                                    fontWeight: 800,
                                    color: accentColor,
                                    background: isDark ? `rgba(${accentRgb}, 0.2)` : `rgba(${accentRgb}, 0.12)`,
                                    padding: '3px 10px',
                                    borderRadius: 100,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {group.items.length} Paket
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                          {group.items.map((pkg, idx) => (
                            <tr
                              key={pkg.id}
                              data-reveal="true"
                              data-reveal-type="fade"
                              className={`reveal-delay-${(idx % 6) + 1}`}
                              onClick={() => setDetailPackage(pkg)}
                              style={{
                                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
                                background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : '#fafafa'),
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = isDark ? `rgba(${accentRgb}, 0.1)` : `rgba(${accentRgb}, 0.05)`; }}
                              onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : '#fafafa'); }}
                            >
                              <td style={{ padding: '16px 22px' }}>
                                {/* Label & Kategori diatas Judul */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'nowrap' }}>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: accentColor,
                                    background: isDark ? `rgba(${accentRgb}, 0.15)` : `rgba(${accentRgb}, 0.1)`,
                                    border: `1px solid rgba(${accentRgb}, 0.25)`,
                                    padding: '2px 8px',
                                    borderRadius: 100,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {pkg.category || 'Umum'}
                                  </span>
                                  {pkg.badge && (
                                    <span style={{
                                      fontSize: 10.5,
                                      fontWeight: 850,
                                      color: '#ffffff',
                                      background: getPackageBadgeColor(pkg),
                                      boxShadow: 'none',
                                      padding: '2px 9px',
                                      borderRadius: 100,
                                      whiteSpace: 'nowrap',
                                      letterSpacing: '0.03em'
                                    }}>
                                      {pkg.badge}
                                    </span>
                                  )}
                                </div>
                                {/* Nama Harus Sebaris */}
                                <div style={{
                                  fontWeight: 850,
                                  fontSize: 15,
                                  color: isDark ? '#ffffff' : '#0f172a',
                                  whiteSpace: 'nowrap',
                                  letterSpacing: '-0.01em'
                                }}>
                                  {pkg.title}
                                </div>
                                {pkg.description && (
                                  <div style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#64748b', marginTop: 4, lineHeight: 1.4, maxWidth: 300 }}>
                                    {pkg.description}
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: 900, fontSize: 16, color: accentColor, whiteSpace: 'nowrap' }}>
                                  {formatCurrency(pkg.price)}
                                </div>
                                <div style={{ fontSize: 11.5, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2, whiteSpace: 'nowrap' }}>
                                  / {pkg.billingPeriod || 'per proyek'}
                                </div>
                              </td>

                              <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 750, color: isDark ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap' }}>
                                  <Clock size={13} color={accentColor} />
                                  <span>{pkg.durationDays ? `${pkg.durationDays} Hari Kerja` : 'Fleksibel'}</span>
                                </div>
                                <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginTop: 3, whiteSpace: 'nowrap' }}>
                                  {pkg.revisionLimit || 'Revisi wajar'}
                                </div>
                              </td>

                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {(pkg.deliverables || []).slice(0, 3).map((d, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: isDark ? '#f1f5f9' : '#1e293b', fontWeight: 500 }}>
                                      <Check size={13} color={accentColor} style={{ flexShrink: 0, strokeWidth: 3 }} />
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{d}</span>
                                    </div>
                                  ))}
                                  {(pkg.deliverables || []).length > 3 && (
                                    <span style={{ fontSize: 11.5, color: accentColor, fontWeight: 800, paddingLeft: 20 }}>
                                      +{(pkg.deliverables || []).length - 3} fitur lainnya
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="no-print" style={{ padding: '16px 22px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    title="Pesan Paket Langsung"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOrderPackage(pkg);
                                    }}
                                    style={{
                                      padding: '7px 14px',
                                      borderRadius: 100,
                                      border: 'none',
                                      background: accentColor,
                                      color: '#ffffff',
                                      fontSize: 12,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      boxShadow: 'none'
                                    }}
                                  >
                                    <ShoppingBag size={13} />
                                    <span>Pesan</span>
                                  </button>

                                  <button
                                    type="button"
                                    title="Lihat Detail Paket"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDetailPackage(pkg);
                                    }}
                                    style={{
                                      padding: '7px 13px',
                                      borderRadius: 100,
                                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : '#cbd5e1'}`,
                                      background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                      color: isDark ? '#f8fafc' : '#0f172a',
                                      fontSize: 12,
                                      fontWeight: 750,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <span>Detail</span>
                                    <ArrowUpRight size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Pesan Paket di Katalog"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/katalog');
                                    }}
                                    style={{
                                      padding: '7px 14px',
                                      borderRadius: 100,
                                      border: 'none',
                                      background: accentColor,
                                      color: '#ffffff',
                                      fontSize: 12,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      boxShadow: 'none',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <ShoppingBag size={13} />
                                    <span>Pesan</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── INTERACTIVE ADD-ONS SECTION ── */}
          <div className="no-print" style={{
            marginTop: 32,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            backdropFilter: 'none',
            borderRadius: 22,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)'}`,
            padding: '28px 24px'
          }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Kustomisasi Tambahan
              </div>
              <h3 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                Add-on & Opsi Fleksibel
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
                Pilihan fitur tambahan yang bisa dipesan bersama paket layanan Anda di katalog.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {addons.map((addon, aIdx) => {
                const waPhone = (businessProfile?.whatsapp || businessProfile?.phone || '').replace(/\D/g, '');
                const waText = encodeURIComponent(`Halo ${businessProfile?.brandName || 'Studio'}, saya ingin memesan Add-on: "${addon.name}" (${getAddonPrice(addon)}).`);
                const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : '#';

                return (
                  <div
                    key={addon.id}
                    data-reveal="true"
                    data-reveal-type="fade"
                    className={`reveal-delay-${(aIdx % 6) + 1}`}
                    style={{
                      background: isDark ? '#151824' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)'}`,
                      borderRadius: 16,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative',
                      boxShadow: 'none',
                      transition: 'transform 0.15s ease, border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 850, 
                        color: (addon.category && categoryColors[addon.category]) || accentColor, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {addon.category}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                        {getAddonPrice(addon)}
                      </span>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 800 }}>{addon.name}</div>
                    <div style={{ fontSize: 12.5, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4, flex: 1 }}>{addon.desc}</div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 10,
                      marginTop: 4,
                      borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      gap: 8
                    }}>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          height: 32,
                          borderRadius: 10,
                          background: `rgba(${accentRgb}, 0.12)`,
                          border: `1px solid rgba(${accentRgb}, 0.25)`,
                          color: accentColor,
                          fontSize: 11.5,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          textDecoration: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageSquare size={13} />
                        <span>Pesan via WA</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const raw = localStorage.getItem('porto_client_cart');
                            const currentCart = raw ? JSON.parse(raw) : [];
                            const cartItemId = `addon_${addon.id}_main`;
                            const existingIdx = currentCart.findIndex((item: any) => item.id === cartItemId || item.productId === `addon_${addon.id}`);
                            if (existingIdx > -1) {
                              currentCart[existingIdx].quantity += 1;
                            } else {
                              currentCart.push({
                                id: cartItemId,
                                productId: `addon_${addon.id}`,
                                name: addon.name,
                                image: '',
                                price: addon.priceIdr,
                                originalPrice: addon.priceIdr,
                                variantId: null,
                                variantName: null,
                                quantity: 1,
                                category: `Add-on (${addon.category})`
                              });
                            }
                            localStorage.setItem('porto_client_cart', JSON.stringify(currentCart));
                            navigate('/keranjang');
                          } catch {
                            navigate(`/katalog?search=${encodeURIComponent(addon.name)}`);
                          }
                        }}
                        title="Pesan add-on langsung di katalog toko"
                        style={{
                          height: 32,
                          padding: '0 12px',
                          borderRadius: 10,
                          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                          color: isDark ? '#e2e8f0' : '#334155',
                          fontSize: 11.5,
                          fontWeight: 750,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ShoppingBag size={12} color={accentColor} />
                        <span>Pesan di Katalog</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── FAQ ACCORDION ── */}
          {faqs.length > 0 && (
            <div data-reveal="true" data-reveal-type="fade" className="no-print" style={{ marginTop: 32 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                  Pertanyaan Sering Diajukan
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 840, margin: '0 auto' }}>
                {faqs.map((faq, fIdx) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      data-reveal="true"
                      data-reveal-type="fade"
                      className={`reveal-delay-${(fIdx % 6) + 1}`}
                      style={{
                        background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
                        borderRadius: 16,
                        overflow: 'hidden',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#ffffff' : '#0f172a',
                          fontSize: 13.5,
                          fontWeight: 800,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}
                      >
                        <span>{faq.question}</span>
                        {isOpen ? <ChevronUp size={16} color={accentColor} /> : <ChevronDown size={16} color="#94a3b8" />}
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 18px 16px', fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.6 }}>
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── GUARANTEE BANNER ── */}
          <div
            data-reveal="true"
            data-reveal-type="fade"
            className="reveal-delay-2"
            style={{
              marginTop: 32,
              background: `linear-gradient(135deg, rgba(${accentRgb}, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)`,
              border: `1px solid rgba(${accentRgb}, 0.25)`,
              borderRadius: 20,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap'
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: accentColor,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>
                Komitmen Kualitas & Keamanan Transaksi
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>
                Setiap kerja sama dilindungi oleh Surat Perjanjian Kerja (MoU), invoice resmi berizin, dan jaminan kerahasiaan materi proyek (NDA).
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* ── POPUP MODAL DETAIL PAKET (TIDAK MENYENTUH NAVBAR & SMOOTH SCROLL) ── */}
      {detailPackage && (
        <div 
          onClick={() => setDetailPackage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100005,
            padding: '96px 16px 24px',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: isDark ? '#0f172a' : '#ffffff',
              color: isDark ? '#f8fafc' : '#0f172a',
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 24,
              width: '100%',
              maxWidth: 580,
              maxHeight: 'min(780px, calc(100vh - 124px))',
              boxShadow: isDark 
                ? '0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)' 
                : '0 24px 70px rgba(15,23,42,0.25), 0 0 0 1px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              margin: 'auto'
            }}
          >
            {/* Header with Close button (Clean & Non-scrolling) */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 14,
              flexShrink: 0,
              background: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 800, 
                    color: (detailPackage.category && categoryColors[detailPackage.category]) || accentColor, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.06em' 
                  }}>
                    {detailPackage.category || 'Paket Layanan'}
                  </span>
                  {detailPackage.badge && (
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 850,
                      background: getPackageBadgeColor(detailPackage),
                      color: '#ffffff',
                      padding: '2px 9px',
                      borderRadius: 100,
                      letterSpacing: '0.04em',
                      boxShadow: 'none'
                    }}>
                      {detailPackage.badge}
                    </span>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: 21, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                  {detailPackage.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setDetailPackage(null)}
                title="Tutup"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: isDark ? '#ffffff' : '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div 
              className="custom-modal-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                overscrollBehavior: 'contain'
              }}
            >
              {/* Price Box */}
              <div style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                    {formatCurrency(detailPackage.price)}
                  </span>
                  <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginLeft: 6 }}>
                    / {detailPackage.billingPeriod || 'per proyek'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} color={accentColor} />
                  <span>{detailPackage.durationDays ? `${detailPackage.durationDays} hari kerja` : 'Fleksibel'}</span>
                </div>
              </div>

              {detailPackage.description && (
                <p style={{ margin: 0, fontSize: 13.5, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.6 }}>
                  {detailPackage.description}
                </p>
              )}

              {/* Deliverables */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#94a3b8' : '#64748b', marginBottom: 10 }}>
                  Rincian Deliverables:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(detailPackage.deliverables || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: isDark ? '#cbd5e1' : '#334155' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: `rgba(${accentRgb}, 0.15)`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-on Selection in Modal */}
              {addons && addons.length > 0 && (
                <div style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: 16,
                  padding: '16px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: accentColor }}>
                      Pilihan Add-on Opsional:
                    </div>
                    <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                      Dapat dicentang sesuai kebutuhan
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {addons.map(addon => {
                      const isChecked = selectedAddonIds.includes(addon.id);
                      return (
                        <label
                          key={addon.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: isChecked 
                              ? (isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)')
                              : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                            border: `1px solid ${isChecked ? accentColor : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedAddonIds(prev => 
                                  prev.includes(addon.id) ? prev.filter(id => id !== addon.id) : [...prev, addon.id]
                                );
                              }}
                              style={{ accentColor, width: 15, height: 15 }}
                            />
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 750, color: isDark ? '#f8fafc' : '#0f172a' }}>
                                {addon.name}
                              </div>
                              <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                                {addon.desc}
                              </div>
                            </div>
                          </div>

                          <span style={{ fontSize: 12, fontWeight: 800, color: accentColor, whiteSpace: 'nowrap' }}>
                            +{formatCurrency(addon.priceIdr)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Total Investment Summary */}
              {(() => {
                const chosen = addons.filter(a => selectedAddonIds.includes(a.id));
                const addonsSum = chosen.reduce((acc, a) => acc + (a.priceIdr || 0), 0);
                const grandTotal = (detailPackage.price || 0) + addonsSum;

                return (
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: 16,
                    background: `rgba(${accentRgb}, 0.1)`,
                    border: `1px solid rgba(${accentRgb}, 0.3)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    flexShrink: 0
                  }}>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: accentColor }}>
                        Total Investasi (Paket + {chosen.length} Add-on)
                      </span>
                      <div style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#64748b' }}>
                        Tersedia opsi DP 50% di langkah checkout
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                      {formatCurrency(grandTotal)}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Fixed Bottom Action Buttons */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              background: isDark ? '#0c1322' : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => handleOrderPackage(detailPackage)}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 14,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShoppingBag size={16} />
                <span>Pesan Paket & Lanjut ke Checkout (DP / Lunas)</span>
              </button>

              <button
                type="button"
                onClick={() => handleConsultWhatsApp(detailPackage)}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 14,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  background: 'transparent',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <MessageSquare size={15} />
                <span>Konsultasi Paket via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LPFooter at bottom */}
      <div className="no-print" style={{ marginTop: 24 }}>
        <LPFooter
          data={landingData?.footer}
          isDark={isDark}
          accentColor={accentColor}
        />
      </div>

      {/* ── STYLESHEET (CLEAN FOOTER SPACING & PRINT PROPOSAL & MODAL SCROLL) ── */}
      <style>{`
        .custom-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-modal-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          border-radius: 10px;
        }
        .custom-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: ${accentColor};
        }
        .public-ratecard-root [data-reveal] {
          opacity: 1 !important;
          transform: none !important;
          visibility: visible !important;
        }
        .public-ratecard-root footer#contact {
          padding-top: 40px !important;
          padding-bottom: calc(48px + env(safe-area-inset-bottom, 24px)) !important;
        }
        .public-ratecard-root footer#contact > div > div[data-reveal]:first-child {
          margin-bottom: 32px !important;
          padding: 32px 28px !important;
        }
        @media print {
          body, .public-ratecard-root, main {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print, header, nav, footer, .lp-navbar, .lp-footer {
            display: none !important;
          }
          .print-white-bg {
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
          table, th, td {
            color: #0f172a !important;
            border-color: #e2e8f0 !important;
            background: #ffffff !important;
          }
          * {
            box-shadow: none !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Studio Creative Inquiry & Brief Modal */}
      <StudioInquiryModal isDark={isDark} accentColor={accentColor} />
    </div>
  );
};

export default PublicRateCardPage;
