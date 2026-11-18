import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Heart, Share2, Maximize2, Minimize2, ChevronLeft, ChevronRight,
  Zap, ShieldCheck, Minus, Plus, Check, Ticket, Sparkles, ShoppingCart,
  MessageCircle, Image as ImageIcon, Clock, Briefcase, Package, CheckCircle2,
  Copy, ArrowLeft, ExternalLink, HelpCircle, Lock, FileText, Globe, Flame
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { useNativeBackHandler } from '../../utils/nativeNavigation';
import { isServiceProduct } from '../../services/clientAuth';
import {
  isProductFlashSaleActive,
  getFlashSalePrice,
  getFlashSaleDiscountPercent,
  isPreOrderProduct
} from '../../utils/flashSaleHelper';
import { ServiceOrderBriefSection, ServiceBriefData } from './ServiceOrderBriefSection';

interface ProductDetailModalProps {
  product: any;
  products: any[];
  isMobile: boolean;
  isDark: boolean;
  accentColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
  wishlist: string[];
  toggleWishlist: (id: string, e?: React.MouseEvent) => void;
  copyProductLink: (p: any) => void;
  addToCart: (p: any, variant: any, qty: number) => void;
  handleAskProduct: (price: number) => void;
  formatRp: (val: number) => string;
  appliedVoucher: any;
  setAppliedVoucher: (v: any) => void;
  voucherInput: string;
  setVoucherInput: (s: string) => void;
  voucherMessage: { type: string; text: string };
  setVoucherMessage: (m: { type: string; text: string }) => void;
  handleApplyVoucher: () => void;
  selectedVariant: any;
  setSelectedVariant: (v: any) => void;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  activeImageIdx: number;
  setActiveImageIdx: React.Dispatch<React.SetStateAction<number>>;
  isDetailFullScreen: boolean;
  setIsDetailFullScreen: (b: boolean) => void;
  closeDetail: () => void;
  onSelectProduct: (p: any) => void;
  showCheckout: boolean;
  setShowCheckout: (b: boolean) => void;
  checkoutMode: 'direct' | 'cart';
  setCheckoutMode: (mode: 'direct' | 'cart') => void;
  checkoutForm: any;
  setCheckoutForm: (f: any) => void;
  isSubmitting: boolean;
  submitOrder: (finalPrice: number, items: any[], uniqueCodeNum?: number, paymentSchemeParam?: 'dp' | 'full', serviceBriefData?: ServiceBriefData | null) => void;
  data: any;
  shopSettings: any;
}

