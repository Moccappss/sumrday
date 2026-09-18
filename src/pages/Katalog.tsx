import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowUpRight, ArrowLeft, Tag, Image as ImageIcon, 
  CheckCircle2, Ticket, Package, ShoppingCart, X, CreditCard, MessageCircle,
  SlidersHorizontal, Share2, Plus, Minus, Check, Heart, Trash2, ShoppingBag,
  Sparkles, Search, ShieldCheck, Zap, Layers, ChevronLeft, ChevronRight,
  Maximize2, Minimize2
} from 'lucide-react';
import { storage } from '../utils/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useLandingData } from '../components/landing/useLandingData';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import SEOHelmet from '../components/SEOHelmet';
import { useToast } from '../context/ToastContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { useClientAuth } from '../context/ClientAuthContext';
import { saveClientOrder } from '../services/clientAuth';
import PageHeroHeader from '../components/common/PageHeroHeader';
import ProductDetailModal from '../components/katalog/ProductDetailModal';
import { haptic } from '../utils/haptics';
import { useBusinessProfile } from '../hooks/useBusinessProfile';

const genChatId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

interface CartItem {
  id: string; // unique cart line id
  productId: string;
  name: string;
  image?: string;
  price: number;
  originalPrice?: number;
  variantId?: string;
  variantName?: string;
  quantity: number;
}

