import React, { useState, useEffect, useRef } from 'react';
import MediaGalleryModal from './MediaGalleryModal';
import FlashSaleModal from './FlashSaleModal';
import { 
  Store, Plus, Search, Image as ImageIcon, Trash2, 
  Save, Eye, Info, Package, Tag, Settings2, Upload, 
  ArrowLeft, Edit3, X, Cloud, Link, Copy, CheckCircle2, Check, Receipt, BadgePercent, Zap, Share2, Clock,
  Briefcase, Layers, Globe, MoreHorizontal, SlidersHorizontal
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import GlassSelect from './GlassSelect';
import { useContextMenu } from './ContextMenuProvider';
import { storage } from '../../utils/storage';
import { uploadToCloudinary, getOptimizedCloudinaryUrl } from '../../utils/cloudinary';
import { notifyCatalog } from '../../utils/notifications';
import { isPreOrderProduct, isProductFlashSaleActive } from '../../utils/flashSaleHelper';

const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const genId = (prefix) => `${prefix}-${Date.now()}`;

const CurrencyInput = ({ value, onChange, placeholder = '' }) => {
  const displayValue = value ? new Intl.NumberFormat('id-ID').format(value) : '';
  return (
    <input 
      type="text" 
      style={{
        width: '100%', padding: '12px 16px', borderRadius: 14,
        border: '1.5px solid var(--glass-border)', background: 'var(--cms-input-bg)',
        color: 'var(--cms-text)', fontSize: 14, outline: 'none'
      }} 
      placeholder={placeholder}
      value={displayValue} 
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, '');
        onChange(raw ? parseInt(raw, 10) : 0);
      }} 
    />
  );
};