export default function ProductDetailModal({
  product: p,
  products,
  isMobile,
  isDark,
  accentColor,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  wishlist,
  toggleWishlist,
  copyProductLink,
  addToCart,
  handleAskProduct,
  formatRp,
  appliedVoucher,
  setAppliedVoucher,
  voucherInput,
  setVoucherInput,
  voucherMessage,
  setVoucherMessage,
  handleApplyVoucher,
  selectedVariant,
  setSelectedVariant,
  quantity,
  setQuantity,
  activeImageIdx,
  setActiveImageIdx,
  isDetailFullScreen,
  setIsDetailFullScreen,
  closeDetail,
  onSelectProduct,
  showCheckout,
  setShowCheckout,
  checkoutMode,
  setCheckoutMode,
  checkoutForm,
  setCheckoutForm,
  isSubmitting,
  submitOrder,
  data,
  shopSettings
}: ProductDetailModalProps) {
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  // Check product types: Pre-Order Merch, Service (Jasa), or Ready Purchase (Beli Langsung)
  const isPO = isPreOrderProduct(p);
  const isService = isServiceProduct(p);
  const isOutOfStock = !isService && !isPO && typeof p?.stock === 'number' && p.stock <= 0;
  const isLowStock = !isService && !isPO && typeof p?.stock === 'number' && p.stock > 0 && p.stock <= 5;
  const isDpPermitted = (isPO && p.preOrderDpAllowed !== false) || (isService && p.serviceDpAllowed !== false);
  const [paymentScheme, setPaymentScheme] = useState<'dp' | 'full'>(isDpPermitted ? 'dp' : 'full');

  useEffect(() => {
    setPaymentScheme(isDpPermitted ? 'dp' : 'full');
  }, [p?.id, isDpPermitted]);

  // Service Brief State (for custom Jasa Brief, deadline, and add-ons)
  const [serviceBriefData, setServiceBriefData] = useState<ServiceBriefData | null>(null);

  // 3-Digit Unique Verification Code
  const [uniqueCode, setUniqueCode] = useState(() => Math.floor(Math.random() * 899) + 100);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);
  
  useEffect(() => {
    if (showCheckout) {
      setUniqueCode(Math.floor(Math.random() * 899) + 100);
    }
  }, [showCheckout]);

  // Native 1-step back navigation
  useNativeBackHandler(Boolean(p) && !showCheckout, closeDetail, 'katalog_product_modal', 10);
  useNativeBackHandler(Boolean(p) && showCheckout, () => setShowCheckout(false), 'katalog_checkout_view', 15);

  const isFlashActive = isProductFlashSaleActive(p, shopSettings);
  const effectiveBasePrice = isFlashActive ? getFlashSalePrice(p, shopSettings) : p.price;
  const unitPrice = selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : effectiveBasePrice;
  const subtotal = unitPrice * quantity;
  const effectiveOriginalPrice = isFlashActive ? (p.flashSale?.originalPrice || p.originalPrice || p.price) : p.originalPrice;
  const hasDiscount = isFlashActive || effectiveOriginalPrice > effectiveBasePrice;
  const discountPercent = isFlashActive 
    ? getFlashSaleDiscountPercent(p, shopSettings)
    : (hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);
  const isFavorited = wishlist.includes(p.id);

  let voucherDiscountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'percent') {
      voucherDiscountAmount = subtotal * (appliedVoucher.discountValue / 100);
    } else {
      voucherDiscountAmount = appliedVoucher.discountValue;
    }
  }
  const finalPriceToPay = Math.max(0, subtotal - voucherDiscountAmount);
  const addonsTotal = isService ? (serviceBriefData?.addonsTotal || 0) : 0;
  const effectiveFinalPriceToPay = finalPriceToPay + addonsTotal;

  const suggestedProducts = products
    .filter(item => item.id !== p.id)
    .slice(0, 4);

  const rawGalleryList: string[] = [
    ...(Array.isArray(p.gallery) ? p.gallery : []),
    ...(Array.isArray(p.images) ? p.images : []),
    ...(Array.isArray(p.mediaUrls) ? p.mediaUrls : []),
    ...(Array.isArray(p.carousel) ? p.carousel : []),
    ...(Array.isArray(p.carouselImages) ? p.carouselImages : []),
    ...(typeof p.image === 'string' && p.image ? [p.image] : []),
    ...(typeof p.cover === 'string' && p.cover ? [p.cover] : []),
    ...(typeof p.coverImage === 'string' && p.coverImage ? [p.coverImage] : []),
    ...(typeof p.thumbnail === 'string' && p.thumbnail ? [p.thumbnail] : [])
  ].filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  const galleryList: string[] = Array.from(new Set(rawGalleryList));
  const totalImages = galleryList.length;
  const safeIdx = Math.min(Math.max(0, activeImageIdx), Math.max(0, totalImages - 1));

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.light();
    setActiveImageIdx((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.light();
    setActiveImageIdx((prev) => (prev + 1) % totalImages);
  };

  const onTouchStartHandler = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
  };

  const onTouchEndHandler = (e: React.TouchEvent) => {
    if (dragStartX === null) return;
    const diff = dragStartX - e.changedTouches[0].clientX;
    if (diff > 40 && totalImages > 1) {
      handleNext();
    } else if (diff < -40 && totalImages > 1) {
      handlePrev();
    }
    setDragStartX(null);
  };

  const onMouseDownHandler = (e: React.MouseEvent) => {
    setDragStartX(e.clientX);
  };

  const onMouseUpHandler = (e: React.MouseEvent) => {
    if (dragStartX === null) return;
    const diff = dragStartX - e.clientX;
    if (diff > 40 && totalImages > 1) {
      handleNext();
    } else if (diff < -40 && totalImages > 1) {
      handlePrev();
    }
    setDragStartX(null);
  };

  // Payment list & QRIS setup
  const paymentList = (data?.shopSettings?.paymentMethods?.length > 0 ? data.shopSettings.paymentMethods : (shopSettings?.paymentMethods || []));
  const qrisUrl = shopSettings?.qrisImageUrl || data?.shopSettings?.qrisImageUrl || '';

  const modalContent = (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 100000, 
      display: 'flex', 
      alignItems: (isMobile || isDetailFullScreen) ? 'stretch' : 'center', 
      justifyContent: 'center', 
      padding: (isMobile || isDetailFullScreen) ? 0 : 20,
      background: 'transparent'
    }}>
      {/* Rich Glassmorphic Backdrop */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: isDark ? 'rgba(4, 6, 14, 0.82)' : 'rgba(10, 15, 30, 0.78)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          transition: 'all 0.25s ease'
        }} 
        onClick={closeDetail} 
      />
      
      {/* Modal Main Frame */}
      <div style={{ 
        position: 'relative', 
        width: isDetailFullScreen ? '100vw' : '100%', 
        maxWidth: isDetailFullScreen ? '100vw' : 1160, 
        height: (isMobile || isDetailFullScreen) ? '100dvh' : '88vh', 
        maxHeight: (isMobile || isDetailFullScreen) ? '100dvh' : '90vh', 
        background: isDark ? '#0c0d16' : '#ffffff', 
        borderRadius: (isMobile || isDetailFullScreen) ? 0 : 28, 
        display: 'flex', 
        flexDirection: 'column', 
        boxShadow: isDark 
          ? '0 30px 100px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)' 
          : '0 25px 80px -15px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)', 
        overflow: 'hidden', 
        border: (isMobile || isDetailFullScreen) ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        animation: 'cmsPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 1
      }}>
        <style>{`
          .custom-modal-scroll::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          .custom-modal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-modal-scroll::-webkit-scrollbar-thumb {
            background: ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'};
            border-radius: 9999px;
          }
          .custom-modal-scroll::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)'};
          }
        `}</style>
        
        {/* ========================================================
            MODAL HEADER: DUAL MODE (Detail vs Checkout)
           ======================================================== */}
        <div style={{ 
          padding: isMobile ? '12px 16px' : (isDetailFullScreen ? '16px 36px' : '14px 28px'), 
          borderBottom: `1px solid ${cardBorder}`, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: isDark ? 'rgba(15, 17, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 20,
          flexShrink: 0
        }}>
          {showCheckout ? (
            /* Checkout View Header */
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 100,
                  padding: '7px 14px',
                  color: textColor,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowLeft size={15} /> Kembali ke Produk
              </button>

              <div style={{ textAlign: 'center', minWidth: 0, padding: '0 12px' }}>
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor, background: `${accentColor}18`, padding: '2px 8px', borderRadius: 6 }}>
                  {isService ? 'Form Jasa' : (isPO ? 'Pre-Order Merch' : 'Pemesanan')}
                </span>
                <h3 style={{ margin: '2px 0 0', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 900, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${cardBorder}`,
                  color: textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            /* Product Detail Header */
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              width: '100%', 
              maxWidth: isDetailFullScreen ? 1320 : '100%', 
              margin: '0 auto' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, minWidth: 0, flex: 1, paddingRight: isMobile ? 6 : 12 }}>
                <span style={{ 
                  fontSize: isMobile ? 9.5 : 10.5, 
                  fontWeight: 850, 
                  color: accentColor, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  padding: isMobile ? '3px 8px' : '4px 10px', 
                  borderRadius: 100, 
                  background: `${accentColor}15`, 
                  fontFamily: "'Outfit', sans-serif", 
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                  {p.category || 'Layanan'}
                </span>
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 14 : 16, fontWeight: 900, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
                {/* Fullscreen Toggle (Hidden on Mobile) */}
                {!isMobile && (
                  <button
                    onClick={() => setIsDetailFullScreen(!isDetailFullScreen)}
                    title={isDetailFullScreen ? "Kecilkan Layar" : "Layar Penuh"}
                    aria-label={isDetailFullScreen ? "Kecilkan" : "Perbesar"}
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${cardBorder}`,
                      color: textColor,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    {isDetailFullScreen ? <Minimize2 size={16} style={{ flexShrink: 0 }} /> : <Maximize2 size={16} style={{ flexShrink: 0 }} />}
                  </button>
                )}

                <button 
                  className="icon-btn cms-circle-btn"
                  onClick={(e) => toggleWishlist(p.id, e)} 
                  title={isFavorited ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                  style={{ 
                    background: isFavorited ? 'rgba(239,68,68,0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), 
                    border: `1px solid ${isFavorited ? 'rgba(239,68,68,0.4)' : cardBorder}`, 
                    color: isFavorited ? '#ef4444' : subTextColor, 
                    cursor: 'pointer', 
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    minWidth: isMobile ? 32 : 36,
                    minHeight: 'unset',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                   <Heart size={isMobile ? 15 : 16} fill={isFavorited ? "#ef4444" : "none"} style={{ flexShrink: 0 }} />
                </button>

                <button 
                  className="icon-btn cms-circle-btn"
                  onClick={() => copyProductLink(p)} 
                  title="Bagikan Tautan Produk" 
                  style={{ 
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                    border: `1px solid ${cardBorder}`, 
                    color: subTextColor, 
                    cursor: 'pointer', 
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    minWidth: isMobile ? 32 : 36,
                    minHeight: 'unset',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '50%',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                   <Share2 size={isMobile ? 15 : 16} style={{ flexShrink: 0 }} />
                </button>

                <button 
                  className="icon-btn cms-circle-btn"
                  onClick={closeDetail} 
                  aria-label="Tutup"
                  style={{ 
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 
                    border: `1px solid ${cardBorder}`, 
                    color: textColor, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    minWidth: isMobile ? 32 : 36,
                    minHeight: 'unset',
                    borderRadius: '50%', 
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                   <X size={isMobile ? 16 : 18} style={{ flexShrink: 0 }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            VIEW 1: PRODUCT DETAIL OVERVIEW (When showCheckout = false)
           ======================================================== */}
        {!showCheckout && (
          <>
            {/* Split-Scroll Container: Left, Center, and Right scroll independently */}
            <div style={{ 
              flex: 1, 
              minHeight: 0,
              overflowY: isMobile ? 'auto' : 'hidden', 
              overflowX: 'hidden',
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              width: '100%',
              WebkitOverflowScrolling: 'touch'
            }}>
              
              {/* ── 1. LEFT COLUMN: Gallery & Trust Highlights (Independent Scroll) ── */}
              <div 
                className="custom-modal-scroll"
                style={{ 
                  width: isMobile ? '100%' : (isDetailFullScreen ? 500 : 440), 
                  minWidth: isMobile ? 'auto' : 340,
                  height: isMobile ? 'auto' : '100%',
                  overflowY: isMobile ? 'visible' : 'auto',
                  flexShrink: 0,
                  padding: isMobile ? '12px 14px 4px' : (isDetailFullScreen ? '26px 32px' : '22px 24px'),
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDark ? 'rgba(255,255,255,0.18) transparent' : 'rgba(0,0,0,0.18) transparent'
                }}
              >
                {/* Swipeable Carousel Display */}
                <div 
                  style={{ 
                    width: '100%', 
                    aspectRatio: isMobile ? '4/3' : '1/1', 
                    maxHeight: isMobile ? 260 : 'none',
                    borderRadius: 22, 
                    overflow: 'hidden', 
                    background: isDark ? '#090a12' : '#f8fafc', 
                    border: `1px solid ${cardBorder}`,
                    position: 'relative',
                    userSelect: 'none',
                    cursor: totalImages > 1 ? 'grab' : 'default',
                    touchAction: 'pan-y'
                  }}
                  onTouchStart={onTouchStartHandler}
                  onTouchEnd={onTouchEndHandler}
                  onMouseDown={onMouseDownHandler}
                  onMouseUp={onMouseUpHandler}
                >
                  {galleryList[safeIdx] ? (
                    <img 
                      src={galleryList[safeIdx]} 
                      alt={p.name} 
                      draggable={false}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        pointerEvents: 'none'
                      }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={48} color={subTextColor} opacity={0.3} />
                    </div>
                  )}

                  {/* Discount Badge */}
                  {hasDiscount && (
                    <span style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 900,
                      padding: '4px 10px',
                      borderRadius: 100,
                      fontFamily: "'Outfit', sans-serif",
                      letterSpacing: '0.04em',
                      boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                      zIndex: 4
                    }}>
                      HEMAT {discountPercent}%
                    </span>
                  )}

                  {/* Navigation Arrows for Multiple Images */}
                  {totalImages > 1 && (
                    <>
                      <button
                        onClick={handlePrev}
                        title="Sebelumnya"
                        aria-label="Sebelumnya"
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.55)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(8px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 5,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <button
                        onClick={handleNext}
                        title="Berikutnya"
                        aria-label="Berikutnya"
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.55)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(8px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 5,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* Counter Pill */}
                      <div style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(6px)',
                        color: '#ffffff',
                        fontSize: 10.5,
                        fontWeight: 750,
                        fontFamily: "'Outfit', sans-serif",
                        zIndex: 4
                      }}>
                        {safeIdx + 1} / {totalImages}
                      </div>
                    </>
                  )}
                </div>

                {/* Carousel Image Thumbnails (Pratinjau Gambar Carousel) */}
                {totalImages > 1 ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 2px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit', sans-serif" }}>
                        Pratinjau Media ({safeIdx + 1}/{totalImages})
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                        Klik untuk ganti
                      </span>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: totalImages > 4 ? 'repeat(auto-fill, minmax(62px, 1fr))' : `repeat(${Math.max(2, totalImages)}, 1fr)`, 
                      gap: 8,
                      maxHeight: 150,
                      overflowY: 'auto'
                    }}>
                      {galleryList.map((img, idx) => {
                        const isActive = idx === safeIdx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              haptic.light();
                              setActiveImageIdx(idx);
                            }}
                            style={{
                              position: 'relative',
                              aspectRatio: '1/1',
                              borderRadius: 14,
                              overflow: 'hidden',
                              padding: 0,
                              border: `2px solid ${isActive ? accentColor : cardBorder}`,
                              opacity: isActive ? 1 : 0.65,
                              cursor: 'pointer',
                              background: isDark ? '#090a12' : '#f1f5f9',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: isActive ? `0 4px 14px ${accentColor}40` : 'none',
                              transform: isActive ? 'scale(1.02)' : 'scale(1)'
                            }}
                          >
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{
                              position: 'absolute',
                              bottom: 4,
                              right: 4,
                              fontSize: 9,
                              fontWeight: 900,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: isActive ? accentColor : 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              fontFamily: "'Outfit', sans-serif"
                            }}>
                              0{idx + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: 8, 
                    marginTop: 12, 
                    padding: '8px 12px', 
                    borderRadius: 12, 
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', 
                    border: `1px solid ${cardBorder}` 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <ImageIcon size={14} color={accentColor} />
                      <span style={{ fontSize: 11.5, color: subTextColor, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                        Gambar Utama Produk
                      </span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: accentColor, background: `${accentColor}18`, padding: '2px 8px', borderRadius: 100 }}>
                      1 / 1
                    </span>
                  </div>
                )}

                {/* Highlights and service specs on desktop (On mobile, placed after purchase details) */}
                {!isMobile && (
                  <>
                    {/* Trust Highlights */}
                    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '10px 6px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                        <Zap size={16} color={accentColor} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>Cepat & Rapi</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '10px 6px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                        <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>Mutu Terjamin</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '10px 6px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                        <MessageCircle size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>Diskusi Klien</span>
                      </div>
                    </div>

                    {/* Spesifikasi & Jaminan Layanan (Biar Tampilan Rata dan Lengkap) */}
                    <div style={{
                      marginTop: 14,
                      padding: '14px 15px',
                      borderRadius: 18,
                      background: isDark ? 'rgba(255,255,255,0.025)' : '#f8fafc',
                      border: `1px solid ${cardBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={13} color={accentColor} style={{ flexShrink: 0 }} />
                          {isService ? 'Spesifikasi Layanan' : (isPO ? 'Ketentuan Pre-Order' : 'Informasi Produk')}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 100 }}>
                          Terverifikasi
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={13} color={accentColor} style={{ flexShrink: 0 }} /> Estimasi Waktu
                          </span>
                          <span style={{ fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            {p.durationDays ? `${p.durationDays} Hari Kerja` : (isService ? '3 - 5 Hari Kerja' : (isPO ? (p.preOrderEstimate || 'Sesuai Batch') : '1 x 24 Jam'))}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={13} color="#10b981" style={{ flexShrink: 0 }} /> Garansi Revisi
                          </span>
                          <span style={{ fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            {p.revisionLimit || (isService ? 'Revisi Sesuai Paket' : 'Garansi Pengiriman')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Package size={13} color="#3b82f6" style={{ flexShrink: 0 }} /> Format Output
                          </span>
                          <span style={{ fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            {isService ? 'Master File Siap Pakai' : (p.type === 'Digital' ? 'File Siap Unduh' : 'Paket Fisik Aman')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageCircle size={13} color="#8b5cf6" style={{ flexShrink: 0 }} /> Alur Konsultasi
                          </span>
                          <span style={{ fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            Chat & WhatsApp
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3 Langkah Alur Pemesanan */}
                    <div style={{
                      marginTop: 12,
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                      border: `1px solid ${cardBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit', sans-serif" }}>
                          Alur Pemesanan
                        </span>
                        <span style={{ fontSize: 10, color: subTextColor }}>3 Langkah Mudah</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 4px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${cardBorder}` }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: accentColor }}>1. Pilih</span>
                          <span style={{ fontSize: 9.5, color: subTextColor, lineHeight: 1.2 }}>Pilih paket & isi brief</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 4px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${cardBorder}` }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#10b981' }}>2. Bayar</span>
                          <span style={{ fontSize: 9.5, color: subTextColor, lineHeight: 1.2 }}>DP 50% atau lunas</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 4px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${cardBorder}` }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6' }}>3. Proses</span>
                          <span style={{ fontSize: 9.5, color: subTextColor, lineHeight: 1.2 }}>Mulai pengerjaan</span>
                        </div>
                      </div>
                    </div>

                    {/* Transaksi Aman & Metode Bayar */}
                    <div style={{
                      marginTop: 10,
                      padding: '10px 13px',
                      borderRadius: 14,
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      border: `1px dashed ${cardBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Lock size={13} color="#10b981" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>
                          Transaksi Aman
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 5px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: textColor, fontFamily: "'Outfit', sans-serif" }}>BCA</span>
                        <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 5px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: textColor, fontFamily: "'Outfit', sans-serif" }}>Mandiri</span>
                        <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 5px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: textColor, fontFamily: "'Outfit', sans-serif" }}>QRIS</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ── 2. RIGHT COLUMN: Product Details, Options, Description & Saran Produk (Independent Scroll) ── */}
              <div 
                className="custom-modal-scroll"
                style={{ 
                  flex: isMobile ? 'initial' : '1 1 0', 
                  minWidth: 0,
                  height: isMobile ? 'auto' : '100%',
                  overflowY: isMobile ? 'visible' : 'auto',
                  padding: isMobile ? '14px 16px 20px' : (isDetailFullScreen ? '26px 36px 36px' : '22px 28px 30px'),
                  borderLeft: isMobile ? 'none' : `1px solid ${cardBorder}`,
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 18,
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDark ? 'rgba(255,255,255,0.18) transparent' : 'rgba(0,0,0,0.18) transparent'
                }}
              >
                <div>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 22 : 27, fontWeight: 900, margin: '0 0 8px', lineHeight: 1.25, color: textColor, letterSpacing: '-0.02em' }}>
                    {p.name}
                  </h2>
                  
                  {/* Flash Sale Banner */}
                  {isFlashActive && (
                    <div style={{
                      marginBottom: 12,
                      padding: '10px 14px',
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(249, 115, 22, 0.16) 100%)',
                      border: '1.5px solid rgba(239, 68, 68, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={18} fill="#ef4444" color="#ef4444" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#ef4444' }}>
                            {p.flashSale?.title || 'FLASH SALE SPESIAL'}
                          </div>
                          <div style={{ fontSize: 11.5, color: subTextColor }}>
                            Hemat {discountPercent}% ({formatRp(effectiveOriginalPrice - unitPrice)})
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', background: '#ef4444', padding: '3px 9px', borderRadius: 100 }}>
                        DISKON {discountPercent}%
                      </span>
                    </div>
                  )}

                  {/* Price Display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 24 : 29, fontWeight: 900, color: isFlashActive ? '#ef4444' : accentColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isFlashActive && <Zap size={22} fill="#ef4444" />}
                      {formatRp(unitPrice)}
                    </span>
                    {hasDiscount && (
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', textDecoration: 'line-through' }}>
                        {formatRp(effectiveOriginalPrice)}
                      </span>
                    )}
                    {hasDiscount && (
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fff', background: isFlashActive ? '#ef4444' : '#f59e0b', padding: '2px 8px', borderRadius: 100 }}>
                        HEMAT {discountPercent}%
                      </span>
                    )}
                    {isLowStock && (
                      <span style={{ fontSize: 11, fontWeight: 850, color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Flame size={12} /> Sisa {p.stock} item lagi!
                      </span>
                    )}
                    {isOutOfStock && (
                      <span style={{ fontSize: 11, fontWeight: 850, color: '#94a3b8', background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0', padding: '2px 8px', borderRadius: 100 }}>
                        Stok Habis
                      </span>
                    )}
                  </div>

                  {/* Differentiated Product Cards */}
                  {isPO ? (
                    <div style={{
                      marginTop: 12,
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                      border: '1.5px solid rgba(245, 158, 11, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245, 158, 11, 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Clock size={18} color="#f59e0b" />
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#f59e0b', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
                              Pre-Order ({p.preOrderBatch || 'BATCH 1'})
                            </span>
                            <span style={{ fontSize: 11.5, color: subTextColor }}>
                              {p.preOrderDpAllowed !== false ? 'Opsi DP 50% booking slot atau bayar penuh 100%.' : 'Pemesanan slot PO dengan pembayaran 100%.'}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 850, padding: '4px 10px', borderRadius: 100, background: '#f59e0b', color: '#fff', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> Pre-Order
                        </span>
                      </div>

                      {/* Progress Quota Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 800, color: '#f59e0b', marginBottom: 5 }}>
                          <span>Kuota: {p.preOrderSold || 0} / {p.preOrderQuota || 50} pcs</span>
                          <span>{Math.min(100, Math.round(((p.preOrderSold || 0) / (p.preOrderQuota || 50)) * 100))}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, Math.round(((p.preOrderSold || 0) / (p.preOrderQuota || 50)) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)', borderRadius: 100 }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: subTextColor, paddingTop: 6, borderTop: `1px solid ${cardBorder}` }}>
                        {p.preOrderEstimate && (
                          <span><strong>Est. Pengiriman:</strong> {p.preOrderEstimate}</span>
                        )}
                        {p.preOrderCloseDate && (
                          <span><strong>Tutup PO:</strong> {new Date(p.preOrderCloseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                  ) : isService ? (
                    <div style={{
                      marginTop: 12,
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: isDark ? 'rgba(124, 58, 237, 0.14)' : 'rgba(124, 58, 237, 0.08)',
                      border: '1.5px solid rgba(124, 58, 237, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(124, 58, 237, 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Briefcase size={18} color="#8b5cf6" />
                        </div>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#8b5cf6', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
                            Layanan Jasa Proyek
                          </span>
                          <span style={{ fontSize: 11.5, color: subTextColor }}>
                            Skema DP 50% untuk mulai pengerjaan, pelunasan sisa 50% saat serah terima.
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 850, padding: '4px 10px', borderRadius: 100, background: '#7c3aed', color: '#fff', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Briefcase size={11} /> Jasa
                      </span>
                    </div>
                  ) : p.type === 'Aplikasi' ? (
                    <div style={{
                      marginTop: 12,
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: isDark ? 'rgba(168, 85, 247, 0.14)' : 'rgba(168, 85, 247, 0.08)',
                      border: '1.5px solid rgba(168, 85, 247, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(168, 85, 247, 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Globe size={18} color="#a855f7" />
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#c084fc', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
                              Aplikasi (Web-Based)
                            </span>
                            <span style={{ fontSize: 11.5, color: subTextColor }}>
                              {p.accessModel === 'subscription' ? 'Akses langganan hosted cloud dengan update otomatis.' : 'Lisensi penuh lifetime & panduan aktivasi instan.'}
                            </span>
                          </div>
                        </div>
                        {p.liveDemoUrl && (
                          <a
                            href={p.liveDemoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '5px 12px',
                              borderRadius: 100,
                              background: '#a855f7',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 800,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            <ExternalLink size={12} /> Coba Live Demo
                          </a>
                        )}
                      </div>
                      {p.techStack && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11, color: subTextColor }}>
                          <span style={{ fontWeight: 800, color: '#c084fc' }}>Tech:</span>
                          {p.techStack.split(',').map((t: string, i: number) => (
                            <span key={i} style={{ padding: '2px 8px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', fontSize: 10.5, fontWeight: 700 }}>
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 12,
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                          <Zap size={17} color="#10b981" />
                        </div>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#10b981', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
                            Beli Langsung (Sekali Bayar Lunas)
                          </span>
                          <span style={{ fontSize: 11.5, color: subTextColor }}>
                            {(p.type === 'Digital' || p.downloadUrl) ? 'Aset digital langsung siap diunduh di menu /akun setelah verifikasi pembayaran.' : 'Produk fisik sekali beli langsung disiapkan untuk pengiriman.'}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 850, padding: '4px 10px', borderRadius: 100, background: '#10b981', color: '#fff', letterSpacing: '0.04em' }}>
                        BELI LANGSUNG
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>Jumlah:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 100, padding: '4px 10px', border: `1px solid ${cardBorder}` }}>
                    <button 
                      type="button"
                      onClick={() => {
                        haptic.light();
                        setQuantity(Math.max(1, quantity - 1));
                      }} 
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 15, minWidth: 24, textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        haptic.light();
                        setQuantity(quantity + 1);
                      }} 
                      style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Variant Selection */}
                {p.variants?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                      {shopSettings.txtSelectVariant || 'Pilih Varian'}:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {p.variants.map((v: any) => {
                        const isSelected = selectedVariant?.id === v.id;
                        return (
                          <button 
                            key={v.id} 
                            type="button"
                            onClick={() => {
                              haptic.light();
                              setSelectedVariant(isSelected ? null : v);
                            }} 
                            style={{ 
                              padding: '8px 16px', 
                              borderRadius: 100, 
                              border: `1.5px solid ${isSelected ? accentColor : cardBorder}`, 
                              background: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'),
                              color: isSelected ? '#ffffff' : textColor,
                              fontFamily: "'Outfit', sans-serif", 
                              fontSize: 12.5, 
                              fontWeight: isSelected ? 800 : 600, 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 6, 
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? `0 4px 14px ${accentColor}40` : 'none'
                            }}
                          >
                            {v.name}
                            {isSelected && <Check size={13} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Promo Voucher Box */}
                <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1.5px dashed ${cardBorder}`, padding: 14, borderRadius: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                    <Ticket size={15} color={accentColor} /> {shopSettings.txtPromoPlaceholder || 'Punya Kode Promo?'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      value={voucherInput}
                      onChange={e => { setVoucherInput(e.target.value.toUpperCase()); setVoucherMessage({type:'', text:''}); setAppliedVoucher(null); }}
                      placeholder="KODE PROMO..."
                      style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 100, border: `1px solid ${cardBorder}`, background: isDark ? '#0c0d14' : '#ffffff', color: textColor, fontSize: 13, outline: 'none', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}
                    />
                    <button 
                      type="button"
                      onClick={handleApplyVoucher} 
                      style={{ height: 42, padding: '0 20px', borderRadius: 100, border: 'none', background: accentColor, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", boxShadow: `0 4px 12px ${accentColor}30` }}
                    >
                      Gunakan
                    </button>
                  </div>
                  {voucherMessage.text && (
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: voucherMessage.type === 'error' ? '#ef4444' : '#10b981', fontFamily: "'Inter', sans-serif" }}>
                      {voucherMessage.text}
                    </div>
                  )}
                </div>

                {/* 3 Trust Badges on Mobile (Clean placement right after voucher / purchase options) */}
                {isMobile && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '2px 0 4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '10px 4px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                      <Zap size={16} color={accentColor} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>Cepat & Rapi</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '10px 4px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                      <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>Mutu Terjamin</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '10px 4px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                      <MessageCircle size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>Diskusi Klien</span>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                    {shopSettings.txtProductDesc || 'Deskripsi Produk'}:
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.7, color: subTextColor, margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'Inter', sans-serif" }}>
                    {p.description || 'Tidak ada deskripsi tambahan untuk produk ini.'}
                  </p>
                </div>

                {/* Spesifikasi Layanan & Alur on Mobile */}
                {isMobile && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                    {/* Spesifikasi Layanan */}
                    <div style={{
                      padding: '14px 15px',
                      borderRadius: 18,
                      background: isDark ? 'rgba(255,255,255,0.025)' : '#f8fafc',
                      border: `1px solid ${cardBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={13} color={accentColor} style={{ flexShrink: 0 }} />
                          {isService ? 'Spesifikasi Layanan' : (isPO ? 'Ketentuan Pre-Order' : 'Informasi Produk')}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 100 }}>
                          Terverifikasi
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={13} color={accentColor} style={{ flexShrink: 0 }} /> Estimasi Waktu
                          </span>
                          <span style={{ fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            {p.durationDays ? `${p.durationDays} Hari Kerja` : (isService ? '3 - 5 Hari Kerja' : (isPO ? (p.preOrderEstimate || 'Sesuai Batch') : '1 x 24 Jam'))}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={13} color="#10b981" style={{ flexShrink: 0 }} /> Garansi Revisi
                          </span>
                          <span style={{ fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            {p.revisionLimit || (isService ? 'Revisi Sesuai Paket' : 'Garansi Pengiriman')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Package size={13} color="#3b82f6" style={{ flexShrink: 0 }} /> Format Output
                          </span>
                          <span style={{ fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            {isService ? 'Master File Siap Pakai' : (p.type === 'Digital' ? 'File Siap Unduh' : 'Paket Fisik Aman')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageCircle size={13} color="#8b5cf6" style={{ flexShrink: 0 }} /> Alur Konsultasi
                          </span>
                          <span style={{ fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                            Chat & WhatsApp
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3 Langkah Alur Pemesanan */}
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                      border: `1px solid ${cardBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit', sans-serif" }}>
                          Alur Pemesanan
                        </span>
                        <span style={{ fontSize: 10, color: subTextColor }}>3 Langkah Mudah</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 4px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${cardBorder}` }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: accentColor }}>1. Pilih</span>
                          <span style={{ fontSize: 9.5, color: subTextColor, lineHeight: 1.2 }}>Pilih paket & isi brief</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 4px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${cardBorder}` }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#10b981' }}>2. Bayar</span>
                          <span style={{ fontSize: 9.5, color: subTextColor, lineHeight: 1.2 }}>DP 50% atau lunas</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 4px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${cardBorder}` }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6' }}>3. Proses</span>
                          <span style={{ fontSize: 9.5, color: subTextColor, lineHeight: 1.2 }}>Mulai pengerjaan</span>
                        </div>
                      </div>
                    </div>

                    {/* Transaksi Aman & Metode Bayar */}
                    <div style={{
                      padding: '10px 13px',
                      borderRadius: 14,
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      border: `1px dashed ${cardBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Lock size={13} color="#10b981" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>
                          Transaksi Aman
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 5px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: textColor, fontFamily: "'Outfit', sans-serif" }}>BCA</span>
                        <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 5px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: textColor, fontFamily: "'Outfit', sans-serif" }}>Mandiri</span>
                        <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 5px', borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: textColor, fontFamily: "'Outfit', sans-serif" }}>QRIS</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Saran Produk & Layanan Terkait (Ditaruh Paling Bawah Habis Deskripsi) ── */}
                {suggestedProducts.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 18, borderTop: `1px solid ${cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Sparkles size={16} color={accentColor} style={{ flexShrink: 0 }} />
                        <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 900, color: textColor }}>
                          Saran Produk & Layanan Terkait
                        </h4>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Rekomendasi Pilihan
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: 12
                    }}>
                      {suggestedProducts.map(sItem => (
                        <div
                          key={sItem.id}
                          onClick={() => onSelectProduct(sItem)}
                          style={{
                            borderRadius: 16,
                            overflow: 'hidden',
                            background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                            border: `1px solid ${cardBorder}`,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = accentColor;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.borderColor = cardBorder;
                          }}
                        >
                          <div style={{ width: '100%', aspectRatio: '16/11', background: isDark ? '#090a12' : '#f1f5f9', overflow: 'hidden' }}>
                            <img
                              src={sItem.gallery?.[0] || sItem.image || 'https://placehold.co/300x200?text=Produk'}
                              alt={sItem.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontSize: 9.5, fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
                                {sItem.category || 'Layanan'}
                              </span>
                              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12.5, fontWeight: 800, color: textColor, margin: '2px 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sItem.name}
                              </div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: accentColor, marginTop: 4 }}>
                              {formatRp(sItem.price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Bar DOCKED at Modal Bottom */}
            <div style={{ 
              padding: isMobile ? '10px 14px' : (isDetailFullScreen ? '16px 36px' : '14px 28px'), 
              borderTop: `1px solid ${cardBorder}`, 
              background: isDark ? 'rgba(15, 17, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              flexShrink: 0,
              boxShadow: isDark ? '0 -8px 24px rgba(0,0,0,0.35)' : '0 -8px 24px rgba(0,0,0,0.06)',
              zIndex: 20
            }}>
              <div style={{
                maxWidth: isDetailFullScreen ? 1320 : '100%',
                margin: '0 auto',
                display: 'flex', 
                gap: isMobile ? 8 : 10, 
                alignItems: 'center'
              }}>
                {/* Live Demo Button (if available) */}
                {p.liveDemoUrl && (
                  <a
                    href={p.liveDemoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Coba Live Demo di Tab Baru"
                    style={{
                      height: isMobile ? 44 : 48,
                      padding: isMobile ? '0 12px' : '0 16px',
                      borderRadius: isMobile ? 14 : 100,
                      border: '1.5px solid rgba(168, 85, 247, 0.45)',
                      background: isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(168, 85, 247, 0.1)',
                      color: '#c084fc',
                      fontSize: 13,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>Demo</span>
                  </a>
                )}

                {/* Cart Button */}
                <button 
                  type="button"
                  onClick={() => !isOutOfStock && addToCart(p, selectedVariant, quantity)} 
                  disabled={isOutOfStock}
                  title={isOutOfStock ? "Stok Sedang Habis" : "Tambah ke Keranjang"}
                  aria-label="Tambah ke Keranjang"
                  style={{ 
                    flex: isMobile ? '0 0 44px' : 1, 
                    maxWidth: isDetailFullScreen ? 320 : 'none',
                    height: isMobile ? 44 : 48, 
                    width: isMobile ? 44 : 'auto',
                    borderRadius: isMobile ? 14 : 100, 
                    border: `1.5px solid ${cardBorder}`, 
                    background: isOutOfStock ? (isDark ? 'rgba(255,255,255,0.02)' : '#f1f5f9') : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), 
                    color: isOutOfStock ? subTextColor : textColor, 
                    fontSize: 13.5, 
                    fontWeight: 800, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 8, 
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
                    opacity: isOutOfStock ? 0.6 : 1,
                    fontFamily: "'Outfit', sans-serif",
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  <ShoppingCart size={isMobile ? 18 : 16} style={{ flexShrink: 0 }} />
                  {!isMobile && <span>{isOutOfStock ? 'Stok Habis' : 'Keranjang'}</span>}
                </button>

                {/* Primary CTA Button (Pesan Jasa / Pre-Order / Beli Sekarang / Tanya Restock) */}
                {isOutOfStock ? (
                  <button 
                    type="button"
                    onClick={() => handleAskProduct(unitPrice)} 
                    style={{ 
                      flex: 1, 
                      maxWidth: isDetailFullScreen ? 420 : 'none',
                      height: isMobile ? 44 : 48, 
                      borderRadius: 100, 
                      border: 'none', 
                      background: '#25D366', 
                      color: '#fff', 
                      fontSize: 13.5, 
                      fontWeight: 900, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: isMobile ? '0 12px' : '0 20px',
                      gap: isMobile ? 7 : 10, 
                      cursor: 'pointer', 
                      fontFamily: "'Outfit', sans-serif",
                      boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)',
                      transition: 'all 0.2s',
                      minWidth: 0
                    }}
                  >
                    <MessageCircle size={isMobile ? 16 : 15} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 900, whiteSpace: 'nowrap' }}>
                      Tanya Restock via WA
                    </span>
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => {
                      setCheckoutMode('direct');
                      setCheckoutForm({
                        name: '',
                        phone: '',
                        email: '',
                        address: '',
                        notes: '',
                        paymentMethodId: ''
                      });
                      setServiceBriefData(null);
                      setShowCheckout(true);
                    }} 
                    style={{ 
                      flex: 1, 
                      maxWidth: isDetailFullScreen ? 420 : 'none',
                      height: isMobile ? 44 : 48, 
                      borderRadius: 100, 
                      border: 'none', 
                      background: isPO ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : accentColor, 
                      color: '#fff', 
                      fontSize: 13.5, 
                      fontWeight: 900, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: isMobile ? '0 12px' : '0 20px',
                      gap: isMobile ? 7 : 10, 
                      cursor: 'pointer', 
                      fontFamily: "'Outfit', sans-serif",
                      boxShadow: `0 6px 20px ${isPO ? 'rgba(245, 158, 11, 0.4)' : `${accentColor}40`}`,
                      transition: 'all 0.2s',
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 7 : 8, minWidth: 0 }}>
                      {isPO 
                        ? <Clock size={isMobile ? 16 : 15} style={{ flexShrink: 0 }} /> 
                        : (isService 
                            ? <Briefcase size={isMobile ? 16 : 15} style={{ flexShrink: 0 }} /> 
                            : <Package size={isMobile ? 16 : 15} style={{ flexShrink: 0 }} />)}
                      
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row', 
                        alignItems: isMobile ? 'flex-start' : 'center', 
                        gap: isMobile ? 0 : 6, 
                        lineHeight: isMobile ? 1.15 : 1.25, 
                        minWidth: 0,
                        textAlign: isMobile ? 'left' : 'center'
                      }}>
                        <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 900, whiteSpace: 'nowrap' }}>
                          {isPO ? 'Pre-Order' : (isService ? 'Pesan Jasa' : 'Beli Langsung')}
                        </span>
                        <span style={{ fontSize: isMobile ? 11 : 13.5, fontWeight: 800, opacity: isMobile ? 0.95 : 1, whiteSpace: 'nowrap' }}>
                          ({formatRp(finalPriceToPay)})
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* Live Chat Admin Button */}
                <button 
                  type="button"
                  onClick={() => handleAskProduct(finalPriceToPay)} 
                  style={{ 
                    width: isMobile ? 44 : 48, 
                    height: isMobile ? 44 : 48, 
                    borderRadius: isMobile ? 14 : '50%', 
                    border: `1px solid ${cardBorder}`, 
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', 
                    color: textColor, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    flexShrink: 0,
                    transition: 'all 0.2s' 
                  }} 
                  title="Tanyakan Produk ke Admin via Live Chat"
                  aria-label="Tanya Admin"
                >
                  <MessageCircle size={isMobile ? 18 : 19} style={{ flexShrink: 0 }} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========================================================
            VIEW 2: DIRECT CHECKOUT & BRIEF FORM (Seamless within modal)
           ======================================================== */}
        {showCheckout && (
          <div style={{ 
            flex: 1, 
            minHeight: 0,
            overflowY: isMobile ? 'auto' : 'hidden', 
            overflowX: 'hidden',
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            width: '100%',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* Left Column: Order Summary & Payment Scheme (Independent Scroll) */}
            <div 
              className="custom-modal-scroll"
              style={{ 
                width: isMobile ? '100%' : 390, 
                minWidth: isMobile ? 'auto' : 320,
                height: isMobile ? 'auto' : '100%',
                overflowY: isMobile ? 'visible' : 'auto',
                flexShrink: 0, 
                padding: isMobile ? '16px 16px 8px' : '24px 28px',
                borderRight: isMobile ? 'none' : `1px solid ${cardBorder}`,
                display: 'flex', 
                flexDirection: 'column', 
                gap: 16,
                scrollbarWidth: 'thin',
                scrollbarColor: isDark ? 'rgba(255,255,255,0.18) transparent' : 'rgba(0,0,0,0.18) transparent'
              }}
            >
              {/* Product Snapshot Card */}
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 14, borderRadius: 18, border: `1px solid ${cardBorder}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src={galleryList[0] || 'https://placehold.co/100x100?text=Produk'}
                  alt={p.name}
                  style={{ width: 68, height: 68, borderRadius: 14, objectFit: 'cover', background: isDark ? '#090a12' : '#f1f5f9' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: accentColor, textTransform: 'uppercase' }}>
                    {p.category || 'Layanan'}
                  </span>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: textColor, margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: subTextColor }}>
                    {selectedVariant?.name ? `${selectedVariant.name} • ` : ''}{quantity} item • <strong>{formatRp(unitPrice)}</strong>
                  </div>
                </div>
              </div>

              {/* Payment Scheme Selection: DP 50% vs Lunas */}
              {isPO ? (
                <div style={{ background: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)', padding: 14, borderRadius: 18, border: '1.5px solid rgba(245, 158, 11, 0.35)' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 850, color: '#f59e0b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif" }}>
                    <Clock size={14} /> Skema Pre-Order Merch
                  </div>
                  {p.preOrderDpAllowed !== false ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${paymentScheme === 'dp' ? '#f59e0b' : cardBorder}`, background: isDark ? '#090a12' : '#ffffff', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="paymentSchemeDirect"
                          value="dp"
                          checked={paymentScheme === 'dp'}
                          onChange={() => setPaymentScheme('dp')}
                          style={{ width: 16, height: 16, accentColor: '#f59e0b', marginTop: 2 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 850, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              DP 50% Booking Slot
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#f59e0b' }}>
                              {formatRp(Math.round(finalPriceToPay * 0.5))}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                            Kunci kuota batch dengan DP 50%. Sisa dilunasi sebelum pengiriman barang.
                          </div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${paymentScheme === 'full' ? '#f59e0b' : cardBorder}`, background: isDark ? '#090a12' : '#ffffff', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="paymentSchemeDirect"
                          value="full"
                          checked={paymentScheme === 'full'}
                          onChange={() => setPaymentScheme('full')}
                          style={{ width: 16, height: 16, accentColor: '#f59e0b', marginTop: 2 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 850, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              Lunas 100% di Awal
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#f59e0b' }}>
                              {formatRp(finalPriceToPay)}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                            Bayar lunas 100% sekarang. Barang langsung dikirim begitu batch selesai.
                          </div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 12px', borderRadius: 12, background: isDark ? '#090a12' : '#ffffff', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span style={{ fontSize: 12, color: textColor, fontWeight: 700 }}>Pemesanan batch ini wajib dibayar penuh ({formatRp(finalPriceToPay)}).</span>
                    </div>
                  )}
                </div>
              ) : isService ? (
                <div style={{ background: isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.05)', padding: 14, borderRadius: 18, border: '1.5px solid rgba(124, 58, 237, 0.28)' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 850, color: '#8b5cf6', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif" }}>
                    <Briefcase size={14} /> Skema Pembayaran Jasa
                  </div>
                  {p.serviceDpAllowed !== false ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${paymentScheme === 'dp' ? accentColor : cardBorder}`, background: isDark ? '#090a12' : '#ffffff', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="paymentSchemeDirect"
                          value="dp"
                          checked={paymentScheme === 'dp'}
                          onChange={() => setPaymentScheme('dp')}
                          style={{ width: 16, height: 16, accentColor, marginTop: 2 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 850, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              DP 50% Kick-off
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: accentColor }}>
                              {formatRp(Math.round(effectiveFinalPriceToPay * 0.5))}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                            Mulai pengerjaan proyek dengan DP 50%. Sisa 50% dilunasi saat serah terima.
                          </div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${paymentScheme === 'full' ? accentColor : cardBorder}`, background: isDark ? '#090a12' : '#ffffff', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="paymentSchemeDirect"
                          value="full"
                          checked={paymentScheme === 'full'}
                          onChange={() => setPaymentScheme('full')}
                          style={{ width: 16, height: 16, accentColor, marginTop: 2 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 850, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                              Lunas 100% di Awal
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: accentColor }}>
                              {formatRp(effectiveFinalPriceToPay)}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                            Pelunasan langsung di awal tanpa transfer termin kedua.
                          </div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 12px', borderRadius: 12, background: isDark ? '#090a12' : '#ffffff', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span style={{ fontSize: 12, color: textColor, fontWeight: 700 }}>Layanan ini wajib dibayar penuh di awal ({formatRp(effectiveFinalPriceToPay)}).</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)', padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ fontSize: 12, color: textColor, fontWeight: 700 }}>Pembayaran sekali bayar lunas ({formatRp(effectiveFinalPriceToPay)}). Langsung diproses tanpa termin.</span>
                </div>
              )}

              {/* Financial Summary Card */}
              <div style={{ background: isDark ? '#090a12' : '#f9fafb', padding: 16, borderRadius: 18, border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>
                  <span>Subtotal Produk ({quantity}x):</span>
                  <span>{formatRp(subtotal)}</span>
                </div>
                {addonsTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5, color: accentColor, fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>
                    <span>Add-ons ({serviceBriefData?.selectedAddons.length}):</span>
                    <span>+{formatRp(addonsTotal)}</span>
                  </div>
                )}
                {voucherDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5, color: '#10b981', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                    <span>Diskon Voucher:</span>
                    <span>-{formatRp(voucherDiscountAmount)}</span>
                  </div>
                )}

                {(isService || (isPO && p.preOrderDpAllowed !== false)) && paymentScheme === 'dp' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5, color: isPO ? '#f59e0b' : '#8b5cf6', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                      <span>{isPO ? 'Booking DP PO (50%):' : 'DP Kick-off (50%):'}</span>
                      <span>{formatRp(Math.round(effectiveFinalPriceToPay * 0.5))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5, color: '#f59e0b', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                      <span>Kode Unik Verifikasi:</span>
                      <span>+{uniqueCode}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: `1px solid ${cardBorder}`, fontSize: 15, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                      <span>Tagihan DP Sekarang:</span>
                      <span style={{ color: isPO ? '#f59e0b' : accentColor }}>{formatRp(Math.round(effectiveFinalPriceToPay * 0.5) + uniqueCode)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11.5, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>
                      <span>{isPO ? 'Sisa Pelunasan Sebelum Kirim:' : 'Sisa Pelunasan Serah Terima:'}</span>
                      <span style={{ fontWeight: 700, color: textColor }}>{formatRp(effectiveFinalPriceToPay - Math.round(effectiveFinalPriceToPay * 0.5))}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5, color: '#f59e0b', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                      <span>Kode Unik Verifikasi:</span>
                      <span>+{uniqueCode}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: `1px solid ${cardBorder}`, fontSize: 15, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                      <span>Total Tagihan Lunas:</span>
                      <span style={{ color: isPO ? '#f59e0b' : accentColor }}>{formatRp(effectiveFinalPriceToPay + uniqueCode)}</span>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Right Column: Buyer Data, Brief Form, Payment, and Action (Independent Scroll) */}
            <div 
              className="custom-modal-scroll"
              style={{ 
                flex: 1, 
                minWidth: 0, 
                height: isMobile ? 'auto' : '100%',
                overflowY: isMobile ? 'visible' : 'auto',
                padding: isMobile ? '10px 16px 32px' : '24px 32px 36px',
                display: 'flex', 
                flexDirection: 'column', 
                gap: 16,
                scrollbarWidth: 'thin',
                scrollbarColor: isDark ? 'rgba(255,255,255,0.18) transparent' : 'rgba(0,0,0,0.18) transparent'
              }}
            >
              
              {/* 1. Buyer Information */}
              <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', padding: 18, borderRadius: 20, border: `1px solid ${cardBorder}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.04em', color: subTextColor, marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>
                  1. Data Pemesan
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: textColor, marginBottom: 5, fontFamily: "'Outfit', sans-serif" }}>Nama Lengkap *</label>
                    <input 
                      value={checkoutForm.name} 
                      onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} 
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }} 
                      placeholder="Cth: Budi Santoso" 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: textColor, marginBottom: 5, fontFamily: "'Outfit', sans-serif" }}>Nomor WhatsApp *</label>
                    <input 
                      value={checkoutForm.phone} 
                      onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} 
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }} 
                      placeholder="Cth: 08123456789" 
                    />
                  </div>
                </div>
              </div>

              {/* 2. Service Brief Form OR Order Notes */}
              {isService ? (
                <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', padding: 18, borderRadius: 20, border: `1px solid ${cardBorder}` }}>
                  <div style={{ fontSize: 12.5, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.04em', color: subTextColor, marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>
                    2. Brief & Kebutuhan Jasa
                  </div>
                  <ServiceOrderBriefSection
                    isDark={isDark}
                    accentColor={accentColor}
                    cardBorder={cardBorder}
                    textColor={textColor}
                    subTextColor={subTextColor}
                    onChange={setServiceBriefData}
                    formatRp={formatRp}
                  />
                </div>
              ) : (
                <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', padding: 18, borderRadius: 20, border: `1px solid ${cardBorder}` }}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: textColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>Catatan Pesanan / Pengiriman (Opsional)</label>
                  <textarea 
                    value={checkoutForm.address} 
                    onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} 
                    style={{ width: '100%', height: 68, padding: '10px 14px', borderRadius: 12, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13, outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif" }} 
                    placeholder="Masukkan alamat pengiriman lengkap atau catatan tambahan..." 
                  />
                </div>
              )}

              {/* 3. Payment Methods */}
              {(paymentList.length > 0 || qrisUrl) && (
                <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', padding: 18, borderRadius: 20, border: `1px solid ${cardBorder}` }}>
                  <div style={{ fontSize: 12.5, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.04em', color: subTextColor, marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>
                    {isService ? '3. Rekening Pembayaran' : '2. Rekening Pembayaran'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {qrisUrl && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${checkoutForm.paymentMethodId === 'qris_toko' ? accentColor : cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="qris_toko" 
                            checked={checkoutForm.paymentMethodId === 'qris_toko'} 
                            onChange={() => setCheckoutForm({...checkoutForm, paymentMethodId: 'qris_toko'})}
                            style={{ width: 16, height: 16, accentColor: accentColor }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>QRIS Instan (Bebas Biaya Admin)</span>
                              <span style={{ fontSize: 10, background: '#10b98120', color: '#10b981', fontWeight: 800, padding: '2px 6px', borderRadius: 6 }}>0% Fee</span>
                            </div>
                            <div style={{ fontSize: 11, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>{shopSettings.qrisMerchantName || 'BCA / GoPay / OVO / Dana / Mandiri / ShopeePay'}</div>
                          </div>
                        </div>
                        {checkoutForm.paymentMethodId === 'qris_toko' && (
                          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', padding: 14, borderRadius: 12, border: `1px solid ${cardBorder}` }}>
                            <img src={qrisUrl} alt="QRIS Toko" style={{ maxWidth: 190, width: '100%', height: 'auto', borderRadius: 8 }} />
                            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
                              Scan barcode QRIS di atas untuk membayar langsung.
                            </span>
                          </div>
                        )}
                      </label>
                    )}

                    {paymentList.map((pm: any) => (
                      <label key={pm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 14, border: `1.5px solid ${checkoutForm.paymentMethodId === pm.id ? accentColor : cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={pm.id} 
                            checked={checkoutForm.paymentMethodId === pm.id} 
                            onChange={() => setCheckoutForm({...checkoutForm, paymentMethodId: pm.id})}
                            style={{ width: 16, height: 16, accentColor: accentColor, flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif", userSelect: 'text' }}>
                              {pm.bankName} - <span style={{ fontFamily: 'monospace' }}>{pm.accountNumber}</span>
                            </div>
                            <div style={{ fontSize: 11, color: subTextColor, fontFamily: "'Inter', sans-serif", userSelect: 'text' }}>A.n {pm.accountName}</div>
                          </div>
                        </div>
                        {pm.accountNumber && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              haptic.light();
                              navigator.clipboard.writeText(pm.accountNumber);
                              setCopiedBankId(pm.id);
                              setTimeout(() => setCopiedBankId(null), 2000);
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              border: `1px solid ${copiedBankId === pm.id ? '#10b981' : cardBorder}`,
                              background: copiedBankId === pm.id ? 'rgba(16,185,129,0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : '#ffffff'),
                              color: copiedBankId === pm.id ? '#10b981' : textColor,
                              fontSize: 11,
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              flexShrink: 0
                            }}
                            title="Salin Nomor Rekening"
                          >
                            {copiedBankId === pm.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedBankId === pm.id ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Order Action Button */}
              <button 
                type="button"
                onClick={() => {
                  const isDp = ((isService && p.serviceDpAllowed !== false) || (isPO && p.preOrderDpAllowed !== false)) && paymentScheme === 'dp';
                  const effectiveBase = isDp ? Math.round(effectiveFinalPriceToPay * 0.5) : effectiveFinalPriceToPay;
                  submitOrder(
                    effectiveBase, 
                    [{ 
                      ...p, 
                      quantity, 
                      price: unitPrice, 
                      variantName: selectedVariant?.name || '', 
                      isService,
                      isPreOrder: isPO,
                      serviceDpAllowed: p.serviceDpAllowed,
                      preOrderDpAllowed: p.preOrderDpAllowed,
                      preOrderBatch: p.preOrderBatch || 'BATCH 1',
                      preOrderEstimate: p.preOrderEstimate || ''
                    }], 
                    uniqueCode,
                    isDp ? 'dp' : 'full',
                    isService ? serviceBriefData : null
                  );
                }} 
                disabled={isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((paymentList.length > 0 || qrisUrl) && !checkoutForm.paymentMethodId)}
                style={{ 
                  width: '100%', 
                  height: 50, 
                  borderRadius: 100, 
                  border: 'none', 
                  background: (isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((paymentList.length > 0 || qrisUrl) && !checkoutForm.paymentMethodId)) 
                    ? 'rgba(150,150,150,0.3)' 
                    : (isPO ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : accentColor), 
                  color: '#fff', 
                  fontSize: 14.5, 
                  fontWeight: 850, 
                  cursor: (isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((paymentList.length > 0 || qrisUrl) && !checkoutForm.paymentMethodId)) ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8, 
                  fontFamily: "'Outfit', sans-serif",
                  marginTop: 4,
                  boxShadow: `0 8px 24px ${isPO ? 'rgba(245, 158, 11, 0.4)' : `${accentColor}40`}`
                }}
              >
                {isSubmitting ? 'Memproses Pesanan...' : (
                  <>
                    <ShoppingCart size={17} /> {
                      isPO 
                        ? (paymentScheme === 'dp' ? 'Gas DP' : 'Gas Pre-Order')
                        : (isService && paymentScheme === 'dp' ? 'Gas DP' : (isService ? 'Gas Pesan' : 'Bungkus Yuk'))
                    }
                  </>
                )}
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