export default function Katalog() {
  const navigate = useNavigate();
  const { data } = useLandingData();
  const { profile: businessProfile } = useBusinessProfile();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [cmsCategories, setCmsCategories] = useState<any[]>([]);
  const [shopSettings, setShopSettings] = useState<any>({});
  const [, setDataLoading] = useState(true);

  // Sorting & search state
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name'>('newest');
  const [quantity, setQuantity] = useState(1);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const initialCategory = (() => {
    const fromParam = searchParams.get('category');
    if (fromParam) return decodeURIComponent(fromParam);
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 1 && parts[0] === 'katalog') {
      return decodeURIComponent(parts[1]);
    }
    return 'Semua';
  })();
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('porto_client_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('porto_client_wishlist');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);

  // Force body/html/root scrollable (overrides global CMS fixed-body CSS)
  useLandingBodyFix();

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('porto_client_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Save Wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('porto_client_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // Listen to cross-component drawer trigger events & URL params
  useEffect(() => {
    const handleOpenCart = () => setShowCartDrawer(true);
    const handleOpenWishlist = () => setShowWishlistDrawer(true);

    window.addEventListener('porto_open_cart', handleOpenCart);
    window.addEventListener('porto_open_wishlist', handleOpenWishlist);

    const params = new URLSearchParams(location.search);
    if (params.get('openCart') === 'true') {
      try {
        const raw = localStorage.getItem('porto_client_cart');
        if (raw) setCart(JSON.parse(raw));
      } catch {}
      setShowCartDrawer(true);
    }
    const q = params.get('search') || params.get('q');
    if (q) setSearchQuery(q);
    const cat = params.get('category');
    if (cat) setActiveCategory(decodeURIComponent(cat));

    return () => {
      window.removeEventListener('porto_open_cart', handleOpenCart);
      window.removeEventListener('porto_open_wishlist', handleOpenWishlist);
    };
  }, [location.search]);

  useScrollReveal(containerRef, [products, activeCategory, searchQuery, sortBy]);

  // Unified website theme hook
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const { client } = useClientAuth();

  const accentColor = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || data?.theme?.accentColor || '#7c3aed';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const pageBg = isDark ? '#08080f' : '#ffffff';

  // Detail Page State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isDetailFullScreen, setIsDetailFullScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Synchronize category & product deep link from URL (/katalog/p/:id or /katalog/:category)
  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    // Handle product deep links, e.g. /katalog/p/prod-123 or /katalog/item/prod-123
    let pId: string | null = null;
    let cat = 'Semua';

    const pIdx = parts.indexOf('p');
    const itemIdx = parts.indexOf('item');
    const activePIdx = pIdx !== -1 ? pIdx : itemIdx;

    if (activePIdx !== -1 && parts[activePIdx + 1]) {
      pId = decodeURIComponent(parts[activePIdx + 1]);
      if (activePIdx > 1) {
        cat = decodeURIComponent(parts[1]);
      }
    } else if (parts.length > 1 && parts[0] === 'katalog') {
      cat = decodeURIComponent(parts[1]);
    }

    if (cat !== activeCategory && activePIdx === -1) {
      setActiveCategory(cat);
    }

    if (pId && products.length > 0) {
      const found = products.find((p: any) => p.id === pId || (p.slug && p.slug === pId));
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, [location.pathname, products]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'Semua') {
      navigate('/katalog');
    } else {
      navigate(`/katalog/${encodeURIComponent(cat)}`);
    }
  };

  const openProductDetail = (prod: any) => {
    setSelectedProduct(prod);
    setSelectedVariant(null);
    setActiveImageIdx(0);
    setQuantity(1);
    if (activeCategory && activeCategory !== 'Semua') {
      navigate(`/katalog/${encodeURIComponent(activeCategory)}/p/${prod.id}`);
    } else {
      navigate(`/katalog/p/${prod.id}`);
    }
  };

  // Voucher State
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherMessage, setVoucherMessage] = useState({ type: '', text: '' });

  // Checkout Mode: 'direct' (single item from detail) or 'cart' (all items in cart)
  const [checkoutMode, setCheckoutMode] = useState<'direct' | 'cart'>('direct');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', email: '', address: '', notes: '', paymentMethodId: '' });

  // 3-Digit Unique Verification Code for Cart Checkout
  const [cartUniqueCode, setCartUniqueCode] = useState(() => Math.floor(Math.random() * 899) + 100);
  useEffect(() => {
    if (showCheckout && checkoutMode === 'cart') {
      setCartUniqueCode(Math.floor(Math.random() * 899) + 100);
    }
  }, [showCheckout, checkoutMode]);

  // Flash Sale Live Countdown Timer
  const [flashTimeLeft, setFlashTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  useEffect(() => {
    if (!shopSettings?.flashSaleActive || !shopSettings?.flashSaleEndTime) {
      setFlashTimeLeft(null);
      return;
    }
    const updateTimer = () => {
      const diff = new Date(shopSettings.flashSaleEndTime).getTime() - Date.now();
      if (diff <= 0) {
        setFlashTimeLeft(null);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setFlashTimeLeft({ hours, minutes, seconds });
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [shopSettings?.flashSaleActive, shopSettings?.flashSaleEndTime]);

  // Auto-fill checkout form with logged-in Client data
  useEffect(() => {
    if (client) {
      setCheckoutForm((prev) => ({
        ...prev,
        name: prev.name || client.name || '',
      }));
    }
  }, [client, showCheckout]);

  // Auto-hide floating LiveChat launcher button when any modal/drawer is open
  useEffect(() => {
    const isAnyModalActive = !!selectedProduct || showCartDrawer || showWishlistDrawer || showCheckout;
    window.dispatchEvent(new CustomEvent('porto_chat_visibility', { detail: { visible: !isAnyModalActive } }));
    return () => {
      window.dispatchEvent(new CustomEvent('porto_chat_visibility', { detail: { visible: true } }));
    };
  }, [selectedProduct, showCartDrawer, showWishlistDrawer, showCheckout]);

  useEffect(() => {
    let loads = 0;
    const checkLoaded = () => { loads++; if(loads >= 4) setDataLoading(false); };
    
    storage.getItem('porto_catalog_products', []).then(d => {
      setProducts((d || []).filter((p: any) => p.isPublished));
      checkLoaded();
    });
    storage.getItem('porto_catalog_categories', []).then(d => {
      setCmsCategories((d || []).filter((c: any) => c.isActive));
      checkLoaded();
    });
    storage.getItem('porto_catalog_vouchers', []).then(d => {
      setVouchers((d || []).filter((v: any) => v.isActive));
      checkLoaded();
    });
    storage.getItem('porto_settings', {}).then(d => {
      storage.getItem('porto_shop_settings', null).then(shopS => {
        if (shopS) {
          setShopSettings(shopS);
        } else if (d && d.shopSettings) {
          setShopSettings(d.shopSettings);
        }
      });
      checkLoaded();
    });
  }, []);

  const uniqueProductCategories = [...new Set(products.map((p: any) => p.category).filter(Boolean))];
  const categories = ['Semua', ...new Set([...cmsCategories.map(c => c.name), ...uniqueProductCategories])];

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    const list = products.filter((p: any) => {
      const matchCategory = activeCategory === 'Semua' || (p.category || '').toLowerCase() === activeCategory.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0; // default order / newest
    });
  }, [products, activeCategory, searchQuery, sortBy]);

  // Wishlist Toggle
  const toggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.light();
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Dihapus dari Favorit', 'Produk dihapus dari daftar keinginan Anda.', 'info');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Ditambahkan ke Favorit ❤️', 'Produk disimpan di daftar keinginan Anda.', 'success');
        return [...prev, productId];
      }
    });
  };

  // Cart Operations
  const addToCart = (product: any, variant: any = null, qty: number = 1) => {
    haptic.medium();
    const unitPrice = variant && variant.price > 0 ? variant.price : product.price;
    const cartItemId = `${product.id}_${variant?.id || 'main'}`;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === cartItemId);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += qty;
        return next;
      } else {
        return [
          ...prev,
          {
            id: cartItemId,
            productId: product.id,
            name: product.name,
            image: product.gallery?.[0] || '',
            price: unitPrice,
            originalPrice: product.originalPrice,
            variantId: variant?.id || null,
            variantName: variant?.name || null,
            quantity: qty
          }
        ];
      }
    });

    showToast('Dimasukkan ke Keranjang 🛒', `${product.name} (${qty}x) telah masuk keranjang.`, 'success');
  };

  const updateCartQty = (itemId: string, delta: number) => {
    haptic.light();
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    haptic.light();
    setCart(prev => prev.filter(item => item.id !== itemId));
    showToast('Item Dihapus', 'Produk telah dikeluarkan dari keranjang.', 'info');
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    const found = vouchers.find((v: any) => v.code === code);
    if (!found) {
      setVoucherMessage({ type: 'error', text: 'Kode promo tidak valid.' });
      setAppliedVoucher(null);
      showToast('Kode promo tidak valid', 'Periksa kembali ejaan voucher Anda.', 'error');
      return;
    }
    if (found.quota !== undefined && found.quota !== null && found.quota <= 0) {
      setVoucherMessage({ type: 'error', text: 'Kuota promo telah habis.' });
      setAppliedVoucher(null);
      showToast('Kuota promo habis', 'Silakan gunakan voucher lainnya.', 'warning');
      return;
    }
    setAppliedVoucher(found);
    setVoucherMessage({ type: 'success', text: `Promo ${found.code} berhasil digunakan!` });
    showToast('Promo Berhasil Diterapkan!', `Diskon ${found.discountType === 'percent' ? found.discountValue + '%' : formatRp(found.discountValue)} aktif.`, 'success');
  };

  const copyProductLink = (prod: any) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Tautan Disalin!', `Link produk ${prod.name} siap dibagikan.`, 'success');
    }
  };

  const handleAskProduct = (priceToPay: number) => {
    if (!selectedProduct) return;
    const prod = selectedProduct;
    const currentId = client ? `client_chat_${client.id}` : (localStorage.getItem('porto_guest_id') || genChatId());
    if (!localStorage.getItem('porto_guest_id')) localStorage.setItem('porto_guest_id', currentId);

    const initialText = `Halo admin, saya tertarik dengan produk *${prod.name}*${selectedVariant ? ` (Varian: ${selectedVariant.name})` : ''} seharga *${formatRp(priceToPay)}*. Apakah produk ini masih tersedia?`;

    setDoc(doc(db, 'porto_conversations', currentId), {
      userName: client?.name || 'Pengunjung',
      userEmail: client?.email || '',
      clientId: client?.id || null,
      avatar: client?.avatar || null,
      lastMessage: initialText,
      lastMessageTime: serverTimestamp(),
      source: 'shop',
      unread: 1,
      online: true
    }, { merge: true }).catch(() => {});

    import('firebase/firestore').then(({ addDoc, collection }) => {
      addDoc(collection(db, 'porto_messages'), {
        roomId: currentId,
        senderId: currentId,
        senderType: 'client',
        senderName: client?.name || 'Pengunjung',
        senderEmail: client?.email || '',
        avatar: client?.avatar || null,
        text: initialText,
        productAttachment: {
          id: prod.id,
          name: prod.name,
          variant: selectedVariant?.name || '',
          price: priceToPay,
          image: prod.gallery?.[0] || ''
        },
        timestamp: serverTimestamp()
      }).catch(() => {});
    });

    setSelectedProduct(null);
    window.dispatchEvent(new CustomEvent('porto_open_chat'));
  };

  // Submit Order (Supports both direct 1-item checkout and multi-item cart checkout)
  const submitOrder = async (basePriceToPay: number, itemsToOrder: any[], uniqueCodeNum: number = 0) => {
    if (!checkoutForm.name || !checkoutForm.phone) {
      showToast('Data Belum Lengkap', 'Mohon isi Nama Lengkap dan Nomor WhatsApp.', 'error');
      return;
    }
    if ((data?.shopSettings?.paymentMethods?.length > 0 || shopSettings?.qrisImageUrl) && !checkoutForm.paymentMethodId) {
      showToast('Pilih Pembayaran', 'Mohon pilih salah satu metode pembayaran.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const code = uniqueCodeNum > 0 ? uniqueCodeNum : (Math.floor(Math.random() * 899) + 100);
      const trxId = `TRX-${Date.now().toString().slice(-6)}`;
      const finalTotal = basePriceToPay + code;
      
      const newTrx = {
        id: trxId,
        uniqueCode: code,
        date: new Date().toISOString().slice(0, 10),
        customer: { 
          id: `CUS-${Date.now()}`, 
          name: checkoutForm.name, 
          phone: checkoutForm.phone, 
          email: checkoutForm.email || '-', 
          address: checkoutForm.address || '-' 
        },
        items: itemsToOrder.map(item => {
          const matchedProd = products.find((p: any) => p.id === (item.productId || item.id));
          return {
            id: item.productId || item.id,
            name: item.name + (item.variantName ? ` (${item.variantName})` : ''),
            sku: item.sku || matchedProd?.productCode || '',
            price: item.price,
            qty: item.quantity || item.qty || 1,
            image: item.image || item.gallery?.[0] || matchedProd?.gallery?.[0] || '',
            downloadUrl: item.downloadUrl || matchedProd?.downloadUrl || '',
            fileFormat: item.fileFormat || matchedProd?.fileFormat || 'ZIP',
            fileSize: item.fileSize || matchedProd?.fileSize || '',
            instantDeliveryMessage: item.instantDeliveryMessage || matchedProd?.instantDeliveryMessage || '',
            isDigitalAsset: item.isDigitalAsset || matchedProd?.type === 'Digital' || !!matchedProd?.downloadUrl
          };
        }),
        discount: appliedVoucher ? { 
          type: appliedVoucher.discountType, 
          value: appliedVoucher.discountValue, 
          label: appliedVoucher.code 
        } : { type: 'percent', value: 0, label: '' },
        shipping: 0,
        tax: { enabled: false, percent: 11 },
        paymentStatus: 'belum',
        dpAmount: 0,
        notes: checkoutForm.notes || checkoutForm.address || '-',
        termin: [],
        paymentMethod: checkoutForm.paymentMethodId === 'qris_toko' 
          ? { id: 'qris_toko', bankName: 'QRIS Instan (Bebas Biaya)', accountNumber: 'Scan Barcode QRIS', accountName: shopSettings?.qrisMerchantName || 'Merchant QRIS' }
          : (checkoutForm.paymentMethodId ? data?.shopSettings?.paymentMethods?.find((p: any) => p.id === checkoutForm.paymentMethodId) : null),
        mou: { enabled: false, title: '', content: '', date: new Date().toISOString().slice(0, 10) },
        attachment: '',
        grandTotal: finalTotal,
        source: 'website'
      };

      const existingTrx = await storage.getItem('porto_transactions', []);
      await storage.setItem('porto_transactions', [newTrx, ...existingTrx]);

      const existingCus = await storage.getItem('porto_trx_customers', []);
      if (!existingCus.find((c: any) => c.phone === checkoutForm.phone)) {
         await storage.setItem('porto_trx_customers', [newTrx.customer, ...existingCus]);
      }

      // If client is logged in, also record each item in Client Orders history
      if (client) {
        for (const itm of itemsToOrder) {
          const matchedProd = products.find((p: any) => p.id === (itm.productId || item.id));
          saveClientOrder({
            clientId: client.id,
            clientName: checkoutForm.name,
            clientPhone: checkoutForm.phone,
            clientEmail: checkoutForm.email || client.email,
            productName: itm.name,
            productId: itm.productId || itm.id,
            variantName: itm.variantName || '',
            price: itm.price,
            quantity: itm.quantity || itm.qty || 1,
            total: itm.price * (itm.quantity || itm.qty || 1),
            status: 'Pending',
            paymentMethod: checkoutForm.paymentMethodId === 'qris_toko' ? 'QRIS Instan' : (newTrx.paymentMethod?.bankName || 'WhatsApp Checkout'),
            notes: checkoutForm.address || '',
            downloadUrl: itm.downloadUrl || matchedProd?.downloadUrl || '',
            fileFormat: itm.fileFormat || matchedProd?.fileFormat || 'ZIP',
            fileSize: itm.fileSize || matchedProd?.fileSize || '',
            instantDeliveryMessage: itm.instantDeliveryMessage || matchedProd?.instantDeliveryMessage || '',
            isDigitalAsset: itm.isDigitalAsset || matchedProd?.type === 'Digital' || !!matchedProd?.downloadUrl
          }).catch((e) => console.warn('Save client order error:', e));
        }
      }

      // Format WhatsApp message detail
      const detailPesanan = itemsToOrder.map(item => 
        `• ${item.name}${item.variantName ? ` (${item.variantName})` : ''} (${item.quantity || item.qty || 1}x) - ${formatRp(item.price * (item.quantity || item.qty || 1))}`
      ).join('\n');

      const paymentList = (data?.shopSettings?.paymentMethods?.length > 0 ? data.shopSettings.paymentMethods : (businessProfile?.bankAccounts || []));
      const qrisMerchantName = shopSettings?.qrisMerchantName || businessProfile?.qris?.merchantName || businessProfile?.brandName || 'SUMR.DAY STUDIO';

      const selectedPayment = checkoutForm.paymentMethodId === 'qris_toko'
        ? `QRIS Instan (Scan Barcode Toko - ${qrisMerchantName} - 0% Fee)`
        : (paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId)
           ? `${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).bankName} - ${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).accountNumber} (A.n ${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).accountName})`
           : 'Transfer Bank');

      const rawWa = (businessProfile?.whatsapp || shopSettings?.whatsappNumber || data?.shopSettings?.whatsappNumber || data?.footer?.whatsappNumber || '6281234567890').toString().replace(/[^0-9]/g, '');
      const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa;

      const template = `Halo sumr.day team! ☀️ Saya telah melakukan pemesanan dari katalog:

🛒 *NOMOR PESANAN:* ${trxId}
👤 *Nama Pemesan:* ${checkoutForm.name}
📱 *No. WhatsApp:* ${checkoutForm.phone}
${checkoutForm.address ? `📍 *Catatan / Alamat:* ${checkoutForm.address}\n` : ''}
📦 *Detail Pesanan:*
${detailPesanan}

🔢 *Kode Unik Verifikasi:* +Rp ${code}
💰 *TOTAL TRANSFER:* ${formatRp(finalTotal)} *(Wajib persis hingga 3 digit terakhir)*
💳 *Metode Pembayaran:* ${selectedPayment}

📎 *Bukti Pembayaran:* (Foto struk / bukti transfer terlampir di bawah ini)

Mohon diperiksa di mutasi banknya ya min. Setelah status di-acc Lunas, berkas digital saya akan otomatis aktif di menu Akun Saya (/akun). Terima kasih!`;

      const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(template)}`;
      window.open(waUrl, '_blank');
      
      showToast('Pesanan Berhasil!', 'Mengarahkan ke WhatsApp admin...', 'success');
      
      // If was checking out from cart, clear cart
      if (checkoutMode === 'cart') {
        setCart([]);
        setShowCartDrawer(false);
      }
      setShowCheckout(false);
      setSelectedProduct(null);
      
    } catch (err) {
      console.error(err);
      showToast('Gagal Membuat Pesanan', 'Terjadi kesalahan sistem, silakan coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        display: 'flex', 
        flexDirection: 'column', 
        color: textColor,
        transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        scrollBehavior: 'smooth',
      }}
    >
      <SEOHelmet
        title={data?.seo?.metaTitle ? `${data.seo.metaTitle} - Katalog Produk & Layanan` : 'Katalog Produk & Layanan Eksklusif'}
        description={data?.seo?.metaDescription || 'Jelajahi berbagai paket produk desain grafis, aset visual, dan layanan profesional kami.'}
        keywords="katalog, produk digital, jasa desain, merchandise, voucher promo"
      />

      <LPNavbar 
        items={(data?.navbar?.items || []) as any}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        isDark={isDark}
        accentColor={accentColor}
      />

      <main style={{ flex: 1, width: '100%', maxWidth: 1240, margin: '0 auto', padding: isMobile ? '90px 16px 100px' : '120px 24px 100px', boxSizing: 'border-box' }}>
        
        {/* Page Hero Header with Live Search & Dynamic Stats */}
        <PageHeroHeader
          badgeIcon={<ShoppingBag size={14} />}
          badgeText={data?.pagesHeader?.catalog?.badge || 'Katalog Resmi & Solusi Digital'}
          title={data?.pagesHeader?.catalog?.title || 'Koleksi Produk & Layanan Eksklusif'}
          highlightText={data?.pagesHeader?.catalog?.highlight || 'Layanan Eksklusif'}
          description={data?.pagesHeader?.catalog?.description || 'Dapatkan solusi desain berkualitas tinggi, aset digital siap pakai, serta layanan kustom profesional untuk mengembangkan bisnis Anda.'}
          accentColor={accentColor}
          textColor={textColor}
          subTextColor={subTextColor}
          stats={[
            { icon: <ShoppingBag size={15} />, value: products.length, label: 'Total Produk' },
            { icon: <Layers size={15} />, value: Math.max(1, categories.length - 1), label: 'Kategori' },
            { icon: <ArrowUpRight size={15} />, value: filteredProducts.length, label: 'Tersedia' }
          ]}
        >
          {/* Quick Spotlight Search Input Box */}
          <div style={{
            position: 'relative',
            maxWidth: 460,
            margin: '0 auto'
          }}>
            <Search size={16} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk, SKU, layanan, atau kata kunci..."
              style={{
                width: '100%',
                padding: '13px 44px 13px 46px',
                borderRadius: 100,
                border: `1.5px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: textColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(10px)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.boxShadow = `0 0 0 4px ${accentColor}1a`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  border: 'none',
                  color: subTextColor,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Hapus pencarian"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </PageHeroHeader>

        {/* Floating Quick Action Pills: Cart & Wishlist */}
        <div style={{
          position: 'fixed',
          bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 24px))',
          left: 'max(20px, calc(env(safe-area-inset-left, 0px) + 20px))',
          zIndex: 8800,
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}>
          {/* Wishlist Floating Pill */}
          {wishlist.length > 0 && (
            <button
              onClick={() => setShowWishlistDrawer(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 20px',
                borderRadius: 100,
                background: isDark ? 'rgba(30, 41, 59, 0.95)' : '#ffffff',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 10px 25px rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Heart size={16} fill="#ef4444" />
              <span>Favorit ({wishlist.length})</span>
            </button>
          )}

          {/* Cart Floating Pill */}
          {totalCartCount > 0 && (
            <button
              onClick={() => setShowCartDrawer(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 22px',
                borderRadius: 100,
                background: `linear-gradient(135deg, ${accentColor} 0%, #9333ea 100%)`,
                border: 'none',
                boxShadow: `0 12px 32px ${accentColor}50`,
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'cmsPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <ShoppingCart size={17} />
              <span>Keranjang ({totalCartCount})</span>
              <span style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 800 }}>
                {formatRp(cartSubtotal)}
              </span>
            </button>
          )}
        </div>

        {/* Hero Section Banner (CMS Optional Config) */}
        {activeCategory === 'Semua' && (shopSettings.heroBannerTitle || shopSettings.heroBannerImage) && (
          <div 
            data-reveal="true" 
            style={{ 
              borderRadius: 28, 
              background: isDark ? `linear-gradient(135deg, ${accentColor}20 0%, #0c0d14 100%)` : `linear-gradient(135deg, ${accentColor}12 0%, #f4f6fb 100%)`,
              padding: isMobile ? '28px 20px' : '40px 44px',
              marginBottom: isMobile ? 32 : 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 32,
              flexWrap: 'wrap',
              position: 'relative',
              overflow: 'hidden',
              border: `1.5px solid ${isDark ? `${accentColor}30` : cardBorder}`,
              boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4)' : '0 12px 32px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ flex: '1 1 340px', zIndex: 2 }}>
              {shopSettings.heroBannerBadge && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: accentColor, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 100, marginBottom: 14, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  <Sparkles size={12} /> {shopSettings.heroBannerBadge}
                </div>
              )}
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, color: textColor, margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                {shopSettings.heroBannerTitle || 'Katalog Eksklusif'}
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(14px, 2vw, 15px)', color: subTextColor, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 520 }}>
                {shopSettings.heroBannerDesc || 'Dapatkan berbagai layanan grafis berkualitas premium dan produk terbaik untuk kebutuhan bisnis Anda.'}
              </p>
            </div>
            {shopSettings.heroBannerImage && (
              <div style={{ flex: '1 1 280px', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
                <img src={shopSettings.heroBannerImage} alt="" style={{ width: '100%', height: 'auto', minHeight: 180, maxHeight: 300, objectFit: 'cover', borderRadius: 20, boxShadow: '0 16px 36px rgba(0,0,0,0.2)' }} />
              </div>
            )}
          </div>
        )}

        {/* Featured Trending Categories Cards */}
        {activeCategory === 'Semua' && cmsCategories.length > 0 && (
          <div data-reveal="true" style={{ marginBottom: isMobile ? 36 : 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.5px' }}>
                {shopSettings.txtTrendingCategories || 'Kategori Terpopuler'}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 1 : 3}, 1fr)`, gap: isMobile ? 14 : 20, gridAutoRows: isMobile ? 180 : 220 }}>
              {cmsCategories.map((c: any) => {
                const span = isMobile ? 1 : (c.colSpan || 1);
                return (
                  <div 
                    key={c.id} 
                    onClick={() => handleCategoryChange(c.name)} 
                    style={{ 
                      gridColumn: `span ${span}`, borderRadius: 24, overflow: 'hidden', position: 'relative', 
                      cursor: 'pointer', background: cardBg, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', height: '100%',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = `${accentColor}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = cardBorder;
                    }}
                  >
                    {c.image ? (
                       <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, transition: 'transform 0.5s ease' }} />
                    ) : (
                       <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#1e293b' : '#e2e8f0' }}><Package size={36} opacity={0.25} /></div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
                    
                    <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
                       <div>
                         <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Outfit', sans-serif" }}>Kategori</span>
                         <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{c.name}</div>
                       </div>
                       <div style={{ padding: '8px 18px', background: accentColor, color: '#fff', borderRadius: 100, fontSize: 12.5, fontWeight: 800, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 4, boxShadow: `0 4px 14px ${accentColor}50` }}>
                         Jelajahi <ArrowUpRight size={13} />
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Flash Sale Urgency Countdown Banner */}
        {shopSettings?.flashSaleActive && flashTimeLeft && (
          <div 
            data-reveal="true"
            style={{
              marginBottom: 30,
              padding: isMobile ? '16px 16px' : '20px 26px',
              borderRadius: 24,
              background: isDark 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(124, 58, 237, 0.18) 100%)' 
                : 'linear-gradient(135deg, #fff1f2 0%, #f5f3ff 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              boxShadow: '0 12px 30px rgba(239, 68, 68, 0.12)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(239, 68, 68, 0.4)',
                flexShrink: 0
              }}>
                <Zap size={22} fill="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 900, color: textColor }}>
                    {shopSettings.flashSaleTitle || 'Flash Sale Spesial Hari Ini!'}
                  </span>
                  {shopSettings.flashSaleDiscount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#ef4444', padding: '2px 8px', borderRadius: 100, fontFamily: "'Outfit', sans-serif" }}>
                      HEMAT {shopSettings.flashSaleDiscount}%
                    </span>
                  )}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>
                  Penawaran terbatas, manfaatkan promo sebelum hitungan mundur berakhir!
                </p>
              </div>
            </div>

            {/* Live Countdown Clocks */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[
                { val: String(flashTimeLeft.hours).padStart(2, '0'), label: 'JAM' },
                { val: String(flashTimeLeft.minutes).padStart(2, '0'), label: 'MENIT' },
                { val: String(flashTimeLeft.seconds).padStart(2, '0'), label: 'DETIK' }
              ].map((item, idx) => (
                <React.Fragment key={idx}>
                  <div style={{
                    minWidth: 44,
                    padding: '6px 8px',
                    borderRadius: 12,
                    background: isDark ? '#0f1019' : '#ffffff',
                    border: `1px solid ${cardBorder}`,
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>
                      {item.val}
                    </div>
                    <div style={{ fontSize: 8.5, fontWeight: 800, color: subTextColor, marginTop: 3, letterSpacing: '0.04em' }}>
                      {item.label}
                    </div>
                  </div>
                  {idx < 2 && <span style={{ fontWeight: 900, color: '#ef4444', fontSize: 14 }}>:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter Pills Navigation Bar */}
        <div data-reveal="true" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count = cat === 'Semua' ? products.length : products.filter((p: any) => (p.category || '').toLowerCase() === cat.toLowerCase()).length;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: '8px 18px', 
                    borderRadius: 100, 
                    border: `1.5px solid ${isActive ? accentColor : cardBorder}`,
                    background: isActive ? accentColor : (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'), 
                    color: isActive ? '#ffffff' : subTextColor,
                    fontFamily: "'Outfit', sans-serif", 
                    fontSize: 13, 
                    fontWeight: isActive ? 800 : 600, 
                    cursor: 'pointer', 
                    whiteSpace: 'nowrap',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: isActive ? `0 6px 18px ${accentColor}35` : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = textColor;
                      e.currentTarget.style.borderColor = `${accentColor}50`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = subTextColor;
                      e.currentTarget.style.borderColor = cardBorder;
                    }
                  }}
                >
                  <span>{cat === 'Semua' ? '✦ Semua Produk' : cat}</span>
                  <span style={{
                    fontSize: 11,
                    padding: '1px 7px',
                    borderRadius: 100,
                    background: isActive ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    color: isActive ? '#ffffff' : subTextColor,
                    fontWeight: 800
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid Header Controls: Title + Sorting Switcher */}
        <div data-reveal="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          {activeCategory === 'Semua' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.5px' }}>
                {shopSettings.txtProductOfMonth || 'Katalog Produk & Layanan'}
              </h2>
              <span style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: subTextColor, fontWeight: 600 }}>
                ({filteredProducts.length} item)
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                onClick={() => handleCategoryChange('Semua')}
                style={{ width: 38, height: 38, borderRadius: '50%', border: `1.5px solid ${cardBorder}`, background: cardBg, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                title="Kembali ke semua produk"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <span style={{ fontSize: 12, color: subTextColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kategori Aktif</span>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color: textColor, margin: 0, letterSpacing: '-0.5px' }}>
                  {activeCategory}
                </h2>
              </div>
            </div>
          )}

          {/* Sorting Pills Switcher Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: '3px',
              borderRadius: 100,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${cardBorder}`,
              overflowX: 'auto',
              maxWidth: '100%'
            }}>
              {[
                { id: 'newest', label: 'Terbaru' },
                { id: 'price-asc', label: 'Harga Termurah' },
                { id: 'price-desc', label: 'Harga Termahal' },
                { id: 'name', label: 'A-Z' },
              ].map((opt) => {
                const isActive = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      haptic.light();
                      setSortBy(opt.id as any);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      border: 'none',
                      background: isActive ? accentColor : 'transparent',
                      color: isActive ? '#ffffff' : subTextColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isActive ? `0 4px 12px ${accentColor}35` : 'none'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Header Wishlist Button */}
            <button
              onClick={() => setShowWishlistDrawer(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 100,
                border: `1px solid ${cardBorder}`,
                background: cardBg,
                color: wishlist.length > 0 ? '#ef4444' : textColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Lihat Wishlist"
            >
              <Heart size={14} fill={wishlist.length > 0 ? '#ef4444' : 'none'} />
              <span>{wishlist.length}</span>
            </button>

            {/* Quick Header Cart Button */}
            <button
              onClick={() => setShowCartDrawer(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 100,
                border: `1px solid ${totalCartCount > 0 ? accentColor : cardBorder}`,
                background: totalCartCount > 0 ? accentColor : cardBg,
                color: totalCartCount > 0 ? '#ffffff' : textColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: totalCartCount > 0 ? `0 4px 14px ${accentColor}40` : 'none'
              }}
              title="Buka Keranjang Belanja"
            >
              <ShoppingCart size={14} />
              <span>{totalCartCount}</span>
            </button>
          </div>
        </div>

        {/* Products Grid Section */}
        {filteredProducts.length === 0 ? (
          <div data-reveal="true" style={{
            padding: '70px 20px',
            textAlign: 'center',
            background: cardBg,
            borderRadius: 28,
            border: `1.5px dashed ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            margin: '20px 0'
          }}>
            <Package size={42} style={{ color: accentColor, opacity: 0.4 }} />
            <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: textColor }}>
              {shopSettings.txtNoProduct || 'Tidak Ada Produk Ditemukan'}
            </h3>
            <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor, maxWidth: 400, lineHeight: 1.5 }}>
              {searchQuery ? `Tidak ada hasil pencarian untuk "${searchQuery}". Coba kata kunci lain atau reset filter.` : 'Belum ada produk pada kategori ini.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  marginTop: 6,
                  padding: '8px 20px',
                  borderRadius: 100,
                  background: accentColor,
                  color: '#ffffff',
                  border: 'none',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(270px, 1fr))', 
            gap: isMobile ? 12 : 24,
            width: '100%' 
          }}>
            {filteredProducts.map((p: any, idx: number) => {
              const hasDiscount = p.originalPrice > p.price;
              const discountPercent = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
              const isFavorited = wishlist.includes(p.id);

              return (
                <div 
                  key={p.id} 
                  data-reveal="true"
                  className={`reveal-delay-${(idx % 4) + 1} ${idx > 8 ? 'content-visibility-auto' : ''}`}
                  onClick={() => openProductDetail(p)} 
                  style={{ 
                    background: cardBg, 
                    borderRadius: isMobile ? 18 : 24, 
                    overflow: 'hidden', 
                    border: `1px solid ${cardBorder}`, 
                    cursor: 'pointer', 
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-5px)'; 
                    e.currentTarget.style.boxShadow = isDark ? '0 20px 48px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.08)'; 
                    e.currentTarget.style.borderColor = `${accentColor}40`;
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)'; 
                    e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.03)'; 
                    e.currentTarget.style.borderColor = cardBorder;
                  }}
                >
                  {/* Product Image Frame */}
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '1/1', 
                    backgroundColor: isDark ? '#090a12' : '#f8fafc', 
                    position: 'relative', 
                    padding: isMobile ? 8 : 12, 
                    boxSizing: 'border-box', 
                    overflow: 'hidden' 
                  }}>
                    {p.gallery?.[0] ? (
                      <img 
                        src={p.gallery[0]} 
                        alt={p.name} 
                        loading="lazy" 
                        decoding="async"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: isMobile ? 12 : 16, 
                          transition: 'transform 0.5s ease' 
                        }} 
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor, fontFamily: "'Inter', sans-serif", fontSize: 12, borderRadius: isMobile ? 12 : 16, background: isDark ? '#13141f' : '#edf0f6' }}>
                        {shopSettings.txtNoImage || 'Tanpa Gambar'}
                      </div>
                    )}

                    {/* Wishlist Heart Toggle */}
                    <button
                      onClick={(e) => toggleWishlist(p.id, e)}
                      style={{
                        position: 'absolute',
                        top: isMobile ? 14 : 18,
                        right: isMobile ? 14 : 18,
                        width: isMobile ? 30 : 34,
                        height: isMobile ? 30 : 34,
                        borderRadius: '50%',
                        background: isFavorited ? '#ef4444' : 'rgba(0,0,0,0.45)',
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        zIndex: 3,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      title={isFavorited ? "Hapus dari Wishlist" : "Simpan ke Wishlist"}
                    >
                      <Heart size={isMobile ? 14 : 15} fill={isFavorited ? "#ffffff" : "none"} strokeWidth={2.2} />
                    </button>

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div style={{
                        position: 'absolute',
                        top: isMobile ? 14 : 18,
                        left: isMobile ? 14 : 18,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        fontSize: isMobile ? 9 : 10,
                        fontWeight: 800,
                        padding: isMobile ? '3px 8px' : '4px 9px',
                        borderRadius: 100,
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '0.04em',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                        zIndex: 2
                      }}>
                        HEMAT {discountPercent}%
                      </div>
                    )}

                    {(p.type === 'Digital' || p.downloadUrl || p.isDigitalAsset) && (
                      <div style={{
                        position: 'absolute',
                        bottom: isMobile ? 12 : 16,
                        left: isMobile ? 12 : 16,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontSize: isMobile ? 8.5 : 9.5,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 100,
                        fontFamily: "'Outfit', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.45)',
                        zIndex: 2
                      }}>
                        <Zap size={11} fill="#fff" /> INSTANT DOWNLOAD
                      </div>
                    )}

                    {(p.type === 'Add-on' || p.isAddon) && (
                      <div style={{
                        position: 'absolute',
                        bottom: isMobile ? 12 : 16,
                        left: isMobile ? 12 : 16,
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: '#ffffff',
                        fontSize: isMobile ? 8.5 : 9.5,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 100,
                        fontFamily: "'Outfit', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.45)',
                        zIndex: 2
                      }}>
                        <Sparkles size={11} fill="#fff" /> ADD-ON EKSTRA
                      </div>
                    )}
                  </div>

                  {/* Card Content & Pricing */}
                  <div style={{ 
                    padding: isMobile ? '10px 12px 14px' : '16px 20px 20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1, 
                    background: cardBg 
                  }}>
                    {/* Category Label */}
                    <div style={{ 
                      fontSize: isMobile ? 10 : 11, 
                      fontWeight: 800, 
                      color: accentColor, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.06em', 
                      fontFamily: "'Outfit', sans-serif", 
                      marginBottom: 3 
                    }}>
                      {p.category || 'Umum'}
                    </div>

                    {/* Product Name */}
                    <h3 style={{ 
                      fontFamily: "'Outfit', sans-serif", 
                      fontSize: isMobile ? 13.5 : 16, 
                      fontWeight: 800, 
                      color: textColor, 
                      margin: isMobile ? '0 0 6px' : '0 0 10px', 
                      lineHeight: 1.3, 
                      letterSpacing: '-0.2px',
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden',
                      minHeight: isMobile ? '34px' : '42px'
                    }}>
                      {p.name}
                    </h3>

                    {/* Price Section */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'baseline', 
                      gap: isMobile ? 1 : 8, 
                      marginBottom: isMobile ? 10 : 16 
                    }}>
                      <span style={{ 
                        fontFamily: "'Outfit', sans-serif", 
                        fontSize: isMobile ? 15 : 19, 
                        fontWeight: 900, 
                        color: accentColor, 
                        letterSpacing: '-0.3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%'
                      }}>
                        {formatRp(p.price)}
                      </span>
                      {hasDiscount && (
                        <span style={{ 
                          fontSize: isMobile ? 10.5 : 12, 
                          fontWeight: 600, 
                          color: '#ef4444', 
                          textDecoration: 'line-through',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%'
                        }}>
                          {formatRp(p.originalPrice)}
                        </span>
                      )}
                    </div>
                    
                    {/* Action Buttons: Cart Button + Detail Button */}
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
                      {/* Add to Cart Icon Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.medium();
                          addToCart(p, null, 1);
                        }}
                        style={{
                          width: isMobile ? 34 : 38,
                          height: isMobile ? 34 : 38,
                          borderRadius: isMobile ? 10 : '50%',
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          border: `1.5px solid ${cardBorder}`,
                          color: textColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.06)';
                          e.currentTarget.style.borderColor = accentColor;
                          e.currentTarget.style.color = accentColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderColor = cardBorder;
                          e.currentTarget.style.color = textColor;
                        }}
                        title="Tambah ke Keranjang"
                      >
                        <ShoppingCart size={isMobile ? 14 : 16} />
                      </button>

                      {/* View Detail Primary Button */}
                      <button 
                        onClick={() => openProductDetail(p)}
                        style={{ 
                          flex: 1, 
                          height: isMobile ? 34 : 38, 
                          borderRadius: 100, 
                          background: accentColor, 
                          color: '#fff', 
                          border: 'none', 
                          fontFamily: "'Outfit', sans-serif", 
                          fontSize: isMobile ? 11.5 : 12.5, 
                          fontWeight: 800, 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          boxShadow: `0 4px 14px ${accentColor}35`,
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          minWidth: 0,
                          padding: '0 8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Detail</span> 
                        <ArrowUpRight size={13} style={{ flexShrink: 0 }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <LPFooter isDark={isDark} accentColor={accentColor} data={data.footer} />

      {/* --- CART DRAWER MODAL --- */}
      {showCartDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99990, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowCartDrawer(false)} />
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 440,
            height: '100dvh',
            background: isDark ? '#0c0d14' : '#ffffff',
            borderLeft: `1.5px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
            animation: 'cmsFadeIn 0.25s ease'
          }}>
            {/* Cart Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: cardBg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingCart size={20} color={accentColor} />
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: textColor }}>Keranjang Belanja</h3>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: accentColor, color: '#fff', fontWeight: 800 }}>
                  {totalCartCount} item
                </span>
              </div>
              <button onClick={() => setShowCartDrawer(false)} style={{ background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '70px 20px' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.2, margin: '0 auto 16px', color: accentColor }} />
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 800, color: textColor }}>Keranjang Anda Kosong</div>
                  <p style={{ fontSize: 13, color: subTextColor, marginTop: 6, lineHeight: 1.5 }}>Pilih produk dari katalog kami untuk mulai melakukan pemesanan.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 18, border: `1px solid ${cardBorder}`, alignItems: 'center' }}>
                    <img src={item.image || 'https://placehold.co/100x100?text=Produk'} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      {item.variantName && (
                        <div style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>Varian: {item.variantName}</div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 800, color: accentColor, marginTop: 3 }}>
                        {formatRp(item.price)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => updateCartQty(item.id, -1)} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${cardBorder}`, background: cardBg, color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${cardBorder}`, background: cardBg, color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, marginLeft: 4 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer / Checkout Button */}
            {cart.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: `1px solid ${cardBorder}`, background: cardBg, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: subTextColor, fontWeight: 600 }}>Total Subtotal:</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, color: accentColor }}>{formatRp(cartSubtotal)}</span>
                </div>

                <button
                  onClick={() => {
                    setCheckoutMode('cart');
                    setShowCheckout(true);
                  }}
                  style={{
                    width: '100%',
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
                    boxShadow: `0 8px 24px ${accentColor}40`
                  }}
                >
                  <ShoppingCart size={16} /> Lanjut ke Checkout ({formatRp(cartSubtotal)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- WISHLIST DRAWER MODAL --- */}
      {showWishlistDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99990, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowWishlistDrawer(false)} />
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 440,
            height: '100dvh',
            background: isDark ? '#0c0d14' : '#ffffff',
            borderLeft: `1.5px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
            animation: 'cmsFadeIn 0.25s ease'
          }}>
            {/* Wishlist Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: cardBg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Heart size={20} fill="#ef4444" color="#ef4444" />
                <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 800, color: textColor }}>Daftar Wishlist</h3>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: '#ef4444', color: '#fff', fontWeight: 800 }}>
                  {wishlist.length} item
                </span>
              </div>
              <button onClick={() => setShowWishlistDrawer(false)} style={{ background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {wishlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '70px 20px' }}>
                  <Heart size={48} style={{ opacity: 0.2, margin: '0 auto 16px', color: '#ef4444' }} />
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 800, color: textColor }}>Wishlist Masih Kosong</div>
                  <p style={{ fontSize: 13, color: subTextColor, marginTop: 6, lineHeight: 1.5 }}>Klik ikon ❤️ pada produk yang Anda sukai untuk menyimpannya di sini.</p>
                </div>
              ) : (
                wishlist.map(id => {
                  const prod = products.find(p => p.id === id);
                  if (!prod) return null;
                  return (
                    <div key={id} style={{ display: 'flex', gap: 12, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 18, border: `1px solid ${cardBorder}`, alignItems: 'center' }}>
                      <img src={prod.gallery?.[0] || 'https://placehold.co/100x100?text=Produk'} alt="" style={{ width: 60, height: 60, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: accentColor, marginTop: 3 }}>
                          {formatRp(prod.price)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          onClick={() => {
                            addToCart(prod, null, 1);
                            setShowWishlistDrawer(false);
                            setShowCartDrawer(true);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 100,
                            background: accentColor,
                            color: '#fff',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <ShoppingCart size={12} /> Beli
                        </button>
                        <button
                          onClick={() => toggleWishlist(prod.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PRODUCT DETAIL MODAL --- */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          products={products}
          isMobile={isMobile}
          isDark={isDark}
          accentColor={accentColor}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          subTextColor={subTextColor}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          copyProductLink={copyProductLink}
          addToCart={addToCart}
          handleAskProduct={handleAskProduct}
          formatRp={formatRp}
          appliedVoucher={appliedVoucher}
          setAppliedVoucher={setAppliedVoucher}
          voucherInput={voucherInput}
          setVoucherInput={setVoucherInput}
          voucherMessage={voucherMessage}
          setVoucherMessage={setVoucherMessage}
          handleApplyVoucher={() => {
            const p = selectedProduct;
            const unitPrice = selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : p.price;
            const subtotal = unitPrice * quantity;
            if (!voucherInput.trim()) {
              setVoucherMessage({ type: 'error', text: 'Masukkan kode voucher' });
              return;
            }
            const found = (data?.vouchers || []).find((v: any) => v.code?.toUpperCase() === voucherInput.trim().toUpperCase() && v.active !== false);
            if (!found) {
              setVoucherMessage({ type: 'error', text: 'Kode voucher tidak valid atau sudah kadaluarsa' });
              return;
            }
            if (found.minPurchase && subtotal < found.minPurchase) {
              setVoucherMessage({ type: 'error', text: `Minimal belanja ${formatRp(found.minPurchase)} untuk voucher ini` });
              return;
            }
            setAppliedVoucher(found);
            setVoucherMessage({ type: 'success', text: `Voucher "${found.code}" berhasil diterapkan!` });
          }}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
          quantity={quantity}
          setQuantity={setQuantity}
          activeImageIdx={activeImageIdx}
          setActiveImageIdx={setActiveImageIdx}
          isDetailFullScreen={isDetailFullScreen}
          setIsDetailFullScreen={setIsDetailFullScreen}
          closeDetail={() => {
            setSelectedProduct(null);
            setSelectedVariant(null);
            setActiveImageIdx(0);
            setAppliedVoucher(null);
            setVoucherInput('');
            setVoucherMessage({type:'', text:''});
            setShowCheckout(false);
            setQuantity(1);
            setIsDetailFullScreen(false);
            if (activeCategory && activeCategory !== 'Semua') {
              navigate(`/katalog/${encodeURIComponent(activeCategory)}`);
            } else {
              navigate('/katalog');
            }
          }}
          onSelectProduct={(sItem) => {
            setSelectedProduct(sItem);
            setSelectedVariant(null);
            setActiveImageIdx(0);
            setQuantity(1);
            setAppliedVoucher(null);
            if (activeCategory && activeCategory !== 'Semua') {
              navigate(`/katalog/${encodeURIComponent(activeCategory)}/p/${sItem.id}`);
            } else {
              navigate(`/katalog/p/${sItem.id}`);
            }
          }}
          showCheckout={showCheckout}
          setShowCheckout={setShowCheckout}
          checkoutMode={checkoutMode}
          setCheckoutMode={setCheckoutMode}
          checkoutForm={checkoutForm}
          setCheckoutForm={setCheckoutForm}
          isSubmitting={isSubmitting}
          submitOrder={submitOrder}
          data={{
            ...data,
            shopSettings: {
              ...(data?.shopSettings || {}),
              paymentMethods: (data?.shopSettings?.paymentMethods?.length > 0 ? data.shopSettings.paymentMethods : (businessProfile?.bankAccounts || []))
            }
          }}
          shopSettings={{
            ...shopSettings,
            paymentMethods: (shopSettings?.paymentMethods?.length > 0 ? shopSettings.paymentMethods : (data?.shopSettings?.paymentMethods?.length > 0 ? data.shopSettings.paymentMethods : (businessProfile?.bankAccounts || []))),
            qrisImageUrl: shopSettings?.qrisImageUrl || data?.shopSettings?.qrisImageUrl || businessProfile?.qris?.imageUrl || '',
            qrisMerchantName: shopSettings?.qrisMerchantName || businessProfile?.qris?.merchantName || businessProfile?.brandName || ''
          }}
        />
      )}

      {/* --- CART MULTI-ITEM CHECKOUT MODAL --- */}
      {showCheckout && checkoutMode === 'cart' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: isMobile ? 0 : 20 }}>
          <div style={{ background: cardBg, width: '100%', maxWidth: 480, height: isMobile ? '100dvh' : 'auto', maxHeight: isMobile ? '100dvh' : '90vh', overflowY: 'auto', borderRadius: isMobile ? 0 : 28, padding: isMobile ? '24px 18px' : 32, position: 'relative', boxShadow: '0 30px 70px rgba(0,0,0,0.4)', border: `1.5px solid ${cardBorder}`, animation: 'cmsPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <button onClick={() => setShowCheckout(false)} style={{ position: 'absolute', top: 22, right: 22, background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
            
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, margin: '0 0 18px', color: textColor }}>
              Checkout Keranjang ({totalCartCount} Item)
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>Alamat / Catatan Pengiriman</label>
                <textarea value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} style={{ width: '100%', height: 70, padding: '10px 14px', borderRadius: 14, border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb', color: textColor, fontSize: 13.5, outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif" }} placeholder="Alamat lengkap pengiriman atau catatan..." />
              </div>

              {(() => {
                const paymentList = (data?.shopSettings?.paymentMethods?.length > 0 ? data.shopSettings.paymentMethods : (businessProfile?.bankAccounts || []));
                const qrisUrl = shopSettings?.qrisImageUrl || data?.shopSettings?.qrisImageUrl || businessProfile?.qris?.imageUrl || '';
                const qrisMerchant = shopSettings?.qrisMerchantName || businessProfile?.qris?.merchantName || businessProfile?.brandName || 'SUMR.DAY STUDIO';
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
                              name="paymentMethodCart" 
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
                              <div style={{ fontSize: 11, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>{qrisMerchant}</div>
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
                            name="paymentMethodCart" 
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

              {/* Items Summary */}
              <div style={{ background: isDark ? '#090a12' : '#f9fafb', padding: 16, borderRadius: 18, border: `1px solid ${cardBorder}`, maxHeight: 150, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: subTextColor, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>Daftar Item ({totalCartCount}):</div>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5, fontFamily: "'Inter', sans-serif" }}>
                    <span style={{ color: textColor }}>{item.name} x{item.quantity}</span>
                    <span style={{ fontWeight: 700 }}>{formatRp(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5, color: '#10b981', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                  <span>Kode Unik Verifikasi:</span>
                  <span>+{formatRp(cartUniqueCode)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 6, borderTop: `1px solid ${cardBorder}`, fontSize: 16, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                  <span>Total Bayar:</span>
                  <span style={{ color: accentColor }}>{formatRp(cartSubtotal + cartUniqueCode)}</span>
                </div>
                <div style={{ fontSize: 11, color: subTextColor, marginTop: 4, fontStyle: 'italic', textAlign: 'right' }}>
                  *Mohon transfer persis nominal di atas untuk kemudahan verifikasi mutasi bank.
                </div>
              </div>

              <button 
                onClick={() => submitOrder(cartSubtotal, cart, cartUniqueCode)} 
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
                    <ShoppingCart size={17} /> Kirim Pesanan Keranjang via WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