export default function CatalogManager({ notify, confirm, onBack }: { notify?: any; confirm?: any; onBack?: () => void }) {
  const { bindContextMenu, openContextMenu } = useContextMenu();
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [categories, setCategories] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [shopSettings, setShopSettings] = useState({ whatsappNumber: '', paymentMethods: [] });
  const [globalSettings, setGlobalSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const existingCategories = Array.from(new Set([
    ...categories.map(c => c.name),
    ...products.map(p => p.category).filter(Boolean)
  ]));
  if (!existingCategories.includes('Umum')) existingCategories.unshift('Umum');

  const INITIAL_PRODUCT = {
    id: '', productCode: '', name: '', category: existingCategories[0] || 'Umum', type: 'Fisik',
    price: 0, originalPrice: 0, stock: 0, description: '', gallery: [], variants: [],
    isPublished: true, seoTitle: '', seoDesc: '', downloadUrl: '',
    fileFormat: 'ZIP', fileSize: '', instantDeliveryMessage: '', isDigitalAsset: false,
    accessModel: 'lifetime', durationDays: 30,
    liveDemoUrl: '', techStack: '', appAccessUrl: '',
    isPreOrder: false,
    preOrderBatch: 'Batch 1',
    preOrderEstimate: 'Estimasi Pengiriman: 14-21 Hari Kerja',
    preOrderQuota: 50,
    preOrderSold: 0,
    preOrderCloseDate: '',
    preOrderDpAllowed: false,
    serviceDpAllowed: true
  };

  const INITIAL_CATEGORY = { id: '', name: '', image: '', bannerImage: '', colSpan: 1, isActive: true };
  const INITIAL_VOUCHER = { id: '', code: '', discountType: 'percent', discountValue: 0, quota: 0, isActive: true };

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'banners' | 'vouchers' | 'settings'
  const [productFilterTab, setProductFilterTab] = useState('all'); // 'all' | 'preorder' | 'flashsale' | 'digital' | 'physical'
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isFlashSaleModalOpen, setIsFlashSaleModalOpen] = useState(false);
  const [flashSaleTargetProduct, setFlashSaleTargetProduct] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── AUTO-OPEN CREATE PRODUCT MODAL (GLOBAL SHORTCUT / SLASH COMMAND / SEARCH INTENT) ──
  useEffect(() => {
    const triggerNewProduct = () => {
      setActiveTab('products');
      setEditingCategory(null);
      setEditingVoucher(null);
      setEditingProduct(INITIAL_PRODUCT);
    };

    if (typeof window !== 'undefined' && sessionStorage.getItem('porto_auto_create_product') === '1') {
      sessionStorage.removeItem('porto_auto_create_product');
      setTimeout(triggerNewProduct, 150);
    }

    window.addEventListener('porto_create_product', triggerNewProduct);
    window.addEventListener('porto_add_product', triggerNewProduct);
    return () => {
      window.removeEventListener('porto_create_product', triggerNewProduct);
      window.removeEventListener('porto_add_product', triggerNewProduct);
    };
  }, []);

  // Keyboard accessibility: Escape to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingProduct) setEditingProduct(null);
        else if (editingCategory) setEditingCategory(null);
        else if (editingVoucher) setEditingVoucher(null);
        else if (isGalleryOpen) setIsGalleryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingProduct, editingCategory, editingVoucher, isGalleryOpen]);

  // Interconnection: direct transaction creation from catalog product
  const handleCreateTransactionForProduct = (product: any) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('porto_auto_create_transaction_item', JSON.stringify(product));
      window.dispatchEvent(new CustomEvent('porto_create_transaction_with_item', { detail: { item: product } }));
      window.dispatchEvent(new CustomEvent('porto_navigate_admin', { detail: { tab: 'transactions' } }));
      notify?.(`Membuka form transaksi untuk produk "${product.name}"`, 'info');
    }
  };

  const getProductContextMenu = (p: any, isSelected = false) => ({
    title: p.name || 'Produk Katalog',
    subtitle: `${formatRp(p.price)} · ${p.isPublished !== false ? 'Aktif' : 'Draft'}`,
    headerBadge: p.isPublished !== false ? 'PRODUK' : 'DRAFT',
    items: [
      {
        label: 'Buat Transaksi / Invoice',
        icon: <Receipt size={15} color="#10b981" />,
        action: () => handleCreateTransactionForProduct(p)
      },
      {
        label: 'Edit Produk',
        icon: <Edit3 size={15} color="var(--cms-accent)" />,
        action: () => setEditingProduct(p)
      },
      {
        label: 'Siarkan Feed',
        icon: <Share2 size={15} color="var(--cms-accent)" />,
        action: () => handleBroadcastProductToFeed(p)
      },
      {
        label: p.flashSale?.isActive ? 'Edit Flash Sale' : 'Atur Flash Sale',
        icon: <Zap size={15} color="#ef4444" fill={p.flashSale?.isActive ? '#ef4444' : 'none'} />,
        action: () => {
          setFlashSaleTargetProduct(p);
          setIsFlashSaleModalOpen(true);
        }
      },
      {
        label: isSelected ? 'Hilangkan Tanda' : 'Tandai / Mode Pilih',
        icon: <Check size={15} color="#10b981" />,
        action: () => toggleSelectProduct(p.id)
      },
      ...(selectedProductIds.length > 0 ? [
        {
          label: 'Batalkan Semua Pilihan',
          icon: <X size={15} color="#94a3b8" />,
          action: () => setSelectedProductIds([])
        }
      ] : []),
      {
        label: p.isPublished !== false ? 'Nonaktifkan (Draft)' : 'Terbitkan Produk',
        icon: <CheckCircle2 size={15} color={p.isPublished !== false ? '#f59e0b' : '#10b981'} />,
        action: async () => {
          const updated = products.map((prod: any) => prod.id === p.id ? { ...prod, isPublished: p.isPublished === false } : prod);
          setProducts(updated);
          await storage.setItem('porto_catalog_products', updated);
          notify?.(p.isPublished !== false ? 'Produk dijadikan draft' : 'Produk diterbitkan', 'success');
        }
      },
      {
        label: 'Salin Info Produk',
        icon: <Copy size={15} />,
        action: () => {
          navigator.clipboard?.writeText(`${p.name} - ${formatRp(p.price)}`);
          notify?.('Info produk disalin');
        }
      },
      { separator: true },
      {
        label: 'Hapus Produk',
        icon: <Trash2 size={15} color="#ef4444" />,
        danger: true,
        action: () => handleDeleteProduct(p.id)
      }
    ]
  });

  // UI state
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const [p, c, v, s, shopS] = await Promise.all([
        storage.getItem('porto_catalog_products', []),
        storage.getItem('porto_catalog_categories', []),
        storage.getItem('porto_catalog_vouchers', []),
        storage.getItem('porto_settings', {}),
        storage.getItem('porto_shop_settings', null)
      ]);
      if (!isMounted) return;
      setProducts(p);
      setCategories(c);
      setVouchers(v);
      setGlobalSettings(s || {});
      
      // If shopS exists, use it. Otherwise, migrate from old s.shopSettings if it exists.
      if (shopS) {
        setShopSettings(shopS);
      } else {
        setShopSettings((s || {}).shopSettings || { whatsappNumber: '', paymentMethods: [] });
      }
      
      setLoading(false);
    };
    load();

    // Real-time listener for live sync across Rate Card, Katalog, and Keuangan
    const unsubPrdLive = storage.listenItem('porto_catalog_products', (p) => {
      if (Array.isArray(p) && p.length > 0) setProducts(p);
    });
    const handleRemoteCatalogUpdate = (e: any) => {
      if (Array.isArray(e.detail)) setProducts(e.detail);
    };
    window.addEventListener('porto_catalog_updated', handleRemoteCatalogUpdate);

    return () => { 
      isMounted = false; 
      if (unsubPrdLive) unsubPrdLive();
      window.removeEventListener('porto_catalog_updated', handleRemoteCatalogUpdate);
    };
  }, []);

  const saveProducts = async (list) => {
    setProducts(list);
    await storage.setItem('porto_catalog_products', list);
    await storage.setItem('porto_catalog', list);
    window.dispatchEvent(new CustomEvent('porto_catalog_updated', { detail: list }));
    notify('Katalog disimpan');
  };

  const saveCategories = async (list) => {
    setCategories(list);
    await storage.setItem('porto_catalog_categories', list);
    window.dispatchEvent(new CustomEvent('porto_categories_updated', { detail: list }));
    notify('Kategori disimpan');
  };

  const handleAddCategory = async (newCatName: string) => {
    const trimmed = (newCatName || '').trim();
    if (!trimmed) return;
    if (existingCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      notify('Kategori sudah ada', 'error');
      setEditingProduct(prev => prev ? ({ ...prev, category: trimmed }) : prev);
      return;
    }
    const newCatObj = { id: genId('cat'), name: trimmed, isActive: true };
    const updated = [newCatObj, ...categories];
    await saveCategories(updated);
    setEditingProduct(prev => prev ? ({ ...prev, category: trimmed }) : prev);
    notify('Kategori ditambahkan');
  };

  const handleDeleteCategoryByName = async (catToDelete: string) => {
    if (!catToDelete || catToDelete === 'Umum') {
      notify('Kategori Umum tidak dapat dihapus', 'error');
      return;
    }
    if (!window.confirm(`Hapus kategori "${catToDelete}"?`)) return;
    const updated = categories.filter(c => (c.name || c) !== catToDelete);
    await saveCategories(updated);
    if (editingProduct && editingProduct.category === catToDelete) {
      setEditingProduct(prev => prev ? ({ ...prev, category: 'Umum' }) : prev);
    }
    const updatedProducts = products.map(p => p.category === catToDelete ? { ...p, category: 'Umum' } : p);
    if (JSON.stringify(updatedProducts) !== JSON.stringify(products)) {
      await saveProducts(updatedProducts);
    }
    notify('Kategori dihapus');
  };

  const saveVouchers = async (list) => {
    setVouchers(list);
    await storage.setItem('porto_catalog_vouchers', list);
    notify('Voucher disimpan');
  };

  const doUpload = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadToCloudinary(file);
      if (res && res.url) setter(res.url);
      else notify('Gagal upload gambar', 'error');
    } catch(err) {
      console.error(err);
      notify('Gagal upload gambar', 'error');
    }
    setIsUploading(false);
    e.target.value = '';
  };

  /* --- Product Actions --- */
  const handleSaveProduct = async () => {
    if (!editingProduct.name) { notify('Nama wajib diisi', 'error'); return; }
    
    const isNew = !editingProduct.id;
    let newList;
    const finalPrd = { ...editingProduct };
    if (editingProduct.id) {
      newList = products.map(p => p.id === editingProduct.id ? finalPrd : p);
    } else {
      newList = [{...finalPrd, id: genId('prd')}, ...products];
    }
    await saveProducts(newList);

    // ── 3-WAY SYNC TO RATE CARD & KEUANGAN ──
    if (finalPrd.rateCardId) {
      try {
        const rateCards = await storage.getItem('porto_rate_cards', []);
        if (Array.isArray(rateCards)) {
          const updatedCards = rateCards.map((rc: any) => {
            if (rc.id === finalPrd.rateCardId) {
              return {
                ...rc,
                title: finalPrd.name,
                price: Number(finalPrd.price) || 0,
                originalPrice: finalPrd.originalPrice ? Number(finalPrd.originalPrice) : undefined,
                category: finalPrd.category || rc.category
              };
            }
            return rc;
          });
          await storage.setItem('porto_rate_cards', updatedCards);
          window.dispatchEvent(new CustomEvent('porto_ratecards_updated', { detail: updatedCards }));
        }
      } catch (err) {
        console.error('Failed to sync to rate card:', err);
      }
    } else if (finalPrd.rateCardAddonId) {
      try {
        const addons = await storage.getItem('porto_rate_card_addons', []);
        if (Array.isArray(addons)) {
          const updatedAddons = addons.map((a: any) => {
            if (a.id === finalPrd.rateCardAddonId) {
              return {
                ...a,
                name: finalPrd.name,
                priceIdr: Number(finalPrd.price) || 0,
                category: finalPrd.category || a.category
              };
            }
            return a;
          });
          await storage.setItem('porto_rate_card_addons', updatedAddons);
          window.dispatchEvent(new CustomEvent('porto_ratecard_addons_updated', { detail: updatedAddons }));
        }
      } catch (err) {
        console.error('Failed to sync to rate card addons:', err);
      }
    }

    notifyCatalog(editingProduct.name, isNew ? 'dibuat' : 'disimpan');
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id) => {
    confirm('Hapus produk ini?', () => {
      saveProducts(products.filter(p => p.id !== id));
      setSelectedProductIds(prev => prev.filter(x => x !== id));
    });
  };

  const toggleSelectProduct = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === products.length && products.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const handleBulkDeleteProducts = () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    confirm(`Hapus ${count} produk yang ditandai?`, () => {
      saveProducts(products.filter(p => !selectedProductIds.includes(p.id)));
      setSelectedProductIds([]);
      notify?.(`🗑️ ${count} produk berhasil dihapus`, 'success');
    });
  };

  /* --- Category Actions --- */
  const handleSaveCategory = () => {
    if (!editingCategory.name) { notify('Nama kategori wajib diisi', 'error'); return; }
    let newList;
    if (editingCategory.id) {
      newList = categories.map(c => c.id === editingCategory.id ? editingCategory : c);
    } else {
      newList = [{...editingCategory, id: genId('cat')}, ...categories];
    }
    saveCategories(newList);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id) => {
    confirm('Hapus kategori ini?', () => {
      saveCategories(categories.filter(c => c.id !== id));
    });
  };

  /* --- Voucher Actions --- */
  const handleSaveVoucher = () => {
    if (!editingVoucher.code) { notify('Kode voucher wajib diisi', 'error'); return; }
    let newList;
    if (editingVoucher.id) {
      newList = vouchers.map(v => v.id === editingVoucher.id ? editingVoucher : v);
    } else {
      newList = [{...editingVoucher, id: genId('vch')}, ...vouchers];
    }
    saveVouchers(newList);
    setEditingVoucher(null);
  };

  const handleDeleteVoucher = (id) => {
    confirm('Hapus voucher ini?', () => {
      saveVouchers(vouchers.filter(v => v.id !== id));
    });
  };

  /* --- Settings Actions --- */
  const handleBroadcastProductToFeed = async (p: any) => {
    try {
      const existingUpdates = (await storage.getItem('porto_social_updates', [])) || [];
      const isFlashSale = p.flashSale?.isActive && new Date(p.flashSale.endTime).getTime() > Date.now();
      
      const newUpdateId = `upd-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const todayDate = nowIso.slice(0, 10);

      const sticker = isFlashSale ? {
        type: 'flash_sale',
        productId: p.id,
        title: p.name,
        originalPrice: p.originalPrice || p.price,
        salePrice: p.flashSale.salePrice,
        discountPercent: p.flashSale.discountPercent,
        endTime: p.flashSale.endTime,
        productUrl: `/katalog/p/${p.id}`,
        imageUrl: p.gallery?.[0] || '',
        stockLeft: p.flashSale.stockLimit || p.stock || 10
      } : {
        type: 'product_card',
        productId: p.id,
        title: p.name,
        price: p.price,
        originalPrice: p.originalPrice || p.price,
        imageUrl: p.gallery?.[0] || '',
        productUrl: `/katalog/p/${p.id}`,
        badge: 'PRODUK KATALOG',
        buttonText: 'Beli di Store'
      };

      const newUpdate = {
        id: newUpdateId,
        title: isFlashSale ? `Flash Sale: ${p.name}` : `Drop Produk: ${p.name}`,
        category: 'product',
        content: p.description?.slice(0, 200) || `Kini hadir di katalog store sumr.day Studio: ${p.name}. Dapatkan penawaran terbaik dengan kualitas terstandar.`,
        mediaUrls: Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery : [],
        mediaType: 'image',
        projectTag: p.category || 'Katalog Store',
        projectUrl: `/katalog/p/${p.id}`,
        ctaLabel: isFlashSale ? 'Serbu Flash Sale' : 'Buka di Store',
        badge: isFlashSale ? 'Flash Sale' : 'Produk Baru',
        price: isFlashSale ? formatRp(p.flashSale.salePrice) : formatRp(p.price),
        customDate: todayDate,
        createdAt: nowIso,
        likesCount: 0,
        isPinned: !!isFlashSale,
        isPublished: true,
        sticker,
        author: {
          name: 'sumr.day',
          role: 'Creative Digital Studio & Enterprise Systems',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
        }
      };

      const updated = [newUpdate, ...(Array.isArray(existingUpdates) ? existingUpdates : [])];
      await storage.setItem('porto_social_updates', updated);
      window.dispatchEvent(new CustomEvent('porto_social_updates_changed', { detail: updated }));
      window.dispatchEvent(new CustomEvent('porto_updates_updated', { detail: updated }));
      notify(`✓ Produk "${p.name}" berhasil disiarkan ke Feed Beranda!`, 'success');
    } catch (err) {
      console.error('Broadcast product error:', err);
      notify('Gagal menyiarkan produk ke feed', 'error');
    }
  };

  const handleBulkBroadcastProducts = async () => {
    if (selectedProductIds.length === 0) return;
    const selectedProds = products.filter(p => selectedProductIds.includes(p.id));
    for (const p of selectedProds) {
      await handleBroadcastProductToFeed(p);
    }
    setSelectedProductIds([]);
    notify(`✓ Berhasil menyiarkan ${selectedProds.length} produk terpilih ke Feed!`, 'success');
  };
  // Auto-save shopSettings whenever it changes
  useEffect(() => {
    if (!loading && shopSettings) {
      const timer = setTimeout(() => {
        storage.setItem('porto_shop_settings', shopSettings);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shopSettings, loading]);

  const handleSaveSettings = async () => {
    setIsUploading(true);
    try {
      await storage.setItem('porto_shop_settings', shopSettings);
      notify('Pengaturan Transaksi disimpan');
    } catch(err: any) {
      console.error('Save settings error:', err);
      notify('Gagal menyimpan pengaturan: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Shared Styles
  const S = {
    panel: { background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 20 },
    label: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' },
    input: { width: '100%', height: 44, padding: '0 16px', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 12, color: 'var(--cms-text)', fontSize: 13, outline: 'none' },
    infoIcon: { cursor: 'help', color: 'var(--cms-text-muted)', opacity: 0.7 }
  };

  if (loading) return <div style={{padding:40, textAlign:'center'}}>Memuat...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--cms-bg)' }}>
      {/* LEFT / CENTER: Main Area */}
      <div 
        className="catalog-manager-root"
        {...bindContextMenu(() => ({
          title: 'Katalog Layanan & Produk',
          subtitle: `${products.length} produk terdaftar`,
          items: [
            {
              label: 'Tambah Produk Baru',
              icon: <Plus size={15} color="var(--cms-accent)" />,
              action: () => setEditingProduct(INITIAL_PRODUCT)
            },
            {
              label: selectedProductIds.length > 0 ? 'Batalkan Semua Pilihan' : 'Mode Pilih: Tandai Semua Produk',
              icon: <Check size={15} color="#6366f1" />,
              action: selectedProductIds.length > 0 ? () => setSelectedProductIds([]) : handleSelectAllProducts
            },
            ...(selectedProductIds.length > 0 ? [
              {
                label: `Hapus ${selectedProductIds.length} Produk Ditandai`,
                icon: <Trash2 size={15} color="#ef4444" />,
                danger: true,
                action: handleBulkDeleteProducts
              }
            ] : [])
          ]
        }))}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isMobile ? '16px 16px 90px' : '24px 24px 80px', 
          display: 'flex', 
          flexDirection: 'column', 
          boxSizing: 'border-box'
        }}
      >
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24, boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                title="Kembali ke Vault"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                  background: 'var(--cms-card-bg, #1e293b)',
                  color: 'var(--cms-text, #f8fafc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--cms-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Store size={24} color="var(--cms-accent)" /> Drops
            </h1>
          </div>
          
          {!(editingProduct || editingCategory || editingVoucher) && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button 
                onClick={() => setActiveTab('products')}
                title="Produk"
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 100, border: 'none', background: activeTab === 'products' ? 'var(--cms-accent)' : 'var(--cms-panel-bg)', color: activeTab === 'products' ? '#fff' : 'var(--cms-text)', cursor: 'pointer', transition: '0.2s' }}>
                <Package size={20} />
              </button>
              <button 
                onClick={() => setActiveTab('categories')}
                title="Kategori"
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 100, border: 'none', background: activeTab === 'categories' ? 'var(--cms-accent)' : 'var(--cms-panel-bg)', color: activeTab === 'categories' ? '#fff' : 'var(--cms-text)', cursor: 'pointer', transition: '0.2s' }}>
                <Store size={20} />
              </button>
              <button 
                onClick={() => setActiveTab('vouchers')}
                title="Voucher Promo"
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 100, border: 'none', background: activeTab === 'vouchers' ? 'var(--cms-accent)' : 'var(--cms-panel-bg)', color: activeTab === 'vouchers' ? '#fff' : 'var(--cms-text)', cursor: 'pointer', transition: '0.2s' }}>
                <Tag size={20} />
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                title="Pengaturan Transaksi"
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 100, border: 'none', background: activeTab === 'settings' ? 'var(--cms-accent)' : 'var(--cms-panel-bg)', color: activeTab === 'settings' ? '#fff' : 'var(--cms-text)', cursor: 'pointer', transition: '0.2s' }}>
                <Settings2 size={20} />
              </button>
            </div>
          )}
        </div>

        {!(editingProduct || editingCategory || editingVoucher) && (
          <div style={S.panel}>
            {activeTab === 'products' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 400 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--cms-text-muted)' }} />
                    <input 
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cari produk..." 
                      style={{ ...S.input, paddingLeft: 36, width: '100%' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        setFlashSaleTargetProduct(null);
                        setIsFlashSaleModalOpen(true);
                      }} 
                      style={{ 
                        flexShrink: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#ef4444', 
                        color: '#fff', 
                        border: 'none', 
                        cursor: 'pointer', 
                        boxShadow: 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                      title="Atur Flash Sale Toko (1 Produk atau Massal)"
                    >
                      <Zap size={20} fill="#fff" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingProduct(INITIAL_PRODUCT)} 
                      style={{ 
                        flexShrink: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--cms-accent)', 
                        color: '#fff', 
                        border: 'none', 
                        cursor: 'pointer',
                        boxShadow: 'none',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                      title="Tambah Produk Baru"
                    >
                      <Plus size={22} strokeWidth={2.6} />
                    </button>
                  </div>
                </div>
                
                {/* Bulk Action Bar */}
                {selectedProductIds.length > 0 && (
                  <div style={{
                    marginBottom: 16,
                    padding: '12px 18px',
                    borderRadius: 14,
                    background: 'var(--cms-card-bg, #1e293b)',
                    border: '1.5px solid var(--cms-accent, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-accent)' }}>
                        {selectedProductIds.length} Produk Ditandai
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAllProducts}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                          background: 'transparent',
                          color: 'var(--cms-text, #f8fafc)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {selectedProductIds.length === products.length ? 'Batalkan Semua' : 'Tandai Semua'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleBulkBroadcastProducts}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 10,
                          border: '1px solid rgba(99,102,241,0.3)',
                          background: 'rgba(99,102,241,0.18)',
                          color: 'var(--cms-accent, #6366f1)',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Share2 size={14} /> Siarkan ({selectedProductIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFlashSaleTargetProduct(null);
                          setIsFlashSaleModalOpen(true);
                        }}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: '#ffffff',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <Zap size={14} fill="#fff" /> Pasang Flash Sale ({selectedProductIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkDeleteProducts}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 10,
                          border: 'none',
                          background: '#ef4444',
                          color: '#ffffff',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Trash2 size={14} /> Hapus Ditandai ({selectedProductIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProductIds([])}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 10,
                          border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                          background: 'transparent',
                          color: 'var(--cms-text-muted, #94a3b8)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Segmented Filter */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                  {[
                    { id: 'all', name: 'Semua', count: products.length, icon: Layers },
                    { id: 'apps', name: 'Aplikasi', count: products.filter(p => p.type === 'Aplikasi').length, icon: Globe },
                    { id: 'services', name: 'Jasa', count: products.filter(p => p.type === 'Jasa').length, icon: Briefcase },
                    { id: 'digital', name: 'Digital', count: products.filter(p => p.type === 'Digital' || p.isDigitalAsset).length, icon: Cloud },
                    { id: 'physical', name: 'Fisik / Merch', count: products.filter(p => (p.type === 'Fisik' || !p.type) && !p.isDigitalAsset).length, icon: Package },
                    { id: 'preorder', name: 'Pre-Order', count: products.filter(p => isPreOrderProduct(p)).length, icon: Clock },
                    { id: 'flashsale', name: 'Flash Sale', count: products.filter(p => isProductFlashSaleActive(p, shopSettings)).length, icon: Zap },
                  ].map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = productFilterTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setProductFilterTab(tab.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 100,
                          border: isActive ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                          background: isActive ? 'var(--cms-accent)' : 'var(--cms-card-bg)',
                          color: isActive ? '#ffffff' : 'var(--cms-text)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <TabIcon size={13} />
                        <span>{tab.name}</span>
                        <span style={{ opacity: 0.7, fontSize: 11 }}>({tab.count})</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {products.filter(p => {
                    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                    if (!matchSearch) return false;
                    if (productFilterTab === 'apps') return p.type === 'Aplikasi';
                    if (productFilterTab === 'services') return p.type === 'Jasa';
                    if (productFilterTab === 'preorder') return isPreOrderProduct(p);
                    if (productFilterTab === 'flashsale') return isProductFlashSaleActive(p, shopSettings);
                    if (productFilterTab === 'digital') return p.type === 'Digital' || p.isDigitalAsset;
                    if (productFilterTab === 'physical') return (p.type === 'Fisik' || !p.type) && !p.isDigitalAsset;
                    return true;
                  }).map(p => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                    <div 
                      key={p.id} 
                      {...bindContextMenu(() => getProductContextMenu(p, isSelected))}
                      style={{ background: 'var(--cms-card-bg)', border: isSelected ? '2px solid var(--cms-accent, #6366f1)' : '1px solid var(--glass-border)', borderRadius: 16, overflow: 'hidden' }}
                    >
                      <div style={{ height: 160, background: '#0f172a', position: 'relative' }}>
                        {/* Checkbox button (hanya tampil saat mode pilih / ada produk ditandai) */}
                        {selectedProductIds.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => toggleSelectProduct(p.id, e)}
                            title={isSelected ? 'Batalkan pilihan' : 'Tandai produk'}
                            style={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: isSelected ? 'var(--cms-accent, #6366f1)' : 'rgba(0,0,0,0.65)',
                              border: isSelected ? '2px solid #ffffff' : '1.5px solid rgba(255,255,255,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 5
                            }}
                          >
                            {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                          </button>
                        )}
                        {p.gallery?.[0] ? (
                          <img 
                            src={getOptimizedCloudinaryUrl(p.gallery[0], { width: 500, quality: 'auto:good' })} 
                            alt={p.name || 'Produk'} 
                            loading="lazy"
                            style={{width:'100%', height:'100%', objectFit:'cover'}} 
                          />
                        ) : (
                          <ImageIcon size={40} style={{ position: 'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', opacity:0.2 }} />
                        )}
                        {p.rateCardId && (
                          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(16, 185, 129, 0.9)', backdropFilter: 'blur(8px)', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
                            <Receipt size={11} /> Rate Card
                          </div>
                        )}
                        {isPreOrderProduct(p) && (
                          <div style={{ position: 'absolute', top: 8, left: p.rateCardId ? 80 : 8, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4, zIndex: 2, boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)' }}>
                            <Clock size={11} /> Pre-Order
                          </div>
                        )}
                        {p.flashSale?.isActive && new Date(p.flashSale.endTime).getTime() > Date.now() && (
                          <div style={{ position: 'absolute', top: 8, right: p.isPublished !== false ? 8 : 60, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4, zIndex: 2, boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)' }}>
                            <Zap size={11} fill="#fff" /> Flash -{p.flashSale.discountPercent}%
                          </div>
                        )}
                        {!p.isPublished && <div style={{position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.6)', color:'#fff', padding:'4px 8px', borderRadius:4, fontSize:10, fontWeight:700}}>DRAFT</div>}
                      </div>
                      <div style={{ padding: '14px 16px 12px' }}>
                        {/* Badges bar: Kategori & Kebijakan Pembayaran */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: p.category === 'jasa' ? 'rgba(59, 130, 246, 0.12)' : isPreOrderProduct(p) ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: p.category === 'jasa' ? '#3b82f6' : isPreOrderProduct(p) ? '#f59e0b' : '#10b981',
                            border: `1px solid ${p.category === 'jasa' ? 'rgba(59, 130, 246, 0.25)' : isPreOrderProduct(p) ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {p.category === 'jasa' ? (
                              <><Briefcase size={10} /> Jasa</>
                            ) : isPreOrderProduct(p) ? (
                              <><Clock size={10} /> Pre-Order</>
                            ) : (
                              <><Package size={10} /> Ready</>
                            )}
                          </span>

                          {/* Kebijakan Pembayaran Pill */}
                          {(p.category === 'jasa' || isPreOrderProduct(p)) ? (
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: (isPreOrderProduct(p) ? p.preOrderDpAllowed === false : p.serviceDpAllowed === false)
                                ? 'rgba(16, 185, 129, 0.12)'
                                : 'rgba(234, 179, 8, 0.12)',
                              color: (isPreOrderProduct(p) ? p.preOrderDpAllowed === false : p.serviceDpAllowed === false)
                                ? '#10b981'
                                : '#eab308',
                              border: `1px solid ${(isPreOrderProduct(p) ? p.preOrderDpAllowed === false : p.serviceDpAllowed === false)
                                ? 'rgba(16, 185, 129, 0.25)'
                                : 'rgba(234, 179, 8, 0.25)'}`
                            }}>
                              {(isPreOrderProduct(p) ? p.preOrderDpAllowed === false : p.serviceDpAllowed === false) ? (
                                <><CheckCircle2 size={10} /> Lunas</>
                              ) : (
                                <><Clock size={10} /> DP 50%</>
                              )}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.25)'
                            }}>
                              <CheckCircle2 size={10} /> Lunas
                            </span>
                          )}
                        </div>

                        {/* Judul Produk */}
                        <div style={{
                          fontSize: 14,
                          fontWeight: 800,
                          lineHeight: 1.35,
                          color: 'var(--cms-text)',
                          minHeight: 38,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {p.name}
                        </div>

                        {/* Harga Section (Full Width, Tanpa Tergencet Tombol) */}
                        <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--cms-input-bg, rgba(255,255,255,0.03))', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                          {p.flashSale?.isActive && new Date(p.flashSale.endTime).getTime() > Date.now() ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--cms-text-muted)', opacity: 0.8 }}>
                                  {formatRp(p.price)}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 900, background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>
                                  -{p.flashSale.discountPercent}%
                                </span>
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 900, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                <Zap size={15} fill="#ef4444" /> {formatRp(p.flashSale.salePrice)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              {p.originalPrice > p.price && (
                                <div style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--cms-text-muted)', marginBottom: 2, opacity: 0.8 }}>
                                  {formatRp(p.originalPrice)}
                                </div>
                              )}
                              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-accent, #6366f1)', whiteSpace: 'nowrap' }}>
                                {formatRp(p.price)}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--glass-border)' }}>
                            <span>Stok: <strong style={{ color: 'var(--cms-text)' }}>{p.stock !== undefined ? p.stock : '∞'}</strong></span>
                            {isPreOrderProduct(p) ? (
                              <span style={{ color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} /> PO: {p.preOrderSold || 0}/{p.preOrderQuota || 50}
                              </span>
                            ) : (
                              <span>Terjual: <strong style={{ color: 'var(--cms-text)' }}>{p.soldCount || 0}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dedicated Bottom Action Toolbar (Collapsible Single-Button Expandable Pill) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        padding: '8px 12px 10px',
                        background: 'rgba(0,0,0,0.03)',
                        borderTop: '1px solid var(--glass-border)',
                        minHeight: 46
                      }}>
                        {expandedProductId === p.id ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: 'var(--cms-card-bg)',
                            border: '1.5px solid var(--cms-accent)',
                            borderRadius: 100,
                            padding: '3px 6px',
                            gap: 5,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                            animation: 'fadeIn 0.15s ease'
                          }}>
                            <button 
                              type="button"
                              aria-label={`Buat transaksi untuk ${p.name}`}
                              title="Buat Transaksi / Invoice" 
                              onClick={(e) => { e.stopPropagation(); handleCreateTransactionForProduct(p); }} 
                              style={{
                                width: 30, height: 30, borderRadius: '50%',
                                border: '1px solid rgba(16,185,129,0.3)',
                                background: 'rgba(16,185,129,0.12)',
                                color: '#10b981',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <Receipt size={14} />
                            </button>

                            <button 
                              type="button"
                              aria-label={`Edit produk ${p.name}`}
                              title="Edit Produk"
                              onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }} 
                              style={{
                                width: 30, height: 30, borderRadius: '50%',
                                border: '1px solid rgba(var(--cms-accent-rgb), 0.3)',
                                background: 'rgba(var(--cms-accent-rgb), 0.12)',
                                color: 'var(--cms-accent)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <Edit3 size={14} />
                            </button>

                            <button 
                              type="button"
                              aria-label={`Siarkan ${p.name} ke Feed`}
                              title="Siarkan ke Feed"
                              onClick={(e) => { e.stopPropagation(); handleBroadcastProductToFeed(p); }} 
                              style={{
                                width: 30, height: 30, borderRadius: '50%',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--cms-input-bg)',
                                color: 'var(--cms-text)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <Share2 size={13} />
                            </button>

                            <button 
                              type="button"
                              aria-label={`Flash Sale ${p.name}`}
                              title={p.flashSale?.isActive ? 'Edit Flash Sale' : 'Atur Flash Sale'}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFlashSaleTargetProduct(p);
                                setIsFlashSaleModalOpen(true);
                              }} 
                              style={{
                                width: 30, height: 30, borderRadius: '50%',
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: p.flashSale?.isActive ? 'rgba(239,68,68,0.2)' : 'var(--cms-input-bg)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <Zap size={13} fill={p.flashSale?.isActive ? '#ef4444' : 'none'} />
                            </button>

                            <button 
                              type="button"
                              aria-label={`Opsi lainnya untuk ${p.name}`}
                              title="Opsi Lainnya"
                              onClick={(e) => { e.stopPropagation(); openContextMenu(e, getProductContextMenu(p, isSelected)); }}
                              style={{
                                width: 30, height: 30, borderRadius: '50%',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--cms-input-bg)',
                                color: 'var(--cms-text-muted)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <MoreHorizontal size={14} />
                            </button>

                            <button 
                              type="button"
                              aria-label="Tutup Opsi"
                              title="Tutup Opsi"
                              onClick={(e) => { e.stopPropagation(); setExpandedProductId(null); }}
                              style={{
                                width: 24, height: 24, borderRadius: '50%',
                                border: 'none', background: 'transparent',
                                color: 'var(--cms-text-muted)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            aria-label={`Aksi untuk ${p.name}`}
                            title="Opsi & Aksi Produk" 
                            onClick={(e) => { e.stopPropagation(); setExpandedProductId(p.id); }} 
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              border: '1.5px solid var(--glass-border)',
                              background: 'var(--cms-card-bg)',
                              color: 'var(--cms-accent)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: 'var(--cms-shadow-sm)',
                              transition: 'all 0.18s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <SlidersHorizontal size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                  {products.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-card-bg)', borderRadius: 20, border: '1.5px dashed var(--glass-border)' }}>
                      <Package size={44} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>Belum Ada Produk</div>
                      <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', marginTop: 4 }}>Tambahkan produk atau layanan pertama Anda ke katalog.</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'categories' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button 
                    type="button"
                    onClick={() => setEditingCategory(INITIAL_CATEGORY)} 
                    style={{ 
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--cms-accent)', color: '#fff', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.35)',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                    title="Tambah Kategori Baru"
                  >
                    <Plus size={22} strokeWidth={2.6} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {categories.map((c, i) => (
                    <div 
                      key={c.id} 
                      {...bindContextMenu(() => ({
                        title: c.name || 'Kategori',
                        subtitle: c.isActive ? 'Status: Aktif' : 'Status: Nonaktif',
                        headerBadge: 'KATEGORI',
                        items: [
                          {
                            label: 'Edit Kategori',
                            icon: <Edit3 size={15} color="var(--cms-accent)" />,
                            action: () => setEditingCategory(c)
                          },
                          {
                            label: c.isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori',
                            icon: <CheckCircle2 size={15} color={c.isActive ? '#f59e0b' : '#10b981'} />,
                            action: async () => {
                              const updated = categories.map(cat => cat.id === c.id ? { ...cat, isActive: !cat.isActive } : cat);
                              setCategories(updated);
                              await storage.setItem('porto_catalog_categories', updated);
                              notify('Status kategori diperbarui', 'success');
                            }
                          },
                          { separator: true },
                          {
                            label: 'Hapus Kategori',
                            icon: <Trash2 size={15} />,
                            danger: true,
                            action: () => handleDeleteCategory(c.id)
                          }
                        ]
                      }))}
                      style={{ display: 'flex', gap: 16, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', padding: 16, borderRadius: 16, alignItems: 'center' }}
                    >
                      <div style={{ width: 60, height: 60, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', borderRadius: 12, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {c.image ? <img src={c.image} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Store size={24} style={{ opacity:0.35, color: 'var(--cms-text-muted)' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: c.isActive ? '#10b981' : '#ef4444', fontWeight: 700, marginTop: 4 }}>{c.isActive ? 'AKTIF' : 'TIDAK AKTIF'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setEditingCategory(c)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'var(--cms-input-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteCategory(c.id)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-card-bg)', borderRadius: 20, border: '1.5px dashed var(--glass-border)' }}>
                      <Store size={44} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>Belum Ada Kategori</div>
                      <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', marginTop: 4 }}>Buat kategori baru untuk mengelompokkan produk Anda.</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'vouchers' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button 
                    type="button"
                    onClick={() => setEditingVoucher(INITIAL_VOUCHER)} 
                    style={{ 
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--cms-accent)', color: '#fff', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.35)',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                    title="Tambah Voucher Promo"
                  >
                    <Plus size={22} strokeWidth={2.6} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {vouchers.map((v) => (
                    <div key={v.id} style={{ display: 'flex', gap: 16, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', padding: 16, borderRadius: 16, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-accent)', letterSpacing: '0.05em' }}>{v.code}</div>
                        <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                          Diskon: {v.discountType === 'percent' ? `${v.discountValue}%` : formatRp(v.discountValue)} 
                          {v.quota > 0 ? ` • Kuota: ${v.quota}` : ' • Tanpa Kuota'}
                        </div>
                        <div style={{ fontSize: 11, color: v.isActive ? '#10b981' : '#ef4444', fontWeight: 700, marginTop: 4 }}>{v.isActive ? 'AKTIF' : 'TIDAK AKTIF'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditingVoucher(v)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'var(--cms-input-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteVoucher(v.id)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {vouchers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-card-bg)', borderRadius: 20, border: '1.5px dashed var(--glass-border)' }}>
                      <BadgePercent size={44} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>Belum Ada Voucher Promo</div>
                      <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', marginTop: 4 }}>Buat kode diskon untuk menarik lebih banyak pembeli.</div>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {activeTab === 'settings' && (
              <div style={{ animation: 'cmsFadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
                {/* Hero Banner Settings */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px', color: 'var(--cms-text)' }}>Pengaturan Banner Utama Katalog</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={S.label}>Gambar Banner</label>
                      <div style={{ width: '100%', height: 120, background: '#e2e8f0', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative', marginBottom: 8 }}>
                        {shopSettings.heroBannerImage ? <img src={shopSettings.heroBannerImage} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <ImageIcon size={32} style={{ position: 'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', opacity:0.2 }} />}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <label title="Unggah dari Komputer" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, (url) => setShopSettings(prev => ({...prev, heroBannerImage: url})))} disabled={isUploading} />
                          <Upload size={18} color={isUploading ? 'var(--cms-accent)' : 'var(--cms-text)'} />
                        </label>
                        <button type="button" title="Pilih dari Galeri Media" onClick={() => { setGalleryTarget('heroBanner'); setIsGalleryOpen(true); }} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-accent)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                          <ImageIcon size={18} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={S.label}>Gaya Tata Letak (Layout)</label>
                        <GlassSelect 
                          value={shopSettings.heroBannerLayout || 'split'} 
                          onChange={e => setShopSettings({...shopSettings, heroBannerLayout: e.target.value})}
                          options={[
                            { value: 'split', label: 'Teks & Gambar (Split)' },
                            { value: 'full', label: 'Gambar Penuh (Full)' }
                          ]}
                        />
                      </div>
                      <div>
                        <label style={S.label}>Link Tujuan (URL)</label>
                        <input style={S.input} value={shopSettings.heroBannerUrl || ''} onChange={e => setShopSettings({...shopSettings, heroBannerUrl: e.target.value})} placeholder="https://..." />
                      </div>
                    </div>

                    {(shopSettings.heroBannerLayout === 'split' || !shopSettings.heroBannerLayout) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <label style={S.label}>Judul Banner</label>
                          <input style={S.input} value={shopSettings.heroBannerTitle || ''} onChange={e => setShopSettings({...shopSettings, heroBannerTitle: e.target.value})} placeholder="Your One-Stop Shop" />
                        </div>
                        <div>
                          <label style={S.label}>Teks Tombol (CTA)</label>
                          <input style={S.input} value={shopSettings.heroBannerCtaText || ''} onChange={e => setShopSettings({...shopSettings, heroBannerCtaText: e.target.value})} placeholder="Shop Now" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={S.label}>Subjudul / Deskripsi</label>
                          <input style={S.input} value={shopSettings.heroBannerSubtitle || ''} onChange={e => setShopSettings({...shopSettings, heroBannerSubtitle: e.target.value})} placeholder="Fast shipping..." />
                        </div>
                      </div>
                    )}
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginTop: 8 }}>
                      <input type="checkbox" checked={shopSettings.heroBannerActive !== false} onChange={e => setShopSettings({...shopSettings, heroBannerActive: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)' }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Tayangkan Banner Ini di Katalog</span>
                    </label>
                  </div>
                </div>
                
                <hr style={{ border: 0, borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />

                <div>
                  <label style={S.label}>Nomor WhatsApp Transaksi</label>
                  <input style={S.input} value={shopSettings.whatsappNumber || ''} onChange={e => setShopSettings({...shopSettings, whatsappNumber: e.target.value})} placeholder="Misal: 6281234567890 (Gunakan 62)" />
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 8 }}>Nomor ini akan dihubungi saat pelanggan checkout. Gunakan format awalan 62 tanpa spasi/tanda hubung.</div>
                </div>

                <div>
                  <label style={S.label}>Format Teks WhatsApp Otomatis</label>
                  <textarea 
                    style={{...S.input, height: 160, paddingTop: 12, resize: 'vertical', fontSize: 13}} 
                    value={shopSettings.waMessageFormat !== undefined ? shopSettings.waMessageFormat : "Halo, saya telah melakukan pembayaran pesanan:\n\n*Detail Pesanan:*\n{detail_pesanan}\n\n*Total Tagihan:* {total}\n\n*Data Pemesan:*\nNama: {nama}\nEmail: {email}\nCatatan: {catatan}\n\n*Bukti Pembayaran:*\n{bukti_tf}\n\nMohon segera diproses, terima kasih!"} 
                    onChange={e => setShopSettings({...shopSettings, waMessageFormat: e.target.value})} 
                  />
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                    Gunakan variabel berikut untuk menampilkan data dinamis:<br/>
                    <code>{'{nama}'}</code>, <code>{'{email}'}</code>, <code>{'{catatan}'}</code>, <code>{'{detail_pesanan}'}</code>, <code>{'{total}'}</code>, <code>{'{bukti_tf}'}</code>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <label style={{...S.label, marginBottom:0}}>Metode Pembayaran / Rekening Bank</label>
                    <button onClick={() => {
                      setShopSettings({...shopSettings, paymentMethods: [...(shopSettings.paymentMethods || []), { id: genId('pm'), bankName: '', accountNumber: '', accountName: '' }]});
                    }} style={{ background: 'transparent', color: 'var(--cms-accent)', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <Plus size={14} /> Tambah
                    </button>
                  </div>
                  {(shopSettings.paymentMethods || []).map((pm, idx) => (
                    <div key={pm.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 12, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                      <input style={S.input} placeholder="Nama Bank (mis: BCA)" value={pm.bankName} onChange={e => {
                        const arr = [...shopSettings.paymentMethods]; arr[idx].bankName = e.target.value;
                        setShopSettings({...shopSettings, paymentMethods: arr});
                      }} />
                      <input style={S.input} placeholder="No. Rekening" value={pm.accountNumber} onChange={e => {
                        const arr = [...shopSettings.paymentMethods]; arr[idx].accountNumber = e.target.value;
                        setShopSettings({...shopSettings, paymentMethods: arr});
                      }} />
                      <input style={S.input} placeholder="Atas Nama" value={pm.accountName} onChange={e => {
                        const arr = [...shopSettings.paymentMethods]; arr[idx].accountName = e.target.value;
                        setShopSettings({...shopSettings, paymentMethods: arr});
                      }} />
                      <button onClick={() => {
                        const arr = [...shopSettings.paymentMethods]; arr.splice(idx, 1);
                        setShopSettings({...shopSettings, paymentMethods: arr});
                      }} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {(!shopSettings.paymentMethods || shopSettings.paymentMethods.length === 0) && <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontStyle: 'italic', marginBottom: 12 }}>Belum ada metode pembayaran.</div>}
                </div>

                {/* QRIS Toko Pribadi (0% Fee, Bebas Biaya & Tanpa EDC) */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>QRIS Toko Pribadi (0% Potongan / Bebas Biaya)</h4>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--cms-text-muted)' }}>Tampilkan barcode QRIS dari BCA, Mandiri, GoPay, OVO, Dana, atau ShopeePay Anda di checkout</p>
                    </div>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 800 }}>
                      BEBAS EDC & MDR
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', border: '1.5px dashed var(--glass-border)', background: '#090a12', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {shopSettings.qrisImageUrl ? (
                        <>
                          <img src={shopSettings.qrisImageUrl} alt="QRIS Toko" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                          <button 
                            type="button" 
                            onClick={() => setShopSettings({...shopSettings, qrisImageUrl: ''})} 
                            style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Hapus gambar QRIS"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 12, color: 'var(--cms-text-muted)' }}>
                          <ImageIcon size={32} style={{ opacity: 0.3, margin: '0 auto 6px' }} />
                          <div style={{ fontSize: 11, fontWeight: 600 }}>Belum Ada Foto QRIS</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={S.label}>Nama Merchant di QRIS</label>
                        <input 
                          style={S.input} 
                          placeholder="Misal: AGENZE STUDIO KREATIF" 
                          value={shopSettings.qrisMerchantName || ''} 
                          onChange={e => setShopSettings({...shopSettings, qrisMerchantName: e.target.value})} 
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <label title="Unggah Foto QRIS dari Komputer" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, (url) => setShopSettings(prev => ({...prev, qrisImageUrl: url})))} disabled={isUploading} />
                          <Upload size={18} color={isUploading ? 'var(--cms-accent)' : 'var(--cms-text)'} />
                        </label>
                        <button 
                          type="button" 
                          title="Pilih dari Galeri Media"
                          onClick={() => { setGalleryTarget('qrisImage'); setIsGalleryOpen(true); }} 
                          style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-accent)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}
                        >
                          <ImageIcon size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner Flash Sale & Urgensi Promo */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <span>Banner Flash Sale Timer (Pemicu Keputusan Beli)</span>
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--cms-text-muted)' }}>Menampilkan bar countdown hitung mundur di bagian atas katalog produk</p>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={!!shopSettings.flashSaleActive} 
                        onChange={e => setShopSettings({...shopSettings, flashSaleActive: e.target.checked})} 
                        style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)' }} 
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: shopSettings.flashSaleActive ? 'var(--cms-accent)' : 'var(--cms-text-muted)' }}>
                        {shopSettings.flashSaleActive ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </label>
                  </div>

                  {shopSettings.flashSaleActive && (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 120px', gap: 12, marginTop: 12 }}>
                      <div>
                        <label style={S.label}>Judul Promo Flash Sale</label>
                        <input 
                          style={S.input} 
                          placeholder="Cth: FLASH SALE: Diskon Aset Digital Terbatas!" 
                          value={shopSettings.flashSaleTitle || ''} 
                          onChange={e => setShopSettings({...shopSettings, flashSaleTitle: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label style={S.label}>Waktu Berakhir Promo</label>
                        <input 
                          type="datetime-local" 
                          style={S.input} 
                          value={shopSettings.flashSaleEndTime || ''} 
                          onChange={e => setShopSettings({...shopSettings, flashSaleEndTime: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label style={S.label}>Diskon (%)</label>
                        <input 
                          type="number" 
                          style={S.input} 
                          placeholder="30" 
                          value={shopSettings.flashSaleDiscountPercent || 0} 
                          onChange={e => setShopSettings({...shopSettings, flashSaleDiscountPercent: parseInt(e.target.value) || 0})} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Localization Settings */}
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: '24px 0 16px', color: 'var(--cms-text)' }}>Teks Tampilan Katalog (Terjemahan)</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={S.label}>Judul Kategori Terpopuler</label>
                      <input style={S.input} value={shopSettings.txtTrendingCategories || ''} onChange={e => setShopSettings({...shopSettings, txtTrendingCategories: e.target.value})} placeholder="Default: Kategori Terpopuler" />
                    </div>
                    <div>
                      <label style={S.label}>Judul Produk Pilihan</label>
                      <input style={S.input} value={shopSettings.txtProductOfMonth || ''} onChange={e => setShopSettings({...shopSettings, txtProductOfMonth: e.target.value})} placeholder="Default: Produk Pilihan" />
                    </div>
                    <div>
                      <label style={S.label}>Tombol Lihat Kategori</label>
                      <input style={S.input} value={shopSettings.txtExploreBtn || ''} onChange={e => setShopSettings({...shopSettings, txtExploreBtn: e.target.value})} placeholder="Default: Lihat" />
                    </div>
                    <div>
                      <label style={S.label}>Label Diskon (Populer)</label>
                      <input style={S.input} value={shopSettings.txtPopularTag || ''} onChange={e => setShopSettings({...shopSettings, txtPopularTag: e.target.value})} placeholder="Default: POPULER" />
                    </div>
                    <div>
                      <label style={S.label}>Tombol Beli (Card)</label>
                      <input style={S.input} value={shopSettings.txtBuyNow || ''} onChange={e => setShopSettings({...shopSettings, txtBuyNow: e.target.value})} placeholder="Default: Beli Sekarang" />
                    </div>
                    <div>
                      <label style={S.label}>Tombol Checkout (Detail)</label>
                      <input style={S.input} value={shopSettings.txtCheckoutBtn || ''} onChange={e => setShopSettings({...shopSettings, txtCheckoutBtn: e.target.value})} placeholder="Default: Buat Pesanan & Lanjut ke Chat" />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSaveSettings} style={{ height: 44, padding: '0 24px', borderRadius: 100, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                    <Save size={18} /> Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Editor */}
        {editingProduct && (
          <div style={{ animation: 'cmsFadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header ditaruh di luar/atas dua kolom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => setEditingProduct(null)} style={{ width: 44, height: 44, borderRadius: 100, border: '1px solid var(--glass-border)', background: 'var(--cms-panel-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}><ArrowLeft size={20} /></button>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--cms-text)' }}>{editingProduct.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 500px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ ...S.panel, padding: 32 }}>
                {editingProduct.rateCardId && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 14,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 20
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#10b981', flexShrink: 0
                    }}>
                      <Receipt size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span>Tersinkronisasi Otomatis 3-Arah</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: '#10b981', color: '#fff', fontWeight: 800 }}>
                          Rate Card ↔ Katalog ↔ Keuangan
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 3 }}>
                        Nama, harga, dan kategori terhubung akurat. Anda cukup lengkapi Galeri Foto/Gambar dan Detail Pemesanan di bawah ini.
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>Nama Produk</label>
                  <input style={S.input} value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="Contoh: Paket Website Premium" />
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={S.label}>Kode Produk (SKU)</label>
                    <input style={S.input} value={editingProduct.productCode || ''} onChange={e => setEditingProduct({...editingProduct, productCode: e.target.value})} placeholder="Contoh: PKT-WEB" />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={S.label}>Stok Saat Ini</label>
                    <input type="number" style={S.input} value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})} placeholder="Jumlah Stok" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ ...S.label, marginBottom: 0 }}>Kategori</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          const val = window.prompt('Nama kategori baru:');
                          if (val) handleAddCategory(val);
                        }} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Tambah Kategori"
                      >
                        <Plus size={13} /> Kategori
                      </button>
                    </div>
                    <GlassSelect 
                      value={editingProduct.category} 
                      onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                      onAddOption={handleAddCategory}
                      onDeleteOption={handleDeleteCategoryByName}
                      addPlaceholder="Kategori baru..."
                      options={existingCategories.map(c => ({ 
                        value: c, 
                        label: c, 
                        canDelete: c !== 'Umum' 
                      }))}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={S.label}>Tipe Produk</label>
                    <GlassSelect 
                      value={editingProduct.type} 
                      onChange={e => setEditingProduct({...editingProduct, type: e.target.value})}
                      options={[
                        { value: 'Fisik', label: 'Fisik / Merch' },
                        { value: 'Digital', label: 'Aset Digital' },
                        { value: 'Jasa', label: 'Jasa / Custom' },
                        { value: 'Aplikasi', label: 'Aplikasi (Web-Based)' }
                      ]}
                    />
                  </div>
                </div>

                {/* ── ATURAN DINAMIS SESUAI TIPE PRODUK ── */}
                {/* 1. ATURAN DIGITAL ASSET */}
                {editingProduct.type === 'Digital' && (
                  <div style={{ 
                    marginBottom: 20, 
                    padding: 18, 
                    borderRadius: 18, 
                    background: 'rgba(59, 130, 246, 0.05)', 
                    border: '1.5px solid rgba(59, 130, 246, 0.3)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Cloud size={18} color="#3b82f6" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                          Aset Digital
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: 10.5, 
                        padding: '3px 10px', 
                        borderRadius: 100, 
                        background: 'rgba(59, 130, 246, 0.15)', 
                        color: '#3b82f6', 
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <CheckCircle2 size={12} /> Lunas
                      </span>
                    </div>

                    {/* Toggle Checkbox - BISA DI-UNCHECK */}
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12, 
                      cursor: 'pointer', 
                      background: 'var(--cms-bg)', 
                      padding: '12px 16px', 
                      borderRadius: 14, 
                      border: '1px solid var(--glass-border)', 
                      marginBottom: 14 
                    }}>
                      <input 
                        type="checkbox" 
                        checked={editingProduct.isDigitalAsset !== false} 
                        onChange={e => setEditingProduct({
                          ...editingProduct, 
                          isDigitalAsset: e.target.checked
                        })} 
                        style={{ width: 18, height: 18, accentColor: '#3b82f6', cursor: 'pointer' }} 
                      />
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', display: 'block' }}>
                          Kirim Instan
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                          {editingProduct.isDigitalAsset !== false 
                            ? 'Akses unduh di portal /akun saat lunas' 
                            : 'Pengiriman manual oleh admin'}
                        </span>
                      </div>
                    </label>

                    {editingProduct.isDigitalAsset !== false && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={S.label}>Tautan File *</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input 
                              style={{...S.input, flex: 1}} 
                              placeholder="https://drive.google.com/... atau link berkas" 
                              value={editingProduct.downloadUrl || ''} 
                              onChange={e => setEditingProduct({...editingProduct, downloadUrl: e.target.value})} 
                            />
                            <button 
                              type="button" 
                              onClick={() => { setGalleryTarget('digitalFile'); setIsGalleryOpen(true); }} 
                              style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--cms-accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: '0.15s' }}
                              title="Pilih Media"
                            >
                              <ImageIcon size={18} />
                            </button>
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                            Google Drive publik, Cloudinary, Dropbox, Notion, atau Canva.
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={S.label}>Format Berkas</label>
                            <GlassSelect 
                              value={editingProduct.fileFormat || 'ZIP'} 
                              onChange={e => setEditingProduct({...editingProduct, fileFormat: e.target.value})}
                              options={[
                                { value: 'ZIP', label: 'ZIP / RAR' },
                                { value: 'PDF', label: 'E-Book / PDF' },
                                { value: 'CANVA', label: 'Canva' },
                                { value: 'JSON', label: 'JSON / Preset' },
                                { value: 'AUDIO', label: 'Audio MP3' },
                                { value: 'VIDEO', label: 'Video MP4' },
                                { value: 'LINK', label: 'Portal Web' }
                              ]}
                            />
                          </div>
                          <div>
                            <label style={S.label}>Ukuran Berkas</label>
                            <input 
                              style={S.input} 
                              placeholder="Contoh: 45 MB" 
                              value={editingProduct.fileSize || ''} 
                              onChange={e => setEditingProduct({...editingProduct, fileSize: e.target.value})} 
                            />
                          </div>
                        </div>

                        <div>
                          <label style={S.label}>Kunci Lisensi</label>
                          <textarea 
                            style={{ ...S.input, height: 75, paddingTop: 10, resize: 'vertical', fontSize: 12 }} 
                            placeholder="Instruksi / password ZIP hanya terlihat oleh pembeli saat lunas..." 
                            value={editingProduct.instantDeliveryMessage || ''} 
                            onChange={e => setEditingProduct({...editingProduct, instantDeliveryMessage: e.target.value})} 
                          />
                        </div>

                        {/* Jangka Waktu Akses Aset Digital */}
                        <div style={{
                          padding: '12px 14px',
                          borderRadius: 14,
                          background: 'var(--cms-card-bg)',
                          border: '1px solid var(--glass-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)', display: 'block' }}>
                                Jangka Waktu Akses Berkas
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                                Atur masa aktif download berkas digital untuk akun pembeli.
                              </span>
                            </div>
                            <div style={{
                              display: 'inline-flex',
                              background: 'var(--cms-input-bg)',
                              borderRadius: 100,
                              padding: 3,
                              border: '1px solid var(--glass-border)'
                            }}>
                              <button
                                type="button"
                                onClick={() => setEditingProduct({ ...editingProduct, accessModel: 'lifetime' })}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 100,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: (editingProduct.accessModel || 'lifetime') === 'lifetime' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                                  color: (editingProduct.accessModel || 'lifetime') === 'lifetime' ? '#ffffff' : 'var(--cms-text-muted)',
                                  transition: '0.15s'
                                }}
                              >
                                Selamanya
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProduct({ ...editingProduct, accessModel: 'limited' })}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 100,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: editingProduct.accessModel === 'limited' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                                  color: editingProduct.accessModel === 'limited' ? '#ffffff' : 'var(--cms-text-muted)',
                                  transition: '0.15s'
                                }}
                              >
                                Batas Waktu
                              </button>
                            </div>
                          </div>

                          {editingProduct.accessModel === 'limited' && (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              paddingTop: 8,
                              borderTop: '1px dashed var(--glass-border)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Pilihan Cepat:</span>
                                {[
                                  { days: 7, label: '7 Hari' },
                                  { days: 30, label: '30 Hari' },
                                  { days: 90, label: '90 Hari' },
                                  { days: 180, label: '6 Bulan' },
                                  { days: 365, label: '1 Tahun' }
                                ].map(p => (
                                  <button
                                    key={p.days}
                                    type="button"
                                    onClick={() => setEditingProduct({ ...editingProduct, durationDays: p.days })}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: 100,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      border: '1px solid var(--glass-border)',
                                      cursor: 'pointer',
                                      background: editingProduct.durationDays === p.days ? 'rgba(124, 58, 237, 0.15)' : 'var(--cms-input-bg)',
                                      color: editingProduct.durationDays === p.days ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text)'
                                    }}
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                  type="number"
                                  min="1"
                                  style={{ ...S.input, width: 100 }}
                                  value={editingProduct.durationDays || 30}
                                  onChange={e => setEditingProduct({ ...editingProduct, durationDays: parseInt(e.target.value) || 30 })}
                                />
                                <span style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
                                  Hari masa aktif setelah pembelian lunas. Admin tetap dapat memperpanjang atau mencabut akses kapan saja.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ATURAN JASA PROYEK */}
                {editingProduct.type === 'Jasa' && (
                  <div style={{ 
                    marginBottom: 20, 
                    padding: 18, 
                    borderRadius: 18, 
                    background: 'rgba(124, 58, 237, 0.05)', 
                    border: '1.5px solid rgba(124, 58, 237, 0.3)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Briefcase size={18} color="#8b5cf6" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                          Jasa Proyek
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: 10.5, 
                        padding: '3px 10px', 
                        borderRadius: 100, 
                        background: 'rgba(124, 58, 237, 0.15)', 
                        color: '#8b5cf6', 
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Briefcase size={12} /> Jasa
                      </span>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ ...S.label, marginBottom: 8, color: 'var(--cms-text)' }}>
                        Aturan Bayar *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <label style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 4, 
                          padding: '12px 14px', 
                          borderRadius: 14, 
                          border: editingProduct.serviceDpAllowed !== false ? '1.5px solid #8b5cf6' : '1px solid var(--glass-border)', 
                          background: editingProduct.serviceDpAllowed !== false ? 'rgba(124, 58, 237, 0.12)' : 'var(--cms-bg)', 
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input 
                              type="radio" 
                              name="editServiceDpPolicy" 
                              checked={editingProduct.serviceDpAllowed !== false} 
                              onChange={() => setEditingProduct({ ...editingProduct, serviceDpAllowed: true })} 
                              style={{ accentColor: '#8b5cf6', width: 16, height: 16 }} 
                            />
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <Clock size={14} color="#8b5cf6" /> DP 50%
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', paddingLeft: 24 }}>
                            Sisa saat serah terima
                          </span>
                        </label>

                        <label style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 4, 
                          padding: '12px 14px', 
                          borderRadius: 14, 
                          border: editingProduct.serviceDpAllowed === false ? '1.5px solid #10b981' : '1px solid var(--glass-border)', 
                          background: editingProduct.serviceDpAllowed === false ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-bg)', 
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input 
                              type="radio" 
                              name="editServiceDpPolicy" 
                              checked={editingProduct.serviceDpAllowed === false} 
                              onChange={() => setEditingProduct({ ...editingProduct, serviceDpAllowed: false })} 
                              style={{ accentColor: '#10b981', width: 16, height: 16 }} 
                            />
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <CheckCircle2 size={14} color="#10b981" /> Lunas 100%
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', paddingLeft: 24 }}>
                            Bayar di awal
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label style={S.label}>Estimasi Waktu</label>
                      <input 
                        style={S.input} 
                        placeholder="Contoh: 3-5 Hari Kerja" 
                        value={editingProduct.serviceDuration || ''} 
                        onChange={e => setEditingProduct({...editingProduct, serviceDuration: e.target.value})} 
                      />
                    </div>
                  </div>
                )}

                {/* 3. ATURAN BARANG FISIK & PRE-ORDER */}
                {editingProduct.type === 'Fisik' && (
                  <div style={{ 
                    marginBottom: 20, 
                    padding: 18, 
                    borderRadius: 18, 
                    background: editingProduct.isPreOrder ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
                    border: editingProduct.isPreOrder ? '1.5px solid rgba(245, 158, 11, 0.35)' : '1.5px solid rgba(16, 185, 129, 0.35)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={18} color={editingProduct.isPreOrder ? '#f59e0b' : '#10b981'} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                          Produk Fisik
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: 10.5, 
                        padding: '3px 10px', 
                        borderRadius: 100, 
                        background: editingProduct.isPreOrder ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                        color: editingProduct.isPreOrder ? '#f59e0b' : '#10b981', 
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {editingProduct.isPreOrder ? <><Clock size={12} /> Pre-Order</> : <><Package size={12} /> Ready Stock</>}
                      </span>
                    </div>

                    {/* Radio Ready Stock vs Pre-Order */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: editingProduct.isPreOrder ? 16 : 0 }}>
                      <label style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 4, 
                        padding: '12px 14px', 
                        borderRadius: 14, 
                        border: !editingProduct.isPreOrder ? '1.5px solid #10b981' : '1px solid var(--glass-border)', 
                        background: !editingProduct.isPreOrder ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-bg)', 
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input 
                            type="radio" 
                            name="editPhysicalMode" 
                            checked={!editingProduct.isPreOrder} 
                            onChange={() => setEditingProduct({ ...editingProduct, isPreOrder: false })} 
                            style={{ accentColor: '#10b981', width: 16, height: 16 }} 
                          />
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Package size={14} color="#10b981" /> Ready Stock
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', paddingLeft: 24 }}>
                          Kirim saat lunas
                        </span>
                      </label>

                      <label style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 4, 
                        padding: '12px 14px', 
                        borderRadius: 14, 
                        border: editingProduct.isPreOrder ? '1.5px solid #f59e0b' : '1px solid var(--glass-border)', 
                        background: editingProduct.isPreOrder ? 'rgba(245, 158, 11, 0.12)' : 'var(--cms-bg)', 
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input 
                            type="radio" 
                            name="editPhysicalMode" 
                            checked={!!editingProduct.isPreOrder} 
                            onChange={() => setEditingProduct({ ...editingProduct, isPreOrder: true })} 
                            style={{ accentColor: '#f59e0b', width: 16, height: 16 }} 
                          />
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={14} color="#f59e0b" /> Pre-Order
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', paddingLeft: 24 }}>
                          Sistem kuota & batch
                        </span>
                      </label>
                    </div>

                    {/* Pre-Order Details */}
                    {editingProduct.isPreOrder && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px dashed var(--glass-border)', paddingTop: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={S.label}>Nomor Batch</label>
                            <input 
                              style={S.input} 
                              placeholder="Misal: Batch 1" 
                              value={editingProduct.preOrderBatch || ''} 
                              onChange={e => setEditingProduct({...editingProduct, preOrderBatch: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label style={S.label}>Tutup PO</label>
                            <DatePicker 
                              selected={editingProduct.preOrderCloseDate ? new Date(editingProduct.preOrderCloseDate) : null}
                              onChange={(date: Date | null) => setEditingProduct({
                                ...editingProduct, 
                                preOrderCloseDate: date ? date.toISOString().split('T')[0] : ''
                              })}
                              dateFormat="dd MMMM yyyy"
                              placeholderText="Pilih tanggal"
                              className="cms-glass-datepicker"
                              calendarClassName="cms-glass-calendar"
                              wrapperClassName="cms-datepicker-wrapper"
                              popperClassName="cms-datepicker-popper"
                              popperPlacement="bottom-start"
                              portalId="root"
                            />
                          </div>
                        </div>

                        <div>
                          <label style={S.label}>Estimasi Kirim *</label>
                          <input 
                            style={S.input} 
                            placeholder="Contoh: 14-21 Hari Kerja" 
                            value={editingProduct.preOrderEstimate || ''} 
                            onChange={e => setEditingProduct({...editingProduct, preOrderEstimate: e.target.value})} 
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={S.label}>Target Kuota</label>
                            <input 
                              type="number"
                              style={S.input} 
                              placeholder="50" 
                              value={editingProduct.preOrderQuota || 0} 
                              onChange={e => setEditingProduct({...editingProduct, preOrderQuota: parseInt(e.target.value) || 0})} 
                            />
                          </div>
                          <div>
                            <label style={S.label}>Jumlah Terpesan</label>
                            <input 
                              type="number"
                              style={S.input} 
                              placeholder="0" 
                              value={editingProduct.preOrderSold || 0} 
                              onChange={e => setEditingProduct({...editingProduct, preOrderSold: parseInt(e.target.value) || 0})} 
                            />
                          </div>
                        </div>

                        {/* Kebijakan Pembayaran PO: Wajib Lunas vs Boleh DP 50% */}
                        <div>
                          <label style={{ ...S.label, marginBottom: 8 }}>Aturan Bayar *</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <label style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: 4, 
                              padding: '12px 14px', 
                              borderRadius: 14, 
                              border: editingProduct.preOrderDpAllowed === false ? '1.5px solid #10b981' : '1px solid var(--glass-border)', 
                              background: editingProduct.preOrderDpAllowed === false ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-bg)', 
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input 
                                  type="radio" 
                                  name="editPreOrderDpPolicy" 
                                  checked={editingProduct.preOrderDpAllowed === false} 
                                  onChange={() => setEditingProduct({ ...editingProduct, preOrderDpAllowed: false })} 
                                  style={{ accentColor: '#10b981', width: 16, height: 16 }} 
                                />
                                <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <CheckCircle2 size={14} color="#10b981" /> Lunas 100%
                                </span>
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', paddingLeft: 24 }}>
                                Bayar saat checkout
                              </span>
                            </label>

                            <label style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: 4, 
                              padding: '12px 14px', 
                              borderRadius: 14, 
                              border: editingProduct.preOrderDpAllowed !== false ? '1.5px solid #f59e0b' : '1px solid var(--glass-border)', 
                              background: editingProduct.preOrderDpAllowed !== false ? 'rgba(245, 158, 11, 0.12)' : 'var(--cms-bg)', 
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input 
                                  type="radio" 
                                  name="editPreOrderDpPolicy" 
                                  checked={editingProduct.preOrderDpAllowed !== false} 
                                  onChange={() => setEditingProduct({ ...editingProduct, preOrderDpAllowed: true })} 
                                  style={{ accentColor: '#f59e0b', width: 16, height: 16 }} 
                                />
                                <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <Clock size={14} color="#f59e0b" /> DP 50%
                                </span>
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', paddingLeft: 24 }}>
                                Sisa saat siap kirim
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. ATURAN APLIKASI WEB-BASE */}
                {editingProduct.type === 'Aplikasi' && (
                  <div style={{ 
                    marginBottom: 20, 
                    padding: 18, 
                    borderRadius: 18, 
                    background: 'rgba(168, 85, 247, 0.05)', 
                    border: '1.5px solid rgba(168, 85, 247, 0.35)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Globe size={18} color="#a855f7" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                          Aplikasi (Web-Based)
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: 10.5, 
                        padding: '3px 10px', 
                        borderRadius: 100, 
                        background: 'rgba(168, 85, 247, 0.15)', 
                        color: '#a855f7', 
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Zap size={12} /> SaaS & Web App
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label style={S.label}>URL Live Demo (Preview Interaktif Publik)</label>
                        <input 
                          style={S.input} 
                          placeholder="https://demo.sumr.day/... atau https://app-preview.com" 
                          value={editingProduct.liveDemoUrl || ''} 
                          onChange={e => setEditingProduct({...editingProduct, liveDemoUrl: e.target.value})} 
                        />
                        <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                          Tombol "Coba Live Demo" akan otomatis tampil di kartu katalog & modal rincian produk.
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={S.label}>Tech Stack / Fitur</label>
                          <input 
                            style={S.input} 
                            placeholder="Contoh: React, Next.js, Firebase, Tailwind" 
                            value={editingProduct.techStack || ''} 
                            onChange={e => setEditingProduct({...editingProduct, techStack: e.target.value})} 
                          />
                        </div>
                        <div>
                          <label style={S.label}>Tipe Lisensi / Akses</label>
                          <GlassSelect 
                            value={editingProduct.accessModel || 'lifetime'} 
                            onChange={e => setEditingProduct({...editingProduct, accessModel: e.target.value})}
                            options={[
                              { value: 'lifetime', label: 'Lifetime License (Sekali Bayar)' },
                              { value: 'subscription', label: 'Langganan (Hosted Cloud)' },
                              { value: 'self_hosted', label: 'Self-Hosted (Source Code)' }
                            ]}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={S.label}>Tautan Akses / Repository Aplikasi</label>
                        <input 
                          style={S.input} 
                          placeholder="https://github.com/... atau URL instance aplikasi" 
                          value={editingProduct.appAccessUrl || ''} 
                          onChange={e => setEditingProduct({...editingProduct, appAccessUrl: e.target.value})} 
                        />
                      </div>

                      <div>
                        <label style={S.label}>Instruksi Login / Kunci Lisensi (Hanya Terlihat Saat Lunas)</label>
                        <textarea 
                          style={{ ...S.input, height: 75, paddingTop: 10, resize: 'vertical', fontSize: 12 }} 
                          placeholder="Kredensial login, token API, atau petunjuk aktivasi akun klien..." 
                          value={editingProduct.instantDeliveryMessage || ''} 
                          onChange={e => setEditingProduct({...editingProduct, instantDeliveryMessage: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={S.label}>
                      Harga Jual 
                      <Info size={14} style={S.infoIcon} title="Harga aktual yang dibayar pelanggan" />
                    </label>
                    <CurrencyInput value={editingProduct.price} onChange={val => setEditingProduct({...editingProduct, price: val})} />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={S.label}>
                      Harga Coret 
                      <Info size={14} style={S.infoIcon} title="Harga asli sebelum diskon (opsional)" />
                    </label>
                    <CurrencyInput value={editingProduct.originalPrice} onChange={val => setEditingProduct({...editingProduct, originalPrice: val})} />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>Deskripsi Singkat</label>
                  <textarea style={{ ...S.input, height: 100, paddingTop: 12, resize: 'vertical' }} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>
                    Galeri Produk 
                    <Info size={14} style={S.infoIcon} title="Format 1:1 direkomendasikan" />
                  </label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {editingProduct.gallery?.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: 100, height: 100, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <img src={img} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                        <button onClick={() => {
                          const g = [...editingProduct.gallery]; g.splice(idx,1);
                          setEditingProduct({...editingProduct, gallery: g});
                        }} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <label title="Unggah Foto dari Komputer" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, (url) => setEditingProduct(prev => ({...prev, gallery: [...(prev.gallery || []), url]})))} disabled={isUploading} />
                        <Upload size={18} color={isUploading ? 'var(--cms-accent)' : 'var(--cms-text)'} />
                      </label>
                      <button type="button" title="Pilih dari Galeri Media" onClick={() => { setGalleryTarget('productGallery'); setIsGalleryOpen(true); }} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-accent)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                        <ImageIcon size={18} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 8 }}>Rekomendasi: 1080x1080px (1:1), Maks 2MB. Hindari placeholder.</div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={{...S.label, marginBottom:0}}>Varian Produk</label>
                    <button onClick={() => {
                      setEditingProduct({...editingProduct, variants: [...(editingProduct.variants || []), { id: genId('v'), name: '', price: 0 }]});
                    }} style={{ background: 'transparent', color: 'var(--cms-accent)', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <Plus size={14} /> Tambah
                    </button>
                  </div>
                  {(editingProduct.variants || []).map((v, idx) => (
                    <div key={v.id} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <input style={{...S.input, flex: 2}} placeholder="Nama Varian (mis: Paket Pro)" value={v.name} onChange={e => {
                        const arr = [...editingProduct.variants]; arr[idx].name = e.target.value;
                        setEditingProduct({...editingProduct, variants: arr});
                      }} />
                      <div style={{ flex: 1 }}>
                        <CurrencyInput 
                          placeholder="Harga (opsional)" 
                          value={v.price} 
                          onChange={val => {
                            const arr = [...editingProduct.variants]; arr[idx].price = val;
                            setEditingProduct({...editingProduct, variants: arr});
                          }} 
                        />
                      </div>
                      <button onClick={() => {
                        const arr = [...editingProduct.variants]; arr.splice(idx, 1);
                        setEditingProduct({...editingProduct, variants: arr});
                      }} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Right Sidebar */}
            <div style={{ flex: '1 1 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div style={{ ...S.panel, padding: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px', color: 'var(--cms-text)' }}><Eye size={16} /> Publikasi</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'var(--cms-bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <input type="checkbox" checked={editingProduct.isPublished} onChange={e => setEditingProduct({...editingProduct, isPublished: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)', cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cms-text)' }}>Tayang Publik</span>
                </label>
              </div>

              <div style={{ ...S.panel, padding: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px', color: 'var(--cms-text)' }}><Settings2 size={16} /> SEO</h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Meta Title</label>
                  <input style={{...S.input, height: 36, fontSize: 12}} value={editingProduct.seoTitle || ''} onChange={e => setEditingProduct({...editingProduct, seoTitle: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Meta Description</label>
                  <textarea style={{...S.input, height: 60, fontSize: 12, paddingTop: 8, resize: 'none'}} value={editingProduct.seoDesc || ''} onChange={e => setEditingProduct({...editingProduct, seoDesc: e.target.value})} />
                </div>
              </div>

              <button onClick={handleSaveProduct} style={{ width: '100%', height: 48, borderRadius: 100, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: 'none' }}>
                <Save size={18} /> Simpan
              </button>
            </div>
          </div>
          </div>
        )}

        {/* Category Editor */}
        {editingCategory && (
          <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
            <div style={S.panel}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setEditingCategory(null)} style={{ width: 40, height: 40, borderRadius: 100, border: '1px solid var(--glass-border)', background: 'var(--cms-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} /></button>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{editingCategory.id ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px', maxWidth: 400 }}>
                <label style={S.label}>Cover Kategori (Opsional)</label>
                <div style={{ width: '100%', height: 200, background: '#e2e8f0', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative', marginBottom: 8 }}>
                  {editingCategory.image ? <img src={editingCategory.image} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <Store size={40} style={{ position: 'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', opacity:0.2 }} />}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label title="Unggah Cover dari Komputer" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, (url) => setEditingCategory(prev => ({...prev, image: url})))} disabled={isUploading} />
                    <Upload size={18} color={isUploading ? 'var(--cms-accent)' : 'var(--cms-text)'} />
                  </label>
                  <button type="button" title="Pilih dari Galeri Media" onClick={() => { setGalleryTarget('categoryImage'); setIsGalleryOpen(true); }} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-accent)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                    <ImageIcon size={18} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={S.label}>Nama Kategori</label>
                  <input style={S.input} value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="Contoh: Gadget" />
                </div>
                <div>
                  <label style={S.label}>Banner Kategori Khusus (Opsional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 120, height: 60, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                      {editingCategory.bannerImage ? <img src={editingCategory.bannerImage} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <ImageIcon size={20} style={{ position: 'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', opacity:0.2 }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label title="Unggah Banner dari Komputer" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, (url) => setEditingCategory(prev => ({...prev, bannerImage: url})))} disabled={isUploading} />
                        <Upload size={18} color={isUploading ? 'var(--cms-accent)' : 'var(--cms-text)'} />
                      </label>
                      <button type="button" title="Pilih dari Galeri Media" onClick={() => { setGalleryTarget('categoryBanner'); setIsGalleryOpen(true); }} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-accent)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}>
                        <ImageIcon size={18} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>Muncul saat pembeli membuka layar penuh kategori ini.</div>
                </div>
                <div>
                  <label style={S.label}>Ukuran Card (Col Span)</label>
                  <GlassSelect 
                    value={editingCategory.colSpan || 1} 
                    onChange={e => setEditingCategory({...editingCategory, colSpan: parseInt(e.target.value)})}
                    options={[
                      { value: 1, label: 'Kecil (1 Kolom)' },
                      { value: 2, label: 'Lebar (2 Kolom)' },
                      { value: 3, label: 'Super Lebar (3 Kolom)' }
                    ]}
                  />
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>Berguna jika ingin gaya grid bento yang asimetris.</div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginTop: 16 }}>
                    <input type="checkbox" checked={editingCategory.isActive} onChange={e => setEditingCategory({...editingCategory, isActive: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)' }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Tampilkan di Beranda Kategori</span>
                  </label>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <button onClick={handleSaveCategory} style={{ width: '100%', height: 48, borderRadius: 100, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                    <Save size={18} /> Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Voucher Editor */}
        {editingVoucher && (
          <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
            <div style={S.panel}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setEditingVoucher(null)} style={{ width: 40, height: 40, borderRadius: 100, border: '1px solid var(--glass-border)', background: 'var(--cms-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={18} /></button>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{editingVoucher.id ? 'Edit Voucher' : 'Tambah Voucher'}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              <div>
                <label style={S.label}>Kode Voucher</label>
                <input style={{...S.input, textTransform: 'uppercase'}} value={editingVoucher.code} onChange={e => setEditingVoucher({...editingVoucher, code: e.target.value.toUpperCase()})} placeholder="Misal: DISKON50" />
              </div>

              <div>
                <label style={S.label}>Kuota (Opsional)</label>
                <input type="number" style={S.input} value={editingVoucher.quota || ''} onChange={e => setEditingVoucher({...editingVoucher, quota: Number(e.target.value)})} placeholder="Biarkan kosong jika tanpa batas" />
              </div>

              <div>
                <label style={S.label}>Tipe Diskon</label>
                <GlassSelect 
                  value={editingVoucher.discountType} 
                  onChange={e => setEditingVoucher({...editingVoucher, discountType: e.target.value})}
                  options={[
                    { value: 'percent', label: 'Persentase (%)' },
                    { value: 'fixed', label: 'Nominal Tetap (Rp)' }
                  ]}
                />
              </div>

              <div>
                <label style={S.label}>Nilai Diskon</label>
                {editingVoucher.discountType === 'percent' ? (
                  <input type="number" style={S.input} value={editingVoucher.discountValue} onChange={e => setEditingVoucher({...editingVoucher, discountValue: Number(e.target.value)})} placeholder="Misal: 10" />
                ) : (
                  <CurrencyInput value={editingVoucher.discountValue} onChange={val => setEditingVoucher({...editingVoucher, discountValue: val})} placeholder="Misal: 10000" />
                )}
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 20, borderTop: '1px solid var(--glass-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingVoucher.isActive} onChange={e => setEditingVoucher({...editingVoucher, isActive: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Aktifkan Voucher Ini</span>
                </label>
                
                <button onClick={handleSaveVoucher} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                  <Save size={18} /> Simpan
                </button>
              </div>
            </div>
            </div>
          </div>
        )}
        </div>

      <FlashSaleModal
        isOpen={isFlashSaleModalOpen}
        onClose={() => {
          setIsFlashSaleModalOpen(false);
          setFlashSaleTargetProduct(null);
        }}
        products={products}
        onSaveProducts={saveProducts}
        selectedProductIds={selectedProductIds}
        initialProductId={flashSaleTargetProduct?.id}
        notify={notify}
      />

      <MediaGalleryModal 
        isOpen={isGalleryOpen}
        onClose={() => { setIsGalleryOpen(false); setGalleryTarget(null); }}
        onSelect={(url) => {
          if (galleryTarget === 'heroBanner') {
            setShopSettings(prev => ({...prev, heroBannerImage: url}));
          } else if (galleryTarget === 'qrisImage') {
            setShopSettings(prev => ({...prev, qrisImageUrl: url}));
          } else if (galleryTarget === 'categoryImage') {
            setEditingCategory(prev => ({...prev, image: url}));
          } else if (galleryTarget === 'categoryBanner') {
            setEditingCategory(prev => ({...prev, bannerImage: url}));
          } else if (galleryTarget === 'productGallery') {
            setEditingProduct(prev => ({...prev, gallery: [...(prev.gallery || []), url]}));
          } else if (galleryTarget === 'digitalFile') {
            setEditingProduct(prev => ({...prev, downloadUrl: url}));
          }
          setIsGalleryOpen(false);
          setGalleryTarget(null);
        }}
      />
      </div>
    </div>
  );
}
