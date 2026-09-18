import React, { useState, useEffect, useRef } from 'react';
import MediaGalleryModal from './MediaGalleryModal';
import { 
  Store, Plus, Search, Image as ImageIcon, Trash2, 
  Save, Eye, Info, Package, Tag, Settings2, Upload, 
  ArrowLeft, Edit3, X, Cloud, Link, Copy, CheckCircle2, Check, Receipt, BadgePercent
} from 'lucide-react';
import GlassSelect from './GlassSelect';
import { useContextMenu } from './ContextMenuProvider';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { notifyCatalog } from '../../utils/notifications';

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

export default function CatalogManager({ notify, confirm }) {
  const { bindContextMenu, openContextMenu } = useContextMenu();
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
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
    fileFormat: 'ZIP', fileSize: '', instantDeliveryMessage: '', isDigitalAsset: false
  };

  const INITIAL_CATEGORY = { id: '', name: '', image: '', bannerImage: '', colSpan: 1, isActive: true };
  const INITIAL_VOUCHER = { id: '', code: '', discountType: 'percent', discountValue: 0, quota: 0, isActive: true };

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'banners' | 'vouchers' | 'settings'
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    notify('Kategori disimpan');
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
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cms-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Store size={28} /> Store Drop
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
                  <button onClick={() => setEditingProduct(INITIAL_PRODUCT)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--cms-accent)', color: '#fff', border: 'none', padding: '0 16px', borderRadius: 100, fontWeight: 700, cursor: 'pointer', height: 44 }}>
                    <Plus size={18} /> Tambah
                  </button>
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

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                    <div 
                      key={p.id} 
                      {...bindContextMenu(() => ({
                        title: p.name || 'Produk Katalog',
                        subtitle: `${formatRp(p.price)} · ${p.isPublished !== false ? 'Aktif' : 'Draft'}`,
                        headerBadge: p.isPublished !== false ? 'PRODUK' : 'DRAFT',
                        items: [
                          {
                            label: 'Edit Produk',
                            icon: <Edit3 size={15} color="var(--cms-accent)" />,
                            action: () => setEditingProduct(p)
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
                              const updated = products.map(prod => prod.id === p.id ? { ...prod, isPublished: p.isPublished === false } : prod);
                              setProducts(updated);
                              await storage.setItem('porto_catalog_products', updated);
                              notify(p.isPublished !== false ? 'Produk dijadikan draft' : 'Produk diterbitkan', 'success');
                            }
                          },
                          {
                            label: 'Salin Info Produk',
                            icon: <Copy size={15} />,
                            action: () => {
                              navigator.clipboard?.writeText(`${p.name} - ${formatRp(p.price)}`);
                              notify('Info produk disalin');
                            }
                          },
                          { separator: true },
                          {
                            label: 'Hapus Produk',
                            icon: <Trash2 size={15} />,
                            danger: true,
                            action: () => handleDeleteProduct(p.id)
                          }
                        ]
                      }))}
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
                        {p.gallery?.[0] ? <img src={p.gallery[0]} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <ImageIcon size={40} style={{ position: 'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', opacity:0.2 }} />}
                        {p.rateCardId && (
                          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(16, 185, 129, 0.9)', backdropFilter: 'blur(8px)', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
                            <Receipt size={11} /> Rate Card
                          </div>
                        )}
                        {!p.isPublished && <div style={{position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.6)', color:'#fff', padding:'4px 8px', borderRadius:4, fontSize:10, fontWeight:700}}>DRAFT</div>}
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <div>
                            {p.originalPrice > p.price && <div style={{ fontSize: 11, textDecoration: 'line-through', color: '#ef4444' }}>{formatRp(p.originalPrice)}</div>}
                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-accent)' }}>{formatRp(p.price)}</div>
                            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>Stok: {p.stock !== undefined ? p.stock : '∞'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                              type="button"
                              aria-label={`Buat transaksi untuk ${p.name}`}
                              title="Buat Transaksi / Invoice untuk produk ini" 
                              onClick={() => handleCreateTransactionForProduct(p)} 
                              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                            >
                              <Receipt size={16} />
                            </button>
                            <button 
                              type="button"
                              aria-label={`Edit produk ${p.name}`}
                              title="Edit produk"
                              onClick={() => setEditingProduct(p)} 
                              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--cms-input-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text)' }}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              type="button"
                              aria-label={`Hapus produk ${p.name}`}
                              title="Hapus produk"
                              onClick={() => handleDeleteProduct(p.id)} 
                              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
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
                  <button onClick={() => setEditingCategory(INITIAL_CATEGORY)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--cms-accent)', color: '#fff', border: 'none', padding: '0 16px', borderRadius: 100, fontWeight: 700, cursor: 'pointer', height: 44 }}>
                    <Plus size={18} /> Tambah
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
                  <button onClick={() => setEditingVoucher(INITIAL_VOUCHER)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--cms-accent)', color: '#fff', border: 'none', padding: '0 16px', borderRadius: 100, fontWeight: 700, cursor: 'pointer', height: 44 }}>
                    <Plus size={18} /> Tambah
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
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>⚡ Banner Flash Sale Timer (Pemicu Keputusan Beli)</h4>
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
                          placeholder="Cth: ⚡ FLASH SALE MERDEKA: Diskon Aset Digital Terbatas!" 
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
                    <label style={S.label}>Kategori</label>
                    <GlassSelect 
                      value={editingProduct.category} 
                      onChange={e => {
                        if (e.target.value === '__NEW__') {
                          const newCat = window.prompt('Masukkan kategori baru:');
                          if (newCat) setEditingProduct({...editingProduct, category: newCat});
                        } else {
                          setEditingProduct({...editingProduct, category: e.target.value});
                        }
                      }}
                      options={[
                        ...existingCategories.map(c => ({ value: c, label: c })),
                        ...((!existingCategories.includes(editingProduct.category) && editingProduct.category) ? [{ value: editingProduct.category, label: editingProduct.category }] : []),
                        { value: '__NEW__', label: '+ Tambah Kategori Baru' }
                      ]}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={S.label}>Tipe Produk</label>
                    <GlassSelect 
                      value={editingProduct.type} 
                      onChange={e => setEditingProduct({...editingProduct, type: e.target.value})}
                      options={[
                        { value: 'Fisik', label: 'Fisik' },
                        { value: 'Digital', label: 'Digital' },
                        { value: 'Jasa', label: 'Jasa' }
                      ]}
                    />
                  </div>
                </div>

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
                <h3 style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px', color: 'var(--cms-text)' }}><Eye size={16} /> Status Publikasi</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'var(--cms-bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <input type="checkbox" checked={editingProduct.isPublished} onChange={e => setEditingProduct({...editingProduct, isPublished: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)', cursor: 'pointer' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cms-text)' }}>Tayangkan di Katalog</span>
                </label>
              </div>

              {/* Pengaturan Aset Digital & Instant Delivery */}
              <div style={{ ...S.panel, padding: 24, border: (editingProduct.type === 'Digital' || editingProduct.isDigitalAsset) ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--cms-text)' }}>
                    <Package size={16} color="var(--cms-accent)" /> Aset Digital & Instant Delivery
                  </h3>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', fontWeight: 800 }}>
                    PASIF INCOME
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'var(--cms-bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--glass-border)', marginBottom: 16 }}>
                  <input 
                    type="checkbox" 
                    checked={editingProduct.type === 'Digital' || !!editingProduct.isDigitalAsset} 
                    onChange={e => setEditingProduct({
                      ...editingProduct, 
                      isDigitalAsset: e.target.checked,
                      type: e.target.checked ? 'Digital' : editingProduct.type
                    })} 
                    style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)', cursor: 'pointer' }} 
                  />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', display: 'block' }}>Kirim File Instan Setelah Lunas</span>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>Pembeli langsung dapat tombol unduh di portal /akun saat lunas</span>
                  </div>
                </label>

                {(editingProduct.type === 'Digital' || editingProduct.isDigitalAsset) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={S.label}>Tautan File / Google Drive / URL Unduhan *</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          style={{...S.input, flex: 1}} 
                          placeholder="https://drive.google.com/... atau link file" 
                          value={editingProduct.downloadUrl || ''} 
                          onChange={e => setEditingProduct({...editingProduct, downloadUrl: e.target.value})} 
                        />
                        <button 
                          type="button" 
                          onClick={() => { setGalleryTarget('digitalFile'); setIsGalleryOpen(true); }} 
                          style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--cms-accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: '0.15s' }}
                          title="Pilih file dari galeri media"
                        >
                          <ImageIcon size={18} />
                        </button>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                        Bisa tautan Google Drive publik, Cloudinary, Dropbox, Notion, atau link Canva template.
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={S.label}>Format Berkas</label>
                        <GlassSelect 
                          value={editingProduct.fileFormat || 'ZIP'} 
                          onChange={e => setEditingProduct({...editingProduct, fileFormat: e.target.value})}
                          options={[
                            { value: 'ZIP', label: 'ZIP / RAR Archive' },
                            { value: 'PDF', label: 'E-Book / PDF' },
                            { value: 'CANVA', label: 'Template Canva' },
                            { value: 'JSON', label: 'JSON / Preset / Web' },
                            { value: 'AUDIO', label: 'Audio MP3 / WAV' },
                            { value: 'VIDEO', label: 'Video MP4' },
                            { value: 'LINK', label: 'Akses Portal / Web' }
                          ]}
                        />
                      </div>
                      <div>
                        <label style={S.label}>Ukuran / Keterangan</label>
                        <input 
                          style={S.input} 
                          placeholder="Misal: 45 MB / 10 Halaman" 
                          value={editingProduct.fileSize || ''} 
                          onChange={e => setEditingProduct({...editingProduct, fileSize: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div>
                      <label style={S.label}>Instruksi Rahasia / Password ZIP / Kunci Lisensi</label>
                      <textarea 
                        style={{ ...S.input, height: 75, paddingTop: 10, resize: 'vertical', fontSize: 12 }} 
                        placeholder="Instruksi ini HANYA TERLIHAT oleh pembeli setelah status transaksi LUNAS di portal /akun..." 
                        value={editingProduct.instantDeliveryMessage || ''} 
                        onChange={e => setEditingProduct({...editingProduct, instantDeliveryMessage: e.target.value})} 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ ...S.panel, padding: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px', color: 'var(--cms-text)' }}><Settings2 size={16} /> Pengaturan SEO</h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Meta Title</label>
                  <input style={{...S.input, height: 36, fontSize: 12}} value={editingProduct.seoTitle || ''} onChange={e => setEditingProduct({...editingProduct, seoTitle: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Meta Description</label>
                  <textarea style={{...S.input, height: 60, fontSize: 12, paddingTop: 8, resize: 'none'}} value={editingProduct.seoDesc || ''} onChange={e => setEditingProduct({...editingProduct, seoDesc: e.target.value})} />
                </div>
              </div>

              <button onClick={handleSaveProduct} style={{ width: '100%', height: 48, borderRadius: 100, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 8px 16px rgba(var(--cms-accent-rgb), 0.3)' }}>
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
