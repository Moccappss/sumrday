import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Search, Filter, X, ChevronRight, CheckCircle2, 
  AlertCircle, ShoppingCart, ArrowLeft, MessageSquare, Copy, 
  Share2, Eye, ExternalLink, Sparkles, Plus, Check 
} from 'lucide-react';
import { haptic } from '../utils/haptics';
import SEOHelmet from '../components/SEOHelmet';
import { storage } from '../utils/storage';
import { db } from '../firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useContextMenu } from '../components/admin/ContextMenuProvider';

// Types
interface ProductPackage {
  name: string;
  price: number;
  time: string;
  desc: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'Fisik' | 'Digital' | 'Jasa';
  category: string;
  image: string;
  images?: string[];
  packages?: ProductPackage[];
}

interface CartItem extends Product {
  cartItemId: string;
  qty: number;
  selectedPackage?: ProductPackage;
}

interface PaymentMethod {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface ShopSettings {
  whatsappNumber: string;
  paymentMethods: PaymentMethod[];
}

// Image Carousel Component
const ProductCarousel: React.FC<{ images?: string[] }> = ({ images }) => {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>;
  
  return (
    <div className="relative w-full h-full">
      <img src={images[idx]} alt="" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <div 
              key={i} 
              onClick={(e) => { e.stopPropagation(); setIdx(i); }} 
              className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
}; 

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { bindContextMenu } = useContextMenu();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [activeType, setActiveType] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // PDP (Product Detail Page)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activePackage, setActivePackage] = useState(0);
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout
  const [isCheckout, setIsCheckout] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', note: '', address: '', brief: '', proofUrl: '' });
  const [orderStatus, setOrderStatus] = useState<'loading' | 'success' | 'error' | 'pending' | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Contact Seller
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageData, setMessageData] = useState({ name: '', contact: '', message: '' });
  const [messageStatus, setMessageStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  
  const [shopSettings, setShopSettings] = useState<ShopSettings>({ whatsappNumber: '', paymentMethods: [] });
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const globalSettings = await storage.getItem('porto_settings', {});
      if (globalSettings?.shopSettings) {
        setShopSettings(globalSettings.shopSettings);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const p = await storage.getItem('porto_shop_products', []);
        if (p && p.length > 0) {
          setProducts(p);
        }
      } catch (err) {
        console.error("Gagal mengambil katalog dari storage", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];
  const types = ['Semua', 'Fisik', 'Digital', 'Jasa'];
  
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
    const matchType = activeType === 'Semua' || p.type === activeType;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchType && matchSearch;
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setActivePackage(0);
  };

  const addToCart = (product: Product, pkgIndex = 0) => {
    haptic.light();
    setCart(prev => {
      if (product.type === 'Digital') {
        const exists = prev.find(item => item.id === product.id);
        if (exists) return prev;
        return [...prev, { ...product, cartItemId: product.id, qty: 1 }];
      }
      
      if (product.type === 'Jasa') {
        const pkg = product.packages?.[pkgIndex];
        const cartItemId = `${product.id}_pkg_${pkgIndex}`;
        const exists = prev.find(item => item.cartItemId === cartItemId);
        if (exists) return prev;
        return [...prev, { 
          ...product, 
          cartItemId, 
          qty: 1,
          selectedPackage: pkg,
          price: pkg?.price || product.price 
        }];
      }

      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1, cartItemId: product.id }];
    });
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    haptic.selection();
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);

  const hasPhysical = cart.some(item => !item.type || item.type === 'Fisik');
  const hasService = cart.some(item => item.type === 'Jasa');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.light();
    if (!formData.name || !formData.phone) {
      alert("Nama dan No WhatsApp wajib diisi!");
      return;
    }
    if (shopSettings.paymentMethods?.length > 0 && !selectedPaymentId) {
      alert("Pilih metode pembayaran terlebih dahulu!");
      return;
    }
    if (!formData.proofUrl) {
      alert("Harap upload bukti pembayaran transfer!");
      return;
    }

    setOrderStatus('loading');
    
    try {
      const waNumber = shopSettings.whatsappNumber || '6281234567890';
      const detailPesanan = cart.map(item => `- ${item.name} (${item.qty}x) = ${formatRupiah(item.price * item.qty)}`).join('\n');
      const totalTagihan = formatRupiah(cartTotal);
      
      let template = shopSettings.waMessageFormat || "Halo, saya telah melakukan pembayaran pesanan:\n\n*Detail Pesanan:*\n{detail_pesanan}\n\n*Total Tagihan:* {total}\n\n*Data Pemesan:*\nNama: {nama}\nEmail: {email}\nCatatan: {catatan}\n\n*Bukti Pembayaran:*\n{bukti_tf}\n\nMohon segera diproses, terima kasih!";
      
      template = template
        .replace(/{nama}/g, formData.name)
        .replace(/{email}/g, formData.email || '-')
        .replace(/{catatan}/g, formData.note || '-')
        .replace(/{detail_pesanan}/g, detailPesanan)
        .replace(/{total}/g, totalTagihan)
        .replace(/{bukti_tf}/g, formData.proofUrl);

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(template)}`;
      window.open(waUrl, '_blank');
      
      setOrderStatus('success');
      setTimeout(() => {
        setCart([]);
        setIsCheckout(false);
        setIsCartOpen(false);
        setOrderStatus(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setOrderStatus('error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageData.name || !messageData.message) return;
    setMessageStatus('loading');
    try {
      const newSessionId = `shop_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await setDoc(doc(db, 'porto_conversations', newSessionId), {
        id: newSessionId,
        userName: messageData.name,
        lastMessage: messageData.message,
        lastMessageTime: serverTimestamp(),
        unread: 1,
        online: false,
        createdAt: serverTimestamp(),
        source: 'shop'
      });
      await addDoc(collection(db, 'porto_messages'), {
        roomId: newSessionId,
        text: `Kontak: ${messageData.contact}\n\n${messageData.message}`,
        senderId: 'user',
        senderName: messageData.name,
        timestamp: serverTimestamp()
      });
      
      setMessageStatus('success');
      setTimeout(() => {
        setIsMessageOpen(false);
        setMessageStatus(null);
        setMessageData({ name: '', contact: '', message: '' });
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessageStatus('error');
    }
  };

  const getProductContextMenu = (product: Product) => {
    const productUrl = `${window.location.origin}/katalog`;
    return {
      title: product.name,
      subtitle: `${product.category} • ${formatRupiah(product.price)}`,
      headerBadge: product.type?.toUpperCase() || 'PRODUK',
      items: [
        {
          label: 'Lihat Detail Produk',
          icon: <Eye size={15} color="var(--cms-accent, #7c3aed)" />,
          action: () => handleProductClick(product)
        },
        {
          label: 'Tambah ke Keranjang',
          icon: <ShoppingCart size={15} color="#10b981" />,
          action: () => addToCart(product)
        },
        {
          label: 'Tanya Produk via WhatsApp',
          icon: <MessageSquare size={15} color="#25D366" />,
          action: () => {
            const waNumber = shopSettings?.whatsappNumber || '6281234567890';
            const text = encodeURIComponent(`Halo, saya tertarik dengan produk/layanan *${product.name}* (${formatRupiah(product.price)}).\nApakah masih tersedia?`);
            window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
          }
        },
        {
          label: 'Salin Tautan Katalog',
          icon: <Copy size={15} color="#3b82f6" />,
          action: () => {
            if (navigator.clipboard) navigator.clipboard.writeText(productUrl);
          }
        }
      ]
    };
  };

  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[var(--cms-bg)] text-[var(--cms-text-primary)] font-['Inter',system-ui,-apple-system,sans-serif]" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex flex-col min-h-full">
        <SEOHelmet title="Exclusive Shop | Produk & Jasa" description="Katalog produk dan jasa desain eksklusif." />
        
        {/* HEADER */}
        <div className="sticky top-0 z-[100] bg-[var(--cms-panel-bg)]/80 backdrop-blur-xl border-b border-[var(--cms-border)] pt-[max(20px,env(safe-area-inset-top))] pb-5 px-6 shadow-sm flex justify-center">
          <div className="w-full max-w-7xl flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button 
              className="w-10 h-10 rounded-full border border-[var(--cms-border)] bg-[var(--cms-switcher-bg)] flex items-center justify-center text-[var(--cms-text-primary)] cursor-pointer transition-transform hover:scale-105" 
              onClick={() => navigate(-1)} 
              aria-label="Kembali"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-black m-0 flex items-center gap-2 tracking-tight">
                <ShoppingBag size={20} className="text-[var(--cms-accent)]" /> Eksklusif Shop
              </h1>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative w-11 h-11 rounded-full border border-[var(--cms-border)] bg-[var(--cms-switcher-bg)] flex items-center justify-center text-[var(--cms-text-primary)] cursor-pointer transition-transform hover:scale-105"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--cms-bg)]">
                  {cart.reduce((s,i)=>s+i.qty, 0)}
                </div>
              )}
            </button>
          </div>
          
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cms-text-muted)]" />
              <input 
                type="text" 
                placeholder="Cari produk..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] py-3 px-4 pl-11 rounded-full text-[var(--cms-text-primary)] text-sm outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {types.map(type => (
                <button 
                  key={type}
                  onClick={() => { haptic.selection(); setActiveType(type); }}
                  className={`px-5 py-2.5 rounded-full border text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-all ${activeType === type ? 'bg-[var(--cms-accent)] border-[var(--cms-accent)] text-white shadow-md' : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[var(--cms-text-primary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => { haptic.selection(); setActiveCategory(cat); }}
                  className={`px-5 py-2.5 rounded-full border text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-all ${activeCategory === cat ? 'bg-[var(--cms-text-primary)] border-[var(--cms-text-primary)] text-[var(--cms-bg)] shadow-md' : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[var(--cms-text-primary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>
        
        {/* MAIN CONTENT - CATALOG GRID */}
        <div className="flex-1 p-6 w-full overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-7xl">
          {loading ? (
            <div className="flex justify-center p-16 text-[var(--cms-text-muted)] font-bold animate-pulse">
              Memuat Katalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-16 text-[var(--cms-text-muted)]">
              <Filter size={48} className="opacity-20 mb-4 mx-auto text-[var(--cms-text-secondary)]" />
              <h3 className="m-0 mb-2 font-bold text-lg">Tidak ada produk ditemukan.</h3>
              <p className="text-sm">Coba ubah kata kunci atau kategori pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-6">
              {filteredProducts.map((p, i) => (
                <div 
                  key={p.id}
                  {...bindContextMenu(() => getProductContextMenu(p))}
                  className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-[24px] overflow-hidden flex flex-col transition-all duration-400 opacity-0 animate-[cmsFadeInUp_0.6s_ease_forwards] shadow-[0_4px_20px_0_rgba(0,0,0,0.08)] group hover:-translate-y-1.5 hover:shadow-[0_12px_32px_0_rgba(0,0,0,0.12)] hover:border-[rgba(255,255,255,0.15)] bg-[var(--cms-card-bg)]"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="relative w-full aspect-square sm:aspect-[4/3] bg-black/5 shrink-0">
                    <ProductCarousel images={p.images && p.images.length > 0 ? p.images : [p.image]} />
                    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                      <div className="bg-[var(--cms-accent)]/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {p.type || 'Fisik'}
                      </div>
                      <div className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {p.category}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="m-0 mb-2 text-base font-extrabold tracking-tight leading-snug text-[var(--cms-text-primary)] line-clamp-2">{p.name}</h3>
                    <p className="m-0 text-[13px] text-[var(--cms-text-muted)] leading-relaxed flex-1 line-clamp-3">{p.description}</p>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--cms-border)]">
                      <div className="text-lg font-black text-[var(--cms-accent)]">
                        {p.type === 'Jasa' && p.packages && p.packages.length > 0 ? `Mulai ${formatRupiah(p.packages[0].price)}` : formatRupiah(p.price)}
                      </div>
                      <button 
                        onClick={() => handleProductClick(p)}
                        className="bg-[var(--cms-text-primary)] text-[var(--cms-bg)] border-none py-2 px-4 rounded-full text-[13px] font-bold cursor-pointer transition-opacity hover:opacity-80"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* PDP (PRODUCT DETAIL PAGE) MODAL */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[9998] flex justify-center items-center bg-black/80 animate-[cmsFadeIn_0.25s_ease] p-4">
            <div className="w-full max-w-[500px] max-h-[90vh] bg-[var(--cms-bg)] rounded-[32px] flex flex-col overflow-hidden border border-[var(--cms-border)] animate-[cmsScaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)] shadow-2xl">
              <div className="relative h-[300px] bg-black/20 shrink-0">
                <ProductCarousel images={selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images : [selectedProduct.image]} />
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/70 text-white border-none flex items-center justify-center cursor-pointer transition-transform hover:scale-110 z-10" title="Tutup" aria-label="Tutup">
                  <X size={20} />
                </button>
                {selectedProduct.type === 'Digital' && (
                  <div className="absolute bottom-4 left-4 bg-white/95 text-black px-3 py-1.5 rounded-full text-xs font-extrabold shadow-md z-10 inline-flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>Digital Download (Akses Langsung)</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
                <div className="flex gap-2 mb-3">
                  <span className="bg-[rgba(var(--cms-accent-rgb),0.1)] text-[var(--cms-accent)] text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide border border-[rgba(var(--cms-accent-rgb),0.2)]">{selectedProduct.type || 'Fisik'}</span>
                  <span className="bg-[var(--cms-switcher-bg)] text-[var(--cms-text-primary)] text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide border border-[var(--cms-border)]">{selectedProduct.category}</span>
                </div>
                <h2 className="m-0 mb-4 text-2xl font-black text-[var(--cms-text-primary)] tracking-tight leading-snug">{selectedProduct.name}</h2>
                <p className="m-0 mb-6 text-sm text-[var(--cms-text-muted)] leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                
                {selectedProduct.type === 'Jasa' && selectedProduct.packages && selectedProduct.packages.length > 0 && (
                  <div className="mb-6">
                    <h4 className="m-0 mb-3 text-[15px] font-extrabold text-[var(--cms-text-primary)]">Pilih Paket Layanan:</h4>
                    <div className="flex flex-col gap-3">
                      {selectedProduct.packages.map((pkg, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setActivePackage(idx)}
                          className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${activePackage === idx ? 'border-[var(--cms-accent)] bg-[rgba(var(--cms-accent-rgb),0.05)] shadow-[0_4px_12px_rgba(var(--cms-accent-rgb),0.15)]' : 'border-[var(--cms-border)] bg-[var(--cms-switcher-bg)] hover:border-[rgba(255,255,255,0.2)]'}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-extrabold text-[15px] text-[var(--cms-text-primary)]">{pkg.name}</span>
                            <span className="font-black text-[var(--cms-accent)]">{formatRupiah(pkg.price)}</span>
                          </div>
                          <div className="text-xs text-[var(--cms-text-muted)] mb-2 font-semibold">⏳ Estimasi: {pkg.time}</div>
                          <div className="text-[13px] text-[var(--cms-text-secondary)] leading-relaxed">{pkg.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-[var(--cms-border)] flex items-center justify-between bg-[var(--cms-panel-bg)] shrink-0">
                <div>
                  <div className="text-xs text-[var(--cms-text-muted)] font-bold mb-1 uppercase tracking-wide">Total Harga</div>
                  <div className="text-[22px] font-black text-[var(--cms-accent)] leading-none">
                    {selectedProduct.type === 'Jasa' && selectedProduct.packages && selectedProduct.packages.length > 0 ? formatRupiah(selectedProduct.packages[activePackage].price) : formatRupiah(selectedProduct.price)}
                  </div>
                </div>
                <button 
                  onClick={() => addToCart(selectedProduct, activePackage)}
                  className="bg-[var(--cms-text-primary)] text-[var(--cms-bg)] border-none py-3 px-6 rounded-full text-sm font-extrabold cursor-pointer transition-transform hover:scale-105 shadow-md"
                >
                  {selectedProduct.type === 'Jasa' ? 'Pesan Sekarang' : 'Tambah ke Keranjang'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY CART & CHECKOUT */}
        {isCartOpen && (
          <div className="fixed inset-0 z-[9999] flex justify-end bg-black/80 animate-[cmsFadeIn_0.25s_ease]">
            <div className="w-full max-w-[440px] h-full bg-[var(--cms-bg)] flex flex-col border-l border-[var(--cms-border)] animate-[markerSlideIn_0.4s_cubic-bezier(0.19,1,0.22,1)] shadow-2xl">
              {/* Header Cart */}
              <div className="p-6 border-b border-[var(--cms-border)] flex items-center justify-between bg-[var(--cms-panel-bg)] shrink-0">
                <h2 className="m-0 text-xl font-black text-[var(--cms-text-primary)] tracking-tight">{isCheckout ? 'Checkout' : 'Keranjang Anda'}</h2>
                <button onClick={() => { setIsCheckout(false); setIsCartOpen(false); }} className="bg-transparent border-none text-[var(--cms-text-primary)] cursor-pointer p-1 transition-transform hover:scale-110">
                  <X size={24} />
                </button>
              </div>

              {/* Isi Cart */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {!isCheckout ? (
                  // MODE KERANJANG
                  cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--cms-text-muted)]">
                      <ShoppingCart size={48} className="opacity-20 mb-4" />
                      <p className="font-semibold text-sm">Keranjang belanja masih kosong.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {cart.map(item => (
                        <div key={item.cartItemId} className="flex gap-4 bg-[var(--cms-panel-bg)] p-3 rounded-2xl border border-[var(--cms-border)] shadow-sm">
                          <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1 flex flex-col justify-between">
                            <h4 className="m-0 text-sm font-bold text-[var(--cms-text-primary)] line-clamp-1">{item.name}</h4>
                            <div className="text-[13px] font-semibold text-[var(--cms-text-secondary)]">{formatRupiah(item.price)}</div>
                            <div className="flex items-center gap-3 mt-2">
                              <button onClick={()=>updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-[var(--cms-input-bg)] border border-[var(--cms-border)] text-[var(--cms-text-primary)] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.1)]">-</button>
                              <span className="text-[13px] font-bold min-w-[20px] text-center">{item.qty}</span>
                              <button onClick={()=>updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-[var(--cms-input-bg)] border border-[var(--cms-border)] text-[var(--cms-text-primary)] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.1)]">+</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // MODE CHECKOUT FORM
                  <form onSubmit={handleCheckout} className="flex flex-col gap-4">
                    {orderStatus === 'success' ? (
                      <div className="text-center p-10 text-emerald-500 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                        <CheckCircle2 size={48} className="mx-auto mb-4" />
                        <h3 className="m-0 text-xl font-black mb-2">Pesanan Berhasil!</h3>
                        <p className="text-emerald-600/80 font-medium text-sm">Membuka WhatsApp Anda...</p>
                      </div>
                    ) : orderStatus === 'error' ? (
                      <div className="text-center p-10 text-red-500 bg-red-500/10 rounded-3xl border border-red-500/20">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <h3 className="m-0 text-xl font-black mb-2">Pesanan Gagal</h3>
                        <p className="text-red-500/80 font-medium text-sm mb-4">Gagal mengirim pesanan ke server. Silakan coba lagi.</p>
                        <button type="button" onClick={()=>setOrderStatus(null)} className="bg-[var(--cms-input-bg)] border border-[var(--cms-border)] py-2 px-5 rounded-full text-[var(--cms-text-primary)] font-bold cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.1)]">Kembali</button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-[var(--cms-panel-bg)] p-4 rounded-2xl border border-[var(--cms-border)] mb-2 shadow-sm">
                          <h4 className="m-0 mb-3 text-sm font-extrabold text-[var(--cms-text-primary)]">Ringkasan Pesanan</h4>
                          {cart.map(item => (
                            <div key={item.cartItemId} className="flex justify-between text-[13px] mb-1.5 font-medium">
                              <span className="text-[var(--cms-text-secondary)] truncate mr-4">{item.qty}x {item.name}</span>
                              <span className="text-[var(--cms-text-primary)] shrink-0">{formatRupiah(item.price * item.qty)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-[15px] font-black mt-3 pt-3 border-t border-dashed border-[var(--cms-border)]">
                            <span className="text-[var(--cms-text-primary)]">Total Pembayaran</span>
                            <span className="text-[var(--cms-accent)]">{formatRupiah(cartTotal)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-bold text-[var(--cms-text-muted)] ml-1">Nama Lengkap *</label>
                          <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="bg-[var(--cms-input-bg)] border border-[var(--cms-border)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-bold text-[var(--cms-text-muted)] ml-1">Nomor WhatsApp *</label>
                          <input required type="text" placeholder="Cth: 0812..." value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="bg-[var(--cms-input-bg)] border border-[var(--cms-border)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-bold text-[var(--cms-text-muted)] ml-1">Email (Opsional)</label>
                          <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="bg-[var(--cms-input-bg)] border border-[var(--cms-border)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors" />
                        </div>

                        {hasPhysical && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[var(--cms-text-muted)] ml-1">Alamat Pengiriman (Wajib) *</label>
                            <textarea required rows={3} value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="bg-[var(--cms-input-bg)] border border-[var(--cms-border)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors resize-none" placeholder="Sertakan kecamatan, kota, dan kode pos" />
                          </div>
                        )}

                        {hasService && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[var(--cms-text-muted)] ml-1">Mini Briefing Proyek (Wajib) *</label>
                            <textarea required rows={3} value={formData.brief} onChange={e=>setFormData({...formData, brief: e.target.value})} className="bg-[var(--cms-input-bg)] border border-[var(--cms-border)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors resize-none" placeholder="Ceritakan singkat kebutuhan Anda, referensi, dll" />
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-bold text-[var(--cms-text-muted)] ml-1">Catatan Tambahan</label>
                          <textarea rows={2} value={formData.note} onChange={e=>setFormData({...formData, note: e.target.value})} className="bg-[var(--cms-input-bg)] border border-[var(--cms-border)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors resize-none" />
                        </div>
                        
                        {shopSettings.paymentMethods && shopSettings.paymentMethods.length > 0 && (
                          <div className="mt-2">
                            <label className="text-[13px] font-extrabold text-[var(--cms-text-primary)] block mb-3 ml-1">Pilih Rekening Tujuan *</label>
                            <div className="flex flex-col gap-3">
                              {shopSettings.paymentMethods.map(p => (
                                <label key={p.id} className={`flex items-center justify-between gap-3 bg-[var(--cms-panel-bg)] border-2 p-3.5 rounded-xl cursor-pointer transition-all ${selectedPaymentId === p.id ? 'border-[var(--cms-accent)] shadow-[0_4px_12px_rgba(var(--cms-accent-rgb),0.1)]' : 'border-[var(--cms-border)] hover:border-[rgba(255,255,255,0.2)]'}`}>
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <input type="radio" name="payment" value={p.id} checked={selectedPaymentId === p.id} onChange={(e) => setSelectedPaymentId(e.target.value)} className="w-4 h-4 accent-[var(--cms-accent)] cursor-pointer shrink-0" />
                                    <div className="min-w-0">
                                      <div className="text-sm font-extrabold text-[var(--cms-text-primary)] select-text">{p.bankName}</div>
                                      <div className="text-[12.5px] font-semibold text-[var(--cms-text-muted)] select-text font-mono">{p.accountNumber} <span className="font-sans font-normal text-[11px] block">a.n {p.accountName}</span></div>
                                    </div>
                                  </div>
                                  {p.accountNumber && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        haptic.light();
                                        navigator.clipboard.writeText(p.accountNumber);
                                        setCopiedBankId(p.id);
                                        setTimeout(() => setCopiedBankId(null), 2000);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg border border-[var(--cms-border)] bg-[var(--cms-card-bg)] text-[var(--cms-text-primary)] text-xs font-bold shrink-0 flex items-center gap-1 hover:border-[var(--cms-accent)] select-none"
                                      title="Salin Nomor Rekening"
                                    >
                                      {copiedBankId === p.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                      <span className={copiedBankId === p.id ? 'text-emerald-500' : ''}>{copiedBankId === p.id ? 'Tersalin' : 'Salin'}</span>
                                    </button>
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-2 bg-[var(--cms-panel-bg)] p-4 rounded-xl border border-[var(--cms-border)] shadow-sm">
                          <label className="text-[13px] font-extrabold text-[var(--cms-text-primary)] block mb-2">Upload Bukti Transfer *</label>
                          <p className="text-[12px] font-medium text-[var(--cms-text-muted)] mb-3 leading-relaxed">Mohon transfer sesuai total tagihan ke rekening di atas, lalu upload bukti pembayarannya.</p>
                          <input type="file" accept="image/*" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              setIsUploadingProof(true);
                              try {
                                const url = await uploadToCloudinary(e.target.files[0]);
                                setFormData({...formData, proofUrl: url});
                              } catch(err) {
                                alert("Gagal upload gambar");
                              } finally {
                                setIsUploadingProof(false);
                              }
                            }
                          }} className="text-xs text-[var(--cms-text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[rgba(255,255,255,0.1)] file:text-[var(--cms-text-primary)] hover:file:bg-[rgba(255,255,255,0.2)] cursor-pointer" />
                          
                          {formData.proofUrl && (
                            <div className="mt-3">
                              <img src={formData.proofUrl} alt="Bukti Transfer" className="w-24 h-24 object-cover rounded-lg border border-[var(--cms-border)] shadow-sm" />
                            </div>
                          )}
                          {isUploadingProof && <div className="text-xs font-bold text-[var(--cms-accent)] mt-2 animate-pulse">Mengunggah gambar...</div>}
                        </div>
                      </>
                    )}
                  </form>
                )}
              </div>

              {/* Footer Cart / Checkout */}
              {!isCheckout && cart.length > 0 && (
                <div className="p-6 border-t border-[var(--cms-border)] bg-[var(--cms-panel-bg)] shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-base font-bold text-[var(--cms-text-secondary)]">Subtotal</span>
                    <span className="text-lg font-black text-[var(--cms-text-primary)]">{formatRupiah(cartTotal)}</span>
                  </div>
                  <button 
                    onClick={() => setIsCheckout(true)}
                    className="w-full bg-[var(--cms-accent)] text-white border-none py-3.5 rounded-full text-[15px] font-extrabold cursor-pointer flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] shadow-[0_4px_16px_rgba(var(--cms-accent-rgb),0.3)]"
                  >
                    Checkout Pesanan <ChevronRight size={18} />
                  </button>
                </div>
              )}
              
              {isCheckout && orderStatus !== 'success' && orderStatus !== 'error' && (
                <div className="p-6 border-t border-[var(--cms-border)] bg-[var(--cms-panel-bg)] shrink-0">
                  <button 
                    onClick={handleCheckout}
                    disabled={orderStatus === 'loading'}
                    className={`w-full bg-[var(--cms-accent)] text-white border-none py-3.5 rounded-full text-[15px] font-extrabold flex justify-center items-center gap-2 transition-transform shadow-[0_4px_16px_rgba(var(--cms-accent-rgb),0.3)] ${orderStatus === 'loading' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
                  >
                    {orderStatus === 'loading' ? 'Memproses...' : 'Kirim Pesanan (via WhatsApp)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLOATING CONTACT BUTTON */}
        <button 
          onClick={() => setIsMessageOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--cms-accent)] text-white border-none flex items-center justify-center cursor-pointer shadow-[0_10px_24px_rgba(0,0,0,0.2)] z-[90] transition-transform hover:scale-110"
          aria-label="Hubungi Kami"
        >
          <MessageSquare size={24} />
        </button>

        {/* OVERLAY MESSAGE */}
        {isMessageOpen && (
          <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-black/80 animate-[cmsFadeIn_0.25s_ease] p-4">
            <div className="w-full max-w-[400px] bg-[var(--cms-panel-bg)] p-8 rounded-[32px] border border-[var(--cms-border)] shadow-2xl animate-[cmsScaleIn_0.3s_ease]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="m-0 text-xl font-black text-[var(--cms-text-primary)] tracking-tight">Kirim Pesan</h2>
                <button onClick={() => setIsMessageOpen(false)} className="bg-transparent border-none text-[var(--cms-text-primary)] cursor-pointer p-1 transition-transform hover:scale-110"><X size={24} /></button>
              </div>
              
              {messageStatus === 'success' ? (
                <div className="text-center py-10 text-emerald-500 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <CheckCircle2 size={48} className="mx-auto mb-4" />
                  <h3 className="m-0 text-lg font-black mb-2">Pesan Terkirim!</h3>
                  <p className="text-emerald-600/80 font-semibold text-sm m-0">Seller akan segera menghubungi Anda.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[var(--cms-text-muted)] ml-1">Nama Anda *</label>
                    <input required type="text" value={messageData.name} onChange={e=>setMessageData({...messageData, name: e.target.value})} className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[var(--cms-text-muted)] ml-1">Nomor WA / Kontak *</label>
                    <input required type="text" value={messageData.contact} onChange={e=>setMessageData({...messageData, contact: e.target.value})} className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-[var(--cms-text-muted)] ml-1">Pesan *</label>
                    <textarea required rows={4} value={messageData.message} onChange={e=>setMessageData({...messageData, message: e.target.value})} className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-3 rounded-xl text-[var(--cms-text-primary)] text-sm outline-none focus:border-[var(--cms-accent)] transition-colors resize-none" />
                  </div>
                  <button type="submit" disabled={messageStatus === 'loading'} className={`mt-2 bg-[var(--cms-accent)] text-white border-none h-12 rounded-full text-[15px] font-extrabold flex justify-center items-center shadow-[0_4px_16px_rgba(var(--cms-accent-rgb),0.3)] transition-transform ${messageStatus === 'loading' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}>
                    {messageStatus === 'loading' ? 'Mengirim...' : 'Kirim Pesan'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
