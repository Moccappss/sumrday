import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ArrowRight, Zap, Star, Heart,
  ArrowUpRight, Clock, Sparkles, Check, Package,
  SlidersHorizontal, ChevronRight, CheckSquare, Search, X, RefreshCw, Edit3
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import {
  isProductFlashSaleActive,
  getFlashSalePrice,
  getFlashSaleDiscountPercent,
  getFlashSaleTimeRemaining,
  getEffectiveFlashSaleEndTime,
  isPreOrderProduct,
  getPreOrderQuotaProgress
} from '../../utils/flashSaleHelper';

interface LPStoreSpotlightProps {
  isDark: boolean;
  accentColor: string;
  shopSettings?: any;
  badge?: string;
  title?: string;
  subtitle?: string;
  maxItems?: number;
  selectedProductIds?: string[];
  isEditable?: boolean;
  onUpdateTitle?: (val: string) => void;
  onUpdateSubtitle?: (val: string) => void;
  onUpdateBadge?: (val: string) => void;
  onUpdateMaxItems?: (val: number) => void;
  onUpdateSelectedProductIds?: (ids: string[]) => void;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const LPStoreSpotlight: React.FC<LPStoreSpotlightProps> = ({
  isDark,
  accentColor = '#f59e0b',
  shopSettings,
  badge,
  title,
  subtitle,
  maxItems = 3,
  selectedProductIds = [],
  isEditable = false,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateBadge,
  onUpdateMaxItems,
  onUpdateSelectedProductIds,
}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveShopSettings, setLiveShopSettings] = useState<any>(shopSettings || null);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [currentMaxItems, setCurrentMaxItems] = useState<number>(() => {
    if (typeof maxItems === 'number' && maxItems >= 1 && maxItems <= 3) return maxItems;
    try {
      const saved = localStorage.getItem('porto_store_spotlight_max');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= 3) return parsed;
      }
    } catch { }
    return 3;
  });

  useEffect(() => {
    if (typeof maxItems === 'number' && maxItems >= 1 && maxItems <= 3) {
      setCurrentMaxItems(maxItems);
    }
  }, [maxItems]);

  const handleSetMaxItems = (num: number) => {
    setCurrentMaxItems(num);
    if (onUpdateMaxItems) {
      onUpdateMaxItems(num);
    }
    try {
      localStorage.setItem('porto_store_spotlight_max', String(num));
    } catch { }
  };

  const DEFAULT_STORE_PRODUCTS = useMemo(() => [
    {
      id: 'prod-flash-1',
      name: 'Skena Warm Tech UI Kit & Web Component',
      title: 'Skena Warm Tech UI Kit & Web Component',
      category: 'UI/UX & Template',
      price: 350000,
      originalPrice: 700000,
      rating: 5.0,
      salesCount: 84,
      badge: 'FLASH SALE',
      isPublished: true,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
      gallery: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'],
      description: 'Koleksi 120+ komponen web responsif dan interaktif berkonsep Warm Tech dengan micro-interactions mulus.',
      flashSale: {
        isActive: true,
        discountPercent: 50,
        quotaTotal: 10,
        quotaSold: 6,
        endTime: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString()
      }
    },
    {
      id: 'prod-2',
      name: 'Undangan Web Estetik Preset Vibe Pro',
      title: 'Undangan Web Estetik Preset Vibe Pro',
      category: 'Website Template',
      price: 250000,
      originalPrice: 450000,
      rating: 4.9,
      salesCount: 142,
      badge: 'BEST SELLER',
      isPublished: true,
      thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80',
      gallery: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80'],
      description: 'Template undangan pernikahan & event interaktif modern siap pakai dengan RSVP WhatsApp & galeri foto.'
    },
    {
      id: 'prod-3',
      name: 'Identitas Visual & Brand Guideline Pack',
      title: 'Identitas Visual & Brand Guideline Pack',
      category: 'Branding Asset',
      price: 499000,
      originalPrice: 800000,
      rating: 5.0,
      salesCount: 65,
      badge: 'POPULAR',
      isPublished: true,
      thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80',
      gallery: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80'],
      description: 'Sistem pedoman visual brand lengkap: typografi, palet warna skena, layout grid, dan aset vektor.'
    },
    {
      id: 'prod-4',
      name: 'Game Interaktif Booth Event Web App',
      title: 'Game Interaktif Booth Event Web App',
      category: 'Game & Activation',
      price: 850000,
      originalPrice: 1200000,
      rating: 4.8,
      salesCount: 39,
      badge: 'EVENT READY',
      isPublished: true,
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
      gallery: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'],
      description: 'Modul game kuis & spinner interaktif untuk pameran, booth festival, dan aktivasi keterlibatan audiens.'
    }
  ], []);

  // Load products
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        const list = await storage.getItem('porto_catalog_products', []);
        if (isMounted && Array.isArray(list) && list.length > 0) {
          const published = list.filter((p: any) => p.isPublished !== false);
          if (published.length > 0) {
            setProducts(published);
          }
        }
      } catch (e) {
        // fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadProducts();

    // Listen to flash sale centralized updates
    const handleFSUpdated = () => {
      storage.getItem('porto_shop_settings', null).then(res => {
        if (res) setLiveShopSettings(res);
      });
      storage.getItem('porto_catalog_products', []).then(list => {
        if (isMounted && Array.isArray(list) && list.length > 0) {
          const published = list.filter((p: any) => p.isPublished !== false);
          if (published.length > 0) setProducts(published);
        }
      });
    };

    window.addEventListener('porto_flash_sale_updated', handleFSUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('porto_flash_sale_updated', handleFSUpdated);
    };
  }, []);

  // Synchronize liveShopSettings when prop changes
  useEffect(() => {
    if (shopSettings) setLiveShopSettings(shopSettings);
    else {
      storage.getItem('porto_shop_settings', null).then(res => {
        if (res) setLiveShopSettings(res);
      });
    }
  }, [shopSettings]);

  // Combined pool of all available products (catalog + default fallbacks)
  const allAvailableProducts = useMemo(() => {
    const list = [...products];
    const existingNames = new Set(list.map((p: any) => (p.name || p.title || '').trim().toLowerCase()));
    const extras = DEFAULT_STORE_PRODUCTS.filter(d => !existingNames.has((d.name || d.title || '').trim().toLowerCase()));
    return [...list, ...extras];
  }, [products, DEFAULT_STORE_PRODUCTS]);

  // Effective products list taking admin manual selection into account
  const effectiveProducts = useMemo(() => {
    if (selectedProductIds && selectedProductIds.length > 0) {
      const matched = selectedProductIds
        .map(id => allAvailableProducts.find(p => p.id === id))
        .filter(Boolean);
      if (matched.length > 0) {
        if (matched.length < currentMaxItems) {
          const matchedIds = new Set(matched.map((p: any) => p.id));
          const rest = allAvailableProducts.filter(p => !matchedIds.has(p.id));
          return [...matched, ...rest].slice(0, currentMaxItems);
        }
        return matched.slice(0, currentMaxItems);
      }
    }
    // Default automatic fallback
    let list: any[] = [];
    if (products.length > 0) {
      list = [...products];
      if (list.length < currentMaxItems) {
        const existingNames = new Set(list.map((p: any) => (p.name || p.title || '').trim().toLowerCase()));
        const extras = DEFAULT_STORE_PRODUCTS.filter(d => !existingNames.has(d.name.trim().toLowerCase()));
        list = [...list, ...extras];
      }
    } else {
      list = DEFAULT_STORE_PRODUCTS;
    }
    return list.slice(0, currentMaxItems);
  }, [selectedProductIds, allAvailableProducts, products, DEFAULT_STORE_PRODUCTS, currentMaxItems]);

  // Filter top featured products (preserves custom order if selected, otherwise smart priorities)
  const featuredProducts = useMemo(() => {
    if (selectedProductIds && selectedProductIds.length > 0) {
      return effectiveProducts;
    }
    const flashItems = effectiveProducts.filter(p => isProductFlashSaleActive(p, liveShopSettings));
    const poItems = effectiveProducts.filter(p => !flashItems.some(f => f.id === p.id) && isPreOrderProduct(p));
    const others = effectiveProducts.filter(p => !flashItems.some(f => f.id === p.id) && !poItems.some(po => po.id === p.id));
    return [...flashItems, ...poItems, ...others].slice(0, currentMaxItems);
  }, [selectedProductIds, effectiveProducts, liveShopSettings, currentMaxItems]);

  const handleSaveSelection = (newIds: string[]) => {
    if (onUpdateSelectedProductIds) {
      onUpdateSelectedProductIds(newIds);
    }
    try {
      localStorage.setItem('porto_store_spotlight_products', JSON.stringify(newIds));
    } catch { }
    setIsPickerModalOpen(false);
    setTargetSlotIndex(null);
  };

  const handleSelectForSlot = (productId: string, slotIdx: number) => {
    const current = selectedProductIds && selectedProductIds.length > 0
      ? [...selectedProductIds]
      : featuredProducts.map((p: any) => p.id);

    while (current.length <= slotIdx) {
      const fallback = allAvailableProducts.find(p => !current.includes(p.id))?.id || '';
      current.push(fallback);
    }
    current[slotIdx] = productId;
    const finalIds = current.slice(0, currentMaxItems);
    handleSaveSelection(finalIds);
  };

  // Flash Sale Countdown Calculation
  const activeFlashProduct = useMemo(() => {
    return effectiveProducts.find(p => isProductFlashSaleActive(p, liveShopSettings));
  }, [effectiveProducts, liveShopSettings]);

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!activeFlashProduct) {
      setTimeLeft(null);
      return;
    }
    const update = () => {
      const endTimeStr = getEffectiveFlashSaleEndTime(activeFlashProduct, liveShopSettings);
      const remaining = getFlashSaleTimeRemaining(endTimeStr);
      if (remaining.isExpired) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        hours: (remaining.days * 24) + remaining.hours,
        minutes: remaining.minutes,
        seconds: remaining.seconds
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeFlashProduct, liveShopSettings]);

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const sectionBg = isDark ? '#06070a' : '#eef2f6';

  return (
    <section
      id="store-drops"
      style={{
        width: '100%',
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        background: sectionBg,
        position: 'relative',
        borderTop: `1px solid ${cardBorder}`,
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .lp-store-flash-sale-banner {
          padding: 8px 18px;
          border-radius: 100px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
        @media (max-width: 640px) {
          .lp-store-flash-sale-banner {
            border-radius: 14px !important;
            padding: 10px 14px !important;
            flex-direction: column !important;
            gap: 6px !important;
            max-width: 92% !important;
            box-sizing: border-box !important;
            text-align: center !important;
          }
          .lp-store-flash-sale-banner .lp-store-fs-head {
            justify-content: center !important;
          }
          .lp-store-flash-sale-banner .lp-store-fs-name {
            font-size: 13px !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── Section Header ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 44
        }}>
          <div
            data-reveal={isEditable ? undefined : 'true'}
            className={isEditable ? '' : 'reveal-delay-1'}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateBadge?.(e.currentTarget.textContent || '')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 16px',
              borderRadius: 100,
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
              color: isDark ? '#ffffff' : '#0f172a',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 14,
              border: `1px solid ${cardBorder}`,
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit badge' : undefined}
          >
            <ShoppingBag size={14} />
            <span>{badge || 'KOLEKSI ASET DIGITAL'}</span>
          </div>

          <h2
            data-reveal={isEditable ? undefined : 'true'}
            className={isEditable ? '' : 'reveal-delay-2'}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateTitle?.(e.currentTarget.textContent || '')}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 800,
              color: textColor,
              letterSpacing: '-0.02em',
              margin: '0 0 12px',
              lineHeight: 1.2,
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit judul produk' : undefined}
          >
            {title || 'Produk & Template Digital'}
          </h2>

          <p
            data-reveal={isEditable ? undefined : 'true'}
            className={isEditable ? '' : 'reveal-delay-3'}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateSubtitle?.(e.currentTarget.textContent || '')}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15.5,
              color: subTextColor,
              maxWidth: 580,
              margin: 0,
              lineHeight: 1.6,
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit deskripsi produk' : undefined}
          >
            {subtitle || 'Koleksi template web, identitas visual, dan aset grafis terkurasi untuk mempercepat peluncuran proyek Anda.'}
          </p>

          {/* Flash Sale Banner (If active) - Flat Red Pill on desktop, sleek rounded box on mobile */}
          {activeFlashProduct && timeLeft && (
            <div
              data-reveal={isEditable ? undefined : 'true'}
              className={`lp-store-flash-sale-banner ${isEditable ? '' : 'reveal-delay-4'}`}
              style={{
                marginTop: 20,
                background: '#ef4444',
                border: 'none',
                boxShadow: 'none',
                color: '#ffffff'
              }}
            >
              <div className="lp-store-fs-head" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ffffff', fontWeight: 900, fontSize: 12, letterSpacing: '0.02em' }}>
                <Zap size={14} fill="#ffffff" color="#ffffff" />
                <span>FLASH SALE SPESIAL:</span>
              </div>
              <div className="lp-store-fs-name" style={{ fontSize: 12.5, color: '#ffffff', fontWeight: 750 }}>
                {activeFlashProduct.name}
              </div>
              <div className="lp-store-fs-timer" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11.5,
                fontWeight: 850,
                color: '#ffffff',
                background: 'rgba(0, 0, 0, 0.22)',
                padding: '2px 8px',
                borderRadius: 100
              }}>
                <Clock size={12} strokeWidth={2.4} />
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}j : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}d
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Admin Switcher for 1, 2, or 3 Cards ── */}
        {isEditable && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 28,
            padding: '6px 16px',
            borderRadius: 100,
            background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            border: `1px solid ${cardBorder}`,
            width: 'fit-content',
            margin: '0 auto 28px'
          }}>
            <span style={{ fontSize: 12, fontWeight: 750, color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>
              Tampilkan Produk:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSetMaxItems(num)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 100,
                    border: `1px solid ${currentMaxItems === num ? accentColor : cardBorder}`,
                    background: currentMaxItems === num ? `${accentColor}18` : 'transparent',
                    color: currentMaxItems === num ? accentColor : textColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    fontWeight: currentMaxItems === num ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {num} {num === 3 ? 'Kartu (Maks 3)' : 'Kartu'}
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 16, background: cardBorder, margin: '0 4px' }} />

            <button
              type="button"
              onClick={() => {
                setTargetSlotIndex(null);
                setLocalSelectedIds(selectedProductIds && selectedProductIds.length > 0 ? [...selectedProductIds] : featuredProducts.map((fp: any) => fp.id));
                setIsPickerModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                borderRadius: 100,
                border: `1px solid ${selectedProductIds && selectedProductIds.length > 0 ? accentColor : cardBorder}`,
                background: selectedProductIds && selectedProductIds.length > 0 ? `${accentColor}18` : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
                color: selectedProductIds && selectedProductIds.length > 0 ? accentColor : textColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckSquare size={13} color={selectedProductIds && selectedProductIds.length > 0 ? accentColor : undefined} />
              <span>
                Pilih Produk
                {selectedProductIds && selectedProductIds.length > 0 ? ` (${selectedProductIds.length} Terpilih)` : ' (Otomatis)'}
              </span>
            </button>
          </div>
        )}

        {/* ── Product Grid ── */}
        <div
          className={featuredProducts.length === 3 ? 'lp-store-grid-3' : ''}
          style={{
            display: 'grid',
            gridTemplateColumns: featuredProducts.length === 1
              ? 'minmax(0, 420px)'
              : featuredProducts.length === 2
                ? 'repeat(auto-fit, minmax(min(100%, 320px), 380px))'
                : 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            justifyContent: 'center',
            gap: 22,
            maxWidth: featuredProducts.length === 1 ? 440 : featuredProducts.length === 2 ? 820 : 1240,
            margin: '0 auto 44px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {featuredProducts.map((p: any, idx: number) => {
            const isFlash = isProductFlashSaleActive(p, liveShopSettings);
            const currentPrice = isFlash ? getFlashSalePrice(p, liveShopSettings) : p.price;
            const origPrice = isFlash ? (p.originalPrice || p.price) : p.originalPrice;
            const hasDiscount = isFlash || (origPrice && origPrice > currentPrice);
            const discountPct = isFlash
              ? getFlashSaleDiscountPercent(p, liveShopSettings)
              : (hasDiscount ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0);
            const isPO = isPreOrderProduct(p);
            const poProgress = isPO ? getPreOrderQuotaProgress(p) : null;

            const imgSrc = p.thumbnail || p.gallery?.[0] || p.image || p.cover || (Array.isArray(p.images) ? p.images[0] : null);

            return (
              <div
                key={p.id}
                data-card-3d="true"
                data-reveal={isEditable ? undefined : 'true'}
                className={isEditable ? 'lp-store-card' : `lp-store-card reveal-delay-${(idx % 4) + 1}`}
                onClick={() => {
                  if (!isEditable) {
                    haptic.light();
                    navigate(`/katalog/p/${p.id}`);
                  }
                }}
                style={{
                  background: cardBg,
                  borderRadius: 22,
                  padding: 12,
                  overflow: 'hidden',
                  border: isFlash ? '1.5px solid rgba(239, 68, 68, 0.45)' : `1px solid ${cardBorder}`,
                  cursor: isEditable ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.3s ease',
                  boxShadow: 'none',
                  position: 'relative',
                  width: '100%',
                  maxWidth: featuredProducts.length === 1 ? 420 : 400,
                  margin: '0 auto',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={e => {
                  if (!isEditable && !isFlash) {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.22)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isEditable && !isFlash) {
                    e.currentTarget.style.borderColor = cardBorder;
                  }
                }}
              >
                {/* Visual Editor Quick Action: Change Card / Edit in Catalog */}
                {isEditable && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 18,
                      right: 18,
                      zIndex: 15,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetSlotIndex(idx);
                        setLocalSelectedIds(selectedProductIds && selectedProductIds.length > 0 ? [...selectedProductIds] : featuredProducts.map((fp: any) => fp.id));
                        setIsPickerModalOpen(true);
                      }}
                      title="Ganti produk yang tampil di kartu ini"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 11px',
                        borderRadius: 100,
                        background: isDark ? '#ffffff' : '#0f1115',
                        color: isDark ? '#0f1115' : '#ffffff',
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: "'Outfit', sans-serif",
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                        transition: 'transform 0.18s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <RefreshCw size={11} />
                      <span>Ganti Kartu #{idx + 1}</span>
                    </button>
                    <a
                      href="/admin/catalog"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Buka Katalog (/admin/catalog)"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 9px',
                        borderRadius: 100,
                        background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                        color: textColor,
                        fontSize: 11,
                        fontWeight: 800,
                        fontFamily: "'Outfit', sans-serif",
                        textDecoration: 'none',
                        border: `1px solid ${cardBorder}`,
                        transition: 'transform 0.18s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <ArrowUpRight size={11} strokeWidth={2.4} />
                    </a>
                  </div>
                )}

                {/* Product Image */}
                <div style={{
                  width: '100%',
                  height: 'clamp(180px, 18vw, 210px)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                  background: isDark ? '#0c0d18' : '#f1f5f9'
                }}>
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: subTextColor
                    }}>
                      <Package size={32} opacity={0.4} />
                    </div>
                  )}

                  {/* Badges */}
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {isFlash ? (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: '#ef4444',
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 9.5,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        boxShadow: 'none'
                      }}>
                        <Zap size={10} fill="#ffffff" /> FLASH -{discountPct}%
                      </span>
                    ) : isPO ? (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: '#f59e0b',
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 9.5,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        boxShadow: 'none'
                      }}>
                        <Clock size={10} /> PO {p.preOrderBatch || 'BATCH 1'}
                      </span>
                    ) : hasDiscount ? (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: '#f59e0b',
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 9.5,
                        fontWeight: 800,
                        boxShadow: 'none'
                      }}>
                        HEMAT {discountPct}%
                      </span>
                    ) : null}

                    {p.category && (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: 'rgba(0,0,0,0.65)',
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 9.5,
                        fontWeight: 750,
                        textTransform: 'uppercase'
                      }}>
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div style={{ padding: '12px 6px 4px 6px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Rating & Sales */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 800 }}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <span>{p.rating ? Number(p.rating).toFixed(1) : '5.0'}</span>
                    </div>
                    {p.salesCount ? (
                      <span style={{ color: subTextColor, fontSize: 11, fontWeight: 600 }}>
                        {p.salesCount} Terjual
                      </span>
                    ) : null}
                  </div>

                  {/* Name */}
                  <h3 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14.5,
                    fontWeight: 800,
                    color: textColor,
                    lineHeight: 1.3,
                    margin: '0 0 6px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {p.name}
                  </h3>

                  {/* Specs Row (Image 3 Card Style - Compact) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10.5,
                      fontWeight: 650,
                      color: subTextColor,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      padding: '2px 7px',
                      borderRadius: 999
                    }}>
                      <Zap size={10} color={accentColor} /> Instan
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10.5,
                      fontWeight: 650,
                      color: subTextColor,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      padding: '2px 7px',
                      borderRadius: 999
                    }}>
                      <Package size={10} color={accentColor} /> File Siap Pakai
                    </span>
                  </div>

                  {/* Pre-Order Quota Bar if applicable */}
                  {isPO && poProgress && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 750, color: '#f59e0b', marginBottom: 3, fontFamily: "'Outfit', sans-serif" }}>
                        <span>Slot Quota Terisi</span>
                        <span>{poProgress.sold}/{poProgress.quota} ({poProgress.percentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 3.5, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${poProgress.percentage}%`, height: '100%', background: '#f59e0b', borderRadius: 10 }} />
                      </div>
                    </div>
                  )}

                  {/* Price Row */}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 16,
                        fontWeight: 900,
                        color: isFlash ? '#ef4444' : textColor
                      }}>
                        {formatRp(currentPrice)}
                      </span>
                      {hasDiscount && origPrice && (
                        <span style={{
                          fontSize: 11,
                          color: subTextColor,
                          textDecoration: 'line-through',
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          {formatRp(origPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button - Compact Solid Pill Button */}
                  <div
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: isDark ? '#ffffff' : '#0f1115',
                      color: isDark ? '#0f1115' : '#ffffff',
                      border: 'none',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      fontWeight: 750,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      marginTop: 10,
                      boxSizing: 'border-box'
                    }}
                  >
                    <span>{isPO ? 'Ikuti Pre-Order' : 'Lihat Produk'}</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── View Full Catalog CTA ── */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            data-reveal={isEditable ? undefined : 'true'}
            className={isEditable ? '' : 'reveal-delay-1'}
            onClick={() => {
              if (!isEditable) {
                haptic.medium();
                navigate('/katalog');
              }
            }}
            style={{
              padding: '13px 32px',
              borderRadius: 100,
              border: 'none',
              background: isDark ? '#ffffff' : '#0f1115',
              color: isDark ? '#0f1115' : '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 800,
              cursor: isEditable ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'none',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={e => {
              if (!isEditable) {
                e.currentTarget.style.transform = 'scale(1.03)';
              }
            }}
            onMouseLeave={e => {
              if (!isEditable) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <span>Yuk Jajan</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* ── Product Spotlight Picker Modal (Portal) ── */}
      {isPickerModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}
          onClick={() => {
            setIsPickerModalOpen(false);
            setTargetSlotIndex(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 780,
              maxHeight: '90vh',
              background: isDark ? '#141620' : '#ffffff',
              borderRadius: 24,
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: textColor }}>
                  {targetSlotIndex !== null
                    ? `Pilih Produk untuk Kartu #${targetSlotIndex + 1}`
                    : `Pilih Produk Sorotan Beranda (Maks ${currentMaxItems} Produk)`}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: subTextColor }}>
                  {targetSlotIndex !== null
                    ? 'Klik salah satu produk untuk langsung menampilkannya pada slot kartu ini.'
                    : `Centang hingga ${currentMaxItems} produk untuk ditampilkan sesuai urutan pilihan Anda.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPickerModalOpen(false);
                  setTargetSlotIndex(null);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `1px solid ${cardBorder}`,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 12,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                border: `1px solid ${cardBorder}`
              }}>
                <Search size={15} color={subTextColor} />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Cari produk berdasarkan nama atau kategori..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: textColor,
                    fontFamily: "'Outfit', sans-serif"
                  }}
                />
                {pickerSearch && (
                  <button
                    type="button"
                    onClick={() => setPickerSearch('')}
                    style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Products List/Grid */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: 14
            }}>
              {allAvailableProducts
                .filter((p: any) => {
                  if (!pickerSearch.trim()) return true;
                  const q = pickerSearch.toLowerCase().trim();
                  return (p.name || p.title || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
                })
                .map((p: any) => {
                  const isSlotTarget = targetSlotIndex !== null;
                  const selectedIdx = localSelectedIds.indexOf(p.id);
                  const isSelected = selectedIdx !== -1;
                  const imgSrc = p.thumbnail || (Array.isArray(p.gallery) && p.gallery[0]);

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        haptic.selection();
                        if (isSlotTarget) {
                          handleSelectForSlot(p.id, targetSlotIndex);
                        } else {
                          if (isSelected) {
                            setLocalSelectedIds(localSelectedIds.filter(id => id !== p.id));
                          } else {
                            if (localSelectedIds.length >= currentMaxItems) {
                              const next = [...localSelectedIds.slice(0, currentMaxItems - 1), p.id];
                              setLocalSelectedIds(next);
                            } else {
                              setLocalSelectedIds([...localSelectedIds, p.id]);
                            }
                          }
                        }
                      }}
                      style={{
                        padding: 10,
                        borderRadius: 16,
                        background: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9') : (isDark ? '#1a1d29' : '#f8fafc'),
                        border: `1.5px solid ${isSelected ? accentColor : cardBorder}`,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        position: 'relative',
                        transition: 'transform 0.18s ease, border-color 0.18s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      {/* Image Thumbnail */}
                      <div style={{
                        width: '100%',
                        height: 110,
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: isDark ? '#0b0c12' : '#e2e8f0',
                        position: 'relative'
                      }}>
                        {imgSrc ? (
                          <img src={imgSrc} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={24} color={subTextColor} />
                          </div>
                        )}
                        {isSelected && !isSlotTarget && (
                          <div style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            padding: '2px 8px',
                            borderRadius: 100,
                            background: accentColor,
                            color: '#ffffff',
                            fontSize: 10,
                            fontWeight: 900
                          }}>
                            #{selectedIdx + 1} Terpilih
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div style={{ fontSize: 10, color: subTextColor, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                          {p.category || 'ASET'}
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, lineHeight: 1.3, marginBottom: 4 }}>
                          {p.name || p.title}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: accentColor }}>
                          {formatRp(p.price)}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => handleSaveSelection([])}
                style={{
                  padding: '7px 16px',
                  borderRadius: 100,
                  border: `1px solid ${cardBorder}`,
                  background: 'transparent',
                  color: subTextColor,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset ke Otomatis (Default)
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsPickerModalOpen(false);
                    setTargetSlotIndex(null);
                  }}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 100,
                    border: `1px solid ${cardBorder}`,
                    background: 'transparent',
                    color: textColor,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSelection(localSelectedIds)}
                  style={{
                    padding: '7px 22px',
                    borderRadius: 100,
                    border: 'none',
                    background: isDark ? '#ffffff' : '#0f1115',
                    color: isDark ? '#0f1115' : '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Terapkan Pilihan ({localSelectedIds.length} Produk)
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </section>
  );
};

export default LPStoreSpotlight;
