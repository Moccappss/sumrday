import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap, X, Clock, Flame, ShoppingBag, ShoppingCart,
  ArrowRight, ShieldCheck, Check, Plus, Minus, Tag,
  ExternalLink, Sparkles, AlertCircle, Share2, CheckCircle2
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import { saveClientOrder, isServiceProduct } from '../../services/clientAuth';
import { googleSync } from '../../utils/googleSync';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

interface FlashSaleEventDetail {
  productId?: string;
  sticker?: any;
  product?: any;
}

export const FlashSaleProductModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [stickerData, setStickerData] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Close with native back button
  useNativeBackHandler(isOpen, () => setIsOpen(false), 'flash_sale_modal', 20);

  // Listen for custom trigger events across all pages
  useEffect(() => {
    const handleOpen = async (e: any) => {
      const detail: FlashSaleEventDetail = e?.detail || {};
      const pId = detail.productId || detail.sticker?.productId || detail.product?.id;

      let matchedProd: any = detail.product || null;

      if (pId) {
        try {
          const list = await storage.getItem('porto_catalog_products', []);
          if (Array.isArray(list)) {
            const found = list.find((p: any) => p.id === pId);
            if (found) matchedProd = found;
          }
        } catch (err) { }
      }

      // If product not in catalog yet, construct virtual product from sticker
      if (!matchedProd && detail.sticker) {
        matchedProd = {
          id: detail.sticker.productId || `fs-${Date.now()}`,
          name: detail.sticker.title || 'Flash Sale Item',
          price: detail.sticker.originalPrice || detail.sticker.salePrice || 100000,
          originalPrice: detail.sticker.originalPrice || 100000,
          image: detail.sticker.imageUrl || '',
          gallery: detail.sticker.imageUrl ? [detail.sticker.imageUrl] : [],
          category: 'Flash Sale',
          description: 'Penawaran eksklusif flash sale dengan diskon terbatas waktu.',
          flashSale: {
            isActive: true,
            title: detail.sticker.title,
            salePrice: detail.sticker.salePrice,
            originalPrice: detail.sticker.originalPrice,
            discountPercent: detail.sticker.discountPercent,
            endTime: detail.sticker.endTime,
            stockLeft: detail.sticker.stockLeft
          }
        };
      }

      if (matchedProd) {
        setTargetProduct(matchedProd);
        setStickerData(detail.sticker || matchedProd.flashSale || null);
        setSelectedVariant(matchedProd.variants?.[0] || null);
        setQuantity(1);
        setActiveImageIdx(0);
        setIsOpen(true);
        haptic.medium();
      }
    };

    window.addEventListener('porto_open_flash_sale_modal', handleOpen);
    window.addEventListener('porto_open_product_modal', handleOpen);

    if ((window as any).__pendingFlashSaleEvent) {
      const pending = (window as any).__pendingFlashSaleEvent;
      delete (window as any).__pendingFlashSaleEvent;
      handleOpen(pending);
    }

    return () => {
      window.removeEventListener('porto_open_flash_sale_modal', handleOpen);
      window.removeEventListener('porto_open_product_modal', handleOpen);
    };
  }, []);

  // Effective Pricing Calculation (Guaranteed Synchronized with Shop & Sticker)
  const priceInfo = useMemo(() => {
    if (!targetProduct) return null;

    const p = targetProduct;
    const fs = p.flashSale || stickerData || {};
    const isFlashSaleActive = Boolean(
      (fs.isActive !== false) &&
      (fs.salePrice > 0 || fs.discountPercent > 0) &&
      (!fs.endTime || new Date(fs.endTime).getTime() > Date.now())
    );

    const originalPrice = Number(fs.originalPrice || p.originalPrice || p.price || 0);
    const salePrice = isFlashSaleActive && Number(fs.salePrice) > 0
      ? Number(fs.salePrice)
      : (isFlashSaleActive && fs.discountPercent
        ? Math.round(originalPrice * (1 - fs.discountPercent / 100))
        : Number(p.price || 0));

    const discountPercent = fs.discountPercent
      || (originalPrice > salePrice && originalPrice > 0
        ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
        : 0);

    const unitPrice = selectedVariant && Number(selectedVariant.price) > 0
      ? Number(selectedVariant.price)
      : salePrice;

    const subtotal = unitPrice * quantity;
    const savings = Math.max(0, (originalPrice * quantity) - subtotal);

    return {
      isFlashSaleActive,
      originalPrice,
      salePrice,
      discountPercent,
      unitPrice,
      subtotal,
      savings,
      endTime: fs.endTime,
      stockLeft: fs.stockLeft !== undefined ? fs.stockLeft : 10,
      title: fs.title || p.name
    };
  }, [targetProduct, stickerData, selectedVariant, quantity]);

  // Realtime Countdown Timer
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (!priceInfo?.endTime) return;

    const calcTime = () => {
      const diff = new Date(priceInfo.endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [priceInfo?.endTime]);

  if (!isOpen || !targetProduct || !priceInfo) return null;

  const gallery: string[] = Array.isArray(targetProduct.gallery) && targetProduct.gallery.length > 0
    ? targetProduct.gallery
    : (targetProduct.image ? [targetProduct.image] : []);

  // Handler: Add to Cart with Accurate Flash Sale Price
  const handleAddToCart = () => {
    haptic.medium();
    const cartItemId = `${targetProduct.id}_${selectedVariant?.id || 'flash'}`;
    const rawCart = localStorage.getItem('porto_client_cart');
    let currentCart: any[] = [];
    try {
      currentCart = rawCart ? JSON.parse(rawCart) : [];
    } catch { }

    const existingIdx = currentCart.findIndex(item => item.id === cartItemId);
    const cartItemData = {
      id: cartItemId,
      productId: targetProduct.id,
      name: targetProduct.name,
      image: gallery[0] || '',
      price: priceInfo.unitPrice, // ACCURATE FLASH SALE DISCOUNT PRICE
      originalPrice: priceInfo.originalPrice,
      variantId: selectedVariant?.id || null,
      variantName: selectedVariant?.name || null,
      quantity: quantity,
      category: targetProduct.category,
      isService: isServiceProduct(targetProduct),
      serviceDpAllowed: targetProduct.serviceDpAllowed,
      isPreOrder: Boolean(targetProduct.isPreOrder || targetProduct.category?.toLowerCase().includes('pre-order')),
      preOrderBatch: targetProduct.preOrderBatch || '',
      preOrderEstimate: targetProduct.preOrderEstimate || '',
      preOrderDpAllowed: targetProduct.preOrderDpAllowed,
      isFlashSale: true
    };

    if (existingIdx > -1) {
      currentCart[existingIdx].quantity += quantity;
      currentCart[existingIdx].price = priceInfo.unitPrice; // refresh price
    } else {
      currentCart.unshift(cartItemData);
    }

    localStorage.setItem('porto_client_cart', JSON.stringify(currentCart));
    window.dispatchEvent(new CustomEvent('porto_open_cart'));

    // Toast via custom event
    window.dispatchEvent(new CustomEvent('porto_toast', {
      detail: {
        title: 'Berhasil Masuk Keranjang',
        message: `${targetProduct.name} (${quantity}x) tersimpan dengan harga Flash Sale!`,
        type: 'success'
      }
    }));

    setIsOpen(false);
  };

  // Handler: Buy Now (Direct Flash Sale WhatsApp Order & Save Transaction)
  const handleBuyNow = async () => {
    haptic.heavy();
    setIsProcessingOrder(true);

    try {
      // 1. Get business WhatsApp from storage or settings
      const settings = await storage.getItem('porto_settings', {});
      const mainWeb = await storage.getItem('porto_main_website', {});
      const targetPhone = settings.shopSettings?.whatsapp || mainWeb.footer?.phone || '6281234567890';
      const cleanPhone = String(targetPhone).replace(/\D/g, '');

      // 2. Save client transaction
      const clientRaw = localStorage.getItem('porto_current_client');
      const client = clientRaw ? JSON.parse(clientRaw) : null;

      try {
        await saveClientOrder({
          clientId: client?.id || 'guest',
          clientName: client?.name || 'Pelanggan Flash Sale',
          clientPhone: client?.phone || '',
          clientEmail: client?.email || '',
          productName: `${targetProduct.name} [FLASH SALE]`,
          productId: targetProduct.id,
          variantName: selectedVariant?.name || undefined,
          price: priceInfo.unitPrice,
          quantity: quantity,
          total: priceInfo.subtotal,
          status: 'Pending',
          notes: `Promo Flash Sale (Hemat ${priceInfo.discountPercent}% dari ${formatRp(priceInfo.originalPrice)})`
        });
      } catch (e) {
        console.warn('Failed saving local order log:', e);
      }

      // 2b. Auto-record into transactions & customers
      try {
        const trxId = `FS-${Date.now().toString(36).toUpperCase()}`;
        const cusId = client?.id || `CUS-${Date.now()}`;
        const buyerName = client?.name || 'Pelanggan Flash Sale';
        const buyerPhone = client?.phone || '';
        const buyerEmail = client?.email || '';

        const newTrx = {
          id: trxId,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
          customer: {
            id: cusId,
            name: buyerName,
            phone: buyerPhone,
            email: buyerEmail,
            address: '-'
          },
          items: [
            {
              id: targetProduct.id,
              name: `${targetProduct.name}${selectedVariant ? ` (${selectedVariant.name})` : ''} [FLASH SALE]`,
              price: priceInfo.unitPrice,
              qty: quantity,
              isFlashSale: true
            }
          ],
          subtotal: priceInfo.originalPrice * quantity,
          discount: {
            type: 'percent',
            value: priceInfo.discountPercent,
            label: `Flash Sale (-${priceInfo.discountPercent}%)`
          },
          grandTotal: priceInfo.subtotal,
          paymentStatus: 'belum',
          source: 'flash_sale_web',
          notes: `Klaim Flash Sale Web (Hemat ${priceInfo.discountPercent}%)`
        };

        const existingTrx = await storage.getItem<any[]>('porto_transactions', []);
        await storage.setItem('porto_transactions', [newTrx, ...existingTrx], true);

        // Background Google Sheets sync to "Transaksi & Pesanan"
        googleSync.syncTransactions([newTrx, ...existingTrx], null).catch((err: any) =>
          console.warn('[FlashSaleModal] Background Sheets sync warning:', err)
        );

        // Deduct product stock & increment flash sale sold counter
        try {
          const catProducts = await storage.getItem<any[]>('porto_catalog_products', []);
          const catList = await storage.getItem<any[]>('porto_catalog', []);
          let stockChanged = false;

          const deductFS = (list: any[]) => {
            return (list || []).map(p => {
              if (p.id === targetProduct.id || (p.name && targetProduct.name && p.name.trim().toLowerCase() === targetProduct.name.trim().toLowerCase())) {
                let updated = { ...p };
                if (typeof p.stock === 'number') {
                  stockChanged = true;
                  updated.stock = Math.max(0, p.stock - quantity);
                }
                if (p.flashSale) {
                  updated.flashSale = {
                    ...p.flashSale,
                    sold: (Number(p.flashSale.sold) || 0) + quantity,
                    stockLeft: typeof p.flashSale.stockLeft === 'number' ? Math.max(0, p.flashSale.stockLeft - quantity) : p.flashSale.stockLeft
                  };
                  stockChanged = true;
                }
                return updated;
              }
              return p;
            });
          };

          if (catProducts && catProducts.length > 0) {
            await storage.setItem('porto_catalog_products', deductFS(catProducts));
          }
          if (catList && catList.length > 0) {
            await storage.setItem('porto_catalog', deductFS(catList));
          }
          if (stockChanged) {
            window.dispatchEvent(new CustomEvent('porto_catalog_products_updated'));
            window.dispatchEvent(new CustomEvent('porto_catalog_updated'));
          }
        } catch (eStock) {
          console.warn('[FlashSaleModal] Stock deduction error:', eStock);
        }

        if (buyerPhone) {
          const existingCus = await storage.getItem<any[]>('porto_trx_customers', []);
          if (!existingCus.some((c: any) => c.phone === buyerPhone)) {
            await storage.setItem('porto_trx_customers', [newTrx.customer, ...existingCus], true);
            window.dispatchEvent(new CustomEvent('porto_trx_customers_updated'));
          }
        }
        window.dispatchEvent(new CustomEvent('porto_transactions_updated'));
      } catch (errTrx) {
        console.warn('Failed auto-syncing flash sale to transactions:', errTrx);
      }

      // 3. Format WhatsApp checkout message
      const msg = [
        `⚡ *KLAIM FLASH SALE SPESIAL* ⚡`,
        `Halo Admin sumr.day, saya ingin segera mengamankan promo Flash Sale berikut:`,
        ``,
        `📦 *Produk:* ${targetProduct.name}`,
        selectedVariant ? `🏷️ *Pilihan/Varian:* ${selectedVariant.name}` : null,
        `🔢 *Jumlah:* ${quantity} unit`,
        `💰 *Harga Flash Sale:* ${formatRp(priceInfo.unitPrice)} *(Diskon ${priceInfo.discountPercent}%)*`,
        `🔖 *Harga Normal:* ~${formatRp(priceInfo.originalPrice)}~`,
        `💵 *Total Pembayaran:* *${formatRp(priceInfo.subtotal)}*`,
        `🎉 *Total Hemat:* ${formatRp(priceInfo.savings)}`,
        ``,
        `Mohon info instruksi pembayaran & pengiriman aset/produk sekarang. Terima kasih!`
      ].filter(Boolean).join('\n');

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="sumr-modal-backdrop"
      style={{
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="sumr-modal-sheet"
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '92vh',
          background: '#151824',
          borderRadius: 24,
          border: '1px solid rgba(239, 68, 68, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          overflowY: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc',
          fontFamily: "'Inter', sans-serif",
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Drag/Sheet Handle */}
        <div className="sumr-sheet-handle" style={{ background: 'rgba(239, 68, 68, 0.4)' }} />

        {/* ── Top Flash Sale Glowing Bar ── */}
        <div style={{
          background: 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ef4444 100%)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)'
            }}>
              <Zap size={14} fill="#fff" />
            </span>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {priceInfo.title || 'FLASH SALE SPESIAL'}
            </span>
          </div>

          {/* Countdown timer in bar */}
          {priceInfo.endTime && !timeLeft.isExpired && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'monospace',
              fontWeight: 900,
              fontSize: 12,
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '3px 8px',
              borderRadius: 8
            }}>
              <Clock size={12} />
              <span>{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: 'none',
              color: '#ffffff',
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 22px 24px' }}>
          {/* ── Product Media & Main Showcase ── */}
          <div style={{
            position: 'relative',
            borderRadius: 20,
            overflow: 'hidden',
            background: '#16192b',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 18
          }}>
            {gallery.length > 0 ? (
              <img
                src={gallery[activeImageIdx] || gallery[0]}
                alt={targetProduct.name}
                style={{
                  width: '100%',
                  height: 240,
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}>
                <ShoppingBag size={54} />
              </div>
            )}

            {/* Discount Badge Floating */}
            {priceInfo.discountPercent > 0 && (
              <div style={{
                position: 'absolute',
                top: 12,
                left: 12,
                padding: '5px 12px',
                borderRadius: 100,
                background: '#ef4444',
                color: '#fff',
                fontSize: 12,
                fontWeight: 900,
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Flame size={14} fill="#fff" />
                <span>DISKON {priceInfo.discountPercent}%</span>
              </div>
            )}

            {/* Quota warning */}
            {priceInfo.stockLeft !== undefined && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                padding: '6px 14px',
                borderRadius: 10,
                background: 'rgba(12, 14, 26, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11.5,
                fontWeight: 750,
                color: '#f59e0b'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sparkles size={13} />
                  <span>Kuota Promo Terbatas</span>
                </span>
                <span>Tersisa {priceInfo.stockLeft} Slot</span>
              </div>
            )}
          </div>

          {/* ── Product Title & Category ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 100,
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              fontSize: 11,
              fontWeight: 800,
              marginBottom: 8,
              textTransform: 'uppercase'
            }}>
              <Tag size={11} />
              <span>{targetProduct.category || 'Promo Toko'}</span>
            </div>
            <h2 style={{
              margin: '0 0 6px',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.25
            }}>
              {targetProduct.name}
            </h2>
            <p style={{
              margin: 0,
              fontSize: 13,
              color: '#94a3b8',
              lineHeight: 1.5
            }}>
              {targetProduct.description || 'Dapatkan potongan harga resmi Flash Sale untuk produk digital & paket layanan terpilih.'}
            </p>
          </div>

          {/* ── Price Block: Live Comparison ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(245, 158, 11, 0.08) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 18,
            padding: '16px 18px',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11.5, color: '#fca5a5', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase' }}>
                  Harga Promo Flash Sale
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 28,
                    fontWeight: 950,
                    color: '#ef4444',
                    letterSpacing: '-0.02em'
                  }}>
                    {formatRp(priceInfo.unitPrice)}
                  </span>
                  {priceInfo.originalPrice > priceInfo.unitPrice && (
                    <span style={{
                      fontSize: 14,
                      color: '#64748b',
                      textDecoration: 'line-through',
                      fontWeight: 650
                    }}>
                      {formatRp(priceInfo.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {priceInfo.savings > 0 && (
                <div style={{
                  padding: '5px 12px',
                  borderRadius: 100,
                  background: 'rgba(16, 185, 129, 0.18)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: 12,
                  fontWeight: 850
                }}>
                  Hemat {formatRp(priceInfo.savings)}
                </div>
              )}
            </div>

            {/* Countdown bar inside box */}
            {priceInfo.endTime && !timeLeft.isExpired && (
              <div style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px dashed rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12
              }}>
                <span style={{ color: '#94a3b8', fontWeight: 650 }}>
                  Promo berakhir dalam:
                </span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontWeight: 900, color: '#ef4444' }}>
                  <span style={{ padding: '2px 6px', borderRadius: 6, background: '#ef4444', color: '#fff' }}>{pad(timeLeft.hours)}j</span>:
                  <span style={{ padding: '2px 6px', borderRadius: 6, background: '#ef4444', color: '#fff' }}>{pad(timeLeft.minutes)}m</span>:
                  <span style={{ padding: '2px 6px', borderRadius: 6, background: '#ef4444', color: '#fff' }}>{pad(timeLeft.seconds)}d</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Variants Selector (if applicable) ── */}
          {Array.isArray(targetProduct.variants) && targetProduct.variants.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>
                Pilih Varian
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {targetProduct.variants.map((v: any) => {
                  const isSel = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 12,
                        background: isSel ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSel ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSel ? '#ffffff' : '#94a3b8',
                        fontSize: 12.5,
                        fontWeight: isSel ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {v.name} {v.price ? `(${formatRp(v.price)})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Quantity Selector & Subtotal ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            marginBottom: 22
          }}>
            <div style={{ fontSize: 13, fontWeight: 750, color: '#cbd5e1' }}>
              Jumlah Pesanan
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#16192b',
                padding: '4px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Minus size={13} />
                </button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 850, fontSize: 14 }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} />
                </button>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Subtotal
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
                  {formatRp(priceInfo.subtotal)}
                </div>
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isProcessingOrder}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444 0%, #ea580c 100%)',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <Zap size={18} fill="#fff" />
              <span>{isProcessingOrder ? 'Menyiapkan Pesanan...' : 'Beli Sekarang (Klaim Flash Sale)'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={handleAddToCart}
                style={{
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
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
                <ShoppingCart size={15} />
                <span>+ Keranjang</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = `/katalog/p/${targetProduct.id}`;
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94a3b8',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>Detail di Shop</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleProductModal;
