import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ShoppingCart, ArrowLeft, Trash2, Plus, Minus, Check, Ticket, 
  Sparkles, MessageCircle, Send, Clock, ShieldCheck, Download, 
  RefreshCw, Layers, CheckCircle2, ChevronRight, Store, ArrowRight, 
  ExternalLink, Package, Zap, ChevronDown, ChevronUp, UserCheck, Search, FileText,
  Briefcase, CreditCard, Copy, Upload
} from 'lucide-react';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useClientAuth } from '../context/ClientAuthContext';
import { useToast } from '../context/ToastContext';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { storage } from '../utils/storage';
import { haptic } from '../utils/haptics';
import { enqueueOutbox } from '../utils/syncQueue';
import { 
  ClientOrder, 
  getClientOrders, 
  lookupClientOrder, 
  saveClientOrder, 
  isServiceProduct,
  creditAffiliateReferral 
} from '../services/clientAuth';
import { googleSync } from '../utils/googleSync';
import { ServiceOrderBriefSection, ServiceBriefData } from '../components/katalog/ServiceOrderBriefSection';
import { createOrUpdateServiceOrder } from '../utils/serviceOrderSync';

interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  category?: string;
  type?: string;
  image?: string;
  gallery?: string[];
  variantName?: string;
  downloadUrl?: string;
  fileFormat?: string;
  fileSize?: string;
  instantDeliveryMessage?: string;
  isDigitalAsset?: boolean;
  accessModel?: 'lifetime' | 'limited';
  durationDays?: number;
  isPreOrder?: boolean;
  preOrderBatch?: string;
  preOrderEstimate?: string;
  preOrderDpAllowed?: boolean;
  serviceDpAllowed?: boolean;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const MILESTONE_STEPS = [
  { step: 1, label: 'Order & Brief Diterima', sublabel: 'Data pesanan masuk ke antrean studio', icon: FileText },
  { step: 2, label: 'Verifikasi Pembayaran', sublabel: 'Konfirmasi DP / pelunasan transaksi', icon: ShieldCheck },
  { step: 3, label: 'Pengerjaan Warm Tech', sublabel: 'Proses desain, layout & koding interaktif', icon: Layers },
  { step: 4, label: 'Review & QA Internal', sublabel: 'Pengujian kualitas & penyesuaian detail', icon: Sparkles },
  { step: 5, label: 'Serah Terima & Selesai', sublabel: 'Aset siap unduh / tautan web resmi live', icon: CheckCircle2 }
];

const PREORDER_MILESTONE_STEPS = [
  { step: 1, label: 'Slot PO Terdaftar & DP Masuk', sublabel: 'Data pesanan merch & slot kuota terkunci', icon: FileText },
  { step: 2, label: 'Batch PO Ditutup & Verifikasi', sublabel: 'Verifikasi jumlah kuota dan pesanan bahan', icon: ShieldCheck },
  { step: 3, label: 'Proses Produksi Merch', sublabel: 'Pabrikasi / konveksi / pencetakan merchandise', icon: Layers },
  { step: 4, label: 'Quality Check & Packing', sublabel: 'Inspeksi mutu merch & pengemasan pesanan', icon: Sparkles },
  { step: 5, label: 'Pengiriman ke Alamat Pemesan', sublabel: 'Resi terbit & paket siap diterima', icon: CheckCircle2 }
];

