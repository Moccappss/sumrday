import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowUpRight, ArrowLeft, Tag, Image as ImageIcon, 
  CheckCircle2, Ticket, Package, ShoppingCart, X, CreditCard, MessageCircle,
  SlidersHorizontal, Share2, Plus, Minus, Check, Heart, Trash2, ShoppingBag,
  Sparkles, Search, ShieldCheck, Zap, Layers, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, Clock, Briefcase, Cloud
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
import { saveClientOrder, isServiceProduct, creditAffiliateReferral } from '../services/clientAuth';
import { googleSync } from '../utils/googleSync';
import { createOrUpdateServiceOrder } from '../utils/serviceOrderSync';
import PageHeroHeader from '../components/common/PageHeroHeader';
import ProductDetailModal from '../components/katalog/ProductDetailModal';
import { haptic } from '../utils/haptics';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import {
  isProductFlashSaleActive,
  getFlashSalePrice,
  getFlashSaleDiscountPercent,
  getFlashSaleTimeRemaining,
  isPreOrderProduct,
  getPreOrderQuotaProgress
} from '../utils/flashSaleHelper';

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
  
  const [products, setProducts] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('porto_catalog_products');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((p: any) => p.isPublished);
      }
    } catch {}
    return [];
  });
  const [vouchers, setVouchers] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('porto_catalog_vouchers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((v: any) => v.isActive);
      }
    } catch {}
    return [];
  });
  const [cmsCategories, setCmsCategories] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('porto_catalog_categories');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
              if (item.isActive === false) return '';
              return (item.name || item.title || '').trim();
            }
            return '';
          }).filter(Boolean);
        }
      }
    } catch {}
    return [];
  });
  const [shopSettings, setShopSettings] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('porto_shop_settings') || localStorage.getItem('porto_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.shopSettings || parsed;
      }
    } catch {}
    return {};
  });
  const [, setDataLoading] = useState(false);

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

  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);

  // Horizontal drag-to-scroll & navigation for Category Navigation Bar
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [isCatDragging, setIsCatDragging] = useState(false);
  const [catStartX, setCatStartX] = useState(0);
  const [catStartScrollLeft, setCatStartScrollLeft] = useState(0);
  const [catDragDistance, setCatDragDistance] = useState(0);
  const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = useState(false);

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
    const handleOpenCart = () => navigate('/keranjang');
    const handleOpenWishlist = () => setShowWishlistDrawer(true);

    window.addEventListener('porto_open_cart', handleOpenCart);
    window.addEventListener('porto_open_wishlist', handleOpenWishlist);

    const params = new URLSearchParams(location.search);
    if (params.get('openCart') === 'true') {
      navigate('/keranjang');
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
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const pageBg = isDark ? '#06070a' : '#eef2f6';

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

  // Synchronize category & product deep link from URL (/katalog/p/:id or /katalog?product=:id or /katalog/:category)
  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const searchParams = new URLSearchParams(location.search);
    const queryPId = searchParams.get('product') || searchParams.get('id') || searchParams.get('p');

    // Handle product deep links, e.g. /katalog/p/prod-123 or /katalog/item/prod-123
    let pId: string | null = queryPId ? decodeURIComponent(queryPId) : null;
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
  }, [location.pathname, location.search, products]);

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
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    paymentMethodId: ''
  });

  // Flash Sale Expand / Collapse and Track Ref for Horizontal Carousel
  const [isFlashSaleExpanded, setIsFlashSaleExpanded] = useState(false);
  const flashSaleTrackRef = useRef<HTMLDivElement>(null);

  // 3-Digit Unique Verification Code for Cart Checkout
  const [cartUniqueCode, setCartUniqueCode] = useState(() => Math.floor(Math.random() * 899) + 100);
  useEffect(() => {
    if (showCheckout && checkoutMode === 'cart') {
      setCartUniqueCode(Math.floor(Math.random() * 899) + 100);
    }
  }, [showCheckout, checkoutMode]);

  // Flash Sale Live Countdown Timer
  const [flashTimeLeft, setFlashTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  const effectiveFlashEndTime = useMemo(() => {
    if (shopSettings?.flashSale?.isActive && shopSettings?.flashSale?.endTime) {
      if (new Date(shopSettings.flashSale.endTime).getTime() > Date.now()) {
        return shopSettings.flashSale.endTime;
      }
    }
    if (shopSettings?.flashSaleActive && shopSettings?.flashSaleEndTime) {
      if (new Date(shopSettings.flashSaleEndTime).getTime() > Date.now()) {
        return shopSettings.flashSaleEndTime;
      }
    }
    const activeEnds = products
      .filter((p: any) => isProductFlashSaleActive(p, shopSettings))
      .map((p: any) => new Date(p.flashSale?.endTime || shopSettings?.flashSale?.endTime).getTime())
      .filter((t: number) => !isNaN(t) && t > Date.now());
    if (activeEnds.length > 0) {
      const minEnd = Math.min(...activeEnds);
      return new Date(minEnd).toISOString();
    }
    return null;
  }, [shopSettings, products]);

  useEffect(() => {
    if (!effectiveFlashEndTime) {
      setFlashTimeLeft(null);
      return;
    }
    const updateTimer = () => {
      const remaining = getFlashSaleTimeRemaining(effectiveFlashEndTime);
      if (!remaining) {
        setFlashTimeLeft(null);
      } else {
        setFlashTimeLeft({
          hours: remaining.hours,
          minutes: remaining.minutes,
          seconds: remaining.seconds
        });
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [effectiveFlashEndTime]);

  // Auto-fill checkout form with logged-in Client data
  useEffect(() => {
    if (client) {
      setCheckoutForm((prev) => ({
        ...prev,
        name: prev.name || client.name || '',
        phone: prev.phone || client.phone || '',
        email: prev.email || client.email || '',
      }));
    }
  }, [client, showCheckout]);

  // Auto-hide floating LiveChat launcher button when any modal/drawer is open
  useEffect(() => {
    const isAnyModalActive = !!selectedProduct || showWishlistDrawer || showCheckout;
    window.dispatchEvent(new CustomEvent('porto_chat_visibility', { detail: { visible: !isAnyModalActive } }));
    return () => {
      window.dispatchEvent(new CustomEvent('porto_chat_visibility', { detail: { visible: true } }));
    };
  }, [selectedProduct, showWishlistDrawer, showCheckout]);

  useEffect(() => {
    let loads = 0;
    const checkLoaded = () => { loads++; if(loads >= 4) setDataLoading(false); };
    
    storage.getItem('porto_catalog_products', []).then(d => {
      setProducts((d || []).filter((p: any) => p.isPublished));
      checkLoaded();
    });

    const loadCategories = () => {
      storage.getItem('porto_catalog_categories', []).then(d => {
        const raw = Array.isArray(d) ? d : [];
        const parsed = raw.map((item: any) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') {
            if (item.isActive === false) return '';
            return (item.name || item.title || '').trim();
          }
          return '';
        }).filter(Boolean);
        setCmsCategories(parsed);
        checkLoaded();
      });
    };
    loadCategories();

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

    // Real-time synchronization when admin updates Flash Sale, Categories, or Catalog
    const handleFlashUpdate = () => {
      storage.getItem('porto_catalog_products', []).then(d => {
        setProducts((d || []).filter((p: any) => p.isPublished));
      });
      storage.getItem('porto_shop_settings', null).then(shopS => {
        if (shopS) setShopSettings(shopS);
      });
    };
    const handleCategoriesUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        const parsed = e.detail.map((item: any) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') {
            if (item.isActive === false) return '';
            return (item.name || item.title || '').trim();
          }
          return '';
        }).filter(Boolean);
        setCmsCategories(parsed);
      } else {
        loadCategories();
      }
    };
    const handleCatalogProductsUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        setProducts(e.detail.filter((p: any) => p.isPublished));
      }
    };

    window.addEventListener('porto_flash_sale_updated', handleFlashUpdate);
    window.addEventListener('porto_categories_updated', handleCategoriesUpdate);
    window.addEventListener('porto_catalog_updated', handleCatalogProductsUpdate);

    return () => {
      window.removeEventListener('porto_flash_sale_updated', handleFlashUpdate);
      window.removeEventListener('porto_categories_updated', handleCategoriesUpdate);
      window.removeEventListener('porto_catalog_updated', handleCatalogProductsUpdate);
    };
  }, []);

  // Active flash sale products (centralized & synchronized)
  const flashSaleProducts = useMemo(() => {
    return products.filter((p: any) => isProductFlashSaleActive(p, shopSettings));
  }, [products, shopSettings]);

  // Pre-Order products
  const preOrderProducts = useMemo(() => {
    return products.filter((p: any) => isPreOrderProduct(p));
  }, [products]);

  // Comprehensive Category List: Combines CMS Master Categories + All Product Categories
  const categories = useMemo(() => {
    const list = ['Semua'];
    if (flashSaleProducts.length > 0) {
      list.push('Flash Sale');
    }
    if (preOrderProducts.length > 0) {
      list.push('Pre-Order');
    }

    const rawCategories: string[] = [
      ...cmsCategories.map((c: any) => (typeof c === 'string' ? c : c?.name || '')),
      ...products.map((p: any) => p.category || '').filter(Boolean)
    ];

    const seen = new Set<string>();
    rawCategories.forEach(cat => {
      const trimmed = cat.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (lower === 'semua' || lower === 'flash sale' || lower === 'pre-order') return;
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push(trimmed);
      }
    });

    return list;
  }, [flashSaleProducts.length, preOrderProducts.length, cmsCategories, products]);

  // Scroll checking and drag-to-scroll handlers for the Category Navigation Bar
  const checkCatScroll = () => {
    const el = catScrollRef.current;
    if (!el) return;
    setCanScrollCatLeft(el.scrollLeft > 6);
    setCanScrollCatRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    checkCatScroll();
    const el = catScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkCatScroll, { passive: true });
    window.addEventListener('resize', checkCatScroll);
    return () => {
      el.removeEventListener('scroll', checkCatScroll);
      window.removeEventListener('resize', checkCatScroll);
    };
  }, [categories]);

  const handleCatMouseDown = (e: React.MouseEvent) => {
    const el = catScrollRef.current;
    if (!el) return;
    setIsCatDragging(true);
    setCatStartX(e.pageX - el.offsetLeft);
    setCatStartScrollLeft(el.scrollLeft);
    setCatDragDistance(0);
  };

  const handleCatMouseMove = (e: React.MouseEvent) => {
    if (!isCatDragging) return;
    const el = catScrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - catStartX) * 1.5;
    setCatDragDistance(Math.abs(walk));
    el.scrollLeft = catStartScrollLeft - walk;
    checkCatScroll();
  };

  const handleCatMouseUp = () => {
    setIsCatDragging(false);
    setTimeout(() => setCatDragDistance(0), 80);
  };

  const handleCatWheel = (e: React.WheelEvent) => {
    const el = catScrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
      checkCatScroll();
    }
  };

  const scrollCatTrack = (dir: 'left' | 'right') => {
    const el = catScrollRef.current;
    if (!el) return;
    const amount = dir === 'left' ? -260 : 260;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkCatScroll, 320);
  };

  // Smooth Edge Fade Mask for scroll cutoff
  const catMask = useMemo(() => {
    if (canScrollCatLeft && canScrollCatRight) {
      return 'linear-gradient(to right, transparent 0%, black 36px, black calc(100% - 36px), transparent 100%)';
    }
    if (canScrollCatLeft) {
      return 'linear-gradient(to right, transparent 0%, black 36px, black 100%)';
    }
    if (canScrollCatRight) {
      return 'linear-gradient(to right, black 0%, black calc(100% - 36px), transparent 100%)';
    }
    return 'none';
  }, [canScrollCatLeft, canScrollCatRight]);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    const list = products.filter((p: any) => {
      let matchCategory = false;
      if (activeCategory === 'Semua') {
        matchCategory = true;
      } else if (activeCategory === 'Flash Sale') {
        matchCategory = isProductFlashSaleActive(p, shopSettings);
      } else if (activeCategory === 'Pre-Order') {
        matchCategory = isPreOrderProduct(p);
      } else {
        matchCategory = (p.category || '').toLowerCase() === activeCategory.toLowerCase();
      }
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });

    return [...list].sort((a, b) => {
      const getPPrice = (item: any) => {
        return getFlashSalePrice(item, shopSettings);
      };
      if (sortBy === 'price-asc') return getPPrice(a) - getPPrice(b);
      if (sortBy === 'price-desc') return getPPrice(b) - getPPrice(a);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0; // default order / newest
    });
  }, [products, shopSettings, activeCategory, searchQuery, sortBy]);

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
    const isFlashActive = isProductFlashSaleActive(product, shopSettings);
    const effectiveBasePrice = isFlashActive ? getFlashSalePrice(product, shopSettings) : product.price;
    const unitPrice = variant && variant.price > 0 ? variant.price : effectiveBasePrice;
    const cartItemId = `${product.id}_${variant?.id || 'main'}`;
    const isPO = isPreOrderProduct(product);

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
            image: product.gallery?.[0] || product.image || '',
            category: product.category,
            type: product.type,
            price: unitPrice,
            originalPrice: isFlashActive ? (product.flashSale?.originalPrice || product.originalPrice || product.price) : product.originalPrice,
            variantId: variant?.id || null,
            variantName: variant?.name || null,
            downloadUrl: product.downloadUrl || '',
            fileFormat: product.fileFormat || 'ZIP',
            fileSize: product.fileSize || '',
            instantDeliveryMessage: product.instantDeliveryMessage || '',
            isDigitalAsset: product.type === 'Digital' || !!product.downloadUrl,
            isPreOrder: isPO,
            preOrderBatch: product.preOrderBatch || 'BATCH 1',
            preOrderEstimate: product.preOrderEstimate || '',
            preOrderDpAllowed: product.preOrderDpAllowed !== false,
            quantity: qty
          }
        ];
      }
    });

    showToast('Dimasukkan ke Keranjang 🛒', `${product.name} telah masuk ke keranjang belanja.`, 'success');
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
  const submitOrder = async (
    basePriceToPay: number, 
    itemsToOrder: any[], 
    uniqueCodeNum: number = 0,
    paymentSchemeParam: 'dp' | 'full' = 'full',
    serviceBriefParam: any = null
  ) => {
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
      
      const hasPO = itemsToOrder.some(item => isPreOrderProduct(item) || item.isPreOrder);
      const hasService = itemsToOrder.some(item => isServiceProduct(item));
      const effectiveOrderType: 'jasa' | 'beli_putus' | 'preorder' = hasPO ? 'preorder' : (hasService ? 'jasa' : 'beli_putus');
      const effectiveScheme: 'dp' | 'full' = ((hasService || hasPO) && paymentSchemeParam === 'dp') ? 'dp' : 'full';
      const dpVal = effectiveScheme === 'dp' ? Math.round(basePriceToPay * 0.5) : 0;
      const remainingVal = effectiveScheme === 'dp' ? (basePriceToPay - dpVal) : 0;
      const amountToTransfer = effectiveScheme === 'dp' ? (dpVal + code) : (basePriceToPay + code);

      const terminList = effectiveScheme === 'dp' ? (
        hasPO ? [
          {
            termNumber: 1,
            name: 'DP 50% Booking Pre-Order (PO Merch)',
            amount: dpVal,
            isPaid: false,
            dueDate: new Date().toISOString().slice(0, 10)
          },
          {
            termNumber: 2,
            name: 'Pelunasan 50% Sebelum Pengiriman Merch',
            amount: remainingVal,
            isPaid: false,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          }
        ] : [
          {
            termNumber: 1,
            name: 'DP 50% (Kick-off Proyek)',
            amount: dpVal,
            isPaid: false,
            dueDate: new Date().toISOString().slice(0, 10)
          },
          {
            termNumber: 2,
            name: 'Pelunasan 50% (Serah Terima Akhir)',
            amount: remainingVal,
            isPaid: false,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          }
        ]
      ) : [];

      const newTrx = {
        id: trxId,
        uniqueCode: code,
        date: new Date().toISOString().slice(0, 10),
        orderType: effectiveOrderType,
        paymentScheme: effectiveScheme,
        dpAmount: dpVal,
        remainingAmount: remainingVal,
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
            isDigitalAsset: item.isDigitalAsset || matchedProd?.type === 'Digital' || !!matchedProd?.downloadUrl,
            isPreOrder: Boolean(item.isPreOrder || isPreOrderProduct(matchedProd)),
            preOrderBatch: item.preOrderBatch || matchedProd?.preOrderBatch || '',
            preOrderEstimate: item.preOrderEstimate || matchedProd?.preOrderEstimate || ''
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
        notes: (hasService && serviceBriefParam?.briefDescription) ? serviceBriefParam.briefDescription : (checkoutForm.notes || checkoutForm.address || '-'),
        briefMode: hasService ? serviceBriefParam?.briefMode : undefined,
        googleDocUrl: hasService ? serviceBriefParam?.googleDocUrl : undefined,
        deadline: hasService ? serviceBriefParam?.effectiveDeadline : undefined,
        addons: hasService ? (serviceBriefParam?.selectedAddons || []) : undefined,
        addonsTotal: hasService ? (serviceBriefParam?.addonsTotal || 0) : undefined,
        termin: terminList,
        paymentMethod: checkoutForm.paymentMethodId === 'qris_toko' 
          ? { id: 'qris_toko', bankName: 'QRIS Instan (Bebas Biaya)', accountNumber: 'Scan Barcode QRIS', accountName: shopSettings?.qrisMerchantName || 'Merchant QRIS' }
          : (checkoutForm.paymentMethodId ? data?.shopSettings?.paymentMethods?.find((p: any) => p.id === checkoutForm.paymentMethodId) : null),
        mou: { enabled: false, title: '', content: '', date: new Date().toISOString().slice(0, 10) },
        attachment: '',
        grandTotal: amountToTransfer,
        basePriceTotal: basePriceToPay,
        source: 'website'
      };

      const existingTrx = await storage.getItem('porto_transactions', []);
      await storage.setItem('porto_transactions', [newTrx, ...existingTrx]);

      // 1a. Background Google Sheets sync to "Transaksi & Pesanan"
      googleSync.syncTransactions([newTrx, ...existingTrx], null).catch((err: any) => 
        console.warn('[Katalog] Background Sheets sync warning:', err)
      );

      // 1b. Auto-deduct inventory stock & update pre-order/flash-sale quotas
      try {
        const catProducts = await storage.getItem<any[]>('porto_catalog_products', []);
        const catList = await storage.getItem<any[]>('porto_catalog', []);
        let stockChanged = false;

        const deductStockList = (list: any[]) => {
          return (list || []).map(p => {
            const match = itemsToOrder.find((ci: any) => (ci.productId || ci.id) === p.id || (ci.name && p.name && ci.name.trim().toLowerCase() === p.name.trim().toLowerCase()));
            if (match) {
              const qtyNum = Number(match.quantity || match.qty || 1);
              let updated = { ...p };
              if (typeof p.stock === 'number') {
                stockChanged = true;
                updated.stock = Math.max(0, p.stock - qtyNum);
              }
              if (match.isPreOrder || p.isPreOrder) {
                updated.preOrderSold = (Number(p.preOrderSold) || 0) + qtyNum;
                stockChanged = true;
              }
              if (p.flashSale) {
                updated.flashSale = {
                  ...p.flashSale,
                  sold: (Number(p.flashSale.sold) || 0) + qtyNum,
                  stockLeft: typeof p.flashSale.stockLeft === 'number' ? Math.max(0, p.flashSale.stockLeft - qtyNum) : p.flashSale.stockLeft
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
        console.warn('[Katalog] Stock deduction warning:', e);
      }

      // 1c. Auto-credit affiliate referral commission if referral code is stored
      const storedRefCode = typeof window !== 'undefined' ? (localStorage.getItem('porto_referral_code') || '') : '';
      if (storedRefCode) {
        creditAffiliateReferral(storedRefCode, basePriceToPay, trxId, checkoutForm.name)
          .then(res => {
            if (res.success) {
              console.log(`[Affiliate] Komisi ${res.commission} berhasil dicatat untuk mitra ${res.partnerName}`);
            }
          })
          .catch(e => console.warn('[Katalog] Referral credit warning:', e));
      }

      // Auto-save buyer into Customer Directory (porto_trx_customers)
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

      // If service product, automatically sync project with status: pending_acc (waiting for admin ACC)
      if (hasService) {
        const firstSvc = itemsToOrder.find((i: any) => isServiceProduct(i));
        createOrUpdateServiceOrder({
          id: trxId,
          customerType: client?.membershipTier || 'client',
          customer: newTrx.customer,
          serviceCategory: firstSvc?.category || 'Jasa',
          serviceTitle: firstSvc?.name || 'Layanan Jasa',
          briefMode: serviceBriefParam?.briefMode || 'text',
          googleDocUrl: serviceBriefParam?.googleDocUrl || '',
          briefDescription: serviceBriefParam?.briefDescription || checkoutForm.address || '',
          deadline: serviceBriefParam?.effectiveDeadline || '',
          price: basePriceToPay,
          grandTotal: amountToTransfer,
          paymentScheme: effectiveScheme,
          dpAmount: dpVal,
          remainingAmount: remainingVal,
          paymentStatus: effectiveScheme === 'dp' ? 'dp' : 'belum',
          requiresAcc: true, // Only enters active Kanban board after admin ACC
          notes: checkoutForm.address || ''
        }).catch(err => console.warn('Service project sync error:', err));
      }

      // Notify systems
      window.dispatchEvent(new CustomEvent('porto_transactions_updated'));
      window.dispatchEvent(new CustomEvent('porto_trx_customers_updated'));

      // Save into Client Orders history (both logged-in clients and guest lookups)
      const clientUid = client?.id || newTrx.customer.id;
      for (const itm of itemsToOrder) {
        const matchedProd = products.find((p: any) => p.id === (itm.productId || itm.id));
        saveClientOrder({
          clientId: clientUid,
          clientName: checkoutForm.name,
          clientPhone: checkoutForm.phone,
          clientEmail: checkoutForm.email || client?.email,
          productName: itm.name,
          productId: itm.productId || itm.id,
          variantName: itm.variantName || '',
          price: itm.price,
          quantity: itm.quantity || itm.qty || 1,
          total: itm.price * (itm.quantity || itm.qty || 1),
          status: 'Pending',
          orderId: trxId,
          milestoneStep: effectiveScheme === 'dp' ? 2 : 1,
          trackingNumber: '',
          orderType: effectiveOrderType,
          preOrderBatch: itm.preOrderBatch || matchedProd?.preOrderBatch || '',
          preOrderEstimate: itm.preOrderEstimate || matchedProd?.preOrderEstimate || '',
          paymentScheme: effectiveScheme,
          dpAmount: dpVal,
          remainingAmount: remainingVal,
          paymentStatus: effectiveScheme === 'dp' ? 'dp' : 'belum',
          paymentMethod: checkoutForm.paymentMethodId === 'qris_toko' ? 'QRIS Instan' : (newTrx.paymentMethod?.bankName || 'WhatsApp Checkout'),
          notes: checkoutForm.address || '',
          downloadUrl: itm.downloadUrl || matchedProd?.downloadUrl || '',
          fileFormat: itm.fileFormat || matchedProd?.fileFormat || 'ZIP',
          fileSize: itm.fileSize || matchedProd?.fileSize || '',
          instantDeliveryMessage: itm.instantDeliveryMessage || matchedProd?.instantDeliveryMessage || '',
          isDigitalAsset: itm.isDigitalAsset || matchedProd?.type === 'Digital' || !!matchedProd?.downloadUrl
        }).catch((e) => console.warn('Save client order error:', e));
      }

      // Format WhatsApp message detail
      const detailPesanan = itemsToOrder.map(item => {
        const isPoItem = item.isPreOrder || isPreOrderProduct(item);
        return `• ${item.name}${item.variantName ? ` (${item.variantName})` : ''} (${item.quantity || item.qty || 1}x) - ${formatRp(item.price * (item.quantity || item.qty || 1))}${isPoItem ? ` [PO: ${item.preOrderBatch || 'BATCH 1'}]` : ''}`;
      }).join('\n');

      const paymentList = (data?.shopSettings?.paymentMethods?.length > 0 ? data.shopSettings.paymentMethods : (businessProfile?.bankAccounts || []));
      const qrisMerchantName = shopSettings?.qrisMerchantName || businessProfile?.qris?.merchantName || businessProfile?.brandName || 'SUMR.DAY STUDIO';

      const selectedPayment = checkoutForm.paymentMethodId === 'qris_toko'
        ? `QRIS Instan (Scan Barcode Toko - ${qrisMerchantName} - 0% Fee)`
        : (paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId)
           ? `${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).bankName} - ${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).accountNumber} (A.n ${paymentList.find((p: any) => p.id === checkoutForm.paymentMethodId).accountName})`
           : 'Transfer Bank');

      const rawWa = (businessProfile?.whatsapp || shopSettings?.whatsappNumber || data?.shopSettings?.whatsappNumber || data?.footer?.whatsappNumber || '6281234567890').toString().replace(/[^0-9]/g, '');
      const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa;

      const template = `Halo sumr.day team! Saya telah melakukan pemesanan dari katalog:

*NOMOR PESANAN:* ${trxId}
*Nama Pemesan:* ${checkoutForm.name}
*No. WhatsApp:* ${checkoutForm.phone}
${checkoutForm.address ? `*Catatan / Alamat:* ${checkoutForm.address}\n` : ''}
*Detail Pesanan:*
${detailPesanan}

*SKEMA PEMBAYARAN:* ${effectiveOrderType === 'preorder' ? (effectiveScheme === 'dp' ? 'DP 50% Booking PO' : 'Lunas 100% Pre-Order') : (effectiveScheme === 'dp' ? 'DP 50% Kick-off' : 'Lunas 100%')}
${effectiveScheme === 'dp' 
  ? `*Nilai Total ${effectiveOrderType === 'preorder' ? 'Pesanan Merch' : 'Proyek'}:* ${formatRp(basePriceToPay)}\n*Nominal DP 50% Sekarang:* ${formatRp(dpVal)}\n*Sisa Pelunasan (50%):* ${formatRp(remainingVal)} (${effectiveOrderType === 'preorder' ? 'Sebelum pengiriman' : 'Saat serah terima'})` 
  : `*Nilai Total Belanja:* ${formatRp(basePriceToPay)}`}

🔢 *Kode Unik Verifikasi:* +Rp ${code}
💰 *TOTAL TRANSFER ${effectiveScheme === 'dp' ? 'DP SEKARANG' : ''}:* ${formatRp(amountToTransfer)} *(Wajib persis hingga 3 digit terakhir)*
💳 *Metode Pembayaran:* ${selectedPayment}

📎 *Bukti Pembayaran:* (Foto struk / bukti transfer terlampir di bawah ini)

${effectiveOrderType === 'preorder' 
  ? 'Pesanan Pre-Order saya mohon dicatat ya min. Status kuota dan pengiriman akan saya pantau di menu Riwayat (/keranjang?tab=history). Terima kasih!' 
  : (effectiveScheme === 'dp' 
      ? 'Mohon diverifikasi pembayaran DP ini untuk memulai pengerjaan proyek. Status proyek dapat dipantau di menu Keranjang & Riwayat (/keranjang?tab=history). Terima kasih!' 
      : 'Mohon diperiksa di mutasi banknya ya min. Setelah status di-acc Lunas, berkas digital saya akan otomatis aktif di menu Akun Saya (/akun) & menu Riwayat (/keranjang?tab=history). Terima kasih!')}`;

      const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(template)}`;
      window.open(waUrl, '_blank');
      
      showToast('Pesanan Berhasil!', 'Mengarahkan ke WhatsApp admin...', 'success');
      
      // Reset checkout form and cart
      setCheckoutForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        paymentMethodId: ''
      });
      if (checkoutMode === 'cart') {
        setCart([]);
        try { localStorage.removeItem('porto_client_cart'); } catch {}
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

      <main style={{ flex: 1, width: '100%', maxWidth: 1240, margin: '0 auto', padding: isMobile ? '90px 16px 100px' : '112px clamp(16px, 3.5vw, 24px) 100px', boxSizing: 'border-box' }}>
        
        {/* Page Hero Header with Live Search & Dynamic Stats */}
        <PageHeroHeader
          isDark={isDark}
          bgPattern={(data?.pagesHeader as any)?.catalog?.bgPattern || 'grid'}
          badgeIcon={<ShoppingBag size={14} />}
          badgeText={data?.pagesHeader?.catalog?.badge || 'PRODUK & ASET DIGITAL'}
          title={data?.pagesHeader?.catalog?.title || 'Koleksi Produk & Layanan'}
          highlightText={data?.pagesHeader?.catalog?.highlight || 'Produk Digital'}
          description={data?.pagesHeader?.catalog?.description || 'Dapatkan solusi desain berkualitas tinggi, aset digital siap pakai, serta layanan kustom profesional untuk mengembangkan bisnis Anda.'}
          accentColor={accentColor}
          textColor={textColor}
          subTextColor={subTextColor}
          stats={[
            { icon: <ShoppingBag size={15} />, value: products.length, label: 'Total Aset' },
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
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
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
                background: isDark ? '#14161f' : '#ffffff',
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                boxShadow: 'none',
                color: '#ef4444',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <Heart size={16} fill="#ef4444" />
              <span>Favorit ({wishlist.length})</span>
            </button>
          )}

          {/* Cart Floating Pill */}
          {totalCartCount > 0 && (
            <button
              onClick={() => navigate('/keranjang')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 22px',
                borderRadius: 100,
                background: accentColor,
                border: 'none',
                boxShadow: 'none',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
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
              borderRadius: 24, 
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
              boxShadow: 'none'
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
                <img src={shopSettings.heroBannerImage} alt="" style={{ width: '100%', height: 'auto', minHeight: 180, maxHeight: 300, objectFit: 'cover', borderRadius: 16, boxShadow: 'none' }} />
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
                      gridColumn: `span ${span}`, borderRadius: 22, overflow: 'hidden', position: 'relative', 
                      cursor: 'pointer', background: cardBg, border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', height: '100%',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: 'none'
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

        {/* BARIS KHUSUS FLASH SALE (Swipeable Carousel + Luaskan Toggle) */}
        {flashSaleProducts.length > 0 && (
          <div
            data-reveal="true"
            style={{
              marginBottom: 36,
              padding: isMobile ? '18px 14px' : '24px 26px',
              borderRadius: 24,
              background: isDark
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(15, 16, 25, 0.95) 50%, rgba(124, 58, 237, 0.12) 100%)'
                : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 50%, #f5f3ff 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              boxShadow: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Header: Title, Countdown Timer, Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`
            }}>
              {/* Title & Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(239, 68, 68, 0.45)',
                  flexShrink: 0
                }}>
                  <Zap size={22} fill="#ffffff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(17px, 2.2vw, 22px)', fontWeight: 900, color: textColor, letterSpacing: '-0.3px' }}>
                      {shopSettings?.flashSaleTitle || shopSettings?.flashSale?.title || 'FLASH SALE SPESIAL'}
                    </h3>
                    <span style={{ fontSize: 10.5, fontWeight: 900, color: '#fff', background: '#ef4444', padding: '3px 9px', borderRadius: 100, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.04em' }}>
                      Pusat Promo Toko
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: subTextColor, fontFamily: "'Inter', sans-serif" }}>
                    Geser untuk melihat penawaran kilat • Diskon terbatas hingga waktu habis
                  </p>
                </div>
              </div>

              {/* Timer & Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {flashTimeLeft && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(0,0,0,0.4)' : '#ffffff', padding: '6px 10px', borderRadius: 14, border: `1px solid ${cardBorder}` }}>
                    <Clock size={14} color="#ef4444" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: subTextColor, textTransform: 'uppercase' }}>Berakhir:</span>
                    {[
                      { val: String(flashTimeLeft.hours).padStart(2, '0'), label: 'j' },
                      { val: String(flashTimeLeft.minutes).padStart(2, '0'), label: 'm' },
                      { val: String(flashTimeLeft.seconds).padStart(2, '0'), label: 'd' }
                    ].map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div style={{
                          padding: '2px 6px',
                          borderRadius: 6,
                          background: isDark ? '#1a101f' : '#fee2e2',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 900,
                          color: '#ef4444'
                        }}>
                          {item.val}{item.label}
                        </div>
                        {idx < 2 && <span style={{ fontWeight: 900, color: '#ef4444', fontSize: 12 }}>:</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Carousel Left/Right scroll controls (only when not expanded) */}
                {!isFlashSaleExpanded && flashSaleProducts.length > 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => {
                        haptic.light();
                        flashSaleTrackRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
                      }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: `1.5px solid ${cardBorder}`,
                        background: cardBg,
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Geser ke kiri"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => {
                        haptic.light();
                        flashSaleTrackRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
                      }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: `1.5px solid ${cardBorder}`,
                        background: cardBg,
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Geser ke kanan"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* Luaskan / Perkecil Toggle Button */}
                <button
                  onClick={() => {
                    haptic.medium();
                    setIsFlashSaleExpanded(!isFlashSaleExpanded);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 100,
                    border: '1.5px solid rgba(239, 68, 68, 0.4)',
                    background: isFlashSaleExpanded ? '#ef4444' : (isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2'),
                    color: isFlashSaleExpanded ? '#ffffff' : '#ef4444',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  title={isFlashSaleExpanded ? 'Kembalikan ke mode baris geser' : 'Tampilkan semua produk flash sale secara penuh'}
                >
                  {isFlashSaleExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span>{isFlashSaleExpanded ? 'Perkecil Baris' : 'Luaskan Flash Sale'}</span>
                </button>
              </div>
            </div>

            {/* Flash Sale Product Items Track / Grid */}
            <div
              ref={flashSaleTrackRef}
              style={
                isFlashSaleExpanded
                  ? {
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: isMobile ? 12 : 18,
                      width: '100%'
                    }
                  : {
                      display: 'flex',
                      gap: 16,
                      overflowX: 'auto',
                      paddingBottom: 10,
                      scrollbarWidth: 'none',
                      WebkitOverflowScrolling: 'touch',
                      scrollSnapType: 'x mandatory'
                    }
              }
            >
              {flashSaleProducts.map((p: any) => {
                const salePrice = getFlashSalePrice(p, shopSettings);
                const originalPrice = p.flashSale?.originalPrice || p.originalPrice || p.price;
                const disc = getFlashSaleDiscountPercent(p, shopSettings);
                const soldQuota = p.flashSale?.stockSold || p.flashSale?.quotaSold || 4;
                const totalQuota = p.flashSale?.stockQuota || p.flashSale?.quotaTotal || 10;
                const progressPct = Math.min(100, Math.round((soldQuota / totalQuota) * 100));

                return (
                  <div
                    key={`fs-row-${p.id}`}
                    onClick={() => openProductDetail(p)}
                    style={{
                      flex: isFlashSaleExpanded ? 'initial' : (isMobile ? '0 0 240px' : '0 0 280px'),
                      scrollSnapAlign: 'start',
                      background: cardBg,
                      borderRadius: 20,
                      border: '1.5px solid rgba(239, 68, 68, 0.35)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 6px 20px rgba(239, 68, 68, 0.08)',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = '#ef4444';
                      e.currentTarget.style.boxShadow = '0 14px 32px rgba(239, 68, 68, 0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                      e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 6px 20px rgba(239, 68, 68, 0.08)';
                    }}
                  >
                    {/* Image & Discount Badge */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', background: isDark ? '#090a12' : '#f8fafc', overflow: 'hidden' }}>
                      {p.gallery?.[0] || p.image ? (
                        <img
                          src={p.gallery?.[0] || p.image}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subTextColor, fontSize: 12 }}>
                          {p.name}
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)'
                      }}>
                        <Zap size={11} fill="#fff" /> -{disc}%
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {p.category || 'Flash Sale'}
                      </span>
                      <h4 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: textColor, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.name}
                      </h4>

                      {/* Quota Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, color: subTextColor, marginBottom: 4 }}>
                          <span>🔥 Terjual {soldQuota} pcs</span>
                          <span style={{ color: '#ef4444' }}>Sisa {Math.max(0, totalQuota - soldQuota)} pcs</span>
                        </div>
                        <div style={{ width: '100%', height: 5, borderRadius: 100, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)', borderRadius: 100 }} />
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, color: subTextColor, textDecoration: 'line-through', display: 'block' }}>
                            {formatRp(originalPrice)}
                          </span>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 900, color: '#ef4444' }}>
                            {formatRp(salePrice)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openProductDetail(p);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 100,
                            background: '#ef4444',
                            border: 'none',
                            color: '#ffffff',
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Beli <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Filter Pills Navigation Bar */}
        <div data-reveal="true" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Left Arrow Button */}
          {canScrollCatLeft && (
            <button
              type="button"
              onClick={() => scrollCatTrack('left')}
              aria-label="Geser ke kiri"
              style={{
                flexShrink: 0,
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: `1.5px solid ${cardBorder}`,
                background: isDark ? 'rgba(15, 23, 42, 0.9)' : '#ffffff',
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Scrollable & Draggable Single-Row Track */}
          <div
            ref={catScrollRef}
            onMouseDown={handleCatMouseDown}
            onMouseMove={handleCatMouseMove}
            onMouseUp={handleCatMouseUp}
            onMouseLeave={handleCatMouseUp}
            onWheel={handleCatWheel}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: 4,
              paddingTop: 4,
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              cursor: isCatDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              maskImage: catMask,
              WebkitMaskImage: catMask,
              transition: 'mask-image 0.25s ease, -webkit-mask-image 0.25s ease'
            }}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count = cat === 'Semua'
                ? products.length
                : cat === 'Flash Sale'
                ? flashSaleProducts.length
                : cat === 'Pre-Order'
                ? preOrderProducts.length
                : products.filter((p: any) => (p.category || '').toLowerCase() === cat.toLowerCase()).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (catDragDistance > 6) return;
                    handleCategoryChange(cat);
                  }}
                  style={{
                    flexShrink: 0,
                    padding: '8px 18px', 
                    borderRadius: 100, 
                    border: `1.5px solid ${isActive ? accentColor : cardBorder}`,
                    background: isActive ? accentColor : (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'), 
                    color: isActive ? '#ffffff' : subTextColor,
                    fontFamily: "'Outfit', sans-serif", 
                    fontSize: 13, 
                    fontWeight: isActive ? 800 : 600, 
                    cursor: isCatDragging ? 'grabbing' : 'pointer', 
                    whiteSpace: 'nowrap',
                    transition: isCatDragging ? 'none' : 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isCatDragging) {
                      e.currentTarget.style.color = textColor;
                      e.currentTarget.style.borderColor = `${accentColor}50`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !isCatDragging) {
                      e.currentTarget.style.color = subTextColor;
                      e.currentTarget.style.borderColor = cardBorder;
                    }
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {cat === 'Semua' && <Layers size={13} />}
                    {cat === 'Flash Sale' && <Zap size={13} fill={isActive ? '#ffffff' : '#ef4444'} color={isActive ? '#ffffff' : '#ef4444'} />}
                    {cat === 'Pre-Order' && <Clock size={13} color={isActive ? '#ffffff' : '#f59e0b'} />}
                    {cat === 'Semua' ? 'Semua Produk' : cat}
                  </span>
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

          {/* Right Arrow Button */}
          {canScrollCatRight && (
            <button
              type="button"
              onClick={() => scrollCatTrack('right')}
              aria-label="Geser ke kanan"
              style={{
                flexShrink: 0,
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: `1.5px solid ${cardBorder}`,
                background: isDark ? 'rgba(15, 23, 42, 0.9)' : '#ffffff',
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
              }}
            >
              <ChevronRight size={16} />
            </button>
          )}
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
              onClick={() => navigate('/keranjang')}
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
              title="Buka Halaman Keranjang Belanja"
            >
              <ShoppingCart size={14} />
              <span>{totalCartCount}</span>
            </button>

            {/* Riwayat & Pelacak Pesanan Quick Button */}
            <button
              onClick={() => navigate('/keranjang?tab=history')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 100,
                border: `1px solid ${cardBorder}`,
                background: cardBg,
                color: textColor,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Riwayat Pesanan & Pelacak Proyek"
            >
              <Clock size={14} />
              <span>Riwayat</span>
            </button>
          </div>
        </div>

        {/* Products Grid Section */}
        {filteredProducts.length === 0 ? (
          <div data-reveal="true" style={{
            padding: '70px 20px',
            textAlign: 'center',
            background: cardBg,
            borderRadius: 22,
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
              const isFlashActive = Boolean(p.flashSale?.isActive && new Date(p.flashSale.endTime).getTime() > Date.now());
              const effectivePrice = (isFlashActive && p.flashSale.salePrice > 0) ? p.flashSale.salePrice : p.price;
              const effectiveOriginalPrice = isFlashActive ? (p.flashSale.originalPrice || p.price) : p.originalPrice;
              const hasDiscount = isFlashActive || effectiveOriginalPrice > effectivePrice;
              const discountPercent = isFlashActive 
                ? (p.flashSale.discountPercent || Math.round(((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100))
                : (hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);
              const isFavorited = wishlist.includes(p.id);

              return (
                <div 
                  key={p.id} 
                  data-reveal="true"
                  className={`reveal-delay-${(idx % 4) + 1} ${idx > 8 ? 'content-visibility-auto' : ''}`}
                  onClick={() => openProductDetail(p)} 
                  data-card-3d="true"
                  className="katalog-card"
                  style={{ 
                    background: cardBg, 
                    borderRadius: 22, 
                    padding: 12,
                    overflow: 'hidden', 
                    border: isFlashActive ? '1.5px solid rgba(239, 68, 68, 0.45)' : `1px solid ${cardBorder}`, 
                    cursor: 'pointer', 
                    transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    boxShadow: 'none',
                    position: 'relative'
                  }}
                >
                  {/* Product Image Frame */}
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '1/1', 
                    backgroundColor: isDark ? '#090a12' : '#f8fafc', 
                    borderRadius: 16,
                    position: 'relative', 
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
                        }} 
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

                    {/* Discount / Flash Sale Badge */}
                    {isFlashActive ? (
                      <div style={{
                        position: 'absolute',
                        top: isMobile ? 14 : 18,
                        left: isMobile ? 14 : 18,
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        fontSize: isMobile ? 9 : 10,
                        fontWeight: 900,
                        padding: isMobile ? '3px 8px' : '4px 10px',
                        borderRadius: 100,
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                        zIndex: 2
                      }}>
                        <Zap size={11} fill="#ffffff" /> FLASH SALE -{discountPercent}%
                      </div>
                    ) : hasDiscount && (
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

                    {isPreOrderProduct(p) ? (
                      <div style={{
                        position: 'absolute',
                        bottom: isMobile ? 12 : 16,
                        left: isMobile ? 12 : 16,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        fontSize: isMobile ? 8.5 : 9.5,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 100,
                        fontFamily: "'Outfit', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.45)',
                        zIndex: 2
                      }}>
                        <Clock size={11} /> Pre-Order
                      </div>
                    ) : isServiceProduct(p) ? (
                      <div style={{
                        position: 'absolute',
                        bottom: isMobile ? 12 : 16,
                        left: isMobile ? 12 : 16,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        fontSize: isMobile ? 8.5 : 9.5,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 100,
                        fontFamily: "'Outfit', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.45)',
                        zIndex: 2
                      }}>
                        <Briefcase size={11} /> Jasa
                      </div>
                    ) : (p.type === 'Digital' || p.downloadUrl || p.isDigitalAsset) ? (
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
                        <Cloud size={11} /> Digital
                      </div>
                    ) : (p.type === 'Add-on' || p.isAddon) ? (
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
                        <Sparkles size={11} fill="#fff" /> Add-On
                      </div>
                    ) : (
                      <div style={{
                        position: 'absolute',
                        bottom: isMobile ? 12 : 16,
                        left: isMobile ? 12 : 16,
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                        color: '#ffffff',
                        fontSize: isMobile ? 8.5 : 9.5,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 100,
                        fontFamily: "'Outfit', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.45)',
                        zIndex: 2
                      }}>
                        <Package size={11} /> Ready Stock
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
                      color: isFlashActive ? '#ef4444' : accentColor, 
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

                    {/* Pre-Order Quota Progress (if PO) */}
                    {isPreOrderProduct(p) && (
                      <div style={{
                        marginBottom: 10,
                        padding: '8px 10px',
                        borderRadius: 12,
                        background: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#f59e0b' }}>
                          <span>📦 Kuota PO:</span>
                          <span>{p.preOrderSold || 0} / {p.preOrderQuota || 50} pcs</span>
                        </div>
                        <div style={{ width: '100%', height: 4, borderRadius: 100, background: 'rgba(245, 158, 11, 0.2)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, Math.round(((p.preOrderSold || 0) / (p.preOrderQuota || 50)) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', borderRadius: 100 }} />
                        </div>
                        {p.preOrderEstimate && (
                          <span style={{ fontSize: 10, color: subTextColor }}>🚚 Est. Kirim: {p.preOrderEstimate}</span>
                        )}
                      </div>
                    )}

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
                        color: isFlashActive ? '#ef4444' : accentColor, 
                        letterSpacing: '-0.3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {isFlashActive && <Zap size={15} fill="#ef4444" />}
                        {formatRp(effectivePrice)}
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
                          {formatRp(effectiveOriginalPrice)}
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
                          background: isPreOrderProduct(p) ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : accentColor, 
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
                          boxShadow: `0 4px 14px ${isPreOrderProduct(p) ? 'rgba(245, 158, 11, 0.4)' : `${accentColor}35`}`,
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          minWidth: 0,
                          padding: '0 8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {isPreOrderProduct(p) 
                            ? (isProductFlashSaleActive(p) ? <><Zap size={12} /> PO Flash</> : <><Clock size={12} /> Pre-Order</>) 
                            : (isServiceProduct(p) 
                                ? (isProductFlashSaleActive(p) ? <><Zap size={12} /> Flash Jasa</> : <><Briefcase size={12} /> Pesan Jasa</>) 
                                : (isProductFlashSaleActive(p) ? <><Zap size={12} /> Flash Beli</> : <><Package size={12} /> Beli</>))}
                        </span> 
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

      {/* --- WISHLIST DRAWER MODAL --- */}
      {showWishlistDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99990, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none' }} onClick={() => setShowWishlistDrawer(false)} />
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
                            navigate('/keranjang');
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
    </div>
  );
}
