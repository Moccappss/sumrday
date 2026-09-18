import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Heart, Share2, Maximize2, Minimize2, ChevronLeft, ChevronRight,
  Zap, ShieldCheck, Minus, Plus, Check, Ticket, Sparkles, ShoppingCart,
  MessageCircle, Image as ImageIcon
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

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
  submitOrder: (finalPrice: number, items: any[], uniqueCodeNum?: number) => void;
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

  // 3-Digit Unique Verification Code
  const [uniqueCode, setUniqueCode] = useState(() => Math.floor(Math.random() * 899) + 100);
  useEffect(() => {
    if (showCheckout) {
      setUniqueCode(Math.floor(Math.random() * 899) + 100);
    }
  }, [showCheckout]);

  // Native 1-step back navigation
  useNativeBackHandler(Boolean(p) && !showCheckout, closeDetail, 'katalog_product_modal', 10);
  useNativeBackHandler(Boolean(p) && showCheckout, () => setShowCheckout(false), 'katalog_checkout_view', 15);

  const unitPrice = selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : p.price;
  const subtotal = unitPrice * quantity;
  const hasDiscount = p.originalPrice > p.price;
  const discountPercent = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
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

  const suggestedProducts = products
    .filter(item => item.id !== p.id)
    .slice(0, 4);

  const galleryList: string[] = (Array.isArray(p.gallery) && p.gallery.length > 0) 
    ? p.gallery 
    : (p.image ? [p.image] : []);
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

  const modalContent = (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 100000, 
      display: 'flex', 
      alignItems: (isMobile || isDetailFullScreen) ? 'stretch' : 'center', 
      justifyContent: 'center', 
      padding: (isMobile || isDetailFullScreen) ? 0 : 20 
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'transparent' }} onClick={closeDetail} />
      
      <div style={{ 
        position: 'relative', 
        width: isDetailFullScreen ? '100vw' : '100%', 
        maxWidth: isDetailFullScreen ? '100vw' : 1080, 
        height: (isMobile || isDetailFullScreen) ? '100dvh' : '88vh', 
        maxHeight: (isMobile || isDetailFullScreen) ? '100dvh' : '90vh', 
        background: isDark ? '#0c0d14' : '#ffffff', 
        borderRadius: (isMobile || isDetailFullScreen) ? 0 : 28, 
        display: 'flex', 
        flexDirection: 'column', 
        boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)' : '0 25px 70px rgba(0,0,0,0.15)', 
        overflow: 'hidden', 
        border: (isMobile || isDetailFullScreen) ? 'none' : `1.5px solid ${cardBorder}`,
        animation: 'cmsPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 1
      }}>
        
        {/* Modal Top Header Bar */}
        <div style={{ 
          padding: isMobile ? '14px 16px' : (isDetailFullScreen ? '16px 36px' : '16px 24px'), 
          borderBottom: `1px solid ${cardBorder}`, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: cardBg, 
          zIndex: 10,
          flexShrink: 0
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            width: '100%', 
            maxWidth: isDetailFullScreen ? 1320 : '100%', 
            margin: '0 auto' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, paddingRight: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 100, background: `${accentColor}15`, fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>
                {p.category || 'Layanan'}
              </span>
              <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.name}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsDetailFullScreen(!isDetailFullScreen)}
                title={isDetailFullScreen ? "Kecilkan Mode" : "Perbesar Layar Penuh"}
                aria-label={isDetailFullScreen ? "Kecilkan" : "Perbesar"}
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
                {isDetailFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button 
                onClick={(e) => toggleWishlist(p.id, e)} 
                title={isFavorited ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                style={{ 
                  background: isFavorited ? 'rgba(239,68,68,0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), 
                  border: `1px solid ${isFavorited ? 'rgba(239,68,68,0.4)' : cardBorder}`, 
                  color: isFavorited ? '#ef4444' : subTextColor, 
                  cursor: 'pointer', 
                  width: 36,
                  height: 36,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
              >
                 <Heart size={16} fill={isFavorited ? "#ef4444" : "none"} />
              </button>
              <button 
                onClick={() => copyProductLink(p)} 
                title="Bagikan / Salin Tautan" 
                style={{ 
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                  border: `1px solid ${cardBorder}`, 
                  color: subTextColor, 
                  cursor: 'pointer', 
                  width: 36,
                  height: 36,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
              >
                 <Share2 size={16} />
              </button>
              <button 
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
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isMobile ? '16px 16px 24px' : (isDetailFullScreen ? '32px 40px 48px' : '24px 28px 36px'), 
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{
            maxWidth: isDetailFullScreen ? 1320 : '100%',
            margin: '0 auto',
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 20 : (isDetailFullScreen ? 44 : 32),
            alignItems: 'flex-start'
          }}>
            {/* Left Column: Gallery & Highlights (Sticky on desktop) */}
            <div style={{ 
              width: isMobile ? '100%' : (isDetailFullScreen ? 480 : 400), 
              flexShrink: 0,
              position: isMobile ? 'static' : 'sticky',
              top: 0
            }}>
              {/* Swipeable Carousel Display */}
              <div 
                style={{ 
                  width: '100%', 
                  aspectRatio: '4/3', 
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
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
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
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
                    >
                      <ChevronRight size={18} />
                    </button>

                    {/* Floating Indicator Dots */}
                    <div style={{
                      position: 'absolute',
                      bottom: 12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 100,
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(8px)',
                      zIndex: 5
                    }}>
                      {galleryList.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic.light();
                            setActiveImageIdx(i);
                          }}
                          style={{
                            width: i === safeIdx ? 18 : 6,
                            height: 6,
                            borderRadius: 100,
                            background: i === safeIdx ? '#ffffff' : 'rgba(255,255,255,0.4)',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        />
                      ))}
                    </div>

                    {/* Counter Pill */}
                    <div style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      padding: '3px 8px',
                      borderRadius: 100,
                      background: 'rgba(0,0,0,0.5)',
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

              {/* Trust Highlights */}
              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                  <Zap size={17} color={accentColor} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>Pengerjaan Cepat</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                  <ShieldCheck size={17} color="#10b981" />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>Jaminan Kualitas</span>
                </div>
              </div>
            </div>

            {/* Right Column: Product Info, Options & Pricing */}
            <div style={{ flex: isMobile ? 'initial' : '1 1 440px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 900, margin: '0 0 8px', lineHeight: 1.25, color: textColor, letterSpacing: '-0.4px' }}>
                  {p.name}
                </h2>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? 24 : 28, fontWeight: 900, color: accentColor }}>
                    {formatRp(unitPrice)}
                  </span>
                  {hasDiscount && (
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', textDecoration: 'line-through' }}>
                      {formatRp(p.originalPrice)}
                    </span>
                  )}
                </div>

                {(p.type === 'Digital' || p.isDigitalAsset || p.downloadUrl) && (
                  <div style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={16} color="#10b981" />
                      <div>
                        <span style={{ fontSize: 12.5, fontWeight: 850, color: '#10b981', display: 'block' }}>⚡ Instant Digital Delivery</span>
                        <span style={{ fontSize: 11, color: subTextColor }}>Siap diunduh langsung di portal /akun setelah pembayaran terverifikasi</span>
                      </div>
                    </div>
                    {(p.fileFormat || p.fileSize) && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: '#10b981', color: '#fff' }}>
                        {p.fileFormat || 'ZIP'} {p.fileSize ? `• ${p.fileSize}` : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: subTextColor, fontFamily: "'Outfit', sans-serif" }}>Jumlah:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 100, padding: '4px 10px', border: `1px solid ${cardBorder}` }}>
                  <button 
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
                          onClick={() => {
                            haptic.light();
                            setSelectedVariant(isSelected ? null : v);
                          }}
                          style={{ 
                            padding: '8px 18px', 
                            borderRadius: 100, 
                            border: `1.5px solid ${isSelected ? accentColor : cardBorder}`, 
                            background: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'),
                            color: isSelected ? '#ffffff' : textColor,
                            fontFamily: "'Outfit', sans-serif", 
                            fontSize: 13, 
                            fontWeight: isSelected ? 800 : 600, 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6, 
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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
                    placeholder="MASUKKAN KODE PROMO..."
                    style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 100, border: `1px solid ${cardBorder}`, background: isDark ? '#0c0d14' : '#ffffff', color: textColor, fontSize: 13, outline: 'none', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}
                  />
                  <button 
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

              {/* Description */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                  {shopSettings.txtProductDesc || 'Deskripsi Produk'}:
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, color: subTextColor, margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'Inter', sans-serif" }}>
                  {p.description || 'Tidak ada deskripsi tambahan untuk produk ini.'}
                </p>
              </div>
            </div>

            {/* ── REKOMENDASI PRODUK & LAYANAN LAINNYA ── */}
            {suggestedProducts.length > 0 && (
              <div style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${cardBorder}`, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} color={accentColor} />
                    <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: textColor }}>
                      Katalog & Layanan Terkait Lainnya
                    </h4>
                  </div>
                  <span style={{ fontSize: 11.5, color: subTextColor }}>Saran Pilihan</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 12
                }}>
                  {suggestedProducts.map(sItem => (
                    <div
                      key={sItem.id}
                      onClick={() => {
                        onSelectProduct(sItem);
                      }}
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
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = accentColor;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = cardBorder;
                      }}
                    >
                      <div style={{ width: '100%', aspectRatio: '1/1', background: isDark ? '#090a12' : '#f1f5f9', overflow: 'hidden' }}>
                        <img
                          src={sItem.gallery?.[0] || sItem.image || 'https://placehold.co/300x300?text=Produk'}
                          alt={sItem.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 9.5, fontWeight: 800, color: accentColor, textTransform: 'uppercase' }}>
                            {sItem.category || 'Layanan'}
                          </span>
                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12.5, fontWeight: 800, color: textColor, margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

        {/* Sticky / Dedicated Action Bar DOCKED at Modal Bottom */}
        <div style={{ 
          padding: isMobile ? '12px 16px' : (isDetailFullScreen ? '16px 36px' : '14px 28px'), 
          borderTop: `1px solid ${cardBorder}`, 
          background: cardBg, 
          flexShrink: 0,
          boxShadow: isDark ? '0 -8px 24px rgba(0,0,0,0.35)' : '0 -8px 24px rgba(0,0,0,0.06)',
          zIndex: 10
        }}>
          <div style={{
            maxWidth: isDetailFullScreen ? 1320 : '100%',
            margin: '0 auto',
            display: 'flex', 
            gap: 10, 
            alignItems: 'center'
          }}>
            <button 
              onClick={() => {
                addToCart(p, selectedVariant, quantity);
              }} 
              style={{ 
                flex: 1, 
                maxWidth: isDetailFullScreen ? 320 : 'none',
                height: 48, 
                borderRadius: 100, 
                border: `1.5px solid ${cardBorder}`, 
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                color: textColor, 
                fontSize: 13.5, 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8, 
                cursor: 'pointer', 
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
                e.currentTarget.style.color = textColor;
              }}
            >
              <ShoppingCart size={16} /> Keranjang
            </button>

            <button 
              onClick={() => {
                setCheckoutMode('direct');
                setShowCheckout(true);
              }} 
              style={{ 
                flex: isDetailFullScreen ? 1 : 1.3, 
                maxWidth: isDetailFullScreen ? 420 : 'none',
                height: 48, 
                borderRadius: 100, 
                border: 'none', 
                background: accentColor, 
                color: '#fff', 
                fontSize: 13.5, 
                fontWeight: 900, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8, 
                cursor: 'pointer', 
                fontFamily: "'Outfit', sans-serif",
                boxShadow: `0 6px 20px ${accentColor}40`,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Beli ({formatRp(finalPriceToPay)})
            </button>

            <button 
              onClick={() => handleAskProduct(finalPriceToPay)} 
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
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
            >
              <MessageCircle size={19} />
            </button>
          </div>
        </div>

        {/* Direct 1-Product Checkout Modal */}
        {showCheckout && checkoutMode === 'direct' && (
          <div style={{ position: 'fixed', inset: 0, background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: isMobile ? 0 : 20 }}>
            <div style={{ background: cardBg, width: '100%', maxWidth: 480, height: isMobile ? '100dvh' : 'auto', maxHeight: isMobile ? '100dvh' : '90vh', overflowY: 'auto', borderRadius: isMobile ? 0 : 28, padding: isMobile ? '24px 18px' : 32, position: 'relative', boxShadow: '0 30px 70px rgba(0,0,0,0.4)', border: `1.5px solid ${cardBorder}`, animation: 'cmsPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <button onClick={() => setShowCheckout(false)} style={{ position: 'absolute', top: 22, right: 22, background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
              
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, margin: '0 0 18px', color: textColor }}>
                {shopSettings.txtOrderForm || 'Form Pemesanan'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>Nama Lengkap *</label>
                  <input value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 14, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13.5, outline: 'none', fontFamily: "'Inter', sans-serif" }} placeholder="Cth: Budi Santoso" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>Nomor WhatsApp *</label>
                  <input value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 14, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13.5, outline: 'none', fontFamily: "'Inter', sans-serif" }} placeholder="Cth: 08123456789" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>Catatan Pesanan (Opsional)</label>
                  <textarea value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} style={{ width: '100%', height: 70, padding: '10px 14px', borderRadius: 14, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13.5, outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif" }} placeholder="Catatan tambahan untuk pesanan Anda..." />
                </div>

                {(() => {
                  const paymentList = (data?.shopSettings?.paymentMethods?.length > 0 ? data.shopSettings.paymentMethods : (shopSettings?.paymentMethods || []));
                  const qrisUrl = shopSettings?.qrisImageUrl || data?.shopSettings?.qrisImageUrl || '';
                  if (paymentList.length === 0 && !qrisUrl) return null;

                  return (
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>Metode Pembayaran *</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                                <img src={qrisUrl} alt="QRIS Toko" style={{ maxWidth: 200, width: '100%', height: 'auto', borderRadius: 8 }} />
                                <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
                                  Scan barcode QRIS di atas untuk membayar langsung tanpa biaya MDR.
                                </span>
                              </div>
                            )}
                          </label>
                        )}
                        {paymentList.map((pm: any) => (
                          <label key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, border: `1.5px solid ${checkoutForm.paymentMethodId === pm.id ? accentColor : cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name="paymentMethod" 
                              value={pm.id} 
                              checked={checkoutForm.paymentMethodId === pm.id} 
                              onChange={() => setCheckoutForm({...checkoutForm, paymentMethodId: pm.id})}
                              style={{ width: 16, height: 16, accentColor: accentColor }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>{pm.bankName} - {pm.accountNumber}</div>
                              <div style={{ fontSize: 11, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>A.n {pm.accountName}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Summary Card */}
                <div style={{ background: isDark ? '#090a12' : '#f9fafb', padding: 16, borderRadius: 18, border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>
                    <span>{p.name} ({quantity}x):</span>
                    <span>{formatRp(subtotal)}</span>
                  </div>
                  {voucherDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#10b981', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                      <span>Diskon Promo:</span>
                      <span>-{formatRp(voucherDiscountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#f59e0b', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                    <span>Kode Unik Verifikasi:</span>
                    <span>+{uniqueCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: `1px solid ${cardBorder}`, fontSize: 16, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                    <span>Total Tagihan:</span>
                    <span style={{ color: accentColor }}>{formatRp(finalPriceToPay + uniqueCode)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => submitOrder(finalPriceToPay + uniqueCode, [{ ...p, quantity, price: unitPrice, variantName: selectedVariant?.name || '' }], uniqueCode)} 
                  disabled={isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((data?.shopSettings?.paymentMethods?.length > 0 || shopSettings?.qrisImageUrl) && !checkoutForm.paymentMethodId)}
                  style={{ 
                    width: '100%', height: 50, borderRadius: 100, border: 'none', 
                    background: (isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((data?.shopSettings?.paymentMethods?.length > 0 || shopSettings?.qrisImageUrl) && !checkoutForm.paymentMethodId)) ? 'rgba(150,150,150,0.3)' : accentColor, 
                    color: '#fff', fontSize: 14.5, fontWeight: 800, 
                    cursor: (isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((data?.shopSettings?.paymentMethods?.length > 0 || shopSettings?.qrisImageUrl) && !checkoutForm.paymentMethodId)) ? 'not-allowed' : 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Outfit', sans-serif",
                    marginTop: 4,
                    boxShadow: `0 8px 24px ${accentColor}40`
                  }}>
                  {isSubmitting ? 'Memproses Pesanan...' : (
                    <>
                      <ShoppingCart size={17} /> Kirim Pesanan via WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