export default function CartCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useWebsiteTheme();
  const { client, openAuthModal } = useClientAuth();
  const { showToast } = useToast();

  useLandingBodyFix();

  // Active Tab: 'cart' or 'history'
  const [activeTab, setActiveTab] = useState<'cart' | 'history'>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'history' || params.get('tab') === 'riwayat' ? 'history' : 'cart';
  });

  // ── CART STATE ──
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('porto_client_cart');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && typeof item === 'object' && item.name && typeof item.price === 'number');
      }
      return [];
    } catch {
      return [];
    }
  });

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('porto_client_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Unique 3-digit Verification Code
  const [uniqueCode, setUniqueCode] = useState(() => Math.floor(Math.random() * 899) + 100);

  // Responsive state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync body class for mobile sticky checkout bar bottom clearance
  useEffect(() => {
    const shouldShow = activeTab === 'cart' && cart.length > 0;
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('has-sticky-checkout', shouldShow);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('has-sticky-checkout');
      }
    };
  }, [activeTab, cart.length]);

  // Differentiated Payment Scheme for Services: 'dp' (50% kick-off) or 'full' (100% upfront)
  const [paymentScheme, setPaymentScheme] = useState<'dp' | 'full'>('dp');

  // Service Brief State (Brief link/text, deadline, add-ons)
  const [serviceBriefData, setServiceBriefData] = useState<ServiceBriefData | null>(null);

  // Checkout Form (Always starts clean and fresh from scratch)
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethodId: ''
  });

  // Shop & Business Settings
  const [shopSettings, setShopSettings] = useState<any>({ paymentMethods: [] });
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  // Voucher Promo State
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherMessage, setVoucherMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  // ── ORDER HISTORY & TRACKING STATE ──
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<ClientOrder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load Settings & Orders on mount
  useEffect(() => {
    Promise.all([
      storage.getItem('porto_shop_settings', null),
      storage.getItem('porto_business_profile', null),
      storage.getItem('porto_settings', null)
    ]).then(([sSettings, bProfile, gSettings]) => {
      if (sSettings) setShopSettings(sSettings);
      else if (gSettings?.shopSettings) setShopSettings(gSettings.shopSettings);
      if (bProfile) setBusinessProfile(bProfile);
    });
  }, []);

  // Update form if client logs in
  useEffect(() => {
    if (client) {
      setCheckoutForm(prev => ({
        ...prev,
        name: prev.name || client.name,
        phone: prev.phone || client.phone || '',
        email: prev.email || client.email
      }));
    }
  }, [client]);

  // Load Client Orders
  const refreshOrders = async () => {
    if (client) {
      setLoadingOrders(true);
      try {
        const res = await getClientOrders(client.id);
        setOrders(res);
        if (res.length > 0 && !expandedOrderId) setExpandedOrderId(res[0].id);
      } catch (err) {
        console.warn('Load orders error:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
  };

  useEffect(() => {
    refreshOrders();
  }, [client]);

  // Handle Guest Lookup
  const handlePerformLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = searchQuery.trim();
    if (!term) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const found = await lookupClientOrder(term);
      setLookupResults(found);
      if (found.length > 0) setExpandedOrderId(found[0].id);
    } catch {
      setLookupResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Check if any product in cart is a Service (Jasa) or Pre-Order Merch
  const hasServiceInCart = cart.some(item => isServiceProduct(item));
  const hasPreOrderInCart = cart.some(item => item.isPreOrder || item.category?.toLowerCase().includes('pre-order'));

  // Owner payment policy per item: Jasa (serviceDpAllowed !== false) and PO (preOrderDpAllowed !== false)
  const isItemDpEligible = (i: CartItem) => {
    if (isServiceProduct(i)) {
      return i.serviceDpAllowed !== false;
    }
    if (i.isPreOrder || i.category?.toLowerCase().includes('pre-order')) {
      return i.preOrderDpAllowed !== false;
    }
    return false;
  };

  const dpEligibleItems = cart.filter(isItemDpEligible);
  const lunasOnlyItems = cart.filter(i => !isItemDpEligible(i));
  const isDpEligible = dpEligibleItems.length > 0;
  const allServices = cart.length > 0 && cart.every(item => isServiceProduct(item));

  // Portion subtotals
  const dpEligibleSubtotal = dpEligibleItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const outrightSubtotal = lunasOnlyItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  // Auto fallback to 'full' if no items in cart are DP-eligible
  useEffect(() => {
    if (!isDpEligible && paymentScheme === 'dp') {
      setPaymentScheme('full');
    }
  }, [isDpEligible, paymentScheme]);

  // Reseller Tier Auto-Discount
  const isResellerMember = client?.membershipTier === 'reseller' || client?.membershipTier === 'vip';
  const resellerDiscountRate = isResellerMember ? (client?.resellerDiscountRate || 15) : 0;
  const resellerDiscountAmount = isResellerMember ? Math.round(cartSubtotal * (resellerDiscountRate / 100)) : 0;
  const activeReferralCode = typeof window !== 'undefined' ? (localStorage.getItem('porto_referral_code') || '') : '';

  // Service Addons Total
  const serviceAddonsTotal = hasServiceInCart ? (serviceBriefData?.addonsTotal || 0) : 0;
  const overallCartSubtotal = cartSubtotal + serviceAddonsTotal;

  // Voucher discount
  let voucherDiscountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'percent') {
      voucherDiscountAmount = overallCartSubtotal * (appliedVoucher.discountValue / 100);
    } else {
      voucherDiscountAmount = appliedVoucher.discountValue;
    }
  }
  const totalAllDiscounts = voucherDiscountAmount + resellerDiscountAmount;
  const effectiveCartTotal = Math.max(0, overallCartSubtotal - totalAllDiscounts);

  // Calculated amounts based on DP scheme
  const effectiveDpSubtotal = dpEligibleSubtotal + serviceAddonsTotal;
  const dpAmount = isDpEligible && paymentScheme === 'dp' 
    ? Math.round(effectiveDpSubtotal * 0.5) 
    : 0;
  const remainingAmount = isDpEligible && paymentScheme === 'dp'
    ? (effectiveDpSubtotal - dpAmount)
    : 0;

  // Amount client transfers right now
  const baseTransferNow = isDpEligible && paymentScheme === 'dp'
    ? (dpAmount + outrightSubtotal - totalAllDiscounts)
    : effectiveCartTotal;
  const totalTransferNow = Math.max(0, baseTransferNow) + uniqueCode;

  // Cart Stepper Handlers
  const handleUpdateQty = (id: string, delta: number) => {
    haptic.light();
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    haptic.warning();
    setCart(prev => prev.filter(item => item.id !== id));
    showToast('Item Dihapus', 'Item telah dihapus dari keranjang belanja.', 'info');
  };

  // Apply Voucher
  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    try {
      const vouchers = await storage.getItem('porto_catalog_vouchers', []);
      const found = vouchers.find((v: any) => v.code.toUpperCase() === voucherInput.trim().toUpperCase() && v.isActive);
      if (found) {
        setAppliedVoucher(found);
        setVoucherMessage({ type: 'success', text: `Voucher "${found.code}" berhasil digunakan!` });
        haptic.success();
      } else {
        setVoucherMessage({ type: 'error', text: 'Kode promo tidak valid atau telah kedaluwarsa.' });
        haptic.error();
      }
    } catch {
      setVoucherMessage({ type: 'error', text: 'Gagal memverifikasi voucher.' });
    }
  };

  // Submit Order via WhatsApp & Save Transaction
  const handleSubmitOrder = async () => {
    if (isSubmittingRef.current || isSubmitting) return;

    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim()) {
      showToast('Data Belum Lengkap', 'Mohon isi Nama Lengkap dan Nomor WhatsApp.', 'error');
      haptic.error();
      return;
    }
    const paymentList = (shopSettings?.paymentMethods?.length > 0 ? shopSettings.paymentMethods : (businessProfile?.bankAccounts || []));
    const qrisUrl = shopSettings?.qrisImageUrl || businessProfile?.qris?.imageUrl || '';
    if ((paymentList.length > 0 || qrisUrl) && !checkoutForm.paymentMethodId) {
      showToast('Pilih Pembayaran', 'Mohon pilih salah satu metode transfer pembayaran.', 'warning');
      haptic.warning();
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      // Pre-checkout inventory stock verification
      try {
        const catProducts = await storage.getItem<any[]>('porto_catalog_products', []);
        if (Array.isArray(catProducts) && catProducts.length > 0) {
          for (const itm of cart) {
            if (!isServiceProduct(itm)) {
              const pMatch = catProducts.find(p => p.id === (itm.productId || itm.id) || (p.name && itm.name && p.name.trim().toLowerCase() === itm.name.trim().toLowerCase()));
              if (pMatch && typeof pMatch.stock === 'number') {
                if (pMatch.stock <= 0) {
                  showToast('Stok Habis', `Produk "${itm.name}" saat ini sedang habis. Silakan hubungi admin via WhatsApp.`, 'error');
                  haptic.error();
                  isSubmittingRef.current = false;
                  setIsSubmitting(false);
                  return;
                }
                if (itm.quantity > pMatch.stock) {
                  showToast('Stok Tidak Cukup', `Jumlah produk "${itm.name}" melebihi stok yang tersedia (Sisa ${pMatch.stock} unit).`, 'warning');
                  haptic.warning();
                  isSubmittingRef.current = false;
                  setIsSubmitting(false);
                  return;
                }
              }
            }
          }
        }
      } catch (_) {}

      const trxId = `TRX-${Date.now().toString().slice(-6)}`;
      const isDp = isDpEligible && paymentScheme === 'dp';
      const orderTypeVal = hasPreOrderInCart ? 'preorder' : (hasServiceInCart ? 'jasa' : 'beli_putus');
      const poBatch = cart.find(i => i.preOrderBatch)?.preOrderBatch || 'BATCH 1';
      const poEstimate = cart.find(i => i.preOrderEstimate)?.preOrderEstimate || '';

      const terminList = isDp ? [
        { 
          id: 'dp', 
          name: hasPreOrderInCart ? 'DP 50% Booking Pre-Order' : 'DP 50% Kick-off Proyek', 
          amount: dpAmount, 
          isPaid: false 
        },
        { 
          id: 'pelunasan', 
          name: hasPreOrderInCart ? 'Pelunasan 50% Saat Merch Siap Kirim' : 'Pelunasan 50% Serah Terima Final', 
          amount: remainingAmount, 
          isPaid: false 
        }
      ] : [];

      const newTrx = {
        id: trxId,
        uniqueCode,
        date: new Date().toISOString().slice(0, 10),
        orderType: orderTypeVal,
        preOrderBatch: hasPreOrderInCart ? poBatch : undefined,
        preOrderEstimate: hasPreOrderInCart ? poEstimate : undefined,
        paymentScheme: isDp ? 'dp' : 'full',
        dpAmount: isDp ? dpAmount : 0,
        remainingAmount: isDp ? remainingAmount : 0,
        customer: {
          id: client?.id || `CUS-${Date.now()}`,
          name: checkoutForm.name,
          phone: checkoutForm.phone,
          email: checkoutForm.email || '-',
          address: checkoutForm.address || '-'
        },
        items: cart.map(item => ({
          id: item.productId || item.id,
          name: item.name + (item.variantName ? ` (${item.variantName})` : ''),
          price: item.price,
          qty: item.quantity,
          image: item.image || item.gallery?.[0] || '',
          downloadUrl: item.downloadUrl || '',
          fileFormat: item.fileFormat || 'ZIP',
          fileSize: item.fileSize || '',
          instantDeliveryMessage: item.instantDeliveryMessage || '',
          isDigitalAsset: item.isDigitalAsset || item.type === 'Digital' || !!item.downloadUrl,
          isService: isServiceProduct(item),
          isPreOrder: Boolean(item.isPreOrder || item.category?.toLowerCase().includes('pre-order')),
          preOrderBatch: item.preOrderBatch || '',
          preOrderEstimate: item.preOrderEstimate || ''
        })),
        discount: appliedVoucher ? {
          type: appliedVoucher.discountType,
          value: appliedVoucher.discountValue,
          label: appliedVoucher.code
        } : { type: 'percent', value: 0, label: '' },
        resellerDiscount: resellerDiscountAmount > 0 ? {
          rate: resellerDiscountRate,
          amount: resellerDiscountAmount
        } : undefined,
        clientTier: client?.membershipTier || 'regular',
        referralCode: activeReferralCode || undefined,
        paymentStatus: isDp ? 'dp' : 'belum',
        milestoneStep: isDp ? 2 : 1,
        notes: (hasServiceInCart && (serviceBriefData?.notes || (serviceBriefData as any)?.briefDescription)) 
          ? (serviceBriefData?.notes || (serviceBriefData as any)?.briefDescription) 
          : (checkoutForm.address || '-'),
        briefMode: hasServiceInCart ? serviceBriefData?.briefMode : undefined,
        googleDocUrl: hasServiceInCart ? serviceBriefData?.googleDocUrl : undefined,
        deadline: hasServiceInCart ? (serviceBriefData?.deadline || (serviceBriefData as any)?.effectiveDeadline) : undefined,
        addons: hasServiceInCart ? (serviceBriefData?.addonsList || (serviceBriefData as any)?.selectedAddons) : undefined,
        addonsTotal: hasServiceInCart ? serviceBriefData?.addonsTotal : undefined,
        termin: terminList,
        paymentMethod: checkoutForm.paymentMethodId === 'qris_toko'
          ? { id: 'qris_toko', bankName: 'QRIS Instan', accountNumber: 'Scan Barcode QRIS', accountName: shopSettings?.qrisMerchantName || 'Merchant QRIS' }
          : (checkoutForm.paymentMethodId ? paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId) : null),
        grandTotal: isDp ? totalTransferNow : (effectiveCartTotal + uniqueCode),
        source: 'website'
      };

      // 1. Save to transactions
      const existingTrx = await storage.getItem('porto_transactions', []);
      await storage.setItem('porto_transactions', [newTrx, ...existingTrx]);

      // If offline, enqueue transaction to background sync queue
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await enqueueOutbox('submit_order', newTrx);
      }

      // 1a. Background Google Sheets sync to "Transaksi & Pesanan"
      googleSync.syncTransactions([newTrx, ...existingTrx], null).catch((err: any) => 
        console.warn('[CartCheckout] Background Sheets sync warning:', err)
      );

      // 1b. Auto-deduct inventory stock & update pre-order/flash-sale quotas
      try {
        const catProducts = await storage.getItem<any[]>('porto_catalog_products', []);
        const catList = await storage.getItem<any[]>('porto_catalog', []);
        let stockChanged = false;

        const deductStockList = (list: any[]) => {
          return (list || []).map(p => {
            const match = cart.find(ci => ci.productId === p.id || ci.id === p.id || (ci.name && p.name && ci.name.trim().toLowerCase() === p.name.trim().toLowerCase()));
            if (match) {
              let updated = { ...p };
              if (typeof p.stock === 'number') {
                stockChanged = true;
                updated.stock = Math.max(0, p.stock - match.quantity);
              }
              if (match.isPreOrder || p.isPreOrder) {
                updated.preOrderSold = (Number(p.preOrderSold) || 0) + match.quantity;
                stockChanged = true;
              }
              if (p.flashSale) {
                updated.flashSale = {
                  ...p.flashSale,
                  sold: (Number(p.flashSale.sold) || 0) + match.quantity,
                  stockLeft: typeof p.flashSale.stockLeft === 'number' ? Math.max(0, p.flashSale.stockLeft - match.quantity) : p.flashSale.stockLeft
                };
                stockChanged = true;
              }
              return updated;
            }
            return p;
          });
        };

        if (catProducts && catProducts.length > 0) {
          const nextCatProds = deductStockList(catProducts);
          await storage.setItem('porto_catalog_products', nextCatProds);
        }
        if (catList && catList.length > 0) {
          const nextCats = deductStockList(catList);
          await storage.setItem('porto_catalog', nextCats);
        }
        if (stockChanged) {
          window.dispatchEvent(new CustomEvent('porto_catalog_products_updated'));
          window.dispatchEvent(new CustomEvent('porto_catalog_updated'));
        }
      } catch (e) {
        console.warn('[CartCheckout] Stock deduction warning:', e);
      }

      // 1c. Auto-credit affiliate referral commission if referral code is present
      if (activeReferralCode) {
        creditAffiliateReferral(activeReferralCode, cartSubtotal, trxId, checkoutForm.name)
          .then(res => {
            if (res.success) {
              console.log(`[Affiliate] Komisi ${res.commission} berhasil dicatat untuk mitra ${res.partnerName}`);
            }
          })
          .catch(e => console.warn('[CartCheckout] Referral credit warning:', e));
      }

      // 1d. Auto-save buyer into Customer Directory (porto_trx_customers)
      try {
        const existingCus = await storage.getItem<any[]>('porto_trx_customers', []);
        const cleanPhone = (checkoutForm.phone || '').trim();
        const foundIdx = existingCus.findIndex((c: any) => 
          (cleanPhone && c.phone === cleanPhone) || 
          (c.name && c.name.toLowerCase() === checkoutForm.name.trim().toLowerCase())
        );
        if (foundIdx === -1) {
          await storage.setItem('porto_trx_customers', [newTrx.customer, ...existingCus], true);
        } else {
          existingCus[foundIdx] = { ...existingCus[foundIdx], ...newTrx.customer };
          await storage.setItem('porto_trx_customers', [...existingCus], true);
        }
        try { localStorage.removeItem('porto_last_checkout_buyer'); } catch {}
      } catch (e) {
        console.warn('Customer auto-sync warning:', e);
      }

      // 1e. If service in cart, automatically create project(s) waiting for admin ACC
      if (hasServiceInCart) {
        const svcItems = cart.filter(i => isServiceProduct(i));
        for (let idx = 0; idx < svcItems.length; idx++) {
          const svcC = svcItems[idx];
          const projTrxId = idx === 0 ? trxId : `${trxId}-svc-${idx + 1}`;
          const itemTotal = (svcC.price || 0) * (svcC.quantity || 1);
          createOrUpdateServiceOrder({
            id: projTrxId,
            customerType: client?.membershipTier || 'client',
            customer: newTrx.customer,
            serviceCategory: svcC?.category || 'Jasa',
            serviceTitle: svcC?.name || 'Layanan Jasa',
            briefMode: serviceBriefData?.briefMode || 'text',
            googleDocUrl: serviceBriefData?.googleDocUrl || '',
            briefDescription: serviceBriefData?.notes || (serviceBriefData as any)?.briefDescription || checkoutForm.address || '',
            deadline: serviceBriefData?.deadline || (serviceBriefData as any)?.effectiveDeadline || '',
            price: itemTotal,
            grandTotal: itemTotal,
            paymentScheme: isDp ? 'dp' : 'full',
            dpAmount: isDp ? Math.round(itemTotal * 0.5) : 0,
            remainingAmount: isDp ? Math.round(itemTotal * 0.5) : 0,
            paymentStatus: isDp ? 'dp' : 'belum',
            requiresAcc: true, // Requires admin ACC to appear in active Kanban
            notes: checkoutForm.address || ''
          }).catch(err => console.warn('Service project sync error:', err));
        }
      }

      // Notify systems
      window.dispatchEvent(new CustomEvent('porto_transactions_updated'));
      window.dispatchEvent(new CustomEvent('porto_trx_customers_updated'));

      // 2. Save client order record
      const clientUid = client?.id || newTrx.customer.id;
      for (const itm of cart) {
        const itmIsPO = Boolean(itm.isPreOrder || itm.category?.toLowerCase().includes('pre-order'));
        await saveClientOrder({
          clientId: clientUid,
          clientName: checkoutForm.name,
          clientPhone: checkoutForm.phone,
          clientEmail: checkoutForm.email || client?.email,
          productName: itm.name,
          productId: itm.productId || itm.id,
          variantName: itm.variantName || '',
          price: itm.price,
          quantity: itm.quantity,
          total: itm.price * itm.quantity,
          status: 'Pending',
          paymentMethod: checkoutForm.paymentMethodId === 'qris_toko' ? 'QRIS Instan' : (newTrx.paymentMethod?.bankName || 'Transfer Bank'),
          notes: checkoutForm.address || '',
          downloadUrl: itm.downloadUrl || '',
          fileFormat: itm.fileFormat || 'ZIP',
          fileSize: itm.fileSize || '',
          instantDeliveryMessage: itm.instantDeliveryMessage || '',
          isDigitalAsset: itm.isDigitalAsset || itm.type === 'Digital' || !!itm.downloadUrl,
          accessModel: itm.accessModel || 'lifetime',
          durationDays: itm.durationDays,
          expiryDate: itm.accessModel === 'limited' && itm.durationDays
            ? new Date(Date.now() + itm.durationDays * 86400000).toISOString()
            : null,
          assetStatus: 'active',
          orderType: itmIsPO ? 'preorder' : (isServiceProduct(itm) ? 'jasa' : 'beli_putus'),
          preOrderBatch: itm.preOrderBatch || (itmIsPO ? poBatch : ''),
          preOrderEstimate: itm.preOrderEstimate || (itmIsPO ? poEstimate : ''),
          paymentScheme: isDp ? 'dp' : 'full',
          dpAmount: isDp ? dpAmount : 0,
          remainingAmount: isDp ? remainingAmount : 0,
          paymentStatus: isDp ? 'dp' : 'belum',
          orderId: trxId,
          milestoneStep: isDp ? 2 : 1,
          trackingNumber: ''
        }).catch(() => {});
      }

      // 3. Format WhatsApp message
      const detailPesanan = cart.map(item => {
        const isPoItem = Boolean(item.isPreOrder || item.category?.toLowerCase().includes('pre-order'));
        const itemTypeLabel = isPoItem 
          ? `[PO ${item.preOrderBatch || 'BATCH 1'}${item.preOrderDpAllowed === false ? ' (Lunas Only)' : ''}]` 
          : isServiceProduct(item) 
          ? `[JASA${item.serviceDpAllowed === false ? ' (Lunas Only)' : ''}]` 
          : '[BELI]';
        return `• ${itemTypeLabel} ${item.name}${item.variantName ? ` (${item.variantName})` : ''} (${item.quantity}x) - ${formatRp(item.price * item.quantity)}`;
      }).join('\n');

      const qrisMerchantName = shopSettings?.qrisMerchantName || businessProfile?.qris?.merchantName || businessProfile?.brandName || 'SUMR.DAY STUDIO';
      const selectedPayment = checkoutForm.paymentMethodId === 'qris_toko'
        ? `QRIS Instan (${qrisMerchantName} - 0% Fee)`
        : (paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId)
            ? `${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).bankName} - ${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).accountNumber} (A.n ${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).accountName})`
            : 'Transfer Bank');

      const rawWa = (businessProfile?.whatsapp || shopSettings?.whatsappNumber || '6281234567890').toString().replace(/\D/g, '');
      const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa;

      let waMessage = '';
      if (hasPreOrderInCart) {
        waMessage = `Halo sumr.day team! Saya telah melakukan pemesanan PRE-ORDER MERCHANDISE dari website:

*NOMOR PESANAN:* ${trxId}
*JENIS TRANSAKSI:* Pre-Order Merch (${isDp ? 'DP 50%' : 'Lunas 100%'})
*Batch Pre-Order:* ${poBatch}
${poEstimate ? `*Estimasi Pengiriman:* ${poEstimate}\n` : ''}*Nama Pemesan:* ${checkoutForm.name}
*No. WhatsApp:* ${checkoutForm.phone}
${checkoutForm.address ? `*Alamat Pengiriman / Catatan:* ${checkoutForm.address}\n` : ''}
*Detail Item Pre-Order:*
${detailPesanan}

*TOTAL NILAI ORDER:* ${formatRp(cartSubtotal)}
${resellerDiscountAmount > 0 ? `💎 *Diskon Member Reseller (${resellerDiscountRate}%):* -${formatRp(resellerDiscountAmount)}\n` : ''}${voucherDiscountAmount > 0 ? `🎟️ *Diskon Promo:* -${formatRp(voucherDiscountAmount)}\n` : ''}${activeReferralCode ? `🔗 *Kode Referral:* ${activeReferralCode}\n` : ''}${isDp ? `*TAGIHAN DP 50%:* ${formatRp(dpAmount + (outrightSubtotal - totalAllDiscounts))}\n` : ''}*Kode Unik Verifikasi:* +Rp ${uniqueCode}
*TOTAL TRANSFER ${isDp ? 'DP' : 'LUNAS'}:* ${formatRp(totalTransferNow)} *(Wajib persis hingga 3 digit terakhir)*
${isDp ? `*SISA PELUNASAN NANTI:* ${formatRp(remainingAmount)} *(Dibayarkan saat merch siap dikirim)*\n` : ''}*Metode Pembayaran:* ${selectedPayment}

*Bukti Pembayaran:* (Terlampir foto struk transfer)

Mohon dikonfirmasi slot Pre-Order merch saya ya min. Terima kasih!`;
      } else if (isDp) {
        waMessage = `Halo sumr.day team! Saya telah melakukan pemesanan JASA PROYEK dari website:

*NOMOR PESANAN:* ${trxId}
*JENIS TRANSAKSI:* Layanan Proyek (DP 50%)
*Nama Pemesan:* ${checkoutForm.name}
*No. WhatsApp:* ${checkoutForm.phone}
${checkoutForm.address ? `*Catatan Proyek:* ${checkoutForm.address}\n` : ''}
*Detail Item Proyek:*
${detailPesanan}

*NILAI KONTRAK PROYEK:* ${formatRp(cartSubtotal)}
${resellerDiscountAmount > 0 ? `💎 *Diskon Member Reseller (${resellerDiscountRate}%):* -${formatRp(resellerDiscountAmount)}\n` : ''}${voucherDiscountAmount > 0 ? `🎟️ *Diskon Promo:* -${formatRp(voucherDiscountAmount)}\n` : ''}${activeReferralCode ? `🔗 *Kode Referral:* ${activeReferralCode}\n` : ''}*TAGIHAN DP 50% SEKARANG:* ${formatRp(dpAmount + (outrightSubtotal - totalAllDiscounts))}
*Kode Unik Verifikasi:* +Rp ${uniqueCode}
*TOTAL TRANSFER DP:* ${formatRp(totalTransferNow)} *(Wajib persis hingga 3 digit terakhir)*
*SISA PELUNASAN NANTI:* ${formatRp(remainingAmount)} *(Dibayarkan saat serah terima / final approval)*
*Metode Pembayaran:* ${selectedPayment}

*Bukti Pembayaran DP:* (Terlampir foto struk transfer)

Mohon dikonfirmasi untuk kick-off pengerjaan proyek kami ya min. Terima kasih!`;
      } else {
        waMessage = `Halo sumr.day team! ☀️ Saya telah melakukan pemesanan dari katalog:

🛒 *NOMOR PESANAN:* ${trxId}
🏷️ *JENIS TRANSAKSI:* ${allServices ? 'Jasa Proyek (Lunas 100%)' : 'Produk Beli Langsung (Sekali Bayar Lunas)'}
👤 *Nama Pemesan:* ${checkoutForm.name}
📱 *No. WhatsApp:* ${checkoutForm.phone}
${checkoutForm.address ? `📍 *Catatan / Alamat:* ${checkoutForm.address}\n` : ''}
📦 *Detail Pesanan:*
${detailPesanan}

*TOTAL NILAI ORDER:* ${formatRp(cartSubtotal)}
${resellerDiscountAmount > 0 ? `💎 *Diskon Member Reseller (${resellerDiscountRate}%):* -${formatRp(resellerDiscountAmount)}\n` : ''}${voucherDiscountAmount > 0 ? `🎟️ *Diskon Promo:* -${formatRp(voucherDiscountAmount)}\n` : ''}${activeReferralCode ? `🔗 *Kode Referral:* ${activeReferralCode}\n` : ''}🔢 *Kode Unik Verifikasi:* +Rp ${uniqueCode}
💰 *TOTAL TRANSFER:* ${formatRp(totalTransferNow)} *(Wajib persis hingga 3 digit terakhir)*
💳 *Metode Pembayaran:* ${selectedPayment}

📎 *Bukti Pembayaran:* (Terlampir foto bukti transfer)

Setelah diverifikasi, pesanan saya akan langsung diproses / dapat diunduh di menu Akun Saya (/akun). Terima kasih!`;
      }

      // Open WhatsApp
      const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');

      // Clear Cart & Switch to History
      setCart([]);
      localStorage.removeItem('porto_client_cart');
      try {
        localStorage.setItem('porto_last_order_id', trxId);
      } catch {}
      setCheckoutForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        paymentMethodId: ''
      });
      setServiceBriefData(null);
      showToast('Pesanan Dikirim!', 'Mengarahkan ke WhatsApp admin studio...', 'success');
      haptic.success();

      // Refresh orders and show history tab
      refreshOrders();
      setActiveTab('history');

    } catch (err) {
      console.error(err);
      showToast('Gagal Membuat Pesanan', 'Terjadi kendala sistem, silakan coba lagi.', 'error');
      haptic.error();
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // WhatsApp Settlement Handler for Jasa & Pre-Order Orders
  const handlePaySettlementWA = (order: ClientOrder) => {
    const rawWa = (businessProfile?.whatsapp || shopSettings?.whatsappNumber || '6281234567890').toString().replace(/\D/g, '');
    const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa;
    const sisa = order.remainingAmount || Math.round(order.total * 0.5);
    const isPO = order.orderType === 'preorder' || Boolean(order.preOrderBatch) || order.productName.toLowerCase().includes('pre-order') || order.productName.toLowerCase().includes('merch');

    const text = encodeURIComponent(
      isPO
        ? `Halo sumr.day Studio! Saya ingin melakukan konfirmasi pelunasan pre-order merchandise:\n\n` +
          `*ID Pesanan:* #${order.id}\n` +
          `*Batch PO:* ${order.preOrderBatch || 'BATCH 1'}\n` +
          `*Merchandise:* ${order.productName}\n` +
          `*Sisa Tagihan Pelunasan:* ${formatRp(sisa)}\n\n` +
          `Mohon info rekening pelunasan & konfirmasi alamat pengiriman merchandise saya ya min. Terima kasih!`
        : `Halo sumr.day Studio! Saya ingin melakukan konfirmasi pelunasan untuk proyek:\n\n` +
          `*ID Pesanan:* #${order.id}\n` +
          `*Proyek:* ${order.productName}\n` +
          `*Sisa Tagihan Pelunasan:* ${formatRp(sisa)}\n\n` +
          `Mohon info rekening tujuan pelunasan dan serah terima finalnya ya min. Terima kasih!`
    );
    window.open(`https://wa.me/${cleanWa}?text=${text}`, '_blank');
  };

  // Mobile Sticky Bar Checkout Click (Auto-scrolls to missing inputs if incomplete)
  const handleStickyCheckoutClick = () => {
    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim()) {
      showToast('Data Belum Lengkap', 'Silakan isi Nama Lengkap & Nomor WhatsApp terlebih dahulu.', 'warning');
      haptic.warning();
      const el = document.getElementById('checkout-customer-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstInput = el.querySelector('input');
        if (firstInput) (firstInput as HTMLInputElement).focus();
      }
      return;
    }
    const paymentList = (shopSettings?.paymentMethods?.length > 0 ? shopSettings.paymentMethods : (businessProfile?.bankAccounts || []));
    const qrisUrl = shopSettings?.qrisImageUrl || businessProfile?.qris?.imageUrl || '';
    if ((paymentList.length > 0 || qrisUrl) && !checkoutForm.paymentMethodId) {
      showToast('Pilih Pembayaran', 'Mohon pilih salah satu metode transfer pembayaran.', 'warning');
      haptic.warning();
      const el = document.getElementById('checkout-payment-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    handleSubmitOrder();
  };

  // Colors & Styles
  const bg = isDark ? '#08080c' : '#fcfcfd';
  const textColor = isDark ? '#ffffff' : '#090a10';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const accentColor = 'var(--cms-accent, #7c3aed)';

  const displayedOrders = client ? orders : lookupResults;

  return (
    <div className="cart-page-container" style={{ minHeight: '100vh', background: bg, color: textColor, paddingTop: 'max(96px, calc(env(safe-area-inset-top, 0px) + 90px))', paddingBottom: 110, transition: 'background 0.3s ease' }}>
      
      {/* ── MAIN CONTENT CONTAINER ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        
        {/* Top Back Action & Context Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => navigate('/katalog')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 16px',
              borderRadius: 100,
              border: `1px solid ${cardBorder}`,
              background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
              color: textColor,
              fontSize: 12.5,
              fontWeight: 750,
              fontFamily: "'Outfit', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <ArrowLeft size={15} />
            <span>Katalog Studio</span>
          </button>

          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor }}>
            Pusat Pesanan & Kasir
          </span>
        </div>

        {/* Page Hero Header */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Pusat Pesanan
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor, margin: 0, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            Transparan & Fleksibel: Tersedia opsi <strong>Booking Jasa & Pre-Order</strong> (DP 50% / Lunas sesuai kebijakan) serta <strong>Beli Langsung</strong> untuk produk siap pakai.
          </p>
        </div>

        {/* ── UNIFIED SEGMENTED TAB SWITCHER ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28, width: '100%' }}>
          <div style={{
            display: 'inline-flex',
            maxWidth: '100%',
            overflowX: 'auto',
            padding: 4,
            borderRadius: 100,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${cardBorder}`
          }}>
            <button
              onClick={() => {
                haptic.light();
                setActiveTab('cart');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 8,
                padding: isMobile ? '8px 14px' : '10px 22px',
                borderRadius: 100,
                border: 'none',
                background: activeTab === 'cart' ? accentColor : 'transparent',
                color: activeTab === 'cart' ? '#ffffff' : subTextColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? 12.5 : 13.5,
                fontWeight: 850,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: activeTab === 'cart' ? `0 4px 16px ${accentColor}40` : 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <ShoppingCart size={15} style={{ flexShrink: 0 }} />
              <span>{isMobile ? 'Keranjang' : 'Keranjang Belanja'}</span>
              {totalCartCount > 0 && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: 100,
                  background: activeTab === 'cart' ? 'rgba(255,255,255,0.25)' : accentColor,
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                haptic.light();
                setActiveTab('history');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 8,
                padding: isMobile ? '8px 14px' : '10px 22px',
                borderRadius: 100,
                border: 'none',
                background: activeTab === 'history' ? accentColor : 'transparent',
                color: activeTab === 'history' ? '#ffffff' : subTextColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? 12.5 : 13.5,
                fontWeight: 850,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: activeTab === 'history' ? `0 4px 16px ${accentColor}40` : 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Clock size={15} style={{ flexShrink: 0 }} />
              <span>{isMobile ? 'Riwayat' : 'Riwayat Pesanan'}</span>
              {orders.length > 0 && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: 100,
                  background: activeTab === 'history' ? 'rgba(255,255,255,0.25)' : accentColor,
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            TAB 1: SHOPPING CART & DIFFERENTIATED CHECKOUT
        ══════════════════════════════════════════════════ */}
        {activeTab === 'cart' && (
          <div>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: isMobile ? '48px 20px' : '64px 32px',
                background: isDark 
                  ? 'radial-gradient(ellipse at 50% 0%, rgba(22, 135, 167, 0.12) 0%, rgba(18, 20, 29, 0.95) 75%)' 
                  : 'radial-gradient(ellipse at 50% 0%, rgba(22, 135, 167, 0.08) 0%, #ffffff 80%)',
                borderRadius: 28,
                border: `1.5px solid ${cardBorder}`,
                boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.45)' : '0 16px 40px rgba(0,0,0,0.06)',
                maxWidth: 580,
                margin: '0 auto'
              }}>
                <div style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(22, 135, 167, 0.2)' : 'rgba(22, 135, 167, 0.12)',
                  color: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  boxShadow: `0 8px 24px ${accentColor}25`,
                  flexShrink: 0
                }}>
                  <ShoppingCart size={30} strokeWidth={2.2} />
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, margin: '0 0 8px', color: textColor }}>
                  Keranjang Belanja Masih Kosong
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor, margin: '0 auto 24px', lineHeight: 1.6, maxWidth: 420 }}>
                  Anda belum menambahkan layanan jasa atau aset digital ke keranjang. Jelajahi katalog studio untuk menemukan paket terbaik.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/katalog')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 100,
                      background: accentColor,
                      color: '#ffffff',
                      border: 'none',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: `0 6px 20px ${accentColor}40`,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      flexShrink: 0
                    }}
                  >
                    <Store size={16} /> <span>Jelajahi Katalog Produk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    style={{
                      padding: '12px 22px',
                      borderRadius: 100,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      color: textColor,
                      border: `1px solid ${cardBorder}`,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13.5,
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      flexShrink: 0
                    }}
                  >
                    <Clock size={16} /> <span>Cek Riwayat Pesanan</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'flex-start' }}>
                {/* ── LEFT COLUMN: CART ITEMS LIST ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, margin: 0, color: textColor }}>
                      Item Keranjang ({totalCartCount})
                    </h3>
                    <button
                      onClick={() => {
                        haptic.warning();
                        setCart([]);
                        localStorage.removeItem('porto_client_cart');
                        showToast('Keranjang Dikosongkan', 'Semua item telah dihapus.', 'info');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: "'Outfit', sans-serif",
                        minHeight: 'unset'
                      }}
                    >
                      <Trash2 size={13} style={{ flexShrink: 0 }} /> Kosongkan
                    </button>
                  </div>

                  {cart.map((item) => {
                    const isService = isServiceProduct(item);
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: cardBg,
                          borderRadius: 20,
                          border: `1px solid ${cardBorder}`,
                          padding: isMobile ? 12 : 16,
                          display: 'flex',
                          gap: isMobile ? 12 : 16,
                          alignItems: 'center',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72, borderRadius: 14, overflow: 'hidden', background: isDark ? '#090a12' : '#f1f5f9', flexShrink: 0 }}>
                          <img
                            src={item.image || item.gallery?.[0] || 'https://placehold.co/150x150?text=Produk'}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        {/* Info & Badges */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                            {item.isPreOrder || item.category?.toLowerCase().includes('pre-order') ? (
                              <span style={{ fontSize: 9.5, fontWeight: 900, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={10} style={{ flexShrink: 0 }} /> Pre-Order
                              </span>
                            ) : isService ? (
                              <span style={{ fontSize: 9.5, fontWeight: 900, background: 'rgba(124,58,237,0.15)', color: '#8b5cf6', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Briefcase size={10} style={{ flexShrink: 0 }} /> Jasa
                              </span>
                            ) : (
                              <span style={{ fontSize: 9.5, fontWeight: 900, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Package size={10} style={{ flexShrink: 0 }} /> Beli
                              </span>
                            )}
                            {item.variantName && (
                              <span style={{ fontSize: 10, color: subTextColor }}>• Varian: {item.variantName}</span>
                            )}
                          </div>

                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14.5, fontWeight: 850, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>

                          {item.preOrderEstimate && (
                            <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>Est. Kirim: {item.preOrderEstimate}</span>
                            </div>
                          )}

                          <div style={{ fontSize: 13, fontWeight: 900, color: accentColor, marginTop: 4 }}>
                            {formatRp(item.price)}
                          </div>
                        </div>

                        {/* Stepper & Delete */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            style={{ background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: 2, minHeight: 'unset' }}
                            title="Hapus Item"
                          >
                            <Trash2 size={15} style={{ flexShrink: 0 }} />
                          </button>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 100, padding: '3px 8px' }}>
                            <button
                              onClick={() => handleUpdateQty(item.id, -1)}
                              style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset', flexShrink: 0 }}
                            >
                              <Minus size={11} style={{ flexShrink: 0 }} />
                            </button>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12.5, fontWeight: 900, minWidth: 16, textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(item.id, 1)}
                              style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'transparent', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset', flexShrink: 0 }}
                            >
                              <Plus size={11} style={{ flexShrink: 0 }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Promo Voucher Box */}
                  <div style={{ background: cardBg, borderRadius: 20, border: `1.5px dashed ${cardBorder}`, padding: 16 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif" }}>
                      <Ticket size={14} color={accentColor} /> Punya Kode Promo / Kupon?
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={voucherInput}
                        onChange={e => {
                          setVoucherInput(e.target.value.toUpperCase());
                          setVoucherMessage({ type: '', text: '' });
                          setAppliedVoucher(null);
                        }}
                        placeholder="MASUKKAN KODE PROMO..."
                        style={{
                          flex: 1,
                          height: 40,
                          padding: '0 14px',
                          borderRadius: 100,
                          border: `1px solid ${cardBorder}`,
                          background: isDark ? '#090a12' : '#ffffff',
                          color: textColor,
                          fontSize: 12.5,
                          outline: 'none',
                          textTransform: 'uppercase',
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 800
                        }}
                      />
                      <button
                        onClick={handleApplyVoucher}
                        style={{
                          padding: '0 18px',
                          height: 40,
                          borderRadius: 100,
                          background: accentColor,
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 12.5,
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: "'Outfit', sans-serif"
                        }}
                      >
                        Gunakan
                      </button>
                    </div>
                    {voucherMessage.text && (
                      <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 800, color: voucherMessage.type === 'error' ? '#ef4444' : '#10b981' }}>
                        {voucherMessage.text}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT COLUMN: DIFFERENTIATED CHECKOUT & PAYMENT ── */}
                <div style={{ background: cardBg, borderRadius: 24, border: `1.5px solid ${cardBorder}`, padding: 22, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, margin: 0, color: textColor }}>
                    Form Pemesanan & Pembayaran
                  </h3>

                  {/* ── DIFFERENTIATED PAYMENT SCHEME SELECTOR ── */}
                  {isDpEligible ? (
                    <div style={{ background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)', borderRadius: 18, border: '1.5px solid rgba(245,158,11,0.3)', padding: 16 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 850, color: hasPreOrderInCart ? '#f59e0b' : '#8b5cf6', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit', sans-serif" }}>
                        <CreditCard size={14} /> Skema Pembayaran
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${paymentScheme === 'dp' ? (hasPreOrderInCart ? '#f59e0b' : accentColor) : cardBorder}`, background: isDark ? '#090a12' : '#ffffff', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="pagePaymentScheme"
                            value="dp"
                            checked={paymentScheme === 'dp'}
                            onChange={() => setPaymentScheme('dp')}
                            style={{ width: 16, height: 16, accentColor: hasPreOrderInCart ? '#f59e0b' : accentColor, marginTop: 2 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 13, fontWeight: 850, color: textColor, fontFamily: "'Outfit', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <Clock size={13} color={hasPreOrderInCart ? '#f59e0b' : accentColor} /> DP 50%
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 900, color: hasPreOrderInCart ? '#f59e0b' : accentColor }}>
                                {formatRp(dpAmount + (outrightSubtotal - voucherDiscountAmount))}
                              </span>
                            </div>
                            <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 3 }}>
                              Bayar DP 50% untuk booking slot. Sisa <strong>{formatRp(remainingAmount)}</strong> saat pelunasan.
                            </div>

                            {/* Rincian Campuran (Jika ada item DP dan item Lunas Only dalam 1 keranjang) */}
                            {outrightSubtotal > 0 && dpEligibleSubtotal > 0 && paymentScheme === 'dp' && (
                              <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px dashed ${cardBorder}`, fontSize: 11.5 }}>
                                <div style={{ fontWeight: 800, color: textColor, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <FileText size={12} /> Rincian Campuran:
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontSize: 11 }}>
                                  <span>• Item DP 50% ({formatRp(dpEligibleSubtotal)}):</span>
                                  <span>DP {formatRp(dpAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: 11 }}>
                                  <span>• Item Lunas:</span>
                                  <span>{formatRp(outrightSubtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: subTextColor, marginTop: 3, borderTop: `1px solid ${cardBorder}`, paddingTop: 3, fontSize: 11 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={11} /> Sisa Pelunasan:
                                  </span>
                                  <strong style={{ color: textColor }}>{formatRp(remainingAmount)}</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${paymentScheme === 'full' ? (hasPreOrderInCart ? '#f59e0b' : accentColor) : cardBorder}`, background: isDark ? '#090a12' : '#ffffff', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="pagePaymentScheme"
                            value="full"
                            checked={paymentScheme === 'full'}
                            onChange={() => setPaymentScheme('full')}
                            style={{ width: 16, height: 16, accentColor: hasPreOrderInCart ? '#f59e0b' : accentColor, marginTop: 2 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 13, fontWeight: 850, color: textColor, fontFamily: "'Outfit', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle2 size={13} color="#10b981" /> Lunas 100%
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 900, color: '#10b981' }}>
                                {formatRp(effectiveCartTotal)}
                              </span>
                            </div>
                            <div style={{ fontSize: 11.5, color: subTextColor, marginTop: 3 }}>
                              Langsung lunas di awal untuk semua item tanpa perlu transfer termin kedua.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.06)', borderRadius: 14, border: '1px solid rgba(16,185,129,0.3)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Zap size={18} color="#10b981" />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 850, color: '#10b981', fontFamily: "'Outfit', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={14} color="#10b981" /> Lunas 100%
                        </div>
                        <div style={{ fontSize: 11.5, color: subTextColor }}>
                          Semua item pada keranjang dibayar lunas di awal ({formatRp(effectiveCartTotal)}). Langsung diproses tanpa termin DP.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Information Inputs */}
                  <div id="checkout-customer-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 5, fontFamily: "'Outfit', sans-serif" }}>Nama Lengkap *</label>
                      <input
                        value={checkoutForm.name}
                        onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        placeholder="Cth: Budi Santoso"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 5, fontFamily: "'Outfit', sans-serif" }}>Nomor WhatsApp *</label>
                      <input
                        value={checkoutForm.phone}
                        onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        placeholder="Cth: 081234567890"
                      />
                    </div>
                    {hasServiceInCart ? (
                      <ServiceOrderBriefSection
                        isDark={isDark}
                        accentColor={accentColor}
                        cardBorder={cardBorder}
                        textColor={textColor}
                        subTextColor={subTextColor}
                        onChange={setServiceBriefData}
                        formatRp={formatRp}
                      />
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 5, fontFamily: "'Outfit', sans-serif" }}>Catatan Pesanan (Opsional)</label>
                        <textarea
                          value={checkoutForm.address}
                          onChange={e => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                          style={{ width: '100%', height: 60, padding: '8px 14px', borderRadius: 12, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                          placeholder="Catatan tambahan untuk pesanan Anda..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  {(() => {
                    const paymentList = (shopSettings?.paymentMethods?.length > 0 ? shopSettings.paymentMethods : (businessProfile?.bankAccounts || []));
                    const qrisUrl = shopSettings?.qrisImageUrl || businessProfile?.qris?.imageUrl || '';
                    if (paymentList.length === 0 && !qrisUrl) return null;

                    return (
                      <div id="checkout-payment-section">
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>Metode Pembayaran *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {qrisUrl && (
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${checkoutForm.paymentMethodId === 'qris_toko' ? accentColor : cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input
                                  type="radio"
                                  name="pagePayMethod"
                                  value="qris_toko"
                                  checked={checkoutForm.paymentMethodId === 'qris_toko'}
                                  onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethodId: 'qris_toko' })}
                                  style={{ width: 16, height: 16, accentColor }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif" }}>QRIS Instan (Bebas Biaya Admin)</span>
                                    <span style={{ fontSize: 9.5, background: '#10b98120', color: '#10b981', fontWeight: 800, padding: '2px 6px', borderRadius: 6 }}>0% Fee</span>
                                  </div>
                                  <div style={{ fontSize: 11, color: subTextColor }}>{shopSettings.qrisMerchantName || 'BCA / GoPay / OVO / Dana / Mandiri / ShopeePay'}</div>
                                </div>
                              </div>
                              {checkoutForm.paymentMethodId === 'qris_toko' && (
                                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', padding: 12, borderRadius: 10, border: `1px solid ${cardBorder}` }}>
                                  <img src={qrisUrl} alt="QRIS Toko" style={{ maxWidth: 180, width: '100%', height: 'auto', borderRadius: 8 }} />
                                  <span style={{ fontSize: 10.5, color: '#475569', fontWeight: 600, marginTop: 6, textAlign: 'center' }}>
                                    Scan barcode QRIS di atas untuk membayar langsung tanpa biaya transfer.
                                  </span>
                                </div>
                              )}
                            </label>
                          )}
                          {paymentList.map((pm: any) => (
                            <label key={pm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${checkoutForm.paymentMethodId === pm.id ? accentColor : cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                <input
                                  type="radio"
                                  name="pagePayMethod"
                                  value={pm.id}
                                  checked={checkoutForm.paymentMethodId === pm.id}
                                  onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethodId: pm.id })}
                                  style={{ width: 16, height: 16, accentColor, flexShrink: 0 }}
                                />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor, fontFamily: "'Outfit', sans-serif", userSelect: 'text' }}>
                                    {pm.bankName} - <span style={{ fontFamily: 'monospace' }}>{pm.accountNumber}</span>
                                  </div>
                                  <div style={{ fontSize: 11, color: subTextColor, userSelect: 'text' }}>A.n {pm.accountName}</div>
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
                                    showToast('Nomor Rekening Tersalin!', `${pm.bankName}: ${pm.accountNumber}`, 'success');
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
                                    flexShrink: 0,
                                    userSelect: 'none'
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
                    );
                  })()}

                  {/* Summary Breakdown Card */}
                  <div style={{ background: isDark ? '#090a12' : '#f9fafb', padding: 16, borderRadius: 16, border: `1px solid ${cardBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5, color: subTextColor }}>
                      <span>Subtotal Item ({totalCartCount}x):</span>
                      <span>{formatRp(cartSubtotal)}</span>
                    </div>

                    {isResellerMember && resellerDiscountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5, color: '#3b82f6', fontWeight: 800 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={12} /> Diskon Member Reseller ({resellerDiscountRate}%):
                        </span>
                        <span>-{formatRp(resellerDiscountAmount)}</span>
                      </div>
                    )}

                    {voucherDiscountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5, color: '#10b981', fontWeight: 700 }}>
                        <span>Diskon Promo:</span>
                        <span>-{formatRp(voucherDiscountAmount)}</span>
                      </div>
                    )}

                    {isDpEligible && paymentScheme === 'dp' ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5, color: hasPreOrderInCart ? '#f59e0b' : '#8b5cf6', fontWeight: 700 }}>
                          <span>{hasPreOrderInCart ? 'Tagihan DP Booking (50%):' : 'Tagihan DP Kick-off (50%):'}</span>
                          <span>{formatRp(dpAmount + (outrightSubtotal - voucherDiscountAmount))}</span>
                        </div>
                        {outrightSubtotal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11.5, color: '#10b981' }}>
                            <span>Termasuk Item Wajib Lunas:</span>
                            <span>{formatRp(outrightSubtotal)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5, color: '#f59e0b', fontWeight: 700 }}>
                          <span>Kode Unik Verifikasi:</span>
                          <span>+{uniqueCode}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 6, borderTop: `1px solid ${cardBorder}`, fontSize: 15.5, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                          <span>Total Bayar Sekarang:</span>
                          <span style={{ color: hasPreOrderInCart ? '#f59e0b' : accentColor }}>{formatRp(totalTransferNow)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
                          <button
                            type="button"
                            onClick={() => {
                              haptic.light();
                              navigator.clipboard.writeText(String(totalTransferNow));
                              setCopiedBankId('nominal_total');
                              showToast('Nominal Persis Tersalin!', `Rp ${totalTransferNow.toLocaleString('id-ID')} (beserta kode unik)`, 'success');
                              setTimeout(() => setCopiedBankId(null), 2000);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedBankId === 'nominal_total' ? '#10b981' : '#94a3b8',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 4px'
                            }}
                            title="Salin nominal transfer beserta 3 digit kode unik"
                          >
                            {copiedBankId === 'nominal_total' ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedBankId === 'nominal_total' ? 'Nominal Berhasil Tersalin' : 'Salin Nominal Persis'}</span>
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: subTextColor }}>
                          <span>Sisa Pelunasan (Nanti):</span>
                          <span style={{ fontWeight: 700, color: textColor }}>{formatRp(remainingAmount)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5, color: '#f59e0b', fontWeight: 700 }}>
                          <span>Kode Unik Verifikasi:</span>
                          <span>+{uniqueCode}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 6, borderTop: `1px solid ${cardBorder}`, fontSize: 15.5, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                          <span>Total Tagihan Lunas:</span>
                          <span style={{ color: accentColor }}>{formatRp(totalTransferNow)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
                          <button
                            type="button"
                            onClick={() => {
                              haptic.light();
                              navigator.clipboard.writeText(String(totalTransferNow));
                              setCopiedBankId('nominal_total');
                              showToast('Nominal Persis Tersalin!', `Rp ${totalTransferNow.toLocaleString('id-ID')} (beserta kode unik)`, 'success');
                              setTimeout(() => setCopiedBankId(null), 2000);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedBankId === 'nominal_total' ? '#10b981' : '#94a3b8',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 4px'
                            }}
                            title="Salin nominal transfer beserta 3 digit kode unik"
                          >
                            {copiedBankId === 'nominal_total' ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedBankId === 'nominal_total' ? 'Nominal Berhasil Tersalin' : 'Salin Nominal Persis'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((shopSettings?.paymentMethods?.length > 0 || shopSettings?.qrisImageUrl) && !checkoutForm.paymentMethodId)}
                    style={{
                      width: '100%',
                      height: 50,
                      borderRadius: 100,
                      border: 'none',
                      background: (isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((shopSettings?.paymentMethods?.length > 0 || shopSettings?.qrisImageUrl) && !checkoutForm.paymentMethodId))
                        ? 'rgba(150,150,150,0.3)'
                        : accentColor,
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 850,
                      cursor: (isSubmitting || !checkoutForm.name || !checkoutForm.phone || ((shopSettings?.paymentMethods?.length > 0 || shopSettings?.qrisImageUrl) && !checkoutForm.paymentMethodId))
                        ? 'not-allowed'
                        : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontFamily: "'Outfit', sans-serif",
                      boxShadow: `0 8px 24px ${accentColor}40`,
                      transition: 'all 0.2s'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Memproses Pesanan...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={17} />
                        <span>
                          {isDpEligible && paymentScheme === 'dp'
                            ? (hasPreOrderInCart && hasServiceInCart 
                                ? 'Gas DP'
                                : (hasPreOrderInCart ? 'Gas Pre-Order' : 'Gas Pesan'))
                            : 'Bungkus Yuk'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 2: UNIFIED ORDER HISTORY & PROJECT TRACKING
        ══════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Guest / Client Lookup Bar */}
            <div style={{
              background: cardBg,
              borderRadius: 20,
              padding: 18,
              border: `1px solid ${cardBorder}`
            }}>
              <form onSubmit={handlePerformLookup} style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Lacak pesanan: Masukkan ID Pesanan (TRX-...), No. WA, atau Email..."
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      borderRadius: 100,
                      border: `1.5px solid ${cardBorder}`,
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                      color: textColor,
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  style={{
                    padding: '11px 22px',
                    borderRadius: 100,
                    border: 'none',
                    background: accentColor,
                    color: '#ffffff',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: (isSearching || !searchQuery.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isSearching || !searchQuery.trim()) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: `0 4px 14px ${accentColor}40`
                  }}
                >
                  {isSearching ? <RefreshCw size={15} className="animate-spin" /> : <><span>Lacak</span><ArrowRight size={15} /></>}
                </button>
              </form>

              {!client && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: subTextColor }}>
                  <span>Sudah punya akun resmi di sumr.day?</span>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: accentColor,
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    Masuk ke Akun Saya untuk melihat semua pesanan
                  </button>
                </div>
              )}
            </div>

            {/* 3-Step Guided Post-Purchase Card */}
            <div style={{
              background: isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.05)',
              border: `1.5px solid ${accentColor}30`,
              borderRadius: 20,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color={accentColor} />
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13.5, fontWeight: 800, color: textColor }}>
                    Panduan Alur Cepat Setelah Pesan (3 Langkah Mudah)
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: `${accentColor}20`, color: accentColor }}>
                  Alur Klien sumr.day
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 10
              }}>
                {/* Step 1 */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${accentColor}18`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor }}>Transfer & WA Admin</div>
                    <div style={{ fontSize: 11, color: subTextColor, marginTop: 2, lineHeight: 1.4 }}>
                      Kirim bukti transfer sesuai 3 digit kode unik agar diverifikasi instan.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(14, 165, 233, 0.18)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
                    2
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor }}>Serahkan Materi</div>
                    <div style={{ fontSize: 11, color: subTextColor, marginTop: 2, lineHeight: 1.4 }}>
                      Punya logo, foto produk, atau dokumen brief?
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/drop')}
                      style={{
                        marginTop: 6,
                        padding: '4px 10px',
                        borderRadius: 100,
                        border: '1px solid rgba(14, 165, 233, 0.3)',
                        background: 'rgba(14, 165, 233, 0.1)',
                        color: '#0ea5e9',
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Upload size={10} /> Buka Asset Drop (/drop)
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
                    3
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: textColor }}>Pantau Progres Live</div>
                    <div style={{ fontSize: 11, color: subTextColor, marginTop: 2, lineHeight: 1.4 }}>
                      Cek status 5 tahapan milestone dan ACC hasil desain di kanvas.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders List */}
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: subTextColor, fontSize: 13.5 }}>
                <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 12px', color: accentColor }} />
                <div>Memuat data pesanan & progres pengerjaan proyek...</div>
              </div>
            ) : displayedOrders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: cardBg,
                borderRadius: 24,
                border: `1.5px dashed ${cardBorder}`,
                maxWidth: 540,
                margin: '0 auto'
              }}>
                <Package size={44} style={{ color: subTextColor, opacity: 0.4, marginBottom: 12 }} />
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: textColor, margin: '0 0 6px' }}>
                  {hasSearched ? 'Pesanan Tidak Ditemukan' : 'Belum Ada Riwayat Pesanan'}
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: subTextColor, margin: '0 0 18px', lineHeight: 1.5 }}>
                  {hasSearched
                    ? 'Pastikan ID pesanan, nomor WhatsApp, atau email yang Anda masukkan sudah persis sesuai saat memesan.'
                    : 'Pesanan Anda setelah checkout akan otomatis tercatat dan dapat dilacak progresnya di halaman ini.'}
                </p>
                <button
                  onClick={() => navigate('/katalog')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 100,
                    background: accentColor,
                    color: '#ffffff',
                    border: 'none',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Store size={14} /> Jelajahi Katalog
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {displayedOrders.map((o) => {
                  const isExpanded = expandedOrderId === o.id;
                  const isPreOrderOrder = o.orderType === 'preorder' || Boolean(o.preOrderBatch) || o.productName.toLowerCase().includes('pre-order') || o.productName.toLowerCase().includes('merch');
                  const isServiceOrder = !isPreOrderOrder && (o.orderType === 'jasa' || o.paymentScheme === 'dp' || isServiceProduct({ name: o.productName, category: '' }));
                  const isDpActive = o.paymentScheme === 'dp' || Boolean(o.dpAmount) || o.paymentStatus === 'dp';
                  const dpVal = o.dpAmount || Math.round(o.total * 0.5);
                  const remainingVal = o.remainingAmount || (o.total - dpVal);

                  // Milestone Step calculation (controlled by Admin via Transaction Manager)
                  let currentStep = o.milestoneStep || 1;
                  if (!o.milestoneStep) {
                    if (o.status === 'Selesai') currentStep = 5;
                    else if (o.status === 'Diproses') currentStep = 3;
                    else if (o.status === 'Pending') currentStep = o.paymentStatus === 'dp' ? 2 : 1;
                  }

                  const activeMilestones = isPreOrderOrder ? PREORDER_MILESTONE_STEPS : MILESTONE_STEPS;

                  return (
                    <div
                      key={o.id}
                      style={{
                        background: cardBg,
                        borderRadius: 20,
                        border: isExpanded ? `1.5px solid ${accentColor}` : `1px solid ${cardBorder}`,
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        transition: 'all 0.2s ease',
                        boxShadow: isExpanded ? '0 8px 24px rgba(124,58,237,0.1)' : 'none'
                      }}
                    >
                      {/* Top Bar */}
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
                        onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: subTextColor, letterSpacing: '0.04em' }}>
                              #{o.id}
                            </span>
                            <span style={{ fontSize: 11, color: subTextColor }}>•</span>
                            <span style={{ fontSize: 11.5, color: subTextColor }}>
                              {formatDate(o.createdAt)}
                            </span>
                            {/* Differentiated System Badge */}
                            {isPreOrderOrder ? (
                              <span style={{ fontSize: 10, fontWeight: 900, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={10} /> Pre-Order
                              </span>
                            ) : isServiceOrder ? (
                              <span style={{ fontSize: 10, fontWeight: 900, background: 'rgba(124,58,237,0.15)', color: '#8b5cf6', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Briefcase size={10} /> Jasa
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, fontWeight: 900, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Package size={10} /> Beli
                              </span>
                            )}
                          </div>

                          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 850, color: textColor }}>
                            {o.productName}
                          </div>

                          {isPreOrderOrder && o.preOrderEstimate && (
                            <div style={{ fontSize: 11.5, color: '#f59e0b', fontWeight: 700, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>Estimasi Pengiriman: {o.preOrderEstimate}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: 100,
                              background: o.status === 'Selesai'
                                ? 'rgba(16,185,129,0.15)'
                                : o.status === 'Diproses'
                                ? 'rgba(245,158,11,0.15)'
                                : 'rgba(124,58,237,0.15)',
                              color: o.status === 'Selesai'
                                ? '#10b981'
                                : o.status === 'Diproses'
                                ? '#f59e0b'
                                : accentColor
                            }}
                          >
                            {o.status || 'Pending'}
                          </span>
                          {isExpanded ? <ChevronUp size={16} color={subTextColor} /> : <ChevronDown size={16} color={subTextColor} />}
                        </div>
                      </div>

                      {/* Summary Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${cardBorder}`, fontSize: 12.5 }}>
                        <div style={{ color: subTextColor }}>
                          {o.paymentMethod || 'Metode Pembayaran'} {o.quantity > 1 ? `(${o.quantity}x)` : ''}
                        </div>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 850, color: accentColor }}>
                          {formatRp(o.total)}
                        </div>
                      </div>

                      {/* ── EXPANDED DETAILS & PROGRESS ── */}
                      {isExpanded && (
                        <div style={{ marginTop: 6, paddingTop: 14, borderTop: `1px dashed ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          
                          {/* PRE-ORDER OR JASA DP & PELUNASAN BREAKDOWN BOX */}
                          {(isServiceOrder || isPreOrderOrder) && (
                            <div style={{
                              background: isPreOrderOrder 
                                ? (isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)')
                                : (isDark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.05)'),
                              borderRadius: 16,
                              border: isPreOrderOrder 
                                ? '1.5px solid rgba(245,158,11,0.25)' 
                                : '1.5px solid rgba(124,58,237,0.25)',
                              padding: 14
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: 12.5, fontWeight: 900, color: isPreOrderOrder ? '#f59e0b' : '#8b5cf6', fontFamily: "'Outfit', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <FileText size={13} /> Termin
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: isPreOrderOrder ? '#f59e0b' : '#7c3aed', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {isDpActive ? <><Clock size={11} /> DP 50%</> : <><CheckCircle2 size={11} /> Lunas</>}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                <div style={{ background: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff', padding: 10, borderRadius: 12, border: `1px solid ${cardBorder}` }}>
                                  <div style={{ fontSize: 11, color: subTextColor }}>
                                    {isPreOrderOrder ? 'Termin 1 (DP 50%):' : 'Termin 1 (DP 50%):'}
                                  </div>
                                  <div style={{ fontSize: 13.5, fontWeight: 900, color: textColor, marginTop: 2 }}>{formatRp(dpVal)}</div>
                                  <div style={{ fontSize: 10.5, fontWeight: 750, color: '#10b981', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle2 size={11} color="#10b981" /> Terverifikasi
                                  </div>
                                </div>
                                <div style={{ background: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff', padding: 10, borderRadius: 12, border: `1px solid ${cardBorder}` }}>
                                  <div style={{ fontSize: 11, color: subTextColor }}>
                                    Termin 2 (Pelunasan):
                                  </div>
                                  <div style={{ fontSize: 13.5, fontWeight: 900, color: isPreOrderOrder ? '#f59e0b' : '#8b5cf6', marginTop: 2 }}>{formatRp(remainingVal)}</div>
                                  <div style={{ fontSize: 10.5, fontWeight: 750, color: o.status === 'Selesai' ? '#10b981' : '#f59e0b', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    {o.status === 'Selesai' ? <><CheckCircle2 size={11} /> Lunas</> : <><Clock size={11} /> Pelunasan</>}
                                  </div>
                                </div>
                              </div>

                              {/* WhatsApp Quick Settlement Button */}
                              {o.status !== 'Selesai' && isDpActive && (
                                <button
                                  onClick={() => handlePaySettlementWA(o)}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    borderRadius: 100,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12.5,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                                  }}
                                >
                                  <Send size={13} />
                                  <span>Pelunasan ({formatRp(remainingVal)})</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* 5-Step Project / Merch Milestone Stepper */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: subTextColor }}>
                                {isPreOrderOrder ? 'Tahapan Produksi & Pengiriman Merch' : 'Progres Tahapan Proyek / Pesanan'}
                              </span>
                              <span style={{ fontSize: 11.5, fontWeight: 800, color: isPreOrderOrder ? '#f59e0b' : accentColor }}>
                                Step {Math.min(currentStep, 5)} / 5
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {activeMilestones.map((m) => {
                                const isDone = currentStep > m.step || currentStep === 5;
                                const isCurrent = currentStep === m.step && currentStep !== 5;
                                const StepIcon = m.icon;

                                return (
                                  <div
                                    key={m.step}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 12,
                                      padding: '8px 12px',
                                      borderRadius: 12,
                                      background: isCurrent
                                        ? (isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.08)')
                                        : isDone
                                        ? (isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)')
                                        : 'transparent',
                                      border: isCurrent ? `1px solid ${accentColor}40` : '1px solid transparent'
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: '50%',
                                        background: isDone
                                          ? '#10b981'
                                          : isCurrent
                                          ? accentColor
                                          : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                        color: isDone || isCurrent ? '#ffffff' : subTextColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        flexShrink: 0
                                      }}
                                    >
                                      {isDone ? <Check size={13} /> : <StepIcon size={13} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 12.5, fontWeight: isCurrent ? 800 : 700, color: isCurrent ? accentColor : isDone ? textColor : subTextColor }}>
                                        {m.label}
                                      </div>
                                      <div style={{ fontSize: 11, color: subTextColor }}>{m.sublabel}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Digital Download Asset Button if applicable */}
                          {o.downloadUrl && (
                            <a
                              href={o.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              style={{
                                padding: '10px 16px',
                                borderRadius: 12,
                                background: '#10b981',
                                color: '#ffffff',
                                textDecoration: 'none',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12.5,
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 7,
                                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                              }}
                            >
                              <Download size={14} />
                              <span>Unduh Aset Digital ({o.fileFormat || 'File'})</span>
                            </a>
                          )}

                            {/* Consultation & Drop Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <button
                                onClick={() => navigate(`/drop/${o.id}`)}
                                style={{
                                  width: '100%',
                                  padding: '9px 14px',
                                  borderRadius: 100,
                                  border: '1px solid rgba(14, 165, 233, 0.3)',
                                  background: 'rgba(14, 165, 233, 0.12)',
                                  color: '#0ea5e9',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6
                                }}
                              >
                                <Upload size={13} /> Kirim Berkas & Lacak Live (/drop)
                              </button>

                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => {
                                    window.dispatchEvent(
                                      new CustomEvent('porto_open_chat', {
                                        detail: {
                                          service: o.productName,
                                          message: `Halo studio, saya ingin menanyakan update progres pesanan #${o.id} (${o.productName}).`
                                        }
                                      })
                                    );
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '9px 14px',
                                    borderRadius: 100,
                                    border: `1px solid ${accentColor}40`,
                                    background: `${accentColor}12`,
                                    color: accentColor,
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12.5,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                  }}
                                >
                                  <MessageCircle size={14} /> Live Chat Studio
                                </button>

                                <button
                                  onClick={() => {
                                    const rawWa = (businessProfile?.whatsapp || shopSettings?.whatsappNumber || '6281234567890').toString().replace(/\D/g, '');
                                    const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa;
                                    const text = encodeURIComponent(`Halo sumr.day Studio, saya ingin menanyakan update proyek #${o.id} (${o.productName}).`);
                                    window.open(`https://wa.me/${cleanWa}?text=${text}`, '_blank');
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '9px 14px',
                                    borderRadius: 100,
                                    border: '1px solid rgba(37,211,102,0.3)',
                                    background: 'rgba(37,211,102,0.1)',
                                    color: '#25d366',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 12.5,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                  }}
                                >
                                  <Send size={13} /> Tanya via WA
                                </button>
                              </div>
                            </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── MOBILE STICKY BOTTOM CHECKOUT BAR ── */}
      {activeTab === 'cart' && cart.length > 0 && (
        <div className="sumr-sticky-checkout-bar" role="region" aria-label="Aksi Checkout Cepat">
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isDpEligible && paymentScheme === 'dp' ? 'DP Masuk' : 'Total Tagihan'}
              </span>
              {isDpEligible && paymentScheme === 'dp' && (
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  padding: '1px 6px',
                  borderRadius: 6,
                  lineHeight: 1.3
                }}>
                  DP 50%
                </span>
              )}
            </div>
            <div style={{
              fontSize: 17,
              fontWeight: 900,
              color: accentColor,
              fontFamily: "'Outfit', sans-serif",
              lineHeight: 1.2,
              letterSpacing: '-0.02em'
            }}>
              {formatRp(totalTransferNow)}
            </div>
          </div>

          <button
            onClick={handleStickyCheckoutClick}
            disabled={isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 44,
              padding: '0 20px',
              borderRadius: 100,
              border: 'none',
              background: accentColor,
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 850,
              fontFamily: "'Outfit', sans-serif",
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: `0 6px 18px ${accentColor}45`,
              flexShrink: 0,
              transition: 'all 0.18s ease'
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={15} />
                <span>
                  {isDpEligible && paymentScheme === 'dp'
                    ? (hasPreOrderInCart && hasServiceInCart 
                        ? 'Gas DP' 
                        : (hasPreOrderInCart ? 'Gas Pre-Order' : 'Gas Pesan'))
                    : 'Bungkus Yuk'}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
